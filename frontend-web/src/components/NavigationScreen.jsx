import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { useAuth } from '../context/AuthContext';
import { getPandalPointerSvg, getClusterPointerSvg } from '../utils/mapPointers';

const KOLKATA_CENTER = [88.3639, 22.5726]; // [lng, lat] for MapLibre
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

let globalPandalsCache = null;
let globalPandalsPromise = null;

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
  const [is3DMode, setIs3DMode] = useState(true);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const superclusterRef = useRef(new Supercluster({ radius: 60, maxZoom: 14 }));
  
  const selectedPandalRef = useRef(selectedPandal);
  useEffect(() => {
    selectedPandalRef.current = selectedPandal;
  }, [selectedPandal]);

  const is3DModeRef = useRef(is3DMode);
  useEffect(() => {
    is3DModeRef.current = is3DMode;
  }, [is3DMode]);

  const updateMarkersRef = useRef(() => {});

  updateMarkersRef.current = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    // In case map bounds are not valid yet
    if (!bounds) return;
    
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const zoom = Math.floor(map.getZoom());

    const clusters = superclusterRef.current.getClusters(bbox, zoom);
    const newMarkersMap = {};

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;
      const id = isCluster ? `cluster-${cluster.properties.cluster_id}` : `point-${cluster.properties.pandalId}`;
      newMarkersMap[id] = cluster;
    });

    // Remove old markers that are not in the new list
    Object.keys(markersRef.current).forEach((id) => {
      if (!newMarkersMap[id]) {
        markersRef.current[id].marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    Object.keys(newMarkersMap).forEach((id) => {
      const cluster = newMarkersMap[id];
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;

      if (!markersRef.current[id]) {
        // Create new marker
        const el = document.createElement('div');

        if (isCluster) {
          const count = cluster.properties.point_count;
          el.className = 'cursor-pointer z-20 flex items-center justify-center transition-all hover:scale-110';
          el.innerHTML = getClusterPointerSvg(count);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const expansionZoom = superclusterRef.current.getClusterExpansionZoom(cluster.properties.cluster_id);
            map.flyTo({
              center: [lng, lat],
              zoom: expansionZoom,
              essential: true,
            });
          });
        } else {
          const pandal = cluster.properties.pandal;
          const isSelected =
            selectedPandalRef.current &&
            (selectedPandalRef.current.id || selectedPandalRef.current._id) === (pandal.id || pandal._id);
          
          el.className = `vector-pin-container cursor-pointer ${isSelected ? 'active-pin z-30' : 'z-10'}`;
          el.innerHTML = getPandalPointerSvg(isSelected);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedPandal(pandal);
            map.flyTo({
              center: [lng, lat],
              zoom: 15.5,
              pitch: is3DModeRef.current ? 45 : 0,
              duration: 800,
              essential: true,
            });
          });
        }

        const marker = new maplibregl.Marker({ element: el, anchor: isCluster ? 'center' : 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);

        const pandalId = isCluster ? null : (cluster.properties.pandal.id || cluster.properties.pandal._id);
        const isSelected = !isCluster && (selectedPandalRef.current && (selectedPandalRef.current.id || selectedPandalRef.current._id) === pandalId);

        markersRef.current[id] = { 
          marker, 
          el, 
          isCluster, 
          pandal: cluster.properties.pandal, 
          isSelected 
        };
      } else {
        // Marker exists, update state if it's a point
        if (!isCluster) {
          const pandal = cluster.properties.pandal;
          const isSelected =
            selectedPandalRef.current &&
            (selectedPandalRef.current.id || selectedPandalRef.current._id) === (pandal.id || pandal._id);
          
          const item = markersRef.current[id];
          if (item.isSelected !== isSelected) {
            item.el.className = `vector-pin-container cursor-pointer ${isSelected ? 'active-pin z-30' : 'z-10'}`;
            item.el.innerHTML = getPandalPointerSvg(isSelected);
            item.isSelected = isSelected;
          }
        }
      }
    });
  };

  // Auto-focus target pandal when redirected from Metro / Train or other screens
  useEffect(() => {
    if (targetPandal) {
      setSelectedPandal(targetPandal);
      const lat = targetPandal.location?.latitude ?? targetPandal.lat;
      const lng = targetPandal.location?.longitude ?? targetPandal.lng;
      if (mapInstanceRef.current && typeof lat === 'number' && typeof lng === 'number') {
        mapInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 15.5,
          pitch: 45,
          duration: 1000,
          essential: true,
        });
      }
    }
  }, [targetPandal]);

  // Fetch all pandals from backend
  useEffect(() => {
    let isSubscribed = true;
    async function loadPandals() {
      if (globalPandalsCache) {
        setPandals(globalPandalsCache);
        if (isSubscribed) setLoading(false);
        return;
      }
      try {
        if (!globalPandalsPromise) {
          const cleanBase = (apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'https://debi-dorshon-backend.vercel.app').trim().replace(/\/+$/, '');
          globalPandalsPromise = fetch(`${cleanBase}/api/v1/pandals/?limit=300`).then(res => res.json());
        }
        const data = await globalPandalsPromise;
        const result = Array.isArray(data) ? data : data.pandals || [];
        globalPandalsCache = result;
        if (isSubscribed) {
          setPandals(result);
        }
      } catch (err) {
        console.warn('Failed to load pandals for navigation map:', err);
        globalPandalsPromise = null; // Reset on error to allow retry
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

  // Toggle 3D perspective
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

  // Initialize MapLibre GL JS Map (100% full screen)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPENFREEMAP_STYLE,
      center: KOLKATA_CENTER,
      zoom: 12.2,
      pitch: 35,
      bearing: 0,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // Add 3D building extrusions if available in style
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

      if (targetPandal) {
        const lat = targetPandal.location?.latitude ?? targetPandal.lat;
        const lng = targetPandal.location?.longitude ?? targetPandal.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          map.flyTo({ center: [lng, lat], zoom: 15.5, pitch: 45, duration: 900 });
        }
      }
    });

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      if (updateMarkersRef.current) updateMarkersRef.current();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    
    map.on('move', () => {
      if (updateMarkersRef.current) updateMarkersRef.current();
    });

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load data into supercluster and trigger initial render
  useEffect(() => {
    const points = mappablePandals.map((p) => {
      const lat = p.location?.latitude ?? p.lat;
      const lng = p.location?.longitude ?? p.lng;
      return {
        type: 'Feature',
        properties: {
          cluster: false,
          pandalId: p.id || p._id,
          pandal: p,
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      };
    });
    
    superclusterRef.current.load(points);
    if (mapInstanceRef.current) {
      updateMarkersRef.current();
    }
  }, [mappablePandals]);

  // Update marker selection state dynamically when selectedPandal changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkersRef.current();
    }
  }, [selectedPandal]);
  // If user searches and there are results, fit map bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mappablePandals.length === 0 || !searchQuery) return;

    if (mappablePandals.length === 1) {
      const p = mappablePandals[0];
      const lat = p.location?.latitude ?? p.lat;
      const lng = p.location?.longitude ?? p.lng;
      setSelectedPandal(p);
      map.flyTo({ center: [lng, lat], zoom: 15.5, pitch: is3DMode ? 40 : 0, duration: 800 });
    } else if (mappablePandals.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      mappablePandals.forEach((p) => {
        const lat = p.location?.latitude ?? p.lat;
        const lng = p.location?.longitude ?? p.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          bounds.extend([lng, lat]);
        }
      });
      map.fitBounds(bounds, { padding: 90, maxZoom: 15, pitch: is3DMode ? 35 : 0, duration: 1000 });
    }
  }, [searchQuery, mappablePandals, is3DMode]);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {/* Sleek Floating Search Bar with Autocomplete Dropdown */}
      <div className="absolute top-[82px] inset-x-3 sm:inset-x-6 z-40 pointer-events-none max-w-lg mx-auto flex flex-col gap-2">
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

        {/* Autocomplete Dropdown */}
        {searchQuery && (
          <div className="pointer-events-auto bg-[#fffdf9] border border-[#ebdcc9] rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-[#ebdcc9]/40 animate-fade-in">
            {filteredPandals.length === 0 ? (
              <div className="p-4 text-xs text-stone-500 font-medium text-center">No pandals found</div>
            ) : (
              filteredPandals.slice(0, 8).map((pandal, idx) => (
                <div
                  key={pandal.id || pandal._id || idx}
                  onClick={() => {
                    setSelectedPandal(pandal);
                    setSearchQuery(''); // Clear search to show all pins, but keep focus on selected
                    const map = mapInstanceRef.current;
                    const lat = pandal.location?.latitude ?? pandal.lat;
                    const lng = pandal.location?.longitude ?? pandal.lng;
                    if (map && typeof lat === 'number' && typeof lng === 'number') {
                      map.flyTo({ center: [lng, lat], zoom: 15.5, pitch: is3DMode ? 45 : 0, duration: 800 });
                    }
                  }}
                  className="p-3 px-4 cursor-pointer transition-colors hover:bg-[#f5ede0] flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#8E1B1B]/10 text-[#8E1B1B]">
                        🛕 Pandal
                      </span>
                      <span className="font-bold text-[13px] text-[#2d1b18] truncate group-hover:text-[#8E1B1B] transition-colors">{pandal.name}</span>
                    </div>
                    <div className="text-[11px] text-[#765C51] truncate mt-1.5 font-medium flex items-center gap-1.5">
                      <span>{pandal.cluster || pandal.region || 'Kolkata'}</span>
                      {pandal.nearest_metro?.name && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-indigo-700">🚇 {pandal.nearest_metro.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* The Whole Map (100% Full Screen View) */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

        {/* Floating 3D / 2D Perspective Toggle Button */}
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
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
