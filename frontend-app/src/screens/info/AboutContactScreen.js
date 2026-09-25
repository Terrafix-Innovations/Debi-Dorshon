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
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Contact Us • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="headset" size={48} color={colors.primaryMaroon} />
            <Text style={styles.title}>We'd Love to Hear From You</Text>
            <Text style={styles.desc}>
              Have questions, feedback, or need help navigating Kolkata Durga Puja 2026? Reach out to our support team.
            </Text>

            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL('mailto:support@debidorshon.com')}
            >
              <MaterialCommunityIcons name="email-outline" size={22} color={colors.white} />
              <Text style={styles.contactBtnText}>support@debidorshon.com</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: colors.espresso }]}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <MaterialCommunityIcons name="phone-outline" size={22} color={colors.white} />
              <Text style={styles.contactBtnText}>+91 98765 43210 (Helpline)</Text>
            </TouchableOpacity>
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
});
