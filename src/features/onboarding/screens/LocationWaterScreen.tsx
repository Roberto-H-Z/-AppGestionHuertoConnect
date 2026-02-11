import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../shared/components/ui';

const { height: screenHeight } = Dimensions.get('window');

type WaterAccessType = 'constant' | 'scheduled' | 'seasonal' | null;

export const LocationWaterScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    // Location state
    const [locationText, setLocationText] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationObtained, setLocationObtained] = useState(false);

    // Water access state
    const [selectedWater, setSelectedWater] = useState<WaterAccessType>(null);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const contentSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            setLocationText('');
            setLocationObtained(false);
            setSelectedWater(null);
            setIsLoadingLocation(false);
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            contentSlide.setValue(50);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(contentSlide, {
                    toValue: 0,
                    duration: 1000,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [fadeAnim, slideAnim, contentSlide])
    );

    const isValid = locationObtained && selectedWater !== null;

    // Obtener ubicación GPS
    const handleGetLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso denegado',
                    'Necesitamos acceso a tu ubicación para esta función. Puedes ingresarla manualmente.',
                    [{ text: 'OK' }]
                );
                setIsLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Reverse geocoding
            const [address] = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (address) {
                const parts = [
                    address.street,
                    address.city,
                    address.region,
                    address.country,
                ].filter(Boolean);
                setLocationText(parts.join(', '));
            } else {
                setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
            setLocationObtained(true);
        } catch (error) {
            Alert.alert(
                'Error',
                'No se pudo obtener la ubicación. Ingresa tu ubicación manualmente.',
                [{ text: 'OK' }]
            );
        }
        setIsLoadingLocation(false);
    };

    // Cambiar ubicación manualmente
    const handleManualLocation = (text: string) => {
        setLocationText(text);
        setLocationObtained(text.trim().length > 0);
    };

    const handleFinish = () => {
        navigation?.navigate('Main');

    };

    const waterOptions: { type: WaterAccessType; icon: string; label: string; description: string }[] = [
        { type: 'constant', icon: 'water', label: 'Flujo Constante', description: 'Acceso a agua corriente ilimitado.' },
        { type: 'scheduled', icon: 'clock-time-four-outline', label: 'Riego por Tandeo', description: 'Acceso programado o por días.' },
        { type: 'seasonal', icon: 'weather-rainy', label: 'Dependiente de Temporal', description: 'Mi riego principal es la lluvia.' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Botón de retroceso */}
                <Animated.View
                    style={[
                        styles.backButtonContainer,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation?.goBack()}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color="#1B5E20"
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* Título */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Ubicación y acceso al agua</Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: contentSlide }],
                        },
                    ]}
                >
                    {/* --- Sección Ubicación --- */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <MaterialCommunityIcons
                                    name="map-marker"
                                    size={20}
                                    color="#ed0000ff"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>Ubicación del huerto</Text>
                        </View>

                        {/* Botón GPS */}
                        <TouchableOpacity
                            style={styles.gpsButton}
                            onPress={handleGetLocation}
                            disabled={isLoadingLocation}
                            activeOpacity={0.8}
                        >
                            {isLoadingLocation ? (
                                <ActivityIndicator size="small" color="#4CAF50" />
                            ) : (
                                <MaterialCommunityIcons
                                    name="crosshairs-gps"
                                    size={22}
                                    color="#4CAF50"
                                />
                            )}
                            <Text style={styles.gpsButtonText}>
                                {isLoadingLocation
                                    ? 'Obteniendo ubicación...'
                                    : 'Usar mi ubicación actual'}
                            </Text>
                        </TouchableOpacity>

                        {/* Separador */}
                        <View style={styles.separator}>
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>o ingresa manualmente</Text>
                            <View style={styles.separatorLine} />
                        </View>

                        {/* Input manual */}
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={20}
                                color="#66BB6A"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.locationInput, { outlineStyle: 'none' } as any]}
                                value={locationText}
                                onChangeText={handleManualLocation}
                                placeholder="Ej: Col. Centro, Cosamaloapan, Ver."
                                placeholderTextColor="#A5D6A7"
                            />
                        </View>

                        {locationObtained && (
                            <View style={styles.checkRow}>
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={18}
                                    color="#4CAF50"
                                />
                                <Text style={styles.checkText}>Ubicación registrada</Text>
                            </View>
                        )}
                    </View>

                    {/* --- Sección Acceso al agua --- */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <MaterialCommunityIcons
                                    name="water"
                                    size={20}
                                    color="#117cffff"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>Acceso al agua</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            ¿Cómo obtienes agua para tu huerto?
                        </Text>

                        {waterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.type}
                                style={[
                                    styles.waterCard,
                                    selectedWater === option.type && styles.waterCardSelected,
                                ]}
                                onPress={() => setSelectedWater(option.type)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.waterIconContainer,
                                        selectedWater === option.type && styles.waterIconSelected,
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={option.icon as any}
                                        size={24}
                                        color={selectedWater === option.type ? '#fff' : '#4CAF50'}
                                    />
                                </View>
                                <View style={styles.waterTextContainer}>
                                    <Text
                                        style={[
                                            styles.waterLabel,
                                            selectedWater === option.type && styles.waterLabelSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    <Text style={styles.waterDescription}>
                                        {option.description}
                                    </Text>
                                </View>
                                {selectedWater === option.type && (
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={22}
                                        color="#4CAF50"
                                        style={styles.waterCheck}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Botón finalizar */}
                <Animated.View
                    style={[
                        styles.buttonContainer,
                        { opacity: fadeAnim },
                    ]}
                >
                    <Button
                        title="Finalizar Configuración"
                        onPress={handleFinish}
                        disabled={!isValid}
                        style={styles.finishButton}
                    />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: screenHeight * 0.06,
        paddingBottom: 40,
    },
    backButtonContainer: {
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1B5E20',
        lineHeight: 32,
    },
    contentContainer: {
        marginBottom: 24,
    },

    // Secciones
    section: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    // Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#66BB6A',
        marginBottom: 16,
    },

    // GPS
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        borderStyle: 'dashed',
        gap: 10,
    },
    gpsButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2E7D32',
    },

    // Separador
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#C8E6C9',
    },
    separatorText: {
        color: '#A5D6A7',
        fontSize: 12,
        paddingHorizontal: 12,
    },

    // Input ubicación
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        borderRadius: 12,
        backgroundColor: '#FAFFF5',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    locationInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#2E7D32',
    },

    // Check
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    checkText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },

    // Water cards
    waterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFFF5',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    waterCardSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#f1f8f4',
    },
    waterIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    waterIconSelected: {
        backgroundColor: '#4CAF50',
    },
    waterTextContainer: {
        flex: 1,
    },
    waterLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 2,
    },
    waterDescription: {
        fontSize: 13,
        color: '#66BB6A',
    },
    waterLabelSelected: {
        color: '#2E7D32',
    },
    waterCheck: {
        marginLeft: 8,
    },

    // Botón
    buttonContainer: {
        marginTop: 'auto',
    },
    finishButton: {
        width: '100%',
    },
});

export default LocationWaterScreen;
