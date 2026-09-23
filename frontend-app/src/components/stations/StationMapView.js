import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

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
  const stationCoords = extractCoords(stationObj);

  // Extract coordinates for valid pandals
  const validPandalItems = useMemo(() => {
    return (pandals || [])
      .map((p, idx) => ({
        pandal: p,
        coords: extractCoords(p),
        key: p._id || `pandal_marker_${idx}`,
      }))
      .filter((item) => item.coords !== null);
  }, [pandals]);

  // Derive center and zoom from all markers
  const { centerLat, centerLng, zoom } = useMemo(() => {
    const allCoords = [];
    if (stationCoords) allCoords.push(stationCoords);
    validPandalItems.forEach((item) => allCoords.push(item.coords));

    let cLat = stationCoords?.latitude || 22.5726;
    let cLng = stationCoords?.longitude || 88.3639;
    let z = 14;

    if (allCoords.length > 0) {
      let minLat = allCoords[0].latitude, maxLat = allCoords[0].latitude;
      let minLng = allCoords[0].longitude, maxLng = allCoords[0].longitude;

      allCoords.forEach((p) => {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
      });

      cLat = (minLat + maxLat) / 2;
      cLng = (minLng + maxLng) / 2;

      const maxSpan = Math.max(maxLat - minLat, maxLng - minLng);
      if (maxSpan > 0.15) z = 12;
      else if (maxSpan > 0.05) z = 13;
      else if (maxSpan > 0.02) z = 14;
      else z = 15;
    }

    return { centerLat: cLat, centerLng: cLng, zoom: z };
  }, [stationCoords, validPandalItems]);

  const stationPinColor = isMetro ? '#2E7D32' : '#1565C0';
  const stationLabel = isMetro ? 'M' : 'T';

  // Build Leaflet HTML
  const leafletHtml = useMemo(() => {
    const escapedStationName = (stationName || 'Station').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const pandalMarkers = validPandalItems.map((item, idx) => ({
      lat: item.coords.latitude,
      lng: item.coords.longitude,
      name: (item.pandal.name || 'Pandal').replace(/'/g, "\\'").replace(/"/g, '&quot;'),
      cluster: (item.pandal.cluster || item.pandal.area || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'),
      idx: idx + 1,
    }));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map {
            width: 100%;
            height: 100%;
            background: #FAF2E4;
            touch-action: pan-x pan-y pinch-zoom;
          }
          .pin {
            font-weight: 900;
            font-size: 12px;
            width: 28px;
            height: 28px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            text-align: center;
            line-height: 28px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            tap: true,
            tapTolerance: 15,
            doubleClickZoom: true,
            scrollWheelZoom: true,
          }).setView([${centerLat}, ${centerLng}], ${zoom});

          // Free OpenStreetMap Standard Tiles (No API key needed, zero watermark)
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // Station marker
          ${stationCoords ? `
            var stationIcon = L.divIcon({
              className: '',
              html: '<div class="pin" style="background:${stationPinColor};color:#fff;border-color:#fff;">${stationLabel}</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            L.marker([${stationCoords.latitude}, ${stationCoords.longitude}], { icon: stationIcon })
              .addTo(map)
              .bindPopup('<b>${escapedStationName} (${isMetro ? 'Metro' : 'Railway'})</b>');
          ` : ''}

          // Pandal markers
          var pandals = ${JSON.stringify(pandalMarkers)};
          pandals.forEach(function(p) {
            var pIcon = L.divIcon({
              className: '',
              html: '<div class="pin" style="background:#8B1A1A;color:#F4C430;border-color:#F4C430;">' + p.idx + '</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            L.marker([p.lat, p.lng], { icon: pIcon }).addTo(map)
              .bindPopup('<b>#' + p.idx + ' ' + p.name + '</b>' + (p.cluster ? '<br/><span style="font-size:11px;color:#666;">' + p.cluster + '</span>' : ''));
          });

          // Fit bounds to all markers
          var allPts = [];
          ${stationCoords ? `allPts.push([${stationCoords.latitude}, ${stationCoords.longitude}]);` : ''}
          pandals.forEach(function(p) { allPts.push([p.lat, p.lng]); });
          if (allPts.length > 1) {
            map.fitBounds(allPts, { padding: [35, 35], maxZoom: 16 });
          }
        </script>
      </body>
      </html>
    `;
  }, [centerLat, centerLng, zoom, stationCoords, stationPinColor, stationLabel, stationName, isMetro, validPandalItems]);

  // Web: use iframe
  if (Platform.OS === 'web') {
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
            <Text style={styles.pinCountText}>{validPandalItems.length} Pandal Pins</Text>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <iframe
            srcDoc={leafletHtml}
            width="100%"
            height="260"
            style={{ border: 0, width: '100%', height: '100%' }}
            loading="lazy"
            title="Station Map"
          />
        </View>

        <View style={styles.mapLegendFooter}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: stationPinColor }]} />
            <Text style={styles.legendText}>{isMetro ? 'Metro Station' : 'Train Station'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primaryMaroon }]} />
            <Text style={styles.legendText}>Pandals ({validPandalItems.length})</Text>
          </View>
        </View>
      </View>
    );
  }

  // Mobile: use WebView with Leaflet & gesture responder protection against parent ScrollView
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
          <Text style={styles.pinCountText}>{validPandalItems.length} Pandal Pins</Text>
        </View>
      </View>

      <View
        style={styles.mapWrap}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      >
        <WebView
          source={{ html: leafletHtml }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          nestedScrollEnabled={true}
        />
      </View>

      <View style={styles.mapLegendFooter}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: stationPinColor }]} />
          <Text style={styles.legendText}>{isMetro ? 'Metro Station' : 'Train Station'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryMaroon }]} />
          <Text style={styles.legendText}>Pandals ({validPandalItems.length})</Text>
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
