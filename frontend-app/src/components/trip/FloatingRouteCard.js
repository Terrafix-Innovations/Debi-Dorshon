import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Vibration,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAutocompletePlaces } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const GOLD = '#7C6D28';   // START accent
const MAROON = '#6E1412'; // DESTINATION accent
const PINK = '#E8BEC8';   // connector line

const triggerHaptic = (ms = 15) => {
  try {
    Vibration.vibrate(ms);
  } catch (e) { }
};

export default function FloatingRouteCard({
  startText,
  endText,
  onStartChange,
  onEndChange,
  onSelectStartPlace,
  onSelectEndPlace,
  onSwap,
  onUseCurrentLocation,
  onSearchActiveChange,
  loading = false,
}) {
  const [activeField, setActiveField] = useState(null); // 'start' | 'end' | null
  const [startVal, setStartVal] = useState(startText || '');
  const [endVal, setEndVal] = useState(endText || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync external prop changes
  useEffect(() => {
    setStartVal(startText || '');
  }, [startText]);

  useEffect(() => {
    setEndVal(endText || '');
  }, [endText]);

  // Inform parent when search dropdown is active/inactive
  useEffect(() => {
    if (onSearchActiveChange) {
      onSearchActiveChange(activeField !== null);
    }
  }, [activeField, onSearchActiveChange]);

  const currentQuery = activeField === 'start' ? startVal : activeField === 'end' ? endVal : '';

  // Debounced search when active field query changes
  useEffect(() => {
    if (!activeField) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = (currentQuery || '').trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const list = await fetchAutocompletePlaces(trimmed, 6);
        setSuggestions(list || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [currentQuery, activeField]);

  const handleStartFocus = () => {
    triggerHaptic(12);
    setActiveField('start');
  };

  const handleEndFocus = () => {
    triggerHaptic(12);
    setActiveField('end');
  };

  const handleStartChangeText = (text) => {
    setStartVal(text);
    if (onStartChange) onStartChange(text);
    if (activeField !== 'start') setActiveField('start');
  };

  const handleEndChangeText = (text) => {
    setEndVal(text);
    if (onEndChange) onEndChange(text);
    if (activeField !== 'end') setActiveField('end');
  };

  const handleClearStart = () => {
    triggerHaptic(15);
    setStartVal('');
    if (onStartChange) onStartChange('');
    if (onSelectStartPlace) onSelectStartPlace(null);
    setSuggestions([]);
    startInputRef.current?.focus();
  };

  const handleClearEnd = () => {
    triggerHaptic(15);
    setEndVal('');
    if (onEndChange) onEndChange('');
    if (onSelectEndPlace) onSelectEndPlace(null);
    setSuggestions([]);
    endInputRef.current?.focus();
  };

  const handleSelectSuggestion = (place) => {
    triggerHaptic(18);
    if (activeField === 'start') {
      setStartVal(place.title);
      if (onSelectStartPlace) onSelectStartPlace(place);
      if (onStartChange) onStartChange(place.title);
    } else if (activeField === 'end') {
      setEndVal(place.title);
      if (onSelectEndPlace) onSelectEndPlace(place);
      if (onEndChange) onEndChange(place.title);
    }
    setActiveField(null);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handlePressCurrentLocation = () => {
    triggerHaptic(25);
    if (onUseCurrentLocation) onUseCurrentLocation();
    setActiveField(null);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleTriggerSwap = () => {
    triggerHaptic(30);
    if (onSwap) onSwap();
  };

  const handleCloseDropdown = () => {
    triggerHaptic(10);
    setActiveField(null);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.cardShell}>
      {/* Decorative Corner Art Layer */}
      <View style={styles.cornerArtLayer} pointerEvents="none">
        {/* Top-Right Golden Floral Vine SVG Motif */}
        <View style={styles.topRightVine}>
          <Svg width="72" height="72" viewBox="0 0 80 80" fill="none">
            <Path d="M80 0 C60 5, 45 20, 42 45 C40 30, 52 14, 80 0 Z" fill="#D9BE94" opacity={0.35} />
            <Path d="M80 15 C65 20, 55 35, 52 55" stroke="#CAA774" strokeWidth="1.2" strokeLinecap="round" />
            <Path d="M80 30 C72 34, 66 44, 65 58" stroke="#CAA774" strokeWidth="0.9" strokeLinecap="round" />
            <Path d="M56 26 C50 20, 52 14, 58 16 C64 18, 62 24, 56 26 Z" fill="#CAA774" opacity={0.4} />
            <Circle cx="45" cy="50" r="1.5" fill="#CAA774" />
          </Svg>
        </View>

        {/* Bottom-Right Maroon & Gold Lotus Petals SVG Motif */}
        <View style={styles.bottomRightLotus}>
          <Svg width="72" height="56" viewBox="0 0 80 64" fill="none">
            <Path d="M80 64 C65 58, 52 48, 48 32 C58 35, 70 46, 80 64 Z" fill="#7A1614" stroke="#D4B27B" strokeWidth="0.8" />
            <Path d="M80 64 C70 54, 62 42, 60 26 C68 30, 75 42, 80 64 Z" fill="#99201D" stroke="#D4B27B" strokeWidth="0.8" />
            <Path d="M80 64 C76 50, 72 38, 70 18 C78 26, 80 40, 80 64 Z" fill="#B32824" stroke="#E2C89B" strokeWidth="0.8" />
            <Path d="M48 48 C42 46, 40 40, 44 38 C48 36, 52 42, 48 48 Z" fill="#CAA774" opacity={0.6} />
          </Svg>
        </View>
      </View>

      <View style={styles.cardMainRow}>
        {/* Left Timeline Rail: Hollow Gold Ring -> Pink Pill Line -> Solid Maroon Circle Pin */}
        <View style={styles.timelineColumn}>
          <View style={styles.startRing} />
          <View style={styles.timelineConnector} />
          <View style={styles.destCirclePin}>
            <Svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </Svg>
          </View>
        </View>

        {/* Inputs Column */}
        <View style={styles.inputsColumn}>
          {/* START Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.startLabel}>START</Text>
            <View style={[styles.inputPill, activeField === 'start' && styles.inputPillActiveStart]}>
              <Ionicons name="location-outline" size={16} color="#8A7B6E" />
              <TextInput
                ref={startInputRef}
                style={[
                  styles.textInput,
                  Platform.OS === 'web' && { outlineStyle: 'none', outline: 'none' },
                ]}
                underlineColorAndroid="transparent"
                placeholder="Choose start location"
                placeholderTextColor="#8A7B6E"
                value={startVal}
                onChangeText={handleStartChangeText}
                onFocus={handleStartFocus}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {startVal ? (
                <TouchableOpacity
                  onPress={handleClearStart}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#8A7B6E" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handlePressCurrentLocation}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="target" size={18} color={GOLD} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* DESTINATION Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.destLabel}>DESTINATION</Text>
            <View style={[styles.inputPill, activeField === 'end' && styles.inputPillActiveDest]}>
              <Ionicons name="location-outline" size={16} color="#8A7B6E" />
              <TextInput
                ref={endInputRef}
                style={[
                  styles.textInput,
                  Platform.OS === 'web' && { outlineStyle: 'none', outline: 'none' },
                ]}
                underlineColorAndroid="transparent"
                placeholder="Choose destination"
                placeholderTextColor="#8A7B6E"
                value={endVal}
                onChangeText={handleEndChangeText}
                onFocus={handleEndFocus}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {endVal ? (
                <TouchableOpacity
                  onPress={handleClearEnd}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#8A7B6E" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="flag-outline" size={17} color="#8A7B6E" />
              )}
            </View>
          </View>
        </View>

        {/* Right Action Column (Divider & Swap Button) */}
        <View style={styles.rightActionColumn}>
          <View style={styles.verticalDivider} />
          <TouchableOpacity
            style={styles.swapCircleBtn}
            onPress={handleTriggerSwap}
            activeOpacity={0.75}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MAROON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M8 19V5M8 5L4.5 8.5M8 5l3.5 3.5" />
              <Path d="M16 5v14M16 19l-3.5-3.5M16 19l3.5-3.5" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator for Route Plan */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={MAROON} />
          <Text style={styles.loadingText}>Finding optimal pandal route...</Text>
        </View>
      )}

      {/* Inline Dropdown for Autocomplete Suggestions (Like Web, No Popups) */}
      {activeField && (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeaderRow}>
            <Text style={styles.dropdownHeaderTitle}>
              {activeField === 'start' ? 'Start Location Suggestions' : 'Destination Suggestions'}
            </Text>
            <TouchableOpacity
              style={styles.dropdownCloseBtn}
              onPress={handleCloseDropdown}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#8A7B6E" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* If Start is active, show Use Current Location at top */}
            {activeField === 'start' && (
              <TouchableOpacity
                style={styles.currentLocItem}
                onPress={handlePressCurrentLocation}
                activeOpacity={0.7}
              >
                <View style={styles.currentLocIconWrap}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color={MAROON} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentLocTitle}>Use Current Location</Text>
                  <Text style={styles.currentLocSubtitle}>Your GPS coordinates in Kolkata</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(138, 123, 110, 0.6)" />
              </TouchableOpacity>
            )}

            {/* Suggestions Loading */}
            {loadingSuggestions && (
              <View style={styles.dropdownLoadingRow}>
                <ActivityIndicator size="small" color={MAROON} />
                <Text style={styles.dropdownLoadingText}>Finding locations & pandals...</Text>
              </View>
            )}

            {/* Autocomplete items */}
            {!loadingSuggestions && suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.id || `sugg_${idx}`}
                style={styles.suggItem}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>{item.badge || '📍 Place'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggTitle} numberOfLines={1}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.suggSub} numberOfLines={1}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(138, 123, 110, 0.6)" />
              </TouchableOpacity>
            ))}

            {/* Empty state */}
            {!loadingSuggestions && suggestions.length === 0 && currentQuery.trim().length >= 2 && (
              <View style={styles.dropdownEmptyRow}>
                <Text style={styles.dropdownEmptyText}>No matching places or pandals found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: '#FEFCF8',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#2D1A16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerArtLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightVine: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 72,
    height: 72,
    opacity: 0.45,
  },
  bottomRightLotus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 72,
    height: 56,
    opacity: 0.5,
  },

  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },

  /* Left Timeline Rail */
  timelineColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    marginRight: 10,
    marginTop: 18,
  },
  startRing: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 3.5,
    borderColor: GOLD,
    backgroundColor: '#FDFAF4',
  },
  timelineConnector: {
    width: 3,
    height: 44,
    borderRadius: 1.5,
    backgroundColor: PINK,
    marginVertical: 4,
  },
  destCirclePin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MAROON,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  /* Inputs Column */
  inputsColumn: {
    flex: 1,
    gap: 8,
  },
  inputGroup: {},
  startLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  destLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MAROON,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F2EA',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.6)',
  },
  inputPillActiveStart: {
    borderColor: GOLD,
    backgroundColor: '#FAF5EE',
  },
  inputPillActiveDest: {
    borderColor: MAROON,
    backgroundColor: '#FAF5EE',
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.espresso,
    paddingVertical: 0,
    height: 38,
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
        boxShadow: 'none',
      },
    }),
  },

  /* Right Action Column */
  rightActionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  verticalDivider: {
    width: 1,
    height: 86,
    backgroundColor: 'rgba(235, 220, 201, 0.8)',
    marginRight: 10,
  },
  swapCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.8)',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: MAROON,
  },

  /* Inline Dropdown */
  dropdownContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 220, 201, 0.7)',
    paddingTop: 8,
    zIndex: 20,
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  dropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A7B6E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dropdownCloseBtn: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: '#F2ECE1',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  currentLocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.9)',
    marginBottom: 6,
    gap: 10,
  },
  currentLocIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.espresso,
  },
  currentLocSubtitle: {
    fontSize: 11,
    color: '#8A7B6E',
    marginTop: 1,
  },
  dropdownLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dropdownLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: MAROON,
  },
  suggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.4)',
  },
  badgeWrap: {
    backgroundColor: '#F2ECE1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.espresso,
  },
  suggTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.espresso,
  },
  suggSub: {
    fontSize: 11,
    color: '#8A7B6E',
    marginTop: 1,
  },
  dropdownEmptyRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#8A7B6E',
    fontStyle: 'italic',
  },
});
