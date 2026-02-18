/**
 * NotificationsInbox - Full-screen iOS Mail-style inbox
 * 
 * Routes: /notifications
 * 
 * Features:
 * - Full-screen list (no dropdown)
 * - Tabs: Primary / Updates / All
 * - Pet filter: Active Pet / All Pets
 * - iOS Mail-style rows with unread indicators
 * - Swipe actions: Mark read/unread, Archive
 * - Desktop: Split view (list left, thread right)
 * - Every row opens a ticket thread
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bell, Filter, MoreHorizontal, Check, Archive, RefreshCw } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('primary');
  const [petFilter, setPetFilter] = useState('active'); // 'active' | 'all'
  const [activePet, setActivePet] = useState(null);
  const [pets, setPets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPetFilter, setShowPetFilter] = useState(false);
  
  // Desktop split view - selected ticket
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
      let url = `${API_URL}/api/member/notifications/inbox/${encodeURIComponent(user.email)}?limit=50`;
      
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
      setUnreadCount(data.unread || 0);
      
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

  // Handle notification click
  const handleNotificationClick = async (notification) => {
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
        // Desktop: Show in split view
        setSelectedTicketId(ticketId);
      } else {
        // Mobile: Navigate to full-screen thread
        navigate(`/tickets/${ticketId}${notification.event_id ? `?event=${notification.event_id}` : ''}`);
      }
    }
  };

  // Handle mark as read/unread
  const handleMarkRead = async (notification, read) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/${read ? 'read' : 'unread'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read } : n
      ));
      setUnreadCount(prev => read ? Math.max(0, prev - 1) : prev + 1);
    } catch (err) {
      console.error('Failed to update read status:', err);
    }
  };

  // Handle archive
  const handleArchive = async (notification) => {
    try {
      await fetch(`${API_URL}/api/member/notifications/${notification.id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      // Remove from list (Archive = hide from inbox)
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to archive:', err);
    }
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
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchNotifications}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowPetFilter(!showPetFilter)}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all
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
        {showPetFilter && (
          <div className="absolute top-full left-0 right-0 bg-[#0d0d1a] border-b border-gray-800/50 px-4 py-3 z-50">
            <p className="text-xs text-gray-500 mb-2">Filter by pet</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setPetFilter('active');
                  setShowPetFilter(false);
                }}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-all
                  ${petFilter === 'active' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-800/50 text-gray-400'
                  }
                `}
              >
                {activePet?.name || 'Active Pet'}
              </button>
              <button
                onClick={() => {
                  setPetFilter('all');
                  setShowPetFilter(false);
                }}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-all
                  ${petFilter === 'all' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-800/50 text-gray-400'
                  }
                `}
              >
                All Pets
              </button>
            </div>
          </div>
        )}
      </header>
      
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
              <button 
                onClick={fetchNotifications}
                className="mt-3 text-pink-400 text-sm"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <InboxRow
                  key={notification.id}
                  notification={notification}
                  petName={getPetName(notification)}
                  isUnread={!notification.read}
                  onClick={() => handleNotificationClick(notification)}
                  showPetName={petFilter === 'all'}
                />
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
