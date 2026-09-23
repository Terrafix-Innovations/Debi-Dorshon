import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import { MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function HomeScreen({ navigation }) {
  const featuredPandals = MOCK_PANDALS.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header matching wireframe */}
      <HeaderNavbar navigation={navigation} title="দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Wireframe Hero Card 1: Trip Planner Redirect */}
        <View style={styles.sectionWrap}>
          <Pressable onPress={() => navigation.navigate('Trip')}>
            <LinearGradient
              colors={[colors.primaryMaroon, colors.secondaryRed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.cardBadgeRow}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="routes" size={16} color={colors.goldHighlight} />
                  <Text style={styles.badgeText}>Custom Itinerary</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={26} color={colors.goldHighlight} />
              </View>

              <Text style={styles.heroTitle}>Trip Planner (Create Your Route)</Text>
              <Text style={styles.heroSub}>
                Enter your starting location and destination to generate optimal continuous pandal hopping polyline.
              </Text>

              <View style={styles.heroActionBtn}>
                <Text style={styles.heroActionText}>OPEN TRIP PLANNER</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primaryMaroon} />
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Wireframe Bottom Grid: Cards 2 & 3 */}
        <View style={styles.gridSectionWrap}>
          <Text style={styles.sectionTitle}>Pujo Navigation & Transit</Text>
          <View style={styles.gridRow}>
            {/* Card 2: Metro / Train Parikrama */}
            <Pressable
              style={styles.gridCard}
              onPress={() => navigation.navigate('Stations')}
            >
              <LinearGradient
                colors={['#1E3A8A', '#3B82F6']}
                style={styles.gridCardIconWrap}
              >
                <MaterialCommunityIcons name="train-car" size={28} color={colors.white} />
              </LinearGradient>
              <Text style={styles.gridCardTitle}>Metro & Train</Text>
              <Text style={styles.gridCardTag}>Parikrama Guide</Text>
              <Text style={styles.gridCardSub}>
                Station selector & nearest pandals list
              </Text>
            </Pressable>

            {/* Card 3: Navigation Map */}
            <Pressable
              style={styles.gridCard}
              onPress={() => navigation.navigate('Navigation')}
            >
              <LinearGradient
                colors={['#065F46', '#10B981']}
                style={styles.gridCardIconWrap}
              >
                <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.white} />
              </LinearGradient>
              <Text style={styles.gridCardTitle}>Navigation Map</Text>
              <Text style={styles.gridCardTag}>Live Pinpoints</Text>
              <Text style={styles.gridCardSub}>
                Zoomable Kolkata map with pandal coordinates
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Featured Famous Pandals List */}
        <View style={styles.pandalSectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Famous Durga Puja Pandals</Text>
            <Pressable onPress={() => navigation.navigate('Stations')}>
              <Text style={styles.seeAllText}>Explore All</Text>
            </Pressable>
          </View>

          {featuredPandals.map((pandal) => (
            <Pressable
              key={pandal._id}
              style={styles.pandalCard}
              onPress={() => navigation.navigate('Navigation')}
            >
              <View style={styles.pandalIconWrap}>
                <Ionicons name="location" size={20} color={colors.primaryMaroon} />
              </View>
              <View style={styles.pandalInfo}>
                <Text style={styles.pandalName}>{pandal.name}</Text>
                <Text style={styles.pandalSub}>
                  {pandal.nameBn} • {pandal.area} ({pandal.zone})
                </Text>
              </View>
              <View style={styles.pandalNavBtn}>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1 },

  sectionWrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 4,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldHighlight,
    gap: 4,
  },
  badgeText: {
    color: colors.goldHighlight,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldHighlight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: 4,
    alignSelf: 'flex-start',
  },
  heroActionText: {
    color: colors.primaryMaroon,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  gridSectionWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.espresso,
    marginBottom: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
  },
  gridCardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
  },
  gridCardTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryMaroon,
    marginTop: 2,
  },
  gridCardSub: {
    fontSize: 11,
    color: `${colors.espresso}AA`,
    marginTop: 4,
    lineHeight: 15,
  },

  pandalSectionWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primaryMaroon,
    fontWeight: '800',
  },
  pandalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  pandalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primaryMaroon}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pandalInfo: { flex: 1 },
  pandalName: { fontSize: 14, fontWeight: '700', color: colors.espresso },
  pandalSub: { fontSize: 11, color: `${colors.espresso}99`, marginTop: 2 },
  pandalNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMaroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
