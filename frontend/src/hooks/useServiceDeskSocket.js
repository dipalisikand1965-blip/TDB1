/**
 * Real-time WebSocket Hook for Service Desk
 * Provides instant ticket notifications and live updates
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../utils/api';

// Socket instance singleton
let socketInstance = null;

export const useServiceDeskSocket = (agentId, onNewTicket, onTicketUpdate, onNewMessage) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Create socket connection
    const apiUrl = getApiUrl();
    // Remove /api suffix if present and use http/https (Socket.IO handles transport)
    // If apiUrl is empty (relative path mode), use window.location.origin
    let baseUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
    if (!baseUrl && typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    }
    
    console.log('🔌 Connecting to Socket.IO at:', baseUrl);
    
    if (!socketInstance) {
      socketInstance = io(baseUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
        path: '/socket.io/',
        forceNew: false
      });
    }
    
    socketRef.current = socketInstance;
    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('🔌 Service Desk WebSocket connected');
      setConnected(true);
      setConnectionError(null);
      
      // Register agent
      if (agentId) {
        socket.emit('register_agent', { agent_id: agentId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Service Desk WebSocket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error.message);
      setConnectionError(error.message);
      setConnected(false);
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
      // Don't disconnect the singleton, just remove listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('ticket:new');
      socket.off('ticket:update');
      socket.off('ticket:message');
      socket.off('stats:update');
      socket.off('registration:success');
    };
  }, [agentId, onNewTicket, onTicketUpdate, onNewMessage]);

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
