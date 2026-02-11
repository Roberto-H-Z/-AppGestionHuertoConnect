import React, { useRef, useCallback } from 'react';
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
import { Input, Button } from '../../../shared/components/ui';

// Logo de HuertoConnect
const Logo = require('../../../../assets/hurtooo.png');

// Fondo de la pantalla
const BackgroundImage = require('../../../../assets/Fondo login.png');

const { width, height } = Dimensions.get('window');

export const RegisterScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    // Animaciones
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

            // Animación de entrada
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
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
        }, [fadeAnim, slideAnim, logoScale, formSlide])
    );

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
                        <Text style={styles.title}>Únete a HuertoConnect</Text>
                        <Text style={styles.subtitle}>Forma parte de nuestra comunidad </Text>
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
                            <Input
                                label="Usuario"
                                placeholder="Nombre de usuario"
                                autoCapitalize="none"
                            />

                            <Input
                                label="Nombre"
                                placeholder="Tu nombre"
                            />

                            <Input
                                label="Apellido paterno"
                                placeholder="Apellido paterno"
                            />

                            <Input
                                label="Apellido materno"
                                placeholder="Apellido materno"
                            />

                            <Input
                                label="Teléfono"
                                placeholder="10 dígitos"
                                keyboardType="phone-pad"
                            />

                            <Input
                                label="Correo electrónico"
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                isPassword
                            />

                            <Input
                                label="Confirmar contraseña"
                                placeholder="••••••••"
                                isPassword
                            />

                            {/* Botón crear cuenta */}
                            <Button
                                title="Crear Cuenta"
                                onPress={() => console.log('Register pressed')}
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
