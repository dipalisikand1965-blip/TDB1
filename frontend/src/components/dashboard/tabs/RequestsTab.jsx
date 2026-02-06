import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, RefreshCw, Loader2, MessageCircle, Sparkles, PawPrint, Clock, ChevronDown, ChevronUp, MapPin, Send, X, Paperclip, Image } from 'lucide-react';
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

  const toggleRequest = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

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
    setMessageDialog({ open: true, request });
    setMessageText('');
    // Load existing conversation
    const requestId = request.ticket_id || request.id;
    await loadConversationMessages(requestId);
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
      // Use ticket_id if available, otherwise use id
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
        // Reload conversation to show new message
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

  // Format timestamp for messages
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

  // Get status color classes for dark theme
  const getStatusColors = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'yellow': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="requests-tab">
      {/* Message/Conversation Dialog */}
      {messageDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800/95 to-purple-900/40 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  Conversation
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {messageDialog.request?.service_name || 'Service Request'}
                  {messageDialog.request?.pet_name && (
                    <span className="ml-1 text-purple-300">for {messageDialog.request.pet_name}</span>
                  )}
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
        </div>
      )}

      <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-purple-400" />
            My Bookings & Requests
            {myRequests.length > 0 && (
              <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">{myRequests.length}</Badge>
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
        
        {requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((request) => {
              const isExpanded = expandedRequests[request.id];
              
              return (
                <div 
                  key={request.id} 
                  className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
                >
                  {/* Request Header - Clickable */}
                  <button 
                    onClick={() => toggleRequest(request.id)}
                    className="w-full p-4 flex justify-between items-center gap-3 text-left hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-purple-400" />
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
                        </div>
                        <p className="text-sm text-white truncate">{request.description?.slice(0, 60) || 'Service Request'}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:inline">#{request.id?.slice(0, 8)}</span>
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
                          Request ID: {request.id}
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
                          <MessageCircle className="w-4 h-4 mr-1.5" /> Message Concierge
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No active requests</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Chat with Mira to create booking requests, grooming appointments, and more!
            </p>
            <Button 
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              onClick={() => navigate('/care')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Talk to Mira
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RequestsTab;
