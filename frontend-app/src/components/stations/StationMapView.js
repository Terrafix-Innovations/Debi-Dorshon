import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import InteractiveMapView from '../map/InteractiveMapView';

function extractCoords(obj) {
  if (!obj) return null;
  const lat = obj.location?.latitude ?? obj.lat ?? obj.latitude ?? obj.location?.lat;
  const lng = obj.location?.longitude ?? obj.lng ?? obj.longitude ?? obj.location?.lng;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export default function StationMapView({
  stationName,
  stationObj,
  pandals = [],
  mode = 'metro',
}) {
  const isMetro = mode === 'metro';
  const stationPinColor = isMetro ? '#2E7D32' : '#1565C0';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.mapHeaderBanner}>
        <View style={styles.bannerLeft}>
          <Ionicons name="map-outline" size={18} color={colors.goldHighlight} />
          <Text style={styles.bannerTitle}>
            {stationName ? `${stationName} Location Map` : 'Transit Map'}
          </Text>
        </View>
        <View style={styles.pinCountChip}>
          <Ionicons name="location" size={12} color={colors.white} />
          <Text style={styles.pinCountText}>{pandals?.length || 0} Pandal Pins</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <InteractiveMapView
          origin={stationObj}
          pandals={pandals}
          activeFilter={isMetro ? 'metro' : 'train'}
        />
      </View>

      <View style={styles.mapLegendFooter}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: stationPinColor }]} />
          <Text style={styles.legendText}>{isMetro ? 'Metro Station' : 'Train Station'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryMaroon }]} />
          <Text style={styles.legendText}>Pandals ({pandals?.length || 0})</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.espresso,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.espresso,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bannerTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  pinCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMaroon,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pinCountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  mapWrap: {
    height: 260,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.cream,
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cream,
  },
  mapLegendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: `${colors.white}10`,
    borderTopWidth: 1,
    borderTopColor: `${colors.white}15`,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
