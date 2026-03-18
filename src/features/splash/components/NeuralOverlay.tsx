/**
 * NeuralOverlay — Organic neural-network mesh that grows WITH the plant.
 * Nodes and edges appear progressively keyed to the overall progress,
 * with pulsing opacity and gentle positional sway for a living feel.
 */

import React, { useMemo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Line, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface NeuralOverlayProps {
  progress: SharedValue<number>;
  width: number;
  height: number;
}

interface NNode {
  x: number;
  y: number;
  /** progress threshold at which this node appears (0-1) */
  appearsAt: number;
}

interface NEdge {
  from: number;
  to: number;
}

/** Single animated node that fades/scales in at a specific progress point */
const AnimNode: React.FC<{
  node: NNode;
  progress: SharedValue<number>;
  index: number;
}> = ({ node, progress, index }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      index * 180,
      withRepeat(
        withTiming(1, { duration: 1400 + index * 100, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const props = useAnimatedProps(() => {
    const baseOpacity = interpolate(
      progress.value,
      [node.appearsAt, node.appearsAt + 0.06, 0.85, 0.95],
      [0, 0.85, 0.85, 0],
      Extrapolation.CLAMP
    );
    const pulseR = interpolate(pulse.value, [0, 1], [2.5, 4]);
    const pulseOp = interpolate(pulse.value, [0, 0.5, 1], [0.6, 1, 0.6]);

    return {
      r: pulseR,
      opacity: baseOpacity * pulseOp,
    };
  });

  return (
    <AnimatedCircle
      cx={node.x}
      cy={node.y}
      fill="#C8E6C9"
      animatedProps={props}
    />
  );
};

/** Single animated edge that draws in at the later of its two node thresholds */
const AnimEdge: React.FC<{
  edge: NEdge;
  nodes: NNode[];
  progress: SharedValue<number>;
  index: number;
}> = ({ edge, nodes, progress, index }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      index * 120,
      withRepeat(
        withTiming(1, { duration: 2000 + index * 80, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const edgeAppearsAt = Math.max(nodes[edge.from].appearsAt, nodes[edge.to].appearsAt);

  const props = useAnimatedProps(() => {
    const baseOpacity = interpolate(
      progress.value,
      [edgeAppearsAt, edgeAppearsAt + 0.08, 0.85, 0.95],
      [0, 0.5, 0.5, 0],
      Extrapolation.CLAMP
    );
    const pulseOp = interpolate(pulse.value, [0, 0.5, 1], [0.5, 1, 0.5]);

    return {
      opacity: baseOpacity * pulseOp,
    };
  });

  return (
    <AnimatedLine
      x1={nodes[edge.from].x}
      y1={nodes[edge.from].y}
      x2={nodes[edge.to].x}
      y2={nodes[edge.to].y}
      stroke="#A5D6A7"
      strokeWidth={0.9}
      animatedProps={props}
    />
  );
};

export const NeuralOverlay: React.FC<NeuralOverlayProps> = ({ progress, width, height }) => {
  const cx = width / 2;
  const groundY = height * 0.60;

  // Nodes positioned along the plant, each with its own appearance threshold
  // tied to when the plant reaches that height
  const nodes: NNode[] = useMemo(() => [
    // Root area nodes (appear early)
    { x: cx - 28, y: groundY + 30, appearsAt: 0.18 },
    { x: cx + 30, y: groundY + 35, appearsAt: 0.20 },
    { x: cx - 45, y: groundY + 55, appearsAt: 0.22 },
    { x: cx + 42, y: groundY + 50, appearsAt: 0.24 },

    // Lower stem area
    { x: cx - 35, y: groundY - 25, appearsAt: 0.26 },
    { x: cx + 32, y: groundY - 30, appearsAt: 0.28 },

    // Pair 1-2 area
    { x: cx - 42, y: groundY - 55, appearsAt: 0.32 },
    { x: cx + 40, y: groundY - 50, appearsAt: 0.34 },
    { x: cx - 18, y: groundY - 65, appearsAt: 0.35 },

    // Pair 2-3 area
    { x: cx + 50, y: groundY - 80, appearsAt: 0.40 },
    { x: cx - 55, y: groundY - 85, appearsAt: 0.42 },
    { x: cx + 15, y: groundY - 95, appearsAt: 0.44 },

    // Pair 3-4 area
    { x: cx - 48, y: groundY - 115, appearsAt: 0.50 },
    { x: cx + 52, y: groundY - 110, appearsAt: 0.52 },
    { x: cx - 12, y: groundY - 125, appearsAt: 0.54 },

    // Pair 4-5 area
    { x: cx + 38, y: groundY - 140, appearsAt: 0.58 },
    { x: cx - 40, y: groundY - 145, appearsAt: 0.60 },

    // Crown area
    { x: cx + 22, y: groundY - 165, appearsAt: 0.68 },
    { x: cx - 25, y: groundY - 168, appearsAt: 0.70 },
    { x: cx, y: groundY - 185, appearsAt: 0.75 },
  ], [width, height]);

  // Connect nearby nodes
  const edges: NEdge[] = useMemo(() => {
    const result: NEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 65) {
          result.push({ from: i, to: j });
        }
      }
    }
    return result;
  }, [nodes]);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Edges first (behind nodes) */}
        {edges.map((edge, i) => (
          <AnimEdge key={`e-${i}`} edge={edge} nodes={nodes} progress={progress} index={i} />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => (
          <AnimNode key={`n-${i}`} node={node} progress={progress} index={i} />
        ))}
      </Svg>
    </Animated.View>
  );
};

export default NeuralOverlay;
