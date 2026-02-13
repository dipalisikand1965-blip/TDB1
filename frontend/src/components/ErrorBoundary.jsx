import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 * 
 * Special handling for ChunkLoadError - automatically reloads to get fresh assets
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging - ALWAYS log details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
    
    // AUTO-RELOAD for ChunkLoadError (CSS/JS chunk loading failures after deployment)
    const isChunkError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      (error?.message?.includes('chunk') && error?.message?.includes('failed'));
    
    if (isChunkError) {
      console.log('ChunkLoadError detected - will show update UI');
      // Don't auto-reload, let user click the button (which clears cache properly)
    }
  }
  
  // Handle chunk load errors by clearing caches and forcing reload
  handleChunkLoadError = async () => {
    // No loop prevention - always try
    console.log('Clearing all caches...');
    
    try {
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
          console.log('Unregistered SW');
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
          console.log('Deleted cache:', name);
        }
      }
      
      // Clear localStorage version
      localStorage.removeItem('tdc_app_version');
      localStorage.removeItem('tdc_last_version_check');
      
    } catch (e) {
      console.error('Cache clear error:', e);
    }
    
    // FORCE fresh load with cache-busting URL
    const freshUrl = window.location.origin + window.location.pathname + '?v=' + Date.now();
    console.log('Redirecting to:', freshUrl);
    window.location.replace(freshUrl);
  };
    
    // Prevent infinite reload loop - only attempt once per session (or once per 30 seconds)
    if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
      console.log('ChunkLoadError: Already attempted reload recently, showing error UI');
      return;
    }
    
    sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString());
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered service worker');
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('Deleted cache:', cacheName);
        }
      }
      
      // Clear version tracking
      localStorage.removeItem('tdc_app_version');
      localStorage.removeItem('tdc_last_version_check');
      
      // Force hard reload
      console.log('Forcing hard reload...');
      window.location.reload(true);
    } catch (e) {
      console.error('Error during chunk error recovery:', e);
      // Fallback: just reload
      window.location.reload(true);
    }
  };

  handleRetry = async () => {
    // Clear everything before reload
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) await caches.delete(name);
      }
      sessionStorage.clear();
      localStorage.removeItem('tdc_app_version');
    } catch (e) {}
    
    // Force reload with cache bypass
    window.location.href = window.location.href.split('?')[0] + '?_=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a chunk error
      const isChunkError = this.state.error?.message?.includes('chunk');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isChunkError ? 'New Update Available!' : 'Oops! Something went wrong'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isChunkError 
                ? 'A new version is available. Click below to update.'
                : 'We\'re sorry, but something unexpected happened. Please try refreshing the page.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {isChunkError ? 'Update Now' : 'Refresh Page'}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Go to Homepage
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            {/* Production error details - collapsed by default */}
            {process.env.NODE_ENV === 'production' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                  Show error details for support
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-red-600 overflow-auto max-h-32">
                  {this.state.error?.message || 'Unknown error'}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
