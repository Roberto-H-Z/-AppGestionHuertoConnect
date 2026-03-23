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
import { perfilAgricultorService } from '../../onboarding/services/perfilAgricultorService';

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
                            size={22}
                            color="#4CAF50"
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
                    size={22}
                    color="#BDBDBD"
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
    const { signOut } = useAuth();
    const [focusKey, setFocusKey] = useState(0);
    const [userData, setUserData] = useState<any>(null);

    // ── Animations ──
    const headerFade = useRef(new Animated.Value(0)).current;
    const avatarScale = useRef(new Animated.Value(0.5)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(40)).current;
    const logoutFade = useRef(new Animated.Value(0)).current;

    // Replay all animations every time this tab gains focus
    useFocusEffect(
        useCallback(() => {
            // Reset all animated values
            headerFade.setValue(0);
            avatarScale.setValue(0.5);
            cardFade.setValue(0);
            cardSlide.setValue(40);
            logoutFade.setValue(0);

            // Fetch data
            perfilAgricultorService.getMyProfile()
                .then(setUserData)
                .catch(e => console.log('Error fetching profile:', e));

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
        }, [])
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

            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
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
                        {userData ? `${userData.nombre} ${userData.apellidos}` : 'Cargando...'}
                    </Text>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{userData?.perfil || 'Cultivador'}</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatItem
                            value={userData?.cosechas_id ? 1 : 0}
                            label="Cosechas"
                            delay={300}
                            focusKey={focusKey}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value={0}
                            label={'Días\nactivo'}
                            delay={400}
                            focusKey={focusKey}
                        />
                        <View style={styles.statDivider} />
                        <StatItem
                            value={userData?.tips_compartidos || 0}
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
    container: {
        flex: 1,
        backgroundColor: '#F1F8E9',
    },

    // ── Header ──
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'web' ? 20 : 10,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
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

    // ── User Card ──
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
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

    // ── Avatar ──
    avatarContainer: {
        marginBottom: 14,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#E8F5E9',
    },

    // ── User Info ──
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 6,
    },
    badgeContainer: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 16,
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // ── Stats ──
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1B5E20',
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E0E0E0',
    },

    // ── Menu Card ──
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 6,
        marginBottom: 20,
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
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginHorizontal: 18,
    },

    // ── Logout ──
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#FFCDD2',
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#E53935',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: { elevation: 1 },
            web: {
                // @ts-ignore
                boxShadow: '0 1px 6px rgba(229,57,53,0.08)',
            },
        }),
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E53935',
    },
});

export default ProfileScreen;
