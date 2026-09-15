import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

function createPinIcon(type, label = '', isActive = false) {
  let pinClass = 'pin-s';
  if (type === 'dest') pinClass = 'pin-e';
  if (type === 'pandal') pinClass = `pin-pandal ${isActive ? 'active-pin' : ''}`;

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<div class="${pinClass}">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
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
  onUpdateDestination
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const pandalMarkersRef = useRef([]);
  const routeLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('density');

  // 1. Initialize Map with Voyager (Architectural Parchment/Sandstone look)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.595, 88.375], // Centered around North Kolkata
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Origin Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!origin) {
      if (originMarkerRef.current) {
        map.removeLayer(originMarkerRef.current);
        originMarkerRef.current = null;
      }
      return;
    }

    const { latitude, longitude } = origin;
    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createPinIcon('origin', 'S'),
        draggable: true
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-1">
          <div class="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Start Sanctuary</div>
          <div class="font-headline font-semibold text-sm text-on-surface mt-0.5">${origin.name || 'Origin'}</div>
          <div class="text-[11px] text-on-surface-variant/80 mt-1">Drag marker to reposition</div>
        </div>
      `);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onUpdateOrigin(pos.lat, pos.lng);
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
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      return;
    }

    const { latitude, longitude } = destination;
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createPinIcon('dest', 'E'),
        draggable: true
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-1">
          <div class="text-[10px] uppercase font-bold text-rose-700 tracking-wider">End Sanctuary</div>
          <div class="font-headline font-semibold text-sm text-on-surface mt-0.5">${destination.name || 'Destination'}</div>
          <div class="text-[11px] text-on-surface-variant/80 mt-1">Drag marker to reposition</div>
        </div>
      `);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onUpdateDestination(pos.lat, pos.lng);
      });
      destMarkerRef.current = marker;
    }
  }, [destination]);

  // 4. Auto-fit Origin and Destination bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || routeData) return;

    if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude]
      ]);
      map.fitBounds(bounds, { padding: [80, 80] });
    } else if (origin) {
      map.flyTo([origin.latitude, origin.longitude], 14);
    }
  }, [origin, destination, routeData]);

  // 5. Handle Route Geometry & Pandal Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    pandalMarkersRef.current.forEach(m => map.removeLayer(m));
    pandalMarkersRef.current = [];

    if (!routeData) return;

    // Render Pandal Markers
    const itinerary = routeData.itinerary || [];
    const allPoints = [];

    if (origin) allPoints.push([origin.latitude, origin.longitude]);
    if (destination) allPoints.push([destination.latitude, destination.longitude]);

    itinerary.forEach((item) => {
      const { step, pandal, detour_distance_km } = item;
      const { latitude, longitude } = pandal.location;
      const isSelected = activePandal?.step === step;

      allPoints.push([latitude, longitude]);

      const marker = L.marker([latitude, longitude], {
        icon: createPinIcon('pandal', step, isSelected)
      }).addTo(map);

      const popupHtml = `
        <div class="p-1 min-w-[190px]">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Stop #${step}
            </span>
            <span class="text-[11px] text-on-surface-variant font-medium">
              +${detour_distance_km.toFixed(2)} km detour
            </span>
          </div>
          <h4 class="font-headline font-bold text-[15px] text-on-surface mt-0.5">${pandal.name}</h4>
          <p class="text-xs text-on-surface-variant mt-0.5">${pandal.region || 'Kolkata'} &bull; ${pandal.cluster || 'Cluster'}</p>
          ${pandal.nearest_metro?.name ? `
            <div class="mt-2 text-xs text-secondary font-medium">🚇 Nearest Metro: ${pandal.nearest_metro.name}</div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.step = step;
      marker.pandal = { ...pandal, step, detour_distance_km };

      marker.on('click', () => {
        setActivePandal(marker.pandal);
      });

      pandalMarkersRef.current.push(marker);
    });

    // Fit map to frame all waypoint markers without polyline
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [70, 70] });
    }
  }, [routeData]);

  // 6. Handle Active Pandal fly-to and icon update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    pandalMarkersRef.current.forEach((m) => {
      const isSel = activePandal?.step === m.step;
      m.setIcon(createPinIcon('pandal', m.step, isSel));
    });

    if (activePandal && activePandal.location) {
      map.flyTo([activePandal.location.latitude, activePandal.location.longitude], 16, { duration: 0.8 });
      const targetMarker = pandalMarkersRef.current.find(m => m.step === activePandal.step);
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  }, [activePandal]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    const pts = [];
    if (origin) pts.push([origin.latitude, origin.longitude]);
    if (destination) pts.push([destination.latitude, destination.longitude]);
    pandalMarkersRef.current.forEach(m => pts.push(m.getLatLng()));

    if (pts.length > 0) {
      mapInstanceRef.current?.fitBounds(L.latLngBounds(pts), { padding: [70, 70] });
    } else if (origin) {
      mapInstanceRef.current?.flyTo([origin.latitude, origin.longitude], 14);
    }
  };

  const nextStopName = activePandal?.name || (routeData?.itinerary?.[0]?.pandal?.name) || 'Destination';

  return (
    <main className="relative flex-1 h-full overflow-hidden bg-[#FAF7F2]">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Control HUD (Top Right) */}
      <div className="absolute top-5 right-6 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Layer Filter Pill Strip from Stitch */}
        <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-outline-variant/40 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLayer('density')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeLayer === 'density'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>🛕</span>
            <span>Pandal Density</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('prasad')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeLayer === 'prasad'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>🍲</span>
            <span>Bhog & Prasad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('water')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeLayer === 'water'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span>💧</span>
            <span>Seva Water</span>
          </button>
        </div>

        {/* Micro Cartography Zoom Tools */}
        <div className="flex flex-col bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-lg border border-outline-variant/40 overflow-hidden">
          <button
            type="button"
            onClick={handleResetView}
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/30 text-sm font-bold"
            title="Recenter"
          >
            🧭
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/30 text-lg font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors text-lg font-bold"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* Floating Inspection Quick-Card: Active Waypoint (Stop) */}
      {activePandal && (
        <div className="absolute left-8 top-6 w-80 bg-surface-container-lowest/98 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-outline-variant/60 z-20 transition-all duration-300 pointer-events-auto">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wide uppercase">
                  Active Target
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Stop #{activePandal.step}
                </span>
              </div>
              <h4 className="font-headline text-[17px] text-on-surface font-bold mt-1 leading-snug">
                {activePandal.name}
              </h4>
            </div>
            <button 
              type="button" 
              onClick={() => setActivePandal(null)}
              className="w-6 h-6 rounded-full hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Quick Info */}
          <div className="space-y-1.5 mb-3 bg-surface-container-low/80 p-2.5 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Detour from corridor:</span>
              <span className="font-semibold text-primary font-mono">
                +{activePandal.detour_distance_km ? activePandal.detour_distance_km.toFixed(2) : '--'} km
              </span>
            </div>
            {activePandal.nearest_metro?.name && (
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Nearest Metro:</span>
                <span className="font-semibold text-secondary">
                  🚇 {activePandal.nearest_metro.name}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Cluster Zone:</span>
              <span className="font-semibold text-on-surface">
                {activePandal.region || 'North Kolkata'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                mapInstanceRef.current?.flyTo([activePandal.location.latitude, activePandal.location.longitude], 17);
              }}
              className="flex-1 bg-primary text-white hover:bg-primary-container transition-colors py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Focus Sanctum View</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Telemetry Bar from Stitch */}
      <div className="absolute bottom-5 left-8 right-8 z-20 flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-outline-variant/40 pointer-events-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base shrink-0">
            🚶
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Current Corridor
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-xs text-on-surface-variant">
                {routeData ? `${routeData.total_pandals} sanctum stops planned` : 'Ready to route'}
              </span>
            </div>
            <div className="font-headline text-[15px] text-on-surface font-semibold truncate max-w-md">
              Heading towards: {nextStopName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-2 text-on-surface-variant text-xs">
            <span>🔔</span>
            <span>Temple Bell Resonance: <strong className="text-on-surface">Live Proximity</strong></span>
          </div>
          <div className="h-5 w-px bg-outline-variant/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs font-semibold text-on-surface">Live OSRM Geometry</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="font-headline text-base font-semibold text-primary">
            Calculating sacred pilgrimage route &amp; spatial detours...
          </p>
        </div>
      )}
    </main>
  );
}
