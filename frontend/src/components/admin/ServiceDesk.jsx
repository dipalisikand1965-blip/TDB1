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
import { API_URL, getApiUrl } from '../../utils/api';
import RichTextEditor from './RichTextEditor';
import {
  Search, Plus, RefreshCw, Filter, X, Send, Clock, User, Phone, Mail,
  MapPin, Calendar, AlertCircle, CheckCircle, Loader2, MessageSquare,
  ChevronRight, Settings, BarChart3, Users, Tag, Paperclip, ExternalLink,
  Inbox, ArrowUp, ArrowDown, MoreVertical, Edit, Trash2, Eye, Star, Zap,
  Download, ShoppingBag, Bot, Utensils, Hotel, CheckSquare, Square, 
  UserPlus, XCircle, Archive, History, ChevronDown, Sparkles, Wand2,
  Brain, Lightbulb, Copy, ThumbsUp, ThumbsDown, Maximize2, Minimize2,
  Bookmark, BookmarkPlus, Layout, PanelLeft, Activity, TrendingUp,
  GitMerge, Flag, Share2, BellRing, MailX, FileWarning, ArrowRight, PawPrint,
  AlertTriangle, FileText, Merge, Mic, MicOff, Image, File, Upload, StopCircle, Play,
  LayoutList, LayoutGrid, Columns3, Timer, UserCheck, Keyboard
} from 'lucide-react';

// Category icons mapping
const CATEGORY_ICONS = {
  celebrate: '🎂', dine: '🍽️', travel: '✈️', stay: '🏨', enjoy: '🎉',
  club: '👑', care: '💊', shop: '🛒', work: '💼', fit: '🏃',
  learn: '📚', adopt: '🐾', insure: '🛡️', farewell: '🌈', community: '🤝',
  exclusive: '⭐', emergency: '🚨', advisory: '📋', paperwork: '📄', referrals: '🤝'
};

// Default saved views (like Zoho's starred views)
const DEFAULT_VIEWS = [
  { id: 'all', name: 'All Tickets', icon: '📋', filter: {} },
  { id: 'my_tickets', name: 'My Tickets', icon: '👤', filter: { assigned_to: 'me' } },
  { id: 'unassigned', name: 'Unassigned', icon: '📭', filter: { assigned_to: null } },
  { id: 'critical', name: 'Critical & High', icon: '🔴', filter: { urgency: ['critical', 'high'] } },
  { id: 'overdue', name: 'Overdue', icon: '⏰', filter: { overdue: true } },
  { id: 'today', name: "Today's Tickets", icon: '📅', filter: { today: true } },
];

// Pillar-specific views - THE 14 PILLARS + Special Views
const PILLAR_VIEWS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', filter: { category: 'celebrate' } },
  { id: 'dine', name: 'Dine', icon: '🍽️', filter: { category: 'dine' } },
  { id: 'stay', name: 'Stay', icon: '🏨', filter: { category: 'stay' } },
  { id: 'travel', name: 'Travel', icon: '✈️', filter: { category: 'travel' } },
  { id: 'care', name: 'Care', icon: '💊', filter: { category: 'care' } },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', filter: { category: 'enjoy' } },
  { id: 'fit', name: 'Fit', icon: '🏃', filter: { category: 'fit' } },
  { id: 'learn', name: 'Learn', icon: '🎓', filter: { category: 'learn' } },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', filter: { category: 'paperwork' } },
  { id: 'advisory', name: 'Advisory', icon: '📋', filter: { category: 'advisory' } },
  { id: 'emergency', name: 'Emergency', icon: '🚨', filter: { category: 'emergency' } },
  { id: 'farewell', name: 'Farewell', icon: '🌈', filter: { category: 'farewell' } },
  { id: 'adopt', name: 'Adopt', icon: '🐾', filter: { category: 'adopt' } },
  { id: 'shop', name: 'Shop', icon: '🛒', filter: { category: 'shop' } },
  { id: 'mira', name: 'Mira AI', icon: '🤖', filter: { category: 'mira_conversation' } },
  { id: 'live_mis', name: 'Live MIS', icon: '📊', filter: { category: 'live_mis' } },
  { id: 'shipping', name: 'Shipping & Commercial', icon: '🚚', filter: { category: 'shipping' } },
];

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

// Premium Status colors with gradients
const STATUS_COLORS = {
  new: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200',
  in_progress: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-amber-200',
  waiting_on_member: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-orange-200',
  escalated: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200',
  resolved: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200',
  closed: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-gray-200'
};

// Urgency colors - premium style
const URGENCY_COLORS = {
  low: 'bg-slate-100 text-slate-600 border border-slate-200',
  medium: 'bg-sky-50 text-sky-700 border border-sky-200',
  high: 'bg-amber-50 text-amber-700 border border-amber-300 font-medium',
  critical: 'bg-red-50 text-red-700 border border-red-300 font-semibold animate-pulse'
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

// Default categories (pillars) - THE 14 PILLARS
const DEFAULT_CATEGORIES = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', description: 'Birthday cakes, celebrations' },
  { id: 'dine', name: 'Dine', icon: '🍽️', description: 'Restaurant reservations, dining' },
  { id: 'stay', name: 'Stay', icon: '🏨', description: 'Pet-friendly accommodations' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Pet travel assistance' },
  { id: 'care', name: 'Care', icon: '💊', description: 'Pet health & wellness' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', description: 'Events & experiences' },
  { id: 'fit', name: 'Fit', icon: '🏃', description: 'Pet fitness & activities' },
  { id: 'learn', name: 'Learn', icon: '🎓', description: 'Training & courses' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', description: 'Documents & certifications' },
  { id: 'advisory', name: 'Advisory', icon: '📋', description: 'Pet advice & consultation' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', description: 'Urgent pet emergencies' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', description: 'End-of-life services' },
  { id: 'adopt', name: 'Adopt', icon: '🐾', description: 'Pet adoption services' },
  { id: 'shop', name: 'Shop', icon: '🛒', description: 'Product inquiries & orders' }
];

const ServiceDesk = ({ authHeaders, isFullScreen = false }) => {
  // Get current admin user from localStorage
  const getCurrentAdminUser = () => {
    try {
      const adminAuth = localStorage.getItem('adminAuth');
      if (adminAuth) {
        const decoded = atob(adminAuth);
        return decoded.split(':')[0]; // username is before the colon
      }
      // Fallback: try token-based auth
      const adminToken = localStorage.getItem('tdc_admin_token');
      if (adminToken) {
        // Token format might include username - try to decode
        try {
          const payload = JSON.parse(atob(adminToken.split('.')[1]));
          return payload.username || payload.sub || 'admin';
        } catch {
          return 'admin';
        }
      }
    } catch {
      return 'admin';
    }
    return 'admin';
  };
  
  const currentAdminUser = getCurrentAdminUser();
  
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
  
  // Zoho-like features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [savedViews, setSavedViews] = useState(DEFAULT_VIEWS);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTopTab, setActiveTopTab] = useState('tickets');
  const [starredViews, setStarredViews] = useState(['all', 'critical', 'today']);
  
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
  
  // View Mode - List or Kanban
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  
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
  
  // Customer History
  const [customerHistory, setCustomerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Activity Timeline / Audit Trail
  const [auditTrail, setAuditTrail] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  // Canned Responses
  const [cannedResponses, setCannedResponses] = useState([]);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  
  // Ticket Merge
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [merging, setMerging] = useState(false);
  
  // Reply Modal - Full-screen popup for replies
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Edit Ticket Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: '',
    category: '',
    urgency: '',
    description: '',
    assigned_to: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Detail Panel Tabs
  const [activeDetailTab, setActiveDetailTab] = useState('conversation');
  
  // Time Entry
  const [timeEntries, setTimeEntries] = useState([]);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [timeEntryForm, setTimeEntryForm] = useState({
    duration_minutes: 15,
    description: '',
    entry_type: 'work'
  });
  const [savingTimeEntry, setSavingTimeEntry] = useState(false);
  
  // AI Summary
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [aiSummaryConfig, setAiSummaryConfig] = useState({
    num_conversations: 30,
    include_incoming: true,
    include_outgoing: true,
    include_internal: false
  });
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [ticketSummary, setTicketSummary] = useState(null);
  
  // SLA & Auto-assignment
  const [slaStats, setSlaStats] = useState(null);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Bulk Actions
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Roles & Users Management
  const [roles, setRoles] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingRolesUsers, setLoadingRolesUsers] = useState(false);
  
  // Escalation Rules
  const [escalationRules, setEscalationRules] = useState([]);
  const [loadingEscalation, setLoadingEscalation] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pet Soul Integration
  const [petSoulData, setPetSoulData] = useState(null);
  const [loadingPetSoul, setLoadingPetSoul] = useState(false);
  
  // Attachments
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = React.useRef(null);
  
  // Quick Filters
  const [quickFilter, setQuickFilter] = useState('all'); // all, my_tickets, unassigned, overdue, today

  // Fetch Roles and Team Users
  const fetchRolesAndUsers = async () => {
    setLoadingRolesUsers(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/roles`, { headers: authHeaders }),
        fetch(`${getApiUrl()}/api/roles/users/all`, { headers: authHeaders })
      ]);
      
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setTeamUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching roles/users:', err);
    }
    setLoadingRolesUsers(false);
  };

  // Create new team member/agent
  const handleCreateAgent = async (agentData) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/roles/users/create`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
      if (res.ok) {
        alert('Agent created successfully');
        fetchRolesAndUsers();
        return true;
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
        return false;
      }
    } catch (err) {
      console.error('Error creating agent:', err);
      alert('Failed to create agent');
      return false;
    }
  };

  // Assign role to user
  const handleAssignRole = async (userId, roleId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/roles/users/assign`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role_id: roleId })
      });
      if (res.ok) {
        fetchRolesAndUsers();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error('Error assigning role:', err);
    }
  };

  // Fetch Escalation Rules
  const fetchEscalationRules = async () => {
    setLoadingEscalation(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/escalation`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setEscalationRules(data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching escalation rules:', err);
    }
    setLoadingEscalation(false);
  };

  // Toggle escalation rule
  const handleToggleEscalationRule = async (ruleId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/escalation/${ruleId}/toggle`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        fetchEscalationRules();
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  // Manual escalation check
  const handleRunEscalationCheck = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/escalation/run-check`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Escalation check complete: ${data.escalated} tickets escalated`);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error running escalation check:', err);
    }
  };

  // Upload attachment to ticket
  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket) return;
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': authHeaders.Authorization },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        // Refresh ticket details
        fetchTicketDetails(selectedTicket.ticket_id);
        alert(`Uploaded: ${data.filename}`);
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.detail}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload attachment');
    }
    
    setUploadingAttachment(false);
    e.target.value = '';
  };

  // Individual Ticket Actions
  const handleMarkSpam = async (ticketId) => {
    if (!confirm('Mark this ticket as spam?')) return;
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'spam', is_spam: true })
      });
      fetchTickets();
    } catch (err) {
      console.error('Error marking spam:', err);
    }
  };

  const handleMarkUnread = async (ticketId) => {
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: false })
      });
      fetchTickets();
    } catch (err) {
      console.error('Error marking unread:', err);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (selectedTicket?.ticket_id === ticketId) {
        setSelectedTicket(null);
      }
      fetchTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  const handleCloneTicket = async (ticket) => {
    try {
      const clonedData = {
        member: ticket.member,
        category: ticket.category,
        sub_category: ticket.sub_category,
        description: `[CLONED] ${ticket.description}`,
        urgency: ticket.urgency,
        source: 'manual'
      };
      await fetch(`${getApiUrl()}/api/tickets`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedData)
      });
      alert('Ticket cloned successfully');
      fetchTickets();
    } catch (err) {
      console.error('Error cloning ticket:', err);
      alert('Failed to clone ticket');
    }
  };

  const handleFollowTicket = async (ticketId) => {
    try {
      await fetch(`${getApiUrl()}/api/tickets/${ticketId}/follow`, {
        method: 'POST',
        headers: authHeaders
      });
      alert('You are now following this ticket');
    } catch (err) {
      console.error('Error following ticket:', err);
    }
  };

  const handleFileIssue = (ticket) => {
    // Open new ticket form with reference to this ticket
    alert(`Filing issue for ticket ${ticket.ticket_id}. This will create a linked escalation ticket.`);
    // Could open a modal or redirect to create escalation
  };

  // Fetch canned responses
  const fetchCannedResponses = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/canned-responses`, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        setCannedResponses(data.responses || []);
      }
    } catch (err) {
      console.error('Error fetching canned responses:', err);
    }
  }, [authHeaders]);

  // Fetch customer history when ticket is selected
  const fetchCustomerHistory = useCallback(async (identifier) => {
    if (!identifier) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/customer/${encodeURIComponent(identifier)}/full-history`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerHistory(data);
      }
    } catch (err) {
      console.error('Error fetching customer history:', err);
    }
    setLoadingHistory(false);
  }, [authHeaders]);

  // Fetch Pet Soul data for ticket's pet
  const fetchPetSoul = useCallback(async (petName, ownerEmail) => {
    if (!petName && !ownerEmail) {
      setPetSoulData(null);
      return;
    }
    
    setLoadingPetSoul(true);
    try {
      // Try to find pet by name and owner email
      const searchQuery = petName || '';
      const response = await fetch(`${getApiUrl()}/api/admin/pet-soul/pets?search=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        // Find matching pet (by name or owner email)
        const pets = data.pets || [];
        let matchedPet = null;
        
        if (pets.length > 0) {
          // Try to find exact match by pet name
          matchedPet = pets.find(p => 
            p.name?.toLowerCase() === petName?.toLowerCase() ||
            p.identity?.name?.toLowerCase() === petName?.toLowerCase()
          );
          // If no exact match, take first result
          if (!matchedPet) matchedPet = pets[0];
        }
        
        if (matchedPet) {
          // Fetch full Pet Soul profile
          const profileRes = await fetch(`${getApiUrl()}/api/pet-soul/profile/${matchedPet.id}`, {
            headers: authHeaders
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setPetSoulData(profileData);
          } else {
            setPetSoulData({ pet: matchedPet, scores: { overall: 0, folders: {} } });
          }
        } else {
          setPetSoulData(null);
        }
      }
    } catch (err) {
      console.error('Error fetching Pet Soul:', err);
      setPetSoulData(null);
    }
    setLoadingPetSoul(false);
  }, [authHeaders]);

  // Merge tickets
  const mergeTickets = async () => {
    if (selectedTickets.size < 2) {
      alert('Select at least 2 tickets to merge');
      return;
    }
    
    const ticketIds = Array.from(selectedTickets);
    const primaryId = ticketIds[0];
    const mergeIds = ticketIds.slice(1);
    
    if (!confirm(`Merge ${mergeIds.length} tickets into ${primaryId}? This cannot be undone.`)) {
      return;
    }
    
    setMerging(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/merge`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_ticket_id: primaryId, merge_ticket_ids: mergeIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        clearSelection();
        fetchTickets();
      } else {
        alert('Failed to merge tickets');
      }
    } catch (err) {
      console.error('Error merging tickets:', err);
      alert('Failed to merge tickets');
    }
    setMerging(false);
    setShowMergeModal(false);
  };

  // Apply canned response to reply text
  const applyCannedResponse = (content) => {
    setReplyText(content);
    setShowCannedResponses(false);
  };

  // Fetch data
  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.search) params.append('search', filters.search);
      
      const res = await fetch(`${getApiUrl()}/api/tickets/?${params}`, { headers: authHeaders });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, [filters, authHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tickets/stats`, { headers: authHeaders });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [authHeaders]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, statusRes, conciergeRes, intRes, slaRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/tickets/categories`, { headers: authHeaders }),
        fetch(`${getApiUrl()}/api/tickets/statuses`, { headers: authHeaders }),
        fetch(`${getApiUrl()}/api/tickets/concierges`, { headers: authHeaders }),
        fetch(`${getApiUrl()}/api/tickets/integrations`, { headers: authHeaders }),
        fetch(`${getApiUrl()}/api/tickets/sla/stats`, { headers: authHeaders }).catch(() => ({ json: () => ({}) }))
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
      const res = await fetch(`${getApiUrl()}/api/tickets/${ticketId}`, { headers: authHeaders });
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
      await Promise.all([fetchMetadata(), fetchStats(), fetchTickets(), fetchCannedResponses()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMetadata, fetchStats, fetchTickets, fetchCannedResponses]);

  // Fetch audit trail for selected ticket
  const fetchAuditTrail = useCallback(async (ticketId) => {
    setLoadingAudit(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/${ticketId}/audit`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setAuditTrail(data.timeline || []);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    }
    setLoadingAudit(false);
  }, [authHeaders]);

  // Fetch customer history and audit trail when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const identifier = selectedTicket.member?.email || selectedTicket.member?.phone || selectedTicket.customer_email;
      if (identifier) {
        fetchCustomerHistory(identifier);
      }
      // Fetch audit trail
      fetchAuditTrail(selectedTicket.ticket_id);
      
      // Fetch Pet Soul data if ticket has pet info
      const petName = selectedTicket.pet?.name;
      const ownerEmail = selectedTicket.member?.email;
      if (petName || ownerEmail) {
        fetchPetSoul(petName, ownerEmail);
      } else {
        setPetSoulData(null);
      }
    } else {
      setCustomerHistory(null);
      setAuditTrail([]);
      setPetSoulData(null);
    }
  }, [selectedTicket, fetchCustomerHistory, fetchAuditTrail, fetchPetSoul]);

  // Handlers
  const handleReply = async () => {
    if ((!replyText.trim() && replyAttachments.length === 0) || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      // Upload attachments first if any
      let attachmentUrls = [];
      if (replyAttachments.length > 0) {
        for (const att of replyAttachments) {
          const formData = new FormData();
          if (att.file) {
            formData.append('file', att.file);
          } else if (att.blob) {
            formData.append('file', att.blob, `voice_${Date.now()}.webm`);
          }
          formData.append('ticket_id', selectedTicket.ticket_id);
          formData.append('type', att.type);
          
          try {
            const uploadRes = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/attachments`, {
              method: 'POST',
              headers: { 'Authorization': authHeaders.Authorization },
              body: formData
            });
            
            if (uploadRes.ok) {
              const uploadResult = await uploadRes.json();
              attachmentUrls.push({
                type: att.type,
                name: att.name,
                url: uploadResult.url || uploadResult.file_url,
                size: att.size
              });
            }
          } catch (uploadErr) {
            console.error('Error uploading attachment:', uploadErr);
          }
        }
      }
      
      if (isInternalNote || sendChannel === 'internal') {
        // Internal note - use existing endpoint
        await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/reply`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: replyText,
            is_internal: isInternalNote,
            attachments: attachmentUrls
          })
        });
      } else {
        // Send via channel (email/whatsapp) using messaging API
        const response = await fetch(`${getApiUrl()}/api/tickets/messaging/send`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: selectedTicket.ticket_id,
            message: replyText,
            channel: sendChannel,
            is_internal: false,
            attachments: attachmentUrls
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
      setReplyAttachments([]);
      setAudioBlob(null);
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
      const response = await fetch(`${getApiUrl()}/api/tickets/sla/auto-assign/${selectedTicket.ticket_id}`, {
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
      const response = await fetch(`${getApiUrl()}/api/tickets/sla/auto-assign-all`, {
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
      const response = await fetch(`${getApiUrl()}/api/tickets/sla/check-escalations`, {
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
        return fetch(`${getApiUrl()}/api/tickets/${ticketId}/assign`, {
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
        fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
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
        fetch(`${getApiUrl()}/api/tickets/${ticketId}`, {
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
        filtered = tickets.filter(t => t.assigned_to === currentAdminUser);
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
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/draft-reply`, {
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

  const applyAiDraft = (draft) => {
    // Set the reply text with the AI draft
    setReplyText(draft);
    // Close the AI panel
    setShowAiPanel(false);
    // Clear the draft to allow generating new one
    setAiDraft(null);
  };

  const getAiSummary = async () => {
    if (!selectedTicket) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/summarize?ticket_id=${selectedTicket.ticket_id}`, {
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
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/suggest-actions?ticket_id=${selectedTicket.ticket_id}`, {
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
        await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
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
        await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
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
      await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/assign`, {
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

  // Open Edit Modal with current ticket data
  const openEditModal = () => {
    if (!selectedTicket) return;
    setEditForm({
      subject: selectedTicket.subject || selectedTicket.description?.substring(0, 100) || '',
      category: selectedTicket.category || '',
      urgency: selectedTicket.urgency || 'medium',
      description: selectedTicket.description || '',
      assigned_to: selectedTicket.assigned_to || ''
    });
    setShowEditModal(true);
  };

  // Save Ticket Edits
  const saveTicketEdits = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editForm.subject,
          category: editForm.category,
          urgency: editForm.urgency,
          description: editForm.description,
          assigned_to: editForm.assigned_to || null
        })
      });
      
      if (response.ok) {
        setShowEditModal(false);
        fetchTicketDetails(selectedTicket.ticket_id);
        fetchTickets();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving ticket:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Fetch Time Entries for a ticket
  const fetchTimeEntries = async (ticketId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/${ticketId}/time-entries`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching time entries:', err);
    }
  };

  // Add Time Entry
  const addTimeEntry = async () => {
    if (!selectedTicket) return;
    setSavingTimeEntry(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/${selectedTicket.ticket_id}/time-entries`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timeEntryForm,
          agent: username
        })
      });
      
      if (response.ok) {
        setShowTimeEntryModal(false);
        setTimeEntryForm({ duration_minutes: 15, description: '', entry_type: 'work' });
        fetchTimeEntries(selectedTicket.ticket_id);
      } else {
        alert('Failed to add time entry');
      }
    } catch (err) {
      console.error('Error adding time entry:', err);
      alert('Failed to add time entry');
    } finally {
      setSavingTimeEntry(false);
    }
  };

  // Generate AI Summary for ticket
  const generateTicketSummary = async () => {
    if (!selectedTicket) return;
    setGeneratingSummary(true);
    setTicketSummary(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/tickets/ai/summary/${selectedTicket.ticket_id}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSummaryConfig)
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketSummary(data.summary);
        setShowAiSummaryModal(false);
      } else {
        alert('Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
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
        await fetch(`${getApiUrl()}/api/tickets/`, {
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
          fetch(`${getApiUrl()}/api/tickets/sla/rules/assignment`, { headers: authHeaders }),
          fetch(`${getApiUrl()}/api/tickets/sla/rules/sla`, { headers: authHeaders }),
          fetch(`${getApiUrl()}/api/tickets/sla/concierges/availability`, { headers: authHeaders })
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

    // Load rules when tab changes to SLA or Assignment - only when modal is open
    useEffect(() => {
      if (!showSettings) return; // Don't fetch if modal is closed
      
      if (activeSettingsTab === 'sla' || activeSettingsTab === 'assignment') {
        fetchRules();
      }
      if (activeSettingsTab === 'team') {
        fetchRules();
        fetchRolesAndUsers();
      }
      if (activeSettingsTab === 'escalation') {
        fetchEscalationRules();
      }
    }, [activeSettingsTab, showSettings]);

    const handleSaveAssignmentRule = async () => {
      if (!newAssignmentRule.name || !newAssignmentRule.assign_to) {
        alert('Please enter a rule name and select who to assign to');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(`${getApiUrl()}/api/tickets/sla/rules/assignment`, {
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
        await fetch(`${getApiUrl()}/api/tickets/sla/rules/assignment/${encodeURIComponent(ruleName)}`, {
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
        const res = await fetch(`${getApiUrl()}/api/tickets/sla/rules/sla`, {
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
        await fetch(`${getApiUrl()}/api/tickets/sla/concierges/availability`, {
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
        await fetch(`${getApiUrl()}/api/tickets/integrations`, {
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
      <Dialog open={showSettings} onOpenChange={setShowSettings} modal={true}>
        <DialogContent 
          className="max-w-3xl max-h-[85vh] overflow-y-auto" 
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Service Desk Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="mt-2">
            <TabsList className="w-full grid grid-cols-6 mb-4">
              <TabsTrigger value="assignment" className="text-xs px-1">
                <Zap className="w-3 h-3 mr-1" /> Auto-Assign
              </TabsTrigger>
              <TabsTrigger value="escalation" className="text-xs px-1">
                <ArrowUp className="w-3 h-3 mr-1" /> Escalation
              </TabsTrigger>
              <TabsTrigger value="sla" className="text-xs px-1">
                <Clock className="w-3 h-3 mr-1" /> SLA Rules
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs px-1">
                <Users className="w-3 h-3 mr-1" /> Team
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs px-1">
                <Mail className="w-3 h-3 mr-1" /> Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs px-1">
                <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
              </TabsTrigger>
            </TabsList>

            {/* AUTO-ASSIGNMENT TAB */}
            <TabsContent value="assignment" className="space-y-4 mt-2 min-h-[300px]">
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
                      <div key={rule.name || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
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

            {/* ESCALATION RULES TAB */}
            <TabsContent value="escalation" className="space-y-4 mt-2 min-h-[300px]">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <ArrowUp className="w-4 h-4 inline mr-1" />
                  Escalation rules automatically move tickets to senior staff when conditions are met. Rules run every 15 minutes.
                </p>
              </div>

              {/* Run Manual Check Button */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRunEscalationCheck}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Zap className="w-4 h-4 mr-1" /> Run Escalation Check Now
                </Button>
              </div>

              {/* Escalation Path */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                <h4 className="font-medium text-sm">⬆️ Escalation Path</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-blue-100 text-blue-700">Agent</Badge>
                  <span>→</span>
                  <Badge className="bg-amber-100 text-amber-700">Senior Agent</Badge>
                  <span>→</span>
                  <Badge className="bg-purple-100 text-purple-700">Manager</Badge>
                  <span>→</span>
                  <Badge className="bg-red-100 text-red-700">Super Admin</Badge>
                </div>
              </div>

              {/* Escalation Rules List */}
              {loadingEscalation ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Active Rules ({escalationRules.filter(r => r.enabled).length}/{escalationRules.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Rule Name</th>
                          <th className="px-3 py-2 text-left">Trigger</th>
                          <th className="px-3 py-2 text-left">Action</th>
                          <th className="px-3 py-2 text-left">Priority Filter</th>
                          <th className="px-3 py-2 text-left">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escalationRules.map((rule, idx) => (
                          <tr key={rule.id || idx} className={`border-t hover:bg-slate-50 ${!rule.enabled ? 'opacity-50' : ''}`}>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleToggleEscalationRule(rule.id)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${rule.enabled ? 'right-0.5' : 'left-0.5'}`} />
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-xs text-gray-500">{rule.description}</div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">
                                {rule.trigger?.type === 'unassigned_time' && `Unassigned > ${rule.trigger.hours}h`}
                                {rule.trigger?.type === 'priority' && `Priority: ${rule.trigger.priority}`}
                                {rule.trigger?.type === 'sla_breach' && 'SLA Breached'}
                                {rule.trigger?.type === 'sla_warning' && `SLA Warning (${rule.trigger.minutes_before_breach}m)`}
                                {rule.trigger?.type === 'no_response_time' && `No Response > ${rule.trigger.hours}h`}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={
                                rule.action?.target_role === 'super_admin' ? 'bg-red-100 text-red-700' :
                                rule.action?.target_role === 'manager' ? 'bg-purple-100 text-purple-700' :
                                rule.action?.target_role === 'senior_agent' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }>
                                → {rule.action?.target_role?.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {rule.priority_filter ? rule.priority_filter.join(', ') : 'All'}
                            </td>
                            <td className="px-3 py-2">
                              {rule.is_system ? (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Custom</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info about escalation */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-800">
                <strong>How it works:</strong> Every 15 minutes, the system checks all open tickets against these rules. 
                If a ticket matches a rule&apos;s trigger condition, it&apos;s automatically reassigned to someone with the target role, 
                and an escalation history entry is logged.
              </div>
            </TabsContent>

            {/* SLA RULES TAB */}
            <TabsContent value="sla" className="space-y-4 mt-2 min-h-[300px]">
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
            <TabsContent value="team" className="space-y-4 mt-2 min-h-[300px]">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Users className="w-4 h-4 inline mr-1" />
                  Manage team members, roles, and permissions. Control who can do what in the Service Desk.
                </p>
              </div>

              {/* Roles Section */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" /> System Roles
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {roles.map(role => (
                    <div key={role.id} className={`p-3 rounded-lg border text-center ${
                      role.level >= 75 ? 'bg-purple-50 border-purple-200' :
                      role.level >= 50 ? 'bg-amber-50 border-amber-200' :
                      role.level >= 25 ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="font-medium text-sm">{role.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Level {role.level}</div>
                      <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{role.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Team Member */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                <h4 className="font-medium text-sm text-green-800">Add New Agent</h4>
                <div className="grid grid-cols-5 gap-3">
                  <Input
                    placeholder="Username"
                    id="new-agent-username"
                    className="bg-white"
                  />
                  <Input
                    placeholder="Full Name"
                    id="new-agent-name"
                    className="bg-white"
                  />
                  <Input
                    placeholder="Email"
                    id="new-agent-email"
                    className="bg-white"
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    id="new-agent-password"
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Select defaultValue="agent">
                      <SelectTrigger id="new-agent-role" className="bg-white">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        const username = document.getElementById('new-agent-username')?.value;
                        const name = document.getElementById('new-agent-name')?.value;
                        const email = document.getElementById('new-agent-email')?.value;
                        const password = document.getElementById('new-agent-password')?.value;
                        const roleSelect = document.getElementById('new-agent-role');
                        const role = roleSelect?.textContent?.toLowerCase().replace(' ', '_') || 'agent';
                        
                        if (!username || !name || !email || !password) {
                          alert('Please fill all fields');
                          return;
                        }
                        
                        const success = await handleCreateAgent({ username, name, email, password, role });
                        if (success) {
                          document.getElementById('new-agent-username').value = '';
                          document.getElementById('new-agent-name').value = '';
                          document.getElementById('new-agent-email').value = '';
                          document.getElementById('new-agent-password').value = '';
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              {loadingRolesUsers ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Team Members ({teamUsers.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Last Login</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamUsers.map((user, idx) => (
                          <tr key={user.id || idx} className="border-t hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium">{user.name || user.username}</div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{user.email}</td>
                            <td className="px-4 py-3">
                              <Select 
                                value={user.role || 'agent'}
                                onValueChange={(newRole) => handleAssignRole(user.username || user.id, newRole)}
                              >
                                <SelectTrigger className="w-36 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>
                                      <span className={`${
                                        role.level >= 75 ? 'text-purple-700' :
                                        role.level >= 50 ? 'text-amber-700' :
                                        role.level >= 25 ? 'text-blue-700' :
                                        'text-gray-700'
                                      }`}>{role.name}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={user.is_active ? 'default' : 'secondary'} className={user.is_active ? 'bg-green-100 text-green-700' : ''}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {teamUsers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No team members yet. Add your first agent above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Escalation Rules Info */}
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h4 className="font-medium text-sm text-amber-800 mb-2">⚡ Escalation Path</h4>
                <p className="text-xs text-amber-700">
                  Tickets auto-escalate based on role level: Agent (25) → Senior Agent (50) → Manager (75) → Super Admin (100)
                </p>
              </div>
            </TabsContent>

            {/* EMAIL TAB */}
            <TabsContent value="email" className="space-y-4 mt-4 min-h-[300px]">
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

            <TabsContent value="whatsapp" className="space-y-4 mt-4 min-h-[300px]">
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
    <div className={`h-full flex flex-col overflow-hidden ${isFullScreen ? 'p-4' : ''}`}>
      {/* SLA Breach Alert Banner */}
      {(stats?.overdue > 0 || (slaStats?.sla_breach_rate > 20)) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-r-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <span className="font-medium text-red-800">
                {stats?.overdue > 0 
                  ? `⚠️ ${stats.overdue} ticket${stats.overdue > 1 ? 's' : ''} overdue!` 
                  : `⚠️ SLA Breach Rate at ${slaStats?.sla_breach_rate}%`}
              </span>
              <span className="text-red-600 text-sm ml-2">Immediate attention required</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => setQuickFilter('overdue')}
            className="bg-red-600 hover:bg-red-700"
          >
            View Overdue
          </Button>
        </div>
      )}
      
      {/* Metrics Bar - Premium Glass Design */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl mb-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            {/* Open Tickets */}
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-3xl font-bold text-white">{stats?.total_open || 0}</div>
              <div className="text-xs text-slate-300 font-medium">Open Tickets</div>
            </div>
            {/* Critical */}
            <div className="text-center px-4 py-2 bg-red-500/20 rounded-xl backdrop-blur-sm border border-red-500/30">
              <div className="text-3xl font-bold text-red-400">{stats?.by_urgency?.critical || 0}</div>
              <div className="text-xs text-red-300 font-medium">Critical</div>
            </div>
            {/* High Priority */}
            <div className="text-center px-4 py-2 bg-amber-500/20 rounded-xl backdrop-blur-sm border border-amber-500/30">
              <div className="text-3xl font-bold text-amber-400">{stats?.by_urgency?.high || 0}</div>
              <div className="text-xs text-amber-300 font-medium">High Priority</div>
            </div>
            {/* Overdue */}
            <div className="text-center px-4 py-2 bg-yellow-500/20 rounded-xl backdrop-blur-sm border border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400">{stats?.overdue || 0}</div>
              <div className="text-xs text-yellow-300 font-medium">Overdue</div>
            </div>
            {/* Last 24h */}
            <div className="text-center px-4 py-2 bg-blue-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400">{stats?.recent_24h || 0}</div>
              <div className="text-xs text-blue-300 font-medium">Last 24h</div>
            </div>
            {slaStats && (
              <>
                {/* SLA Breach */}
                <div className="border-l border-white/20 pl-6 text-center px-4 py-2">
                  <div className={`text-3xl font-bold ${slaStats.sla_breach_rate > 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {slaStats.sla_breach_rate || 0}%
                  </div>
                  <div className="text-xs text-slate-300 font-medium">SLA Breach Rate</div>
                </div>
                {/* Avg Response */}
                <div className="text-center px-4 py-2 bg-emerald-500/20 rounded-xl backdrop-blur-sm border border-emerald-500/30">
                  <div className="text-3xl font-bold text-emerald-400">{slaStats.avg_first_response_hours || '-'}h</div>
                  <div className="text-xs text-emerald-300 font-medium">Avg Response</div>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoAssignAll} 
              disabled={autoAssigning} 
              title="Auto-assign all unassigned tickets"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Zap className={`w-4 h-4 mr-1 ${autoAssigning ? 'animate-pulse text-yellow-400' : ''}`} /> Auto-Assign
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCheckEscalations} 
              title="Check and escalate overdue tickets"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <AlertCircle className="w-4 h-4 mr-1" /> Check SLA
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCategoryManager(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Tag className="w-4 h-4 mr-1" /> Categories
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSettings(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowNewTicket(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-4 h-4 mr-1" /> New Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Filters Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-4">
          <div>
            <Label className="text-xs text-slate-500 mb-1.5 block font-medium">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9 h-9 rounded-lg border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="Search tickets..."
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

        {/* Ticket List - Premium Styling */}
        <div className="w-96 flex-shrink-0 border rounded-xl overflow-hidden flex flex-col bg-white shadow-lg">
          {/* Header with Quick Filters */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Tickets ({displayTickets.length})</span>
              <div className="flex items-center gap-1">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white rounded-lg border shadow-sm p-0.5 mr-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title="List View"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'kanban' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Kanban Board"
                  >
                    <Columns3 className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="ghost" size="sm" onClick={exportTicketsCSV} title="Export to CSV" className="hover:bg-white/50">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { fetchTickets(); fetchStats(); }} className="hover:bg-white/50">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Filter Tabs - Premium Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All', count: tickets.length },
                { id: 'unassigned', label: 'Unassigned', count: tickets.filter(t => !t.assigned_to).length },
                { id: 'critical', label: '🔴 Critical', count: tickets.filter(t => t.urgency === 'critical' || t.urgency === 'high').length },
                { id: 'today', label: 'Today', count: tickets.filter(t => t.created_at?.startsWith(new Date().toISOString().split('T')[0])).length },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                    quickFilter === tab.id 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                  onClick={() => setQuickFilter(tab.id)}
                >
                  {tab.label} {tab.count > 0 && <span className="ml-1 opacity-80">({tab.count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Bar - Shows when tickets are selected */}
          {selectedTickets.size > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedTickets.size === displayTickets.length && displayTickets.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-semibold text-amber-800">
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

                  {/* Merge Button */}
                  {selectedTickets.size >= 2 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs text-purple-600 hover:bg-purple-50" 
                      onClick={() => setShowMergeModal(true)}
                      disabled={bulkActionLoading || merging}
                    >
                      📎 Merge
                    </Button>
                  )}

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
            <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2">
              <Checkbox 
                checked={false}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-slate-500">Select all</span>
            </div>
          )}

          {/* Ticket List - Premium Cards */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {displayTickets.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">No tickets found</p>
                <p className="text-sm text-slate-400 mt-1">All caught up!</p>
                {quickFilter !== 'all' && (
                  <Button variant="link" size="sm" onClick={() => setQuickFilter('all')} className="mt-2">
                    Show all tickets
                  </Button>
                )}
              </div>
            ) : (
              displayTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => fetchTicketDetails(ticket.ticket_id)}
                  className={`mx-2 my-2 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    selectedTicket?.id === ticket.id 
                      ? 'bg-white shadow-lg border-amber-300 ring-2 ring-amber-200' 
                      : selectedTickets.has(ticket.ticket_id)
                        ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                        : 'bg-white hover:shadow-md border-slate-200 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedTickets.has(ticket.ticket_id)}
                        onCheckedChange={() => toggleTicketSelection(ticket.ticket_id)}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                    </div>
                    
                    {/* Ticket Actions Menu */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" data-testid={`ticket-actions-${ticket.ticket_id}`}>
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleFollowTicket(ticket.ticket_id)}>
                            <BellRing className="w-4 h-4 mr-2" /> Follow
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkUnread(ticket.ticket_id)}>
                            <Mail className="w-4 h-4 mr-2" /> Mark as Unread
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCloneTicket(ticket)}>
                            <Copy className="w-4 h-4 mr-2" /> Clone
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            toggleTicketSelection(ticket.ticket_id);
                            setShowMergeModal(true);
                          }}>
                            <GitMerge className="w-4 h-4 mr-2" /> Merge
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFileIssue(ticket)}>
                            <FileWarning className="w-4 h-4 mr-2" /> File an Issue
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleMarkSpam(ticket.ticket_id)} className="text-orange-600">
                            <MailX className="w-4 h-4 mr-2" /> Mark Spam
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTicket(ticket.ticket_id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Ticket Content */}
                    <div className="flex-1 min-w-0" onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{ticket.ticket_id}</span>
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
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${STATUS_COLORS[ticket.status]}`}>
                            {ticket.status?.replace(/_/g, ' ')}
                          </Badge>
                          {/* Reply Count */}
                          {ticket.reply_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MessageSquare className="w-3 h-3" />
                              {ticket.reply_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {/* Agent Avatar with Initials */}
                          {ticket.assigned_to ? (
                            <div className="flex items-center gap-1.5" title={`Assigned to: ${ticket.assigned_to}`}>
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                {ticket.assigned_to.charAt(0).toUpperCase()}
                              </div>
                              <span className="hidden sm:inline">{ticket.assigned_to.split('@')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-orange-500 text-[10px] bg-orange-50 px-1.5 py-0.5 rounded">Unassigned</span>
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

        {/* Ticket Detail Panel */}
        <div className="flex-1 border rounded-xl overflow-hidden flex flex-col bg-white shadow-lg" style={{maxHeight: 'calc(100vh - 200px)'}}>
          {ticketLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header - Enhanced Zoho-style */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[selectedTicket.category]}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{selectedTicket.ticket_id}</span>
                        <Badge className={`${STATUS_COLORS[selectedTicket.status]} shadow-sm`}>
                          {selectedTicket.status?.replace('_', ' ')}
                        </Badge>
                        {selectedTicket.source && SOURCE_CONFIG[selectedTicket.source] && (
                          <Badge className={`${SOURCE_CONFIG[selectedTicket.source].color} opacity-90`}>
                            {SOURCE_CONFIG[selectedTicket.source].icon}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mt-1">{selectedTicket.member?.name || selectedTicket.customer_name || 'Customer'}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Source Channel Badge */}
                    {selectedTicket.source && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        selectedTicket.source === 'whatsapp' ? 'bg-green-600 text-white' :
                        selectedTicket.source === 'email' ? 'bg-blue-600 text-white' :
                        selectedTicket.source === 'chat' ? 'bg-purple-600 text-white' :
                        selectedTicket.source === 'phone' ? 'bg-orange-600 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {selectedTicket.source === 'whatsapp' && '📱'}
                        {selectedTicket.source === 'email' && '📧'}
                        {selectedTicket.source === 'chat' && '💬'}
                        {selectedTicket.source === 'phone' && '📞'}
                        {selectedTicket.source === 'website' && '🌐'}
                        {selectedTicket.source === 'mira' && '🤖'}
                        <span className="capitalize">{selectedTicket.source}</span>
                      </div>
                    )}
                    {/* Edit Button */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={openEditModal}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      data-testid="edit-ticket-btn"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    {/* Agent Badge */}
                    {selectedTicket.assigned_to && (
                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-full">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                          {selectedTicket.assigned_to.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-200">{selectedTicket.assigned_to.split('@')[0]}</span>
                      </div>
                    )}
                    {/* Status Dropdown */}
                    <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-9 w-44 bg-slate-700 border-slate-600 text-white">
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
                
                {/* Quick Contact Row */}
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  {selectedTicket.member?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {selectedTicket.member.phone}
                    </div>
                  )}
                  {selectedTicket.member?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {selectedTicket.member.email}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5" /> {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Tabs Bar - Zoho Style */}
              <div className="bg-slate-100 border-b flex items-center px-1 overflow-x-auto">
                <button
                  onClick={() => setActiveDetailTab('conversation')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDetailTab === 'conversation' 
                      ? 'border-amber-500 text-amber-700 bg-white' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>CONVERSATION</span>
                    {selectedTicket.messages?.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">{selectedTicket.messages.length}</Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('info')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDetailTab === 'info' 
                      ? 'border-amber-500 text-amber-700 bg-white' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>INFO</span>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveDetailTab('time'); fetchTimeEntries(selectedTicket.ticket_id); }}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDetailTab === 'time' 
                      ? 'border-amber-500 text-amber-700 bg-white' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>TIME ENTRY</span>
                    {timeEntries.length > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">{timeEntries.length}</Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('attachments')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDetailTab === 'attachments' 
                      ? 'border-amber-500 text-amber-700 bg-white' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <span>ATTACHMENTS</span>
                    {selectedTicket.attachments?.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">{selectedTicket.attachments.length}</Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveDetailTab('activity')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeDetailTab === 'activity' 
                      ? 'border-amber-500 text-amber-700 bg-white' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>ACTIVITY</span>
                  </div>
                </button>
                
                {/* AI Summary Button */}
                <button
                  onClick={() => setShowAiSummaryModal(true)}
                  className="ml-auto mr-2 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Brain className="w-4 h-4" />
                  <span>AI Summary</span>
                </button>
              </div>
              
              {/* AI Summary Display */}
              {ticketSummary && (
                <div className="mx-4 mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">AI-Generated Summary</span>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        From last {aiSummaryConfig.num_conversations} messages
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setTicketSummary(null)} className="h-6 w-6 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-purple-900 whitespace-pre-wrap">{ticketSummary}</div>
                </div>
              )}

              {/* Content - Based on Active Tab */}
              <div className="flex-1 overflow-y-auto" style={{minHeight: '200px', maxHeight: 'calc(100vh - 450px)'}}>
                
                {/* CONVERSATION Tab */}
                {activeDetailTab === 'conversation' && (
                  <div className="p-4 space-y-4">
                    {/* Smart Suggestions - Magic Prompts */}
                    {petSoulData && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">💡</span>
                          <span className="font-semibold text-amber-800 text-sm">Smart Suggestions</span>
                        </div>
                        <div className="space-y-1.5">
                          {/* Birthday Coming Up */}
                          {petSoulData.pet?.birth_date && (() => {
                            const bday = new Date(petSoulData.pet.birth_date);
                            const today = new Date();
                            bday.setFullYear(today.getFullYear());
                            if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                            const daysUntil = Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
                            if (daysUntil <= 30 && daysUntil > 0) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-white/60 rounded-lg px-3 py-2">
                              <span>🎂</span>
                              <span><strong>{petSoulData.pet.name}&apos;s birthday is in {daysUntil} days!</strong> Mention cake options?</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Allergies Warning */}
                      {petSoulData.insights?.key_flags?.has_allergies && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50/80 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4" />
                          <span><strong>Allergy alert:</strong> {petSoulData.pet?.name} is allergic to {petSoulData.insights.key_flags.allergy_list?.join(', ')}. Confirm order is safe.</span>
                        </div>
                      )}
                      
                      {/* High Anxiety */}
                      {petSoulData.insights?.key_flags?.anxiety_level === 'high' && selectedTicket.category === 'stay' && (
                        <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50/80 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4" />
                          <span><strong>Note:</strong> {petSoulData.pet?.name} has high separation anxiety. Suggest calming add-ons for stay.</span>
                        </div>
                      )}
                      
                      {/* Favorite Treats for upsell */}
                      {petSoulData.pet?.doggy_soul_answers?.favorite_treats && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50/80 rounded-lg px-3 py-2">
                          <span>❤️</span>
                          <span><strong>{petSoulData.pet?.name} loves:</strong> {Array.isArray(petSoulData.pet.doggy_soul_answers.favorite_treats) ? petSoulData.pet.doggy_soul_answers.favorite_treats.join(', ') : petSoulData.pet.doggy_soul_answers.favorite_treats}. Suggest as add-on?</span>
                        </div>
                      )}
                      
                      {/* Repeat Customer */}
                      {customerHistory && customerHistory.stats?.total_orders > 3 && (
                        <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50/80 rounded-lg px-3 py-2">
                          <span>⭐</span>
                          <span><strong>Loyal customer!</strong> {customerHistory.stats.total_orders} orders. Consider a special thank you.</span>
                        </div>
                      )}
                      
                      {/* Low Soul Score */}
                      {petSoulData.scores?.overall < 30 && (
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50/80 rounded-lg px-3 py-2">
                          <span>📝</span>
                          <span>Ask a few questions about {petSoulData.pet?.name} to build their profile (Soul: {Math.round(petSoulData.scores.overall)}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Customer History - NEW! */}
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-800">
                    <History className="w-4 h-4" /> Customer History
                  </h4>
                  {loadingHistory ? (
                    <div className="text-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-blue-500" />
                    </div>
                  ) : customerHistory ? (
                    <div className="space-y-2">
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/80 rounded p-1.5">
                          <div className="text-lg font-bold text-blue-600">{customerHistory.stats.total_tickets}</div>
                          <div className="text-[10px] text-gray-500">Tickets</div>
                        </div>
                        <div className="bg-white/80 rounded p-1.5">
                          <div className="text-lg font-bold text-green-600">{customerHistory.stats.total_orders}</div>
                          <div className="text-[10px] text-gray-500">Orders</div>
                        </div>
                        <div className="bg-white/80 rounded p-1.5">
                          <div className="text-lg font-bold text-purple-600">{customerHistory.stats.total_bookings}</div>
                          <div className="text-[10px] text-gray-500">Bookings</div>
                        </div>
                      </div>
                      
                      {/* Satisfaction */}
                      {customerHistory.stats.avg_satisfaction && (
                        <div className="flex items-center justify-center gap-1 bg-white/80 rounded p-1.5">
                          <span className="text-yellow-500">
                            {'⭐'.repeat(Math.round(customerHistory.stats.avg_satisfaction))}
                          </span>
                          <span className="text-xs text-gray-600">
                            ({customerHistory.stats.avg_satisfaction}/5 avg)
                          </span>
                        </div>
                      )}
                      
                      {/* Recent Tickets */}
                      {customerHistory.tickets.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Recent Tickets</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {customerHistory.tickets.slice(0, 3).map(t => (
                              <div 
                                key={t.ticket_id} 
                                className="text-xs bg-white/60 rounded p-1.5 flex items-center justify-between cursor-pointer hover:bg-white"
                                onClick={() => fetchTicketDetails(t.ticket_id)}
                              >
                                <span className="font-mono text-gray-500">{t.ticket_id.slice(-8)}</span>
                                <Badge className={`text-[10px] ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>
                                  {t.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recent Orders */}
                      {customerHistory.orders.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Recent Orders</div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {customerHistory.orders.slice(0, 2).map(o => (
                              <div key={o.id} className="text-xs bg-white/60 rounded p-1.5 flex items-center justify-between">
                                <span>₹{o.total}</span>
                                <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-2">No history available</div>
                  )}
                </Card>

                {/* Pet Soul Card - NEW! */}
                {(selectedTicket.pet?.name || petSoulData) && (
                  <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-purple-800">
                      <span className="text-lg">🐾</span> Pet Soul
                      {loadingPetSoul && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                    </h4>
                    
                    {/* Basic Pet Info from Ticket */}
                    {selectedTicket.pet && (
                      <div className="bg-white/80 rounded-lg p-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                            🐕
                          </div>
                          <div>
                            <div className="font-medium text-purple-900">{selectedTicket.pet.name}</div>
                            <div className="text-xs text-gray-500">
                              {selectedTicket.pet.breed}{selectedTicket.pet.weight_kg ? ` • ${selectedTicket.pet.weight_kg}kg` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Pet Soul Data */}
                    {petSoulData ? (
                      <div className="space-y-2">
                        {/* Soul Score */}
                        <div className="flex items-center justify-between bg-white/80 rounded p-2">
                          <span className="text-xs font-medium text-gray-600">Soul Score</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                style={{ width: `${petSoulData.scores?.overall || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-purple-600">
                              {Math.round(petSoulData.scores?.overall || 0)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Key Insights */}
                        {petSoulData.insights?.key_flags && (
                          <div className="space-y-1">
                            {petSoulData.insights.key_flags.has_allergies && (
                              <div className="flex items-center gap-1 text-xs bg-red-50 text-red-700 rounded px-2 py-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Allergies: {petSoulData.insights.key_flags.allergy_list?.join(', ')}</span>
                              </div>
                            )}
                            {petSoulData.insights.key_flags.anxiety_level !== 'none' && (
                              <div className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Anxiety: {petSoulData.insights.key_flags.anxiety_level}</span>
                              </div>
                            )}
                            {petSoulData.insights.key_flags.has_sensitive_stomach && (
                              <div className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 rounded px-2 py-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Sensitive stomach</span>
                              </div>
                            )}
                            {petSoulData.insights.key_flags.is_crate_trained && (
                              <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded px-2 py-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Crate trained</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Quick Stats */}
                        {petSoulData.pet?.doggy_soul_answers && Object.keys(petSoulData.pet.doggy_soul_answers).length > 0 && (
                          <div className="text-xs text-gray-500 text-center">
                            {Object.keys(petSoulData.pet.doggy_soul_answers).length} questions answered
                          </div>
                        )}
                        
                        {/* View Full Profile Link */}
                        {petSoulData.pet?.id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => window.open(`/pet/${petSoulData.pet.id}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> View Full Pet Soul
                          </Button>
                        )}
                      </div>
                    ) : !loadingPetSoul && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No Pet Soul profile found
                      </div>
                    )}
                  </Card>
                )}

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
                    {loadingAudit && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* Audit Trail from API */}
                    {auditTrail.length > 0 ? (
                      auditTrail.slice(0, 15).map((entry, idx) => (
                        <div key={entry.id || idx} className="flex items-start gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            entry.type === 'status_change' ? 'bg-blue-500' :
                            entry.type === 'assignment' ? 'bg-purple-500' :
                            entry.type === 'message' ? 'bg-green-500' :
                            entry.type === 'sla_breach' ? 'bg-red-500' :
                            entry.type === 'created' ? 'bg-emerald-500' :
                            'bg-gray-400'
                          }`} />
                          <div className="flex-1">
                            <span className="font-medium">
                              {entry.type === 'status_change' ? `Status → ${entry.new_value || entry.action}` :
                               entry.type === 'assignment' ? `Assigned to ${entry.new_value || entry.user}` :
                               entry.type === 'message' ? `${entry.sender === 'member' ? 'Customer' : 'Agent'} replied` :
                               entry.type === 'sla_breach' ? '⚠️ SLA Breached' :
                               entry.type === 'created' ? 'Ticket created' :
                               entry.action || entry.type}
                            </span>
                            {entry.user && entry.type !== 'assignment' && (
                              <span className="text-gray-500 ml-1">by {entry.user}</span>
                            )}
                            <div className="text-gray-400">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {/* Fallback: Show basic timeline from ticket data */}
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
                        
                        {selectedTicket.first_response_at && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">First response</span>
                              <div className="text-gray-400">{new Date(selectedTicket.first_response_at).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedTicket.assigned_to && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Assigned to {selectedTicket.assigned_to}</span>
                            </div>
                          </div>
                        )}
                        
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
                        
                        {selectedTicket.resolved_at && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Resolved</span>
                              <div className="text-gray-400">{new Date(selectedTicket.resolved_at).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedTicket.closed_at && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Closed</span>
                              <div className="text-gray-400">{new Date(selectedTicket.closed_at).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </>
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
                )}
              {/* END of conversation tab */}

              {/* AI Draft Working Surface Panel - REDESIGNED */}
              {showAiPanel && aiDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl w-[70%] max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">AI Draft</h3>
                          <p className="text-sm text-gray-500">Tone: {aiTone}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    {/* Pet Soul Context Indicator - Transparency */}
                    {aiDraft.pet_soul_used && (
                      <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                        <p className="text-xs font-medium text-purple-700 mb-1">Personalised using Pet Soul:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiDraft.personalization_data?.pet_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-purple-700 border border-purple-200">
                              <PawPrint className="w-3 h-3 mr-1" />
                              {aiDraft.personalization_data.pet_name}
                            </span>
                          )}
                          {aiDraft.personalization_data?.breed && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-purple-700 border border-purple-200">
                              {aiDraft.personalization_data.breed}
                            </span>
                          )}
                          {aiDraft.pet_soul_used?.preferences?.favorite_treats?.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-purple-700 border border-purple-200">
                              Treats: {aiDraft.pet_soul_used.preferences.favorite_treats.join(', ')}
                            </span>
                          )}
                          {aiDraft.personalization_data?.recent_activity && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-gray-600 border border-gray-200">
                              Recent: {aiDraft.personalization_data.recent_activity}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Draft Content - Main Working Surface */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="bg-gray-50 rounded-lg p-6 min-h-[250px] border border-gray-200">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {aiDraft.draft}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Controls - Clear Tools */}
                    <div className="px-6 py-4 border-t bg-gray-50">
                      <div className="flex items-center justify-between">
                        {/* Primary Actions */}
                        <div className="flex items-center gap-3">
                          <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                            onClick={() => applyAiDraft(aiDraft.draft)}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" /> Insert to Draft
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => generateAiDraft(aiTone)}
                            disabled={aiLoading}
                          >
                            {aiLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</>
                            ) : (
                              <><RefreshCw className="w-4 h-4 mr-2" /> Redraft</>
                            )}
                          </Button>
                          
                          {/* Refine Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">
                                <Settings className="w-4 h-4 mr-2" /> Refine
                                <ChevronDown className="w-4 h-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setAiTone('shorter'); generateAiDraft('shorter'); }}>
                                Shorter
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setAiTone('formal'); generateAiDraft('formal'); }}>
                                More Formal
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setAiTone('more_empathetic'); generateAiDraft('more_empathetic'); }}>
                                More Empathetic
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setAiTone('remove_fluff'); generateAiDraft('remove_fluff'); }}>
                                Remove Fluff
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Feedback */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 mr-2">Was this helpful?</span>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50">
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                
                {/* INFO Tab */}
                {activeDetailTab === 'info' && (
                  <div className="p-4 space-y-4">
                    {/* Contact Information */}
                    <Card className="p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
                        <User className="w-4 h-4" /> Contact Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Name</span>
                          <span className="font-medium">{selectedTicket.member?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Email</span>
                          <span className="font-medium">{selectedTicket.member?.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Phone</span>
                          <span className="font-medium">{selectedTicket.member?.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">City</span>
                          <span className="font-medium">{selectedTicket.member?.city || 'N/A'}</span>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Ticket Details */}
                    <Card className="p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
                        <Tag className="w-4 h-4" /> Ticket Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Category</span>
                          <span className="font-medium flex items-center gap-1">
                            {CATEGORY_ICONS[selectedTicket.category]} {selectedTicket.category}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Urgency</span>
                          <Badge className={URGENCY_COLORS[selectedTicket.urgency]}>{selectedTicket.urgency}</Badge>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Assigned To</span>
                          <span className="font-medium">{selectedTicket.assigned_to || 'Unassigned'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Source</span>
                          <span className="font-medium capitalize">{selectedTicket.source || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Created</span>
                          <span className="font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs mb-1">Updated</span>
                          <span className="font-medium">{selectedTicket.updated_at ? new Date(selectedTicket.updated_at).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Pet Info if available */}
                    {(selectedTicket.pet || petSoulData?.pet) && (
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-800">
                          🐾 Pet Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 block text-xs mb-1">Name</span>
                            <span className="font-medium">{selectedTicket.pet?.name || petSoulData?.pet?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs mb-1">Breed</span>
                            <span className="font-medium">{selectedTicket.pet?.breed || petSoulData?.pet?.breed || 'N/A'}</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                
                {/* TIME ENTRY Tab */}
                {activeDetailTab === 'time' && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4" /> Time Entries
                      </h4>
                      <Button 
                        size="sm" 
                        onClick={() => setShowTimeEntryModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Entry
                      </Button>
                    </div>
                    
                    {timeEntries.length > 0 ? (
                      <div className="space-y-2">
                        {/* Total Time */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">Total Time</span>
                            <span className="text-lg font-bold text-blue-700">
                              {Math.floor(timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60)}h {timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) % 60}m
                            </span>
                          </div>
                        </div>
                        
                        {timeEntries.map((entry, idx) => (
                          <Card key={entry.id || idx} className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={entry.entry_type === 'work' ? 'bg-blue-100 text-blue-700' : entry.entry_type === 'call' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                    {entry.entry_type}
                                  </Badge>
                                  <span className="font-semibold text-sm">{entry.duration_minutes} mins</span>
                                </div>
                                <p className="text-sm text-gray-600">{entry.description || 'No description'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  By {entry.agent || 'Unknown'} • {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No time entries yet</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowTimeEntryModal(true)}
                          className="mt-2"
                        >
                          Add your first entry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ATTACHMENTS Tab */}
                {activeDetailTab === 'attachments' && (
                  <div className="p-4 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Paperclip className="w-4 h-4" /> Attachments
                    </h4>
                    
                    {selectedTicket.attachments?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTicket.attachments.map((att, idx) => (
                          <Card key={idx} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                            {att.type === 'image' || att.content_type?.startsWith('image/') ? (
                              <div className="w-12 h-12 rounded bg-green-100 flex items-center justify-center">
                                <Image className="w-6 h-6 text-green-600" />
                              </div>
                            ) : att.type === 'voice' || att.content_type?.startsWith('audio/') ? (
                              <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center">
                                <Mic className="w-6 h-6 text-purple-600" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
                                <File className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{att.filename || att.name || 'Attachment'}</p>
                              <p className="text-xs text-gray-500">{att.size ? `${(att.size/1024).toFixed(1)}KB` : ''}</p>
                            </div>
                            {att.file_url && (
                              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded">
                                <ExternalLink className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                              </a>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Paperclip className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No attachments</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ACTIVITY Tab */}
                {activeDetailTab === 'activity' && (
                  <div className="p-4 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Activity className="w-4 h-4" /> Activity Timeline
                    </h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {auditTrail.length > 0 ? (
                        auditTrail.map((entry, idx) => (
                          <div key={entry.id || idx} className="flex items-start gap-3 border-l-2 border-slate-200 pl-4 py-2">
                            <div className={`w-3 h-3 rounded-full -ml-[21px] mt-1.5 ${
                              entry.type === 'status_change' ? 'bg-blue-500' :
                              entry.type === 'assignment' ? 'bg-purple-500' :
                              entry.type === 'message' ? 'bg-green-500' :
                              entry.type === 'sla_breach' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {entry.type === 'status_change' ? `Status changed to ${entry.new_value}` :
                                   entry.type === 'assignment' ? `Assigned to ${entry.new_value}` :
                                   entry.type === 'message' ? `${entry.sender === 'member' ? 'Customer' : 'Agent'} replied` :
                                   entry.action || entry.type}
                                </span>
                                {entry.user && <span className="text-gray-500 text-xs">by {entry.user}</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No activity recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Section - Fixed at bottom with Modal Trigger */}
              <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
                <div className="p-4">
                  {/* Quick Actions Bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <Button 
                      onClick={() => setShowReplyModal(true)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      data-testid="open-reply-modal-btn"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Reply to Ticket
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline"
                          className="bg-white"
                          disabled={aiLoading}
                        >
                          {aiLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" /> AI Draft
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setShowReplyModal(true); generateAiDraft('professional'); }}>
                          <Wand2 className="w-4 h-4 mr-2 text-blue-600" /> Professional
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setShowReplyModal(true); generateAiDraft('friendly'); }}>
                          <span className="mr-2">😊</span> Friendly & Warm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setShowReplyModal(true); generateAiDraft('empathetic'); }}>
                          <span className="mr-2">💝</span> Empathetic
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setShowReplyModal(true); generateAiDraft('quick'); }}>
                          <Zap className="w-4 h-4 mr-2 text-amber-500" /> Quick Response
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Quick Reply Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setIsInternalNote(true);
                        setSendChannel('internal');
                        setShowReplyModal(true);
                      }}
                      className="text-xs"
                    >
                      💬 Internal Note
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setIsInternalNote(false);
                        setSendChannel('email');
                        setShowReplyModal(true);
                      }}
                      className="text-xs"
                      disabled={!(selectedTicket?.member?.email || selectedTicket?.customer_email)}
                    >
                      <Mail className="w-3 h-3 mr-1" /> Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setIsInternalNote(false);
                        setSendChannel('whatsapp');
                        setShowReplyModal(true);
                      }}
                      className="text-xs"
                      disabled={!(selectedTicket?.member?.phone || selectedTicket?.member?.whatsapp || selectedTicket?.customer_phone)}
                    >
                      📱 WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={getAiSummary}
                      className="text-xs ml-auto"
                      disabled={aiLoading}
                    >
                      <Brain className="w-3 h-3 mr-1" /> Summarize
                    </Button>
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
      
      {/* Edit Ticket Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-600" />
              Edit Ticket: {selectedTicket?.ticket_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 py-4">
              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject / Title</Label>
                <Input
                  value={editForm.subject}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ticket subject..."
                />
              </div>
              
              {/* Category (Pillar) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category / Pillar</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {CATEGORY_ICONS[cat.id]} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Urgency</Label>
                  <Select 
                    value={editForm.urgency} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, urgency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">⚪ Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Assigned To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned To</Label>
                <Select 
                  value={editForm.assigned_to || 'unassigned'} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value === 'unassigned' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamUsers.map(user => (
                      <SelectItem key={user.email || user.username} value={user.email || user.username}>
                        {user.name || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ticket description..."
                  rows={4}
                />
              </div>
              
              {/* Source Info (Read-only) */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Source</span>
                    <span className="font-medium capitalize">{selectedTicket.source || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Created</span>
                    <span className="font-medium">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Status</span>
                    <Badge className={STATUS_COLORS[selectedTicket.status]}>{selectedTicket.status}</Badge>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveTicketEdits}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="save-ticket-btn"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Time Entry Modal */}
      <Dialog open={showTimeEntryModal} onOpenChange={setShowTimeEntryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Add Time Entry
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration (minutes)</Label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map(mins => (
                  <Button
                    key={mins}
                    type="button"
                    variant={timeEntryForm.duration_minutes === mins ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeEntryForm(prev => ({ ...prev, duration_minutes: mins }))}
                    className={timeEntryForm.duration_minutes === mins ? 'bg-blue-600' : ''}
                  >
                    {mins}m
                  </Button>
                ))}
                <Input
                  type="number"
                  min="1"
                  max="480"
                  value={timeEntryForm.duration_minutes}
                  onChange={(e) => setTimeEntryForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 15 }))}
                  className="w-20"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Entry Type</Label>
              <Select 
                value={timeEntryForm.entry_type} 
                onValueChange={(value) => setTimeEntryForm(prev => ({ ...prev, entry_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={timeEntryForm.description}
                onChange={(e) => setTimeEntryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowTimeEntryModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addTimeEntry}
                disabled={savingTimeEntry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savingTimeEntry ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Add Entry</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* AI Summary Modal */}
      <Dialog open={showAiSummaryModal} onOpenChange={setShowAiSummaryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Generate AI Summary
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Conversations</Label>
              <div className="flex gap-2">
                {[10, 20, 30, 50].map(num => (
                  <Button
                    key={num}
                    type="button"
                    variant={aiSummaryConfig.num_conversations === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAiSummaryConfig(prev => ({ ...prev, num_conversations: num }))}
                    className={aiSummaryConfig.num_conversations === num ? 'bg-purple-600' : ''}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Include</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={aiSummaryConfig.include_incoming}
                    onCheckedChange={(checked) => setAiSummaryConfig(prev => ({ ...prev, include_incoming: checked }))}
                  />
                  <span className="text-sm">Incoming (from customer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={aiSummaryConfig.include_outgoing}
                    onCheckedChange={(checked) => setAiSummaryConfig(prev => ({ ...prev, include_outgoing: checked }))}
                  />
                  <span className="text-sm">Outgoing (to customer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={aiSummaryConfig.include_internal}
                    onCheckedChange={(checked) => setAiSummaryConfig(prev => ({ ...prev, include_internal: checked }))}
                  />
                  <span className="text-sm">Internal notes</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAiSummaryModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateTicketSummary}
                disabled={generatingSummary}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {generatingSummary ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Brain className="w-4 h-4 mr-2" /> Generate</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reply Modal - Full Popup for Better Visibility */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Reply to Ticket: {selectedTicket?.ticket_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Summary */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs">{selectedTicket.category}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedTicket.status}</Badge>
                </div>
                <h3 className="font-semibold text-sm">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500 mt-1">From: {selectedTicket.member?.name || selectedTicket.customer_name || 'Unknown'}</p>
              </div>
              
              {/* Reply Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Reply Type</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant={isInternalNote ? 'default' : 'outline'}
                    onClick={() => {
                      setIsInternalNote(true);
                      setSendChannel('internal');
                    }}
                    className={`${isInternalNote ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Internal Note
                  </Button>
                  <Button 
                    size="sm" 
                    variant={!isInternalNote && sendChannel === 'email' ? 'default' : 'outline'}
                    onClick={() => {
                      setIsInternalNote(false);
                      setSendChannel('email');
                    }}
                    className={`${!isInternalNote && sendChannel === 'email' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    disabled={!(selectedTicket?.member?.email || selectedTicket?.customer_email)}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Email
                    {(selectedTicket?.member?.email || selectedTicket?.customer_email) && (
                      <span className="ml-1 text-xs opacity-75">({selectedTicket?.member?.email || selectedTicket?.customer_email})</span>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={!isInternalNote && sendChannel === 'whatsapp' ? 'default' : 'outline'}
                    onClick={() => {
                      setIsInternalNote(false);
                      setSendChannel('whatsapp');
                    }}
                    className={`${!isInternalNote && sendChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    disabled={!(selectedTicket?.member?.phone || selectedTicket?.member?.whatsapp || selectedTicket?.customer_phone)}
                  >
                    <Phone className="w-4 h-4 mr-2" /> WhatsApp
                    {(selectedTicket?.member?.phone || selectedTicket?.customer_phone) && (
                      <span className="ml-1 text-xs opacity-75">({selectedTicket?.member?.phone || selectedTicket?.customer_phone})</span>
                    )}
                  </Button>
                </div>
                
                {/* Channel Info Banner */}
                {isInternalNote && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Internal notes are only visible to the team, not the customer.
                  </div>
                )}
                {!isInternalNote && sendChannel === 'email' && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    📧 Email will be sent to: <strong>{selectedTicket?.member?.email || selectedTicket?.customer_email}</strong>
                  </div>
                )}
                {!isInternalNote && sendChannel === 'whatsapp' && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    📱 WhatsApp will open in a new tab to: <strong>{selectedTicket?.member?.phone || selectedTicket?.customer_phone}</strong>
                  </div>
                )}
              </div>
              
              {/* Templates & AI */}
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" /> Templates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                    {cannedResponses.map(resp => (
                      <DropdownMenuItem 
                        key={resp.id} 
                        onClick={() => {
                          setReplyText(resp.content);
                        }}
                        className="flex flex-col items-start py-2"
                      >
                        <span className="font-medium text-sm">{resp.name}</span>
                        <span className="text-xs text-gray-500 line-clamp-1">{resp.content.substring(0, 50)}...</span>
                      </DropdownMenuItem>
                    ))}
                    {cannedResponses.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">No templates available</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI Draft
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => generateAiDraft('professional')}>
                      <Wand2 className="w-4 h-4 mr-2 text-blue-600" /> Professional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generateAiDraft('friendly')}>
                      <span className="mr-2">😊</span> Friendly & Warm
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generateAiDraft('empathetic')}>
                      <span className="mr-2">💝</span> Empathetic
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generateAiDraft('quick')}>
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
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-800">AI Summary</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setAiSummary(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-purple-700">{aiSummary}</p>
                </div>
              )}
              
              {/* AI Actions Display */}
              {aiActions.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Suggested Actions</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setAiActions([])}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {(Array.isArray(aiActions) ? aiActions : [aiActions]).slice(0, 4).map((action, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-amber-500">•</span> {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Reply Text - Rich Text Editor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {isInternalNote ? 'Internal Note' : 'Reply Message'}
                </Label>
                <RichTextEditor
                  value={replyText}
                  onChange={setReplyText}
                  placeholder={
                    isInternalNote 
                      ? "Add internal note (only visible to team)..." 
                      : sendChannel === 'email'
                        ? "Compose your email reply with formatting..."
                        : sendChannel === 'whatsapp'
                          ? "Type your WhatsApp message..."
                          : "Type your professional reply..."
                  }
                  minHeight="180px"
                  showAI={true}
                  onAIGenerate={handleAIDraft}
                  aiLoading={aiLoading}
                />
              </div>
              
              {/* Attachments Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Attachments</Label>
                
                {/* Attachment Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {/* Document Upload */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert('File too large. Maximum 10MB allowed.');
                            return;
                          }
                          setReplyAttachments(prev => [...prev, {
                            id: Date.now(),
                            type: 'document',
                            name: file.name,
                            size: file.size,
                            file: file
                          }]);
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                      <File className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Document</span>
                    </div>
                  </label>
                  
                  {/* Image Upload */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image too large. Maximum 5MB allowed.');
                            return;
                          }
                          const url = URL.createObjectURL(file);
                          setReplyAttachments(prev => [...prev, {
                            id: Date.now(),
                            type: 'image',
                            name: file.name,
                            size: file.size,
                            file: file,
                            preview: url
                          }]);
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Image className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Image</span>
                    </div>
                  </label>
                  
                  {/* Voice Recording */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (isRecording) {
                        // Stop recording
                        if (mediaRecorder) {
                          mediaRecorder.stop();
                          setIsRecording(false);
                        }
                      } else {
                        // Start recording
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          const recorder = new MediaRecorder(stream);
                          const chunks = [];
                          
                          recorder.ondataavailable = (e) => chunks.push(e.data);
                          recorder.onstop = () => {
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            setAudioBlob(blob);
                            setReplyAttachments(prev => [...prev, {
                              id: Date.now(),
                              type: 'voice',
                              name: `Voice Recording ${new Date().toLocaleTimeString()}`,
                              size: blob.size,
                              blob: blob,
                              duration: recordingTime
                            }]);
                            setRecordingTime(0);
                            stream.getTracks().forEach(track => track.stop());
                          };
                          
                          recorder.start();
                          setMediaRecorder(recorder);
                          setIsRecording(true);
                          
                          // Recording timer
                          const startTime = Date.now();
                          const timer = setInterval(() => {
                            setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
                          }, 1000);
                          
                          recorder.onstop = () => {
                            clearInterval(timer);
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            setReplyAttachments(prev => [...prev, {
                              id: Date.now(),
                              type: 'voice',
                              name: `Voice Recording ${new Date().toLocaleTimeString()}`,
                              size: blob.size,
                              blob: blob,
                              duration: recordingTime
                            }]);
                            setRecordingTime(0);
                            stream.getTracks().forEach(track => track.stop());
                          };
                        } catch (err) {
                          console.error('Error accessing microphone:', err);
                          alert('Could not access microphone. Please check permissions.');
                        }
                      }
                    }}
                    className={`flex items-center gap-2 ${isRecording ? 'bg-red-100 border-red-300 text-red-700' : ''}`}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle className="w-4 h-4 text-red-600 animate-pulse" />
                        <span className="text-sm">Stop ({recordingTime}s)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Voice</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Attachments Preview */}
                {replyAttachments.length > 0 && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{replyAttachments.length} attachment(s)</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-red-600 hover:text-red-700"
                        onClick={() => setReplyAttachments([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map(att => (
                        <div 
                          key={att.id} 
                          className="flex items-center gap-2 px-2 py-1 bg-white border rounded-lg text-xs"
                        >
                          {att.type === 'document' && <File className="w-3 h-3 text-blue-600" />}
                          {att.type === 'image' && (
                            att.preview ? (
                              <img src={att.preview} alt="" className="w-6 h-6 rounded object-cover" />
                            ) : (
                              <Image className="w-3 h-3 text-green-600" />
                            )
                          )}
                          {att.type === 'voice' && <Mic className="w-3 h-3 text-purple-600" />}
                          <span className="max-w-[100px] truncate">{att.name}</span>
                          <span className="text-gray-400">({(att.size / 1024).toFixed(1)}KB)</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 hover:bg-red-100"
                            onClick={() => setReplyAttachments(prev => prev.filter(a => a.id !== att.id))}
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => {
                  setShowReplyModal(false);
                  setReplyAttachments([]);
                  setAudioBlob(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    await handleReply();
                    setShowReplyModal(false);
                    setReplyAttachments([]);
                    setAudioBlob(null);
                  }} 
                  disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)} 
                  className={`min-w-[120px] ${
                    isInternalNote ? 'bg-gray-600 hover:bg-gray-700' :
                    sendChannel === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 
                    sendChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                  data-testid="modal-send-reply-btn"
                >
                  {sendingReply ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> 
                      {isInternalNote ? 'Add Note' : sendChannel === 'email' ? 'Send Email' : 'Open WhatsApp'}
                      {replyAttachments.length > 0 && ` (${replyAttachments.length})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Merge Tickets Modal */}
      <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="w-5 h-5 text-purple-600" />
              Merge Tickets
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTickets.size < 2 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
                <p className="text-gray-600">Select at least 2 tickets from the list to merge.</p>
                <p className="text-sm text-gray-400 mt-2">Use the checkboxes in the ticket list.</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Warning:</strong> Merging tickets cannot be undone. All messages from selected tickets will be combined into the primary ticket.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Tickets ({selectedTickets.size})</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {Array.from(selectedTickets).map((ticketId, idx) => {
                      const ticket = tickets.find(t => t.ticket_id === ticketId);
                      return (
                        <div key={ticketId} className={`p-2 rounded text-sm ${idx === 0 ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border'}`}>
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Badge className="bg-purple-600 text-xs">Primary</Badge>}
                            <span className="font-mono text-xs">{ticketId}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{ticket?.subject || 'Unknown'}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500">The first selected ticket will be the primary (all others merge into it).</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowMergeModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={mergeTickets}
                    disabled={merging || selectedTickets.size < 2}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {merging ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Merging...</>
                    ) : (
                      <><Merge className="w-4 h-4 mr-2" /> Merge Tickets</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
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
      await fetch(`${getApiUrl()}/api/tickets/categories/custom`, {
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
      await fetch(`${getApiUrl()}/api/tickets/categories/sub`, {
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
      await fetch(`${getApiUrl()}/api/tickets/categories/custom/${categoryId}`, {
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
