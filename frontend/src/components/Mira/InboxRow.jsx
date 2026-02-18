/**
 * InboxRow - Consistent notification row layout with swipe actions
 * 
 * iOS Mail-style row:
 * [Avatar] [Headline (bold) + TCK line + Snippet] [Time]
 * Blue dot for unread
 * 
 * Swipe actions:
 * - Left swipe: Archive
 * - Right swipe: Mark read/unread
 */

import React, { useState, useRef } from 'react';
import { ChevronRight, Archive, Mail, MailOpen } from 'lucide-react';

const InboxRow = ({ 
  notification,
  petName,
  isUnread = false,
  onClick,
  onMarkRead,
  onMarkUnread,
  onArchive,
  showPetName = false,
  isSelected = false,
  selectMode = false
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

  // Build TCK + pillar line
  const getTicketLine = () => {
    const parts = [];
    if (notification.ticket_id) {
      parts.push(notification.ticket_id);
    }
    if (notification.pillar && notification.pillar !== 'general') {
      parts.push(notification.pillar.charAt(0).toUpperCase() + notification.pillar.slice(1));
    }
    if (showPetName && petName && petName !== 'General') {
      parts.push(petName);
    }
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // Build snippet
  const getSnippet = () => {
    let snippet = notification.message || notification.body || '';
    // Don't duplicate pet name in snippet if already showing in ticket line
    if (!showPetName && petName && petName !== 'General' && !notification.ticket_id) {
      snippet = `${petName} • ${snippet}`;
    }
    return snippet;
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
      // Left swipe - Archive
      onArchive?.(notification);
    } else if (swipeX > 60) {
      // Right swipe - Toggle read/unread
      if (isUnread) {
        onMarkRead?.(notification);
      } else {
        onMarkUnread?.(notification);
      }
    }
    
    setSwipeX(0);
    setIsSwiping(false);
  };

  const ticketLine = getTicketLine();

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
            <MailOpen className="w-5 h-5 text-white" />
          ) : (
            <Mail className="w-5 h-5 text-white" />
          )}
        </div>
        {/* Left swipe background (archive) */}
        <div className="flex-1 flex items-center justify-end pr-4 bg-gray-600">
          <Archive className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Row content */}
      <div
        className={`
          relative flex items-center gap-3 px-4 py-3
          bg-[#0a0a14] border-b border-gray-800/30
          cursor-pointer transition-transform
          ${isUnread ? 'bg-blue-500/5' : ''}
          ${isSelected ? 'bg-pink-500/10' : ''}
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
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
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
          {/* Headline - bold if unread */}
          <h3 className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>
            {notification.title}
          </h3>
          
          {/* TCK + Pillar + Pet line */}
          {ticketLine && (
            <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">
              {ticketLine}
            </p>
          )}
          
          {/* Snippet */}
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {getSnippet()}
          </p>
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
