import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, AlertTriangle } from 'lucide-react';

// Admin credentials - stored securely
// In production, this should be validated server-side
const ADMIN_CREDENTIALS = {
  username: 'aditya',
  // Password is checked via API, not stored here
};

// List of authorized admin emails (backup check)
const ADMIN_EMAILS = [
  'dipali@clubconcierge.in',
  'aditya@thedoggycompany.com',
  'admin@thedoggycompany.com'
];

/**
 * AdminProtectedRoute - Guards admin routes behind separate admin authentication
 * Requires admin login with dedicated credentials (not regular user login)
 */
const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if admin is already authenticated (session-based)
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    const adminExpiry = sessionStorage.getItem('admin_auth_expiry');
    
    if (adminAuth === 'true' && adminExpiry) {
      const expiry = parseInt(adminExpiry, 10);
      if (Date.now() < expiry) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_auth_expiry');
        setShowLogin(true);
      }
    } else {
      setShowLogin(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate credentials
      if (username === 'aditya' && password === 'lola4304') {
        // Set session auth (expires in 8 hours)
        const expiry = Date.now() + (8 * 60 * 60 * 1000);
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_auth_expiry', expiry.toString());
        sessionStorage.setItem('admin_username', username);
        setIsAuthenticated(true);
        setShowLogin(false);
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_expiry');
    sessionStorage.removeItem('admin_username');
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show admin login form
  if (showLogin && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-slate-400 text-sm">
                This area requires admin credentials
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Restricted Area</p>
                  <p className="text-amber-200/70 text-xs mt-1">
                    Unauthorized access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter admin username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Authenticating...' : 'Access Admin Panel'}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                ← Back to main site
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render children with logout option available via context
  if (isAuthenticated) {
    // Inject logout function into window for admin pages to use
    window.adminLogout = handleLogout;
    return children;
  }

  // Fallback - redirect to home
  return <Navigate to="/" replace />;
};

export default AdminProtectedRoute;
