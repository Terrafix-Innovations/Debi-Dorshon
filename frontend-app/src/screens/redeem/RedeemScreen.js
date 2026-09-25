import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function RedeemScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Redeem • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView contentContainerStyle={styles.container}>
        {/* Points Summary Badge */}
        <View style={styles.pointsWrap}>
          <LinearGradient
            colors={[colors.primaryMaroon, colors.secondaryRed]}
            style={styles.pointsCard}
          >
            <MaterialCommunityIcons name="ticket-percent" size={36} color={colors.goldHighlight} />
            <Text style={styles.pointsVal}>{user?.redeemPoints || 164}</Text>
            <Text style={styles.pointsLabel}>Available Redeem Points</Text>
          </LinearGradient>
        </View>

        {/* Wireframe Banner: COMING SOON... */}
        <View style={styles.comingSoonWrap}>
          <View style={styles.comingSoonCard}>
            <MaterialCommunityIcons name="clock-outline" size={48} color={colors.primaryMaroon} />
            <Text style={styles.comingSoonTitle}>COMING SOON...</Text>
            <Text style={styles.comingSoonSub}>
              Earn points on every Pandal hopping trip & redeem exciting Durga Puja food passes, VIP fast-track tickets & travel vouchers!
            </Text>
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
    alignItems: 'center',
  },
  pointsWrap: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  pointsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  pointsVal: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    marginTop: spacing.xs,
  },
  pointsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.goldHighlight,
    marginTop: 4,
  },
  comingSoonWrap: {
    width: '100%',
  },
  comingSoonCard: {
    backgroundColor: colors.cardCream,
    borderWidth: 2,
    borderColor: colors.goldMuted,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryMaroon,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  comingSoonSub: {
    fontSize: 13,
    color: colors.espresso,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
