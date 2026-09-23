import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

/**
 * MapControlsHUD: Floating UI overlay for map navigation
 * - Recenter to user's live GPS position
 * - Fit camera to complete route & waypoints
 * - Zoom In & Zoom Out
 * - Category filter pill strip (All, Pandals, Metro, Train)
 */
export default function MapControlsHUD({
  activeFilter = 'all',
  onFilterChange,
  onRecenterUser,
  onFitRoute,
  onZoomIn,
  onZoomOut,
  hasActiveRoute = false,
  userLocationAvailable = false,
}) {
  const FILTERS = [
    { key: 'all', label: 'All Places', icon: 'layers-outline' },
    { key: 'pandals', label: 'Pandals', icon: 'flower-outline' },
    { key: 'metro', label: 'Metro', icon: 'subway-variant', isMCI: true },
    { key: 'train', label: 'Train', icon: 'train', isMCI: true },
  ];

  return (
    <View style={styles.hudContainer} pointerEvents="box-none">
      {/* Top Filter Chips Bar */}
      <View style={styles.filterStrip}>
        {FILTERS.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onFilterChange && onFilterChange(item.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              {item.isMCI ? (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={14}
                  color={isActive ? colors.white : colors.espresso}
                />
              ) : (
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isActive ? colors.white : colors.espresso}
                />
              )}
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Floating Action Controls on Right Side */}
      <View style={styles.rightControls}>
        {/* Recenter User GPS */}
        <Pressable
          style={[styles.controlBtn, userLocationAvailable && styles.gpsActiveBtn]}
          onPress={onRecenterUser}
          accessibilityLabel="Recenter to My Location"
        >
          <Ionicons
            name="navigate"
            size={18}
            color={userLocationAvailable ? '#2E7D32' : colors.primaryMaroon}
          />
          {userLocationAvailable && <View style={styles.gpsActiveDot} />}
        </Pressable>

        {/* Fit Entire Route (only if active route) */}
        {hasActiveRoute && (
          <Pressable
            style={styles.controlBtn}
            onPress={onFitRoute}
            accessibilityLabel="Fit Route on Map"
          >
            <Ionicons name="expand" size={18} color={colors.primaryMaroon} />
          </Pressable>
        )}

        {/* Zoom In & Out Stack */}
        <View style={styles.zoomStack}>
          <Pressable
            style={styles.zoomBtn}
            onPress={onZoomIn}
            accessibilityLabel="Zoom In"
          >
            <Ionicons name="add" size={20} color={colors.espresso} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            style={styles.zoomBtn}
            onPress={onZoomOut}
            accessibilityLabel="Zoom Out"
          >
            <Ionicons name="remove" size={20} color={colors.espresso} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginHorizontal: spacing.sm,
    marginTop: 126,
    backgroundColor: 'rgba(251, 243, 225, 0.94)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  filterChipActive: {
    backgroundColor: colors.primaryMaroon,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.espresso,
  },
  filterTextActive: {
    color: colors.white,
  },
  rightControls: {
    position: 'absolute',
    right: 14,
    top: 180,
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 243, 225, 0.96)',
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gpsActiveBtn: {
    borderColor: '#4CAF50',
  },
  gpsActiveDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  zoomStack: {
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 243, 225, 0.96)',
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  zoomBtn: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.goldMuted,
  },
});
