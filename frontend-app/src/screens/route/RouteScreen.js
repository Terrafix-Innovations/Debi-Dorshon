import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { fetchPandals } from '../../services/pandalService';
import { fetchMapConfig } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

import InteractiveMapView from '../../components/map/InteractiveMapView';

export default function RouteScreen({ navigation }) {
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch every pandal from the backend DB.
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchPandals({ limit: 500 });
        if (mounted) {
          setPandals(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('[RouteScreen] Failed to load pandals:', err?.message);
        if (mounted) setPandals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Only keep pandals that have valid coordinates.
  const mappablePandals = useMemo(
    () =>
      pandals.filter((p) => {
        const lat = p.lat ?? p.location?.latitude;
        const lng = p.lng ?? p.location?.longitude;
        return typeof lat === 'number' && typeof lng === 'number';
      }),
    [pandals]
  );

  const renderBanner = () => (
    <View style={styles.zoomNotice}>
      <MaterialCommunityIcons name="map-marker-multiple" size={18} color={colors.goldHighlight} />
      <Text style={styles.zoomNoticeText}>
        {loading
          ? 'Loading pandals from the database...'
          : `Showing ${mappablePandals.length} pandals across Kolkata`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Navigation Map" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <View style={styles.container}>
          {renderBanner()}

          <View style={styles.mapWrap}>
            <InteractiveMapView
              pandals={mappablePandals}
              onSelectPlace={(place) => {
                // Handle place selection if needed
              }}
            />

            {loading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primaryMaroon} />
                <Text style={styles.mapLoadingText}>Fetching pandal locations...</Text>
              </View>
            )}
          </View>
        </View>
      </ScreenBackground>
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
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 247, 242, 0.55)',
    gap: 8,
  },
  mapLoadingText: { fontSize: 13, fontWeight: '700', color: colors.primaryMaroon },
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
