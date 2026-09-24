import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function HomeScreen({ navigation }) {
  const popularRoutes = [
    {
      id: 'route-1',
      title: 'North Kolkata Heritage Circuit',
      pandals: 'Bagbazar • Sovabazar Rajbari • Ahiritola • BK Pal',
      stats: '6 Pandals • ~4.2 km • 2.5 hrs',
      badge: 'Heritage',
      icon: 'bank-outline',
    },
    {
      id: 'route-2',
      title: 'South Kolkata Mega Tour',
      pandals: 'Tridhara Sammilani • Chetla Agrani • Suruchi Sangha • Ekdalia',
      stats: '8 Pandals • ~6.8 km • 3.5 hrs',
      badge: 'Popular',
      icon: 'fire',
    },
    {
      id: 'route-3',
      title: 'Central & College Square Loop',
      pandals: 'Mohammad Ali Park • College Square • Santosh Mitra Sq',
      stats: '5 Pandals • ~3.5 km • 2.0 hrs',
      badge: 'Iconic',
      icon: 'star-outline',
    },
    {
      id: 'route-4',
      title: 'Salt Lake & Bypass Special',
      pandals: 'FD Block • BJ Block • AK Block • Sree Bhumi',
      stats: '7 Pandals • ~7.5 km • 4.0 hrs',
      badge: 'Grand',
      icon: 'map-legend',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Big Div: Trip Planner */}
        <View style={styles.heroSection}>
          <Pressable
            style={styles.heroCard}
            onPress={() => navigation.navigate('Trip')}
          >
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="routes" size={14} color={colors.goldHighlight} />
                <Text style={styles.heroBadgeText}>PUJO PARIKRAMA</Text>
              </View>
              <MaterialCommunityIcons name="compass-outline" size={24} color={colors.goldHighlight} />
            </View>

            <Text style={styles.heroTitle}>Trip Planner</Text>
            <Text style={styles.heroSub}>
              Generate a custom Puja Parikrama itinerary based on your start point, destination, and preferred transit mode.
            </Text>

            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>START PLANNING YOUR TRIP</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primaryMaroon} />
            </View>
          </Pressable>
        </View>

        {/* 2. Small Divs Grid: Quick Features */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.gridContainer}>
            {/* Card 1: Metro & Train */}
            <Pressable
              style={styles.smallCard}
              onPress={() => navigation.navigate('Stations')}
            >
              <View style={[styles.smallIconWrap, { backgroundColor: '#8B1A1A' }]}>
                <MaterialCommunityIcons name="subway-variant" size={24} color={colors.goldHighlight} />
              </View>
              <Text style={styles.smallCardTitle}>Metro & Train</Text>
              <Text style={styles.smallCardSub}>Station guide & pandals</Text>
            </Pressable>

            {/* Card 2: Pandals */}
            <Pressable
              style={styles.smallCard}
              onPress={() => navigation.navigate('Navigation')}
            >
              <View style={[styles.smallIconWrap, { backgroundColor: '#8B1A1A' }]}>
                <MaterialCommunityIcons name="map-search-outline" size={24} color={colors.goldHighlight} />
              </View>
              <Text style={styles.smallCardTitle}>Pandals</Text>
              <Text style={styles.smallCardSub}>Live route & pinpoints</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Section: Most Popular Pujo Routes */}
        <View style={styles.routesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Popular Pujo Routes</Text>
          </View>

          {popularRoutes.map((item) => (
            <Pressable
              key={item.id}
              style={styles.routeCard}
              onPress={() => navigation.navigate('Trip', { routePreset: item.id })}
            >
              <View style={styles.routeHeaderRow}>
                <View style={styles.routeTitleGroup}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={colors.primaryMaroon} />
                  <Text style={styles.routeTitle}>{item.title}</Text>
                </View>
                <View style={styles.routeTag}>
                  <Text style={styles.routeTagText}>{item.badge}</Text>
                </View>
              </View>

              <Text style={styles.routePandals}>{item.pandals}</Text>

              <View style={styles.routeFooterRow}>
                <Text style={styles.routeStats}>{item.stats}</Text>
                <View style={styles.routeNavBtn}>
                  <Text style={styles.routeNavBtnText}>View Route</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primaryMaroon} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
  },

  // 1. Big Div (Trip Planner Hero Card)
  heroSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.primaryMaroon,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 196, 48, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldHighlight,
    gap: 6,
  },
  heroBadgeText: {
    color: colors.goldHighlight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldHighlight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: 8,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: colors.primaryMaroon,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
  },

  // 2. Small Divs Grid
  gridSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.espresso,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  smallIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  smallCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.espresso,
    marginTop: 2,
  },
  smallCardSub: {
    fontSize: 11,
    color: `${colors.espresso}AA`,
    marginTop: 2,
  },

  // 3. Most Popular Pujo Routes Section
  routesSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
  },
  routeCard: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
    flex: 1,
  },
  routeTag: {
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 26, 26, 0.2)',
  },
  routeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
  routePandals: {
    fontSize: 12,
    color: colors.espresso,
    marginTop: 8,
    lineHeight: 17,
  },
  routeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  routeStats: {
    fontSize: 11,
    fontWeight: '700',
    color: `${colors.espresso}AA`,
  },
  routeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  routeNavBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
});

