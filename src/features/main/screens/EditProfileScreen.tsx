/**
 * EditProfileScreen — Edit user profile form with avatar,
 * badge, and editable fields. Static demo with mock data.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Animated,
    KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ═══════════════════════════════════════════
// ██  MOCK DATA
// ═══════════════════════════════════════════

const INITIAL_DATA = {
    initials: 'AO',
    badge: 'Cultivador a Gran Escala',
    name: 'Abiel',
    email: 'ana.lopez@email.com',
    phone: '+34 612 345 678',
    bio: '',
};

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    // ── Form state ──
    const [name, setName] = useState(INITIAL_DATA.name);
    const [email, setEmail] = useState(INITIAL_DATA.email);
    const [phone, setPhone] = useState(INITIAL_DATA.phone);
    const [bio, setBio] = useState(INITIAL_DATA.bio);

    // ── Animations ──
    const headerFade = useRef(new Animated.Value(0)).current;
    const avatarScale = useRef(new Animated.Value(0.5)).current;
    const formSlide = useRef(new Animated.Value(40)).current;
    const formFade = useRef(new Animated.Value(0)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Header
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Avatar bounce
        Animated.spring(avatarScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            delay: 150,
            useNativeDriver: true,
        }).start();

        // Form card
        Animated.parallel([
            Animated.timing(formFade, {
                toValue: 1,
                duration: 500,
                delay: 250,
                useNativeDriver: true,
            }),
            Animated.timing(formSlide, {
                toValue: 0,
                duration: 500,
                delay: 250,
                useNativeDriver: true,
            }),
        ]).start();

        // Save button
        Animated.timing(buttonFade, {
            toValue: 1,
            duration: 400,
            delay: 500,
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
                <Text style={styles.headerTitle}>Editar Perfil</Text>
            </Animated.View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Avatar Section ── */}
                    <Animated.View
                        style={[
                            styles.avatarSection,
                            { transform: [{ scale: avatarScale }] },
                        ]}
                    >
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitials}>
                                    {INITIAL_DATA.initials}
                                </Text>
                            </View>
                            <View style={styles.cameraBadge}>
                                <MaterialCommunityIcons
                                    name="camera"
                                    size={14}
                                    color="#fff"
                                />
                            </View>
                        </View>
                        <Text style={styles.badgeText}>
                            {INITIAL_DATA.badge}
                        </Text>
                    </Animated.View>

                    {/* ── Form Card ── */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            {
                                opacity: formFade,
                                transform: [{ translateY: formSlide }],
                            },
                        ]}
                    >
                        {/* Nombre completo */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>
                                Nombre completo
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholder="Tu nombre"
                                placeholderTextColor="#BDBDBD"
                            />
                        </View>

                        {/* Correo electrónico */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>
                                Correo electrónico
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="correo@ejemplo.com"
                                placeholderTextColor="#BDBDBD"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Teléfono */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Teléfono</Text>
                            <TextInput
                                style={styles.textInput}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+34 600 000 000"
                                placeholderTextColor="#BDBDBD"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Biografía */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Biografía</Text>
                            <TextInput
                                style={[styles.textInput, styles.bioInput]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Cuéntanos sobre ti..."
                                placeholderTextColor="#BDBDBD"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </Animated.View>

                    {/* ── Save Button ── */}
                    <Animated.View style={{ opacity: buttonFade }}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name="content-save-outline"
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.saveButtonText}>
                                Guardar Cambios
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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

    // ── Avatar Section ──
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#fff',
        borderRadius: 20,
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
    avatarWrapper: {
        position: 'relative',
        marginBottom: 10,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#E8F5E9',
    },
    avatarInitials: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFC107',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // ── Form Card ──
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
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
    fieldGroup: {
        marginBottom: 18,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#4CAF50',
        borderWidth: 1,
        borderColor: '#E8F5E9',
    },
    bioInput: {
        height: 100,
        paddingTop: 14,
    },

    // ── Save Button ──
    saveButton: {
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
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default EditProfileScreen;
