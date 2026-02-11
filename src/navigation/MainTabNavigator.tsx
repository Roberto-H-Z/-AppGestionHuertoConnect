import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
    HomeScreen,
    MonitoringScreen,
    AnalysisScreen,
    CommunityScreen,
    SettingsScreen,
} from '../features/main';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: '#A5D6A7',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = 'home';

                    if (route.name === 'Home') {
                        iconName = 'home-outline';
                    } else if (route.name === 'Monitoring') {
                        iconName = 'chart-line';
                    } else if (route.name === 'Analysis') {
                        iconName = 'camera';
                    } else if (route.name === 'Community') {
                        iconName = 'account-group-outline';
                    } else if (route.name === 'Settings') {
                        iconName = 'cog-outline';
                    }

                    // Special styling for center tab
                    if (route.name === 'Analysis') {
                        return null; // We'll render custom button
                    }

                    return (
                        <MaterialCommunityIcons
                            name={iconName as any}
                            size={size}
                            color={color}
                        />
                    );
                },
            })}
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
                name="Analysis"
                component={AnalysisScreen}
                options={{
                    tabBarLabel: 'Análisis',
                    tabBarButton: (props) => <CustomCenterTabButton {...props} />,
                }}
            />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{ tabBarLabel: 'Comunidad' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'Ajustes' }}
            />
        </Tab.Navigator>
    );
};

// Custom center button with green circle
const CustomCenterTabButton: React.FC<any> = ({ onPress, accessibilityState }) => {
    const focused = accessibilityState?.selected;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.centerButtonContainer}
            activeOpacity={0.8}
        >
            <View style={styles.centerButton}>
                <MaterialCommunityIcons
                    name="camera"
                    size={28}
                    color="#fff"
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    centerButtonContainer: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    centerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default MainTabNavigator;
