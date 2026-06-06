/**
 * HarvestHistoryScreen — Shows harvest statistics and a list
 * of past harvests. Static demo with mock data.
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

interface StatCard { icon: string; value: string; label: string; color: string }
interface HarvestItem {
    name: string; date: string; quality: string; qualityColor: string;
    quantity: string; duration: string; note: string;
}

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const STATS: StatCard[] = [
    { icon: 'calendar-check-outline', value: '0', label: 'Cosechas Totales', color: '#059669' },
    { icon: 'basket-outline', value: '0 kg', label: 'Recolectados', color: '#0891B2' },
    { icon: 'clock-fast', value: '0 días', label: 'Promedio', color: '#7C3AED' },
    { icon: 'trophy-outline', value: '0%', label: 'Tasa de Éxito', color: '#D97706' },
];

const HARVESTS: HarvestItem[] = [];

// ═══════════════════════════════════════════
// ██  STAT CARD COMPONENT
// ═══════════════════════════════════════════

const StatCardItem: React.FC<StatCard & { delay: number }> = ({ icon, value, label, color, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.statCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
                <MaterialCommunityIcons name={icon as any} size={22} color={color} />
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  HARVEST CARD COMPONENT
// ═══════════════════════════════════════════

const HarvestCard: React.FC<HarvestItem & { delay: number }> = ({ name, date, quality, qualityColor, quantity, duration, note, delay }) => {
    const slideAnim = useRef(new Animated.Value(24)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.harvestCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.harvestHeader}>
                <Text style={styles.harvestName}>{name}</Text>
                <View style={[styles.qualityBadge, { borderColor: qualityColor, backgroundColor: `${qualityColor}12` }]}>
                    <Text style={[styles.qualityText, { color: qualityColor }]}>{quality}</Text>
                </View>
            </View>
            <Text style={styles.harvestDate}>{date}</Text>
            <View style={styles.detailRow}>
                <View style={styles.detailBox}>
                    <MaterialCommunityIcons name="scale" size={14} color="#9CA3AF" />
                    <Text style={styles.detailLabel}>Cantidad</Text>
                    <Text style={styles.detailValue}>{quantity}</Text>
                </View>
                <View style={styles.detailBox}>
                    <MaterialCommunityIcons name="timer-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.detailLabel}>Duración</Text>
                    <Text style={styles.detailValue}>{duration}</Text>
                </View>
            </View>
            <Text style={styles.harvestNote}>{note}</Text>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const HarvestHistoryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const headerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Cosechas</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {STATS.map((stat, i) => (
                        <StatCardItem key={stat.label} {...stat} delay={100 + i * 80} />
                    ))}
                </View>

                {/* Section title */}
                <Text style={styles.sectionTitle}>Cosechas Registradas</Text>

                {/* Harvest List */}
                {HARVESTS.length > 0 ? (
                    HARVESTS.map((harvest, i) => (
                        <HarvestCard key={harvest.name} {...harvest} delay={400 + i * 100} />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <MaterialCommunityIcons name="leaf-off" size={40} color="#059669" />
                        </View>
                        <Text style={styles.emptyTitle}>Aún no hay cosechas</Text>
                        <Text style={styles.emptySubtitle}>
                            Cuando finalices tu primer cultivo, aquí aparecerá su registro histórico.
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },

    // ── Header ────────────────────────────────────────────────
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 14,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },

    // ── Scroll ────────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 18 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.3, marginBottom: 12, marginTop: 4 },

    // ── Stats Grid ────────────────────────────────────────────
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statCard: {
        width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 20, paddingHorizontal: 14,
        alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    statIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 11.5, color: '#9CA3AF', marginTop: 3, textAlign: 'center', fontWeight: '500' },

    // ── Harvest Cards ─────────────────────────────────────────
    harvestCard: {
        backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 12,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    harvestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    harvestName: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
    qualityBadge: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    qualityText: { fontSize: 12, fontWeight: '700' },
    harvestDate: { fontSize: 13, color: '#9CA3AF', marginBottom: 14, fontWeight: '500' },
    detailRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    detailBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'flex-start', gap: 3 },
    detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
    detailValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
    harvestNote: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

    // ── Empty State ───────────────────────────────────────────
    emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 16, marginTop: 8, lineHeight: 21 },
});

export default HarvestHistoryScreen;
