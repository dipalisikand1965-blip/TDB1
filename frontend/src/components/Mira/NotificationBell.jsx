/**
 * NotificationBell - Navigate to full-screen Inbox
 * =================================================
 * Shows unread notification count badge
 * Bell tap opens /notifications full-screen inbox
 * Passes returnTo param so user can come back
 * 
 * NO dropdown. NO drawer. Just badge + navigation.
 */

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

const NotificationBell = ({ userEmail, petId, petName, className = '', unreadCountProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(unreadCountProp || 0);
  
  // Use prop if provided (single source of truth), otherwise fetch
  useEffect(() => {
    if (unreadCountProp !== undefined) {
      setUnreadCount(unreadCountProp);
    }
  }, [unreadCountProp]);
  
  // Fetch unread count only if not provided via prop
  const fetchUnreadCount = async () => {
    if (!userEmail || unreadCountProp !== undefined) return;
    
    try {
      let url = `${API_URL}/api/member/notifications/inbox/${encodeURIComponent(userEmail)}?limit=1`;
      if (petId) {
        url += `&pet_id=${encodeURIComponent(petId)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread || 0);
      }
    } catch (err) {
      console.log('Could not fetch notification count');
    }
  };
  
  // Fetch on mount and set up polling (only if not using prop)
  useEffect(() => {
    if (unreadCountProp === undefined) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userEmail, petId, unreadCountProp]);
  
  // Handle bell click - navigate to inbox WITH returnTo
  const handleClick = (e) => {
    hapticFeedback.buttonTap(e);
    // Pass current path as returnTo so user can come back
    const returnTo = encodeURIComponent(location.pathname);
    navigate(`/notifications?returnTo=${returnTo}`);
  };
  
  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-full hover:bg-white/10 transition-colors ${className}`}
      data-testid="notification-bell"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell size={20} className="text-purple-300" />
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                     flex items-center justify-center
                     bg-red-500 text-white text-xs font-bold 
                     rounded-full px-1"
          data-testid="unread-badge"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
