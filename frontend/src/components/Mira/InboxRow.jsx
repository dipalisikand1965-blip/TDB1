/**
 * InboxRow - Consistent notification row layout
 * 
 * iOS Mail-style row:
 * [Avatar] [Headline (bold) + Snippet] [Time]
 * Blue dot for unread
 * 
 * Used in NotificationsInbox for consistent rendering across tabs/filters
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

const InboxRow = ({ 
  notification,
  petName,
  isUnread = false,
  onClick,
  onSwipeLeft,  // Archive
  onSwipeRight, // Mark read/unread
  showPetName = false // For "All Pets" view
}) => {
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

  // Build snippet with optional pet name for All Pets view
  const getSnippet = () => {
    let snippet = notification.message || notification.body || '';
    if (showPetName && petName) {
      snippet = `${petName} • ${snippet}`;
    }
    return snippet;
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        border-b border-gray-800/30
        cursor-pointer
        active:bg-gray-800/50
        transition-colors
        ${isUnread ? 'bg-blue-500/5' : ''}
      `}
      onClick={onClick}
      data-testid="inbox-row"
      data-ticket-id={notification.ticket_id}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
      {!isUnread && <div className="w-2 flex-shrink-0" />}
      
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
  );
};

export default InboxRow;
