/**
 * MyLandScreen — Displays the user's terrain and irrigation
 * configuration in a read-only view. Static demo with mock data.
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
// ██  MOCK DATA
// ═══════════════════════════════════════════

const LAND_DATA = {
    location: 'current',
    width: 10,
    length: 10,
    totalArea: 100,
    irrigationSystem: 'constant',
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const MyLandScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    // ── Animations ──
    const headerFade = useRef(new Animated.Value(0)).current;
    const card1Fade = useRef(new Animated.Value(0)).current;
    const card1Slide = useRef(new Animated.Value(30)).current;
    const card2Fade = useRef(new Animated.Value(0)).current;
    const card2Slide = useRef(new Animated.Value(30)).current;
    const card3Fade = useRef(new Animated.Value(0)).current;
    const card3Slide = useRef(new Animated.Value(30)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Card 1: Ubicación
        Animated.parallel([
            Animated.timing(card1Fade, {
                toValue: 1,
                duration: 450,
                delay: 150,
                useNativeDriver: true,
            }),
            Animated.timing(card1Slide, {
                toValue: 0,
                duration: 450,
                delay: 150,
                useNativeDriver: true,
            }),
        ]).start();

        // Card 2: Dimensiones
        Animated.parallel([
            Animated.timing(card2Fade, {
                toValue: 1,
                duration: 450,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(card2Slide, {
                toValue: 0,
                duration: 450,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Card 3: Sistema de Riego
        Animated.parallel([
            Animated.timing(card3Fade, {
                toValue: 1,
                duration: 450,
                delay: 450,
                useNativeDriver: true,
            }),
            Animated.timing(card3Slide, {
                toValue: 0,
                duration: 450,
                delay: 450,
                useNativeDriver: true,
            }),
        ]).start();

        // Button
        Animated.timing(buttonFade, {
            toValue: 1,
            duration: 400,
            delay: 600,
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
                <Text style={styles.headerTitle}>Mi Terreno y Riego</Text>
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Ubicación Card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: card1Fade,
                            transform: [{ translateY: card1Slide }],
                        },
                    ]}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={22}
                                color="#4CAF50"
                            />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Ubicación</Text>
                            <Text style={styles.cardSubtitle}>
                                {LAND_DATA.location}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Dimensiones Card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: card2Fade,
                            transform: [{ translateY: card2Slide }],
                        },
                    ]}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name="square-outline"
                                size={22}
                                color="#4CAF50"
                            />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>
                                Dimensiones del Terreno
                            </Text>
                            <Text style={styles.cardSubtitle}>
                                Configuración actual
                            </Text>
                        </View>
                    </View>

                    {/* Dimension boxes */}
                    <View style={styles.dimensionRow}>
                        <View style={styles.dimensionBox}>
                            <Text style={styles.dimensionLabel}>Ancho</Text>
                            <Text style={styles.dimensionValue}>
                                {LAND_DATA.width}m
                            </Text>
                        </View>
                        <View style={styles.dimensionBox}>
                            <Text style={styles.dimensionLabel}>Largo</Text>
                            <Text style={styles.dimensionValue}>
                                {LAND_DATA.length}m
                            </Text>
                        </View>
                    </View>

                    {/* Total area banner */}
                    <View style={styles.areaBanner}>
                        <Text style={styles.areaBannerLabel}>Área Total</Text>
                        <Text style={styles.areaBannerValue}>
                            {LAND_DATA.totalArea}m²
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Sistema de Riego Card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: card3Fade,
                            transform: [{ translateY: card3Slide }],
                        },
                    ]}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name="water-outline"
                                size={22}
                                color="#4CAF50"
                            />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>
                                Sistema de Riego
                            </Text>
                            <Text style={styles.cardSubtitle}>
                                {LAND_DATA.irrigationSystem}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Edit Button ── */}
                <Animated.View style={{ opacity: buttonFade }}>
                    <TouchableOpacity
                        style={styles.editButton}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons
                            name="pencil-outline"
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.editButtonText}>
                            Editar Configuración
                        </Text>
                    </TouchableOpacity>
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

    // ── Cards ──
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
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
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#212121',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#9E9E9E',
        marginTop: 2,
    },

    // ── Dimensions ──
    dimensionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    dimensionBox: {
        flex: 1,
        backgroundColor: '#F1F8E9',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    dimensionLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 4,
    },
    dimensionValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#4CAF50',
    },

    // ── Area Banner ──
    areaBanner: {
        backgroundColor: '#4CAF50',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 14,
    },
    areaBannerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E8F5E9',
        marginBottom: 2,
    },
    areaBannerValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },

    // ── Edit Button ──
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        paddingVertical: 16,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: { elevation: 4 },
            web: {
                // @ts-ignore
                boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
            },
        }),
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default MyLandScreen;
