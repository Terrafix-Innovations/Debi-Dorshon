import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="About Us • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="flower-tulip" size={48} color={colors.primaryMaroon} />
            <Text style={styles.title}>দেবী দর্শন (Debi Dorshon)</Text>
            <Text style={styles.version}>Version 1.0.0 • Durga Puja 2026 Edition</Text>
            <Text style={styles.desc}>
              Debi Dorshon is your ultimate digital companion for Kolkata Durga Puja Parikrama.
              We bring real-time Kolkata Metro & Suburban Train schedules, GPS pandal routing,
              live crowd indicators, and custom itinerary generation straight to your phone.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <Text style={styles.bullet}>• Station-to-Pandal Metro & Train guide</Text>
            <Text style={styles.bullet}>• Instant starting & destination route generator</Text>
            <Text style={styles.bullet}>• Interactive Kolkata map with pinned pandals</Text>
            <Text style={styles.bullet}>• Integrated Durga Puja rewards & points</Text>
          </View>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

export function ContactScreen({ navigation }) {
  const email = 'debidorshonapp@gmail.com';

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Contact Us" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView
          contentContainerStyle={styles.contactScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.minimalContactCard}>
            <View style={styles.contactIconCircle}>
              <MaterialCommunityIcons name="email-outline" size={32} color={colors.primaryMaroon} />
            </View>

            <Text style={styles.contactTitle}>Get in Touch</Text>
            <Text style={styles.contactSubtitle}>
              For inquiries, feedback, or support regarding Debi Dorshon, reach out to us directly:
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.emailPill}
              onPress={handleEmailPress}
            >
              <MaterialCommunityIcons name="email-fast-outline" size={20} color={colors.white} />
              <Text style={styles.emailText}>{email}</Text>
            </TouchableOpacity>

            <Text style={styles.emailHint}>Tap to compose email</Text>
          </View>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

export function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Privacy Policy • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="shield-check-outline" size={48} color={colors.primaryMaroon} />
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.version}>Last Updated: September 2026</Text>
            <Text style={styles.desc}>
              At দেবী দর্শন (Debi Dorshon), your privacy is our top priority. We do not sell or track your private personal information.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Data We Process</Text>
            <Text style={styles.bullet}>• GPS Location: Used solely on-device to compute nearest pandals and shortest puja parikrama routes.</Text>
            <Text style={styles.bullet}>• Local Cache: Used to store your route preferences and saved pandals.</Text>
            <Text style={styles.bullet}>• Security: All communications are encrypted over secure HTTPS/WSS protocols.</Text>
          </View>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.md },
  card: {
    backgroundColor: colors.cardCream,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.primaryMaroon, marginTop: spacing.xs, textAlign: 'center' },
  version: { fontSize: 12, fontWeight: '700', color: colors.goldMuted, marginTop: 4 },
  desc: { fontSize: 13, color: colors.espresso, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryMaroon, marginBottom: spacing.xs, alignSelf: 'flex-start' },
  bullet: { fontSize: 13, color: colors.espresso, marginTop: 6, alignSelf: 'flex-start', fontWeight: '600' },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMaroon,
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  contactBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  contactScrollContainer: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  minimalContactCard: {
    backgroundColor: '#FFFDF9',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8D8C5',
    alignItems: 'center',
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  contactIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(142, 27, 27, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryMaroon,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6E5D53',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMaroon,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    shadowColor: colors.primaryMaroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  emailText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  emailHint: {
    fontSize: 11,
    color: '#9E9086',
    marginTop: 12,
    fontWeight: '500',
  },
});
