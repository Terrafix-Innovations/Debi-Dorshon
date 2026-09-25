import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'debi_dorshon_token';
const USER_KEY = 'debi_dorshon_user';
const FAVORITES_KEY = 'debi_dorshon_favorites';
const SAVED_TRIPS_KEY = 'debi_dorshon_saved_trips';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_TRIPS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(null);

  // 1. Fetch public auth config dynamically from Render backend
  useEffect(() => {
    let isMounted = true;
    async function loadAuthConfig() {
      try {
        const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/api/v1/auth/config`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.google_client_id) {
            setGoogleClientId(data.google_client_id);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to load auth config:', err.message);
      }
    }
    loadAuthConfig();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch authenticated user profile on app load if token exists
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const profile = await res.json();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to restore session:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    restoreSession();
    return () => { isMounted = false; };
  }, [token]);

  // 3. Login with Google ID Token (with retry for sleeping cloud backend)
  const loginWithGoogleToken = useCallback(async (idToken) => {
    const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`${cleanUrl}/api/v1/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({ detail: 'Login failed' }));
          throw new Error(errJson.detail || 'Authentication failed');
        }

        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
      } catch (err) {
        lastError = err;
        // If network error (Failed to fetch) and first attempt, wait 1.5s and retry once
        if (attempt < 2 && (err.name === 'TypeError' || String(err.message).includes('fetch'))) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }, []);

  // 4. Sign in with Email & Password
  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
        throw new Error(errJson.detail || 'Sign in failed');
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('[AuthContext] Email login error:', err);
      throw err;
    }
  }, []);

  // 5. Sign up with Email & Password
  const registerWithEmail = useCallback(async (email, password, name) => {
    try {
      const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errJson.detail || 'Sign up failed');
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('[AuthContext] Email register error:', err);
      throw err;
    }
  }, []);

  // 6. Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // 7. Favorite pandals management
  const toggleFavoritePandal = useCallback((pandal) => {
    if (!pandal) return;
    setFavorites((prev) => {
      const pandalId = pandal.id || pandal._id || pandal.name;
      const exists = prev.some((p) => (p.id || p._id || p.name) === pandalId);
      let updated;
      if (exists) {
        updated = prev.filter((p) => (p.id || p._id || p.name) !== pandalId);
      } else {
        updated = [...prev, pandal];
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavoritePandal = useCallback((pandal) => {
    if (!pandal) return false;
    const pandalId = pandal.id || pandal._id || pandal.name;
    return favorites.some((p) => (p.id || p._id || p.name) === pandalId);
  }, [favorites]);

  // 8. Saved routes management
  const saveTrip = useCallback((trip) => {
    if (!trip) return;
    setSavedTrips((prev) => {
      const newTrip = {
        id: `trip_${Date.now()}`,
        name: trip.name || 'Puja Parikrama Route',
        origin: trip.origin,
        destination: trip.destination,
        distanceKm: trip.distanceKm,
        pandalCount: trip.pandalCount,
        savedAt: new Date().toISOString(),
      };
      const updated = [newTrip, ...prev];
      localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSavedTrip = useCallback((tripId) => {
    setSavedTrips((prev) => {
      const updated = prev.filter((t) => t.id !== tripId);
      localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 9. Initialize Google Identity Services Script
  useEffect(() => {
    if (!googleClientId) return;
    if (document.getElementById('google-client-script')) return;

    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [googleClientId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        googleClientId,
        loginWithGoogleToken,
        loginWithEmail,
        registerWithEmail,
        logout,
        favorites,
        toggleFavoritePandal,
        isFavoritePandal,
        savedTrips,
        saveTrip,
        deleteSavedTrip,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
