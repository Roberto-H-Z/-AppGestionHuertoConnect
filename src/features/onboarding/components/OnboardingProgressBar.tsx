import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OnboardingProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ currentStep, totalSteps }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: currentStep - 1, // Steps are 0, 1, 2
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [currentStep, progressAnim]);

    // Map step indices to icons
    const icons: (keyof typeof MaterialCommunityIcons.glyphMap)[] = ['account-hard-hat', 'vector-square', 'water'];
    const labels = ['Perfil', 'Área', 'Entorno'];

    // Calculamos el ancho de la barra de progreso
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, totalSteps - 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Background line */}
            <View style={styles.trackContainer}>
                <View style={styles.trackBackground} />
                <Animated.View style={[styles.trackActive, { width: progressWidth }]} />
            </View>

            {/* Step Nodes */}
            <View style={styles.stepsRow}>
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const isActive = currentStep > index;
                    const isCurrent = currentStep === index + 1;
                    const isCompleted = currentStep > index + 1;

                    return (
                        <View key={index} style={styles.nodeWrapper}>
                            <View
                                style={[
                                    styles.node,
                                    isActive && styles.nodeActive,
                                    isCurrent && styles.nodeCurrent,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={icons[index]}
                                    size={20}
                                    color={isActive ? '#fff' : '#6B7280'}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.stepLabel,
                                    isActive && styles.stepLabelActive,
                                    isCurrent && styles.stepLabelCurrent,
                                ]}
                            >
                                {labels[index]}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 30,
        marginBottom: 35,
        marginTop: 45,
    },
    trackContainer: {
        position: 'absolute',
        top: 22,
        left: 50,
        right: 50,
        height: 4,
        zIndex: 0,
    },
    trackBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    trackActive: {
        height: '100%',
        backgroundColor: '#059669', // Modern emerald base
        borderRadius: 2,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 3, // Glow effect
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    nodeWrapper: {
        alignItems: 'center',
        width: 60,
    },
    node: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 6,
    },
    nodeActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    nodeCurrent: {
        borderWidth: 3,
        borderColor: '#D1FAE5', // Light green inner border
        backgroundColor: '#059669',
        transform: [{ scale: 1.15 }],
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
    },
    stepLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 4,
    },
    stepLabelActive: {
        color: '#059669',
    },
    stepLabelCurrent: {
        color: '#111827',
        fontWeight: '800',
    },
});

export default OnboardingProgressBar;
