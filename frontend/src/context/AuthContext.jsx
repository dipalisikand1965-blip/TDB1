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
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setUser(userData);
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
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  /**
   * Initiate Google Login
   * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
   */
  const initiateGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    // Clear local state first
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('tdb_session_token');
    setToken(null);
    setUser(null);
    
    // Then try to invalidate session on server (non-blocking)
    try {
      const sessionToken = localStorage.getItem('tdb_session_token');
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
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
