import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
  const [copied, setCopied] = useState(false);
  const email = 'debidorshonapp@gmail.com';

  const handleCopy = async () => {
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(email);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
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
            <Text style={styles.contactTitle}>Contact</Text>
            <Text style={styles.contactSubtitle}>
              For any queries, feedback, or support:
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.copyBox, copied && styles.copyBoxActive]}
              onPress={handleCopy}
            >
              <Text style={styles.emailAddressText} selectable>{email}</Text>
              <View style={styles.copyActionWrap}>
                <MaterialCommunityIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={16}
                  color={copied ? '#1B8E4B' : colors.primaryMaroon}
                />
                <Text style={[styles.copyLabel, copied && styles.copyLabelActive]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </View>
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
  contactScrollContainer: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  minimalContactCard: {
    backgroundColor: '#FFFDF9',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D8C5',
    alignItems: 'center',
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryMaroon,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6E5D53',
    textAlign: 'center',
    marginBottom: 20,
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F5EE',
    borderWidth: 1,
    borderColor: '#E2D5C3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: '100%',
  },
  copyBoxActive: {
    borderColor: '#1B8E4B',
    backgroundColor: '#F0F9F3',
  },
  emailAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1B14',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  copyActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryMaroon,
  },
  copyLabelActive: {
    color: '#1B8E4B',
  },
});
