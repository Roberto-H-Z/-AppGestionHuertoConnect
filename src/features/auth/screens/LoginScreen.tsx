import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Image,
    ImageBackground,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../../shared/components/ui';
import { Button } from '../../../shared/components/ui';
import { useAuth } from '../../../config/providers/AuthProvider';
import * as biometricService from '../services/biometricService';
import { useFormValidation } from '../hooks/useFormValidation';

// Logo de HuertoConnect
const Logo = require('../../../../assets/hurtooo.png');

// Fondo de la pantalla
const BackgroundImage = require('../../../../assets/Fondo login.png');

const { width, height } = Dimensions.get('window');



export const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const { signIn } = useAuth();
    const { handleValidateField, getFieldStatus, isTouched, validateAllFields, markTouched, resetValidation } = useFormValidation();

    // ── Form state ──
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Biometric state ──
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);

    // ── Animations ──
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const formSlide = useRef(new Animated.Value(50)).current;

    // Check biometric availability on mount
    useEffect(() => {
        const checkBiometric = async () => {
            const available = await biometricService.isBiometricAvailable();
            setBiometricAvailable(available);
        };
        checkBiometric();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Reset animations
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            logoScale.setValue(0.8);
            formSlide.setValue(50);

            // Reset validation state
            resetValidation();

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(formSlide, {
                    toValue: 0,
                    duration: 1000,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [fadeAnim, slideAnim, logoScale, formSlide, resetValidation])
    );

    // ── Validation helpers ──
    const emailStatus = getFieldStatus('email');
    const passwordStatus = getFieldStatus('loginPassword');

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setError(null);
        if (isTouched('email') && text.trim()) {
            handleValidateField('email', text);
        }
    };

    const handleEmailBlur = () => {
        markTouched('email');
        if (email.trim()) {
            handleValidateField('email', email);
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setError(null);
        if (isTouched('loginPassword') && text.trim()) {
            handleValidateField('loginPassword', text);
        }
    };

    const handlePasswordBlur = () => {
        markTouched('loginPassword');
        if (password.trim()) {
            handleValidateField('loginPassword', password);
        }
    };

    // ── Handlers ──

    const handleLogin = async () => {
        const isValid = validateAllFields([
            { name: 'email', value: email },
            { name: 'loginPassword', value: password },
        ]);

        if (!isValid) {
            setError('Corrige los campos señalados antes de continuar');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const { error: authError } = await signIn(email.trim(), password);
            if (authError) {
                // Translate common Supabase error messages
                if (authError.message?.includes('Invalid login credentials')) {
                    setError('Correo o contraseña incorrectos');
                } else if (authError.message?.includes('Email not confirmed')) {
                    setError('Debes confirmar tu correo electrónico antes de iniciar sesión');
                } else {
                    setError(authError.message || 'Error al iniciar sesión');
                }
            } else {
                // Successful login — ask to enable biometrics if available
                if (biometricAvailable) {
                    Alert.alert(
                        'Activar Face ID',
                        '¿Deseas usar Face ID para iniciar sesión la próxima vez?',
                        [
                            {
                                text: 'No, gracias',
                                style: 'cancel',
                                onPress: () => navigation?.navigate('FarmerProfile'),
                            },
                            {
                                text: 'Sí, activar',
                                onPress: async () => {
                                    // We need the user id — get it from the session
                                    const { getSession } = require('../services/authService');
                                    const { session } = await getSession();
                                    if (session?.user?.id) {
                                        await biometricService.setBiometricEnabled(
                                            session.user.id,
                                            true
                                        );
                                    }
                                    navigation?.navigate('FarmerProfile');
                                },
                            },
                        ]
                    );
                } else {
                    navigation?.navigate('FarmerProfile');
                }
            }
        } catch (e: any) {
            setError('Error de conexión. Verifica tu internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setBiometricLoading(true);
        setError(null);
        try {
            const { success, error: bioError } = await biometricService.authenticate(
                'Inicia sesión con Face ID'
            );
            if (success) {
                // Biometric passed — check if there's an existing session
                const { getSession } = require('../services/authService');
                const { session } = await getSession();
                if (session) {
                    navigation?.navigate('Main');
                } else {
                    setError('No hay sesión guardada. Inicia sesión con tu correo y contraseña primero.');
                }
            } else {
                if (bioError && !bioError.includes('cancelada')) {
                    setError(bioError);
                }
            }
        } catch {
            setError('Error al acceder a la biometría');
        } finally {
            setBiometricLoading(false);
        }
    };

    return (
        <ImageBackground
            source={BackgroundImage}
            style={styles.container}
            resizeMode="cover"
        >
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo y título */}
                    <Animated.View
                        style={[
                            styles.headerContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: logoScale },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={Logo}
                                    style={styles.logoImage}
                                    resizeMode="cover"
                                />
                            </View>
                        </View>

                        <Text style={styles.title}>HuertoConnect</Text>
                        <Text style={styles.subtitle}>Cultiva el futuro con tecnología</Text>
                    </Animated.View>

                    {/* Formulario con glassmorphism */}
                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: formSlide }],
                            },
                        ]}
                    >
                        <View style={styles.formGlass}>
                            {/* Error message */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <MaterialCommunityIcons
                                        name="alert-circle-outline"
                                        size={16}
                                        color="#ff6b6b"
                                    />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <Input
                                label="Correo electrónico"
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={handleEmailChange}
                                onBlur={handleEmailBlur}
                                validationStatus={isTouched('email') ? emailStatus.status : 'idle'}
                                validationMessage={isTouched('email') ? emailStatus.message : undefined}
                            />

                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                isPassword
                                value={password}
                                onChangeText={handlePasswordChange}
                                onBlur={handlePasswordBlur}
                                validationStatus={isTouched('loginPassword') ? passwordStatus.status : 'idle'}
                                validationMessage={isTouched('loginPassword') ? passwordStatus.message : undefined}
                            />

                            {/* Link olvidé contraseña */}
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>

                            {/* Botón iniciar sesión */}
                            <Button
                                title={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                                onPress={handleLogin}
                                style={styles.loginButton}
                                disabled={loading}
                            />

                            {loading && (
                                <ActivityIndicator
                                    color="#6ee7b7"
                                    style={{ marginBottom: 12 }}
                                />
                            )}

                            {/* Biometric button — only if device supports it */}
                            {biometricAvailable && (
                                <>
                                    {/* Separador */}
                                    <View style={styles.separator}>
                                        <View style={styles.separatorLine} />
                                        <Text style={styles.separatorText}>o</Text>
                                        <View style={styles.separatorLine} />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.biometricButton}
                                        onPress={handleBiometricLogin}
                                        disabled={biometricLoading}
                                        activeOpacity={0.7}
                                    >
                                        {biometricLoading ? (
                                            <ActivityIndicator color="#6ee7b7" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="face-recognition"
                                                    size={28}
                                                    color="#6ee7b7"
                                                />
                                                <Text style={styles.biometricButtonText}>
                                                    Iniciar con Face ID
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Separador para registro */}
                            {!biometricAvailable && (
                                <View style={styles.separator}>
                                    <View style={styles.separatorLine} />
                                    <Text style={styles.separatorText}>o</Text>
                                    <View style={styles.separatorLine} />
                                </View>
                            )}

                            {/* Link registro */}
                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => navigation?.navigate('Register')}
                            >
                                <Text style={styles.registerText}>
                                    ¿No tienes cuenta?{' '}
                                    <Text style={styles.registerTextBold}>Regístrate aquí</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        style={[
                            styles.footer,
                            { opacity: fadeAnim },
                        ]}
                    >
                        <Text style={styles.footerText}>
                            © 2026 HuertoConnect. Todos los derechos reservados.
                        </Text>
                    </Animated.View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.08,
        paddingBottom: 30,
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#6ee7b7',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '400',
    },
    // Formulario
    formContainer: {
        marginTop: 10,
    },
    formGlass: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    // Error
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginTop: -8,
    },
    forgotPasswordText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    loginButton: {
        width: '100%',
        marginBottom: 20,
    },
    // Biometric
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(110, 231, 183, 0.1)',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: 'rgba(110, 231, 183, 0.3)',
        marginBottom: 16,
    },
    biometricButtonText: {
        color: '#6ee7b7',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    separatorText: {
        color: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    registerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    registerTextBold: {
        color: '#6ee7b7',
        fontWeight: '600',
    },
    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 30,
        paddingBottom: 20,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
});

export default LoginScreen;
