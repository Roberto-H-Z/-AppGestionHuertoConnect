import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/config/providers/AuthProvider';
import { LoginScreen, RegisterScreen } from './src/features/auth';
import { FarmerProfileScreen, GardenAreaScreen, LocationWaterScreen } from './src/features/onboarding';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { SplashScreen } from './src/features/splash';
import {
  EditProfileScreen,
  MyLandScreen,
  HarvestHistoryScreen,
  NotificationSettingsScreen,
  PlantSpecsScreen,
} from './src/features/main';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="FarmerProfile" component={FarmerProfileScreen} />
          <Stack.Screen name="GardenArea" component={GardenAreaScreen} />
          <Stack.Screen name="LocationWater" component={LocationWaterScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="MyLand" component={MyLandScreen} />
          <Stack.Screen name="HarvestHistory" component={HarvestHistoryScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="PlantSpecs" component={PlantSpecsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
