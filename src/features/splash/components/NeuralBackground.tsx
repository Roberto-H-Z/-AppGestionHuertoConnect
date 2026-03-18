/**
 * NeuralBackground — Subtle, slowly drifting neural network mesh.
 * Nodes float gently across the screen, edges connect nearby nodes.
 * Minimalist, discrete, but with visible smooth movement.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Line, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const { width: SW, height: SH } = Dimensions.get('window');

interface NodeData {
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

function generateNodes(count: number): NodeData[] {
  const nodes: NodeData[] = [];
  // Grid-based distribution across FULL screen with organic offsets
  const cols = 5;
  const rows = Math.ceil(count / cols);
  const cellW = SW / cols;
  const cellH = SH / rows;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Place at cell center with organic offset
    const offsetX = Math.sin(i * 2.7) * cellW * 0.3;
    const offsetY = Math.cos(i * 1.9) * cellH * 0.3;
    nodes.push({
      baseX: cellW * (col + 0.5) + offsetX,
      baseY: cellH * (row + 0.5) + offsetY,
      driftX: 15 + Math.sin(i * 1.7) * 10,
      driftY: 12 + Math.cos(i * 1.3) * 8,
      duration: 5000 + (i % 5) * 1500,
      delay: (i * 300) % 2000,
    });
  }
  return nodes;
}

function generateEdges(nodes: NodeData[], maxDist: number) {
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].baseX - nodes[j].baseX;
      const dy = nodes[i].baseY - nodes[j].baseY;
      if (Math.sqrt(dx * dx + dy * dy) < maxDist) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

/* ────── Single drifting node ────── */
const DriftingNode: React.FC<{ node: NodeData; idx: number }> = React.memo(({ node, idx }) => {
  const phase = useSharedValue(0);

  useEffect(() => {
    // Continuous ping-pong 0→1→0
    phase.value = withDelay(
      node.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: node.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: node.duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const props = useAnimatedProps(() => ({
    cx: node.baseX + interpolate(phase.value, [0, 0.5, 1], [-node.driftX / 2, node.driftX / 2, -node.driftX / 2]),
    cy: node.baseY + interpolate(phase.value, [0, 0.5, 1], [-node.driftY / 2, node.driftY / 2, -node.driftY / 2]),
    opacity: interpolate(phase.value, [0, 0.3, 0.7, 1], [0.08, 0.18, 0.18, 0.08]),
  }));

  return (
    <AnimatedCircle
      r={1.5}
      fill="#A5D6A7"
      animatedProps={props}
    />
  );
});

/* ────── Single drifting edge ────── */
const DriftingEdge: React.FC<{ n1: NodeData; n2: NodeData }> = React.memo(({ n1, n2 }) => {
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);

  useEffect(() => {
    p1.value = withDelay(
      n1.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: n1.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: n1.duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    p2.value = withDelay(
      n2.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: n2.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: n2.duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const props = useAnimatedProps(() => ({
    x1: n1.baseX + interpolate(p1.value, [0, 0.5, 1], [-n1.driftX / 2, n1.driftX / 2, -n1.driftX / 2]),
    y1: n1.baseY + interpolate(p1.value, [0, 0.5, 1], [-n1.driftY / 2, n1.driftY / 2, -n1.driftY / 2]),
    x2: n2.baseX + interpolate(p2.value, [0, 0.5, 1], [-n2.driftX / 2, n2.driftX / 2, -n2.driftX / 2]),
    y2: n2.baseY + interpolate(p2.value, [0, 0.5, 1], [-n2.driftY / 2, n2.driftY / 2, -n2.driftY / 2]),
    opacity: interpolate((p1.value + p2.value) / 2, [0, 0.5, 1], [0.04, 0.10, 0.04]),
  }));

  return (
    <AnimatedLine
      stroke="#81C784"
      strokeWidth={0.6}
      animatedProps={props}
    />
  );
});

/* ────── Main component ────── */
export const NeuralBackground: React.FC = () => {
  const nodes = useMemo(() => generateNodes(24), []);
  const edges = useMemo(() => generateEdges(nodes, 140), [nodes]);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        {edges.map(([i, j], idx) => (
          <DriftingEdge key={`e-${idx}`} n1={nodes[i]} n2={nodes[j]} />
        ))}
        {nodes.map((node, i) => (
          <DriftingNode key={`n-${i}`} node={node} idx={i} />
        ))}
      </Svg>
    </Animated.View>
  );
};

export default NeuralBackground;
