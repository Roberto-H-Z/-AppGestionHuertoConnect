/**
 * ParticleProgressBar — Elegant bottom progress bar with micro-particle effects.
 * The fill uses a green gradient with luminous particles at the leading edge.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.7;
const BAR_HEIGHT = 4;

interface ParticleProgressBarProps {
  progress: SharedValue<number>;
}

const MicroParticle: React.FC<{
  progress: SharedValue<number>;
  offsetX: number;
  offsetY: number;
  size: number;
  delay: number;
}> = ({ progress, offsetX, offsetY, size, delay }) => {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1200 + Math.random() * 800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const fillWidth = progress.value * BAR_WIDTH;
    const particleX = fillWidth + offsetX;
    const floatY = interpolate(drift.value, [0, 1], [-3 + offsetY, 3 + offsetY]);
    const opacity = interpolate(
      progress.value,
      [0, 0.05, 0.95, 1],
      [0, 0.8, 0.8, 0],
      Extrapolation.CLAMP
    );

    return {
      position: 'absolute',
      left: particleX - size / 2,
      top: BAR_HEIGHT / 2 + floatY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#A5D6A7',
      opacity: opacity * interpolate(drift.value, [0, 0.5, 1], [0.4, 1, 0.4]),
      shadowColor: '#A5D6A7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: size * 2,
    };
  });

  return <Animated.View style={style} pointerEvents="none" />;
};

export const ParticleProgressBar: React.FC<ParticleProgressBarProps> = ({ progress }) => {
  // Animated fill width
  const fillStyle = useAnimatedStyle(() => {
    return {
      width: progress.value * BAR_WIDTH,
    };
  });

  // Glow at the leading edge
  const glowStyle = useAnimatedStyle(() => {
    const fillWidth = progress.value * BAR_WIDTH;
    const opacity = interpolate(
      progress.value,
      [0, 0.03, 0.95, 1],
      [0, 0.7, 0.7, 0],
      Extrapolation.CLAMP
    );
    return {
      position: 'absolute',
      left: fillWidth - 8,
      top: -6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#C8E6C9',
      opacity,
      shadowColor: '#66BB6A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
    };
  });

  // Particles near the leading edge
  const particles = [
    { offsetX: -5, offsetY: -2, size: 3, delay: 0 },
    { offsetX: -12, offsetY: 1, size: 2.5, delay: 200 },
    { offsetX: -8, offsetY: -4, size: 2, delay: 400 },
    { offsetX: -15, offsetY: 3, size: 2, delay: 100 },
    { offsetX: -3, offsetY: 4, size: 2.5, delay: 300 },
    { offsetX: -20, offsetY: -1, size: 1.8, delay: 500 },
    { offsetX: 2, offsetY: -3, size: 2, delay: 150 },
    { offsetX: -10, offsetY: -5, size: 1.5, delay: 600 },
  ];

  return (
    <View style={styles.container}>
      {/* Track */}
      <View style={styles.track}>
        {/* Fill */}
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={['#388E3C', '#66BB6A', '#A5D6A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Glow at edge */}
        <Animated.View style={glowStyle} />

        {/* Micro particles */}
        {particles.map((p, i) => (
          <MicroParticle key={i} progress={progress} {...p} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  track: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'visible',
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
});

export default ParticleProgressBar;
