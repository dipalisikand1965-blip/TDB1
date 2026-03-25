/**
 * InboxRow - Consistent notification row layout with swipe actions
 * 
 * iOS Mail-style row:
 * [Avatar] [Headline (bold) + TCK line + Snippet] [Time]
 * Blue dot for unread
 * 
 * ALWAYS shows ticket ID line for trackability:
 * TCK-2026-000123 • Care • Mystique
 * 
 * Swipe actions:
 * - Left swipe: Archive (or Unarchive if in archived view)
 * - Right swipe: Mark read/unread
 */

import React, { useState, useRef } from 'react';
import { ChevronRight, Archive, Mail, MailOpen, ArchiveRestore } from 'lucide-react';

const InboxRow = ({ 
  notification,
  petName,
  isUnread = false,
  onClick,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onUnarchive,
  showPetName = false,
  isSelected = false,
  selectMode = false,
  isArchived = false,
  className = '' // NEW: Accept custom className for enhanced styling
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const rowRef = useRef(null);

  // Get avatar letter from pet name or fallback
  const avatarLetter = petName?.charAt(0)?.toUpperCase() || 'C';
  
  // Get pillar-based color
  const getPillarColor = (pillar) => {
    const colors = {
      travel: 'from-blue-500 to-cyan-500',
      care: 'from-emerald-500 to-teal-500',
      shop: 'from-pink-500 to-rose-500',
      dine: 'from-orange-500 to-amber-500',
      enjoy: 'from-purple-500 to-violet-500',
      learn: 'from-indigo-500 to-blue-500',
      fit: 'from-green-500 to-emerald-500',
      stay: 'from-teal-500 to-cyan-500',
      general: 'from-gray-500 to-gray-600'
    };
    return colors[pillar?.toLowerCase()] || colors.general;
  };

  // Format time like iOS Mail
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Build TCK + pillar + pet line - ALWAYS show ticket_id for trackability
  const getTicketLine = () => {
    const parts = [];
    
    // Always show ticket ID if available
    if (notification.ticket_id) {
      parts.push(notification.ticket_id);
    }
    
    // Show pillar
    if (notification.pillar && notification.pillar !== 'general') {
      parts.push(notification.pillar.charAt(0).toUpperCase() + notification.pillar.slice(1));
    }
    
    // Show pet name when filtering all pets or if no ticket ID
    if ((showPetName || !notification.ticket_id) && petName && petName !== 'General') {
      parts.push(petName);
    }
    
    // If still no parts but we have type info, show that
    if (parts.length === 0 && notification.type) {
      const typeLabels = {
        'concierge_reply': 'Concierge® Reply',
        'picks_request_received': 'Request',
        'mira_request_received': 'Request',
        'vault_request_received': 'Vault Request',
        'service_request_received': 'Service Request',
        'status_change': 'Status Update',
        'approval_needed': 'Approval Needed',
        'payment_needed': 'Payment Needed'
      };
      const typeLabel = typeLabels[notification.type] || 'Notification';
      parts.push(typeLabel);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // Build snippet - message content preview
  const getSnippet = () => {
    let snippet = notification.message || notification.body || '';
    
    // Strip markdown formatting (** bold **, * italic *, etc.)
    snippet = snippet.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/__(.*?)__/g, '$1');
    
    // Make generic messages more friendly
    if (snippet.includes("We've received your") && snippet.includes("request")) {
      const pillar = notification.pillar || 'general';
      const friendlyMessages = {
        care: "Your pet care request is being reviewed by our team...",
        dine: "We're finding the best pet-friendly spots for you...",
        travel: "Your travel request is with our concierge team...",
        celebrate: "Party planning in progress! We'll be in touch...",
        advisory: "Our experts are reviewing your question...",
        shop: "Your shopping request is being processed...",
        enjoy: "Finding fun activities for your furry friend...",
        fit: "Your fitness request is with our wellness team...",
        learn: "Our training experts are on it...",
        stay: "Finding the perfect stay for your pet...",
        emergency: "Our emergency team is prioritizing your request!",
        farewell: "Our compassionate team is here to help...",
        default: "Our team is working on your request..."
      };
      snippet = friendlyMessages[pillar.toLowerCase()] || friendlyMessages.default;
    }
    
    // Truncate long snippets
    if (snippet.length > 85) {
      snippet = snippet.substring(0, 82) + '...';
    }
    
    return snippet;
  };
  
  // Get friendly title (simplify verbose titles)
  const getFriendlyTitle = () => {
    let title = notification.title || 'New Notification';
    
    // Simplify "Request Received: Pet - Long query..." to something cleaner
    if (title.startsWith('Request Received:') || title.startsWith('✨ Request Received:')) {
      title = title.replace('✨ ', '').replace('Request Received: ', '');
      // If title is just pet name or too short, make it better
      if (title.length < 15 && petName) {
        const pillar = notification.pillar || 'general';
        const pillarTitles = {
          care: `${petName}'s Care Request`,
          dine: `${petName}'s Dining Request`,
          travel: `${petName}'s Travel Request`,
          celebrate: `${petName}'s Celebration`,
          advisory: `Question about ${petName}`,
          shop: `Shopping for ${petName}`,
          enjoy: `Fun Activity for ${petName}`,
          fit: `${petName}'s Wellness Request`,
          learn: `Training for ${petName}`,
          stay: `${petName}'s Stay Request`,
          emergency: `🚨 Emergency - ${petName}`,
          farewell: `${petName}'s Memorial`,
          default: `Request for ${petName}`
        };
        title = pillarTitles[pillar.toLowerCase()] || pillarTitles.default;
      }
    }
    
    // Truncate if still too long
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title;
  };

  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    if (selectMode) return;
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || selectMode) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Limit swipe distance
    const clampedDiff = Math.max(-100, Math.min(100, diff));
    setSwipeX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || selectMode) return;
    
    // Trigger action based on swipe distance
    if (swipeX < -60) {
      // Left swipe - Archive or Unarchive
      if (isArchived && onUnarchive) {
        onUnarchive(notification);
      } else if (onArchive) {
        onArchive(notification);
      }
    } else if (swipeX > 60) {
      // Right swipe - Toggle read/unread
      if (isUnread && onMarkRead) {
        onMarkRead(notification);
      } else if (onMarkUnread) {
        onMarkUnread(notification);
      }
    }
    
    setSwipeX(0);
    setIsSwiping(false);
  };

  const ticketLine = getTicketLine();
  const snippet = getSnippet();
  const friendlyTitle = getFriendlyTitle();

  return (
    <div 
      className="relative overflow-hidden"
      ref={rowRef}
    >
      {/* Swipe action backgrounds */}
      <div className="absolute inset-0 flex">
        {/* Right swipe background (mark read/unread) */}
        <div className={`flex-1 flex items-center justify-start pl-4 ${isUnread ? 'bg-blue-500' : 'bg-amber-500'}`}>
          {isUnread ? (
            <>
              <MailOpen className="w-5 h-5 text-white" />
              <span className="ml-2 text-xs text-white font-medium">Read</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 text-white" />
              <span className="ml-2 text-xs text-white font-medium">Unread</span>
            </>
          )}
        </div>
        {/* Left swipe background (archive/unarchive) */}
        <div className={`flex-1 flex items-center justify-end pr-4 ${isArchived ? 'bg-green-600' : 'bg-gray-600'}`}>
          {isArchived ? (
            <>
              <span className="mr-2 text-xs text-white font-medium">Restore</span>
              <ArchiveRestore className="w-5 h-5 text-white" />
            </>
          ) : (
            <>
              <span className="mr-2 text-xs text-white font-medium">Archive</span>
              <Archive className="w-5 h-5 text-white" />
            </>
          )}
        </div>
      </div>
      
      {/* Row content - Enhanced with className prop */}
      <div
        className={`
          relative flex items-center gap-3 px-4 py-3.5
          bg-[#0a0a14] border-b border-gray-800/30
          cursor-pointer transition-all duration-200
          ${isUnread ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/5 border-l-2 border-l-pink-400' : 'opacity-80 hover:opacity-100'}
          ${isSelected 
            ? 'bg-white/5 border-l-2 border-l-pink-500 shadow-[inset_0_0_20px_rgba(236,72,153,0.05)]' 
            : 'hover:bg-white/5'
          }
          ${className}
        `}
        style={{ transform: `translateX(${swipeX}px)` }}
        onClick={() => !isSwiping && onClick?.()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="inbox-row"
        data-ticket-id={notification.ticket_id}
      >
        {/* Unread indicator */}
        {isUnread && !selectMode && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" data-testid="unread-indicator" />
        )}
        {!isUnread && !selectMode && <div className="w-2 flex-shrink-0" />}
        
        {/* Pet Avatar */}
        <div 
          className={`
            w-10 h-10 rounded-full flex-shrink-0
            flex items-center justify-center
            bg-gradient-to-br ${getPillarColor(notification.pillar)}
            text-white font-semibold text-sm
          `}
        >
          {avatarLetter}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Headline - bold if unread, using friendly title */}
          <h3 className={`text-sm sm:truncate line-clamp-2 sm:line-clamp-1 ${isUnread ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>
            {friendlyTitle}
          </h3>
          
          {/* TCK + Pillar + Pet line - ALWAYS visible for trackability */}
          {ticketLine && (
            <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5" data-testid="ticket-line">
              {ticketLine}
            </p>
          )}
          
          {/* Snippet */}
          {snippet && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {snippet}
            </p>
          )}
        </div>
        
        {/* Time + Chevron */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {formatTime(notification.created_at)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default InboxRow;
