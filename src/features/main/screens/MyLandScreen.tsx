/**
 * MyLandScreen — Displays the user's terrain and irrigation
 * configuration in a read-only view.
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
import { perfilAgricultorService } from '../../onboarding/services/perfilAgricultorService';
import { palette } from '../theme';

export const MyLandScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const headerFade = useRef(new Animated.Value(0)).current;
    const card1Fade = useRef(new Animated.Value(0)).current;
    const card1Slide = useRef(new Animated.Value(28)).current;
    const card2Fade = useRef(new Animated.Value(0)).current;
    const card2Slide = useRef(new Animated.Value(28)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;

    const [userData, setUserData] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            perfilAgricultorService.getMyProfile()
                .then((profile) => setUserData(profile || null))
                .catch(e => {
                    console.log('Error fetching user data:', e);
                    setUserData(null);
                });

            Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: false }).start();
            Animated.parallel([
                Animated.timing(card1Fade, { toValue: 1, duration: 450, delay: 150, useNativeDriver: false }),
                Animated.timing(card1Slide, { toValue: 0, duration: 450, delay: 150, useNativeDriver: false }),
            ]).start();
            Animated.parallel([
                Animated.timing(card2Fade, { toValue: 1, duration: 450, delay: 300, useNativeDriver: false }),
                Animated.timing(card2Slide, { toValue: 0, duration: 450, delay: 300, useNativeDriver: false }),
            ]).start();
            Animated.timing(buttonFade, { toValue: 1, duration: 400, delay: 500, useNativeDriver: false }).start();
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Terreno y Riego</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Intro banner */}
                <View style={styles.introBanner}>
                    <View style={styles.introIconBg}>
                        <MaterialCommunityIcons name="map-marker-radius-outline" size={26} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.introTitle}>Huerto Los Cedros</Text>
                        <Text style={styles.introSubtitle}>Terreno listo para monitoreo y riego diario</Text>
                    </View>
                </View>

                {/* Ubicación Card */}
                <Animated.View style={[styles.card, { opacity: card1Fade, transform: [{ translateY: card1Slide }] }]}>
                    <View style={styles.cardLabel}>
                        <View style={[styles.cardIconBg, { backgroundColor: '#E0F2FE' }]}>
                            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#0891B2" />
                        </View>
                        <Text style={styles.cardLabelText}>Ubicación</Text>
                    </View>
                    <Text style={styles.cardValue}>{userData?.ubicacion || '--'}</Text>
                </Animated.View>

                {/* Sistema de Riego Card */}
                <Animated.View style={[styles.card, { opacity: card2Fade, transform: [{ translateY: card2Slide }] }]}>
                    <View style={styles.cardLabel}>
                        <View style={[styles.cardIconBg, { backgroundColor: '#ECFDF5' }]}>
                            <MaterialCommunityIcons name="water-outline" size={20} color="#059669" />
                        </View>
                        <Text style={styles.cardLabelText}>Sistema de Riego</Text>
                    </View>
                    <Text style={styles.cardValue}>{userData?.acceso_agua || '--'}</Text>
                    <View style={styles.cardBadge}>
                        <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                        <Text style={styles.cardBadgeText}>Activo</Text>
                    </View>
                </Animated.View>

                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="terrain" size={20} color={palette.primary} />
                        <Text style={styles.metricLabel}>Suelo</Text>
                        <Text style={styles.metricValue}>{userData?.suelo || '--'}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#D89532" />
                        <Text style={styles.metricLabel}>Luz diaria</Text>
                        <Text style={styles.metricValue}>{userData?.luz || '--'}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="sprinkler-variant" size={20} color="#0891B2" />
                        <Text style={styles.metricLabel}>Riego</Text>
                        <Text style={styles.metricValue}>3 zonas por goteo</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#7C3AED" />
                        <Text style={styles.metricLabel}>Pendiente</Text>
                        <Text style={styles.metricValue}>{userData?.pendiente || '--'}</Text>
                    </View>
                </View>

                {/* Info row */}
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="information-outline" size={15} color="#9CA3AF" />
                    <Text style={styles.infoText}>Simulación activa con datos de operación del huerto.</Text>
                </View>

                {/* Edit Button */}
                <Animated.View style={{ opacity: buttonFade }}>
                    <TouchableOpacity
                        style={styles.editButton}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={19} color="#fff" />
                        <Text style={styles.editButtonText}>Editar Configuración</Text>
                    </TouchableOpacity>
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

    // ── Intro Banner ──────────────────────────────────────────
    introBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#ECFDF5', borderRadius: 18, padding: 16, marginBottom: 14,
        borderWidth: 1, borderColor: '#D1FAE5',
    },
    introIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    introTitle: { fontSize: 15, fontWeight: '700', color: '#065F46', letterSpacing: -0.2 },
    introSubtitle: { fontSize: 13, color: '#059669', marginTop: 2, fontWeight: '500' },

    // ── Cards ─────────────────────────────────────────────────
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    cardLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    cardIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardLabelText: { fontSize: 13, fontWeight: '600', color: '#6B7280', letterSpacing: 0.1 },
    cardValue: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.3, paddingLeft: 4 },
    cardBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, alignSelf: 'flex-start', marginTop: 10,
    },
    cardBadgeText: { fontSize: 12, fontWeight: '600', color: '#059669' },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    metricCard: {
        width: '47.5%',
        minHeight: 126,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    metricLabel: { marginTop: 9, fontSize: 12, color: '#6B7280', fontWeight: '700' },
    metricValue: { marginTop: 4, fontSize: 13, color: '#111827', lineHeight: 18, fontWeight: '600' },

    // ── Info Row ──────────────────────────────────────────────
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, paddingHorizontal: 4 },
    infoText: { fontSize: 12.5, color: '#9CA3AF', fontStyle: 'italic' },

    // ── Edit Button ───────────────────────────────────────────
    editButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#059669', borderRadius: 18, paddingVertical: 16, gap: 8,
        shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    editButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default MyLandScreen;
