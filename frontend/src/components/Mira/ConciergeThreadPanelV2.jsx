/**
 * ConciergeThreadPanelV2 - Golden Standard Real-Time Communication
 * ==================================================================
 * 
 * Features:
 * 1. Real-time message sync (WebSocket)
 * 2. Message delivery states (✓ Sent, ✓✓ Delivered, ✓✓ Read - blue)
 * 3. Retry mechanism for failed messages
 * 4. Offline queue with visual indicator
 * 5. Guaranteed message ordering
 * 6. Typing indicators ("Admin is typing...")
 * 7. Read receipts
 * 8. Connection status indicator (green/red dot)
 * 9. Sound notifications
 * 10. Visual animations for new messages
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  X, Send, ChevronLeft, ChevronDown, ChevronUp, PawPrint,
  BookOpen, Wifi, WifiOff, Clock, Check, CheckCheck,
  AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import useRealtimeConcierge, { MessageStatus, ConnectionStatus } from '../../hooks/useRealtimeConcierge';

// Use relative URL for API calls
const API_BASE = '';

/**
 * Message Status Indicator - Shows delivery state
 */
const MessageStatusIndicator = ({ status, timestamp }) => {
  const getStatusIcon = () => {
    switch (status) {
      case MessageStatus.SENDING:
        return <Clock size={12} className="text-white/40 animate-pulse" />;
      case MessageStatus.SENT:
        return <Check size={14} className="text-white/50" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck size={14} className="text-white/50" />;
      case MessageStatus.READ:
        return <CheckCheck size={14} className="text-blue-400" />;
      case MessageStatus.FAILED:
        return <AlertCircle size={14} className="text-red-400" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <span className="text-[10px] text-white/30">
        {formatTime(timestamp)}
      </span>
      {getStatusIcon()}
    </div>
  );
};

/**
 * Connection Status Indicator
 */
const ConnectionIndicator = ({ status, adminOnline }) => {
  const getStatusConfig = () => {
    if (status === ConnectionStatus.CONNECTED && adminOnline) {
      return { color: 'bg-green-400', pulse: true, text: 'Live' };
    }
    if (status === ConnectionStatus.CONNECTED) {
      return { color: 'bg-amber-400', pulse: false, text: 'Offline hours' };
    }
    if (status === ConnectionStatus.RECONNECTING) {
      return { color: 'bg-amber-400', pulse: true, text: 'Reconnecting...' };
    }
    return { color: 'bg-red-400', pulse: false, text: 'Disconnected' };
  };
  
  const config = getStatusConfig();
  
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5">
      <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-white/60">{config.text}</span>
    </div>
  );
};

/**
 * Typing Indicator
 */
const TypingIndicator = ({ isTyping }) => {
  if (!isTyping) return null;
  
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-white/50 ml-2">Admin is typing...</span>
      </div>
    </div>
  );
};

/**
 * Offline Queue Banner
 */
const OfflineQueueBanner = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 border-b border-amber-500/30">
      <WifiOff size={14} className="text-amber-400" />
      <span className="text-xs text-amber-400">
        {count} message{count > 1 ? 's' : ''} queued - will send when online
      </span>
    </div>
  );
};

/**
 * Message Bubble Component with Status
 */
const MessageBubble = ({ message, onRetry }) => {
  const isUser = message.sender === 'user' || message.sender === 'member';
  const isFailed = message.status === MessageStatus.FAILED;
  
  return (
    <div 
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3 animate-fadeIn`}
    >
      {/* Status chip (only for concierge messages) */}
      {!isUser && message.status_chip && (
        <div className="mb-1 ml-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {message.status_chip}
          </span>
        </div>
      )}
      
      {/* Message bubble */}
      <div 
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
          isUser 
            ? isFailed
              ? 'bg-red-500/20 text-red-200 rounded-tr-sm border border-red-500/30'
              : 'bg-purple-500/30 text-white rounded-tr-sm' 
            : 'bg-white/10 text-white rounded-tl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
      
      {/* Status indicator (only for user messages) */}
      {isUser && (
        <div className="flex items-center gap-2 mt-0.5 px-1">
          <MessageStatusIndicator status={message.status} timestamp={message.timestamp} />
          
          {/* Retry button for failed messages */}
          {isFailed && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      )}
      
      {/* Timestamp for concierge messages */}
      {!isUser && message.timestamp && (
        <span className="text-[10px] text-white/30 mt-0.5 ml-1">
          {formatTime(message.timestamp)}
        </span>
      )}
    </div>
  );
};

/**
 * Format timestamp
 */
const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return '';
  }
};

/**
 * Context Drawer - Shows pet info and conversation context
 */
const ContextDrawer = ({ context, isOpen, onToggle }) => {
  if (!context) return null;
  
  const { pet, source, source_context, ticket } = context;
  
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors"
        data-testid="context-drawer-toggle"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={14} />
          What Mira knows
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-3 space-y-3">
          {/* Pet Info */}
          {pet && (
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <PawPrint size={18} className="text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{pet.name}</p>
                <p className="text-xs text-white/50">
                  {[pet.breed, pet.age_stage, pet.size].filter(Boolean).join(' • ')}
                </p>
                {pet.sensitivities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pet.sensitivities.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Source Context */}
          {source && source !== 'concierge_home' && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-xs text-purple-400 mb-1">Source</p>
              <p className="text-sm text-white">
                From {source.replace('_', ' ')}: {source_context?.learn_item?.title || source_context?.alert_type || 'Context'}
              </p>
            </div>
          )}
          
          {/* Linked Ticket */}
          {ticket && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50">Ticket</p>
                  <p className="text-sm text-white">{ticket.id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  ticket.status_display?.color === 'green' 
                    ? 'bg-green-500/20 text-green-400'
                    : ticket.status_display?.color === 'amber'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {ticket.status_display?.text || ticket.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ConciergeThreadPanelV2 Main Component
 */
const ConciergeThreadPanelV2 = ({ 
  isOpen, 
  onClose, 
  onBack,
  userId,
  threadId,
  initialThread = null,
  initialMessages = []
}) => {
  // Local state
  const [loading, setLoading] = useState(!initialThread);
  const [error, setError] = useState(null);
  const [thread, setThread] = useState(initialThread);
  const [messages, setMessages] = useState(initialMessages);
  const [contextDrawer, setContextDrawer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Real-time communication hook
  const {
    connectionStatus,
    isConnected,
    adminOnline,
    sendMessage,
    retryMessage,
    sendTyping,
    isTyping,
    markAsRead,
    offlineQueueLength
  } = useRealtimeConcierge({
    userId,
    enabled: isOpen && !!threadId,
    onNewMessage: (newMsg, msgThreadId) => {
      if (msgThreadId === threadId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Mark as read since user has thread open
        if (newMsg.id) {
          markAsRead(threadId, [newMsg.id]);
        }
      }
    },
    onMessageStatusChange: (tempIdOrMsgId, updatedMsg, errorMsg) => {
      setMessages(prev => prev.map(m => {
        if (m.temp_id === tempIdOrMsgId || m.id === tempIdOrMsgId) {
          if (errorMsg) {
            return { ...m, status: MessageStatus.FAILED, error: errorMsg };
          }
          return { ...m, ...updatedMsg };
        }
        return m;
      }));
    },
    onTypingChange: (typingThreadId, isTypingNow) => {
      // Handled by the hook's isTyping function
    }
  });
  
  // Scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);
  
  // Fetch thread data
  const fetchThread = useCallback(async () => {
    if (!threadId || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/os/concierge/thread/${threadId}?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      setThread(data.thread);
      setMessages(data.messages || []);
      setContextDrawer(data.context_drawer);
      
      // Mark all unread messages as read
      const unreadIds = (data.messages || [])
        .filter(m => m.sender === 'concierge' && m.status !== MessageStatus.READ)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        markAsRead(threadId, unreadIds);
      }
      
    } catch (err) {
      console.error('[ConciergeThread] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [threadId, userId, markAsRead]);
  
  // Load data when panel opens
  useEffect(() => {
    if (isOpen && threadId && !initialThread) {
      fetchThread();
    }
  }, [isOpen, threadId, initialThread, fetchThread]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Handle input change with typing indicator
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Send typing indicator
    if (value.length > 0) {
      sendTyping(threadId, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(threadId, false);
      }, 2000);
    } else {
      sendTyping(threadId, false);
    }
  }, [threadId, sendTyping]);
  
  // Handle send message
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    // Stop typing indicator
    sendTyping(threadId, false);
    
    // Generate temp ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      sender: 'user',
      content: content,
      timestamp: new Date().toISOString(),
      status: MessageStatus.SENDING
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Send via WebSocket
    sendMessage(threadId, content, tempId);
    
  }, [inputValue, threadId, sendMessage, sendTyping]);
  
  // Handle retry failed message
  const handleRetry = useCallback((message) => {
    // Remove the failed message
    setMessages(prev => prev.filter(m => m.id !== message.id && m.temp_id !== message.temp_id));
    
    // Re-send
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      sender: 'user',
      content: message.content,
      timestamp: new Date().toISOString(),
      status: MessageStatus.SENDING
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    retryMessage(threadId, message.content, tempId);
  }, [threadId, retryMessage]);
  
  // Check if admin is typing in this thread
  const adminIsTyping = isTyping(threadId);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end justify-center md:items-center"
      data-testid="concierge-thread-panel-v2"
    >
      <div 
        className="w-full max-w-lg h-[90vh] md:h-[85vh] bg-gray-900 rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden border border-white/10"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button
            onClick={onBack || onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="thread-back-button"
          >
            <ChevronLeft size={20} className="text-white/70" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-white truncate">
              {thread?.title || 'Conversation'}
            </h2>
            {thread?.pet_name && (
              <p className="text-xs text-white/50">with {thread.pet_name}</p>
            )}
          </div>
          
          {/* Connection Status */}
          <ConnectionIndicator status={connectionStatus} adminOnline={adminOnline} />
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="thread-close-button"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>
        
        {/* Offline Queue Banner */}
        <OfflineQueueBanner count={offlineQueueLength} />
        
        {/* Context Drawer */}
        <ContextDrawer
          context={contextDrawer}
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen(!drawerOpen)}
        />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button 
                onClick={fetchThread}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <MessageBubble
                  key={message.id || message.temp_id}
                  message={message}
                  onRetry={handleRetry}
                />
              ))}
              
              {/* Typing Indicator */}
              <TypingIndicator isTyping={adminIsTyping} />
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Bar */}
        <div className="px-4 py-3 border-t border-white/10 bg-gray-900/50">
          {/* Connection warning */}
          {!isConnected && connectionStatus !== ConnectionStatus.CONNECTING && (
            <div className="flex items-center justify-center gap-2 mb-2 text-xs text-amber-400">
              <WifiOff size={12} />
              Messages will be sent when connection is restored
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="w-full p-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                data-testid="thread-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-xl transition-all ${
                inputValue.trim()
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-white/10 text-white/30'
              }`}
              data-testid="thread-send-button"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConciergeThreadPanelV2;
