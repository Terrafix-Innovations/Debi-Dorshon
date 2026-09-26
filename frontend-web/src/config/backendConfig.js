/**
 * frontend-web/src/config/backendConfig.js
 * -----------------------------------------
 * Manages active backend endpoint switching between Render (Persistent)
 * and Vercel (Serverless), or Localhost with live health verification.
 */

export const BACKEND_STORAGE_KEY = 'debi_dorshon_active_backend';

export const BACKEND_ENDPOINTS = [
  {
    id: 'render',
    name: 'Render Cloud (Persistent)',
    url: 'https://debi-dorshon.onrender.com',
    badge: 'Recommended',
    type: 'Persistent Container',
    desc: 'Uvicorn server with warm MongoDB connection pool & OSRM routing',
  },
  {
    id: 'vercel',
    name: 'Vercel Serverless',
    url: 'https://debi-dorshon-backend.vercel.app',
    badge: 'Serverless',
    type: 'AWS Lambda / Vercel',
    desc: 'Stateless ASGI function for rapid testing and low latency',
  },
  {
    id: 'local',
    name: 'Local Dev (Localhost)',
    url: 'http://localhost:8000',
    badge: 'Local',
    type: 'Local Machine',
    desc: 'Development server on your local machine (http://localhost:8000)',
  },
];

export function getActiveBackendUrl() {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_BASE_URL || 'https://debi-dorshon.onrender.com';
  }

  const saved = localStorage.getItem(BACKEND_STORAGE_KEY);
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'https://debi-dorshon.onrender.com';
}

export function setActiveBackendUrl(url) {
  if (!url) return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  localStorage.setItem(BACKEND_STORAGE_KEY, cleanUrl);

  // Dispatch event so all components react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('debi_dorshon_backend_change', { detail: { url: cleanUrl } })
    );
  }
}

export async function checkBackendHealth(baseUrl, timeoutMs = 6000) {
  const cleanUrl = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!cleanUrl) return { ok: false, error: 'Empty URL' };

  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanUrl}/api/v1/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        latency,
        status: data.status || 'online',
        database: data.database || 'connected',
        service: data.service || 'API',
      };
    } else {
      return { ok: false, latency, error: `HTTP ${res.status} ${res.statusText}` };
    }
  } catch (err) {
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    return {
      ok: false,
      latency,
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Offline',
    };
  }
}
