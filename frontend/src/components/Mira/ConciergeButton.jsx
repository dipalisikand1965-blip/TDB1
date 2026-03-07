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
 * - WhatsApp Click-to-Chat option
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
import { Loader2, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/api';
import useRealtimeConcierge, { ConnectionStatus } from '../../hooks/useRealtimeConcierge';
import ConciergeThreadPanelV2 from './ConciergeThreadPanelV2';

// WhatsApp Business Number for Click-to-Chat
const WHATSAPP_NUMBER = '918971702582';

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
  const [showOptions, setShowOptions] = useState(false);
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
      setShowOptions(false);
      // Reset unread when opening
      setLocalUnreadCount(0);
    }
  };
  
  // Open WhatsApp Click-to-Chat
  const handleWhatsApp = () => {
    const petContext = petName ? `about ${petName}` : '';
    const pillarContext = pillar !== 'general' ? `from ${pillar} page` : '';
    const message = encodeURIComponent(`Hi! I need help ${petContext} ${pillarContext}`.trim());
    // Use wa.me format - works better across browsers and devices
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setShowOptions(false);
  };
  
  // Toggle options menu
  const handleButtonClick = () => {
    if (variant === 'header' || variant === 'minimal') {
      // For compact variants, open chat directly
      handleOpen();
    } else {
      // For floating variant, show options
      setShowOptions(!showOptions);
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
        {/* Options Menu */}
        {showOptions && (
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden w-56 animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <p className="font-semibold text-sm">How would you like to chat?</p>
            </div>
            <div className="p-2">
              <button
                onClick={handleOpen}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                data-testid="concierge-option-chat"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">In-App Chat</p>
                  <p className="text-xs text-gray-500">Chat within the app</p>
                </div>
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                data-testid="concierge-option-whatsapp"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                  <p className="text-xs text-gray-500">Chat on WhatsApp</p>
                </div>
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={handleButtonClick}
          disabled={loading}
          className={`${config.button} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center relative group ${className}`}
          data-testid="concierge-button"
          title="Chat with Concierge®"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : showOptions ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              {/* C® Text Icon */}
              <span className={`font-bold ${config.text}`}>C®</span>
              
              {/* Pulse animation for new messages */}
              {hasNewMessage && (
                <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
              )}
            </>
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && !showOptions && (
            <span className={`absolute -top-1 -right-1 ${config.badge} bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-md`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Connection indicator */}
          {isConnected && !showOptions && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          )}
          
          {/* Label on hover */}
          {showLabel && !showOptions && (
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
