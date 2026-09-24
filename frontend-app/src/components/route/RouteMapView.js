import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import InteractiveMapView from '../map/InteractiveMapView';

export default function RouteMapView({ source, destination, checkpoints = [], path = [] }) {
  const itinerary = checkpoints.map((cp, idx) => ({
    step: idx + 1,
    pandal: cp,
    detour_distance_km: 0
  }));

  return (
    <View style={styles.wrap}>
      <InteractiveMapView
        origin={source}
        destination={destination}
        routePath={path}
        itinerary={itinerary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
});
