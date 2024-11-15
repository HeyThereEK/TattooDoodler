import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawingAppPreview from './src/screens/HomeScreen';
import DrawingScreen from './src/screens/DrawingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={DrawingAppPreview} />
        <Stack.Screen name="Drawing" component={DrawingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}