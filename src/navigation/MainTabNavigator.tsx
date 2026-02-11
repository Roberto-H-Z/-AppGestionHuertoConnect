import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
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

                    // Center button (AI)
                    if (isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.8}
                                style={styles.centerTabItem}
                            >
                                <View style={styles.centerButtonOuter}>
                                    <View style={styles.centerButton}>
                                        <MaterialCommunityIcons
                                            name="robot-outline"
                                            size={26}
                                            color="#fff"
                                        />
                                    </View>
                                </View>
                                <Text style={[
                                    styles.tabLabel,
                                    { color: isFocused ? '#4CAF50' : '#9E9E9E' },
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
                            <MaterialCommunityIcons
                                name={iconName as any}
                                size={24}
                                color={isFocused ? '#4CAF50' : '#9E9E9E'}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: isFocused ? '#4CAF50' : '#9E9E9E' },
                            ]}>
                                {label}
                            </Text>
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
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: { elevation: 8 },
            web: {
                // @ts-ignore
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            },
        }),
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 3,
    },
});

export default MainTabNavigator;
