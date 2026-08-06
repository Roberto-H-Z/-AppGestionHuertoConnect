/**
 * HomeScreen — Main screen of the app.
 * Shows greeting header, empty state or list of HuertoCards,
 * and a FAB to add more huertos.
 * Fetches real-time weather from Open-Meteo API.
 * Data is loaded from the production API:
 *   GET /huertos, GET /regiones, GET /cultivos, GET /cultivos/siembras/{id}
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    Huerto,
    HuertoCreate,
    Region,
    Cultivo,
    Siembra,
    SiembraCreate,
    HuertoConDetalles,
    SiembraConCultivo,
    RegionCreate,
    CultivoCreate,
} from '../types/cropTypes';
import { huertoService } from '../services/huertoService';
import { AppScreenHeader, EmptyState, HuertoCard, AddHuertoModal, WeatherModal, NotificationsModal } from '../components';
import { WeatherData, fetchWeatherByLocation } from '../services/weatherService';
import { useAuth } from '../../auth/services/AuthContext';
import { palette, radii, shadows } from '../theme';

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();

    // ── Data state ──
    const [huertosConDetalles, setHuertosConDetalles] = useState<HuertoConDetalles[]>([]);
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [cultivos, setCultivos] = useState<Cultivo[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Weather state
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherModalVisible, setWeatherModalVisible] = useState(false);

    // Notifications modal state
    const [notificationsVisible, setNotificationsVisible] = useState(false);

    // User profile state
    const [userName, setUserName] = useState('Agricultor');

    // ── Load data on mount ──
    useEffect(() => {
        loadAllData();
        loadWeather();
    }, []);

    // Get display name from auth context
    useEffect(() => {
        if (user?.nombre) {
            setUserName(user.nombre);
        }
    }, [user]);

    const loadAllData = useCallback(async () => {
        try {
            // Load regiones, cultivos and huertos in parallel
            const [regionesData, cultivosData, huertosData] = await Promise.all([
                huertoService.getRegiones().catch(() => []),
                huertoService.getCultivos().catch(() => []),
                huertoService.getHuertos().catch(() => []),
            ]);

            setRegiones(regionesData);
            setCultivos(cultivosData);

            if (huertosData.length === 0) {
                setHuertosConDetalles([]);
                return;
            }

            // For each huerto, load its siembras
            const enriched: HuertoConDetalles[] = await Promise.all(
                huertosData.map(async (huerto) => {
                    let siembrasRaw: Siembra[] = [];
                    try {
                        siembrasRaw = await huertoService.getSiembras(huerto.id);
                    } catch {
                        // Huerto might have no siembras yet
                    }

                    // Enrich siembras with their cultivo data
                    const siembras: SiembraConCultivo[] = siembrasRaw.map((s) => ({
                        ...s,
                        cultivo: cultivosData.find((c) => c.id === s.cultivo_id),
                    }));

                    return {
                        huerto,
                        region: regionesData.find((r) => r.id === huerto.region_id),
                        siembras,
                    };
                })
            );

            setHuertosConDetalles(enriched);
        } catch (error) {
            console.warn('[HomeScreen] loadAllData failed:', error);
            setRegiones([]);
            setCultivos([]);
            setHuertosConDetalles([]);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadAllData();
        setIsRefreshing(false);
    }, [loadAllData]);

    const loadWeather = async () => {
        try {
            setWeatherLoading(true);
            const data = await fetchWeatherByLocation();
            setWeatherData(data);
        } catch (error) {
            console.warn('Weather fetch failed:', error);
        } finally {
            setWeatherLoading(false);
        }
    };

    const weatherText = weatherData
        ? `${weatherData.current.temperature}°C - ${weatherData.current.condition}`
        : '-- °C';

    // ── Create Huerto + optional Siembra ──
    const handleSaveHuerto = useCallback(async (
        huertoData: HuertoCreate,
        siembraData?: { cultivoId: string; fechaSiembra?: string },
        newRegion?: RegionCreate,
        newCultivo?: CultivoCreate,
    ) => {
        try {
            // 1. Create new region if needed
            let regionId = huertoData.region_id;
            if (newRegion) {
                const createdRegion = await huertoService.createRegion(newRegion);
                regionId = createdRegion.id;
                huertoData.region_id = regionId;
            }

            // 2. Create the huerto
            const createdHuerto = await huertoService.createHuerto(huertoData);

            // 3. Create new cultivo if needed, then create siembra
            if (siembraData) {
                let cultivoId = siembraData.cultivoId;

                if (newCultivo) {
                    const createdCultivo = await huertoService.createCultivo(newCultivo);
                    cultivoId = createdCultivo.id;
                }

                const siembraPayload: SiembraCreate = {
                    huerto_id: createdHuerto.id,
                    cultivo_id: cultivoId,
                    fecha_siembra: siembraData.fechaSiembra || new Date().toISOString().split('T')[0],
                    estado: 'Activo',
                };
                await huertoService.createSiembra(siembraPayload);
            }

            // 4. Reload all data
            await loadAllData();
        } catch (error: any) {
            console.error('[HomeScreen] Error saving huerto:', error);
            Alert.alert(
                'Error',
                error?.message || 'No se pudo guardar el huerto. Revisa tu conexión e inténtalo de nuevo.'
            );
            throw error;
        }
    }, [loadAllData]);

    // ── Delete Huerto ──
    const handleDeleteHuerto = useCallback(async (huertoId: string) => {
        const performDelete = async () => {
            try {
                await huertoService.deleteHuerto(huertoId);
                await loadAllData();
            } catch (error: any) {
                Alert.alert('Error', error?.message || 'No se pudo eliminar el huerto.');
            }
        };

        if (Platform.OS === 'web') {
            const confirm = window.confirm('¿Estás seguro de que deseas eliminar este huerto? Esta acción no se puede deshacer.');
            if (confirm) {
                await performDelete();
            }
        } else {
            Alert.alert(
                'Eliminar Huerto',
                '¿Estás seguro de que deseas eliminar este huerto? Esta acción no se puede deshacer.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: performDelete,
                    },
                ]
            );
        }
    }, [loadAllData]);

    const handleWeatherPress = useCallback(() => {
        setWeatherModalVisible(true);
        if (!weatherLoading) {
            loadWeather();
        }
    }, [weatherLoading]);

    const handleSpecsPress = useCallback((cultivoNombre: string) => {
        navigation.navigate('PlantSpecs', {
            cropName: cultivoNombre,
            scientificName: cultivoNombre,
            cropIcon: 'sprout',
        });
    }, [navigation]);

    const hasHuertos = huertosConDetalles.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <AppScreenHeader
                eyebrow="Tu huerto hoy"
                title={`Hola, ${userName}`}
                subtitle="Revisa el estado de tus cultivos y próximas acciones."
                icon="leaf"
                actions={[{
                    icon: 'bell-outline',
                    label: 'Ver notificaciones',
                    onPress: () => setNotificationsVisible(true),
                }]}
            />

            {/* Content */}
            {hasHuertos ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={['#059669']}
                            tintColor="#059669"
                        />
                    }
                >
                    <TouchableOpacity
                        style={styles.overviewCard}
                        activeOpacity={0.85}
                        onPress={handleWeatherPress}
                        accessibilityRole="button"
                        accessibilityLabel="Ver detalle del clima"
                    >
                        <View style={styles.overviewTop}>
                            <View>
                                <Text style={styles.overviewEyebrow}>Resumen de hoy</Text>
                                <Text style={styles.overviewTitle}>
                                    {huertosConDetalles.length} {huertosConDetalles.length === 1 ? 'huerto activo' : 'huertos activos'}
                                </Text>
                            </View>
                            <View style={styles.weatherBadge}>
                                <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color={palette.amber} />
                                <Text style={styles.weatherBadgeText}>{weatherText}</Text>
                            </View>
                        </View>
                        <View style={styles.overviewDivider} />
                        <View style={styles.overviewFooter}>
                            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={palette.primary} />
                            <Text style={styles.overviewHint}>Consulta el clima antes de regar o aplicar tratamientos.</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={palette.sage} />
                        </View>
                    </TouchableOpacity>

                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mis Huertos</Text>
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="plus" size={16} color="#059669" />
                            <Text style={styles.addMoreText}>Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Huerto cards */}
                    {huertosConDetalles.map((item, index) => (
                        <HuertoCard
                            key={item.huerto.id}
                            data={item}
                            defaultExpanded={huertosConDetalles.length === 1 || index === 0}
                            onWeatherPress={handleWeatherPress}
                            onSpecsPress={handleSpecsPress}
                            onDeletePress={handleDeleteHuerto}
                            weatherText={weatherText}
                        />
                    ))}

                    {/* Bottom spacer for tab bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            ) : (
                <EmptyState onAddHuerto={() => setModalVisible(true)} />
            )}

            {/* FAB - only when huertos exist */}
            {hasHuertos && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.85}
                >
                    <MaterialCommunityIcons name="plus" size={26} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Add Huerto Modal */}
            <AddHuertoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveHuerto}
                regiones={regiones}
                cultivos={cultivos}
            />

            {/* Weather Detail Modal */}
            <WeatherModal
                visible={weatherModalVisible}
                onClose={() => setWeatherModalVisible(false)}
                weather={weatherData}
                loading={weatherLoading}
            />

            {/* Notifications Modal */}
            <NotificationsModal
                visible={notificationsVisible}
                onClose={() => setNotificationsVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.canvas,
    },
    // ── Content ──────────────────────────────────────────────────────────
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 4,
        paddingHorizontal: 14,
    },
    overviewCard: {
        marginBottom: 20,
        padding: 18,
        borderRadius: radii.large,
        backgroundColor: palette.forest,
        ...shadows.card,
    },
    overviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    overviewEyebrow: { color: '#AFC9B7', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    overviewTitle: { marginTop: 5, color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    weatherBadge: {
        maxWidth: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    weatherBadgeText: { flexShrink: 1, color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
    overviewDivider: { height: 1, marginVertical: 15, backgroundColor: 'rgba(255,255,255,0.12)' },
    overviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    overviewHint: { flex: 1, color: '#D7E4DB', fontSize: 12.5, lineHeight: 18 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: palette.ink,
        letterSpacing: -0.3,
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 4,
        borderWidth: 1,
        borderColor: palette.border,
    },
    addMoreText: {
        fontSize: 13,
        color: palette.primary,
        fontWeight: '600',
    },
    // ── FAB ──────────────────────────────────────────────────────────────
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
});

export default HomeScreen;
