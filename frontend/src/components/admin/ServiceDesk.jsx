import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { API_URL } from '../../utils/api';
import {
  Search, Plus, RefreshCw, Filter, X, Send, Clock, User, Phone, Mail,
  MapPin, Calendar, AlertCircle, CheckCircle, Loader2, MessageSquare,
  ChevronRight, Settings, BarChart3, Users, Tag, Paperclip, ExternalLink,
  Inbox, ArrowUp, ArrowDown, MoreVertical, Edit, Trash2, Eye, Star, Zap,
  Download, ShoppingBag, Bot, Utensils, Hotel, CheckSquare, Square, 
  UserPlus, XCircle, Archive, History, ChevronDown, Sparkles, Wand2,
  Brain, Lightbulb, Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';

// Category icons mapping
const CATEGORY_ICONS = {
  celebrate: '🎂', dine: '🍽️', travel: '✈️', stay: '🏨', enjoy: '🎉',
  club: '👑', care: '💊', shop: '🛒', work: '💼', fit: '🏃',
  exclusive: '⭐', emergency: '🚨', advisory: '📋', paperwork: '📄', referrals: '🤝'
};

// Source labels and colors
const SOURCE_CONFIG = {
  // Orders & Shop
  new_order: { label: 'Order', color: 'bg-green-100 text-green-700', icon: '🛒' },
  order: { label: 'Order', color: 'bg-green-100 text-green-700', icon: '🛒' },
  cake_order: { label: 'Cake Order', color: 'bg-pink-100 text-pink-700', icon: '🎂' },
  custom_cake: { label: 'Custom Cake', color: 'bg-purple-100 text-purple-700', icon: '🎨' },
  dine_bundle_order: { label: 'Dine Bundle', color: 'bg-orange-100 text-orange-700', icon: '🍽️' },
  
  // Reservations & Bookings
  new_reservation: { label: 'Reservation', color: 'bg-orange-100 text-orange-700', icon: '🍽️' },
  reservation: { label: 'Reservation', color: 'bg-orange-100 text-orange-700', icon: '🍽️' },
  dine_reservation: { label: 'Dine Booking', color: 'bg-orange-100 text-orange-700', icon: '🍽️' },
  stay_booking: { label: 'Stay Booking', color: 'bg-teal-100 text-teal-700', icon: '🏨' },
  travel_booking: { label: 'Travel', color: 'bg-sky-100 text-sky-700', icon: '✈️' },
  
  // Social & Events
  buddy_visit: { label: 'Pet Buddy', color: 'bg-pink-100 text-pink-700', icon: '🐕' },
  meetup_request: { label: 'Meetup', color: 'bg-rose-100 text-rose-700', icon: '💕' },
  
  // Communication Channels
  mira_chat: { label: 'Mira Chat', color: 'bg-purple-100 text-purple-700', icon: '🤖' },
  email: { label: 'Email', color: 'bg-blue-100 text-blue-700', icon: '📧' },
  whatsapp: { label: 'WhatsApp', color: 'bg-green-100 text-green-700', icon: '💬' },
  phone: { label: 'Phone', color: 'bg-amber-100 text-amber-700', icon: '📞' },
  web: { label: 'Website', color: 'bg-cyan-100 text-cyan-700', icon: '🌐' },
  
  // Care & Services
  care_appointment: { label: 'Care', color: 'bg-red-100 text-red-700', icon: '💊' },
  grooming: { label: 'Grooming', color: 'bg-violet-100 text-violet-700', icon: '✂️' },
  vet_consult: { label: 'Vet Consult', color: 'bg-red-100 text-red-700', icon: '🩺' },
  
  // Internal & Partner
  internal: { label: 'Internal', color: 'bg-gray-100 text-gray-700', icon: '🏢' },
  partner: { label: 'Partner', color: 'bg-indigo-100 text-indigo-700', icon: '🤝' },
  auto: { label: 'Auto', color: 'bg-slate-100 text-slate-700', icon: '⚡' }
};

// Status colors
const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_on_member: 'bg-orange-100 text-orange-800',
  escalated: 'bg-red-100 text-red-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

// Urgency colors
const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600'
};

// Default statuses (fallback)
const DEFAULT_STATUSES = [
  { id: 'new', name: 'New', color: 'blue' },
  { id: 'in_progress', name: 'In Progress', color: 'yellow' },
  { id: 'waiting_on_member', name: 'Waiting on Member', color: 'orange' },
  { id: 'escalated', name: 'Escalated', color: 'red' },
  { id: 'resolved', name: 'Resolved', color: 'green' },
  { id: 'closed', name: 'Closed', color: 'gray' }
];

// Default categories (pillars) - fallback
const DEFAULT_CATEGORIES = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', description: 'Birthday cakes, celebrations' },
  { id: 'dine', name: 'Dine', icon: '🍽️', description: 'Restaurant reservations, dining' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Pet travel assistance' },
  { id: 'stay', name: 'Stay', icon: '🏨', description: 'Pet-friendly accommodations' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎉', description: 'Events & experiences' },
  { id: 'club', name: 'Club', icon: '👑', description: 'Membership & club services' },
  { id: 'care', name: 'Care', icon: '💊', description: 'Pet health & wellness' },
  { id: 'shop', name: 'Shop Assist', icon: '🛒', description: 'Product inquiries & orders' },
  { id: 'work', name: 'Work', icon: '💼', description: 'Pet at work services' },
  { id: 'fit', name: 'Fit', icon: '🏃', description: 'Pet fitness & activities' },
  { id: 'exclusive', name: 'Exclusive', icon: '⭐', description: 'VIP & exclusive requests' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', description: 'Urgent pet emergencies' },
  { id: 'advisory', name: 'Advisory', icon: '📋', description: 'Pet advice & consultation' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', description: 'Documents & certifications' },
  { id: 'referrals', name: 'Referrals', icon: '🤝', description: 'Partner referrals' }
];

const ServiceDesk = ({ authHeaders }) => {
  // State
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [concierges, setConcierges] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    urgency: '',
    search: ''
  });
  
  // Modals
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('email');
  
  // Reply
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendChannel, setSendChannel] = useState('internal'); // internal, email, whatsapp
  
  // AI Assistant
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiTone, setAiTone] = useState('professional');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiActions, setAiActions] = useState([]);
  
  // SLA & Auto-assignment
  const [slaStats, setSlaStats] = useState(null);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Bulk Actions
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Quick Filters
  const [quickFilter, setQuickFilter] = useState('all'); // all, my_tickets, unassigned, overdue, today

  // Fetch data
  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.search) params.append('search', filters.search);
      
      const res = await fetch(`${API_URL}/api/tickets/?${params}`, { headers: authHeaders });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [filters, authHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/stats`, { headers: authHeaders });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [authHeaders]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, statusRes, conciergeRes, intRes, slaRes] = await Promise.all([
        fetch(`${API_URL}/api/tickets/categories`, { headers: authHeaders }),
        fetch(`${API_URL}/api/tickets/statuses`, { headers: authHeaders }),
        fetch(`${API_URL}/api/tickets/concierges`, { headers: authHeaders }),
        fetch(`${API_URL}/api/tickets/integrations`, { headers: authHeaders }),
        fetch(`${API_URL}/api/tickets/sla/stats`, { headers: authHeaders }).catch(() => ({ json: () => ({}) }))
      ]);
      
      const [catData, statusData, conciergeData, intData, slaData] = await Promise.all([
        catRes.json(), statusRes.json(), conciergeRes.json(), intRes.json(), slaRes.json()
      ]);
      
      setCategories(catData.categories || []);
      setStatuses(statusData.statuses || []);
      setConcierges(conciergeData.concierges || []);
      setIntegrations(intData.integrations || []);
      setSlaStats(slaData);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, [authHeaders]);

  const fetchTicketDetails = async (ticketId) => {
    setTicketLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, { headers: authHeaders });
      const data = await res.json();
      setSelectedTicket(data.ticket);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    }
    setTicketLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchTickets()]);
    if (selectedTicket) {
      await fetchTicketDetails(selectedTicket.ticket_id);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetadata(), fetchStats(), fetchTickets()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMetadata, fetchStats, fetchTickets]);

  // Handlers
  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      if (isInternalNote || sendChannel === 'internal') {
        // Internal note - use existing endpoint
        await fetch(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/reply`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: replyText,
            is_internal: isInternalNote
          })
        });
      } else {
        // Send via channel (email/whatsapp) using messaging API
        const response = await fetch(`${API_URL}/api/tickets/messaging/send`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: selectedTicket.ticket_id,
            message: replyText,
            channel: sendChannel,
            is_internal: false
          })
        });
        
        const result = await response.json();
        
        if (sendChannel === 'whatsapp' && result.whatsapp_url) {
          // Open WhatsApp in new tab
          window.open(result.whatsapp_url, '_blank');
        }
        
        if (!result.success) {
          alert(result.error || 'Failed to send message');
        }
      }
      
      setReplyText('');
      fetchTicketDetails(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send message');
    }
    setSendingReply(false);
  };

  const handleAutoAssign = async () => {
    if (!selectedTicket) return;
    
    setAutoAssigning(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/sla/auto-assign/${selectedTicket.ticket_id}`, {
        method: 'POST',
        headers: authHeaders
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Ticket auto-assigned to ${result.assigned_to}`);
        fetchTicketDetails(selectedTicket.ticket_id);
        fetchTickets();
      } else {
        alert(result.message || 'Could not auto-assign ticket');
      }
    } catch (err) {
      console.error('Error auto-assigning:', err);
    }
    setAutoAssigning(false);
  };

  const handleAutoAssignAll = async () => {
    if (!confirm('Auto-assign all unassigned tickets?')) return;
    
    setAutoAssigning(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/sla/auto-assign-all`, {
        method: 'POST',
        headers: authHeaders
      });
      
      const result = await response.json();
      
      alert(`Assigned ${result.assigned_count} of ${result.total_unassigned} unassigned tickets`);
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error auto-assigning all:', err);
    }
    setAutoAssigning(false);
  };

  const handleCheckEscalations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/sla/check-escalations`, {
        method: 'POST',
        headers: authHeaders
      });
      
      const result = await response.json();
      
      alert(`Escalated: ${result.escalated_count}, Notifications sent: ${result.notifications_sent}`);
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error checking escalations:', err);
    }
  };

  // ============== BULK ACTIONS ==============
  
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map(t => t.ticket_id)));
    }
  };

  const clearSelection = () => {
    setSelectedTickets(new Set());
  };

  const handleBulkAssign = async (assigneeId) => {
    if (selectedTickets.size === 0) return;
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedTickets).map(ticketId => {
        const formData = new FormData();
        formData.append('assignee', assigneeId);
        return fetch(`${API_URL}/api/tickets/${ticketId}/assign`, {
          method: 'POST',
          headers: authHeaders,
          body: formData
        });
      });
      
      await Promise.all(promises);
      alert(`${selectedTickets.size} tickets assigned successfully`);
      clearSelection();
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error bulk assigning:', err);
      alert('Failed to assign some tickets');
    }
    setBulkActionLoading(false);
  };

  const handleBulkStatusChange = async (newStatus, resolutionNote = null) => {
    if (selectedTickets.size === 0) return;
    
    // For resolving, require a note
    if (newStatus === 'resolved' && !resolutionNote) {
      resolutionNote = prompt('Enter resolution note for all selected tickets:');
      if (!resolutionNote) return;
    }
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_URL}/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: newStatus,
            ...(resolutionNote && { resolution_note: resolutionNote })
          })
        })
      );
      
      await Promise.all(promises);
      alert(`${selectedTickets.size} tickets updated to "${newStatus}"`);
      clearSelection();
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error bulk status change:', err);
      alert('Failed to update some tickets');
    }
    setBulkActionLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTickets.size} tickets? This cannot be undone.`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedTickets).map(ticketId => 
        fetch(`${API_URL}/api/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: authHeaders
        })
      );
      
      await Promise.all(promises);
      alert(`${selectedTickets.size} tickets deleted`);
      clearSelection();
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error bulk deleting:', err);
      alert('Failed to delete some tickets');
    }
    setBulkActionLoading(false);
  };

  // Quick filter logic
  const getFilteredTickets = () => {
    let filtered = tickets;
    
    switch (quickFilter) {
      case 'my_tickets':
        filtered = tickets.filter(t => t.assigned_to === 'aditya'); // TODO: Get current user
        break;
      case 'unassigned':
        filtered = tickets.filter(t => !t.assigned_to);
        break;
      case 'overdue':
        const now = new Date();
        filtered = tickets.filter(t => t.sla_due_at && new Date(t.sla_due_at) < now && !['resolved', 'closed'].includes(t.status));
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = tickets.filter(t => t.created_at?.startsWith(today));
        break;
      case 'critical':
        filtered = tickets.filter(t => t.urgency === 'critical' || t.urgency === 'high');
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const displayTickets = getFilteredTickets();

  // ============== AI ASSISTANT FUNCTIONS ==============
  
  const generateAiDraft = async (tone = 'professional') => {
    if (!selectedTicket) return;
    
    setAiLoading(true);
    setAiDraft(null);
    
    try {
      const response = await fetch(`${API_URL}/api/tickets/ai/draft-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          reply_type: tone
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiDraft(data);
        setShowAiPanel(true);
      } else {
        console.error('AI draft failed');
      }
    } catch (err) {
      console.error('AI draft error:', err);
    }
    setAiLoading(false);
  };

  const useAiDraft = (draft) => {
    setReplyText(draft);
    setShowAiPanel(false);
  };

  const getAiSummary = async () => {
    if (!selectedTicket) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/ai/summarize?ticket_id=${selectedTicket.ticket_id}`, {
        method: 'POST',
        headers: authHeaders
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error('AI summary error:', err);
    }
    setAiLoading(false);
  };

  const getAiActions = async () => {
    if (!selectedTicket) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/ai/suggest-actions?ticket_id=${selectedTicket.ticket_id}`, {
        method: 'POST',
        headers: authHeaders
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiActions(data.suggested_actions || []);
      }
    } catch (err) {
      console.error('AI actions error:', err);
    }
    setAiLoading(false);
  };

  // CSV Export function
  const exportTicketsCSV = () => {
    const headers = ['ticket_id', 'member_name', 'member_email', 'member_phone', 'category', 'source', 'status', 'urgency', 'description', 'assigned_to', 'created_at', 'updated_at'];
    const rows = [headers.join(',')];
    
    tickets.forEach(ticket => {
      const row = [
        ticket.ticket_id || '',
        ticket.member?.name || '',
        ticket.member?.email || '',
        ticket.member?.phone || '',
        ticket.category || '',
        ticket.source || '',
        ticket.status || '',
        ticket.urgency || '',
        (ticket.description || '').replace(/"/g, '""').replace(/\n/g, ' '),
        ticket.assigned_to || '',
        ticket.created_at || '',
        ticket.updated_at || ''
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    });
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `service_desk_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    
    // If resolving, require a note
    if (newStatus === 'resolved' && !selectedTicket.resolution_note) {
      const note = prompt('Please enter a resolution note:');
      if (!note) return;
      
      try {
        await fetch(`${API_URL}/api/tickets/${selectedTicket.ticket_id}`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, resolution_note: note })
        });
      } catch (err) {
        console.error('Error updating status:', err);
        return;
      }
    } else {
      try {
        await fetch(`${API_URL}/api/tickets/${selectedTicket.ticket_id}`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error('Error updating status:', err);
        return;
      }
    }
    
    fetchTicketDetails(selectedTicket.ticket_id);
    fetchStats();
    fetchTickets();
  };

  const handleAssign = async (assignee) => {
    if (!selectedTicket) return;
    
    const formData = new FormData();
    formData.append('assignee', assignee);
    
    try {
      await fetch(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/assign`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      
      fetchTicketDetails(selectedTicket.ticket_id);
      fetchTickets();
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }
  };

  // New Ticket Form Component
  const NewTicketForm = () => {
    const [formData, setFormData] = useState({
      member: { name: '', phone: '', email: '', city: '', country: 'India' },
      category: 'shop',
      urgency: 'medium',
      description: '',
      source: 'internal'
    });
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
      if (!formData.member.name || !formData.description) {
        alert('Name and description are required');
        return;
      }
      
      setCreating(true);
      try {
        await fetch(`${API_URL}/api/tickets/`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        setShowNewTicket(false);
        fetchTickets();
        fetchStats();
      } catch (err) {
        console.error('Error creating ticket:', err);
      }
      setCreating(false);
    };

    return (
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Member Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Member Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.member.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      member: { ...formData.member, name: e.target.value }
                    })}
                    placeholder="Member name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.member.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      member: { ...formData.member, phone: e.target.value }
                    })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.member.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      member: { ...formData.member, email: e.target.value }
                    })}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.member.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      member: { ...formData.member, city: e.target.value }
                    })}
                    placeholder="City"
                  />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Request Details</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(v) => setFormData({ ...formData, urgency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="web">Web Form</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the request..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Settings Modal - Enhanced with SLA & Auto-Assignment
  const SettingsModal = () => {
    const [emailConfig, setEmailConfig] = useState({
      imap_host: '',
      imap_port: '993',
      smtp_host: '',
      smtp_port: '587',
      email: '',
      password: ''
    });
    const [whatsappConfig, setWhatsappConfig] = useState({
      phone_number_id: '',
      access_token: '',
      webhook_verify_token: ''
    });
    const [saving, setSaving] = useState(false);
    
    // SLA & Auto-Assignment state
    const [assignmentRules, setAssignmentRules] = useState([]);
    const [slaRules, setSlaRules] = useState({ rules: [], defaults: [] });
    const [conciergeAvailability, setConciergeAvailability] = useState([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [newAssignmentRule, setNewAssignmentRule] = useState({
      name: '',
      category: '',
      urgency: '',
      source: '',
      assign_to: '',
      priority: 50,
      enabled: true
    });
    const [newSlaRule, setNewSlaRule] = useState({
      name: '',
      category: '',
      urgency: '',
      response_time_hours: 4,
      resolution_time_hours: 24,
      auto_escalate: true,
      enabled: true
    });

    // Fetch SLA & Assignment rules
    const fetchRules = async () => {
      setLoadingRules(true);
      try {
        const [assignRes, slaRes, availRes] = await Promise.all([
          fetch(`${API_URL}/api/tickets/sla/rules/assignment`, { headers: authHeaders }),
          fetch(`${API_URL}/api/tickets/sla/rules/sla`, { headers: authHeaders }),
          fetch(`${API_URL}/api/tickets/sla/concierges/availability`, { headers: authHeaders })
        ]);
        
        if (assignRes.ok) {
          const data = await assignRes.json();
          setAssignmentRules(data.rules || []);
        }
        if (slaRes.ok) {
          const data = await slaRes.json();
          setSlaRules(data);
        }
        if (availRes.ok) {
          const data = await availRes.json();
          setConciergeAvailability(data.concierges || []);
        }
      } catch (err) {
        console.error('Error fetching rules:', err);
      }
      setLoadingRules(false);
    };

    // Load rules when tab changes to SLA or Assignment
    useEffect(() => {
      if (activeSettingsTab === 'sla' || activeSettingsTab === 'assignment' || activeSettingsTab === 'team') {
        fetchRules();
      }
    }, [activeSettingsTab]);

    const handleSaveAssignmentRule = async () => {
      if (!newAssignmentRule.name || !newAssignmentRule.assign_to) {
        alert('Please enter a rule name and select who to assign to');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(`${API_URL}/api/tickets/sla/rules/assignment`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(newAssignmentRule)
        });
        if (res.ok) {
          setNewAssignmentRule({ name: '', category: '', urgency: '', source: '', assign_to: '', priority: 50, enabled: true });
          fetchRules();
        }
      } catch (err) {
        console.error('Error saving assignment rule:', err);
      }
      setSaving(false);
    };

    const handleDeleteAssignmentRule = async (ruleName) => {
      if (!confirm(`Delete rule "${ruleName}"?`)) return;
      try {
        await fetch(`${API_URL}/api/tickets/sla/rules/assignment/${encodeURIComponent(ruleName)}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        fetchRules();
      } catch (err) {
        console.error('Error deleting rule:', err);
      }
    };

    const handleSaveSlaRule = async () => {
      if (!newSlaRule.name) {
        alert('Please enter a rule name');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(`${API_URL}/api/tickets/sla/rules/sla`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(newSlaRule)
        });
        if (res.ok) {
          setNewSlaRule({ name: '', category: '', urgency: '', response_time_hours: 4, resolution_time_hours: 24, auto_escalate: true, enabled: true });
          fetchRules();
        }
      } catch (err) {
        console.error('Error saving SLA rule:', err);
      }
      setSaving(false);
    };

    const handleToggleAvailability = async (conciergeId, available) => {
      try {
        await fetch(`${API_URL}/api/tickets/sla/concierges/availability`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ concierge_id: conciergeId, available })
        });
        fetchRules();
      } catch (err) {
        console.error('Error updating availability:', err);
      }
    };

    const handleSaveIntegration = async (provider, config) => {
      setSaving(true);
      try {
        await fetch(`${API_URL}/api/tickets/integrations`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, config, enabled: true })
        });
        fetchMetadata();
      } catch (err) {
        console.error('Error saving integration:', err);
      }
      setSaving(false);
    };

    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Desk Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
            <TabsList className="w-full grid grid-cols-5 mb-4">
              <TabsTrigger value="assignment" className="text-xs">
                <Zap className="w-3 h-3 mr-1" /> Auto-Assign
              </TabsTrigger>
              <TabsTrigger value="sla" className="text-xs">
                <Clock className="w-3 h-3 mr-1" /> SLA Rules
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs">
                <Users className="w-3 h-3 mr-1" /> Team
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs">
                <Mail className="w-3 h-3 mr-1" /> Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
              </TabsTrigger>
            </TabsList>

            {/* AUTO-ASSIGNMENT TAB */}
            <TabsContent value="assignment" className="space-y-4 mt-2">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Auto-assignment rules route new tickets to the right concierge based on category, urgency, or source.
                </p>
              </div>
              
              {/* Existing Rules */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Active Rules</h4>
                {loadingRules ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : assignmentRules.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No custom rules yet. Using default round-robin assignment.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {assignmentRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{rule.name}</span>
                          <span className="text-gray-500 ml-2">
                            {rule.category && `${CATEGORY_ICONS[rule.category] || ''} ${rule.category}`}
                            {rule.urgency && ` • ${rule.urgency}`}
                            → <span className="text-purple-600">{rule.assign_to}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignmentRule(rule.name)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Rule */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Add New Rule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Rule Name *</Label>
                    <Input
                      value={newAssignmentRule.name}
                      onChange={(e) => setNewAssignmentRule({ ...newAssignmentRule, name: e.target.value })}
                      placeholder="e.g., Dine to Team Lead"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Assign To *</Label>
                    <Select value={newAssignmentRule.assign_to} onValueChange={(v) => setNewAssignmentRule({ ...newAssignmentRule, assign_to: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Select concierge" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">🔄 Round Robin (Auto)</SelectItem>
                        {concierges.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Category Filter</Label>
                    <Select value={newAssignmentRule.category} onValueChange={(v) => setNewAssignmentRule({ ...newAssignmentRule, category: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Any category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Category</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Urgency Filter</Label>
                    <Select value={newAssignmentRule.urgency} onValueChange={(v) => setNewAssignmentRule({ ...newAssignmentRule, urgency: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Any urgency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Urgency</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">⚪ Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority (Higher = First)</Label>
                    <Input
                      type="number"
                      value={newAssignmentRule.priority}
                      onChange={(e) => setNewAssignmentRule({ ...newAssignmentRule, priority: parseInt(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSaveAssignmentRule} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Rule
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SLA RULES TAB */}
            <TabsContent value="sla" className="space-y-4 mt-2">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <Clock className="w-4 h-4 inline mr-1" />
                  SLA rules define response and resolution time targets. Tickets breaching SLA are auto-escalated.
                </p>
              </div>

              {/* Default SLAs */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Default SLA by Urgency</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(slaRules.defaults || []).map((sla, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded border text-center">
                      <Badge className={URGENCY_COLORS[sla.urgency] || 'bg-gray-100'}>{sla.urgency}</Badge>
                      <div className="text-xs mt-1">
                        <div>Response: <strong>{sla.response_hours}h</strong></div>
                        <div>Resolution: <strong>{sla.resolution_hours}h</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom SLA Rules */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Custom SLA Rules</h4>
                {(slaRules.rules || []).length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No custom SLA rules. Default urgency-based SLAs apply.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(slaRules.rules || []).map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                        <div>
                          <span className="font-medium">{rule.name}</span>
                          <span className="text-gray-500 ml-2">
                            Response: {rule.response_time_hours}h • Resolution: {rule.resolution_time_hours}h
                          </span>
                        </div>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>{rule.enabled ? 'Active' : 'Off'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom SLA */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Add Custom SLA Rule</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Rule Name *</Label>
                    <Input
                      value={newSlaRule.name}
                      onChange={(e) => setNewSlaRule({ ...newSlaRule, name: e.target.value })}
                      placeholder="e.g., VIP Fast Track"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={newSlaRule.category} onValueChange={(v) => setNewSlaRule({ ...newSlaRule, category: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Category</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Urgency</Label>
                    <Select value={newSlaRule.urgency} onValueChange={(v) => setNewSlaRule({ ...newSlaRule, urgency: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Response Time (hours)</Label>
                    <Input
                      type="number"
                      value={newSlaRule.response_time_hours}
                      onChange={(e) => setNewSlaRule({ ...newSlaRule, response_time_hours: parseInt(e.target.value) || 1 })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Resolution Time (hours)</Label>
                    <Input
                      type="number"
                      value={newSlaRule.resolution_time_hours}
                      onChange={(e) => setNewSlaRule({ ...newSlaRule, resolution_time_hours: parseInt(e.target.value) || 1 })}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSaveSlaRule} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add SLA Rule
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TEAM / CONCIERGE TAB */}
            <TabsContent value="team" className="space-y-4 mt-2">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Users className="w-4 h-4 inline mr-1" />
                  Manage team availability and workload. Unavailable concierges will not receive new auto-assignments.
                </p>
              </div>

              {loadingRules ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {conciergeAvailability.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${member.available ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="font-medium">{member.name || member.concierge_id}</div>
                          <div className="text-xs text-gray-500">
                            {member.current_tickets} / {member.max_tickets} tickets
                            {member.categories?.length > 0 && ` • Specializes: ${member.categories.join(', ')}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.available ? 'default' : 'secondary'} className={member.available ? 'bg-green-100 text-green-700' : ''}>
                          {member.available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAvailability(member.concierge_id, !member.available)}
                        >
                          {member.available ? 'Set Away' : 'Set Available'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {conciergeAvailability.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No team members configured yet.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* EMAIL TAB */}
            <TabsContent value="email" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Configure your email inbox to automatically capture emails as tickets.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IMAP Host</Label>
                  <Input
                    value={emailConfig.imap_host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, imap_host: e.target.value })}
                    placeholder="imap.yourdomain.com"
                  />
                </div>
                <div>
                  <Label>IMAP Port</Label>
                  <Input
                    value={emailConfig.imap_port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, imap_port: e.target.value })}
                    placeholder="993"
                  />
                </div>
                <div>
                  <Label>SMTP Host</Label>
                  <Input
                    value={emailConfig.smtp_host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                    placeholder="smtp.yourdomain.com"
                  />
                </div>
                <div>
                  <Label>SMTP Port</Label>
                  <Input
                    value={emailConfig.smtp_port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={emailConfig.email}
                    onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                    placeholder="support@yourdomain.com"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                    placeholder="App password"
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSaveIntegration('email', emailConfig)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Email Configuration
              </Button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Connect WhatsApp Business API to receive and respond to messages as tickets.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Phone Number ID</Label>
                  <Input
                    value={whatsappConfig.phone_number_id}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                    placeholder="From Meta Business Suite"
                  />
                </div>
                <div>
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    value={whatsappConfig.access_token}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, access_token: e.target.value })}
                    placeholder="Permanent access token"
                  />
                </div>
                <div>
                  <Label>Webhook Verify Token</Label>
                  <Input
                    value={whatsappConfig.webhook_verify_token}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhook_verify_token: e.target.value })}
                    placeholder="Your custom verify token"
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSaveIntegration('whatsapp', whatsappConfig)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save WhatsApp Configuration
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Metrics Bar */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats?.total_open || 0}</div>
              <div className="text-xs text-gray-600">Open Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats?.by_urgency?.critical || 0}</div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats?.by_urgency?.high || 0}</div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.overdue || 0}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats?.recent_24h || 0}</div>
              <div className="text-xs text-gray-600">Last 24h</div>
            </div>
            {slaStats && (
              <>
                <div className="border-l pl-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{slaStats.sla_breach_rate || 0}%</div>
                  <div className="text-xs text-gray-600">SLA Breach Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{slaStats.avg_first_response_hours || '-'}h</div>
                  <div className="text-xs text-gray-600">Avg Response</div>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoAssignAll} disabled={autoAssigning} title="Auto-assign all unassigned tickets">
              <Zap className={`w-4 h-4 mr-1 ${autoAssigning ? 'animate-pulse' : ''}`} /> Auto-Assign
            </Button>
            <Button variant="outline" size="sm" onClick={handleCheckEscalations} title="Check and escalate overdue tickets">
              <AlertCircle className="w-4 h-4 mr-1" /> Check SLA
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)}>
              <Tag className="w-4 h-4 mr-1" /> Categories
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button size="sm" onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Filters Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                className="pl-8 h-9"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
            <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                {statuses.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
            <Select value={filters.category || 'all'} onValueChange={(v) => setFilters({ ...filters, category: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Urgency</Label>
            <Select value={filters.urgency || 'all'} onValueChange={(v) => setFilters({ ...filters, urgency: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => setFilters({ status: '', category: '', urgency: '', search: '' })}
          >
            <X className="w-4 h-4 mr-1" /> Clear Filters
          </Button>

          {/* Quick Stats */}
          <div className="pt-4 border-t space-y-2">
            <div className="text-xs text-gray-500 mb-2">By Category</div>
            {categories.slice(0, 5).map(cat => (
              <div 
                key={cat.id} 
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => setFilters({ ...filters, category: cat.id })}
              >
                <span>{cat.icon} {cat.name}</span>
                <span className="text-gray-400">{stats?.by_category?.[cat.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="w-96 flex-shrink-0 border rounded-lg overflow-hidden flex flex-col">
          {/* Header with Quick Filters */}
          <div className="bg-gray-50 px-3 py-2 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tickets ({displayTickets.length})</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={exportTicketsCSV} title="Export to CSV">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { fetchTickets(); fetchStats(); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All', count: tickets.length },
                { id: 'unassigned', label: 'Unassigned', count: tickets.filter(t => !t.assigned_to).length },
                { id: 'critical', label: '🔴 Critical', count: tickets.filter(t => t.urgency === 'critical' || t.urgency === 'high').length },
                { id: 'today', label: 'Today', count: tickets.filter(t => t.created_at?.startsWith(new Date().toISOString().split('T')[0])).length },
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant={quickFilter === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-xs whitespace-nowrap ${quickFilter === tab.id ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  onClick={() => setQuickFilter(tab.id)}
                >
                  {tab.label} {tab.count > 0 && <span className="ml-1 opacity-70">({tab.count})</span>}
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Action Bar - Shows when tickets are selected */}
          {selectedTickets.size > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedTickets.size === displayTickets.length && displayTickets.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium text-amber-800">
                    {selectedTickets.size} selected
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearSelection}>
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Bulk Assign Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={bulkActionLoading}>
                        <UserPlus className="w-3 h-3 mr-1" /> Assign
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {concierges.map(c => (
                        <DropdownMenuItem key={c.id} onClick={() => handleBulkAssign(c.id)}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bulk Status Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={bulkActionLoading}>
                        <CheckSquare className="w-3 h-3 mr-1" /> Status
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('in_progress')}>
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2" /> In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('waiting_on_member')}>
                        <span className="w-2 h-2 rounded-full bg-orange-400 mr-2" /> Waiting on Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('resolved')}>
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-2" /> Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('closed')}>
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" /> Closed
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('escalated')} className="text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-400 mr-2" /> Escalate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bulk Delete */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs text-red-600 hover:bg-red-50" 
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {bulkActionLoading && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-700">
                  <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                </div>
              )}
            </div>
          )}

          {/* Select All Row (when no selection) */}
          {selectedTickets.size === 0 && displayTickets.length > 0 && (
            <div className="bg-gray-50 border-b px-3 py-1.5 flex items-center gap-2">
              <Checkbox 
                checked={false}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-gray-500">Select all</span>
            </div>
          )}

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {displayTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tickets found</p>
                {quickFilter !== 'all' && (
                  <Button variant="link" size="sm" onClick={() => setQuickFilter('all')}>
                    Show all tickets
                  </Button>
                )}
              </div>
            ) : (
              displayTickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''
                  } ${selectedTickets.has(ticket.ticket_id) ? 'bg-amber-25 ring-1 ring-amber-200' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedTickets.has(ticket.ticket_id)}
                        onCheckedChange={() => toggleTicketSelection(ticket.ticket_id)}
                      />
                    </div>
                    
                    {/* Ticket Content */}
                    <div className="flex-1 min-w-0" onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-mono text-gray-500">{ticket.ticket_id}</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {ticket.source && SOURCE_CONFIG[ticket.source] && (
                            <Badge className={`text-xs ${SOURCE_CONFIG[ticket.source].color}`}>
                              {SOURCE_CONFIG[ticket.source].icon}
                            </Badge>
                          )}
                          <Badge className={`text-xs ${URGENCY_COLORS[ticket.urgency]}`}>
                            {ticket.urgency === 'critical' ? '🔴' : ticket.urgency === 'high' ? '🟠' : ticket.urgency === 'medium' ? '🟡' : '⚪'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{CATEGORY_ICONS[ticket.category]}</span>
                        <span className="font-medium text-sm truncate">{ticket.member?.name || 'Unknown'}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{ticket.description?.substring(0, 100)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={`text-xs ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status?.replace(/_/g, ' ')}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {ticket.assigned_to && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.assigned_to.split('@')[0]}
                            </span>
                          )}
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          {ticketLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{CATEGORY_ICONS[selectedTicket.category]}</span>
                    <span className="font-mono text-sm text-gray-500">{selectedTicket.ticket_id}</span>
                    <Badge className={STATUS_COLORS[selectedTicket.status]}>
                      {selectedTicket.status?.replace('_', ' ')}
                    </Badge>
                    {selectedTicket.source && SOURCE_CONFIG[selectedTicket.source] && (
                      <Badge className={SOURCE_CONFIG[selectedTicket.source].color}>
                        {SOURCE_CONFIG[selectedTicket.source].icon} {SOURCE_CONFIG[selectedTicket.source].label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <h3 className="font-medium">{selectedTicket.member?.name}</h3>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Member Info */}
                <Card className="p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Member Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedTicket.member?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 h-3" /> {selectedTicket.member.phone}
                      </div>
                    )}
                    {selectedTicket.member?.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3" /> {selectedTicket.member.email}
                      </div>
                    )}
                    {selectedTicket.member?.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3 h-3" /> {selectedTicket.member.city}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-3 h-3" /> {new Date(selectedTicket.created_at).toLocaleString()}
                    </div>
                  </div>
                </Card>

                {/* Assignment */}
                <Card className="p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Assignment</span>
                    {!selectedTicket.assigned_to && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={handleAutoAssign}
                        disabled={autoAssigning}
                      >
                        <Zap className="w-3 h-3 mr-1" /> Auto
                      </Button>
                    )}
                  </h4>
                  <Select 
                    value={selectedTicket.assigned_to || 'unassigned'} 
                    onValueChange={(v) => v !== 'unassigned' && handleAssign(v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {concierges.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                {/* Activity Timeline */}
                <Card className="p-3">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> Activity Timeline
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {/* Created */}
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Ticket created</span>
                        <span className="text-gray-500 ml-2">
                          {selectedTicket.source && SOURCE_CONFIG[selectedTicket.source] 
                            ? `via ${SOURCE_CONFIG[selectedTicket.source].label}` 
                            : ''}
                        </span>
                        <div className="text-gray-400">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {/* First Response */}
                    {selectedTicket.first_response_at && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">First response</span>
                          <div className="text-gray-400">{new Date(selectedTicket.first_response_at).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Assigned */}
                    {selectedTicket.assigned_to && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Assigned to {selectedTicket.assigned_to}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* SLA Due */}
                    {selectedTicket.sla_due_at && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${new Date(selectedTicket.sla_due_at) < new Date() ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <div>
                          <span className="font-medium">
                            {new Date(selectedTicket.sla_due_at) < new Date() ? '⚠️ SLA Breached' : 'SLA Due'}
                          </span>
                          <div className="text-gray-400">{new Date(selectedTicket.sla_due_at).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Resolved */}
                    {selectedTicket.resolved_at && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Resolved</span>
                          <div className="text-gray-400">{new Date(selectedTicket.resolved_at).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Closed */}
                    {selectedTicket.closed_at && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Closed</span>
                          <div className="text-gray-400">{new Date(selectedTicket.closed_at).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Conversation */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Conversation
                  </h4>
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`p-3 rounded-lg ${
                        msg.is_internal 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : msg.sender === 'member'
                            ? 'bg-gray-100'
                            : msg.type === 'outbound'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium flex items-center gap-1">
                          {msg.sender === 'member' ? msg.sender_name || 'Member' : 'Concierge®'}
                          {msg.is_internal && <Badge className="ml-2 text-xs bg-yellow-200">Internal Note</Badge>}
                          {msg.channel && msg.channel !== 'internal' && (
                            <Badge className="ml-1 text-xs bg-gray-200">
                              {msg.channel === 'email' ? '📧' : msg.channel === 'whatsapp' ? '📱' : '💬'} {msg.channel}
                            </Badge>
                          )}
                          {msg.type === 'inbound' && <Badge className="ml-1 text-xs bg-blue-200">Inbound</Badge>}
                          {msg.type === 'outbound' && <Badge className="ml-1 text-xs bg-green-200">Sent</Badge>}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {msg.attachments.map((att, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Paperclip className="w-3 h-3 mr-1" /> {att}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box with AI Assistant */}
              <div className="border-t bg-gradient-to-r from-gray-50 to-purple-50/30">
                {/* AI Assistant Panel */}
                {showAiPanel && aiDraft && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-800">AI Draft ({aiTone})</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-3 border border-purple-200 text-sm max-h-32 overflow-y-auto">
                        {aiDraft.draft}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => useAiDraft(aiDraft.draft)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Use This Draft
                        </Button>
                        {aiDraft.quick_draft && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => useAiDraft(aiDraft.quick_draft)}
                          >
                            Use Quick Version
                          </Button>
                        )}
                        <div className="flex-1" />
                        <Button size="sm" variant="ghost" className="text-green-600">
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3">
                  {/* Reply Type Selector with AI Button */}
                  <div className="flex items-center gap-3 mb-3 p-2 bg-white/80 rounded-lg border">
                    <span className="text-sm font-medium text-gray-700">Reply:</span>
                    <div className="flex gap-2 flex-1">
                      <Button 
                        size="sm" 
                        variant={isInternalNote ? 'default' : 'outline'}
                        onClick={() => {
                          setIsInternalNote(true);
                          setSendChannel('internal');
                        }}
                        className={`h-8 px-3 text-xs ${isInternalNote ? 'bg-gray-600' : ''}`}
                      >
                        💬 Internal
                      </Button>
                      <Button 
                        size="sm" 
                        variant={!isInternalNote && sendChannel === 'email' ? 'default' : 'outline'}
                        onClick={() => {
                          setIsInternalNote(false);
                          setSendChannel('email');
                        }}
                        className={`h-8 px-3 text-xs ${!isInternalNote && sendChannel === 'email' ? 'bg-blue-600' : ''}`}
                        disabled={!(selectedTicket?.member?.email || selectedTicket?.customer_email)}
                      >
                        <Mail className="w-3 h-3 mr-1" /> Email
                      </Button>
                      <Button 
                        size="sm" 
                        variant={!isInternalNote && sendChannel === 'whatsapp' ? 'default' : 'outline'}
                        onClick={() => {
                          setIsInternalNote(false);
                          setSendChannel('whatsapp');
                        }}
                        className={`h-8 px-3 text-xs ${!isInternalNote && sendChannel === 'whatsapp' ? 'bg-green-600' : ''}`}
                        disabled={!(selectedTicket?.member?.phone || selectedTicket?.member?.whatsapp || selectedTicket?.customer_phone)}
                      >
                        📱 WhatsApp
                      </Button>
                    </div>
                    
                    {/* AI Draft Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8 px-3"
                          disabled={aiLoading}
                        >
                          {aiLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" /> AI Draft
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setAiTone('professional'); generateAiDraft('professional'); }}>
                          <Wand2 className="w-4 h-4 mr-2 text-blue-600" /> Professional
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAiTone('friendly'); generateAiDraft('friendly'); }}>
                          <span className="mr-2">😊</span> Friendly & Warm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAiTone('empathetic'); generateAiDraft('empathetic'); }}>
                          <span className="mr-2">💝</span> Empathetic
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAiTone('quick'); generateAiDraft('quick'); }}>
                          <Zap className="w-4 h-4 mr-2 text-amber-500" /> Quick Response
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={getAiSummary}>
                          <Brain className="w-4 h-4 mr-2 text-purple-600" /> Summarize Ticket
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={getAiActions}>
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" /> Suggest Actions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* AI Summary Display */}
                  {aiSummary && (
                    <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-800">AI Summary</span>
                        <Button variant="ghost" size="sm" className="ml-auto h-5 w-5 p-0" onClick={() => setAiSummary(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-purple-700">{aiSummary}</p>
                    </div>
                  )}

                  {/* AI Suggested Actions */}
                  {aiActions.length > 0 && (
                    <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800">Suggested Actions</span>
                        <Button variant="ghost" size="sm" className="ml-auto h-5 w-5 p-0" onClick={() => setAiActions([])}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {(Array.isArray(aiActions) ? aiActions : [aiActions]).slice(0, 4).map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-amber-500">•</span> {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Channel indicator banner */}
                  {!isInternalNote && sendChannel !== 'internal' && (
                    <div className={`mb-2 p-2 rounded text-xs ${sendChannel === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {sendChannel === 'email' ? (
                        <>📧 Sending email to: <strong>{selectedTicket?.member?.email || selectedTicket?.customer_email}</strong></>
                      ) : (
                        <>📱 Sending WhatsApp to: <strong>{selectedTicket?.member?.phone || selectedTicket?.member?.whatsapp || selectedTicket?.customer_phone}</strong></>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNote 
                          ? "Add internal note (only visible to team)..." 
                          : sendChannel === 'email'
                            ? "Type your email reply... or use AI Draft ✨"
                            : sendChannel === 'whatsapp'
                              ? "Type your WhatsApp message..."
                              : "Type your reply..."
                      }
                      className="resize-none bg-white"
                      rows={2}
                    />
                    <div className="flex flex-col gap-1">
                      <Button 
                        onClick={handleReply} 
                        disabled={sendingReply || !replyText.trim()} 
                        className={`flex-1 ${!isInternalNote && sendChannel === 'email' ? 'bg-blue-600 hover:bg-blue-700' : !isInternalNote && sendChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Inbox className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewTicketForm />
      <SettingsModal />
      
      {/* Category Manager Modal */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories & Sub-categories</DialogTitle>
          </DialogHeader>
          <CategoryManager 
            categories={categories} 
            setCategories={setCategories}
            authHeaders={authHeaders}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Category Manager Component
const CategoryManager = ({ categories, setCategories, authHeaders }) => {
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', description: '' });
  const [newSubCategory, setNewSubCategory] = useState({ parentId: '', name: '' });
  const [subCategories, setSubCategories] = useState({});
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setSaving(true);
    try {
      const id = newCategory.name.toLowerCase().replace(/\s+/g, '_');
      const categoryData = {
        id,
        name: newCategory.name,
        icon: newCategory.icon || '📁',
        description: newCategory.description || '',
        isCustom: true
      };
      
      // Save to backend
      await fetch(`${API_URL}/api/tickets/categories/custom`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      
      setCategories([...categories, categoryData]);
      setNewCategory({ name: '', icon: '📁', description: '' });
    } catch (err) {
      console.error('Error adding category:', err);
    }
    setSaving(false);
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.parentId || !newSubCategory.name.trim()) return;
    
    setSaving(true);
    try {
      const subCatData = {
        parentId: newSubCategory.parentId,
        name: newSubCategory.name,
        id: newSubCategory.name.toLowerCase().replace(/\s+/g, '_')
      };
      
      // Save to backend
      await fetch(`${API_URL}/api/tickets/categories/sub`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(subCatData)
      });
      
      setSubCategories({
        ...subCategories,
        [newSubCategory.parentId]: [
          ...(subCategories[newSubCategory.parentId] || []),
          subCatData
        ]
      });
      setNewSubCategory({ parentId: '', name: '' });
    } catch (err) {
      console.error('Error adding sub-category:', err);
    }
    setSaving(false);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Delete this category?')) return;
    
    try {
      await fetch(`${API_URL}/api/tickets/categories/custom/${categoryId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Categories */}
      <div>
        <h4 className="text-sm font-medium mb-3">Current Categories (Pillars)</h4>
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <span>{cat.icon} {cat.name}</span>
              {cat.isCustom && (
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add New Category */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Add New Category</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Icon (emoji)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
            className="w-16"
          />
          <Input
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Description (optional)"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            className="flex-1"
          />
          <Button onClick={handleAddCategory} disabled={saving || !newCategory.name.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add Sub-category */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Add Sub-category</h4>
        <div className="flex gap-2">
          <Select 
            value={newSubCategory.parentId} 
            onValueChange={(v) => setNewSubCategory({ ...newSubCategory, parentId: v })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Sub-category name"
            value={newSubCategory.name}
            onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
            className="flex-1"
          />
          <Button onClick={handleAddSubCategory} disabled={saving || !newSubCategory.name.trim() || !newSubCategory.parentId}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDesk;
