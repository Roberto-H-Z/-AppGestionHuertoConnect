import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Simple outline leaf icon (matching the web reference exactly) ──
const LeafIcon = ({ size }: { size: number }) => (
    <Svg width={size} height={size * 1.4} viewBox="0 0 24 34" fill="none">
        {/* Leaf body - simple teardrop/leaf outline */}
        <Path
            d="M12,2 C6,2 2,8 2,16 C2,24 7,32 12,32 C17,32 22,24 22,16 C22,8 18,2 12,2 Z"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={1.4}
            fill="none"
        />
        {/* Center vein */}
        <Path
            d="M12,4 L12,30"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={0.9}
            fill="none"
        />
        {/* Side veins */}
        <Path
            d="M12,10 L7,14"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.6}
            fill="none"
        />
        <Path
            d="M12,10 L17,14"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.6}
            fill="none"
        />
        <Path
            d="M12,17 L6,22"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.6}
            fill="none"
        />
        <Path
            d="M12,17 L18,22"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.6}
            fill="none"
        />
    </Svg>
);

// ── Tilt hook using Accelerometer (optional, falls back gracefully) ──
function useTilt(): { x: number; y: number } {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let subscription: { remove: () => void } | null = null;

        const setup = async () => {
            try {
                // @ts-ignore — expo-sensors is an optional dependency
                const Sensors = await import('expo-sensors');
                const { Accelerometer } = Sensors;
                Accelerometer.setUpdateInterval(100);
                subscription = Accelerometer.addListener(({ x, y }: { x: number; y: number }) => {
                    // Clamp values to avoid extreme movement
                    setTilt({
                        x: Math.max(-1, Math.min(1, x)),
                        y: Math.max(-1, Math.min(1, y)),
                    });
                });
            } catch {
                // expo-sensors not installed — tilt stays at 0,0
            }
        };

        setup();
        return () => {
            subscription?.remove?.();
        };
    }, []);

    return tilt;
}

// ── Leaf configuration ──
interface LeafConfig {
    id: number;
    size: number;
    opacity: number;
    startX: number;
    initialY: number;
    fallDuration: number;
    swayAmount: number;
    swayDuration: number;
    initialRotationDeg: number;
    rotateDuration: number;
    rotateDirection: 1 | -1;
}

const LEAF_COUNT = 30;

const generateLeaves = (): LeafConfig[] => {
    return Array.from({ length: LEAF_COUNT }, (_, i) => ({
        id: i,
        size: 14 + Math.random() * 14, // 14–28
        opacity: 0.12 + Math.random() * 0.25, // 0.12–0.37 (slightly more visible)
        startX: Math.random() * SCREEN_WIDTH,
        // Distribute across screen + above so it's full on first render
        initialY: -(SCREEN_HEIGHT * 0.3) + Math.random() * (SCREEN_HEIGHT * 1.3),
        fallDuration: 14000 + Math.random() * 12000, // 14–26s (slow & fluid)
        swayAmount: 12 + Math.random() * 30, // 12–42px
        swayDuration: 2000 + Math.random() * 3000, // 2–5s per sway
        initialRotationDeg: Math.floor(Math.random() * 360), // any orientation
        rotateDuration: 5000 + Math.random() * 8000, // 5–13s per full spin
        rotateDirection: Math.random() > 0.5 ? 1 : -1, // CW or CCW
    }));
};

// ── Single animated leaf ──
const Leaf: React.FC<{ config: LeafConfig; tiltX: number }> = React.memo(
    ({ config, tiltX }) => {
        const translateY = useRef(new Animated.Value(config.initialY)).current;
        const translateX = useRef(new Animated.Value(0)).current;
        const rotate = useRef(new Animated.Value(0)).current;
        const tiltOffset = useRef(new Animated.Value(0)).current;

        // Smooth tilt response
        useEffect(() => {
            Animated.timing(tiltOffset, {
                toValue: tiltX * 60, // max 60px drift based on tilt
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }, [tiltX, tiltOffset]);

        useEffect(() => {
            const totalFallDistance = SCREEN_HEIGHT + config.size * 3;
            const remainingFromStart = totalFallDistance - config.initialY;
            const firstDuration =
                (remainingFromStart / totalFallDistance) * config.fallDuration;

            // Sway
            const sway = Animated.loop(
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: config.swayAmount,
                        duration: config.swayDuration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: -config.swayAmount,
                        duration: config.swayDuration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            );

            // Rotation — always animate 0→1, direction handled in outputRange
            const spin = Animated.loop(
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: config.rotateDuration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );

            // Fall loop
            const startFall = (duration: number, fromY: number) => {
                translateY.setValue(fromY);
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT + config.size * 3,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    if (finished) {
                        // Recycle from just above screen with slight X variation
                        startFall(
                            config.fallDuration,
                            -(config.size * 3 + Math.random() * 30)
                        );
                    }
                });
            };

            sway.start();
            spin.start();
            startFall(firstDuration, config.initialY);

            return () => {
                sway.stop();
                spin.stop();
                translateY.stopAnimation();
            };
        }, []);

        // inputRange is always [0, 1] (monotonically increasing)
        // rotateDirection controls CW (+360) vs CCW (-360) in outputRange
        const rotateInterpolate = rotate.interpolate({
            inputRange: [0, 1],
            outputRange: [
                `${config.initialRotationDeg}deg`,
                `${config.initialRotationDeg + 360 * config.rotateDirection}deg`,
            ],
        });

        return (
            <Animated.View
                style={[
                    styles.leaf,
                    {
                        left: config.startX,
                        opacity: config.opacity,
                        transform: [
                            { translateY },
                            {
                                translateX: Animated.add(translateX, tiltOffset),
                            },
                            { rotate: rotateInterpolate },
                        ],
                    },
                ]}
                pointerEvents="none"
            >
                <LeafIcon size={config.size} />
            </Animated.View>
        );
    }
);

// ── Main component ──
export const FallingLeaves: React.FC = () => {
    const leaves = useMemo(() => generateLeaves(), []);
    const tilt = useTilt();

    return (
        <View style={styles.container} pointerEvents="none">
            {leaves.map((leaf) => (
                <Leaf key={leaf.id} config={leaf} tiltX={tilt.x} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 1,
    },
    leaf: {
        position: 'absolute',
        top: 0,
    },
});

export default FallingLeaves;
