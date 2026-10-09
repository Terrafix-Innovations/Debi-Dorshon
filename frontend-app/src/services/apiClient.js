import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// In-memory cache for GET requests
const getCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercept requests to check cache
apiClient.interceptors.request.use(config => {
  if (config.method.toLowerCase() === 'get') {
    const key = config.url + JSON.stringify(config.params || {});
    const cached = getCache.get(key);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      // Abort the request but attach the cached data to the config
      // to be handled in the response interceptor or error handler
      config.cancelToken = new axios.CancelToken(cancel => cancel('CACHED'));
      config.cachedData = cached.data;
    }
  }
  return config;
}, error => Promise.reject(error));

// Intercept responses to store cache
apiClient.interceptors.response.use(response => {
  if (response.config.method.toLowerCase() === 'get') {
    const key = response.config.url + JSON.stringify(response.config.params || {});
    getCache.set(key, { data: response.data, timestamp: Date.now() });
  }
  return response;
}, error => {
  if (axios.isCancel(error) && error.message === 'CACHED') {
    // Return the cached data as a successful response
    return Promise.resolve({
      data: error.config.cachedData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: error.config,
      request: {}
    });
  }
  return Promise.reject(error);
});

export default apiClient;
