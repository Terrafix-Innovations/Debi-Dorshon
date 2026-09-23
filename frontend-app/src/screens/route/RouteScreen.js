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
import { fetchPandals } from '../../services/pandalService';
import { fetchMapConfig } from '../../services/routeService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Conditionally require react-native-maps if available on native, or render Mapbox web map
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    MapView = null;
  }
}

const KOLKATA_CENTER = { latitude: 22.5726, longitude: 88.3639 };

export default function RouteScreen({ navigation }) {
  const initialRegion = {
    latitude: KOLKATA_CENTER.latitude,
    longitude: KOLKATA_CENTER.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };

  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapConfig, setMapConfig] = useState(null);

  // Fetch every pandal from the backend DB (and map config for web Mapbox rendering).
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // limit=500 is the backend maximum, enough to return all pandals.
        const [data, config] = await Promise.all([
          fetchPandals({ limit: 500 }),
          Platform.OS === 'web' ? fetchMapConfig() : Promise.resolve(null),
        ]);
        if (mounted) {
          setPandals(Array.isArray(data) ? data : []);
          setMapConfig(config);
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

  // GeoJSON FeatureCollection of all pandal points for the Mapbox web map.
  const pandalGeoJson = useMemo(() => {
    const features = mappablePandals.map((p) => {
      const lat = p.lat ?? p.location?.latitude;
      const lng = p.lng ?? p.location?.longitude;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          name: (p.name || 'Pandal').replace(/"/g, '\\"'),
          region: (p.region || p.area || '').replace(/"/g, '\\"'),
          cluster: (p.cluster || '').replace(/"/g, '\\"'),
        },
      };
    });
    return { type: 'FeatureCollection', features };
  }, [mappablePandals]);

  // Full HTML document that renders a Mapbox GL JS map with all pandal pins.
  const mapboxHtml = useMemo(() => {
    const token = mapConfig?.mapbox_token || '';
    const isMapbox = Boolean(mapConfig?.mapbox_configured && token);
    const center = mapConfig?.default_center || [
      KOLKATA_CENTER.longitude,
      KOLKATA_CENTER.latitude,
    ];
    const zoom = mapConfig?.default_zoom || 11.5;
    const geojson = JSON.stringify(pandalGeoJson);

    // Style: real Mapbox streets when a token is configured, otherwise a
    // free CartoDB Voyager raster fallback so the map still renders.
    const styleSpec = isMapbox
      ? `'mapbox://styles/mapbox/streets-v12'`
      : `{
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap © CARTO'
            }
          },
          layers: [{ id: 'carto', type: 'raster', source: 'raster-tiles' }]
        }`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet" />
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #faf7f2; }
          .mapboxgl-popup-content {
            font-family: -apple-system, system-ui, sans-serif;
            padding: 8px 12px; border-radius: 10px;
          }
          .popup-title { font-weight: 800; color: #8B1A1A; font-size: 13px; }
          .popup-sub { color: #5b4636; font-size: 11px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          ${isMapbox ? `mapboxgl.accessToken = '${token}';` : ''}
          var map = new mapboxgl.Map({
            container: 'map',
            style: ${styleSpec},
            center: [${center[0]}, ${center[1]}],
            zoom: ${zoom}
          });
          map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

          var pandalData = ${geojson};

          map.on('load', function () {
            map.addSource('pandals', { type: 'geojson', data: pandalData });

            // Pin circles (maroon with white border)
            map.addLayer({
              id: 'pandal-pins',
              type: 'circle',
              source: 'pandals',
              paint: {
                'circle-radius': 6,
                'circle-color': '#8B1A1A',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }
            });

            // Fit map to all pandals
            try {
              var coords = pandalData.features.map(function (f) { return f.geometry.coordinates; });
              if (coords.length > 0) {
                var b = coords.reduce(function (bounds, c) { return bounds.extend(c); },
                  new mapboxgl.LngLatBounds(coords[0], coords[0]));
                map.fitBounds(b, { padding: 50, maxZoom: 14 });
              }
            } catch (e) {}

            var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true });

            map.on('click', 'pandal-pins', function (e) {
              var f = e.features[0];
              var p = f.properties;
              var sub = [p.region, p.cluster].filter(Boolean).join(' • ');
              var html = '<div class="popup-title">' + p.name + '</div>' +
                (sub ? '<div class="popup-sub">' + sub + '</div>' : '');
              popup.setLngLat(f.geometry.coordinates).setHTML(html).addTo(map);
            });

            map.on('mouseenter', 'pandal-pins', function () { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'pandal-pins', function () { map.getCanvas().style.cursor = ''; });
          });
        </script>
      </body>
      </html>
    `;
  }, [mapConfig, pandalGeoJson]);

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

      <View style={styles.container}>
        {renderBanner()}

        {Platform.OS === 'web' ? (
          // Web: interactive Mapbox GL map with all pandal pins
          <View style={styles.mapWrap}>
            {loading ? (
              <View style={styles.mapFallback}>
                <ActivityIndicator size="large" color={colors.primaryMaroon} />
                <Text style={styles.mapFallbackSub}>Loading pandal locations...</Text>
              </View>
            ) : (
              <iframe
                srcDoc={mapboxHtml}
                width="100%"
                height="100%"
                style={{ border: 0, width: '100%', height: '100%' }}
                title="Kolkata Pandals Map"
              />
            )}
          </View>
        ) : MapView ? (
          // Native: react-native-maps with a marker per pandal
          <View style={styles.mapWrap}>
            <MapView style={styles.map} initialRegion={initialRegion}>
              {mappablePandals.map((pandal, idx) => {
                const lat = pandal.lat ?? pandal.location?.latitude;
                const lng = pandal.lng ?? pandal.location?.longitude;
                return (
                  <Marker
                    key={pandal._id || pandal.id || `pandal_${idx}`}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={pandal.name}
                    description={`${pandal.region || pandal.area || ''}${
                      pandal.cluster ? ` • ${pandal.cluster}` : ''
                    }`}
                    pinColor={colors.primaryMaroon}
                  />
                );
              })}
            </MapView>

            {loading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primaryMaroon} />
                <Text style={styles.mapLoadingText}>Fetching pandal locations...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mapFallback}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primaryMaroon} />
            ) : (
              <MaterialCommunityIcons name="map-search-outline" size={56} color={colors.primaryMaroon} />
            )}
            <Text style={styles.mapFallbackTitle}>Kolkata Pujo Pinpoints Map</Text>
            <Text style={styles.mapFallbackSub}>
              {loading
                ? 'Loading pandal locations from the database...'
                : `Displaying ${mappablePandals.length} pandals across Kolkata.`}
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
