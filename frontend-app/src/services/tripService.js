import apiClient from './apiClient';
import { API_BASE_URL, API_HOST_CANDIDATES, API_ENDPOINTS } from '../config/env';

function extractErrorInfo(error, targetPath) {
  const code = error?.response?.status
    ? `HTTP ${error.response.status}`
    : error?.code || 'ERR_NETWORK';

  let summary = `Failed to connect to backend server at ${API_BASE_URL}`;
  if (error?.response?.data?.message) {
    summary = error.response.data.message;
  } else if (error?.message) {
    summary = error.message;
  }

  return { code, summary, url: `${API_BASE_URL}${targetPath}` };
}

// POST /api/v1/trip/plan
// Payload:
// {
//   "origin_latitude": 22.5986,
//   "origin_longitude": 88.3712,
//   "region": "North",
//   "cluster": "Shyambazar",
//   "max_pandals": 5
// }
export async function fetchTripPlanApi(payload) {
  const path = API_ENDPOINTS.TRIP_PLAN;
  const postBody = {
    origin_latitude: payload.origin_latitude || 22.5986,
    origin_longitude: payload.origin_longitude || 88.3712,
    region: payload.region || 'North',
    cluster: payload.cluster || 'Shyambazar',
    max_pandals: 5,
  };

  let lastError = null;

  for (const host of API_HOST_CANDIDATES) {
    const fullUrl = `${host}${path}`;

    // 1. Try native fetch with POST method
    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(postBody),
      });

      if (res.ok) {
        const json = await res.json();
        console.log(`[DebiDorshon API Response] POST ${fullUrl}:`, JSON.stringify(json, null, 2));
        return { success: true, data: json, url: fullUrl };
      } else {
        lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      lastError = err;
    }

    // 2. Try axios instance
    try {
      const { data } = await apiClient.post(`${host}${path}`, postBody);
      console.log(`[DebiDorshon API Response] POST ${fullUrl}:`, JSON.stringify(data, null, 2));
      return { success: true, data, url: fullUrl };
    } catch (err) {
      lastError = err;
    }
  }

  console.warn(`[TripService] POST ${path} failed across all candidate hosts:`, lastError);
  return { success: false, error: extractErrorInfo(lastError, path) };
}
