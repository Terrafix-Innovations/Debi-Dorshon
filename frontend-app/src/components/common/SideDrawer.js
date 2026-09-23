import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

export default function SideDrawer({ navigation }) {
  const { isDrawerOpen, closeDrawer, activePujaDay } = useDrawer();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isDrawerOpen) return null;

  const navigateTo = (screenName, params = {}) => {
    closeDrawer();
    if (navigation) {
      navigation.navigate(screenName, params);
    }
  };

  const menuItems = [
    { label: 'Profile', icon: 'account-circle-outline', screen: 'Profile' },
    { label: 'Customize my Trip', icon: 'routes', screen: 'Trip' },
    { label: 'Navigate Pandals', icon: 'map-marker-radius', screen: 'Navigation' },
    { label: 'Metro/Train Parikrama', icon: 'train-car', screen: 'Stations' },
    { label: 'Recommendations', icon: 'star-outline', screen: 'Recommendations' },
    { label: 'Contact Us', icon: 'phone-outline', screen: 'Contact' },
    { label: 'About Us', icon: 'information-outline', screen: 'About' },
  ];

  return (
    <Modal
      transparent
      visible={isDrawerOpen}
      animationType="fade"
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />

        <View style={styles.drawerContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Drawer Header Banner */}
            <View style={styles.drawerHeader}>
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {user?.name ? user.name.charAt(0) : 'P'}
                  </Text>
                </View>
                <View style={styles.userTextWrap}>
                  <Text style={styles.userName}>{user?.name || 'Prianshu Mitra'}</Text>
                  <Text style={styles.userSub}>Kolkata Puja Hopper</Text>
                </View>
                <Pressable onPress={closeDrawer} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.dayBadge}>
                <MaterialCommunityIcons name="flower-tulip" size={14} color={colors.goldHighlight} />
                <Text style={styles.dayBadgeText}>{activePujaDay} • দেবী দর্শন</Text>
              </View>
            </View>

            {/* Menu Links List */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.menuList}>
                {menuItems.map((item, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}
                    onPress={() => navigateTo(item.screen)}
                  >
                    <View style={styles.itemIconWrap}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={colors.primaryMaroon}
                      />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={`${colors.espresso}66`}
                    />
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Drawer Footer */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerBrand}>দেবী দর্শন (Debi Dorshon)</Text>
              <Text style={styles.footerSub}>আপনার পূজা পরিক্রমার সেরা সঙ্গী</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.cream,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: colors.primaryMaroon,
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomRightRadius: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.primaryMaroon,
    fontWeight: '900',
    fontSize: 20,
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  userSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldHighlight,
    gap: 6,
  },
  dayBadgeText: {
    color: colors.goldHighlight,
    fontWeight: '800',
    fontSize: 12,
  },

  menuScroll: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  menuList: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.xs,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.espresso,
  },

  drawerFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.goldMuted,
    backgroundColor: colors.cardCream,
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
  footerSub: {
    fontSize: 11,
    color: `${colors.espresso}99`,
    marginTop: 2,
  },
});
