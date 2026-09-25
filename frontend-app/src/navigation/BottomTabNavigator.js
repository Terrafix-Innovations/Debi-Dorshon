import React from 'react';
import { View, StyleSheet, Text, Platform, Pressable } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import RouteScreen from '../screens/route/RouteScreen';
import TripScreen from '../screens/trip/TripScreen';
import MetroScreen from '../screens/metro/MetroScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// SVG Vector Icons matching frontend-web BottomTabBar.jsx
function HomeIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10.5L12 3l9 7.5V21H15v-6H9v6H3V10.5z" />
    </Svg>
  );
}

function NavigationIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
      <Circle cx="12" cy="11" r="2.5" />
    </Svg>
  );
}

function MapTripIcon({ color = '#FFFFFF', size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-2 6 2V6l-6-2-6 2-6-2v12l6 2z" />
      <Path d="M9 4v14M15 6v14" />
    </Svg>
  );
}

function MetroIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="3" width="16" height="15" rx="3" />
      <Line x1="4" y1="11" x2="20" y2="11" />
      <Circle cx="8" cy="15" r="1" fill={color} />
      <Circle cx="16" cy="15" r="1" fill={color} />
      <Path d="M8 18l-2 4M16 18l2 4M9 22h6" />
    </Svg>
  );
}

function ProfileIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function CustomBottomTabBar({ state, descriptors, navigation }) {
  const tabs = [
    { key: 'Home', label: 'Home', renderIcon: (col) => <HomeIcon color={col} /> },
    { key: 'Navigation', label: 'Navigation', renderIcon: (col) => <NavigationIcon color={col} /> },
    { key: 'Trip', label: 'Trips', isCenter: true },
    { key: 'Stations', label: 'Metro/Train', renderIcon: (col) => <MetroIcon color={col} /> },
    { key: 'Profile', label: 'Profile', renderIcon: (col) => <ProfileIcon color={col} /> },
  ];

  return (
    <View style={styles.navShell}>
      <View style={styles.navRow}>
        {tabs.map((tab, idx) => {
          const routeName = tab.key;
          const routeIndex = state.routes.findIndex((r) => r.name === routeName);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[routeIndex]?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(routeName);
            }
          };

          if (tab.isCenter) {
            return (
              <View key={tab.key} style={styles.centerHeroWrap}>
                <Pressable onPress={onPress} style={styles.centerBtnPressable}>
                  <View style={styles.outerHalo}>
                    <View style={[styles.heroCircle, isFocused ? styles.heroCircleActive : styles.heroCircleInactive]}>
                      <MapTripIcon color="#FFFFFF" size={26} />
                    </View>
                  </View>
                  <Text style={[styles.tabLabel, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
                    {tab.label}
                  </Text>
                </Pressable>
              </View>
            );
          }

          const iconColor = isFocused ? '#994800' : '#111111';

          return (
            <Pressable
              key={tab.key}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              {tab.renderIcon(iconColor)}
              <Text style={[styles.tabLabel, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomBottomTabBar {...props} />}
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

const styles = StyleSheet.create({
  navShell: {
    backgroundColor: '#FDFAF3',
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 220, 201, 0.7)',
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: 'rgba(153, 72, 0, 0.1)',
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#994800',
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: '#111111',
    fontWeight: '500',
  },

  /* Center Elevated Hero Tab */
  centerHeroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  centerBtnPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    padding: 3,
    borderRadius: 32,
    backgroundColor: '#FDFAF3',
  },
  heroCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircleActive: {
    backgroundColor: '#994800',
    shadowColor: '#994800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  heroCircleInactive: {
    backgroundColor: '#3D3732',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
