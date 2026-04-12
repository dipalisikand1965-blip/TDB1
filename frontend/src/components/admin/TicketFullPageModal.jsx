import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  X, Send, Clock, User, Phone, Mail, Calendar, CheckCircle, Check,
  Loader2, MessageSquare, ChevronLeft, PawPrint, Sparkles, Brain,
  MessageCircle, ArrowLeft, Copy, ExternalLink, MoreHorizontal,
  Paperclip, Image as ImageIcon, FileText, AlertCircle, Star,
  Edit, Trash2, Tag, Flag, UserCircle, Building2, History,
  ChevronRight, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

// Status badge colors
const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  awaiting_response: 'bg-orange-100 text-orange-700 border-orange-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Priority colors
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
  critical: 'bg-red-200 text-red-800',
};

// AI Reply Style options (Mira tones)
const AI_REPLY_STYLES = [
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'friendly', label: 'Friendly', icon: '😊' },
  { id: 'empathetic', label: 'Empathetic', icon: '💝' },
  { id: 'concise', label: 'Concise', icon: '✨' },
  { id: 'detailed', label: 'Detailed', icon: '📝' },
];

const TicketFullPageModal = ({ 
  ticket, 
  onClose, 
  onReply, 
  onStatusChange,
  onRefresh,
  authHeaders,
  petProfile,
  memberProfile
}) => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReplyStyle, setAiReplyStyle] = useState('professional');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [replyChannel, setReplyChannel] = useState('chat');
  const [miraKnowledge, setMiraKnowledge] = useState(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    contact: true,
    pet: true,
    mira: false,
    actions: false
  });
  const conversationEndRef = useRef(null);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Fetch "What Mira Knows" about the pet
  useEffect(() => {
    const fetchMiraKnowledge = async () => {
      const petId = petProfile?.id || ticket?.pet_info?.id || ticket?.pet_id;
      if (!petId) return;
      
      setLoadingKnowledge(true);
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/personalization-stats/${petId}`, {
          headers: authHeaders
        });
        if (response.ok) {
          const data = await response.json();
          setMiraKnowledge(data);
        }
      } catch (error) {
        console.error('Error fetching Mira knowledge:', error);
      } finally {
        setLoadingKnowledge(false);
      }
    };
    
    fetchMiraKnowledge();
  }, [petProfile?.id, ticket?.pet_info?.id, ticket?.pet_id, authHeaders]);

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [replyText, autoResizeTextarea]);

  // Handle reply submission
  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/${ticket.ticket_id || ticket.id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          is_internal: isInternal,
          channel: replyChannel
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: isInternal ? 'Internal note added' : 'Reply sent successfully' });
        setReplyText('');
        setAiSuggestion(null);
        onRefresh?.();
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Generate AI reply
  const generateAiReply = async (style = aiReplyStyle) => {
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/draft-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id || ticket.id,
          reply_type: style
        })
      });

      if (response.ok) {
        const data = await response.json();
        const draft = data.draft || data.reply || data.message || '';
        setAiSuggestion(draft);
      } else {
        toast({
          title: 'AI Generation Failed',
          description: 'Could not generate a reply. Try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, 'MMM d, h:mm a');
  };

  // Get sender display info
  const getSenderInfo = (msg) => {
    const isAgent = msg.sender === 'admin' || msg.sender === 'agent' || msg.sender === 'concierge';
    const name = isAgent 
      ? (msg.sender_name || 'Concierge®')
      : (msg.sender_name || ticket.member?.name || petProfile?.name || 'Customer');
    return { isAgent, name };
  };

  // Toggle sidebar section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle keyboard shortcut for send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleReply();
    }
  };

  if (!ticket) return null;

  const ticketId = ticket.ticket_id || ticket.id || 'Unknown';
  const subject = ticket.subject || ticket.title || 'No Subject';
  const status = ticket.status || 'open';
  const priority = ticket.priority || 'normal';

  // ── Merge ALL message sources: conversation[] + thread[] + messages[] ──
  const extractPhotoUrls = (text) => {
    if (!text) return [];
    return [...new Set((text.match(/https?:\/\/[^\s,)]+\.(jpg|jpeg|png|gif|webp)/gi) || []))];
  };
  const stripPhotoUrls = (text) => {
    if (!text) return '';
    return text.replace(/Photo:\s*https?:\/\/[^\s\n]+/gi, '').replace(/\bhttps?:\/\/[^\s,)]+\.(jpg|jpeg|png|gif|webp)\b/gi, '').trim();
  };
  const messages = [
    ...(ticket.conversation || []).map(m => ({
      ...m,
      _text: m.text || m.content || m.message || '',
      // content should only hold actual HTML (from agent replies), not plain text from m.text
      // Using m.text as fallback caused photo URLs to bypass cleanText stripping
      content: m.content || m.message || '',
      sender: m.sender,
      is_mira: m.is_briefing === true || m.sender === 'mira',
      timestamp: m.timestamp || m.created_at,
    })),
    ...(ticket.thread || []).map(m => ({
      ...m,
      _text: m.text || m.content || m.message || '',
      content: m.content || m.message || '',
      timestamp: m.timestamp || m.created_at,
    })),
    ...(ticket.messages || []).map(m => ({
      ...m,
      _text: m.text || m.content || m.message || '',
      content: m.content || m.message || '',
    })),
  ]
    .filter((m, i, arr) => {
      // Include message text in dedup key to avoid removing messages with same sender+timestamp
      const textSnippet = (m._text || m.text || '').substring(0, 30);
      const key = `${m.sender}|${m.timestamp || m.created_at}|${textSnippet}`;
      return arr.findIndex(x => {
        const xs = (x._text || x.text || '').substring(0, 30);
        return `${x.sender}|${x.timestamp || x.created_at}|${xs}` === key;
      }) === i;
    })
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  const customerName = memberProfile?.name || ticket.member?.name || petProfile?.parent_name || 'Customer';
  const petName = petProfile?.name || ticket.pet_info?.name;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="ticket-modal-overlay"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[98vw] h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        data-testid="ticket-fullpage-modal"
      >
        {/* ==================== COMPACT HEADER ==================== */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="ticket-modal-close"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{ticketId.slice(-8)}</span>
            <Badge className={`${STATUS_COLORS[status]} border text-[10px] px-2 py-0.5`}>
              {status.replace(/_/g, ' ')}
            </Badge>
            <Badge className={`${PRIORITY_COLORS[priority]} text-[10px] px-2 py-0.5`}>
              {priority}
            </Badge>
            <h1 className="text-base font-semibold text-gray-800 truncate max-w-[400px]">{subject}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 text-xs">
              <History className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 h-8 text-xs"
              size="sm"
              onClick={() => textareaRef.current?.focus()}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              Reply
            </Button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ==================== MAIN CONTENT - ZOHO STYLE ==================== */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ========== COLLAPSIBLE LEFT SIDEBAR ========== */}
          <div 
            className={`border-r bg-gray-50 transition-all duration-300 flex flex-col ${
              sidebarCollapsed ? 'md:w-12 w-full max-h-12 md:max-h-none overflow-hidden' : 'md:w-[280px] w-full max-h-[45vh] md:max-h-none overflow-y-auto'
            }`}
          >
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center h-10 border-b hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <div className="flex items-center justify-between w-full px-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Info</span>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </button>
            
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                
                {/* Ticket Properties - Collapsible */}
                <div>
                  <button 
                    onClick={() => toggleSection('properties')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Ticket Properties
                    </span>
                    {expandedSections.properties ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  {expandedSections.properties && (
                    <Card className="p-2.5 space-y-2 bg-white text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status</span>
                        <select
                          value={status}
                          onChange={(e) => onStatusChange?.(e.target.value)}
                          className="text-[11px] border rounded px-1.5 py-0.5 bg-white cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="awaiting_response">Awaiting Response</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Priority</span>
                        <Badge className={`${PRIORITY_COLORS[priority]} text-[10px] px-1.5`}>{priority}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Category</span>
                        <span className="font-medium text-gray-700">{ticket.category || ticket.pillar || 'General'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-600">{formatTime(ticket.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Updated</span>
                        <span className="text-gray-600">{formatTime(ticket.updated_at || ticket.last_activity)}</span>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Contact Info - Collapsible */}
                <div>
                  <button 
                    onClick={() => toggleSection('contact')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      Contact Info
                    </span>
                    {expandedSections.contact ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  {expandedSections.contact && (
                    <Card className="p-2.5 bg-white">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{customerName}</div>
                          <div className="text-[10px] text-gray-500">Pet Parent</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {(memberProfile?.email || ticket.member?.email) && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{memberProfile?.email || ticket.member?.email}</span>
                          </div>
                        )}
                        {(memberProfile?.phone || ticket.member?.phone) && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{memberProfile?.phone || ticket.member?.phone}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Pet Profile - Collapsible */}
                {(petProfile?.name || ticket.pet_info?.name) && (
                  <div>
                    <button 
                      onClick={() => toggleSection('pet')}
                      className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <PawPrint className="w-3 h-3" />
                        Pet Profile
                      </span>
                      {expandedSections.pet ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {expandedSections.pet && (
                      <Card className="p-2.5 bg-white">
                        <div className="flex items-center gap-2.5 mb-2">
                          {(petProfile?.image || ticket.pet_info?.image) ? (
                            <img 
                              src={petProfile?.image || ticket.pet_info?.image} 
                              alt="Pet"
                              className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <PawPrint className="w-5 h-5 text-purple-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {petProfile?.name || ticket.pet_info?.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {petProfile?.breed || ticket.pet_info?.breed || 'Pet'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Soul Score Progress */}
                        {miraKnowledge?.soul_score !== undefined && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Mira knows</span>
                              <span className="text-xs font-bold text-purple-600">{Math.round(miraKnowledge.soul_score)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                                style={{ width: `${miraKnowledge.soul_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                )}

                {/* Mira's Intel - Collapsible */}
                {miraKnowledge?.knowledge_items?.length > 0 && (
                  <div>
                    <button 
                      onClick={() => toggleSection('mira')}
                      className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <Brain className="w-3 h-3 text-purple-500" />
                        Mira's Intel
                      </span>
                      {expandedSections.mira ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {expandedSections.mira && (
                      <Card className="p-2.5 bg-gradient-to-br from-purple-50 to-white border-purple-100">
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {miraKnowledge.knowledge_items.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <span className="flex-shrink-0">{item.icon}</span>
                              <span className="text-gray-700">{item.text}</span>
                            </div>
                          ))}
                        </div>
                        {miraKnowledge.knowledge_items.length > 6 && (
                          <div className="text-[9px] text-purple-500 text-center mt-1 pt-1 border-t border-purple-100">
                            +{miraKnowledge.knowledge_items.length - 6} more
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                )}

                {/* Quick Actions - Collapsible */}
                <div>
                  <button 
                    onClick={() => toggleSection('actions')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Quick Actions
                    </span>
                    {expandedSections.actions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  {expandedSections.actions && (
                    <div className="space-y-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[11px] h-7"
                        onClick={() => {
                          const phone = memberProfile?.phone || ticket.member?.phone;
                          if (phone) window.open(`https://wa.me/91${phone.replace(/\D/g, '')}`, '_blank');
                        }}
                      >
                        <MessageCircle className="w-3 h-3 mr-1.5 text-green-600" />
                        WhatsApp
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[11px] h-7"
                        onClick={() => {
                          const email = memberProfile?.email || ticket.member?.email;
                          if (email) window.open(`mailto:${email}?subject=Re: ${subject}`, '_blank');
                        }}
                      >
                        <Mail className="w-3 h-3 mr-1.5 text-blue-600" />
                        Send Email
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[11px] h-7"
                        onClick={() => {
                          const phone = memberProfile?.phone || ticket.member?.phone;
                          if (phone) window.open(`tel:${phone}`, '_blank');
                        }}
                      >
                        <Phone className="w-3 h-3 mr-1.5 text-purple-600" />
                        Call
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            )}
            
            {/* Collapsed sidebar icons */}
            {sidebarCollapsed && (
              <div className="flex-1 flex flex-col items-center pt-2 space-y-2">
                <button className="p-2 hover:bg-gray-200 rounded-lg" title="Properties">
                  <FileText className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg" title="Contact">
                  <User className="w-4 h-4 text-gray-500" />
                </button>
                {petName && (
                  <button className="p-2 hover:bg-gray-200 rounded-lg" title="Pet">
                    <PawPrint className="w-4 h-4 text-purple-500" />
                  </button>
                )}
                <button className="p-2 hover:bg-gray-200 rounded-lg" title="Actions">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {/* ========== MAIN CHAT AREA - ZOHO STYLE ========== */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
            
            {/* Tab Navigation - Minimal */}
            <div className="flex items-center gap-4 px-4 py-2 border-b bg-gray-50/80">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`text-xs font-medium pb-1 border-b-2 transition-colors ${
                  activeTab === 'conversation' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {messages.length} Conversation{messages.length !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => setActiveTab('resolution')}
                className={`text-xs font-medium pb-1 border-b-2 transition-colors ${
                  activeTab === 'resolution' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Resolution
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`text-xs font-medium pb-1 border-b-2 transition-colors ${
                  activeTab === 'activity' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </div>

            {/* ========== CONVERSATION TAB - THE HERO ========== */}
            {activeTab === 'conversation' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Chat Messages Area - Takes most space */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const { isAgent, name } = getSenderInfo(msg);
                      const isInternalNote = msg.is_internal || msg.type === 'internal';
                      const isSystem = msg.type === 'system';
                      const isMira = msg.is_mira;
                      const rawText = msg._text || '';
                      const photoUrls = extractPhotoUrls(rawText);
                      const cleanText = stripPhotoUrls(rawText);
                      const htmlContent = msg.content || '';
                      
                      // System messages (centered)
                      if (isSystem) {
                        return (
                          <div key={msg.id || idx} className="flex justify-center">
                            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full max-w-md text-center">
                              {htmlContent || rawText}
                            </div>
                          </div>
                        );
                      }

                      // Mira AI briefing — full-width card
                      if (isMira) {
                        return (
                          <div key={msg.id || idx} className="w-full" data-testid={`message-${idx}`}>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-2">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px]">✨</span>
                                Mira AI — Soul Briefing
                                <span className="ml-auto text-gray-400 font-normal">{formatTime(msg.timestamp || msg.created_at)}</span>
                              </div>
                              <pre className="text-xs text-purple-900 whitespace-pre-wrap font-mono leading-relaxed bg-white/60 rounded-lg p-3 border border-purple-100 max-h-72 overflow-y-auto">
                                {cleanText || rawText}
                              </pre>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={msg.id || idx}
                          className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${idx}`}
                        >
                          <div className={`max-w-[65%] ${isInternalNote ? 'opacity-80' : ''}`}>
                            {/* Avatar + Name + Time row */}
                            <div className={`flex items-center gap-2 mb-1.5 ${isAgent ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar */}
                              {!isAgent ? (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {name.slice(0, 1).toUpperCase()}
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  C
                                </div>
                              )}
                              
                              {/* Name & Time */}
                              <div className={`flex items-center gap-2 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs font-semibold text-gray-700">{name}</span>
                                {isInternalNote && (
                                  <Badge className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0">Internal</Badge>
                                )}
                                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp || msg.created_at)}</span>
                              </div>
                            </div>
                            
                            {/* Message Bubble - Large & Readable */}
                            <div 
                              className={`rounded-2xl px-4 py-3 ${
                                isAgent 
                                  ? isInternalNote 
                                    ? 'bg-amber-50 border border-amber-200 text-gray-800 rounded-tr-md' 
                                    : 'bg-emerald-500 text-white rounded-tr-md shadow-sm'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
                              }`}
                            >
                              {/* Photo URLs rendered as images */}
                              {photoUrls.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {photoUrls.map((url, ui) => (
                                    <img key={ui} src={url} alt="Attached" className="w-36 h-36 rounded-lg object-cover cursor-pointer border border-white/30 shadow-sm" onClick={() => window.open(url, '_blank')} />
                                  ))}
                                </div>
                              )}
                              {htmlContent ? (
                                <div 
                                  className={`text-[14px] leading-relaxed prose prose-sm max-w-none ${isAgent && !isInternalNote ? 'prose-invert' : ''}`}
                                  dangerouslySetInnerHTML={{ __html: htmlContent.replace(/<[^>]*>/g, '') }}
                                />
                              ) : (
                                <p className={`text-[14px] leading-relaxed whitespace-pre-wrap ${isAgent && !isInternalNote ? 'text-white' : 'text-gray-800'}`}>
                                  {cleanText || rawText}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={conversationEndRef} />
                </div>

                {/* ========== PINNED REPLY INPUT - ALWAYS VISIBLE ========== */}
                <div className="border-t bg-white p-3 flex-shrink-0">
                  
                  {/* Internal Note Toggle + AI Controls Row */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300 w-3.5 h-3.5"
                      />
                      <span className={`text-xs ${isInternal ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                        Internal Note
                      </span>
                    </label>
                    
                    {/* AI Controls */}
                    <div className="flex items-center gap-2">
                      <select
                        value={aiReplyStyle}
                        onChange={(e) => setAiReplyStyle(e.target.value)}
                        className="h-7 px-2 text-[11px] border border-purple-200 rounded bg-purple-50 text-purple-700 cursor-pointer hover:border-purple-300"
                      >
                        {AI_REPLY_STYLES.map(style => (
                          <option key={style.id} value={style.id}>{style.icon} {style.label}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiReply(aiReplyStyle)}
                        disabled={aiLoading}
                        className="h-7 px-2 text-[11px] bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      >
                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
                        Ask Mira
                      </Button>
                    </div>
                  </div>

                  {/* AI Suggestion Preview */}
                  {aiSuggestion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 mb-2">
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-purple-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Mira's Suggestion
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyText(aiSuggestion);
                              setAiSuggestion(null);
                            }}
                            className="h-5 px-2 text-[10px] text-purple-700 hover:text-purple-800 hover:bg-purple-100"
                          >
                            <Check className="w-3 h-3 mr-0.5" />
                            Use
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiSuggestion(null)}
                            className="h-5 px-1.5 text-[10px] text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">{aiSuggestion}</p>
                    </div>
                  )}

                  {/* Simple Text Input - Like WhatsApp/Zoho */}
                  <div className={`flex items-end gap-2 ${isInternal ? 'bg-amber-50 rounded-lg p-1' : ''}`}>
                    <div className={`flex-1 border rounded-xl ${isInternal ? 'border-amber-300 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                      <textarea
                        ref={textareaRef}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isInternal ? "Add internal note..." : `Reply to ${customerName}...`}
                        className="w-full px-4 py-2.5 text-sm bg-transparent resize-none focus:outline-none rounded-xl min-h-[44px] max-h-[150px]"
                        rows={1}
                        data-testid="reply-textarea"
                      />
                    </div>
                    
                    {/* Channel & Send Row */}
                    <div className="flex items-center gap-1.5 pb-0.5">
                      {/* Channel Pills */}
                      <div className="hidden md:flex items-center gap-1 mr-1">
                        {['chat', 'email', 'whatsapp'].map((ch) => (
                          <button
                            key={ch}
                            onClick={() => setReplyChannel(ch)}
                            title={ch === 'whatsapp' ? `Send via WhatsApp → ${ticket?.member?.phone || ticket?.user_phone || ''}` : ch}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              replyChannel === ch
                                ? ch === 'whatsapp'
                                  ? 'bg-green-500 text-white shadow-md shadow-green-200 ring-2 ring-green-300'
                                  : 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {ch === 'chat' && <><MessageCircle className="w-3.5 h-3.5" /><span className="hidden lg:inline">Chat</span></>}
                            {ch === 'email' && <><Mail className="w-3.5 h-3.5" /><span className="hidden lg:inline">Email</span></>}
                            {ch === 'whatsapp' && (
                              <>
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <span className="hidden lg:inline">WhatsApp</span>
                                {(ticket?.member?.phone || ticket?.user_phone) && replyChannel !== 'whatsapp' && (
                                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-0.5" />
                                )}
                              </>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* WhatsApp recipient preview */}
                      {replyChannel === 'whatsapp' && (ticket?.member?.phone || ticket?.user_phone) && (
                        <span className="text-xs text-green-600 font-medium hidden lg:block">
                          → {ticket?.member?.name?.split(' ')[0] || 'Parent'} ({(ticket?.member?.phone || ticket?.user_phone)?.slice(-4)})
                        </span>
                      )}
                      
                      {/* Attachment Button */}
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 ml-auto">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      {/* Send Button */}
                      <Button
                        onClick={handleReply}
                        disabled={sending || !replyText.trim()}
                        data-testid="send-reply-btn"
                        className={`h-10 px-4 ${
                          isInternal ? 'bg-amber-500 hover:bg-amber-600' :
                          replyChannel === 'whatsapp' ? 'bg-green-500 hover:bg-green-600' :
                          'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : replyChannel === 'whatsapp' ? (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Keyboard hint */}
                  <div className="text-[10px] text-gray-400 mt-1 text-right">
                    Press Ctrl+Enter to send
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Tab */}
            {activeTab === 'resolution' && (
              <div className="flex-1 overflow-y-auto p-6">
                <Card className="p-6 max-w-2xl mx-auto">
                  <h3 className="font-semibold text-gray-800 mb-4">Resolution Summary</h3>
                  <textarea
                    className="w-full h-40 p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Add resolution notes..."
                    defaultValue={ticket.resolution || ''}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline">Save Draft</Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Created {formatTime(ticket.created_at)}
                  </div>
                  {ticket.activity_log?.map((activity, idx) => (
                    <div key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {activity.description} - {formatTime(activity.timestamp)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFullPageModal;
