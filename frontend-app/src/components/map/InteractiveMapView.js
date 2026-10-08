import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// Direct MapLibre GL import for web platform (like frontend-web's MapBackground.jsx)
let maplibregl = null;
if (Platform.OS === 'web') {
  try {
    maplibregl = require('maplibre-gl');
    // Import CSS for maplibre-gl
    require('maplibre-gl/dist/maplibre-gl.css');
  } catch (e) {
    console.warn('[InteractiveMapView] Failed to load maplibre-gl:', e);
  }
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
          raw: p,
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

  // Handle messages from MapLibre webview / iframe
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
      } else if (data.type === 'map_error') {
        console.warn('[Map Warning]:', data.error);
      }
    } catch (e) {}
  }, [onSelectPlace, onMapClick, onUpdateOrigin, onUpdateDestination]);

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

          const PANDAL_MARKER_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAPCUlEQVR4AbyaCXCV1RXHbxLFQYpToIOMLUtAtnGgrYoaErZRdiu1ZWewMhbtjE5Hwq5F7Ew7tVRZLFCoMzodi1agWlAWBeogmoQWpwVaCItAFsGNJVURXhLS/+/mnY8vLy/vvSQPme//zrn3nuV/zne/+97LI9N9Pf8ylKYpkNuVva5kA8IFWxXhuUR6PHubS6tMdwPCRUE0PCYXY2TmhQsXskFlZeUQGfq5qDQbpEFLznQk47SAxGkJpCBhYuiGzIqKiq7V1dULhecvXbq0o6ampvKaa645Cq666qrtjDV/VNiBjbAQH8WEH3FMaspfzHmluS8Ebm4MyADiIIkJsihCxTx/3XXXHcnMzFwg3JeRkTEQw1hovrMwEBthAT74RiKRabIlnoEcmgp2BHqTQdAmO8sxTIZYHiK+UHfziIo4rGKmys5fFeXlrqyo0BUsWezxlwnj3ZaZ+R7/Wb/Or7HujfWC79VXX/0csYjJVAjh3Jpu2gXhpniSHOCLBGz1bJHdLuK/0N3szGJFeZl7b8kzblVOjlstvDRuvNu1eIlHaUGh27d2ncemGfnuZa2xji0++ANiEVOxj2hXZWsO3uQEGjZ9NxCIAI1BOCn+Hl988cUQ7rjI+i1+ufD+7t3FSx13vyYmS0NjbPGhEZtnzpBvmfdU7M6tW7fe9umnn3bVhM8rCR8g1TcCmTIIkrKxDMOJ0EGmTvKFrVq1elPr/tq/bq1bmXOr7vJSd8lFAlBwY8bn9MjsXfuSWzPux4r1jI9NE9q1a/dmZWXlQk3AH8ADaKpxTcAZp1QQToAOskTkCZ3kj1uAN/JnuDfyZ2rYwlGwFF0tBBczTn29oviUe3fJIrdLjxKBaAI5ya0xNcDFoKnUm4AzDqnCkiCztO0HQwRntvyfx491e9e9pEIjAS5psUa7gGYgL49rbS6PaVBEu6VWYgvC67sWL3LLc25z5FJYl5WVNVUc+ByRpTGcDBqmdqXaAAJbRPSskydPdr322mv/aJOv589wJYW7/LC2WArxQzWjVmeeGaShseOK8hL3oh4J/LQTOsEBLhpTS4akXWHd5upJnOpNxkxYICT2Hh06dFgNAWxf1J0/ruIpqvaOXS7YxrESWxA7b2PWgI3D8pyasFENJzcc4CKdXeC5SYerRPJHAQcMG0I4EDrI+vLLL3+ixANwKikscCdUPDqETaIDG8dK1kDsvI1ZAzaOlTxqOxcHB+MAOMmGJsDRoKnETUjWAAIAAmILslq2bDmfyRMq/k/j762zxSGdKjJbtHAgVftYu73rXlHzC6DiopzgZ4CzX0v0gnGiddYIZODuT9Xd78TC3nXr6hTPXJhk7Pgb7du7Pj8a6+5etNj9bPtOl79nnwc6c6y1ko3FcPpnOlLDOvl4FODAPJzOnDkzWHq8XaDp2iv2NVEDKBp7JMA2S19gJjMJ/uVP/PrPO2SBPbfo3QYPcaOfetrdu2yFu3nSFNe+Zy/Xsk0bD3TmWLtbNtjiE/ZvaHy88D2oeOiD2DwpWQJc4Qw0bPgxwBCDhkAAQ2ZxcXG23nryMP732lcQ/o6gQLAh+f0Jk9yoXz3leg4djklCYDNatt+TD4aJ4rJ+VgeicYGbPiUO0jx1GW+kpuJfGMZbMSckwC6rS5cuU8z4708/4y5FdPeFRLJb7hA34JFHXdvOXcw1qWwj24Hy6SrfmiTxWYeLBdVHZQ7nlHcBhZlvrKRw5pDYZWZkZPhn/1xZmTtXUuJc7Qe8BmXr77R3t02b5tp26UKcAJ+fPOmObN3iipY/64HOXGAgBZ/bHpjmWutMSJbn3KmS4DDUB7NcuWdGAXepzX8EfEB9NSW4O6bTv1phq3V3Eskudwx0vYbX3fZnPvjA7fzNr92Gh6a7d3+3yAN9p+ZYU9jg6qVHpsvAgS5ZHtZros+K/rhC0Z6vAqEDqfEvDGNXwg7ohqxYw2Tj7P7965hwlwuWLnbFGzfUmWfAHGvYMDbExrD5WHk8ehjqHOioNbgab5Oarr8T4jUAQ4CjSex4BAjuSBZteMJDsOMtt+Af4KN9e+MWbwbFasxHsrEx0mIkzRc10GMKR89X/laD1PgXhvFWzBHpoc/bfvtjHM2VsPisFi1c6+uvd+F/p48eCQ/j6rE2xEgl37Giy2+HUa6et5IgJerffSYbagBrOAb4UP+YBGdLSqPf2lxCiW06QAPsM0FD8pvf9uezTyeqH0oJuEd1ifpXogaYtQ9UVVWF9HPZ/Ws3A8SYiCerIxH3+ccfsxyg3Y3dA70hJdaGGPHi4x87zxzo169fuSR8gdSGr1QagHdGTk5Ouf4mR2DXpmNHv/0hkAil77+Pb4AOfb/ret0zJhjHKqx1kE14nhiJctha17oHLoWDcKi4erIGEAR4Z/1llq2lBnRKqQEfFNR+UfHOeml9ww2u/6P5cZvQS41hDRuZBhcxrMhkEif9lWg3MoSAf2guUJM1IDAMK+wAG/NMmh4rj7zzjvvvm8GfCv1y227d3KD5j7sxq59zebPneKAP0hxr3ij6ckC+hxQjOowrLP+tEyb6dT2qfpf6QQovyRpgTfehTpw48SwKDcjWn7gtOTIeKj75xBW88II7feIEbgG4y91HjHR3PPJzD3TmAgMp+Lwn388VI15sm5Opu1m/LyBBeXn5q5LwlvBXWPcT4ZdkDTBbgtSUlZUF3R02Z3ZKj0Hx22+77UuX1muCBY4nKR4ffH1iGSWS3XJzZVF79ejRo6hW8/SiasMilQYEue+8886y8+fPv0a4Nh1r33ZYZJxI/uPll91f582r9zjgFwseGWx3y4e1RHFtvV90+0e54cIGQdbIxqTU+leiBpijSYJe0hbzDWird4IJy5b5NrOAUSJ5UDth7axZbs3DD7uiNWvcR8XF7vzZsx7ozLGGDbbJ4tn6sFn5QVVRbkYDExCsx1MaaoA5IgFBPXr27FkUiUT+SbAbQ1uPcTL8T8/znvXr3Sv5+e63gwa5x3v18kBnjjVsksUJr4+YPdcPI+IENw08z6iEO9DQ3ytkHWTWGdUd4BhGEPjYsWMrMGUXTFrGrz+1nwgDAy1+Hfpw/bCqVP6KcvJfTjVB+jB3dE3Xv+I1INaYMQGBT9C7d+/d6vgewjV2F+CTLoyYc/nuixOHHxzDgHs4XezYxWtArANOFtQ3QAZVR48eXSnp2uownOx3wVf6XvD1gZzkB+LyB0njZtI4w1/L8a9EDcAxDAtcpVDVN910E2eB3wXddRZ0zxms6ZZC+LoyY3LdPnGST8ROhIsG8PPcpFN8mDu6putfDTUg7IBOQAOJQNWOHTv8j6Lsgim/Xx7dAeHzgB2R/vHI6MFHObr77EQrHF7GE4mJgTpMD2RDDTADnAwEJAEgYdWoUaPK9NXzCYzb6VEYNdP3g+EVAznYcSQ4ffr0qujd93w0BzcAV+ON1FL8K1kD8CIAICjBgSWs2rdvX3Ag3qFteePtA/37DcbmlC5J7NGXD749AwYM4N0ILsYJCSw9qa0GZD0kakDYGR0QmASAxOyC0u3bty8gcrtOndx9y1f6BjDGIZ1y9Fx+9yCic4cPH1518OBBz0EzSDgBOJLaoOWGr0QNwIsgJtEJThISgkotVs2ePbtMP0utlu58E5auQk0rZry62fXIzfMxyTVhwgTe9uAQBtzgCFfg7RO9JGuA+RLMQAISAZJXHjhwoDI3N3fFxYsX/V9AciZNdqPzH9Oh6NKC28dODYonB7nIKXLcAAAP+MDNeCJlEmxI9HpItQE4EpAEgGQkDaCfzareeuutBfqjyUmMaUIPnQfVXzlXkwDJ1rsrxv0reNSdI3bfvn0fIJdyBLmjOrwMcNV08iuVBlgwJLAk1gTugMe8efNKt2zZMp20PAr36zz4VnZ2wl2ArQWMlW3lO00xsAG660/qlx8K9/k0h2QMF0AIOAItJ777GKTSAOwsoOkkIiGAAET8ozBnzpzSzz77zP/XGZow6/XX8WkSpq1c4c8UnPVN70k994Vqgs+lOSS54QDgFMtTZomvVBtgUUhgICGJIQEgVMnJnJeXt8Ka8C29M0xbvSq4FTgTLJmcvWWz6xk99Hju77rrrteILV+fR5KcAA5wIWSN5pESqV2NaYAFRgKSkhxABHhyhw4dqiwsLPwbxKGRq0PxnsfmOwzNKZH8gWzDxfPcE1OxfHxJcgFCAsLBCWg56Dd6QjSmAQQKJ0AnMQQgY+S85DzYtm3bEzq4TuE4Zt5890MVhp4IeVOnOGyxwbdPnz4/jfPck4Oc5IYDXABuJtGTorENsIAkASQHEIEQgFxwHmzatGk6heBIYWPUBBzjoefAPPfACr7Y+RP/lJ73hRQv6WMqhknykJPcwMLJpHFXUxpAMrIgAQQgA4wgMqJntnLu3LmlGzdufBAHkDd5Styd0EvFz3tjMyYeKnrh+PHji4ihCf0Q74gJrHjykRsOQGapb32MQVMagF84ITpEIAQgaYjoPbty/vz5pRs2bLgHRw5FmsDdZowjerj4/fv3PzRu3Ljd+MrGYpkkB8CV3EBmjS8ep6Y2AN9wYnQIQYw7ZGSRER1gEe2EktLS0l/iSBOmr1zlKLy37vz80J2PFl8kH+8r+/DdJz4gFzmBTJpWPI7NaQD+ABIAUpADsU2opKChQ4e+FtuE2OLHjh27G1sFDhdOM4gJiE8ucgKZNv1qbgOMANIAOUhCFuIUAir1DS4S2wSjzp2neGw0hx/wfhoTi5jEtjxILTX97uPc3AYQI0wEggCykKYIgy+GAocNG/Yqn+xwBir+QT3zRaxpjD22AB0Qi5jEBuGccmn6lY4GkD1MCIIAwgDyFEFBHtrikeHDh6/funXrCP01t+/EiRMLmFMgvx6V+OBLDEBMEM4l0+Zd6WoALMLE0CELcYqgGGAFXtTbXGTkyJHHddJ7XQEuCraOLcCXGMQipkz8Fdb9RFNf0tmAMAcIAsgDCqEgKxBJwYYLcjadNWzxwRcQyyDT9F3pbgAkYYc0UACgIAqjQCs2LJkH2GCLD7A4SIuNTAvS3QBIhYmiAwqhKECBFJqoeOzwwdcQjo2eFlyJBkAM0ibRAc8xRVEcTYgH1rDBFh+DxUKmFVeqAZCEvEl0iqI4A8VaE9BtHoktwM9iIOuhuRP/BwAA///8MtAKAAAABklEQVQDADqFFkpEm7eZAAAAAElFTkSuQmCC';

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

            // Pandal / Search Pin
            var isSearch = (type === 'search');
            return \`
              <div class="pin-pandal-wrapper \${isActive || isSearch ? 'active-pin' : ''}">
                <img src="\${PANDAL_MARKER_BASE64}" style="width:38px;height:38px;object-fit:contain;pointer-events:none;" alt="Pin" />
                \${label ? '<span class="pin-pandal-badge">' + label + '</span>' : (isSearch ? '<span class="pin-pandal-badge" style="background:#D97706;">📍</span>' : '')}
              </div>\`;
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

            // 4. Add Markers
            markers.forEach(m => {
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
              const popup = new maplibregl.Popup({ offset: [0, -36], closeButton: false }).setHTML(popupHtml);

              const marker = new maplibregl.Marker({
                element: el,
                draggable: isOriginOrDest,
                anchor: isOriginOrDest ? 'bottom' : (m.type === 'metro' || m.type === 'train' ? 'center' : 'bottom')
              })
                .setLngLat([m.lng, m.lat])
                .setPopup(popup)
                .addTo(map);

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
                    m.togglePopup();
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
              updateData(${pathJson}, ${markersJson}, ${userJson}, ${searchedJson});

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
                const popup = mk.getPopup();
                if (popup && !popup.isOpen()) mk.togglePopup();
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
    const isMapLoadedRef = useRef(false);
    const markersListRef = useRef([]);
    const userLocationMarkerRef = useRef(null);
    const isDraggingRef = useRef(false);

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
        isMapLoadedRef.current = true;

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
          isMapLoadedRef.current = false;
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

      // Pandal / Search Pin
      const isSearch = (type === 'search');
      const activeClass = (isActive || isSearch) ? 'transform: scale(1.28) translateY(-4px); filter: drop-shadow(0 8px 18px rgba(142, 27, 27, 0.6)); z-index: 999;' : '';
      const PANDAL_MARKER_BASE64 = 'data:image/png;base64,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';
      return `<div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);${activeClass}">
        <img src="${PANDAL_MARKER_BASE64}" style="width:38px;height:38px;object-fit:contain;pointer-events:none;" alt="Pin" />
        ${label ? `<span style="position:absolute;top:-2px;right:-4px;background:#8E1B1B;color:#fff;font-weight:800;font-size:11px;line-height:1;padding:3px 6px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);pointer-events:none;">${label}</span>` : (isSearch ? `<span style="position:absolute;top:-2px;right:-4px;background:#D97706;color:#fff;font-weight:800;font-size:11px;line-height:1;padding:3px 6px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);pointer-events:none;">📍</span>` : '')}
      </div>`;
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
      if (!map || !isMapLoadedRef.current) return;

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

      // 4. Add Markers
      allMarkers.forEach(m => {
        const pinHtml = createPinHtml(m.type, m.label);
        const popupHtml = createPopupHtml(m);

        const el = document.createElement('div');
        el.className = 'vector-pin-container';
        el.innerHTML = pinHtml;

        const isOriginOrDest = (m.type === 'origin' || m.type === 'destination');
        const popup = new maplibregl.Popup({ offset: [0, -36], closeButton: false }).setHTML(popupHtml);

        const marker = new maplibregl.Marker({
          element: el,
          draggable: isOriginOrDest,
          anchor: isOriginOrDest ? 'bottom' : (m.type === 'metro' || m.type === 'train' ? 'center' : 'bottom'),
        })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map);

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
              mk.togglePopup();
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
    }, [pathCoords, allMarkers, userCoords, searchedPlace, initRouteLayers, createPinHtml, createPopupHtml]);

    // Highlight step when selectedPlace changes
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !isMapLoadedRef.current) return;

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
          const popup = mk.getPopup();
          if (popup && !popup.isOpen()) mk.togglePopup();
        } else {
          inner.style.transform = '';
          inner.style.filter = '';
          inner.style.zIndex = '';
        }
      });
    }, [selectedPlace, itinerary]);

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

