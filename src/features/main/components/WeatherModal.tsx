/**
 * WeatherModal - Bottom-sheet modal showing detailed weather information.
 * Displays: current temperature + condition, humidity, wind, precipitation,
 * UV index, and 7-day forecast. Data comes from Open-Meteo API.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../services/weatherService';

interface WeatherModalProps {
    visible: boolean;
    onClose: () => void;
    weather: WeatherData | null;
    loading?: boolean;
}

/** Info card for a single weather metric */
const MetricCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    iconColor?: string;
}> = ({ icon, label, value, iconColor = '#4CAF50' }) => (
    <View style={styles.metricCard}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
    </View>
);

/** Forecast row for a single day */
const ForecastRow: React.FC<{
    dayName: string;
    icon: string;
    tempMax: number;
    isToday?: boolean;
}> = ({ dayName, icon, tempMax, isToday }) => (
    <View style={[styles.forecastRow, isToday && styles.forecastRowToday]}>
        <Text style={[styles.forecastDay, isToday && styles.forecastDayToday]}>
            {isToday ? 'Hoy' : dayName}
        </Text>
        <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color="#FFA726"
            style={styles.forecastIcon}
        />
        <Text style={styles.forecastTemp}>{tempMax}°C</Text>
    </View>
);

export const WeatherModal: React.FC<WeatherModalProps> = ({
    visible,
    onClose,
    weather,
    loading = false,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons
                                name="weather-partly-cloudy"
                                size={22}
                                color="#FFA726"
                            />
                            <Text style={styles.title}>Clima Detallado</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="close" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={styles.loadingText}>
                                Obteniendo datos del clima...
                            </Text>
                        </View>
                    ) : weather ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Main temperature card */}
                            <View style={styles.tempCard}>
                                <MaterialCommunityIcons
                                    name={weather.current.icon as any}
                                    size={48}
                                    color="#FFA726"
                                />
                                <View style={styles.tempInfo}>
                                    <Text style={styles.tempText}>
                                        {weather.current.temperature}°C
                                    </Text>
                                    <Text style={styles.conditionText}>
                                        {weather.current.condition}
                                    </Text>
                                </View>
                            </View>

                            {/* Location & last updated */}
                            <View style={styles.locationRow}>
                                <MaterialCommunityIcons
                                    name="map-marker-outline"
                                    size={14}
                                    color="#9E9E9E"
                                />
                                <Text style={styles.locationText}>
                                    {weather.locationName} • Actualizado {weather.lastUpdated}
                                </Text>
                            </View>

                            {/* Metrics grid */}
                            <View style={styles.metricsGrid}>
                                <MetricCard
                                    icon="water-percent"
                                    label="Humedad"
                                    value={`${weather.current.humidity}%`}
                                    iconColor="#42A5F5"
                                />
                                <MetricCard
                                    icon="weather-windy"
                                    label="Viento"
                                    value={`${weather.current.windSpeed} km/h`}
                                    iconColor="#78909C"
                                />
                                <MetricCard
                                    icon="weather-rainy"
                                    label="Lluvia"
                                    value={`${weather.current.precipitation}%`}
                                    iconColor="#5C6BC0"
                                />
                                <MetricCard
                                    icon="white-balance-sunny"
                                    label="UV Index"
                                    value={weather.current.uvLabel}
                                    iconColor="#FFA726"
                                />
                            </View>

                            {/* 7-day forecast */}
                            <View style={styles.forecastCard}>
                                <Text style={styles.forecastTitle}>Pronóstico 7 días</Text>
                                {weather.forecast.map((day, index) => (
                                    <ForecastRow
                                        key={index}
                                        dayName={day.dayName}
                                        icon={day.icon}
                                        tempMax={day.tempMax}
                                        isToday={index === 0}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={styles.errorContainer}>
                            <MaterialCommunityIcons
                                name="weather-cloudy-alert"
                                size={48}
                                color="#BDBDBD"
                            />
                            <Text style={styles.errorText}>
                                No se pudo obtener el clima.{'\n'}Verifica tu conexión e intenta de nuevo.
                            </Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
                                <Text style={styles.retryText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },
    scrollContent: {
        paddingBottom: 10,
    },

    // Loading
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 14,
        fontSize: 14,
        color: '#9E9E9E',
        fontWeight: '500',
    },

    // Main temperature card
    tempCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: '#FFE082',
        marginBottom: 8,
    },
    tempInfo: {
        flex: 1,
    },
    tempText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1B5E20',
    },
    conditionText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: '500',
        marginTop: 2,
    },

    // Location
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 18,
        paddingHorizontal: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '500',
    },

    // Metrics grid
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    metricCard: {
        width: '47%',
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    metricLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 8,
        fontWeight: '500',
    },
    metricValue: {
        fontSize: 16,
        color: '#1B5E20',
        fontWeight: '700',
        marginTop: 2,
    },

    // Forecast
    forecastCard: {
        backgroundColor: '#F1F8E9',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    forecastTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 12,
    },
    forecastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    forecastRowToday: {
        backgroundColor: '#E8F5E9',
        marginHorizontal: -8,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderBottomWidth: 0,
    },
    forecastDay: {
        flex: 1,
        fontSize: 14,
        color: '#424242',
        fontWeight: '500',
    },
    forecastDayToday: {
        fontWeight: '700',
        color: '#1B5E20',
    },
    forecastIcon: {
        marginHorizontal: 12,
    },
    forecastTemp: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
        width: 50,
        textAlign: 'right',
    },

    // Error
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    errorText: {
        marginTop: 14,
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
    },
    retryText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
});

export default WeatherModal;
