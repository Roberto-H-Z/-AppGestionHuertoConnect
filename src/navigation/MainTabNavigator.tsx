import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import {
    HomeScreen,
    MonitoringScreen,
    AIChatScreen,
    CommunityScreen,
    ProfileScreen,
} from '../features/main';

const TAB_BAR_HEIGHT = 60;
const CENTER_BUTTON_SIZE = 56;

const Tab = createBottomTabNavigator();

// ── Animated indicator line under the active tab ──

const TabIndicator: React.FC<{ isFocused: boolean }> = ({ isFocused }) => {
    const widthAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(widthAnim, {
            toValue: isFocused ? 1 : 0,
            friction: 7,
            tension: 60,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const indicatorWidth = widthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
    });

    const indicatorOpacity = widthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View
            style={[
                styles.indicator,
                {
                    width: indicatorWidth,
                    opacity: indicatorOpacity,
                },
            ]}
        />
    );
};

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM CENTER BUTTON — Hero animation for Análisis  ██
// ═══════════════════════════════════════════════════════════════



// Pulse ring component — expands outward and fades
const PulseRing: React.FC<{ delay: number; active: boolean }> = ({ delay, active }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: false,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            anim.setValue(0);
        }
    }, [active]);

    const scale = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.6],
    });
    const opacity = anim.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0.5, 0.25, 0],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: CENTER_BUTTON_SIZE,
                height: CENTER_BUTTON_SIZE,
                borderRadius: CENTER_BUTTON_SIZE / 2,
                borderWidth: 2,
                borderColor: '#059669',
                opacity,
                transform: [{ scale }],
            }}
        />
    );
};

const CenterButtonAnimated: React.FC<{ active: boolean }> = ({ active }) => {
    // ── Animation values ──
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            // ── BREATHING SCALE ──
            const breathe = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.07,
                        duration: 1600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );
            breathe.start();

            // ── MULTI-LAYER GLOW PULSE ──
            const glow = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );
            glow.start();

            // ── COLOR SHIFT on the button bg ──
            const colorShift = Animated.loop(
                Animated.timing(colorAnim, {
                    toValue: 3,
                    duration: 6000,
                    easing: Easing.linear,
                    useNativeDriver: false,
                })
            );
            colorShift.start();

            return () => {
                breathe.stop();
                glow.stop();
                colorShift.stop();
            };
        } else {
            scaleAnim.setValue(1);
            glowAnim.setValue(0);
            colorAnim.setValue(0);
        }
    }, [active]);

    // ── Interpolations ──
    const shadowOp = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.75],
    });
    const shadowR = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 22],
    });
    const btnBg = colorAnim.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange: ['#059669', '#047857', '#064E3B', '#059669'],
    });

    return (
        <View style={styles.centerButtonOuter}>
            {/* ── Layer 1: Pulse ripple rings ── */}
            {active && (
                <>
                    <PulseRing delay={0} active={active} />
                    <PulseRing delay={800} active={active} />
                </>
            )}

            {/* ── The green button itself ── */}
            <Animated.View
                style={[
                    styles.centerButton,
                    active && {
                        backgroundColor: btnBg,
                        transform: [{ scale: scaleAnim }],
                        shadowColor: '#059669',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: shadowOp,
                        shadowRadius: shadowR,
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name="robot-outline"
                    size={26}
                    color="#fff"
                />
            </Animated.View>
        </View>
    );
};

// ── Tab Icon with bounce ──

const TabIcon: React.FC<{
    iconName: string;
    isFocused: boolean;
}> = ({ iconName, isFocused }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isFocused) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.25,
                    duration: 150,
                    useNativeDriver: false,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 100,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [isFocused]);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <MaterialCommunityIcons
                name={iconName as any}
                size={24}
                color={isFocused ? '#059669' : '#9CA3AF'}
            />
        </Animated.View>
    );
};

// ── Custom Tab Bar ──

const CustomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.tabBarWrapper}>
            {/* Solid white background */}
            <View style={styles.tabBarBackground} />

            {/* Tab items row */}
            <View style={styles.tabItemsRow}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel ?? route.name;
                    const isFocused = state.index === index;
                    const isCenter = index === 2;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Center button (AI/Análisis)
                    if (isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.8}
                                style={styles.centerTabItem}
                            >
                                <CenterButtonAnimated active={isFocused} />
                                <Text style={[
                                    styles.tabLabel,
                                    {
                                        color: isFocused ? '#059669' : '#9CA3AF',
                                        fontWeight: isFocused ? '700' : '600',
                                    },
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    // Regular tabs
                    let iconName: string = 'home';
                    if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                    else if (route.name === 'Monitoring') iconName = 'chart-line';
                    else if (route.name === 'Community') iconName = isFocused ? 'account-group' : 'account-group-outline';
                    else if (route.name === 'Profile') iconName = isFocused ? 'account' : 'account-outline';

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.7}
                            style={styles.tabItem}
                        >
                            <TabIcon iconName={iconName} isFocused={isFocused} />
                            <Text style={[
                                styles.tabLabel,
                                {
                                    color: isFocused ? '#059669' : '#9CA3AF',
                                    fontWeight: isFocused ? '700' : '600',
                                },
                            ]}>
                                {label}
                            </Text>
                            <TabIndicator isFocused={isFocused} />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'Inicio' }}
            />
            <Tab.Screen
                name="Monitoring"
                component={MonitoringScreen}
                options={{ tabBarLabel: 'Seguimiento' }}
            />
            <Tab.Screen
                name="AIChat"
                component={AIChatScreen}
                options={{ tabBarLabel: 'Análisis' }}
            />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{ tabBarLabel: 'Comunidad' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Perfil' }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT + 30,
    },
    tabBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: { elevation: 10 },
            web: {
                // @ts-ignore
                boxShadow: '0 -3px 10px rgba(0,0,0,0.06)',
            },
        }),
    },
    tabItemsRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingBottom: 6,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 6,
    },
    centerTabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    centerButtonOuter: {
        width: CENTER_BUTTON_SIZE + 10,
        height: CENTER_BUTTON_SIZE + 10,
        borderRadius: (CENTER_BUTTON_SIZE + 10) / 2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -34,
        marginBottom: 0,
    },
    centerButton: {
        width: CENTER_BUTTON_SIZE,
        height: CENTER_BUTTON_SIZE,
        borderRadius: CENTER_BUTTON_SIZE / 2,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: { elevation: 8 },
            web: {
                // @ts-ignore
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            },
        }),
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 3,
    },

    // Indicator line
    indicator: {
        height: 3,
        backgroundColor: '#059669',
        borderRadius: 1.5,
        marginTop: 4,
    },


});

export default MainTabNavigator;
