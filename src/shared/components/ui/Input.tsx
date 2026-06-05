import React, { useState, useRef, useEffect } from 'react';
import {
    TextInput,
    View,
    Text,
    TouchableOpacity,
    TextInputProps,
    StyleSheet,
    Animated,
    ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ValidationStatus = 'idle' | 'valid' | 'error';

interface InputProps extends TextInputProps {
    label?: string;
    isPassword?: boolean;
    validationStatus?: ValidationStatus;
    validationMessage?: string;
    inputContainerStyle?: ViewStyle;
}

// Icono de ojo abierto
const EyeIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z"
            fill="rgba(255,255,255,0.6)"
        />
    </Svg>
);

// Icono de ojo cerrado
const EyeOffIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 6.5C15.79 6.5 19.17 8.63 20.82 12C20.23 13.31 19.4 14.41 18.41 15.27L19.82 16.68C21.21 15.39 22.31 13.79 23 12C21.27 7.61 17 4.5 12 4.5C10.73 4.5 9.51 4.7 8.36 5.07L10.01 6.72C10.66 6.59 11.32 6.5 12 6.5ZM2.71 3.16L4.69 5.14C3.06 6.4 1.77 8.09 1 10C2.73 14.39 7 17.5 12 17.5C13.52 17.5 14.97 17.2 16.31 16.66L19.03 19.38L20.44 17.97L4.12 1.75L2.71 3.16ZM12 15.5C9.24 15.5 7 13.26 7 10.5C7 9.77 7.15 9.08 7.42 8.45L9.06 10.09C9.03 10.22 9 10.36 9 10.5C9 12.16 10.34 13.5 12 13.5C12.14 13.5 12.28 13.47 12.41 13.44L14.05 15.08C13.42 15.35 12.73 15.5 12 15.5Z"
            fill="rgba(255,255,255,0.6)"
        />
    </Svg>
);

// Icono check animado
const CheckIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            fill="#6ee7b7"
        />
    </Svg>
);

// Icono error animado
const CrossIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
            fill="#ff6b6b"
        />
    </Svg>
);


export const Input: React.FC<InputProps> = ({
    label,
    isPassword = false,
    validationStatus = 'idle',
    validationMessage,
    inputContainerStyle,
    style,
    onFocus,
    onBlur,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const borderColorAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const messageSlide = useRef(new Animated.Value(-6)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const prevStatus = useRef<ValidationStatus>('idle');

    // Animate validation message & icon appearance
    useEffect(() => {
        const hasMessage = validationStatus !== 'idle' && !!validationMessage;
        Animated.parallel([
            Animated.timing(messageOpacity, {
                toValue: hasMessage ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(messageSlide, {
                toValue: hasMessage ? 0 : -6,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();
    }, [validationStatus, validationMessage, messageOpacity, messageSlide]);

    // Animate status icon pop-in
    useEffect(() => {
        if (validationStatus !== 'idle') {
            Animated.spring(iconScale, {
                toValue: 1,
                friction: 4,
                tension: 120,
                useNativeDriver: true,
            }).start();
        } else {
            iconScale.setValue(0);
        }
    }, [validationStatus, iconScale]);

    // Shake animation when switching to error
    useEffect(() => {
        if (validationStatus === 'error' && prevStatus.current !== 'error') {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
            ]).start();
        }
        prevStatus.current = validationStatus;
    }, [validationStatus, shakeAnim]);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1.02,
                friction: 8,
                tension: 100,
                useNativeDriver: false,
            }),
            Animated.timing(borderColorAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                useNativeDriver: false,
            }),
            Animated.timing(borderColorAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
        onBlur?.(e);
    };

    // Determine border color based on validation / focus
    const getBorderColor = () => {
        if (validationStatus === 'error') return '#ff6b6b';
        if (validationStatus === 'valid') return '#6ee7b7';
        if (isFocused) return 'rgba(110, 231, 183, 0.6)';
        return 'rgba(255,255,255,0.15)';
    };

    const borderColor = validationStatus !== 'idle'
        ? getBorderColor()
        : borderColorAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0.15)', 'rgba(110, 231, 183, 0.6)'],
        });

    const messageColor = validationStatus === 'error' ? '#ff6b6b' : '#6ee7b7';

    return (
        <View style={styles.container}>
            {Boolean(label) && <Text style={styles.label}>{label}</Text>}
            <Animated.View
                style={[
                    styles.inputContainer,
                    inputContainerStyle,
                    {
                        transform: [
                            { scale: scaleAnim },
                            { translateX: shakeAnim },
                        ],
                        borderColor: borderColor,
                    },
                ]}
            >
                {/* @ts-ignore - outlineStyle en styles.input */}
                {/* @ts-ignore */}
                <TextInput
                    style={[styles.input, style] as any}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    secureTextEntry={isPassword && !showPassword}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                {/* Validation status icon */}
                {validationStatus !== 'idle' && !isPassword && (
                    <Animated.View
                        style={[
                            styles.statusIcon,
                            { transform: [{ scale: iconScale }] },
                        ]}
                    >
                        {validationStatus === 'valid' ? <CheckIcon /> : <CrossIcon />}
                    </Animated.View>
                )}
                {isPassword && (
                    <View style={styles.passwordIcons}>
                        {validationStatus !== 'idle' && (
                            <Animated.View
                                style={[
                                    styles.statusIconInline,
                                    { transform: [{ scale: iconScale }] },
                                ]}
                            >
                                {validationStatus === 'valid' ? <CheckIcon /> : <CrossIcon />}
                            </Animated.View>
                        )}
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                            activeOpacity={0.7}
                        >
                            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            {/* Validation message */}
            {Boolean(validationMessage) && validationStatus !== 'idle' && (
                <Animated.View
                    style={[
                        styles.messageContainer,
                        {
                            opacity: messageOpacity,
                            transform: [{ translateY: messageSlide }],
                        },
                    ]}
                >
                    <Text style={[styles.messageText, { color: messageColor }]}>
                        {validationMessage}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
};

// @ts-expect-error - outlineStyle no es parte de React Native pero funciona en web
const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#fff',
        fontSize: 16,
        outlineStyle: 'none',
    },
    statusIcon: {
        paddingRight: 14,
    },
    passwordIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconInline: {
        marginRight: 2,
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    messageContainer: {
        marginTop: 6,
        paddingHorizontal: 4,
    },
    messageText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default Input;
