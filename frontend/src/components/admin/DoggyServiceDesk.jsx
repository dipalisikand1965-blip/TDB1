import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import QuoteBuilder from './QuoteBuilder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { API_URL, getApiUrl } from '../../utils/api';
import { useServiceDeskSocket, TicketNotificationToast } from '../../hooks/useServiceDeskSocket';
import RichTextEditor from './RichTextEditor';
import KanbanBoard from './KanbanBoard';
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
  Dog, Cat, Scissors, Car, Home, Siren, Mic, MicOff, StopCircle,
  LayoutList, Columns3, Keyboard, Timer, Copy, ArrowRight,
  Play, Pause, Volume2, File, Upload, Trash, Eye, Download, Wifi, WifiOff, Ban, Menu
} from 'lucide-react';

// ==================== PILLAR CONFIGURATION ====================
const PILLARS = {
  celebrate: { 
    icon: PartyPopper, emoji: '🎂', color: 'bg-pink-500', name: 'Celebrate',
    sources: ['party_booking', 'cake_order', 'photoshoot', 'birthday']
  },
  dine: { 
    icon: Utensils, emoji: '🍽️', color: 'bg-orange-500', name: 'Dine',
    sources: ['reservation', 'meal_order', 'dine_inquiry']
  },
  stay: { 
    icon: Hotel, emoji: '🏨', color: 'bg-blue-500', name: 'Stay',
    sources: ['booking', 'stay_inquiry', 'boarding', 'stay_booking']
  },
  travel: { 
    icon: Plane, emoji: '✈️', color: 'bg-cyan-500', name: 'Travel',
    sources: ['travel_request', 'cab_booking', 'relocation']
  },
  care: { 
    icon: Stethoscope, emoji: '💊', color: 'bg-red-500', name: 'Care',
    sources: ['care_request', 'grooming', 'vet_coordination', 'health']
  },
  enjoy: { 
    icon: Target, emoji: '🎾', color: 'bg-violet-500', name: 'Enjoy',
    sources: ['activity_booking', 'playdate', 'event_registration']
  },
  fit: { 
    icon: Dumbbell, emoji: '🏃', color: 'bg-green-500', name: 'Fit',
    sources: ['fitness_program', 'assessment_booking', 'training']
  },
  learn: { 
    icon: GraduationCap, emoji: '🎓', color: 'bg-indigo-500', name: 'Learn',
    sources: ['training_enrollment', 'workshop', 'course']
  },
  paperwork: { 
    icon: FileText, emoji: '📄', color: 'bg-gray-500', name: 'Paperwork',
    sources: ['documentation', 'certificate', 'registration']
  },
  advisory: { 
    icon: BookOpen, emoji: '📋', color: 'bg-slate-500', name: 'Advisory',
    sources: ['consultation', 'advice_request', 'guidance']
  },
  emergency: { 
    icon: Siren, emoji: '🚨', color: 'bg-red-600', name: 'Emergency',
    sources: ['emergency_request', 'urgent_care', 'sos']
  },
  farewell: { 
    icon: Heart, emoji: '🌈', color: 'bg-purple-400', name: 'Farewell',
    sources: ['memorial', 'farewell_service', 'cremation']
  },
  adopt: { 
    icon: PawPrint, emoji: '🐾', color: 'bg-teal-500', name: 'Adopt',
    sources: ['adoption_inquiry', 'rehoming', 'foster']
  },
  shop: { 
    icon: ShoppingBag, emoji: '🛒', color: 'bg-amber-500', name: 'Shop',
    sources: ['order', 'product_inquiry', 'return_request']
  }
};

// Special sections (not pillars but important categories)
const SPECIAL_SECTIONS = {
  mira: { icon: Sparkles, emoji: '✨', color: 'bg-gradient-to-r from-purple-500 to-pink-500', name: 'Mira AI', sources: ['mira_chat', 'ai_conversation'] },
  membership: { icon: CreditCard, emoji: '💳', color: 'bg-emerald-500', name: 'Membership', sources: ['membership', 'subscription', 'upgrade'] },
  pet_parent: { icon: User, emoji: '👤', color: 'bg-blue-400', name: 'Pet Parent', sources: ['member_inquiry', 'account'] },
  pet_profile: { icon: Dog, emoji: '🐕', color: 'bg-amber-400', name: 'Pet Profile', sources: ['pet_inquiry', 'pet_update'] }
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
  
  // Current admin user (extracted from auth or default)
  const adminUser = 'Admin'; // TODO: Extract from authHeaders/context
  
  // SLA Timer Helper - calculates and formats remaining time
  const formatSlaTime = (slaStatus) => {
    if (!slaStatus) return null;
    const seconds = slaStatus.seconds_remaining;
    const isBreached = seconds < 0;
    const absSeconds = Math.abs(seconds);
    
    const hours = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return { text: isBreached ? `${days}d overdue` : `${days}d ${hours % 24}h`, isBreached, status: slaStatus.status };
    }
    if (hours > 0) {
      return { text: isBreached ? `${hours}h ${mins}m overdue` : `${hours}h ${mins}m`, isBreached, status: slaStatus.status };
    }
    return { text: isBreached ? `${mins}m overdue` : `${mins}m`, isBreached, status: slaStatus.status };
  };
  
  // Navigation
  const [activeNav, setActiveNav] = useState('tickets');
  const [ticketsExpanded, setTicketsExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'sidebar', 'list', 'detail'
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // View state
  const [viewMode, setViewMode] = useState('list');
  const [selectedView, setSelectedView] = useState('all');
  const [selectedPillar, setSelectedPillar] = useState('all');
  
  // Data
  const [allTickets, setAllTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Quote Builder for party requests
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [partyRequestData, setPartyRequestData] = useState(null);
  
  // Bulk Selection
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Lock/Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Notification Sound
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notificationSoundRef = React.useRef(null);
  
  // Stats - moved before playNotificationSound to avoid reference error
  const [stats, setStats] = useState({
    total: 0, open: 0, in_progress: 0, on_hold: 0, resolved: 0,
    overdue: 0, my_tickets: 0, unassigned: 0,
    by_pillar: {}, by_channel: {}, by_priority: {}
  });
  
  // Play notification sound for new tickets
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // Create audio context for notification sound
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      
      oscillator.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.15); // D6
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
      
      // Badge update
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(stats.open + 1).catch(() => {});
      }
    } catch (err) {
      console.log('Sound notification not available:', err);
    }
  }, [soundEnabled, stats.open]);
  
  // Pet & Member context
  const [petProfile, setPetProfile] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingContext, setLoadingContext] = useState(false);
  
  // Agents for assignment
  const [agents, setAgents] = useState([
    { id: 'aditya', name: 'Aditya' },
    { id: 'dipali', name: 'Dipali' },
    { id: 'support', name: 'Support Team' }
  ]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, pet, pet_parent, subject, pillar
  const [sortBy, setSortBy] = useState('newest');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  // Reply
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiReplyStyle, setAiReplyStyle] = useState('professional'); // 5 styles
  
  // Intelligent Summary & Pet Soul Prompts
  const [conversationSummary, setConversationSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [petSoulPrompts, setPetSoulPrompts] = useState(null);
  
  // Ticket Editing & New Ticket
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [customStatuses, setCustomStatuses] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    type: 'ticket', category: 'inquiry', urgency: 'medium',
    subject: '', description: '', member_email: '', member_name: '', member_phone: '',
    pet_name: ''
  });
  
  // Settings Modal & Templates
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('status'); // status, templates, automation
  const [newStatusName, setNewStatusName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
  
  // Template Management
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '', type: 'email', subject: '', content: '', trigger: 'manual', trigger_status: ''
  });
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  
  // Auto-messaging settings
  const [autoMessageSettings, setAutoMessageSettings] = useState({
    auto_acknowledge: true,
    auto_acknowledge_template: '',
    status_triggers: {} // { status: templateId }
  });
  
  // Notification Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Agent Collision Detection
  const [activeAgents, setActiveAgents] = useState({}); // { ticketId: [agentNames] }
  const [viewingTicketSince, setViewingTicketSince] = useState(null);
  
  // Customer Satisfaction (CSAT)
  const [showCSATModal, setShowCSATModal] = useState(false);
  const [csatData, setCsatData] = useState({ rating: 0, feedback: '' });
  
  // Inline Subject Editing
  const [editingSubject, setEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  
  // Reminders/Tasks
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '', description: '', due_at: '', reminder_type: 'follow_up', priority: 'medium'
  });
  const [ticketReminders, setTicketReminders] = useState([]);
  
  // Tags
  const [newTag, setNewTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  
  // Ticket Merging
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetTicket, setMergeTargetTicket] = useState(null);
  
  // Agent Performance
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [agentPerformance, setAgentPerformance] = useState(null);
  
  // SLA Breach Alerts
  const [breachedTickets, setBreachedTickets] = useState([]);
  const [approachingBreachTickets, setApproachingBreachTickets] = useState([]);
  
  // Sidebar data for Pet Parents, Orders, Analytics
  const [petParents, setPetParents] = useState([]);
  const [petProfiles, setPetProfiles] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Pet Parent Ticket History Modal
  const [showParentHistoryModal, setShowParentHistoryModal] = useState(false);
  const [selectedParentForHistory, setSelectedParentForHistory] = useState(null);
  
  // Detail panel
  const [detailTab, setDetailTab] = useState('conversation');
  const [contextTab, setContextTab] = useState('pet');
  
  // Attachments & Voice Recording
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  const conversationEndRef = useRef(null);
  
  // Real-time notification state
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  
  // WebSocket callbacks for real-time updates
  const handleNewTicket = useCallback((data) => {
    // Add new ticket to the list
    setAllTickets(prev => {
      const exists = prev.some(t => t.ticket_id === data.ticket?.ticket_id);
      if (exists) return prev;
      return [data.ticket, ...prev];
    });
    // Show notification
    setRealtimeNotification({ ...data, type: 'new_ticket' });
    // Play notification sound for new tickets
    playNotificationSound();
    // Auto-dismiss after 5 seconds
    setTimeout(() => setRealtimeNotification(null), 5000);
  }, [playNotificationSound]);
  
  const handleTicketUpdate = useCallback((data) => {
    setAllTickets(prev => prev.map(t => 
      t.ticket_id === data.ticket_id ? { ...t, ...data.data } : t
    ));
    // Update selected ticket if it's the one being updated
    if (selectedTicket?.ticket_id === data.ticket_id) {
      setSelectedTicket(prev => ({ ...prev, ...data.data }));
    }
  }, [selectedTicket?.ticket_id]);
  
  const handleNewMessage = useCallback((data) => {
    // Update ticket messages if viewing this ticket
    if (selectedTicket?.ticket_id === data.ticket_id) {
      setSelectedTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), data.message]
      }));
    }
    // Show notification if not viewing this ticket
    if (selectedTicket?.ticket_id !== data.ticket_id) {
      setRealtimeNotification({ ...data, type: 'new_message' });
      setTimeout(() => setRealtimeNotification(null), 5000);
    }
  }, [selectedTicket?.ticket_id]);
  
  // Initialize WebSocket connection
  const { connected, subscribeToTicket, unsubscribeFromTicket } = useServiceDeskSocket(
    'admin', // Agent ID
    handleNewTicket,
    handleTicketUpdate,
    handleNewMessage
  );

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
        blocked: allTicketsList.filter(t => t.status === 'blocked').length,
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
      
      // Count by priority
      ['critical', 'high', 'medium', 'low'].forEach(p => {
        statsObj.by_priority[p] = allTicketsList.filter(t => t.priority === p).length;
      });
      
      setStats(statsObj);
      
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [authHeaders]);

  // Filtered and sorted tickets (derived state using useMemo)
  const tickets = useMemo(() => {
    let filtered = [...allTickets];
    
    // Filter by view
    if (selectedView === 'open') {
      filtered = filtered.filter(t => ['new', 'open', 'pending'].includes(t.status));
    } else if (selectedView === 'in_progress') {
      filtered = filtered.filter(t => t.status === 'in_progress');
    } else if (selectedView === 'on_hold') {
      filtered = filtered.filter(t => ['on_hold', 'waiting_on_member'].includes(t.status));
    } else if (selectedView === 'blocked') {
      filtered = filtered.filter(t => t.status === 'blocked');
    } else if (selectedView === 'resolved') {
      filtered = filtered.filter(t => ['resolved', 'closed', 'confirmed', 'completed'].includes(t.status));
    } else if (selectedView === 'unassigned') {
      filtered = filtered.filter(t => !t.assigned_to);
    }
    
    // Filter by pillar (including special sections)
    if (selectedPillar !== 'all') {
      if (selectedPillar === 'mira') {
        filtered = filtered.filter(t => t.source === 'mira_chat' || t.category === 'mira');
      } else if (selectedPillar === 'membership') {
        filtered = filtered.filter(t => t.category === 'membership' || t.source?.includes('membership'));
      } else if (selectedPillar === 'pet_parent') {
        filtered = filtered.filter(t => t.category === 'member_inquiry' || t.source === 'account');
      } else if (selectedPillar === 'pet_profile') {
        filtered = filtered.filter(t => t.category === 'pet_inquiry' || t.source === 'pet_update');
      } else {
        filtered = filtered.filter(t => t.category === selectedPillar || t.pillar === selectedPillar);
      }
    }
    
    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.urgency === priorityFilter || t.priority === priorityFilter);
    }
    
    // Filter by channel
    if (channelFilter !== 'all') {
      filtered = filtered.filter(t => t.channel === channelFilter);
    }
    
    // Advanced Search - by type
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        switch (searchType) {
          case 'pet':
            return t.pet_info?.name?.toLowerCase().includes(q) ||
                   t.metadata?.pet_name?.toLowerCase().includes(q);
          case 'pet_parent':
            return t.member?.name?.toLowerCase().includes(q) ||
                   t.member?.email?.toLowerCase().includes(q) ||
                   t.member?.phone?.includes(q);
          case 'subject':
            return t.subject?.toLowerCase().includes(q) ||
                   t.description?.toLowerCase().includes(q);
          case 'pillar':
            return t.category?.toLowerCase().includes(q) ||
                   t.pillar?.toLowerCase().includes(q);
          default: // 'all'
            return t.ticket_id?.toLowerCase().includes(q) ||
                   t.subject?.toLowerCase().includes(q) ||
                   t.description?.toLowerCase().includes(q) ||
                   t.member?.name?.toLowerCase().includes(q) ||
                   t.member?.email?.toLowerCase().includes(q) ||
                   t.pet_info?.name?.toLowerCase().includes(q) ||
                   t.category?.toLowerCase().includes(q);
        }
      });
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
    
    return filtered;
  }, [allTickets, selectedView, selectedPillar, priorityFilter, channelFilter, searchQuery, searchType, sortBy]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAllTickets();
      setLoading(false);
    };
    load();
  }, [fetchAllTickets]);
  
  // Load custom settings and sidebar data on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [statusRes, catRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/tickets/statuses`, { headers: authHeaders }),
          fetch(`${getApiUrl()}/api/tickets/categories`, { headers: authHeaders })
        ]);
        
        if (statusRes.ok) {
          const data = await statusRes.json();
          setCustomStatuses(data.statuses?.filter(s => !s.is_default) || []);
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCustomCategories(data.categories?.filter(c => !c.is_default) || []);
        }
      } catch (err) {
        console.debug('Could not fetch custom settings:', err);
      }
      
      // Fetch sidebar data (Pet Parents, Pets, Orders, Analytics)
      try {
        // Fetch pet parents/members from admin directory endpoint
        const membersRes = await fetch(`${getApiUrl()}/api/admin/members/directory`, { headers: authHeaders });
        if (membersRes.ok) {
          const data = await membersRes.json();
          setPetParents(data.members || []);
        }
        
        // Fetch pets from admin endpoint
        const petsRes = await fetch(`${getApiUrl()}/api/admin/pets?limit=100`, { headers: authHeaders });
        if (petsRes.ok) {
          const data = await petsRes.json();
          setPetProfiles(data.pets || []);
        }
        
        // Fetch recent orders from admin endpoint
        const ordersRes = await fetch(`${getApiUrl()}/api/admin/orders?limit=50`, { headers: authHeaders });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrdersData(data.orders || []);
        }
        
        // Fetch analytics summary
        const analyticsRes = await fetch(`${getApiUrl()}/api/tickets/analytics`, { headers: authHeaders });
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.debug('Could not fetch sidebar data:', err);
      }
    };
    loadSettings();
  }, [authHeaders]);

  // Fetch pet & member context when ticket selected
  const fetchContext = async (ticket) => {
    if (!ticket) return;
    setLoadingContext(true);
    setPetProfile(null);
    setMemberProfile(null);
    setOrderHistory([]);
    setPetSoulPrompts(null);
    
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
        const memberRes = await fetch(`${getApiUrl()}/api/admin/members/search?email=${encodeURIComponent(ticket.member.email)}`, { headers: authHeaders });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          if (memberData.members?.[0]) {
            setMemberProfile(memberData.members[0]);
            
            // Fetch their order history
            try {
              const ordersRes = await fetch(`${getApiUrl()}/api/admin/orders?limit=20`, { headers: authHeaders });
              if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                // Filter orders by email
                const userOrders = (ordersData.orders || []).filter(o => o.email === ticket.member.email);
                setOrderHistory(userOrders);
              }
            } catch (e) {
              console.debug('Could not fetch orders:', e);
            }
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
    setConversationSummary(null);
    setIsEditingTicket(false);
    setPetSoulPrompts(null);
    setTicketReminders([]);
    
    // Switch to detail view on mobile
    if (isMobile) {
      setMobileView('detail');
    }
    
    await fetchContext(ticket);
    
    // Fetch reminders for this ticket
    await fetchReminders(ticket.ticket_id);
    
    // Fetch full ticket details if it's from the tickets collection
    if (ticket.source !== 'reservation' && ticket.source !== 'stay_booking') {
      try {
        const res = await fetch(`${getApiUrl()}/api/tickets/${ticket.ticket_id}`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setSelectedTicket(prev => ({ ...prev, ...data.ticket, messages: data.ticket?.messages || prev.messages }));
          // Generate summary for tickets with messages
          if (data.ticket?.messages?.length > 0) {
            generateConversationSummary(data.ticket);
          }
          // Fetch Pet Soul prompts if pet is linked
          if (data.ticket?.pet_info?.id || data.ticket?.pet_id) {
            fetchPetSoulPrompts(data.ticket.pet_info?.id || data.ticket.pet_id);
          }
        }
      } catch (e) {
        console.debug('Could not fetch full ticket details:', e);
      }
    }
  };

  // Generate intelligent conversation summary
  const generateConversationSummary = async (ticket) => {
    if (!ticket || !ticket.messages?.length) return;
    setSummaryLoading(true);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/ai/summarize`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id,
          description: ticket.description,
          messages: ticket.messages?.slice(-10) || [],
          pet_name: petProfile?.name || ticket.pet_info?.name,
          member_name: ticket.member?.name
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setConversationSummary(data.summary);
      }
    } catch (err) {
      console.debug('Summary generation error:', err);
    }
    setSummaryLoading(false);
  };

  // Fetch reminders for a ticket
  const fetchReminders = async (ticketId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}/reminders`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTicketReminders(data.reminders || []);
      }
    } catch (err) {
      console.debug('Could not fetch reminders:', err);
    }
  };

  // Create reminder for ticket
  const createReminder = async () => {
    if (!selectedTicket || !reminderForm.title || !reminderForm.due_at) return;
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reminders`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderForm)
      });
      
      if (res.ok) {
        await fetchReminders(selectedTicket.ticket_id);
        setShowReminderModal(false);
        setReminderForm({ title: '', description: '', due_at: '', reminder_type: 'follow_up', priority: 'medium' });
      }
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  // Complete a reminder
  const completeReminder = async (reminderId) => {
    if (!selectedTicket) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      await fetchReminders(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  // Delete a reminder
  const deleteReminder = async (reminderId) => {
    if (!selectedTicket) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      await fetchReminders(selectedTicket.ticket_id);
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  // Edit ticket - start editing
  const startEditingTicket = () => {
    if (!selectedTicket) return;
    setEditForm({
      category: selectedTicket.category || selectedTicket.pillar || '',
      status: selectedTicket.status || 'new',
      urgency: selectedTicket.urgency || 'medium',
      subject: selectedTicket.subject || '',
      assigned_to: selectedTicket.assigned_to || ''
    });
    setIsEditingTicket(true);
  };

  // Save ticket edits
  const saveTicketEdits = async () => {
    if (!selectedTicket) return;
    setSending(true);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        setSelectedTicket(prev => ({ ...prev, ...editForm }));
        setIsEditingTicket(false);
        await fetchAllTickets();
      }
    } catch (err) {
      console.error('Edit error:', err);
    }
    setSending(false);
  };

  // AI Reply Style Options
  const AI_REPLY_STYLES = [
    { id: 'professional', label: 'Professional', icon: '💼', desc: 'Formal and business-like' },
    { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm and personable' },
    { id: 'empathetic', label: 'Empathetic', icon: '💝', desc: 'Understanding and caring' },
    { id: 'concise', label: 'Concise', icon: '⚡', desc: 'Short and to the point' },
    { id: 'detailed', label: 'Detailed', icon: '📝', desc: 'Comprehensive and thorough' }
  ];

  // Generate AI reply suggestion with selected style
  const generateAiReply = async (style = aiReplyStyle) => {
    if (!selectedTicket) return;
    setAiLoading(true);
    setAiSuggestion(null);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/ai/draft-reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          reply_type: style,
          pet_context: petProfile?.soul || petSoulPrompts,
          member_name: memberProfile?.name || selectedTicket.member?.name,
          pet_name: petProfile?.name || selectedTicket.pet_info?.name
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

  // Fetch Pet Soul prompts for quick reminders
  const fetchPetSoulPrompts = async (petId) => {
    if (!petId) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/pet-soul/${petId}/prompts`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPetSoulPrompts(data.prompts);
      }
    } catch (err) {
      console.debug('Could not fetch pet soul prompts:', err);
    }
  };

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!newTicketForm.subject.trim()) return;
    setSending(true);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newTicketForm.category,
          urgency: newTicketForm.urgency,
          subject: newTicketForm.subject,
          description: newTicketForm.description,
          channel: 'web',
          member: {
            name: newTicketForm.member_name,
            email: newTicketForm.member_email,
            phone: newTicketForm.member_phone
          },
          pet_info: newTicketForm.pet_name ? { name: newTicketForm.pet_name } : null
        })
      });
      
      if (res.ok) {
        setShowNewTicketModal(false);
        setNewTicketForm({
          type: 'ticket', category: 'inquiry', urgency: 'medium',
          subject: '', description: '', member_email: '', member_name: '', member_phone: '',
          pet_name: ''
        });
        await fetchAllTickets();
      }
    } catch (err) {
      console.error('Create ticket error:', err);
    }
    setSending(false);
  };

  // Handle reply - supports rich HTML content
  const handleReply = async () => {
    // Check if there's actual content (strip HTML tags for validation)
    const textContent = replyText ? replyText.replace(/<[^>]*>/g, '').trim() : '';
    if ((!textContent && attachments.length === 0) || !selectedTicket) return;
    setSending(true);
    
    try {
      // Include attachment URLs in the reply
      const attachmentData = attachments.map(att => ({
        filename: att.name,
        file_url: att.url,
        type: att.type,
        size: att.size
      }));
      
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: replyText || (attachments.length > 0 ? `[${attachments.length} attachment(s)]` : ''), 
          is_internal: isInternal,
          attachments: attachmentData
        })
      });
      
      setReplyText('');
      setAiSuggestion(null);
      clearAttachments(); // Clear attachments after send
      
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
  const handleStatusChange = async (ticketIdOrStatus, newStatusParam) => {
    // Support both calling conventions:
    // 1. handleStatusChange(newStatus) - from dropdown in detail panel
    // 2. handleStatusChange(ticketId, newStatus) - from Kanban board
    let targetTicket, newStatus;
    
    if (newStatusParam !== undefined) {
      // Called from Kanban: handleStatusChange(ticketId, newStatus)
      targetTicket = tickets.find(t => t.ticket_id === ticketIdOrStatus);
      newStatus = newStatusParam;
    } else {
      // Called from detail panel: handleStatusChange(newStatus)
      if (!selectedTicket) return;
      targetTicket = selectedTicket;
      newStatus = ticketIdOrStatus;
    }
    
    if (!targetTicket) return;
    
    try {
      // Determine which API to call based on source
      let endpoint = `${getApiUrl()}/api/tickets/${targetTicket.ticket_id}`;
      
      if (targetTicket.source === 'reservation') {
        endpoint = `${getApiUrl()}/api/admin/dine/reservations/${targetTicket.ticket_id}`;
      } else if (targetTicket.source === 'stay_booking') {
        endpoint = `${getApiUrl()}/api/stay/admin/bookings/${targetTicket.ticket_id}`;
      }
      
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state if this is the selected ticket
      if (selectedTicket?.ticket_id === targetTicket.ticket_id) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      await fetchAllTickets();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // ==================== BULK ACTIONS ====================
  
  // Toggle ticket selection
  const toggleTicketSelection = (ticketId) => {
    setSelectedTicketIds(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };
  
  // Select all visible tickets
  const selectAllTickets = () => {
    if (selectedTicketIds.length === tickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(tickets.map(t => t.ticket_id));
    }
  };
  
  // Bulk status change
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTicketIds.length === 0) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/bulk/status`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_ids: selectedTicketIds, status: newStatus })
      });
      
      setSelectedTicketIds([]);
      await fetchAllTickets();
    } catch (err) {
      console.error('Bulk status error:', err);
    }
  };
  
  // Bulk assignment
  const handleBulkAssign = async (agentId) => {
    if (selectedTicketIds.length === 0) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/bulk/assign`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_ids: selectedTicketIds, agent_id: agentId })
      });
      
      setSelectedTicketIds([]);
      await fetchAllTickets();
    } catch (err) {
      console.error('Bulk assign error:', err);
    }
  };
  
  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    
    try {
      // Delete each ticket
      for (const ticketId of selectedTicketIds) {
        await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
      }
      
      setSelectedTicketIds([]);
      setSelectedTicket(null);
      await fetchAllTickets();
    } catch (err) {
      console.error('Bulk delete error:', err);
    }
  };

  // ==================== TEMPLATE MANAGEMENT ====================
  
  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/templates`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.debug('Templates fetch error:', err);
    }
  };
  
  // Save template
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) return;
    
    try {
      const method = editingTemplateId ? 'PUT' : 'POST';
      const url = editingTemplateId 
        ? `${getApiUrl()}/api/tickets/templates/${editingTemplateId}`
        : `${getApiUrl()}/api/tickets/templates`;
      
      await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });
      
      setShowTemplateModal(false);
      setTemplateForm({ name: '', type: 'email', subject: '', content: '', trigger: 'manual', trigger_status: '' });
      setEditingTemplateId(null);
      await fetchTemplates();
    } catch (err) {
      console.error('Template save error:', err);
    }
  };
  
  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template?')) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/templates/${templateId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      await fetchTemplates();
    } catch (err) {
      console.error('Template delete error:', err);
    }
  };
  
  // Edit template
  const startEditingTemplate = (template) => {
    setTemplateForm({
      name: template.name,
      type: template.type || 'email',
      subject: template.subject || '',
      content: template.content,
      trigger: template.trigger || 'manual',
      trigger_status: template.trigger_status || ''
    });
    setEditingTemplateId(template.id);
    setShowTemplateModal(true);
  };
  
  // Use template in reply
  const applyTemplate = (template) => {
    setReplyText(template.content);
    setShowSettingsModal(false);
  };

  // ==================== NOTIFICATION SYSTEM ====================
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };
  
  // Show browser notification
  const showBrowserNotification = (title, body, onClick) => {
    if (notificationsEnabled && notificationPermission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '🐾',
        tag: 'service-desk',
        requireInteraction: true
      });
      
      notification.onclick = () => {
        window.focus();
        if (onClick) onClick();
        notification.close();
      };
      
      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };
  
  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const perm = Notification.permission;
      // Use a timeout to avoid synchronous setState in effect
      setTimeout(() => {
        setNotificationPermission(perm);
        setNotificationsEnabled(perm === 'granted');
      }, 0);
    }
  }, []);
  
  // Fetch templates when settings modal opens
  useEffect(() => {
    if (showSettingsModal && settingsTab === 'templates') {
      fetchTemplates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettingsModal, settingsTab]);
  
  // ==================== INLINE SUBJECT EDITING ====================
  
  const startEditingSubject = () => {
    setEditedSubject(selectedTicket?.subject || selectedTicket?.description?.slice(0, 60) || '');
    setEditingSubject(true);
  };
  
  const saveSubject = async () => {
    if (!selectedTicket || !editedSubject.trim()) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editedSubject.trim() })
      });
      
      setSelectedTicket(prev => ({ ...prev, subject: editedSubject.trim() }));
      setEditingSubject(false);
      await fetchAllTickets();
    } catch (err) {
      console.error('Error saving subject:', err);
    }
  };
  
  // ==================== AGENT COLLISION DETECTION ====================
  
  // Report agent viewing a ticket
  const reportTicketView = async (ticketId) => {
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}/viewing`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: adminUser || 'Unknown Agent' })
      });
    } catch (err) {
      console.debug('Viewing report error:', err);
    }
  };
  
  // Check who else is viewing
  const checkActiveViewers = async (ticketId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}/viewers`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setActiveAgents(prev => ({ ...prev, [ticketId]: data.viewers || [] }));
      }
    } catch (err) {
      console.debug('Viewers check error:', err);
    }
  };
  
  // Report viewing when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      // Use timeout to avoid synchronous setState in effect body
      const ticketId = selectedTicket.ticket_id;
      
      reportTicketView(ticketId);
      setTimeout(() => {
        checkActiveViewers(ticketId);
        setViewingTicketSince(new Date());
      }, 0);
      
      // Refresh viewers every 30 seconds
      const interval = setInterval(() => {
        reportTicketView(ticketId);
        checkActiveViewers(ticketId);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.ticket_id]);
  
  // ==================== CUSTOMER SATISFACTION (CSAT) ====================
  
  const sendCSATRequest = async (ticketId, rating, feedback) => {
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}/csat`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      setShowCSATModal(false);
      setCsatData({ rating: 0, feedback: '' });
    } catch (err) {
      console.error('CSAT error:', err);
    }
  };

  // ==================== TICKET TAGS ====================
  
  const fetchAllTags = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/tags/all`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAllTags(data.tags || []);
      }
    } catch (err) {
      console.debug('Tags fetch error:', err);
    }
  };
  
  const addTagToTicket = async (tag) => {
    if (!selectedTicket || !tag.trim()) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/tags`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([tag.trim()])
      });
      
      setSelectedTicket(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
      setNewTag('');
      fetchAllTags();
    } catch (err) {
      console.error('Add tag error:', err);
    }
  };
  
  const removeTagFromTicket = async (tag) => {
    if (!selectedTicket) return;
    
    try {
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      setSelectedTicket(prev => ({
        ...prev,
        tags: (prev.tags || []).filter(t => t !== tag)
      }));
    } catch (err) {
      console.error('Remove tag error:', err);
    }
  };

  // ==================== TICKET MERGING ====================
  
  const mergeTickets = async () => {
    // Need at least 2 tickets selected (1 primary + 1 to merge)
    const ticketsToMerge = selectedTicketIds.filter(id => id !== selectedTicket?.ticket_id);
    if (!selectedTicket || ticketsToMerge.length === 0) {
      toast({
        title: 'Cannot Merge',
        description: 'Please select at least 2 tickets to merge',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const response = await fetch(`${getApiUrl()}/api/concierge/tickets/merge`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_ticket_id: selectedTicket.ticket_id,
          secondary_ticket_ids: ticketsToMerge,
          agent_name: 'admin',
          merge_reason: 'Merged by admin from Service Desk'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Tickets Merged Successfully',
          description: data.message || `Merged ${ticketsToMerge.length} tickets into ${selectedTicket.ticket_id}`
        });
        setShowMergeModal(false);
        setSelectedTicketIds([]);
        await fetchAllTickets();
      } else {
        const error = await response.json();
        toast({
          title: 'Merge Failed',
          description: error.detail || 'Failed to merge tickets',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Merge error:', err);
      toast({
        title: 'Error',
        description: 'Network error - please try again',
        variant: 'destructive'
      });
    }
  };

  // ==================== TICKET LOCK/UNLOCK ====================
  
  const toggleTicketLock = async (ticketId, currentlyLocked) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}/lock`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: !currentlyLocked })
      });
      
      if (res.ok) {
        // Update local state
        setSelectedTicket(prev => prev ? { ...prev, is_locked: !currentlyLocked } : null);
        setAllTickets(prev => prev.map(t => 
          t.ticket_id === ticketId ? { ...t, is_locked: !currentlyLocked } : t
        ));
      }
    } catch (err) {
      console.error('Lock toggle error:', err);
    }
  };

  // ==================== TICKET DELETE ====================
  
  const confirmDeleteTicket = (ticket) => {
    setTicketToDelete(ticket);
    setShowDeleteConfirm(true);
  };
  
  const deleteTicket = async () => {
    if (!ticketToDelete) return;
    
    setDeleteLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketToDelete.ticket_id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (res.ok) {
        // Close detail panel if this ticket was selected
        if (selectedTicket?.ticket_id === ticketToDelete.ticket_id) {
          setSelectedTicket(null);
        }
        // Remove from local state
        setAllTickets(prev => prev.filter(t => t.ticket_id !== ticketToDelete.ticket_id));
        setShowDeleteConfirm(false);
        setTicketToDelete(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete ticket');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==================== QUOTE BUILDER FOR PARTY REQUESTS ====================
  
  const openQuoteBuilder = async (ticket) => {
    // Fetch the party request data if this is a party planning ticket
    if (ticket.party_request_id || ticket.source === 'party_wizard' || ticket.category === 'party_planning') {
      try {
        const requestId = ticket.party_request_id || ticket.ticket_id.replace('CEL-', 'PARTY-');
        const res = await fetch(`${getApiUrl()}/api/celebrate/party-requests?limit=50`, {
          headers: authHeaders
        });
        if (res.ok) {
          const data = await res.json();
          // Find matching request
          const partyRequest = data.requests?.find(r => 
            r.id === ticket.party_request_id || 
            r.id === requestId
          ) || {
            // Fallback: create from ticket data
            id: ticket.party_request_id || requestId,
            pet_name: ticket.member?.pet_name || ticket.title?.split("'s")[0] || 'Pet',
            occasion: ticket.category || 'birthday',
            date: ticket.created_at?.split('T')[0],
            time: 'Afternoon',
            guest_count: '5-10',
            venue: 'home',
            budget: 'standard',
            user_email: ticket.member?.email,
            user_name: ticket.member?.name,
            add_ons: {
              grooming: ticket.description?.includes('Grooming'),
              photography: ticket.description?.includes('Photography')
            }
          };
          setPartyRequestData(partyRequest);
          setShowQuoteBuilder(true);
        }
      } catch (err) {
        console.error('Error fetching party request:', err);
        toast({ title: 'Error', description: 'Could not load party request data', variant: 'destructive' });
      }
    }
  };

  // ==================== AGENT PERFORMANCE ====================
  
  const fetchAgentPerformance = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/analytics/agent-performance?days=30`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAgentPerformance(data);
      }
    } catch (err) {
      console.error('Performance fetch error:', err);
    }
  };

  // ==================== SLA BREACH MONITORING ====================
  
  const fetchBreachedTickets = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/sla/breached`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setBreachedTickets(data.breached || []);
        setApproachingBreachTickets(data.approaching_breach || []);
      }
    } catch (err) {
      console.debug('SLA breach check error:', err);
    }
  };
  
  // Fetch SLA breaches on mount and periodically
  useEffect(() => {
    fetchBreachedTickets();
    fetchAllTags();
    
    const interval = setInterval(fetchBreachedTickets, 60000); // Check every minute
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== ATTACHMENT HANDLING ====================
  
  // Handle file/image selection
  const handleFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB');
      return;
    }
    
    setUploadingAttachment(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // For FormData, don't set Content-Type header - browser sets it automatically
      const uploadHeaders = { ...authHeaders };
      delete uploadHeaders['Content-Type'];
      
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/attachments`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, {
          id: Date.now(),
          name: file.name,
          type: data.type,
          size: file.size,
          url: data.file_url,
          preview: type === 'image' ? URL.createObjectURL(file) : null
        }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    }
    
    setUploadingAttachment(false);
    e.target.value = '';
  };
  
  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Recording error:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };
  
  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };
  
  // Upload voice recording
  const uploadVoiceRecording = async () => {
    if (!audioBlob || !selectedTicket) return;
    
    setUploadingAttachment(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
      
      // For FormData, don't set Content-Type header
      const uploadHeaders = { ...authHeaders };
      delete uploadHeaders['Content-Type'];
      
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/attachments`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, {
          id: Date.now(),
          name: `Voice Recording (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`,
          type: 'voice',
          duration: recordingTime,
          url: data.file_url
        }]);
        setAudioBlob(null);
        setRecordingTime(0);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
    
    setUploadingAttachment(false);
  };
  
  // Remove attachment before sending
  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // Clear all attachments
  const clearAttachments = () => {
    setAttachments([]);
    setAudioBlob(null);
    setRecordingTime(0);
  };
  
  // Format recording time
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  
  // Export tickets to CSV
  const handleExportCSV = () => {
    // Use filtered tickets for export
    const ticketsToExport = tickets;
    if (!ticketsToExport || ticketsToExport.length === 0) {
      return; // Nothing to export
    }
    
    // CSV headers
    const headers = [
      'Ticket ID',
      'Status',
      'Category',
      'Urgency',
      'Member Name',
      'Member Email',
      'Member Phone',
      'Subject',
      'Source',
      'Channel',
      'Assigned Agent',
      'Tags',
      'Created At',
      'Updated At',
      'SLA Due At',
      'Messages Count'
    ];
    
    // Build CSV rows
    const rows = ticketsToExport.map(ticket => {
      const subject = ticket.subject || ticket.description?.slice(0, 60) || 'No Subject';
      const cleanSubject = subject.replace(/"/g, '""').replace(/\n/g, ' ');
      const tags = (ticket.tags || []).join(', ');
      
      return [
        ticket.ticket_id || ticket.id,
        ticket.status,
        ticket.category,
        ticket.urgency || ticket.priority,
        ticket.member?.name || '',
        ticket.member?.email || '',
        ticket.member?.phone || '',
        `"${cleanSubject}"`,
        ticket.source || 'web',
        ticket.channel || 'web',
        ticket.assigned_agent?.name || ticket.assigned_to || '',
        tags,
        ticket.created_at || '',
        ticket.updated_at || '',
        ticket.sla_due_at || '',
        (ticket.messages || []).length
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="flex h-screen bg-gray-100 overflow-hidden" data-testid="doggy-service-desk">
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 safe-area-pb">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setMobileView('sidebar')}
              className={`flex flex-col items-center p-2 rounded-lg ${mobileView === 'sidebar' ? 'text-emerald-400' : 'text-slate-400'}`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-1">Menu</span>
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`flex flex-col items-center p-2 rounded-lg relative ${mobileView === 'list' ? 'text-emerald-400' : 'text-slate-400'}`}
            >
              <Inbox className="w-5 h-5" />
              <span className="text-[10px] mt-1">Tickets</span>
              {stats.open > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {stats.open > 99 ? '99+' : stats.open}
                </span>
              )}
            </button>
            <button
              onClick={() => selectedTicket && setMobileView('detail')}
              className={`flex flex-col items-center p-2 rounded-lg ${mobileView === 'detail' ? 'text-emerald-400' : 'text-slate-400'} ${!selectedTicket ? 'opacity-50' : ''}`}
              disabled={!selectedTicket}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-1">Detail</span>
            </button>
            <button
              onClick={() => fetchAllTickets()}
              className="flex flex-col items-center p-2 rounded-lg text-slate-400"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-[10px] mt-1">Refresh</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Real-time Notification Toast */}
      <TicketNotificationToast 
        notification={realtimeNotification} 
        onDismiss={() => setRealtimeNotification(null)} 
      />
      
      {/* Mobile sidebar backdrop */}
      {isMobile && mobileView === 'sidebar' && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileView('list')}
        />
      )}
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <div className={`
        bg-slate-800 text-white transition-all duration-300 flex flex-col
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-40 w-72 transform ${mobileView === 'sidebar' ? 'translate-x-0' : '-translate-x-full'}` 
          : `${sidebarCollapsed ? 'w-16' : 'w-60'}`
        }
        ${isMobile ? 'pb-16' : ''}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <div>
                  <div className="font-bold text-sm">The Doggy Company</div>
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Command Center</div>
                </div>
              )}
            </div>
            {/* Close button for mobile sidebar */}
            {isMobile && (
              <button
                onClick={() => setMobileView('list')}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* WebSocket Connection Status */}
        {!sidebarCollapsed && (
          <div className="px-4 py-2 border-b border-slate-700">
            <div className={`flex items-center gap-2 text-xs ${connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{connected ? 'Live Updates Active' : 'Connecting...'}</span>
            </div>
          </div>
        )}
        
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
                  { id: 'blocked', label: 'Blocked', count: stats.blocked, icon: Ban },
                  { id: 'resolved', label: 'Resolved', count: stats.resolved, icon: CheckCircle },
                  { id: 'unassigned', label: 'Unassigned', count: stats.unassigned, icon: User }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      setSelectedView(item.id); 
                      if (isMobile) setMobileView('list');
                    }}
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
          
          {/* ==================== ALL PILLARS ==================== */}
          {!sidebarCollapsed && (
            <div className="mt-3 mb-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider px-3 mb-2">Pillars</div>
              <div className="space-y-0.5 px-1">
                {/* First 7 pillars (main) */}
                {['celebrate', 'dine', 'stay', 'travel', 'care', 'enjoy', 'fit'].map(key => {
                  const pillar = PILLARS[key];
                  const Icon = pillar.icon;
                  const count = stats.by_pillar[key] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => { setActiveNav('tickets'); setSelectedPillar(key); }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                        selectedPillar === key ? 'bg-emerald-600/80 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{pillar.emoji}</span>
                        <span>{pillar.name}</span>
                      </div>
                      {count > 0 && <span className="opacity-60">{count}</span>}
                    </button>
                  );
                })}
                
                {/* "More" expandable section */}
                <div className="mt-2">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider px-3 mb-1">More</div>
                  {['learn', 'paperwork', 'advisory', 'emergency', 'farewell', 'adopt', 'shop'].map(key => {
                    const pillar = PILLARS[key];
                    const count = stats.by_pillar[key] || 0;
                    return (
                      <button
                        key={key}
                        onClick={() => { setActiveNav('tickets'); setSelectedPillar(key); }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${
                          selectedPillar === key ? 'bg-emerald-600/80 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{pillar.emoji}</span>
                          <span>{pillar.name}</span>
                        </div>
                        {count > 0 && <span className="opacity-60">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* ==================== SPECIAL SECTIONS ==================== */}
          {!sidebarCollapsed && (
            <div className="mt-3 mb-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider px-3 mb-2">Special</div>
              <div className="space-y-0.5 px-1">
                {/* Mira AI */}
                <button
                  onClick={() => { setActiveNav('tickets'); setSelectedPillar('mira'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    selectedPillar === 'mira' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Mira AI</span>
                  </div>
                </button>
                
                {/* Membership */}
                <button
                  onClick={() => { setActiveNav('tickets'); setSelectedPillar('membership'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    selectedPillar === 'membership' ? 'bg-emerald-600/80 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Membership</span>
                  </div>
                </button>
                
                {/* Pet Parent Tickets */}
                <button
                  onClick={() => { setActiveNav('tickets'); setSelectedPillar('pet_parent'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    selectedPillar === 'pet_parent' ? 'bg-blue-600/80 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Account</span>
                  </div>
                  {stats.by_pillar?.pet_parent > 0 && (
                    <span className="text-xs bg-blue-500/30 px-1.5 rounded">{stats.by_pillar.pet_parent}</span>
                  )}
                </button>
                
                {/* Pet Profile Tickets */}
                <button
                  onClick={() => { setActiveNav('tickets'); setSelectedPillar('pet_profile'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    selectedPillar === 'pet_profile' ? 'bg-amber-600/80 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Dog className="w-4 h-4 text-amber-400" />
                    <span>Pet Updates</span>
                  </div>
                  {stats.by_pillar?.pet_profile > 0 && (
                    <span className="text-xs bg-amber-500/30 px-1.5 rounded">{stats.by_pillar.pet_profile}</span>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* ==================== DATA SECTIONS ==================== */}
          <div className="mt-4 px-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] uppercase text-slate-500 px-3 mb-2 tracking-wider">Data</div>
            )}
            <div className="space-y-1">
            {/* Pet Parents List */}
            <button
              onClick={() => setActiveNav('pet_parents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'pet_parents' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Pet Parents</span>}
              </div>
              {!sidebarCollapsed && petParents.length > 0 && (
                <span className="text-xs opacity-60">{petParents.length}</span>
              )}
            </button>
            
            {/* Pet Profiles List */}
            <button
              onClick={() => setActiveNav('pet_profiles')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'pet_profiles' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Dog className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Pet Profiles</span>}
              </div>
              {!sidebarCollapsed && petProfiles.length > 0 && (
                <span className="text-xs opacity-60">{petProfiles.length}</span>
              )}
            </button>
            </div>
          </div>
          
          {/* ==================== ORDERS & ANALYTICS ==================== */}
          <div className="mt-2 space-y-1 px-1">
            {/* Orders */}
            <button
              onClick={() => setActiveNav('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Orders</span>}
              </div>
              {!sidebarCollapsed && ordersData.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">{ordersData.length}</Badge>
              )}
            </button>
            
            {/* Analytics */}
            <button
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Analytics</span>}
              </div>
            </button>
            
            {/* Agent Performance */}
            <button
              onClick={() => { fetchAgentPerformance(); setShowPerformanceModal(true); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-slate-300 hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm">Agent Performance</span>}
              </div>
            </button>
          </div>
        </nav>
        
        {/* Bottom */}
        <div className="p-2 border-t border-slate-700">
          {/* SLA Breach Alert */}
          {(breachedTickets.length > 0 || approachingBreachTickets.length > 0) && !sidebarCollapsed && (
            <div className="mb-2 p-2 bg-red-900/30 rounded-lg">
              {breachedTickets.length > 0 && (
                <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{breachedTickets.length} SLA Breached</span>
                </div>
              )}
              {approachingBreachTickets.length > 0 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <Clock className="w-4 h-4" />
                  <span>{approachingBreachTickets.length} Approaching Breach</span>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 text-sm"
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
      
      {/* ==================== SETTINGS MODAL (Enhanced with Templates & Automation) ==================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
          <Card className="w-[800px] max-h-[90vh] overflow-hidden bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex h-full">
              {/* Settings Sidebar */}
              <div className="w-48 bg-gray-50 border-r p-4 flex flex-col">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
                <nav className="space-y-1 flex-1">
                  <button
                    onClick={() => setSettingsTab('status')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${settingsTab === 'status' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🏷️ Statuses & Categories
                  </button>
                  <button
                    onClick={() => setSettingsTab('templates')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${settingsTab === 'templates' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    📝 Templates
                  </button>
                  <button
                    onClick={() => setSettingsTab('automation')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${settingsTab === 'automation' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🤖 Automation
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${settingsTab === 'notifications' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    🔔 Notifications
                  </button>
                </nav>
                <button onClick={() => setShowSettingsModal(false)} className="mt-auto px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Close
                </button>
              </div>
              
              {/* Settings Content */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[90vh]">
                <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                
                {/* Statuses & Categories Tab */}
                {settingsTab === 'status' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Custom Ticket Statuses</h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newStatusName}
                          onChange={(e) => setNewStatusName(e.target.value)}
                          placeholder="New status name..."
                          className="flex-1"
                        />
                        <Button
                          onClick={async () => {
                            if (!newStatusName.trim()) return;
                            try {
                              await fetch(`${getApiUrl()}/api/tickets/statuses`, {
                                method: 'POST',
                                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: newStatusName.toLowerCase().replace(/\s+/g, '_'), label: newStatusName, color: 'blue' })
                              });
                              setNewStatusName('');
                              const res = await fetch(`${getApiUrl()}/api/tickets/statuses`, { headers: authHeaders });
                              if (res.ok) {
                                const data = await res.json();
                                setCustomStatuses(data.statuses?.filter(s => !s.is_default) || []);
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customStatuses.map(s => (
                          <Badge key={s.id} className="bg-blue-100 text-blue-700 pr-1">
                            {s.label || s.name}
                            <button
                              onClick={async () => {
                                await fetch(`${getApiUrl()}/api/tickets/statuses/${s.id}`, { method: 'DELETE', headers: authHeaders });
                                setCustomStatuses(prev => prev.filter(x => x.id !== s.id));
                              }}
                              className="ml-1 p-0.5 hover:bg-blue-200 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        {customStatuses.length === 0 && <span className="text-sm text-gray-400">No custom statuses</span>}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Custom Categories/Pillars</h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newCategoryEmoji}
                          onChange={(e) => setNewCategoryEmoji(e.target.value)}
                          placeholder="📁"
                          className="w-16 text-center"
                        />
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="New category name..."
                          className="flex-1"
                        />
                        <Button
                          onClick={async () => {
                            if (!newCategoryName.trim()) return;
                            try {
                              await fetch(`${getApiUrl()}/api/tickets/categories`, {
                                method: 'POST',
                                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: newCategoryName.toLowerCase().replace(/\s+/g, '_'), name: newCategoryName, emoji: newCategoryEmoji || '📁' })
                              });
                              setNewCategoryName('');
                              setNewCategoryEmoji('📁');
                              const res = await fetch(`${getApiUrl()}/api/tickets/categories`, { headers: authHeaders });
                              if (res.ok) {
                                const data = await res.json();
                                setCustomCategories(data.categories?.filter(c => !c.is_default) || []);
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customCategories.map(c => (
                          <Badge key={c.id} className="bg-purple-100 text-purple-700 pr-1">
                            {c.emoji} {c.name}
                            <button
                              onClick={async () => {
                                await fetch(`${getApiUrl()}/api/tickets/categories/${c.id}`, { method: 'DELETE', headers: authHeaders });
                                setCustomCategories(prev => prev.filter(x => x.id !== c.id));
                              }}
                              className="ml-1 p-0.5 hover:bg-purple-200 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        {customCategories.length === 0 && <span className="text-sm text-gray-400">No custom categories</span>}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Templates Tab */}
                {settingsTab === 'templates' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Response Templates</h3>
                      <Button
                        onClick={() => {
                          setTemplateForm({ name: '', type: 'email', subject: '', content: '', trigger: 'manual', trigger_status: '' });
                          setEditingTemplateId(null);
                          setShowTemplateModal(true);
                        }}
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Plus className="w-4 h-4 mr-1" /> New Template
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No templates yet. Create your first template!</p>
                        </div>
                      ) : (
                        templates.map(t => (
                          <div key={t.id} className="border rounded-lg p-4 hover:border-emerald-300 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{t.name}</span>
                                  <Badge className={`text-xs ${t.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {t.type === 'email' ? '📧 Email' : '📱 SMS'}
                                  </Badge>
                                  {t.trigger !== 'manual' && (
                                    <Badge className="text-xs bg-amber-100 text-amber-700">
                                      Auto: {t.trigger}
                                    </Badge>
                                  )}
                                </div>
                                {t.subject && <p className="text-sm text-gray-500 mb-1">Subject: {t.subject}</p>}
                                <p className="text-sm text-gray-600 line-clamp-2">{t.content}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  onClick={() => applyTemplate(t)}
                                  className="p-1.5 hover:bg-emerald-100 rounded text-emerald-600"
                                  title="Use Template"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEditingTemplate(t)}
                                  className="p-1.5 hover:bg-gray-100 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(t.id)}
                                  className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {/* Automation Tab */}
                {settingsTab === 'automation' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Auto-Acknowledge New Tickets</h3>
                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:border-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoMessageSettings.auto_acknowledge}
                          onChange={(e) => setAutoMessageSettings(prev => ({ ...prev, auto_acknowledge: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium">Auto-send acknowledgment</span>
                          <p className="text-sm text-gray-500">Automatically send a response when a new ticket is created</p>
                        </div>
                      </label>
                      {autoMessageSettings.auto_acknowledge && (
                        <select
                          value={autoMessageSettings.auto_acknowledge_template}
                          onChange={(e) => setAutoMessageSettings(prev => ({ ...prev, auto_acknowledge_template: e.target.value }))}
                          className="mt-2 w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Select acknowledgment template...</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Status Change Triggers</h3>
                      <p className="text-sm text-gray-500 mb-3">Automatically send messages when ticket status changes</p>
                      <div className="space-y-2">
                        {Object.entries(STATUS_CONFIG).map(([statusKey, statusVal]) => (
                          <div key={statusKey} className="flex items-center gap-3 p-2 border rounded-lg">
                            <span className="w-24 text-sm font-medium">{statusVal.label}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <select
                              value={autoMessageSettings.status_triggers?.[statusKey] || ''}
                              onChange={(e) => setAutoMessageSettings(prev => ({
                                ...prev,
                                status_triggers: { ...prev.status_triggers, [statusKey]: e.target.value }
                              }))}
                              className="flex-1 px-2 py-1.5 border rounded text-sm"
                            >
                              <option value="">No auto-message</option>
                              {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                      <Button 
                        onClick={async () => {
                          try {
                            await fetch(`${getApiUrl()}/api/tickets/settings/automation`, {
                              method: 'POST',
                              headers: { ...authHeaders, 'Content-Type': 'application/json' },
                              body: JSON.stringify(autoMessageSettings)
                            });
                            // Show success
                          } catch (err) { console.error(err); }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        Save Automation Settings
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Notifications Tab */}
                {settingsTab === 'notifications' && (
                  <div className="space-y-6">
                    {/* Browser Notification Permission */}
                    <div className={`p-4 rounded-lg border-2 ${notificationsEnabled ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationsEnabled ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            <Bell className={`w-5 h-5 ${notificationsEnabled ? 'text-emerald-600' : 'text-amber-600'}`} />
                          </div>
                          <div>
                            <span className="font-medium">Browser Notifications</span>
                            <p className="text-sm text-gray-500">
                              {notificationsEnabled 
                                ? '✓ Enabled - You will receive desktop notifications'
                                : 'Enable to receive desktop alerts for new tickets'}
                            </p>
                          </div>
                        </div>
                        {!notificationsEnabled ? (
                          <Button
                            onClick={requestNotificationPermission}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            Enable Notifications
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">Enabled</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border rounded-lg hover:border-emerald-300 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                              <span className="font-medium">New ticket alerts</span>
                              <p className="text-sm text-gray-500">Get notified when new tickets arrive</p>
                            </div>
                          </div>
                          <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg hover:border-emerald-300 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <div>
                              <span className="font-medium">New message alerts</span>
                              <p className="text-sm text-gray-500">Get notified when customers reply</p>
                            </div>
                          </div>
                          <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg hover:border-emerald-300 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-gray-400" />
                            <div>
                              <span className="font-medium">Sound notifications</span>
                              <p className="text-sm text-gray-500">Play sound for new notifications</p>
                            </div>
                          </div>
                          <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Real-time Connection</span>
                        <div className={`flex items-center gap-2 text-sm ${connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                          {connected ? 'Connected' : 'Reconnecting...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Template Creation/Edit Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowTemplateModal(false)}>
          <Card className="w-full max-w-[500px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{editingTemplateId ? 'Edit Template' : 'Create Template'}</h3>
                <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Template Name *</label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Response"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="email">📧 Email</option>
                      <option value="sms">📱 SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Trigger</label>
                    <select
                      value={templateForm.trigger}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, trigger: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="manual">Manual Only</option>
                      <option value="new_ticket">On New Ticket</option>
                      <option value="status_change">On Status Change</option>
                    </select>
                  </div>
                </div>
                
                {templateForm.type === 'email' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Subject Line</label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., We received your request - {{ticket_id}}"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Content *</label>
                  <Textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Hi {{customer_name}},&#10;&#10;Thank you for reaching out..."
                    rows={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Variables: {"{{customer_name}}, {{ticket_id}}, {{pet_name}}, {{status}}"}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={!templateForm.name.trim() || !templateForm.content.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {editingTemplateId ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* ==================== MAIN CONTENT ==================== */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${isMobile ? 'pb-16' : ''}
        ${isMobile && mobileView === 'sidebar' ? 'hidden' : ''}
      `}>
        
        {/* ==================== TOP HEADER ==================== */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-2 md:px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Menu button for mobile */}
            {isMobile ? (
              <button
                onClick={() => setMobileView('sidebar')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <X className="w-5 h-5 text-gray-400" />}
              </button>
            )}
            
            {/* Global Search with Type Selector */}
            <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="h-9 md:h-10 px-1 md:px-2 text-xs border rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
              >
                <option value="all">All</option>
                <option value="pet">🐕 Pet</option>
                <option value="pet_parent">👤 Parent</option>
                <option value="subject">📝 Subject</option>
                <option value="pillar">🏷️ Pillar</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={searchType === 'pet' ? 'Search by pet name...' : searchType === 'pet_parent' ? 'Search by parent name/email...' : 'Search tickets...'}
                  className="w-80 pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* New Ticket Button with Dropdown */}
            <div className="relative">
              <Button 
                onClick={() => setShowNewTicketModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 gap-1 md:gap-2 shadow-sm text-xs md:text-sm px-2 md:px-4"
                data-testid="new-ticket-btn"
              >
                <Plus className="w-4 h-4" /> 
                <span className="hidden sm:inline">New Ticket</span>
              </Button>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="icon" className="shadow-sm w-8 h-8 md:w-9 md:h-9" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleExportCSV} 
              variant="outline" 
              size="sm" 
              className="shadow-sm gap-1 md:gap-2 hidden sm:flex"
              disabled={!tickets || tickets.length === 0}
              title={`Export ${tickets?.length || 0} tickets to CSV`}
              data-testid="export-csv-btn"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </Button>
            {/* Notification Bell */}
            <div className="relative hidden sm:block">
              <button 
                onClick={() => {
                  if (notificationPermission !== 'granted') {
                    requestNotificationPermission();
                  }
                }}
                className={`p-2 hover:bg-gray-100 rounded-lg relative ${notificationsEnabled ? 'text-emerald-600' : 'text-gray-500'}`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Click to enable notifications'}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {!notificationsEnabled && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-white" title="Notifications disabled" />
                )}
              </button>
            </div>
            
            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) {
                  // Play test sound when enabling
                  playNotificationSound();
                }
              }}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-600' : 'text-gray-400'}`}
              title={soundEnabled ? 'Sound alerts ON (click to mute)' : 'Sound alerts OFF (click to enable)'}
              data-testid="sound-toggle-btn"
            >
              {soundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              )}
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
        
        {/* ==================== NEW TICKET MODAL ==================== */}
        {showNewTicketModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewTicketModal(false)}>
            <Card className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create New Ticket</h2>
                  <button onClick={() => setShowNewTicketModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Type Selection */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: 'ticket', label: '📋 Ticket', desc: 'Support request' },
                      { type: 'inquiry', label: '❓ Inquiry', desc: 'General question' },
                      { type: 'booking', label: '📅 Booking', desc: 'Reservation' },
                      { type: 'order', label: '🛒 Order', desc: 'Shop order' }
                    ].map(t => (
                      <button
                        key={t.type}
                        onClick={() => setNewTicketForm(prev => ({ ...prev, type: t.type, category: t.type }))}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          newTicketForm.type === t.type ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg">{t.label.split(' ')[0]}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Pillar Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Pillar</label>
                    <select
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border"
                    >
                      {Object.entries(PILLARS).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high', 'urgent', 'critical'].map(p => (
                        <button
                          key={p}
                          onClick={() => setNewTicketForm(prev => ({ ...prev, urgency: p }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                            newTicketForm.urgency === p 
                              ? p === 'critical' || p === 'urgent' ? 'bg-red-500 text-white' : p === 'high' ? 'bg-orange-500 text-white' : p === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Subject */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Subject *</label>
                    <Input
                      value={newTicketForm.subject}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of the issue or request"
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                    <Textarea
                      value={newTicketForm.description}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed information..."
                      rows={4}
                    />
                  </div>
                  
                  {/* Quick Select - Pet Parent & Pet Profile */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div>
                      <label className="text-sm font-medium text-emerald-700 mb-2 block flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Quick Select Pet Parent
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        onChange={(e) => {
                          const parent = petParents.find(p => p.email === e.target.value);
                          if (parent) {
                            setNewTicketForm(prev => ({
                              ...prev,
                              member_name: parent.name || parent.full_name || '',
                              member_email: parent.email || '',
                              member_phone: parent.whatsapp_number || parent.phone || ''
                            }));
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">-- Select existing pet parent --</option>
                        {petParents.map((parent, idx) => (
                          <option key={idx} value={parent.email}>
                            {parent.name || parent.full_name} ({parent.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-emerald-700 mb-2 block flex items-center gap-2">
                        <PawPrint className="w-4 h-4" />
                        Quick Select Pet Profile
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        onChange={(e) => {
                          const pet = petProfiles.find(p => p.id === e.target.value);
                          if (pet) {
                            setNewTicketForm(prev => ({
                              ...prev,
                              pet_name: pet.name || '',
                              // Also populate owner info if available and form is empty
                              member_email: prev.member_email || pet.owner_email || '',
                              member_name: prev.member_name || pet.owner_name || ''
                            }));
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">-- Select existing pet --</option>
                        {petProfiles.map((pet, idx) => (
                          <option key={idx} value={pet.id}>
                            {pet.name} ({pet.breed || 'Unknown breed'}) - {pet.owner_email || 'No owner'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Pet Parent Name</label>
                      <Input
                        value={newTicketForm.member_name}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, member_name: e.target.value }))}
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                      <Input
                        value={newTicketForm.member_email}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, member_email: e.target.value }))}
                        placeholder="email@example.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Phone</label>
                      <Input
                        value={newTicketForm.member_phone}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, member_phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Pet Name</label>
                      <Input
                        value={newTicketForm.pet_name}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, pet_name: e.target.value }))}
                        placeholder="Pet's name"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreateTicket}
                    disabled={!newTicketForm.subject.trim() || sending}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Ticket
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* ==================== REMINDER/TASK MODAL ==================== */}
        {showReminderModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[420px] p-6 bg-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Add Reminder / Task
                </h3>
                <button onClick={() => setShowReminderModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                  <Input
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Follow up with customer"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                  <Textarea
                    value={reminderForm.description}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional details..."
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={reminderForm.due_at}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, due_at: new Date(e.target.value).toISOString() }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                    <select
                      value={reminderForm.reminder_type}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, reminder_type: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md border"
                    >
                      <option value="follow_up">📞 Follow Up</option>
                      <option value="call_back">🔔 Call Back</option>
                      <option value="task">✅ Task</option>
                      <option value="deadline">⏰ Deadline</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        onClick={() => setReminderForm(prev => ({ ...prev, priority: p }))}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          reminderForm.priority === p 
                            ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReminderModal(false)}>Cancel</Button>
                <Button 
                  onClick={createReminder}
                  disabled={!reminderForm.title || !reminderForm.due_at}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Create Reminder
                </Button>
              </div>
            </Card>
          </div>
        )}
        
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
              <div className={`
                flex-1 flex flex-col min-w-0 bg-white border-r 
                ${viewMode === 'kanban' ? 'hidden' : ''}
                ${isMobile && mobileView === 'detail' && selectedTicket ? 'hidden' : ''}
              `}>
                {/* List Header */}
                <div className="px-2 md:px-4 py-2 border-b flex items-center justify-between flex-shrink-0 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{tickets.length}</span>
                    <span className="hidden sm:inline">tickets</span>
                    {selectedPillar !== 'all' && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        {PILLARS[selectedPillar]?.emoji} {PILLARS[selectedPillar]?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-white rounded-lg border shadow-sm p-0.5 mr-1">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                        title="List View (Alt+1)"
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'kanban' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Kanban Board (Alt+2)"
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
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
                
                {/* Bulk Actions Bar */}
                {selectedTicketIds.length > 0 && (
                  <div className="px-4 py-2 bg-emerald-50 border-b flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTicketIds.length === tickets.length}
                        onChange={selectAllTickets}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-emerald-700">
                        {selectedTicketIds.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => { handleBulkStatusChange(e.target.value); e.target.value = ''; }}
                        className="text-xs rounded px-2 py-1.5 border bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Change Status</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <select
                        onChange={(e) => { handleBulkAssign(e.target.value); e.target.value = ''; }}
                        className="text-xs rounded px-2 py-1.5 border bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign To</option>
                        {agents.map(a => (
                          <option key={a.id || a.name} value={a.id || a.name}>{a.name}</option>
                        ))}
                      </select>
                      
                      {/* More Actions Dropdown (like Zoho) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1">
                            <MoreVertical className="w-3.5 h-3.5" />
                            More
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleBulkStatusChange('resolved')}
                            className="text-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-600" />
                            Close
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setShowMergeModal(true)}
                            className="text-xs cursor-pointer"
                            disabled={selectedTicketIds.length < 2}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-2 text-purple-600" />
                            Merge Tickets
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              if (window.confirm(`Delete ${selectedTicketIds.length} ticket(s)? This cannot be undone.`)) {
                                handleBulkDelete();
                              }
                            }}
                            className="text-xs cursor-pointer text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicketIds([])}
                        className="text-gray-500 hover:text-gray-700 h-7 w-7 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
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
                    tickets.map((ticket, idx) => {
                      const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new;
                      const priority = PRIORITY_CONFIG[ticket.urgency] || PRIORITY_CONFIG.medium;
                      const pillar = PILLARS[ticket.category];
                      const channel = CHANNELS[ticket.channel] || CHANNELS.web;
                      const ChannelIcon = channel.icon;
                      const isSelected = selectedTicketIds.includes(ticket.ticket_id);
                      
                      return (
                        <div
                          key={`${ticket.ticket_id}-${ticket.source || 'ticket'}-${idx}`}
                          className={`px-4 py-3 border-b cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedTicket?.ticket_id === ticket.ticket_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          } ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox for bulk selection */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => { e.stopPropagation(); toggleTicketSelection(ticket.ticket_id); }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 mt-0.5"
                            />
                            
                            {/* Priority + Pillar */}
                            <div 
                              className="flex flex-col items-center gap-1"
                              onClick={() => handleSelectTicket(ticket)}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} title={priority.label} />
                              {pillar && <span className="text-sm" title={pillar.name}>{pillar.emoji}</span>}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0" onClick={() => handleSelectTicket(ticket)}>
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
                                {/* SLA Timer in List */}
                                {ticket.sla_status && (
                                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                                    ticket.sla_status.status === 'breached' ? 'bg-red-100 text-red-600' :
                                    ticket.sla_status.status === 'critical' ? 'bg-orange-100 text-orange-600' :
                                    ticket.sla_status.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                                    'bg-emerald-100 text-emerald-600'
                                  }`}>
                                    <Timer className="w-3 h-3" />
                                    {formatSlaTime(ticket.sla_status)?.text}
                                  </span>
                                )}
                                {/* Pending Reminders Badge */}
                                {ticket.pending_reminders_count > 0 && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">
                                    <Bell className="w-3 h-3" />
                                    {ticket.pending_reminders_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* ==================== KANBAN VIEW ==================== */}
              {viewMode === 'kanban' && (
                <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
                  {/* Kanban Header */}
                  <div className="px-4 py-2 border-b flex items-center justify-between flex-shrink-0 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold">Kanban Board</span>
                      <span>•</span>
                      <span className="font-medium">{tickets.length}</span>
                      <span>tickets</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-white rounded-lg border shadow-sm p-0.5 mr-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                          title="List View (Alt+1)"
                        >
                          <LayoutList className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('kanban')}
                          className={`p-1.5 rounded transition-all ${viewMode === 'kanban' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                          title="Kanban Board (Alt+2)"
                        >
                          <Columns3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Kanban Board */}
                  <div className="flex-1 overflow-auto p-4 bg-gray-100">
                    <KanbanBoard 
                      tickets={tickets} 
                      onSelectTicket={(ticketId) => {
                        const ticket = tickets.find(t => t.ticket_id === ticketId);
                        if (ticket) handleSelectTicket(ticket);
                      }}
                      onStatusChange={handleStatusChange}
                      loading={loading}
                    />
                  </div>
                </div>
              )}
              
              {/* ==================== TICKET DETAIL DRAWER (3/4 Screen Slide-out) ==================== */}
              {selectedTicket && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isMobile && mobileView !== 'detail' ? 'hidden' : ''}`}
                    onClick={() => { setSelectedTicket(null); if(isMobile) setMobileView('list'); }}
                  />
                  
                  {/* Slide-out Drawer - Full screen on mobile */}
                  <div className={`
                    fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out animate-slide-in-right
                    ${isMobile 
                      ? `w-full ${mobileView === 'detail' ? 'translate-x-0' : 'translate-x-full'} pb-16` 
                      : 'w-3/4 max-w-[1200px] min-w-[600px]'
                    }
                  `}>
                  {/* Detail Header */}
                  <div className="px-3 md:px-6 py-3 md:py-4 border-b flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                        {/* Back button for mobile */}
                        {isMobile && (
                          <button 
                            onClick={() => { setSelectedTicket(null); setMobileView('list'); }}
                            className="p-2 -ml-2 hover:bg-white/50 rounded"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                          </button>
                        )}
                        {PILLARS[selectedTicket.category] && (
                          <span className="text-xl md:text-2xl">{PILLARS[selectedTicket.category].emoji}</span>
                        )}
                        <span className="font-mono text-xs md:text-sm text-gray-500 bg-white px-2 py-1 rounded truncate max-w-[120px] md:max-w-none">{selectedTicket.ticket_id}</span>
                        <button 
                          onClick={startEditingTicket}
                          className="p-1.5 hover:bg-white/50 rounded flex-shrink-0"
                          title="Edit Ticket"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-emerald-600" />
                        </button>
                        {/* Agent Collision Warning */}
                        {activeAgents[selectedTicket.ticket_id]?.filter(a => a !== adminUser).length > 0 && (
                          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Also viewing: {activeAgents[selectedTicket.ticket_id].filter(a => a !== adminUser).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      {/* Inline Subject Editing */}
                      {editingSubject ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="flex-1 text-base md:text-lg font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveSubject();
                              if (e.key === 'Escape') setEditingSubject(false);
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={saveSubject} className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSubject(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 
                          className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-emerald-600 group"
                          onClick={startEditingSubject}
                          title="Click to edit subject"
                        >
                          {selectedTicket.subject || selectedTicket.description?.slice(0, 60)}
                          <Edit className="w-3 h-3 inline ml-2 opacity-0 group-hover:opacity-50" />
                        </h3>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Pillar Selector */}
                      <select
                        value={selectedTicket.category || ''}
                        onChange={(e) => handleStatusChange(selectedTicket.status)} // Will update via edit
                        className="text-sm rounded px-3 py-2 bg-white border"
                        title="Change Pillar"
                      >
                        {Object.entries(PILLARS).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.name}</option>
                        ))}
                      </select>
                      {/* Status Selector */}
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`text-sm rounded-full px-4 py-2 font-medium ${STATUS_CONFIG[selectedTicket.status]?.bgLight} ${STATUS_CONFIG[selectedTicket.status]?.textColor} border-0`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                        {customStatuses.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setSelectedTicket(null)} 
                        className="p-2 hover:bg-gray-100 rounded-full ml-2"
                        title="Close (Esc)"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* ==================== SLA TIMER & REMINDERS BAR ==================== */}
                  <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                    {/* SLA Timer */}
                    {(() => {
                      const sla = formatSlaTime(selectedTicket.sla_status);
                      if (!sla) return <div className="text-xs text-gray-400">No SLA set</div>;
                      return (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                          sla.status === 'breached' ? 'bg-red-100 text-red-700' :
                          sla.status === 'critical' ? 'bg-orange-100 text-orange-700' :
                          sla.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Timer className={`w-3.5 h-3.5 ${sla.isBreached ? 'animate-pulse' : ''}`} />
                          <span>{sla.isBreached ? '⚠️ SLA ' : 'SLA: '}{sla.text}</span>
                        </div>
                      );
                    })()}
                    
                    {/* Reminders Button */}
                    <div className="flex items-center gap-2">
                      {ticketReminders.filter(r => r.status !== 'completed').length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          {ticketReminders.filter(r => r.status !== 'completed').length} pending
                        </Badge>
                      )}
                      <button
                        onClick={() => setShowReminderModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border rounded-full hover:bg-gray-50"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Add Reminder
                      </button>
                      
                      {/* Lock/Unlock Button */}
                      <button
                        onClick={() => toggleTicketLock(selectedTicket.ticket_id, selectedTicket.is_locked)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-colors ${
                          selectedTicket.is_locked 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200' 
                            : 'bg-white border hover:bg-gray-50'
                        }`}
                        title={selectedTicket.is_locked ? 'Unlock ticket (allow customer replies)' : 'Lock ticket (prevent customer replies)'}
                      >
                        {selectedTicket.is_locked ? (
                          <>🔒 Locked</>
                        ) : (
                          <>🔓 Lock</>
                        )}
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => confirmDeleteTicket(selectedTicket)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-red-200 text-red-600 rounded-full hover:bg-red-50 hover:border-red-300"
                        title="Delete ticket permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                      
                      {/* Merge Button */}
                      {selectedTicketIds.length > 0 && selectedTicketIds.includes(selectedTicket?.ticket_id) && (
                        <button
                          onClick={() => setShowMergeModal(true)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-100 text-purple-700 border border-purple-200 rounded-full hover:bg-purple-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Merge {selectedTicketIds.length} Tickets
                        </button>
                      )}
                      
                      {/* Quote Builder Button - for Celebrate/Party tickets */}
                      {(selectedTicket.category === 'celebrate' || selectedTicket.category === 'party_planning' || 
                        selectedTicket.source === 'party_wizard' || selectedTicket.party_request_id ||
                        selectedTicket.ticket_id?.startsWith('CEL-')) && (
                        <button
                          onClick={() => openQuoteBuilder(selectedTicket)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full hover:from-amber-600 hover:to-orange-600"
                          title="Create quote for this party request"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Create Quote
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* ==================== TAGS BAR ==================== */}
                  <div className="px-4 py-2 border-b bg-white flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Tags:</span>
                    {(selectedTicket.tags || []).map(tag => (
                      <Badge 
                        key={tag} 
                        className="bg-gray-100 text-gray-700 text-xs pr-1 hover:bg-gray-200"
                      >
                        {tag}
                        <button 
                          onClick={() => removeTagFromTicket(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag..."
                        className="h-6 w-24 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            addTagToTicket(newTag);
                          }
                        }}
                        list="tag-suggestions"
                      />
                      <datalist id="tag-suggestions">
                        {allTags.filter(t => !selectedTicket.tags?.includes(t)).map(t => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                      <button
                        onClick={() => addTagToTicket(newTag)}
                        disabled={!newTag.trim()}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* ==================== REMINDERS LIST (if any) ==================== */}
                  {ticketReminders.length > 0 && (
                    <div className="px-4 py-2 border-b bg-amber-50/50 max-h-32 overflow-y-auto">
                      <div className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <Bell className="w-3 h-3" /> Reminders & Tasks
                      </div>
                      <div className="space-y-1.5">
                        {ticketReminders.map(reminder => (
                          <div 
                            key={reminder.id} 
                            className={`flex items-center justify-between text-xs p-2 rounded ${
                              reminder.status === 'completed' ? 'bg-gray-100 text-gray-500 line-through' :
                              reminder.is_overdue ? 'bg-red-100 text-red-700' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={reminder.status === 'completed'}
                                onChange={() => reminder.status !== 'completed' && completeReminder(reminder.id)}
                                className="w-3.5 h-3.5"
                              />
                              <span className="truncate">{reminder.title}</span>
                              {reminder.is_overdue && reminder.status !== 'completed' && (
                                <span className="text-red-600">⚠️ Overdue</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <span>{new Date(reminder.due_at).toLocaleDateString()}</span>
                              <button onClick={() => deleteReminder(reminder.id)} className="hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* ==================== TICKET EDIT MODAL ==================== */}
                  {isEditingTicket && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
                      <Card className="w-[400px] p-6 bg-white shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Edit Ticket</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Subject</label>
                            <Input
                              value={editForm.subject || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Pillar</label>
                            <select
                              value={editForm.category || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full h-10 px-3 rounded-md border"
                            >
                              {Object.entries(PILLARS).map(([k, v]) => (
                                <option key={k} value={k}>{v.emoji} {v.name}</option>
                              ))}
                              {customCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.emoji || '📁'} {c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                              <select
                                value={editForm.status || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border"
                              >
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                                {customStatuses.map(s => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
                              <select
                                value={editForm.urgency || 'medium'}
                                onChange={(e) => setEditForm(prev => ({ ...prev, urgency: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Assigned To</label>
                            <Input
                              value={editForm.assigned_to || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                              placeholder="Agent name or ID"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <Button variant="ghost" onClick={() => setIsEditingTicket(false)}>Cancel</Button>
                          <Button onClick={saveTicketEdits} disabled={sending} className="bg-emerald-500 hover:bg-emerald-600">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}
                  
                  {/* Tabs */}
                  <div className="flex border-b flex-shrink-0">
                    {['conversation', 'context', 'attachments', 'history'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`flex-1 px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${
                          detailTab === tab
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab === 'conversation' && <MessageSquare className="w-3.5 h-3.5 inline mr-1" />}
                        {tab === 'context' && <PawPrint className="w-3.5 h-3.5 inline mr-1" />}
                        {tab === 'attachments' && <Paperclip className="w-3.5 h-3.5 inline mr-1" />}
                        {tab === 'history' && <History className="w-3.5 h-3.5 inline mr-1" />}
                        {tab === 'attachments' ? 'Files' : tab}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    
                    {/* CONVERSATION TAB */}
                    {detailTab === 'conversation' && (
                      <div className="p-4">
                        
                        {/* ==================== INTELLIGENT SUMMARY ==================== */}
                        {(conversationSummary || summaryLoading) && (
                          <Card className="p-3 mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">AI Summary</span>
                              {summaryLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-500" />}
                            </div>
                            {conversationSummary ? (
                              <p className="text-sm text-gray-700 leading-relaxed">{conversationSummary}</p>
                            ) : (
                              <p className="text-sm text-purple-400 italic">Generating summary...</p>
                            )}
                          </Card>
                        )}
                        
                        {/* ==================== PET SOUL PROMPTS ==================== */}
                        {petSoulPrompts && (
                          <Card className="p-3 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pet Soul Insights</span>
                            </div>
                            <div className="space-y-2">
                              {Array.isArray(petSoulPrompts) ? petSoulPrompts.slice(0, 3).map((prompt, idx) => (
                                <div key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                                  <span className="text-amber-500">•</span>
                                  <span>{prompt}</span>
                                </div>
                              )) : (
                                <p className="text-xs text-amber-700">{petSoulPrompts}</p>
                              )}
                            </div>
                          </Card>
                        )}
                        
                        {/* Customer & Pet Info Bar */}
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
                            {/* Pet Info Badge */}
                            {(selectedTicket.pet_info?.name || petProfile?.name) && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                <PawPrint className="w-3 h-3 mr-1" />
                                {selectedTicket.pet_info?.name || petProfile?.name}
                              </Badge>
                            )}
                            {/* Auto-populated Pet Parent & Pet */}
                            {memberProfile && !selectedTicket.member?.name && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                <User className="w-3 h-3 mr-1" />
                                {memberProfile.name}
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
                            const isAgent = msg.direction === 'outgoing' || msg.is_agent_reply || msg.sender === 'concierge';
                            const hasAttachments = msg.attachments?.length > 0;
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
                                    
                                    {/* Attachments in message */}
                                    {hasAttachments && (
                                      <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                                        {msg.attachments.map((att, attIdx) => (
                                          <div key={attIdx} className={`flex items-center gap-2 p-2 rounded ${isAgent && !msg.is_internal ? 'bg-white/10' : 'bg-gray-50'}`}>
                                            {att.type === 'image' ? (
                                              <>
                                                <img 
                                                  src={`${getApiUrl()}${att.file_url || att.url}`} 
                                                  alt={att.filename} 
                                                  className="w-16 h-16 rounded object-cover cursor-pointer"
                                                  onClick={() => window.open(`${getApiUrl()}${att.file_url || att.url}`, '_blank')}
                                                />
                                                <span className={`text-xs ${isAgent && !msg.is_internal ? 'text-white/80' : 'text-gray-600'}`}>
                                                  {att.filename}
                                                </span>
                                              </>
                                            ) : att.type === 'voice' ? (
                                              <>
                                                <Volume2 className={`w-5 h-5 ${isAgent && !msg.is_internal ? 'text-white' : 'text-blue-500'}`} />
                                                <audio 
                                                  controls 
                                                  src={`${getApiUrl()}${att.file_url || att.url}`}
                                                  className="h-8 max-w-[200px]"
                                                />
                                              </>
                                            ) : (
                                              <>
                                                <FileText className={`w-5 h-5 ${isAgent && !msg.is_internal ? 'text-white' : 'text-gray-500'}`} />
                                                <a 
                                                  href={`${getApiUrl()}${att.file_url || att.url}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`text-xs underline ${isAgent && !msg.is_internal ? 'text-white' : 'text-blue-600'}`}
                                                >
                                                  {att.filename}
                                                </a>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-2 text-[10px] text-gray-400 mt-1 ${isAgent ? 'justify-end' : ''}`}>
                                    {msg.channel && msg.channel !== 'internal' && (
                                      <>
                                        <span className={CHANNELS[msg.channel]?.color}>
                                          via {CHANNELS[msg.channel]?.label || msg.channel}
                                        </span>
                                        <span>•</span>
                                      </>
                                    )}
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
                    
                    {/* ATTACHMENTS TAB */}
                    {detailTab === 'attachments' && (
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                          Ticket Attachments
                        </h4>
                        
                        {selectedTicket.attachments?.length > 0 ? (
                          <div className="space-y-3">
                            {selectedTicket.attachments.map((att, idx) => (
                              <Card key={idx} className="p-3">
                                <div className="flex items-center gap-3">
                                  {/* File Type Icon */}
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    att.type === 'image' ? 'bg-purple-100' :
                                    att.type === 'voice' ? 'bg-blue-100' :
                                    'bg-gray-100'
                                  }`}>
                                    {att.type === 'image' ? (
                                      <Image className="w-5 h-5 text-purple-600" />
                                    ) : att.type === 'voice' ? (
                                      <Volume2 className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <FileText className="w-5 h-5 text-gray-600" />
                                    )}
                                  </div>
                                  
                                  {/* File Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 truncate">
                                      {att.filename || att.stored_filename}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                      <span>{att.type}</span>
                                      {att.size && <span>• {Math.round(att.size / 1024)}KB</span>}
                                      {att.uploaded_at && <span>• {formatTime(att.uploaded_at)}</span>}
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    {att.type === 'image' && (
                                      <button
                                        onClick={() => window.open(`${getApiUrl()}${att.file_url}`, '_blank')}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                        title="Preview"
                                      >
                                        <Eye className="w-4 h-4 text-gray-500" />
                                      </button>
                                    )}
                                    {att.type === 'voice' && (
                                      <audio 
                                        controls 
                                        src={`${getApiUrl()}${att.file_url}`}
                                        className="h-8 max-w-[150px]"
                                      />
                                    )}
                                    <a
                                      href={`${getApiUrl()}${att.file_url}`}
                                      download
                                      className="p-2 hover:bg-gray-100 rounded-lg"
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4 text-gray-500" />
                                    </a>
                                  </div>
                                </div>
                                
                                {/* Image Preview */}
                                {att.type === 'image' && (
                                  <div className="mt-3">
                                    <img 
                                      src={`${getApiUrl()}${att.file_url}`}
                                      alt={att.filename}
                                      className="w-full max-h-48 object-cover rounded-lg cursor-pointer"
                                      onClick={() => window.open(`${getApiUrl()}${att.file_url}`, '_blank')}
                                    />
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-12">
                            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No attachments yet</p>
                            <p className="text-xs mt-1">
                              Attachments will appear here when added to the conversation
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* ==================== REPLY COMPOSER ==================== */}
                  {detailTab === 'conversation' && (
                    <div className="border-t p-4 flex-shrink-0 bg-gray-50">
                      {/* Hidden file inputs */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelect(e, 'document')}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={(e) => handleFileSelect(e, 'image')}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                      />
                      
                      {/* AI Suggestion with 5 Styles */}
                      {aiSuggestion && (
                        <Card className="p-3 mb-3 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Mira&apos;s Suggestion ({AI_REPLY_STYLES.find(s => s.id === aiReplyStyle)?.label})
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
                          <p className="text-sm text-gray-700 mb-3">{aiSuggestion}</p>
                          
                          {/* 5 AI Reply Styles */}
                          <div className="border-t pt-2">
                            <div className="text-[10px] text-purple-600 mb-1.5">Try a different style:</div>
                            <div className="flex flex-wrap gap-1">
                              {AI_REPLY_STYLES.filter(s => s.id !== aiReplyStyle).map(style => (
                                <button
                                  key={style.id}
                                  onClick={() => { setAiReplyStyle(style.id); generateAiReply(style.id); }}
                                  disabled={aiLoading}
                                  className="px-2 py-1 text-[10px] rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                >
                                  {style.icon} {style.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </Card>
                      )}
                      
                      {/* Voice Recording UI */}
                      {isRecording && (
                        <Card className="p-3 mb-3 bg-red-50 border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-sm font-medium text-red-700">Recording...</span>
                              <span className="text-lg font-mono text-red-600">{formatRecordingTime(recordingTime)}</span>
                            </div>
                            <Button size="sm" onClick={stopRecording} variant="destructive" className="h-7">
                              <StopCircle className="w-4 h-4 mr-1" /> Stop
                            </Button>
                          </div>
                        </Card>
                      )}
                      
                      {/* Audio Preview */}
                      {audioBlob && !isRecording && (
                        <Card className="p-3 mb-3 bg-blue-50 border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Volume2 className="w-5 h-5 text-blue-600" />
                              <span className="text-sm text-blue-700">Voice Recording ({formatRecordingTime(recordingTime)})</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="h-7 text-xs">
                                Discard
                              </Button>
                              <Button size="sm" onClick={uploadVoiceRecording} disabled={uploadingAttachment} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                                {uploadingAttachment ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                                Attach
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                      
                      {/* Attachments Preview */}
                      {attachments.length > 0 && (
                        <Card className="p-3 mb-3 bg-gray-100 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">{attachments.length} attachment(s)</span>
                            <Button size="sm" variant="ghost" onClick={clearAttachments} className="h-6 text-xs text-red-600">
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map(att => (
                              <div key={att.id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 border">
                                {att.type === 'image' && att.preview ? (
                                  <img src={att.preview} alt="" className="w-8 h-8 rounded object-cover" />
                                ) : att.type === 'voice' ? (
                                  <Volume2 className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="text-xs text-gray-700 max-w-[100px] truncate">{att.name}</span>
                                <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-700">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
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
                        
                        {/* AI Reply Styles Dropdown */}
                        <div className="flex items-center gap-1">
                          <select
                            value={aiReplyStyle}
                            onChange={(e) => setAiReplyStyle(e.target.value)}
                            className="h-7 px-2 text-xs border rounded bg-purple-50 text-purple-700"
                          >
                            {AI_REPLY_STYLES.map(style => (
                              <option key={style.id} value={style.id}>{style.icon} {style.label}</option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateAiReply(aiReplyStyle)}
                            disabled={aiLoading}
                            className="text-purple-600 hover:text-purple-700 text-xs h-7"
                          >
                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                            Ask Mira
                          </Button>
                        </div>
                      </div>
                      
                      <RichTextEditor
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={isInternal ? "Add internal note (not visible to customer)..." : `Reply to ${selectedTicket.member?.name || 'customer'}...`}
                        minHeight="120px"
                        showAI={true}
                        onAIGenerate={() => generateAiReply(aiReplyStyle)}
                        aiLoading={aiLoading}
                        className={isInternal ? 'border-amber-300 bg-amber-50/50' : ''}
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {/* Document attachment */}
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="p-2 hover:bg-white rounded transition-colors disabled:opacity-50"
                            title="Attach Document"
                          >
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {/* Image attachment */}
                          <button 
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="p-2 hover:bg-white rounded transition-colors disabled:opacity-50"
                            title="Attach Image"
                          >
                            <Image className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {/* Voice recording */}
                          <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={uploadingAttachment || !!audioBlob}
                            className={`p-2 rounded transition-colors disabled:opacity-50 ${
                              isRecording ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-white'
                            }`}
                            title={isRecording ? 'Stop Recording' : 'Record Voice Message'}
                          >
                            {isRecording ? (
                              <MicOff className="w-4 h-4 text-red-500" />
                            ) : (
                              <Mic className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          
                          {uploadingAttachment && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-2" />
                          )}
                        </div>
                        
                        <Button
                          onClick={handleReply}
                          disabled={(!replyText || !replyText.replace(/<[^>]*>/g, '').trim()) && attachments.length === 0 || sending}
                          className={`px-6 ${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {isInternal ? 'Add Note' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}
            </>
          )}
          
          {/* Dashboard placeholder */}
          {activeNav === 'dashboard' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
              
              {/* Today's Ticket Ticker */}
              <Card className="mb-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      Today&apos;s Ticket Ticker
                    </h3>
                    <Badge className="bg-emerald-500 text-white">
                      {allTickets.filter(t => {
                        const today = new Date().toDateString();
                        return new Date(t.created_at).toDateString() === today;
                      }).length} today
                    </Badge>
                  </div>
                  <div className="relative h-16 overflow-hidden">
                    <div className="flex gap-4 animate-marquee">
                      {allTickets
                        .filter(t => {
                          const today = new Date();
                          const ticketDate = new Date(t.created_at);
                          const daysDiff = (today - ticketDate) / (1000 * 60 * 60 * 24);
                          return daysDiff <= 1;
                        })
                        .slice(0, 20)
                        .map((ticket, idx) => (
                          <div 
                            key={ticket.ticket_id || idx}
                            onClick={() => {
                              setActiveNav('tickets');
                              setSelectedTicket(ticket);
                            }}
                            className="flex-shrink-0 bg-white/10 backdrop-blur rounded-lg px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs opacity-70">#{ticket.ticket_id?.slice(-6) || 'N/A'}</span>
                              <Badge className={`text-[10px] ${
                                ticket.status === 'open' || ticket.status === 'new' ? 'bg-blue-500' :
                                ticket.status === 'in_progress' ? 'bg-amber-500' :
                                ticket.status === 'resolved' ? 'bg-emerald-500' :
                                'bg-slate-500'
                              }`}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <p className="text-sm truncate max-w-[200px]">{ticket.subject || 'No subject'}</p>
                          </div>
                        ))}
                      {allTickets.filter(t => {
                        const today = new Date();
                        const ticketDate = new Date(t.created_at);
                        const daysDiff = (today - ticketDate) / (1000 * 60 * 60 * 24);
                        return daysDiff <= 1;
                      }).length === 0 && (
                        <div className="flex-shrink-0 text-slate-400 px-4 py-2">
                          No tickets today yet - all quiet! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Clickable Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Open Tickets', value: stats.open, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', view: 'open' },
                  { label: 'In Progress', value: stats.in_progress, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', view: 'in_progress' },
                  { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600', view: 'resolved' },
                  { label: 'Unassigned', value: stats.unassigned, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', view: 'unassigned' }
                ].map((stat, idx) => (
                  <Card 
                    key={idx} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-slate-200"
                    onClick={() => {
                      setActiveNav('tickets');
                      setSelectedView(stat.view);
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg ${stat.color} ${stat.hoverColor} flex items-center justify-center mb-3 transition-colors`}>
                      <Inbox className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                    <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      Click to view <ChevronRight className="w-3 h-3" />
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Pillar breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Tickets by Pillar</h3>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(PILLARS).map(([key, pillar]) => (
                    <div 
                      key={key} 
                      className="text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow transition-all"
                      onClick={() => {
                        setActiveNav('tickets');
                        setSelectedPillar(key);
                      }}
                    >
                      <span className="text-2xl">{pillar.emoji}</span>
                      <div className="text-lg font-bold text-gray-900 mt-1">{stats.by_pillar[key] || 0}</div>
                      <div className="text-xs text-gray-500">{pillar.name}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          
          {/* Pet Parents View */}
          {activeNav === 'pet_parents' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pet Parents</h1>
                <Badge variant="outline">{petParents.length} total</Badge>
              </div>
              
              {petParents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No pet parents found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {petParents.map(parent => {
                    // Get tickets for this parent
                    const parentTickets = allTickets.filter(t => 
                      t.contact?.email === parent.email || 
                      t.customer_email === parent.email ||
                      t.contact?.phone === parent.phone
                    );
                    const parentPets = petProfiles.filter(p => 
                      p.owner_email === parent.email || 
                      p.user_email === parent.email
                    );
                    
                    return (
                      <Card 
                        key={parent.id} 
                        className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
                        onClick={() => {
                          setSelectedParentForHistory(parent);
                          setShowParentHistoryModal(true);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{parent.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500">{parent.email}</p>
                            {parent.phone && (
                              <p className="text-sm text-gray-500">{parent.phone}</p>
                            )}
                            {/* Pets owned */}
                            {parentPets.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {parentPets.slice(0, 3).map(pet => (
                                  <Badge key={pet.id} variant="secondary" className="text-xs">
                                    🐾 {pet.name}
                                  </Badge>
                                ))}
                                {parentPets.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">+{parentPets.length - 3} more</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {parent.membership && (
                              <Badge variant="outline" className="mb-2">{parent.membership}</Badge>
                            )}
                            {parentTickets.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                                <Inbox className="w-3 h-3" />
                                <span>{parentTickets.length} ticket{parentTickets.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
                          <span>Click to view ticket history</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Pet Profiles View */}
          {activeNav === 'pet_profiles' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pet Profiles</h1>
                <Badge variant="outline">{petProfiles.length} total</Badge>
              </div>
              
              {petProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <Dog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No pet profiles found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {petProfiles.map(pet => {
                    // Find the pet's parent
                    const petParent = petParents.find(p => 
                      p.email === pet.owner_email || 
                      p.email === pet.user_email ||
                      p.id === pet.user_id
                    );
                    // Get tickets for this pet
                    const petTickets = allTickets.filter(t => 
                      t.pet_id === pet.id || 
                      t.pet_name === pet.name
                    );
                    
                    return (
                      <Card 
                        key={pet.id} 
                        className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-200"
                        onClick={() => {
                          // Open pet profile in new tab
                          window.open(`/pet/${pet.id}`, '_blank');
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <Dog className="w-7 h-7 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{pet.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500">{pet.breed || 'Unknown breed'}</p>
                            {/* Link to Pet Parent */}
                            {petParent && (
                              <button 
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParentForHistory(petParent);
                                  setShowParentHistoryModal(true);
                                }}
                              >
                                <User className="w-3 h-3" />
                                {petParent.name || petParent.email}
                              </button>
                            )}
                            {!petParent && pet.owner_name && (
                              <p className="text-xs text-gray-400 mt-1">Owner: {pet.owner_name}</p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            {pet.overall_score !== undefined && (
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pet.overall_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                pet.overall_score >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {Math.round(pet.overall_score)}% Soul
                              </div>
                            )}
                            {petTickets.length > 0 && (
                              <div className="text-xs text-purple-600 flex items-center gap-1 justify-end">
                                <Inbox className="w-3 h-3" />
                                {petTickets.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Analytics & Reports Section */}
          {activeNav === 'analytics' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                <select className="border rounded-lg px-3 py-2 text-sm">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Inbox className="w-8 h-8 opacity-80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm opacity-80">Total Tickets</div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-8 h-8 opacity-80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Open</span>
                  </div>
                  <div className="text-3xl font-bold">{stats.open}</div>
                  <div className="text-sm opacity-80">Open Tickets</div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 opacity-80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Resolved</span>
                  </div>
                  <div className="text-3xl font-bold">{stats.resolved}</div>
                  <div className="text-sm opacity-80">Resolved Tickets</div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 opacity-80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Avg</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {analyticsData?.avg_resolution_hours ? `${analyticsData.avg_resolution_hours.toFixed(1)}h` : '-'}
                  </div>
                  <div className="text-sm opacity-80">Avg Resolution Time</div>
                </Card>
              </div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Tickets by Pillar */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Tickets by Pillar</h3>
                  <div className="space-y-3">
                    {Object.entries(PILLARS).slice(0, 7).map(([key, pillar]) => {
                      const count = stats.by_pillar[key] || 0;
                      const maxCount = Math.max(...Object.values(stats.by_pillar || {}), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-6 text-center">{pillar.emoji}</span>
                          <span className="w-24 text-sm text-gray-600">{pillar.name}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-medium text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                
                {/* Tickets by Priority */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="font-medium text-red-800">Critical</span>
                      </div>
                      <div className="text-3xl font-bold text-red-600">{stats.by_priority?.critical || analyticsData?.by_priority?.critical || 0}</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="font-medium text-amber-800">High</span>
                      </div>
                      <div className="text-3xl font-bold text-amber-600">{stats.by_priority?.high || analyticsData?.by_priority?.high || 0}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="font-medium text-blue-800">Medium</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{stats.by_priority?.medium || analyticsData?.by_priority?.medium || 0}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="font-medium text-gray-700">Low</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-600">{stats.by_priority?.low || analyticsData?.by_priority?.low || 0}</div>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Channel & Resolution Stats */}
              <div className="grid grid-cols-3 gap-6">
                {/* Tickets by Channel */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Tickets by Channel</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.by_channel || {}).map(([channel, count]) => (
                      <div key={channel} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {channel === 'whatsapp' && <span className="text-green-500">💬</span>}
                          {channel === 'mira_chat' && <span className="text-purple-500">🤖</span>}
                          {channel === 'web' && <span className="text-blue-500">🌐</span>}
                          {channel === 'email' && <span className="text-amber-500">📧</span>}
                          {channel === 'phone' && <span className="text-red-500">📞</span>}
                          {!['whatsapp', 'mira_chat', 'web', 'email', 'phone'].includes(channel) && <span>📋</span>}
                          <span className="capitalize text-sm">{channel.replace('_', ' ')}</span>
                        </div>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Resolution Rate */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Resolution Rate</h3>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                        <circle 
                          cx="64" cy="64" r="56" fill="none" stroke="#10b981" strokeWidth="12"
                          strokeDasharray={`${((analyticsData?.resolution_rate || 0) / 100) * 352} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">
                          {(analyticsData?.resolution_rate || 0).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      {analyticsData?.resolved_tickets || stats.resolved} of {analyticsData?.total_tickets || stats.total} tickets resolved
                    </p>
                  </div>
                </Card>
                
                {/* SLA Compliance */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">SLA Compliance</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-emerald-700">On Time</span>
                        <span className="font-bold text-emerald-600">
                          {stats.total - (breachedTickets?.length || 0) - (approachingBreachTickets?.length || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-700">Approaching Breach</span>
                        <span className="font-bold text-amber-600">{approachingBreachTickets?.length || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-700">SLA Breached</span>
                        <span className="font-bold text-red-600">{breachedTickets?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ==================== MERGE TICKETS MODAL ==================== */}
      {showMergeModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMergeModal(false)}>
          <Card className="w-full max-w-[500px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Merge Tickets</h3>
                <button onClick={() => setShowMergeModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Primary Ticket (Keep)</span>
                  </div>
                  <p className="text-sm text-emerald-700">{selectedTicket.ticket_id} - {selectedTicket.subject || selectedTicket.description?.slice(0, 40)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">The following tickets will be merged into the primary ticket:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedTicketIds.filter(id => id !== selectedTicket.ticket_id).map(id => {
                      const ticket = allTickets.find(t => t.ticket_id === id);
                      return ticket ? (
                        <div key={id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                          <span className="font-mono text-xs text-gray-500">{id}</span>
                          <p className="text-gray-700 truncate">{ticket.subject || ticket.description?.slice(0, 40)}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ This action will combine all messages and attachments. Secondary tickets will be closed.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowMergeModal(false)}>Cancel</Button>
                <Button
                  onClick={mergeTickets}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Merge {selectedTicketIds.length} Tickets
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteConfirm && ticketToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <Card className="w-full max-w-[500px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900">Delete Ticket?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                <p className="font-mono text-xs text-gray-500 mb-1">{ticketToDelete.ticket_id}</p>
                <p className="font-medium text-gray-900">{ticketToDelete.subject || ticketToDelete.description?.slice(0, 60)}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>{ticketToDelete.pet_parent_name || ticketToDelete.pet_parent_email || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-6">
                <p className="text-sm text-red-800">
                  ⚠️ All messages, attachments, and history associated with this ticket will be permanently deleted.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button
                  onClick={deleteTicket}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" /> Delete Ticket</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* ==================== AGENT PERFORMANCE MODAL ==================== */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPerformanceModal(false)}>
          <Card className="w-[800px] max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-xl">Agent Performance Dashboard</h3>
                <button onClick={() => setShowPerformanceModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!agentPerformance ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{agentPerformance.summary?.total_assigned || 0}</div>
                      <div className="text-sm text-blue-600">Tickets Assigned</div>
                    </Card>
                    <Card className="p-4 bg-emerald-50 border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-700">{agentPerformance.summary?.total_resolved || 0}</div>
                      <div className="text-sm text-emerald-600">Tickets Resolved</div>
                    </Card>
                    <Card className="p-4 bg-purple-50 border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">{agentPerformance.summary?.overall_resolution_rate || 0}%</div>
                      <div className="text-sm text-purple-600">Resolution Rate</div>
                    </Card>
                  </div>
                  
                  {/* Agent Table */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Agent Breakdown (Last {agentPerformance.period_days} days)</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assigned</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Resolved</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Resolution Rate</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CSAT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(agentPerformance.agents || {}).map(([agent, stats]) => (
                            <tr key={agent} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{agent}</td>
                              <td className="px-4 py-3 text-center">{stats.tickets_assigned}</td>
                              <td className="px-4 py-3 text-center">{stats.tickets_resolved}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded text-sm ${stats.resolution_rate >= 80 ? 'bg-emerald-100 text-emerald-700' : stats.resolution_rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                  {stats.resolution_rate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">{stats.avg_response_time_mins}m</td>
                              <td className="px-4 py-3 text-center">
                                {stats.avg_csat > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span>{stats.avg_csat}</span>
                                    <span className="text-xs text-gray-400">({stats.csat_responses})</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* ==================== PET PARENT TICKET HISTORY MODAL ==================== */}
      {showParentHistoryModal && selectedParentForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowParentHistoryModal(false)}>
          <Card className="w-[700px] max-h-[85vh] overflow-hidden bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">{selectedParentForHistory.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{selectedParentForHistory.email}</p>
                    {selectedParentForHistory.phone && (
                      <p className="text-sm text-gray-500">{selectedParentForHistory.phone}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowParentHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedParentForHistory.membership && (
                <Badge variant="outline" className="mt-3">{selectedParentForHistory.membership}</Badge>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {/* Pet Parent's Pets */}
              {(() => {
                const parentPets = petProfiles.filter(p => 
                  p.owner_email === selectedParentForHistory.email || 
                  p.user_email === selectedParentForHistory.email
                );
                if (parentPets.length > 0) {
                  return (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <PawPrint className="w-4 h-4" /> Pets ({parentPets.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parentPets.map(pet => (
                          <div key={pet.id} className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Dog className="w-5 h-5 text-amber-600" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{pet.name}</span>
                              {pet.breed && <span className="text-xs text-gray-500 ml-1">({pet.breed})</span>}
                            </div>
                            {pet.overall_score !== undefined && (
                              <Badge className={`text-xs ${
                                pet.overall_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                pet.overall_score >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {Math.round(pet.overall_score)}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Ticket History */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Ticket History
              </h4>
              {(() => {
                const parentTickets = allTickets.filter(t => 
                  t.contact?.email === selectedParentForHistory.email || 
                  t.customer_email === selectedParentForHistory.email ||
                  t.contact?.phone === selectedParentForHistory.phone ||
                  t.member?.email === selectedParentForHistory.email
                ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                if (parentTickets.length === 0) {
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Inbox className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No tickets found for this pet parent</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {parentTickets.map(ticket => {
                      const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                      const priorityConfig = PRIORITY_CONFIG[ticket.urgency] || PRIORITY_CONFIG.normal;
                      const pillarConfig = PILLARS[ticket.category] || SPECIAL_SECTIONS[ticket.category];
                      
                      return (
                        <div 
                          key={ticket.ticket_id}
                          className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-white"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowParentHistoryModal(false);
                            setActiveNav('tickets');
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {pillarConfig && (
                                  <span className="text-lg">{pillarConfig.emoji}</span>
                                )}
                                <span className="font-medium text-gray-900 truncate">{ticket.subject || 'No subject'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-mono">{ticket.ticket_id}</span>
                                <span>•</span>
                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                {ticket.pet_name && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <PawPrint className="w-3 h-3" />
                                      {ticket.pet_name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`text-xs ${statusConfig.bgLight} ${statusConfig.textColor}`}>
                                {statusConfig.label}
                              </Badge>
                              <div className={`w-2 h-2 rounded-full ${priorityConfig.dot}`} title={priorityConfig.label} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button variant="outline" onClick={() => setShowParentHistoryModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* ==================== QUOTE BUILDER MODAL ==================== */}
      {showQuoteBuilder && partyRequestData && (
        <QuoteBuilder
          partyRequest={partyRequestData}
          ticketId={selectedTicket?.ticket_id}
          onClose={() => {
            setShowQuoteBuilder(false);
            setPartyRequestData(null);
          }}
          onQuoteSent={(data) => {
            toast({
              title: '🎉 Quote Sent!',
              description: `Payment link sent to ${partyRequestData.user_email}`
            });
            // Refresh tickets to update status
            fetchAllTickets();
          }}
        />
      )}
    </div>
  );
};

export default DoggyServiceDesk;
