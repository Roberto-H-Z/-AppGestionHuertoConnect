import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
        border: '#E5E7EB',
        dotBg: '#059669',
        dotBorder: '#059669',
        icon: 'check',
        iconColor: '#fff',
    },
    'in-progress': {
        bg: '#F0FDF4',
        border: '#059669',
        dotBg: '#059669',
        dotBorder: '#059669',
        icon: 'circle',
        iconColor: '#fff',
    },
    pending: {
        bg: '#FAFAFA',
        border: '#E5E7EB',
        dotBg: '#fff',
        dotBorder: '#D1D5DB',
        icon: 'circle-outline',
        iconColor: '#D1D5DB',
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
                activeOpacity={0.75}
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
                    <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#9CA3AF"
                        style={{ marginLeft: 6 }}
                    />
                </View>

                {expanded && stage.activities.length > 0 && (
                    <View style={styles.activitiesContainer}>
                        <View style={styles.activitiesDivider} />
                        {stage.activities.map((act) => (
                            <View key={act.id} style={styles.activityRow}>
                                <View style={[styles.activityDot, { backgroundColor: `${act.iconColor}18` }]}>
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

    const loadTimeline = useCallback(async () => {
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
            setSelectedCropId((currentCropId) =>
                currentCropId && mappedTimelines.some((t) => t.cropId === currentCropId)
                    ? currentCropId
                    : null
            );
        } catch (error) {
            console.warn('Timeline fetch failed:', error);
            setTimelines([]);
            setSelectedCropId(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTimeline();
        }, [loadTimeline])
    );

    const displayedTimelines = useMemo(
        () => (selectedCropId ? timelines.filter((t) => t.cropId === selectedCropId) : timelines),
        [selectedCropId, timelines]
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIconBg}>
                    <MaterialCommunityIcons name="timeline-clock-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.headerTitle}>Línea de Tiempo</Text>
            </View>

            {/* Crop filter chips */}
            <View style={styles.chipsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContent}
                >
                    <TouchableOpacity
                        style={[styles.chip, !selectedCropId && styles.chipActive]}
                        onPress={() => setSelectedCropId(null)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="view-grid-outline" size={14} color={!selectedCropId ? '#fff' : '#6B7280'} />
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
                                <MaterialCommunityIcons name={timeline.cropIcon as any} size={14} color={active ? '#fff' : '#6B7280'} />
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{timeline.cropName}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#059669" />
                        <Text style={styles.loadingText}>Cargando línea de tiempo...</Text>
                    </View>
                ) : displayedTimelines.length > 0 ? (
                    displayedTimelines.map((timeline) => (
                        <View key={timeline.cropId} style={styles.timelineSection}>
                            {!selectedCropId && (
                                <View style={styles.cropSectionHeader}>
                                    <View style={styles.cropSectionIconBg}>
                                        <MaterialCommunityIcons name={timeline.cropIcon as any} size={16} color="#059669" />
                                    </View>
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
                        <View style={styles.emptyIconBg}>
                            <MaterialCommunityIcons name="sprout-outline" size={40} color="#059669" />
                        </View>
                        <Text style={styles.emptyTitle}>Sin actividad aún</Text>
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
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    // ── Header
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 13,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6,
    },
    headerIconBg: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    // ── Chips
    chipsWrapper: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    chipsContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6',
    },
    chipActive: { backgroundColor: '#059669' },
    chipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    // ── Timeline
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    loadingText: { color: '#6B7280', fontSize: 14 },
    timelineSection: { marginBottom: 24 },
    cropSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    cropSectionIconBg: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    },
    cropSectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
    stageRow: { flexDirection: 'row', alignItems: 'stretch' },
    railColumn: { width: 36, alignItems: 'center' },
    railLine: { flex: 1, width: 2, backgroundColor: '#D1FAE5', marginTop: 4 },
    dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    stageCard: {
        flex: 1, borderRadius: 16, padding: 14, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    stageCardHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    stageName: { fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
    stageNamePending: { color: '#9CA3AF' },
    stageDesc: { marginTop: 3, fontSize: 12.5, color: '#6B7280', lineHeight: 18 },
    dayBadge: {
        minWidth: 56, borderRadius: 10, backgroundColor: '#F3F4F6',
        paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center',
    },
    dayBadgeLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
    dayBadgeValue: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    activitiesContainer: { marginTop: 12 },
    activitiesDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 10 },
    activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
    activityDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    activityInfo: { flex: 1 },
    activityAction: { fontSize: 14, fontWeight: '700', color: '#1F2937', letterSpacing: -0.1 },
    activityDetail: { marginTop: 2, fontSize: 12.5, color: '#6B7280', lineHeight: 17 },
    activityDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    emptyActivitiesText: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },
    // ── Empty state
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: 24 },
    emptyIconBg: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    emptySubtitle: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 21, color: '#6B7280' },
});

export default MonitoringScreen;
