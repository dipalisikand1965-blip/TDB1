import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellDot, X, MessageCircle, Check, CheckCheck, Calendar, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_URL } from '../utils/api';

const API = API_URL;

const MemberNotificationBell = ({ userEmail, onNotificationClick }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API}/api/member/notifications/inbox/${encodeURIComponent(userEmail)}?limit=10`
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || data.unread || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [userEmail]);

  return (
    <div className="relative">
      {/* Bell Button - Now navigates to full Inbox */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-xl transition-all bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white"
        data-testid="member-notification-bell"
        title="Open Inbox"
      >
        {unreadCount > 0 ? (
          <BellDot className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default MemberNotificationBell;
