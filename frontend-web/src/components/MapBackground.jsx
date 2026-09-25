import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const KOLKATA_CENTER = [88.3639, 22.5726]; // [lng, lat]

function createPinElement(type, label = '', isActive = false) {
  const el = document.createElement('div');
  el.className = 'custom-pin-wrapper cursor-pointer';

  if (type === 'pandal') {
    el.innerHTML = `
      <div class="pin-pandal ${isActive ? 'active-pin' : ''}">
        <img src="/pandal_marker.png" alt="Pandal" class="pin-pandal-img" />
        ${label ? `<span class="pin-pandal-badge">${label}</span>` : ''}
      </div>
    `;
  } else if (type === 'dest') {
    el.innerHTML = `
      <div class="pin-pandal active-pin">
        <img src="/pandal_marker.png" alt="Destination" class="pin-pandal-img" />
        <span class="pin-pandal-badge" style="background:#059669;">📍</span>
      </div>
    `;
  } else {
    const pinClass = 'pin-s';
    el.innerHTML = `<div class="${pinClass}"><span>${label}</span></div>`;
  }
  return el;
}

/**
 * Full-screen Mapbox map that lives in the background of the app.
 * All floating UI is layered above it via absolute positioning in App.
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
  apiBaseUrl = 'http://localhost:8000',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pandalMarkersRef = useRef([]);
  const isDraggingRef = useRef(false);

  // Keep latest callbacks in refs so the map init effect stays stable.
  const cbRef = useRef({ onMapClick, onUpdateOrigin, onUpdateDestination });
  useEffect(() => {
    cbRef.current = { onMapClick, onUpdateOrigin, onUpdateDestination };
  }, [onMapClick, onUpdateOrigin, onUpdateDestination]);

  // 1. Initialize map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isSubscribed = true;

    async function initMap() {
      const cleanBase = (apiBaseUrl || 'http://localhost:8000').trim().replace(/\/+$/, '');
      let token = null;

      try {
        const res = await fetch(`${cleanBase}/api/v1/route/config`);
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.mapbox_configured && cfg.mapbox_token) {
            token = cfg.mapbox_token;
          }
        }
      } catch (err) {
        console.warn('Map config endpoint unreachable, using fallback basemap:', err);
      }

      if (!isSubscribed || !mapContainerRef.current) return;

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
            layers: [
              { id: 'voyager-base', type: 'raster', source: 'voyager-tiles', minzoom: 0, maxzoom: 19 },
            ],
          };

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: KOLKATA_CENTER,
        zoom: 12.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      map.on('click', (e) => {
        if (isDraggingRef.current) return;
        const target = e.originalEvent?.target;
        if (target && (target.closest('.custom-pin-wrapper') || target.closest('.mapboxgl-marker'))) return;
        cbRef.current.onMapClick?.(e.lngLat.lat, e.lngLat.lng);
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiBaseUrl]);

  // 2. Origin marker
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
        <div class="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Start</div>
        <div class="font-bold text-sm text-stone-900 mt-0.5">${origin.name || 'Start Point'}</div>
      </div>`;

    if (originMarkerRef.current) {
      originMarkerRef.current.setLngLat(lngLat);
      originMarkerRef.current.getPopup()?.setHTML(popupHtml);
    } else {
      const el = createPinElement('origin', 'S');
      const marker = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat(lngLat).addTo(map);
      marker.setPopup(new mapboxgl.Popup({ offset: 22, closeButton: false }).setHTML(popupHtml));
      marker.on('dragstart', () => { isDraggingRef.current = true; });
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        cbRef.current.onUpdateOrigin?.(pos.lat, pos.lng);
        setTimeout(() => { isDraggingRef.current = false; }, 250);
      });
      originMarkerRef.current = marker;
    }
  }, [origin]);

  // 3. Destination marker
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
          <span>Pandal Location</span>
        </div>
        <h4 class="font-extrabold text-sm text-stone-900 mt-0.5 leading-snug">${destination.name || 'Pandal Location'}</h4>
        ${destination.cluster ? `<p class="text-xs text-stone-600 mt-0.5 font-medium">${destination.cluster}</p>` : ''}
        ${destination.nearest_metro?.name ? `<div class="mt-1 text-xs text-indigo-700 font-bold flex items-center gap-1">🚇 <span>${destination.nearest_metro.name}</span></div>` : ''}
      </div>`;

    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(lngLat);
      destMarkerRef.current.getPopup()?.setHTML(popupHtml);
      if (!destMarkerRef.current.getPopup()?.isOpen()) {
        destMarkerRef.current.togglePopup();
      }
    } else {
      const el = createPinElement('dest', '📍');
      const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'bottom' }).setLngLat(lngLat).addTo(map);
      marker.setPopup(new mapboxgl.Popup({ offset: 34, closeButton: false }).setHTML(popupHtml));
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

    const pad = { top: 180, bottom: bottomInset + 60, left: 60, right: 60 };
    if (origin && destination) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);
      bounds.extend([destination.longitude, destination.latitude]);
      map.fitBounds(bounds, { padding: pad, duration: 800 });
    } else if (origin) {
      map.flyTo({ center: [origin.longitude, origin.latitude], zoom: 14, duration: 800 });
    } else if (destination) {
      map.flyTo({ center: [destination.longitude, destination.latitude], zoom: 14, duration: 800 });
    }
  }, [origin, destination, routeData, bottomInset]);

  // 5. Route polyline + pandal markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => m.remove());
    pandalMarkersRef.current = [];

    const removeRouteLayers = () => {
      ['route-core', 'route-casing', 'route-glow'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('route-corridor')) map.removeSource('route-corridor');
    };

    const drawWhenReady = () => {
      if (!map.isStyleLoaded()) {
        map.once('idle', drawWhenReady);
        return;
      }

      if (!routeData) {
        removeRouteLayers();
        return;
      }

      const coords = routeData.route_geometry?.coordinates;
      if (coords && Array.isArray(coords) && coords.length > 0) {
        removeRouteLayers();
        map.addSource('route-corridor', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-glow', type: 'line', source: 'route-corridor',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#fed7aa', 'line-width': 10, 'line-opacity': 0.7 },
        });
        map.addLayer({
          id: 'route-casing', type: 'line', source: 'route-corridor',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#903f00', 'line-width': 4.5, 'line-opacity': 0.95 },
        });
        map.addLayer({
          id: 'route-core', type: 'line', source: 'route-corridor',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ffedd5', 'line-width': 1.5 },
        });
      }

      const itinerary = routeData.itinerary || [];
      const bounds = new mapboxgl.LngLatBounds();
      if (origin) bounds.extend([origin.longitude, origin.latitude]);
      if (destination) bounds.extend([destination.longitude, destination.latitude]);

      itinerary.forEach((item) => {
        const { step, pandal, detour_distance_km } = item;
        const { latitude, longitude } = pandal.location;
        const lngLat = [longitude, latitude];
        bounds.extend(lngLat);

        const isSelected = activePandal?.step === step;
        const el = createPinElement('pandal', step, isSelected);
        const popupHtml = `
          <div class="p-1 min-w-[180px]">
            <div class="text-[10px] uppercase font-bold text-stone-500">
              Stop #${step} &bull; +${detour_distance_km.toFixed(2)} km
            </div>
            <h4 class="font-bold text-sm text-stone-900 mt-0.5">${pandal.name}</h4>
            <p class="text-xs text-stone-500 mt-0.5">${pandal.region || 'Kolkata'}${pandal.cluster ? ` &bull; ${pandal.cluster}` : ''}</p>
            ${pandal.nearest_metro?.name ? `<div class="mt-1 text-xs text-indigo-700 font-medium">🚇 ${pandal.nearest_metro.name}</div>` : ''}
          </div>`;

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(lngLat)
          .setPopup(new mapboxgl.Popup({ offset: 34 }).setHTML(popupHtml))
          .addTo(map);

        marker.step = step;
        marker.pandal = { ...pandal, step, detour_distance_km };
        el.addEventListener('click', () => setActivePandal?.(marker.pandal));
        pandalMarkersRef.current.push(marker);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 170, bottom: bottomInset + 70, left: 55, right: 55 },
          duration: 900,
          essential: true,
        });
      }
    };

    drawWhenReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeData]);

  // 6. Active pandal focus
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => {
      const inner = m.getElement().querySelector('.pin-pandal');
      if (!inner) return;
      if (activePandal?.step === m.step) inner.classList.add('active-pin');
      else inner.classList.remove('active-pin');
    });

    if (activePandal?.location) {
      const { latitude, longitude } = activePandal.location;
      map.flyTo({
        center: [longitude, latitude],
        zoom: 15.5,
        offset: [0, -(bottomInset / 2)],
        duration: 800,
        essential: true,
      });
      const target = pandalMarkersRef.current.find((m) => m.step === activePandal.step);
      if (target && !target.getPopup()?.isOpen()) target.togglePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePandal]);

  return <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />;
}

export function useMapControls() {
  // Placeholder for potential imperative handle; kept simple for now.
}
