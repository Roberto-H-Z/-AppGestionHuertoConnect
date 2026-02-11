import React, { useState, useRef } from 'react';
import {
    TextInput,
    View,
    Text,
    TouchableOpacity,
    TextInputProps,
    StyleSheet,
    Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface InputProps extends TextInputProps {
    label?: string;
    isPassword?: boolean;
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


export const Input: React.FC<InputProps> = ({
    label,
    isPassword = false,
    style,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const borderColorAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1.02,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(borderColorAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,

            }),
        ]).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,

                useNativeDriver: true,
            }),
            Animated.timing(borderColorAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const borderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,255,255,0.15)', 'rgba(110, 231, 183, 0.6)'],
    });

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                        borderColor: borderColor,
                    },
                ]}
            >
                {/* @ts-ignore - outlineStyle en styles.input */}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    secureTextEntry={isPassword && !showPassword}
                    onFocus={handleFocus}

                    onBlur={handleBlur}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                    >
                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </TouchableOpacity>
                )}
            </Animated.View>
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        borderWidth: 1,
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
    eyeButton: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
});

export default Input;
