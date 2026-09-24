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
        tabBarActiveTintColor: '#943E00',
        tabBarInactiveTintColor: '#3D2E24',
        tabBarStyle: {
          backgroundColor: '#FAF6EE',
          borderTopColor: '#E8DEC9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
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
              name={focused ? 'map-marker' : 'map-marker-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Trips (Raised Hero Tab) */}
      <Tab.Screen
        name="Trip"
        component={TripScreen}
        options={{
          tabBarLabel: 'Trips',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800',
            color: '#943E00',
            marginTop: 4,
          },
          tabBarIcon: () => (
            <View style={styles.centerHeroContainer}>
              <View style={styles.centerHeroCircle}>
                <MaterialCommunityIcons name="map-outline" size={28} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      {/* Tab 4: Metro/Train */}
      <Tab.Screen
        name="Stations"
        component={MetroScreen}
        options={{
          tabBarLabel: 'Metro/Train',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'train' : 'train-variant'}
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
  centerHeroContainer: {
    position: 'absolute',
    top: -26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHeroCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#943E00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#FAF6EE',
    elevation: 8,
    shadowColor: '#943E00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});

