// API URL configuration for different environments
// The Emergent platform routes /api/* requests to backend automatically in K8s
// For all domains (including custom domains), we use relative paths

export const getApiUrl = (path = '') => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // For localhost (development) - use env variable if set
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const devUrl = process.env.REACT_APP_BACKEND_URL || '';
      return devUrl + path;
    }
    
    // For all other environments (preview, production, custom domains)
    // Use relative paths - Emergent routes /api/* to backend automatically
    return path;
  }
  return (process.env.REACT_APP_BACKEND_URL || '') + path;
};

// API_URL - evaluated at runtime in the browser
export const API_URL = (() => {
  if (typeof window !== 'undefined') {
    return getApiUrl();
  }
  return process.env.REACT_APP_BACKEND_URL || '';
})();

// Get auth headers for admin API calls
// Reads credentials from localStorage (set during admin login)
export const getAuthHeaders = () => {
  const adminAuth = localStorage.getItem('adminAuth');
  if (adminAuth) {
    return {
      'Authorization': `Basic ${adminAuth}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};
