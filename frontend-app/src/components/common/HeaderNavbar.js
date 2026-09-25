import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Line, G } from 'react-native-svg';
import { useDrawer } from '../../context/DrawerContext';
import { useAuth } from '../../context/AuthContext';
import { getPujaGreeting, PUJA_DAYS_2026, PUJA_SCHEDULE } from '../../utils/pujaCalendar';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function HeaderNavbar({ navigation, showBack = false, title = 'দেবী দর্শন' }) {
  const { toggleDrawer, activePujaDay, setActivePujaDay } = useDrawer();
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [overrideDayKey, setOverrideDayKey] = useState(null);

  // Split active Puja greeting into prefix ("শুভ") and suffix (e.g. "ষষ্ঠী" or "শারদীয়া")
  const getGreetingParts = (fullGreeting) => {
    if (!fullGreeting) return { prefix: 'শুভ', suffix: 'শারদীয়া' };
    const parts = fullGreeting.trim().split(' ');
    if (parts.length > 1) {
      return { prefix: parts[0], suffix: parts.slice(1).join(' ') };
    }
    return { prefix: 'শুভ', suffix: fullGreeting };
  };

  const currentGreetingText = overrideDayKey
    ? (overrideDayKey === 'SHARODIYA' ? 'শুভ শারদীয়া' : (PUJA_SCHEDULE[2026]?.[overrideDayKey]?.greeting || activePujaDay))
    : activePujaDay;

  const { prefix, suffix } = getGreetingParts(currentGreetingText);

  const handleSelectDay = (dateKey) => {
    if (dateKey === null) {
      setOverrideDayKey(null);
      setActivePujaDay(getPujaGreeting(new Date()));
    } else if (dateKey === 'SHARODIYA') {
      setOverrideDayKey('SHARODIYA');
      setActivePujaDay('শুভ শারদীয়া');
    } else {
      setOverrideDayKey(dateKey);
      const customGreeting = PUJA_SCHEDULE[2026]?.[dateKey]?.greeting || 'শুভ শারদীয়া';
      setActivePujaDay(customGreeting);
    }
    setShowPicker(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerShell}>
        {/* Decorative Golden Temple Mandap Silhouette in Background */}
        <View style={styles.mandapBackground} pointerEvents="none">
          <Svg width="100%" height="36" viewBox="0 0 600 40" preserveAspectRatio="none">
            <Path
              d="M0 40 L0 32 Q20 30 40 25 L40 40 Z M40 40 L40 25 Q60 20 70 12 Q80 20 100 25 L100 40 Z M100 40 L100 28 Q120 22 135 16 Q150 22 170 28 L170 40 Z M170 40 L170 30 Q195 24 210 10 Q225 24 250 30 L250 40 Z M250 40 L250 26 Q275 18 300 4 Q325 18 350 26 L350 40 Z M350 40 L350 30 Q375 24 390 10 Q405 24 430 30 L430 40 Z M430 40 L430 28 Q450 22 465 16 Q480 22 500 28 L500 40 Z M500 40 L500 25 Q520 20 530 12 Q540 20 560 25 L560 40 Z M560 40 L560 32 Q580 30 600 32 L600 40 Z"
              fill="#D4B584"
              opacity={0.3}
            />
          </Svg>
        </View>

        {/* Top-Left Floral Alpona Flourish Vector */}
        <View style={styles.alponaLeft} pointerEvents="none">
          <Svg width="56" height="42" viewBox="0 0 64 48" fill="none">
            <Path d="M0 0 C16 4, 32 16, 40 32" stroke="#C8A66A" strokeWidth="1.2" strokeLinecap="round" />
            <Path d="M0 12 C12 14, 24 24, 28 36" stroke="#C8A66A" strokeWidth="0.9" strokeLinecap="round" />
            <Circle cx="28" cy="8" r="1.5" fill="#C8A66A" />
            <Circle cx="16" cy="22" r="1.2" fill="#C8A66A" />
          </Svg>
        </View>

        {/* Top-Right Floral Alpona Flourish Vector */}
        <View style={styles.alponaRight} pointerEvents="none">
          <Svg width="56" height="42" viewBox="0 0 64 48" fill="none">
            <Path d="M64 0 C48 4, 32 16, 24 32" stroke="#C8A66A" strokeWidth="1.2" strokeLinecap="round" />
            <Path d="M64 12 C52 14, 40 24, 36 36" stroke="#C8A66A" strokeWidth="0.9" strokeLinecap="round" />
            <Circle cx="36" cy="8" r="1.5" fill="#C8A66A" />
            <Circle cx="48" cy="22" r="1.2" fill="#C8A66A" />
          </Svg>
        </View>

        <View style={styles.container}>
          {/* Left Action: Hamburger Menu / Back Button */}
          {showBack ? (
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation?.goBack()}
              hitSlop={10}
            >
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#381E18" strokeWidth="2.5" strokeLinecap="round">
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
              onPress={toggleDrawer}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#381E18" strokeWidth="2.5" strokeLinecap="round">
                <Line x1="4" y1="7" x2="20" y2="7" />
                <Line x1="4" y1="12" x2="20" y2="12" />
                <Line x1="4" y1="17" x2="20" y2="17" />
              </Svg>
            </Pressable>
          )}

          {/* Center Banner: Trishul, Flanking Dhak & Kasful Motifs, Dynamic Typography */}
          <Pressable
            style={styles.centerBanner}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            {/* Top Sacred Trishul & Solar Flourish Arcs */}
            <View style={styles.trishulRow}>
              <Svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <Path d="M2 6 C4 4, 7 3, 9 2" stroke="#C4A475" strokeWidth="1.2" strokeLinecap="round" />
              </Svg>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="#831917">
                <Path d="M12 2 L13.6 7 L12.7 7 L12.7 15 L11.3 15 L11.3 7 L10.4 7 Z" />
                <Path d="M7 6.5 C7.5 9 9 12 11.3 13 L11.3 11.2 C9.8 10.3 8.8 8.4 8.5 6.5 C8 6.2 7.2 6.2 7 6.5 Z" />
                <Path d="M17 6.5 C16.5 9 15 12 12.7 13 L12.7 11.2 C14.2 10.3 15.2 8.4 15.5 6.5 C16 6.2 16.8 6.2 17 6.5 Z" />
                <Circle cx="12" cy="16" r="1.3" />
                <Rect x="11.2" y="17" width="1.6" height="5" rx="0.8" />
              </Svg>
              <Svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <Path d="M8 6 C6 4, 3 3, 1 2" stroke="#C4A475" strokeWidth="1.2" strokeLinecap="round" />
              </Svg>
            </View>

            {/* Main Greeting Row: Left Motif + Text + Right Motif */}
            <View style={styles.greetingContentRow}>
              {/* Left Vector Motif: Kasful Plumes + Dhak Drum + Alpona Swirl + Diamond */}
              <View style={styles.motifContainer}>
                <Svg width="48" height="28" viewBox="0 0 64 32" fill="none">
                  {/* Kasful plumes */}
                  <Path d="M16 11 C13 7, 10 4, 6 4 C10 6, 12 9, 14 13" stroke="#EAE0D0" strokeWidth="1.5" strokeLinecap="round" />
                  <Path d="M17 10 C15 5, 12 2, 7 1 C11 4, 13 8, 15 12" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                  <Path d="M19 10 C18 6, 16 3, 11 2 C14 5, 16 8, 17 12" stroke="#E4D7C5" strokeWidth="1.3" strokeLinecap="round" />
                  {/* Dhak Drum Body */}
                  <G transform="translate(14, 8) rotate(-14)">
                    <Path d="M3 4 C7 3, 14 3, 18 4 L16 19 C12 20, 6 20, 4 19 Z" fill="#EDDCC3" stroke="#BCA070" strokeWidth="1" />
                    <Ellipse cx="10.5" cy="4" rx="7.5" ry="2" fill="#D9BE95" stroke="#A78652" strokeWidth="0.8" />
                    <Ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#CCA874" stroke="#A78652" strokeWidth="0.8" />
                    <Path d="M4 4 L15 19 M8 4 L12 19 M13 4 L8 19 M17 4 L5 19" stroke="#AB8B58" strokeWidth="0.7" strokeLinecap="round" />
                    <Line x1="17" y1="2" x2="3" y2="21" stroke="#831917" strokeWidth="1.2" strokeLinecap="round" />
                  </G>
                  {/* Alpona Swirl */}
                  <Path d="M26 23 C31 27, 39 26, 43 20" stroke="#CAA776" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Diamond Motif */}
                  <G transform="translate(48, 16)">
                    <Path d="M0 -3.5 L3.5 0 L0 3.5 L-3.5 0 Z" stroke="#CAA776" strokeWidth="1.1" fill="none" />
                    <Circle cx="0" cy="0" r="1" fill="#831917" />
                  </G>
                </Svg>
              </View>

              {/* Bengali Greeting Typography */}
              <View style={styles.textWrap}>
                <Text style={styles.prefixText}>{prefix}</Text>
                <Text style={styles.suffixText}>{suffix}</Text>
              </View>

              {/* Right Vector Motif: Symmetrical Kasful Plumes + Dhak Drum + Alpona Swirl + Diamond */}
              <View style={styles.motifContainer}>
                <Svg width="48" height="28" viewBox="0 0 64 32" fill="none">
                  {/* Kasful plumes */}
                  <Path d="M48 11 C51 7, 54 4, 58 4 C54 6, 52 9, 50 13" stroke="#EAE0D0" strokeWidth="1.5" strokeLinecap="round" />
                  <Path d="M47 10 C49 5, 52 2, 57 1 C53 4, 51 8, 49 12" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                  <Path d="M45 10 C46 6, 48 3, 53 2 C50 5, 48 8, 47 12" stroke="#E4D7C5" strokeWidth="1.3" strokeLinecap="round" />
                  {/* Dhak Drum Body */}
                  <G transform="translate(50, 8) scale(-1, 1) rotate(-14)">
                    <Path d="M3 4 C7 3, 14 3, 18 4 L16 19 C12 20, 6 20, 4 19 Z" fill="#EDDCC3" stroke="#BCA070" strokeWidth="1" />
                    <Ellipse cx="10.5" cy="4" rx="7.5" ry="2" fill="#D9BE95" stroke="#A78652" strokeWidth="0.8" />
                    <Ellipse cx="10" cy="19" rx="6" ry="1.5" fill="#CCA874" stroke="#A78652" strokeWidth="0.8" />
                    <Path d="M4 4 L15 19 M8 4 L12 19 M13 4 L8 19 M17 4 L5 19" stroke="#AB8B58" strokeWidth="0.7" strokeLinecap="round" />
                    <Line x1="17" y1="2" x2="3" y2="21" stroke="#831917" strokeWidth="1.2" strokeLinecap="round" />
                  </G>
                  {/* Alpona Swirl */}
                  <Path d="M38 23 C33 27, 25 26, 21 20" stroke="#CAA776" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Diamond Motif */}
                  <G transform="translate(16, 16)">
                    <Path d="M0 -3.5 L3.5 0 L0 3.5 L-3.5 0 Z" stroke="#CAA776" strokeWidth="1.1" fill="none" />
                    <Circle cx="0" cy="0" r="1" fill="#831917" />
                  </G>
                </Svg>
              </View>
            </View>

            {/* Bottom Sacred Ornament Dots & Diamond */}
            <View style={styles.ornamentRow}>
              <View style={styles.goldDot} />
              <View style={styles.redDiamond} />
              <View style={styles.goldDot} />
            </View>
          </Pressable>

          {/* Right Action: User Profile Circle */}
          <Pressable
            style={styles.profileBtn}
            onPress={() => navigation?.navigate('Profile')}
            hitSlop={10}
          >
            <View style={styles.avatarCircle}>
              {user?.name ? (
                <Text style={styles.avatarInitial}>{user.name.charAt(0)}</Text>
              ) : (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="#3D1212">
                  <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </Svg>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Interactive Festival Tithi Switcher Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>🛕 Select Durga Puja Day</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {/* Auto / Real Calendar Choice */}
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  overrideDayKey === null && styles.pickerOptionActive,
                ]}
                onPress={() => handleSelectDay(null)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    overrideDayKey === null && styles.pickerOptionTextActive,
                  ]}
                >
                  📅 Auto (Device Calendar Date)
                </Text>
              </TouchableOpacity>

              {/* Tithi Days (13 Oct to 21 Oct 2026) */}
              {PUJA_DAYS_2026.slice(1).map((item, idx) => {
                const dateKeys = ['10-13', '10-14', '10-15', '10-16', '10-17', '10-19', '10-20', '10-21'];
                const dKey = dateKeys[idx] || '10-17';
                const isSelected = overrideDayKey === dKey;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pickerOption, isSelected && styles.pickerOptionActive]}
                    onPress={() => handleSelectDay(dKey)}
                  >
                    <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.pickerDateText, isSelected && { color: '#FFF' }]}>
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* General Shubho Sharodiya */}
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  overrideDayKey === 'SHARODIYA' && styles.pickerOptionActive,
                ]}
                onPress={() => handleSelectDay('SHARODIYA')}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    overrideDayKey === 'SHARODIYA' && styles.pickerOptionTextActive,
                  ]}
                >
                  🍂 শুভ শারদীয়া (Rest of the Year)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FBF7EE',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
  },
  headerShell: {
    backgroundColor: '#FBF7EE',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(200, 166, 106, 0.7)',
    position: 'relative',
    shadowColor: '#2D1A16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  mandapBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  alponaLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 42,
    opacity: 0.35,
  },
  alponaRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 56,
    height: 42,
    opacity: 0.35,
  },
  container: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 235, 217, 0.5)',
  },
  centerBanner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trishulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: -1,
  },
  greetingContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  motifContainer: {
    width: 44,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  prefixText: {
    color: '#2C1B18',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web'
      ? "'Galada', 'Atma', 'Tiro Bangla', cursive, serif"
      : 'Galada_400Regular',
  },
  suffixText: {
    color: '#831917',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web'
      ? "'Galada', 'Atma', 'Tiro Bangla', cursive, serif"
      : 'Galada_400Regular',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -1,
  },
  goldDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#CAA776',
  },
  redDiamond: {
    width: 5,
    height: 5,
    backgroundColor: '#831917',
    transform: [{ rotate: '45deg' }],
  },
  profileBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2E6D6',
    borderWidth: 1,
    borderColor: '#EBDCC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#381E18',
    fontWeight: '800',
    fontSize: 16,
  },

  /* Picker Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFEFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EBDCC9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E4D6',
    marginBottom: spacing.xs,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#831917',
  },
  closeBtn: {
    fontSize: 14,
    color: '#A08470',
    fontWeight: 'bold',
    padding: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: '#FAF6EE',
    marginBottom: 6,
  },
  pickerOptionActive: {
    backgroundColor: '#831917',
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A3228',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  pickerDateText: {
    fontSize: 11,
    color: '#8A7B6E',
  },
});
