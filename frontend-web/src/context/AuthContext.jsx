import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getActiveBackendUrl } from '../config/backendConfig';

const AuthContext = createContext(null);

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState(getActiveBackendUrl);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const handleBackendChange = (e) => {
      if (e.detail?.url) {
        setApiBaseUrl(e.detail.url);
      }
    };
    window.addEventListener('debi_dorshon_backend_change', handleBackendChange);
    return () => window.removeEventListener('debi_dorshon_backend_change', handleBackendChange);
  }, []);

  const openAuthModal = useCallback((reason = '') => {
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalReason('');
  }, []);

  // 1. Sync Supabase authenticated session with MongoDB Atlas
  const syncWithMongo = useCallback(async (sbUser, sbToken) => {
    if (!sbUser || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const cleanUrl = (apiBaseUrl || getActiveBackendUrl()).trim().replace(/\/+$/, '');
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
        const data = await res.json();
        const mongoProfile = data.user || data;
        const newJwt = data.access_token;
        if (newJwt) {
          setToken(newJwt);
          localStorage.setItem(TOKEN_KEY, newJwt);
        }
        setUser(mongoProfile);
        localStorage.setItem(USER_KEY, JSON.stringify(mongoProfile));

        // Sync backend favorites
        if (mongoProfile.favorite_pandals?.length > 0) {
          setFavorites((prev) => {
            const merged = Array.from(new Set([...prev.map((p) => (typeof p === 'string' ? p : p.id || p.name)), ...mongoProfile.favorite_pandals]));
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } else {
        // Fallback to basic Supabase profile if backend is cold-starting
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
        const cleanUrl = (apiBaseUrl || getActiveBackendUrl()).trim().replace(/\/+$/, '');
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

      // Clean query and hash parameters after OAuth redirect
      if (typeof window !== 'undefined' && (window.location.hash || window.location.search.includes('code='))) {
        setTimeout(() => {
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
        }, 800);
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
              setIsAuthModalOpen(false);
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

  // 3. Login with Google (Works across any device: mobile, desktop, Vercel, localhost)
  const loginWithGoogle = useCallback(async () => {
    const sb = supabase || getSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    if (!sb) throw new Error('Supabase client not initialized.');

    // Always normalize origin without trailing slash
    const redirectUrl = (window.location.origin || '').trim().replace(/\/+$/, '');

    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
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
        setIsAuthModalOpen(false);
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
        setIsAuthModalOpen(false);
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

  // 7. Favorite pandals management (strictly gated for signed-in users)
  const toggleFavoritePandal = useCallback(
    async (pandal) => {
      if (!pandal) return false;

      // Gate: Must be authenticated
      if (!user) {
        openAuthModal('Sign in with Google to add pandals to your favorites and access them across all your devices.');
        return false;
      }

      const pandalId = pandal.id || pandal._id || pandal.name;
      let isNowFav = false;

      setFavorites((prev) => {
        const exists = prev.some((p) => {
          const id = typeof p === 'string' ? p : p.id || p._id || p.name;
          return id === pandalId;
        });

        let updated;
        if (exists) {
          updated = prev.filter((p) => {
            const id = typeof p === 'string' ? p : p.id || p._id || p.name;
            return id !== pandalId;
          });
          isNowFav = false;
        } else {
          updated = [...prev, pandal];
          isNowFav = true;
        }
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        return updated;
      });

      // Background sync with MongoDB if backend is connected
      if (token) {
        try {
          const cleanUrl = (apiBaseUrl || getActiveBackendUrl()).trim().replace(/\/+$/, '');
          await fetch(`${cleanUrl}/api/v1/user/favorites/toggle`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ pandal_id: String(pandalId) }),
          });
        } catch (e) {
          console.warn('[AuthContext] Backend favorite sync deferred:', e.message);
        }
      }

      return true;
    },
    [user, token, apiBaseUrl, openAuthModal]
  );

  const isFavoritePandal = useCallback(
    (pandal) => {
      if (!pandal) return false;
      const pandalId = pandal.id || pandal._id || pandal.name;
      return favorites.some((p) => {
        const id = typeof p === 'string' ? p : p.id || p._id || p.name;
        return id === pandalId;
      });
    },
    [favorites]
  );

  // 8. Saved routes management (strictly gated for signed-in users)
  const saveTrip = useCallback(
    async (trip) => {
      if (!trip) return false;

      // Gate: Must be authenticated
      if (!user) {
        openAuthModal('Sign in with Google to save your custom Parikrama routes to your account.');
        return false;
      }

      const newTrip = {
        id: `trip_${Date.now()}`,
        name: trip.name || 'Puja Parikrama Route',
        origin: trip.origin,
        destination: trip.destination,
        distanceKm: trip.distanceKm,
        pandalCount: trip.pandalCount,
        savedAt: new Date().toISOString(),
      };

      setSavedTrips((prev) => {
        const updated = [newTrip, ...prev];
        localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated));
        return updated;
      });

      // Background sync with MongoDB
      if (token) {
        try {
          const cleanUrl = (apiBaseUrl || getActiveBackendUrl()).trim().replace(/\/+$/, '');
          await fetch(`${cleanUrl}/api/v1/user/trips`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: newTrip.name,
              origin_name: trip.origin?.name || 'Origin',
              destination_name: trip.destination?.name || 'Destination',
              origin: trip.origin?.location || { latitude: 22.5726, longitude: 88.3639 },
              destination: trip.destination?.location || { latitude: 22.5726, longitude: 88.3639 },
              distance_km: trip.distanceKm || 0.0,
            }),
          });
        } catch (e) {
          console.warn('[AuthContext] Backend trip sync deferred:', e.message);
        }
      }

      return true;
    },
    [user, token, apiBaseUrl, openAuthModal]
  );

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
        apiBaseUrl,
        isAuthModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
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
