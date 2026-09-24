import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function HeaderNavbar({ navigation, showBack = false, title = 'দেবী দর্শন' }) {
  const { toggleDrawer, activePujaDay } = useDrawer();
  const { user, isAuthenticated } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Scalloped Pandal Canopy / Dome Background Trim at the bottom */}
        <View style={styles.canopyBorderRow} pointerEvents="none">
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
          <View style={styles.canopyDome} />
        </View>

        {/* Left Action: Hamburger Menu or Back Button */}
        {showBack ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={24} color="#3D1212" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.iconBtn}
            onPress={toggleDrawer}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#3D1212" />
          </Pressable>
        )}

        {/* Center Section: Trishul, Festive Motifs & Bengali Greeting */}
        <View style={styles.centerSection}>
          {/* Top Trishul Trident Accent */}
          <View style={styles.topTrishulWrap}>
            <View style={styles.arcLineLeft} />
            <MaterialCommunityIcons name="trishul" size={15} color="#8B1A1A" />
            <View style={styles.arcLineRight} />
          </View>

          {/* Main Greeting Row with Side Motifs */}
          <View style={styles.greetingRow}>
            {/* Left Side Motif */}
            <View style={styles.motifGroupLeft}>
              <MaterialCommunityIcons name="flower-tulip-outline" size={15} color="#B8860B" />
              <Text style={styles.diamondStar}>✦</Text>
            </View>

            {/* Bengali Greeting Text */}
            <Text style={styles.bengaliGreetingText}>{activePujaDay}</Text>

            {/* Right Side Motif */}
            <View style={styles.motifGroupRight}>
              <Text style={styles.diamondStar}>✦</Text>
              <MaterialCommunityIcons name="flower-tulip-outline" size={15} color="#B8860B" />
            </View>
          </View>

          {/* Bottom Diamond Ornament */}
          <View style={styles.bottomOrnamentRow}>
            <View style={styles.goldDot} />
            <View style={styles.redDiamond} />
            <View style={styles.goldDot} />
          </View>
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
              <Ionicons name="person" size={20} color="#3D1212" />
            )}
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FAF5EB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
  },
  container: {
    height: 78,
    backgroundColor: '#FAF5EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#EADCC6',
  },
  canopyBorderRow: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 8,
    overflow: 'hidden',
  },
  canopyDome: {
    width: 24,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EADCC6',
    marginTop: 2,
    opacity: 0.5,
  },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTrishulWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: -2,
  },
  arcLineLeft: {
    width: 14,
    height: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#8B1A1A',
    borderTopLeftRadius: 6,
    opacity: 0.7,
  },
  arcLineRight: {
    width: 14,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#8B1A1A',
    borderTopRightRadius: 6,
    opacity: 0.7,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  motifGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  motifGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  diamondStar: {
    color: '#C59B27',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bengaliGreetingText: {
    color: '#8B1A1A',
    fontSize: 27,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'web'
      ? "'Galada', 'Atma', 'Figgins Pica Bengali', 'Tiro Bangla', cursive, serif"
      : 'Galada_400Regular',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bottomOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  goldDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#C59B27',
  },
  redDiamond: {
    width: 5.5,
    height: 5.5,
    backgroundColor: '#8B1A1A',
    transform: [{ rotate: '45deg' }],
  },
  profileBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2E6D4',
    borderWidth: 1,
    borderColor: '#E2D4BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#3D1212',
    fontWeight: '900',
    fontSize: 17,
  },
});

