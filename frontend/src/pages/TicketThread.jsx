/**
 * TicketThread - Full-screen ticket thread view
 * 
 * Routes: /tickets/:ticketId
 * Query params: ?event=:eventId (highlight specific update)
 *               ?embed=true (for desktop split view iframe)
 * 
 * Features:
 * - Full-screen on mobile (no drawers)
 * - Sticky header: Subject + Ticket ID + Status + Pet
 * - Timeline of messages + system events
 * - Bottom composer bar → expands to ReplySheet
 * - Actions menu: Mark unread, Archive, Close ticket
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Sparkles, User, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReplySheet from '../components/Mira/ReplySheet';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Message bubble component
const MessageBubble = ({ message, isUser, isHighlighted = false }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-3
        ${isHighlighted ? 'animate-pulse' : ''}
      `}
      data-message-id={message.id}
    >
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5
          ${isUser
            ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white'
            : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
          }
          ${isHighlighted ? 'ring-2 ring-blue-400' : ''}
        `}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Concierge</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content || message.text || message.message}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] opacity-60">
            {formatTime(message.timestamp || message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

// System event component
const SystemEvent = ({ event }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'status_change': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'assigned': return <User className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-500">
      {getEventIcon()}
      <span>{event.message || event.description}</span>
    </div>
  );
};

const TicketThread = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  const highlightEventId = searchParams.get('event');
  const isEmbed = searchParams.get('embed') === 'true';
  
  // State
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const highlightRef = useRef(null);

  // Scroll to bottom or highlighted event
  useEffect(() => {
    if (highlightEventId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      // Try multiple endpoints to find the ticket
      // 1. Try mira_conversations endpoint (service_desk_router)
      let response = await fetch(`${API_URL}/api/service_desk/ticket/${ticketId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        // 2. Try service_desk_tickets direct lookup
        response = await fetch(`${API_URL}/api/admin/service-desk/ticket/${ticketId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
      }
      
      if (!response.ok) {
        // 3. Try mira_tickets
        response = await fetch(`${API_URL}/api/mira/tickets/${ticketId}`, {
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
      
      // Handle different response formats
      const ticketData = data.ticket || data;
      setTicket(ticketData);
      
      // Extract messages from various possible structures
      const threadMessages = ticketData.messages || 
                           ticketData.conversation || 
                           ticketData.thread ||
                           [];
      
      setMessages(threadMessages);
      
      // Mark all events in this ticket as read
      if (user?.email) {
        fetch(`${API_URL}/api/member/notifications/ticket/${ticketId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ user_email: user.email })
        }).catch(err => console.log('Could not mark ticket as read'));
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

  // Send reply
  const handleSendReply = async ({ content, attachments }) => {
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
    
    if (!response.ok) {
      throw new Error('Failed to send reply');
    }
    
    const result = await response.json();
    
    // Add message to local state immediately
    setMessages(prev => [...prev, {
      id: result.message_id,
      content,
      sender: 'member',
      timestamp: new Date().toISOString()
    }]);
    
    return result;
  };

  // Handle actions
  const handleMarkUnread = async () => {
    // TODO: Implement mark unread for all events in ticket
    setShowActions(false);
  };

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
        <button 
          onClick={() => navigate('/notifications')}
          className="mt-3 text-pink-400 text-sm"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0a0a14] flex flex-col ${isEmbed ? '' : ''}`}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0d0d1a] border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isEmbed && (
              <button 
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-full hover:bg-gray-800 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">
                {ticket?.subject || ticket?.title || 'Conversation'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-500 font-mono">
                  {ticketId}
                </span>
                <span className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium
                  ${getStatusStyle(ticket?.status)}
                `}>
                  {ticket?.status?.replace('_', ' ') || 'Open'}
                </span>
                {ticket?.pet_name && (
                  <span className="text-[10px] text-gray-400">
                    • {ticket.pet_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            
            {showActions && (
              <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden min-w-[160px] z-50">
                <button
                  onClick={handleMarkUnread}
                  className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700/50"
                >
                  Mark as unread
                </button>
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700/50"
                >
                  Archive
                </button>
                {ticket?.status !== 'resolved' && (
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700/50"
                  >
                    Mark resolved
                  </button>
                )}
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
            const isUser = msg.sender === 'member' || 
                          msg.sender === 'user' || 
                          msg.sender === user?.email;
            const isSystem = msg.type === 'system' || msg.type === 'status_change';
            const isHighlighted = msg.id === highlightEventId;
            
            if (isSystem) {
              return <SystemEvent key={msg.id || idx} event={msg} />;
            }
            
            return (
              <div 
                key={msg.id || idx}
                ref={isHighlighted ? highlightRef : null}
              >
                <MessageBubble 
                  message={msg}
                  isUser={isUser}
                  isHighlighted={isHighlighted}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Reply Sheet */}
      <ReplySheet
        ticketId={ticketId}
        onSend={handleSendReply}
        isExpanded={isReplyExpanded}
        onExpandChange={setIsReplyExpanded}
      />
      
      {/* Backdrop when actions or reply expanded */}
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
