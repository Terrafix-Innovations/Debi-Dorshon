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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { fetchAutocompletePlaces } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

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
    try {
      Vibration.vibrate(30);
    } catch (e) {}
    onSwap();
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardMainRow}>
        {/* Left Vertical Timeline Indicator */}
        <View style={styles.timelineColumn}>
          <View style={styles.startRing} />
          <View style={styles.timelineLine} />
          <View style={styles.destCircle}>
            <Ionicons name="location" size={9} color="#FFFFFF" />
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
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="swap-vertical" size={22} color="#7A1515" />
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator size="small" color="#7A1515" style={{ marginTop: 6 }} />
          )}
        </View>
      </View>

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
                color={activeInput === 'start' ? '#8a7a2e' : '#5a1512'}
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

            {/* Optional "Use Current Location" Quick Choice for Start */}
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
  cardContainer: {
    backgroundColor: '#FAF5EB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EADCC6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Left Timeline Indicator */
  timelineColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    marginRight: 10,
    marginTop: 18,
  },
  startRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3.5,
    borderColor: '#8A7A2E',
    backgroundColor: '#FAF5EB',
  },
  timelineLine: {
    width: 2.5,
    height: 48,
    backgroundColor: '#E7BCC6',
    marginVertical: 4,
  },
  destCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7A1515',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#8A7A2E',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  destLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A1515',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E7D8',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.espresso,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#8A7B6E',
    fontWeight: '500',
  },

  /* Right Action Column */
  rightActionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  verticalDivider: {
    width: 1,
    height: 90,
    backgroundColor: '#E8DEC9',
    marginRight: 12,
  },
  swapCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8D7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2D3BE',
  },

  /* Autocomplete Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: spacing.md,
  },
  searchModalCard: {
    backgroundColor: '#faf7f2',
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
    color: '#903f00',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2ece1',
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
    backgroundColor: '#f2ece1',
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
    backgroundColor: '#f2ece1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.espresso },
  suggTitle: { fontSize: 14, fontWeight: '700', color: colors.espresso },
  suggSub: { fontSize: 11, color: `${colors.espresso}88`, marginTop: 1 },
  emptyText: { textAlign: 'center', color: `${colors.espresso}88`, marginVertical: spacing.md },
});
