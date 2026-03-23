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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button } from '../../../shared/components/ui';
import { authService } from '../services/authService';
import { useFormValidation } from '../hooks/useFormValidation';

const BackgroundImage = require('../../../../assets/Fondo login.png');
const { width, height } = Dimensions.get('window');

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { handleValidateField, getFieldStatus, isTouched, validateAllFields, markTouched, resetValidation } = useFormValidation();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(30)).current;

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            formSlide.setValue(30);
            resetValidation();
            setEmail('');
            setError(null);

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
        }, [])
    );

    const emailStatus = getFieldStatus('email');

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

    const handleSendCode = async () => {
        const isValid = validateAllFields([
            { name: 'email', value: email },
        ]);

        if (!isValid) {
            setError('Ingresa un correo válido');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const result = await authService.forgotPassword(email);

            navigation.navigate('OtpVerification', {
                challengeId: result.challengeId,
                email: email,
                tipo: 'reset-password'
            });
        } catch (err: any) {
            setError(err.message || 'Error al solicitar el cambio de contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground source={BackgroundImage} style={styles.container} resizeMode="cover">
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>

                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>

                    <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
                        <MaterialCommunityIcons name="lock-reset" size={64} color="#6ee7b7" style={{ marginBottom: 16 }} />
                        <Text style={styles.title}>Recuperar Contraseña</Text>
                        <Text style={styles.subtitle}>
                            Ingresa el correo asociado a tu cuenta y te enviaremos un código de verificación.
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.formGlass, { opacity: fadeAnim, transform: [{ translateY: formSlide }] }]}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ff6b6b" />
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

                        <Button
                            title={isLoading ? "Enviando..." : "Enviar Código"}
                            onPress={handleSendCode}
                            disabled={isLoading}
                            style={styles.actionButton}
                        />
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
    actionButton: {
        width: '100%',
        marginTop: 10,
    },
});

export default ForgotPasswordScreen;
