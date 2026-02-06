import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Calendar, RefreshCw, Loader2, MessageCircle, PawPrint, Clock, ChevronDown, ChevronUp, MapPin, Send, X, Paperclip, Search, Bell, BellDot, Archive, Eye } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const RequestsTab = ({ 
  myRequests, 
  requestsLoading, 
  onRefresh,
  userEmail
}) => {
  const navigate = useNavigate();
  const [expandedRequests, setExpandedRequests] = useState({});
  const [messageDialog, setMessageDialog] = useState({ open: false, request: null });
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  
  // New state for improved UX
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [unreadTickets, setUnreadTickets] = useState(new Set());

  const toggleRequest = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
    // Mark as read when expanded
    setUnreadTickets(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  // Sort and filter requests
  const processedRequests = useMemo(() => {
    let filtered = [...myRequests];
    
    // Sort by updated_at (most recent activity first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.id?.toLowerCase().includes(query) ||
        r.ticket_id?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.service_name?.toLowerCase().includes(query) ||
        r.pet_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [myRequests, searchQuery]);

  // Split into open and closed
  const openRequests = processedRequests.filter(r => 
    !['resolved', 'closed', 'completed', 'cancelled'].includes(r.status?.toLowerCase())
  );
  const closedRequests = processedRequests.filter(r => 
    ['resolved', 'closed', 'completed', 'cancelled'].includes(r.status?.toLowerCase())
  );

  // Determine what to display
  const displayRequests = showAllTickets ? processedRequests : openRequests.slice(0, 5);
  const hasMoreOpen = openRequests.length > 5;
  const totalUnread = unreadTickets.size;

  // Load conversation messages when dialog opens
  const loadConversationMessages = async (requestId) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(
        `${API}/api/user/request/${requestId}/messages?email=${encodeURIComponent(userEmail)}`
      );
      const data = await response.json();
      setConversationMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setConversationMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openMessageDialog = async (request) => {
    if (!userEmail) {
      toast.error('Please log in to message the concierge');
      return;
    }
    
    setMessageDialog({ open: true, request });
    setMessageText('');
    const requestId = request.ticket_id || request.id;
    await loadConversationMessages(requestId);
    
    // Mark as read
    setUnreadTickets(prev => {
      const next = new Set(prev);
      next.delete(request.id);
      return next;
    });
  };

  const closeMessageDialog = () => {
    setMessageDialog({ open: false, request: null });
    setMessageText('');
    setConversationMessages([]);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  const sendMessageToConcierge = async () => {
    if (!messageText.trim() || !messageDialog.request) return;
    
    setSending(true);
    try {
      const requestId = messageDialog.request.ticket_id || messageDialog.request.id;
      const response = await fetch(
        `${API}/api/user/request/${requestId}/message?email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText.trim() })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Message sent!', {
          description: 'Our concierge team will respond shortly.'
        });
        setMessageText('');
        await loadConversationMessages(requestId);
      } else {
        toast.error('Failed to send message', { description: data.detail });
      }
    } catch (error) {
      toast.error('Error sending message', { description: 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColors = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'yellow': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Check for unread messages (tickets with recent concierge replies)
  useEffect(() => {
    const checkUnread = () => {
      const newUnread = new Set();
      myRequests.forEach(r => {
        // If has_new_reply flag or last message was from concierge
        if (r.has_new_reply || r.last_message_from === 'concierge') {
          newUnread.add(r.id);
        }
      });
      setUnreadTickets(newUnread);
    };
    checkUnread();
  }, [myRequests]);

  // Dialog rendered via portal
  const dialogContent = messageDialog.open ? createPortal(
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="message-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMessageDialog();
      }}
    >
      <div 
        className="bg-gradient-to-br from-slate-800/95 to-purple-900/40 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]" 
        data-testid="message-dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              Conversation
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {messageDialog.request?.service_name || messageDialog.request?.description?.slice(0, 30) || 'Service Request'}
              {messageDialog.request?.pet_name && (
                <span className="ml-1 text-purple-300">for {messageDialog.request.pet_name}</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              #{messageDialog.request?.ticket_id || messageDialog.request?.id}
            </p>
          </div>
          <button 
            onClick={closeMessageDialog} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            data-testid="close-message-dialog"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : conversationMessages.length > 0 ? (
            <>
              {conversationMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'you' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-slate-700/70 text-slate-200 border border-white/5'
                    }`}
                  >
                    {msg.sender !== 'you' && (
                      <p className="text-xs text-purple-400 font-medium mb-1">Concierge</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded">
                            <Paperclip className="w-3 h-3" />
                            {att}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${msg.sender === 'you' ? 'text-white/60' : 'text-slate-500'}`}>
                      {formatMessageTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No messages yet</p>
              <p className="text-slate-500 text-xs mt-1">Start a conversation with our concierge team</p>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 text-sm"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessageToConcierge();
                }
              }}
              data-testid="message-input"
            />
            <Button
              onClick={sendMessageToConcierge}
              disabled={!messageText.trim() || sending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 self-end"
              data-testid="send-message-btn"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="requests-tab">
      {/* Message Dialog Portal */}
      {dialogContent}

      <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        {/* Header with Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-purple-400" />
              My Bookings & Requests
              {openRequests.length > 0 && (
                <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {openRequests.length} open
                </Badge>
              )}
              {totalUnread > 0 && (
                <Badge className="bg-pink-500 text-white border-0 animate-pulse">
                  <BellDot className="w-3 h-3 mr-1" />
                  {totalUnread} new
                </Badge>
              )}
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              disabled={requestsLoading}
              className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${requestsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by ticket #, description, pet name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder-slate-500 focus:border-purple-500/50"
              data-testid="request-search"
            />
          </div>
        </div>
        
        {requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : displayRequests.length > 0 ? (
          <div className="space-y-3">
            {displayRequests.map((request) => {
              const isExpanded = expandedRequests[request.id];
              const isUnread = unreadTickets.has(request.id);
              const ticketId = request.ticket_id || request.id;
              
              return (
                <div 
                  key={request.id} 
                  className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${
                    isUnread 
                      ? 'border-pink-500/50 ring-1 ring-pink-500/20' 
                      : 'border-white/5 hover:border-purple-500/30'
                  }`}
                >
                  {/* Request Header - Clickable */}
                  <button 
                    onClick={() => toggleRequest(request.id)}
                    className="w-full p-4 flex justify-between items-center gap-3 text-left hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUnread ? 'bg-pink-500/20' : 'bg-purple-500/10'
                      }`}>
                        {isUnread ? (
                          <BellDot className="w-5 h-5 text-pink-400" />
                        ) : (
                          <Calendar className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs border ${getStatusColors(request.status_display?.color)}`}
                          >
                            {request.status_display?.icon} {request.status_display?.label || request.status}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                            {request.pillar}
                          </Badge>
                          {isUnread && (
                            <Badge className="bg-pink-500 text-white text-[10px] border-0">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white truncate">{request.description?.slice(0, 60) || 'Service Request'}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:inline font-mono">#{ticketId?.slice(-8)}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                      {/* Request Details */}
                      <div className="py-4 space-y-4">
                        {/* Full Description */}
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Request Details</p>
                          <p className="text-sm text-slate-300">{request.description}</p>
                        </div>
                        
                        {/* Pet Info */}
                        {(request.pet_name || request.pet_names?.length > 0) && (
                          <div className="flex items-center gap-2">
                            <PawPrint className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-white">
                              Pet: {request.pet_name || request.pet_names?.join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {/* Booking Details if available */}
                        {request.booking_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-white">
                              Scheduled: {new Date(request.booking_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {/* Location if available */}
                        {request.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-400" />
                            <span className="text-sm text-white">{request.city}</span>
                          </div>
                        )}
                        
                        {/* Created Date */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">
                            Created: {new Date(request.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {/* Request ID */}
                        <div className="text-xs text-slate-500 font-mono">
                          Request ID: {ticketId}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openMessageDialog(request);
                          }}
                          data-testid="message-concierge-btn"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" /> 
                          {isUnread ? 'View New Message' : 'Message Concierge'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Show More / Show Less */}
            {(hasMoreOpen || showAllTickets) && !searchQuery && (
              <div className="pt-4 border-t border-white/5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllTickets(!showAllTickets)}
                  className="w-full bg-slate-800/30 border-white/10 text-slate-300 hover:bg-slate-700/50"
                >
                  {showAllTickets ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      View All ({processedRequests.length} total, {closedRequests.length} closed)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 mb-2">
              {searchQuery ? 'No matching requests found' : 'No active requests yet'}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Try a different search term' : 'Your bookings and service requests will appear here'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RequestsTab;
