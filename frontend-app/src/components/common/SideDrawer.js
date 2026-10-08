import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Vibration,
  Linking,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { useDrawer } from '../../context/DrawerContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(Math.max(width * 0.85, 300), 340);

const triggerHaptic = (ms = 8) => {
  try {
    Vibration.vibrate(ms);
  } catch (e) { }
};

// --- Custom SVG Icons Cloned from frontend-web ---

// 1. Golden Three-Petal Lotus / Leaf Ornament
const FloralOrnament = memo(function FloralOrnament({ size = 18, color = '#C8A86B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 C13.8 6.5, 14.8 9.5, 14.2 13 C13.2 11.2, 10.8 11.2, 9.8 13 C9.2 9.5, 10.2 6.5, 12 2 Z"
        fill={color}
      />
      <Path
        d="M4 14.5 C7.5 12.2, 10.8 13.2, 11.2 15.5 C9.2 15.8, 7.2 17.8, 4.8 18.2 C3.5 16.5, 3.5 15, 4 14.5 Z"
        fill={color}
      />
      <Path
        d="M20 14.5 C16.5 12.2, 13.2 13.2, 12.8 15.5 C14.8 15.8, 16.8 17.8, 19.2 18.2 C20.5 16.5, 20.5 15, 20 14.5 Z"
        fill={color}
      />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
      <Path d="M12 17 L12 21" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
});

// 2. Plan Your Trip Custom Icon (Two pins with dashed connection)
const PlanTripIcon = memo(function PlanTripIcon({ size = 20, color = '#7A1614' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 14 C3.9 14, 3 14.9, 3 16 C3 18, 5 21, 5 21 S7 18, 7 16 C7 14.9, 6.1 14, 5 14 Z" />
      <Circle cx="5" cy="16" r="0.8" fill={color} />
      <Path d="M5.5 13.5 C6.5 9.5, 11 11, 13.5 7.5 C14.5 6, 16 6, 17 6.5" strokeDasharray="2 2" />
      <Path d="M19 3 C17.9 3, 17 3.9, 17 5 C17 7, 19 10, 19 10 S21 7, 21 5 C21 3.9, 20.1 3, 19 3 Z" />
      <Circle cx="19" cy="5" r="0.8" fill={color} />
    </Svg>
  );
});

// 3. My Trips Custom Icon (Heritage Temple Structure)
const MyTripsIcon = memo(function MyTripsIcon({ size = 20, color = '#7A1614' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2 L12 4" />
      <Path d="M12 4 L8 8 L16 8 Z" />
      <Line x1="6" y1="8" x2="18" y2="8" />
      <Path d="M7 8 L6 13 L18 13 L17 8" />
      <Line x1="4" y1="13" x2="20" y2="13" />
      <Line x1="7" y1="13" x2="7" y2="19" />
      <Line x1="12" y1="13" x2="12" y2="19" />
      <Line x1="17" y1="13" x2="17" y2="19" />
      <Line x1="4" y1="19" x2="20" y2="19" />
      <Line x1="2" y1="22" x2="22" y2="22" />
    </Svg>
  );
});

// 4. Kolkata Skyline Line Art Illustration
const KolkataSkyline = memo(function KolkataSkyline({ strokeColor = '#CAA774' }) {
  return (
    <View style={styles.skylineWrap}>
      <Svg width="100%" height={70} viewBox="0 0 300 70" fill="none">
        {/* Flying birds */}
        <Path d="M78 14 Q81 11 84 14 Q87 11 90 14" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" />
        <Path d="M92 8 Q94.5 5.5 97 8 Q99.5 5.5 102 8" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />
        <Path d="M100 12 Q102.5 9.5 105 12 Q107.5 9.5 110 12" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />

        {/* Howrah Bridge */}
        <Path d="M22 60 L26 22 L29 22 L33 60" stroke={strokeColor} strokeWidth="0.9" />
        <Path d="M68 60 L71 26 L74 26 L77 60" stroke={strokeColor} strokeWidth="0.9" />
        <Path d="M12 42 L27 22 L50 33 L72 26 L95 44" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        <Line x1="10" y1="53" x2="98" y2="53" stroke={strokeColor} strokeWidth="1.1" />
        <Line x1="10" y1="60" x2="280" y2="60" stroke={strokeColor} strokeWidth="0.8" opacity={0.6} />
        <Path d="M14 53 L21 40 L27 53 L38 29 L49 53 L60 30 L71 53 L82 36 L93 53" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />

        {/* Victoria Memorial Colonnade */}
        <Rect x="100" y="48" width="70" height="12" stroke={strokeColor} strokeWidth="0.75" />
        <Line x1="105" y1="48" x2="105" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="113" y1="48" x2="113" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="121" y1="48" x2="121" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="129" y1="48" x2="129" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="137" y1="48" x2="137" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="145" y1="48" x2="145" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="153" y1="48" x2="153" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="161" y1="48" x2="161" y2="60" stroke={strokeColor} strokeWidth="0.65" />

        {/* Grand Dome */}
        <Path d="M123 48 L123 40 C123 31, 147 31, 147 40 L147 48 Z" stroke={strokeColor} strokeWidth="0.9" />
        <Path d="M129 48 C129 38, 141 38, 141 48" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="135" y1="31" x2="135" y2="26" stroke={strokeColor} strokeWidth="0.9" />
        <Circle cx="135" cy="25" r="1.1" fill={strokeColor} />

        {/* Adjacent Domes */}
        <Path d="M106 48 L106 43 C106 38, 118 38, 118 43 L118 48 Z" stroke={strokeColor} strokeWidth="0.8" />
        <Line x1="112" y1="38" x2="112" y2="35" stroke={strokeColor} strokeWidth="0.7" />
        <Circle cx="112" cy="34" r="0.7" fill={strokeColor} />
        <Rect x="168" y="50" width="38" height="10" stroke={strokeColor} strokeWidth="0.75" />
        <Path d="M172 50 L172 44 C172 39, 184 39, 184 44 L184 50 Z" stroke={strokeColor} strokeWidth="0.8" />
        <Line x1="178" y1="39" x2="178" y2="36" stroke={strokeColor} strokeWidth="0.7" />
        <Circle cx="178" cy="35" r="0.7" fill={strokeColor} />

        {/* River Ripple */}
        <Path d="M15 63 Q40 61 65 63 T115 63 T165 63 T215 63" stroke={strokeColor} strokeWidth="0.6" opacity="0.45" />
      </Svg>
      <View style={styles.skylineCornerOrnament} pointerEvents="none">
        <FloralOrnament size={20} color="#C8A86B" />
      </View>
    </View>
  );
});

export default function SideDrawer({ navigation }) {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const [modalVisible, setModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      setModalVisible(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          mass: 0.75,
          stiffness: 260,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isDrawerOpen]);

  if (!isDrawerOpen && !modalVisible) return null;

  const handleClose = () => {
    triggerHaptic(8);
    closeDrawer();
  };

  const navigateTo = (screenName, params = {}) => {
    handleClose();
    if (navigation) {
      navigation.navigate(screenName, params);
    }
  };

  // Exact 8 items cloned from frontend-web SideDrawer.jsx
  const menuItems = [
    {
      label: 'Profile',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      ),
      onPress: () => navigateTo('Profile'),
    },
    {
      label: 'Plan Your Trip',
      renderIcon: () => <PlanTripIcon size={20} color="#7A1614" />,
      onPress: () => navigateTo('Trip'),
    },
    {
      label: 'My Trips',
      renderIcon: () => <MyTripsIcon size={20} color="#7A1614" />,
      onPress: () => navigateTo('Profile'),
    },
    {
      label: 'Nearby Pandals',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
          <Circle cx="12" cy="11" r="2.5" />
        </Svg>
      ),
      onPress: () => navigateTo('MainTabs', { screen: 'Navigation' }),
    },
    {
      label: 'Contact Us',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
      ),
      onPress: () => navigateTo('Contact'),
    },
    {
      label: 'About Us',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="16" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12.01" y2="8" />
        </Svg>
      ),
      onPress: () => navigateTo('About'),
    },
    {
      label: 'Privacy Policy',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      ),
      onPress: () => navigateTo('PrivacyPolicy'),
    },
    {
      label: 'Terms & Conditions',
      renderIcon: () => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7A1614" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Polyline points="14 2 14 8 20 8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Polyline points="10 9 9 9 8 9" />
        </Svg>
      ),
      onPress: () => navigateTo('Terms'),
    },
  ];

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
      hardwareAccelerated
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Dark frosted overlay backdrop */}
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: fadeAnim }]}
        />

        {/* Global background tap-to-dismiss behind drawer */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close navigation drawer"
        />

        {/* Sliding Ivory Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Background Watermark (Exact clone of web) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={require('../../../assets/kolkata_vintage_map.jpg')}
              style={styles.watermarkImage}
              blurRadius={2}
            />
          </View>

          <SafeAreaView style={styles.safeArea}>
            {/* Top Brand Header */}
            <View style={styles.topHeader}>
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Image
                    source={require('../../../assets/debi_dorshon_logo.png')}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.brandTitle} numberOfLines={1} ellipsizeMode="tail">{'দেবী\u00A0দর্শন'}</Text>
              </View>

              {/* Close Button */}
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close menu"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#7A2218" strokeWidth={2.5} strokeLinecap="round">
                  <Line x1="18" y1="6" x2="6" y2="18" />
                  <Line x1="6" y1="6" x2="18" y2="18" />
                </Svg>
              </Pressable>
            </View>

            {/* Elegant Floral Ornament Divider */}
            <View style={styles.ornamentDividerRow}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerOrnamentWrap}>
                <FloralOrnament size={16} color="#C8A86B" />
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Menu Items List */}
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {menuItems.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => {
                    triggerHaptic(8);
                    item.onPress();
                  }}
                >
                  <View style={styles.itemIconWrap}>
                    {item.renderIcon()}
                  </View>

                  <Text style={styles.itemLabel}>{item.label}</Text>

                  {/* Right Chevron Indicator */}
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#CCA86E" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </Pressable>
              ))}
            </ScrollView>

            {/* Bottom Section: Links + Divider + Kolkata Skyline Art */}
            <View style={styles.footerSection}>
              <View style={styles.footerLinksRow}>
                <Pressable onPress={() => navigateTo('PrivacyPolicy')} hitSlop={6}>
                  <Text style={styles.footerLinkText}>Privacy Policy</Text>
                </Pressable>
                <Text style={styles.footerBullet}>•</Text>
                <Pressable onPress={() => navigateTo('Terms')} hitSlop={6}>
                  <Text style={styles.footerLinkText}>Terms & Conditions</Text>
                </Pressable>
              </View>

              <View style={styles.bottomDividerLine} />
              <KolkataSkyline strokeColor="#CAA774" />
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Dedicated outside right-side touch target */}
        <Pressable
          style={styles.outsideDismissArea}
          onPress={handleClose}
          accessibilityLabel="Dismiss drawer"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  outsideDismissArea: {
    flex: 1,
    height: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 8, 0.60)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FAF5ED',
    borderRightWidth: 1,
    borderRightColor: '#EBDCC9',
    shadowColor: '#2D1A16',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
    }),
  },
  watermarkImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.12,
    resizeMode: 'cover',
    ...Platform.select({
      web: {
        filter: 'blur(2px)',
        transform: [{ scale: 1.01 }],
      },
    }),
  },
  safeArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  /* Top Brand Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 28) + 22,
      ios: 54,
      web: 32,
      default: 44,
    }),
    paddingBottom: 14,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: '#7A1614',
    borderWidth: 1.5,
    borderColor: '#E8C37B',
    shadowColor: '#2D1A16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    color: '#7A1614',
    marginLeft: 10,
    letterSpacing: -0.2,
    flexShrink: 1,
    includeFontPadding: false,
    fontFamily: Platform.select({
      ios: 'NotoSerifBengali_700Bold',
      android: 'NotoSerifBengali_700Bold',
      web: "'Noto Serif Bengali', 'Tiro Bangla', Georgia, serif",
      default: 'NotoSerifBengali_700Bold',
    }),
  },
  closeBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Divider with Center Floral Ornament */
  ornamentDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EADBC8',
  },
  dividerOrnamentWrap: {
    paddingHorizontal: 8,
  },

  /* Menu Items List */
  menuScroll: {
    flex: 1,
  },
  menuList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 1,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(200, 168, 114, 0.18)',
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#38231B',
    marginLeft: 14,
  },

  /* Bottom Section */
  footerSection: {
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  footerLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7B6E',
  },
  footerBullet: {
    fontSize: 11,
    color: '#C8A872',
    marginHorizontal: 10,
  },
  bottomDividerLine: {
    height: 1,
    backgroundColor: '#EADBC8',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  skylineWrap: {
    width: '100%',
    paddingHorizontal: 16,
    position: 'relative',
    marginTop: 2,
  },
  skylineCornerOrnament: {
    position: 'absolute',
    right: 16,
    bottom: 8,
  },
});
