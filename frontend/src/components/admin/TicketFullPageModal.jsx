import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import RichTextEditor from './RichTextEditor';
import { formatDistanceToNow, format } from 'date-fns';
import {
  X, Send, Clock, User, Phone, Mail, Calendar, CheckCircle, Check,
  Loader2, MessageSquare, ChevronLeft, PawPrint, Sparkles, Brain,
  MessageCircle, ArrowLeft, Copy, ExternalLink, MoreHorizontal,
  Paperclip, Image as ImageIcon, FileText, AlertCircle, Star,
  Edit, Trash2, Tag, Flag, UserCircle, Building2, History
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

// Status badge colors
const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
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
  const [attachments, setAttachments] = useState([]);
  const [replyChannel, setReplyChannel] = useState('chat');
  const [miraKnowledge, setMiraKnowledge] = useState(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const conversationEndRef = useRef(null);
  const modalRef = useRef(null);
  
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

  // Handle reply submission
  const handleReply = async () => {
    if (!replyText.replace(/<[^>]*>/g, '').trim() && attachments.length === 0) {
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
          channel: replyChannel,
          attachments: attachments
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: isInternal ? 'Internal note added' : 'Reply sent successfully' });
        setReplyText('');
        setAttachments([]);
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
  const generateAiReply = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/generate-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id || ticket.id,
          context: ticket.messages?.slice(-5),
          pet_name: petProfile?.name || ticket.pet_info?.name,
          member_name: memberProfile?.name || ticket.member?.name,
          style: 'professional'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReplyText(data.reply || data.message || '');
      }
    } catch (error) {
      console.error('AI generation error:', error);
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
      ? (msg.sender_name || 'Concierge')
      : (msg.sender_name || ticket.member?.name || petProfile?.name || 'Customer');
    return { isAgent, name };
  };

  if (!ticket) return null;

  const ticketId = ticket.ticket_id || ticket.id || 'Unknown';
  const subject = ticket.subject || ticket.title || 'No Subject';
  const status = ticket.status || 'open';
  const priority = ticket.priority || 'normal';
  const messages = ticket.messages || [];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        data-testid="ticket-fullpage-modal"
      >
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="ticket-modal-close"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-500">#{ticketId.slice(-8)}</span>
                <Badge className={`${STATUS_COLORS[status]} border text-xs`}>
                  {status.replace(/_/g, ' ')}
                </Badge>
                <Badge className={`${PRIORITY_COLORS[priority]} text-xs`}>
                  {priority}
                </Badge>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mt-1">{subject}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <History className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              size="sm"
              onClick={() => document.getElementById('reply-editor')?.focus()}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Reply
            </Button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg ml-2"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========== LEFT SIDEBAR - TICKET PROPERTIES ========== */}
          <div className="w-[320px] border-r bg-gray-50/50 overflow-y-auto">
            <div className="p-4 space-y-5">
              
              {/* Ticket Properties */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Ticket Properties
                </h3>
                <Card className="p-3 space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Status</span>
                    <select
                      value={status}
                      onChange={(e) => onStatusChange?.(e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="awaiting_response">Awaiting Response</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Priority</span>
                    <Badge className={`${PRIORITY_COLORS[priority]} text-xs`}>{priority}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Category</span>
                    <span className="text-xs font-medium text-gray-700">{ticket.category || ticket.pillar || 'General'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Created</span>
                    <span className="text-xs text-gray-600">{formatTime(ticket.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Updated</span>
                    <span className="text-xs text-gray-600">{formatTime(ticket.updated_at || ticket.last_activity)}</span>
                  </div>
                </Card>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Contact Info
                </h3>
                <Card className="p-3 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {(memberProfile?.name || ticket.member?.name || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {memberProfile?.name || ticket.member?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">Pet Parent</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {(memberProfile?.email || ticket.member?.email) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{memberProfile?.email || ticket.member?.email}</span>
                      </div>
                    )}
                    {(memberProfile?.phone || ticket.member?.phone) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{memberProfile?.phone || ticket.member?.phone}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Pet Info */}
              {(petProfile?.name || ticket.pet_info?.name) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PawPrint className="w-3.5 h-3.5" />
                    Pet Info
                  </h3>
                  <Card className="p-3 bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      {(petProfile?.image || ticket.pet_info?.image) ? (
                        <img 
                          src={petProfile?.image || ticket.pet_info?.image} 
                          alt="Pet"
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <PawPrint className="w-6 h-6 text-purple-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {petProfile?.name || ticket.pet_info?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {petProfile?.breed || ticket.pet_info?.breed || 'Pet'}
                        </div>
                      </div>
                    </div>
                    {(petProfile?.age || ticket.pet_info?.age) && (
                      <div className="text-xs text-gray-500">
                        Age: {petProfile?.age || ticket.pet_info?.age}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      const phone = memberProfile?.phone || ticket.member?.phone;
                      if (phone) window.open(`https://wa.me/91${phone.replace(/\D/g, '')}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-2 text-green-600" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      const email = memberProfile?.email || ticket.member?.email;
                      if (email) window.open(`mailto:${email}?subject=Re: ${subject}`, '_blank');
                    }}
                  >
                    <Mail className="w-3.5 h-3.5 mr-2 text-blue-600" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      const phone = memberProfile?.phone || ticket.member?.phone;
                      if (phone) window.open(`tel:${phone}`, '_blank');
                    }}
                  >
                    <Phone className="w-3.5 h-3.5 mr-2 text-purple-600" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ========== RIGHT MAIN AREA ========== */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-6 px-6 py-3 border-b bg-gray-50/50">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'conversation' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {messages.length} Conversation{messages.length !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => setActiveTab('resolution')}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'resolution' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Resolution
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'activity' 
                    ? 'text-emerald-600 border-emerald-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Conversation Area */}
            {activeTab === 'conversation' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const { isAgent, name } = getSenderInfo(msg);
                      const isInternal = msg.is_internal || msg.type === 'internal';
                      
                      return (
                        <div 
                          key={msg.id || idx}
                          className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isInternal ? 'opacity-75' : ''}`}>
                            {/* Sender info */}
                            <div className={`flex items-center gap-2 mb-1 ${isAgent ? 'justify-end' : ''}`}>
                              {!isAgent && (
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                                  {name.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-600">{name}</span>
                              {isInternal && (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px]">Internal</Badge>
                              )}
                              <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp || msg.created_at)}</span>
                              {isAgent && (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-600">
                                  C
                                </div>
                              )}
                            </div>
                            
                            {/* Message bubble */}
                            <div 
                              className={`rounded-2xl px-4 py-3 ${
                                isAgent 
                                  ? isInternal 
                                    ? 'bg-amber-50 border border-amber-200 text-gray-800' 
                                    : 'bg-emerald-500 text-white'
                                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                              }`}
                            >
                              <div 
                                className={`text-sm prose prose-sm max-w-none ${isAgent && !isInternal ? 'prose-invert' : ''}`}
                                dangerouslySetInnerHTML={{ __html: msg.content || msg.message || '' }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={conversationEndRef} />
                </div>

                {/* Reply Composer */}
                <div className="border-t bg-white p-4">
                  {/* Internal Note Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className={`text-sm ${isInternal ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                        Internal Note (not visible to customer)
                      </span>
                    </label>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateAiReply}
                      disabled={aiLoading}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                      Ask Mira
                    </Button>
                  </div>

                  {/* Rich Text Editor */}
                  <div className={`border rounded-lg ${isInternal ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
                    <RichTextEditor
                      id="reply-editor"
                      value={replyText}
                      onChange={setReplyText}
                      placeholder={isInternal ? "Add internal note..." : `Reply to ${ticket.member?.name || 'customer'}...`}
                      minHeight="150px"
                      className="border-0"
                    />
                  </div>

                  {/* Channel Selector & Send */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Send via:</span>
                      {['chat', 'email', 'whatsapp'].map((ch) => (
                        <button
                          key={ch}
                          onClick={() => setReplyChannel(ch)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            replyChannel === ch
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {ch === 'chat' && <MessageCircle className="w-3 h-3 inline mr-1" />}
                          {ch === 'email' && <Mail className="w-3 h-3 inline mr-1" />}
                          {ch === 'whatsapp' && <MessageCircle className="w-3 h-3 inline mr-1 text-green-600" />}
                          {ch.charAt(0).toUpperCase() + ch.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleReply}
                        disabled={sending || (!replyText.replace(/<[^>]*>/g, '').trim() && attachments.length === 0)}
                        className={`${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        data-testid="send-reply-btn"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {isInternal ? 'Add Note' : 'Send Reply'}
                      </Button>
                    </div>
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
                    className="w-full h-40 p-3 border rounded-lg text-sm resize-none"
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
