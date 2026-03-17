/**
 * SplashScreen — Animated welcome screen shown on app launch.
 * Now checks for an existing Supabase session and optionally runs
 * biometric authentication before navigating the user.
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../config/providers/AuthProvider';
import * as biometricService from '../../auth/services/biometricService';
import * as authServiceModule from '../../auth/services/authService';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { loading: authLoading } = useAuth();

    // ── Animation values ──
    const bgFade = useRef(new Animated.Value(0)).current;
    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(30)).current;
    const titleScale = useRef(new Animated.Value(0.85)).current;
    const dividerWidth = useRef(new Animated.Value(0)).current;
    const dividerFade = useRef(new Animated.Value(0)).current;
    const iconFade = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(0.3)).current;
    const iconBounce = useRef(new Animated.Value(0)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;
    const buttonSlide = useRef(new Animated.Value(40)).current;
    const buttonScale = useRef(new Animated.Value(0.8)).current;

    // Continuous floating animation for the icon
    const floatAnim = useRef(new Animated.Value(0)).current;

    // Subtle pulse for the button
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // ── Staggered entrance sequence ──

        // 1. Background fade in
        Animated.timing(bgFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // 2. Title: fade + slide up + scale in
        Animated.parallel([
            Animated.timing(titleFade, {
                toValue: 1,
                duration: 700,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(titleSlide, {
                toValue: 0,
                duration: 700,
                delay: 300,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.spring(titleScale, {
                toValue: 1,
                friction: 5,
                tension: 50,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // 3. Divider: expand from center
        Animated.parallel([
            Animated.timing(dividerFade, {
                toValue: 1,
                duration: 400,
                delay: 750,
                useNativeDriver: true,
            }),
            Animated.timing(dividerWidth, {
                toValue: 1,
                duration: 600,
                delay: 750,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // 4. Icon: pop in with bounce
        Animated.parallel([
            Animated.timing(iconFade, {
                toValue: 1,
                duration: 500,
                delay: 1100,
                useNativeDriver: true,
            }),
            Animated.spring(iconScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                delay: 1100,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.delay(1100),
                Animated.timing(iconBounce, {
                    toValue: -15,
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(iconBounce, {
                    toValue: 0,
                    friction: 3,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // 5. Button: fade + slide up + scale
        Animated.parallel([
            Animated.timing(buttonFade, {
                toValue: 1,
                duration: 600,
                delay: 1600,
                useNativeDriver: true,
            }),
            Animated.timing(buttonSlide, {
                toValue: 0,
                duration: 600,
                delay: 1600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.spring(buttonScale, {
                toValue: 1,
                friction: 5,
                tension: 50,
                delay: 1600,
                useNativeDriver: true,
            }),
        ]).start();

        // ── Continuous animations ──

        // Floating icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -8,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 8,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();

        // Pulsing button
        Animated.loop(
            Animated.sequence([
                Animated.delay(2200),
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const handleStart = async () => {
        // Wait for auth to finish loading
        if (authLoading) {
            navigation.replace('Login');
            return;
        }

        try {
            // Check for existing session
            const { session } = await authServiceModule.getSession();

            if (session && session.user) {
                // Session exists — check if biometric is enabled for this user
                const biometricEnabled = await biometricService.isBiometricEnabled(
                    session.user.id
                );
                const biometricAvailable = await biometricService.isBiometricAvailable();

                if (biometricEnabled && biometricAvailable) {
                    // Request biometric authentication
                    const { success } = await biometricService.authenticate(
                        'Verifica tu identidad para continuar'
                    );

                    if (success) {
                        navigation.replace('Main');
                    } else {
                        // Biometric failed/cancelled — go to login
                        navigation.replace('Login');
                    }
                } else {
                    // Session exists but no biometric — go straight to Main
                    navigation.replace('Main');
                }
            } else {
                // No session — go to Login
                navigation.replace('Login');
            }
        } catch {
            // Any error — fallback to Login
            navigation.replace('Login');
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: bgFade }]}>
            <StatusBar style="dark" />

            {/* ── Top spacer ── */}
            <View style={styles.topSpacer} />

            {/* ── Center content ── */}
            <View style={styles.centerContent}>
                {/* Title */}
                <Animated.Text
                    style={[
                        styles.title,
                        {
                            opacity: titleFade,
                            transform: [
                                { translateY: titleSlide },
                                { scale: titleScale },
                            ],
                        },
                    ]}
                >
                    HuertoConnect
                </Animated.Text>

                {/* Divider */}
                <Animated.View
                    style={[
                        styles.divider,
                        {
                            opacity: dividerFade,
                            transform: [
                                {
                                    scaleX: dividerWidth,
                                },
                            ],
                        },
                    ]}
                />

                {/* Plant icon */}
                <Animated.View
                    style={[
                        styles.iconWrap,
                        {
                            opacity: iconFade,
                            transform: [
                                { scale: iconScale },
                                {
                                    translateY: Animated.add(
                                        iconBounce,
                                        floatAnim
                                    ),
                                },
                            ],
                        },
                    ]}
                >
                    <MaterialCommunityIcons
                        name="sprout"
                        size={64}
                        color="#4CAF50"
                    />
                </Animated.View>
            </View>

            {/* ── Button ── */}
            <Animated.View
                style={[
                    styles.buttonWrap,
                    {
                        opacity: buttonFade,
                        transform: [
                            { translateY: buttonSlide },
                            { scale: Animated.multiply(buttonScale, pulseAnim) },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={handleStart}
                    activeOpacity={0.8}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Comenzar</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Bottom spacer ── */}
            <View style={styles.bottomSpacer} />
        </Animated.View>
    );
};

// ════════════════════════════════════════
// ██  STYLES
// ════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F8E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topSpacer: {
        flex: 1.2,
    },

    // ── Center content ──
    centerContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#2E7D32',
        letterSpacing: 0.5,
    },
    divider: {
        width: 80,
        height: 3,
        backgroundColor: '#4CAF50',
        borderRadius: 2,
        marginTop: 16,
        marginBottom: 20,
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Button ──
    buttonWrap: {
        marginTop: 50,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    bottomSpacer: {
        flex: 1,
    },
});

export default SplashScreen;
