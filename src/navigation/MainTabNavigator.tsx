import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
    HomeScreen,
    MonitoringScreen,
    AIChatScreen,
    CommunityScreen,
    ProfileScreen,
} from '../features/main';
import { palette, radii } from '../features/main/theme';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
    Home: 'home-variant-outline',
    Monitoring: 'chart-timeline-variant',
    AIChat: 'creation-outline',
    Community: 'account-group-outline',
    Profile: 'account-circle-outline',
};

const CustomTabBar: React.FC<any> = ({ state, descriptors, navigation }) => (
    <View style={styles.wrapper}>
        <View style={styles.tabBar}>
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const isAssistant = route.name === 'AIChat';
                const label = descriptors[route.key].options.tabBarLabel ?? route.name;

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
                        accessibilityLabel={String(label)}
                        onPress={onPress}
                        style={({ pressed }) => [
                            styles.item,
                            isAssistant && styles.assistantItem,
                            pressed && styles.pressed,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconShell,
                                isFocused && styles.iconShellActive,
                                isAssistant && styles.assistantIconShell,
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={icons[route.name] as any}
                                size={isAssistant ? 25 : 22}
                                color={isAssistant ? '#FFFFFF' : isFocused ? palette.primary : palette.muted}
                            />
                        </View>
                        <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
                    </Pressable>
                );
            })}
        </View>
    </View>
);

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
        backgroundColor: palette.forest,
        borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: palette.forest,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 18,
            },
            android: { elevation: 12 },
            web: {
                // @ts-ignore React Native Web supports boxShadow.
                boxShadow: '0 12px 30px rgba(22, 59, 45, 0.24)',
            },
        }),
    },
    item: {
        flex: 1,
        minHeight: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    assistantItem: { marginTop: -24 },
    iconShell: {
        width: 38,
        height: 34,
        borderRadius: radii.medium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconShellActive: { backgroundColor: '#FFFFFF' },
    assistantIconShell: {
        width: 54,
        height: 54,
        borderRadius: 20,
        backgroundColor: palette.primary,
        borderWidth: 4,
        borderColor: palette.canvas,
    },
    label: { color: '#AFC0B7', fontSize: 10, fontWeight: '600' },
    labelActive: { color: '#FFFFFF', fontWeight: '800' },
    pressed: { opacity: 0.72 },
});

export default MainTabNavigator;
