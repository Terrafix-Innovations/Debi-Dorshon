import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const KOLKATA_CENTER = [22.5726, 88.3639]; // [lat, lng] for Leaflet

function createPinHtml(type, label = '', isActive = false) {
  if (type === 'pandal') {
    return `
      <div class="pin-pandal ${isActive ? 'active-pin' : ''}">
        <img src="/pandal_marker.png" alt="Pandal" class="pin-pandal-img" />
        ${label ? `<span class="pin-pandal-badge">${label}</span>` : ''}
      </div>
    `;
  } else if (type === 'dest') {
    return `
      <div class="pin-pandal active-pin">
        <img src="/pandal_marker.png" alt="Destination" class="pin-pandal-img" />
        <span class="pin-pandal-badge" style="background:#059669;">📍</span>
      </div>
    `;
  } else {
    return `<div class="pin-s"><span>${label}</span></div>`;
  }
}

/**
 * Full-screen OpenStreetMap (Leaflet) that lives in the background of the app.
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
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pandalMarkersRef = useRef([]);
  const routeLayersRef = useRef([]);
  const isDraggingRef = useRef(false);

  // Keep latest callbacks in refs so the map init effect stays stable.
  const cbRef = useRef({ onMapClick, onUpdateOrigin, onUpdateDestination });
  useEffect(() => {
    cbRef.current = { onMapClick, onUpdateOrigin, onUpdateDestination };
  }, [onMapClick, onUpdateOrigin, onUpdateDestination]);

  // 1. Initialize Leaflet OpenStreetMap map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KOLKATA_CENTER,
      zoom: 12.5,
      zoomControl: false,
      attributionControl: true,
    });

    // Canonical OpenStreetMap raster tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('click', (e) => {
      if (isDraggingRef.current) return;
      const target = e.originalEvent?.target;
      if (target && (target.closest('.custom-pin-wrapper') || target.closest('.leaflet-marker-icon'))) return;
      cbRef.current.onMapClick?.(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    // Force map to recalculate container size
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Origin marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!origin) {
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      return;
    }

    const latLng = [origin.latitude, origin.longitude];
    const popupHtml = `
      <div class="p-1">
        <div class="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Start</div>
        <div class="font-bold text-sm text-stone-900 mt-0.5">${origin.name || 'Start Point'}</div>
      </div>`;

    const icon = L.divIcon({
      html: `<div class="custom-pin-wrapper cursor-pointer">${createPinHtml('origin', 'S')}</div>`,
      className: 'custom-pin-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -28],
    });

    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng(latLng);
      originMarkerRef.current.setPopupContent(popupHtml);
    } else {
      const marker = L.marker(latLng, { icon, draggable: true }).addTo(map);
      marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: false });
      marker.on('dragstart', () => { isDraggingRef.current = true; });
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
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

    const latLng = [destination.latitude, destination.longitude];
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

    const icon = L.divIcon({
      html: `<div class="custom-pin-wrapper cursor-pointer">${createPinHtml('dest', '📍')}</div>`,
      className: 'custom-pin-icon',
      iconSize: [34, 38],
      iconAnchor: [17, 38],
      popupAnchor: [0, -32],
    });

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng(latLng);
      destMarkerRef.current.setPopupContent(popupHtml);
      if (!destMarkerRef.current.isPopupOpen()) {
        destMarkerRef.current.openPopup();
      }
    } else {
      const marker = L.marker(latLng, { icon, draggable: true }).addTo(map);
      marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: false });
      marker.openPopup();
      marker.on('dragstart', () => { isDraggingRef.current = true; });
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
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
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude],
      ]);
      map.fitBounds(bounds, {
        paddingTopLeft: [60, 180],
        paddingBottomRight: [60, bottomInset + 60],
        maxZoom: 15,
        animate: true,
      });
    } else if (origin) {
      map.flyTo([origin.latitude, origin.longitude], 14, { duration: 0.8 });
    } else if (destination) {
      map.flyTo([destination.latitude, destination.longitude], 14, { duration: 0.8 });
    }
  }, [origin, destination, routeData, bottomInset]);

  // 5. Route polyline + pandal markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old route polylines
    routeLayersRef.current.forEach((layer) => layer.remove());
    routeLayersRef.current = [];

    // Clear old pandal markers
    pandalMarkersRef.current.forEach((m) => m.remove());
    pandalMarkersRef.current = [];

    if (!routeData) return;

    const coords = routeData.route_geometry?.coordinates;
    if (coords && Array.isArray(coords) && coords.length > 0) {
      // GeoJSON is [lng, lat] -> Leaflet uses [lat, lng]
      const latLngs = coords.map(([lng, lat]) => [lat, lng]);

      const glow = L.polyline(latLngs, {
        color: '#fed7aa',
        weight: 10,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const casing = L.polyline(latLngs, {
        color: '#903f00',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const core = L.polyline(latLngs, {
        color: '#ffedd5',
        weight: 1.5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayersRef.current = [glow, casing, core];
    }

    const itinerary = routeData.itinerary || [];
    const allPoints = [];
    if (origin) allPoints.push([origin.latitude, origin.longitude]);
    if (destination) allPoints.push([destination.latitude, destination.longitude]);

    itinerary.forEach((item) => {
      const { step, pandal, detour_distance_km } = item;
      const { latitude, longitude } = pandal.location;
      const latLng = [latitude, longitude];
      allPoints.push(latLng);

      const isSelected = activePandal?.step === step;
      const popupHtml = `
        <div class="p-1 min-w-[180px]">
          <div class="text-[10px] uppercase font-bold text-stone-500">
            Stop #${step} &bull; +${detour_distance_km.toFixed(2)} km
          </div>
          <h4 class="font-bold text-sm text-stone-900 mt-0.5">${pandal.name}</h4>
          <p class="text-xs text-stone-500 mt-0.5">${pandal.region || 'Kolkata'}${pandal.cluster ? ` &bull; ${pandal.cluster}` : ''}</p>
          ${pandal.nearest_metro?.name ? `<div class="mt-1 text-xs text-indigo-700 font-medium">🚇 ${pandal.nearest_metro.name}</div>` : ''}
        </div>`;

      const icon = L.divIcon({
        html: `<div class="custom-pin-wrapper cursor-pointer" data-step="${step}">${createPinHtml('pandal', step, isSelected)}</div>`,
        className: 'custom-pin-icon',
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -36],
      });

      const marker = L.marker(latLng, { icon }).addTo(map);
      marker.bindPopup(popupHtml, { offset: [0, -10], closeButton: false });
      marker.step = step;
      marker.pandal = { ...pandal, step, detour_distance_km };

      marker.on('click', () => {
        setActivePandal?.(marker.pandal);
      });

      pandalMarkersRef.current.push(marker);
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, {
        paddingTopLeft: [55, 170],
        paddingBottomRight: [55, bottomInset + 70],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [routeData, bottomInset]);

  // 6. Active pandal focus
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      if (!el) return;
      const inner = el.querySelector('.pin-pandal');
      if (!inner) return;
      if (activePandal?.step === m.step) {
        inner.classList.add('active-pin');
        el.style.zIndex = '1000';
      } else {
        inner.classList.remove('active-pin');
        el.style.zIndex = '';
      }
    });

    if (activePandal?.location) {
      const { latitude, longitude } = activePandal.location;
      map.flyTo([latitude, longitude], 15.5, { duration: 0.8 });
      const target = pandalMarkersRef.current.find((m) => m.step === activePandal.step);
      if (target && !target.isPopupOpen()) {
        target.openPopup();
      }
    }
  }, [activePandal]);

  return <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />;
}
