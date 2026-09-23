import apiClient from './apiClient';
import { API_BASE_URL, API_HOST_CANDIDATES, API_ENDPOINTS } from '../config/env';

// Fallback dummy stations for Metro
const FALLBACK_METRO_STATIONS = [
  { name: 'Kalighat', line: 'Blue', pandal_count: 18 },
  { name: 'Shyambazar', line: 'Blue', pandal_count: 15 },
  { name: 'Behala Bazar', line: 'Purple', pandal_count: 8 },
  { name: 'Rabindra Sarobar', line: 'Blue', pandal_count: 7 },
  { name: 'Sovabazar-Sutanuti', line: 'Blue', pandal_count: 7 },
  { name: 'Netaji Bhavan', line: 'Blue', pandal_count: 6 },
  { name: 'Jessore Road', line: 'Yellow', pandal_count: 5 },
  { name: 'Belgachhia', line: 'Blue', pandal_count: 4 },
  { name: 'Girish Park', line: 'Blue', pandal_count: 4 },
  { name: 'Hemanta Mukhopadhyay', line: 'Orange', pandal_count: 4 },
  { name: 'Jatin Das Park', line: 'Blue', pandal_count: 3 },
  { name: 'Netaji', line: 'Blue', pandal_count: 3 },
  { name: 'Taratala', line: 'Purple', pandal_count: 3 },
  { name: 'Sakher Bazar', line: 'Purple', pandal_count: 2 },
  { name: 'Gitanjali', line: 'Blue', pandal_count: 1 },
  { name: 'Kavi Nazrul', line: 'Blue', pandal_count: 1 },
  { name: 'Noapara', line: 'Blue', pandal_count: 1 },
];

// Fallback dummy stations for Train
const FALLBACK_TRAIN_STATIONS = [
  { name: 'Howrah Junction', line: 'Eastern Railway', pandal_count: 14 },
  { name: 'Sealdah Junction', line: 'Eastern Railway', pandal_count: 12 },
  { name: 'Bidhannagar Road', line: 'Eastern Railway', pandal_count: 8 },
  { name: 'Dum Dum Junction', line: 'Eastern Railway', pandal_count: 7 },
  { name: 'Majerhat', line: 'Circular Railway', pandal_count: 5 },
  { name: 'Ballygunge Junction', line: 'Eastern Railway', pandal_count: 6 },
  { name: 'Shalimar', line: 'South Eastern Railway', pandal_count: 4 },
  { name: 'Kolkata Terminal', line: 'Eastern Railway', pandal_count: 4 },
];

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

// Universal fetch helper trying fetch & axios across candidate hosts
async function requestEndpoint(path, params = null) {
  let queryString = '';
  if (params && Object.keys(params).length > 0) {
    const q = new URLSearchParams(params).toString();
    queryString = `?${q}`;
  }

  let lastError = null;

  for (const host of API_HOST_CANDIDATES) {
    const fullUrl = `${host}${path}${queryString}`;

    // 1. Try native fetch API first
    try {
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        console.log(`[DebiDorshon API Response] GET ${fullUrl}:`, JSON.stringify(json, null, 2));
        return { success: true, data: json, url: fullUrl };
      } else {
        lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      lastError = err;
    }

    // 2. Try axios instance
    try {
      const { data } = await apiClient.get(`${host}${path}`, { params });
      console.log(`[DebiDorshon API Response] GET ${fullUrl}:`, JSON.stringify(data, null, 2));
      return { success: true, data, url: fullUrl };
    } catch (err) {
      lastError = err;
    }
  }

  return { success: false, error: extractErrorInfo(lastError, path) };
}

// GET /api/v1/transit/metro/stations
export async function fetchMetroStationsApi() {
  const res = await requestEndpoint(API_ENDPOINTS.METRO_STATIONS);
  if (res.success) {
    return { success: true, data: res.data };
  }
  console.warn('[StationService] Metro stations fetch failed across all hosts:', res.error);
  return { success: false, error: res.error, data: FALLBACK_METRO_STATIONS };
}

// GET /api/v1/transit/train/stations
export async function fetchTrainStationsApi() {
  const res = await requestEndpoint(API_ENDPOINTS.TRAIN_STATIONS);
  if (res.success) {
    return { success: true, data: res.data };
  }
  console.warn('[StationService] Train stations fetch failed across all hosts:', res.error);
  return { success: false, error: res.error, data: FALLBACK_TRAIN_STATIONS };
}

// GET /api/v1/transit/metro/pandals?station_name=<Drop-down select>
export async function fetchMetroPandalsApi(stationName) {
  const res = await requestEndpoint(API_ENDPOINTS.METRO_PANDALS, { station_name: stationName });
  if (res.success) {
    return { success: true, data: res.data };
  }
  console.warn('[StationService] Metro pandals fetch failed across all hosts:', res.error);
  return {
    success: false,
    error: res.error,
    data: {
      station_name: stationName,
      total_pandals: 3,
      pandals: [
        {
          _id: 'p1',
          name: 'Badamtala Asar Sanagha',
          region: 'South',
          cluster: 'Hajra-Kalighat',
          location: { latitude: 22.5179668, longitude: 88.3437245 },
          nearest_metro: { name: stationName, line: 'Blue' },
        },
        {
          _id: 'p2',
          name: 'Mudiali Club',
          region: 'South',
          cluster: 'Southern Avenue',
          location: { latitude: 22.5098, longitude: 88.349 },
          nearest_metro: { name: stationName, line: 'Blue' },
        },
        {
          _id: 'p3',
          name: 'Tridhara Sammilani',
          region: 'South',
          cluster: 'Manoharpukur',
          location: { latitude: 22.5225, longitude: 88.362 },
          nearest_metro: { name: stationName, line: 'Blue' },
        },
      ],
    },
  };
}

// GET /api/v1/transit/train/pandals?station_name=<Drop-down select>
export async function fetchTrainPandalsApi(stationName) {
  const res = await requestEndpoint(API_ENDPOINTS.TRAIN_PANDALS, { station_name: stationName });
  if (res.success) {
    return { success: true, data: res.data };
  }
  console.warn('[StationService] Train pandals fetch failed across all hosts:', res.error);
  return {
    success: false,
    error: res.error,
    data: {
      station_name: stationName,
      total_pandals: 3,
      pandals: [
        {
          _id: 'tp1',
          name: 'College Square Sarbojanin',
          region: 'Central',
          cluster: 'College Street',
          location: { latitude: 22.5746, longitude: 88.3638 },
          nearest_metro: { name: stationName, line: 'Eastern Railway' },
        },
        {
          _id: 'tp2',
          name: 'Mohammad Ali Park',
          region: 'Central',
          cluster: 'MG Road',
          location: { latitude: 22.5768, longitude: 88.3601 },
          nearest_metro: { name: stationName, line: 'Eastern Railway' },
        },
        {
          _id: 'tp3',
          name: 'Sree Bhumi Sporting Club',
          region: 'North',
          cluster: 'Lake Town',
          location: { latitude: 22.6022, longitude: 88.3985 },
          nearest_metro: { name: stationName, line: 'Eastern Railway' },
        },
      ],
    },
  };
}
