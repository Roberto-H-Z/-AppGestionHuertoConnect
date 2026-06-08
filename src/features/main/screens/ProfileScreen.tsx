/**
 * ProfileScreen — User profile with info, stats, menu options,
 * and logout. Static demo with mock data.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../auth/services/AuthContext';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';
import { huertoService } from '../services/huertoService';
import { AppScreenHeader } from '../components';
import { palette, radii, shadows } from '../theme';


// ═══════════════════════════════════════════
// ██  TYPES
// ═══════════════════════════════════════════

interface StatItemProps {
    value: string | number;
    label: string;
    delay: number;
    focusKey: number;
}

interface MenuItemProps {
    icon: string;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    delay: number;
    focusKey: number;
}

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const MENU_ITEMS = [
    {
        icon: 'account-edit-outline',
        label: 'Editar Perfil',
        route: 'EditProfile',
    },
    {
        icon: 'map-marker-radius-outline',
        label: 'Mi Terreno y Riego',
        subtitle: 'Ver configuración inicial',
        route: 'MyLand',
    },
    {
        icon: 'history',
        label: 'Historial de Cosechas',
        route: 'HarvestHistory',
    },
    {
        icon: 'bell-outline',
        label: 'Configuración de Notificaciones',
        route: 'NotificationSettings',
    },
];

// ═══════════════════════════════════════════
// ██  STAT ITEM
// ═══════════════════════════════════════════

const StatItem: React.FC<StatItemProps> = ({ value, label, delay, focusKey }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Reset values before replaying
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
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
    }, [focusKey]);

    return (
        <Animated.View
            style={[
                styles.statItem,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MENU ITEM
// ═══════════════════════════════════════════

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, subtitle, onPress, delay, focusKey }) => {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Reset values before replaying
        slideAnim.setValue(30);
        fadeAnim.setValue(0);

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
    }, [focusKey]);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
            }}
        >
            <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.6}
                onPress={onPress}
            >
                <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                        <MaterialCommunityIcons
                            name={icon as any}
                            size={20}
                            color={palette.primary}
                        />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuLabel}>{label}</Text>
                        {subtitle && (
                            <Text style={styles.menuSubtitle}>{subtitle}</Text>
                        )}
                    </View>
                </View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#D1D5DB"
                />
            </TouchableOpacity>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { signOut, user } = useAuth();
    const [focusKey, setFocusKey] = useState(0);
    const [farmerPerfil, setFarmerPerfil] = useState('Cultivador');
    const [accesoAgua, setAccesoAgua] = useState('Por definir');
    const [huertosCount, setHuertosCount] = useState(0);

    // ── Animations ──
    const headerFade = useRef(new Animated.Value(0)).current;
    const avatarScale = useRef(new Animated.Value(0.5)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(40)).current;
    const logoutFade = useRef(new Animated.Value(0)).current;

    // Helper to calculate active days from user registration date
    const getActiveDays = useCallback(() => {
        if (!user?.created_at) return 1;
        try {
            const diffTime = Math.abs(new Date().getTime() - new Date(user.created_at).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays || 1;
        } catch (err) {
            return 1;
        }
    }, [user?.created_at]);

    // Replay all animations every time this tab gains focus
    useFocusEffect(
        useCallback(() => {
            // Reset all animated values
            headerFade.setValue(0);
            avatarScale.setValue(0.5);
            cardFade.setValue(0);
            cardSlide.setValue(40);
            logoutFade.setValue(0);

            // Fetch local preferences (perfil & agua) & get Huertos count dynamically
            Promise.all([
                tokenStorage.getItem('huertoconnect_farmer_perfil'),
                tokenStorage.getItem('huertoconnect_farmer_acceso_agua'),
                huertoService.getHuertos().catch(() => [])
            ]).then(([perfil, agua, huertos]) => {
                if (perfil) setFarmerPerfil(perfil);
                if (agua) setAccesoAgua(agua);
                setHuertosCount(huertos.length);
            }).catch(e => console.log('Error loading local profile settings:', e));

            // Increment key so children (StatItem, MenuItem) also replay
            setFocusKey((k) => k + 1);

            // Header fade in
            Animated.timing(headerFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

            // Avatar bounce in
            Animated.spring(avatarScale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                delay: 150,
                useNativeDriver: true,
            }).start();

            // User card slide up
            Animated.parallel([
                Animated.timing(cardFade, {
                    toValue: 1,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(cardSlide, {
                    toValue: 0,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Logout button fade
            Animated.timing(logoutFade, {
                toValue: 1,
                duration: 400,
                delay: 700,
                useNativeDriver: true,
            }).start();
        }, [user])
    );

    const handleLogout = async () => {
        await signOut(); // Limpia la sesión y el JWT
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <AppScreenHeader
                    eyebrow="Cuenta"
                    title="Mi perfil"
                    subtitle="Tu actividad, terreno y preferencias."
                    icon="account-circle-outline"
                    actions={[{
                        icon: 'account-edit-outline',
                        label: 'Editar perfil',
                        onPress: () => navigation.navigate('EditProfile'),
                    }]}
                />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── User Info Card ── */}
                <Animated.View
                    style={[
                        styles.userCard,
                        {
                            opacity: cardFade,
                            transform: [{ translateY: cardSlide }],
                        },
                    ]}
                >
                    {/* Avatar */}
                    <Animated.View
                        style={[
                            styles.avatarContainer,
                            { transform: [{ scale: avatarScale }] },
                        ]}
                    >
                        <View style={styles.avatarCircle}>
                            <MaterialCommunityIcons
                                name="account-outline"
                                size={44}
                                color="#fff"
                            />
                        </View>
                    </Animated.View>

                    {/* Name & Badge */}
                    <Text style={styles.userName}>
                        {user ? `${user.nombre} ${user.apellidos}`.trim() : 'Cargando...'}
                    </Text>
                    <View style={styles.badgeContainer}>
                        <MaterialCommunityIcons name="sprout" size={14} color={palette.primary} />
                        <Text style={styles.badgeText}>{farmerPerfil}</Text>
                    </View>
                    <View style={styles.waterRow}>
                        <MaterialCommunityIcons name="water-outline" size={15} color={palette.sage} />
                        <Text style={styles.waterText}>Acceso al agua: {accesoAgua}</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatItem
                            value={huertosCount}
                            label="Huertos"
                            delay={300}
                            focusKey={focusKey}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value={getActiveDays()}
                            label={'Días\nactivo'}
                            delay={400}
                            focusKey={focusKey}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value={0}
                            label={'Tips\ncompartidos'}
                            delay={500}
                            focusKey={focusKey}
                        />
                    </View>
                </Animated.View>

                {/* ── Menu Card ── */}
                <View style={styles.menuCard}>
                    {MENU_ITEMS.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <MenuItem
                                icon={item.icon}
                                label={item.label}
                                subtitle={item.subtitle}
                                onPress={() => navigation.navigate(item.route)}
                                delay={450 + index * 80}
                                focusKey={focusKey}
                            />
                            {index < MENU_ITEMS.length - 1 && (
                                <View style={styles.menuDivider} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* ── Logout Button ── */}
                <Animated.View style={{ opacity: logoutFade }}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        activeOpacity={0.7}
                        onPress={handleLogout}
                    >
                        <MaterialCommunityIcons
                            name="logout"
                            size={20}
                            color="#E53935"
                        />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Bottom spacer for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.canvas },

    // ── Header ──────────────────────────────────────────────────────────
    header: {
        backgroundColor: palette.canvas,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },

    // ── Scroll ──────────────────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

    // ── User Card ────────────────────────────────────────────────────────
    userCard: {
        backgroundColor: palette.forest,
        borderRadius: radii.large,
        paddingVertical: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 14,
        ...shadows.card,
    },

    // ── Avatar ──────────────────────────────────────────────────────────
    avatarContainer: { marginBottom: 14 },
    avatarCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },

    // ── User Info ────────────────────────────────────────────────────────
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.4,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    badgeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    waterRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -10, marginBottom: 18 },
    waterText: { color: '#C4D4C9', fontSize: 12 },

    // ── Stats ────────────────────────────────────────────────────────────
    statsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        width: '100%', paddingTop: 8,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
    statLabel: { fontSize: 12, color: '#B9CBBF', marginTop: 2, textAlign: 'center' },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.14)' },

    // ── Menu Card ────────────────────────────────────────────────────────
    menuCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.large,
        paddingVertical: 6,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: palette.border,
        ...shadows.card,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuIconContainer: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    menuTextContainer: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
    menuSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },

    // ── Logout ───────────────────────────────────────────────────────────
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 16,
        borderWidth: 1, borderColor: '#FEE2E2', gap: 8,
        elevation: 2, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 6,
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});

export default ProfileScreen;
