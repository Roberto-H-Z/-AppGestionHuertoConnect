import React, { useEffect, useRef } from 'react';
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
import { Input, Button } from '../../../shared/components/ui';

// Logo de HuertoConnect
const Logo = require('../../../../assets/hurtooo.png');

// Fondo de la pantalla
const BackgroundImage = require('../../../../assets/Fondo login.png');

const { width, height } = Dimensions.get('window');



export const LoginScreen: React.FC = () => {
    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const formSlide = useRef(new Animated.Value(50)).current;

    useEffect(() => {
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
    }, []);

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
                        <View style={styles.formGlass}>
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

                            {/* Link olvidé contraseña */}
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>

                            {/* Botón iniciar sesión */}
                            <Button
                                title="Iniciar Sesión"
                                onPress={() => console.log('Login pressed')}
                                style={styles.loginButton}
                            />

                            {/* Separador */}
                            <View style={styles.separator}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>o</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            {/* Link registro */}
                            <TouchableOpacity style={styles.registerLink}>
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
