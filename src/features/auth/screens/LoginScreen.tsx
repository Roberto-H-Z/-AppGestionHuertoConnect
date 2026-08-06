import React, { useRef, useCallback, useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button } from '../../../shared/components/ui';
import { useFormValidation } from '../hooks/useFormValidation';
import { authService } from '../services/authService';
import { useAuth } from '../services/AuthContext';

// Logo de HuertoConnect
const Logo = require('../../../../assets/hurtooo.png');

// Fondo de la pantalla
const BackgroundImage = require('../../../../assets/Fondo login.png');

const { width, height } = Dimensions.get('window');



export const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const { handleValidateField, getFieldStatus, isTouched, validateAllFields, markTouched, resetValidation } = useFormValidation();
    const { signIn } = useAuth();

    // ── Form state ──
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ── Animations ──
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const formSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            // Resetear animaciones
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            logoScale.setValue(0.8);
            formSlide.setValue(50);

            // Reset validation state
            resetValidation();
            setEmail('');
            setPassword('');
            setError(null);

            // Animación de entrada
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: false,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: false,
                }),
                Animated.timing(formSlide, {
                    toValue: 0,
                    duration: 1000,
                    delay: 300,
                    useNativeDriver: false,
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
        handleValidateField('email', email);
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
        handleValidateField('loginPassword', password);
    };

    // ── Handler ──
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
        setIsLoading(true);

        try {
            const result = await authService.login({
                email,
                password: password
            });

            // Navegar a la pantalla de verificación OTP
            navigation?.navigate('OtpVerification', {
                challengeId: result.challengeId,
                email: email,
                tipo: 'login'
            });
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
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
                        {/* Logo circular */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={Logo}
                                    style={styles.logoImage}
                                    resizeMode="cover"
                                />
                            </View>
                        </View>

                        {/* Título */}
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
                        <View style={styles.formShell}>
                            <View style={styles.formGlow} />
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
                                    inputContainerStyle={styles.softInput}
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
                                    inputContainerStyle={styles.softInput}
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => navigation?.navigate('ForgotPassword')}
                                >
                                    <MaterialCommunityIcons
                                        name="lock-reset"
                                        size={16}
                                        color="rgba(209, 250, 229, 0.78)"
                                    />
                                    <Text style={styles.forgotPasswordText}>
                                        ¿Olvidaste tu contraseña?
                                    </Text>
                                </TouchableOpacity>

                                <Button
                                    title={isLoading ? "Iniciando..." : "Iniciar Sesión"}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    style={styles.loginButton}
                                />



                                {/* Separador */}
                                <View style={styles.separator}>
                                    <View style={styles.separatorLine} />
                                    <Text style={styles.separatorText}>o</Text>
                                    <View style={styles.separatorLine} />
                                </View>

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
        paddingHorizontal: 22,
        paddingTop: height * 0.055,
        paddingBottom: 28,
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoCircle: {
        width: 116,
        height: 116,
        borderRadius: 58,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(209, 250, 229, 0.35)',
        shadowColor: '#6ee7b7',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.34,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    logoImage: {
        width: 116,
        height: 116,
        borderRadius: 58,
    },
    title: {
        fontSize: 31,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(232, 255, 244, 0.78)',
        fontWeight: '400',
    },
    // Formulario
    formContainer: {
        marginTop: 6,
    },
    formShell: {
        // Fondo sólido para ocultar manchas del asset y mantener un panel limpio.
        backgroundColor: '#0b3f2a',
        borderRadius: 34,
        borderWidth: 1,
        borderColor: 'rgba(209, 250, 229, 0.28)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 14,
        },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 12,
        overflow: 'hidden',
    },
    formGlow: {
        // Brillo superior sutil para que el panel no se perciba plano.
        position: 'absolute',
        top: 0,
        left: 28,
        right: 28,
        height: 1,
        backgroundColor: 'rgba(236, 253, 245, 0.55)',
    },
    formGlass: {
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 24,
    },
    softInput: {
        minHeight: 58,
        backgroundColor: 'rgba(236, 253, 245, 0.10)',
        borderColor: 'rgba(167, 243, 208, 0.26)',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        marginBottom: 22,
        marginTop: -2,
    },
    forgotPasswordText: {
        color: 'rgba(232, 255, 244, 0.78)',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        width: '100%',
        marginBottom: 12,
    },

    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(209, 250, 229, 0.24)',
    },
    separatorText: {
        color: 'rgba(232, 255, 244, 0.62)',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    registerText: {
        color: 'rgba(232, 255, 244, 0.78)',
        fontSize: 14,
    },
    registerTextBold: {
        color: '#8ff5cb',
        fontWeight: '700',
    },
    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 30,
        paddingBottom: 20,
    },
    footerText: {
        color: 'rgba(232, 255, 244, 0.42)',
        fontSize: 12,
    },
});

export default LoginScreen;
