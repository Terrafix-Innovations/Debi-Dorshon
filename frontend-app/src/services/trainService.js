import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/env';
import { getMockTrainStations, getMockTrainRoute, MOCK_TRAIN_STATIONS } from '../data/mockData';

// GET /api/v1/transit/train/stations
export async function fetchTrainStations() {
  try {
    const res = await apiClient.get(API_ENDPOINTS.TRAIN_STATIONS);
    const liveStations = Array.isArray(res.data) ? res.data : [];

    // Create a map of live stations for quick lookup
    const liveMap = new Map(
      liveStations.map((s) => [s.name.toLowerCase(), s])
    );

    // Combine MOCK_TRAIN_STATIONS with any extra live stations not in mocks
    const combined = MOCK_TRAIN_STATIONS.map((mockStation) => {
      const live = liveMap.get(mockStation.name.toLowerCase());
      if (live) {
        liveMap.delete(mockStation.name.toLowerCase()); // Marked as handled
      }
      return {
        ...mockStation,
        pandal_count: live?.pandal_count || 0,
      };
    });

    // Add remaining live stations that weren't in mocks
    liveMap.forEach((live, name) => {
      combined.push({
        _id: `t_live_${combined.length + 1}`,
        name: live.name,
        nameBn: live.name, // Fallback
        zone: 'Railway Network',
        pandal_count: live.pandal_count || 0,
        lat: 22.5839, // Generic Kolkata
        lng: 88.3426,
      });
    });

    return combined;
  } catch (err) {
    console.warn('[trainService] fetchTrainStations backend failed, using mock data:', err?.message);
  }
  return getMockTrainStations();
}

// GET /api/v1/transit/train/pandals
export async function fetchPandalsByTrain(stationName) {
  try {
    const params = { station_name: stationName };
    const res = await apiClient.get(API_ENDPOINTS.TRAIN_PANDALS || '/transit/train/pandals', { params });
    if (res.data && res.data.pandals) {
      return res.data.pandals;
    }
  } catch (err) {
    console.warn('[trainService] fetchPandalsByTrain failed:', err?.message);
  }
  return [];
}
