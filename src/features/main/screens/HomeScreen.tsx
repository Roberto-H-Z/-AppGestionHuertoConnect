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
import { EmptyState, HuertoCard, AddHuertoModal, WeatherModal, NotificationsModal } from '../components';
import { WeatherData, fetchWeatherByLocation } from '../services/weatherService';
import { useAuth } from '../../auth/services/AuthContext';

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

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.userName}>{userName}</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    activeOpacity={0.7}
                    onPress={() => setNotificationsVisible(true)}
                >
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#1B5E20" />
                </TouchableOpacity>
            </View>

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
                            colors={['#4CAF50']}
                            tintColor="#4CAF50"
                        />
                    }
                >
                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mis Huertos</Text>
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="plus" size={18} color="#4CAF50" />
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
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={28} color="#fff" />
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
        backgroundColor: '#F1F8E9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'web' ? 20 : 10,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 16,
        color: '#66BB6A',
        fontWeight: '500',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1B5E20',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    addMoreText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default HomeScreen;
