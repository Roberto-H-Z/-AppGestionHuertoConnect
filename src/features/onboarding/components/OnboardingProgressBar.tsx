import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface OnboardingProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ currentStep, totalSteps }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: currentStep / totalSteps,
            duration: 400,
            useNativeDriver: false, // width animation doesn't support native driver well in some contexts
        }).start();
    }, [currentStep, totalSteps, progressAnim]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            <View style={styles.backgroundBar}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 24,
        marginBottom: 20,
        marginTop: 10,
    },
    backgroundBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#059669', // Modern emerald/green
        borderRadius: 3,
    },
});

export default OnboardingProgressBar;
