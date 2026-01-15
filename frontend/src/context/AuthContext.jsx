import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('tdb_auth_token'));

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchUser = useCallback(async (currentToken) => {
    try {
      // Use Bearer token in Authorization header (correct way)
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Token is invalid/expired - clear it
      localStorage.removeItem('tdb_auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (token) {
      // Validate token and get user info on app load
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('tdb_auth_token', access_token);
    setToken(access_token);
    setUser(user);
    return user;
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
    const { access_token, user } = response.data;
    localStorage.setItem('tdb_auth_token', access_token);
    setToken(access_token);
    setUser(user);
    return user;
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
    // Try to invalidate session on server
    try {
      const sessionToken = localStorage.getItem('tdb_session_token');
      if (sessionToken) {
        await axios.post(`${API_URL}/api/auth/logout`, { session_token: sessionToken });
        localStorage.removeItem('tdb_session_token');
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('tdb_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading,
      loginWithGoogle,
      initiateGoogleLogin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
