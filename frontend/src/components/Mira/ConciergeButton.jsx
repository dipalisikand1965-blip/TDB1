/**
 * ConciergeButton - Reusable Concierge® Communication Button
 * ===========================================================
 * 
 * A reusable button that provides two-way communication between
 * users and the Service Desk concierge team.
 * 
 * FEATURES:
 * - C® icon accessible from any pillar page and Mira OS modal
 * - Unread message badge indicator with pulse animation
 * - Opens real-time chat panel (ConciergeThreadPanelV2)
 * - Messages route to DoggyServiceDesk for admin response
 * - WebSocket-based real-time updates
 * - Multiple placement options: floating, inline, header
 * 
 * USAGE:
 *   // Floating on pillar page
 *   <ConciergeButton pillar="celebrate" position="bottom-right" />
 *   
 *   // Inline in Mira OS header  
 *   <ConciergeButton variant="header" size="small" />
 *   
 *   // With pet context
 *   <ConciergeButton petId={selectedPet?.id} petName={selectedPet?.name} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/api';
import useRealtimeConcierge, { ConnectionStatus } from '../../hooks/useRealtimeConcierge';
import ConciergeThreadPanelV2 from './ConciergeThreadPanelV2';

/**
 * ConciergeButton Component
 */
const ConciergeButton = ({ 
  petId = null,
  petName = null,
  pillar = 'general',
  position = 'bottom-right', // bottom-right, bottom-left, inline, none
  variant = 'floating', // floating, header, minimal
  size = 'default', // small, default, large
  showLabel = false,
  className = ''
}) => {
  const { user, token } = useAuth();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  
  // Real-time concierge hook for WebSocket connection
  const {
    connectionStatus,
    isConnected,
    unreadCount: wsUnreadCount,
    adminOnline
  } = useRealtimeConcierge({
    userId: user?.id,
    enabled: !!user?.id && !isOpen, // Only track when panel is closed
    onNewMessage: (newMsg, threadId) => {
      // Update local unread when new message arrives and panel is closed
      if (!isOpen) {
        setLocalUnreadCount(prev => prev + 1);
      }
    },
    onUnreadCountChange: (count) => {
      setLocalUnreadCount(count);
    }
  });
  
  // Use local count or WS count, whichever is higher
  const unreadCount = Math.max(localUnreadCount, wsUnreadCount || 0);
  const hasNewMessage = unreadCount > 0;
  
  // Fetch unread count on mount
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `${getApiUrl()}/api/concierge/realtime/unread-count?user_id=${user.id}`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (response.ok) {
        const data = await response.json();
        setLocalUnreadCount(data.unread_count || 0);
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
            pet_name: petName,
            source: `pillar_${pillar}`,
            title: petName ? `Chat about ${petName}` : `Chat from ${pillar} page`
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
  }, [user?.id, petId, petName, pillar, token]);
  
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
      // Reset unread when opening
      setLocalUnreadCount(0);
    }
  };
  
  // Close the chat panel
  const handleClose = () => {
    setIsOpen(false);
    // Refresh unread count when closing
    fetchUnreadCount();
  };
  
  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
    }
  }, [user?.id, fetchUnreadCount]);
  
  // Size configurations
  const sizeConfig = {
    small: { button: 'w-11 h-11', text: 'text-sm', badge: 'w-4 h-4 text-[9px]' },
    default: { button: 'w-14 h-14', text: 'text-lg', badge: 'w-5 h-5 text-[10px]' },
    large: { button: 'w-16 h-16', text: 'text-xl', badge: 'w-6 h-6 text-xs' }
  };
  
  // Position configurations for floating variant
  // Note: Using z-[10000] to stack above MiraChatWidget (z-[9999])
  // bottom-36 on mobile to clear mobile nav AND product modals, bottom-28 on desktop
  const positionConfig = {
    'bottom-right': 'fixed bottom-36 right-4 z-[9998] sm:bottom-28 sm:right-6',
    'bottom-left': 'fixed bottom-36 left-20 z-[9998] sm:bottom-28 sm:left-6',
    'inline': 'relative',
    'none': ''
  };
  
  const config = sizeConfig[size] || sizeConfig.default;
  const posClass = variant === 'floating' ? (positionConfig[position] || positionConfig['bottom-right']) : '';
  
  // Don't render if user is not logged in
  if (!user) {
    return null;
  }
  
  // Header variant - compact button for modal headers
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleOpen}
          disabled={loading}
          className={`w-11 h-11 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors relative ${className}`}
          data-testid="concierge-button-header"
          title="Chat with Concierge®"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="font-bold text-sm">C®</span>
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Pulse for new messages */}
          {hasNewMessage && !loading && (
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
          )}
        </button>
        
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
  }
  
  // Minimal variant - just an icon button
  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={handleOpen}
          disabled={loading}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors relative ${className}`}
          data-testid="concierge-button-minimal"
          title="Chat with Concierge®"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          ) : (
            <MessageSquare className="w-5 h-5 text-purple-500" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        
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
  }
  
  // Default floating variant
  return (
    <>
      {/* Floating Button */}
      <div className={posClass}>
        <button
          onClick={handleOpen}
          disabled={loading}
          className={`${config.button} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center relative group ${className}`}
          data-testid="concierge-button"
          title="Chat with Concierge®"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              {/* C® Text Icon */}
              <span className={`font-bold ${config.text}`}>C®</span>
              
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
          
          {/* Connection indicator */}
          {isConnected && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
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
