/**
 * SplashScreen — Premium animated splash for HuertoConnect.
 *
 * Theme: "El Crecimiento de la Inteligencia Orgánica"
 *
 * Three synchronized phases driven by a single `progress` shared value (0→1):
 *   Phase 1 (0-0.30): Seed pulse → sprout emerges, roots grow.
 *   Phase 2 (0.31-0.70): Leaves open, AI data flows, neural overlay, title types.
 *   Phase 3 (0.71-1.0): Mature plant, bar fills, "Comenzar" button appears.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

import { PlantSVG } from '../components/PlantSVG';
import { NeuralOverlay } from '../components/NeuralOverlay';
import { DataFlowLines } from '../components/DataFlowLines';
import { ParticleProgressBar } from '../components/ParticleProgressBar';
import { NeuralBackground } from '../components/NeuralBackground';
import { useAuth } from '../../auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Title letters ──
const TITLE = 'HuertoConnect';
const TITLE_LETTERS = TITLE.split('');

// ── Letter component ──
const AnimatedLetter: React.FC<{
  letter: string;
  index: number;
  progress: SharedValue<number>;
  total: number;
}> = ({ letter, index, progress, total }) => {
  // Each letter appears during phase 2 (progress 0.32 → 0.65)
  const letterStart = 0.32 + (index / total) * 0.28;
  const letterEnd = letterStart + 0.06;

  const style = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [letterStart, letterEnd],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      progress.value,
      [letterStart, letterEnd],
      [1.4, 1],
      Extrapolation.CLAMP
    );
    const blur = interpolate(
      progress.value,
      [letterStart, letterEnd],
      [8, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.Text style={[styles.titleLetter, style]}>
      {letter}
    </Animated.Text>
  );
};

// ── Subtitle component ──
const AnimatedSubtitle: React.FC<{
  progress: SharedValue<number>;
}> = ({ progress }) => {
  const style = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0.55, 0.68],
      [0, 0.7],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [0.55, 0.68],
      [10, 0],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.Text style={[styles.subtitle, style]}>
      Monitoreo Inteligente de Huertos
    </Animated.Text>
  );
};

// ── Title glow background ──
const TitleGlow: React.FC<{
  progress: SharedValue<number>;
}> = ({ progress }) => {
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const baseOpacity = interpolate(
      progress.value,
      [0.30, 0.45, 0.80, 0.95],
      [0, 0.25, 0.25, 0.15],
      Extrapolation.CLAMP
    );
    const pulse = interpolate(pulseValue.value, [0, 1], [0.8, 1.2]);
    return {
      opacity: baseOpacity * pulse,
    };
  });

  return (
    <Animated.View style={[styles.titleGlow, style, { pointerEvents: 'none' } as any]} />
  );
};

// ── Main screen ──
export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const progress = useSharedValue(0);
  const buttonPulse = useSharedValue(0);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Main progress: 0 → 1 over 5 seconds
    progress.value = withTiming(1, {
      duration: 5000,
      easing: Easing.inOut(Easing.cubic),
    });

    // Button pulse starts after loading completes
    const timeout = setTimeout(() => {
      buttonPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }, 5200);

    return () => clearTimeout(timeout);
  }, []);

  // ── Ground surface line ──
  const groundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.05, 0.15],
      [0, 0, 0.3],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // ── Button ──
  const buttonContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0.82, 0.95],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [0.82, 0.95],
      [30, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      progress.value,
      [0.82, 0.95],
      [0.8, 1],
      Extrapolation.CLAMP
    );
    const pulseScale = interpolate(
      buttonPulse.value,
      [0, 1],
      [1, 1.04]
    );
    return {
      opacity,
      transform: [{ translateY }, { scale: scale * pulseScale }],
    };
  });

  // ── Button glow ring ──
  const buttonGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      buttonPulse.value,
      [0, 0.5, 1],
      [0, 0.4, 0]
    );
    const scale = interpolate(
      buttonPulse.value,
      [0, 1],
      [1, 1.3]
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // ── Earth texture overlay ──
  const earthOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.08],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // ── Ambient light ──
  const ambientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0.15, 0.40],
      [0, 0.15],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const handleStart = () => {
    if (isAuthenticated) {
      navigation.replace('Main');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#0A1F0C', '#0D1B0E', '#132A15', '#1A3A1C']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Subtle earth texture at bottom half ── */}
      <Animated.View style={[styles.earthOverlay, earthOverlayStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(30, 20, 10, 0.4)', 'rgba(40, 28, 15, 0.6)']}
          locations={[0.35, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── Ambient light from plant area ── */}
      <Animated.View style={[styles.ambientLight, ambientStyle, { pointerEvents: 'none' } as any]} />

      {/* ── Subtle neural network background mesh ── */}
      <NeuralBackground />

      {/* ── Title section ── */}
      <View style={styles.titleContainer}>
        <View style={styles.titleWrapper}>
          <TitleGlow progress={progress} />
          <View style={styles.titleRow}>
            {TITLE_LETTERS.map((letter, i) => (
              <AnimatedLetter
                key={i}
                letter={letter}
                index={i}
                progress={progress}
                total={TITLE_LETTERS.length}
              />
            ))}
          </View>
        </View>
        <AnimatedSubtitle progress={progress} />
      </View>

      {/* ── Plant area (central) ── */}
      <View style={styles.plantArea}>


        {/* SVG Plant */}
        <PlantSVG
          progress={progress}
          width={SCREEN_WIDTH * 0.8}
          height={SCREEN_HEIGHT * 0.45}
        />

        {/* Data flow particles */}
        <DataFlowLines
          progress={progress}
          width={SCREEN_WIDTH * 0.8}
          height={SCREEN_HEIGHT * 0.45}
        />

        {/* Neural overlay mesh */}
        <NeuralOverlay
          progress={progress}
          width={SCREEN_WIDTH * 0.8}
          height={SCREEN_HEIGHT * 0.45}
        />
      </View>

      {/* ── Comenzar button ── */}
      <Animated.View style={[styles.buttonSection, buttonContainerStyle]}>
        {/* Glow ring behind button */}
        <Animated.View style={[styles.buttonGlowRing, buttonGlowStyle]} />

        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.85}
          style={styles.buttonOuter}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={styles.buttonBlur}>
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>Comenzar</Text>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.buttonInner, styles.buttonAndroid]}>
              <Text style={styles.buttonText}>Comenzar</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Progress bar ── */}
      <View style={styles.progressSection}>
        <ParticleProgressBar progress={progress} />
      </View>
    </View>
  );
};

// ════════════════════════════════════════
// ██  STYLES
// ════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F0C',
  },

  // ── Earth / Ambient ──
  earthOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientLight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: SCREEN_WIDTH * 0.3,
    backgroundColor: '#2E7D32',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
  },

  // ── Title ──
  titleContainer: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.10,
    zIndex: 10,
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#C8E6C9',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleGlow: {
    position: 'absolute',
    top: -15,
    bottom: -15,
    left: -30,
    right: -30,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#81C784',
    letterSpacing: 2,
    marginTop: 15,
    textTransform: 'uppercase',
  },

  // ── Plant area ──
  plantArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  groundLine: {
    position: 'absolute',
    top: '60%',
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: '#5D4037',
  },

  // ── Button ──
  buttonSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonGlowRing: {
    position: 'absolute',
    width: 200,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#66BB6A',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  buttonOuter: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(102, 187, 106, 0.35)',
  },
  buttonBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonInner: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonAndroid: {
    backgroundColor: 'rgba(46, 125, 50, 0.55)',
    borderRadius: 28,
  },
  buttonText: {
    color: '#E8F5E9',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Progress bar ──
  progressSection: {
    paddingBottom: 20,
  },
});

export default SplashScreen;
