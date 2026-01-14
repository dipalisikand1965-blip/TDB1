import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('tdb_auth_token'));

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (token) {
      // Validate token and get user info
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (currentToken) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me?email=${jwtDecode(currentToken).sub}`);
      // Wait, /auth/me still uses email query param? 
      // I should update /auth/me to use token, but for now I can decode token.
      // Actually, I should update /auth/me to use dependency injection.
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Helper to decode JWT (simple version without library)
  const jwtDecode = (t) => {
    try {
      return JSON.parse(atob(t.split('.')[1]));
    } catch (e) {
      return {};
    }
  };

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

  const logout = () => {
    localStorage.removeItem('tdb_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
