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

export const API_URL = getApiUrl();
