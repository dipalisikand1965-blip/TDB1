import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceDesk } from '../components/admin';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { API_URL } from '../utils/api';
import { ArrowLeft, Headphones, Maximize2, Minimize2, Lock, User, Eye, EyeOff } from 'lucide-react';

/**
 * ServiceDeskPage - Full-screen dedicated Service Desk module
 * Provides a spacious, distraction-free workspace for ticket management
 */
const ServiceDeskPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Check admin auth on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('tdc_admin_token');
      const storedUser = localStorage.getItem('tdc_admin_user');
      const storedPassword = localStorage.getItem('tdc_admin_password');
      if (token || (storedUser && storedPassword)) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tdc_admin_token', data.token);
        localStorage.setItem('tdc_admin_user', username);
        localStorage.setItem('tdc_admin_password', password);
        setIsAuthenticated(true);
      } else {
        const error = await res.json();
        setLoginError(error.detail || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Auth headers for API calls - Use Basic auth for admin routes
  const getAuthHeaders = () => {
    // For basic auth compatibility with admin endpoints
    const storedUser = localStorage.getItem('tdc_admin_user');
    const storedPassword = localStorage.getItem('tdc_admin_password');
    
    if (storedUser && storedPassword) {
      const basicAuth = btoa(`${storedUser}:${storedPassword}`);
      return {
        'Authorization': `Basic ${basicAuth}`
      };
    }
    
    // Fallback to bearer token if available
    const token = localStorage.getItem('tdc_admin_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    
    return {};
  };

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Service Desk...</p>
        </div>
      </div>
    );
  }

  // Login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border-white/20">
          <div className="text-center mb-8">
            <div className="p-4 bg-purple-500/20 rounded-full inline-block mb-4">
              <Headphones className="w-12 h-12 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Service Desk</h1>
            <p className="text-slate-400">Sign in to access the full-screen workspace</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {loginError}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Admin Dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="text-white hover:bg-white/10 gap-2 px-4 py-2"
            data-testid="back-to-admin-btn"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin Dashboard</span>
          </Button>
          
          {/* Separator */}
          <div className="h-8 w-px bg-white/20"></div>
          
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Headphones className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Service Desk</h1>
              <p className="text-xs text-slate-400">Unified Ticket Management</p>
            </div>
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/10"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Main Content - Full viewport height minus header */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <ServiceDesk authHeaders={getAuthHeaders()} isFullScreen={true} />
        </div>
      </div>
    </div>
  );
};

export default ServiceDeskPage;
