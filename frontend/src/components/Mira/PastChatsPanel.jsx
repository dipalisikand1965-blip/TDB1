/**
 * PastChatsPanel - Past Conversations Panel Component
 * ====================================================
 * Shows list of previous chat sessions
 * Allows loading past conversations
 * Displays retention status (summarized, archived)
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, PawPrint, Archive, FileText, Star, Clock } from 'lucide-react';
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
 * Get retention status display info
 */
const getRetentionInfo = (session) => {
  const status = session.retention_status;
  
  if (status === 'important') {
    return {
      icon: <Star size={12} className="retention-icon important" />,
      label: 'Saved',
      className: 'retention-important',
      tooltip: 'This conversation is saved permanently'
    };
  }
  
  if (status === 'compressed') {
    return {
      icon: <FileText size={12} className="retention-icon compressed" />,
      label: 'Summarized',
      className: 'retention-compressed',
      tooltip: 'Older messages have been summarized'
    };
  }
  
  if (status === 'archived') {
    return {
      icon: <Archive size={12} className="retention-icon archived" />,
      label: 'Archived',
      className: 'retention-archived',
      tooltip: 'Only summary available'
    };
  }
  
  return null;
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
    <div className="mp-past-chats">
      <div className="mp-past-chats-header">
        <h3 className="mp-past-chats-title">Past Chats</h3>
        <button onClick={handleClose} className="mp-past-chats-close">
          <X />
        </button>
      </div>
      
      <div className="mp-past-chats-list">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No past conversations
          </div>
        ) : (
          sessions.map((session) => {
            const retentionInfo = getRetentionInfo(session);
            const isArchived = session.retention_status === 'archived';
            const isSummarized = session.retention_status === 'compressed' || isArchived;
            
            return (
              <button
                key={session.session_id}
                onClick={() => handleSessionClick(session)}
                className={`mp-session-btn ${session.session_id === currentSessionId ? 'active' : ''} ${retentionInfo?.className || ''}`}
                data-testid={`session-${session.session_id}`}
                title={retentionInfo?.tooltip}
              >
                <div className="mp-session-meta">
                  <PawPrint size={14} />
                  <span className="mp-session-pet">{session.pet_name}</span>
                  <span className="mp-session-date">{formatSessionDate(session.updated_at)}</span>
                  {retentionInfo && (
                    <span className={`mp-retention-badge ${retentionInfo.className}`}>
                      {retentionInfo.icon}
                      <span>{retentionInfo.label}</span>
                    </span>
                  )}
                </div>
                
                {/* Show summary for archived/compressed sessions */}
                {isSummarized && session.summary ? (
                  <div className="mp-session-summary">
                    <Clock size={10} />
                    <p>{session.summary.summary || session.summary.first_message || 'Conversation summarized'}</p>
                    {session.summary.intents?.length > 0 && (
                      <div className="mp-session-intents">
                        {session.summary.intents.slice(0, 3).map((intent, i) => (
                          <span key={i} className="mp-intent-tag">{intent}</span>
                        ))}
                      </div>
                    )}
                    {session.message_count && (
                      <span className="mp-msg-count">{session.message_count} messages</span>
                    )}
                  </div>
                ) : (
                  <p className="mp-session-preview">{session.preview || 'Empty conversation'}</p>
                )}
              </button>
            );
          })
        )}
      </div>
      
      <div className="mp-past-chats-footer">
        <button onClick={handleNewChat} className="mp-concierge-btn">
          <Plus /> Start New Chat
        </button>
      </div>
    </div>
  );
};

export default PastChatsPanel;
