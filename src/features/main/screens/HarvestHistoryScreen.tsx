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

interface StatCard {
    icon: string;
    value: string;
    label: string;
}

interface HarvestItem {
    name: string;
    date: string;
    quality: string;
    qualityColor: string;
    quantity: string;
    duration: string;
    note: string;
}

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const STATS: StatCard[] = [
    { icon: 'calendar-outline', value: '0', label: 'Cosechas Totales' },
    { icon: 'basket-outline', value: '0', label: 'Kg Recolectados' },
    { icon: 'trending-up', value: '0', label: 'Días Promedio' },
    { icon: 'trophy-outline', value: '0', label: 'Tasa de Éxito %' },
];

const HARVESTS: HarvestItem[] = [];

// ═══════════════════════════════════════════
// ██  STAT CARD COMPONENT
// ═══════════════════════════════════════════

const StatCardItem: React.FC<StatCard & { delay: number }> = ({
    icon,
    value,
    label,
    delay,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 450,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 80,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={styles.statIconCircle}>
                <MaterialCommunityIcons
                    name={icon as any}
                    size={24}
                    color="#4CAF50"
                />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  HARVEST CARD COMPONENT
// ═══════════════════════════════════════════

const HarvestCard: React.FC<HarvestItem & { delay: number }> = ({
    name,
    date,
    quality,
    qualityColor,
    quantity,
    duration,
    note,
    delay,
}) => {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 450,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 450,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.harvestCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {/* Header row */}
            <View style={styles.harvestHeader}>
                <Text style={styles.harvestName}>{name}</Text>
                <View
                    style={[
                        styles.qualityBadge,
                        { borderColor: qualityColor },
                    ]}
                >
                    <Text
                        style={[styles.qualityText, { color: qualityColor }]}
                    >
                        {quality}
                    </Text>
                </View>
            </View>

            <Text style={styles.harvestDate}>{date}</Text>

            {/* Detail boxes */}
            <View style={styles.detailRow}>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Cantidad</Text>
                    <Text style={styles.detailValue}>{quantity}</Text>
                </View>
                <View style={styles.detailBox}>
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
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.6}
                >
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={24}
                        color="#1B5E20"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Cosechas</Text>
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Stats Grid ── */}
                <View style={styles.statsGrid}>
                    {STATS.map((stat, i) => (
                        <StatCardItem
                            key={stat.label}
                            {...stat}
                            delay={100 + i * 100}
                        />
                    ))}
                </View>

                {/* ── Harvest List ── */}
                {HARVESTS.length > 0 ? (
                    HARVESTS.map((harvest, i) => (
                        <HarvestCard
                            key={harvest.name}
                            {...harvest}
                            delay={400 + i * 120}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="leaf-off" size={48} color="#C8E6C9" />
                        <Text style={styles.emptyTitle}>Aún no hay cosechas</Text>
                        <Text style={styles.emptySubtitle}>Cuando finalices tu primer cultivo, aquí aparecerá su registro histórico.</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#F1F8E9',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'web' ? 20 : 10,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
    },

    // ── Scroll ──
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },

    // ── Stats Grid ──
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: { elevation: 2 },
            web: {
                // @ts-ignore
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            },
        }),
    },
    statIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1B5E20',
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
        textAlign: 'center',
    },

    // ── Harvest Cards ──
    harvestCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
            },
            android: { elevation: 3 },
            web: {
                // @ts-ignore
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            },
        }),
    },
    harvestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    harvestName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
    },
    qualityBadge: {
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    qualityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    harvestDate: {
        fontSize: 13,
        color: '#9E9E9E',
        marginBottom: 14,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    detailBox: {
        flex: 1,
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    detailLabel: {
        fontSize: 11,
        color: '#9E9E9E',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4CAF50',
    },
    harvestNote: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 18,
    },
    
    // ── Empty State ──
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#81C784',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#A5D6A7',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginTop: 8,
    },
});

export default HarvestHistoryScreen;
