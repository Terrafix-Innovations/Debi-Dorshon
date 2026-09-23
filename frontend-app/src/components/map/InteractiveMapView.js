import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';

/**
 * InteractiveMapView: Interactive Leaflet map rendered inside a WebView.
 * Uses OpenStreetMap standard tiles (100% free, no API key required, zero watermarks).
 * Supports smooth touch gestures (pan, pinch-to-zoom, tap) and dynamic real-time updates.
 */
const InteractiveMapView = forwardRef(function InteractiveMapView(
  {
    origin,
    destination,
    routePath = [],
    itinerary = [],
    pandals = [],
    metroStations = [],
    trainStations = [],
    selectedPlace = null,
    onSelectPlace,
    userCoords = null,
    activeFilter = 'all',
  },
  ref
) {
  const webRef = useRef(null);

  // Normalize path coordinates for polyline
  const pathCoords = useMemo(() => {
    if (routePath && routePath.length > 0) {
      return routePath
        .map((p) => ({
          latitude: p.latitude ?? p.lat,
          longitude: p.longitude ?? p.lng,
        }))
        .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude));
    }
    const fallback = [];
    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      fallback.push({ latitude: origin.latitude, longitude: origin.longitude });
    }
    if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') {
      fallback.push({ latitude: destination.latitude, longitude: destination.longitude });
    }
    return fallback;
  }, [routePath, origin, destination]);

  // Filter markers based on activeFilter
  const showPandals = activeFilter === 'all' || activeFilter === 'pandals';
  const showMetro = activeFilter === 'all' || activeFilter === 'metro';
  const showTrain = activeFilter === 'all' || activeFilter === 'train';

  // Helper to escape strings safely for JS/HTML insertion
  const escapeText = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  // Collect all markers for the Leaflet map
  const allMarkers = useMemo(() => {
    const markers = [];

    // Origin
    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      markers.push({
        lat: origin.latitude,
        lng: origin.longitude,
        type: 'origin',
        label: 'A',
        name: escapeText(origin.name || 'Origin'),
        area: escapeText(origin.area || ''),
      });
    }

    // Destination
    if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') {
      markers.push({
        lat: destination.latitude,
        lng: destination.longitude,
        type: 'destination',
        label: 'B',
        name: escapeText(destination.name || 'Destination'),
        area: escapeText(destination.area || ''),
      });
    }

    // Itinerary pandals (when route is calculated)
    if (showPandals && itinerary.length > 0) {
      itinerary.forEach((item, idx) => {
        const p = item.pandal || item;
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: String(item.step || idx + 1),
          name: escapeText(p.name || `Pandal ${idx + 1}`),
          area: escapeText(p.cluster || p.area || p.region || ''),
          raw: p,
        });
      });
    }

    // General pandals (only if no active itinerary)
    if (showPandals && itinerary.length === 0) {
      pandals.forEach((p, idx) => {
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: '',
          name: escapeText(p.name || `Pandal ${idx + 1}`),
          area: escapeText(p.cluster || p.area || p.region || ''),
          raw: p,
        });
      });
    }

    // Metro stations
    if (showMetro) {
      metroStations.forEach((m) => {
        const lat = m.lat ?? m.latitude ?? m.location?.latitude;
        const lng = m.lng ?? m.longitude ?? m.location?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
        markers.push({
          lat,
          lng,
          type: 'metro',
          label: 'M',
          name: escapeText(m.name || 'Metro Station'),
          area: escapeText(m.line ? `${m.line} Line` : 'Metro'),
          raw: m,
        });
      });
    }

    // Train stations
    if (showTrain) {
      trainStations.forEach((t) => {
        const lat = t.lat ?? t.latitude ?? t.location?.latitude;
        const lng = t.lng ?? t.longitude ?? t.location?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
        markers.push({
          lat,
          lng,
          type: 'train',
          label: 'T',
          name: escapeText(t.name || 'Train Station'),
          area: escapeText(t.zone || 'Railway'),
          raw: t,
        });
      });
    }

    return markers;
  }, [origin, destination, itinerary, pandals, metroStations, trainStations, showPandals, showMetro, showTrain]);

  // Build route path for Leaflet polyline
  const leafletPath = useMemo(() => {
    return pathCoords.map((p) => [p.latitude, p.longitude]);
  }, [pathCoords]);

  // Calculate center and zoom
  const mapCenter = useMemo(() => {
    const pts = [...pathCoords];
    if (userCoords && typeof userCoords.latitude === 'number' && typeof userCoords.longitude === 'number') {
      pts.push(userCoords);
    }
    allMarkers.forEach((m) => pts.push({ latitude: m.lat, longitude: m.lng }));

    if (pts.length === 0) return { lat: 22.5726, lng: 88.3639, zoom: 13 };

    let minLat = pts[0].latitude, maxLat = pts[0].latitude;
    let minLng = pts[0].longitude, maxLng = pts[0].longitude;
    pts.forEach((p) => {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLng = Math.min(minLng, p.longitude);
      maxLng = Math.max(maxLng, p.longitude);
    });

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const maxSpan = Math.max(latSpan, lngSpan);

    let zoom = 13;
    if (maxSpan > 0.3) zoom = 11;
    else if (maxSpan > 0.15) zoom = 12;
    else if (maxSpan > 0.05) zoom = 13;
    else if (maxSpan > 0.02) zoom = 14;
    else zoom = 15;

    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
      zoom,
    };
  }, [pathCoords, userCoords, allMarkers]);

  // Marker styling palette
  const markerStyles = useMemo(() => ({
    origin: { bg: '#1E7E34', color: '#ffffff', border: '#ffffff' },
    destination: { bg: '#A31E22', color: '#ffffff', border: '#ffffff' },
    pandal: { bg: '#8B1A1A', color: '#F4C430', border: '#F4C430' },
    metro: { bg: '#2E7D32', color: '#ffffff', border: '#A5D6A7' },
    train: { bg: '#1565C0', color: '#ffffff', border: '#90CAF9' },
  }), []);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`
          if (window._map && window._map.flyTo) {
            window._map.flyTo([${region.latitude}, ${region.longitude}], 15, { duration: 0.6 });
          }
          true;
        `);
      }
    },
    fitToCoordinates: (coords) => {
      if (webRef.current && coords && coords.length > 0) {
        const bounds = JSON.stringify(coords.map((c) => [c.latitude ?? c.lat, c.longitude ?? c.lng]));
        webRef.current.injectJavaScript(`
          if (window._map && window._map.fitBounds) {
            window._map.fitBounds(${bounds}, { padding: [60, 60], maxZoom: 16 });
          }
          true;
        `);
      }
    },
    zoomIn: () => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`if (window._map) window._map.zoomIn(); true;`);
      }
    },
    zoomOut: () => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`if (window._map) window._map.zoomOut(); true;`);
      }
    },
  }));

  // Handle messages from Leaflet webview
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click' && onSelectPlace) {
        onSelectPlace(data.place?.raw || data.place);
      }
    } catch (e) {}
  }, [onSelectPlace]);

  // Build the complete Leaflet HTML with embedded data
  const leafletHtml = useMemo(() => {
    const pathJson = JSON.stringify(leafletPath);
    const markersJson = JSON.stringify(allMarkers);
    const stylesJson = JSON.stringify(markerStyles);
    const userJson = userCoords ? JSON.stringify([userCoords.latitude, userCoords.longitude]) : 'null';

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
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #FAF2E4;
          }
          #map {
            width: 100%;
            height: 100%;
            background: #FAF2E4;
            touch-action: pan-x pan-y pinch-zoom;
          }
          .map-pin {
            font-weight: 900;
            font-size: 11px;
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
            user-select: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map with touch gestures enabled
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            tap: true,
            tapTolerance: 15,
            doubleClickZoom: true,
            scrollWheelZoom: true,
          }).setView([${mapCenter.lat}, ${mapCenter.lng}], ${mapCenter.zoom});
          window._map = map;

          // Free OpenStreetMap Standard Tiles (No API key needed, zero watermark)
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // Force invalidateSize so Leaflet immediately measures container dimensions
          setTimeout(function() { map.invalidateSize(); }, 100);
          setTimeout(function() { map.invalidateSize(); }, 350);
          setTimeout(function() { map.invalidateSize(); }, 700);

          // Layer groups
          var routeLayer = L.featureGroup().addTo(map);
          var markersLayer = L.featureGroup().addTo(map);
          var userLayer = L.featureGroup().addTo(map);

          // Global update function
          window.updateMapData = function(pathPoints, markers, styles, userCoords) {
            // 1. Update polyline
            routeLayer.clearLayers();
            if (pathPoints && pathPoints.length > 1) {
              L.polyline(pathPoints, { color: '#5C0F0F', weight: 7, opacity: 0.85 }).addTo(routeLayer);
              L.polyline(pathPoints, { color: '#8B1A1A', weight: 4, opacity: 1.0 }).addTo(routeLayer);
            }

            // 2. Update markers
            markersLayer.clearLayers();
            if (markers && markers.length > 0) {
              markers.forEach(function(m) {
                var s = styles[m.type] || styles.pandal;
                var html = '<div class="map-pin" style="background:' + s.bg + ';color:' + s.color + ';border-color:' + s.border + ';">' + (m.label || '⚘') + '</div>';
                var icon = L.divIcon({ className: '', html: html, iconSize: [28, 28], iconAnchor: [14, 14] });
                var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(markersLayer);
                
                var popupContent = '<b>' + m.name + '</b>' + (m.area ? '<br/><span style="font-size:11px;color:#666;">' + m.area + '</span>' : '');
                marker.bindPopup(popupContent);

                marker.on('click', function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', place: m }));
                  }
                });
              });
            }

            // 3. Update user location
            userLayer.clearLayers();
            if (userCoords && userCoords.length === 2) {
              var userIcon = L.divIcon({
                className: '',
                html: '<div style="width:14px;height:14px;border-radius:7px;background:#4285F4;border:3px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.6);"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });
              L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(userLayer)
                .bindPopup('<b>Your Location</b>');
            }

            // 4. Auto-fit bounds
            if (pathPoints && pathPoints.length > 1) {
              map.fitBounds(pathPoints, { padding: [60, 60], maxZoom: 16 });
            } else if (markers && markers.length > 1) {
              var pts = [];
              markers.forEach(function(m) { pts.push([m.lat, m.lng]); });
              map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 });
            }
          };

          // Render immediately on load
          window.updateMapData(${pathJson}, ${markersJson}, ${stylesJson}, ${userJson});
        </script>
      </body>
      </html>
    `;
  }, [mapCenter, leafletPath, allMarkers, markerStyles, userCoords]);

  // On Web, use iframe
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={leafletHtml}
          width="100%"
          height="100%"
          style={{ border: 0, width: '100%', height: '100%' }}
          title="Interactive Debi-Dorshon Route Map"
        />
      </View>
    );
  }

  // On Mobile (Android / iOS), use WebView with touch responder capture
  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    >
      <WebView
        ref={webRef}
        key={`map_route_${routePath?.length > 0 ? 'active' : 'idle'}_${activeFilter}`}
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
        onMessage={handleMessage}
        onLoadEnd={() => {
          if (webRef.current) {
            webRef.current.injectJavaScript(`
              if (window._map) {
                window._map.invalidateSize();
                ${leafletPath.length > 1 ? `window._map.fitBounds(${JSON.stringify(leafletPath)}, { padding: [60, 60], maxZoom: 16 });` : ''}
              }
              true;
            `);
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF2E4',
    zIndex: 1,
  },
  webView: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF2E4',
  },
});

export default InteractiveMapView;
