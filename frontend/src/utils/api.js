// API URL configuration for different environments
// The Emergent platform routes /api/* requests to backend automatically in K8s
// For all domains (including custom domains), we use relative paths

// ALWAYS use relative paths - works for both preview and production
// The Kubernetes ingress handles routing /api/* to the backend
export const API_URL = '';

export const getApiUrl = (path = '') => {
  return path;  // Always use relative paths
};

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
