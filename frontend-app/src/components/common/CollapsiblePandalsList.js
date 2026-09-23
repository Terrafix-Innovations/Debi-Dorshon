import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Helper to calculate distance in kilometers between reference location and pandal coordinates
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const RATING_FILTERS = [
  { label: 'All', value: 0 },
  { label: '4.5+ ★', value: 4.5 },
  { label: '4.7+ ★', value: 4.7 },
  { label: '4.8+ ★', value: 4.8 },
];

export default function CollapsiblePandalsList({
  title = 'Nearby Pandals',
  subtitle,
  pandals = [],
  referenceLocation,
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [minRating, setMinRating] = useState(0);

  // Filter pandals based on selected rating filter
  const filteredPandals = useMemo(() => {
    return pandals.filter((pandal) => (pandal.rating || 0) >= minRating);
  }, [pandals, minRating]);

  return (
    <View style={styles.collapsibleContainer}>
      {/* Header Bar (Collapsed View showing number of pandals) */}
      <Pressable
        style={styles.collapsibleHeader}
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <View style={styles.headerLeft}>
          <View style={styles.pandalIconWrap}>
            <MaterialCommunityIcons name="flower-tulip" size={22} color={colors.goldHighlight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.collapsibleTitle}>{title}</Text>
            <Text style={styles.collapsibleSub}>
              {subtitle || `${filteredPandals.length} pandal${filteredPandals.length === 1 ? '' : 's'} near route`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredPandals.length}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
            size={26}
            color={colors.goldHighlight}
          />
        </View>
      </Pressable>

      {/* Rating Filter Options Bar */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Rating:</Text>
        <View style={styles.filterChipRow}>
          {RATING_FILTERS.map((filter) => {
            const isActive = minRating === filter.value;
            return (
              <Pressable
                key={filter.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setMinRating(filter.value)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Expanded List of Pandals (showing name, location, rating) */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {filteredPandals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="filter-outline" size={32} color={colors.goldMuted} />
              <Text style={styles.emptyText}>No pandals found with rating ≥ {minRating} ★</Text>
            </View>
          ) : (
            filteredPandals.map((pandal) => {
              const dist = referenceLocation
                ? calculateDistanceKm(
                    referenceLocation.lat,
                    referenceLocation.lng,
                    pandal.lat,
                    pandal.lng
                  )
                : null;

              return (
                <View key={pandal._id} style={styles.pandalCard}>
                  <View style={styles.pandalTopRow}>
                    <View style={styles.pandalNameWrap}>
                      <Text style={styles.pandalName}>{pandal.name}</Text>
                      {pandal.nameBn ? (
                        <Text style={styles.pandalNameBn}>{pandal.nameBn}</Text>
                      ) : null}
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color={colors.goldHighlight} />
                      <Text style={styles.ratingText}>{pandal.rating?.toFixed(1) || '4.5'}</Text>
                    </View>
                  </View>

                  <View style={styles.pandalLocationRow}>
                    <Ionicons name="location-outline" size={16} color={colors.primaryMaroon} />
                    <Text style={styles.pandalLocationText}>
                      {pandal.area} ({pandal.zone})
                    </Text>
                  </View>

                  <View style={styles.pandalMetaRow}>
                    {dist ? (
                      <View style={styles.distBadge}>
                        <Ionicons name="walk-outline" size={13} color={colors.espresso} />
                        <Text style={styles.distText}>{dist} km away</Text>
                      </View>
                    ) : (
                      <View style={styles.distBadge}>
                        <Ionicons name="compass-outline" size={13} color={colors.espresso} />
                        <Text style={styles.distText}>Along Route</Text>
                      </View>
                    )}
                    <Text style={styles.coordsText}>
                      {pandal.lat.toFixed(4)}°, {pandal.lng.toFixed(4)}°
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsibleContainer: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 2,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.espresso,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pandalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.goldHighlight}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  collapsibleSub: {
    fontSize: 12,
    color: `${colors.white}BB`,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.primaryMaroon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },

  /* Rating Filter Bar inside Collapsible Component */
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.goldMuted}30`,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.goldMuted}50`,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.espresso,
    marginBottom: 6,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  filterChipActive: {
    backgroundColor: colors.primaryMaroon,
    borderColor: colors.primaryMaroon,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.espresso,
  },
  filterChipTextActive: {
    color: colors.white,
  },

  /* Expanded Content */
  expandedContent: {
    padding: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: `${colors.goldMuted}60`,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    color: `${colors.espresso}AA`,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Pandal Card Item */
  pandalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pandalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  pandalNameWrap: { flex: 1 },
  pandalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
  },
  pandalNameBn: {
    fontSize: 12,
    color: `${colors.espresso}AA`,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.espresso,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ratingText: {
    color: colors.goldHighlight,
    fontWeight: '800',
    fontSize: 12,
  },
  pandalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  pandalLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.espresso,
  },
  pandalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${colors.goldMuted}40`,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.goldHighlight}25`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  distText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.espresso,
  },
  coordsText: {
    fontSize: 11,
    color: `${colors.espresso}88`,
  },
});

