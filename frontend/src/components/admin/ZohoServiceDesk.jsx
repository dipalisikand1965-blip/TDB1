import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { API_URL, getApiUrl } from '../../utils/api';
import {
  Search, Plus, RefreshCw, X, Send, Clock, User, Phone, Mail,
  Calendar, AlertCircle, CheckCircle, Loader2, MessageSquare,
  ChevronRight, ChevronDown, MoreVertical, Edit, Trash2, Star, Zap,
  Inbox, PawPrint, Sparkles, Wand2, Settings, HelpCircle, Bell,
  LayoutDashboard, Users, Building2, PhoneCall, Activity, BarChart3,
  BookOpen, Heart, Grid3X3, List, Table2, ExternalLink, Archive, Filter,
  ArrowUp, ArrowDown, Paperclip, Image, FileText, MoreHorizontal
} from 'lucide-react';

// Category config with icons
const CATEGORIES = {
  dine: { icon: '🍽️', color: 'bg-orange-500', name: 'Dine' },
  stay: { icon: '🏨', color: 'bg-blue-500', name: 'Stay' },
  travel: { icon: '✈️', color: 'bg-cyan-500', name: 'Travel' },
  care: { icon: '💊', color: 'bg-red-500', name: 'Care' },
  celebrate: { icon: '🎂', color: 'bg-pink-500', name: 'Celebrate' },
  enjoy: { icon: '🎾', color: 'bg-violet-500', name: 'Enjoy' },
  fit: { icon: '🏃', color: 'bg-green-500', name: 'Fit' },
  emergency: { icon: '🚨', color: 'bg-red-600', name: 'Emergency' },
  shop: { icon: '🛒', color: 'bg-amber-500', name: 'Shop' },
  inquiry: { icon: '📋', color: 'bg-gray-500', name: 'Inquiry' }
};

const STATUS_CONFIG = {
  new: { label: 'Open', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-100' },
  waiting_on_member: { label: 'Waiting', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-100' },
  on_hold: { label: 'On Hold', color: 'bg-slate-500', textColor: 'text-slate-700', bgLight: 'bg-slate-100' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-100' },
  closed: { label: 'Closed', color: 'bg-gray-400', textColor: 'text-gray-600', bgLight: 'bg-gray-100' }
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-500', dot: 'bg-red-500' },
  high: { label: 'High', color: 'bg-orange-500', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'bg-amber-400', dot: 'bg-amber-400' },
  low: { label: 'Low', color: 'bg-green-400', dot: 'bg-green-400' }
};

const CHANNELS = {
  email: { icon: Mail, label: 'Email' },
  chat: { icon: MessageSquare, label: 'Chat' },
  phone: { icon: PhoneCall, label: 'Phone' },
  web: { icon: ExternalLink, label: 'Web Form' },
  api: { icon: Zap, label: 'API' }
};

const ZohoServiceDesk = ({ authHeaders }) => {
  // Navigation state
  const [activeNav, setActiveNav] = useState('tickets');
  const [ticketsExpanded, setTicketsExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // View state
  const [viewMode, setViewMode] = useState('list'); // list, grid, table
  const [selectedView, setSelectedView] = useState('all'); // all, open, in_progress, on_hold, resolved, my_tickets
  
  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0, open: 0, in_progress: 0, on_hold: 0, resolved: 0, overdue: 0, my_tickets: 0
  });
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Detail tabs
  const [detailTab, setDetailTab] = useState('conversation');
  
  // Refs
  const conversationEndRef = useRef(null);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedView !== 'all' && selectedView !== 'my_tickets') {
        params.append('status', selectedView === 'open' ? 'new' : selectedView);
      }
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await fetch(`${getApiUrl()}/api/tickets/?${params}`, { headers: authHeaders });
      const data = await res.json();
      
      let ticketList = data.tickets || [];
      
      // Client-side filtering
      if (priorityFilter !== 'all') {
        ticketList = ticketList.filter(t => t.urgency === priorityFilter || t.priority === priorityFilter);
      }
      if (categoryFilter !== 'all') {
        ticketList = ticketList.filter(t => t.category === categoryFilter);
      }
      
      // Sorting
      ticketList.sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.created_at) - new Date(a.created_at);
          case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
          case 'priority': {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.urgency] || 4) - (order[b.urgency] || 4);
          }
          default: return 0;
        }
      });
      
      setTickets(ticketList);
      
      // Calculate stats
      const allTickets = data.tickets || [];
      setStats({
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'new').length,
        in_progress: allTickets.filter(t => t.status === 'in_progress').length,
        on_hold: allTickets.filter(t => t.status === 'on_hold' || t.status === 'waiting_on_member').length,
        resolved: allTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        overdue: allTickets.filter(t => t.is_overdue).length,
        my_tickets: allTickets.filter(t => t.assigned_to === 'current_user').length
      });
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [authHeaders, selectedView, searchQuery, priorityFilter, categoryFilter, sortBy]);

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, { headers: authHeaders });
      const data = await res.json();
      setSelectedTicket(data.ticket || data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchTickets();
      setLoading(false);
    };
    load();
  }, [fetchTickets]);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    if (selectedTicket) {
      await fetchTicketDetails(selectedTicket.ticket_id);
    }
    setRefreshing(false);
  };

  // Handle ticket selection
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.ticket_id);
  };

  // Handle reply
  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    setSending(true);
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, is_internal: isInternal })
      });
      setReplyText('');
      await fetchTicketDetails(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Error:', err);
    }
    setSending(false);
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
      console.error('Error:', err);
    }
  };

  // Format time
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    const config = CHANNELS[channel] || CHANNELS.web;
    const Icon = config.icon;
    return <Icon className="w-3.5 h-3.5 text-gray-400" />;
  };

  // ==================== RENDER ====================

  return (
    <div className="flex h-screen bg-gray-100" data-testid="zoho-service-desk">
      
      {/* LEFT SIDEBAR */}
      <div className={`bg-slate-800 text-white transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-bold text-sm">Doggy Co</div>
                <div className="text-xs text-slate-400">Service Desk</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              activeNav === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
          </button>
          
          {/* Tickets */}
          <div className="mb-1">
            <button
              onClick={() => { setActiveNav('tickets'); setTicketsExpanded(!ticketsExpanded); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'tickets' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Tickets</span>}
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white text-xs px-1.5 h-5">{stats.total}</Badge>
                  <ChevronDown className={`w-4 h-4 transition-transform ${ticketsExpanded ? '' : '-rotate-90'}`} />
                </div>
              )}
            </button>
            
            {/* Tickets submenu */}
            {ticketsExpanded && activeNav === 'tickets' && !sidebarCollapsed && (
              <div className="ml-4 mt-1 space-y-0.5">
                {[
                  { id: 'all', label: 'All Tickets', count: stats.total },
                  { id: 'open', label: 'Open', count: stats.open },
                  { id: 'in_progress', label: 'In Progress', count: stats.in_progress },
                  { id: 'on_hold', label: 'On Hold', count: stats.on_hold },
                  { id: 'resolved', label: 'Resolved', count: stats.resolved },
                  { id: 'my_tickets', label: 'My Tickets', count: stats.my_tickets, icon: Star }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedView === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </div>
                    <span className="text-xs opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Other nav items */}
          {[
            { id: 'contacts', label: 'Contacts', icon: Users },
            { id: 'accounts', label: 'Accounts', icon: Building2 },
            { id: 'calls', label: 'Calls', icon: PhoneCall, badge: 3 },
            { id: 'activities', label: 'Activities', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
            { id: 'community', label: 'Community', icon: Heart }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeNav === item.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 h-5">{item.badge}</Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        
        {/* Bottom */}
        <div className="p-2 border-t border-slate-700">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-700/50">
            <HelpCircle className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Help & Support</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-700/50">
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Settings</span>}
          </button>
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets, contacts, or anything..."
                className="w-80 pl-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button className="bg-red-500 hover:bg-red-600 gap-2">
              <Plus className="w-4 h-4" /> Create
            </Button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Grid3X3 className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                AD
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Admin</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </div>
        </header>
        
        {/* CONTENT AREA */}
        <div className="flex-1 flex min-h-0">
          {activeNav === 'tickets' ? (
            <>
              {/* FILTERS SIDEBAR */}
              <div className="w-56 bg-white border-r p-4 flex-shrink-0 overflow-y-auto">
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Views</div>
                  <div className="space-y-1">
                    {[
                      { id: 'all', label: 'All Tickets', count: stats.total },
                      { id: 'open', label: 'Open', count: stats.open },
                      { id: 'in_progress', label: 'In Progress', count: stats.in_progress },
                      { id: 'on_hold', label: 'On Hold', count: stats.on_hold },
                      { id: 'resolved', label: 'Resolved', count: stats.resolved }
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedView(v.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                          selectedView === v.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{v.label}</span>
                        <span className={`text-xs ${selectedView === v.id ? 'text-emerald-600' : 'text-gray-400'}`}>{v.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filters</div>
                  
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2"
                    >
                      <option value="all">All Priorities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2"
                    >
                      <option value="all">All Categories</option>
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* TICKET LIST */}
              <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
                {/* List Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search in tickets..."
                      className="pl-9 h-9 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="ml-2">Refresh</span>
                    </Button>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-sm border rounded-lg px-3 py-1.5"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="priority">By Priority</option>
                    </select>
                    
                    <div className="flex border rounded-lg">
                      {[
                        { id: 'list', icon: List },
                        { id: 'grid', icon: Grid3X3 },
                        { id: 'table', icon: Table2 }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setViewMode(v.id)}
                          className={`p-2 ${viewMode === v.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                          <v.icon className="w-4 h-4 text-gray-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Ticket Items */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <Inbox className="w-12 h-12 mb-2 opacity-50" />
                      <p>No tickets found</p>
                    </div>
                  ) : (
                    tickets.map(ticket => {
                      const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new;
                      const priority = PRIORITY_CONFIG[ticket.urgency] || PRIORITY_CONFIG.medium;
                      const category = CATEGORIES[ticket.category] || CATEGORIES.inquiry;
                      const isOverdue = ticket.is_overdue;
                      
                      return (
                        <div
                          key={ticket.ticket_id}
                          onClick={() => handleSelectTicket(ticket)}
                          className={`px-4 py-3 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedTicket?.ticket_id === ticket.ticket_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <input type="checkbox" className="mt-1 rounded" onClick={(e) => e.stopPropagation()} />
                            
                            {/* Priority dot */}
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${priority.dot}`} />
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400 font-mono">{ticket.ticket_id}</span>
                                <Badge className={`text-xs px-2 py-0.5 ${status.bgLight} ${status.textColor} border-0`}>
                                  {status.label}
                                </Badge>
                                {isOverdue && (
                                  <Badge className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border-0">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              
                              <h4 className="font-medium text-gray-900 mb-1 truncate">
                                {ticket.subject || ticket.description?.slice(0, 60) || 'No subject'}
                              </h4>
                              
                              <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                                {ticket.description || 'No description'}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                {getChannelIcon(ticket.channel || 'web')}
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {ticket.member?.name || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(ticket.created_at)}
                                </span>
                                {ticket.messages?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {ticket.messages.length} replies
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Assignee avatar */}
                            <div className="flex items-center gap-2">
                              {ticket.assigned_to ? (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                                  {ticket.assigned_to.slice(0, 2).toUpperCase()}
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                              <button className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* TICKET DETAIL PANEL */}
              {selectedTicket && (
                <div className="w-[450px] flex-shrink-0 flex flex-col bg-white border-l">
                  {/* Detail Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">{selectedTicket.ticket_id}</span>
                      <Badge className={`${STATUS_CONFIG[selectedTicket.status]?.bgLight} ${STATUS_CONFIG[selectedTicket.status]?.textColor}`}>
                        {STATUS_CONFIG[selectedTicket.status]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <Star className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-1.5 hover:bg-gray-100 rounded ml-2"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b px-4 flex-shrink-0">
                    {['conversation', 'details', 'activity'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`px-4 py-3 text-sm capitalize border-b-2 transition-colors ${
                          detailTab === tab
                            ? 'border-emerald-500 text-emerald-600 font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {detailTab === 'conversation' && (
                      <div className="p-4">
                        {/* Ticket Title */}
                        <h3 className="font-semibold text-gray-900 mb-4">
                          {selectedTicket.subject || selectedTicket.description?.slice(0, 60)}
                        </h3>
                        
                        {/* Messages */}
                        <div className="space-y-4">
                          {/* Initial message */}
                          {selectedTicket.description && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {(selectedTicket.member?.name || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-3">
                                  <p className="text-sm text-gray-800">{selectedTicket.description}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                  <span>{selectedTicket.member?.name || 'Customer'}</span>
                                  <span>•</span>
                                  <span>{formatTime(selectedTicket.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Conversation messages */}
                          {selectedTicket.messages?.map((msg, idx) => {
                            const isAgent = msg.direction === 'outgoing' || msg.is_agent_reply;
                            return (
                              <div key={idx} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isAgent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {(msg.sender_name || (isAgent ? 'AD' : 'CU')).slice(0, 2).toUpperCase()}
                                </div>
                                <div className={`flex-1 ${isAgent ? 'text-right' : ''}`}>
                                  <div className={`inline-block rounded-lg p-3 max-w-[85%] ${
                                    msg.is_internal
                                      ? 'bg-amber-50 border border-amber-200'
                                      : isAgent
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100'
                                  } ${isAgent ? 'text-left' : ''}`}>
                                    {msg.is_internal && (
                                      <div className="text-xs text-amber-600 mb-1 font-medium">Internal Note</div>
                                    )}
                                    <p className={`text-sm ${isAgent && !msg.is_internal ? 'text-white' : 'text-gray-800'}`}>
                                      {msg.content || msg.message}
                                    </p>
                                  </div>
                                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isAgent ? 'justify-end' : ''}`}>
                                    <span>{msg.sender_name || (isAgent ? 'Agent' : 'Customer')}</span>
                                    <span>•</span>
                                    <span>{formatTime(msg.timestamp || msg.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={conversationEndRef} />
                        </div>
                      </div>
                    )}
                    
                    {detailTab === 'details' && (
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Priority</label>
                          <div className="mt-1 flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${PRIORITY_CONFIG[selectedTicket.urgency]?.dot || 'bg-gray-300'}`} />
                            <span className="text-sm capitalize">{selectedTicket.urgency || 'Medium'}</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Category</label>
                          <div className="mt-1 flex items-center gap-2">
                            <span>{CATEGORIES[selectedTicket.category]?.icon || '📋'}</span>
                            <span className="text-sm">{CATEGORIES[selectedTicket.category]?.name || selectedTicket.category}</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Customer</label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{selectedTicket.member?.name || 'Unknown'}</span>
                            </div>
                            {selectedTicket.member?.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{selectedTicket.member.email}</span>
                              </div>
                            )}
                            {selectedTicket.member?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{selectedTicket.member.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <label className="text-xs text-gray-500 uppercase tracking-wider">Assigned To</label>
                          <div className="mt-2">
                            <span className="text-sm">{selectedTicket.assigned_to || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {detailTab === 'activity' && (
                      <div className="p-4">
                        <div className="space-y-4">
                          {selectedTicket.timeline?.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                              <div>
                                <p className="text-sm text-gray-800">{event.action}</p>
                                <p className="text-xs text-gray-400">{formatTime(event.timestamp)}</p>
                              </div>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-400">No activity recorded</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Reply Composer */}
                  {detailTab === 'conversation' && (
                    <div className="border-t p-4 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-amber-600">Internal Note</span>
                        </label>
                      </div>
                      <Textarea
                        placeholder={isInternal ? "Add internal note..." : "Type your reply..."}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={`mb-2 ${isInternal ? 'bg-amber-50 border-amber-200' : ''}`}
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <Image className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <Button
                          onClick={handleReply}
                          disabled={!replyText.trim() || sending}
                          className={isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {isInternal ? 'Add Note' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Dashboard view */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Open Tickets', value: stats.open, change: '+12%', color: 'text-blue-600' },
                  { label: 'In Progress', value: stats.in_progress, change: '-5%', color: 'text-amber-600' },
                  { label: 'Resolved Today', value: stats.resolved, change: '+23%', color: 'text-emerald-600' },
                  { label: 'Overdue', value: stats.overdue, change: '-15%', color: 'text-red-600' }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                      <span className={`text-sm ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="text-center text-gray-400 py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Analytics dashboard coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZohoServiceDesk;
