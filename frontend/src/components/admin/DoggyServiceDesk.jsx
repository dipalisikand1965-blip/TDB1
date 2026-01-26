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
  ArrowUp, ArrowDown, Paperclip, Image, FileText, MoreHorizontal,
  ShoppingBag, Utensils, Hotel, Plane, Stethoscope, PartyPopper,
  Dumbbell, GraduationCap, Shield, MapPin, Package, CreditCard,
  MessageCircle, History, Brain, Target, AlertTriangle, Cake,
  Dog, Cat, Scissors, Car, Home, Siren
} from 'lucide-react';

// ==================== PILLAR CONFIGURATION ====================
const PILLARS = {
  dine: { 
    icon: Utensils, emoji: '🍽️', color: 'bg-orange-500', name: 'Dine',
    sources: ['reservation', 'meal_order', 'dine_inquiry']
  },
  stay: { 
    icon: Hotel, emoji: '🏨', color: 'bg-blue-500', name: 'Stay',
    sources: ['booking', 'stay_inquiry', 'boarding']
  },
  travel: { 
    icon: Plane, emoji: '✈️', color: 'bg-cyan-500', name: 'Travel',
    sources: ['travel_request', 'cab_booking', 'relocation']
  },
  care: { 
    icon: Stethoscope, emoji: '💊', color: 'bg-red-500', name: 'Care',
    sources: ['care_request', 'grooming', 'vet_coordination']
  },
  celebrate: { 
    icon: PartyPopper, emoji: '🎂', color: 'bg-pink-500', name: 'Celebrate',
    sources: ['party_booking', 'cake_order', 'photoshoot']
  },
  enjoy: { 
    icon: Target, emoji: '🎾', color: 'bg-violet-500', name: 'Enjoy',
    sources: ['activity_booking', 'playdate', 'event_registration']
  },
  fit: { 
    icon: Dumbbell, emoji: '🏃', color: 'bg-green-500', name: 'Fit',
    sources: ['fitness_program', 'assessment_booking']
  },
  shop: { 
    icon: ShoppingBag, emoji: '🛒', color: 'bg-amber-500', name: 'Shop',
    sources: ['order', 'product_inquiry', 'return_request']
  },
  emergency: { 
    icon: Siren, emoji: '🚨', color: 'bg-red-600', name: 'Emergency',
    sources: ['emergency_request', 'urgent_care']
  },
  advisory: { 
    icon: BookOpen, emoji: '📋', color: 'bg-slate-500', name: 'Advisory',
    sources: ['consultation', 'advice_request']
  },
  insure: { 
    icon: Shield, emoji: '🛡️', color: 'bg-indigo-500', name: 'Insure',
    sources: ['insurance_inquiry', 'claim']
  },
  community: { 
    icon: Heart, emoji: '🤝', color: 'bg-rose-500', name: 'Community',
    sources: ['community_post', 'report']
  }
};

// ==================== STATUS & PRIORITY CONFIG ====================
const STATUS_CONFIG = {
  new: { label: 'Open', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' },
  open: { label: 'Open', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-100' },
  waiting_on_member: { label: 'Awaiting Reply', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-100' },
  on_hold: { label: 'On Hold', color: 'bg-slate-500', textColor: 'text-slate-700', bgLight: 'bg-slate-100' },
  escalated: { label: 'Escalated', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-100' },
  closed: { label: 'Closed', color: 'bg-gray-400', textColor: 'text-gray-600', bgLight: 'bg-gray-100' },
  pending: { label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-100' }
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-500', dot: 'bg-red-500', ring: 'ring-red-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500', dot: 'bg-red-500', ring: 'ring-red-500' },
  high: { label: 'High', color: 'bg-orange-500', dot: 'bg-orange-500', ring: 'ring-orange-500' },
  medium: { label: 'Medium', color: 'bg-amber-400', dot: 'bg-amber-400', ring: 'ring-amber-400' },
  normal: { label: 'Normal', color: 'bg-blue-400', dot: 'bg-blue-400', ring: 'ring-blue-400' },
  low: { label: 'Low', color: 'bg-green-400', dot: 'bg-green-400', ring: 'ring-green-400' }
};

// ==================== CHANNEL CONFIG ====================
const CHANNELS = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-500' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' },
  web: { icon: ExternalLink, label: 'Website', color: 'text-purple-500' },
  phone: { icon: PhoneCall, label: 'Phone', color: 'text-orange-500' },
  mira: { icon: Brain, label: 'Mira AI', color: 'text-pink-500' },
  order: { icon: ShoppingBag, label: 'Order', color: 'text-amber-500' },
  reservation: { icon: Calendar, label: 'Reservation', color: 'text-cyan-500' },
  booking: { icon: Hotel, label: 'Booking', color: 'text-indigo-500' },
  api: { icon: Zap, label: 'API', color: 'text-gray-500' }
};

// ==================== TICKET TYPE CONFIG ====================
const TICKET_TYPES = {
  // Orders & Transactions
  order: { label: 'Order', icon: Package, pillar: 'shop' },
  return_request: { label: 'Return Request', icon: Archive, pillar: 'shop' },
  
  // Reservations & Bookings
  reservation: { label: 'Dine Reservation', icon: Utensils, pillar: 'dine' },
  stay_booking: { label: 'Stay Booking', icon: Hotel, pillar: 'stay' },
  boarding: { label: 'Boarding Request', icon: Home, pillar: 'stay' },
  
  // Service Requests
  care_request: { label: 'Care Request', icon: Stethoscope, pillar: 'care' },
  grooming: { label: 'Grooming', icon: Scissors, pillar: 'care' },
  travel_request: { label: 'Travel Request', icon: Car, pillar: 'travel' },
  
  // Events & Celebrations
  party_booking: { label: 'Party Booking', icon: Cake, pillar: 'celebrate' },
  
  // General
  inquiry: { label: 'Inquiry', icon: MessageSquare, pillar: 'general' },
  feedback: { label: 'Feedback', icon: Star, pillar: 'general' },
  complaint: { label: 'Complaint', icon: AlertTriangle, pillar: 'general' },
  emergency: { label: 'Emergency', icon: Siren, pillar: 'emergency' }
};

// ==================== MAIN COMPONENT ====================
const DoggyServiceDesk = ({ authHeaders }) => {
  // Navigation
  const [activeNav, setActiveNav] = useState('tickets');
  const [ticketsExpanded, setTicketsExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // View state
  const [viewMode, setViewMode] = useState('list');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedPillar, setSelectedPillar] = useState('all');
  
  // Data
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pet & Member context
  const [petProfile, setPetProfile] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingContext, setLoadingContext] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0, open: 0, in_progress: 0, on_hold: 0, resolved: 0,
    overdue: 0, my_tickets: 0, unassigned: 0,
    by_pillar: {}, by_channel: {}, by_priority: {}
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  // Reply
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  
  // Detail panel
  const [detailTab, setDetailTab] = useState('conversation');
  const [contextTab, setContextTab] = useState('pet');
  
  const conversationEndRef = useRef(null);

  // ==================== DATA FETCHING ====================
  
  // Fetch all tickets from multiple sources
  const fetchAllTickets = useCallback(async () => {
    try {
      // Fetch from main tickets endpoint
      const ticketsRes = await fetch(`${getApiUrl()}/api/tickets/`, { headers: authHeaders });
      const ticketsData = await ticketsRes.json();
      let allTicketsList = ticketsData.tickets || [];
      
      // Also fetch from channel_intakes (WhatsApp, Email, etc.)
      try {
        const intakesRes = await fetch(`${getApiUrl()}/api/admin/channel-intakes`, { headers: authHeaders });
        if (intakesRes.ok) {
          const intakesData = await intakesRes.json();
          const intakeTickets = (intakesData.intakes || []).map(intake => ({
            ticket_id: intake.id || `INTAKE-${intake._id}`,
            subject: intake.message?.slice(0, 100) || 'New Message',
            description: intake.message,
            status: intake.status || 'new',
            urgency: intake.priority || 'medium',
            category: intake.pillar || 'inquiry',
            channel: intake.channel || 'whatsapp',
            source: 'channel_intake',
            member: {
              name: intake.customer_name,
              email: intake.customer_email,
              phone: intake.customer_phone
            },
            pet_info: intake.pet_info,
            created_at: intake.created_at,
            messages: []
          }));
          allTicketsList = [...allTicketsList, ...intakeTickets];
        }
      } catch (e) { console.log('Channel intakes not available'); }
      
      // Fetch reservations as tickets
      try {
        const resRes = await fetch(`${getApiUrl()}/api/admin/dine/reservations`, { headers: authHeaders });
        if (resRes.ok) {
          const resData = await resRes.json();
          const resTickets = (resData.reservations || []).map(r => ({
            ticket_id: r.id,
            subject: `Reservation at ${r.restaurant_name}`,
            description: `${r.name} - ${r.guests} guests, ${r.pets_count || 1} pet(s) on ${r.date} at ${r.time}`,
            status: r.status,
            urgency: 'medium',
            category: 'dine',
            channel: 'reservation',
            source: 'reservation',
            member: { name: r.name, email: r.email, phone: r.phone },
            pet_names: r.pet_names,
            metadata: r,
            created_at: r.created_at,
            messages: []
          }));
          allTicketsList = [...allTicketsList, ...resTickets];
        }
      } catch (e) { console.log('Reservations not available'); }
      
      // Fetch stay bookings as tickets
      try {
        const stayRes = await fetch(`${getApiUrl()}/api/stay/admin/bookings`, { headers: authHeaders });
        if (stayRes.ok) {
          const stayData = await stayRes.json();
          const stayTickets = (stayData.bookings || []).map(b => ({
            ticket_id: b.id,
            subject: `Stay at ${b.property_name}`,
            description: `${b.guest_name} - ${b.check_in_date} to ${b.check_out_date}`,
            status: b.status,
            urgency: 'medium',
            category: 'stay',
            channel: 'booking',
            source: 'stay_booking',
            member: { name: b.guest_name, email: b.guest_email, phone: b.guest_phone },
            pet_names: b.pet_names,
            metadata: b,
            created_at: b.created_at,
            messages: []
          }));
          allTicketsList = [...allTicketsList, ...stayTickets];
        }
      } catch (e) { console.log('Stay bookings not available'); }
      
      // Fetch care requests as tickets
      try {
        const careRes = await fetch(`${getApiUrl()}/api/care/requests`, { headers: authHeaders });
        if (careRes.ok) {
          const careData = await careRes.json();
          const careTickets = (careData.requests || []).map(c => ({
            ticket_id: c.request_id,
            subject: `${c.care_type_name || c.care_type} Request`,
            description: c.details?.description || `Care request for ${c.pet?.name}`,
            status: c.status,
            urgency: c.priority || 'medium',
            category: 'care',
            channel: 'web',
            source: 'care_request',
            member: { name: c.customer?.name, email: c.customer?.email, phone: c.customer?.phone },
            pet_info: c.pet,
            metadata: c,
            created_at: c.created_at,
            messages: []
          }));
          allTicketsList = [...allTicketsList, ...careTickets];
        }
      } catch (e) { console.log('Care requests not available'); }
      
      // Fetch travel requests as tickets
      try {
        const travelRes = await fetch(`${getApiUrl()}/api/travel/requests`, { headers: authHeaders });
        if (travelRes.ok) {
          const travelData = await travelRes.json();
          const travelTickets = (travelData.requests || []).map(t => ({
            ticket_id: t.request_id,
            subject: `${t.travel_type_name || t.travel_type} - ${t.journey?.pickup_city} to ${t.journey?.drop_city}`,
            description: `Travel on ${t.journey?.travel_date} for ${t.pet?.name}`,
            status: t.status,
            urgency: t.risk_level === 'high' ? 'high' : 'medium',
            category: 'travel',
            channel: 'web',
            source: 'travel_request',
            member: { name: t.customer?.name, email: t.customer?.email, phone: t.customer?.phone },
            pet_info: t.pet,
            metadata: t,
            created_at: t.created_at,
            messages: []
          }));
          allTicketsList = [...allTicketsList, ...travelTickets];
        }
      } catch (e) { console.log('Travel requests not available'); }
      
      // Sort by created_at
      allTicketsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setAllTickets(allTicketsList);
      
      // Calculate stats
      const statsObj = {
        total: allTicketsList.length,
        open: allTicketsList.filter(t => ['new', 'open', 'pending'].includes(t.status)).length,
        in_progress: allTicketsList.filter(t => t.status === 'in_progress').length,
        on_hold: allTicketsList.filter(t => ['on_hold', 'waiting_on_member'].includes(t.status)).length,
        resolved: allTicketsList.filter(t => ['resolved', 'closed', 'confirmed', 'completed'].includes(t.status)).length,
        overdue: allTicketsList.filter(t => t.is_overdue).length,
        unassigned: allTicketsList.filter(t => !t.assigned_to).length,
        my_tickets: 0,
        by_pillar: {},
        by_channel: {},
        by_priority: {}
      };
      
      // Count by pillar
      Object.keys(PILLARS).forEach(p => {
        statsObj.by_pillar[p] = allTicketsList.filter(t => t.category === p).length;
      });
      
      // Count by channel
      Object.keys(CHANNELS).forEach(c => {
        statsObj.by_channel[c] = allTicketsList.filter(t => t.channel === c).length;
      });
      
      setStats(statsObj);
      
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [authHeaders]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allTickets];
    
    // Filter by view
    if (selectedView === 'open') {
      filtered = filtered.filter(t => ['new', 'open', 'pending'].includes(t.status));
    } else if (selectedView === 'in_progress') {
      filtered = filtered.filter(t => t.status === 'in_progress');
    } else if (selectedView === 'on_hold') {
      filtered = filtered.filter(t => ['on_hold', 'waiting_on_member'].includes(t.status));
    } else if (selectedView === 'resolved') {
      filtered = filtered.filter(t => ['resolved', 'closed', 'confirmed', 'completed'].includes(t.status));
    } else if (selectedView === 'unassigned') {
      filtered = filtered.filter(t => !t.assigned_to);
    }
    
    // Filter by pillar
    if (selectedPillar !== 'all') {
      filtered = filtered.filter(t => t.category === selectedPillar);
    }
    
    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.urgency === priorityFilter || t.priority === priorityFilter);
    }
    
    // Filter by channel
    if (channelFilter !== 'all') {
      filtered = filtered.filter(t => t.channel === channelFilter);
    }
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticket_id?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.member?.name?.toLowerCase().includes(q) ||
        t.member?.email?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
        case 'priority': {
          const order = { critical: 0, urgent: 0, high: 1, medium: 2, normal: 3, low: 4 };
          return (order[a.urgency] ?? 5) - (order[b.urgency] ?? 5);
        }
        default: return 0;
      }
    });
    
    setTickets(filtered);
  }, [allTickets, selectedView, selectedPillar, priorityFilter, channelFilter, searchQuery, sortBy]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAllTickets();
      setLoading(false);
    };
    load();
  }, [fetchAllTickets]);

  // Fetch pet & member context when ticket selected
  const fetchContext = async (ticket) => {
    if (!ticket) return;
    setLoadingContext(true);
    setPetProfile(null);
    setMemberProfile(null);
    setOrderHistory([]);
    
    try {
      // Try to fetch pet profile
      if (ticket.pet_info?.id) {
        const petRes = await fetch(`${getApiUrl()}/api/pets/${ticket.pet_info.id}`, { headers: authHeaders });
        if (petRes.ok) {
          const petData = await petRes.json();
          setPetProfile(petData.pet || petData);
        }
      }
      
      // Try to fetch member profile by email
      if (ticket.member?.email) {
        const memberRes = await fetch(`${getApiUrl()}/api/admin/members?email=${ticket.member.email}`, { headers: authHeaders });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          if (memberData.members?.[0]) {
            setMemberProfile(memberData.members[0]);
            
            // Fetch their order history
            try {
              const ordersRes = await fetch(`${getApiUrl()}/api/orders/user/${memberData.members[0].id}`, { headers: authHeaders });
              if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrderHistory(ordersData.orders || []);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error('Error fetching context:', err);
    }
    setLoadingContext(false);
  };

  // Handle ticket selection
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchContext(ticket);
    
    // Fetch full ticket details if it's from the tickets collection
    if (ticket.source !== 'reservation' && ticket.source !== 'stay_booking') {
      try {
        const res = await fetch(`${getApiUrl()}/api/tickets/${ticket.ticket_id}`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setSelectedTicket(prev => ({ ...prev, ...data.ticket, messages: data.ticket?.messages || prev.messages }));
        }
      } catch (e) {}
    }
  };

  // Generate AI reply suggestion
  const generateAiReply = async () => {
    if (!selectedTicket) return;
    setAiLoading(true);
    setAiSuggestion(null);
    
    try {
      const context = {
        ticket: selectedTicket,
        pet: petProfile,
        member: memberProfile
      };
      
      const res = await fetch(`${getApiUrl()}/api/tickets/ai/draft-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          reply_type: 'professional',
          pet_context: petProfile?.soul,
          member_name: memberProfile?.name || selectedTicket.member?.name
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.draft || data.message);
      }
    } catch (err) {
      console.error('AI error:', err);
    }
    setAiLoading(false);
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
      setAiSuggestion(null);
      
      // Refresh ticket
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(prev => ({ ...prev, ...data.ticket }));
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setSending(false);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      // Determine which API to call based on source
      let endpoint = `${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`;
      
      if (selectedTicket.source === 'reservation') {
        endpoint = `${getApiUrl()}/api/admin/dine/reservations/${selectedTicket.ticket_id}`;
      } else if (selectedTicket.source === 'stay_booking') {
        endpoint = `${getApiUrl()}/api/stay/admin/bookings/${selectedTicket.ticket_id}`;
      }
      
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      await fetchAllTickets();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllTickets();
    if (selectedTicket) {
      await handleSelectTicket(selectedTicket);
    }
    setRefreshing(false);
  };

  // Auto-scroll
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Format time
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Get pillar icon component
  const getPillarIcon = (pillar) => {
    const config = PILLARS[pillar];
    if (!config) return <MessageSquare className="w-4 h-4" />;
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  // ==================== RENDER ====================
  return (
    <div className="flex h-screen bg-gray-100" data-testid="doggy-service-desk">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <div className={`bg-slate-800 text-white transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-bold text-sm">The Doggy Company</div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Command Center</div>
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
              activeNav === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </button>
          
          {/* Tickets Section */}
          <div className="mb-1">
            <button
              onClick={() => { setActiveNav('tickets'); setTicketsExpanded(!ticketsExpanded); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'tickets' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">All Tickets</span>}
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white text-xs px-1.5 h-5">{stats.total}</Badge>
                  <ChevronDown className={`w-4 h-4 transition-transform ${ticketsExpanded ? '' : '-rotate-90'}`} />
                </div>
              )}
            </button>
            
            {/* Tickets submenu */}
            {ticketsExpanded && activeNav === 'tickets' && !sidebarCollapsed && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-2">
                {[
                  { id: 'all', label: 'All', count: stats.total, icon: Inbox },
                  { id: 'open', label: 'Open', count: stats.open, icon: AlertCircle },
                  { id: 'in_progress', label: 'In Progress', count: stats.in_progress, icon: Loader2 },
                  { id: 'on_hold', label: 'On Hold', count: stats.on_hold, icon: Clock },
                  { id: 'resolved', label: 'Resolved', count: stats.resolved, icon: CheckCircle },
                  { id: 'unassigned', label: 'Unassigned', count: stats.unassigned, icon: User }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                      selectedView === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <span className="opacity-60">{item.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Pillar Channels - Collapsed into section */}
          {!sidebarCollapsed && (
            <div className="mt-4 mb-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider px-3 mb-2">Pillars</div>
              <div className="grid grid-cols-4 gap-1 px-2">
                {Object.entries(PILLARS).slice(0, 8).map(([key, pillar]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveNav('tickets'); setSelectedPillar(key); }}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      selectedPillar === key ? 'bg-emerald-600' : 'hover:bg-slate-700/50'
                    }`}
                    title={pillar.name}
                  >
                    <span className="text-lg">{pillar.emoji}</span>
                    {stats.by_pillar[key] > 0 && (
                      <div className="text-[9px] text-slate-400">{stats.by_pillar[key]}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Other nav */}
          <div className="mt-4 space-y-1">
            {[
              { id: 'members', label: 'Pet Parents', icon: Users, badge: null },
              { id: 'pets', label: 'Pet Profiles', icon: Dog, badge: null },
              { id: 'orders', label: 'Orders', icon: Package, badge: 12 },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeNav === item.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm flex-1">{item.label}</span>
                    {item.badge && <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>}
                  </>
                )}
              </button>
            ))}
          </div>
        </nav>
        
        {/* Bottom */}
        <div className="p-2 border-t border-slate-700">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 text-sm">
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
      
      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ==================== TOP HEADER ==================== */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <X className="w-5 h-5 text-gray-400" />}
            </button>
            
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets, members, pets..."
                className="w-96 pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow">
                AD
              </div>
            </div>
          </div>
        </header>
        
        {/* ==================== CONTENT AREA ==================== */}
        <div className="flex-1 flex min-h-0">
          
          {activeNav === 'tickets' && (
            <>
              {/* ==================== FILTERS PANEL ==================== */}
              <div className="w-52 bg-white border-r p-3 flex-shrink-0 overflow-y-auto">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Card className="p-2 text-center bg-blue-50 border-blue-100">
                    <div className="text-lg font-bold text-blue-600">{stats.open}</div>
                    <div className="text-[10px] text-blue-500">Open</div>
                  </Card>
                  <Card className="p-2 text-center bg-amber-50 border-amber-100">
                    <div className="text-lg font-bold text-amber-600">{stats.in_progress}</div>
                    <div className="text-[10px] text-amber-500">In Progress</div>
                  </Card>
                </div>
                
                {/* Pillar Filter */}
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">By Pillar</div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setSelectedPillar('all')}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                        selectedPillar === 'all' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>All Pillars</span>
                      <span className="text-gray-400">{stats.total}</span>
                    </button>
                    {Object.entries(PILLARS).filter(([k]) => stats.by_pillar[k] > 0).map(([key, pillar]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedPillar(key)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                          selectedPillar === key ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{pillar.emoji}</span>
                          <span>{pillar.name}</span>
                        </div>
                        <span className="text-gray-400">{stats.by_pillar[key]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Channel Filter */}
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">By Channel</div>
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1.5"
                  >
                    <option value="all">All Channels</option>
                    {Object.entries(CHANNELS).map(([key, ch]) => (
                      <option key={key} value={key}>{ch.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Priority Filter */}
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">By Priority</div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full text-xs border rounded px-2 py-1.5"
                  >
                    <option value="all">All Priorities</option>
                    {Object.entries(PRIORITY_CONFIG).map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* ==================== TICKET LIST ==================== */}
              <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
                {/* List Header */}
                <div className="px-4 py-2 border-b flex items-center justify-between flex-shrink-0 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{tickets.length}</span>
                    <span>tickets</span>
                    {selectedPillar !== 'all' && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        {PILLARS[selectedPillar]?.emoji} {PILLARS[selectedPillar]?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="priority">Priority</option>
                    </select>
                    
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
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
                      const pillar = PILLARS[ticket.category];
                      const channel = CHANNELS[ticket.channel] || CHANNELS.web;
                      const ChannelIcon = channel.icon;
                      
                      return (
                        <div
                          key={ticket.ticket_id}
                          onClick={() => handleSelectTicket(ticket)}
                          className={`px-4 py-3 border-b cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedTicket?.ticket_id === ticket.ticket_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Priority + Pillar */}
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} title={priority.label} />
                              {pillar && <span className="text-sm" title={pillar.name}>{pillar.emoji}</span>}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs text-gray-400 font-mono">{ticket.ticket_id?.slice(0, 20)}</span>
                                <Badge className={`text-[10px] px-1.5 py-0 ${status.bgLight} ${status.textColor} border-0`}>
                                  {status.label}
                                </Badge>
                                <ChannelIcon className={`w-3 h-3 ${channel.color}`} title={channel.label} />
                              </div>
                              
                              <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                                {ticket.subject || ticket.description?.slice(0, 50) || 'No subject'}
                              </h4>
                              
                              <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">
                                {ticket.description?.slice(0, 100) || ''}
                              </p>
                              
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {ticket.member?.name || 'Unknown'}
                                </span>
                                {ticket.pet_info?.name && (
                                  <span className="flex items-center gap-1">
                                    <PawPrint className="w-3 h-3" />
                                    {ticket.pet_info.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(ticket.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* ==================== TICKET DETAIL PANEL ==================== */}
              {selectedTicket ? (
                <div className="w-[500px] flex-shrink-0 flex flex-col bg-white">
                  {/* Detail Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {PILLARS[selectedTicket.category] && (
                          <span className="text-lg">{PILLARS[selectedTicket.category].emoji}</span>
                        )}
                        <span className="font-mono text-xs text-gray-500">{selectedTicket.ticket_id}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {selectedTicket.subject || selectedTicket.description?.slice(0, 40)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`text-xs rounded-full px-3 py-1 font-medium ${STATUS_CONFIG[selectedTicket.status]?.bgLight} ${STATUS_CONFIG[selectedTicket.status]?.textColor} border-0`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-gray-100 rounded ml-2">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b flex-shrink-0">
                    {['conversation', 'context', 'history'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`flex-1 px-4 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${
                          detailTab === tab
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'conversation' && <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />}
                        {tab === 'context' && <PawPrint className="w-3.5 h-3.5 inline mr-1.5" />}
                        {tab === 'history' && <History className="w-3.5 h-3.5 inline mr-1.5" />}
                        {tab}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    
                    {/* CONVERSATION TAB */}
                    {detailTab === 'conversation' && (
                      <div className="p-4">
                        {/* Customer Info Bar */}
                        <Card className="p-3 mb-4 bg-gray-50 border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                              {(selectedTicket.member?.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">{selectedTicket.member?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-3">
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
                            </div>
                            {selectedTicket.pet_info?.name && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                <PawPrint className="w-3 h-3 mr-1" />
                                {selectedTicket.pet_info.name}
                              </Badge>
                            )}
                          </div>
                        </Card>
                        
                        {/* Messages */}
                        <div className="space-y-4">
                          {/* Initial message */}
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {(selectedTicket.member?.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span>{selectedTicket.member?.name || 'Customer'}</span>
                                <span>•</span>
                                <span>{formatTime(selectedTicket.created_at)}</span>
                                {selectedTicket.channel && (
                                  <>
                                    <span>•</span>
                                    <span className={CHANNELS[selectedTicket.channel]?.color}>
                                      via {CHANNELS[selectedTicket.channel]?.label}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Conversation messages */}
                          {selectedTicket.messages?.map((msg, idx) => {
                            const isAgent = msg.direction === 'outgoing' || msg.is_agent_reply;
                            return (
                              <div key={idx} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isAgent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {isAgent ? 'AD' : (msg.sender_name || 'CU').slice(0, 2).toUpperCase()}
                                </div>
                                <div className={`flex-1 ${isAgent ? 'text-right' : ''}`}>
                                  <div className={`inline-block rounded-lg p-3 max-w-[85%] ${
                                    msg.is_internal
                                      ? 'bg-amber-50 border border-amber-200 text-left'
                                      : isAgent
                                        ? 'bg-emerald-500 text-white text-left'
                                        : 'bg-gray-100'
                                  }`}>
                                    {msg.is_internal && (
                                      <div className="text-[10px] text-amber-600 mb-1 font-medium flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Internal Note
                                      </div>
                                    )}
                                    <p className={`text-sm whitespace-pre-wrap ${isAgent && !msg.is_internal ? 'text-white' : 'text-gray-800'}`}>
                                      {msg.content || msg.message}
                                    </p>
                                  </div>
                                  <div className={`text-[10px] text-gray-400 mt-1 ${isAgent ? 'text-right' : ''}`}>
                                    {formatTime(msg.timestamp || msg.created_at)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={conversationEndRef} />
                        </div>
                      </div>
                    )}
                    
                    {/* CONTEXT TAB - Pet Soul & Member Data */}
                    {detailTab === 'context' && (
                      <div className="p-4">
                        {loadingContext ? (
                          <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                          </div>
                        ) : (
                          <>
                            {/* Pet Profile */}
                            {(petProfile || selectedTicket.pet_info) && (
                              <Card className="p-4 mb-4 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                    <PawPrint className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900">{petProfile?.name || selectedTicket.pet_info?.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {petProfile?.breed || selectedTicket.pet_info?.breed}
                                      {petProfile?.age && ` • ${petProfile.age}`}
                                    </p>
                                  </div>
                                </div>
                                
                                {petProfile?.soul && (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Soul Score</span>
                                      <Badge className="bg-purple-100 text-purple-700">
                                        {petProfile.soul.profile_score || 0}%
                                      </Badge>
                                    </div>
                                    {petProfile.soul.personality && (
                                      <div>
                                        <span className="text-gray-500">Personality:</span>
                                        <span className="ml-2 text-gray-700">{petProfile.soul.personality}</span>
                                      </div>
                                    )}
                                    {petProfile.soul.energy_level && (
                                      <div>
                                        <span className="text-gray-500">Energy:</span>
                                        <span className="ml-2 text-gray-700">{petProfile.soul.energy_level}</span>
                                      </div>
                                    )}
                                    {petProfile.soul.dietary_requirements && (
                                      <div>
                                        <span className="text-gray-500">Diet:</span>
                                        <span className="ml-2 text-gray-700">{petProfile.soul.dietary_requirements}</span>
                                      </div>
                                    )}
                                    {petProfile.soul.allergies?.length > 0 && (
                                      <div>
                                        <span className="text-gray-500">Allergies:</span>
                                        <span className="ml-2 text-red-600">{petProfile.soul.allergies.join(', ')}</span>
                                      </div>
                                    )}
                                    {petProfile.soul.fears?.length > 0 && (
                                      <div>
                                        <span className="text-gray-500">Fears:</span>
                                        <span className="ml-2 text-orange-600">{petProfile.soul.fears.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Card>
                            )}
                            
                            {/* Member Profile */}
                            {(memberProfile || selectedTicket.member) && (
                              <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900">
                                      {memberProfile?.name || selectedTicket.member?.name}
                                    </h4>
                                    <p className="text-xs text-gray-500">Pet Parent</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{memberProfile?.email || selectedTicket.member?.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{memberProfile?.phone || selectedTicket.member?.phone}</span>
                                  </div>
                                  {memberProfile?.address && (
                                    <div className="flex items-start gap-2">
                                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                      <span className="text-gray-600">{memberProfile.address}, {memberProfile.city}</span>
                                    </div>
                                  )}
                                  {memberProfile?.tier && (
                                    <div className="flex items-center gap-2">
                                      <Star className="w-4 h-4 text-amber-400" />
                                      <span className="font-medium text-amber-600">
                                        {memberProfile.tier === 'tier3' ? 'Inner Circle' : 
                                         memberProfile.tier === 'tier2' ? 'Pack Member' : 'Explorer'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            )}
                            
                            {!petProfile && !selectedTicket.pet_info && !memberProfile && !selectedTicket.member && (
                              <div className="text-center text-gray-400 py-8">
                                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No profile data available</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* HISTORY TAB */}
                    {detailTab === 'history' && (
                      <div className="p-4">
                        {orderHistory.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order History</h4>
                            {orderHistory.slice(0, 5).map((order, idx) => (
                              <Card key={idx} className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-mono text-gray-500">{order.id}</span>
                                  <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="text-sm font-medium text-gray-900">₹{order.total}</div>
                                <div className="text-xs text-gray-400">{formatTime(order.created_at)}</div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-8">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No order history</p>
                          </div>
                        )}
                        
                        {/* Ticket Metadata */}
                        {selectedTicket.metadata && (
                          <div className="mt-6">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                              {Object.entries(selectedTicket.metadata).slice(0, 10).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-gray-700 font-medium">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* ==================== REPLY COMPOSER ==================== */}
                  {detailTab === 'conversation' && (
                    <div className="border-t p-4 flex-shrink-0 bg-gray-50">
                      {/* AI Suggestion */}
                      {aiSuggestion && (
                        <Card className="p-3 mb-3 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Mira's Suggestion
                            </span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setAiSuggestion(null)} className="h-6 px-2 text-xs">
                                Dismiss
                              </Button>
                              <Button size="sm" onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(null); }} className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700">
                                Use This
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{aiSuggestion}</p>
                        </Card>
                      )}
                      
                      {/* Internal Note Toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded"
                          />
                          <span className={isInternal ? 'text-amber-600 font-medium' : 'text-gray-500'}>Internal Note</span>
                        </label>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAiReply}
                          disabled={aiLoading}
                          className="text-purple-600 hover:text-purple-700 text-xs h-7"
                        >
                          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                          Ask Mira
                        </Button>
                      </div>
                      
                      <Textarea
                        placeholder={isInternal ? "Add internal note (not visible to customer)..." : `Reply to ${selectedTicket.member?.name || 'customer'}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={`mb-2 text-sm ${isInternal ? 'bg-amber-50 border-amber-200' : ''}`}
                        rows={3}
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-white rounded transition-colors">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-white rounded transition-colors">
                            <Image className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        <Button
                          onClick={handleReply}
                          disabled={!replyText.trim() || sending}
                          className={`${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {isInternal ? 'Add Note' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No ticket selected */
                <div className="w-[500px] flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Ticket</h3>
                  <p className="text-sm text-center max-w-xs">
                    Click on any ticket to view the conversation, pet profile, and respond to the customer.
                  </p>
                </div>
              )}
            </>
          )}
          
          {/* Dashboard placeholder */}
          {activeNav === 'dashboard' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Open Tickets', value: stats.open, color: 'bg-blue-500' },
                  { label: 'In Progress', value: stats.in_progress, color: 'bg-amber-500' },
                  { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500' },
                  { label: 'Unassigned', value: stats.unassigned, color: 'bg-red-500' }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-4">
                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                      <Inbox className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </Card>
                ))}
              </div>
              
              {/* Pillar breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Tickets by Pillar</h3>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(PILLARS).map(([key, pillar]) => (
                    <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{pillar.emoji}</span>
                      <div className="text-lg font-bold text-gray-900 mt-1">{stats.by_pillar[key] || 0}</div>
                      <div className="text-xs text-gray-500">{pillar.name}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoggyServiceDesk;
