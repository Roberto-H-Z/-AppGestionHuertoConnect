/**
 * CropCard - Collapsible card displaying crop information.
 * Shows a compact view (image + name + day progress), expandable
 * to show harvest progress bar and summary grid.
 * The "Próximo Riego" item is tappable to open the WateringModal.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Crop, GardenArea } from '../types/cropTypes';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CropCardProps {
    crop: Crop;
    gardenArea?: GardenArea;
    defaultExpanded?: boolean;
    onWateringPress?: (crop: Crop) => void;
    onWeatherPress?: () => void;
    onTasksPress?: (crop: Crop) => void;
    weatherText?: string;
}

interface SummaryItemProps {
    icon: string;
    label: string;
    value: string;
    color?: string;
    onPress?: () => void;
}

/** Reusable summary item for the info grid */
const SummaryItem: React.FC<SummaryItemProps> = ({ icon, label, value, color = '#4CAF50', onPress }) => {
    const content = (
        <View style={[styles.summaryItem, onPress && styles.summaryItemTappable]}>
            <MaterialCommunityIcons name={icon as any} size={22} color={color} />
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: '47%' }}>
                {React.cloneElement(content, { style: [styles.summaryItem, styles.summaryItemTappable] })}
            </TouchableOpacity>
        );
    }

    return content;
};

export const CropCard: React.FC<CropCardProps> = ({
    crop,
    gardenArea,
    defaultExpanded = false,
    onWateringPress,
    onWeatherPress,
    onTasksPress,
    weatherText = '-- °C',
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(rotateAnim, {
            toValue: expanded ? 0 : 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
        setExpanded(!expanded);
    };

    const progress = crop.totalDays > 0 ? crop.currentDay / crop.totalDays : 0;
    const progressPercent = Math.min(progress * 100, 100);

    const chevronRotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={styles.card}>
            {/* Header - always visible */}
            <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.8}
                style={styles.cardHeader}
            >
                <View style={styles.imageContainer}>
                    {crop.imageUri ? (
                        <Image source={{ uri: crop.imageUri }} style={styles.cropImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="sprout" size={32} color="#66BB6A" />
                        </View>
                    )}
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.cropName}>{crop.name}</Text>
                    <Text style={styles.dayText}>
                        Día {crop.currentDay} de {crop.totalDays}
                    </Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#9E9E9E" />
                </Animated.View>
            </TouchableOpacity>

            {/* Expanded content */}
            {expanded && (
                <View style={styles.expandedContent}>
                    {/* Harvest progress */}
                    <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>Estado de la Cosecha</Text>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${progressPercent}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {crop.currentDay}/{crop.totalDays} días
                        </Text>
                    </View>

                    {/* Summary grid */}
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryGrid}>
                        <SummaryItem
                            icon="water-outline"
                            label="Próximo Riego"
                            value={crop.nextWatering}
                            onPress={onWateringPress ? () => onWateringPress(crop) : undefined}
                        />
                        <SummaryItem
                            icon="white-balance-sunny"
                            label="Clima"
                            value={weatherText}
                            color="#FFA726"
                            onPress={onWeatherPress}
                        />
                        <SummaryItem
                            icon="clipboard-check-outline"
                            label="Tareas de Hoy"
                            value={crop.tasks.length > 0
                                ? crop.tasks.filter(t => !t.completed)[0]?.title || 'Todo listo'
                                : 'Sin tareas'
                            }
                            onPress={onTasksPress ? () => onTasksPress(crop) : undefined}
                        />
                        <SummaryItem
                            icon="information-outline"
                            label="Info. de Planta"
                            value="Ver especificaciones"
                        />
                    </View>

                    {/* Description */}
                    {crop.description ? (
                        <View style={styles.descriptionSection}>
                            <Text style={styles.descriptionLabel}>Descripción</Text>
                            <Text style={styles.descriptionText}>{crop.description}</Text>
                        </View>
                    ) : null}

                    {/* Garden area badge */}
                    {gardenArea && (
                        <View style={styles.areaBadge}>
                            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#66BB6A" />
                            <Text style={styles.areaBadgeText}>{gardenArea.name}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    imageContainer: {
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 14,
    },
    cropImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    headerInfo: {
        flex: 1,
    },
    cropName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 4,
    },
    dayText: {
        fontSize: 13,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    expandedContent: {
        paddingHorizontal: 14,
        paddingBottom: 16,
    },
    progressSection: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 10,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        color: '#9E9E9E',
        textAlign: 'center',
        fontWeight: '500',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    summaryItem: {
        width: '47%',
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        padding: 14,
    },
    summaryItemTappable: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#9E9E9E',
        marginTop: 6,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 13,
        color: '#1B5E20',
        fontWeight: '700',
        marginTop: 2,
    },
    descriptionSection: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    descriptionLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '600',
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 13,
        color: '#424242',
        lineHeight: 18,
    },
    areaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    areaBadgeText: {
        fontSize: 11,
        color: '#66BB6A',
        fontWeight: '600',
    },
});

export default CropCard;
