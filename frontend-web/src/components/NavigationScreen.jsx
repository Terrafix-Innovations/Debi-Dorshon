import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

const KOLKATA_CENTER = [22.5726, 88.3639]; // [lat, lng] for Leaflet

export default function NavigationScreen({
  apiBaseUrl = 'https://debi-dorshon-backend.vercel.app',
  onNavigateToPandal,
  targetPandal = null,
}) {
  const { toggleFavoritePandal, isFavoritePandal } = useAuth();
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPandal, setSelectedPandal] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Auto-focus target pandal when redirected from Metro / Train or other screens
  useEffect(() => {
    if (targetPandal) {
      setSelectedPandal(targetPandal);
      const lat = targetPandal.location?.latitude ?? targetPandal.lat;
      const lng = targetPandal.location?.longitude ?? targetPandal.lng;
      if (mapInstanceRef.current && typeof lat === 'number' && typeof lng === 'number') {
        mapInstanceRef.current.flyTo([lat, lng], 15.5, { duration: 0.8 });
      }
    }
  }, [targetPandal]);

  // Fetch all pandals from backend
  useEffect(() => {
    let isSubscribed = true;
    async function loadPandals() {
      try {
        const cleanBase = (apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'https://debi-dorshon-backend.vercel.app').trim().replace(/\/+$/, '');
        const res = await fetch(`${cleanBase}/api/v1/pandals/?limit=300`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setPandals(Array.isArray(data) ? data : data.pandals || []);
          }
        }
      } catch (err) {
        console.warn('Failed to load pandals for navigation map:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }
    loadPandals();
    return () => {
      isSubscribed = false;
    };
  }, [apiBaseUrl]);

  // Filter pandals by search term
  const filteredPandals = useMemo(() => {
    if (!searchQuery.trim()) return pandals;
    const q = searchQuery.toLowerCase().trim();
    return pandals.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const zone = (p.zone || p.cluster || p.region || '').toLowerCase();
      const metro = (p.nearest_metro?.name || '').toLowerCase();
      return name.includes(q) || zone.includes(q) || metro.includes(q);
    });
  }, [pandals, searchQuery]);

  // Mappable pandals with valid coordinates
  const mappablePandals = useMemo(() => {
    return filteredPandals.filter((p) => {
      const lat = p.location?.latitude ?? p.lat;
      const lng = p.location?.longitude ?? p.lng;
      return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    });
  }, [filteredPandals]);

  // Initialize Leaflet OpenStreetMap map (100% full screen)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KOLKATA_CENTER,
      zoom: 12.2,
      zoomControl: false,
      attributionControl: true,
    });

    // Canonical OpenStreetMap raster tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    if (targetPandal) {
      const lat = targetPandal.location?.latitude ?? targetPandal.lat;
      const lng = targetPandal.location?.longitude ?? targetPandal.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        map.flyTo([lat, lng], 15.5, { duration: 0.8 });
      }
    }

    mapInstanceRef.current = map;

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

  // Render markers for all mappable pandals
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mappablePandals.forEach((pandal) => {
      const lat = pandal.location?.latitude ?? pandal.lat;
      const lng = pandal.location?.longitude ?? pandal.lng;
      if (!lat || !lng) return;

      const isSelected = selectedPandal && (selectedPandal.id || selectedPandal._id) === (pandal.id || pandal._id);

      const icon = L.divIcon({
        html: `
          <div class="navigation-pandal-marker cursor-pointer ${isSelected ? 'active-pin z-30' : 'z-10'}">
            <div class="pin-pandal ${isSelected ? 'active-pin' : ''}">
              <img src="/pandal_marker.png" alt="${pandal.name}" class="pin-pandal-img" />
            </div>
          </div>
        `,
        className: 'custom-pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPandal(pandal);
        map.flyTo([lat, lng], 14.5, { duration: 0.6 });
      });

      markersRef.current.push(marker);
    });
  }, [mappablePandals, selectedPandal]);

  // If user searches and there are results, fit map bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mappablePandals.length === 0 || !searchQuery) return;

    if (mappablePandals.length === 1) {
      const p = mappablePandals[0];
      const lat = p.location?.latitude ?? p.lat;
      const lng = p.location?.longitude ?? p.lng;
      setSelectedPandal(p);
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    } else if (mappablePandals.length > 1) {
      const bounds = L.latLngBounds(
        mappablePandals
          .map((p) => [p.location?.latitude ?? p.lat, p.location?.longitude ?? p.lng])
          .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number')
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [searchQuery, mappablePandals]);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {/* Sleek Floating Search Bar Only (No extra banners or clutter) */}
      <div className="absolute top-[82px] inset-x-3 sm:inset-x-6 z-20 pointer-events-none max-w-lg mx-auto">
        <div className="pointer-events-auto relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5D2A8] shadow-lg">
          <span className="absolute left-3.5 text-[#8A7B6E] text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pandals by name, metro, or area..."
            className="w-full h-11 pl-10 pr-9 rounded-2xl bg-transparent text-xs sm:text-sm font-semibold text-[#3D241B] placeholder-[#8A7B6E] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[#8A7B6E] hover:text-[#3D241B] text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* The Whole Map (100% Full Screen View) */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

        {/* 4. Selected Pandal Floating Card (Bottom above Tab Bar) */}
        {selectedPandal && (
          <div className="absolute left-3 right-3 sm:left-6 sm:right-auto sm:w-96 bottom-20 bg-white/95 backdrop-blur-md rounded-3xl border border-[#E5D2A8] p-4 shadow-2xl z-30 animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#8E1B1B]">
                  <span>🛕</span>
                  <span className="uppercase tracking-wider truncate">
                    {selectedPandal.cluster || selectedPandal.region || 'Kolkata'}
                  </span>
                </div>
                <h3 className="font-extrabold text-[16px] text-[#2B1608] mt-0.5 leading-snug">
                  {selectedPandal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => toggleFavoritePandal(selectedPandal)}
                className="p-1.5 rounded-full hover:bg-rose-50 text-rose-600 text-lg hover:scale-110 active:scale-95 transition-transform"
                title="Favorite"
              >
                {isFavoritePandal(selectedPandal) ? '❤️' : '🤍'}
              </button>
            </div>

            {selectedPandal.nearest_metro?.name && (
              <div className="mt-2.5 text-xs font-semibold text-indigo-800 flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1.5 rounded-xl">
                <span>🚇</span>
                <span className="font-bold">Nearest Metro: {selectedPandal.nearest_metro.name}</span>
                {selectedPandal.nearest_metro.distance && (
                  <span className="text-stone-500 font-medium ml-auto">
                    ({selectedPandal.nearest_metro.distance})
                  </span>
                )}
              </div>
            )}

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToPandal?.(selectedPandal)}
                className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-[#8E1B1B] to-[#771313] hover:from-[#9E2020] hover:to-[#871818] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <span>Directions / Plan Route</span>
                <span className="text-[#F4D388] font-bold">→</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPandal(null)}
                className="px-3 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold active:scale-95 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
