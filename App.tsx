import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, RegisterScreen } from './src/features/auth';
import { FarmerProfileScreen, GardenAreaScreen, LocationWaterScreen } from './src/features/onboarding';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="FarmerProfile" component={FarmerProfileScreen} />
        <Stack.Screen name="GardenArea" component={GardenAreaScreen} />
        <Stack.Screen name="LocationWater" component={LocationWaterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
