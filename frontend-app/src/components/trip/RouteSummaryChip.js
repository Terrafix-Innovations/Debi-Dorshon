import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function RouteSummaryChip({ distanceKm = 0, pandalsCount = 0 }) {
  if (!distanceKm && !pandalsCount) return null;

  const hoppingMins = Math.round(distanceKm * 15); // ~4 km/h walking pace

  return (
    <View style={styles.chipContainer}>
      <View style={styles.chipInner}>
        <View style={styles.iconWrap}>
          <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#831917" strokeWidth="2.2">
            <Path d="M9 6.75 15 4l6 2.75v12.5L15 22l-6-2.75L3 22V9.5L9 6.75Z" strokeLinejoin="round" />
            <Path d="M9 6.75v12.5M15 4v12.5" strokeLinejoin="round" />
          </Svg>
        </View>

        <Text style={styles.distText}>
          {distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '--'}
        </Text>

        <Text style={styles.dotText}>·</Text>

        <Text style={styles.timeText}>
          ~{hoppingMins} min hopping time
        </Text>

        {pandalsCount > 0 && (
          <>
            <Text style={styles.dotText}>·</Text>
            <Text style={styles.countText}>
              {pandalsCount} {pandalsCount === 1 ? 'pandal' : 'pandals'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    alignSelf: 'center',
    shadowColor: '#2D1A16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 220, 201, 0.8)',
    gap: 6,
  },
  iconWrap: {
    marginRight: 2,
  },
  distText: {
    color: '#831917',
    fontWeight: '800',
    fontSize: 12.5,
  },
  dotText: {
    color: '#CAA774',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    color: '#381E18',
    fontWeight: '600',
    fontSize: 12,
  },
  countText: {
    color: '#381E18',
    fontWeight: '700',
    fontSize: 12,
  },
});
