import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
    title: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    style,
    textStyle,
}) => {
    const animatedScale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(animatedScale, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(animatedScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    if (variant === 'primary') {
        return (
            <Animated.View
                style={[
                    styles.shadowContainer,
                    { transform: [{ scale: animatedScale }] },
                    style,
                ]}
            >
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled}
                    activeOpacity={0.9}
                    style={styles.buttonWrapper}
                >
                    <LinearGradient
                        colors={['#a7f3d0', '#6ee7b7', '#34d399']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    if (variant === 'outline') {
        return (
            <Animated.View
                style={[
                    { transform: [{ scale: animatedScale }] },
                    style,
                ]}
            >
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled}
                    activeOpacity={0.7}
                    style={styles.outlineButton}
                >
                    <Text style={[styles.outlineText, textStyle]}>{title}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // Secondary variant
    return (
        <Animated.View
            style={[
                { transform: [{ scale: animatedScale }] },
                style,
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                activeOpacity={0.8}
                style={styles.secondaryButton}
            >
                <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    shadowContainer: {
        shadowColor: '#6ee7b7',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        borderRadius: 20,
    },
    buttonWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    outlineButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    outlineText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    secondaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Button;
