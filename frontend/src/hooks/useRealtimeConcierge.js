/**
 * useRealtimeConcierge - Golden Standard Real-Time Communication Hook
 * =====================================================================
 * 
 * Features:
 * 1. WebSocket connection with auto-reconnect
 * 2. Message delivery states (sending → sent → delivered → read)
 * 3. Retry mechanism for failed messages
 * 4. Offline queue with auto-send on reconnect
 * 5. Typing indicators
 * 6. Read receipts (✓✓)
 * 7. Unread badge count
 * 8. Connection status (online/offline)
 * 9. Sound notifications
 * 10. Visual notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Message status constants
export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Connection status
export const ConnectionStatus = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting'
};

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZmblYN5c3N3f4WBe3RxcnZ8g4qOkI6Lh4J+fHt6eXl4eHh3d3Z2dnV1dHRzc3JycXFwcG9vbm5tbWxsa2tqamlpaGhoZ2dmZmVlZGRjY2JiYWFgYF9fXl5dXVxcW1taWllZWFhXV1ZWVVVUVFNTU1JSUVFRUFBPT09OTk1NTExLS0pKSUlISEdHRkZFRUREQ0NCQkFBQEA/Pz4+PT08PDo6OTk4ODc3NjY1NTQ0MzMyMjExMDAv';

const useRealtimeConcierge = ({
  userId,
  enabled = true,
  onNewMessage,
  onMessageStatusChange,
  onTypingChange,
  onConnectionChange,
  onUnreadCountChange
}) => {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.DISCONNECTED);
  const [adminOnline, setAdminOnline] = useState(false);
  
  // Message queue for offline support
  const [offlineQueue, setOfflineQueue] = useState([]);
  
  // Typing state
  const [typingUsers, setTypingUsers] = useState({}); // threadId -> Set of user ids
  
  // Unread count
  const [unreadCount, setUnreadCount] = useState(0);
  
  // WebSocket reference
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  
  // Audio reference for notification sound
  const audioRef = useRef(null);
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);
  
  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('[WS] Could not play notification sound:', err);
      });
    }
  }, []);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId || !enabled) return;
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setConnectionStatus(ConnectionStatus.CONNECTING);
    
    // Determine WebSocket URL - use current host for relative API URLs
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host; // Use current host since API_URL is relative
    const wsUrl = `${wsProtocol}//${wsHost}/api/concierge/realtime/ws/user/${userId}`;
    
    console.log('[WS] Connecting to:', wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
        setConnectionStatus(ConnectionStatus.CONNECTED);
        reconnectAttempts.current = 0;
        onConnectionChange?.(ConnectionStatus.CONNECTED);
        
        // Send any queued messages
        processOfflineQueue();
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('[WS] Error parsing message:', err);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        onConnectionChange?.(ConnectionStatus.DISCONNECTED);
        
        // Attempt reconnection
        if (enabled && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          setConnectionStatus(ConnectionStatus.RECONNECTING);
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WS] Reconnecting... attempt ${reconnectAttempts.current}`);
            connect();
          }, RECONNECT_DELAY * reconnectAttempts.current);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
      
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [userId, enabled, onConnectionChange]);
  
  // Handle incoming WebSocket messages
  const handleMessage = useCallback((data) => {
    console.log('[WS] Received:', data.type);
    
    switch (data.type) {
      case 'connected':
        setAdminOnline(data.admin_online);
        break;
        
      case 'admin_online':
        setAdminOnline(true);
        break;
        
      case 'admin_offline':
        setAdminOnline(false);
        break;
        
      case 'new_message':
        // New message from admin
        onNewMessage?.(data.message, data.thread_id);
        
        // Play sound if requested
        if (data.play_sound) {
          playNotificationSound();
        }
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        onUnreadCountChange?.(unreadCount + 1);
        break;
        
      case 'new_conversation':
        // Admin initiated a new conversation
        onNewMessage?.(data.message, data.thread?.id, data.thread);
        
        if (data.play_sound) {
          playNotificationSound();
        }
        
        setUnreadCount(prev => prev + 1);
        onUnreadCountChange?.(unreadCount + 1);
        break;
        
      case 'message_confirmed':
        // Our message was successfully sent
        onMessageStatusChange?.(data.temp_id, data.message);
        break;
        
      case 'message_failed':
        // Our message failed to send
        onMessageStatusChange?.(data.temp_id, null, data.error);
        break;
        
      case 'message_status_update':
        // Message status changed (delivered, read)
        onMessageStatusChange?.(data.message_id, { status: data.status });
        break;
        
      case 'messages_read':
        // Our messages were read
        data.message_ids?.forEach(id => {
          onMessageStatusChange?.(id, { status: MessageStatus.READ });
        });
        break;
        
      case 'typing_indicator':
        // Someone is typing
        setTypingUsers(prev => {
          const newState = { ...prev };
          const threadId = data.thread_id;
          
          if (!newState[threadId]) {
            newState[threadId] = new Set();
          }
          
          if (data.is_typing) {
            newState[threadId].add(data.sender || 'service_desk');
          } else {
            newState[threadId].delete(data.sender || 'service_desk');
          }
          
          return newState;
        });
        
        onTypingChange?.(data.thread_id, data.is_typing, data.sender);
        break;
        
      case 'pong':
        // Keep-alive response
        break;
        
      default:
        console.log('[WS] Unknown message type:', data.type);
    }
  }, [onNewMessage, onMessageStatusChange, onTypingChange, onUnreadCountChange, playNotificationSound, unreadCount]);
  
  // Process offline message queue
  const processOfflineQueue = useCallback(() => {
    if (offlineQueue.length === 0) return;
    
    console.log(`[WS] Processing ${offlineQueue.length} queued messages`);
    
    offlineQueue.forEach(msg => {
      sendMessage(msg.threadId, msg.content, msg.tempId);
    });
    
    setOfflineQueue([]);
  }, [offlineQueue]);
  
  // Send a message
  const sendMessage = useCallback((threadId, content, tempId = null) => {
    const msgTempId = tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If disconnected, queue the message
    if (connectionStatus !== ConnectionStatus.CONNECTED) {
      console.log('[WS] Offline - queueing message');
      setOfflineQueue(prev => [...prev, { threadId, content, tempId: msgTempId }]);
      return { tempId: msgTempId, status: MessageStatus.SENDING, queued: true };
    }
    
    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        thread_id: threadId,
        content: content,
        temp_id: msgTempId
      }));
      
      return { tempId: msgTempId, status: MessageStatus.SENDING, queued: false };
    }
    
    // Fallback: queue if WebSocket not ready
    setOfflineQueue(prev => [...prev, { threadId, content, tempId: msgTempId }]);
    return { tempId: msgTempId, status: MessageStatus.SENDING, queued: true };
  }, [connectionStatus]);
  
  // Retry a failed message
  const retryMessage = useCallback((threadId, content, tempId) => {
    console.log('[WS] Retrying message:', tempId);
    return sendMessage(threadId, content, tempId);
  }, [sendMessage]);
  
  // Send typing indicator
  const sendTyping = useCallback((threadId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        thread_id: threadId,
        is_typing: isTyping
      }));
    }
  }, []);
  
  // Mark messages as read
  const markAsRead = useCallback((threadId, messageIds) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        thread_id: threadId,
        message_ids: messageIds
      }));
    }
    
    // Also update local unread count
    setUnreadCount(prev => Math.max(0, prev - messageIds.length));
  }, []);
  
  // Get typing status for a thread
  const isTyping = useCallback((threadId) => {
    return typingUsers[threadId]?.size > 0;
  }, [typingUsers]);
  
  // Connect on mount and when userId changes
  useEffect(() => {
    if (userId && enabled) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, enabled, connect]);
  
  // Ping to keep connection alive
  useEffect(() => {
    if (connectionStatus !== ConnectionStatus.CONNECTED) return;
    
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, [connectionStatus]);
  
  // Fetch initial unread count
  useEffect(() => {
    if (!userId) return;
    
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/concierge/realtime/unread-count?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread_count || 0);
          onUnreadCountChange?.(data.unread_count || 0);
        }
      } catch (err) {
        console.log('[WS] Could not fetch unread count:', err);
      }
    };
    
    fetchUnreadCount();
  }, [userId, onUnreadCountChange]);
  
  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    isReconnecting: connectionStatus === ConnectionStatus.RECONNECTING,
    adminOnline,
    
    // Message operations
    sendMessage,
    retryMessage,
    
    // Typing indicators
    sendTyping,
    isTyping,
    
    // Read receipts
    markAsRead,
    
    // Unread count
    unreadCount,
    
    // Offline queue
    offlineQueueLength: offlineQueue.length,
    
    // Manual reconnect
    reconnect: connect,
    
    // Notification sound
    playNotificationSound
  };
};

export default useRealtimeConcierge;
