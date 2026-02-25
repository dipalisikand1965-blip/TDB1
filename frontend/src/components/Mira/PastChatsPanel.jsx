/**
 * PastChatsPanel - Past Conversations Panel Component
 * ====================================================
 * Shows list of previous chat sessions
 * Groups into "Today" and "Earlier"
 * 
 * Mental Model: This is chat history, not Services.
 */

import React, { useMemo } from 'react';
import { X, Plus, PawPrint, Archive, FileText, Star, Clock, MessageCircle } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

/**
 * Format session date for display
 */
const formatSessionDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

/**
 * Check if a date is today
 */
const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

/**
 * Get retention status display info
 */
const getRetentionInfo = (session) => {
  const status = session.retention_status;
  
  if (status === 'important') {
    return {
      icon: <Star size={12} className="text-amber-400" />,
      label: 'Saved',
      className: 'retention-important'
    };
  }
  
  if (status === 'compressed') {
    return {
      icon: <FileText size={12} className="text-blue-400" />,
      label: 'Summarized',
      className: 'retention-compressed'
    };
  }
  
  if (status === 'archived') {
    return {
      icon: <Archive size={12} className="text-slate-400" />,
      label: 'Archived',
      className: 'retention-archived'
    };
  }
  
  return null;
};

/**
 * SessionCard - Individual chat session item
 */
const SessionCard = ({ session, isActive, onSelect, retentionInfo }) => {
  const isSummarized = session.retention_status === 'compressed' || session.retention_status === 'archived';
  
  return (
    <button
      onClick={() => onSelect(session)}
      className={`
        w-full text-left p-3 rounded-xl border transition-all
        ${isActive 
          ? 'bg-purple-500/20 border-purple-500/40' 
          : 'bg-slate-800/40 border-white/5 hover:border-purple-500/30'}
      `}
      data-testid={`session-${session.session_id}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <PawPrint size={14} className="text-purple-400" />
        <span className="text-sm font-medium text-white">{session.pet_name}</span>
        <span className="text-xs text-slate-400 ml-auto">{formatSessionDate(session.updated_at)}</span>
      </div>
      
      {retentionInfo && (
        <div className="flex items-center gap-1 mb-1">
          {retentionInfo.icon}
          <span className="text-xs text-slate-400">{retentionInfo.label}</span>
        </div>
      )}
      
      {/* Show summary for archived/compressed sessions */}
      {isSummarized && session.summary ? (
        <div className="text-xs text-slate-300 line-clamp-2">
          {session.summary.summary || session.summary.first_message || 'Conversation summarized'}
        </div>
      ) : (
        <p className="text-xs text-slate-300 line-clamp-2">
          {session.preview || 'Empty conversation'}
        </p>
      )}
    </button>
  );
};

/**
 * PastChatsPanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {Array} props.sessions - List of past sessions
 * @param {boolean} props.isLoading - Whether sessions are loading
 * @param {string} props.currentSessionId - Current active session ID
 * @param {Function} props.onLoadSession - Called when a session is selected
 * @param {Function} props.onStartNewChat - Called when new chat is started
 */
const PastChatsPanel = ({ 
  isOpen, 
  onClose, 
  sessions = [], 
  isLoading = false,
  currentSessionId,
  onLoadSession,
  onStartNewChat
}) => {
  // Group sessions into Today and Earlier
  const { todaySessions, earlierSessions } = useMemo(() => {
    const today = [];
    const earlier = [];
    
    sessions.forEach(session => {
      if (isToday(session.updated_at)) {
        today.push(session);
      } else {
        earlier.push(session);
      }
    });
    
    return { todaySessions: today, earlierSessions: earlier };
  }, [sessions]);
  
  // Show last 3 by default
  const [showAll, setShowAll] = React.useState(false);
  const visibleEarlier = showAll ? earlierSessions : earlierSessions.slice(0, 3);
  
  if (!isOpen) return null;
  
  const handleClose = () => {
    hapticFeedback.modalClose();
    onClose();
  };
  
  const handleSessionClick = (session) => {
    hapticFeedback.cardTap();
    onLoadSession(session);
  };
  
  const handleNewChat = () => {
    hapticFeedback.buttonTap();
    onStartNewChat();
    onClose();
  };
  
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-300" data-testid="past-chats-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-purple-400" />
          <h3 className="text-base font-semibold text-white">Chat History</h3>
        </div>
        <button 
          onClick={handleClose} 
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="overflow-y-auto max-h-[50vh] px-4 py-3 space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No past conversations
          </div>
        ) : (
          <>
            {/* Today Section */}
            {todaySessions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Today</h4>
                <div className="space-y-2">
                  {todaySessions.map((session) => (
                    <SessionCard
                      key={session.session_id}
                      session={session}
                      isActive={session.session_id === currentSessionId}
                      onSelect={handleSessionClick}
                      retentionInfo={getRetentionInfo(session)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Earlier Section */}
            {earlierSessions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Earlier</h4>
                <div className="space-y-2">
                  {visibleEarlier.map((session) => (
                    <SessionCard
                      key={session.session_id}
                      session={session}
                      isActive={session.session_id === currentSessionId}
                      onSelect={handleSessionClick}
                      retentionInfo={getRetentionInfo(session)}
                    />
                  ))}
                </div>
                
                {/* View All CTA */}
                {earlierSessions.length > 3 && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full mt-3 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View all ({earlierSessions.length - 3} more)
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <button 
          onClick={handleNewChat} 
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
          data-testid="new-chat-btn"
        >
          <Plus size={18} />
          New chat
        </button>
      </div>
    </div>
  );
};

export default PastChatsPanel;
