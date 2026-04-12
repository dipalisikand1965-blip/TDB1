/**
 * GlobalNotificationProvider
 * ==========================
 * Provides real-time WebSocket notifications EVERYWHERE in the app.
 * 
 * This wraps the entire authenticated app and ensures:
 * - Real-time ticket updates
 * - Real-time inbox badge updates
 * - Real-time notifications
 * 
 * Works on: MiraDemoPage, CarePage, DinePage, ALL pillar pages, everywhere.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../utils/api';
import { useAuth } from './AuthContext';
import { toast } from '../hooks/use-toast';

const GlobalNotificationContext = createContext({
  isConnected: false,
  inboxBadgeCount: 0,
  notifications: [],
  tickets: [],
  refreshInbox: () => {},
  clearNotification: () => {},
});

export const useGlobalNotifications = () => useContext(GlobalNotificationContext);

export const GlobalNotificationProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [inboxBadgeCount, setInboxBadgeCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't create multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    console.log('[GLOBAL SOCKET] Initializing WebSocket for:', user.email);

    // Create socket connection
    const socket = io(API_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: {
        token: token,
        email: user.email,
      }
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[GLOBAL SOCKET] ✅ Connected:', socket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Register as member
      socket.emit('register_member', { 
        email: user.email, 
        user_id: user.id || user.email,
        name: user.name 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[GLOBAL SOCKET] ❌ Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[GLOBAL SOCKET] Connection error:', error.message);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('[GLOBAL SOCKET] Max reconnect attempts reached');
      }
    });

    // Registration confirmation
    socket.on('member:registration_success', (data) => {
      console.log('[GLOBAL SOCKET] ✅ Registered as member:', data);
    });

    // Real-time ticket created
    socket.on('member:ticket_created', (data) => {
      console.log('[GLOBAL SOCKET] 🎫 New ticket:', data);
      setTickets(prev => [data, ...prev].slice(0, 20));
      
      // Show toast notification
      toast({
        title: '🎫 Request Received',
        description: data.message || `Your request has been submitted. Ticket: ${data.ticket_id}`,
      });
    });

    // Real-time ticket updated
    socket.on('member:ticket_updated', (data) => {
      console.log('[GLOBAL SOCKET] 🔄 Ticket updated:', data);
      setTickets(prev => prev.map(t => 
        t.ticket_id === data.ticket_id ? { ...t, ...data } : t
      ));
      
      toast({
        title: '🔄 Update on your request',
        description: data.message || `Ticket ${data.ticket_id} has been updated`,
      });
    });

    // Real-time inbox badge update
    socket.on('member:inbox_badge', (data) => {
      console.log('[GLOBAL SOCKET] 📬 Inbox badge:', data);
      setInboxBadgeCount(data.count || data.unread_count || 0);
    });

    // Real-time notification
    socket.on('member:notification', (data) => {
      console.log('[GLOBAL SOCKET] 🔔 Notification:', data);
      setNotifications(prev => [data, ...prev].slice(0, 50));
      
      // Show toast for important notifications
      if (data.show_toast !== false) {
        toast({
          title: data.title || '🔔 New Notification',
          description: data.message || data.content,
        });
      }
    });

    // Concierge reply
    socket.on('member:concierge_reply', (data) => {
      console.log('[GLOBAL SOCKET] 💬 Concierge reply:', data);
      toast({
        title: '💬 Concierge® Reply',
        description: data.preview || 'You have a new message from your concierge',
      });
    });

    // Service status update
    socket.on('member:service_status', (data) => {
      console.log('[GLOBAL SOCKET] 📋 Service status:', data);
      toast({
        title: `📋 ${data.service_type || 'Service'} Update`,
        description: data.message || `Status: ${data.status}`,
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('[GLOBAL SOCKET] Cleaning up...');
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('member:registration_success');
        socket.off('member:ticket_created');
        socket.off('member:ticket_updated');
        socket.off('member:inbox_badge');
        socket.off('member:notification');
        socket.off('member:concierge_reply');
        socket.off('member:service_status');
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.email, user?.id, user?.name, token]);

  // Refresh inbox badge count
  const refreshInbox = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`${API_URL}/api/unified-inbox/unread-count?email=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setInboxBadgeCount(data.count || 0);
      }
    } catch (error) {
      console.error('[GLOBAL SOCKET] Error refreshing inbox:', error);
    }
  }, [user?.email]);

  // Clear a notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const value = {
    isConnected,
    inboxBadgeCount,
    notifications,
    tickets,
    refreshInbox,
    clearNotification,
  };

  return (
    <GlobalNotificationContext.Provider value={value}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};

export default GlobalNotificationProvider;
