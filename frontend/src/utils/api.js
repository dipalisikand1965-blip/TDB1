// Use relative paths in production to avoid stale URL issues
export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Use relative paths for production domains
    if (hostname === 'thedoggycompany.in' || hostname.endsWith('.emergent.host')) {
      return '';
    }
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};

// For backward compatibility, export API_URL as a getter
// This ensures it's evaluated at runtime, not module load time
export const API_URL = typeof window !== 'undefined' ? getApiUrl() : (process.env.REACT_APP_BACKEND_URL || '');
