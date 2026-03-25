/**
 * AdminConciergeDashboard - Service Desk Real-Time Communication
 * ================================================================
 * 
 * Admin/Service desk view for managing concierge conversations.
 * Features:
 * - Real-time WebSocket connection
 * - View all threads with unread indicators
 * - Initiate new conversations with users
 * - Reply to user messages
 * - See user online status
 * - Typing indicators
 * - Message delivery status
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageCircle, Users, Send, Search, Plus, X, Check, CheckCheck,
  Clock, Wifi, WifiOff, ChevronRight, PawPrint, User, RefreshCw,
  Mail, Phone, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

// Connection status
const ConnectionStatus = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected'
};

/**
 * Admin WebSocket Hook
 */
const useAdminWebSocket = ({ enabled, onNewMessage, onUserStatusChange, onTypingChange }) => {
  const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.DISCONNECTED);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const connect = useCallback(() => {
    if (!enabled) return;
    
    setConnectionStatus(ConnectionStatus.CONNECTING);
    
    // Use current host for WebSocket URL since API_URL is relative
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/concierge/realtime/ws/admin`;
    
    console.log('[ADMIN WS] Connecting to:', wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[ADMIN WS] Connected');
        setConnectionStatus(ConnectionStatus.CONNECTED);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('[ADMIN WS] Parse error:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('[ADMIN WS] Disconnected');
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        
        // Reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
      
      wsRef.current.onerror = (err) => {
        console.error('[ADMIN WS] Error:', err);
      };
      
    } catch (err) {
      console.error('[ADMIN WS] Connection failed:', err);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [enabled]);
  
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        setOnlineUsers(data.online_users || []);
        break;
        
      case 'user_online':
        setOnlineUsers(prev => [...new Set([...prev, data.user_id])]);
        onUserStatusChange?.(data.user_id, true);
        break;
        
      case 'user_offline':
        setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
        onUserStatusChange?.(data.user_id, false);
        break;
        
      case 'new_message':
        onNewMessage?.(data);
        break;
        
      case 'typing_indicator':
        onTypingChange?.(data.thread_id, data.user_id, data.is_typing);
        break;
        
      case 'messages_read':
        // User read our messages
        break;
        
      case 'pong':
        break;
        
      default:
        console.log('[ADMIN WS] Unknown type:', data.type);
    }
  }, [onNewMessage, onUserStatusChange, onTypingChange]);
  
  const sendMessage = useCallback((threadId, content, statusChip = null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        thread_id: threadId,
        content: content,
        status_chip: statusChip
      }));
      return true;
    }
    return false;
  }, []);
  
  const initiateConversation = useCallback((userId, petId, subject, initialMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'initiate_conversation',
        user_id: userId,
        pet_id: petId,
        subject: subject,
        initial_message: initialMessage
      }));
      return true;
    }
    return false;
  }, []);
  
  const sendTyping = useCallback((threadId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        thread_id: threadId,
        is_typing: isTyping
      }));
    }
  }, []);
  
  const markAsRead = useCallback((threadId, messageIds) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        thread_id: threadId,
        message_ids: messageIds
      }));
    }
  }, []);
  
  useEffect(() => {
    if (enabled) {
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
  }, [enabled, connect]);
  
  // Keep-alive ping
  useEffect(() => {
    if (connectionStatus !== ConnectionStatus.CONNECTED) return;
    
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);
  
  return {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    onlineUsers,
    sendMessage,
    initiateConversation,
    sendTyping,
    markAsRead,
    reconnect: connect
  };
};

/**
 * Thread List Item
 */
const ThreadListItem = ({ thread, isSelected, onClick, isUserOnline, isUserTyping }) => {
  const hasUnread = thread.unread_count > 0 || thread.status === 'awaiting_concierge';
  
  return (
    <button
      onClick={() => onClick(thread)}
      className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
        isSelected ? 'bg-purple-500/20 border-l-2 border-l-purple-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* User avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <User size={18} className="text-white/50" />
          </div>
          {isUserOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-white truncate">
              {thread.user_name || 'Unknown User'}
            </span>
            <span className="text-xs text-white/40">
              {formatTime(thread.last_message_at)}
            </span>
          </div>
          
          {/* Pet name */}
          {thread.pet_name && (
            <div className="flex items-center gap-1 mb-1">
              <PawPrint size={10} className="text-purple-400" />
              <span className="text-xs text-purple-400">{thread.pet_name}</span>
            </div>
          )}
          
          {/* Preview / Typing */}
          {isUserTyping ? (
            <p className="text-xs text-purple-400 italic">typing...</p>
          ) : (
            <p className="text-xs text-white/50 truncate">
              {thread.last_message_preview}
            </p>
          )}
        </div>
        
        {/* Unread badge */}
        {hasUnread && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
            {thread.unread_count || '!'}
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * Message Component for Admin View
 * Shows (Pet name) for user messages and Concierge® for admin messages
 */
const AdminMessageBubble = ({ message, petName }) => {
  const isAdmin = message.sender === 'concierge' || message.source === 'service_desk';
  const senderLabel = isAdmin ? 'Concierge®' : (petName ? `(${petName})` : 'Member');
  
  return (
    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} mb-3`}>
      {/* Sender label */}
      <span className={`text-[10px] mb-1 px-1 ${isAdmin ? 'text-purple-400' : 'text-amber-400'}`}>
        {senderLabel}
      </span>
      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
        isAdmin 
          ? 'bg-purple-500/30 text-white rounded-tr-sm' 
          : 'bg-white/10 text-white rounded-tl-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
      <div className="flex items-center gap-1 mt-0.5 px-1">
        <span className="text-[10px] text-white/30">
          {formatTime(message.timestamp)}
        </span>
        {isAdmin && message.status && (
          message.status === 'read' 
            ? <CheckCheck size={12} className="text-blue-400" />
            : message.status === 'delivered'
            ? <CheckCheck size={12} className="text-white/40" />
            : <Check size={12} className="text-white/40" />
        )}
      </div>
    </div>
  );
};

/**
 * New Conversation Modal
 */
const NewConversationModal = ({ isOpen, onClose, onSubmit, users, loadingUsers }) => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  if (!isOpen) return null;
  
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleSubmit = () => {
    if (!selectedUser || !message.trim()) return;
    
    onSubmit({
      user_id: selectedUser.id,
      pet_id: selectedPet?.id,
      subject: subject || 'Hello from Concierge®',
      initial_message: message.trim()
    });
    
    // Reset form
    setSelectedUser(null);
    setSelectedPet(null);
    setSubject('');
    setMessage('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">New Conversation</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={20} className="text-white/70" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* User Selection */}
          {!selectedUser ? (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <p className="text-center text-white/50 py-4">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-white/50 py-4">No users found</p>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <User size={14} className="text-white/50" />
                        </div>
                        {user.is_online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{user.name}</p>
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      </div>
                      {user.pets?.length > 0 && (
                        <span className="text-xs text-purple-400">
                          {user.pets.length} pet{user.pets.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected User Display */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{selectedUser.name}</p>
                    <p className="text-xs text-white/50">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Change
                </button>
              </div>
              
              {/* Pet Selection (if user has pets) */}
              {selectedUser.pets?.length > 0 && (
                <div>
                  <label className="block text-xs text-white/50 mb-2">Regarding pet (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selectedPet?.id === pet.id
                            ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <PawPrint size={12} />
                        {pet.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Subject */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Hello from Concierge®"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none"
                />
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        {selectedUser && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Format timestamp with relative time (Feature 14)
 */
const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    // Just now (< 1 minute)
    if (diffMinutes < 1) {
      return 'Just now';
    }
    
    // Within the last hour
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    
    // Today
    if (isToday(date)) {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 6) {
        return `${diffHours}h ago`;
      }
      return format(date, 'h:mm a');
    }
    
    // Yesterday
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    // Within last week
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return format(date, 'EEE'); // Short day name
    }
    
    // Older
    return format(date, 'MMM d');
  } catch {
    return '';
  }
};

/**
 * AdminConciergeDashboard Main Component
 */
const AdminConciergeDashboard = () => {
  // State
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // threadId -> userId
  
  // Search state (Feature 13)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // WebSocket hook
  const {
    connectionStatus,
    isConnected,
    onlineUsers,
    sendMessage,
    initiateConversation,
    sendTyping,
    markAsRead,
    reconnect
  } = useAdminWebSocket({
    enabled: true,
    onNewMessage: (data) => {
      // Add to messages if viewing this thread
      if (selectedThread?.id === data.thread_id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message?.id)) return prev;
          return [...prev, data.message];
        });
        
        // Mark as read
        if (data.message?.id) {
          markAsRead(data.thread_id, [data.message.id]);
        }
      }
      
      // Update thread list
      fetchThreads();
    },
    onUserStatusChange: (userId, isOnline) => {
      // Update thread list to reflect online status
      setThreads(prev => prev.map(t => ({
        ...t,
        is_user_online: t.user_id === userId ? isOnline : t.is_user_online
      })));
    },
    onTypingChange: (threadId, userId, isTyping) => {
      setTypingUsers(prev => ({
        ...prev,
        [threadId]: isTyping ? userId : null
      }));
    }
  });
  
  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const response = await fetch(`/api/os/concierge/admin/threads?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error('[ADMIN] Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch messages for a thread
  const fetchMessages = useCallback(async (threadId) => {
    try {
      const response = await fetch(`/api/os/concierge/admin/thread/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark unread messages as read
        const unreadIds = (data.messages || [])
          .filter(m => m.sender === 'user' && m.status !== 'read')
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          markAsRead(threadId, unreadIds);
        }
      }
    } catch (err) {
      console.error('[ADMIN] Error fetching messages:', err);
    }
  }, [markAsRead]);
  
  // Fetch users for new conversation
  const fetchUsers = useCallback(async (search = '') => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/concierge/realtime/admin/users?search=${encodeURIComponent(search)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('[ADMIN] Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);
  
  // Search messages (Feature 13)
  const searchMessages = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const response = await fetch(`/api/concierge/realtime/admin/search?q=${encodeURIComponent(query)}&limit=30`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('[ADMIN] Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchMessages(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchMessages]);
  
  // Handle search result click
  const handleSearchResultClick = (result) => {
    // Find the thread and select it
    const thread = threads.find(t => t.id === result.thread_id);
    if (thread) {
      setSelectedThread(thread);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);
  
  // Load messages when thread selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread, fetchMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle selecting a thread
  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setMessages([]);
  };
  
  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (selectedThread && e.target.value.length > 0) {
      sendTyping(selectedThread.id, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(selectedThread.id, false);
      }, 2000);
    }
  };
  
  // Handle send message
  const handleSend = () => {
    if (!inputValue.trim() || !selectedThread) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    // Stop typing indicator
    sendTyping(selectedThread.id, false);
    
    // Send via WebSocket
    const sent = sendMessage(selectedThread.id, content);
    
    if (sent) {
      // Optimistic update
      const tempMsg = {
        id: `temp_${Date.now()}`,
        sender: 'concierge',
        content: content,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, tempMsg]);
    } else {
      // Fallback to REST
      fetch(`/api/os/concierge/admin/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          content: content
        })
      }).then(() => fetchMessages(selectedThread.id));
    }
  };
  
  // Handle new conversation
  const handleNewConversation = (data) => {
    const sent = initiateConversation(data.user_id, data.pet_id, data.subject, data.initial_message);
    
    if (!sent) {
      // Fallback to REST
      fetch(`/api/concierge/realtime/admin/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(() => fetchThreads());
    }
    
    // Refresh threads after a short delay
    setTimeout(fetchThreads, 1000);
  };
  
  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar - Thread List */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-purple-400" />
            <h2 className="text-lg font-medium text-white">Concierge®</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            
            {/* New Conversation Button */}
            <button
              onClick={() => {
                fetchUsers();
                setShowNewConversation(true);
              }}
              className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
              title="New Conversation"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {onlineUsers.length} online
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} />
            {threads.filter(t => t.status === 'awaiting_concierge').length} pending
          </span>
        </div>
        
        {/* Search Bar (Feature 13) */}
        <div className="relative px-3 py-2 border-b border-white/5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-8 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
              data-testid="message-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full z-50 mx-3 mt-1 max-h-64 overflow-y-auto bg-gray-800 border border-white/10 rounded-lg shadow-xl">
              {isSearching ? (
                <div className="p-4 text-center text-white/50 text-sm">
                  <RefreshCw size={16} className="inline-block animate-spin mr-2" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-white/50 text-sm">
                  No messages found
                </div>
              ) : (
                searchResults.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                    data-testid={`search-result-${idx}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-purple-400">{result.pet_name || result.user_name}</span>
                      <span className="text-xs text-white/30">{formatTime(result.timestamp)}</span>
                    </div>
                    <p className="text-sm text-white/80 truncate">{result.content}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            threads.map(thread => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThread?.id === thread.id}
                onClick={handleSelectThread}
                isUserOnline={onlineUsers.includes(thread.user_id)}
                isUserTyping={typingUsers[thread.id]}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Main - Conversation View */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={18} className="text-white/50" />
                  </div>
                  {onlineUsers.includes(selectedThread.user_id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    {selectedThread.user_name}
                  </h3>
                  <p className="text-xs text-white/50">
                    {selectedThread.pet_name && `${selectedThread.pet_name} • `}
                    {selectedThread.title}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedThread(null)}
                className="p-2 rounded-lg hover:bg-white/5"
              >
                <X size={18} className="text-white/50" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.map(msg => (
                <AdminMessageBubble key={msg.id} message={msg} petName={selectedThread.pet_name} />
              ))}
              
              {/* Typing indicator */}
              {typingUsers[selectedThread.id] && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-[10px] text-amber-400 ml-1">({selectedThread.pet_name || 'Member'})</span>
                  <div className="flex gap-1 px-3 py-2 bg-white/5 rounded-2xl rounded-tl-sm">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-white/40">typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10">
              {/* Channel selector for omnichannel (WhatsApp/Email/In-app) */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/40">Send via:</span>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  title="In-app chat"
                  data-testid="channel-inapp"
                >
                  <MessageCircle size={12} />
                  Chat
                </button>
                <button
                  onClick={() => {
                    if (selectedThread?.user_phone) {
                      window.open(`https://wa.me/${selectedThread.user_phone}?text=${encodeURIComponent(inputValue)}`, '_blank');
                    } else {
                      alert('No phone number on file for this user');
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/5 text-green-400 border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-colors"
                  title="Send via WhatsApp"
                  data-testid="channel-whatsapp"
                >
                  <Phone size={12} />
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    if (selectedThread?.user_email) {
                      // Trigger email compose
                      const subject = `Re: ${selectedThread.title || 'Your inquiry'}`;
                      window.open(`mailto:${selectedThread.user_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inputValue)}`, '_blank');
                    } else {
                      alert('No email on file for this user');
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/5 text-blue-400 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors"
                  title="Send via Email"
                  data-testid="channel-email"
                >
                  <Mail size={12} />
                  Email
                </button>
              </div>
              
              <div className="flex items-end gap-2">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type a reply..."
                  className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-500/50"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`p-3 rounded-xl transition-colors ${
                    inputValue.trim()
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-white/10 text-white/30'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">or start a new one</p>
            </div>
          </div>
        )}
      </div>
      
      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onSubmit={handleNewConversation}
        users={users}
        loadingUsers={loadingUsers}
      />
    </div>
  );
};

export default AdminConciergeDashboard;
