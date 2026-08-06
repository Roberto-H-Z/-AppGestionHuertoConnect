import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../../shared/components/ui';
import { authService } from '../services/authService';
import { useAuth } from '../services/AuthContext';

const BackgroundImage = require('../../../../assets/Fondo login.png');
const { width, height } = Dimensions.get('window');

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // segundos

export const OtpVerificationScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { signIn } = useAuth();

    // Params from previous screen
    const { challengeId, email, tipo } = route.params || {};

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
    const [isResending, setIsResending] = useState(false);
    const [currentChallengeId, setCurrentChallengeId] = useState(challengeId);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(30)).current;

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            formSlide.setValue(30);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: false,
                }),
                Animated.timing(formSlide, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: false,
                }),
            ]).start();
        }, [])
    );



    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    // Handle OTP input changes
    const handleOtpChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError(null);

        // Auto focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current is empty, focus previous
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            setError('Por favor, ingresa los 6 dígitos.');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const result = await authService.verifyOtp({
                challengeId: currentChallengeId,
                otpCode: code
            });

            if (tipo === 'reset-password' && result.resetToken) {
                navigation.replace('ResetPassword', { resetToken: result.resetToken });
            } else if (result.token) {
                // Registro o Login guardan el token y acceden a la app
                await signIn(result.token);

                // Por el momento, se salta el onboarding (configuración del perfil del agricultor)
                // y se manda al usuario directamente al Home ('Main'). Se preserva el código para el futuro.
                /*
                if (tipo === 'registro') {
                    navigation.replace('FarmerProfile');
                } else {
                    navigation.replace('Main');
                }
                */
                navigation.replace('Main');
            } else {
                setError('Respuesta inesperada del servidor.');
            }
        } catch (err: any) {
            setError(err.message || 'Código incorrecto o expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;

        setError(null);
        setIsResending(true);

        try {
            const result = await authService.resendOtp(currentChallengeId);
            setCurrentChallengeId(result.challengeId);
            setResendCooldown(RESEND_COOLDOWN);

            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || 'Error al reenviar el código.');
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <ImageBackground source={BackgroundImage} style={styles.container} resizeMode="cover">
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>

                    {/* Botón de regreso */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>

                    <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
                        <MaterialCommunityIcons name="email-check-outline" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
                        <Text style={styles.title}>Verifica tu correo</Text>
                        <Text style={styles.subtitle}>
                            Hemos enviado un código a{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.formGlass, { opacity: fadeAnim, transform: [{ translateY: formSlide }] }]}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ff6b6b" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Ingresa el código de 6 dígitos</Text>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    style={[styles.otpInput, error ? styles.otpInputError : null]}
                                    value={digit}
                                    onChangeText={(val) => handleOtpChange(val, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        <Button
                            title={isLoading ? "Verificando..." : "Verificar Código"}
                            onPress={handleVerify}
                            disabled={isLoading}
                            style={styles.verifyButton}
                        />

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>¿No recibiste el código?</Text>
                            <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || isResending}>
                                <Text style={[styles.resendLink, (resendCooldown > 0 || isResending) && styles.resendLinkDisabled]}>
                                    {isResending ? 'Enviando...' : resendCooldown > 0 ? `Reenviar en ${formatTime(resendCooldown)}` : 'Reenviar ahora'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        paddingTop: height * 0.08,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailText: {
        fontWeight: '700',
        color: '#6ee7b7',
    },
    formGlass: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
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
    inputLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 16,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    otpInputError: {
        borderColor: '#ff6b6b',
    },
    verifyButton: {
        width: '100%',
        marginBottom: 20,
    },
    resendContainer: {
        alignItems: 'center',
    },
    resendText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginBottom: 4,
    },
    resendLink: {
        color: '#6ee7b7',
        fontWeight: '600',
        fontSize: 14,
    },
    resendLinkDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },
});

export default OtpVerificationScreen;
