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
  maxPandals = 10
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
    max_pandals: maxPandals,
  };

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

export async function fetchMultiStopRoute(stopIds) {
  return getMockMultiStopRoute(stopIds);
}
