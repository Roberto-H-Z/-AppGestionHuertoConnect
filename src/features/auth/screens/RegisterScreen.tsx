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
        marginTop: -8,
        marginBottom: 8,
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
        marginTop: -8,
        marginBottom: 10,
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
    const [username, setUsername] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [apellidoMaterno, setApellidoMaterno] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

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
                    duration: 800,
                    delay: 200,
                    useNativeDriver: true,
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
                fieldName === 'username' ? username :
                fieldName === 'nombre' ? nombre :
                fieldName === 'apellidoPaterno' ? apellidoPaterno :
                fieldName === 'apellidoMaterno' ? apellidoMaterno :
                fieldName === 'telefono' ? telefono :
                fieldName === 'email' ? email :
                fieldName === 'password' ? password :
                fieldName === 'confirmPassword' ? confirmPassword : '',
                extra?.()
            );
        },
    });

    // ── Validation & Submit ──
    const handleRegister = () => {
        const isValid = validateAllFields([
            { name: 'username', value: username },
            { name: 'nombre', value: nombre },
            { name: 'apellidoPaterno', value: apellidoPaterno },
            { name: 'apellidoMaterno', value: apellidoMaterno },
            { name: 'telefono', value: telefono },
            { name: 'email', value: email },
            { name: 'password', value: password },
            { name: 'confirmPassword', value: confirmPassword, extra: { password } },
        ]);

        if (!isValid) {
            setError('Corrige los campos señalados antes de continuar');
            return;
        }

        setError(null);
        console.log('Register pressed — all validations passed');
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

                    {/* Formulario con glassmorphism */}
                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
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
                                label="Usuario *"
                                placeholder="Nombre de usuario"
                                autoCapitalize="none"
                                value={username}
                                maxLength={20}
                                {...createFieldHandlers('username', setUsername)}
                                {...getStatus('username')}
                            />

                            <Input
                                label="Nombre *"
                                placeholder="Tu nombre"
                                value={nombre}
                                maxLength={50}
                                {...createFieldHandlers('nombre', setNombre)}
                                {...getStatus('nombre')}
                            />

                            <Input
                                label="Apellido paterno *"
                                placeholder="Apellido paterno"
                                value={apellidoPaterno}
                                maxLength={50}
                                {...createFieldHandlers('apellidoPaterno', setApellidoPaterno)}
                                {...getStatus('apellidoPaterno')}
                            />

                            <Input
                                label="Apellido materno"
                                placeholder="Apellido materno (opcional)"
                                value={apellidoMaterno}
                                maxLength={50}
                                {...createFieldHandlers('apellidoMaterno', setApellidoMaterno)}
                                {...getStatus('apellidoMaterno')}
                            />

                            <Input
                                label="Teléfono"
                                placeholder="10 dígitos (opcional)"
                                keyboardType="phone-pad"
                                value={telefono}
                                maxLength={10}
                                {...createFieldHandlers('telefono', setTelefono)}
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    createFieldHandlers('telefono', setTelefono).onChangeText(cleaned);
                                }}
                                {...getStatus('telefono')}
                            />

                            <Input
                                label="Correo electrónico *"
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                {...createFieldHandlers('email', setEmail)}
                                {...getStatus('email')}
                            />

                            <Input
                                label="Contraseña *"
                                placeholder="••••••••"
                                isPassword
                                value={password}
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
                                title="Crear Cuenta"
                                onPress={handleRegister}
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
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        style={[
                            styles.footer,
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
        paddingTop: height * 0.05,
        paddingBottom: 30,
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainer: {
        marginBottom: 12,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '400',
    },

    // Formulario
    formContainer: {
        marginTop: 5,
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
    registerButton: {
        width: '100%',
        marginBottom: 16,
        marginTop: 8,
    },
    termsText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 8,
    },
    termsLink: {
        color: '#6ee7b7',
        fontWeight: '600',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
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
    loginLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    loginLinkText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    loginLinkBold: {
        color: '#6ee7b7',
        fontWeight: '600',
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 20,
        paddingBottom: 20,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
});

export default RegisterScreen;
