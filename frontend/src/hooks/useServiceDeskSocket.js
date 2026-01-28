/**
 * Real-time WebSocket Hook for Service Desk
 * Provides instant ticket notifications and live updates
 * 
 * Production-Ready with:
 * - Exponential backoff reconnection
 * - Graceful degradation to polling
 * - Connection health monitoring
 * - Automatic recovery
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Socket instance singleton
let socketInstance = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

// Get the correct Socket.IO URL for different environments
const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use the env variable or fallback to localhost:8001
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    return backendUrl.replace('/api', '').replace(/\/$/, '');
  }
  
  // For production/preview - use same origin (K8s ingress handles routing)
  // The ingress should route /socket.io/ to the backend service
  return `${protocol}//${window.location.host}`;
};

// Calculate exponential backoff delay
const getReconnectDelay = (attempt) => {
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 30000);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

export const useServiceDeskSocket = (agentId, onNewTicket, onTicketUpdate, onNewMessage) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, reconnecting
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    console.log('🔌 Socket.IO Configuration:', { socketUrl, isLocalhost });
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (!socketInstance) {
      setConnectionState('connecting');
      
      socketInstance = io(socketUrl, {
        // Start with polling for reliability, upgrade to websocket if available
        transports: ['polling', 'websocket'],
        upgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: BASE_RECONNECT_DELAY,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
        timeout: 20000,
        path: '/socket.io/',
        forceNew: false,
        withCredentials: false,
        // Enable ping/pong for connection health
        pingTimeout: 30000,
        pingInterval: 25000
      });
    }
    
    socketRef.current = socketInstance;
    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('🔌 Service Desk WebSocket connected successfully');
      reconnectAttempts = 0; // Reset on successful connection
      setConnected(true);
      setConnectionError(null);
      setConnectionState('connected');
      
      // Register agent
      if (agentId) {
        socket.emit('register_agent', { agent_id: agentId });
      }
      
      // Start heartbeat monitoring
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat', { timestamp: Date.now() });
        }
      }, 30000); // Heartbeat every 30 seconds
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Service Desk WebSocket disconnected:', reason);
      setConnected(false);
      setConnectionState('disconnected');
      
      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - try to reconnect
        console.log('🔌 Server disconnected, attempting reconnect...');
        socket.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Network issue - will auto-reconnect with backoff
        setConnectionState('reconnecting');
        console.log('🔌 Connection lost, auto-reconnecting...');
      }
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts++;
      console.error(`🔌 WebSocket connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
      setConnectionError(error.message);
      setConnected(false);
      setConnectionState('reconnecting');
      
      // If max attempts reached, try a full reconnect after a longer delay
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('🔌 Max reconnect attempts reached, will retry in 60s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts = 0;
          socket.connect();
        }, 60000);
      }
    });
    
    // Handle reconnection events
    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 Reconnected after ${attemptNumber} attempts`);
      setConnectionState('connected');
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔌 Reconnection attempt ${attemptNumber}...`);
      setConnectionState('reconnecting');
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error.message);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed after all attempts');
      setConnectionState('disconnected');
    });

    // Ticket event handlers
    socket.on('ticket:new', (data) => {
      console.log('📩 New ticket received:', data);
      if (onNewTicket) {
        onNewTicket(data);
      }
    });

    socket.on('ticket:update', (data) => {
      console.log('📝 Ticket updated:', data);
      if (onTicketUpdate) {
        onTicketUpdate(data);
      }
    });

    socket.on('ticket:message', (data) => {
      console.log('💬 New message received:', data);
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    // Stats update handler
    socket.on('stats:update', (data) => {
      console.log('📊 Stats updated:', data);
    });

    // Registration confirmation
    socket.on('registration:success', (data) => {
      console.log('✅ Agent registered:', data.agent_id);
    });

    // Cleanup on unmount
    return () => {
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Don't disconnect the singleton, just remove listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.off('ticket:new');
      socket.off('ticket:update');
      socket.off('ticket:message');
      socket.off('stats:update');
      socket.off('registration:success');
    };
  }, [agentId, onNewTicket, onTicketUpdate, onNewMessage]);
  
  // Manual reconnect function for UI
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      reconnectAttempts = 0;
      setConnectionState('connecting');
      socketRef.current.connect();
    }
  }, []);

  // Subscribe to a specific ticket for focused updates
  const subscribeToTicket = useCallback((ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('subscribe_ticket', { ticket_id: ticketId });
    }
  }, []);

  // Unsubscribe from a ticket
  const unsubscribeFromTicket = useCallback((ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('unsubscribe_ticket', { ticket_id: ticketId });
    }
  }, []);

  // Emit typing indicator
  const startTyping = useCallback((ticketId, agentName) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('typing_start', { ticket_id: ticketId, agent_name: agentName });
    }
  }, []);

  const stopTyping = useCallback((ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('typing_stop', { ticket_id: ticketId });
    }
  }, []);

  return {
    connected,
    connectionError,
    subscribeToTicket,
    unsubscribeFromTicket,
    startTyping,
    stopTyping
  };
};

// Simple toast notification component for real-time updates
export const TicketNotificationToast = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'new_ticket': return '📩';
      case 'new_message': return '💬';
      case 'status_change': return '📝';
      default: return '🔔';
    }
  };

  const getChannelBadge = () => {
    const channel = notification.channel || notification.data?.channel;
    if (channel === 'whatsapp') return '📱 WhatsApp';
    if (channel === 'email') return '📧 Email';
    if (channel === 'web') return '🌐 Web';
    return null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm truncate">
                {notification.ticket_id || 'New Activity'}
              </span>
              {getChannelBadge() && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {getChannelBadge()}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.message?.content?.substring(0, 100) || 
               notification.ticket?.subject || 
               'New update available'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button 
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default useServiceDeskSocket;
