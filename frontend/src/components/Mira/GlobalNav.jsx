/**
 * GlobalNav - Dashboard | Inbox segmented control
 * 
 * Appears on: /notifications, /tickets/:id, /dashboard, /my-pets
 * 
 * Behavior:
 * - Tap Dashboard → /dashboard
 * - Tap Inbox → /notifications
 * - Bell badge shows unread count
 * - Optional: Active Pet pill links to /my-pets
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox } from 'lucide-react';

const GlobalNav = ({ 
  unreadCount = 0,
  activePetName,
  onPetClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current path
  const isInboxActive = location.pathname.startsWith('/notifications') || 
                        location.pathname.startsWith('/tickets');
  const isDashboardActive = location.pathname === '/dashboard' || 
                            location.pathname === '/my-pets';

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800/50">
      {/* Segmented Control: Dashboard | Inbox */}
      <div className="flex bg-gray-800/50 rounded-full p-1">
        <button
          onClick={() => navigate('/dashboard')}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${isDashboardActive 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          data-testid="global-nav-dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        
        <button
          onClick={() => navigate('/notifications')}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all relative
            ${isInboxActive 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          data-testid="global-nav-inbox"
        >
          <Inbox className="w-4 h-4" />
          <span className="hidden sm:inline">Inbox</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Active Pet Pill (optional - links to /my-pets) */}
      {activePetName && (
        <button
          onClick={() => onPetClick ? onPetClick() : navigate('/my-pets')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-all"
          data-testid="active-pet-pill"
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {activePetName}
        </button>
      )}
    </div>
  );
};

export default GlobalNav;
