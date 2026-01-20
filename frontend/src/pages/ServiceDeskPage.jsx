import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceDesk } from '../components/admin';
import { Button } from '../components/ui/button';
import { API_URL } from '../utils/api';
import { ArrowLeft, Headphones, Maximize2, Minimize2 } from 'lucide-react';

/**
 * ServiceDeskPage - Full-screen dedicated Service Desk module
 * Provides a spacious, distraction-free workspace for ticket management
 */
const ServiceDeskPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check admin auth on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('tdc_admin_token');
      if (!token) {
        navigate('/admin');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('tdc_admin_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Service Desk...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
