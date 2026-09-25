import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Platform,
  Vibration,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';

// Color Palette
const BG_WARM_CREAM = '#FFF7E8';
const PRIMARY_MAROON = '#8E1B1B';
const ACCENT_GOLD = '#D8A52B';
const DARK_TEXT = '#3D241B';
const CARD_BG = '#FFFDF8';
const BORDER_COLOR = '#E5D2A8';
const TEXT_MUTED = '#856E63';

const triggerHaptic = (ms = 15) => {
  try {
    Vibration.vibrate(ms);
  } catch (e) { }
};

export default function HomeScreen({ navigation }) {
  const handleOpenTripPlanner = () => {
    triggerHaptic(20);
    navigation.navigate('Trip');
  };

  const handleMetroPress = () => {
    triggerHaptic(15);
    navigation.navigate('Stations');
  };

  const handlePandalPress = () => {
    triggerHaptic(15);
    navigation.navigate('Navigation');
  };

  const handlePopularRoutePress = (presetId = 'heritage') => {
    triggerHaptic(15);
    navigation.navigate('Trip', { routePreset: presetId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_WARM_CREAM} />

      {/* Same Header as other pages */}
      <HeaderNavbar navigation={navigation} title="দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* 1. Hero Title & Subtext */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeading}>
            Plan Your{'\n'}Puja Parikrama
          </Text>
          <Text style={styles.heroSubtext}>
            Discover pandals, find the best routes, and explore Kolkata with ease.
          </Text>
        </View>

        {/* 2. THE STAR: Quick-Entry Trip Planner Card */}
        <View style={styles.tripPlannerCardWrap}>
          {/* Subtle Kolkata Map Contour Background Watermark */}
          <View style={styles.mapWatermarkLayer} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 320 180" fill="none">
              <Path
                d="M-20 40 Q80 20 140 70 T300 50 T360 120"
                stroke="#EADBCC"
                strokeWidth="2.2"
                strokeDasharray="4 6"
                opacity={0.35}
              />
              <Path
                d="M20 140 Q100 90 180 130 T340 100"
                stroke="#EADBCC"
                strokeWidth="1.8"
                opacity={0.25}
              />
              <Circle cx="230" cy="58" r="3" fill={ACCENT_GOLD} opacity={0.4} />
              <Circle cx="120" cy="115" r="3" fill={PRIMARY_MAROON} opacity={0.3} />
            </Svg>
          </View>

          {/* Card Header Tag */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.plannerBadge}>
              <MaterialCommunityIcons name="compass-outline" size={13} color={PRIMARY_MAROON} />
              <Text style={styles.plannerBadgeText}>PLAN YOUR PUJA TRIP</Text>
            </View>
            <Text style={styles.corridorTag}>Kolkata Corridor</Text>
          </View>

          {/* Location Inputs with Visual Timeline Rail */}
          <View style={styles.inputsRow}>
            {/* Visual Timeline Rail (Gold Ring -> Connector -> Maroon Pin) */}
            <View style={styles.timelineRail}>
              <View style={styles.startRing} />
              <View style={styles.timelineDottedLine} />
              <View style={styles.destPinCircle}>
                <Ionicons name="location" size={10} color="#FFFFFF" />
              </View>
            </View>

            {/* Inputs Column */}
            <View style={styles.inputsColumn}>
              {/* Start Field */}
              <Pressable
                style={styles.locationPill}
                onPress={handleOpenTripPlanner}
              >
                <Ionicons name="location-outline" size={16} color="#8A7B6E" />
                <Text style={styles.locationPlaceholder} numberOfLines={1}>
                  Choose Start Location
                </Text>
                <MaterialCommunityIcons name="crosshairs-gps" size={17} color={ACCENT_GOLD} />
              </Pressable>

              {/* Destination Field */}
              <Pressable
                style={styles.locationPill}
                onPress={handleOpenTripPlanner}
              >
                <Ionicons name="location-outline" size={16} color="#8A7B6E" />
                <Text style={styles.locationPlaceholder} numberOfLines={1}>
                  Choose Destination
                </Text>
                <Ionicons name="flag-outline" size={16} color={PRIMARY_MAROON} />
              </Pressable>
            </View>
          </View>

          {/* Visual Concept Flow: Start -> Destination -> Route -> Pandals */}
          <View style={styles.conceptFlowRow}>
            <Text style={styles.conceptFlowText}>Start Location</Text>
            <Text style={styles.conceptFlowArrow}>→</Text>
            <Text style={styles.conceptFlowText}>Destination</Text>
            <Text style={styles.conceptFlowArrow}>→</Text>
            <Text style={styles.conceptFlowText}>Route</Text>
            <Text style={styles.conceptFlowArrow}>→</Text>
            <Text style={[styles.conceptFlowText, styles.conceptFlowHighlight]}>Pandals</Text>
          </View>

          {/* Prominent CTA Button: Find My Route */}
          <Pressable
            style={styles.findRouteBtnPressable}
            onPress={handleOpenTripPlanner}
          >
            <LinearGradient
              colors={['#8E1B1B', '#771313']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.findRouteBtn}
            >
              <Text style={styles.findRouteBtnText}>Find My Route</Text>
              <Text style={styles.findRouteArrow}>→</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* 3. Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {/* Card 1: Metro & Train */}
            <Pressable
              style={styles.quickCard}
              onPress={handleMetroPress}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name="train-outline" size={26} color={PRIMARY_MAROON} />
              </View>
              <Text style={styles.quickTitle}>Metro & Train</Text>
              <Text style={styles.quickSub}>Find nearby pandals</Text>
            </Pressable>

            {/* Card 2: Pandal Directory */}
            <Pressable
              style={styles.quickCard}
              onPress={handlePandalPress}
            >
              <View style={styles.quickIconWrap}>
                <MaterialCommunityIcons name="temple-hindu-outline" size={26} color={PRIMARY_MAROON} />
              </View>
              <Text style={styles.quickTitle}>Pandal Directory</Text>
              <Text style={styles.quickSub}>Explore pandals by area</Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Popular Routes Section */}
        <View style={styles.popularRoutesSection}>
          <View style={styles.popularHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Routes</Text>
            <Pressable
              onPress={() => {
                triggerHaptic(12);
                navigation.navigate('Trip');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </Pressable>
          </View>

          {/* Route Card 1: North Kolkata Heritage Circuit */}
          <Pressable
            style={styles.compactRouteCard}
            onPress={() => handlePopularRoutePress('heritage')}
          >
            <View style={styles.compactRouteBadge}>
              <MaterialCommunityIcons name="bank-outline" size={20} color={PRIMARY_MAROON} />
            </View>

            <View style={styles.compactRouteInfo}>
              <Text style={styles.compactRouteTitle}>North Kolkata Heritage Circuit</Text>
              <Text style={styles.compactRouteDetails}>6 Pandals • 4.2 km • 2.5 hrs</Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color="#BFA799" />
          </Pressable>

          {/* Route Card 2: South Kolkata Mega Tour */}
          <Pressable
            style={[styles.compactRouteCard, { marginTop: 10 }]}
            onPress={() => handlePopularRoutePress('south_mega')}
          >
            <View style={[styles.compactRouteBadge, { backgroundColor: '#FDF1E6' }]}>
              <MaterialCommunityIcons name="star-four-points" size={18} color={PRIMARY_MAROON} />
            </View>

            <View style={styles.compactRouteInfo}>
              <Text style={styles.compactRouteTitle}>South Kolkata Mega Tour</Text>
              <Text style={styles.compactRouteDetails}>8 Pandals • 6.8 km • 3.5 hrs</Text>
            </View>

            <Ionicons name="chevron-forward" size={17} color="#BFA799" />
          </Pressable>
        </View>
      </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_WARM_CREAM,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    position: 'relative',
  },

  /* 1. Hero Section */
  heroSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  heroHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: DARK_TEXT,
    lineHeight: 38,
    letterSpacing: -0.4,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Baloo Da 2, Georgia, serif',
    }),
  },
  heroSubtext: {
    fontSize: 14.5,
    color: '#765C51',
    lineHeight: 21,
    marginTop: 8,
    fontWeight: '500',
  },

  /* 2. Quick-Entry Trip Planner Card (The Star) */
  tripPlannerCardWrap: {
    backgroundColor: CARD_BG,
    borderWidth: 1.2,
    borderColor: BORDER_COLOR,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    shadowColor: DARK_TEXT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  mapWatermarkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  plannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  plannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY_MAROON,
    letterSpacing: 0.8,
  },
  corridorTag: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },

  /* Inputs Row & Timeline Rail */
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineRail: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  startRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: ACCENT_GOLD,
    backgroundColor: CARD_BG,
  },
  timelineDottedLine: {
    width: 2,
    height: 34,
    backgroundColor: BORDER_COLOR,
    marginVertical: 3,
    borderRadius: 1,
  },
  destPinCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY_MAROON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputsColumn: {
    flex: 1,
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: 'rgba(229, 210, 168, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  locationPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#8A7B6E',
  },

  /* Concept Flow (Start -> Destination -> Route -> Pandals) */
  conceptFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginBottom: 14,
    gap: 6,
  },
  conceptFlowText: {
    fontSize: 11,
    color: '#9C8275',
    fontWeight: '600',
  },
  conceptFlowArrow: {
    fontSize: 11,
    color: ACCENT_GOLD,
    fontWeight: '700',
  },
  conceptFlowHighlight: {
    color: PRIMARY_MAROON,
    fontWeight: '700',
  },

  /* Find My Route CTA */
  findRouteBtnPressable: {
    borderRadius: 18,
    shadowColor: PRIMARY_MAROON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  findRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 20,
  },
  findRouteBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  findRouteArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4D388',
  },

  /* 3. Quick Access Section */
  quickAccessSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: DARK_TEXT,
    marginBottom: 12,
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
    }),
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: DARK_TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: 0.1,
  },
  quickSub: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 2,
    fontWeight: '500',
  },

  /* 4. Popular Routes Section */
  popularRoutesSection: {
    marginBottom: 8,
  },
  popularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_MAROON,
    letterSpacing: 0.2,
  },
  compactRouteCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: DARK_TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  compactRouteBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAEEE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactRouteInfo: {
    flex: 1,
    paddingRight: 6,
  },
  compactRouteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: 0.1,
  },
  compactRouteDetails: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 2,
    fontWeight: '500',
  },
});
