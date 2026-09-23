import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Profile • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile User Card (Matching Wireframe) */}
        <View style={styles.profileCardWrap}>
          <LinearGradient
            colors={[colors.primaryMaroon, colors.secondaryRed]}
            style={styles.profileCard}
          >
            {/* User Avatar + Greeting */}
            <View style={styles.userHeaderRow}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarInner}>
                  <Ionicons name="person" size={36} color={colors.primaryMaroon} />
                </View>
              </View>
              <View style={styles.userTextInfo}>
                <Text style={styles.greetingSub}>Hello</Text>
                <Text style={styles.userName}>{user?.name || 'Prianshu Mitra'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'prianshu@debidorshon.com'}</Text>
              </View>
            </View>

            {/* Wireframe Stats Badges Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.goldHighlight} />
                <Text style={styles.statBadgeText}>{user?.completedTrips || 5} Trips Completed</Text>
              </View>

              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="ticket-percent-outline" size={20} color={colors.goldHighlight} />
                <Text style={styles.statBadgeText}>{user?.redeemPoints || 164} Redeem Points</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* User Options & Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Pujo Activity</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Trip')}
          >
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="routes" size={22} color={colors.primaryMaroon} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Saved Custom Routes</Text>
              <Text style={styles.optionSub}>Access your planned itineraries</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.espresso} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Redeem')}
          >
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="gift-outline" size={22} color={colors.primaryMaroon} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Redeem Rewards</Text>
              <Text style={styles.optionSub}>View points balance & Durga Puja vouchers</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.espresso} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Stations')}
          >
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="heart-outline" size={22} color={colors.primaryMaroon} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Favorite Pandals</Text>
              <Text style={styles.optionSub}>Shortlisted pandals in North & South Kolkata</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.espresso} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primaryMaroon} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Push Notifications</Text>
              <Text style={styles.optionSub}>Live crowd alerts & transit updates</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.espresso} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { borderColor: colors.secondaryRed }]}
            onPress={() => {
              logout();
              navigation.navigate('Auth');
            }}
          >
            <View style={[styles.optionIconWrap, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.secondaryRed} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.secondaryRed }]}>Sign Out</Text>
              <Text style={styles.optionSub}>Switch user account</Text>
            </View>
          </TouchableOpacity>
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
  profileCardWrap: {
    padding: spacing.md,
  },
  profileCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 4,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.goldHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cardCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextInfo: {
    flex: 1,
  },
  greetingSub: {
    color: colors.goldHighlight,
    fontSize: 13,
    fontWeight: '700',
  },
  userName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.4)',
  },
  statBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },

  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.espresso,
    marginBottom: spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.xs,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.espresso,
  },
  optionSub: {
    fontSize: 11,
    color: `${colors.espresso}88`,
    marginTop: 2,
  },
});
