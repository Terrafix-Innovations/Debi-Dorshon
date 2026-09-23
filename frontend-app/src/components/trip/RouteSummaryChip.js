import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function RouteSummaryChip({ distanceKm = 0, pandalsCount = 0 }) {
  if (!distanceKm && !pandalsCount) return null;

  return (
    <View style={styles.chipContainer}>
      <View style={styles.chipInner}>
        <Ionicons name="navigate" size={14} color={colors.white} />
        <Text style={styles.chipText}>
          {distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : ''}
          {distanceKm > 0 && pandalsCount >= 0 ? ' • ' : ''}
          {pandalsCount} Pandal{pandalsCount === 1 ? '' : 's'} on route
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#903f00',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f2ece1',
  },
  chipText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
});
