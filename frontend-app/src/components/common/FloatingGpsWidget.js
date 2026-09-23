import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DUMMY_USER_LOCATION, MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

export default function FloatingGpsWidget() {
  const [expanded, setExpanded] = useState(false);
  const userLocation = DUMMY_USER_LOCATION;
  const pandalCount = MOCK_PANDALS.length;

  if (!expanded) {
    return (
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <Pressable
          style={styles.roundButton}
          onPress={() => setExpanded(true)}
          accessibilityLabel="Current GPS Location"
        >
          <Ionicons name="navigate-circle" size={26} color={colors.goldHighlight} />
          <View style={styles.pulseDot} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.expandedCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="location" size={18} color={colors.goldHighlight} />
            <Text style={styles.cardTitle}>Live GPS Location</Text>
          </View>
          <Pressable onPress={() => setExpanded(false)} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.locationAddress}>{userLocation.address}</Text>
        <Text style={styles.locationCoords}>
          {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
        </Text>

        <View style={styles.pandalBadge}>
          <Ionicons name="flower-outline" size={14} color={colors.espresso} />
          <Text style={styles.pandalBadgeText}>
            <Text style={{ fontWeight: '800' }}>{pandalCount}</Text> Pandals Near You
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 48,
    left: 12,
    zIndex: 9999,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.espresso,
    borderWidth: 1.5,
    borderColor: colors.goldHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: colors.espresso,
  },
  expandedCard: {
    width: 270,
    backgroundColor: colors.espresso,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.goldHighlight,
    padding: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  closeBtn: {
    padding: 2,
  },
  locationAddress: {
    color: colors.goldHighlight,
    fontSize: 13,
    fontWeight: '700',
  },
  locationCoords: {
    color: `${colors.white}BB`,
    fontSize: 11,
    marginTop: 2,
  },
  pandalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardCream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pandalBadgeText: {
    color: colors.espresso,
    fontSize: 11,
    fontWeight: '600',
  },
});

