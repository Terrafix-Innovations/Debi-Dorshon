import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import RouteScreen from '../screens/route/RouteScreen';
import TripScreen from '../screens/trip/TripScreen';
import MetroScreen from '../screens/metro/MetroScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AppBottomNavBar from '../components/common/AppBottomNavBar';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <AppBottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Navigation" component={RouteScreen} />
      <Tab.Screen name="Trip" component={TripScreen} />
      <Tab.Screen name="Stations" component={MetroScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
