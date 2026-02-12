/**
 * MonitoringScreen - Crop timeline / seguimiento.
 * Shows a vertical timeline with stages & activities per crop.
 * Allows filtering by crop via horizontal chips.
 * Mock data is generated from the harvest-status stages.
 */

import React, { useState, useMemo } from 'react';
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
import { HarvestStatus } from '../types/cropTypes';

// ---- Types ----

interface TimelineActivity {
    id: string;
    action: string;
    detail: string;
    date: string;          // DD/MM/YYYY
    icon: string;          // MaterialCommunityIcons name
    iconColor: string;
}

type StageStatus = 'completed' | 'in-progress' | 'pending';

interface TimelineStage {
    id: string;
    name: string;
    dayLabel: string;       // e.g. "Día 1"
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

// ---- Mock Data Builder ----

const stageDefinitions: {
    name: HarvestStatus;
    dayStart: number;
    description: string;
}[] = [
        { name: 'Germinación', dayStart: 1, description: 'Siembra y primeros brotes' },
        { name: 'Crecimiento', dayStart: 15, description: 'Desarrollo vegetativo y hojas' },
        { name: 'Floración', dayStart: 45, description: 'Aparición de flores y polinización' },
        { name: 'Fructificación', dayStart: 60, description: 'Desarrollo de frutos' },
        { name: 'Cosecha', dayStart: 90, description: 'Recolección de frutos maduros' },
    ];

const buildMockActivities = (stageName: string, baseDate: Date): TimelineActivity[] => {
    const fmt = (d: Date) => {
        const dd = d.getDate().toString().padStart(2, '0');
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${dd}/${mm}/${d.getFullYear()}`;
    };

    const activityMap: Record<string, TimelineActivity[]> = {
        Germinación: [
            { id: 'a1', action: 'Siembra', detail: 'Semillas plantadas en sustrato húmedo', date: fmt(baseDate), icon: 'seed-outline', iconColor: '#8D6E63' },
            { id: 'a2', action: 'Riego inicial', detail: 'Primer riego después de la siembra', date: fmt(baseDate), icon: 'water', iconColor: '#42A5F5' },
        ],
        Crecimiento: [
            { id: 'a3', action: 'Fertilización', detail: 'Aplicación de abono orgánico', date: fmt(new Date(baseDate.getTime() + 15 * 86400000)), icon: 'leaf', iconColor: '#66BB6A' },
            { id: 'a4', action: 'Riego', detail: 'Riego programado completado', date: fmt(new Date(baseDate.getTime() + 18 * 86400000)), icon: 'water', iconColor: '#42A5F5' },
            { id: 'a5', action: 'Poda', detail: 'Poda de hojas inferiores', date: fmt(new Date(baseDate.getTime() + 25 * 86400000)), icon: 'content-cut', iconColor: '#FF7043' },
        ],
        Floración: [
            { id: 'a6', action: 'Control de plagas', detail: 'Inspección y aplicación preventiva', date: fmt(new Date(baseDate.getTime() + 45 * 86400000)), icon: 'bug-outline', iconColor: '#EF5350' },
        ],
        Fructificación: [
            { id: 'a7', action: 'Nutrición', detail: 'Aplicar fertilizante rico en potasio', date: fmt(new Date(baseDate.getTime() + 60 * 86400000)), icon: 'flask-outline', iconColor: '#AB47BC' },
        ],
        Cosecha: [
            { id: 'a8', action: 'Recolección', detail: 'Cosechar frutos maduros', date: fmt(new Date(baseDate.getTime() + 90 * 86400000)), icon: 'basket-outline', iconColor: '#FFA726' },
        ],
    };

    return activityMap[stageName] || [];
};

const getStageStatus = (
    stageName: string,
    currentStatus: HarvestStatus,
    currentDay: number,
    stageDayStart: number,
): StageStatus => {
    const order: HarvestStatus[] = ['Germinación', 'Crecimiento', 'Floración', 'Fructificación', 'Cosecha'];
    const currentIdx = order.indexOf(currentStatus);
    const stageIdx = order.indexOf(stageName as HarvestStatus);

    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'in-progress';
    return 'pending';
};

const buildMockTimelines = (): CropTimeline[] => {
    const today = new Date();

    return [
        {
            cropId: 'mock-tomate',
            cropName: 'Tomate',
            cropIcon: 'food-apple',
            stages: stageDefinitions.map((sd) => ({
                id: `tomate-${sd.name}`,
                name: sd.name === 'Crecimiento' ? 'Crecimiento Vegetativo' : (sd.name === 'Germinación' ? 'Siembra' : sd.name),
                dayLabel: `Día ${sd.dayStart}`,
                status: getStageStatus(sd.name, 'Floración', 45, sd.dayStart),
                description:
                    getStageStatus(sd.name, 'Floración', 45, sd.dayStart) === 'completed'
                        ? 'Completado exitosamente'
                        : getStageStatus(sd.name, 'Floración', 45, sd.dayStart) === 'in-progress'
                            ? `En progreso - ${sd.description}`
                            : 'Próxima etapa del cultivo',
                activities: buildMockActivities(sd.name, new Date(today.getTime() - sd.dayStart * 86400000)),
            })),
        },
        {
            cropId: 'mock-chile',
            cropName: 'Chile Habanero',
            cropIcon: 'chili-mild',
            stages: stageDefinitions.map((sd) => ({
                id: `chile-${sd.name}`,
                name: sd.name === 'Crecimiento' ? 'Crecimiento Vegetativo' : (sd.name === 'Germinación' ? 'Siembra' : sd.name),
                dayLabel: `Día ${sd.dayStart}`,
                status: getStageStatus(sd.name, 'Crecimiento', 20, sd.dayStart),
                description:
                    getStageStatus(sd.name, 'Crecimiento', 20, sd.dayStart) === 'completed'
                        ? 'Completado exitosamente'
                        : getStageStatus(sd.name, 'Crecimiento', 20, sd.dayStart) === 'in-progress'
                            ? `En progreso - ${sd.description}`
                            : 'Próxima etapa del cultivo',
                activities: buildMockActivities(sd.name, new Date(today.getTime() - sd.dayStart * 86400000)),
            })),
        },
    ];
};

// ---- Status visual helpers ----

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

// ---- Components ----

const TimelineDot: React.FC<{ status: StageStatus }> = ({ status }) => {
    const cfg = statusConfig[status];
    return (
        <View style={[styles.dot, { backgroundColor: cfg.dotBg, borderColor: cfg.dotBorder }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={status === 'completed' ? 16 : 12} color={cfg.iconColor} />
        </View>
    );
};

const StageCard: React.FC<{
    stage: TimelineStage;
    isLast: boolean;
}> = ({ stage, isLast }) => {
    const cfg = statusConfig[stage.status];
    const [expanded, setExpanded] = useState(stage.status === 'in-progress');

    return (
        <View style={styles.stageRow}>
            {/* Timeline rail */}
            <View style={styles.railColumn}>
                <TimelineDot status={stage.status} />
                {!isLast && <View style={styles.railLine} />}
            </View>

            {/* Card */}
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
                        <Text
                            style={[
                                styles.stageName,
                                stage.status === 'pending' && styles.stageNamePending,
                            ]}
                        >
                            {stage.name}
                        </Text>
                        <Text
                            style={[
                                styles.stageDesc,
                                stage.status === 'in-progress' && styles.stageDescActive,
                            ]}
                        >
                            {stage.description}
                        </Text>
                    </View>
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeLabel}>Día</Text>
                        <Text style={styles.dayBadgeValue}>{stage.dayLabel.replace('Día ', '')}</Text>
                    </View>
                </View>

                {/* Expanded activities */}
                {expanded && stage.activities.length > 0 && (
                    <View style={styles.activitiesContainer}>
                        <View style={styles.activitiesDivider} />
                        {stage.activities.map((act) => (
                            <View key={act.id} style={styles.activityRow}>
                                <View style={[styles.activityDot, { backgroundColor: act.iconColor + '20' }]}>
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
            </TouchableOpacity>
        </View>
    );
};

// ---- Main Screen ----

export const MonitoringScreen: React.FC = () => {
    const timelines = useMemo(() => buildMockTimelines(), []);
    const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

    // "Todos" shows all, or filter by selected crop
    const displayedTimelines = selectedCropId
        ? timelines.filter((t) => t.cropId === selectedCropId)
        : timelines;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <MaterialCommunityIcons name="timeline-clock-outline" size={22} color="#4CAF50" />
                <Text style={styles.headerTitle}>Línea de Tiempo del Cultivo</Text>
            </View>

            {/* Crop filter chips */}
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
                    <MaterialCommunityIcons
                        name="view-grid-outline"
                        size={16}
                        color={!selectedCropId ? '#fff' : '#4CAF50'}
                    />
                    <Text style={[styles.chipText, !selectedCropId && styles.chipTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                {timelines.map((tl) => {
                    const active = selectedCropId === tl.cropId;
                    return (
                        <TouchableOpacity
                            key={tl.cropId}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setSelectedCropId(tl.cropId)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name={tl.cropIcon as any}
                                size={16}
                                color={active ? '#fff' : '#4CAF50'}
                            />
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {tl.cropName}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Timeline content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {displayedTimelines.map((tl) => (
                    <View key={tl.cropId} style={styles.timelineSection}>
                        {/* Crop section header (only when showing all) */}
                        {!selectedCropId && (
                            <View style={styles.cropSectionHeader}>
                                <MaterialCommunityIcons
                                    name={tl.cropIcon as any}
                                    size={18}
                                    color="#4CAF50"
                                />
                                <Text style={styles.cropSectionTitle}>{tl.cropName}</Text>
                            </View>
                        )}

                        {/* Stages */}
                        {tl.stages.map((stage, idx) => (
                            <StageCard
                                key={stage.id}
                                stage={stage}
                                isLast={idx === tl.stages.length - 1}
                            />
                        ))}
                    </View>
                ))}

                {/* Bottom spacer */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ---- Styles ----

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

    // Chips
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
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 10,
        paddingHorizontal: 10,
    },

    // Timeline section
    timelineSection: {
        marginBottom: 12,
    },
    cropSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        marginBottom: 12,
        marginTop: 4,
    },
    cropSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
    },

    // Stage row
    stageRow: {
        flexDirection: 'row',
        paddingLeft: 6,
    },

    // Rail
    railColumn: {
        alignItems: 'center',
        width: 32,
    },
    dot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    railLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#C8E6C9',
        marginTop: -2,
        marginBottom: -2,
    },

    // Stage card
    stageCard: {
        flex: 1,
        marginLeft: 10,
        marginBottom: 14,
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    stageCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stageName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 4,
    },
    stageNamePending: {
        color: '#9E9E9E',
    },
    stageDesc: {
        fontSize: 13,
        color: '#9E9E9E',
        lineHeight: 18,
    },
    stageDescActive: {
        color: '#616161',
    },

    // Day badge
    dayBadge: {
        alignItems: 'center',
        backgroundColor: '#F1F8E9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 8,
    },
    dayBadgeLabel: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    dayBadgeValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1B5E20',
    },

    // Activities
    activitiesContainer: {
        marginTop: 10,
    },
    activitiesDivider: {
        height: 1,
        backgroundColor: '#E8F5E9',
        marginBottom: 10,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    activityDot: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityInfo: {
        flex: 1,
        marginLeft: 10,
    },
    activityAction: {
        fontSize: 13,
        fontWeight: '600',
        color: '#424242',
    },
    activityDetail: {
        fontSize: 11,
        color: '#9E9E9E',
        marginTop: 1,
    },
    activityDate: {
        fontSize: 11,
        color: '#BDBDBD',
        fontWeight: '500',
    },
});

export default MonitoringScreen;
