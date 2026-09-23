import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function StationPandalCard({ pandal }) {
  if (!pandal) return null;

  const lat = pandal.location?.latitude || pandal.lat;
  const lng = pandal.location?.longitude || pandal.lng;
  const region = pandal.region || pandal.zone;
  const cluster = pandal.cluster || pandal.area;
  const metro = pandal.nearest_metro || (pandal.line ? { name: pandal.nearest_station, line: pandal.line } : null);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameWrap}>
          <Text style={styles.pandalName}>{pandal.name}</Text>
          {pandal.nameBn ? <Text style={styles.pandalNameBn}>{pandal.nameBn}</Text> : null}
        </View>

        {region ? (
          <View style={styles.regionBadge}>
            <Text style={styles.regionText}>{region}</Text>
          </View>
        ) : null}
      </View>

      {/* Cluster / Area Info */}
      {cluster ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={15} color={colors.primaryMaroon} />
          <Text style={styles.clusterText}>Cluster: <Text style={styles.boldVal}>{cluster}</Text></Text>
        </View>
      ) : null}

      {/* Nearest Metro or Train Station */}
      {metro && metro.name ? (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="subway-variant" size={15} color="#2E7D32" />
          <Text style={styles.metroText}>
            Nearest Metro: <Text style={styles.boldVal}>{metro.name}</Text> {metro.line ? `(${metro.line} Line)` : ''}
          </Text>
        </View>
      ) : null}

      {/* Coordinates Footer */}
      {lat && lng ? (
        <View style={styles.footerRow}>
          <View style={styles.coordsBadge}>
            <Ionicons name="map-outline" size={13} color={`${colors.espresso}AA`} />
            <Text style={styles.coordsText}>
              {typeof lat === 'number' ? lat.toFixed(4) : lat}° N, {typeof lng === 'number' ? lng.toFixed(4) : lng}° E
            </Text>
          </View>
          {pandal.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={colors.goldHighlight} />
              <Text style={styles.ratingText}>{pandal.rating}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  nameWrap: { flex: 1 },
  pandalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.espresso,
  },
  pandalNameBn: {
    fontSize: 12,
    color: `${colors.espresso}99`,
    marginTop: 2,
  },
  regionBadge: {
    backgroundColor: `${colors.primaryMaroon}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.primaryMaroon}30`,
  },
  regionText: {
    color: colors.primaryMaroon,
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  clusterText: {
    fontSize: 12,
    color: `${colors.espresso}CC`,
  },
  metroText: {
    fontSize: 12,
    color: `${colors.espresso}CC`,
  },
  boldVal: {
    fontWeight: '700',
    color: colors.espresso,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${colors.goldMuted}40`,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    color: `${colors.espresso}88`,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.espresso,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ratingText: {
    color: colors.goldHighlight,
    fontSize: 11,
    fontWeight: '800',
  },
});

