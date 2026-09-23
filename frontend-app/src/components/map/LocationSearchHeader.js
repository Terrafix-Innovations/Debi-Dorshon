import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export const ROUTE_PRESETS = [
  {
    id: 'ahiritola',
    label: 'Ahiritola ➔ Maniktala',
    origin: {
      latitude: 22.596474,
      longitude: 88.353293,
      name: 'Ahiritola Ghat',
      area: 'North Kolkata',
    },
    destination: {
      latitude: 22.618676,
      longitude: 88.373191,
      name: 'Maniktala More',
      area: 'North Kolkata',
    },
  },
  {
    id: 'dumdum',
    label: 'Dum Dum ➔ Maniktala',
    origin: {
      latitude: 22.620117,
      longitude: 88.391848,
      name: 'Dum Dum Metro',
      area: 'Blue Line',
    },
    destination: {
      latitude: 22.618676,
      longitude: 88.373191,
      name: 'Maniktala More',
      area: 'North Kolkata',
    },
  },
  {
    id: 'bagbazar',
    label: 'Bagbazar ➔ College St',
    origin: {
      latitude: 22.6035,
      longitude: 88.3685,
      name: 'Bagbazar Sarbojanin',
      area: 'North Kolkata',
    },
    destination: {
      latitude: 22.5746,
      longitude: 88.3638,
      name: 'College Square',
      area: 'College Street',
    },
  },
];

/**
 * LocationSearchHeader: Floating top bar for selecting route origin & destination
 */
export default function LocationSearchHeader({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwap,
  placesList = [],
  userCoords = null,
  onUseCurrentLocation,
  onSelectPreset,
}) {
  const [modalTarget, setModalTarget] = useState(null); // 'origin' | 'destination' | null
  const [searchQuery, setSearchQuery] = useState('');

  const openPicker = (target) => {
    setModalTarget(target);
    setSearchQuery('');
  };

  const closePicker = () => {
    setModalTarget(null);
    setSearchQuery('');
  };

  const handleSelectPlace = (place) => {
    const coords = {
      latitude: place.location?.latitude ?? place.lat ?? place.latitude,
      longitude: place.location?.longitude ?? place.lng ?? place.longitude,
      name: place.name,
      area: place.cluster || place.area || place.region || '',
      item: place,
    };

    if (modalTarget === 'origin') {
      onSelectOrigin(coords);
    } else {
      onSelectDestination(coords);
    }
    closePicker();
  };

  const filteredPlaces = placesList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.nameBn?.toLowerCase().includes(q) ||
      p.cluster?.toLowerCase().includes(q) ||
      p.area?.toLowerCase().includes(q) ||
      p.region?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Card */}
      <View style={styles.card}>
        <View style={styles.inputsColumn}>
          {/* Origin Pill */}
          <Pressable
            style={styles.locationPill}
            onPress={() => openPicker('origin')}
          >
            <View style={[styles.dot, styles.originDot]} />
            <Text
              style={[styles.pillText, !origin && styles.placeholderText]}
              numberOfLines={1}
            >
              {origin?.name || 'Choose starting location...'}
            </Text>
            {userCoords && (
              <Pressable
                onPress={onUseCurrentLocation}
                style={styles.myLocationBtn}
                hitSlop={8}
              >
                <Ionicons name="locate" size={14} color="#2E7D32" />
                <Text style={styles.myLocationText}>GPS</Text>
              </Pressable>
            )}
          </Pressable>

          {/* Dotted connector */}
          <View style={styles.connectorLine} />

          {/* Destination Pill */}
          <Pressable
            style={styles.locationPill}
            onPress={() => openPicker('destination')}
          >
            <View style={[styles.dot, styles.destinationDot]} />
            <Text
              style={[styles.pillText, !destination && styles.placeholderText]}
              numberOfLines={1}
            >
              {destination?.name || 'Choose destination pandal...'}
            </Text>
          </Pressable>
        </View>

        {/* Swap Button */}
        <Pressable style={styles.swapBtn} onPress={onSwap} hitSlop={8}>
          <Ionicons name="swap-vertical" size={18} color={colors.espresso} />
        </Pressable>
      </View>

      {/* Quick Presets Carousel */}
      <View style={styles.presetsRow}>
        {ROUTE_PRESETS.map((p) => (
          <Pressable
            key={p.id}
            style={styles.presetChip}
            onPress={() => onSelectPreset && onSelectPreset(p)}
          >
            <Ionicons name="flash-outline" size={11} color={colors.goldHighlight} />
            <Text style={styles.presetText}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={modalTarget !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Select {modalTarget === 'origin' ? 'Starting Point' : 'Destination'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Choose from popular pandals and transit hubs
                </Text>
              </View>
              <Pressable onPress={closePicker} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.espresso} />
              </Pressable>
            </View>

            {/* Quick My Location Option (if origin) */}
            {modalTarget === 'origin' && userCoords && (
              <Pressable
                style={styles.currentLocOption}
                onPress={() => {
                  onUseCurrentLocation();
                  closePicker();
                }}
              >
                <View style={styles.currentLocIcon}>
                  <Ionicons name="navigate" size={18} color="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentLocTitle}>Use Current GPS Location</Text>
                  <Text style={styles.currentLocSub}>
                    {userCoords.latitude.toFixed(4)}°, {userCoords.longitude.toFixed(4)}°
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Search Input */}
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={16} color={colors.goldMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search pandal, metro, or area..."
                placeholderTextColor={`${colors.espresso}66`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.espresso} />
                </Pressable>
              )}
            </View>

            {/* Places List */}
            <FlatList
              data={filteredPlaces}
              keyExtractor={(item, idx) => item._id || item.id || `place_${idx}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.placeItem}
                  onPress={() => handleSelectPlace(item)}
                >
                  <View style={styles.placeIcon}>
                    <Ionicons
                      name={item.nearest_metro ? 'subway-outline' : 'flower-outline'}
                      size={18}
                      color={colors.primaryMaroon}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.placeSub}>
                      {item.cluster || item.area || item.region || 'Kolkata'}
                      {item.nearest_metro?.name ? ` • 🚇 ${item.nearest_metro.name}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.goldMuted} />
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 4,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 25,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 243, 225, 0.96)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    padding: spacing.xs + 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  inputsColumn: {
    flex: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: `${colors.goldMuted}55`,
    gap: 8,
  },
  connectorLine: {
    width: 2,
    height: 6,
    backgroundColor: colors.goldMuted,
    marginLeft: 14,
    marginVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  originDot: {
    backgroundColor: '#1E7E34',
  },
  destinationDot: {
    backgroundColor: colors.secondaryRed,
  },
  pillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.espresso,
  },
  placeholderText: {
    color: `${colors.espresso}66`,
    fontWeight: '500',
  },
  myLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  myLocationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    overflow: 'hidden',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.espresso,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.espresso,
  },
  modalSubtitle: {
    fontSize: 12,
    color: `${colors.espresso}99`,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  currentLocOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  currentLocIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  currentLocSub: {
    fontSize: 10,
    color: `${colors.espresso}88`,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.espresso,
    padding: 0,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.goldMuted}44`,
    gap: spacing.sm,
  },
  placeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.primaryMaroon}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.espresso,
  },
  placeSub: {
    fontSize: 11,
    color: `${colors.espresso}99`,
    marginTop: 2,
  },
});
