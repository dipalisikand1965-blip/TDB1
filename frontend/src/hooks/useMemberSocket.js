/**
 * useMemberSocket - WebSocket hook for real-time member notifications
 * 
 * Connects to the server's Socket.IO and handles:
 * - Ticket creation confirmations
 * - Inbox badge updates
 * - Real-time notification delivery
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const useMemberSocket = ({ email, token, onTicketCreated, onInboxBadgeUpdate, onNotification }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!email) return;

    // Create socket connection
    const socket = io(API_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setIsSyncing(false);
      
      // Register member with server
      socket.emit('register_member', { email, user_id: email });
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Member-specific events
    socket.on('member:registration_success', (data) => {
      console.log('[WebSocket] Member registered:', data);
    });

    socket.on('member:ticket_created', (data) => {
      console.log('[WebSocket] Ticket created:', data);
      if (onTicketCreated) {
        onTicketCreated(data);
      }
    });

    socket.on('member:inbox_badge', (data) => {
      console.log('[WebSocket] Inbox badge update:', data);
      if (onInboxBadgeUpdate) {
        onInboxBadgeUpdate(data.unread_count);
      }
    });

    socket.on('member:notification', (data) => {
      console.log('[WebSocket] New notification:', data);
      if (onNotification) {
        onNotification(data);
      }
    });

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [email, onTicketCreated, onInboxBadgeUpdate, onNotification]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setIsSyncing(true);
      socketRef.current.connect();
      
      // Set syncing state with timeout
      reconnectTimeoutRef.current = setTimeout(() => {
        setIsSyncing(false);
      }, 5000);
    }
  }, []);

  return {
    isConnected,
    isSyncing,
    reconnect,
    socket: socketRef.current,
  };
};

export default useMemberSocket;
