/**
 * EditProfileScreen — Edit user profile form with avatar,
 * badge, and editable fields. Static demo with mock data.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../auth/services/AuthContext';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';
import { apiClient } from '../../../infrastructure/api/apiClient';

// ═══════════════════════════════════════════
// ██  MAIN SCREEN
// ═══════════════════════════════════════════

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, checkSession } = useAuth();

    // ── Form state ──
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [perfil, setPerfil] = useState('');
    const [accesoAgua, setAccesoAgua] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            // Load user data from context
            if (user) {
                setName(`${user.nombre} ${user.apellidos}`.trim());
                setEmail(user.email || '');

                if (user.created_at) {
                    const date = new Date(user.created_at);
                    setCreatedAt(
                        Number.isNaN(date.getTime())
                            ? user.created_at
                            : date.toLocaleDateString('es-MX')
                    );
                } else {
                    setCreatedAt('');
                }
            }

            // Load local farmer settings
            Promise.all([
                tokenStorage.getItem('huertoconnect_farmer_perfil'),
                tokenStorage.getItem('huertoconnect_farmer_acceso_agua')
            ]).then(([perf, agua]) => {
                setPerfil(perf || 'Cultivador');
                setAccesoAgua(agua || 'Por definir');
            }).catch(e => console.log('Error loading local profile config:', e));
        }, [user])
    );

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

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre completo no puede estar vacío.');
            return;
        }
        setIsSaving(true);
        try {
            // Split name into nombre and apellidos
            const parts = name.trim().split(/\s+/);
            const nombre = parts[0] || '';
            const apellidos = parts.slice(1).join(' ') || '';

            // 1. Update Core User details in backend using PATCH /api/usuarios/{user_id}
            if (user?.id) {
                await apiClient.patch(`/usuarios/${user.id}`, {
                    nombre,
                    apellidos,
                    email: email.trim() || undefined
                });
            }

            // 2. Update local storage for farmer-specific fields
            await Promise.all([
                tokenStorage.setItem('huertoconnect_farmer_perfil', perfil.trim()),
                tokenStorage.setItem('huertoconnect_farmer_acceso_agua', accesoAgua.trim())
            ]);

            // 3. Refresh user session in context
            await checkSession();

            Alert.alert('Éxito', 'Perfil actualizado correctamente.');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error saving profile changes:', error);
            Alert.alert('Error', error?.message || 'No se pudieron guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
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
                                    {user ? `${user.nombre?.[0] || ''}${user.apellidos?.[0] || ''}`.toUpperCase() : ''}
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
                            {perfil || 'Cultivador'}
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

                        {/* Perfil de Agricultor */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Perfil de Agricultor</Text>
                            <TextInput
                                style={styles.textInput}
                                value={perfil}
                                onChangeText={setPerfil}
                                placeholder="Tu perfil"
                                placeholderTextColor="#BDBDBD"
                            />
                        </View>

                        {/* Acceso al Agua */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Sistema de Riego / Acceso al Agua</Text>
                            <TextInput
                                style={styles.textInput}
                                value={accesoAgua}
                                onChangeText={setAccesoAgua}
                                placeholder="Tipo de riego"
                                placeholderTextColor="#BDBDBD"
                            />
                        </View>

                        {/* Fecha de Creación */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Miembro desde</Text>
                            <TextInput
                                style={[styles.textInput, { color: '#9E9E9E' }]}
                                value={createdAt}
                                placeholder="..."
                                placeholderTextColor="#BDBDBD"
                                editable={false}
                            />
                        </View>
                    </Animated.View>

                    {/* ── Save Button ── */}
                    <Animated.View style={{ opacity: buttonFade }}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                            activeOpacity={0.8}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons
                                        name="content-save-outline"
                                        size={20}
                                        color="#fff"
                                    />
                                    <Text style={styles.saveButtonText}>
                                        Guardar Cambios
                                    </Text>
                                </>
                            )}
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
