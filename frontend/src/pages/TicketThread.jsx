/**
 * TicketThread - Full-screen ticket thread view
 * 
 * Routes: /tickets/:ticketId
 * Query params: ?event=:eventId (highlight specific update)
 * 
 * Props (for embedded mode):
 * - ticketIdProp: ticket ID when rendered inside NotificationsInbox
 * - isEmbedded: true when rendered in split view
 * - onClose: callback to close the thread panel
 * 
 * Features:
 * - Full-screen on mobile (no drawers)
 * - Tappable sticky header → details sheet
 * - Deduplicated system events as centered chips
 * - Message alignment: member right, concierge left
 * - Smart timestamps (gaps > 10min)
 * - Resolved ticket: disabled composer + "Reopen" button
 * - Bottom sheet composer on tap
 * - Deep-link highlight (auto-scroll + 2s highlight)
 * - Actions menu: Mark unread, Archive
 * - GlobalNav on full-screen mode (Dashboard | Inbox)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, MoreHorizontal, Sparkles, User, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, Info, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReplySheet from '../components/Mira/ReplySheet';
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
const MessageBubble = ({ message, isUser, showTimestamp, isHighlighted = false }) => {
  return (
    <div 
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-1
        ${isHighlighted ? 'animate-highlight' : ''}
      `}
      data-message-id={message.id}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2.5
          ${isUser
            ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white'
            : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
          }
          ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}
        `}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Concierge</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content || message.text || message.message}</p>
        {showTimestamp && (
          <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] opacity-60">{showTimestamp}</span>
          </div>
        )}
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

const TicketThread = ({ ticketIdProp, isEmbedded = false, onClose }) => {
  const { ticketId: ticketIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  // Use prop if provided (embedded mode), otherwise use URL param
  const ticketId = ticketIdProp || ticketIdParam;
  
  const highlightEventId = searchParams.get('event');
  const isEmbed = isEmbedded || searchParams.get('embed') === 'true';
  
  // State
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const highlightRef = useRef(null);

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

  // Fetch ticket data
  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try mira_tickets endpoint first (most common)
      let response = await fetch(`${API_URL}/api/mira/tickets/${ticketId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        response = await fetch(`${API_URL}/api/service_desk/ticket/${ticketId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
      }
      
      if (!response.ok) {
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

  // Send reply
  const handleSendReply = async ({ content, attachments }) => {
    // If ticket is resolved, reopen it first
    if (ticket?.status === 'resolved') {
      await handleReopenTicket();
    }
    
    const response = await fetch(`${API_URL}/api/service_desk/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        content,
        sender_email: user?.email
      })
    });
    
    if (!response.ok) throw new Error('Failed to send reply');
    
    const result = await response.json();
    
    // Add message to local state
    setMessages(prev => [...prev, {
      id: result.message_id,
      content,
      sender: 'member',
      timestamp: new Date().toISOString()
    }]);
    
    return result;
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
        <p>{error}</p>
        <button onClick={() => navigate('/notifications')} className="mt-3 text-pink-400 text-sm">
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0a0a14] flex flex-col`}>
      {/* CSS for highlight animation - more visible pulse */}
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
      
      {/* Global Navigation - only show when not embedded */}
      {!isEmbed && <GlobalNav />}
      
      {/* Tappable Sticky Header */}
      <header 
        className="sticky top-0 z-40 bg-[#0d0d1a] border-b border-gray-800/50 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isEmbed && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) {
                    onClose();
                  } else {
                    navigate('/notifications');
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-800 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white truncate">
                  {ticket?.subject || ticket?.title || 'Conversation'}
                </h1>
                <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-500 font-mono">{ticketId}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusStyle(ticket?.status)}`}>
                  {ticket?.status?.replace('_', ' ') || 'Open'}
                </span>
                {ticket?.pet_name && (
                  <span className="text-[10px] text-gray-400">• {ticket.pet_name}</span>
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Request summary card */}
        {ticket?.description && (
          <div className="bg-gray-800/30 rounded-xl p-3 mb-4 border border-gray-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-medium text-pink-400">Your Request</span>
            </div>
            <p className="text-sm text-gray-300">{ticket.description}</p>
          </div>
        )}
        
        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'member' || msg.sender === 'user' || msg.sender === user?.email;
            const isSystem = msg.isSystem || msg.type === 'system' || msg.type === 'status_change';
            const isHighlighted = msg.id === highlightEventId;
            
            // Smart timestamp: only show if gap > 10 minutes from previous
            const prevMsg = messages[idx - 1];
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
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply Section */}
      {isResolved ? (
        // Resolved ticket: show Reopen button
        <div className="p-4 border-t border-gray-800/50 bg-[#0d0d1a]">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-gray-400">This ticket is resolved</span>
            <button
              onClick={handleReopenTicket}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen Ticket
            </button>
          </div>
        </div>
      ) : (
        // Open ticket: show reply composer
        <ReplySheet
          ticketId={ticketId}
          onSend={handleSendReply}
          isExpanded={isReplyExpanded}
          onExpandChange={setIsReplyExpanded}
        />
      )}
      
      {/* Ticket Details Sheet */}
      {showDetails && (
        <TicketDetailsSheet ticket={ticket} onClose={() => setShowDetails(false)} />
      )}
      
      {/* Backdrop */}
      {(showActions || isReplyExpanded) && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => {
            setShowActions(false);
            setIsReplyExpanded(false);
          }}
        />
      )}
    </div>
  );
};

export default TicketThread;
