/**
 * PlantSpecsScreen — Tabbed plant specification view showing
 * Riego, Luz Solar, Nutrientes, and Plagas sections.
 * Static demo with mock data. Receives crop name via route params.
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

interface TabDef {
    key: TabKey;
    label: string;
    icon: string;
}

interface SpecRow {
    label: string;
    value: string;
}

interface TabContent {
    title: string;
    icon: string;
    iconColor: string;
    rows: SpecRow[];
}

// ═══════════════════════════════════════════
// ██  TABS
// ═══════════════════════════════════════════

const TABS: TabDef[] = [
    { key: 'riego', label: 'Riego', icon: 'water-outline' },
    { key: 'luz', label: 'Luz Solar', icon: 'white-balance-sunny' },
    { key: 'nutrientes', label: 'Nutrientes', icon: 'flask-outline' },
    { key: 'plagas', label: 'Plagas', icon: 'bug-outline' },
];

// ═══════════════════════════════════════════
// ██  MOCK DATA PER TAB
// ═══════════════════════════════════════════

const TAB_CONTENT: Record<TabKey, TabContent> = {
    riego: {
        title: 'Requisitos de Riego',
        icon: 'water-outline',
        iconColor: '#4CAF50',
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
        iconColor: '#FFA726',
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
        iconColor: '#4CAF50',
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
        iconColor: '#E53935',
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

interface TabButtonProps {
    tab: TabDef;
    active: boolean;
    onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, active, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.tabButton, active && styles.tabButtonActive]}
    >
        <MaterialCommunityIcons
            name={tab.icon as any}
            size={20}
            color={active ? '#fff' : '#757575'}
        />
        <Text
            style={[
                styles.tabLabel,
                active && styles.tabLabelActive,
            ]}
        >
            {tab.label}
        </Text>
    </TouchableOpacity>
);

// ═══════════════════════════════════════════
// ██  SPEC ROW COMPONENT
// ═══════════════════════════════════════════

interface SpecRowItemProps {
    label: string;
    value: string;
    delay: number;
    animKey: number;
}

const SpecRowItem: React.FC<SpecRowItemProps> = ({
    label,
    value,
    delay,
    animKey,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(15);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [animKey]);

    return (
        <Animated.View
            style={[
                styles.specRow,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.specLabel}>{label}</Text>
            <Text style={styles.specValue}>{value}</Text>
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

    // ── Animations ──
    const headerFade = useRef(new Animated.Value(0)).current;
    const imageScale = useRef(new Animated.Value(0.8)).current;
    const imageFade = useRef(new Animated.Value(0)).current;
    const tabsFade = useRef(new Animated.Value(0)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        Animated.parallel([
            Animated.timing(imageFade, {
                toValue: 1,
                duration: 500,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.spring(imageScale, {
                toValue: 1,
                friction: 6,
                tension: 60,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.timing(tabsFade, {
            toValue: 1,
            duration: 400,
            delay: 250,
            useNativeDriver: true,
        }).start();

        Animated.parallel([
            Animated.timing(cardFade, {
                toValue: 1,
                duration: 450,
                delay: 350,
                useNativeDriver: true,
            }),
            Animated.timing(cardSlide, {
                toValue: 0,
                duration: 450,
                delay: 350,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleTabChange = (key: TabKey) => {
        setActiveTab(key);
        setAnimKey((k) => k + 1);
    };

    const content = TAB_CONTENT[activeTab];

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
                        color="#4CAF50"
                    />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Plant name ── */}
                <Animated.Text
                    style={[styles.plantName, { opacity: headerFade }]}
                >
                    {cropName} ({scientificName})
                </Animated.Text>

                {/* ── Plant illustration ── */}
                <Animated.View
                    style={[
                        styles.illustrationCard,
                        {
                            opacity: imageFade,
                            transform: [{ scale: imageScale }],
                        },
                    ]}
                >
                    <View style={styles.illustrationInner}>
                        <MaterialCommunityIcons
                            name={cropIcon as any}
                            size={80}
                            color="#4CAF50"
                        />
                        <Text style={styles.illustrationLabel}>
                            {cropName}
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Tabs ── */}
                <Animated.View
                    style={[styles.tabsRow, { opacity: tabsFade }]}
                >
                    {TABS.map((tab) => (
                        <TabButton
                            key={tab.key}
                            tab={tab}
                            active={activeTab === tab.key}
                            onPress={() => handleTabChange(tab.key)}
                        />
                    ))}
                </Animated.View>

                {/* ── Content Card ── */}
                <Animated.View
                    style={[
                        styles.contentCard,
                        {
                            opacity: cardFade,
                            transform: [{ translateY: cardSlide }],
                        },
                    ]}
                >
                    <Text style={styles.contentTitle}>{content.title}</Text>

                    {content.rows.map((row, i) => (
                        <React.Fragment key={row.label}>
                            <SpecRowItem
                                label={row.label}
                                value={row.value}
                                delay={i * 80}
                                animKey={animKey}
                            />
                            {i < content.rows.length - 1 && (
                                <View style={styles.rowDivider} />
                            )}
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
    container: {
        flex: 1,
        backgroundColor: '#F1F8E9',
    },

    // ── Header ──
    header: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'web' ? 20 : 10,
        paddingBottom: 4,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 6,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4CAF50',
        marginLeft: 4,
    },

    // ── Scroll ──
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },

    // ── Plant name ──
    plantName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 14,
    },

    // ── Illustration ──
    illustrationCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
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
    illustrationInner: {
        height: 200,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustrationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: 8,
    },

    // ── Tabs ──
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 16,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#fff',
        minWidth: 70,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
            },
            android: { elevation: 1 },
            web: {
                // @ts-ignore
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            },
        }),
    },
    tabButtonActive: {
        backgroundColor: '#4CAF50',
        ...Platform.select({
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
            },
            android: { elevation: 4 },
            web: {
                // @ts-ignore
                boxShadow: '0 3px 10px rgba(76,175,80,0.25)',
            },
        }),
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#757575',
        marginTop: 4,
    },
    tabLabelActive: {
        color: '#fff',
    },

    // ── Content Card ──
    contentCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 22,
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
    contentTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#4CAF50',
        marginBottom: 18,
    },
    specRow: {
        paddingVertical: 10,
    },
    specLabel: {
        fontSize: 13,
        color: '#9E9E9E',
        marginBottom: 3,
    },
    specValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4CAF50',
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
    },
});

export default PlantSpecsScreen;
