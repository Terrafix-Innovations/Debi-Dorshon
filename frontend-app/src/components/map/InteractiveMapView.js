import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { DURGA_MAP_POINTER_DATA_URI } from './durgaPointerData';
import { SUPERCLUSTER_MIN_JS } from './superclusterMin';

// Direct MapLibre GL and Supercluster import for web platform
let maplibregl = null;
let Supercluster = null;
if (Platform.OS === 'web') {
  try {
    maplibregl = require('maplibre-gl');
    Supercluster = require('supercluster');
    if (Supercluster && Supercluster.default) Supercluster = Supercluster.default;
    // Import CSS for maplibre-gl
    require('maplibre-gl/dist/maplibre-gl.css');
  } catch (e) {
    console.warn('[InteractiveMapView] Failed to load maplibre-gl / supercluster:', e);
  }
}

function createClusterHtml(count) {
  const numStr = String(count);
  const fontSize = numStr.length > 2 ? 26 : numStr.length > 1 ? 28 : 34;
  const yPos = numStr.length > 2 ? 58 : 59;
  const scale = count < 10 ? 0.7 : count < 50 ? 0.85 : 1;
  const size = Math.round(96 * scale);

  return `
    <div class="vector-cluster-wrapper cursor-pointer transition-all hover:scale-110" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 96 96" style="filter: drop-shadow(0 4px 10px rgba(243, 61, 75, 0.45));">
        <defs>
          <linearGradient id="cluster-bg-${count}" x1="18" y1="8" x2="78" y2="88" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFB52E"/>
            <stop offset=".52" stop-color="#FF6B2C"/>
            <stop offset="1" stop-color="#F33D4B"/>
          </linearGradient>
          <filter id="cluster-shadow-${count}" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".28"/>
          </filter>
        </defs>
        <circle cx="48" cy="48" r="43" fill="#FF6B3D" opacity=".16"/>
        <circle cx="48" cy="48" r="38" fill="url(#cluster-bg-${count})" filter="url(#cluster-shadow-${count})"/>
        <circle cx="48" cy="48" r="34" fill="#18202B" stroke="#FFF4E8" stroke-width="3"/>
        <text x="48" y="${yPos}" text-anchor="middle" font-family="'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFF4E8">${numStr}</text>
      </svg>
    </div>
  `;
}

const KOLKATA_CENTER = [88.3639, 22.5726]; // [lng, lat]
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * InteractiveMapView: High-Performance 3D Vector Map (MapLibre GL JS / Ola Maps style)
 * rendered inside a WebView, matching the frontend-web architecture.
 * Features:
 *   - 3D Vector Tiles with building extrusions
 *   - Auto-resizing observers & WebGL drawing buffer preservation
 *   - Safe raster fallback if vector tiles timeout or are blocked
 *   - 3-tier glowing route polyline (glow, casing, core)
 *   - Vector SVG pin pointers (Start 'S', End 'E', numbered stops 1, 2, 3...)
 *   - Interactive dragging for Start & End pins
 *   - Camera controls: flyTo, fitBounds, zoom, and 3D pitch
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

  // Normalize path coordinates for GeoJSON LineString [lng, lat]
  const pathCoords = useMemo(() => {
    if (routePath && routePath.length > 0) {
      return routePath
        .map((p) => {
          const lat = p.latitude ?? p.lat;
          const lng = p.longitude ?? p.lng;
          return [lng, lat];
        })
        .filter(([lng, lat]) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng));
    }
    const fallback = [];
    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      fallback.push([origin.longitude, origin.latitude]);
    }
    if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') {
      fallback.push([destination.longitude, destination.latitude]);
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

  // Collect all markers for the vector map
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
          raw: {
            id: p.id || p._id,
            name: p.name,
            cluster: p.cluster,
            zone: p.zone,
            region: p.region,
            location: p.location,
            lat,
            lng,
            nearest_metro: p.nearest_metro,
            images: p.images,
          },
        });
      });
    } else if (showPandals && pandals && pandals.length > 0) {
      // General explore pandals
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
          raw: {
            id: p.id || p._id,
            name: p.name,
            cluster: p.cluster,
            zone: p.zone,
            region: p.region,
            location: p.location,
            lat,
            lng,
            nearest_metro: p.nearest_metro,
            images: p.images,
          },
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

  // Expose imperative methods to parent refs
  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (webRef.current) {
        webRef.current.injectJavaScript(`
          if (window._map) {
            window._map.flyTo({ center: [${region.longitude}, ${region.latitude}], zoom: 15.5, pitch: 35, duration: 800 });
          }
          true;
        `);
      }
    },
    fitToCoordinates: (coords) => {
      if (webRef.current && coords && coords.length > 0) {
        const rawCoords = coords.map((c) => [c.longitude ?? c.lng, c.latitude ?? c.lat]);
        webRef.current.injectJavaScript(`
          if (window._map && window.maplibregl) {
            const pts = ${JSON.stringify(rawCoords)};
            const bounds = new window.maplibregl.LngLatBounds();
            pts.forEach(p => bounds.extend(p));
            window._map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
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
            window._map.flyTo({ center: [${lng}, ${lat}], zoom: ${zoom}, pitch: 35, duration: 900 });
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

  // Highlight step when selectedPlace changes
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

  // Push latest markers and route data into WebView
  const isWebViewReadyRef = useRef(false);

  const pushDataToWebView = useCallback(() => {
    if (Platform.OS === 'web' || !webRef.current) return;
    try {
      const pathJson = JSON.stringify(pathCoords || []);
      const markersJson = JSON.stringify(allMarkers || []);
      const userJson = userCoords ? JSON.stringify([userCoords.longitude, userCoords.latitude]) : 'null';
      const searchedJson = searchedPlace && typeof (searchedPlace.latitude ?? searchedPlace.lat) === 'number'
        ? JSON.stringify({
            lat: searchedPlace.latitude ?? searchedPlace.lat,
            lng: searchedPlace.longitude ?? searchedPlace.lng,
            title: searchedPlace.title || searchedPlace.name || '',
          })
        : 'null';

      const script = `
        if (typeof window.updateData === 'function') {
          window.updateData(${pathJson}, ${markersJson}, ${userJson}, ${searchedJson});
        }
        true;
      `;
      webRef.current.injectJavaScript(script);
    } catch (e) {
      console.warn('[InteractiveMapView] pushDataToWebView error:', e);
    }
  }, [pathCoords, allMarkers, userCoords, searchedPlace]);

  useEffect(() => {
    pushDataToWebView();
  }, [pushDataToWebView]);

  // Handle messages from MapLibre webview / iframe
  const handleMessageData = useCallback((rawPayload) => {
    try {
      const data = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      if (data.type === 'marker_click' && onSelectPlace) {
        onSelectPlace(data.place?.raw || data.place);
      } else if (data.type === 'map_ready') {
        isWebViewReadyRef.current = true;
        pushDataToWebView();
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
      } else if (data.type === 'map_error') {
        console.warn('[Map Warning]:', data.error);
      }
    } catch (e) {}
  }, [onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination, pushDataToWebView]);

  const handleMessage = useCallback((event) => {
    if (event?.nativeEvent?.data) {
      handleMessageData(event.nativeEvent.data);
    }
  }, [handleMessageData]);

  // Web message listener for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onWebMessage = (e) => {
      if (e.data) handleMessageData(e.data);
    };
    window.addEventListener('message', onWebMessage);
    return () => window.removeEventListener('message', onWebMessage);
  }, [handleMessageData]);

  // Build MapLibre GL Vector Map HTML
  const mapHtml = useMemo(() => {
    const pathJson = JSON.stringify(pathCoords); // [[lng, lat], ...]
    const markersJson = JSON.stringify(allMarkers);
    const userJson = userCoords ? JSON.stringify([userCoords.longitude, userCoords.latitude]) : 'null';
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
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
        <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
        <script>${SUPERCLUSTER_MIN_JS}</script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #FAF2E4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #map {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: #FAF2E4;
          }
          
          /* Custom Vector Pins */
          .vector-pointer-wrapper {
            position: relative;
            cursor: pointer;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
          }
          .vector-pointer-wrapper:active {
            transform: scale(1.15) !important;
          }

          /* Start 'S' Pin (Green Badge) */
          .pin-start-svg {
            filter: drop-shadow(0 4px 10px rgba(22, 163, 74, 0.45));
          }

          /* Destination 'E' Pin (Maroon/Rose Badge) */
          .pin-dest-svg {
            filter: drop-shadow(0 4px 10px rgba(225, 29, 72, 0.45));
          }

          /* Pandal Marker */
          .pin-pandal-wrapper {
            position: relative;
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
          }
          .pin-pandal-wrapper.active-pin {
            transform: scale(1.28) translateY(-4px);
            filter: drop-shadow(0 8px 18px rgba(142, 27, 27, 0.6));
            z-index: 999 !important;
          }
          .pin-pandal-badge {
            position: absolute;
            top: -2px;
            right: -4px;
            background: #8E1B1B;
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            line-height: 1;
            padding: 3px 6px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            pointer-events: none;
          }
          
          /* Transit Pins */
          .pin-transit-metro {
            width: 34px; height: 34px;
            border-radius: 50%;
            background: #eef2ff;
            border: 2px solid #4f46e5;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35);
            display: flex; align-items: center; justify-content: center;
            font-size: 15px;
            cursor: pointer;
          }
          .pin-transit-train {
            width: 34px; height: 34px;
            border-radius: 50%;
            background: #eff6ff;
            border: 2px solid #2563eb;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
            display: flex; align-items: center; justify-content: center;
            font-size: 15px;
            cursor: pointer;
          }

          /* User Location Pulsing Dot */
          .user-location-marker {
            width: 22px;
            height: 22px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .user-dot {
            width: 14px;
            height: 14px;
            background: #2563eb;
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.6);
            position: relative;
            z-index: 2;
          }
          .user-pulse {
            position: absolute;
            width: 28px;
            height: 28px;
            background: rgba(37, 99, 235, 0.3);
            border-radius: 50%;
            animation: pulse 2s infinite;
            z-index: 1;
          }
          @keyframes pulse {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(1.8); opacity: 0; }
          }

          /* MapLibre Popup Styling (Matching frontend-web warm aesthetic) */
          .maplibregl-popup-content {
            background: #ffffff !important;
            color: #1b1c1a !important;
            border-radius: 14px !important;
            border: 1px solid #ddc1b3 !important;
            box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.2), 0 6px 12px -4px rgba(0, 0, 0, 0.1) !important;
            padding: 10px 14px !important;
            min-width: 170px;
            max-width: 260px;
          }
          .maplibregl-popup-tip {
            border-top-color: #ffffff !important;
          }
          .maplibregl-popup-close-button { display: none !important; }

          .popup-badge {
            font-size: 10px; color: #8E1B1B; text-transform: uppercase;
            letter-spacing: 0.06em; font-weight: 800; margin-bottom: 2px;
          }
          .popup-title { font-size: 14px; color: #1c1917; font-weight: 800; line-height: 1.25; margin-bottom: 2px; }
          .popup-sub { font-size: 12px; color: #78716c; font-weight: 500; }
          .popup-metro { font-size: 12px; color: #4338ca; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const KOLKATA_CENTER = [88.3639, 22.5726]; // [lng, lat]
          const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
          let map;
          let isDragging = false;
          let markersList = [];
          let userLocationMarker = null;
          let superclusterInstance = null;
          let clusterMarkersMap = {};

          function sendToHost(obj) {
            const str = JSON.stringify(obj);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            } else if (window.parent && window.parent !== window) {
              window.parent.postMessage(str, '*');
            }
          }

          window.onerror = function(msg, url, line, col, err) {
            sendToHost({ type: 'map_error', error: msg + ' (' + line + ':' + col + ')' });
          };

          const DURGA_PIN_SRC = '${DURGA_MAP_POINTER_DATA_URI}';

          function createPinHtml(type, label = '', isActive = false) {
            if (type === 'origin') {
              return \`
                <div class="vector-pointer-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 64 80" class="pin-start-svg">
                    <defs>
                      <linearGradient id="p-start-m" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4ADE80"/>
                        <stop offset=".55" stop-color="#16A34A"/>
                        <stop offset="1" stop-color="#15803D"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="72" rx="17" ry="4" fill="#16A34A" opacity=".3"/>
                    <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-start-m)"/>
                    <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#DCFCE7" stroke-width="3"/>
                    <text x="32" y="37" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">\${label || 'S'}</text>
                  </svg>
                </div>\`;
            } else if (type === 'destination') {
              return \`
                <div class="vector-pointer-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 64 80" class="pin-dest-svg">
                    <defs>
                      <linearGradient id="p-dest-m" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FB7185"/>
                        <stop offset=".55" stop-color="#E11D48"/>
                        <stop offset="1" stop-color="#9F1239"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="72" rx="17" ry="4" fill="#E11D48" opacity=".3"/>
                    <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-dest-m)"/>
                    <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFE4E6" stroke-width="3"/>
                    <text x="32" y="37" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#FFE4E6">\${label || 'E'}</text>
                  </svg>
                </div>\`;
            } else if (type === 'metro') {
              return '<div class="pin-transit-metro"><span>🚇</span></div>';
            } else if (type === 'train') {
              return '<div class="pin-transit-train"><span>🚆</span></div>';
            }

            if (type === 'search') {
              return \`
                <div class="vector-pointer-wrapper \${isActive ? 'active-pin' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(217, 119, 6, 0.45));">
                    <defs>
                      <linearGradient id="p-search-m" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FDE68A"/>
                        <stop offset=".55" stop-color="#D97706"/>
                        <stop offset="1" stop-color="#B45309"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="72" rx="17" ry="4" fill="#D97706" opacity=".25"/>
                    <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-search-m)"/>
                    <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFFBEB" stroke-width="3"/>
                    <text x="32" y="37" text-anchor="middle" font-size="16">📍</text>
                  </svg>
                </div>\`;
            }

            // Trips Section (Numbered stops): Use map-numbered-pointer.svg
            if (label) {
              var numStr = String(label);
              var fontSize = numStr.length > 2 ? 14 : (numStr.length > 1 ? 16 : 19);
              return \`
                <div class="vector-pointer-wrapper \${isActive ? 'active-pin' : ''}" style="\${isActive ? 'transform: scale(1.25) translateY(-4px); z-index: 999;' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(243, 61, 75, 0.45));">
                    <defs>
                      <linearGradient id="p-stop-m-\${numStr}" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FFB52E"/>
                        <stop offset=".55" stop-color="#FF6B2C"/>
                        <stop offset="1" stop-color="#F33D4B"/>
                      </linearGradient>
                      <filter id="s-stop-m-\${numStr}">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".28"/>
                      </filter>
                    </defs>
                    <ellipse cx="32" cy="72" rx="17" ry="4" fill="#FF6B3D" opacity=".25"/>
                    <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-stop-m-\${numStr})" filter="url(#s-stop-m-\${numStr})"/>
                    <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFF4E8" stroke-width="3"/>
                    <text x="32" y="36.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="\${fontSize}" font-weight="700" fill="#FFF4E8">\${numStr}</text>
                  </svg>
                </div>\`;
            }

            // Navigation Page: Durga Map Pointer Transparent SVG
            return \`
              <div class="vector-pointer-wrapper pin-pandal-wrapper \${isActive ? 'active-pin' : ''}" style="width: 52px; height: 52px;">
                <img src="\${DURGA_PIN_SRC}" style="width: 48px; height: 48px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.28));" alt="Durga Pandal" />
              </div>\`;
          }

          function createClusterHtml(count) {
            var numStr = String(count);
            var fontSize = numStr.length > 2 ? 26 : (numStr.length > 1 ? 28 : 34);
            var yPos = numStr.length > 2 ? 58 : 59;
            var scale = count < 10 ? 0.7 : (count < 50 ? 0.85 : 1);
            var size = Math.round(96 * scale);

            return \`
              <div class="vector-cluster-wrapper" style="width: \${size}px; height: \${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 96 96" style="filter: drop-shadow(0 4px 10px rgba(243, 61, 75, 0.45));">
                  <defs>
                    <linearGradient id="cluster-bg-\${count}" x1="18" y1="8" x2="78" y2="88" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#FFB52E"/>
                      <stop offset=".52" stop-color="#FF6B2C"/>
                      <stop offset="1" stop-color="#F33D4B"/>
                    </linearGradient>
                    <filter id="cluster-shadow-\${count}" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".28"/>
                    </filter>
                  </defs>
                  <circle cx="48" cy="48" r="43" fill="#FF6B3D" opacity=".16"/>
                  <circle cx="48" cy="48" r="38" fill="url(#cluster-bg-\${count})" filter="url(#cluster-shadow-\${count})"/>
                  <circle cx="48" cy="48" r="34" fill="#18202B" stroke="#FFF4E8" stroke-width="3"/>
                  <text x="48" y="\${yPos}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="\${fontSize}" font-weight="800" fill="#FFF4E8">\${numStr}</text>
                </svg>
              </div>\`;
          }

          function updateClusterMarkers() {
            if (!map || !superclusterInstance) return;
            var bounds = map.getBounds();
            if (!bounds) return;
            var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
            var zoom = Math.floor(map.getZoom());

            var clusters = superclusterInstance.getClusters(bbox, zoom);
            var newMap = {};

            clusters.forEach(function (c) {
              var isCluster = c.properties.cluster;
              var id = isCluster ? ('c_' + c.properties.cluster_id) : ('p_' + c.properties.pandalId);
              newMap[id] = c;
            });

            // Remove markers not in newMap
            Object.keys(clusterMarkersMap).forEach(function (id) {
              if (!newMap[id]) {
                clusterMarkersMap[id].marker.remove();
                delete clusterMarkersMap[id];
              }
            });

            // Add new markers
            Object.keys(newMap).forEach(function (id) {
              if (!clusterMarkersMap[id]) {
                var c = newMap[id];
                var lng = c.geometry.coordinates[0];
                var lat = c.geometry.coordinates[1];
                var isCluster = c.properties.cluster;
                var el = document.createElement('div');

                if (isCluster) {
                  var count = c.properties.point_count;
                  el.className = 'vector-pin-container cursor-pointer';
                  el.innerHTML = createClusterHtml(count);

                  el.addEventListener('click', function (e) {
                    e.stopPropagation();
                    try {
                      var expZoom = superclusterInstance.getClusterExpansionZoom(c.properties.cluster_id);
                      map.flyTo({ center: [lng, lat], zoom: expZoom, essential: true });
                    } catch (err) {}
                  });

                  var marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([lng, lat])
                    .addTo(map);

                  clusterMarkersMap[id] = { marker: marker, isCluster: true };
                } else {
                  var place = c.properties.place;
                  el.className = 'vector-pin-container cursor-pointer';
                  el.innerHTML = createPinHtml(place.type, place.label);

                  el.addEventListener('click', function (e) {
                    e.stopPropagation();
                    sendToHost({ type: 'marker_click', place: place });
                  });

                  var marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([lng, lat])
                    .addTo(map);

                  clusterMarkersMap[id] = { marker: marker, isCluster: false, place: place };
                }
              }
            });
          }

          function initRouteLayers() {
            if (!map || map.getSource('route-line-source')) return;

            map.addSource('route-line-source', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: []
                }
              }
            });

            // Glowing casing layer
            map.addLayer({
              id: 'route-glow',
              type: 'line',
              source: 'route-line-source',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#fed7aa',
                'line-width': 12,
                'line-opacity': 0.75
              }
            });

            // Prominent casing
            map.addLayer({
              id: 'route-casing',
              type: 'line',
              source: 'route-line-source',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#903f00',
                'line-width': 5.0,
                'line-opacity': 0.95
              }
            });

            // Core inner highlight line
            map.addLayer({
              id: 'route-core',
              type: 'line',
              source: 'route-line-source',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#ffedd5',
                'line-width': 1.8,
                'line-opacity': 1.0
              }
            });
          }

          function updateData(pathCoordsList, markers, userCoords, searchedPlace) {
            if (!map) return;

            // 1. Update Route Geometry
            initRouteLayers();
            const source = map.getSource('route-line-source');
            if (source) {
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: (pathCoordsList && pathCoordsList.length > 0) ? pathCoordsList : []
                }
              });
            }

            // 2. Remove existing markers
            markersList.forEach(m => m.remove());
            markersList = [];

            // Clear previous cluster markers
            Object.keys(clusterMarkersMap).forEach(function (id) {
              if (clusterMarkersMap[id] && clusterMarkersMap[id].marker) {
                clusterMarkersMap[id].marker.remove();
              }
            });
            clusterMarkersMap = {};

            if (userLocationMarker) {
              userLocationMarker.remove();
              userLocationMarker = null;
            }

            const bounds = new maplibregl.LngLatBounds();
            let hasPoints = false;

            // 3. Add User Location Marker
            if (userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
              const uEl = document.createElement('div');
              uEl.className = 'user-location-marker';
              uEl.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
              userLocationMarker = new maplibregl.Marker({ element: uEl, anchor: 'center' })
                .setLngLat(userCoords)
                .addTo(map);
            }

            // 4. Separate general navigation pandals from other markers
            const generalPandals = markers.filter(m => m.type === 'pandal' && !m.label);
            const otherMarkers = markers.filter(m => !(m.type === 'pandal' && !m.label));

            // Cluster general navigation pandals
            if (generalPandals.length > 0 && window.Supercluster) {
              if (!superclusterInstance) {
                superclusterInstance = new window.Supercluster({ radius: 60, maxZoom: 14 });
              }
              const points = generalPandals.map(p => ({
                type: 'Feature',
                properties: {
                  cluster: false,
                  pandalId: (p.raw && (p.raw.id || p.raw._id)) || (p.lng + '_' + p.lat),
                  place: p,
                },
                geometry: {
                  type: 'Point',
                  coordinates: [p.lng, p.lat],
                },
              }));
              superclusterInstance.load(points);
              generalPandals.forEach(m => { bounds.extend([m.lng, m.lat]); hasPoints = true; });
              updateClusterMarkers();
            } else {
              superclusterInstance = null;
            }

            // 5. Add other markers (itinerary numbered stops, origin, destination, transit, searchedPlace)
            otherMarkers.forEach(m => {
              const pinHtml = createPinHtml(m.type, m.label);
              const badge = m.badge || m.type;
              const popupHtml = '<div class="popup">' +
                '<div class="popup-badge">' + badge + '</div>' +
                '<div class="popup-title">' + m.name + '</div>' +
                (m.sub ? '<div class="popup-sub">' + m.sub + '</div>' : '') +
                (m.metro ? '<div class="popup-metro">🚇 ' + m.metro + '</div>' : '') +
                '</div>';

              const el = document.createElement('div');
              el.className = 'vector-pin-container';
              el.innerHTML = pinHtml;

              const isOriginOrDest = (m.type === 'origin' || m.type === 'destination');
              const isPandal = (m.type === 'pandal');

              const marker = new maplibregl.Marker({
                element: el,
                draggable: isOriginOrDest,
                anchor: isOriginOrDest ? 'bottom' : (m.type === 'metro' || m.type === 'train' ? 'center' : 'bottom')
              })
                .setLngLat([m.lng, m.lat]);

              if (!isPandal) {
                const popup = new maplibregl.Popup({ offset: [0, -36], closeButton: false }).setHTML(popupHtml);
                marker.setPopup(popup);
              }

              marker.addTo(map);

              marker._step = m.step;
              marker._placeData = m;

              if (isOriginOrDest) {
                marker.on('dragstart', () => { isDragging = true; });
                marker.on('dragend', () => {
                  const pos = marker.getLngLat();
                  sendToHost({
                    type: 'marker_drag',
                    markerType: m.type,
                    lat: pos.lat,
                    lng: pos.lng
                  });
                  setTimeout(() => { isDragging = false; }, 200);
                });
              }

              el.addEventListener('click', (ev) => {
                ev.stopPropagation();
                sendToHost({ type: 'marker_click', place: m });
              });

              markersList.push(marker);
              bounds.extend([m.lng, m.lat]);
              hasPoints = true;
            });

            // Fit bounds or fly to searched place
            if (searchedPlace && typeof searchedPlace.lat === 'number' && typeof searchedPlace.lng === 'number') {
              map.flyTo({ center: [searchedPlace.lng, searchedPlace.lat], zoom: 16, pitch: 35, duration: 900 });
              setTimeout(() => {
                markersList.forEach(m => {
                  const pos = m.getLngLat();
                  if (Math.abs(pos.lat - searchedPlace.lat) < 0.0002 && Math.abs(pos.lng - searchedPlace.lng) < 0.0002) {
                    if (m.getPopup()) m.togglePopup();
                  }
                });
              }, 450);
            } else if (pathCoordsList && pathCoordsList.length > 0) {
              const routeBounds = new maplibregl.LngLatBounds();
              pathCoordsList.forEach(coord => routeBounds.extend(coord));
              map.fitBounds(routeBounds, { padding: 50, maxZoom: 15, duration: 800 });
            } else if (hasPoints) {
              map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
            }
          }

          function fallbackToRaster() {
            if (!map || map._isRasterFallback) return;
            map._isRasterFallback = true;
            map.setStyle({
              version: 8,
              sources: {
                'carto-voyager': {
                  type: 'raster',
                  tiles: [
                    'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                    'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                    'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
                  ],
                  tileSize: 256,
                  attribution: '© CartoDB © OpenStreetMap'
                }
              },
              layers: [
                {
                  id: 'voyager-raster',
                  type: 'raster',
                  source: 'carto-voyager',
                  minzoom: 0,
                  maxzoom: 20
                }
              ]
            });
          }

          function init() {
            try {
              map = new maplibregl.Map({
                container: 'map',
                style: STYLE_URL,
                center: KOLKATA_CENTER,
                zoom: 12.5,
                pitch: 35,
                bearing: 0,
                attributionControl: false,
                trackResize: true,
                preserveDrawingBuffer: true
              });
            } catch (initErr) {
              sendToHost({ type: 'map_error', error: 'MapLibre init failure: ' + initErr.message });
              return;
            }

            window._map = map;

            map.on('error', (e) => {
              const errTxt = e?.error?.message || '';
              // If vector style fails to load or WebGL reports shader/texture issues, switch to raster
              if (errTxt.includes('Failed to fetch') || errTxt.includes('404') || errTxt.includes('style')) {
                fallbackToRaster();
              }
            });

            map.on('load', () => {
              // Add 3D building extrusion layer
              try {
                const layers = map.getStyle().layers || [];
                let labelLayerId;
                for (let i = 0; i < layers.length; i++) {
                  if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                    labelLayerId = layers[i].id;
                    break;
                  }
                }

                if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
                  map.addLayer(
                    {
                      id: '3d-buildings',
                      source: 'openmaptiles',
                      'source-layer': 'building',
                      type: 'fill-extrusion',
                      minzoom: 14,
                      paint: {
                        'fill-extrusion-color': '#e6decb',
                        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_height']],
                        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_min_height']],
                        'fill-extrusion-opacity': 0.65,
                      },
                    },
                    labelLayerId
                  );
                }
              } catch (err) {
                console.warn('3D buildings:', err);
              }

              initRouteLayers();
              window.updateData = updateData;
              updateData(${pathJson}, ${markersJson}, ${userJson}, ${searchedJson});
              sendToHost({ type: 'map_ready' });

              map.on('move', function () {
                updateClusterMarkers();
              });
              map.on('moveend', function () {
                updateClusterMarkers();
              });

              // Ensure map sizes accurately
              map.resize();
            });

            // Multiple staggered resize calls to ensure layout measurement on all devices
            window.addEventListener('resize', () => { if (map) map.resize(); });
            setTimeout(() => { if (map) map.resize(); }, 150);
            setTimeout(() => { if (map) map.resize(); }, 500);
            setTimeout(() => { if (map) map.resize(); }, 1200);

            map.on('click', (e) => {
              if (isDragging) return;
              const target = e.originalEvent?.target;
              if (target && (target.closest('.vector-pin-container') || target.closest('.maplibregl-marker'))) return;
              sendToHost({ type: 'map_click', lat: e.lngLat.lat, lng: e.lngLat.lng });
            });
          }

          window.highlightStep = function (step) {
            markersList.forEach((mk) => {
              const el = mk.getElement();
              if (!el) return;
              const inner = el.querySelector('.pin-pandal-wrapper');
              if (!inner) return;
              if (step != null && mk._step === step) {
                inner.classList.add('active-pin');
                if (map) map.flyTo({ center: mk.getLngLat(), zoom: 15.5, pitch: 35, duration: 800 });
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
  }, [pathCoords, allMarkers, userCoords, searchedPlace]);

  // ==================== WEB PLATFORM: Direct MapLibre GL JS ====================
  if (Platform.OS === 'web' && maplibregl) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const markersListRef = useRef([]);
    const userLocationMarkerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const superclusterRef = useRef(null);
    const clusterMarkersMapRef = useRef({});
    const updateWebClustersRef = useRef(() => {});

    // Keep latest callbacks in refs so effects stay stable
    const cbRef = useRef({ onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination });
    useEffect(() => {
      cbRef.current = { onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination };
    }, [onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination]);

    // Init route layers helper
    const initRouteLayers = useCallback((map) => {
      if (!map.getSource('route-line-source')) {
        map.addSource('route-line-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          },
        });

        // Glowing casing layer
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route-line-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#fed7aa', 'line-width': 12, 'line-opacity': 0.75 },
        });

        // Prominent casing
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route-line-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#903f00', 'line-width': 5.0, 'line-opacity': 0.95 },
        });

        // Core inner highlight
        map.addLayer({
          id: 'route-core',
          type: 'line',
          source: 'route-line-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ffedd5', 'line-width': 1.8, 'line-opacity': 1.0 },
        });
      }
    }, []);

    // Initialize MapLibre Map (once)
    useEffect(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OPENFREEMAP_STYLE,
        center: KOLKATA_CENTER,
        zoom: 12.5,
        pitch: 35,
        bearing: 0,
        attributionControl: false,
        trackResize: true,
        preserveDrawingBuffer: true,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

      map.on('load', () => {
        setIsMapLoaded(true);

        // Add 3D building extrusion layer
        try {
          const layers = map.getStyle().layers || [];
          let labelLayerId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }

          if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'openmaptiles',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 14,
                paint: {
                  'fill-extrusion-color': '#e6decb',
                  'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_height']],
                  'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_min_height']],
                  'fill-extrusion-opacity': 0.65,
                },
              },
              labelLayerId
            );
          }
        } catch (err) {
          console.warn('3D buildings:', err);
        }

        initRouteLayers(map);
        map.resize();
        if (updateWebClustersRef.current) updateWebClustersRef.current();
      });

      map.on('move', () => {
        if (updateWebClustersRef.current) updateWebClustersRef.current();
      });

      map.on('moveend', () => {
        if (updateWebClustersRef.current) updateWebClustersRef.current();
      });

      map.on('click', (e) => {
        if (isDraggingRef.current) return;
        const target = e.originalEvent?.target;
        if (target && (target.closest('.vector-pin-container') || target.closest('.maplibregl-marker'))) return;
        cbRef.current.onMapClick?.(e.lngLat.lat, e.lngLat.lng);
      });

      mapInstanceRef.current = map;
      window._map = map;

      const resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setIsMapLoaded(false);
        }
      };
    }, [initRouteLayers]);

    // Create SVG pin HTML helpers
    const createPinHtml = useCallback((type, label = '', isActive = false) => {
      if (type === 'origin') {
        return `<div class="vector-pointer-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(22, 163, 74, 0.45));">
            <defs><linearGradient id="p-start-m" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#4ADE80"/><stop offset=".55" stop-color="#16A34A"/><stop offset="1" stop-color="#15803D"/></linearGradient></defs>
            <ellipse cx="32" cy="72" rx="17" ry="4" fill="#16A34A" opacity=".3"/>
            <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-start-m)"/>
            <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#DCFCE7" stroke-width="3"/>
            <text x="32" y="37" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">${label || 'S'}</text>
          </svg>
        </div>`;
      } else if (type === 'destination') {
        return `<div class="vector-pointer-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(225, 29, 72, 0.45));">
            <defs><linearGradient id="p-dest-m" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#FB7185"/><stop offset=".55" stop-color="#E11D48"/><stop offset="1" stop-color="#9F1239"/></linearGradient></defs>
            <ellipse cx="32" cy="72" rx="17" ry="4" fill="#E11D48" opacity=".3"/>
            <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-dest-m)"/>
            <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFE4E6" stroke-width="3"/>
            <text x="32" y="37" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#FFE4E6">${label || 'E'}</text>
          </svg>
        </div>`;
      } else if (type === 'metro') {
        return '<div style="width:34px;height:34px;border-radius:50%;background:#eef2ff;border:2px solid #4f46e5;box-shadow:0 4px 10px rgba(79,70,229,0.35);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;"><span>🚇</span></div>';
      } else if (type === 'train') {
        return '<div style="width:34px;height:34px;border-radius:50%;background:#eff6ff;border:2px solid #2563eb;box-shadow:0 4px 10px rgba(37,99,235,0.35);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;"><span>🚆</span></div>';
      }

      if (type === 'search') {
        const activeStyle = isActive ? 'transform: scale(1.25) translateY(-4px); filter: drop-shadow(0 8px 18px rgba(217, 119, 6, 0.6)); z-index: 999;' : '';
        return `
          <div class="vector-pointer-wrapper" style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);${activeStyle}">
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(217, 119, 6, 0.45));">
              <defs><linearGradient id="p-search-web" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#FDE68A"/><stop offset=".55" stop-color="#D97706"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>
              <ellipse cx="32" cy="72" rx="17" ry="4" fill="#D97706" opacity=".25"/>
              <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-search-web)"/>
              <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFFBEB" stroke-width="3"/>
              <text x="32" y="37" text-anchor="middle" font-size="16">📍</text>
            </svg>
          </div>
        `;
      }

      // Trips section: Map Numbered Pointer SVG from assets folder
      if (label) {
        const numStr = String(label);
        const fontSize = numStr.length > 2 ? 14 : numStr.length > 1 ? 16 : 19;
        const activeStyle = isActive ? 'transform: scale(1.25) translateY(-4px); filter: drop-shadow(0 8px 18px rgba(243, 61, 75, 0.6)); z-index: 999;' : '';
        return `
          <div class="vector-pointer-wrapper" style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);${activeStyle}">
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80" style="filter: drop-shadow(0 4px 10px rgba(243, 61, 75, 0.4));">
              <defs>
                <linearGradient id="p-stop-web-${numStr}" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FFB52E"/>
                  <stop offset=".55" stop-color="#FF6B2C"/>
                  <stop offset="1" stop-color="#F33D4B"/>
                </linearGradient>
                <filter id="s-stop-web-${numStr}">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".28"/>
                </filter>
              </defs>
              <ellipse cx="32" cy="72" rx="17" ry="4" fill="#FF6B3D" opacity=".25"/>
              <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-stop-web-${numStr})" filter="url(#s-stop-web-${numStr})"/>
              <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFF4E8" stroke-width="3"/>
              <text x="32" y="36.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFF4E8">${numStr}</text>
            </svg>
          </div>
        `;
      }

      // Navigation page: Durga Map Pointer Transparent SVG
      const activeStyle = isActive ? 'transform: scale(1.28) translateY(-4px); filter: drop-shadow(0 8px 18px rgba(142, 27, 27, 0.6)); z-index: 999;' : '';
      return `
        <div class="vector-pointer-wrapper" style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);${activeStyle}">
          <img src="${DURGA_MAP_POINTER_DATA_URI}" style="width:48px;height:48px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.28));" alt="Durga Pandal" />
        </div>
      `;
    }, []);

    // Create popup HTML
    const createPopupHtml = useCallback((m) => {
      const badge = m.badge || m.type;
      return `<div style="padding:4px;">
        <div style="font-size:10px;color:#8E1B1B;text-transform:uppercase;letter-spacing:0.06em;font-weight:800;margin-bottom:2px;">${badge}</div>
        <div style="font-size:14px;color:#1c1917;font-weight:800;line-height:1.25;margin-bottom:2px;">${m.name}</div>
        ${m.sub ? `<div style="font-size:12px;color:#78716c;font-weight:500;">${m.sub}</div>` : ''}
        ${m.metro ? `<div style="font-size:12px;color:#4338ca;font-weight:700;margin-top:4px;display:flex;align-items:center;gap:4px;">🚇 ${m.metro}</div>` : ''}
      </div>`;
    }, []);

    // Update markers and route data when they change
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !isMapLoaded) return;

      // 1. Update Route Geometry
      initRouteLayers(map);
      const source = map.getSource('route-line-source');
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: (pathCoords && pathCoords.length > 0) ? pathCoords : [],
          },
        });
      }

      // 2. Remove existing markers
      markersListRef.current.forEach(m => m.remove());
      markersListRef.current = [];

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }

      const bounds = new maplibregl.LngLatBounds();
      let hasPoints = false;

      // 3. Add User Location Marker
      if (userCoords && typeof userCoords.longitude === 'number' && typeof userCoords.latitude === 'number') {
        const uEl = document.createElement('div');
        uEl.style.cssText = 'width:22px;height:22px;position:relative;display:flex;align-items:center;justify-content:center;';
        uEl.innerHTML = `
          <div style="position:absolute;width:28px;height:28px;background:rgba(37,99,235,0.3);border-radius:50%;animation:pulse 2s infinite;z-index:1;"></div>
          <div style="width:14px;height:14px;background:#2563eb;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(37,99,235,0.6);position:relative;z-index:2;"></div>
        `;
        userLocationMarkerRef.current = new maplibregl.Marker({ element: uEl, anchor: 'center' })
          .setLngLat([userCoords.longitude, userCoords.latitude])
          .addTo(map);
      }

      // 4. Update Cluster Markers Logic
      const generalPandals = allMarkers.filter((m) => m.type === 'pandal' && !m.label);
      const otherMarkers = allMarkers.filter((m) => !(m.type === 'pandal' && !m.label));

      // Clear previous cluster markers
      Object.keys(clusterMarkersMapRef.current).forEach((id) => {
        if (clusterMarkersMapRef.current[id]?.marker) {
          clusterMarkersMapRef.current[id].marker.remove();
        }
      });
      clusterMarkersMapRef.current = {};

      updateWebClustersRef.current = () => {
        if (!map || !superclusterRef.current) return;
        const bounds = map.getBounds();
        if (!bounds) return;
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
        const zoom = Math.floor(map.getZoom());

        const clusters = superclusterRef.current.getClusters(bbox, zoom);
        const newMap = {};

        clusters.forEach((c) => {
          const isCluster = c.properties.cluster;
          const id = isCluster ? `c_${c.properties.cluster_id}` : `p_${c.properties.pandalId}`;
          newMap[id] = c;
        });

        // Remove old markers
        Object.keys(clusterMarkersMapRef.current).forEach((id) => {
          if (!newMap[id]) {
            clusterMarkersMapRef.current[id].marker.remove();
            delete clusterMarkersMapRef.current[id];
          }
        });

        // Add or keep markers
        Object.keys(newMap).forEach((id) => {
          if (!clusterMarkersMapRef.current[id]) {
            const c = newMap[id];
            const [lng, lat] = c.geometry.coordinates;
            const isCluster = c.properties.cluster;
            const el = document.createElement('div');

            if (isCluster) {
              const count = c.properties.point_count;
              el.className = 'vector-pin-container cursor-pointer';
              el.innerHTML = createClusterHtml(count);

              el.addEventListener('click', (e) => {
                e.stopPropagation();
                try {
                  const expZoom = superclusterRef.current.getClusterExpansionZoom(c.properties.cluster_id);
                  map.flyTo({ center: [lng, lat], zoom: expZoom, essential: true });
                } catch (err) {}
              });

              const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([lng, lat])
                .addTo(map);

              clusterMarkersMapRef.current[id] = { marker, isCluster: true };
            } else {
              const place = c.properties.place;
              el.className = 'vector-pin-container cursor-pointer';
              el.innerHTML = createPinHtml(place.type, place.label);

              el.addEventListener('click', (e) => {
                e.stopPropagation();
                cbRef.current.onSelectPlace?.(place.raw || place);
              });

              const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .addTo(map);

              clusterMarkersMapRef.current[id] = { marker, isCluster: false, place };
            }
          }
        });
      };

      if (generalPandals.length > 0 && Supercluster) {
        if (!superclusterRef.current) {
          superclusterRef.current = new Supercluster({ radius: 60, maxZoom: 14 });
        }
        const points = generalPandals.map((p) => ({
          type: 'Feature',
          properties: {
            cluster: false,
            pandalId: (p.raw && (p.raw.id || p.raw._id)) || `${p.lng}_${p.lat}`,
            place: p,
          },
          geometry: {
            type: 'Point',
            coordinates: [p.lng, p.lat],
          },
        }));
        superclusterRef.current.load(points);
        generalPandals.forEach((m) => { bounds.extend([m.lng, m.lat]); hasPoints = true; });
        updateWebClustersRef.current();
      } else {
        superclusterRef.current = null;
      }

      // 5. Add Other Markers (itinerary stops, origin, destination, transit, searchedPlace)
      otherMarkers.forEach(m => {
        const pinHtml = createPinHtml(m.type, m.label);
        const popupHtml = createPopupHtml(m);

        const el = document.createElement('div');
        el.className = 'vector-pin-container';
        el.innerHTML = pinHtml;

        const isOriginOrDest = (m.type === 'origin' || m.type === 'destination');
        const isPandal = (m.type === 'pandal');

        const marker = new maplibregl.Marker({
          element: el,
          draggable: isOriginOrDest,
          anchor: isOriginOrDest ? 'bottom' : (m.type === 'metro' || m.type === 'train' ? 'center' : 'bottom'),
        })
          .setLngLat([m.lng, m.lat]);

        if (!isPandal) {
          const popup = new maplibregl.Popup({ offset: [0, -36], closeButton: false }).setHTML(popupHtml);
          marker.setPopup(popup);
        }

        marker.addTo(map);

        marker._step = m.step;
        marker._placeData = m;

        if (isOriginOrDest) {
          marker.on('dragstart', () => { isDraggingRef.current = true; });
          marker.on('dragend', () => {
            const pos = marker.getLngLat();
            if (m.type === 'origin') {
              cbRef.current.onUpdateOrigin?.(pos.lat, pos.lng);
            } else {
              cbRef.current.onUpdateDestination?.(pos.lat, pos.lng);
            }
            setTimeout(() => { isDraggingRef.current = false; }, 200);
          });
        }

        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          cbRef.current.onSelectPlace?.(m.raw || m);
        });

        markersListRef.current.push(marker);
        bounds.extend([m.lng, m.lat]);
        hasPoints = true;
      });

      // Fit bounds or fly to searched place
      const sp = searchedPlace;
      const sLat = sp?.latitude ?? sp?.lat;
      const sLng = sp?.longitude ?? sp?.lng;
      if (sp && typeof sLat === 'number' && typeof sLng === 'number') {
        map.flyTo({ center: [sLng, sLat], zoom: 16, pitch: 35, duration: 900 });
        setTimeout(() => {
          markersListRef.current.forEach(mk => {
            const pos = mk.getLngLat();
            if (Math.abs(pos.lat - sLat) < 0.0002 && Math.abs(pos.lng - sLng) < 0.0002) {
              if (mk.getPopup()) mk.togglePopup();
            }
          });
        }, 450);
      } else if (pathCoords && pathCoords.length > 0) {
        const routeBounds = new maplibregl.LngLatBounds();
        pathCoords.forEach(coord => routeBounds.extend(coord));
        map.fitBounds(routeBounds, { padding: 50, maxZoom: 15, duration: 800 });
      } else if (hasPoints) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
      }
    }, [isMapLoaded, pathCoords, allMarkers, userCoords, searchedPlace, initRouteLayers, createPinHtml, createPopupHtml]);

    // Highlight step when selectedPlace changes
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !isMapLoaded) return;

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

      markersListRef.current.forEach((mk) => {
        const el = mk.getElement();
        if (!el) return;
        const inner = el.querySelector('.pin-pandal-wrapper') || el.querySelector('[style*="position:relative"]');
        if (!inner) return;
        if (step != null && mk._step === step) {
          inner.style.transform = 'scale(1.28) translateY(-4px)';
          inner.style.filter = 'drop-shadow(0 8px 18px rgba(142, 27, 27, 0.6))';
          inner.style.zIndex = '999';
          map.flyTo({ center: mk.getLngLat(), zoom: 15.5, pitch: 35, duration: 800 });
        } else {
          inner.style.transform = '';
          inner.style.filter = '';
          inner.style.zIndex = '';
        }
      });
    }, [isMapLoaded, selectedPlace, itinerary]);

    // Inject global CSS for pulse animation and popup styling
    useEffect(() => {
      const styleId = 'interactive-map-global-styles';
      if (document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .vector-pointer-wrapper {
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
          user-select: none;
        }
        .vector-pointer-wrapper:active { transform: scale(1.15) !important; }
        .maplibregl-popup-content {
          background: #ffffff !important;
          color: #1b1c1a !important;
          border-radius: 14px !important;
          border: 1px solid #ddc1b3 !important;
          box-shadow: 0 12px 30px -4px rgba(0,0,0,0.2), 0 6px 12px -4px rgba(0,0,0,0.1) !important;
          padding: 10px 14px !important;
          min-width: 170px;
          max-width: 260px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .maplibregl-popup-tip { border-top-color: #ffffff !important; }
        .maplibregl-popup-close-button { display: none !important; }
      `;
      document.head.appendChild(style);
    }, []);

    // Expose imperative methods for web
    useImperativeHandle(ref, () => ({
      animateToRegion: (region) => {
        const map = mapInstanceRef.current;
        if (map) map.flyTo({ center: [region.longitude, region.latitude], zoom: 15.5, pitch: 35, duration: 800 });
      },
      fitToCoordinates: (coords) => {
        const map = mapInstanceRef.current;
        if (map && coords && coords.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          coords.forEach(c => bounds.extend([c.longitude ?? c.lng, c.latitude ?? c.lat]));
          map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
        }
      },
      zoomIn: () => { const map = mapInstanceRef.current; if (map) map.zoomIn(); },
      zoomOut: () => { const map = mapInstanceRef.current; if (map) map.zoomOut(); },
      flyToLocation: (lat, lng, zoom = 16) => {
        const map = mapInstanceRef.current;
        if (map) map.flyTo({ center: [lng, lat], zoom, pitch: 35, duration: 900 });
      },
      highlightStep: (step) => {
        markersListRef.current.forEach((mk) => {
          const el = mk.getElement();
          if (!el) return;
          const inner = el.querySelector('[style*="position:relative"]');
          if (!inner) return;
          if (step != null && mk._step === step) {
            inner.style.transform = 'scale(1.28) translateY(-4px)';
            inner.style.filter = 'drop-shadow(0 8px 18px rgba(142, 27, 27, 0.6))';
            const map = mapInstanceRef.current;
            if (map) map.flyTo({ center: mk.getLngLat(), zoom: 15.5, pitch: 35, duration: 800 });
            const popup = mk.getPopup();
            if (popup && !popup.isOpen()) mk.togglePopup();
          } else {
            inner.style.transform = '';
            inner.style.filter = '';
          }
        });
      },
    }));

    return (
      <View style={styles.container}>
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            background: '#FAF2E4',
          }}
        />
      </View>
    );
  }

  // ==================== MOBILE PLATFORM: WebView ====================
  // On Mobile (Android / iOS), use WebView with baseUrl and hardware acceleration
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
        source={{
          html: mapHtml,
          baseUrl: 'https://tiles.openfreemap.org',
        }}
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
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        androidHardwareAccelerationDisabled={false}
        onMessage={handleMessage}
        onLoadEnd={() => {
          setTimeout(pushDataToWebView, 150);
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

