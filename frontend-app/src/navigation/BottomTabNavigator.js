import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import RouteScreen from '../screens/route/RouteScreen';
import TripScreen from '../screens/trip/TripScreen';
import MetroScreen from '../screens/metro/MetroScreen';
import RedeemScreen from '../screens/redeem/RedeemScreen';

import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryMaroon,
        tabBarInactiveTintColor: `${colors.espresso}AA`,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.goldMuted,
          borderTopWidth: 1.5,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: colors.espresso,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2,
        },
      })}
    >
      {/* Tab 1: Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 2: Navigation */}
      <Tab.Screen
        name="Navigation"
        component={RouteScreen}
        options={{
          tabBarLabel: 'Navigation',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'map-marker-radius' : 'map-marker-radius-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Search / Trip (Prominent Center Button) */}
      <Tab.Screen
        name="Trip"
        component={TripScreen}
        options={{
          tabBarLabel: 'Trip Planner',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerSearchBtn}>
              <MaterialCommunityIcons name="magnify" size={28} color={colors.white} />
            </View>
          ),
        }}
      />

      {/* Tab 4: Metro/Train Parikrama */}
      <Tab.Screen
        name="Stations"
        component={MetroScreen}
        options={{
          tabBarLabel: 'Metro/Train',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'train-car' : 'subway-variant'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 5: Redeem */}
      <Tab.Screen
        name="Redeem"
        component={RedeemScreen}
        options={{
          tabBarLabel: 'Redeem',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'ticket-percent' : 'ticket-percent-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerSearchBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMaroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    borderWidth: 3,
    borderColor: colors.goldHighlight,
    elevation: 6,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
