import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.84, 330);

const triggerHaptic = (ms = 12) => {
  try {
    Vibration.vibrate(ms);
  } catch (e) { }
};

// --- Custom SVGs matching the new design ---

// 1. Golden Three-Petal Lotus / Leaf Ornament
function FloralOrnament({ size = 18, color = '#C8A86B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Central petal */}
      <Path
        d="M12 2 C13.8 6.5, 14.8 9.5, 14.2 13 C13.2 11.2, 10.8 11.2, 9.8 13 C9.2 9.5, 10.2 6.5, 12 2 Z"
        fill={color}
      />
      {/* Left petal */}
      <Path
        d="M4 14.5 C7.5 12.2, 10.8 13.2, 11.2 15.5 C9.2 15.8, 7.2 17.8, 4.8 18.2 C3.5 16.5, 3.5 15, 4 14.5 Z"
        fill={color}
      />
      {/* Right petal */}
      <Path
        d="M20 14.5 C16.5 12.2, 13.2 13.2, 12.8 15.5 C14.8 15.8, 16.8 17.8, 19.2 18.2 C20.5 16.5, 20.5 15, 20 14.5 Z"
        fill={color}
      />
      {/* Center drop & stem */}
      <Circle cx="12" cy="16" r="1.5" fill={color} />
      <Path d="M12 17 L12 21" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

// 3. Plan Your Trip Custom Icon (Two map pins with dashed route trail)
function PlanTripIcon({ size = 20, color = '#7A1614' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 14 C3.9 14, 3 14.9, 3 16 C3 18, 5 21, 5 21 S7 18, 7 16 C7 14.9, 6.1 14, 5 14 Z" />
      <Circle cx="5" cy="16" r="0.8" fill={color} />
      <Path d="M5.5 13.5 C6.5 9.5, 11 11, 13.5 7.5 C14.5 6, 16 6, 17 6.5" strokeDasharray="2 2" />
      <Path d="M19 3 C17.9 3, 17 3.9, 17 5 C17 7, 19 10, 19 10 S21 7, 21 5 C21 3.9, 20.1 3, 19 3 Z" />
      <Circle cx="19" cy="5" r="0.8" fill={color} />
    </Svg>
  );
}

// 4. My Trips Custom Icon (Temple / Domed Pavilion Heritage Structure)
function MyTripsIcon({ size = 20, color = '#7A1614' }) {
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
}

// 5. Kolkata Skyline Line Art Illustration (Howrah Bridge + Victoria Memorial + Birds + Corner Motif)
function KolkataSkyline({ strokeColor = '#CAA774' }) {
  return (
    <View style={styles.skylineWrap}>
      <Svg width="100%" height={70} viewBox="0 0 300 70" fill="none">
        {/* Flying birds in sky */}
        <Path d="M78 14 Q81 11 84 14 Q87 11 90 14" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" />
        <Path d="M92 8 Q94.5 5.5 97 8 Q99.5 5.5 102 8" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />
        <Path d="M100 12 Q102.5 9.5 105 12 Q107.5 9.5 110 12" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />

        {/* --- HOWRAH BRIDGE (Left) --- */}
        {/* Tower 1 */}
        <Path d="M22 60 L26 22 L29 22 L33 60" stroke={strokeColor} strokeWidth="0.9" />
        {/* Tower 2 */}
        <Path d="M68 60 L71 26 L74 26 L77 60" stroke={strokeColor} strokeWidth="0.9" />
        
        {/* Cantilever Truss Upper Cord */}
        <Path d="M12 42 L27 22 L50 33 L72 26 L95 44" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        
        {/* Road Deck */}
        <Line x1="10" y1="53" x2="98" y2="53" stroke={strokeColor} strokeWidth="1.1" />
        <Line x1="10" y1="60" x2="280" y2="60" stroke={strokeColor} strokeWidth="0.8" opacity={0.6} />

        {/* Diagonal Cross Webbing */}
        <Path d="M14 53 L21 40 L27 53 L38 29 L49 53 L60 30 L71 53 L82 36 L93 53" stroke={strokeColor} strokeWidth="0.7" strokeLinecap="round" />
        <Path d="M18 47 L25 53 M33 41 L43 53 M55 41 L65 53 M76 45 L87 53" stroke={strokeColor} strokeWidth="0.5" />

        {/* --- VICTORIA MEMORIAL / HERITAGE ARCHITECTURE (Center to Right) --- */}
        {/* Colonnade Base */}
        <Rect x="100" y="48" width="70" height="12" stroke={strokeColor} strokeWidth="0.75" />
        <Line x1="105" y1="48" x2="105" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="113" y1="48" x2="113" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="121" y1="48" x2="121" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="129" y1="48" x2="129" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="137" y1="48" x2="137" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="145" y1="48" x2="145" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="153" y1="48" x2="153" y2="60" stroke={strokeColor} strokeWidth="0.65" />
        <Line x1="161" y1="48" x2="161" y2="60" stroke={strokeColor} strokeWidth="0.65" />

        {/* Grand Central Dome */}
        <Path d="M123 48 L123 40 C123 31, 147 31, 147 40 L147 48 Z" stroke={strokeColor} strokeWidth="0.9" />
        <Path d="M129 48 C129 38, 141 38, 141 48" stroke={strokeColor} strokeWidth="0.65" />
        
        {/* Finial / Angel of Victory */}
        <Line x1="135" y1="31" x2="135" y2="26" stroke={strokeColor} strokeWidth="0.9" />
        <Circle cx="135" cy="25" r="1.1" fill={strokeColor} />
        <Path d="M133 26 L137 24 M133 27 L137 29" stroke={strokeColor} strokeWidth="0.6" />

        {/* Left Secondary Dome */}
        <Path d="M106 48 L106 43 C106 38, 118 38, 118 43 L118 48 Z" stroke={strokeColor} strokeWidth="0.8" />
        <Line x1="112" y1="38" x2="112" y2="35" stroke={strokeColor} strokeWidth="0.7" />
        <Circle cx="112" cy="34" r="0.7" fill={strokeColor} />

        {/* Right Pavilion & Dome */}
        <Rect x="168" y="50" width="38" height="10" stroke={strokeColor} strokeWidth="0.75" />
        <Path d="M172 50 L172 44 C172 39, 184 39, 184 44 L184 50 Z" stroke={strokeColor} strokeWidth="0.8" />
        <Line x1="178" y1="39" x2="178" y2="36" stroke={strokeColor} strokeWidth="0.7" />
        <Circle cx="178" cy="35" r="0.7" fill={strokeColor} />

        {/* Adjacent Heritage Minarets */}
        <Rect x="204" y="52" width="18" height="8" stroke={strokeColor} strokeWidth="0.65" />
        <Path d="M209 52 L209 47 C209 44, 217 44, 217 47 L217 52 Z" stroke={strokeColor} strokeWidth="0.75" />
        <Line x1="213" y1="44" x2="213" y2="41" stroke={strokeColor} strokeWidth="0.65" />

        {/* Gentle River Ripple */}
        <Path d="M15 63 Q40 61 65 63 T115 63 T165 63 T215 63" stroke={strokeColor} strokeWidth="0.6" opacity={0.45} />
      </Svg>

      {/* Matching bottom right corner ornament */}
      <View style={styles.skylineCornerOrnament}>
        <FloralOrnament size={20} color="#C8A86B" />
      </View>
    </View>
  );
}

// --- Main SideDrawer Component ---

export default function SideDrawer({ navigation }) {
  const { isDrawerOpen, closeDrawer } = useDrawer();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
    }
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleClose = () => {
    triggerHaptic(12);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      closeDrawer();
    });
  };

  const navigateTo = (screenName, params = {}) => {
    handleClose();
    if (navigation) {
      navigation.navigate(screenName, params);
    }
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: 'person-outline',
      screen: 'Profile',
    },
    {
      label: 'Plan Your Trip',
      customIcon: () => <PlanTripIcon size={21} color="#7A1614" />,
      screen: 'Trip',
    },
    {
      label: 'My Trips',
      customIcon: () => <MyTripsIcon size={21} color="#7A1614" />,
      screen: 'Trip',
    },
    {
      label: 'Nearby Pandals',
      icon: 'location-outline',
      screen: 'Navigation',
    },
    {
      label: 'Recommendations',
      icon: 'star-outline',
      screen: 'Recommendations',
    },
    {
      label: 'Contact Us',
      icon: 'chatbubble-ellipses-outline',
      screen: 'Contact',
    },
    {
      label: 'About Us',
      icon: 'information-circle-outline',
      screen: 'About',
    },
    {
      label: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      screen: 'PrivacyPolicy',
    },
  ];

  return (
    <Modal
      transparent
      visible={isDrawerOpen}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent dark backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sliding Ivory Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Top Brand Header: Logo + Bengali Text + Close Button */}
            <View style={styles.topHeader}>
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Image
                    source={require('../../../assets/debi_dorshon_logo.png')}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.brandTitle}>দেবী দর্শন</Text>
              </View>

              <Pressable
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color="#7A2218" />
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
                    triggerHaptic(12);
                    navigateTo(item.screen);
                  }}
                >
                  <View style={styles.itemIconWrap}>
                    {item.customIcon ? (
                      item.customIcon()
                    ) : (
                      <Ionicons name={item.icon} size={21} color="#7A1614" />
                    )}
                  </View>

                  <Text style={styles.itemLabel}>{item.label}</Text>

                  <Ionicons name="chevron-forward" size={17} color="#CCA86E" />
                </Pressable>
              ))}
            </ScrollView>

            {/* Bottom Section: Divider + Kolkata Skyline Art */}
            <View style={styles.footerSection}>
              <View style={styles.bottomDividerLine} />
              <KolkataSkyline strokeColor="#CAA774" />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 8, 0.45)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FAF5ED',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#2D1A16',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#7A1614',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8C37B',
    shadowColor: '#7A1614',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#7A1614',
    marginLeft: 14,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Baloo Da 2, Georgia, serif',
    }),
  },
  closeBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Top Divider with Center Ornament */
  ornamentDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EADBC8',
  },
  dividerOrnamentWrap: {
    paddingHorizontal: 8,
  },

  /* Menu Items */
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
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(202, 168, 114, 0.12)',
  },
  itemIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#38231B',
    marginLeft: 16,
  },

  /* Bottom Section */
  footerSection: {
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  bottomDividerLine: {
    height: 1,
    backgroundColor: '#EADBC8',
    marginHorizontal: 20,
    marginBottom: 2,
  },
  skylineWrap: {
    width: '100%',
    paddingHorizontal: 16,
    position: 'relative',
    marginTop: 2,
  },
  skylineCornerOrnament: {
    position: 'absolute',
    right: 18,
    bottom: 8,
  },
});
