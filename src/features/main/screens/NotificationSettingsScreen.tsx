/**
 * NotificationSettingsScreen — Toggle notification preferences
 * with banner, categorized toggles, and schedule section.
 * Static demo with local state toggles.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    Platform,
    Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ═══════════════════════════════════════════
// ██  TYPES & DATA
// ═══════════════════════════════════════════

interface NotifOption {
    key: string;
    icon: string;
    iconColor: string;
    label: string;
    subtitle: string;
    defaultValue: boolean;
}

const NOTIFICATION_OPTIONS: NotifOption[] = [
    {
        key: 'watering',
        icon: 'water-outline',
        iconColor: '#4CAF50',
        label: 'Recordatorios de Riego',
        subtitle: 'Notificaciones para regar tus cultivos',
        defaultValue: true,
    },
    {
        key: 'weather',
        icon: 'weather-partly-cloudy',
        iconColor: '#4CAF50',
        label: 'Alertas Meteorológicas',
        subtitle: 'Avisos sobre condiciones climáticas adversas',
        defaultValue: true,
    },
    {
        key: 'pests',
        icon: 'bug-outline',
        iconColor: '#E53935',
        label: 'Alertas de Plagas',
        subtitle: 'Detección temprana de problemas en tus plantas',
        defaultValue: true,
    },
    {
        key: 'harvest',
        icon: 'basket-outline',
        iconColor: '#4CAF50',
        label: 'Recordatorios de Cosecha',
        subtitle: 'Avisos cuando sea momento de cosechar',
        defaultValue: true,
    },
    {
        key: 'community',
        icon: 'chat-outline',
        iconColor: '#757575',
        label: 'Actividad de Comunidad',
        subtitle: 'Comentarios y respuestas a tus posts',
        defaultValue: false,
    },
    {
        key: 'tips',
        icon: 'bell-outline',
        iconColor: '#FFC107',
        label: 'Tips y Consejos',
        subtitle: 'Recomendaciones personalizadas para tu huerto',
        defaultValue: true,
    },
];

// ═══════════════════════════════════════════
// ██  TOGGLE ROW COMPONENT
// ═══════════════════════════════════════════

interface ToggleRowProps {
    icon: string;
    iconColor: string;
    label: string;
    subtitle: string;
    value: boolean;
    onToggle: (val: boolean) => void;
    delay: number;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
    icon,
    iconColor,
    label,
    subtitle,
    value,
    onToggle,
    delay,
}) => {
    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                    <MaterialCommunityIcons
                        name={icon as any}
                        size={22}
                        color={iconColor}
                        style={styles.toggleIcon}
                    />
                    <View style={styles.toggleTextContainer}>
                        <Text style={styles.toggleLabel}>{label}</Text>
                        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
                    </View>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{
                        false: '#E0E0E0',
                        true: '#4CAF50',
                    }}
                    thumbColor="#fff"
                    ios_backgroundColor="#E0E0E0"
                />
            </View>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const NotificationSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const headerFade = useRef(new Animated.Value(0)).current;
    const bannerFade = useRef(new Animated.Value(0)).current;
    const bannerSlide = useRef(new Animated.Value(20)).current;
    const scheduleFade = useRef(new Animated.Value(0)).current;
    const scheduleSlide = useRef(new Animated.Value(20)).current;

    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        NOTIFICATION_OPTIONS.forEach((opt) => {
            initial[opt.key] = opt.defaultValue;
        });
        initial['doNotDisturb'] = true;
        return initial;
    });

    useEffect(() => {
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        Animated.parallel([
            Animated.timing(bannerFade, {
                toValue: 1,
                duration: 450,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.timing(bannerSlide, {
                toValue: 0,
                duration: 450,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.parallel([
            Animated.timing(scheduleFade, {
                toValue: 1,
                duration: 450,
                delay: 700,
                useNativeDriver: true,
            }),
            Animated.timing(scheduleSlide, {
                toValue: 0,
                duration: 450,
                delay: 700,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleToggle = (key: string, val: boolean) => {
        setToggles((prev) => ({ ...prev, [key]: val }));
    };

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
                <Text style={styles.headerTitle}>Notificaciones</Text>
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Banner Card ── */}
                <Animated.View
                    style={[
                        styles.bannerCard,
                        {
                            opacity: bannerFade,
                            transform: [{ translateY: bannerSlide }],
                        },
                    ]}
                >
                    <View style={styles.bannerAccent} />
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>
                            Mantente Informado
                        </Text>
                        <Text style={styles.bannerSubtitle}>
                            Activa las notificaciones para recibir recordatorios
                            importantes y mantener tu huerto saludable.
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Toggles Card ── */}
                <View style={styles.togglesCard}>
                    {NOTIFICATION_OPTIONS.map((opt, index) => (
                        <React.Fragment key={opt.key}>
                            <ToggleRow
                                icon={opt.icon}
                                iconColor={opt.iconColor}
                                label={opt.label}
                                subtitle={opt.subtitle}
                                value={toggles[opt.key]}
                                onToggle={(val) => handleToggle(opt.key, val)}
                                delay={200 + index * 70}
                            />
                            {index < NOTIFICATION_OPTIONS.length - 1 && (
                                <View style={styles.divider} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* ── Schedule Card ── */}
                <Animated.View
                    style={[
                        styles.scheduleCard,
                        {
                            opacity: scheduleFade,
                            transform: [{ translateY: scheduleSlide }],
                        },
                    ]}
                >
                    <Text style={styles.scheduleTitle}>
                        Horario de Notificaciones
                    </Text>
                    <View style={styles.scheduleRow}>
                        <View>
                            <Text style={styles.scheduleLabel}>
                                No Molestar
                            </Text>
                            <Text style={styles.scheduleTime}>
                                22:00 – 08:00
                            </Text>
                        </View>
                        <Switch
                            value={toggles['doNotDisturb']}
                            onValueChange={(val) =>
                                handleToggle('doNotDisturb', val)
                            }
                            trackColor={{
                                false: '#E0E0E0',
                                true: '#4CAF50',
                            }}
                            thumbColor="#fff"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>
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

    // ── Banner ──
    bannerCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
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
    bannerAccent: {
        width: 5,
        backgroundColor: '#4CAF50',
    },
    bannerContent: {
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 16,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 6,
    },
    bannerSubtitle: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 19,
    },

    // ── Toggles Card ──
    togglesCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 6,
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
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 12,
    },
    toggleIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    toggleTextContainer: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4CAF50',
    },
    toggleSubtitle: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 3,
        lineHeight: 17,
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginHorizontal: 18,
    },

    // ── Schedule Card ──
    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
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
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 14,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
    },
    scheduleTime: {
        fontSize: 13,
        color: '#9E9E9E',
        marginTop: 2,
    },
});

export default NotificationSettingsScreen;
