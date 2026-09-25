import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('debi_dorshon_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(null);

  // 1. Fetch public auth config dynamically from backend (zero keys in frontend env!)
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
          if (isMounted) setUser(profile);
        } else {
          // Token expired or invalid
          localStorage.removeItem('debi_dorshon_token');
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

  // 3. Login with Google ID Token
  const loginWithGoogleToken = useCallback(async (idToken) => {
    try {
      const cleanUrl = API_BASE_URL.trim().replace(/\/+$/, '');
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
      localStorage.setItem('debi_dorshon_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('[AuthContext] Google sign in error:', err);
      throw err;
    }
  }, []);

  // 4. Logout
  const logout = useCallback(() => {
    localStorage.removeItem('debi_dorshon_token');
    setToken(null);
    setUser(null);
  }, []);

  // 5. Initialize Google Identity Services Script
  useEffect(() => {
    if (!googleClientId) return;

    // Check if script already loaded
    if (document.getElementById('google-client-script')) return;

    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Keep script cached in document
    };
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
        logout,
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
