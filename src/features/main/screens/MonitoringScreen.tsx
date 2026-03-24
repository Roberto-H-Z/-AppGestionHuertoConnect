import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../../infrastructure/api/apiClient';

type StageStatus = 'completed' | 'in-progress' | 'pending';

interface TimelineActivity {
    id: string;
    action: string;
    detail: string;
    date: string;
    icon: string;
    iconColor: string;
}

interface TimelineStage {
    id: string;
    name: string;
    dayLabel: string;
    status: StageStatus;
    description: string;
    activities: TimelineActivity[];
}

interface CropTimeline {
    cropId: string;
    cropName: string;
    cropIcon: string;
    stages: TimelineStage[];
}

const statusConfig: Record<StageStatus, { bg: string; border: string; dotBg: string; dotBorder: string; icon: string; iconColor: string }> = {
    completed: {
        bg: '#FFFFFF',
        border: '#E0E0E0',
        dotBg: '#4CAF50',
        dotBorder: '#4CAF50',
        icon: 'check',
        iconColor: '#fff',
    },
    'in-progress': {
        bg: '#F1F8E9',
        border: '#4CAF50',
        dotBg: '#4CAF50',
        dotBorder: '#4CAF50',
        icon: 'circle',
        iconColor: '#fff',
    },
    pending: {
        bg: '#FAFAFA',
        border: '#E0E0E0',
        dotBg: '#fff',
        dotBorder: '#BDBDBD',
        icon: 'circle-outline',
        iconColor: '#BDBDBD',
    },
};

const TimelineDot: React.FC<{ status: StageStatus }> = ({ status }) => {
    const cfg = statusConfig[status];
    return (
        <View style={[styles.dot, { backgroundColor: cfg.dotBg, borderColor: cfg.dotBorder }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={status === 'completed' ? 16 : 12} color={cfg.iconColor} />
        </View>
    );
};

const StageCard: React.FC<{ stage: TimelineStage; isLast: boolean }> = ({ stage, isLast }) => {
    const cfg = statusConfig[stage.status];
    const [expanded, setExpanded] = useState(stage.status === 'in-progress');

    return (
        <View style={styles.stageRow}>
            <View style={styles.railColumn}>
                <TimelineDot status={stage.status} />
                {!isLast && <View style={styles.railLine} />}
            </View>

            <TouchableOpacity
                style={[
                    styles.stageCard,
                    {
                        backgroundColor: cfg.bg,
                        borderColor: cfg.border,
                        borderWidth: stage.status === 'in-progress' ? 1.5 : 1,
                    },
                ]}
                activeOpacity={0.8}
                onPress={() => setExpanded(!expanded)}
            >
                <View style={styles.stageCardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.stageName, stage.status === 'pending' && styles.stageNamePending]}>
                            {stage.name}
                        </Text>
                        <Text style={styles.stageDesc}>{stage.description}</Text>
                    </View>
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeLabel}>Día</Text>
                        <Text style={styles.dayBadgeValue}>{stage.dayLabel.replace('Día ', '')}</Text>
                    </View>
                </View>

                {expanded && stage.activities.length > 0 && (
                    <View style={styles.activitiesContainer}>
                        <View style={styles.activitiesDivider} />
                        {stage.activities.map((act) => (
                            <View key={act.id} style={styles.activityRow}>
                                <View style={[styles.activityDot, { backgroundColor: `${act.iconColor}20` }]}>
                                    <MaterialCommunityIcons name={act.icon as any} size={16} color={act.iconColor} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityAction}>{act.action}</Text>
                                    <Text style={styles.activityDetail}>{act.detail}</Text>
                                </View>
                                <Text style={styles.activityDate}>{act.date}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {expanded && stage.activities.length === 0 && (
                    <View style={styles.activitiesContainer}>
                        <View style={styles.activitiesDivider} />
                        <Text style={styles.emptyActivitiesText}>Aún no hay acciones registradas en esta etapa.</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export const MonitoringScreen: React.FC = () => {
    const [timelines, setTimelines] = useState<CropTimeline[]>([]);
    const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTimeline = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/huertos-realizados/timeline');
                const mappedTimelines: CropTimeline[] = (response.data || []).map((timeline: any) => ({
                    cropId: timeline.crop_id,
                    cropName: timeline.crop_name,
                    cropIcon: timeline.crop_icon || 'sprout',
                    stages: (timeline.stages || []).map((stage: any) => ({
                        id: stage.id,
                        name: stage.name,
                        dayLabel: stage.day_label,
                        status: stage.status,
                        description: stage.description,
                        activities: (stage.activities || []).map((activity: any) => ({
                            id: activity.id,
                            action: activity.action,
                            detail: activity.detail,
                            date: activity.date,
                            icon: activity.icon,
                            iconColor: activity.icon_color,
                        })),
                    })),
                }));
                setTimelines(mappedTimelines);
            } catch (error) {
                console.warn('Timeline fetch failed:', error);
                setTimelines([]);
            } finally {
                setLoading(false);
            }
        };

        loadTimeline();
    }, []);

    const displayedTimelines = useMemo(
        () => (selectedCropId ? timelines.filter((timeline) => timeline.cropId === selectedCropId) : timelines),
        [selectedCropId, timelines]
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <MaterialCommunityIcons name="timeline-clock-outline" size={22} color="#4CAF50" />
                <Text style={styles.headerTitle}>Línea de Tiempo del Cultivo</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
            >
                <TouchableOpacity
                    style={[styles.chip, !selectedCropId && styles.chipActive]}
                    onPress={() => setSelectedCropId(null)}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="view-grid-outline" size={16} color={!selectedCropId ? '#fff' : '#4CAF50'} />
                    <Text style={[styles.chipText, !selectedCropId && styles.chipTextActive]}>Todos</Text>
                </TouchableOpacity>
                {timelines.map((timeline) => {
                    const active = selectedCropId === timeline.cropId;
                    return (
                        <TouchableOpacity
                            key={timeline.cropId}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setSelectedCropId(timeline.cropId)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name={timeline.cropIcon as any} size={16} color={active ? '#fff' : '#4CAF50'} />
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{timeline.cropName}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
                    </View>
                ) : displayedTimelines.length > 0 ? (
                    displayedTimelines.map((timeline) => (
                        <View key={timeline.cropId} style={styles.timelineSection}>
                            {!selectedCropId && (
                                <View style={styles.cropSectionHeader}>
                                    <MaterialCommunityIcons name={timeline.cropIcon as any} size={18} color="#4CAF50" />
                                    <Text style={styles.cropSectionTitle}>{timeline.cropName}</Text>
                                </View>
                            )}

                            {timeline.stages.map((stage, index) => (
                                <StageCard key={stage.id} stage={stage} isLast={index === timeline.stages.length - 1} />
                            ))}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="sprout-outline" size={48} color="#C8E6C9" />
                        <Text style={styles.emptyTitle}>Línea de tiempo vacía</Text>
                        <Text style={styles.emptySubtitle}>
                            Aquí verás el progreso y las acciones registradas de tus cultivos, una vez que agregues uno.
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
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
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'web' ? 20 : 10,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
        fontStyle: 'italic',
    },
    chipsScroll: {
        flexGrow: 0,
        paddingVertical: 8,
    },
    chipsContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    chipActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    chipText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#4E5D52',
        fontSize: 14,
    },
    timelineSection: {
        marginBottom: 24,
    },
    cropSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cropSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
    },
    stageRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    railColumn: {
        width: 32,
        alignItems: 'center',
    },
    railLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#C8E6C9',
        marginTop: 4,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    stageCard: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    stageCardHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    stageName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
    },
    stageNamePending: {
        color: '#78909C',
    },
    stageDesc: {
        marginTop: 4,
        fontSize: 13,
        color: '#607D8B',
    },
    dayBadge: {
        minWidth: 62,
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    dayBadgeLabel: {
        fontSize: 11,
        color: '#90A4AE',
    },
    dayBadgeValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
    },
    activitiesContainer: {
        marginTop: 14,
    },
    activitiesDivider: {
        height: 1,
        backgroundColor: '#E8F5E9',
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 8,
    },
    activityDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityInfo: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2E3D33',
    },
    activityDetail: {
        marginTop: 2,
        fontSize: 13,
        color: '#607D8B',
    },
    activityDate: {
        fontSize: 12,
        color: '#90A4AE',
        fontWeight: '600',
    },
    emptyActivitiesText: {
        fontSize: 13,
        color: '#90A4AE',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
    },
    emptySubtitle: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        color: '#607D8B',
    },
});

export default MonitoringScreen;
