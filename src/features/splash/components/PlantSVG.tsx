/**
 * PlantSVG — Lush animated SVG plant with an extensive, dense root system,
 * thick stem, multiple leaf pairs, leaf veins, and a crown bud.
 * Progress (0→1) drives all drawing via strokeDashoffset.
 */

import React from 'react';
import Animated, {
  useAnimatedProps,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
  G,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface PlantSVGProps {
  progress: SharedValue<number>;
  width: number;
  height: number;
}

function useDrawProps(
  progress: SharedValue<number>,
  totalLen: number,
  drawStart: number,
  drawEnd: number,
  fadeStart: number,
  fadeEnd: number,
  maxOpacity: number = 1
) {
  return useAnimatedProps(() => {
    const draw = interpolate(progress.value, [drawStart, drawEnd], [totalLen, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [fadeStart, fadeEnd], [0, maxOpacity], Extrapolation.CLAMP);
    return { strokeDashoffset: draw, opacity };
  });
}

export const PlantSVG: React.FC<PlantSVGProps> = ({ progress, width, height }) => {
  const cx = width / 2;
  const groundY = height * 0.60;

  // ── SEED ──
  const seedGlowProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.05, 0.15, 0.35], [0, 0.9, 0.6, 0], Extrapolation.CLAMP),
    r: interpolate(progress.value, [0, 0.05, 0.2], [4, 22, 35], Extrapolation.CLAMP),
  }));
  const seedProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.03, 0.18, 0.30], [0, 1, 1, 0], Extrapolation.CLAMP),
    ry: interpolate(progress.value, [0, 0.03, 0.12], [0, 7, 9], Extrapolation.CLAMP),
  }));

  // ── ROOT COLLAR ──
  const collarProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0.08, 0.18], [0, 0.7], Extrapolation.CLAMP),
  }));

  // ════════════════════════════════════════════
  // ROOTS — Dense, sprawling system (20+ paths)
  // ════════════════════════════════════════════
  // Main taproot
  const r1 = useDrawProps(progress, 240, 0.04, 0.36, 0.04, 0.09);
  // Primary lateral roots (thick, wide-spreading)
  const r2 = useDrawProps(progress, 200, 0.06, 0.38, 0.06, 0.12, 0.9);
  const r3 = useDrawProps(progress, 190, 0.07, 0.39, 0.07, 0.13, 0.9);
  const r4 = useDrawProps(progress, 170, 0.09, 0.40, 0.09, 0.15, 0.85);
  const r5 = useDrawProps(progress, 160, 0.10, 0.41, 0.10, 0.16, 0.85);
  // Secondary roots (medium thickness)
  const r6 = useDrawProps(progress, 130, 0.13, 0.42, 0.13, 0.19, 0.75);
  const r7 = useDrawProps(progress, 120, 0.15, 0.43, 0.15, 0.20, 0.75);
  const r8 = useDrawProps(progress, 110, 0.16, 0.42, 0.16, 0.21, 0.7);
  const r9 = useDrawProps(progress, 105, 0.17, 0.43, 0.17, 0.22, 0.7);
  // Tertiary roots (thinner branches off primary)
  const r10 = useDrawProps(progress, 80, 0.18, 0.40, 0.18, 0.24, 0.6);
  const r11 = useDrawProps(progress, 75, 0.20, 0.42, 0.20, 0.25, 0.6);
  const r12 = useDrawProps(progress, 70, 0.21, 0.43, 0.21, 0.26, 0.6);
  const r13 = useDrawProps(progress, 65, 0.22, 0.42, 0.22, 0.27, 0.6);
  const r14 = useDrawProps(progress, 72, 0.19, 0.41, 0.19, 0.25, 0.55);
  const r15 = useDrawProps(progress, 68, 0.23, 0.44, 0.23, 0.28, 0.55);
  // Fine hair roots (tendrils)
  const r16 = useDrawProps(progress, 50, 0.24, 0.42, 0.24, 0.29, 0.45);
  const r17 = useDrawProps(progress, 45, 0.25, 0.43, 0.25, 0.30, 0.45);
  const r18 = useDrawProps(progress, 48, 0.26, 0.44, 0.26, 0.31, 0.45);
  const r19 = useDrawProps(progress, 42, 0.27, 0.43, 0.27, 0.32, 0.4);
  const r20 = useDrawProps(progress, 40, 0.28, 0.44, 0.28, 0.33, 0.4);
  const r21 = useDrawProps(progress, 38, 0.26, 0.42, 0.26, 0.31, 0.4);
  const r22 = useDrawProps(progress, 55, 0.22, 0.41, 0.22, 0.28, 0.5);
  const r23 = useDrawProps(progress, 52, 0.24, 0.43, 0.24, 0.29, 0.5);
  // Extra taproot sub-branches
  const r24 = useDrawProps(progress, 65, 0.14, 0.40, 0.14, 0.20, 0.65);
  const r25 = useDrawProps(progress, 60, 0.18, 0.42, 0.18, 0.24, 0.6);
  const r26 = useDrawProps(progress, 55, 0.22, 0.44, 0.22, 0.28, 0.55);
  const r27 = useDrawProps(progress, 50, 0.25, 0.45, 0.25, 0.30, 0.5);

  // ── STEM ──
  const stemLen = 180;
  const stemHeight = 165;
  const stemProps = useDrawProps(progress, stemLen, 0.08, 0.60, 0.08, 0.14);
  const stemShadowProps = useDrawProps(progress, stemLen, 0.08, 0.60, 0.08, 0.14, 0.3);

  // ── LEAVES ──
  const leaf1LProps = useDrawProps(progress, 100, 0.22, 0.40, 0.22, 0.28);
  const leaf1RProps = useDrawProps(progress, 100, 0.24, 0.42, 0.24, 0.30);
  const vein1LProps = useDrawProps(progress, 40, 0.30, 0.42, 0.30, 0.36, 0.5);
  const vein1RProps = useDrawProps(progress, 40, 0.32, 0.44, 0.32, 0.38, 0.5);
  const leaf2LProps = useDrawProps(progress, 130, 0.32, 0.52, 0.32, 0.38);
  const leaf2RProps = useDrawProps(progress, 130, 0.35, 0.55, 0.35, 0.40);
  const vein2LProps = useDrawProps(progress, 50, 0.40, 0.54, 0.40, 0.46, 0.5);
  const vein2RProps = useDrawProps(progress, 50, 0.42, 0.56, 0.42, 0.48, 0.5);
  const leaf3LProps = useDrawProps(progress, 150, 0.42, 0.62, 0.42, 0.48);
  const leaf3RProps = useDrawProps(progress, 150, 0.45, 0.65, 0.45, 0.50);
  const vein3LProps = useDrawProps(progress, 55, 0.50, 0.64, 0.50, 0.56, 0.5);
  const vein3RProps = useDrawProps(progress, 55, 0.52, 0.66, 0.52, 0.58, 0.5);
  const leaf4LProps = useDrawProps(progress, 140, 0.55, 0.75, 0.55, 0.60);
  const leaf4RProps = useDrawProps(progress, 140, 0.58, 0.78, 0.58, 0.63);
  const vein4LProps = useDrawProps(progress, 50, 0.62, 0.76, 0.62, 0.68, 0.5);
  const vein4RProps = useDrawProps(progress, 50, 0.65, 0.78, 0.65, 0.70, 0.5);
  const leaf5LProps = useDrawProps(progress, 120, 0.65, 0.85, 0.65, 0.70);
  const leaf5RProps = useDrawProps(progress, 120, 0.68, 0.88, 0.68, 0.72);
  const vein5LProps = useDrawProps(progress, 45, 0.72, 0.86, 0.72, 0.78, 0.5);
  const vein5RProps = useDrawProps(progress, 45, 0.74, 0.88, 0.74, 0.80, 0.5);

  // ── CROWN ──
  const budLen = 100;
  const budProps = useDrawProps(progress, budLen, 0.75, 0.95, 0.75, 0.80);
  const budInnerProps = useDrawProps(progress, 70, 0.80, 0.95, 0.80, 0.85, 0.8);
  const crownGlowProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0.85, 0.95], [0, 0.5], Extrapolation.CLAMP),
    r: interpolate(progress.value, [0.85, 0.95], [5, 18], Extrapolation.CLAMP),
  }));

  // Positions
  const stemTopY = groundY - stemHeight;
  const p1 = groundY - 38;
  const p2 = groundY - 68;
  const p3 = groundY - 98;
  const p4 = groundY - 125;
  const p5 = groundY - 148;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <RadialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A5D6A7" stopOpacity="0.8" />
          <Stop offset="60%" stopColor="#66BB6A" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="crownGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#E8F5E9" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#66BB6A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ── SEED ── */}
      <AnimatedCircle cx={cx} cy={groundY} fill="url(#seedGlow)" animatedProps={seedGlowProps} />
      <AnimatedEllipse cx={cx} cy={groundY} rx={6} fill="#5D4037" animatedProps={seedProps} />

      {/* ════════════ CONNECTED ROOT TREE ════════════ */}
      {/*
        All roots use Q (quadratic bezier) so endpoints are ON the curve.
        Junction variables: jT = taproot, jL = left, jR = right
        Sub-roots start M at a parent's junction point.
      */}

      {/* ── TAPROOT (center) ── segments with known junctions */}
      {/* Segment: crown → jT1 → jT2 → jT3 → jT4 → tip */}
      <AnimatedPath d={`M ${cx} ${groundY + 5} Q ${cx - 6} ${groundY + 25} ${cx - 2} ${groundY + 45} Q ${cx + 8} ${groundY + 65} ${cx - 4} ${groundY + 90} Q ${cx - 8} ${groundY + 110} ${cx + 6} ${groundY + 135} Q ${cx + 10} ${groundY + 158} ${cx - 2} ${groundY + 180} Q ${cx - 6} ${groundY + 195} ${cx + 2} ${groundY + 210}`}
        stroke="#5D4037" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={240} animatedProps={r1} />

      {/* ── LEFT PRIMARY (from base → wide left) ── */}
      {/* jLP1=(cx-35, gY+38) jLP2=(cx-68, gY+65) jLP3=(cx-105, gY+90) tip=(cx-130, gY+115) */}
      <AnimatedPath d={`M ${cx} ${groundY + 5} Q ${cx - 18} ${groundY + 20} ${cx - 35} ${groundY + 38} Q ${cx - 52} ${groundY + 52} ${cx - 68} ${groundY + 65} Q ${cx - 88} ${groundY + 78} ${cx - 105} ${groundY + 90} Q ${cx - 118} ${groundY + 102} ${cx - 130} ${groundY + 115}`}
        stroke="#6D4C41" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray={200} animatedProps={r2} />

      {/* ── RIGHT PRIMARY (from base → wide right) ── */}
      {/* jRP1=(cx+38, gY+40) jRP2=(cx+72, gY+68) jRP3=(cx+108, gY+92) tip=(cx+132, gY+118) */}
      <AnimatedPath d={`M ${cx} ${groundY + 5} Q ${cx + 18} ${groundY + 22} ${cx + 38} ${groundY + 40} Q ${cx + 55} ${groundY + 54} ${cx + 72} ${groundY + 68} Q ${cx + 92} ${groundY + 80} ${cx + 108} ${groundY + 92} Q ${cx + 120} ${groundY + 105} ${cx + 132} ${groundY + 118}`}
        stroke="#6D4C41" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray={190} animatedProps={r3} />

      {/* ── LEFT UPPER LATERAL (from base → shallow wide) ── */}
      {/* jLU1=(cx-45, gY+28) jLU2=(cx-82, gY+48) tip=(cx-125, gY+72) */}
      <AnimatedPath d={`M ${cx} ${groundY + 5} Q ${cx - 22} ${groundY + 15} ${cx - 45} ${groundY + 28} Q ${cx - 65} ${groundY + 38} ${cx - 82} ${groundY + 48} Q ${cx - 102} ${groundY + 58} ${cx - 118} ${groundY + 65} Q ${cx - 125} ${groundY + 70} ${cx - 125} ${groundY + 78}`}
        stroke="#795548" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray={170} animatedProps={r4} />

      {/* ── RIGHT UPPER LATERAL (from base → shallow wide) ── */}
      {/* jRU1=(cx+48, gY+30) jRU2=(cx+85, gY+50) tip=(cx+122, gY+75) */}
      <AnimatedPath d={`M ${cx} ${groundY + 5} Q ${cx + 24} ${groundY + 16} ${cx + 48} ${groundY + 30} Q ${cx + 68} ${groundY + 40} ${cx + 85} ${groundY + 50} Q ${cx + 105} ${groundY + 60} ${cx + 118} ${groundY + 68} Q ${cx + 122} ${groundY + 72} ${cx + 120} ${groundY + 80}`}
        stroke="#795548" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray={160} animatedProps={r5} />

      {/* ── Branch off TAPROOT at jT2 (cx-4, gY+90) → slightly left-down ── */}
      <AnimatedPath d={`M ${cx - 4} ${groundY + 90} Q ${cx - 12} ${groundY + 105} ${cx - 18} ${groundY + 118} Q ${cx - 22} ${groundY + 132} ${cx - 25} ${groundY + 148}`}
        stroke="#8D6E63" strokeWidth={1.7} fill="none" strokeLinecap="round" strokeDasharray={130} animatedProps={r6} />

      {/* ── Branch off TAPROOT at jT2 (cx-4, gY+90) → slightly right-down ── */}
      <AnimatedPath d={`M ${cx - 4} ${groundY + 90} Q ${cx + 8} ${groundY + 105} ${cx + 15} ${groundY + 120} Q ${cx + 18} ${groundY + 135} ${cx + 22} ${groundY + 150}`}
        stroke="#8D6E63" strokeWidth={1.7} fill="none" strokeLinecap="round" strokeDasharray={120} animatedProps={r7} />

      {/* ── Branch off LEFT PRIMARY at jLP1 (cx-35, gY+38) → down ── */}
      <AnimatedPath d={`M ${cx - 35} ${groundY + 38} Q ${cx - 48} ${groundY + 52} ${cx - 58} ${groundY + 68} Q ${cx - 65} ${groundY + 80} ${cx - 72} ${groundY + 95} Q ${cx - 78} ${groundY + 105} ${cx - 82} ${groundY + 115}`}
        stroke="#8D6E63" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeDasharray={110} animatedProps={r8} />

      {/* ── Branch off RIGHT PRIMARY at jRP1 (cx+38, gY+40) → down ── */}
      <AnimatedPath d={`M ${cx + 38} ${groundY + 40} Q ${cx + 50} ${groundY + 55} ${cx + 58} ${groundY + 70} Q ${cx + 65} ${groundY + 82} ${cx + 72} ${groundY + 98} Q ${cx + 78} ${groundY + 108} ${cx + 80} ${groundY + 118}`}
        stroke="#8D6E63" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeDasharray={105} animatedProps={r9} />

      {/* ── Sub-branch off LEFT PRIMARY at jLP2 (cx-68, gY+65) ── */}
      <AnimatedPath d={`M ${cx - 68} ${groundY + 65} Q ${cx - 82} ${groundY + 72} ${cx - 95} ${groundY + 68} Q ${cx - 108} ${groundY + 75} ${cx - 115} ${groundY + 85}`}
        stroke="#A1887F" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeDasharray={80} animatedProps={r10} />

      {/* ── Sub-branch off RIGHT PRIMARY at jRP2 (cx+72, gY+68) ── */}
      <AnimatedPath d={`M ${cx + 72} ${groundY + 68} Q ${cx + 85} ${groundY + 72} ${cx + 98} ${groundY + 68} Q ${cx + 108} ${groundY + 78} ${cx + 115} ${groundY + 88}`}
        stroke="#A1887F" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeDasharray={75} animatedProps={r11} />

      {/* ── Branch off TAPROOT at jT1 (cx-2, gY+45) → slightly left-down ── */}
      <AnimatedPath d={`M ${cx - 2} ${groundY + 45} Q ${cx - 10} ${groundY + 55} ${cx - 15} ${groundY + 65} Q ${cx - 18} ${groundY + 75} ${cx - 20} ${groundY + 85}`}
        stroke="#8D6E63" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeDasharray={70} animatedProps={r12} />

      {/* ── Branch off TAPROOT at jT1 (cx-2, gY+45) → slightly right-down ── */}
      <AnimatedPath d={`M ${cx - 2} ${groundY + 45} Q ${cx + 8} ${groundY + 55} ${cx + 12} ${groundY + 65} Q ${cx + 15} ${groundY + 75} ${cx + 18} ${groundY + 85}`}
        stroke="#8D6E63" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeDasharray={65} animatedProps={r13} />

      {/* ── Tendril off LEFT UPPER at jLU1 (cx-45, gY+28) ── */}
      <AnimatedPath d={`M ${cx - 45} ${groundY + 28} Q ${cx - 58} ${groundY + 35} ${cx - 68} ${groundY + 32} Q ${cx - 78} ${groundY + 38} ${cx - 88} ${groundY + 45}`}
        stroke="#A1887F" strokeWidth={1.1} fill="none" strokeLinecap="round" strokeDasharray={72} animatedProps={r14} />

      {/* ── Tendril off RIGHT UPPER at jRU1 (cx+48, gY+30) ── */}
      <AnimatedPath d={`M ${cx + 48} ${groundY + 30} Q ${cx + 62} ${groundY + 35} ${cx + 72} ${groundY + 32} Q ${cx + 82} ${groundY + 40} ${cx + 90} ${groundY + 48}`}
        stroke="#A1887F" strokeWidth={1.1} fill="none" strokeLinecap="round" strokeDasharray={68} animatedProps={r15} />

      {/* ── Hair root off LEFT PRIMARY tip (cx-130, gY+115) ── */}
      <AnimatedPath d={`M ${cx - 130} ${groundY + 115} Q ${cx - 138} ${groundY + 122} ${cx - 142} ${groundY + 132}`}
        stroke="#BCAAA4" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={r16} />
      {/* ── Hair root off RIGHT PRIMARY tip (cx+132, gY+118) ── */}
      <AnimatedPath d={`M ${cx + 132} ${groundY + 118} Q ${cx + 138} ${groundY + 128} ${cx + 135} ${groundY + 138}`}
        stroke="#BCAAA4" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={45} animatedProps={r17} />
      {/* ── Hair root off left branch r8 tip (cx-82, gY+115) ── */}
      <AnimatedPath d={`M ${cx - 82} ${groundY + 115} Q ${cx - 92} ${groundY + 122} ${cx - 100} ${groundY + 130}`}
        stroke="#BCAAA4" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={48} animatedProps={r18} />
      {/* ── Hair root off right branch r9 tip (cx+80, gY+118) ── */}
      <AnimatedPath d={`M ${cx + 80} ${groundY + 118} Q ${cx + 90} ${groundY + 125} ${cx + 98} ${groundY + 135}`}
        stroke="#BCAAA4" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={42} animatedProps={r19} />


      {/* ── Branch off r6 tip (cx-85, gY+150) → deeper ── */}
      <AnimatedPath d={`M ${cx - 85} ${groundY + 150} Q ${cx - 92} ${groundY + 160} ${cx - 98} ${groundY + 172}`}
        stroke="#A1887F" strokeWidth={1} fill="none" strokeLinecap="round" strokeDasharray={55} animatedProps={r22} />
      {/* ── Branch off r7 tip (cx+80, gY+148) → deeper ── */}
      <AnimatedPath d={`M ${cx + 80} ${groundY + 148} Q ${cx + 88} ${groundY + 158} ${cx + 95} ${groundY + 170}`}
        stroke="#A1887F" strokeWidth={1} fill="none" strokeLinecap="round" strokeDasharray={52} animatedProps={r23} />

      {/* ── Extra taproot branches at jT3 (cx+6, gY+135) → following center down ── */}
      <AnimatedPath d={`M ${cx + 6} ${groundY + 135} Q ${cx - 5} ${groundY + 148} ${cx - 10} ${groundY + 160} Q ${cx - 12} ${groundY + 172} ${cx - 15} ${groundY + 182}`}
        stroke="#8D6E63" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeDasharray={65} animatedProps={r24} />
      <AnimatedPath d={`M ${cx + 6} ${groundY + 135} Q ${cx + 14} ${groundY + 148} ${cx + 16} ${groundY + 160} Q ${cx + 18} ${groundY + 172} ${cx + 20} ${groundY + 182}`}
        stroke="#8D6E63" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeDasharray={60} animatedProps={r25} />
      {/* ── Extra taproot branch at jT4 (cx-2, gY+180) → left ── */}
      <AnimatedPath d={`M ${cx - 2} ${groundY + 180} Q ${cx - 18} ${groundY + 185} ${cx - 32} ${groundY + 190} Q ${cx - 42} ${groundY + 195} ${cx - 48} ${groundY + 205}`}
        stroke="#A1887F" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeDasharray={55} animatedProps={r26} />
      {/* ── Extra taproot branch at jT3 (cx+6, gY+135) → down-right ── */}
      <AnimatedPath d={`M ${cx + 6} ${groundY + 135} Q ${cx + 15} ${groundY + 155} ${cx + 18} ${groundY + 172} Q ${cx + 22} ${groundY + 185} ${cx + 28} ${groundY + 195}`}
        stroke="#A1887F" strokeWidth={1.1} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={r27} />

      {/* ── ROOT COLLAR ── */}
      <AnimatedEllipse cx={cx} cy={groundY + 2} rx={10} ry={6} fill="#5D4037" animatedProps={collarProps} />
      <AnimatedEllipse cx={cx} cy={groundY - 1} rx={8} ry={4} fill="#33691E" animatedProps={collarProps} />

      {/* ── STEM ── */}
      <AnimatedPath d={`M ${cx + 2} ${groundY - 2} Q ${cx - 2} ${groundY - 42} ${cx + 4} ${groundY - 82} Q ${cx + 5} ${groundY - 120} ${cx + 2} ${groundY - 145} L ${cx} ${stemTopY}`}
        stroke="#2E7D32" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={stemLen} animatedProps={stemShadowProps} />
      <AnimatedPath d={`M ${cx} ${groundY - 2} Q ${cx - 3} ${groundY - 42} ${cx + 3} ${groundY - 82} Q ${cx + 4} ${groundY - 120} ${cx + 1} ${groundY - 145} L ${cx} ${stemTopY}`}
        stroke="#43A047" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={stemLen} animatedProps={stemProps} />

      {/* ── LEAVES ── */}
      <AnimatedPath d={`M ${cx - 1} ${p1} Q ${cx - 28} ${p1 - 18} ${cx - 38} ${p1 - 8} Q ${cx - 30} ${p1 + 5} ${cx - 1} ${p1}`}
        stroke="#66BB6A" strokeWidth={1.4} fill="#4CAF50" fillOpacity={0.65} strokeLinecap="round" strokeDasharray={100} animatedProps={leaf1LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p1} Q ${cx + 28} ${p1 - 18} ${cx + 38} ${p1 - 8} Q ${cx + 30} ${p1 + 5} ${cx + 1} ${p1}`}
        stroke="#66BB6A" strokeWidth={1.4} fill="#4CAF50" fillOpacity={0.65} strokeLinecap="round" strokeDasharray={100} animatedProps={leaf1RProps} />
      <AnimatedPath d={`M ${cx - 1} ${p1} Q ${cx - 18} ${p1 - 8} ${cx - 30} ${p1 - 5}`}
        stroke="#A5D6A7" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={40} animatedProps={vein1LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p1} Q ${cx + 18} ${p1 - 8} ${cx + 30} ${p1 - 5}`}
        stroke="#A5D6A7" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={40} animatedProps={vein1RProps} />

      <AnimatedPath d={`M ${cx - 1} ${p2} Q ${cx - 35} ${p2 - 24} ${cx - 52} ${p2 - 12} Q ${cx - 40} ${p2 + 6} ${cx - 1} ${p2}`}
        stroke="#43A047" strokeWidth={1.5} fill="#4CAF50" fillOpacity={0.7} strokeLinecap="round" strokeDasharray={130} animatedProps={leaf2LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p2} Q ${cx + 35} ${p2 - 24} ${cx + 52} ${p2 - 12} Q ${cx + 40} ${p2 + 6} ${cx + 1} ${p2}`}
        stroke="#43A047" strokeWidth={1.5} fill="#4CAF50" fillOpacity={0.7} strokeLinecap="round" strokeDasharray={130} animatedProps={leaf2RProps} />
      <AnimatedPath d={`M ${cx - 1} ${p2} Q ${cx - 25} ${p2 - 12} ${cx - 42} ${p2 - 8}`}
        stroke="#A5D6A7" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={vein2LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p2} Q ${cx + 25} ${p2 - 12} ${cx + 42} ${p2 - 8}`}
        stroke="#A5D6A7" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={vein2RProps} />

      <AnimatedPath d={`M ${cx - 2} ${p3} Q ${cx - 42} ${p3 - 28} ${cx - 62} ${p3 - 14} Q ${cx - 48} ${p3 + 8} ${cx - 2} ${p3}`}
        stroke="#388E3C" strokeWidth={1.6} fill="#4CAF50" fillOpacity={0.75} strokeLinecap="round" strokeDasharray={150} animatedProps={leaf3LProps} />
      <AnimatedPath d={`M ${cx + 2} ${p3} Q ${cx + 42} ${p3 - 28} ${cx + 62} ${p3 - 14} Q ${cx + 48} ${p3 + 8} ${cx + 2} ${p3}`}
        stroke="#388E3C" strokeWidth={1.6} fill="#4CAF50" fillOpacity={0.75} strokeLinecap="round" strokeDasharray={150} animatedProps={leaf3RProps} />
      <AnimatedPath d={`M ${cx - 2} ${p3} Q ${cx - 30} ${p3 - 14} ${cx - 50} ${p3 - 10}`}
        stroke="#C8E6C9" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={55} animatedProps={vein3LProps} />
      <AnimatedPath d={`M ${cx + 2} ${p3} Q ${cx + 30} ${p3 - 14} ${cx + 50} ${p3 - 10}`}
        stroke="#C8E6C9" strokeWidth={0.9} fill="none" strokeLinecap="round" strokeDasharray={55} animatedProps={vein3RProps} />

      <AnimatedPath d={`M ${cx - 1} ${p4} Q ${cx - 38} ${p4 - 25} ${cx - 55} ${p4 - 12} Q ${cx - 42} ${p4 + 7} ${cx - 1} ${p4}`}
        stroke="#2E7D32" strokeWidth={1.5} fill="#66BB6A" fillOpacity={0.7} strokeLinecap="round" strokeDasharray={140} animatedProps={leaf4LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p4} Q ${cx + 38} ${p4 - 25} ${cx + 55} ${p4 - 12} Q ${cx + 42} ${p4 + 7} ${cx + 1} ${p4}`}
        stroke="#2E7D32" strokeWidth={1.5} fill="#66BB6A" fillOpacity={0.7} strokeLinecap="round" strokeDasharray={140} animatedProps={leaf4RProps} />
      <AnimatedPath d={`M ${cx - 1} ${p4} Q ${cx - 26} ${p4 - 13} ${cx - 44} ${p4 - 8}`}
        stroke="#C8E6C9" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={vein4LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p4} Q ${cx + 26} ${p4 - 13} ${cx + 44} ${p4 - 8}`}
        stroke="#C8E6C9" strokeWidth={0.8} fill="none" strokeLinecap="round" strokeDasharray={50} animatedProps={vein4RProps} />

      <AnimatedPath d={`M ${cx - 1} ${p5} Q ${cx - 32} ${p5 - 20} ${cx - 45} ${p5 - 10} Q ${cx - 35} ${p5 + 5} ${cx - 1} ${p5}`}
        stroke="#1B5E20" strokeWidth={1.4} fill="#81C784" fillOpacity={0.65} strokeLinecap="round" strokeDasharray={120} animatedProps={leaf5LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p5} Q ${cx + 32} ${p5 - 20} ${cx + 45} ${p5 - 10} Q ${cx + 35} ${p5 + 5} ${cx + 1} ${p5}`}
        stroke="#1B5E20" strokeWidth={1.4} fill="#81C784" fillOpacity={0.65} strokeLinecap="round" strokeDasharray={120} animatedProps={leaf5RProps} />
      <AnimatedPath d={`M ${cx - 1} ${p5} Q ${cx - 22} ${p5 - 10} ${cx - 36} ${p5 - 7}`}
        stroke="#E8F5E9" strokeWidth={0.7} fill="none" strokeLinecap="round" strokeDasharray={45} animatedProps={vein5LProps} />
      <AnimatedPath d={`M ${cx + 1} ${p5} Q ${cx + 22} ${p5 - 10} ${cx + 36} ${p5 - 7}`}
        stroke="#E8F5E9" strokeWidth={0.7} fill="none" strokeLinecap="round" strokeDasharray={45} animatedProps={vein5RProps} />

      {/* ── CROWN BUD ── */}
      <AnimatedPath d={`M ${cx} ${stemTopY} Q ${cx - 20} ${stemTopY - 28} ${cx} ${stemTopY - 42} Q ${cx + 20} ${stemTopY - 28} ${cx} ${stemTopY}`}
        stroke="#1B5E20" strokeWidth={1.8} fill="#A5D6A7" fillOpacity={0.6} strokeLinecap="round" strokeDasharray={budLen} animatedProps={budProps} />
      <AnimatedPath d={`M ${cx} ${stemTopY - 6} Q ${cx - 11} ${stemTopY - 24} ${cx} ${stemTopY - 34} Q ${cx + 11} ${stemTopY - 24} ${cx} ${stemTopY - 6}`}
        stroke="#2E7D32" strokeWidth={1.3} fill="#C8E6C9" fillOpacity={0.5} strokeLinecap="round" strokeDasharray={70} animatedProps={budInnerProps} />
      <AnimatedCircle cx={cx} cy={stemTopY - 24} fill="url(#crownGlow)" animatedProps={crownGlowProps} />
    </Svg>
  );
};

export default PlantSVG;
