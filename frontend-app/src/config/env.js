import { Platform } from 'react-native';

// Resolve default host based on runtime platform if env variable is not set
// The pre-start script (scripts/update-ip.js) auto-detects the local IP
// and writes it to .env, so this fallback is only for edge cases.
const defaultHost =
  Platform.OS === 'web'
    ? 'http://localhost:8000'
    : 'http://10.0.2.2:8000'; // Android emulator fallback

// Primary API Base URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || defaultHost;

// Candidate hosts for network fallback resolution
export const API_HOST_CANDIDATES = [
  process.env.EXPO_PUBLIC_API_BASE_URL,
  defaultHost,
  process.env.EXPO_PUBLIC_API_URL_LOCALHOST || 'http://localhost:8000',
  process.env.EXPO_PUBLIC_API_URL_EMULATOR || 'http://10.0.2.2:8000',
  process.env.EXPO_PUBLIC_API_URL_LOOPBACK || 'http://127.0.0.1:8000',
].filter((url, idx, arr) => Boolean(url) && arr.indexOf(url) === idx);

// Centralized API Endpoints
export const API_ENDPOINTS = {
  HEALTH: process.env.EXPO_PUBLIC_ENDPOINT_HEALTH || '/api/v1/health',
  PANDALS: process.env.EXPO_PUBLIC_ENDPOINT_PANDALS || '/api/v1/pandals/',
  METRO_STATIONS:
    process.env.EXPO_PUBLIC_ENDPOINT_METRO_STATIONS || '/api/v1/transit/metro/stations',
  METRO_PANDALS:
    process.env.EXPO_PUBLIC_ENDPOINT_METRO_PANDALS || '/api/v1/transit/metro/pandals',
  TRAIN_STATIONS:
    process.env.EXPO_PUBLIC_ENDPOINT_TRAIN_STATIONS || '/api/v1/transit/train/stations',
  TRAIN_PANDALS:
    process.env.EXPO_PUBLIC_ENDPOINT_TRAIN_PANDALS || '/api/v1/transit/train/pandals',
  TRIP_PLAN: process.env.EXPO_PUBLIC_ENDPOINT_TRIP_PLAN || '/api/v1/trip/plan',
  ROUTE_PLAN: process.env.EXPO_PUBLIC_ENDPOINT_ROUTE_PLAN || '/api/v1/route/plan',
};
