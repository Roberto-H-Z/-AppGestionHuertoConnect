import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button } from '../../../shared/components/ui';
import { authService } from '../services/authService';
import {
    useFormValidation,
    getPasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from '../hooks/useFormValidation';

const BackgroundImage = require('../../../../assets/Fondo login.png');
const { width, height } = Dimensions.get('window');

// ── Password Strength Bar Component (Reuzado de Register) ──
const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
    const strength = getPasswordStrength(password);
    const label = getStrengthLabel(strength);
    const color = getStrengthColor(strength);
    const barWidthAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(barWidthAnim, {
            toValue: ((strength + 1) / 5) * 100,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [strength, barWidthAnim]);

    if (!password) return null;

    return (
        <View style={strengthStyles.container}>
            <View style={strengthStyles.barBackground}>
                <Animated.View
                    style={[
                        strengthStyles.barFill,
                        {
                            backgroundColor: color,
                            width: barWidthAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
            <View style={strengthStyles.labelRow}>
                <View style={strengthStyles.dotsRow}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <View
                            key={i}
                            style={[
                                strengthStyles.dot,
                                {
                                    backgroundColor: i <= strength ? color : 'rgba(255,255,255,0.15)',
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text style={[strengthStyles.label, { color }]}>{label}</Text>
            </View>
        </View>
    );
};

const strengthStyles = StyleSheet.create({
    container: { marginTop: -8, marginBottom: 8, paddingHorizontal: 2 },
    barBackground: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
    barFill: { height: '100%', borderRadius: 2 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dotsRow: { flexDirection: 'row', gap: 4 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: 11, fontWeight: '600' },
});

// ── Password Match Indicator ──
const PasswordMatchIndicator: React.FC<{ password: string; confirmPassword: string }> = ({ password, confirmPassword }) => {
    if (!confirmPassword) return null;
    const match = password === confirmPassword;

    return (
        <View style={matchStyles.container}>
            <MaterialCommunityIcons name={match ? 'check-circle' : 'close-circle'} size={14} color={match ? '#6ee7b7' : '#ff6b6b'} />
            <Text style={[matchStyles.text, { color: match ? '#6ee7b7' : '#ff6b6b' }]}>
                {match ? 'Las contraseñas coinciden ✓' : 'Las contraseñas no coinciden'}
            </Text>
        </View>
    );
};

const matchStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 10, paddingHorizontal: 2 },
    text: { fontSize: 12, fontWeight: '500', marginLeft: 6 },
});

export const ResetPasswordScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    // resetToken pasado por OtpVerificationScreen
    const { resetToken } = route.params || {};

    const { handleValidateField, getFieldStatus, isTouched, validateAllFields, markTouched, resetValidation } = useFormValidation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(30)).current;

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            formSlide.setValue(30);
            resetValidation();

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(formSlide, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();

            if (!resetToken) {
                setError('Token de reseteo no válido o expirado.');
            }
        }, [resetToken])
    );

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setError(null);
        if (isTouched('password') && text.trim()) {
            handleValidateField('password', text);
        }
        if (isTouched('confirmPassword') && confirmPassword) {
            handleValidateField('confirmPassword', confirmPassword, { password: text });
        }
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        setError(null);
        if (isTouched('confirmPassword')) {
            handleValidateField('confirmPassword', text, { password });
        }
    };

    const handleBlur = (field: string) => {
        markTouched(field);
        if (field === 'password') handleValidateField('password', password);
        if (field === 'confirmPassword') handleValidateField('confirmPassword', confirmPassword, { password });
    };

    const handleReset = async () => {
        if (!resetToken) return;

        const isValid = validateAllFields([
            { name: 'password', value: password },
            { name: 'confirmPassword', value: confirmPassword, extra: { password } },
        ]);

        if (!isValid) {
            setError('Verifica los campos');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await authService.resetPassword({
                resetToken: resetToken,
                newPassword: password
            });

            setSuccessMsg("¡Contraseña actualizada con éxito!");

            // Limpiar historial de navegación y enviar al Login después de 3 segundos
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }, 2500);

        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground source={BackgroundImage} style={styles.container} resizeMode="cover">
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>

                    <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
                        <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
                        <Text style={styles.title}>Nueva Contraseña</Text>
                        <Text style={styles.subtitle}>Crea una contraseña segura para proteger tu cuenta.</Text>
                    </Animated.View>

                    <Animated.View style={[styles.formGlass, { opacity: fadeAnim, transform: [{ translateY: formSlide }] }]}>
                        {successMsg ? (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <MaterialCommunityIcons name="check-circle" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
                                <Text style={{ color: '#6ee7b7', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                                    {successMsg}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' }}>
                                    Redirigiendo al inicio de sesión...
                                </Text>
                            </View>
                        ) : (
                            <>
                                {error && (
                                    <View style={styles.errorContainer}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ff6b6b" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                <Input
                                    label="Nueva contraseña *"
                                    placeholder="••••••••"
                                    isPassword
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    onBlur={() => handleBlur('password')}
                                    validationStatus={isTouched('password') ? getFieldStatus('password').status : 'idle'}
                                    validationMessage={isTouched('password') ? getFieldStatus('password').message : undefined}
                                    editable={!isLoading && !successMsg}
                                />

                                <PasswordStrengthBar password={password} />

                                <Input
                                    label="Confirmar contraseña *"
                                    placeholder="••••••••"
                                    isPassword
                                    value={confirmPassword}
                                    onChangeText={handleConfirmPasswordChange}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    validationStatus={isTouched('confirmPassword') ? getFieldStatus('confirmPassword').status : 'idle'}
                                    validationMessage={isTouched('confirmPassword') ? getFieldStatus('confirmPassword').message : undefined}
                                    editable={!isLoading && !successMsg}
                                />

                                <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />

                                <Button
                                    title={isLoading ? "Guardando..." : "Actualizar Contraseña"}
                                    onPress={handleReset}
                                    disabled={isLoading || !!successMsg || !resetToken}
                                    style={styles.actionButton}
                                />
                            </>
                        )}
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        backgroundColor: '#1a3a2a',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.15,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    formGlass: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    actionButton: {
        width: '100%',
        marginTop: 10,
    },
});

export default ResetPasswordScreen;
