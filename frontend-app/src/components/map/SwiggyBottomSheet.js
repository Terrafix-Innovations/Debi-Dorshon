import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

/**
 * SwiggyBottomSheet: Swiggy/Zomato-inspired bottom sheet for interactive map
 * - Mode 1: Route Summary (ETA, distance, detour stops carousel)
 * - Mode 2: Selected Place Card (details, detour distance, set as destination, external directions)
 */
export default function SwiggyBottomSheet({
  routeData,
  selectedPlace,
  onCloseSelectedPlace,
  onSelectStop,
  onSetAsDestination,
  onFocusPlace,
  userCoords,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Smooth animation when selectedPlace changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedPlace ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [selectedPlace]);

  const openExternalDirections = (lat, lng, name) => {
    const label = encodeURIComponent(name || 'Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) => console.warn('Could not open maps:', err));
  };

  // 1. RENDER SELECTED PLACE INSPECTION CARD
  if (selectedPlace) {
    const lat =
      selectedPlace.location?.latitude ??
      selectedPlace.lat ??
      selectedPlace.coordinate?.latitude;
    const lng =
      selectedPlace.location?.longitude ??
      selectedPlace.lng ??
      selectedPlace.coordinate?.longitude;
    const name = selectedPlace.name || selectedPlace.title || 'Selected Place';
    const isPandal = !selectedPlace.type || selectedPlace.type === 'pandal';
    const isMetro = selectedPlace.type === 'metro';
    const isTrain = selectedPlace.type === 'train';

    return (
      <View style={styles.sheetContainer}>
        <View style={styles.sheetCard}>
          {/* Top Drag Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handleBar} />
          </View>

          {/* Card Header */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryBadge,
                  isMetro && styles.metroBadge,
                  isTrain && styles.trainBadge,
                ]}
              >
                {isMetro ? (
                  <MaterialCommunityIcons name="subway-variant" size={13} color="#2E7D32" />
                ) : isTrain ? (
                  <MaterialCommunityIcons name="train" size={13} color="#1565C0" />
                ) : (
                  <Ionicons name="flower" size={13} color={colors.primaryMaroon} />
                )}
                <Text
                  style={[
                    styles.categoryText,
                    isMetro && styles.metroText,
                    isTrain && styles.trainText,
                  ]}
                >
                  {isMetro
                    ? 'Metro Station'
                    : isTrain
                    ? 'Railway Station'
                    : selectedPlace.step
                    ? `Parikrama Stop #${selectedPlace.step}`
                    : 'Durga Puja Pandal'}
                </Text>
              </View>

              {selectedPlace.detour_distance_km !== undefined && (
                <View style={styles.detourBadge}>
                  <Ionicons name="git-branch-outline" size={12} color={colors.goldHighlight} />
                  <Text style={styles.detourText}>
                    +{selectedPlace.detour_distance_km.toFixed(2)} km detour
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={onCloseSelectedPlace}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.espresso} />
            </Pressable>
          </View>

          {/* Place Title & Bengali Name */}
          <Text style={styles.placeTitle}>{name}</Text>
          {selectedPlace.nameBn && (
            <Text style={styles.placeBnName}>{selectedPlace.nameBn}</Text>
          )}

          {/* Info Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={colors.goldHighlight} />
              <Text style={styles.detailValue} numberOfLines={1}>
                {selectedPlace.cluster ||
                  selectedPlace.area ||
                  selectedPlace.region ||
                  'Kolkata'}
              </Text>
            </View>

            {selectedPlace.nearest_metro?.name && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="subway" size={14} color="#2E7D32" />
                <Text style={styles.detailValue} numberOfLines={1}>
                  {selectedPlace.nearest_metro.name}
                </Text>
              </View>
            )}

            {selectedPlace.rating && (
              <View style={styles.detailItem}>
                <Ionicons name="star" size={13} color="#FFA000" />
                <Text style={styles.detailValue}>{selectedPlace.rating}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {/* Set as Destination Button */}
            <Pressable
              style={[styles.actionBtn, styles.primaryActionBtn]}
              onPress={() => onSetAsDestination && onSetAsDestination(selectedPlace)}
            >
              <Ionicons name="navigate-circle" size={18} color={colors.white} />
              <Text style={styles.primaryActionText}>Route Here</Text>
            </Pressable>

            {/* Focus Map Button */}
            {lat && lng && (
              <Pressable
                style={[styles.actionBtn, styles.secondaryActionBtn]}
                onPress={() => onFocusPlace && onFocusPlace(lat, lng)}
              >
                <Ionicons name="scan-outline" size={16} color={colors.espresso} />
                <Text style={styles.secondaryActionText}>Focus</Text>
              </Pressable>
            )}

            {/* External Google Maps Button */}
            {lat && lng && (
              <Pressable
                style={[styles.actionBtn, styles.iconOnlyActionBtn]}
                onPress={() => openExternalDirections(lat, lng, name)}
                accessibilityLabel="Open External Maps"
              >
                <Ionicons name="open-outline" size={18} color={colors.primaryMaroon} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 2. RENDER ROUTE SUMMARY CARD (Default State)
  if (!routeData) return null;

  const itinerary = routeData.itinerary || [];
  const distanceKm = routeData.distanceKm ?? routeData.estimated_distance_km ?? 0;
  const durationMin =
    routeData.durationMin ?? Math.round((distanceKm || 1) * 3.5 + 5);

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.sheetCard}>
        {/* Top Drag Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* Route Overview Row */}
        <View style={styles.routeHeaderRow}>
          <View>
            <View style={styles.etaRow}>
              <Text style={styles.etaValue}>~{durationMin} mins</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.distanceValue}>{distanceKm} km</Text>
            </View>
            <Text style={styles.routeCorridorText} numberOfLines={1}>
              {routeData.source?.name || 'Origin'} ➔ {routeData.destination?.name || 'Destination'}
            </Text>
          </View>

          <View style={styles.stopsCountBadge}>
            <Text style={styles.stopsCountVal}>{itinerary.length}</Text>
            <Text style={styles.stopsCountLbl}>Pandals</Text>
          </View>
        </View>

        {/* Horizontal Stops Carousel */}
        {itinerary.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.carouselHeader}>
              <Text style={styles.carouselTitle}>Pandals Along Your Corridor</Text>
              <Text style={styles.carouselSub}>Tap to highlight on map</Text>
            </View>

            <FlatList
              horizontal
              data={itinerary}
              keyExtractor={(item, idx) =>
                item.pandal?._id || item.pandal?.id || `stop_${idx}`
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              renderItem={({ item, index }) => {
                const p = item.pandal || item;
                const detour = item.detour_distance_km;

                return (
                  <Pressable
                    style={styles.stopCard}
                    onPress={() => onSelectStop && onSelectStop(p, item.step || index + 1)}
                  >
                    <View style={styles.stopCardHeader}>
                      <View style={styles.stopNumberBadge}>
                        <Text style={styles.stopNumberText}>#{item.step || index + 1}</Text>
                      </View>
                      {detour !== undefined && (
                        <Text style={styles.stopDetourText}>
                          +{detour.toFixed(1)} km
                        </Text>
                      )}
                    </View>

                    <Text style={styles.stopName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.stopSub} numberOfLines={1}>
                      {p.cluster || p.region || 'Kolkata'}
                    </Text>

                    {p.nearest_metro?.name && (
                      <View style={styles.stopMetroRow}>
                        <MaterialCommunityIcons
                          name="subway-variant"
                          size={11}
                          color="#2E7D32"
                        />
                        <Text style={styles.stopMetroText} numberOfLines={1}>
                          {p.nearest_metro.name}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  sheetCard: {
    backgroundColor: 'rgba(251, 243, 225, 0.98)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.goldMuted,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg + 4,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.espresso}44`,
  },

  /* Selected Place Styles */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primaryMaroon}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.primaryMaroon}33`,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryMaroon,
    textTransform: 'uppercase',
  },
  metroBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  metroText: { color: '#2E7D32' },
  trainBadge: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  trainText: { color: '#1565C0' },
  detourBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.espresso,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  detourText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldHighlight,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.espresso,
    marginTop: 2,
  },
  placeBnName: {
    fontSize: 13,
    fontWeight: '600',
    color: `${colors.espresso}99`,
    marginTop: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.goldMuted}44`,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.espresso,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 6,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: colors.primaryMaroon,
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryActionBtn: {
    paddingHorizontal: 16,
    backgroundColor: colors.cardCream,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
  },
  secondaryActionText: {
    color: colors.espresso,
    fontWeight: '700',
    fontSize: 13,
  },
  iconOnlyActionBtn: {
    width: 42,
    backgroundColor: colors.cardCream,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
  },

  /* Route Overview Styles */
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryMaroon,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.goldMuted,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.espresso,
  },
  routeCorridorText: {
    fontSize: 12,
    color: `${colors.espresso}99`,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 240,
  },
  stopsCountBadge: {
    backgroundColor: colors.espresso,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  stopsCountVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.goldHighlight,
  },
  stopsCountLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
  },

  /* Carousel */
  carouselSection: {
    marginTop: 10,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  carouselTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.espresso,
  },
  carouselSub: {
    fontSize: 10,
    color: `${colors.espresso}88`,
    fontWeight: '600',
  },
  carouselContent: {
    gap: 8,
    paddingRight: spacing.md,
  },
  stopCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: 8,
    elevation: 2,
  },
  stopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopNumberBadge: {
    backgroundColor: `${colors.primaryMaroon}18`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  stopNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
  stopDetourText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldMuted,
  },
  stopName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.espresso,
  },
  stopSub: {
    fontSize: 10,
    color: `${colors.espresso}88`,
    marginTop: 1,
  },
  stopMetroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  stopMetroText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
