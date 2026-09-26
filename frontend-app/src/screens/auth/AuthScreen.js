import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function AuthScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} showBack title="Sign In • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Pill Badge */}
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>COMING SOON</Text>
            </View>

            {/* Icon Circle */}
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-circle-outline" size={54} color={colors.primaryMaroon} />
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>Google Sign-In</Text>
            <Text style={styles.subtitle}>
              Sign-in with Google, account syncing, and personalized puja parikrama features are under development and will be available in an upcoming update.
            </Text>

            {/* Feature Highlights List */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>One-Tap Google Sign-In</Text>
                  <Text style={styles.featureDesc}>Quick, seamless access across all your devices.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <MaterialCommunityIcons name="bookmark-multiple-outline" size={20} color={colors.primaryMaroon} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Saved Pandals & Routes</Text>
                  <Text style={styles.featureDesc}>Bookmark favorite pandals and store your planned routes.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrap}>
                  <MaterialCommunityIcons name="trophy-outline" size={20} color="#B8860B" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Festival Rewards & Badges</Text>
                  <Text style={styles.featureDesc}>Earn special Debi Dorshon parikrama badges as you explore.</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8D8C5',
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  badgePill: {
    backgroundColor: '#F7EBE1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8C5AC',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryMaroon,
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(142, 27, 27, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryMaroon,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6E5D53',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureList: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCB8',
    padding: 16,
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#EBDCC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A1B14',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: '#7A6B62',
    lineHeight: 15,
  },
});
