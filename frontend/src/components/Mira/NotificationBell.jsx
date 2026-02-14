/**
 * NotificationBell - Notification inbox with badge
 * =================================================
 * Shows unread notification count and dropdown inbox
 * 
 * Features:
 * - Real-time unread count badge
 * - Dropdown notification list
 * - Mark as read functionality
 * - Link to full inbox
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ChevronRight, Settings } from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

const NotificationBell = ({ userEmail, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userEmail) return;
    
    try {
      // Use member_notifications inbox endpoint
      const response = await fetch(`${API_URL}/api/member/notifications/inbox/${encodeURIComponent(userEmail)}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread || 0);
      }
    } catch (err) {
      console.log('Could not fetch notifications');
    }
  };
  
  // Poll for updates every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notificationId}/mark-read`, {
        method: 'PUT'
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log('Could not mark as read');
    }
  };
  
  // Mark all as read
  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/member/notifications/mark-all-read/${encodeURIComponent(userEmail)}`, {
        method: 'PUT'
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log('Could not mark all as read');
    }
  };
  
  const toggleDropdown = (e) => {
    hapticFeedback.buttonTap(e);
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(); // Refresh when opening
    }
  };
  
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        data-testid="notification-bell"
      >
        <Bell size={20} className="text-purple-300" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                       flex items-center justify-center
                       bg-red-500 text-white text-xs font-bold 
                       rounded-full px-1 animate-pulse"
            data-testid="unread-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 
                     bg-gray-900/95 backdrop-blur-xl 
                     border border-purple-500/30 rounded-xl
                     shadow-2xl shadow-purple-900/30
                     z-50 overflow-hidden"
          data-testid="notification-dropdown"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-purple-500/20">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs mt-1">Mira will notify you about important updates</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`
                    p-3 border-b border-purple-500/10 
                    hover:bg-purple-500/10 cursor-pointer
                    transition-colors
                    ${!notification.read ? 'bg-purple-500/5' : ''}
                  `}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    // Handle notification click - navigate to relevant page
                    if (notification.data?.url) {
                      window.location.href = notification.data.url;
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread dot */}
                    {!notification.read && (
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm truncate ${!notification.read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                    {/* Mark as read button */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 rounded hover:bg-white/10"
                        title="Mark as read"
                      >
                        <Check size={14} className="text-purple-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-purple-500/20">
              <button
                className="w-full py-2 text-xs text-purple-400 hover:text-purple-300 
                           flex items-center justify-center gap-1"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to member dashboard - notifications shown there
                  window.location.href = '/dashboard';
                }}
              >
                View all notifications
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
