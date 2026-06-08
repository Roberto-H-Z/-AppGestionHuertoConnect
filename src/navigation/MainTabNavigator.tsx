import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
    HomeScreen,
    MonitoringScreen,
    AIChatScreen,
    CommunityScreen,
    ProfileScreen,
} from '../features/main';
import { palette } from '../features/main/theme';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
    Home: 'home-variant-outline',
    Monitoring: 'chart-timeline-variant',
    AIChat: 'creation-outline',
    Community: 'account-group-outline',
    Profile: 'account-circle-outline',
};

interface TabItemProps {
    route: any;
    label: string;
    isFocused: boolean;
    onPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ route, label, isFocused, onPress }) => {
    const lift = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(lift, {
            toValue: isFocused ? 1 : 0,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [isFocused, lift]);

    return (
        <Pressable
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
                        transform: [{
                            translateY: lift.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -19],
                            }),
                        }],
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name={icons[route.name] as any}
                    size={24}
                    color={isFocused ? '#FFFFFF' : palette.muted}
                />
            </Animated.View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
        </Pressable>
    );
};

const CustomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
    const [barWidth, setBarWidth] = useState(0);
    const activeIndex = useRef(new Animated.Value(state.index)).current;
    const itemWidth = barWidth / state.routes.length;

    useEffect(() => {
        Animated.spring(activeIndex, {
            toValue: state.index,
            friction: 8,
            tension: 90,
            useNativeDriver: true,
        }).start();
    }, [activeIndex, state.index]);

    return (
        <View style={styles.wrapper}>
            <View
                style={styles.tabBar}
                onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            >
                {barWidth > 0 && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.activeIndicatorSlot,
                            {
                                width: itemWidth,
                                transform: [{ translateX: Animated.multiply(activeIndex, itemWidth) }],
                            },
                        ]}
                    >
                        <View style={styles.activeCutout}>
                            <View style={styles.activeIndicator} />
                        </View>
                    </Animated.View>
                )}
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
                        <TabItem
                            key={route.key}
                            route={route}
                            label={label}
                            isFocused={isFocused}
                            onPress={onPress}
                        />
                    );
                })}
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
        right: 12,
        bottom: 10,
        left: 12,
    },
    tabBar: {
        height: 72,
        paddingHorizontal: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'visible',
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
                boxShadow: '0 12px 30px rgba(22, 59, 45, 0.14)',
            },
        }),
    },
    activeIndicatorSlot: {
        position: 'absolute',
        top: -22,
        left: 0,
        alignItems: 'center',
        zIndex: 2,
    },
    activeCutout: {
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.canvas,
    },
    activeIndicator: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.primary,
        shadowColor: palette.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.24,
        shadowRadius: 9,
        elevation: 8,
    },
    item: {
        flex: 1,
        height: 72,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 9,
        zIndex: 3,
    },
    iconShell: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -5,
    },
    label: { color: palette.muted, fontSize: 10, fontWeight: '600' },
    labelActive: { color: palette.primary, fontWeight: '800' },
    pressed: { opacity: 0.72 },
});

export default MainTabNavigator;
