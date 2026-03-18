/**
 * DataFlowLines — Golden-green light particles travelling up the stem.
 * Represents AI data flowing from roots to leaves. Active during phase 2.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface DataFlowLinesProps {
  progress: SharedValue<number>;
  width: number;
  height: number;
}

const Particle: React.FC<{
  progress: SharedValue<number>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}> = ({ progress, startX, startY, endX, endY, delay, duration, size, color }) => {
  const particleProgress = useSharedValue(0);

  useEffect(() => {
    particleProgress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const masterOpacity = interpolate(
      progress.value,
      [0.25, 0.35, 0.75, 0.85],
      [0, 1, 1, 0],
      Extrapolation.CLAMP
    );

    const x = interpolate(particleProgress.value, [0, 1], [startX, endX]);
    const y = interpolate(particleProgress.value, [0, 1], [startY, endY]);
    const opacity = masterOpacity * interpolate(
      particleProgress.value,
      [0, 0.2, 0.5, 0.8, 1],
      [0.2, 0.9, 1, 0.9, 0.2]
    );

    return {
      position: 'absolute' as const,
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity,
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: size,
      elevation: 3,
    };
  });

  return <Animated.View style={style} pointerEvents="none" />;
};

export const DataFlowLines: React.FC<DataFlowLinesProps> = ({ progress, width, height }) => {
  const cx = width / 2;
  const groundY = height * 0.60;

  // Particle paths along the taller stem and extended roots
  const particles = [
    // Main stem flow (bottom to top, covering full 195px stem)
    { startX: cx, startY: groundY + 30, endX: cx - 2, endY: groundY - 80, delay: 0, duration: 2400, size: 5, color: '#FFD54F' },
    { startX: cx + 2, startY: groundY + 15, endX: cx + 3, endY: groundY - 120, delay: 400, duration: 2800, size: 4, color: '#AED581' },
    { startX: cx - 1, startY: groundY, endX: cx, endY: groundY - 150, delay: 800, duration: 3200, size: 3.5, color: '#FFE082' },
    { startX: cx + 1, startY: groundY - 20, endX: cx - 1, endY: groundY - 185, delay: 200, duration: 3500, size: 4.5, color: '#C5E1A5' },

    // Branch to leaf pair 2 (left)
    { startX: cx - 3, startY: groundY - 75, endX: cx - 45, endY: groundY - 85, delay: 600, duration: 1800, size: 3, color: '#FFD54F' },
    // Branch to leaf pair 2 (right)
    { startX: cx + 3, startY: groundY - 75, endX: cx + 45, endY: groundY - 85, delay: 900, duration: 1600, size: 3, color: '#AED581' },
    // Branch to leaf pair 3 (left)
    { startX: cx - 2, startY: groundY - 110, endX: cx - 55, endY: groundY - 118, delay: 1100, duration: 1700, size: 3, color: '#FFE082' },
    // Branch to leaf pair 4 (right)
    { startX: cx + 2, startY: groundY - 145, endX: cx + 48, endY: groundY - 150, delay: 500, duration: 1500, size: 2.5, color: '#C5E1A5' },

    // Root data (upward from deep root tips)
    { startX: cx - 55, startY: groundY + 80, endX: cx, endY: groundY + 10, delay: 300, duration: 2600, size: 3, color: '#FFCC80' },
    { startX: cx + 50, startY: groundY + 75, endX: cx, endY: groundY + 5, delay: 700, duration: 2400, size: 3, color: '#FFCC80' },
    { startX: cx - 3, startY: groundY + 120, endX: cx, endY: groundY + 15, delay: 1000, duration: 2800, size: 2.5, color: '#FFD54F' },
  ];

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} progress={progress} {...p} />
      ))}
    </Animated.View>
  );
};

export default DataFlowLines;
