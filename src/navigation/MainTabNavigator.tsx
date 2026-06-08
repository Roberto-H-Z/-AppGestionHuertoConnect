import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
    HomeScreen,
    MonitoringScreen,
    AIChatScreen,
    CommunityScreen,
    ProfileScreen,
} from '../features/main';
import { palette } from '../features/main/theme';

const Tab = createBottomTabNavigator();
const SIDE_INSET = 16;
const TOP_CORNER_RADIUS = 16;

const icons: Record<string, string> = {
    Home: 'home-variant-outline',
    Monitoring: 'chart-timeline-variant',
    AIChat: 'creation-outline',
    Community: 'account-group-outline',
    Profile: 'account-circle-outline',
};

const CustomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
    const [barWidth, setBarWidth] = useState(0);
    const [indicatorPosition, setIndicatorPosition] = useState(state.index);
    const activeIndex = useRef(new Animated.Value(state.index)).current;
    const contentWidth = Math.max(0, barWidth - SIDE_INSET * 2);
    const itemWidth = contentWidth / state.routes.length;
    const movingRouteIndex = Math.max(
        0,
        Math.min(state.routes.length - 1, Math.round(indicatorPosition))
    );

    useEffect(() => {
        const listener = activeIndex.addListener(({ value }) => setIndicatorPosition(value));

        Animated.timing(activeIndex, {
            toValue: state.index,
            duration: 380,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: false,
        }).start();

        return () => activeIndex.removeListener(listener);
    }, [activeIndex, state.index]);

    const notchCenter = SIDE_INSET + itemWidth * (indicatorPosition + 0.5);
    const leftShoulder = notchCenter - 36;
    const rightShoulder = notchCenter + 36;
    const backgroundPath = barWidth > 0
        ? [
            `M ${TOP_CORNER_RADIUS} 0`,
            `H ${leftShoulder}`,
            `C ${notchCenter - 27} 0 ${notchCenter - 29} 25 ${notchCenter} 25`,
            `C ${notchCenter + 29} 25 ${notchCenter + 27} 0 ${rightShoulder} 0`,
            `H ${barWidth - TOP_CORNER_RADIUS}`,
            `Q ${barWidth} 0 ${barWidth} ${TOP_CORNER_RADIUS}`,
            'V 72',
            'H 0',
            `V ${TOP_CORNER_RADIUS}`,
            `Q 0 0 ${TOP_CORNER_RADIUS} 0`,
            'Z',
        ].join(' ')
        : '';

    return (
        <View style={styles.wrapper}>
            <View
                style={styles.tabBar}
                onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            >
                {barWidth > 0 ? (
                    <>
                        <Svg
                            pointerEvents="none"
                            width={barWidth}
                            height={72}
                            style={styles.barShape}
                        >
                            <Path
                                d={backgroundPath}
                                fill="#FFFFFF"
                                stroke={palette.border}
                                strokeWidth={1}
                            />
                        </Svg>
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.activeIndicatorSlot,
                                {
                                    width: itemWidth,
                                    left: SIDE_INSET,
                                    transform: [{ translateX: Animated.multiply(activeIndex, itemWidth) }],
                                },
                            ]}
                        >
                            <View style={styles.activeIndicator}>
                                <MaterialCommunityIcons
                                    name={icons[state.routes[movingRouteIndex].name] as any}
                                    size={25}
                                    color="#FFFFFF"
                                />
                            </View>
                        </Animated.View>
                    </>
                ) : null}
                <View style={styles.itemsRow}>
                    {state.routes.map((route: any, index: number) => {
                        const isFocused = state.index === index;
                        const label = String(descriptors[route.key].options.tabBarLabel ?? route.name);

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                        };

                        return (
                            <Pressable
                                key={route.key}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isFocused }}
                                accessibilityLabel={label}
                                onPress={onPress}
                                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                            >
                                <Animated.View
                                    style={[
                                        styles.iconShell,
                                        {
                                            opacity: isFocused
                                                ? 0
                                                : activeIndex.interpolate({
                                                    inputRange: [
                                                        Math.max(-1, index - 1),
                                                        index,
                                                        Math.min(state.routes.length, index + 1),
                                                    ],
                                                    outputRange: [1, 0, 1],
                                                    extrapolate: 'clamp',
                                                }),
                                        },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={icons[route.name] as any}
                                        size={22}
                                        color={palette.muted}
                                    />
                                </Animated.View>
                                <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export const MainTabNavigator = () => (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
        <Tab.Screen name="Monitoring" component={MonitoringScreen} options={{ tabBarLabel: 'Seguimiento' }} />
        <Tab.Screen name="AIChat" component={AIChatScreen} options={{ tabBarLabel: 'Asistente' }} />
        <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: 'Comunidad' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        height: 96,
        justifyContent: 'flex-end',
        ...Platform.select({
            ios: {
                shadowColor: palette.forest,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.14,
                shadowRadius: 18,
            },
            android: { elevation: 12 },
            web: {
                // @ts-ignore React Native Web supports boxShadow.
                filter: 'drop-shadow(0 10px 14px rgba(22, 59, 45, 0.14))',
            },
        }),
    },
    tabBar: {
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'visible',
    },
    barShape: { ...StyleSheet.absoluteFillObject },
    itemsRow: {
        position: 'absolute',
        top: 0,
        right: SIDE_INSET,
        bottom: 0,
        left: SIDE_INSET,
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeIndicatorSlot: {
        position: 'absolute',
        top: -27,
        alignItems: 'center',
        zIndex: 4,
    },
    activeIndicator: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.primary,
        borderWidth: 3,
        borderColor: palette.canvas,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 9,
        elevation: 8,
    },
    item: {
        flex: 1,
        height: 72,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 10,
        zIndex: 3,
    },
    iconShell: {
        width: 36,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    label: { color: palette.muted, fontSize: 10, fontWeight: '600' },
    labelActive: { color: palette.primary, fontWeight: '800' },
    pressed: { opacity: 0.72 },
});

export default MainTabNavigator;
