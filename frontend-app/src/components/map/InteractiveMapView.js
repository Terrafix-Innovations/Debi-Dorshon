import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * InteractiveMapView: Interactive OpenStreetMap (Leaflet) map rendered inside a WebView.
 * Replaces Mapbox with 100% free OpenStreetMap & CartoDB Voyager tiles, zero API token limits.
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

  // Collect all markers for the Leaflet OpenStreetMap map.
  // Popup content mirrors the web UI:
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

    // Routed itinerary pandals (numbered stops)
    if (showPandals && itinerary && itinerary.length > 0) {
      itinerary.forEach((item) => {
        const p = item.pandal || item;
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

        const detour = typeof item.detour_distance_km === 'number' ? ` • +${item.detour_distance_km.toFixed(2)} km` : '';
        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: String(item.step || markers.length + 1),
          badge: `Stop #${item.step || markers.length + 1}${detour}`,
          name: escapeText(p.name || 'Pandal'),
          sub: escapeText(p.cluster || p.zone || p.region || 'Kolkata'),
          metro: escapeText(p.nearest_metro?.name || ''),
          step: item.step,
          raw: p,
        });
      });
    } else if (showPandals && pandals && pandals.length > 0) {
      // General explore pandals
      pandals.forEach((p, idx) => {
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: String(idx + 1),
          badge: 'Durga Puja Pandal',
          name: escapeText(p.name || 'Pandal'),
          sub: escapeText(p.cluster || p.zone || p.region || 'Kolkata'),
          metro: escapeText(p.nearest_metro?.name || ''),
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

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`
          if (window._map) {
            window._map.flyTo([${region.latitude}, ${region.longitude}], 15.5, { duration: 0.8 });
          }
          true;
        `);
      }
    },
    fitToCoordinates: (coords) => {
      if (webRef.current && coords && coords.length > 0) {
        const rawCoords = coords.map((c) => [c.latitude ?? c.lat, c.longitude ?? c.lng]);
        webRef.current.injectJavaScript(`
          if (window._map && window.L) {
            const pts = ${JSON.stringify(rawCoords)};
            const bounds = L.latLngBounds(pts);
            window._map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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

  // Handle messages from Leaflet webview / iframe
  const handleMessageData = useCallback((rawPayload) => {
    try {
      const data = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      if (data.type === 'marker_click' && onSelectPlace) {
        onSelectPlace(data.place?.raw || data.place);
      } else if (data.type === 'map_click') {
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

  const handleMessage = useCallback((event) => {
    if (event?.nativeEvent?.data) {
      handleMessageData(event.nativeEvent.data);
    }
  }, [handleMessageData]);

  // Add web message listener for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onWebMessage = (e) => {
      if (e.data) handleMessageData(e.data);
    };
    window.addEventListener('message', onWebMessage);
    return () => window.removeEventListener('message', onWebMessage);
  }, [handleMessageData]);

  // Build the complete OpenStreetMap Leaflet HTML with embedded data
  const mapHtml = useMemo(() => {
    const pathJson = JSON.stringify(pathCoords.map((p) => [p.latitude, p.longitude]));
    const markersJson = JSON.stringify(allMarkers);
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #map {
            width: 100%;
            height: 100%;
            background: #FAF2E4;
          }
          
          /* Custom Pins matching Web UI */
          .custom-pin-wrapper { cursor: pointer; }
          .leaflet-div-icon {
            background: transparent !important;
            border: none !important;
          }

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

          /* Hover / press feedback */
          .pin-s:active, .pin-e:active { transform: scale(1.12) rotate(-45deg); }
          .pin-pandal:active { transform: scale(1.16); }

          /* Leaflet Popup Styling */
          .leaflet-popup-content-wrapper {
            background: #ffffff !important;
            color: #1b1c1a !important;
            border-radius: 14px !important;
            border: 1px solid #ddc1b3 !important;
            box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.1) !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .leaflet-popup-content {
            margin: 12px 14px !important;
            line-height: 1.4 !important;
          }
          .leaflet-popup-tip {
            background: #ffffff !important;
          }
          .leaflet-popup-close-button { display: none !important; }

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
          const KOLKATA_CENTER = [22.5726, 88.3639];
          let map;
          let isDragging = false;
          let pandalMarkers = [];
          let routeLayers = [];

          function sendToHost(obj) {
            const str = JSON.stringify(obj);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            } else if (window.parent && window.parent !== window) {
              window.parent.postMessage(str, '*');
            }
          }

          function init() {
            map = L.map('map', {
              center: KOLKATA_CENTER,
              zoom: 12.5,
              zoomControl: false,
              attributionControl: false
            });

            // Canonical OpenStreetMap raster tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              subdomains: ['a', 'b', 'c'],
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            window._map = map;

            map.on('click', (e) => {
              if (isDragging) return;
              const target = e.originalEvent?.target;
              if (target && (target.closest('.custom-pin-wrapper') || target.closest('.leaflet-marker-icon'))) return;
              sendToHost({ type: 'map_click', lat: e.latlng.lat, lng: e.latlng.lng });
            });

            updateData(${pathJson}, ${markersJson}, ${userJson});
          }

          function createPinElement(type, label = '', isActive = false) {
            if (type === 'pandal') {
              return '<div class="pin-pandal ' + (isActive ? 'active-pin' : '') + '">' + label + '</div>';
            } else if (type === 'origin') {
              return '<div class="pin-s"><span>' + (label || 'S') + '</span></div>';
            } else if (type === 'destination') {
              return '<div class="pin-e"><span>' + (label || 'E') + '</span></div>';
            } else if (type === 'metro') {
              return '<div class="pin-pandal" style="background:#2E7D32;border-color:#A5D6A7;">' + (label || 'M') + '</div>';
            } else if (type === 'train') {
              return '<div class="pin-pandal" style="background:#1565C0;border-color:#90CAF9;">' + (label || 'T') + '</div>';
            }
            return '<div class="pin-pandal">' + label + '</div>';
          }

          function updateData(pathPoints, markers, userCoords) {
            if (!map) return;

            // Route Path
            routeLayers.forEach(l => l.remove());
            routeLayers = [];

            if (pathPoints && pathPoints.length > 0) {
              const glow = L.polyline(pathPoints, {
                color: '#fed7aa', weight: 10, opacity: 0.7, lineCap: 'round', lineJoin: 'round'
              }).addTo(map);
              const casing = L.polyline(pathPoints, {
                color: '#903f00', weight: 4.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round'
              }).addTo(map);
              const core = L.polyline(pathPoints, {
                color: '#ffedd5', weight: 1.5, opacity: 1.0, lineCap: 'round', lineJoin: 'round'
              }).addTo(map);
              routeLayers = [glow, casing, core];
            }

            // Markers
            pandalMarkers.forEach(m => m.remove());
            pandalMarkers = [];

            const boundsPoints = [];

            markers.forEach(m => {
              const pinHtml = createPinElement(m.type, m.label);
              const badge = m.badge || m.type;
              const popupHtml = '<div class="popup">' +
                '<div class="popup-badge">' + badge + '</div>' +
                '<div class="popup-title">' + m.name + '</div>' +
                (m.sub ? '<div class="popup-sub">' + m.sub + '</div>' : '') +
                (m.metro ? '<div class="popup-metro">🚇 ' + m.metro + '</div>' : '') +
                '</div>';

              const isOriginOrDest = (m.type === 'origin' || m.type === 'destination');
              const icon = L.divIcon({
                html: '<div class="custom-pin-wrapper">' + pinHtml + '</div>',
                className: 'custom-pin-wrapper',
                iconSize: [34, 38],
                iconAnchor: [17, 38],
                popupAnchor: [0, -34],
              });

              const marker = L.marker([m.lat, m.lng], {
                icon,
                draggable: isOriginOrDest,
              }).addTo(map);

              marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: false });
              if (typeof m.step !== 'undefined') marker._step = m.step;

              if (isOriginOrDest) {
                marker.on('dragstart', () => { isDragging = true; });
                marker.on('dragend', (e) => {
                  const pos = e.target.getLatLng();
                  sendToHost({ 
                    type: 'marker_drag', 
                    markerType: m.type, 
                    lat: pos.lat, 
                    lng: pos.lng 
                  });
                  setTimeout(() => { isDragging = false; }, 200);
                });
              }

              marker.on('click', () => {
                sendToHost({ type: 'marker_click', place: m });
              });

              pandalMarkers.push(marker);
              boundsPoints.push([m.lat, m.lng]);
            });

            if (userCoords) {
              boundsPoints.push([userCoords[0], userCoords[1]]);
            }

            if (boundsPoints.length > 0) {
              const bounds = L.latLngBounds(boundsPoints);
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
          }

          window.highlightStep = function (step) {
            pandalMarkers.forEach((mk) => {
              const el = mk.getElement();
              if (!el) return;
              const inner = el.querySelector('.pin-pandal');
              if (!inner) return;
              if (step != null && mk._step === step) {
                inner.classList.add('active-pin');
                if (map) map.flyTo(mk.getLatLng(), 15.5, { duration: 0.8 });
                if (!mk.isPopupOpen()) mk.openPopup();
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
          srcDoc={mapHtml}
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
        source={{ html: mapHtml }}
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
