import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'debi_dorshon_token';
const USER_KEY = 'debi_dorshon_user';
const FAVORITES_KEY = 'debi_dorshon_favorites';
const SAVED_TRIPS_KEY = 'debi_dorshon_saved_trips';

// Fallback Supabase credentials from backend configuration
const DEFAULT_SUPABASE_URL = 'https://asqszzkmxhcdysigfoty.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_PW9a7ut7NxwIXxrJufTWew_GNMnVvnI';

let supabaseInstance = null;

function getSupabase(url, key) {
  if (!supabaseInstance && url && key) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export function AuthProvider({ children }) {
  const [supabase, setSupabase] = useState(() =>
    getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY)
  );

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
  const isSyncingRef = useRef(false);

  // 1. Sync Supabase authenticated session with MongoDB Atlas
  const syncWithMongo = useCallback(async (sbUser, sbToken) => {
    if (!sbUser || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/v1/auth/supabase-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sbToken || ''}`,
        },
        body: JSON.stringify({
          id: sbUser.id,
          email: sbUser.email,
          user_metadata: sbUser.user_metadata || {},
        }),
      });

      if (res.ok) {
        const mongoProfile = await res.json();
        setUser(mongoProfile);
        localStorage.setItem(USER_KEY, JSON.stringify(mongoProfile));
        if (mongoProfile.favorite_pandals?.length > 0) {
          setFavorites((prev) => Array.from(new Set([...prev, ...mongoProfile.favorite_pandals])));
        }
      } else {
        // Fallback to basic Supabase profile if backend is sleeping
        const meta = sbUser.user_metadata || {};
        const fallbackProfile = {
          id: sbUser.id,
          email: sbUser.email,
          name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Puja Pilgrim',
          picture: meta.avatar_url || meta.picture || null,
          redeem_points: 50,
          completed_trips: 0,
          favorite_pandals: [],
        };
        setUser(fallbackProfile);
        localStorage.setItem(USER_KEY, JSON.stringify(fallbackProfile));
      }
    } catch (err) {
      console.warn('[AuthContext] Backend sync deferred:', err.message);
      const meta = sbUser.user_metadata || {};
      const fallbackProfile = {
        id: sbUser.id,
        email: sbUser.email,
        name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Puja Pilgrim',
        picture: meta.avatar_url || meta.picture || null,
        redeem_points: 50,
        completed_trips: 0,
        favorite_pandals: [],
      };
      setUser(fallbackProfile);
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackProfile));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // 2. Fetch runtime config from backend and initialize Supabase listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      let sbClient = supabase;

      // Fetch dynamic backend auth config (if customized)
      try {
        const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/api/v1/auth/config`);
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.supabase_url && cfg.supabase_anon_key) {
            sbClient = getSupabase(cfg.supabase_url, cfg.supabase_anon_key);
            if (isMounted) setSupabase(sbClient);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Using default Supabase configuration:', err.message);
      }

      if (!sbClient) {
        if (isMounted) setLoading(false);
        return;
      }

      // Check existing Supabase session
      const { data: { session } } = await sbClient.auth.getSession();
      if (session?.user && isMounted) {
        setToken(session.access_token);
        localStorage.setItem(TOKEN_KEY, session.access_token);
        await syncWithMongo(session.user, session.access_token);
      }

      if (isMounted) setLoading(false);

      // Listen for auth state changes (OAuth redirects, logins, logouts)
      const { data: { subscription } } = sbClient.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!isMounted) return;

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              setToken(newSession.access_token);
              localStorage.setItem(TOKEN_KEY, newSession.access_token);
              await syncWithMongo(newSession.user, newSession.access_token);
            }
          } else if (event === 'SIGNED_OUT') {
            setToken(null);
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [syncWithMongo]);

  // 3. Login with Google (Clean standard OAuth via Supabase)
  const loginWithGoogle = useCallback(async () => {
    const sb = supabase || getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    if (!sb) throw new Error('Supabase client not initialized.');

    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('[AuthContext] Supabase Google OAuth error:', error);
      throw error;
    }
  }, [supabase]);

  // 4. Sign in with Email & Password via Supabase
  const loginWithEmail = useCallback(
    async (email, password) => {
      const sb = supabase || getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
      if (!sb) throw new Error('Supabase client not initialized.');

      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('[AuthContext] Email login error:', error);
        throw error;
      }

      if (data.session) {
        setToken(data.session.access_token);
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
        await syncWithMongo(data.user, data.session.access_token);
      }
      return data.user;
    },
    [supabase, syncWithMongo]
  );

  // 5. Sign up with Email & Password via Supabase
  const registerWithEmail = useCallback(
    async (email, password, name) => {
      const sb = supabase || getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
      if (!sb) throw new Error('Supabase client not initialized.');

      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: name?.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('[AuthContext] Email register error:', error);
        throw error;
      }

      if (data.session) {
        setToken(data.session.access_token);
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
        await syncWithMongo(data.user, data.session.access_token);
      }
      return data.user;
    },
    [supabase, syncWithMongo]
  );

  // 6. Logout
  const logout = useCallback(async () => {
    const sb = supabase || getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    if (sb) {
      await sb.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, [supabase]);

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

  const isFavoritePandal = useCallback(
    (pandal) => {
      if (!pandal) return false;
      const pandalId = pandal.id || pandal._id || pandal.name;
      return favorites.some((p) => (p.id || p._id || p.name) === pandalId);
    },
    [favorites]
  );

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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        loginWithGoogle,
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
