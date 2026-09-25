import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = '@debi_dorshon_jwt_token';
const USER_STORAGE_KEY = '@debi_dorshon_user_profile';

const DEFAULT_GOOGLE_CLIENT_ID = '85534143456-ier3fi6slpkbj6p4oj1g24m55bfd9avj.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(DEFAULT_GOOGLE_CLIENT_ID);
  const [googleAndroidClientId, setGoogleAndroidClientId] = useState(null);
  const [googleIosClientId, setGoogleIosClientId] = useState(null);

  // 1. Fetch public Google Client IDs dynamically from backend on startup
  useEffect(() => {
    let mounted = true;
    async function fetchAuthConfig() {
      try {
        const baseUrl = API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/v1/auth/config`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            if (data.google_client_id) setGoogleClientId(data.google_client_id);
            if (data.google_android_client_id) setGoogleAndroidClientId(data.google_android_client_id);
            if (data.google_ios_client_id) setGoogleIosClientId(data.google_ios_client_id);
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Could not fetch auth config:', e?.message);
      }
    }
    fetchAuthConfig();
    return () => { mounted = false; };
  }, []);

  // 2. Restore permanent session on app load
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const [savedToken, savedUserJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (savedToken) {
          if (mounted) setToken(savedToken);
          if (savedUserJson && mounted) {
            try { setUser(JSON.parse(savedUserJson)); } catch (_) {}
          }

          // Validate token and fetch latest stats from backend
          const baseUrl = API_BASE_URL;
          const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (res.ok) {
            const freshProfile = await res.json();
            if (mounted) {
              setUser(freshProfile);
              await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshProfile));
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore error:', err?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    restoreSession();
    return () => { mounted = false; };
  }, []);

  // 3. Login with Google (supports id_token, access_token, or string token)
  const loginWithGoogle = useCallback(async (tokenData) => {
    try {
      let payload = {};
      if (typeof tokenData === 'string') {
        payload = { id_token: tokenData };
      } else if (tokenData && typeof tokenData === 'object') {
        if (tokenData.idToken || tokenData.id_token) {
          payload.id_token = tokenData.idToken || tokenData.id_token;
        }
        if (tokenData.accessToken || tokenData.access_token) {
          payload.access_token = tokenData.accessToken || tokenData.access_token;
        }
      }

      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(errJson.detail || 'Google login failed');
      }

      const data = await res.json();
      await AsyncStorage.multiSet([
        [TOKEN_STORAGE_KEY, data.access_token],
        [USER_STORAGE_KEY, JSON.stringify(data.user)],
      ]);

      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('[AuthContext] Google auth error:', error);
      throw error;
    }
  }, []);

  const loginWithGoogleIdToken = loginWithGoogle;

  // 4. Sign in with Email & Password
  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
        throw new Error(errJson.detail || 'Sign in failed');
      }

      const data = await res.json();
      await AsyncStorage.multiSet([
        [TOKEN_STORAGE_KEY, data.access_token],
        [USER_STORAGE_KEY, JSON.stringify(data.user)],
      ]);

      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('[AuthContext] Email login error:', error);
      throw error;
    }
  }, []);

  // 5. Sign up with Email & Password
  const registerWithEmail = useCallback(async (email, password, name) => {
    try {
      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errJson.detail || 'Sign up failed');
      }

      const data = await res.json();
      await AsyncStorage.multiSet([
        [TOKEN_STORAGE_KEY, data.access_token],
        [USER_STORAGE_KEY, JSON.stringify(data.user)],
      ]);

      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('[AuthContext] Email register error:', error);
      throw error;
    }
  }, []);

  // 6. Logout
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('[AuthContext] Logout error:', e);
    }
  }, []);

  // 5. Refresh user stats (trips, points, favorites)
  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl = API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fresh = await res.json();
        setUser(fresh);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh));
      }
    } catch (e) {
      console.warn('[AuthContext] Profile refresh error:', e?.message);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(user && token),
        googleClientId,
        googleAndroidClientId,
        googleIosClientId,
        loginWithGoogle,
        loginWithGoogleIdToken,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
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
