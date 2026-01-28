import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import {
  ArrowLeft, Search, Filter, RefreshCw, Clock, User, PawPrint,
  AlertCircle, CheckCircle, MessageCircle, Mail, Phone, Crown,
  Package, Inbox, Heart, Cake, Utensils, Plane, Home, Briefcase,
  ChevronRight, Send, Edit, Flag, Link2, Bell, History, Brain,
  ShoppingBag, Tag, Calendar, X, Check, Loader2, Sparkles,
  Timer, TrendingUp, BarChart3, Users, Zap, ExternalLink, Plus, Download,
  Activity, GitMerge
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Debug logging for production issues
const DEBUG_MODE = false; // Set to true for development debugging only
const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log('[CommandCenter]', ...args);
  }
};

// SLA Configuration (must match backend)
const SLA_HOURS = {
  urgent: 2,
  high: 4,
  medium: 24,
  low: 48
};

// SLA Timer Component - Real-time countdown
const SLATimer = ({ createdAt, priority, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  useEffect(() => {
    const slaHours = SLA_HOURS[priority] || 24;
    
    const calculateTimeLeft = () => {
      if (!createdAt) return null;
      
      const created = new Date(createdAt);
      const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline - now;
      
      return {
        total: diff,
        hours: Math.floor(Math.abs(diff) / (1000 * 60 * 60)),
        minutes: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((Math.abs(diff) % (1000 * 60)) / 1000),
        breached: diff < 0,
        warning: diff > 0 && diff < 60 * 60 * 1000 // Less than 1 hour
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [createdAt, priority]);
  
  if (!timeLeft) return null;
  
  const { hours, minutes, seconds, breached, warning } = timeLeft;
  
  if (compact) {
    return (
      <span className={`text-xs font-mono ${breached ? 'text-red-600 font-bold' : warning ? 'text-orange-500' : 'text-gray-500'}`}>
        {breached ? '⚠️ ' : '⏱️ '}
        {hours}h {minutes}m {breached ? 'over' : ''}
      </span>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      breached ? 'bg-red-100 text-red-700 animate-pulse' : 
      warning ? 'bg-orange-100 text-orange-700' : 
      'bg-gray-100 text-gray-700'
    }`}>
      <Timer className="w-4 h-4" />
      <span className="font-mono font-medium">
        {breached ? 'OVERDUE: ' : 'SLA: '}
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {breached && <AlertCircle className="w-4 h-4 animate-bounce" />}
    </div>
  );
};

// Source icons and colors
const SOURCE_CONFIG = {
  mira: { icon: Brain, color: 'purple', label: 'Mira Request', bg: 'bg-purple-100' },
  ticket: { icon: Briefcase, color: 'blue', label: 'Service Desk', bg: 'bg-blue-100' },
  order: { icon: Package, color: 'green', label: 'Order', bg: 'bg-green-100' },
  inbox: { icon: Inbox, color: 'orange', label: 'Inbox', bg: 'bg-orange-100' },
  health_alert: { icon: Heart, color: 'red', label: 'Health Alert', bg: 'bg-red-100' },
  celebration: { icon: Cake, color: 'pink', label: 'Birthday', bg: 'bg-pink-100' }
};

// Priority colors
const PRIORITY_CONFIG = {
  urgent: { color: 'red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
  high: { color: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
  medium: { color: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  low: { color: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' }
};

/**
 * Concierge Command Center
 * "The Command Center is not a dashboard. It is the concierge's desk.
 * Everything opens into it, nothing pulls you away from it."
 */
const ConciergeCommandCenter = ({ agentId, agentName, isAdminMode = false }) => {
  // Queue state
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attention, setAttention] = useState({});
  const [buckets, setBuckets] = useState({});
  const [pillarStats, setPillarStats] = useState({});
  
  // Filters (preserved on back navigation)
  const [filters, setFilters] = useState({
    source: 'all',
    priority: null,
    status: null,
    pillar: null,
    search: ''
  });
  
  // Selected item panel
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Scroll position preservation
  const scrollRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Bulk selection
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Agents list for manual assignment
  const [agents, setAgents] = useState([]);
  
  // Pet Parents and Pet Profiles for auto-populate
  const [petParents, setPetParents] = useState([]);
  const [petProfiles, setPetProfiles] = useState([]);
  
  // Event Stream
  const [showEventStream, setShowEventStream] = useState(false);
  const [eventStream, setEventStream] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // SLA Breach Audio Alerts
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('tdb_sla_audio_enabled');
    return saved !== 'false'; // Default to true
  });
  const previousBreachCountRef = useRef(0);
  const audioRef = useRef(null);
  
  // Play SLA breach alert sound
  const playBreachAlert = useCallback(() => {
    if (!audioEnabled) return;
    
    try {
      // Create a more noticeable alert sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play 3 beeps
      [0, 0.2, 0.4].forEach((delay) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880; // A5 note - urgent sounding
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.15);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.15);
      });
    } catch (e) {
      console.log('Audio alert not available:', e);
    }
  }, [audioEnabled]);
  
  // Toggle audio alerts
  const toggleAudio = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    localStorage.setItem('tdb_sla_audio_enabled', String(newValue));
    if (newValue) {
      // Test sound when enabling
      playBreachAlert();
    }
  };
  
  // Create ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    pillar: 'general',
    urgency: 'medium',
    subject: '',
    description: '',
    member_email: '',
    member_name: '',
    member_phone: '',
    pet_name: '',
    assigned_to: ''
  });
  const [creating, setCreating] = useState(false);
  
  // Pillar configuration - THE 14 PILLARS
  const PILLARS = [
    { id: 'celebrate', name: 'Celebrate', icon: '🎂' },
    { id: 'dine', name: 'Dine', icon: '🍽️' },
    { id: 'stay', name: 'Stay', icon: '🏨' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'care', name: 'Care', icon: '💊' },
    { id: 'enjoy', name: 'Enjoy', icon: '🎾' },
    { id: 'fit', name: 'Fit', icon: '🏃' },
    { id: 'learn', name: 'Learn', icon: '🎓' },
    { id: 'paperwork', name: 'Paperwork', icon: '📄' },
    { id: 'advisory', name: 'Advisory', icon: '📋' },
    { id: 'emergency', name: 'Emergency', icon: '🚨' },
    { id: 'farewell', name: 'Farewell', icon: '🌈' },
    { id: 'adopt', name: 'Adopt', icon: '🐾' },
    { id: 'shop', name: 'Shop', icon: '🛒' }
  ];

  // Load agents for assignment dropdown
  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/concierge/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }, []);

  // Load pet parents and pet profiles for auto-populate in ticket forms
  const loadPetData = useCallback(async () => {
    const authHeaders = { 'Content-Type': 'application/json' };
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      authHeaders['Authorization'] = `Bearer ${adminToken}`;
    }
    
    try {
      // Fetch pet parents/members
      const membersRes = await fetch(`${API_URL}/api/admin/members/directory`, { headers: authHeaders });
      if (membersRes.ok) {
        const data = await membersRes.json();
        setPetParents(data.members || []);
      }
      
      // Fetch pets
      const petsRes = await fetch(`${API_URL}/api/admin/pets?limit=100`, { headers: authHeaders });
      if (petsRes.ok) {
        const data = await petsRes.json();
        setPetProfiles(data.pets || []);
      }
    } catch (error) {
      console.error('Failed to load pet data:', error);
    }
  }, []);

  // Load pillar stats
  const loadPillarStats = useCallback(async () => {
    try {
      const url = `${API_URL}/api/concierge/pillar-stats`;
      debugLog('Fetching pillar stats from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        debugLog('Pillar stats received:', data);
        setPillarStats(data.pillars || {});
      } else {
        debugLog('Pillar stats response not OK:', response.status);
      }
    } catch (error) {
      console.error('Failed to load pillar stats:', error);
      debugLog('Pillar stats fetch error:', error.message);
    }
  }, []);

  // Load event stream
  const loadEventStream = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/event-stream?limit=30`);
      if (response.ok) {
        const data = await response.json();
        setEventStream(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load event stream:', error);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Load queue
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    debugLog('Loading queue with filters:', filters);
    debugLog('API_URL:', API_URL);
    
    if (!API_URL) {
      setLoadError('API_URL is not configured. Please check REACT_APP_BACKEND_URL environment variable.');
      setLoading(false);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.pillar) params.append('pillar', filters.pillar);
      if (filters.search) params.append('search', filters.search);
      
      const url = `${API_URL}/api/concierge/queue?${params}`;
      debugLog('Fetching from:', url);
      
      const response = await fetch(url);
      debugLog('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        debugLog('Queue data received:', {
          itemCount: data.items?.length || 0,
          attention: data.attention,
          buckets: data.buckets
        });
        
        // Check for SLA breaches and play alert if new ones detected
        const breachedItems = (data.items || []).filter(item => item.sla_breached);
        const currentBreachCount = breachedItems.length;
        
        if (currentBreachCount > previousBreachCountRef.current && previousBreachCountRef.current > 0) {
          // New SLA breach detected - play alert
          playBreachAlert();
        }
        previousBreachCountRef.current = currentBreachCount;
        
        setQueue(data.items || []);
        setAttention(data.attention || {});
        setBuckets(data.buckets || {});
      } else {
        const errorText = await response.text();
        debugLog('Response not OK:', response.status, errorText);
        setLoadError(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      debugLog('Fetch error:', error.message);
      setLoadError(`Network error: ${error.message}. API_URL: ${API_URL}`);
    } finally {
      setLoading(false);
    }
  }, [filters, playBreachAlert]);

  useEffect(() => {
    loadQueue();
    loadAgents();
    loadPillarStats();
    loadPetData();
    
    // Auto-refresh every 60 seconds to check for SLA breaches
    const autoRefreshInterval = setInterval(() => {
      loadQueue();
    }, 60000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [loadQueue, loadAgents, loadPillarStats, loadPetData]);

  // Load item detail
  const loadItemDetail = async (ticketId) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setItemDetail(data);
        // Pre-fill draft if exists
        if (data.item?.auto_draft?.content) {
          setDraft(data.item.auto_draft.content);
        }
      }
    } catch (error) {
      console.error('Failed to load item detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open item (preserve scroll)
  const openItem = (item) => {
    scrollPositionRef.current = scrollRef.current?.scrollTop || 0;
    setSelectedItem(item);
    setDraft('');
    setInternalNotes('');
    setResolutionNotes('');
    loadItemDetail(item.ticket_id);
  };

  // Close panel (restore scroll)
  const closePanel = () => {
    setSelectedItem(null);
    setItemDetail(null);
    // Restore scroll position
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollPositionRef.current;
      }
    }, 50);
  };

  // Actions
  const claimItem = async () => {
    if (!selectedItem) return;
    setActionLoading('claim');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, agent_name: agentName })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const unclaimItem = async () => {
    if (!selectedItem) return;
    setActionLoading('unclaim');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/unclaim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, agent_name: agentName })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Unclaim failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const generateDraft = async () => {
    if (!selectedItem) return;
    setDraftLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/generate-draft`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setDraft(data.draft);
          setResolutionNotes(data.draft);
        }
      }
    } catch (error) {
      console.error('Draft generation failed:', error);
    } finally {
      setDraftLoading(false);
    }
  };

  const resolveItem = async (sendVia) => {
    if (!selectedItem || !resolutionNotes.trim()) {
      alert('Please enter resolution notes before resolving.');
      return;
    }
    setActionLoading('resolve');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolutionNotes,
          internal_notes: internalNotes,
          send_via: sendVia,
          agent_id: agentId,
          agent_name: agentName
        })
      });
      if (response.ok) {
        closePanel();
        loadQueue();
      }
    } catch (error) {
      console.error('Resolve failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const escalateItem = async () => {
    const reason = prompt('Escalation reason:');
    if (!reason) return;
    setActionLoading('escalate');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: reason, agent_id: agentId, agent_name: agentName, is_internal: true })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Escalate failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Omni-Channel: Send via Email
  const sendViaEmail = async () => {
    if (!selectedItem || !resolutionNotes.trim()) {
      alert('Please enter a message first.');
      return;
    }
    
    const memberEmail = itemDetail?.member_snapshot?.email || 
                        itemDetail?.item?.member?.email ||
                        itemDetail?.item?.customer?.email;
    
    if (!memberEmail) {
      alert('No email address found for this member.');
      return;
    }
    
    setActionLoading('email');
    try {
      const response = await fetch(`${API_URL}/api/concierge/reply/email?ticket_id=${selectedItem.ticket_id}&message=${encodeURIComponent(resolutionNotes)}&recipient_email=${encodeURIComponent(memberEmail)}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Email sent successfully to ${memberEmail}`);
        // Also resolve the ticket
        await resolveItem('email');
      } else {
        const error = await response.json();
        alert(`Failed to send email: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Email send failed:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Omni-Channel: Send via WhatsApp (click-to-chat)
  const sendViaWhatsApp = async () => {
    if (!selectedItem || !resolutionNotes.trim()) {
      alert('Please enter a message first.');
      return;
    }
    
    const memberPhone = itemDetail?.member_snapshot?.phone || 
                        itemDetail?.item?.member?.phone ||
                        itemDetail?.item?.customer?.phone;
    
    if (!memberPhone) {
      alert('No phone number found for this member.');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/concierge/reply/whatsapp?ticket_id=${selectedItem.ticket_id}&message=${encodeURIComponent(resolutionNotes)}&recipient_phone=${encodeURIComponent(memberPhone)}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        // Open WhatsApp in new tab
        window.open(result.link, '_blank');
        // Ask if they want to resolve
        if (confirm('WhatsApp opened. Mark ticket as resolved?')) {
          await resolveItem('whatsapp');
        }
      }
    } catch (error) {
      console.error('WhatsApp link generation failed:', error);
    }
  };

  // Auto-assign ticket
  const autoAssignTicket = async () => {
    if (!selectedItem) return;
    setActionLoading('autoassign');
    try {
      const response = await fetch(`${API_URL}/api/concierge/auto-assign/${selectedItem.ticket_id}`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Assigned to: ${result.assigned_to}`);
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Auto-assign failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Actions (without opening detail panel)
  const quickAction = async (ticketId, action, extraData = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${ticketId}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, agent_id: agentId, ...extraData })
      });
      if (response.ok) {
        loadQueue();
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };

  // Manual assign
  const manualAssign = async (ticketId, agentUsername) => {
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${ticketId}/manual-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_username: agentUsername })
      });
      if (response.ok) {
        loadQueue();
        if (selectedItem?.ticket_id === ticketId) {
          loadItemDetail(ticketId);
        }
      }
    } catch (error) {
      console.error('Manual assign failed:', error);
    }
  };

  // Bulk actions
  const bulkAction = async (action, extraData = {}) => {
    if (selectedTickets.size === 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/concierge/bulk-action?action=${action}&agent_id=${agentId}${extraData.new_status ? `&new_status=${extraData.new_status}` : ''}${extraData.new_priority ? `&new_priority=${extraData.new_priority}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Array.from(selectedTickets))
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Bulk action completed: ${result.successful}/${result.total} successful`);
        setSelectedTickets(new Set());
        loadQueue();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Merge tickets
  const handleMergeTickets = async () => {
    if (selectedTickets.size < 2) {
      alert('Select at least 2 tickets to merge');
      return;
    }
    
    const ticketIds = Array.from(selectedTickets);
    const primaryTicketId = ticketIds[0]; // First selected ticket becomes primary
    const secondaryTicketIds = ticketIds.slice(1);
    
    const confirmMerge = window.confirm(
      `Merge ${secondaryTicketIds.length} ticket(s) into ${primaryTicketId}?\n\n` +
      `Primary (will remain): ${primaryTicketId}\n` +
      `Secondary (will be marked as merged): ${secondaryTicketIds.join(', ')}\n\n` +
      `All history will be preserved.`
    );
    
    if (!confirmMerge) return;
    
    try {
      const response = await fetch(`${API_URL}/api/concierge/tickets/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_ticket_id: primaryTicketId,
          secondary_ticket_ids: secondaryTicketIds,
          agent_name: agentName || 'Admin',
          merge_reason: 'Merged via Command Center'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        setSelectedTickets(new Set());
        loadQueue();
      } else {
        const error = await response.json();
        alert(`Failed to merge: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge tickets');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const params = new URLSearchParams();
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.pillar) params.append('pillar', filters.pillar);
    if (filters.status) params.append('status', filters.status);
    
    window.open(`${API_URL}/api/concierge/export/csv?${params}`, '_blank');
  };

  // Toggle ticket selection
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

  // Create new ticket
  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      alert('Please fill in subject and description');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/ticket/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newTicket.pillar,
          pillar: newTicket.pillar,
          urgency: newTicket.urgency,
          subject: newTicket.subject,
          description: newTicket.description,
          member_email: newTicket.member_email || null,
          member_name: newTicket.member_name || null,
          member_phone: newTicket.member_phone || null,
          pet_name: newTicket.pet_name || null,
          assigned_to: newTicket.assigned_to || null,
          source: 'manual'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Ticket created: ${result.ticket_id}`);
        setShowCreateModal(false);
        setNewTicket({
          pillar: 'general',
          urgency: 'medium',
          subject: '',
          description: '',
          member_email: '',
          member_name: '',
          member_phone: '',
          pet_name: '',
          assigned_to: ''
        });
        loadQueue();
        loadPillarStats();
      } else {
        const error = await response.json();
        alert(`Failed to create ticket: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create ticket failed:', error);
      alert('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  // Render queue item
  const QueueItem = ({ item }) => {
    const sourceConfig = SOURCE_CONFIG[item.source_type] || SOURCE_CONFIG.ticket;
    const priorityConfig = PRIORITY_CONFIG[item.priority_bucket] || PRIORITY_CONFIG.medium;
    const SourceIcon = sourceConfig.icon;
    const isSelected = selectedTickets.has(item.ticket_id);
    
    return (
      <div
        className={`p-4 bg-white rounded-lg border hover:shadow-md transition-all ${
          item.sla_breached ? 'border-red-400 bg-red-50' : isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox for bulk selection */}
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTicketSelection(item.ticket_id)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
          
          {/* Source Icon */}
          <div className={`p-2 rounded-lg ${sourceConfig.bg}`} onClick={() => openItem(item)}>
            <SourceIcon className={`w-5 h-5 text-${sourceConfig.color}-600`} />
          </div>
          
          {/* Content - Clickable to open detail */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openItem(item)}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-gray-500">{item.ticket_id}</span>
              <Badge className={`text-xs ${priorityConfig.bg} ${priorityConfig.text} border-0`}>
                {item.priority_bucket}
              </Badge>
              {/* Sentiment Badge */}
              {item.sentiment && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    item.sentiment.color === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
                    item.sentiment.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                    item.sentiment.color === 'green' ? 'bg-green-100 text-green-700 border-green-300' :
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                  title={item.sentiment.summary || ''}
                >
                  {item.sentiment.emoji} {item.sentiment.sentiment}
                </Badge>
              )}
              {item.pillar && (
                <Badge variant="outline" className="text-xs">
                  {PILLARS.find(p => p.id === item.pillar)?.icon || '📋'} {item.pillar}
                </Badge>
              )}
              {item.sla_breached && (
                <Badge variant="destructive" className="text-xs">SLA BREACH</Badge>
              )}
              {/* SLA Timer */}
              <SLATimer createdAt={item.created_at} priority={item.priority_bucket} compact={true} />
            </div>
            
            <p className="font-medium text-gray-800 truncate">
              {item.original_request?.slice(0, 80) || 'No description'}...
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {item.member?.name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.member.name}
                </span>
              )}
              {item.pets && item.pets.length > 0 && (
                <span className="flex items-center gap-1">
                  <PawPrint className="w-3 h-3" />
                  {item.pets.map(p => p.pet_pass_number ? `${p.name} (${p.pet_pass_number})` : p.name).join(', ')}
                </span>
              )}
              {item.pet_pass_number && !item.pets?.length && (
                <span className="flex items-center gap-1 font-mono text-purple-600">
                  🎫 {item.pet_pass_number}
                </span>
              )}
              {item.assigned_to && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Users className="w-3 h-3" />
                  {item.assigned_to}
                </span>
              )}
            </div>
          </div>
          
          {/* Quick Actions Dropdown */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Quick Claim */}
            {!item.assigned_to && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-green-600 hover:bg-green-50"
                onClick={() => quickAction(item.ticket_id, 'claim')}
                title="Quick Claim"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            
            {/* Manual Assign Dropdown */}
            <select
              className="h-8 text-xs border rounded px-1 bg-white"
              value={item.assigned_to || ''}
              onChange={(e) => e.target.value && manualAssign(item.ticket_id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Assign...</option>
              {agents.map(a => (
                <option key={a.username} value={a.username}>{a.username}</option>
              ))}
            </select>
            
            {/* Open Detail */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => openItem(item)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // If item is selected, show the detail panel
  if (selectedItem) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Back Header with SLA Timer */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={closePanel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Command Center
          </Button>
          <div className="flex-1" />
          {/* SLA Timer - Full version in header */}
          <SLATimer createdAt={selectedItem.created_at} priority={selectedItem.priority_bucket} />
          <Badge className={SOURCE_CONFIG[selectedItem.source_type]?.bg || 'bg-gray-100'}>
            {selectedItem.source_label || selectedItem.source_type}
          </Badge>
          {/* Sentiment Badge */}
          {selectedItem.sentiment && (
            <Badge 
              className={`${
                selectedItem.sentiment.color === 'red' ? 'bg-red-100 text-red-700' :
                selectedItem.sentiment.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                selectedItem.sentiment.color === 'green' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}
              title={`Sentiment: ${selectedItem.sentiment.summary || selectedItem.sentiment.sentiment}`}
            >
              {selectedItem.sentiment.emoji} {selectedItem.sentiment.sentiment}
            </Badge>
          )}
          <span className="font-mono text-sm text-gray-500">{selectedItem.ticket_id}</span>
        </div>

        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* LEFT COLUMN: Member & Pet Snapshot + Request */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* A. Member Snapshot - CLICKABLE */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Member Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {itemDetail?.member_snapshot ? (
                      <>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg -mx-2 transition-colors"
                          onClick={() => {
                            const email = itemDetail.member_snapshot.email;
                            if (email) {
                              window.open(`/admin?tab=member-directory&email=${encodeURIComponent(email)}`, '_blank');
                            }
                          }}
                          title="Click to view full 360° profile"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-purple-700 hover:underline">{itemDetail.member_snapshot.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                {itemDetail.member_snapshot.membership_tier}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {itemDetail.member_snapshot.email}
                          </p>
                          {itemDetail.member_snapshot.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {itemDetail.member_snapshot.phone}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No member info</p>
                    )}
                    
                    {/* Pets - with Pet Pass Numbers */}
                    {itemDetail?.pets_snapshot?.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">🐾 Pets ({itemDetail.pets_snapshot.length})</p>
                        <div className="space-y-2">
                          {itemDetail.pets_snapshot.map((pet, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-sm">
                                {pet.name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{pet.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{pet.breed}</span>
                                  {pet.pet_pass_number && (
                                    <span className="font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                      {pet.pet_pass_number}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {pet.allergies?.length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  ⚠️ Allergies
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* B. The Request - EXPANDED & PROMINENT */}
                <Card className="border-2 border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <MessageCircle className="w-4 h-4" />
                        Customer Request
                      </CardTitle>
                      <Badge className={SOURCE_CONFIG[selectedItem.source_type]?.bg || 'bg-gray-100'}>
                        {SOURCE_CONFIG[selectedItem.source_type]?.label || selectedItem.type || 'Request'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Ticket ID & Source */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {selectedItem.ticket_id}
                      </span>
                      {selectedItem.source && (
                        <Badge variant="outline" className="text-xs">
                          via {selectedItem.source}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Request Content - More Prominent */}
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedItem.original_request || 'No request details available'}
                      </p>
                    </div>
                    
                    {/* Subject line if available */}
                    {selectedItem.subject && (
                      <div className="text-xs">
                        <span className="text-gray-500">Subject: </span>
                        <span className="font-medium">{selectedItem.subject}</span>
                      </div>
                    )}
                    
                    {/* Sentiment indicator if available */}
                    {selectedItem.sentiment && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedItem.sentiment.emoji || '🔵'}</span>
                        <span className="text-xs text-gray-600 capitalize">
                          {selectedItem.sentiment.sentiment} sentiment
                        </span>
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                      <Clock className="w-3 h-3" />
                      Received: {selectedItem.created_at && new Date(selectedItem.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(itemDetail?.timeline || []).slice(0, 5).map((event, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5" />
                          <div>
                            <span className="font-medium">{event.action}</span>
                            <span className="text-gray-500 ml-1">
                              by {event.performed_by}
                            </span>
                            {event.timestamp && (
                              <p className="text-gray-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MIDDLE COLUMN: Mira's Intelligence */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                      <Brain className="w-4 h-4" />
                      Mira's Intelligence
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Past Orders */}
                    {itemDetail?.mira_intelligence?.past_orders?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Past Orders
                        </p>
                        <div className="space-y-2">
                          {itemDetail.mira_intelligence.past_orders.slice(0, 3).map((order, idx) => (
                            <div key={idx} className="p-2 bg-white rounded text-xs">
                              <p className="font-medium">Order #{order.order_id}</p>
                              <p className="text-gray-500">₹{order.total}</p>
                              {order.items?.slice(0, 2).map((item, i) => (
                                <p key={i} className="text-gray-600">• {item.name}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Memories */}
                    {itemDetail?.mira_intelligence?.memories?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> What We Remember
                        </p>
                        <div className="space-y-1">
                          {itemDetail.mira_intelligence.memories.slice(0, 4).map((mem, idx) => (
                            <div key={idx} className="p-2 bg-white rounded text-xs">
                              <p className="text-gray-700">{mem.content}</p>
                              {mem.pet_name && (
                                <span className="text-purple-500 text-xs">🐾 {mem.pet_name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pet Soul Insights */}
                    {itemDetail?.mira_intelligence?.pet_soul_insights?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Heart className="w-3 h-3" /> Pet Soul™ Insights
                        </p>
                        {itemDetail.mira_intelligence.pet_soul_insights.map((insight, idx) => (
                          <div key={idx} className="p-2 bg-white rounded text-xs mb-1">
                            <p className="font-medium">{insight.pet_name}</p>
                            {insight.persona && <p>Persona: {insight.persona}</p>}
                            {insight.favorite_flavors?.length > 0 && (
                              <p>Loves: {insight.favorite_flavors.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Generate Draft Button */}
                    <Button 
                      onClick={generateDraft} 
                      disabled={draftLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      {draftLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Draft</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: Action & Resolution */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Status & Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={PRIORITY_CONFIG[selectedItem.priority_bucket]?.bg}>
                        {selectedItem.priority_bucket} priority
                      </Badge>
                      <Badge variant="outline">{selectedItem.status || 'pending'}</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {!selectedItem.assigned_to ? (
                        <Button 
                          onClick={claimItem}
                          disabled={actionLoading === 'claim'}
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === 'claim' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim'}
                        </Button>
                      ) : selectedItem.assigned_to === agentId ? (
                        <Button 
                          onClick={unclaimItem}
                          disabled={actionLoading === 'unclaim'}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === 'unclaim' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unclaim'}
                        </Button>
                      ) : (
                        <Badge variant="secondary">Claimed by {selectedItem.assigned_name}</Badge>
                      )}
                      
                      <Button 
                        onClick={escalateItem}
                        disabled={actionLoading === 'escalate'}
                        variant="outline"
                        size="sm"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Panel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Internal Notes */}
                    <div>
                      <label className="text-xs font-medium text-gray-600">Internal Notes (not shown to member)</label>
                      <Textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Notes for team only..."
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>

                    {/* Resolution Notes (member-facing) */}
                    <div>
                      <label className="text-xs font-medium text-gray-600">Message to Member *</label>
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Type your response here... (required to resolve)"
                        rows={4}
                        className="mt-1 text-sm"
                      />
                      {!resolutionNotes.trim() && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ Enter a message to enable resolve buttons</p>
                      )}
                      {draft && !resolutionNotes && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 text-purple-600"
                          onClick={() => setResolutionNotes(draft)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" /> Use AI Draft
                        </Button>
                      )}
                      {/* Quick Resolution Templates */}
                      {!resolutionNotes && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => setResolutionNotes("Thank you for reaching out! Your request has been processed successfully. Please let us know if you need any further assistance. 🐾")}
                          >
                            ✅ Standard
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => setResolutionNotes("We've noted your request and our team is working on it. We'll update you shortly with more details.")}
                          >
                            ⏳ In Progress
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => setResolutionNotes("We've passed your request to our specialized team. They will reach out directly within 24 hours.")}
                          >
                            📞 Escalated
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Send Options */}
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">Resolve & Send via:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => resolveItem('mira')}
                          disabled={actionLoading === 'resolve' || !resolutionNotes.trim()}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Brain className="w-4 h-4 mr-1" /> Mira Thread
                        </Button>
                        <Button
                          onClick={() => sendViaEmail()}
                          disabled={actionLoading === 'email' || !resolutionNotes.trim()}
                          size="sm"
                          variant="outline"
                        >
                          {actionLoading === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                          Email
                        </Button>
                        <Button
                          onClick={() => sendViaWhatsApp()}
                          disabled={!resolutionNotes.trim()}
                          size="sm"
                          variant="outline"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> WhatsApp
                        </Button>
                        <Button
                          onClick={() => resolveItem('internal')}
                          disabled={actionLoading === 'resolve' || !resolutionNotes.trim()}
                          size="sm"
                          variant="outline"
                        >
                          <Check className="w-4 h-4 mr-1" /> Resolve Only
                        </Button>
                      </div>
                      {actionLoading === 'resolve' && (
                        <div className="flex items-center justify-center mt-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Resolving...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Queue View
  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Attention Strip */}
      {(attention.sla_breaching > 0 || attention.high_unclaimed > 0 || attention.health_overdue > 0) && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center gap-4 text-white text-sm">
          <span className="font-medium">⚠️ Needs Attention:</span>
          {attention.sla_breaching > 0 && (
            <button onClick={() => setFilters({ ...filters, status: 'pending' })} className="hover:underline">
              🔴 {attention.sla_breaching} SLA breach
            </button>
          )}
          {attention.high_unclaimed > 0 && (
            <button onClick={() => setFilters({ ...filters, priority: 'high' })} className="hover:underline">
              🟠 {attention.high_unclaimed} high priority unclaimed
            </button>
          )}
          {attention.health_overdue > 0 && (
            <button onClick={() => setFilters({ ...filters, source: 'health' })} className="hover:underline">
              💉 {attention.health_overdue} health overdue
            </button>
          )}
          {attention.birthdays_upcoming > 0 && (
            <button onClick={() => setFilters({ ...filters, source: 'celebration' })} className="hover:underline">
              🎂 {attention.birthdays_upcoming} birthdays
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🎯 Concierge Command Center
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => { setShowEventStream(!showEventStream); if (!showEventStream) loadEventStream(); }}
              variant={showEventStream ? 'default' : 'outline'} 
              size="sm"
              className={showEventStream ? 'bg-purple-600' : ''}
            >
              <Activity className="w-4 h-4 mr-1" /> Event Stream
            </Button>
            <Button onClick={() => setShowCreateModal(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Ticket
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button 
              onClick={toggleAudio} 
              variant={audioEnabled ? "default" : "outline"} 
              size="sm"
              title={audioEnabled ? "SLA breach alerts ON - click to disable" : "SLA breach alerts OFF - click to enable"}
            >
              {audioEnabled ? (
                <>🔔 Alerts ON</>
              ) : (
                <>🔕 Alerts OFF</>
              )}
            </Button>
            <Button onClick={loadQueue} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          <Button
            variant={!filters.pillar ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilters({ ...filters, pillar: null })}
          >
            All Pillars
          </Button>
          {PILLARS.map(pillar => (
            <Button
              key={pillar.id}
              variant={filters.pillar === pillar.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilters({ ...filters, pillar: filters.pillar === pillar.id ? null : pillar.id })}
              className="flex items-center gap-1"
            >
              <span>{pillar.icon}</span>
              <span>{pillar.name}</span>
              {pillarStats[pillar.id] > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{pillarStats[pillar.id]}</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Priority Buckets */}
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(buckets).map(([bucket, count]) => (
            <Button
              key={bucket}
              variant={filters.priority === bucket ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, priority: filters.priority === bucket ? null : bucket })}
              className={filters.priority === bucket ? PRIORITY_CONFIG[bucket]?.bg : ''}
            >
              {bucket === 'urgent' && '🔴'}
              {bucket === 'high' && '🟠'}
              {bucket === 'medium' && '🟡'}
              {bucket === 'low' && '🟢'}
              <span className="ml-1 capitalize">{bucket}</span>
              <Badge variant="secondary" className="ml-2">{count}</Badge>
            </Button>
          ))}
        </div>

        {/* Filters & Bulk Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tickets, members..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Sources</option>
            <option value="mira">🤖 Mira Requests</option>
            <option value="order">📦 Orders</option>
            <option value="inbox">📥 Inbox</option>
            <option value="health">💉 Health Alerts</option>
            <option value="celebration">🎂 Birthdays</option>
            <option value="tickets">🎫 Service Desk</option>
            <option value="membership">👑 Memberships</option>
            <option value="voice_order">🎤 Voice Orders</option>
            <option value="autoship">🔄 Autoship</option>
            <option value="stay">🏨 Stay Bookings</option>
            <option value="dine">🍽️ Dine Reservations</option>
            <option value="travel">✈️ Travel</option>
            <option value="care">🏥 Care</option>
          </select>

          {(filters.priority || filters.source !== 'all' || filters.search || filters.pillar) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ source: 'all', priority: null, status: null, pillar: null, search: '' })}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          
          {/* Bulk Actions (show when tickets selected) */}
          {selectedTickets.size > 0 && (
            <div className="flex items-center gap-2 ml-auto bg-purple-50 px-3 py-1 rounded-lg">
              <Badge>{selectedTickets.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => bulkAction('claim')}>
                Claim All
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction('change_status', { new_status: 'resolved' })}>
                Resolve All
              </Button>
              {selectedTickets.size >= 2 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700"
                  onClick={handleMergeTickets}
                >
                  <GitMerge className="w-4 h-4 mr-1" />
                  Merge ({selectedTickets.size})
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedTickets(new Set())}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Event Stream Panel (Slide-in from right) */}
      {showEventStream && (
        <div className="absolute right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-20 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Event Stream
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowEventStream(false)} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {loadingEvents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : eventStream.length > 0 ? (
              eventStream.map((event, idx) => (
                <div 
                  key={event.id || idx} 
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                    event.action_required ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => {
                    if (event.type === 'ticket') {
                      setSelectedItem({ ticket_id: event.id });
                      loadItemDetail(event.id);
                      setShowEventStream(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${
                      event.pillar === 'shop' ? 'bg-green-100 text-green-700' :
                      event.pillar === 'care' ? 'bg-red-100 text-red-700' :
                      event.pillar === 'club' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {event.pillar || 'general'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Now'}
                    </span>
                    {event.auto_created && (
                      <Badge className="text-xs bg-blue-100 text-blue-700">Auto</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {event.title}
                  </p>
                  {event.member?.name && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {event.member.name}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent events</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t">
            <Button onClick={loadEventStream} variant="outline" className="w-full" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingEvents ? 'animate-spin' : ''}`} />
              Refresh Events
            </Button>
          </div>
        </div>
      )}

      {/* Queue */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : loadError ? (
          <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg mx-4">
            <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-medium text-red-700">Failed to load Command Center</h3>
            <p className="text-red-600 mt-2 text-sm">{loadError}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => { setLoadError(null); loadQueue(); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">All caught up!</h3>
            <p className="text-gray-500">No items matching your filters</p>
            <p className="text-xs text-gray-400 mt-2">API: {API_URL || 'NOT SET'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <QueueItem key={item.ticket_id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Ticket
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Pillar & Urgency Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pillar / Category *</Label>
                <select
                  value={newTicket.pillar}
                  onChange={(e) => setNewTicket({ ...newTicket, pillar: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="general">General</option>
                  {PILLARS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Urgency *</Label>
                <select
                  value={newTicket.urgency}
                  onChange={(e) => setNewTicket({ ...newTicket, urgency: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="low">🟢 Low (48h SLA)</option>
                  <option value="medium">🟡 Medium (24h SLA)</option>
                  <option value="high">🟠 High (4h SLA)</option>
                  <option value="urgent">🔴 Urgent (2h SLA)</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label>Subject *</Label>
              <Input
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief summary of the request..."
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description *</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Full details of the request..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Member Info Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Member Information (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Member Name</Label>
                  <Input
                    value={newTicket.member_name}
                    onChange={(e) => setNewTicket({ ...newTicket, member_name: e.target.value })}
                    placeholder="Pet parent name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newTicket.member_email}
                    onChange={(e) => setNewTicket({ ...newTicket, member_email: e.target.value })}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newTicket.member_phone}
                    onChange={(e) => setNewTicket({ ...newTicket, member_phone: e.target.value })}
                    placeholder="9876543210"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Pet Name</Label>
                  <Input
                    value={newTicket.pet_name}
                    onChange={(e) => setNewTicket({ ...newTicket, pet_name: e.target.value })}
                    placeholder="Pet's name..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="border-t pt-4">
              <Label>Assign To (Optional)</Label>
              <select
                value={newTicket.assigned_to}
                onChange={(e) => setNewTicket({ ...newTicket, assigned_to: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Leave unassigned</option>
                {agents.map(a => (
                  <option key={a.username} value={a.username}>
                    {a.name || a.username} ({a.active_tickets || 0} active)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createTicket} 
              disabled={creating || !newTicket.subject.trim() || !newTicket.description.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Create Ticket</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConciergeCommandCenter;
