import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import { MOCK_PANDALS } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Conditionally require react-native-maps if available, or render visual map simulation
let MapView, Marker;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  MapView = null;
}

export default function RouteScreen({ navigation }) {
  const initialRegion = {
    latitude: 22.5726,
    longitude: 88.3639,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Navigation Map" />
      <SideDrawer navigation={navigation} />

      <View style={styles.container}>
        {/* Wireframe Zoom Banner */}
        <View style={styles.zoomNotice}>
          <MaterialCommunityIcons name="magnify-plus-outline" size={18} color={colors.goldHighlight} />
          <Text style={styles.zoomNoticeText}>
            Pujo Navigation • Zoom in on the map to inspect pandal pinpoints
          </Text>
        </View>

        {/* Interactive Map View */}
        {MapView ? (
          <MapView style={styles.map} initialRegion={initialRegion}>
            {MOCK_PANDALS.map((pandal) => (
              <Marker
                key={pandal._id}
                coordinate={{
                  latitude: pandal.lat || 22.5726,
                  longitude: pandal.lng || 88.3639,
                }}
                title={pandal.name}
                description={`${pandal.nameBn || ''} • ${pandal.area || ''}`}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <MaterialCommunityIcons name="map-search-outline" size={56} color={colors.primaryMaroon} />
            <Text style={styles.mapFallbackTitle}>Kolkata Pujo Pinpoints Map</Text>
            <Text style={styles.mapFallbackSub}>
              Displaying {MOCK_PANDALS.length} major pandals across North, South & Central Kolkata.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1 },
  zoomNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMaroon,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 6,
  },
  zoomNoticeText: { color: colors.goldHighlight, fontSize: 12, fontWeight: '700' },
  map: { flex: 1 },
  mapFallback: {
    flex: 1,
    backgroundColor: colors.cardCream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mapFallbackTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryMaroon, marginTop: spacing.sm },
  mapFallbackSub: { fontSize: 13, color: colors.espresso, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
