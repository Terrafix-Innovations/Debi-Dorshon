import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function HeaderNavbar({ navigation, showBack = false, title = 'দেবী দর্শন' }) {
  const { toggleDrawer, activePujaDay, setActivePujaDay, pujaDays } = useDrawer();
  const { user, isAuthenticated } = useAuth();

  const cyclePujaDay = () => {
    const currentIndex = pujaDays.indexOf(activePujaDay);
    const nextIndex = (currentIndex + 1) % pujaDays.length;
    setActivePujaDay(pujaDays[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left Action: Hamburger Menu or Back Button */}
        {showBack ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.iconBtn}
            onPress={toggleDrawer}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.white} />
          </Pressable>
        )}

        {/* Center Section: Bengali Day Banner & Debi Dorshon Title */}
        <View style={styles.centerSection}>
          <Pressable onPress={cyclePujaDay} style={styles.dayBadge}>
            <MaterialCommunityIcons name="flower-tulip" size={14} color={colors.goldHighlight} />
            <Text style={styles.dayBadgeText}>{activePujaDay}</Text>
            <MaterialCommunityIcons name="chevron-down" size={12} color={colors.goldHighlight} />
          </Pressable>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        {/* Right Action: User Profile Icon */}
        <Pressable
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
          hitSlop={10}
        >
          <View style={styles.avatarCircle}>
            {user?.name ? (
              <Text style={styles.avatarInitial}>{user.name.charAt(0)}</Text>
            ) : (
              <Ionicons name="person" size={20} color={colors.primaryMaroon} />
            )}
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primaryMaroon,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
  },
  container: {
    height: 70,
    backgroundColor: colors.primaryMaroon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 196, 48, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.5)',
    gap: 4,
    marginBottom: 3,
  },
  dayBadgeText: {
    color: colors.goldHighlight,
    fontSize: 12,
    fontWeight: '800',
  },
  titleText: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardCream,
    borderWidth: 2,
    borderColor: colors.goldHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.primaryMaroon,
    fontWeight: '900',
    fontSize: 17,
  },
});
