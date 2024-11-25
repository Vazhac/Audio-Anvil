import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import GenerateScreen from './screens/GenerateScreen';
import LibraryScreen from './screens/LibraryScreen';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Generate" component={GenerateScreen} />
                <Stack.Screen name="Library" component={LibraryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
