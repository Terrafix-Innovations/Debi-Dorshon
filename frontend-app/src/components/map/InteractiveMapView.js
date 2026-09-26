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
    searchedPlace = null,
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
      // General explore pandals (NO stop numbers - numbers are only for planned itinerary routes)
      pandals.forEach((p) => {
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

        markers.push({
          lat,
          lng,
          type: 'pandal',
          label: '',
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

    // Searched/Selected Place Pin (when user searches in Navigation)
    if (searchedPlace) {
      const sLat = searchedPlace.latitude ?? searchedPlace.lat;
      const sLng = searchedPlace.longitude ?? searchedPlace.lng;
      if (typeof sLat === 'number' && typeof sLng === 'number' && !isNaN(sLat) && !isNaN(sLng)) {
        const alreadyExists = markers.some((m) => Math.abs(m.lat - sLat) < 0.0001 && Math.abs(m.lng - sLng) < 0.0001);
        if (!alreadyExists) {
          markers.push({
            lat: sLat,
            lng: sLng,
            type: 'search',
            label: '',
            badge: escapeText(searchedPlace.badge || '📍 Place'),
            name: escapeText(searchedPlace.title || searchedPlace.name || 'Selected Place'),
            sub: escapeText(searchedPlace.subtitle || searchedPlace.address || ''),
            raw: searchedPlace,
            isSearched: true,
          });
        }
      }
    }

    return markers;
  }, [origin, destination, itinerary, pandals, metroStations, trainStations, searchedPlace, showPandals, showMetro, showTrain]);

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
    flyToLocation: (lat, lng, zoom = 16) => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`
          if (window._map) {
            window._map.flyTo([${lat}, ${lng}], ${zoom}, { duration: 0.9 });
          }
          true;
        `);
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
    const searchedJson = searchedPlace && typeof (searchedPlace.latitude ?? searchedPlace.lat) === 'number'
      ? JSON.stringify({
          lat: searchedPlace.latitude ?? searchedPlace.lat,
          lng: searchedPlace.longitude ?? searchedPlace.lng,
          title: searchedPlace.title || searchedPlace.name || '',
        })
      : 'null';

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
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .pin-pandal-img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
            pointer-events: none;
            user-select: none;
          }
          .pin-pandal.active-pin .pin-pandal-img {
            transform: scale(1.3);
            filter: drop-shadow(0 0 10px rgba(142, 27, 27, 0.8)) drop-shadow(0 3px 8px rgba(0,0,0,0.4));
          }
          .pin-pandal-badge {
            position: absolute;
            top: -4px;
            right: -6px;
            background: #8E1B1B;
            color: #ffffff;
            font-weight: 900;
            font-size: 10px;
            line-height: 1;
            padding: 2px 5px;
            border-radius: 9999px;
            border: 1.5px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            pointer-events: none;
            user-select: none;
          }
          .pin-pandal:active .pin-pandal-img {
            transform: scale(1.18);
          }
          .pin-s:active, .pin-e:active { transform: scale(1.12) rotate(-45deg); }
          .pin-transit-metro {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: #eef2ff;
            border: 2px solid #4f46e5;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
          }
          .pin-transit-train {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: #eff6ff;
            border: 2px solid #2563eb;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
          }

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

            updateData(${pathJson}, ${markersJson}, ${userJson}, ${searchedJson});
          }

          const PANDAL_MARKER_BASE64 = 'data:image/png;base64,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';

          function createPinElement(type, label = '', isActive = false) {
            if (type === 'pandal' || type === 'dest' || type === 'destination' || type === 'search') {
              var isDest = (type === 'dest' || type === 'destination');
              var isSearch = (type === 'search');
              return '<div class="pin-pandal ' + (isActive || isSearch ? 'active-pin' : '') + '">' +
                '<img src="' + PANDAL_MARKER_BASE64 + '" class="pin-pandal-img" alt="Pin" />' +
                (label ? '<span class="pin-pandal-badge">' + label + '</span>' : (isDest ? '<span class="pin-pandal-badge" style="background:#059669;">📍</span>' : (isSearch ? '<span class="pin-pandal-badge" style="background:#D97706;">📍</span>' : ''))) +
                '</div>';
            } else if (type === 'origin') {
              return '<div class="pin-s"><span>' + (label || 'S') + '</span></div>';
            } else if (type === 'metro') {
              return '<div class="pin-transit-metro"><span>🚇</span></div>';
            } else if (type === 'train') {
              return '<div class="pin-transit-train"><span>🚆</span></div>';
            }
            return '<div class="pin-pandal ' + (isActive ? 'active-pin' : '') + '">' +
              '<img src="' + PANDAL_MARKER_BASE64 + '" class="pin-pandal-img" alt="Pin" />' +
              (label ? '<span class="pin-pandal-badge">' + label + '</span>' : '') +
              '</div>';
          }

          function updateData(pathPoints, markers, userCoords, searchedPlace) {
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

              const isOrigin = (m.type === 'origin');
              const isOriginOrDest = (m.type === 'origin' || m.type === 'destination');
              const isPandalOrDest = (m.type === 'pandal' || m.type === 'destination' || m.type === 'dest' || m.type === 'search');

              const icon = L.divIcon({
                html: '<div class="custom-pin-wrapper">' + pinHtml + '</div>',
                className: 'custom-pin-wrapper',
                iconSize: isPandalOrDest ? [36, 36] : (isOrigin ? [34, 34] : [32, 32]),
                iconAnchor: isPandalOrDest ? [18, 36] : (isOrigin ? [17, 34] : [16, 16]),
                popupAnchor: isPandalOrDest ? [0, -36] : [0, -30],
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

            if (searchedPlace && typeof searchedPlace.lat === 'number' && typeof searchedPlace.lng === 'number') {
              map.flyTo([searchedPlace.lat, searchedPlace.lng], 16, { duration: 0.9 });
              setTimeout(() => {
                pandalMarkers.forEach(m => {
                  const mPos = m.getLatLng();
                  if (Math.abs(mPos.lat - searchedPlace.lat) < 0.0002 && Math.abs(mPos.lng - searchedPlace.lng) < 0.0002) {
                    m.openPopup();
                  }
                });
              }, 450);
            } else if (boundsPoints.length > 0) {
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
