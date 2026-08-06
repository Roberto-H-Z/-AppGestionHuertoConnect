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
import {
    useFormValidation,
    getPasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from '../hooks/useFormValidation';
import { authService } from '../services/authService';

// Logo de HuertoConnect
const Logo = require('../../../../assets/hurtooo.png');

// Fondo de la pantalla
const BackgroundImage = require('../../../../assets/Fondo login.png');

const { width, height } = Dimensions.get('window');

// ── Password Strength Bar Component ──
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
    container: {
        marginTop: -6,
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    barBackground: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
});

// ── Password Match Indicator ──
const PasswordMatchIndicator: React.FC<{ password: string; confirmPassword: string }> = ({
    password,
    confirmPassword,
}) => {
    if (!confirmPassword) return null;

    const match = password === confirmPassword;

    return (
        <View style={matchStyles.container}>
            <MaterialCommunityIcons
                name={match ? 'check-circle' : 'close-circle'}
                size={14}
                color={match ? '#6ee7b7' : '#ff6b6b'}
            />
            <Text style={[matchStyles.text, { color: match ? '#6ee7b7' : '#ff6b6b' }]}>
                {match ? 'Las contraseñas coinciden ✓' : 'Las contraseñas no coinciden'}
            </Text>
        </View>
    );
};

const matchStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -6,
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    text: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
});

// ── Main Component ──
export const RegisterScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const {
        handleValidateField,
        getFieldStatus,
        isTouched,
        validateAllFields,
        markTouched,
        resetValidation,
    } = useFormValidation();

    // ── Form state ──
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ── Animations ──
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const formSlide = useRef(new Animated.Value(50)).current;

    useFocusEffect(
        useCallback(() => {
            // Resetear animaciones
            slideAnim.setValue(30);
            logoScale.setValue(0.8);
            formSlide.setValue(50);
            resetValidation();

            // Animación de entrada (sin fade para evitar flash)
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
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
                    duration: 800,
                    delay: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }, [slideAnim, logoScale, formSlide, resetValidation])
    );

    // ── Field validation helpers ──
    const createFieldHandlers = (
        fieldName: string,
        setter: (v: string) => void,
        extra?: () => { password?: string }
    ) => ({
        onChangeText: (text: string) => {
            setter(text);
            setError(null);
            if (isTouched(fieldName) && text.trim()) {
                handleValidateField(fieldName, text, extra?.());
            }
            // Re-validate confirmPassword when password changes
            if (fieldName === 'password' && isTouched('confirmPassword') && confirmPassword) {
                handleValidateField('confirmPassword', confirmPassword, { password: text });
            }
        },
        onBlur: () => {
            markTouched(fieldName);
            handleValidateField(
                fieldName,
                fieldName === 'nombre' ? nombre :
                    fieldName === 'apellidos' ? apellidos :
                        fieldName === 'email' ? email :
                            fieldName === 'password' ? password :
                                fieldName === 'confirmPassword' ? confirmPassword : '',
                extra?.()
            );
        },
    });

    // ── Validation & Submit ──
    const handleRegister = async () => {
        const isValid = validateAllFields([
            { name: 'nombre', value: nombre },
            { name: 'apellidos', value: apellidos },
            { name: 'email', value: email },
            { name: 'password', value: password },
            { name: 'confirmPassword', value: confirmPassword, extra: { password } },
        ]);

        if (!isValid) {
            setError('Corrige los campos señalados antes de continuar');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const result = await authService.register({
                nombre,
                apellidos,
                email,
                password: password,
                confirmPassword: confirmPassword
            });

            navigation?.navigate('OtpVerification', {
                challengeId: result.challengeId,
                email: email,
                tipo: 'registro'
            });
        } catch (err: any) {
            // Error 409: Ya existe una cuenta
            if (err.response?.status === 409) {
                setError('Ya existe una cuenta con este correo.');
            } else {
                setError(err.message || 'Error al crear la cuenta. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Get statuses ──
    const getStatus = (name: string) => {
        const s = getFieldStatus(name);
        return {
            validationStatus: isTouched(name) ? s.status : ('idle' as const),
            validationMessage: isTouched(name) ? s.message : undefined,
        };
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
                    scrollEnabled={false}
                >
                    {/* Logo y título */}
                    <Animated.View
                        style={[
                            styles.headerContainer,
                            {
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
                        <Text style={styles.title}>Únete a HuertoConnect</Text>
                        <Text style={styles.subtitle}>Forma parte de nuestra comunidad </Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
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

                            <View style={styles.nameRow}>
                                <Input
                                    label="Nombre *"
                                    placeholder="Tu nombre"
                                    value={nombre}
                                    maxLength={50}
                                    containerStyle={styles.halfField}
                                    inputContainerStyle={styles.compactInput}
                                    labelStyle={styles.compactLabel}
                                    style={styles.compactInputText}
                                    {...createFieldHandlers('nombre', setNombre)}
                                    {...getStatus('nombre')}
                                />

                                <Input
                                    label="Apellido *"
                                    placeholder="Tus apellidos"
                                    value={apellidos}
                                    maxLength={80}
                                    containerStyle={styles.halfField}
                                    inputContainerStyle={styles.compactInput}
                                    labelStyle={styles.compactLabel}
                                    style={styles.compactInputText}
                                    {...createFieldHandlers('apellidos', setApellidos)}
                                    {...getStatus('apellidos')}
                                />
                            </View>

                            <Input
                                label="Correo electrónico *"
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                containerStyle={styles.compactField}
                                inputContainerStyle={styles.compactInput}
                                labelStyle={styles.compactLabel}
                                style={styles.compactInputText}
                                {...createFieldHandlers('email', setEmail)}
                                {...getStatus('email')}
                            />

                            <Input
                                label="Contraseña *"
                                placeholder="••••••••"
                                isPassword
                                value={password}
                                containerStyle={styles.compactField}
                                inputContainerStyle={styles.compactInput}
                                labelStyle={styles.compactLabel}
                                style={styles.compactInputText}
                                {...createFieldHandlers('password', setPassword)}
                                {...getStatus('password')}
                            />

                            {/* Password strength bar */}
                            <PasswordStrengthBar password={password} />

                            <Input
                                label="Confirmar contraseña *"
                                placeholder="••••••••"
                                isPassword
                                value={confirmPassword}
                                containerStyle={styles.compactField}
                                inputContainerStyle={styles.compactInput}
                                labelStyle={styles.compactLabel}
                                style={styles.compactInputText}
                                {...createFieldHandlers('confirmPassword', setConfirmPassword, () => ({
                                    password,
                                }))}
                                {...getStatus('confirmPassword')}
                            />

                            {/* Password match indicator */}
                            <PasswordMatchIndicator
                                password={password}
                                confirmPassword={confirmPassword}
                            />

                            {/* Botón crear cuenta */}
                            <Button
                                title={isLoading ? "Creando Cuenta..." : "Crear Cuenta"}
                                onPress={handleRegister}
                                disabled={isLoading}
                                style={styles.registerButton}
                            />

                            {/* Términos y privacidad */}
                            <Text style={styles.termsText}>
                                Al registrarte, aceptas nuestros{' '}
                                <Text style={styles.termsLink}>Términos y Privacidad</Text>
                            </Text>

                            {/* Separador */}
                            <View style={styles.separator}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>o</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            {/* Link login */}
                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation?.goBack()}
                            >
                                <Text style={styles.loginLinkText}>
                                    ¿Ya tienes cuenta?{' '}
                                    <Text style={styles.loginLinkBold}>Inicia sesión</Text>
                                </Text>
                            </TouchableOpacity>
                            </View>
                        </View>
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
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingTop: height * 0.025,
        paddingBottom: 16,
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logoContainer: {
        marginBottom: 8,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    logoImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    title: {
        fontSize: 23,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(232, 255, 244, 0.78)',
        fontWeight: '400',
    },

    // Formulario
    formContainer: {
        marginTop: 0,
    },
    formShell: {
        // Fondo sólido para evitar manchas del asset y mantener un solo panel legible.
        backgroundColor: '#0b3f2a',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(209, 250, 229, 0.28)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.28,
        shadowRadius: 22,
        elevation: 12,
        overflow: 'hidden',
    },
    formGlow: {
        // Brillo superior sutil para dar profundidad sin crear una segunda tarjeta.
        position: 'absolute',
        top: 0,
        left: 26,
        right: 26,
        height: 1,
        backgroundColor: 'rgba(236, 253, 245, 0.55)',
    },
    formGlass: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 10,
    },
    halfField: {
        flex: 1,
        width: 'auto',
        marginBottom: 10,
    },
    compactField: {
        marginBottom: 10,
    },
    compactInput: {
        minHeight: 48,
        borderRadius: 20,
        backgroundColor: 'rgba(236, 253, 245, 0.10)',
        borderColor: 'rgba(167, 243, 208, 0.26)',
    },
    compactInputText: {
        paddingVertical: 10,
        fontSize: 15,
    },
    compactLabel: {
        marginBottom: 6,
        fontSize: 13,
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
    registerButton: {
        width: '100%',
        marginBottom: 10,
        marginTop: 6,
    },
    termsText: {
        color: 'rgba(232, 255, 244, 0.58)',
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 4,
    },
    termsLink: {
        color: '#8ff5cb',
        fontWeight: '700',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
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
    loginLink: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    loginLinkText: {
        color: 'rgba(232, 255, 244, 0.78)',
        fontSize: 13,
    },
    loginLinkBold: {
        color: '#8ff5cb',
        fontWeight: '700',
    },
});

export default RegisterScreen;
