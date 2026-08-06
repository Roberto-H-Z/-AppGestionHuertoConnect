/**
 * PlantSpecsScreen — Tabbed plant specification view showing
 * Riego, Luz Solar, Nutrientes, and Plagas sections.
 * Receives crop name via route params.
 */

import React, { useRef, useEffect, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';

// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

type TabKey = 'riego' | 'luz' | 'nutrientes' | 'plagas';

interface TabDef { key: TabKey; label: string; icon: string; color: string; bg: string }
interface SpecRow { label: string; value: string }
interface TabContent { title: string; icon: string; iconColor: string; rows: SpecRow[] }

// ═══════════════════════════════════════════
// ██  TABS
// ═══════════════════════════════════════════

const TABS: TabDef[] = [
    { key: 'riego', label: 'Riego', icon: 'water-outline', color: '#0891B2', bg: '#E0F2FE' },
    { key: 'luz', label: 'Luz Solar', icon: 'white-balance-sunny', color: '#D97706', bg: '#FEF3C7' },
    { key: 'nutrientes', label: 'Nutrientes', icon: 'flask-outline', color: '#059669', bg: '#ECFDF5' },
    { key: 'plagas', label: 'Plagas', icon: 'bug-outline', color: '#DC2626', bg: '#FEE2E2' },
];

const TAB_CONTENT: Record<TabKey, TabContent> = {
    riego: {
        title: 'Requisitos de Riego',
        icon: 'water-outline',
        iconColor: '#0891B2',
        rows: [
            { label: 'Necesidad de agua', value: 'Alta' },
            { label: 'Frecuencia', value: '3 veces por semana' },
            { label: 'Cantidad', value: '2-3 litros por planta' },
            { label: 'Mejor momento', value: 'Mañana temprano o tarde' },
        ],
    },
    luz: {
        title: 'Requisitos de Luz Solar',
        icon: 'white-balance-sunny',
        iconColor: '#D97706',
        rows: [
            { label: 'Exposición diaria', value: '6-8 horas de sol directo' },
            { label: 'Tipo de luz', value: 'Pleno sol' },
            { label: 'Tolerancia a sombra', value: 'Baja' },
            { label: 'Orientación ideal', value: 'Sur o suroeste' },
        ],
    },
    nutrientes: {
        title: 'Recomendaciones de Nutrientes',
        icon: 'flask-outline',
        iconColor: '#059669',
        rows: [
            { label: 'NPK recomendado', value: '10-10-10 o 5-10-10' },
            { label: 'Frecuencia', value: 'Cada 2 semanas' },
            { label: 'Fertilizante orgánico', value: 'Compost o humus' },
            { label: 'Micronutrientes', value: 'Calcio y magnesio' },
        ],
    },
    plagas: {
        title: 'Prevención de Plagas',
        icon: 'bug-outline',
        iconColor: '#DC2626',
        rows: [
            { label: 'Plagas comunes', value: 'Pulgón y mosca blanca' },
            { label: 'Prevención', value: 'Rotación de cultivos' },
            { label: 'Control orgánico', value: 'Aceite de neem' },
            { label: 'Inspección', value: 'Revisar hojas 2 veces/semana' },
        ],
    },
};

// ═══════════════════════════════════════════
// ██  TAB BUTTON COMPONENT
// ═══════════════════════════════════════════

const TabButton: React.FC<{ tab: TabDef; active: boolean; onPress: () => void }> = ({ tab, active, onPress }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.tabButton, active && { backgroundColor: tab.color }]}>
        <View style={[styles.tabIconBg, active ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: tab.bg }]}>
            <MaterialCommunityIcons name={tab.icon as any} size={18} color={active ? '#fff' : tab.color} />
        </View>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
    </TouchableOpacity>
);

// ═══════════════════════════════════════════
// ██  SPEC ROW COMPONENT
// ═══════════════════════════════════════════

const SpecRowItem: React.FC<{ label: string; value: string; delay: number; animKey: number; color: string }> = ({
    label, value, delay, animKey, color,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(12);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay, useNativeDriver: false }),
            Animated.timing(slideAnim, { toValue: 0, duration: 320, delay, useNativeDriver: false }),
        ]).start();
    }, [animKey]);

    return (
        <Animated.View style={[styles.specRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.specDot}>
                <View style={[styles.specDotInner, { backgroundColor: color }]} />
            </View>
            <View style={styles.specTextGroup}>
                <Text style={styles.specLabel}>{label}</Text>
                <Text style={[styles.specValue, { color }]}>{value}</Text>
            </View>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const PlantSpecsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const cropName = route.params?.cropName ?? 'Tomate';
    const scientificName = route.params?.scientificName ?? 'Solanum lycopersicum';
    const cropIcon = route.params?.cropIcon ?? 'sprout';

    const [activeTab, setActiveTab] = useState<TabKey>('riego');
    const [animKey, setAnimKey] = useState(0);

    const headerFade = useRef(new Animated.Value(0)).current;
    const imageScale = useRef(new Animated.Value(0.85)).current;
    const imageFade = useRef(new Animated.Value(0)).current;
    const tabsFade = useRef(new Animated.Value(0)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(28)).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: false }).start();
        Animated.parallel([
            Animated.timing(imageFade, { toValue: 1, duration: 500, delay: 100, useNativeDriver: false }),
            Animated.spring(imageScale, { toValue: 1, friction: 6, tension: 60, delay: 100, useNativeDriver: false }),
        ]).start();
        Animated.timing(tabsFade, { toValue: 1, duration: 400, delay: 250, useNativeDriver: false }).start();
        Animated.parallel([
            Animated.timing(cardFade, { toValue: 1, duration: 450, delay: 350, useNativeDriver: false }),
            Animated.timing(cardSlide, { toValue: 0, duration: 450, delay: 350, useNativeDriver: false }),
        ]).start();
    }, []);

    const handleTabChange = (key: TabKey) => {
        setActiveTab(key);
        setAnimKey((k) => k + 1);
    };

    const content = TAB_CONTENT[activeTab];
    const activeTabDef = TABS.find(t => t.key === activeTab)!;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{cropName}</Text>
                    <Text style={styles.headerSub}>{scientificName}</Text>
                </View>
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Plant illustration */}
                <Animated.View style={[styles.illustrationCard, { opacity: imageFade, transform: [{ scale: imageScale }] }]}>
                    <View style={styles.illustrationBg}>
                        <MaterialCommunityIcons name={cropIcon as any} size={72} color="#059669" />
                    </View>
                    <View style={styles.illustrationInfo}>
                        <Text style={styles.illustrationName}>{cropName}</Text>
                        <Text style={styles.illustrationSci}>{scientificName}</Text>
                    </View>
                </Animated.View>

                {/* Tabs */}
                <Animated.View style={[styles.tabsRow, { opacity: tabsFade }]}>
                    {TABS.map((tab) => (
                        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => handleTabChange(tab.key)} />
                    ))}
                </Animated.View>

                {/* Content Card */}
                <Animated.View style={[styles.contentCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
                    <View style={styles.contentCardHeader}>
                        <View style={[styles.contentIconBg, { backgroundColor: activeTabDef.bg }]}>
                            <MaterialCommunityIcons name={content.icon as any} size={22} color={content.iconColor} />
                        </View>
                        <Text style={[styles.contentTitle, { color: content.iconColor }]}>{content.title}</Text>
                    </View>

                    {content.rows.map((row, i) => (
                        <React.Fragment key={row.label}>
                            <SpecRowItem
                                label={row.label}
                                value={row.value}
                                delay={i * 70}
                                animKey={animKey}
                                color={content.iconColor}
                            />
                            {i < content.rows.length - 1 && <View style={styles.rowDivider} />}
                        </React.Fragment>
                    ))}
                </Animated.View>

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
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 14,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    headerSub: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 1 },

    // ── Scroll ────────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

    // ── Illustration ──────────────────────────────────────────
    illustrationCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', marginBottom: 16,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    illustrationBg: { height: 180, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    illustrationInfo: { paddingHorizontal: 18, paddingVertical: 14 },
    illustrationName: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },
    illustrationSci: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginTop: 3 },

    // ── Tabs ──────────────────────────────────────────────────
    tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    tabButton: {
        flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
    },
    tabIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    tabLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
    tabLabelActive: { color: '#fff', fontWeight: '700' },

    // ── Content Card ──────────────────────────────────────────
    contentCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    contentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    contentIconBg: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    contentTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

    // ── Spec Row ──────────────────────────────────────────────
    specRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
    specDot: { paddingTop: 6 },
    specDotInner: { width: 8, height: 8, borderRadius: 4 },
    specTextGroup: { flex: 1 },
    specLabel: { fontSize: 12.5, color: '#9CA3AF', marginBottom: 3, fontWeight: '500' },
    specValue: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
    rowDivider: { height: 1, backgroundColor: '#F9FAFB' },
});

export default PlantSpecsScreen;
