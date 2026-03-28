/**
 * TicketThread - Ticket thread view with two modes
 * 
 * Routes: /tickets/:ticketId (full mode)
 * Query params: ?event=:eventId (highlight specific update)
 * 
 * Props:
 * - ticketId: ticket ID (required in split mode)
 * - mode: "full" (mobile/standalone) or "split" (desktop inbox pane)
 * - onClose: callback to close the thread panel (split mode)
 * - onTicketUpdate: callback when ticket is updated (for parent refresh)
 * 
 * Features:
 * - mode="full": Full-screen with GlobalNav, mobile-first
 * - mode="split": Embedded in desktop inbox, no GlobalNav, constrained height
 * - "Apple-clear" Reply UX:
 *   - Visible Send button (paper plane icon)
 *   - Enter to send, Shift+Enter for newline
 *   - Optimistic UI: instant bubble with "Sending..." status
 *   - Failure state: "Not sent. Tap to retry."
 * - Uses /api/member/tickets/:ticketId/reply endpoint
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, MoreHorizontal, Sparkles, User, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, Info, RotateCcw,
  Send, Loader2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlobalNav from '../components/Mira/GlobalNav';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Check if two timestamps are within gap minutes
const withinGap = (ts1, ts2, gapMinutes = 10) => {
  if (!ts1 || !ts2) return false;
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return Math.abs(d1 - d2) < gapMinutes * 60 * 1000;
};

// Format timestamp smartly
const formatTimestamp = (dateString, prevDateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const prevDate = prevDateString ? new Date(prevDateString) : null;
  
  // Skip if within 10 minutes of previous
  if (prevDate && withinGap(dateString, prevDateString, 10)) {
    return null; // Don't show
  }
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Message bubble component
const MessageBubble = ({ message, isUser, showTimestamp, isHighlighted = false, isPending = false, onRetry, lightMode = false }) => {
  const isSending = message.status === 'sending';
  const isFailed = message.status === 'failed';
  
  return (
    <div 
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-1
        ${isHighlighted ? 'animate-highlight' : ''}
      `}
      data-message-id={message.id}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2.5
          ${isUser
            ? isFailed 
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-[#C96D9E] text-white'
            : lightMode
              ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
          }
          ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}
          ${isSending ? 'opacity-70' : ''}
        `}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className={`w-3.5 h-3.5 ${lightMode ? 'text-[#C96D9E]' : 'text-amber-400'}`} />
            <span className={`text-xs font-medium ${lightMode ? 'text-[#C96D9E]' : 'text-amber-400'}`}>Concierge®</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content || message.text || message.message}</p>
        
        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {isSending && (
            <span className="text-[10px] opacity-70 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sending...
            </span>
          )}
          {isFailed && (
            <button 
              onClick={onRetry}
              className="text-[10px] text-red-500 flex items-center gap-1 hover:text-red-400"
              data-testid="retry-message-btn"
            >
              <AlertCircle className="w-3 h-3" />
              Not sent. Tap to retry.
            </button>
          )}
          {!isPending && showTimestamp && (
            <span className={`text-[10px] ${lightMode ? 'text-gray-400' : 'opacity-60'}`}>{showTimestamp}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// System event chip (centered, deduplicated)
const SystemEventChip = ({ event }) => {
  const getEventStyle = () => {
    if (event.type === 'status_change' || event.content?.includes('Resolved')) {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    }
    if (event.type === 'assigned') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getEventText = () => {
    if (event.content?.includes('Resolved') || event.type === 'status_change') {
      return 'Status changed: Resolved';
    }
    return event.content || event.message || event.description || 'System update';
  };

  return (
    <div className="flex justify-center my-3">
      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventStyle()}`}>
        {getEventText()}
      </div>
    </div>
  );
};

// Ticket details sheet
const TicketDetailsSheet = ({ ticket, onClose }) => {
  if (!ticket) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#0d0d1a] rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-4">Ticket Details</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Ticket ID</span>
            <span className="text-white text-sm font-mono">{ticket.ticket_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Status</span>
            <span className={`text-sm px-2 py-0.5 rounded ${
              ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
              ticket.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {ticket.status?.replace('_', ' ') || 'Open'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Pet</span>
            <span className="text-white text-sm">{ticket.pet_name || 'General'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Pillar</span>
            <span className="text-white text-sm capitalize">{ticket.pillar || 'General'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Created</span>
            <span className="text-white text-sm">
              {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Last Updated</span>
            <span className="text-white text-sm">
              {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {ticket.assignee && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Assignee</span>
              <span className="text-white text-sm">{ticket.assignee}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-800 text-white font-medium rounded-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const TicketThread = ({ ticketId: ticketIdProp, mode = "full", onClose, onTicketUpdate }) => {
  const { ticketId: ticketIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  // Use prop if provided (split mode), otherwise use URL param (full mode)
  const ticketId = ticketIdProp || ticketIdParam;
  
  const highlightEventId = searchParams.get('event');
  const returnTo = searchParams.get('returnTo');
  const isSplitMode = mode === "split";
  
  // State
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Reply composer state
  const [replyText, setReplyText] = useState('');
  const [pendingMessages, setPendingMessages] = useState([]); // Optimistic UI
  const inputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const highlightRef = useRef(null);
  
  // Back button handler
  const handleBack = () => {
    if (onClose) {
      // Split mode: call onClose to clear ticket selection
      onClose();
    } else if (returnTo) {
      // Full mode with returnTo: navigate to specified path
      navigate(returnTo);
    } else if (window.history.length > 1) {
      // Full mode with history: go back
      navigate(-1);
    } else {
      // Full mode fallback: go to mira-demo
      navigate('/mira-os');
    }
  };

  // Scroll to bottom or highlighted event
  useEffect(() => {
    if (highlightEventId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, highlightEventId]);

  // Fetch ticket data - tries multiple endpoints for robustness
  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      // Try endpoints in order of most likely to succeed
      const endpoints = [
        `${API_URL}/api/mira/tickets/${ticketId}`,      // Mira tickets (most common)
        `${API_URL}/api/tickets/${ticketId}`,           // Unified tickets endpoint
        `${API_URL}/api/service_desk/ticket/${ticketId}` // Service desk tickets
      ];
      
      let response = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, { headers });
          if (response.ok) {
            console.log(`[TicketThread] Found ticket at: ${endpoint}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[TicketThread] Endpoint failed: ${endpoint}`, err);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error('Ticket not found');
      }
      
      const data = await response.json();
      const ticketData = data.ticket || data;
      setTicket(ticketData);
      
      // Extract and deduplicate messages
      const threadMessages = ticketData.messages || ticketData.conversation || ticketData.thread || [];
      
      // Deduplicate system events (same type + content within 1 minute)
      const deduped = [];
      const seenSystemEvents = new Set();
      
      for (const msg of threadMessages) {
        const isSystem = msg.type === 'system' || msg.type === 'status_change' || 
                        msg.content?.includes('Resolved') || msg.content?.includes('resolved');
        
        if (isSystem) {
          const key = `${msg.type || 'system'}-${msg.content || msg.message}`;
          if (!seenSystemEvents.has(key)) {
            seenSystemEvents.add(key);
            deduped.push({ ...msg, isSystem: true });
          }
        } else {
          deduped.push(msg);
        }
      }
      
      setMessages(deduped);
      
      // Mark all events in this ticket as read
      if (user?.email) {
        fetch(`${API_URL}/api/member/notifications/ticket/${ticketId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ user_email: user.email })
        }).catch(() => {});
      }
      
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId, token, user?.email]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Reopen ticket
  const handleReopenTicket = async () => {
    try {
      await fetch(`${API_URL}/api/service_desk/ticket/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ status: 'open' })
      });
      
      setTicket(prev => ({ ...prev, status: 'open' }));
    } catch (err) {
      console.error('Failed to reopen:', err);
    }
  };

  // Send reply with optimistic UI - THE NEW ENDPOINT
  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    
    // If ticket is resolved, reopen it first
    if (ticket?.status === 'resolved') {
      setTicket(prev => ({ ...prev, status: 'open' }));
    }
    
    // Create optimistic message with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: text,
      text: text,
      sender: 'member',
      timestamp: new Date().toISOString(),
      status: 'sending' // Optimistic UI state
    };
    
    // Clear input immediately
    setReplyText('');
    
    // Add to pending messages (optimistic)
    setPendingMessages(prev => [...prev, optimisticMessage]);
    
    try {
      // Call the NEW canonical endpoint
      const response = await fetch(`${API_URL}/api/member/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          text: text,
          attachments: []
        })
      });
      
      if (!response.ok) throw new Error('Failed to send reply');
      
      const result = await response.json();
      
      // Move from pending to confirmed messages
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setMessages(prev => [...prev, {
        id: result.message_id,
        content: text,
        text: text,
        sender: 'member',
        timestamp: result.timestamp || new Date().toISOString(),
        status: 'sent'
      }]);
      
      // Notify parent to refresh if needed
      onTicketUpdate?.();
      
    } catch (err) {
      console.error('Send failed:', err);
      // Update optimistic message to failed state
      setPendingMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed', originalText: text } : m
      ));
    }
  };

  // Retry failed message
  const handleRetryMessage = async (failedMsg) => {
    // Remove from pending
    setPendingMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    // Set text and trigger send
    setReplyText(failedMsg.originalText || failedMsg.text || failedMsg.content);
    // Small delay then send
    setTimeout(() => handleSendReply(), 100);
  };

  // Handle keyboard in composer
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
    // Shift+Enter allows newline (default behavior)
  };

  // Actions
  const handleArchive = async () => {
    try {
      await fetch(`${API_URL}/api/member/notifications/ticket/${ticketId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ user_email: user?.email })
      });
      navigate('/notifications');
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  // Get status styling
  const getStatusStyle = (status) => {
    const styles = {
      open: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-amber-500/20 text-amber-400',
      waiting: 'bg-purple-500/20 text-purple-400',
      resolved: 'bg-green-500/20 text-green-400',
      closed: 'bg-gray-500/20 text-gray-400'
    };
    return styles[status?.toLowerCase()] || styles.open;
  };

  const isResolved = ticket?.status === 'resolved';

  // Combine real messages + pending optimistic messages
  const allMessages = [...messages, ...pendingMessages];

  // Loading state
  if (loading) {
    return (
      <div className={`${isSplitMode ? 'h-full' : 'min-h-screen'} ${isSplitMode ? 'bg-white' : 'bg-[#0a0a14]'} flex items-center justify-center`}>
        <RefreshCw className="w-6 h-6 animate-spin text-[#C96D9E]" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${isSplitMode ? 'h-full' : 'min-h-screen'} ${isSplitMode ? 'bg-white' : 'bg-[#0a0a14]'} flex flex-col items-center justify-center ${isSplitMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
        <p>{error}</p>
        <div className="flex gap-3 mt-3">
          <button 
            onClick={fetchTicket} 
            className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium"
            data-testid="retry-load-btn"
          >
            Retry
          </button>
          <button 
            onClick={handleBack} 
            className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm"
            data-testid="error-back-btn"
          >
            {isSplitMode ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  // Theme: light for split mode (inside inbox), dark for full mode
  const theme = isSplitMode ? {
    bg: 'bg-white',
    headerBg: 'bg-white border-b border-gray-200',
    titleColor: 'text-gray-900',
    subtitleColor: 'text-gray-500',
    iconColor: 'text-gray-500',
    hoverBg: 'hover:bg-gray-100',
    messageBg: 'bg-[#FAF7F2]',
    composerBg: 'bg-white border-t border-gray-200',
    inputBg: 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C96D9E]/50 focus:ring-[#C96D9E]/20',
    resolvedText: 'text-gray-500',
    hintText: 'text-gray-400',
  } : {
    bg: 'bg-[#0a0a14]',
    headerBg: 'bg-[#0d0d1a] border-b border-gray-800/50',
    titleColor: 'text-white',
    subtitleColor: 'text-gray-500',
    iconColor: 'text-gray-300',
    hoverBg: 'hover:bg-gray-800',
    messageBg: 'bg-gray-800/80',
    composerBg: 'bg-[#0d0d1a] border-t border-gray-800/50',
    inputBg: 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-pink-500/50',
    resolvedText: 'text-gray-400',
    hintText: 'text-gray-600',
  };

  return (
    <div className={`${isSplitMode ? 'h-full flex flex-col' : 'min-h-screen flex flex-col'} ${theme.bg}`}>
      {/* CSS for highlight animation */}
      <style>{`
        @keyframes highlightPulse {
          0% { 
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
            background-color: rgba(234, 179, 8, 0.15);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(234, 179, 8, 0);
            background-color: rgba(234, 179, 8, 0.25);
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0);
            background-color: transparent;
          }
        }
        .animate-highlight {
          animation: highlightPulse 2s ease-in-out;
          border-radius: 12px;
        }
      `}</style>
      
      {/* Global Navigation - only show in full mode */}
      {!isSplitMode && <GlobalNav />}
      
      {/* Tappable Sticky Header */}
      <header 
        className={`sticky top-0 z-40 ${theme.headerBg} cursor-pointer flex-shrink-0`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button: always visible */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleBack();
              }}
              className={`p-2 rounded-full ${theme.hoverBg} flex-shrink-0`}
              data-testid="thread-back-btn"
            >
              <ArrowLeft className={`w-5 h-5 ${theme.iconColor}`} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className={`text-sm font-semibold ${theme.titleColor} truncate`}>
                  {ticket?.subject || ticket?.title || 'Conversation'}
                </h1>
                <Info className={`w-4 h-4 ${theme.subtitleColor} flex-shrink-0`} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] ${theme.subtitleColor} font-mono`}>{ticketId}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusStyle(ticket?.status)}`}>
                  {ticket?.status?.replace('_', ' ') || 'Open'}
                </span>
                {ticket?.pet_name && (
                  <span className={`text-[10px] ${theme.subtitleColor}`}>• {ticket.pet_name}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            
            {showActions && (
              <div 
                className="absolute top-full right-0 mt-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden min-w-[160px] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700/50"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${isSplitMode ? 'bg-[#FAFAF7]' : ''}`}>
        {/* ── Your Request — beautiful structured summary ── */}
        {ticket && (ticket.description || ticket.items || ticket.request_type) && (() => {
          const isOrder = ticket.request_type === 'product_order' || ticket.channel === 'shop' || (ticket.items && ticket.items.length > 0);
          
          if (isOrder) {
            // Beautiful order summary card
            return (
              <div className={`${isSplitMode ? 'bg-[#FAF7F2] border-[#E8DFD3]' : 'bg-gray-800/20 border-gray-700/30'} rounded-2xl p-4 mb-4 border`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🛒</span>
                  <span className={`text-sm font-semibold ${isSplitMode ? 'text-gray-800' : 'text-white'}`}>Your Order</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${isSplitMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'}`}>
                    {ticket.status || 'open'}
                  </span>
                </div>
                
                {/* Items */}
                {ticket.items && ticket.items.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {ticket.items.map((item, i) => (
                      <div key={i} className={`flex justify-between text-sm ${isSplitMode ? 'text-gray-700' : 'text-gray-200'}`}>
                        <span>{item.name} × {item.quantity}</span>
                        <span className={isSplitMode ? 'text-gray-500' : 'text-gray-400'}>₹{item.price * (item.quantity || 1)}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between text-sm font-bold pt-2 border-t ${isSplitMode ? 'border-gray-200 text-gray-800' : 'border-gray-700 text-white'}`}>
                      <span>Total</span>
                      <span className="text-[#C96D9E]">₹{ticket.total || '—'}</span>
                    </div>
                  </div>
                )}
                
                {/* Details row */}
                <div className={`space-y-1.5 text-xs ${isSplitMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {ticket.pet_name && (
                    <div className="flex items-center gap-1.5"><span>🐾</span><span>For {ticket.pet_name} ({ticket.pet_breed || 'dog'})</span></div>
                  )}
                  {ticket.delivery?.address && (
                    <div className="flex items-center gap-1.5"><span>📍</span><span>{ticket.delivery.address}, {ticket.delivery.city}</span></div>
                  )}
                  {ticket.delivery?.date && (
                    <div className="flex items-center gap-1.5"><span>📅</span><span>Delivery: {ticket.delivery.date}</span></div>
                  )}
                  {ticket.is_gift && (
                    <div className="flex items-center gap-1.5"><span>🎁</span><span>Gift — {ticket.gift_message || 'Wrapped as a gift'}</span></div>
                  )}
                  {ticket.special_instructions && (
                    <div className="flex items-center gap-1.5"><span>📝</span><span>{ticket.special_instructions}</span></div>
                  )}
                </div>
              </div>
            );
          }

          // Concierge / soul_made tickets — formatted text
          if (ticket.description) {
            // Show only the member-facing part (strip the admin ━━━ header blocks)
            const cleanDesc = ticket.description
              .replace(/━+/g, '—')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
            return (
              <div className={`${isSplitMode ? 'bg-[#FAF7F2] border-[#E8DFD3]' : 'bg-gray-800/30 border-gray-700/30'} rounded-xl p-3 mb-4 border`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#C96D9E]" />
                  <span className="text-xs font-medium text-[#C96D9E]">Your Request</span>
                </div>
                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isSplitMode ? 'text-gray-600' : 'text-gray-300'}`}>
                  {cleanDesc}
                </p>
              </div>
            );
          }
          return null;
        })()}
        
        {/* Messages (including optimistic pending messages) */}
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          allMessages.map((msg, idx) => {
            const isUser = msg.sender === 'member' || msg.sender === 'user' || msg.sender === user?.email;
            const isSystem = msg.isSystem || msg.type === 'system' || msg.type === 'status_change';
            const isHighlighted = msg.id === highlightEventId;
            const isPending = msg.status === 'sending' || msg.status === 'failed';
            
            // Smart timestamp: only show if gap > 10 minutes from previous
            const prevMsg = allMessages[idx - 1];
            const timestamp = formatTimestamp(msg.timestamp || msg.created_at, prevMsg?.timestamp || prevMsg?.created_at);
            
            if (isSystem) {
              return <SystemEventChip key={msg.id || idx} event={msg} />;
            }
            
            return (
              <div key={msg.id || idx} ref={isHighlighted ? highlightRef : null}>
                <MessageBubble 
                  message={msg}
                  isUser={isUser}
                  showTimestamp={timestamp}
                  isHighlighted={isHighlighted}
                  isPending={isPending}
                  onRetry={msg.status === 'failed' ? () => handleRetryMessage(msg) : undefined}
                  lightMode={isSplitMode}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply Section - Apple-clear Composer */}
      {isResolved ? (
        // Resolved ticket: show Reopen button
        <div className={`p-4 ${theme.composerBg} flex-shrink-0`}>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${theme.resolvedText}`}>This ticket is resolved</span>
            <button
              onClick={handleReopenTicket}
              className="flex items-center gap-2 px-4 py-2 bg-[#C96D9E] text-white rounded-full text-sm font-medium"
              data-testid="reopen-ticket-btn"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen
            </button>
          </div>
        </div>
      ) : (
        // Open ticket: inline composer
        <div className={`p-3 ${theme.composerBg} flex-shrink-0`}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={`flex-1 border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none min-h-[44px] max-h-32 ${theme.inputBg}`}
              rows={1}
              data-testid="reply-input"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className={`
                p-2.5 rounded-full transition-all flex-shrink-0
                ${replyText.trim() 
                  ? 'bg-[#C96D9E] hover:bg-[#B05C8A] text-white' 
                  : isSplitMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }
              `}
              data-testid="send-reply-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className={`text-[10px] ${theme.hintText} text-center mt-1.5`}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
      
      {/* Ticket Details Sheet */}
      {showDetails && (
        <TicketDetailsSheet ticket={ticket} onClose={() => setShowDetails(false)} />
      )}
      
      {/* Backdrop for actions menu */}
      {showActions && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default TicketThread;
