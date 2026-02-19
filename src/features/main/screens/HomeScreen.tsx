/**
 * HomeScreen - Main screen of the app.
 * Shows greeting header, empty state or list of crop cards,
 * and a FAB to add more crops. Uses local state (no API).
 * Includes WateringModal and WeatherModal.
 * Fetches real-time weather from Open-Meteo API.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Crop, GardenArea, WateringSchedule, CropTask } from '../types/cropTypes';
import { defaultGardenAreas, wateringFrequencyOptions } from '../data/cropData';
import { EmptyState, CropCard, AddCropModal, WateringModal, WeatherModal, TasksModal, NotificationsModal } from '../components';
import { WeatherData, fetchWeatherByLocation } from '../services/weatherService';

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    // Crop & area state (local, no API)
    const [crops, setCrops] = useState<Crop[]>([]);
    const [gardenAreas, setGardenAreas] = useState<GardenArea[]>(defaultGardenAreas);
    const [modalVisible, setModalVisible] = useState(false);

    // Watering modal state
    const [wateringModalVisible, setWateringModalVisible] = useState(false);
    const [selectedCropForWatering, setSelectedCropForWatering] = useState<Crop | null>(null);

    // Weather state
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherModalVisible, setWeatherModalVisible] = useState(false);

    const [tasksModalVisible, setTasksModalVisible] = useState(false);
    const [selectedCropForTasks, setSelectedCropForTasks] = useState<Crop | null>(null);

    // Notifications modal state
    const [notificationsVisible, setNotificationsVisible] = useState(false);

    // Fetch weather on mount
    useEffect(() => {
        loadWeather();
    }, []);

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

    const handleSaveCrop = useCallback((crop: Crop, newArea?: GardenArea) => {
        if (newArea) {
            setGardenAreas((prev) => [...prev, newArea]);
        }
        setCrops((prev) => [...prev, crop]);
        setModalVisible(false);
    }, []);

    const handleWateringPress = useCallback((crop: Crop) => {
        setSelectedCropForWatering(crop);
        setWateringModalVisible(true);
    }, []);

    const handleWateringSave = useCallback((cropId: string, watering: WateringSchedule) => {
        setCrops((prev) =>
            prev.map((c) => {
                if (c.id !== cropId) return c;

                const date = new Date(watering.nextDate + 'T12:00:00');
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const freqLabel = wateringFrequencyOptions.find(
                    (o) => o.days === watering.frequency
                )?.label || `Cada ${watering.frequency} días`;

                return {
                    ...c,
                    watering,
                    nextWatering: `${day}/${month}/${year} (${freqLabel})`,
                };
            })
        );
    }, []);

    const handleWeatherPress = useCallback(() => {
        setWeatherModalVisible(true);
        // Refresh weather data when opening
        if (!weatherLoading) {
            loadWeather();
        }
    }, [weatherLoading]);

    const handleTasksPress = useCallback((crop: Crop) => {
        setSelectedCropForTasks(crop);
        setTasksModalVisible(true);
    }, []);

    const handleSpecsPress = useCallback((crop: Crop) => {
        navigation.navigate('PlantSpecs', {
            cropName: crop.name,
            scientificName: crop.description || 'Solanum lycopersicum',
            cropIcon: 'sprout',
        });
    }, [navigation]);

    const handleTasksSave = useCallback((cropId: string, tasks: CropTask[]) => {
        setCrops((prev) =>
            prev.map((c) => (c.id === cropId ? { ...c, tasks } : c))
        );
    }, []);

    const getGardenArea = useCallback(
        (areaId: string) => gardenAreas.find((a) => a.id === areaId),
        [gardenAreas]
    );

    const hasCrops = crops.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.userName}>Agricultor</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    activeOpacity={0.7}
                    onPress={() => setNotificationsVisible(true)}
                >
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#1B5E20" />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {hasCrops ? (
                <>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Section header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Mis Cultivos</Text>
                            <TouchableOpacity
                                style={styles.addMoreButton}
                                onPress={() => setModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="plus" size={18} color="#4CAF50" />
                                <Text style={styles.addMoreText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Crop cards */}
                        {crops.map((crop, index) => (
                            <CropCard
                                key={crop.id}
                                crop={crop}
                                gardenArea={getGardenArea(crop.gardenAreaId)}
                                defaultExpanded={crops.length === 1 || index === 0}
                                onWateringPress={handleWateringPress}
                                onWeatherPress={handleWeatherPress}
                                onTasksPress={handleTasksPress}
                                onSpecsPress={handleSpecsPress}
                                weatherText={weatherText}
                            />
                        ))}

                        {/* Bottom spacer for tab bar */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </>
            ) : (
                <EmptyState onAddCrop={() => setModalVisible(true)} />
            )}

            {/* FAB - only when crops exist */}
            {hasCrops && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Add Crop Modal */}
            <AddCropModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveCrop}
                gardenAreas={gardenAreas}
            />

            {/* Watering Schedule Modal */}
            <WateringModal
                visible={wateringModalVisible}
                crop={selectedCropForWatering}
                onClose={() => setWateringModalVisible(false)}
                onSave={handleWateringSave}
            />

            {/* Weather Detail Modal */}
            <WeatherModal
                visible={weatherModalVisible}
                onClose={() => setWeatherModalVisible(false)}
                weather={weatherData}
                loading={weatherLoading}
            />

            {/* Tasks Modal */}
            <TasksModal
                visible={tasksModalVisible}
                crop={selectedCropForTasks}
                onClose={() => setTasksModalVisible(false)}
                onSave={handleTasksSave}
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
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5722',
        borderWidth: 1.5,
        borderColor: '#fff',
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
