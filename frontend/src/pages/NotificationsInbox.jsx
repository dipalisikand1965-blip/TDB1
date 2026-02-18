/**
 * NotificationsInbox - Full-screen iOS Mail-style inbox
 * 
 * Routes: /notifications
 * Query params: ?view=archive (toggle archived view)
 *               ?ticketId=XXX (desktop split view - selected ticket)
 * 
 * Features:
 * - Full-screen list (no dropdown)
 * - Search inside inbox (subject, pet, messages, ticket ID)
 * - Select mode + bulk actions (mark read/unread, archive/unarchive - NO delete)
 * - Tabs: Primary / Updates / All
 * - Pet filter: Active Pet / All Pets
 * - Filter sheet: Status, Pet, Type (with active indicator)
 * - iOS Mail-style rows with swipe actions
 * - Dedupe/group repeated events (30-60s window)
 * - Desktop: Split view (list left, thread right) - renders TicketThread inline
 * - Every row opens a ticket thread
 * - Unread count = NotificationEvents (not tickets)
 * - Global Dashboard | Inbox navigation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Bell, Filter, Search, X, 
  CheckSquare, Square, RefreshCw, Archive, Mail, MailOpen,
  ArchiveRestore, Inbox, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InboxRow from '../components/Mira/InboxRow';
import GlobalNav from '../components/Mira/GlobalNav';
import TicketThread from './TicketThread';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Tab definitions
const TABS = [
  { id: 'primary', label: 'Primary' },
  { id: 'updates', label: 'Updates' },
  { id: 'all', label: 'All' }
];

// Group events within time window (60 seconds) for same ticket+type
const groupEvents = (notifications) => {
  const grouped = [];
  const ticketGroups = new Map();
  
  const sorted = [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  for (const notif of sorted) {
    const key = `${notif.ticket_id}-${notif.type}`;
    const existing = ticketGroups.get(key);
    
    if (existing) {
      const existingTime = new Date(existing.notif.created_at);
      const currentTime = new Date(notif.created_at);
      const diffSeconds = Math.abs(existingTime - currentTime) / 1000;
      
      if (diffSeconds < 60) {
        existing.count++;
        existing.ids.push(notif.id);
        continue;
      }
    }
    
    const group = { notif, count: 1, ids: [notif.id] };
    ticketGroups.set(key, group);
    grouped.push(group);
  }
  
  return grouped.map(g => ({
    ...g.notif,
    groupCount: g.count,
    groupIds: g.ids
  }));
};

const NotificationsInbox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  // URL-based state for archive view and selected ticket
  const viewArchived = searchParams.get('view') === 'archive';
  const selectedTicketId = searchParams.get('ticketId');
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('primary');
  const [petFilter, setPetFilter] = useState('active');
  const [activePet, setActivePet] = useState(null);
  const [pets, setPets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter sheet state
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Desktop detection
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || petFilter !== 'all';

  // Check screen size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle archive view via URL param
  const toggleArchiveView = () => {
    const newParams = new URLSearchParams(searchParams);
    if (viewArchived) {
      newParams.delete('view');
    } else {
      newParams.set('view', 'archive');
    }
    newParams.delete('ticketId'); // Clear selected ticket when toggling
    setSearchParams(newParams);
    setSelectedIds(new Set());
  };

  // Select ticket for desktop split view
  const selectTicket = (ticketId) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('ticketId', ticketId);
    setSearchParams(newParams);
  };

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`${API_URL}/api/user/${encodeURIComponent(user.email)}/pets`, {
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPets(data.pets || []);
          if (data.pets?.length > 0) {
            setActivePet(data.pets[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pets:', err);
      }
    };
    fetchPets();
  }, [user?.email, token]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/api/member/notifications/inbox/${encodeURIComponent(user.email)}?limit=100`;
      
      if (viewArchived) {
        url += `&archived=true`;
      }
      
      if (petFilter === 'active' && activePet?.id) {
        url += `&pet_id=${activePet.id}`;
      }
      
      if (activeTab !== 'all') {
        url += `&category=${activeTab}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email, token, activeTab, petFilter, activePet?.id, viewArchived]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Apply local filters + grouping + search
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.pet_name?.toLowerCase().includes(query) ||
        n.ticket_id?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.ticket_status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      const typeMap = {
        requests: ['picks_request_received', 'mira_request_received', 'vault_request_received', 'service_request_received', 'experience_request_received', 'concierge_request_received'],
        replies: ['concierge_reply'],
        approvals: ['approval_needed', 'payment_needed'],
        announcements: ['announcement']
      };
      filtered = filtered.filter(n => typeMap[typeFilter]?.includes(n.type));
    }
    
    return groupEvents(filtered);
  }, [notifications, searchQuery, statusFilter, typeFilter]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (selectMode) {
      toggleSelection(notification.id);
      return;
    }
    
    // Mark as read immediately
    if (!notification.read) {
      try {
        await fetch(`${API_URL}/api/member/notifications/${notification.id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    
    // Navigate to ticket thread
    const ticketId = notification.ticket_id;
    if (ticketId) {
      if (isDesktop) {
        // Desktop: update URL param, render inline
        selectTicket(ticketId);
      } else {
        // Mobile: navigate to full-screen thread
        navigate(`/tickets/${ticketId}${notification.id ? `?event=${notification.id}` : ''}`);
      }
    }
  };

  // Selection helpers
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  // Bulk actions
  const handleBulkMarkRead = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/member/notifications/bulk/read`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify(ids)
      });
      
      if (response.ok) {
        const affectedUnread = notifications.filter(n => selectedIds.has(n.id) && !n.read).length;
        setNotifications(prev => prev.map(n => 
          selectedIds.has(n.id) ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - affectedUnread));
      }
    } catch (err) {
      console.error('Failed to bulk mark read:', err);
    }
    
    clearSelection();
  };

  const handleBulkMarkUnread = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/member/notifications/bulk/unread`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify(ids)
      });
      
      if (response.ok) {
        const affectedRead = notifications.filter(n => selectedIds.has(n.id) && n.read).length;
        setNotifications(prev => prev.map(n => 
          selectedIds.has(n.id) ? { ...n, read: false } : n
        ));
        setUnreadCount(prev => prev + affectedRead);
      }
    } catch (err) {
      console.error('Failed to bulk mark unread:', err);
    }
    
    clearSelection();
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/member/notifications/bulk/archive`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify(ids)
      });
      
      if (response.ok) {
        const affectedUnread = notifications.filter(n => selectedIds.has(n.id) && !n.read).length;
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
        setUnreadCount(prev => Math.max(0, prev - affectedUnread));
      }
    } catch (err) {
      console.error('Failed to bulk archive:', err);
    }
    
    clearSelection();
  };

  const handleBulkUnarchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/member/notifications/bulk/unarchive`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify(ids)
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      }
    } catch (err) {
      console.error('Failed to bulk unarchive:', err);
    }
    
    clearSelection();
  };

  // Single row actions
  const handleSingleMarkRead = async (notification) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSingleMarkUnread = async (notification) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/unread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: false } : n
      ));
      if (notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to mark unread:', err);
    }
  };

  const handleSingleArchive = async (notification) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const handleSingleUnarchive = async (notification) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
      });
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error('Failed to unarchive:', err);
    }
  };

  const getPetName = (notification) => {
    if (notification.pet_name) return notification.pet_name;
    const pet = pets.find(p => p.id === notification.pet_id);
    return pet?.name || 'General';
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPetFilter('all');
    setShowFilterSheet(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Global Navigation: Dashboard | Inbox */}
      <GlobalNav 
        unreadCount={unreadCount} 
        activePetName={activePet?.name}
        onPetClick={() => navigate('/my-pets')}
      />
      
      {/* Inbox Header */}
      <header className="sticky top-0 z-40 bg-[#0d0d1a] border-b border-gray-800/50">
        {/* Select mode header */}
        {selectMode ? (
          <div className="flex items-center justify-between px-4 py-3" data-select-area>
            <div className="flex items-center gap-3">
              <button onClick={clearSelection} className="p-2 rounded-full hover:bg-gray-800" data-testid="exit-select-mode">
                <X className="w-5 h-5 text-gray-300" />
              </button>
              <span className="text-white font-medium">{selectedIds.size} selected</span>
            </div>
            <button onClick={selectAll} className="text-pink-400 text-sm font-medium" data-testid="select-all-btn">
              Select All
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-800 lg:hidden"
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                  {viewArchived ? (
                    <Archive className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Bell className="w-5 h-5 text-pink-400" />
                  )}
                  {viewArchived ? 'Archive' : 'Inbox'}
                </h1>
                <p className="text-xs text-gray-400">
                  {viewArchived 
                    ? `${filteredNotifications.length} archived`
                    : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Archive/Inbox toggle - same URL, different view param */}
              <button 
                onClick={toggleArchiveView}
                className={`p-2 rounded-full ${viewArchived ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-gray-800 text-gray-400'}`}
                data-testid="toggle-archive-view"
                title={viewArchived ? 'Back to Inbox' : 'View Archive'}
              >
                {viewArchived ? <Inbox className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => {
                  setSelectMode(true);
                  setSelectedIds(new Set());
                }}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400"
                data-testid="enter-select-mode"
              >
                <CheckSquare className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-full ${showSearch ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button 
                onClick={fetchNotifications}
                className="p-2 rounded-full hover:bg-gray-800"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                onClick={() => setShowFilterSheet(true)}
                className="p-2 rounded-full hover:bg-gray-800 relative"
                data-testid="filter-btn"
              >
                <Filter className="w-5 h-5 text-gray-400" />
                {hasActiveFilters && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Search Input */}
        {showSearch && !selectMode && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets, pets, messages..."
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-full pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                autoFocus
                data-testid="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Tabs + Pet Filter */}
        {!selectMode && !viewArchived && (
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }
                  `}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPetFilter(petFilter === 'active' ? 'all' : 'active')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-400 hover:bg-gray-800"
              data-testid="pet-filter-toggle"
            >
              {petFilter === 'active' ? (activePet?.name || 'Active Pet') : 'All Pets'}
              <span className="text-[10px]">▾</span>
            </button>
          </div>
        )}
        
        {/* Bulk Actions Bar */}
        {selectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/50 border-t border-gray-700/30" data-select-area>
            <button
              onClick={handleBulkMarkRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              data-testid="bulk-mark-read"
            >
              <MailOpen className="w-4 h-4" />
              Mark Read
            </button>
            <button
              onClick={handleBulkMarkUnread}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              data-testid="bulk-mark-unread"
            >
              <Mail className="w-4 h-4" />
              Mark Unread
            </button>
            {viewArchived ? (
              <button
                onClick={handleBulkUnarchive}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30"
                data-testid="bulk-unarchive"
              >
                <ArchiveRestore className="w-4 h-4" />
                Unarchive
              </button>
            ) : (
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                data-testid="bulk-archive"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}
          </div>
        )}
      </header>
      
      {/* Filter Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilterSheet(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[#0d0d1a] rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-pink-400 text-sm" data-testid="reset-filters">
                  Reset
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Status</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'open', 'in_progress', 'waiting', 'resolved'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      statusFilter === status ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                    data-testid={`filter-status-${status}`}
                  >
                    {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Type</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'requests', 'replies', 'approvals', 'announcements'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      typeFilter === type ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                    data-testid={`filter-type-${type}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Pet</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPetFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    petFilter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  }`}
                  data-testid="filter-pet-all"
                >
                  All Pets
                </button>
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setPetFilter('active');
                      setActivePet(pet);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      petFilter === 'active' && activePet?.id === pet.id ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                    data-testid={`filter-pet-${pet.id}`}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilterSheet(false)}
              className="w-full py-3 bg-pink-500 text-white font-medium rounded-full"
              data-testid="apply-filters"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Content - Split View on Desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Inbox List */}
        <div className={`
          overflow-y-auto
          ${isDesktop && selectedTicketId ? 'w-[400px] flex-shrink-0 border-r border-gray-800/50' : 'flex-1'}
        `}>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p>{error}</p>
              <button onClick={fetchNotifications} className="mt-3 text-pink-400 text-sm">
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              {viewArchived ? (
                <Archive className="w-12 h-12 mb-3 opacity-30" />
              ) : (
                <Bell className="w-12 h-12 mb-3 opacity-30" />
              )}
              <p>{searchQuery ? 'No matching notifications' : viewArchived ? 'No archived items' : 'No notifications yet'}</p>
            </div>
          ) : (
            <div data-select-area>
              {filteredNotifications.map(notification => (
                <div key={notification.id} className="flex items-center">
                  {selectMode && (
                    <button
                      onClick={() => toggleSelection(notification.id)}
                      className="pl-4 py-3"
                      data-testid={`select-${notification.id}`}
                    >
                      {selectedIds.has(notification.id) ? (
                        <CheckSquare className="w-5 h-5 text-pink-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <InboxRow
                      notification={{
                        ...notification,
                        title: notification.groupCount > 1 
                          ? `${notification.title} (${notification.groupCount})`
                          : notification.title
                      }}
                      petName={getPetName(notification)}
                      isUnread={!notification.read}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkRead={() => handleSingleMarkRead(notification)}
                      onMarkUnread={() => handleSingleMarkUnread(notification)}
                      onArchive={viewArchived ? undefined : () => handleSingleArchive(notification)}
                      onUnarchive={viewArchived ? () => handleSingleUnarchive(notification) : undefined}
                      showPetName={petFilter === 'all'}
                      isSelected={selectedIds.has(notification.id) || selectedTicketId === notification.ticket_id}
                      selectMode={selectMode}
                      isArchived={viewArchived}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop: Thread Panel - Use iframe for isolation */}
        {isDesktop && selectedTicketId && (
          <div className="flex-1 flex flex-col bg-[#0a0a14]" data-testid="thread-panel">
            <iframe
              src={`/tickets/${selectedTicketId}?embed=true`}
              className="flex-1 w-full border-0"
              title="Ticket Thread"
            />
          </div>
        )}
        
        {/* Desktop: Empty state when no ticket selected */}
        {isDesktop && !selectedTicketId && (
          <div className="flex-1 bg-[#0a0a14] flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Inbox className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsInbox;
