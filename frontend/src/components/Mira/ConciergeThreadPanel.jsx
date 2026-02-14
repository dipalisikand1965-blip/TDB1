/**
 * ConciergeThreadPanel - Conversation Screen
 * =============================================
 * The detailed conversation view for a concierge thread.
 * 
 * Features:
 * - Chat bubbles with timestamps (hidden unless tapped)
 * - Status chips inline (Options ready, Payment pending, etc.)
 * - Context drawer (collapsible) showing pet info, source, constraints
 * 
 * Based on CONCIERGE Bible v1.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Send, ChevronLeft, ChevronDown, ChevronUp, PawPrint,
  BookOpen, Calendar, MapPin, Clock, Paperclip, User
} from 'lucide-react';
import { API_URL } from '../../utils/api';

/**
 * Status Chip Component (inline in messages)
 */
const StatusChip = ({ status }) => {
  const chipStyles = {
    'Urgent': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Options ready': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Payment pending': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Scheduled': 'bg-green-500/20 text-green-400 border-green-500/30',
    'In progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };
  
  const style = chipStyles[status] || 'bg-white/10 text-white/60 border-white/10';
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
};

/**
 * Option Card Component - Tappable choices sent by concierge
 */
const OptionCardMessage = ({ message, onSelectOption, isRespondable }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const options = message.options_payload?.options || [];
  const question = message.options_payload?.question || message.content;
  const isPending = message.options_payload?.status === 'pending';
  const selectedOption = message.options_payload?.selected_option;
  
  const handleSelect = async (optionId) => {
    if (!isPending || !isRespondable || isSubmitting) return;
    
    setSelectedId(optionId);
    setIsSubmitting(true);
    
    try {
      await onSelectOption(optionId);
    } catch (error) {
      console.error('Failed to select option:', error);
      setSelectedId(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-start mb-4 max-w-[90%]">
      {/* Question */}
      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 mb-2">
        <p className="text-sm text-white font-medium">{question}</p>
      </div>
      
      {/* Option Cards */}
      <div className="w-full space-y-2 pl-2">
        {options.map((opt) => {
          const isSelected = selectedOption?.id === opt.id || selectedId === opt.id;
          const isDisabled = !isPending || (selectedOption && selectedOption.id !== opt.id);
          
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isDisabled || isSubmitting}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-purple-500/30 border-purple-500/50 ring-2 ring-purple-500/30'
                  : isDisabled
                    ? 'bg-white/5 border-white/10 opacity-50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              data-testid={`option-card-${opt.id}`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-white/20 text-white/70'
                }`}>
                  {opt.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{opt.title}</span>
                    {opt.price && (
                      <span className="text-xs text-purple-400 font-medium">{opt.price}</span>
                    )}
                  </div>
                  {opt.description && (
                    <p className="text-xs text-white/60 mt-1">{opt.description}</p>
                  )}
                </div>
                {isSelected && (
                  <span className="flex-shrink-0 text-purple-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Status indicator */}
      {selectedOption && (
        <div className="mt-2 pl-2 text-xs text-green-400">
          ✓ You selected: {selectedOption.title}
        </div>
      )}
      {isPending && !selectedOption && isRespondable && (
        <div className="mt-2 pl-2 text-xs text-purple-400">
          Tap an option to select
        </div>
      )}
    </div>
  );
};

/**
 * Message Bubble Component
 */
const MessageBubble = ({ message, showTimestamp, onToggleTimestamp, onSelectOption, isRespondable }) => {
  const isUser = message.sender === 'user' || message.sender === 'member';
  
  // Handle option card messages
  if (message.type === 'option_cards' && message.options_payload) {
    return (
      <OptionCardMessage 
        message={message} 
        onSelectOption={onSelectOption}
        isRespondable={isRespondable}
      />
    );
  }
  
  // Handle option response messages
  if (message.type === 'option_response') {
    return (
      <div className="flex flex-col items-end mb-3">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-purple-500/30 text-white rounded-tr-sm">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.selected_option && (
            <div className="mt-1 text-xs text-purple-300">
              ✓ {message.selected_option.title}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Format timestamp
  const formatTime = (ts) => {
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
  
  return (
    <div 
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}
      onClick={onToggleTimestamp}
    >
      {/* Status chip (only for concierge messages) */}
      {!isUser && message.status_chip && (
        <div className="mb-1 ml-1">
          <StatusChip status={message.status_chip} />
        </div>
      )}
      
      {/* Message bubble */}
      <div 
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
          isUser 
            ? 'bg-purple-500/30 text-white rounded-tr-sm' 
            : 'bg-white/10 text-white rounded-tl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
      
      {/* Timestamp (hidden unless tapped) */}
      {showTimestamp && message.timestamp && (
        <span className="text-xs text-white/40 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      )}
    </div>
  );
};

/**
 * Context Drawer Component
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
 * ConciergeThreadPanel Main Component
 */
const ConciergeThreadPanel = ({ 
  isOpen, 
  onClose, 
  onBack,
  userId,
  threadId,
  initialThread = null,
  initialMessages = []
}) => {
  // State
  const [loading, setLoading] = useState(!initialThread);
  const [error, setError] = useState(null);
  const [thread, setThread] = useState(initialThread);
  const [messages, setMessages] = useState(initialMessages);
  const [contextDrawer, setContextDrawer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState({});
  const [linkedTicketId, setLinkedTicketId] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Fetch thread data
  const fetchThread = useCallback(async () => {
    if (!threadId || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/os/concierge/thread/${threadId}?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      setThread(data.thread);
      setMessages(data.messages || []);
      setContextDrawer(data.context_drawer);
      
      // Store linked ticket ID if available (from thread or context drawer)
      const ticketId = data.thread?.ticket_id || data.context_drawer?.ticket?.id;
      if (ticketId) {
        setLinkedTicketId(ticketId);
      }
      
    } catch (err) {
      console.error('[ConciergeThread] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [threadId, userId]);
  
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
  
  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || sending) return;
    
    const messageContent = inputValue.trim();
    setInputValue('');
    setSending(true);
    
    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const response = await fetch(`${API_URL}/api/os/concierge/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          user_id: userId,
          content: messageContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? data.message : m
      ));
      
    } catch (err) {
      console.error('[ConciergeThread] Send error:', err);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [inputValue, sending, threadId, userId]);
  
  // Toggle timestamp visibility
  const toggleTimestamp = useCallback((messageId) => {
    setShowTimestamps(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end justify-center md:items-center"
      data-testid="concierge-thread-panel"
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
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="thread-close-button"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>
        
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
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
                  key={message.id}
                  message={message}
                  showTimestamp={showTimestamps[message.id]}
                  onToggleTimestamp={() => toggleTimestamp(message.id)}
                  onSelectOption={async (optionId) => {
                    // Send option selection to backend
                    try {
                      const response = await fetch(`${API_URL}/api/tickets/${threadId}/options/respond`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ticket_id: threadId,
                          selected_option_id: optionId
                        })
                      });
                      
                      if (response.ok) {
                        // Refresh messages to get updated state
                        await fetchThread();
                      }
                    } catch (error) {
                      console.error('Failed to select option:', error);
                    }
                  }}
                  isRespondable={true}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Bar */}
        <div className="px-4 py-3 border-t border-white/10 bg-gray-900/50">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
              disabled={!inputValue.trim() || sending}
              className={`p-3 rounded-xl transition-all ${
                inputValue.trim() && !sending
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-white/10 text-white/30'
              }`}
              data-testid="thread-send-button"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergeThreadPanel;
