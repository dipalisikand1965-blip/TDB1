import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { API_URL, getApiUrl } from '../../utils/api';
import {
  Search, Plus, RefreshCw, X, Send, Clock, User, Phone, Mail,
  Calendar, AlertCircle, CheckCircle, Loader2, MessageSquare,
  ChevronRight, MoreVertical, Edit, Trash2, Star, Zap,
  Inbox, ArrowUp, PawPrint, ChevronDown, Sparkles, Wand2,
  Maximize2, Minimize2, PanelLeft, ArrowRight, FileText,
  Image, File, Upload, List
} from 'lucide-react';

// Category icons
const CATEGORY_ICONS = {
  celebrate: '🎂', dine: '🍽️', travel: '✈️', stay: '🏨', enjoy: '🎉',
  club: '👑', care: '💊', shop: '🛒', fit: '🏃', learn: '📚',
  adopt: '🐾', insure: '🛡️', farewell: '🌈', community: '🤝',
  emergency: '🚨', advisory: '📋', paperwork: '📄'
};

// Status colors
const STATUS_COLORS = {
  new: 'bg-blue-500 text-white',
  in_progress: 'bg-amber-500 text-white',
  waiting_on_member: 'bg-orange-500 text-white',
  escalated: 'bg-red-500 text-white',
  resolved: 'bg-emerald-500 text-white',
  closed: 'bg-gray-400 text-white'
};

// Urgency colors
const URGENCY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700 font-medium',
  critical: 'bg-red-100 text-red-700 font-semibold'
};

const ServiceDeskWorkspace = ({ authHeaders }) => {
  // State
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    source: ''
  });
  const [quickFilter, setQuickFilter] = useState('all');
  
  // Reply
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  
  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  
  // Option Cards Modal
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsQuestion, setOptionsQuestion] = useState('');
  const [optionsList, setOptionsList] = useState([
    { id: 'A', title: '', description: '', price: '' },
    { id: 'B', title: '', description: '', price: '' }
  ]);
  const [sendingOptions, setSendingOptions] = useState(false);
  const [notifyChannels, setNotifyChannels] = useState(['in_app']);
  
  // Layout
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Conversation ref for auto-scroll
  const conversationEndRef = useRef(null);
  
  // Check for ticket ID in URL (from notification click)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket');
    if (ticketId) {
      // Auto-load this ticket
      fetchTicketDetails(ticketId);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=service-desk');
    }
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.source) params.append('source', filters.source);
      
      // Increase limit to get more tickets
      params.append('limit', '100');
      
      const res = await fetch(`${getApiUrl()}/api/tickets/?${params}`, { headers: authHeaders });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [filters, authHeaders]);

  // Fetch single ticket details
  const fetchTicketDetails = async (ticketId) => {
    setTicketLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, { headers: authHeaders });
      const data = await res.json();
      setSelectedTicket(data.ticket);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    }
    setTicketLoading(false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    if (selectedTicket) {
      await fetchTicketDetails(selectedTicket.ticket_id);
    }
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTickets();
      setLoading(false);
    };
    loadData();
  }, [fetchTickets]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.conversation]);

  // Handle ticket selection
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.ticket_id);
  };

  // Handle reply
  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          is_internal: isInternalNote
        })
      });
      
      setReplyText('');
      await fetchTicketDetails(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send message');
    }
    setSendingReply(false);
  };

  // Handle sending option cards
  const handleSendOptions = async () => {
    if (!selectedTicket || !optionsQuestion.trim()) return;
    
    // Filter out empty options
    const validOptions = optionsList.filter(opt => opt.title.trim());
    if (validOptions.length < 2) {
      alert('Please add at least 2 options');
      return;
    }
    
    setSendingOptions(true);
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/options/send`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          question: optionsQuestion,
          options: validOptions.map(opt => ({
            id: opt.id,
            title: opt.title.trim(),
            description: opt.description.trim() || null,
            price: opt.price.trim() || null
          })),
          notify_channels: notifyChannels,
          allow_custom: true
        })
      });
      
      // Reset and close modal
      setShowOptionsModal(false);
      setOptionsQuestion('');
      setOptionsList([
        { id: 'A', title: '', description: '', price: '' },
        { id: 'B', title: '', description: '', price: '' }
      ]);
      setNotifyChannels(['in_app']);
      
      // Refresh ticket
      await fetchTicketDetails(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Error sending options:', err);
      alert('Failed to send options');
    }
    setSendingOptions(false);
  };
  
  // Add option to list
  const addOption = () => {
    const nextId = String.fromCharCode(65 + optionsList.length); // A, B, C, D, E
    if (optionsList.length < 5) {
      setOptionsList([...optionsList, { id: nextId, title: '', description: '', price: '' }]);
    }
  };
  
  // Remove option from list
  const removeOption = (index) => {
    if (optionsList.length > 2) {
      const newList = optionsList.filter((_, i) => i !== index);
      // Re-index options
      setOptionsList(newList.map((opt, i) => ({ ...opt, id: String.fromCharCode(65 + i) })));
    }
  };
  
  // Update option
  const updateOption = (index, field, value) => {
    const newList = [...optionsList];
    newList[index][field] = value;
    setOptionsList(newList);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      await fetchTicketDetails(selectedTicket.ticket_id);
      await fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Generate AI draft
  const generateAiDraft = async () => {
    if (!selectedTicket) return;
    
    setAiLoading(true);
    setAiDraft(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/draft-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          reply_type: 'professional'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiDraft(data.draft || data.message);
      }
    } catch (err) {
      console.error('AI draft error:', err);
    }
    setAiLoading(false);
  };

  // Apply AI draft
  const applyAiDraft = () => {
    if (aiDraft) {
      setReplyText(aiDraft);
      setAiDraft(null);
    }
  };

  // Filter tickets based on quick filter
  const getFilteredTickets = () => {
    let filtered = tickets;
    
    switch (quickFilter) {
      case 'unassigned':
        filtered = tickets.filter(t => !t.assigned_to);
        break;
      case 'critical':
        filtered = tickets.filter(t => t.urgency === 'critical' || t.urgency === 'high');
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = tickets.filter(t => t.created_at?.startsWith(today) || t.updated_at?.startsWith(today));
        break;
      case 'inquiries':
        // Show member inquiries and messages from users
        filtered = tickets.filter(t => 
          t.source === 'member_inquiry' || 
          t.source === 'member_message' ||
          t.ticket_id?.startsWith('TKT-')
        );
        break;
      case 'new_messages':
        // Show only tickets with new member messages (unread)
        filtered = tickets.filter(t => t.has_new_member_message === true);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const displayTickets = getFilteredTickets();

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render ticket list item
  const TicketListItem = ({ ticket, isSelected }) => {
    const hasNewMessage = ticket.has_new_member_message;
    
    return (
      <div
        onClick={() => handleSelectTicket(ticket)}
        className={`p-3 border-b cursor-pointer transition-all hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        } ${hasNewMessage && !isSelected ? 'bg-pink-50 border-l-4 border-l-pink-500 animate-pulse' : ''}`}
        data-testid={`ticket-item-${ticket.ticket_id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{CATEGORY_ICONS[ticket.category] || '📋'}</span>
              <span className="font-medium text-sm truncate">{ticket.member?.name || ticket.member_name || 'Unknown'}</span>
              {hasNewMessage && (
                <Badge className="bg-pink-500 text-white text-[10px] animate-bounce">
                  💬 NEW
                </Badge>
              )}
              <Badge className={`text-xs ${URGENCY_COLORS[ticket.urgency] || ''}`}>
                {ticket.urgency}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{ticket.description || ticket.subject}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs px-1.5 py-0.5 ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                {ticket.status?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-gray-400">{formatTime(ticket.updated_at || ticket.created_at)}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
        </div>
      </div>
    );
  };

  // Render conversation message
  const ConversationMessage = ({ msg, index }) => {
    const isOutgoing = msg.direction === 'outgoing' || msg.is_agent_reply;
    const isInternal = msg.is_internal;
    const rawText = msg.message || msg.content || '';
    const photoUrls = [...new Set([
      ...(rawText.match(/https?:\/\/[^\s,)\n]+\.(jpg|jpeg|png|gif|webp)/gi) || []),
      ...(rawText.match(/https?:\/\/res\.cloudinary\.com\/[^\s,)\n]+/gi) || []),
    ])];
    const cleanText = rawText
      .replace(/📸 PHOTO:\s*https?:\/\/[^\n]+\n?\s*\([^\n]*\)/gi, '')
      .replace(/Photo:\s*https?:\/\/[^\s\n]+/gi, '')
      .replace(/https?:\/\/res\.cloudinary\.com\/[^\s,)\n]+/gi, '')
      .replace(/\bhttps?:\/\/[^\s,)\n]+\.(jpg|jpeg|png|gif|webp)\b/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${
          isInternal
            ? 'bg-amber-50 border border-amber-200'
            : isOutgoing
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100'
        } rounded-lg p-3`}>
          {isInternal && (
            <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
              <FileText className="w-3 h-3" /> Internal Note
            </div>
          )}
          {photoUrls.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="Attached"
                  style={{ maxWidth: '300px', borderRadius: '8px' }}
                  className="cursor-pointer object-cover shadow-sm"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}
          <p className={`text-sm whitespace-pre-wrap ${isOutgoing && !isInternal ? 'text-white' : 'text-gray-800'}`}>
            {cleanText || rawText}
          </p>
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOutgoing && !isInternal ? 'text-blue-100' : 'text-gray-400'
          }`}>
            <span>{msg.sender || msg.agent || (isOutgoing ? 'Agent' : 'Customer')}</span>
            <span>{formatTime(msg.timestamp || msg.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-120px)] bg-white rounded-lg border shadow-sm overflow-hidden ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`} data-testid="service-desk-workspace">
      
      {/* LEFT PANEL - Ticket Queue */}
      {showSidebar && (
        <div className={`border-r flex flex-col ${isExpanded ? 'w-[350px]' : 'w-[320px]'} flex-shrink-0`}>
          {/* Queue Header */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Inbox className="w-5 h-5" /> Tickets
                <Badge className="bg-blue-100 text-blue-700">{tickets.length}</Badge>
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-9 text-sm"
                data-testid="ticket-search"
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-1 flex-wrap">
              {[
                { id: 'all', label: 'All', icon: '📋', source: '' },
                { id: 'new_messages', label: '💬 New Messages', icon: '', source: '', filter: 'new_messages' },
                { id: 'inquiries', label: 'Inquiries', icon: '💬', source: 'member_inquiry' },
                { id: 'unassigned', label: 'Unassigned', icon: '📭', source: '' },
                { id: 'critical', label: 'Critical', icon: '🔴', source: '' },
                { id: 'today', label: 'Today', icon: '📅', source: '' }
              ].map(f => (
                <Button
                  key={f.id}
                  variant={quickFilter === f.id ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs h-7 px-2 ${
                    f.id === 'new_messages' && quickFilter === 'new_messages' 
                      ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                      : f.id === 'new_messages' 
                        ? 'bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-300' 
                        : f.id === 'inquiries' && quickFilter === 'inquiries' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : f.id === 'inquiries' 
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300' 
                            : ''
                  }`}
                  onClick={() => {
                    setQuickFilter(f.id);
                    setFilters(prev => ({ ...prev, source: f.source }));
                  }}
                >
                  {f.icon} {f.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {displayTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <Inbox className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No tickets found</p>
              </div>
            ) : (
              displayTickets.map(ticket => (
                <TicketListItem
                  key={ticket.ticket_id}
                  ticket={ticket}
                  isSelected={selectedTicket?.ticket_id === ticket.ticket_id}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* RIGHT PANEL - Ticket Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedTicket ? (
          /* No Ticket Selected State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Ticket</h3>
            <p className="text-sm text-center max-w-xs">
              Click on a ticket from the list to view the conversation and respond to the customer.
            </p>
          </div>
        ) : (
          <>
            {/* Ticket Header - Sticky */}
            <div className="border-b bg-white p-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {!showSidebar && (
                      <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)} className="mr-2">
                        <PanelLeft className="w-4 h-4" />
                      </Button>
                    )}
                    <span className="text-lg">{CATEGORY_ICONS[selectedTicket.category] || '📋'}</span>
                    <Badge className="bg-gray-100 text-gray-700 font-mono text-xs">
                      {selectedTicket.ticket_id}
                    </Badge>
                    <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className={`w-auto h-7 text-xs ${STATUS_COLORS[selectedTicket.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_on_member">Waiting on Member</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={`text-xs ${URGENCY_COLORS[selectedTicket.urgency] || ''}`}>
                      {selectedTicket.urgency}
                    </Badge>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{selectedTicket.member?.name || 'Customer'}</span>
                    {selectedTicket.member?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedTicket.member.email}
                      </span>
                    )}
                    {selectedTicket.member?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedTicket.member.phone}
                      </span>
                    )}
                  </div>
                  
                  {/* Assigned To */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Assigned to: </span>
                    <span className="font-medium text-gray-700">
                      {selectedTicket.assigned_to || 'Unassigned'}
                    </span>
                    {selectedTicket.created_at && (
                      <>
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3" />
                        <span>Created {formatTime(selectedTicket.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {showSidebar && (
                    <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conversation Timeline - Main Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" data-testid="conversation-timeline">
              {/* Initial Request */}
              {selectedTicket.description && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] bg-white border rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <PawPrint className="w-3 h-3" /> Initial Request
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatTime(selectedTicket.created_at)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Conversation Messages */}
              {selectedTicket.conversation?.map((msg, index) => (
                <ConversationMessage key={index} msg={msg} index={index} />
              ))}
              
              {/* Resolution Note */}
              {selectedTicket.resolution_note && (
                <div className="flex justify-center mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center max-w-md">
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600 mb-1">
                      <CheckCircle className="w-3 h-3" /> Resolution
                    </div>
                    <p className="text-sm text-green-800">{selectedTicket.resolution_note}</p>
                  </div>
                </div>
              )}
              
              <div ref={conversationEndRef} />
            </div>
            
            {/* Reply Composer - Fixed at Bottom */}
            <div className="border-t bg-white p-4 flex-shrink-0">
              {/* AI Draft Preview */}
              {aiDraft && (
                <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Draft
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setAiDraft(null)} className="h-6 px-2 text-xs">
                        Dismiss
                      </Button>
                      <Button size="sm" onClick={applyAiDraft} className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700">
                        Use Draft
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{aiDraft}</p>
                </div>
              )}
              
              {/* Internal Note Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-amber-600">Internal Note</span>
                </label>
                {isInternalNote && (
                  <span className="text-xs text-amber-500">(Not sent to customer)</span>
                )}
              </div>
              
              {/* Reply Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className={`flex-1 min-h-[80px] resize-none ${isInternalNote ? 'bg-amber-50 border-amber-200' : ''}`}
                  data-testid="reply-input"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAiDraft}
                    disabled={aiLoading}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-1" />
                    )}
                    AI Draft
                  </Button>
                  
                  {/* Send Options Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOptionsModal(true)}
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <List className="w-4 h-4 mr-1" />
                    Send Options
                  </Button>
                </div>
                
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || sendingReply}
                  className={isInternalNote ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  data-testid="send-reply-btn"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isInternalNote ? 'Add Note' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Send Option Cards</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowOptionsModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Question */}
              <div>
                <Label className="text-sm font-medium">Question for Member</Label>
                <Input
                  placeholder="e.g., Choose your groomer:"
                  value={optionsQuestion}
                  onChange={(e) => setOptionsQuestion(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* Options List */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Options</Label>
                {optionsList.map((opt, index) => (
                  <div key={opt.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                        {opt.id}
                      </span>
                      <Input
                        placeholder="Option title"
                        value={opt.title}
                        onChange={(e) => updateOption(index, 'title', e.target.value)}
                        className="flex-1"
                      />
                      {optionsList.length > 2 && (
                        <Button variant="ghost" size="sm" onClick={() => removeOption(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description (optional)"
                        value={opt.description}
                        onChange={(e) => updateOption(index, 'description', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Input
                        placeholder="Price"
                        value={opt.price}
                        onChange={(e) => updateOption(index, 'price', e.target.value)}
                        className="w-24 text-sm"
                      />
                    </div>
                  </div>
                ))}
                
                {optionsList.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addOption} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>
              
              {/* Notify Channels */}
              <div>
                <Label className="text-sm font-medium">Notify via</Label>
                <div className="flex gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyChannels.includes('in_app')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotifyChannels([...notifyChannels, 'in_app']);
                        } else {
                          setNotifyChannels(notifyChannels.filter(c => c !== 'in_app'));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">In-App</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyChannels.includes('whatsapp')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotifyChannels([...notifyChannels, 'whatsapp']);
                        } else {
                          setNotifyChannels(notifyChannels.filter(c => c !== 'whatsapp'));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyChannels.includes('email')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotifyChannels([...notifyChannels, 'email']);
                        } else {
                          setNotifyChannels(notifyChannels.filter(c => c !== 'email'));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowOptionsModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendOptions}
                disabled={!optionsQuestion.trim() || optionsList.filter(o => o.title.trim()).length < 2 || sendingOptions}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {sendingOptions ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Options
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDeskWorkspace;
