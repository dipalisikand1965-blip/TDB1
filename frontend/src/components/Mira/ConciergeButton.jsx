/**
 * ConciergeButton - Floating Concierge® Communication Button
 * ===========================================================
 * 
 * A floating button that provides two-way communication between
 * users and the Service Desk concierge team.
 * 
 * Features:
 * - Floating C® icon accessible from any pillar page
 * - Unread message badge indicator
 * - Opens real-time chat panel (ConciergeThreadPanelV2)
 * - Messages go to Service Desk for admin response
 * - Push notifications when admin replies
 * 
 * Usage:
 *   <ConciergeButton userId={user.id} petId={selectedPet?.id} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/api';
import ConciergeThreadPanelV2 from './ConciergeThreadPanelV2';

// Concierge® Brand Icon
const ConciergeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
    <path d="M7 21v-4" />
    <path d="M17 21v-4" />
    <path d="M12 3v6" />
    <path d="M8 6l4-3 4 3" />
  </svg>
);

/**
 * ConciergeButton Component
 */
const ConciergeButton = ({ 
  petId = null,
  pillar = 'general',
  position = 'bottom-right', // bottom-right, bottom-left, inline
  size = 'default', // small, default, large
  showLabel = false
}) => {
  const { user, token } = useAuth();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `${getApiUrl()}/api/concierge/realtime/unread-count?user_id=${user.id}`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
        if (data.unread_count > 0) {
          setHasNewMessage(true);
        }
      }
    } catch (err) {
      console.debug('[ConciergeButton] Could not fetch unread count:', err);
    }
  }, [user?.id, token]);
  
  // Fetch or create thread for this context
  const getOrCreateThread = useCallback(async () => {
    if (!user?.id) return null;
    
    setLoading(true);
    try {
      // Try to get existing open thread first
      const threadsResponse = await fetch(
        `${getApiUrl()}/api/os/concierge/threads?user_id=${user.id}&status=open&limit=1`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (threadsResponse.ok) {
        const data = await threadsResponse.json();
        if (data.threads?.length > 0) {
          return data.threads[0];
        }
      }
      
      // No open thread, create a new one
      const createResponse = await fetch(
        `${getApiUrl()}/api/os/concierge/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            user_id: user.id,
            pet_id: petId,
            source: `pillar_${pillar}`,
            title: `Chat from ${pillar} page`
          })
        }
      );
      
      if (createResponse.ok) {
        const data = await createResponse.json();
        return data.thread;
      }
      
      return null;
    } catch (err) {
      console.error('[ConciergeButton] Error getting/creating thread:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, petId, pillar, token]);
  
  // Open the chat panel
  const handleOpen = async () => {
    if (!user) {
      // Could show login prompt here
      return;
    }
    
    const thread = await getOrCreateThread();
    if (thread) {
      setActiveThread(thread);
      setIsOpen(true);
      setHasNewMessage(false);
      // Reset unread when opening
      setUnreadCount(0);
    }
  };
  
  // Close the chat panel
  const handleClose = () => {
    setIsOpen(false);
    // Refresh unread count when closing
    fetchUnreadCount();
  };
  
  // Initial fetch and polling for unread count
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      
      // Poll every 30 seconds for new messages
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchUnreadCount]);
  
  // Size configurations
  const sizeConfig = {
    small: { button: 'w-12 h-12', icon: 'w-5 h-5', badge: 'w-5 h-5 text-[10px]' },
    default: { button: 'w-14 h-14', icon: 'w-6 h-6', badge: 'w-6 h-6 text-xs' },
    large: { button: 'w-16 h-16', icon: 'w-7 h-7', badge: 'w-7 h-7 text-sm' }
  };
  
  // Position configurations
  const positionConfig = {
    'bottom-right': 'fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6',
    'bottom-left': 'fixed bottom-20 left-4 z-50 sm:bottom-6 sm:left-6',
    'inline': 'relative'
  };
  
  const config = sizeConfig[size] || sizeConfig.default;
  const posClass = positionConfig[position] || positionConfig['bottom-right'];
  
  // Don't render if user is not logged in (or render a disabled state)
  if (!user) {
    return null;
  }
  
  return (
    <>
      {/* Floating Button */}
      <div className={posClass}>
        <button
          onClick={handleOpen}
          disabled={loading}
          className={`${config.button} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center relative group`}
          data-testid="concierge-button"
          title="Chat with Concierge®"
        >
          {loading ? (
            <Loader2 className={`${config.icon} animate-spin`} />
          ) : (
            <>
              {/* C® Text Icon */}
              <span className="font-bold text-lg">C®</span>
              
              {/* Pulse animation for new messages */}
              {hasNewMessage && (
                <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30" />
              )}
            </>
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 ${config.badge} bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-md`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Label on hover */}
          {showLabel && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Chat with Concierge®
            </span>
          )}
        </button>
      </div>
      
      {/* Chat Panel */}
      {isOpen && activeThread && (
        <ConciergeThreadPanelV2
          isOpen={isOpen}
          onClose={handleClose}
          userId={user.id}
          threadId={activeThread.id}
          initialThread={activeThread}
        />
      )}
    </>
  );
};

export default ConciergeButton;
