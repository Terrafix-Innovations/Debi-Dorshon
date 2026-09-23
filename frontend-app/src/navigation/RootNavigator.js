import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabNavigator from './BottomTabNavigator';
import AuthScreen from '../screens/auth/AuthScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RecommendationsScreen from '../screens/info/RecommendationsScreen';
import { AboutScreen, ContactScreen } from '../screens/info/AboutContactScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
