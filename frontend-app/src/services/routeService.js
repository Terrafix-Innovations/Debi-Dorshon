import apiClient from './apiClient';
import { API_BASE_URL, API_HOST_CANDIDATES, API_ENDPOINTS } from '../config/env';
import {
  getMockMultiStopRoute,
  buildMockRouteResponse,
  MOCK_PANDALS,
} from '../data/mockData';

/**
 * Plan road route between Origin and Destination using backend POST /api/v1/route/plan
 * Fallback to mock route if backend is unavailable.
 */
export async function fetchRoutePlan(
  origin,
  destination,
  maxDetourKm = 1.0,
  maxPandals = null
) {
  if (!origin || !destination) return null;

  const payload = {
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
    },
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    max_detour_km: maxDetourKm,
  };

  // Only cap the number of pandals when the caller explicitly asks for a limit.
  // Otherwise omit max_pandals so the backend returns ALL pandals in the corridor.
  if (maxPandals != null) {
    payload.max_pandals = maxPandals;
  }

  const path = API_ENDPOINTS.ROUTE_PLAN || '/api/v1/route/plan';

  for (const host of API_HOST_CANDIDATES) {
    const fullUrl = `${host}${path}`;

    // 1. Try native fetch API
    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return normalizeRoutePlanResponse(data, origin, destination);
      }
    } catch (err) {
      // Continue to next candidate host
    }

    // 2. Try axios client
    try {
      const { data } = await apiClient.post(`${host}${path}`, payload);
      if (data) {
        return normalizeRoutePlanResponse(data, origin, destination);
      }
    } catch (err) {
      // Continue to next candidate host
    }
  }

  // Graceful Fallback if backend server is unreachable
  console.warn('[routeService] Backend route calculation failed across all hosts, using fallback mock.');
  return getMockRouteFallback(origin, destination);
}

/**
 * Helper to normalize backend RoutePlanResponse
 */
function normalizeRoutePlanResponse(data, origin, destination) {
  let path = [];
  if (data.route_geometry?.coordinates) {
    path = data.route_geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
      lat,
      lng,
    }));
  }

  const itinerary = (data.itinerary || []).map((item) => {
    const p = item.pandal;
    return {
      step: item.step,
      detour_distance_km: item.detour_distance_km,
      route_progress_ratio: item.route_progress_ratio,
      pandal: {
        ...p,
        lat: p.location?.latitude ?? p.lat,
        lng: p.location?.longitude ?? p.lng,
      },
    };
  });

  const distanceKm = data.estimated_distance_km || 0;
  const durationMin = Math.round((distanceKm || 1) * 3.5 + 5);

  return {
    source: origin,
    destination: destination,
    path,
    itinerary,
    distanceKm,
    durationMin,
    totalPandals: data.total_pandals || itinerary.length,
    maxDetourKm: data.max_detour_km,
  };
}

/**
 * Mock route generator for offline fallback
 */
function getMockRouteFallback(origin, destination) {
  const mockRes = buildMockRouteResponse(
    { name: origin.name, lat: origin.latitude, lng: origin.longitude, _id: 'orig' },
    { name: destination.name, lat: destination.latitude, lng: destination.longitude, _id: 'dest' },
    MOCK_PANDALS
  );

  const itinerary = (mockRes.checkpoints || []).map((cp, idx) => ({
    step: idx + 1,
    detour_distance_km: 0.3 + idx * 0.25,
    pandal: {
      ...cp,
      name: cp.name,
      location: { latitude: cp.lat, longitude: cp.lng },
    },
  }));

  return {
    source: origin,
    destination: destination,
    path: mockRes.path.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    itinerary,
    distanceKm: mockRes.distanceKm,
    durationMin: mockRes.durationMin,
    totalPandals: itinerary.length,
  };
}

export async function fetchMapConfig() {
  const path = '/api/v1/route/config';
  for (const host of API_HOST_CANDIDATES) {
    try {
      const res = await fetch(`${host}${path}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
  }
  return { mapbox_configured: false, default_center: [88.375, 22.595], default_zoom: 13 };
}

export async function fetchAutocompletePlaces(query, limit = 6) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  const path = `/api/v1/route/autocomplete?q=${encodeURIComponent(trimmed)}&limit=${limit}`;

  for (const host of API_HOST_CANDIDATES) {
    try {
      const res = await fetch(`${host}${path}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {}
  }

  // Fallback 1: Search local MOCK_PANDALS and MOCK_METRO_STATIONS
  const cleanQ = trimmed.toLowerCase();
  const results = [];
  const seen = new Set();

  MOCK_PANDALS.forEach((p) => {
    if (results.length >= limit) return;
    if (p.name && p.name.toLowerCase().includes(cleanQ)) {
      const lat = p.location?.latitude || p.lat;
      const lng = p.location?.longitude || p.lng;
      const key = `${lat}_${lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.append?.({
          id: p._id || p.id,
          title: p.name,
          subtitle: `${p.region || 'Kolkata'} • ${p.cluster || 'Pandals'}`,
          latitude: lat,
          longitude: lng,
          category: 'pandal',
          badge: '🛕 Pandal',
        }) || results.push({
          id: p._id || p.id,
          title: p.name,
          subtitle: `${p.region || 'Kolkata'} • ${p.cluster || 'Pandals'}`,
          latitude: lat,
          longitude: lng,
          category: 'pandal',
          badge: '🛕 Pandal',
        });
      }
    }
  });

  if (results.length >= limit) return results;

  // Fallback 2: Photon Geocoder
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=22.5726&lon=88.3639&limit=5`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      (data.features || []).forEach((f) => {
        const coords = f.geometry?.coordinates;
        if (coords && coords.length === 2) {
          const lng = coords[0];
          const lat = coords[1];
          const name = f.properties?.name || f.properties?.street || trimmed;
          const key = `${lat}_${lng}`;
          if (!seen.has(key)) {
            seen.add(key);
            const isMetro = name.toLowerCase().includes('metro');
            results.push({
              id: `photon_${f.properties?.osm_id || Math.random()}`,
              title: name,
              subtitle: f.properties?.city || f.properties?.state || 'Kolkata Region',
              latitude: lat,
              longitude: lng,
              category: isMetro ? 'metro' : 'place',
              badge: isMetro ? '🚇 Metro' : '📍 Place',
            });
          }
        }
      });
    }
  } catch (e) {}

  return results.slice(0, limit);
}

export async function fetchMultiStopRoute(stopIds) {
  return getMockMultiStopRoute(stopIds);
}
