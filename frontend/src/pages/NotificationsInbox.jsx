/**
 * NotificationsInbox - Full-screen iOS Mail-style inbox
 * 
 * Routes: /notifications
 * 
 * Features:
 * - Full-screen list (no dropdown)
 * - Search inside inbox (subject, pet, messages)
 * - Select mode + bulk actions (mark read/unread, archive)
 * - Tabs: Primary / Updates / All
 * - Pet filter: Active Pet / All Pets
 * - Filter sheet: Status, Pet, Type
 * - iOS Mail-style rows with unread indicators
 * - Desktop: Split view (list left, thread right)
 * - Every row opens a ticket thread
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Bell, Filter, Search, X, Check, Square, 
  CheckSquare, RefreshCw, MoreHorizontal, Archive, Mail, MailOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InboxRow from '../components/Mira/InboxRow';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Tab definitions
const TABS = [
  { id: 'primary', label: 'Primary' },
  { id: 'updates', label: 'Updates' },
  { id: 'all', label: 'All' }
];

const NotificationsInbox = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('primary');
  const [petFilter, setPetFilter] = useState('active'); // 'active' | 'all'
  const [activePet, setActivePet] = useState(null);
  const [pets, setPets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter sheet state
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, open, waiting, resolved
  const [typeFilter, setTypeFilter] = useState('all'); // all, requests, replies, approvals, announcements
  
  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Desktop split view
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Check screen size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      // Add pet filter
      if (petFilter === 'active' && activePet?.id) {
        url += `&pet_id=${activePet.id}`;
      }
      
      // Add tab filter
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
      setUnreadCount(data.unread || 0); // This is NotificationEvents count, not tickets
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email, token, activeTab, petFilter, activePet?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Apply local filters (search, status, type)
  useEffect(() => {
    let filtered = [...notifications];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.pet_name?.toLowerCase().includes(query) ||
        n.ticket_id?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.ticket_status === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const typeMap = {
        requests: ['picks_request_received', 'mira_request_received', 'vault_request_received', 'service_request_received'],
        replies: ['concierge_reply'],
        approvals: ['approval_needed', 'payment_needed'],
        announcements: ['announcement']
      };
      filtered = filtered.filter(n => typeMap[typeFilter]?.includes(n.type));
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, statusFilter, typeFilter]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (selectMode) {
      // Toggle selection
      const newSelected = new Set(selectedIds);
      if (newSelected.has(notification.id)) {
        newSelected.delete(notification.id);
      } else {
        newSelected.add(notification.id);
      }
      setSelectedIds(newSelected);
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
        
        // Update local state immediately
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
        setSelectedTicketId(ticketId);
      } else {
        navigate(`/tickets/${ticketId}${notification.event_id ? `?event=${notification.event_id}` : ''}`);
      }
    }
  };

  // Bulk actions
  const handleBulkMarkRead = async (read) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await fetch(`${API_URL}/api/member/notifications/${id}/${read ? 'read' : 'unread'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
        });
      } catch (err) {
        console.error('Failed to update:', err);
      }
    }
    
    setNotifications(prev => prev.map(n => 
      selectedIds.has(n.id) ? { ...n, read } : n
    ));
    
    const affectedUnread = notifications.filter(n => selectedIds.has(n.id) && !n.read).length;
    setUnreadCount(prev => read ? Math.max(0, prev - affectedUnread) : prev + ids.length - affectedUnread);
    
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await fetch(`${API_URL}/api/member/notifications/${id}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
        });
      } catch (err) {
        console.error('Failed to archive:', err);
      }
    }
    
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    const affectedUnread = notifications.filter(n => selectedIds.has(n.id) && !n.read).length;
    setUnreadCount(prev => Math.max(0, prev - affectedUnread));
    
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  // Get pet name for notification
  const getPetName = (notification) => {
    if (notification.pet_name) return notification.pet_name;
    const pet = pets.find(p => p.id === notification.pet_id);
    return pet?.name || 'General';
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d0d1a] border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-800 lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-pink-400" />
                Inbox
              </h1>
              <p className="text-xs text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Select button */}
            <button 
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
              }}
              className={`p-2 rounded-full ${selectMode ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              {selectMode ? <X className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </button>
            
            {/* Search toggle */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full ${showSearch ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={fetchNotifications}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={() => setShowFilterSheet(true)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Search Input */}
        {showSearch && (
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
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Tabs + Pet Filter */}
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
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Pet Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPetFilter(petFilter === 'active' ? 'all' : 'active')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-400 hover:bg-gray-800"
            >
              {petFilter === 'active' ? (activePet?.name || 'Active Pet') : 'All Pets'}
              <span className="text-[10px]">▾</span>
            </button>
          </div>
        </div>
        
        {/* Bulk Actions Bar */}
        {selectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-t border-gray-700/30">
            <span className="text-sm text-gray-300">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkMarkRead(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              >
                <MailOpen className="w-4 h-4" />
                Mark Read
              </button>
              <button
                onClick={() => handleBulkMarkRead(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              >
                <Mail className="w-4 h-4" />
                Mark Unread
              </button>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            </div>
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
            <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
            
            {/* Status Filter */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'open', 'waiting', 'resolved'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      statusFilter === status ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Type</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'requests', 'replies', 'approvals', 'announcements'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      typeFilter === type ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pet Filter */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Pet</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPetFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    petFilter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400'
                  }`}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      petFilter === 'active' && activePet?.id === pet.id ? 'bg-pink-500 text-white' : 'bg-gray-800/50 text-gray-400'
                    }`}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilterSheet(false)}
              className="w-full py-3 bg-pink-500 text-white font-medium rounded-full"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 flex">
        {/* Inbox List */}
        <div className={`
          flex-1 overflow-y-auto
          ${isDesktop && selectedTicketId ? 'max-w-md border-r border-gray-800/50' : 'w-full'}
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
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p>{searchQuery ? 'No matching notifications' : 'No notifications yet'}</p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map(notification => (
                <div key={notification.id} className="flex items-center">
                  {/* Select checkbox */}
                  {selectMode && (
                    <button
                      onClick={() => {
                        const newSelected = new Set(selectedIds);
                        if (newSelected.has(notification.id)) {
                          newSelected.delete(notification.id);
                        } else {
                          newSelected.add(notification.id);
                        }
                        setSelectedIds(newSelected);
                      }}
                      className="pl-4"
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
                      notification={notification}
                      petName={getPetName(notification)}
                      isUnread={!notification.read}
                      onClick={() => handleNotificationClick(notification)}
                      showPetName={petFilter === 'all'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop: Thread Panel */}
        {isDesktop && selectedTicketId && (
          <div className="flex-1 bg-[#0a0a14] overflow-hidden">
            <iframe
              src={`/tickets/${selectedTicketId}?embed=true`}
              className="w-full h-full border-0"
              title="Ticket Thread"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsInbox;
