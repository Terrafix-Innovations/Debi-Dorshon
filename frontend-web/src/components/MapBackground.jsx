import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { getNumberedPointerSvg, getStartPointerSvg, getDestPointerSvg } from '../utils/mapPointers';

const KOLKATA_CENTER = [88.3639, 22.5726]; // [lng, lat] for MapLibre
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * High-Performance 3D Vector Map (MapLibre GL JS + OpenFreeMap)
 * With dynamic vector numbered pointers (1, 2, 3...)
 */
export default function MapBackground({
  origin,
  destination,
  routeData,
  activePandal,
  setActivePandal,
  onMapClick,
  onUpdateOrigin,
  onUpdateDestination,
  bottomInset = 0,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isMapLoadedRef = useRef(false);

  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pandalMarkersRef = useRef([]);
  const isDraggingRef = useRef(false);

  const [is3DMode, setIs3DMode] = useState(true);

  // Keep latest callbacks in refs so effects stay stable
  const cbRef = useRef({ onMapClick, onUpdateOrigin, onUpdateDestination });
  useEffect(() => {
    cbRef.current = { onMapClick, onUpdateOrigin, onUpdateDestination };
  }, [onMapClick, onUpdateOrigin, onUpdateDestination]);

  // 1. Initialize MapLibre Map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPENFREEMAP_STYLE,
      center: KOLKATA_CENTER,
      zoom: 12.5,
      pitch: 35,
      bearing: 0,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      isMapLoadedRef.current = true;

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
        console.warn('3D building extrusion not available in this style:', err);
      }

      initRouteLayers(map);
    });

    map.on('click', (e) => {
      if (isDraggingRef.current) return;
      const target = e.originalEvent?.target;
      if (target && (target.closest('.vector-pointer-wrapper') || target.closest('.maplibregl-marker'))) return;
      cbRef.current.onMapClick?.(e.lngLat.lat, e.lngLat.lng);
    });

    mapInstanceRef.current = map;

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
  }, []);

  // Helper: Init route layers
  const initRouteLayers = (map) => {
    if (!map.getSource('route-line-source')) {
      map.addSource('route-line-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // Glow casing layer
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-line-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#fed7aa',
          'line-width': 12,
          'line-opacity': 0.7,
        },
      });

      // Main prominent route line
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route-line-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#903f00',
          'line-width': 5.5,
          'line-opacity': 0.95,
        },
      });

      // Core inner highlight line
      map.addLayer({
        id: 'route-core',
        type: 'line',
        source: 'route-line-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffedd5',
          'line-width': 2,
          'line-opacity': 1.0,
        },
      });
    }
  };

  // Toggle 3D pitch perspective
  const toggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    map.easeTo({
      pitch: next3D ? 45 : 0,
      duration: 800,
    });
  };

  // 2. Origin marker (Green 'S' vector pointer)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!origin) {
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      return;
    }

    const lngLat = [origin.longitude, origin.latitude];
    const popupHtml = `
      <div class="p-1">
        <div class="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
          <span>🟢</span>
          <span>Start Location</span>
        </div>
        <div class="font-bold text-sm text-stone-900 mt-0.5">${origin.name || 'Start Point'}</div>
      </div>`;

    const popup = new maplibregl.Popup({ offset: [0, -42], closeButton: false }).setHTML(popupHtml);

    if (originMarkerRef.current) {
      originMarkerRef.current.setLngLat(lngLat);
      originMarkerRef.current.setPopup(popup);
    } else {
      const el = document.createElement('div');
      el.innerHTML = getStartPointerSvg();

      const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

      marker.on('dragstart', () => { isDraggingRef.current = true; });
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        cbRef.current.onUpdateOrigin?.(pos.lat, pos.lng);
        setTimeout(() => { isDraggingRef.current = false; }, 250);
      });
      originMarkerRef.current = marker;
    }
  }, [origin]);

  // 3. Destination marker (Rose / Maroon '📍' vector pointer)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!destination) {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      return;
    }

    const lngLat = [destination.longitude, destination.latitude];
    const popupHtml = `
      <div class="p-1.5 min-w-[200px]">
        <div class="text-[10px] uppercase font-black text-[#903f00] tracking-wider flex items-center gap-1">
          <span>📍</span>
          <span>Destination</span>
        </div>
        <h4 class="font-extrabold text-sm text-stone-900 mt-0.5 leading-snug">${destination.name || 'Destination'}</h4>
        ${destination.cluster ? `<p class="text-xs text-stone-600 mt-0.5 font-medium">${destination.cluster}</p>` : ''}
        ${destination.nearest_metro?.name ? `<div class="mt-1 text-xs text-indigo-700 font-bold flex items-center gap-1">🚇 <span>${destination.nearest_metro.name}</span></div>` : ''}
      </div>`;

    const popup = new maplibregl.Popup({ offset: [0, -42], closeButton: false }).setHTML(popupHtml);

    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(lngLat);
      destMarkerRef.current.setPopup(popup);
    } else {
      const el = document.createElement('div');
      el.innerHTML = getDestPointerSvg();

      const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

      marker.togglePopup();
      marker.on('dragstart', () => { isDraggingRef.current = true; });
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        cbRef.current.onUpdateDestination?.(pos.lat, pos.lng);
        setTimeout(() => { isDraggingRef.current = false; }, 250);
      });
      destMarkerRef.current = marker;
    }
  }, [destination]);

  // 4. Fit bounds for origin/destination before a route exists
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || routeData || isDraggingRef.current) return;

    if (origin && destination) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);
      bounds.extend([destination.longitude, destination.latitude]);

      map.fitBounds(bounds, {
        padding: { top: 70, bottom: bottomInset + 70, left: 70, right: 190 },
        maxZoom: 15,
        pitch: is3DMode ? 35 : 0,
        duration: 1000,
      });
    } else if (origin) {
      map.flyTo({
        center: [origin.longitude, origin.latitude],
        zoom: 14.5,
        pitch: is3DMode ? 40 : 0,
        duration: 900,
      });
    } else if (destination) {
      map.flyTo({
        center: [destination.longitude, destination.latitude],
        zoom: 14.5,
        pitch: is3DMode ? 40 : 0,
        duration: 900,
      });
    }
  }, [origin, destination, routeData, bottomInset, is3DMode]);

  // 5. Route line & Dynamic Numbered Pointer Markers (1, 2, 3...)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => m.remove());
    pandalMarkersRef.current = [];

    const updateRouteOnMap = () => {
      initRouteLayers(map);
      const source = map.getSource('route-line-source');

      if (!routeData) {
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
        return;
      }

      const coords = routeData.route_geometry?.coordinates || [];
      if (source && coords.length > 0) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        });
      }

      // Add itinerary pandal stops with dynamic SVG numbers (1, 2, 3...)
      const itinerary = routeData.itinerary || [];
      const bounds = new maplibregl.LngLatBounds();

      if (origin) bounds.extend([origin.longitude, origin.latitude]);
      if (destination) bounds.extend([destination.longitude, destination.latitude]);

      itinerary.forEach((item) => {
        const { step, pandal, detour_distance_km } = item;
        const { latitude, longitude } = pandal.location;
        const lngLat = [longitude, latitude];
        bounds.extend(lngLat);

        const isSelected = activePandal?.step === step;
        const popupHtml = `
          <div class="p-1 min-w-[180px]">
            <div class="text-[10px] uppercase font-bold text-[#FF6B2C] flex items-center gap-1">
              <span>Stop #${step}</span> &bull; <span>+${detour_distance_km.toFixed(2)} km</span>
            </div>
            <h4 class="font-bold text-sm text-stone-900 mt-0.5">${pandal.name}</h4>
            <p class="text-xs text-stone-500 mt-0.5">${pandal.region || 'Kolkata'}${pandal.cluster ? ` &bull; ${pandal.cluster}` : ''}</p>
            ${pandal.nearest_metro?.name ? `<div class="mt-1 text-xs text-indigo-700 font-medium">🚇 ${pandal.nearest_metro.name}</div>` : ''}
          </div>`;

        const el = document.createElement('div');
        el.className = 'vector-pin-container cursor-pointer';
        el.setAttribute('data-step', step);
        el.innerHTML = getNumberedPointerSvg(step, isSelected);

        const popup = new maplibregl.Popup({ offset: [0, -42], closeButton: false }).setHTML(popupHtml);
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(map);

        marker.step = step;
        marker.pandal = { ...pandal, step, detour_distance_km };

        el.addEventListener('click', () => {
          setActivePandal?.(marker.pandal);
        });

        pandalMarkersRef.current.push(marker);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 65, bottom: bottomInset + 75, left: 65, right: 190 },
          maxZoom: 16,
          pitch: is3DMode ? 40 : 0,
          duration: 1200,
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateRouteOnMap();
    } else {
      map.once('load', updateRouteOnMap);
    }
  }, [routeData, bottomInset, is3DMode]);

  // 6. Active pandal focus: update the dynamic SVG to active glowing state & flyTo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      if (!el) return;
      const isSelected = activePandal?.step === m.step;
      el.innerHTML = getNumberedPointerSvg(m.step, isSelected);
      if (isSelected) {
        el.style.zIndex = '1000';
      } else {
        el.style.zIndex = '';
      }
    });

    if (activePandal?.location) {
      const { latitude, longitude } = activePandal.location;
      map.flyTo({
        center: [longitude, latitude],
        zoom: 15.5,
        pitch: is3DMode ? 45 : 0,
        bearing: 15,
        duration: 1000,
        essential: true,
      });

      const target = pandalMarkersRef.current.find((m) => m.step === activePandal.step);
      if (target && !target.getPopup().isOpen()) {
        target.togglePopup();
      }
    }
  }, [activePandal, is3DMode]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating 3D / 2D perspective toggle badge */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={toggle3D}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md backdrop-blur-md border ${
            is3DMode
              ? 'bg-[#903f00] text-white border-[#743300] shadow-amber-900/20'
              : 'bg-white/90 text-stone-700 border-stone-200 hover:bg-stone-50'
          }`}
          title="Toggle 3D Buildings & Tilt"
        >
          <span>{is3DMode ? '🏙️ 3D View On' : '🗺️ 2D View'}</span>
        </button>
      </div>
    </div>
  );
}
