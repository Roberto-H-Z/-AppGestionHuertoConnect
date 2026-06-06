/**
 * NotificationSettingsScreen — Toggle notification preferences
 * with banner, categorized toggles, and schedule section.
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

interface NotifOption {
    key: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    subtitle: string;
    defaultValue: boolean;
}

const NOTIFICATION_OPTIONS: NotifOption[] = [
    { key: 'watering', icon: 'water-outline', iconColor: '#0891B2', iconBg: '#E0F2FE', label: 'Recordatorios de Riego', subtitle: 'Notificaciones para regar tus cultivos', defaultValue: true },
    { key: 'weather', icon: 'weather-partly-cloudy', iconColor: '#7C3AED', iconBg: '#EDE9FE', label: 'Alertas Meteorológicas', subtitle: 'Avisos sobre condiciones climáticas adversas', defaultValue: true },
    { key: 'pests', icon: 'bug-outline', iconColor: '#DC2626', iconBg: '#FEE2E2', label: 'Alertas de Plagas', subtitle: 'Detección temprana de problemas en tus plantas', defaultValue: true },
    { key: 'harvest', icon: 'basket-outline', iconColor: '#059669', iconBg: '#ECFDF5', label: 'Recordatorios de Cosecha', subtitle: 'Avisos cuando sea momento de cosechar', defaultValue: true },
    { key: 'community', icon: 'chat-outline', iconColor: '#6B7280', iconBg: '#F3F4F6', label: 'Actividad de Comunidad', subtitle: 'Comentarios y respuestas a tus posts', defaultValue: false },
    { key: 'tips', icon: 'lightbulb-outline', iconColor: '#D97706', iconBg: '#FEF3C7', label: 'Tips y Consejos', subtitle: 'Recomendaciones personalizadas para tu huerto', defaultValue: true },
];

const ToggleRow: React.FC<{
    icon: string; iconColor: string; iconBg: string;
    label: string; subtitle: string; value: boolean;
    onToggle: (val: boolean) => void; delay: number;
}> = ({ icon, iconColor, iconBg, label, subtitle, value, onToggle, delay }) => {
    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                    <View style={[styles.toggleIconBg, { backgroundColor: iconBg }]}>
                        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
                    </View>
                    <View style={styles.toggleTextContainer}>
                        <Text style={styles.toggleLabel}>{label}</Text>
                        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
                    </View>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#E5E7EB', true: '#059669' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#E5E7EB"
                />
            </View>
        </Animated.View>
    );
};

export const NotificationSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const headerFade = useRef(new Animated.Value(0)).current;
    const bannerFade = useRef(new Animated.Value(0)).current;
    const bannerSlide = useRef(new Animated.Value(20)).current;
    const scheduleFade = useRef(new Animated.Value(0)).current;
    const scheduleSlide = useRef(new Animated.Value(20)).current;

    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        NOTIFICATION_OPTIONS.forEach((opt) => { initial[opt.key] = opt.defaultValue; });
        initial['doNotDisturb'] = true;
        return initial;
    });

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        Animated.parallel([
            Animated.timing(bannerFade, { toValue: 1, duration: 450, delay: 100, useNativeDriver: true }),
            Animated.timing(bannerSlide, { toValue: 0, duration: 450, delay: 100, useNativeDriver: true }),
        ]).start();
        Animated.parallel([
            Animated.timing(scheduleFade, { toValue: 1, duration: 450, delay: 700, useNativeDriver: true }),
            Animated.timing(scheduleSlide, { toValue: 0, duration: 450, delay: 700, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleToggle = (key: string, val: boolean) => {
        setToggles((prev) => ({ ...prev, [key]: val }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Banner Card */}
                <Animated.View style={[styles.bannerCard, { opacity: bannerFade, transform: [{ translateY: bannerSlide }] }]}>
                    <View style={styles.bannerIconBg}>
                        <MaterialCommunityIcons name="bell-ring-outline" size={28} color="#059669" />
                    </View>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Mantente Informado</Text>
                        <Text style={styles.bannerSubtitle}>
                            Activa las notificaciones para recibir recordatorios importantes y mantener tu huerto saludable.
                        </Text>
                    </View>
                </Animated.View>

                {/* Toggles Card */}
                <View style={styles.togglesCard}>
                    {NOTIFICATION_OPTIONS.map((opt, index) => (
                        <React.Fragment key={opt.key}>
                            <ToggleRow
                                icon={opt.icon}
                                iconColor={opt.iconColor}
                                iconBg={opt.iconBg}
                                label={opt.label}
                                subtitle={opt.subtitle}
                                value={toggles[opt.key]}
                                onToggle={(val) => handleToggle(opt.key, val)}
                                delay={200 + index * 65}
                            />
                            {index < NOTIFICATION_OPTIONS.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Schedule Card */}
                <Animated.View style={[styles.scheduleCard, { opacity: scheduleFade, transform: [{ translateY: scheduleSlide }] }]}>
                    <View style={styles.scheduleHeader}>
                        <View style={[styles.toggleIconBg, { backgroundColor: '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="moon-waning-crescent" size={18} color="#6B7280" />
                        </View>
                        <Text style={styles.scheduleTitle}>Horario de Notificaciones</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                        <View>
                            <Text style={styles.scheduleLabel}>No Molestar</Text>
                            <Text style={styles.scheduleTime}>22:00 – 08:00</Text>
                        </View>
                        <Switch
                            value={toggles['doNotDisturb']}
                            onValueChange={(val) => handleToggle('doNotDisturb', val)}
                            trackColor={{ false: '#E5E7EB', true: '#059669' }}
                            thumbColor="#fff"
                            ios_backgroundColor="#E5E7EB"
                        />
                    </View>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

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
    scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

    // ── Banner ────────────────────────────────────────────────
    bannerCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 14,
        flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14,
        borderWidth: 1, borderColor: '#D1FAE5',
        elevation: 2, shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    },
    bannerIconBg: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    bannerContent: { flex: 1 },
    bannerTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4, letterSpacing: -0.2 },
    bannerSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

    // ── Toggles Card ─────────────────────────────────────────
    togglesCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 6, marginBottom: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    toggleLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 12 },
    toggleIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    toggleTextContainer: { flex: 1 },
    toggleLabel: { fontSize: 14.5, fontWeight: '700', color: '#1F2937', letterSpacing: -0.1 },
    toggleSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 3, lineHeight: 17 },
    divider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },

    // ── Schedule Card ─────────────────────────────────────────
    scheduleCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    scheduleTitle: { fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scheduleLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
    scheduleTime: { fontSize: 13, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
});

export default NotificationSettingsScreen;
