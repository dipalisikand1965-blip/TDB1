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
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};

// For backward compatibility, export API_URL as a getter
// This ensures it's evaluated at runtime, not module load time
export const API_URL = typeof window !== 'undefined' ? getApiUrl() : (process.env.REACT_APP_BACKEND_URL || '');
