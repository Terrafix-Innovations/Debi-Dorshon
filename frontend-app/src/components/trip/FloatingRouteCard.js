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
      <View style={styles.cardRow}>
        {/* Left Vertical Rail (Gold Ring -> Pink Connector -> Maroon Pin) */}
        <View style={styles.leftRail}>
          <View style={styles.goldRing}>
            <View style={styles.goldInnerDot} />
          </View>
          <View style={styles.railLine} />
          <View style={styles.maroonPin}>
            <Ionicons name="location" size={10} color={colors.white} />
          </View>
        </View>

        {/* Inputs Column */}
        <View style={styles.inputsColumn}>
          {/* Start Location Input */}
          <TouchableOpacity
            style={styles.inputPill}
            onPress={() => handleOpenSearch('start')}
            activeOpacity={0.8}
          >
            <Ionicons name="locate-outline" size={16} color="#8a7a2e" />
            <Text style={startText ? styles.inputText : styles.inputPlaceholder} numberOfLines={1}>
              {startText || 'Search start location...'}
            </Text>
            {startText ? (
              <TouchableOpacity
                onPress={() => {
                  onStartChange('');
                  onSelectStartPlace(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={`${colors.espresso}66`} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>

          {/* Destination Input */}
          <TouchableOpacity
            style={styles.inputPill}
            onPress={() => handleOpenSearch('end')}
            activeOpacity={0.8}
          >
            <Ionicons name="flag-outline" size={16} color="#5a1512" />
            <Text style={endText ? styles.inputText : styles.inputPlaceholder} numberOfLines={1}>
              {endText || 'Search destination...'}
            </Text>
            {endText ? (
              <TouchableOpacity
                onPress={() => {
                  onEndChange('');
                  onSelectEndPlace(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={`${colors.espresso}66`} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Swap Button & Loader Column */}
        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={styles.swapBtn}
            onPress={handleTriggerSwap}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="swap-vertical" size={20} color="#903f00" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color="#903f00" style={{ marginTop: 6 }} />
          ) : null}
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
    backgroundColor: '#fdfaf4',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  /* Left Rail */
  leftRail: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    paddingVertical: 4,
  },
  goldRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#8a7a2e',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  goldInnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8a7a2e',
  },
  railLine: {
    width: 2,
    height: 22,
    backgroundColor: '#e7bcc6',
    marginVertical: 2,
  },
  maroonPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#5a1512',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Inputs Column */
  inputsColumn: {
    flex: 1,
    gap: 6,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2ece1',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 38,
    gap: spacing.xs,
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.espresso,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: `${colors.espresso}77`,
  },

  /* Action Column */
  actionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2ece1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.goldMuted}40`,
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
