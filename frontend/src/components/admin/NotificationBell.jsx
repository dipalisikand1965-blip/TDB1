import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, X, ExternalLink, ShoppingCart, Calendar, Users, Star, MessageCircle, User, AlertCircle, Ticket, Sparkles, Plane, Home, Heart, PartyPopper, GraduationCap, Dumbbell, FileText, Phone, Ambulance, PawPrint, Utensils, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { API_URL } from '../../utils/api';

const NOTIFICATION_ICONS = {
  order: ShoppingCart,
  reservation: Calendar,
  meetup: Users,
  review: Star,
  chat: MessageCircle,
  member: User,
  ticket: Ticket,
  system: AlertCircle,
  stock: AlertCircle,
  // Pillar-specific icons
  concierge_request: Sparkles,
  travel: Plane,
  stay: Home,
  care: Heart,
  enjoy: PartyPopper,
  learn: GraduationCap,
  fit: Dumbbell,
  paperwork: FileText,
  advisory: Phone,
  emergency: Ambulance,
  farewell: PawPrint,
  adopt: PawPrint,
  dine: Utensils,
  celebrate: PartyPopper,
  rsvp: Calendar,
  inquiry: MessageCircle,
  experience_request: Sparkles
};

const NOTIFICATION_COLORS = {
  order: 'bg-green-100 text-green-700',
  reservation: 'bg-orange-100 text-orange-700',
  meetup: 'bg-pink-100 text-pink-700',
  review: 'bg-yellow-100 text-yellow-700',
  chat: 'bg-blue-100 text-blue-700',
  member: 'bg-purple-100 text-purple-700',
  ticket: 'bg-indigo-100 text-indigo-700',
  system: 'bg-red-100 text-red-700',
  stock: 'bg-amber-100 text-amber-700',
  // Pillar-specific colors
  concierge_request: 'bg-violet-100 text-violet-700',
  travel: 'bg-violet-100 text-violet-700',
  stay: 'bg-emerald-100 text-emerald-700',
  care: 'bg-rose-100 text-rose-700',
  enjoy: 'bg-amber-100 text-amber-700',
  learn: 'bg-blue-100 text-blue-700',
  fit: 'bg-teal-100 text-teal-700',
  paperwork: 'bg-slate-100 text-slate-700',
  advisory: 'bg-cyan-100 text-cyan-700',
  emergency: 'bg-red-100 text-red-700',
  farewell: 'bg-gray-100 text-gray-700',
  adopt: 'bg-pink-100 text-pink-700',
  dine: 'bg-orange-100 text-orange-700',
  celebrate: 'bg-pink-100 text-pink-700',
  rsvp: 'bg-purple-100 text-purple-700',
  inquiry: 'bg-blue-100 text-blue-700',
  experience_request: 'bg-violet-100 text-violet-700'
};

const PRIORITY_COLORS = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  normal: '',
  low: 'opacity-80'
};

const NotificationBell = ({ credentials, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const authHeaders = {
    'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/notifications?limit=50&unread_only=${filter === 'unread'}`,
        { headers: authHeaders }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        setCategoryCounts(data.category_counts || {});
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [filter, credentials]);

  // Poll for new notifications every 10 seconds (faster updates)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: authHeaders
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/mark-all-read`, {
        method: 'PUT',
        headers: authHeaders
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link_to && onNavigate) {
      onNavigate(notification.link_to);
    }
    setIsOpen(false);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  // Check if there are new member notifications
  const hasNewMemberNotification = notifications.some(
    n => !n.read && (n.category === 'member' || n.type === 'new_member')
  );

  return (
    <div className="relative">
      {/* Bell Button - Buzzes for new members */}
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${hasNewMemberNotification ? 'animate-bounce' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-bell"
      >
        <Bell className={`w-5 h-5 transition-all ${
          hasNewMemberNotification 
            ? 'text-purple-600 animate-wiggle' 
            : unreadCount > 0 
              ? 'text-orange-500' 
              : 'text-gray-600'
        }`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${
            hasNewMemberNotification ? 'bg-purple-600 animate-ping' : 'bg-red-500 animate-pulse'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* New Member Star Badge */}
        {hasNewMemberNotification && (
          <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[8px] animate-bounce">
            ★
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-96 max-h-[70vh] overflow-hidden z-50 shadow-2xl border-2" data-testid="notification-panel">
            {/* Header */}
            <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-pink-50 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">{unreadCount} new</Badge>
                  )}
                </h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                      <Check className="w-3 h-3 mr-1" /> Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Category Pills */}
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <Badge key={cat} variant="outline" className="text-xs whitespace-nowrap">
                    {cat}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">New activities will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                    const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-gray-100 text-gray-700';
                    const priorityClass = PRIORITY_COLORS[notification.priority] || '';
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors group ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        } ${priorityClass}`}
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {formatTime(notification.created_at)}
                              </span>
                              {notification.link_to && (
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              )}
                              <Badge variant="outline" className="text-xs py-0 h-4">
                                {notification.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t bg-gray-50 text-center">
                <Button variant="link" size="sm" className="text-xs text-gray-500">
                  View all in Service Desk
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
