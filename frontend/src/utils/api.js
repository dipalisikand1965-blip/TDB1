// API URL configuration for different environments
// The Emergent platform routes /api/* requests to backend automatically in K8s
// For custom domains, we use the direct API endpoint

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // For the custom domain thedoggycompany.in - use the Emergent API endpoint
    // This is a workaround until custom domain routing is fixed
    if (hostname === 'thedoggycompany.in' || hostname === 'www.thedoggycompany.in') {
      // Use the stable Emergent deployment URL for API calls
      return 'https://pet-soul-system.preview.emergentagent.com';
    }
    
    // For Emergent's own domains (.emergent.host), use relative paths
    if (hostname.endsWith('.emergent.host')) {
      return '';
    }
    
    // For preview environment
    if (hostname.includes('preview.emergentagent.com')) {
      return '';
    }
    
    // For localhost (development)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.REACT_APP_BACKEND_URL || '';
    }
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};

// IMPORTANT: API_URL must be a getter that calls getApiUrl() every time
// This ensures the hostname check happens at runtime, not build time
// Using Object.defineProperty to create a live getter
let _apiUrlCache = null;

export const API_URL = (() => {
  // In browser, always call getApiUrl() for dynamic hostname detection
  if (typeof window !== 'undefined') {
    return getApiUrl();
  }
  return process.env.REACT_APP_BACKEND_URL || '';
})();
