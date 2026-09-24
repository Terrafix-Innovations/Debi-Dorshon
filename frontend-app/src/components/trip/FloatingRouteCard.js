import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Vibration,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAutocompletePlaces } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

const GOLD = '#7C6D28';   // START accent
const MAROON = '#6E1412'; // DESTINATION accent
const PINK = '#E8BEC8';   // connector line

export default function FloatingRouteCard({
  startText,
  endText,
  onStartChange,
  onEndChange,
  onSelectStartPlace,
  onSelectEndPlace,
  onSwap,
  onUseCurrentLocation,
  loading = false,
}) {
  const [activeInput, setActiveInput] = useState(null); // 'start' | 'end' | null
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const debounceTimer = useRef(null);

  // Debounced search when active input query changes
  useEffect(() => {
    if (!activeInput) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const list = await fetchAutocompletePlaces(query, 6);
        setSuggestions(list || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, activeInput]);

  const handleOpenSearch = (target) => {
    setActiveInput(target);
    setQuery(target === 'start' ? startText || '' : endText || '');
  };

  const handleSelectSuggestion = (place) => {
    if (activeInput === 'start') {
      onSelectStartPlace(place);
    } else if (activeInput === 'end') {
      onSelectEndPlace(place);
    }
    setActiveInput(null);
    setQuery('');
  };

  const handleTriggerSwap = () => {
    try { Vibration.vibrate(30); } catch (e) {}
    onSwap();
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
            <TouchableOpacity
              style={styles.inputPill}
              onPress={() => handleOpenSearch('start')}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={16} color="#8A7B6E" />
              <Text
                style={startText ? styles.inputText : styles.inputPlaceholder}
                numberOfLines={1}
              >
                {startText || 'Choose start location'}
              </Text>
              <TouchableOpacity
                onPress={onUseCurrentLocation}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="target" size={18} color="#8A7B6E" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* DESTINATION Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.destLabel}>DESTINATION</Text>
            <TouchableOpacity
              style={styles.inputPill}
              onPress={() => handleOpenSearch('end')}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={16} color="#8A7B6E" />
              <Text
                style={endText ? styles.inputText : styles.inputPlaceholder}
                numberOfLines={1}
              >
                {endText || 'Choose destination'}
              </Text>
              <Ionicons name="flag-outline" size={17} color="#8A7B6E" />
            </TouchableOpacity>
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

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={MAROON} />
          <Text style={styles.loadingText}>Finding optimal pandal route...</Text>
        </View>
      )}

      {/* Autocomplete Search Modal */}
      <Modal
        visible={activeInput !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveInput(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveInput(null)}>
          <Pressable style={styles.searchModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>
                {activeInput === 'start' ? 'Pick Start Location' : 'Pick Destination'}
              </Text>
              <TouchableOpacity onPress={() => setActiveInput(null)}>
                <Ionicons name="close" size={22} color={colors.espresso} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputRow}>
              <Ionicons
                name={activeInput === 'start' ? 'locate' : 'flag'}
                size={18}
                color={activeInput === 'start' ? GOLD : MAROON}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Type location, metro, or pandal name..."
                placeholderTextColor={`${colors.espresso}77`}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              {loadingSuggestions && <ActivityIndicator size="small" color="#903f00" />}
            </View>

            {activeInput === 'start' ? (
              <TouchableOpacity
                style={styles.currentLocRow}
                onPress={() => {
                  onUseCurrentLocation();
                  setActiveInput(null);
                }}
              >
                <View style={styles.locIconWrap}>
                  <Ionicons name="navigate-circle" size={22} color="#903f00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locTitle}>Use Current Location</Text>
                  <Text style={styles.locSub}>Your GPS coordinates in Kolkata</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <FlatList
              data={suggestions}
              keyExtractor={(item, idx) => item.id || `sugg_${idx}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>{item.badge || '📍 Place'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggTitle}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.suggSub}>{item.subtitle}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={`${colors.espresso}55`} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                query.trim() && !loadingSuggestions ? (
                  <Text style={styles.emptyText}>No matching places found</Text>
                ) : null
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.6)',
  },
  inputText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.espresso,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: '#8A7B6E',
    fontWeight: '500',
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

  /* Search Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: spacing.md,
  },
  searchModalCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: radius.lg,
    maxHeight: '80%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MAROON,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2ECE1',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
    fontWeight: '600',
  },
  currentLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  locIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2ECE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locTitle: { fontSize: 13, fontWeight: '800', color: colors.espresso },
  locSub: { fontSize: 11, color: `${colors.espresso}88` },

  suggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.goldMuted}40`,
    gap: spacing.xs,
  },
  badgeWrap: {
    backgroundColor: '#F2ECE1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.espresso },
  suggTitle: { fontSize: 14, fontWeight: '700', color: colors.espresso },
  suggSub: { fontSize: 11, color: `${colors.espresso}88`, marginTop: 1 },
  emptyText: { textAlign: 'center', color: `${colors.espresso}88`, marginVertical: spacing.md },
});
