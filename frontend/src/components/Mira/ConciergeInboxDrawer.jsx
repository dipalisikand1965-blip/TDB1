/**
 * ConciergeInboxDrawer - Outlook-style Thread Conversation Drawer
 * 
 * Opens a full-screen (mobile) or side panel (desktop) drawer showing
 * the complete conversation thread between user and concierge.
 * Enables two-way inline replies without navigating away.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { ArrowLeft, Send, Loader2, CheckCheck, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Message bubble component
const MessageBubble = ({ message, isUser }) => {
  const getStatusIcon = () => {
    if (message.status === 'sending') return <Clock className="w-3 h-3 text-gray-400" />;
    if (message.status === 'sent') return <CheckCheck className="w-3 h-3 text-gray-400" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3 h-3 text-pink-400" />;
    return null;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white'
            : 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Concierge®</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

// Main drawer component
const ConciergeInboxDrawer = ({ 
  threadId, 
  onClose, 
  notification = null,
  userEmail = null 
}) => {
  const { token, user } = useAuth();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch thread data
  useEffect(() => {
    if (!threadId) return;
    
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch thread from service desk - try multiple collections
        let response = await fetch(`${API_URL}/api/service_desk/ticket/${threadId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        // If not found in mira_conversations, try service_desk_tickets
        if (!response.ok) {
          response = await fetch(`${API_URL}/api/admin/service-desk/ticket/${threadId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to load conversation');
        }
        
        const data = await response.json();
        setThread(data);
        
        // Extract messages from thread
        const threadMessages = data.messages || [];
        setMessages(threadMessages.map(msg => ({
          id: msg.id || msg._id,
          content: msg.content || msg.message || msg.text,
          sender: msg.sender || (msg.is_internal ? 'concierge' : 'user'),
          timestamp: msg.timestamp || msg.created_at,
          status: 'delivered'
        })));
        
      } catch (err) {
        console.error('Error fetching thread:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchThread();
  }, [threadId, token]);

  // Send reply
  const handleSendReply = async (e) => {
    e?.preventDefault();
    
    if (!replyText.trim() || isSending) return;
    
    const messageText = replyText.trim();
    setReplyText('');
    setIsSending(true);
    
    // Optimistic update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const response = await fetch(`${API_URL}/api/service_desk/tickets/${threadId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          content: messageText,
          sender_email: userEmail || user?.email
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const result = await response.json();
      
      // Update optimistic message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: result.message_id || msg.id, status: 'delivered' }
          : msg
      ));
      
    } catch (err) {
      console.error('Error sending reply:', err);
      // Revert optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setReplyText(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Get pillar color
  const getPillarColor = (pillar) => {
    const colors = {
      travel: 'from-blue-500 to-cyan-500',
      care: 'from-emerald-500 to-teal-500',
      shop: 'from-pink-500 to-rose-500',
      dine: 'from-orange-500 to-amber-500',
      enjoy: 'from-purple-500 to-violet-500',
      learn: 'from-indigo-500 to-blue-500',
      fit: 'from-green-500 to-emerald-500',
      stay: 'from-teal-500 to-cyan-500'
    };
    return colors[pillar?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  return (
    <Sheet open={!!threadId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 bg-[#0d0d1a] border-l border-gray-800/50 flex flex-col"
        data-testid="concierge-inbox-drawer"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800/50 bg-[#0d0d1a]">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            data-testid="drawer-close-btn"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getPillarColor(thread?.pillar)}`} />
              <h3 className="font-semibold text-white truncate">
                {thread?.subject || notification?.title || 'Conversation'}
              </h3>
            </div>
            <p className="text-xs text-gray-400 truncate">
              {thread?.pet?.name || notification?.pet_name || 'Your Pet'} • {thread?.pillar?.charAt(0).toUpperCase() + thread?.pillar?.slice(1) || 'General'}
            </p>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
            thread?.status === 'resolved' 
              ? 'bg-green-500/20 text-green-400'
              : thread?.status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
          }`}>
            {thread?.status === 'resolved' ? 'Resolved' : thread?.status === 'in_progress' ? 'In Progress' : 'Open'}
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-pink-400 text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation below</p>
            </div>
          ) : (
            <>
              {/* Request summary card */}
              {thread?.description && (
                <div className="bg-gray-800/30 rounded-xl p-3 mb-4 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-medium text-pink-400">Your Request</span>
                  </div>
                  <p className="text-sm text-gray-300">{thread.description}</p>
                </div>
              )}
              
              {/* Message bubbles */}
              {messages.map((msg, idx) => (
                <MessageBubble 
                  key={msg.id || idx}
                  message={msg}
                  isUser={msg.sender === 'user' || msg.sender === 'member' || msg.sender === userEmail}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Reply Input */}
        <form 
          onSubmit={handleSendReply}
          className="p-3 border-t border-gray-800/50 bg-[#0d0d1a]"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30"
              disabled={isSending || isLoading}
              data-testid="reply-input"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSending}
              className="p-2.5 bg-gradient-to-r from-pink-600 to-pink-500 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-500 hover:to-pink-400 transition-all"
              data-testid="send-reply-btn"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ConciergeInboxDrawer;
