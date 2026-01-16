import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { API_URL } from '../../utils/api';
import {
  Search, Plus, RefreshCw, Filter, X, Send, Clock, User, Phone, Mail,
  MapPin, Calendar, AlertCircle, CheckCircle, Loader2, MessageSquare,
  ChevronRight, Settings, BarChart3, Users, Tag, Paperclip, ExternalLink,
  Inbox, ArrowUp, ArrowDown, MoreVertical, Edit, Trash2, Eye, Star
} from 'lucide-react';

// Category icons mapping
const CATEGORY_ICONS = {
  celebrate: '🎂', dine: '🍽️', travel: '✈️', stay: '🏨', enjoy: '🎉',
  club: '👑', care: '💊', shop: '🛒', work: '💼', fit: '🏃',
  exclusive: '⭐', emergency: '🚨', advisory: '📋', paperwork: '📄', referrals: '🤝'
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
  
  // SLA & Auto-assignment
  const [slaStats, setSlaStats] = useState(null);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

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

  // Settings Modal
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
            <TabsList className="w-full">
              <TabsTrigger value="email" className="flex-1">
                <Mail className="w-4 h-4 mr-2" /> Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
              </TabsTrigger>
            </TabsList>

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
        <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Tickets ({tickets.length})</span>
            <Button variant="ghost" size="sm" onClick={() => { fetchTickets(); fetchStats(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tickets found</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''
                  }`}
                  onClick={() => fetchTicketDetails(ticket.ticket_id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-mono text-gray-500">{ticket.ticket_id}</span>
                    <Badge className={`text-xs ${URGENCY_COLORS[ticket.urgency]}`}>
                      {ticket.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{CATEGORY_ICONS[ticket.category]}</span>
                    <span className="font-medium text-sm truncate">{ticket.member?.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge className={`text-xs ${STATUS_COLORS[ticket.status]}`}>
                      {ticket.status?.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
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
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[selectedTicket.category]}</span>
                    <span className="font-mono text-sm text-gray-500">{selectedTicket.ticket_id}</span>
                    <Badge className={STATUS_COLORS[selectedTicket.status]}>
                      {selectedTicket.status?.replace('_', ' ')}
                    </Badge>
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
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Assignment
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
                            : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {msg.sender === 'member' ? msg.sender_name || 'Member' : 'Concierge'}
                          {msg.is_internal && <Badge className="ml-2 text-xs bg-yellow-200">Internal Note</Badge>}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    Internal Note
                  </label>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isInternalNote ? "Add internal note..." : "Type your reply..."}
                    className="resize-none"
                    rows={2}
                  />
                  <Button onClick={handleReply} disabled={sendingReply || !replyText.trim()}>
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
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
