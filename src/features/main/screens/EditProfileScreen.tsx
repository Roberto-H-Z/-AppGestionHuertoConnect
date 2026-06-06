/**
 * EditProfileScreen — Edit user profile form with avatar,
 * badge, and editable fields. Real data from AuthContext + local storage.
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

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, checkSession } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [perfil, setPerfil] = useState('');
    const [accesoAgua, setAccesoAgua] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                setName(`${user.nombre} ${user.apellidos}`.trim());
                setEmail(user.email || '');
                if (user.created_at) {
                    const date = new Date(user.created_at);
                    setCreatedAt(Number.isNaN(date.getTime()) ? user.created_at : date.toLocaleDateString('es-MX'));
                } else {
                    setCreatedAt('');
                }
            }
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
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        Animated.spring(avatarScale, { toValue: 1, friction: 5, tension: 80, delay: 150, useNativeDriver: true }).start();
        Animated.parallel([
            Animated.timing(formFade, { toValue: 1, duration: 500, delay: 250, useNativeDriver: true }),
            Animated.timing(formSlide, { toValue: 0, duration: 500, delay: 250, useNativeDriver: true }),
        ]).start();
        Animated.timing(buttonFade, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }).start();
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre completo no puede estar vacío.');
            return;
        }
        setIsSaving(true);
        try {
            const parts = name.trim().split(/\s+/);
            const nombre = parts[0] || '';
            const apellidos = parts.slice(1).join(' ') || '';

            if (user?.id) {
                await apiClient.patch(`/usuarios/${user.id}`, {
                    nombre,
                    apellidos,
                    email: email.trim() || undefined
                });
            }
            await Promise.all([
                tokenStorage.setItem('huertoconnect_farmer_perfil', perfil.trim()),
                tokenStorage.setItem('huertoconnect_farmer_acceso_agua', accesoAgua.trim())
            ]);
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

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Section */}
                    <Animated.View style={[styles.avatarSection, { transform: [{ scale: avatarScale }] }]}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitials}>
                                    {user ? `${user.nombre?.[0] || ''}${user.apellidos?.[0] || ''}`.toUpperCase() : ''}
                                </Text>
                            </View>
                            <View style={styles.cameraBadge}>
                                <MaterialCommunityIcons name="camera" size={13} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.perfilBadge}>
                            <Text style={styles.perfilBadgeText}>{perfil || 'Cultivador'}</Text>
                        </View>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View style={[styles.formCard, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>
                        <FieldInput label="Nombre completo" icon="account-outline" value={name} onChangeText={setName} placeholder="Tu nombre completo" />
                        <FieldInput label="Correo electrónico" icon="email-outline" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
                        <FieldInput label="Perfil de Agricultor" icon="sprout-outline" value={perfil} onChangeText={setPerfil} placeholder="Ej: Cultivador, Experto..." />
                        <FieldInput label="Sistema de Riego / Acceso al Agua" icon="water-outline" value={accesoAgua} onChangeText={setAccesoAgua} placeholder="Tipo de riego" />
                        <FieldInput label="Miembro desde" icon="calendar-outline" value={createdAt} onChangeText={() => {}} placeholder="..." editable={false} muted />
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View style={{ opacity: buttonFade }}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                            activeOpacity={0.85}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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

// ── Field Input helper component
const FieldInput: React.FC<{
    label: string;
    icon: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    keyboardType?: any;
    autoCapitalize?: any;
    editable?: boolean;
    muted?: boolean;
}> = ({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, editable = true, muted = false }) => (
    <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.inputWrapper, muted && styles.inputWrapperMuted]}>
            <MaterialCommunityIcons name={icon as any} size={18} color={muted ? '#D1D5DB' : '#059669'} style={styles.inputIcon} />
            <TextInput
                style={[styles.textInput, muted && { color: '#9CA3AF' }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                editable={editable}
            />
        </View>
    </View>
);

// ═══════════════════════════════════════════
// ██  STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },

    // ── Header ──────────────────────────────────────────────
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 14,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: -0.3 },

    // ── Scroll ───────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 20 },

    // ── Avatar Section ───────────────────────────────────────
    avatarSection: {
        alignItems: 'center', paddingVertical: 28,
        backgroundColor: '#FFFFFF', borderRadius: 22, marginBottom: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 92, height: 92, borderRadius: 46,
        backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center',
        borderWidth: 4, borderColor: '#ECFDF5',
    },
    avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    perfilBadge: {
        backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: '#D1FAE5',
    },
    perfilBadgeText: { fontSize: 13, fontWeight: '600', color: '#059669' },

    // ── Form Card ────────────────────────────────────────────
    formCard: {
        backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 12.5, fontWeight: '600', color: '#6B7280', marginBottom: 7, letterSpacing: 0.2 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
        paddingHorizontal: 12, paddingVertical: 12,
    },
    inputWrapperMuted: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500' },

    // ── Save Button ──────────────────────────────────────────
    saveButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#059669', borderRadius: 18, paddingVertical: 16, gap: 8,
        shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default EditProfileScreen;
