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
import { AppScreenHeader } from '../components';
import { palette, radii, shadows } from '../theme';

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
            // Cargamos los huertos reales del usuario
            const huertosRes = await apiClient.get('/huertos');
            const huertos: any[] = huertosRes.data || [];

            if (huertos.length === 0) {
                setTimelines([]);
                setSelectedCropId(null);
                return;
            }

            // Para cada huerto, cargamos sus siembras y construimos una línea de tiempo básica
            const timelines: CropTimeline[] = await Promise.all(
                huertos.slice(0, 5).map(async (huerto: any) => {
                    let siembras: any[] = [];
                    try {
                        const siembrasRes = await apiClient.get(`/cultivos/siembras/${huerto.id}`);
                        siembras = siembrasRes.data || [];
                    } catch { /* sin siembras */ }

                    const stages: TimelineStage[] = siembras.slice(0, 3).map((s: any, idx: number) => {
                        const status: StageStatus =
                            s.estado === 'Cosechado' ? 'completed' :
                                s.estado === 'Activo' && idx === 0 ? 'in-progress' : 'pending';
                        return {
                            id: s.id,
                            name: s.cultivo_nombre || `Cultivo ${idx + 1}`,
                            dayLabel: s.fecha_siembra
                                ? `Día ${Math.ceil((Date.now() - new Date(s.fecha_siembra).getTime()) / 86400000)}`
                                : 'Día 1',
                            status,
                            description: status === 'completed'
                                ? 'Cosecha completada exitosamente.'
                                : status === 'in-progress'
                                    ? 'Cultivo activo — revisa el riego y nutrición.'
                                    : 'Listo para iniciar esta etapa.',
                            activities: [],
                        };
                    });

                    // Si no hay siembras, etapa de inicio por defecto
                    if (stages.length === 0) {
                        stages.push({
                            id: `${huerto.id}-inicio`,
                            name: 'Creación del huerto',
                            dayLabel: 'Día 1',
                            status: 'completed',
                            description: 'Huerto registrado en el sistema.',
                            activities: [],
                        });
                    }

                    return {
                        cropId: huerto.id,
                        cropName: huerto.nombre,
                        cropIcon: 'sprout',
                        stages,
                    };
                })
            );

            const nextTimelines = timelines;
            setTimelines(nextTimelines);
            setSelectedCropId((currentCropId) =>
                currentCropId && nextTimelines.some((t) => t.cropId === currentCropId)
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
    const totalStages = timelines.reduce((total, timeline) => total + timeline.stages.length, 0);
    const completedStages = timelines.reduce(
        (total, timeline) => total + timeline.stages.filter((stage) => stage.status === 'completed').length,
        0
    );
    const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <AppScreenHeader
                eyebrow="Seguimiento"
                title="Progreso de cultivos"
                subtitle="Etapas, actividades y próximos cuidados."
                icon="chart-timeline-variant"
            />

            <View style={styles.progressCard}>
                <View style={styles.progressCopy}>
                    <Text style={styles.progressLabel}>Avance general</Text>
                    <Text style={styles.progressValue}>{progress}%</Text>
                    <Text style={styles.progressMeta}>{completedStages} de {totalStages} etapas completadas</Text>
                </View>
                <View style={styles.progressRing}>
                    <MaterialCommunityIcons name="sprout" size={28} color={palette.primary} />
                </View>
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
    container: { flex: 1, backgroundColor: palette.canvas },
    progressCard: {
        marginHorizontal: 14,
        marginBottom: 12,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: radii.large,
        backgroundColor: palette.forest,
        ...shadows.card,
    },
    progressCopy: { flex: 1 },
    progressLabel: { color: '#B9CBBF', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    progressValue: { marginTop: 4, color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -1 },
    progressMeta: { marginTop: 2, color: '#D6E2D9', fontSize: 12.5 },
    progressRing: {
        width: 58,
        height: 58,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    // ── Chips
    chipsWrapper: { backgroundColor: palette.canvas },
    chipsContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: palette.surface,
        borderWidth: 1, borderColor: palette.border,
    },
    chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
    chipText: { fontSize: 13, color: palette.muted, fontWeight: '700' },
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
        flex: 1, borderRadius: radii.medium, padding: 15, marginBottom: 14,
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
