import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const AuthContext = createContext();

// Storage key constant
const TOKEN_KEY = 'tdb_auth_token';

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage to prevent flash
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  
  // Track if we're currently fetching to prevent duplicate calls
  const fetchingRef = useRef(false);
  // Track mounted state to prevent setState after unmount
  const mountedRef = useRef(true);

  const fetchUser = useCallback(async (currentToken) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || !currentToken) {
      if (!currentToken) setLoading(false);
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (mountedRef.current) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      
      // Only clear auth on explicit 401 Unauthorized
      // Do NOT clear on network errors, timeouts, or server errors (5xx)
      if (error.response?.status === 401) {
        console.log('Token invalid (401), clearing auth state');
        if (mountedRef.current) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } else {
        // For network errors or server errors, keep the token
        // User might just have a connectivity issue
        console.log('Non-401 error, keeping auth state:', error.message);
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (token) {
      // Immediately set user from localStorage while we validate with API
      // This prevents flash of login page
      const storedUser = localStorage.getItem('user');
      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      // Then validate with API
      fetchUser(token);
    } else {
      setLoading(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount
  
  // Listen for token changes (e.g., from another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_KEY) {
        const newToken = e.newValue;
        if (newToken !== token) {
          setToken(newToken);
          if (newToken) {
            fetchUser(newToken);
          } else {
            setUser(null);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token, fetchUser]);

  const login = async (email, password) => {
    console.log('[AuthContext v5] login() called for:', email);
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    console.log('[AuthContext v5] Login successful, storing token...');
    console.log('[AuthContext v5] Token length:', access_token?.length);
    console.log('[AuthContext v5] User email:', userData?.email);
    
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Verify storage worked
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem('user');
    console.log('[AuthContext v5] Verification - Token stored:', !!storedToken, 'User stored:', !!storedUser);
    
    setToken(access_token);
    setUser(userData);
    console.log('[AuthContext v5] State updated, returning userData');
    return userData;
  };

  const register = async (userData) => {
    await axios.post(`${API_URL}/api/auth/register`, userData);
    // Auto login after register
    return login(userData.email, userData.password);
  };

  /**
   * Login with Google OAuth
   * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
   */
  const loginWithGoogle = async (sessionId) => {
    const response = await axios.post(`${API_URL}/api/auth/google/session`, { session_id: sessionId });
    const { access_token, user: userData } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  /**
   * Initiate Google Login
   * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
   */
  const initiateGoogleLogin = () => {
    // After login, land on Pet Home - the member hub
    const redirectUrl = `${window.location.origin}/pet-home`;
    window.location.href = `${API_URL}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    // Get session token BEFORE clearing storage
    const sessionToken = localStorage.getItem('tdb_session_token');
    
    // Clear local state first
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('tdb_session_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    // Then try to invalidate session on server (non-blocking)
    try {
      if (sessionToken) {
        await axios.post(`${API_URL}/api/auth/logout`, { session_token: sessionToken });
      }
    } catch (e) {
      // Ignore logout errors - user is already logged out locally
      console.debug('Server logout notification failed:', e.message);
    }
  };

  // Refresh user data from server (useful after points sync, etc.)
  const refreshUser = useCallback(async () => {
    if (!token) return null;
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (mountedRef.current) {
        setUser(response.data.user);
      }
      return response.data.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  }, [token]);

  // Login directly with token (used after onboarding when we already have the token)
  const loginWithToken = (accessToken, userData) => {
    console.log('[AuthContext] loginWithToken called');
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  // Auto-detect geolocation after login
  useEffect(() => {
    const detectLocation = async () => {
      if (!token || !user) return;
      
      // Only detect once per session
      const hasDetected = sessionStorage.getItem('geo_detected');
      if (hasDetected) return;
      
      sessionStorage.setItem('geo_detected', 'true');
      console.log('[GEO] 🌍 Auto-detecting location for', user.email);
      
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log('[GEO] Browser does not support geolocation');
        return;
      }
      
      try {
        // Get position from browser
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Cache for 5 mins
          });
        });
        
        const { latitude, longitude } = position.coords;
        console.log(`[GEO] 📍 Got coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        // Reverse geocode using our backend (uses Google API)
        let city = null, state = null, country = null;
        
        try {
          const geoResponse = await fetch(
            `${API_URL}/api/geo/reverse?lat=${latitude}&lng=${longitude}`
          );
          const geoData = await geoResponse.json();
          
          if (geoData.success) {
            city = geoData.city;
            state = geoData.state;
            country = geoData.country;
            console.log(`[GEO] ✅ Location: ${city}, ${state} (via ${geoData.source})`);
          }
        } catch (geoError) {
          console.log('[GEO] Reverse geocode failed');
        }
        
        // Save to user profile
        await fetch(`${API_URL}/api/member/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            latitude,
            longitude,
            city,
            state,
            country,
            source: 'auto'
          })
        });
        
      } catch (error) {
        // Silent fail - geolocation is optional
        if (error.code === 1) {
          console.log('[GEO] User denied location permission');
        } else {
          console.log('[GEO] Location detection skipped');
        }
      }
    };
    
    // Run with slight delay to not block login UX
    const timer = setTimeout(detectLocation, 1500);
    return () => clearTimeout(timer);
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      loginWithToken,
      register, 
      logout, 
      loading,
      loginWithGoogle,
      initiateGoogleLogin,
      refreshUser,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
