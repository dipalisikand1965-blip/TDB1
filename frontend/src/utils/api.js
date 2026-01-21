// API URL configuration for different environments
// The Emergent platform routes /api/* requests to backend automatically in K8s
// For custom domains, we use the direct API endpoint

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Debug logging (can be removed in production)
    console.log('[API] Hostname detected:', hostname);
    
    // For the custom domain thedoggycompany.in - use the Emergent API endpoint
    // This is a workaround until custom domain routing is fixed
    if (hostname === 'thedoggycompany.in' || hostname === 'www.thedoggycompany.in') {
      const apiUrl = 'https://soulfulfur.preview.emergentagent.com';
      console.log('[API] Using Emergent URL for custom domain:', apiUrl);
      return apiUrl;
    }
    
    // For Emergent's own domains (.emergent.host), use relative paths
    if (hostname.endsWith('.emergent.host')) {
      console.log('[API] Using relative path for emergent.host');
      return '';
    }
    
    // For preview environment
    if (hostname.includes('preview.emergentagent.com')) {
      console.log('[API] Using relative path for preview');
      return '';
    }
    
    // For localhost (development)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const devUrl = process.env.REACT_APP_BACKEND_URL || '';
      console.log('[API] Using dev URL:', devUrl);
      return devUrl;
    }
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};

// API_URL - evaluated at runtime in the browser
// This works because module initialization happens after the DOM is loaded
export const API_URL = (() => {
  if (typeof window !== 'undefined') {
    return getApiUrl();
  }
  return process.env.REACT_APP_BACKEND_URL || '';
})();
