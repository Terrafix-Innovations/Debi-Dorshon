import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/env';
import { getMockPandals, getMockPandalRoute } from '../data/mockData';

// GET /api/v1/pandals/
// Returns normalized pandals with both location { latitude, longitude } and lat/lng properties
export async function fetchPandals(params = {}) {
  try {
    const res = await apiClient.get(API_ENDPOINTS.PANDALS, { params });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((p) => ({
        ...p,
        lat: p.location?.latitude ?? p.lat,
        lng: p.location?.longitude ?? p.lng,
      }));
    }
  } catch (err) {
    console.warn('[pandalService] fetchPandals backend fetch failed, using fallback:', err?.message);
  }
  return getMockPandals();
}

// Plan route between source and destination using POST /api/v1/route/plan
export async function fetchPandalRoute(sourceId, destinationId, mode = 'walking') {
  try {
    const pandals = await fetchPandals();
    const source = pandals.find((p) => p._id === sourceId || p.id === sourceId);
    const destination = pandals.find((p) => p._id === destinationId || p.id === destinationId);

    if (source && destination) {
      const srcLat = source.lat || source.location?.latitude;
      const srcLng = source.lng || source.location?.longitude;
      const dstLat = destination.lat || destination.location?.latitude;
      const dstLng = destination.lng || destination.location?.longitude;

      if (srcLat && srcLng && dstLat && dstLng) {
        const payload = {
          origin: { latitude: srcLat, longitude: srcLng },
          destination: { latitude: dstLat, longitude: dstLng },
          max_detour_km: 1.0,
          max_pandals: 10,
        };

        const { data } = await apiClient.post(API_ENDPOINTS.ROUTE_PLAN, payload);

        if (data && data.route_geometry?.coordinates) {
          const path = data.route_geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
          const checkpoints = (data.itinerary || []).map((item) => ({
            _id: item.pandal._id || item.pandal.id,
            name: item.pandal.name,
            lat: item.pandal.location?.latitude ?? item.pandal.lat,
            lng: item.pandal.location?.longitude ?? item.pandal.lng,
            detour_distance_km: item.detour_distance_km,
          }));

          return {
            source: { _id: source._id, name: source.name, lat: srcLat, lng: srcLng },
            destination: { _id: destination._id, name: destination.name, lat: dstLat, lng: dstLng },
            checkpoints,
            path,
            distanceKm: data.estimated_distance_km || 0,
            durationMin: Math.round((data.estimated_distance_km || 1) * 12),
          };
        }
      }
    }
  } catch (err) {
    console.warn('[pandalService] fetchPandalRoute backend failed, using mock route:', err?.message);
  }

  return getMockPandalRoute(sourceId, destinationId, mode);
}
