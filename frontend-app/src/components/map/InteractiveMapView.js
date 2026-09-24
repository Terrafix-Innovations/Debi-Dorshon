import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config/env';

/**
 * InteractiveMapView: Interactive Mapbox map rendered inside a WebView.
 * Fetches token from backend and mirrors web UI behavior.
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
    onMapClick,
    onUpdateOrigin,
    onUpdateDestination,
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

  // Collect all markers for the Mapbox map.
  // Popup content mirrors the web UI (frontend-web/src/components/MapBackground.jsx):
  //   - Origin/Destination -> "Start" / "End" badge + name
  //   - Pandal (routed)     -> "Stop #N • +X.XX km" badge + name + region/cluster + metro
  const allMarkers = useMemo(() => {
    const markers = [];

    // Origin (Start pin, matches web 'S')
    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      markers.push({
        lat: origin.latitude,
        lng: origin.longitude,
        type: 'origin',
        label: 'S',
        badge: 'Start',
        name: escapeText(origin.name || origin.title || 'Start Point'),
        sub: escapeText(origin.area || ''),
      });
    }

    // Destination (End pin, matches web 'E')
    if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') {
      markers.push({
        lat: destination.latitude,
        lng: destination.longitude,
        type: 'destination',
        label: 'E',
        badge: 'End',
        name: escapeText(destination.name || destination.title || 'End Point'),
        sub: escapeText(destination.area || ''),
      });
    }

    // Itinerary pandals (when a route is calculated) — full web-style popup
    if (showPandals && itinerary.length > 0) {
      itinerary.forEach((item, idx) => {
        const p = item.pandal || item;
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
        const step = item.step ?? idx + 1;
        const detour = typeof item.detour_distance_km === 'number' ? item.detour_distance_km : null;
        const region = p.region || 'Kolkata';
        const cluster = p.cluster || '';
        const sub = cluster ? `${region} \u2022 ${cluster}` : region;
        const metroName = p.nearest_metro?.name || '';
        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: String(step),
          step,
          badge: detour != null ? `Stop #${step} \u2022 +${detour.toFixed(2)} km` : `Stop #${step}`,
          name: escapeText(p.name || `Pandal ${idx + 1}`),
          sub: escapeText(sub),
          metro: escapeText(metroName),
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
        const region = p.region || 'Kolkata';
        const cluster = p.cluster || '';
        const sub = cluster ? `${region} \u2022 ${cluster}` : region;
        const metroName = p.nearest_metro?.name || '';
        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: '',
          badge: 'Pandal',
          name: escapeText(p.name || `Pandal ${idx + 1}`),
          sub: escapeText(sub),
          metro: escapeText(metroName),
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
          badge: 'Metro Station',
          name: escapeText(m.name || 'Metro Station'),
          sub: escapeText(m.line ? `${m.line} Line` : 'Metro'),
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
          badge: 'Train Station',
          name: escapeText(t.name || 'Train Station'),
          sub: escapeText(t.zone || 'Railway'),
          raw: t,
        });
      });
    }

    return markers;
  }, [origin, destination, itinerary, pandals, metroStations, trainStations, showPandals, showMetro, showTrain]);

  // Build route path for Mapbox polyline
  const mapPath = useMemo(() => {
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
          if (window._map) {
            window._map.flyTo({ center: [${region.longitude}, ${region.latitude}], zoom: 15.5, duration: 800 });
          }
          true;
        `);
      }
    },
    fitToCoordinates: (coords) => {
      if (webRef.current && coords && coords.length > 0) {
        const rawCoords = coords.map((c) => [c.longitude ?? c.lng, c.latitude ?? c.lat]);
        webRef.current.injectJavaScript(`
          if (window._map && window.mapboxgl) {
            const pts = ${JSON.stringify(rawCoords)};
            const bounds = pts.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(pts[0], pts[0]));
            window._map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
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
    highlightStep: (step) => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`if (window.highlightStep) window.highlightStep(${step == null ? 'null' : step}); true;`);
      }
    },
  }));

  // Mirror the web "active pandal focus": when the selected place changes,
  // highlight the matching pin and fly to it inside the WebView.
  useEffect(() => {
    if (!webRef.current) return;
    let step = null;
    if (selectedPlace) {
      if (typeof selectedPlace.step !== 'undefined') {
        step = selectedPlace.step;
      } else {
        const selId = selectedPlace.id || selectedPlace._id;
        const match = itinerary.find((item) => {
          const p = item.pandal || item;
          return (p.id || p._id) && (p.id || p._id) === selId;
        });
        if (match) step = match.step;
      }
    }
    webRef.current.injectJavaScript(`if (window.highlightStep) window.highlightStep(${step == null ? 'null' : step}); true;`);
  }, [selectedPlace, itinerary]);

  // Handle messages from Mapbox webview
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click' && onSelectPlace) {
        onSelectPlace(data.place?.raw || data.place);
      } else if (data.type === 'map_click') {
        // Handle map click to add locations
        if (onMapClick) {
          onMapClick(data.lat, data.lng);
        }
      } else if (data.type === 'marker_drag') {
        if (data.markerType === 'origin' && onUpdateOrigin) {
          onUpdateOrigin(data.lat, data.lng);
        } else if (data.markerType === 'destination' && onUpdateDestination) {
          onUpdateDestination(data.lat, data.lng);
        }
      }
    } catch (e) {}
  }, [onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination]);

  // Build the complete Mapbox HTML with embedded data
  const mapboxHtml = useMemo(() => {
    const pathJson = JSON.stringify(pathCoords.map(p => [p.longitude, p.latitude]));
    const markersJson = JSON.stringify(allMarkers);
    const userJson = userCoords ? JSON.stringify([userCoords.longitude, userCoords.latitude]) : 'null';
    const cleanBase = (API_BASE_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet">
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #FAF2E4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #map {
            width: 100%;
            height: 100%;
            background: #FAF2E4;
          }
          
          /* Custom Pins matching Web UI (frontend-web/src/index.css) */
          .custom-pin-wrapper { cursor: pointer; }

          .pin-s {
            width: 34px; height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: #ecfdf5; color: #065f46;
            border: 2px solid #059669;
            box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3), 0 2px 4px rgba(0,0,0,0.12);
            font-size: 12px; font-weight: 600;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .pin-s > span { transform: rotate(45deg); }

          .pin-e {
            width: 34px; height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: #fff1f2; color: #9f1239;
            border: 2px solid #e11d48;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.3), 0 2px 4px rgba(0,0,0,0.12);
            font-size: 12px; font-weight: 600;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .pin-e > span { transform: rotate(45deg); }

          .pin-pandal {
            width: 30px; height: 30px;
            border-radius: 50%;
            background: #b45309; color: #ffffff;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(180, 83, 9, 0.4), 0 2px 6px rgba(0,0,0,0.18);
            font-size: 12px; font-weight: 600;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .pin-pandal.active-pin {
            background: #903f00;
            transform: scale(1.28);
            box-shadow: 0 0 0 6px rgba(144, 63, 0, 0.22), 0 6px 16px rgba(0,0,0,0.28);
            z-index: 1000 !important;
          }

          /* Hover / press feedback (matches web) */
          .pin-s:active, .pin-e:active { transform: scale(1.12) rotate(-45deg); }
          .pin-pandal:active { transform: scale(1.16); }
          @media (hover: hover) {
            .pin-s:hover, .pin-e:hover { transform: scale(1.12) rotate(-45deg); }
            .pin-pandal:hover { transform: scale(1.16); }
          }

          /* Mapbox Popup Styling (matches web) */
          .mapboxgl-popup-content {
            background: #ffffff !important;
            color: #1b1c1a !important;
            border-radius: 14px !important;
            border: 1px solid #ddc1b3 !important;
            box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.1) !important;
            padding: 12px 14px !important;
            overflow: hidden !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: #ffffff !important;
            border-bottom-color: #ffffff !important;
          }

          .popup { min-width: 150px; }
          .popup-badge {
            font-size: 10px; color: #78716c; text-transform: uppercase;
            letter-spacing: 0.05em; font-weight: 700; margin-bottom: 3px;
          }
          .popup-title { font-size: 14px; color: #1c1917; font-weight: 700; margin-bottom: 2px; }
          .popup-sub { font-size: 12px; color: #78716c; font-weight: 400; }
          .popup-metro { font-size: 12px; color: #4338ca; font-weight: 500; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const KOLKATA_CENTER = [88.3639, 22.5726];
          let map;
          let isDragging = false;
          let pandalMarkers = [];

          async function init() {
            let token = null;
            try {
              const res = await fetch('${cleanBase}/api/v1/route/config');
              if (res.ok) {
                const cfg = await res.json();
                if (cfg.mapbox_configured && cfg.mapbox_token) {
                  token = cfg.mapbox_token;
                }
              }
            } catch (err) {}

            if (token) mapboxgl.accessToken = token;

            const mapStyle = token
              ? 'mapbox://styles/mapbox/streets-v12'
              : {
                  version: 8,
                  sources: {
                    'voyager-tiles': {
                      type: 'raster',
                      tiles: [
                        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                      ],
                      tileSize: 256,
                      attribution: '&copy; CartoDB &copy; OpenStreetMap',
                    },
                  },
                  layers: [{ id: 'voyager-base', type: 'raster', source: 'voyager-tiles', minzoom: 0, maxzoom: 19 }],
                };

            map = new mapboxgl.Map({
              container: 'map',
              style: mapStyle,
              center: KOLKATA_CENTER,
              zoom: 12.5,
              attributionControl: false,
            });
            window._map = map;

            map.on('click', (e) => {
              if (isDragging) return;
              const target = e.originalEvent?.target;
              if (target && (target.closest('.custom-pin-wrapper') || target.closest('.mapboxgl-marker'))) return;
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click', lat: e.lngLat.lat, lng: e.lngLat.lng }));
              }
            });

            map.on('load', () => {
              updateData(${pathJson}, ${markersJson}, ${userJson});
            });
          }

          function createPinElement(type, label = '', isActive = false) {
            const el = document.createElement('div');
            el.className = 'custom-pin-wrapper';
            if (type === 'pandal') {
              el.innerHTML = '<div class="pin-pandal ' + (isActive ? 'active-pin' : '') + '">' + label + '</div>';
            } else if (type === 'origin') {
              el.innerHTML = '<div class="pin-s"><span>' + (label || 'S') + '</span></div>';
            } else if (type === 'destination') {
              el.innerHTML = '<div class="pin-e"><span>' + (label || 'E') + '</span></div>';
            } else {
              el.innerHTML = '<div class="pin-pandal">' + label + '</div>';
            }
            return el;
          }

          function updateData(pathPoints, markers, userCoords) {
            if (!map) return;

            // Route Path — layered corridor matching the web UI (glow + casing + core)
            if (map.getSource('route')) {
              map.getSource('route').setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: pathPoints }
              });
            } else if (pathPoints && pathPoints.length > 0) {
              map.addSource('route', {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: pathPoints } }
              });
              map.addLayer({
                id: 'route-glow', type: 'line', source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#fed7aa', 'line-width': 10, 'line-opacity': 0.7 }
              });
              map.addLayer({
                id: 'route-casing', type: 'line', source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#903f00', 'line-width': 4.5, 'line-opacity': 0.95 }
              });
              map.addLayer({
                id: 'route-core', type: 'line', source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#ffedd5', 'line-width': 1.5 }
              });
            }

            // Markers
            pandalMarkers.forEach(m => m.remove());
            pandalMarkers = [];

            const bounds = new mapboxgl.LngLatBounds();

            markers.forEach(m => {
              const el = createPinElement(m.type, m.label);
              const badge = m.badge || m.type;
              const popupHtml = '<div class="popup">' +
                '<div class="popup-badge">' + badge + '</div>' +
                '<div class="popup-title">' + m.name + '</div>' +
                (m.sub ? '<div class="popup-sub">' + m.sub + '</div>' : '') +
                (m.metro ? '<div class="popup-metro">\uD83D\uDE87 ' + m.metro + '</div>' : '') +
                '</div>';

              const marker = new mapboxgl.Marker({ 
                element: el, 
                draggable: (m.type === 'origin' || m.type === 'destination') 
              })
                .setLngLat([m.lng, m.lat])
                .setPopup(new mapboxgl.Popup({ offset: 22, closeButton: false }).setHTML(popupHtml))
                .addTo(map);

              if (typeof m.step !== 'undefined') marker._step = m.step;

              if (m.type === 'origin' || m.type === 'destination') {
                marker.on('dragstart', () => { isDragging = true; });
                marker.on('dragend', () => {
                  const pos = marker.getLngLat();
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                      type: 'marker_drag', 
                      markerType: m.type, 
                      lat: pos.lat, 
                      lng: pos.lng 
                    }));
                  }
                  setTimeout(() => { isDragging = false; }, 200);
                });
              }

              el.addEventListener('click', () => {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', place: m }));
                }
              });

              pandalMarkers.push(marker);
              bounds.extend([m.lng, m.lat]);
            });

            if (userCoords) {
              bounds.extend(userCoords);
            }

            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 });
            }
          }

          // Highlight a pandal pin by its step number and fly to it (mirrors web active-pin focus)
          window.highlightStep = function (step) {
            pandalMarkers.forEach((mk) => {
              const inner = mk.getElement().querySelector('.pin-pandal');
              if (!inner) return;
              if (step != null && mk._step === step) {
                inner.classList.add('active-pin');
                if (map) map.flyTo({ center: mk.getLngLat(), zoom: 15.5, duration: 800 });
                if (mk.getPopup() && !mk.getPopup().isOpen()) mk.togglePopup();
              } else {
                inner.classList.remove('active-pin');
              }
            });
          };

          init();
        </script>
      </body>
      </html>
    `;
  }, [pathCoords, allMarkers, userCoords]);

  // On Web, use iframe
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={mapboxHtml}
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
        source={{ html: mapboxHtml }}
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
