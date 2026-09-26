import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

function createPinElement(type, label = '', isActive = false) {
  const el = document.createElement('div');
  el.className = 'custom-pin-wrapper cursor-pointer';

  let pinClass = 'pin-s';
  if (type === 'dest') pinClass = 'pin-e';
  if (type === 'pandal') pinClass = `pin-pandal ${isActive ? 'active-pin' : ''}`;

  el.innerHTML = `<div class="${pinClass}">${label}</div>`;
  return el;
}

export default function MapView({
  origin,
  destination,
  routeData,
  activePandal,
  setActivePandal,
  loading,
  onMapClick,
  onUpdateOrigin,
  onUpdateDestination,
  apiBaseUrl = 'http://localhost:8000'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pandalMarkersRef = useRef([]);
  const isDraggingRef = useRef(false);

  // 1. Initialize Mapbox GL Map using backend token or fallback
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
        console.warn('Backend map config endpoint unreachable, using high-res basemap:', err);
      }

      if (!isSubscribed || !mapContainerRef.current) return;

      if (token) {
        mapboxgl.accessToken = token;
      }

      const mapStyle = token 
        ? 'mapbox://styles/mapbox/streets-v12'
        : {
            version: 8,
            sources: {
              'voyager-tiles': {
                type: 'raster',
                tiles: [
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors'
              }
            },
            layers: [
              {
                id: 'voyager-base',
                type: 'raster',
                source: 'voyager-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          };

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [88.3639, 22.5726], // Kolkata center [lng, lat]
        zoom: 12.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false
      });

      map.on('click', (e) => {
        if (isDraggingRef.current) return;
        const target = e.originalEvent?.target;
        if (target && (target.closest('.custom-pin-wrapper') || target.closest('.mapboxgl-marker'))) return;
        onMapClick(e.lngLat.lat, e.lngLat.lng);
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

  // 2. Handle Origin Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!origin) {
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        originMarkerRef.current = null;
      }
      return;
    }

    const lngLat = [origin.longitude, origin.latitude];
    const popupHtml = `
      <div class="p-1">
        <div class="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Start</div>
        <div class="font-bold text-sm text-stone-900 mt-0.5">${origin.name || 'Start Point'}</div>
      </div>
    `;

    if (originMarkerRef.current) {
      originMarkerRef.current.setLngLat(lngLat);
      originMarkerRef.current.getPopup()?.setHTML(popupHtml);
    } else {
      const el = createPinElement('origin', 'S');
      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat(lngLat)
        .addTo(map);

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(popupHtml);
      marker.setPopup(popup);

      marker.on('dragstart', () => {
        isDraggingRef.current = true;
      });

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        onUpdateOrigin(pos.lat, pos.lng);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 250);
      });

      originMarkerRef.current = marker;
    }
  }, [origin]);

  // 3. Handle Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!destination) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }

    const lngLat = [destination.longitude, destination.latitude];
    const popupHtml = `
      <div class="p-1">
        <div class="text-[10px] uppercase font-bold text-stone-500 tracking-wider">End</div>
        <div class="font-bold text-sm text-stone-900 mt-0.5">${destination.name || 'End Point'}</div>
      </div>
    `;

    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(lngLat);
      destMarkerRef.current.getPopup()?.setHTML(popupHtml);
    } else {
      const el = createPinElement('dest', 'E');
      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat(lngLat)
        .addTo(map);

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(popupHtml);
      marker.setPopup(popup);

      marker.on('dragstart', () => {
        isDraggingRef.current = true;
      });

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        onUpdateDestination(pos.lat, pos.lng);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 250);
      });

      destMarkerRef.current = marker;
    }
  }, [destination]);

  // 4. Fit bounds when Origin & Destination set without active routeData
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || routeData || isDraggingRef.current) return;

    if (origin && destination) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);
      bounds.extend([destination.longitude, destination.latitude]);
      map.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 80, right: 80 }, duration: 800 });
    } else if (origin) {
      map.flyTo({ center: [origin.longitude, origin.latitude], zoom: 14, duration: 800 });
    }
  }, [origin, destination, routeData]);

  // 5. Render Route Geometry Polyline & Pandal Waypoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous pandal markers
    pandalMarkersRef.current.forEach(m => m.remove());
    pandalMarkersRef.current = [];

    const removeRouteLayers = () => {
      ['route-core', 'route-casing', 'route-glow'].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource('route-corridor')) map.removeSource('route-corridor');
    };

    if (!routeData) {
      removeRouteLayers();
      return;
    }

    // 5.1 Draw Road Route Polyline using Mapbox GeoJSON Line Layers
    const coords = routeData.route_geometry?.coordinates;
    if (coords && Array.isArray(coords) && coords.length > 0) {
      removeRouteLayers();

      map.addSource('route-corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coords
          }
        }
      });

      // Layer 1: Subtle soft corridor glow
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-corridor',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#fed7aa',
          'line-width': 10,
          'line-opacity': 0.7
        }
      });

      // Layer 2: Main crisp route line (terracotta primary)
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route-corridor',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#903f00',
          'line-width': 4.5,
          'line-opacity': 0.95
        }
      });

      // Layer 3: Subtle inner core
      map.addLayer({
        id: 'route-core',
        type: 'line',
        source: 'route-corridor',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffedd5',
          'line-width': 1.5
        }
      });
    }

    // 5.2 Render Pandal Waypoint Markers
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
          ${pandal.nearest_metro?.name ? `
            <div class="mt-1 text-xs text-indigo-700 font-medium">🚇 ${pandal.nearest_metro.name}</div>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

      marker.step = step;
      marker.pandal = { ...pandal, step, detour_distance_km };

      el.addEventListener('click', () => {
        setActivePandal(marker.pandal);
      });

      pandalMarkersRef.current.push(marker);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 900,
        essential: true
      });
    }
  }, [routeData]);

  // 6. Handle Active Pandal focus & Popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => {
      const isSel = activePandal?.step === m.step;
      const inner = m.getElement().querySelector('.pin-pandal');
      if (inner) {
        if (isSel) {
          inner.classList.add('active-pin');
        } else {
          inner.classList.remove('active-pin');
        }
      }
    });

    if (activePandal && activePandal.location) {
      const { latitude, longitude } = activePandal.location;
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 800,
        essential: true
      });

      const targetMarker = pandalMarkersRef.current.find(m => m.step === activePandal.step);
      if (targetMarker) {
        targetMarker.togglePopup();
      }
    }
  }, [activePandal]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <main className="relative flex-1 h-full overflow-hidden bg-[#FAF7F2]">
      {/* Mapbox Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Minimal Zoom Controls (Bottom-Right, Google Maps / Uber style) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-md border border-outline-variant/40 overflow-hidden pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container-low transition-colors border-b border-outline-variant/30 text-lg font-medium"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container-low transition-colors text-lg font-medium"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Clean Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-xs z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-on-surface tracking-wide">
            Calculating route...
          </p>
        </div>
      )}
    </main>
  );
}
