import React from 'react';

/**
 * Error Boundary Component
 * Special handling for ChunkLoadError - clears caches and reloads
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error?.message);
    this.setState({ errorInfo });

    // Auto-reload on chunk load errors (stale cache after hot reload)
    if (error?.message?.includes('chunk') || error?.name === 'ChunkLoadError') {
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
      }, 800);
    }
  }

  handleRetry = async () => {
    console.log('Clearing caches and reloading...');
    
    try {
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
      
      // Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) await caches.delete(name);
      }
      
      // Clear version tracking
      localStorage.removeItem('tdc_app_version');
      localStorage.removeItem('tdc_last_version_check');
    } catch (e) {
      console.error('Clear error:', e);
    }
    
    // Force fresh load with cache-busting
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
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
              {isChunkError ? 'Update Available!' : 'Oops! Something went wrong'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isChunkError 
                ? 'Click below to get the latest version.'
                : 'Please try refreshing the page.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {isChunkError ? 'Update Now' : 'Refresh Page'}
              </button>
              <button
                onClick={() => { window.location.href = '/?v=' + Date.now(); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Go to Homepage
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                  Error details
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
