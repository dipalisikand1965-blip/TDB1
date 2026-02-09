/**
 * PastChatsPanel - Past Conversations Panel Component
 * ====================================================
 * Shows list of previous chat sessions
 * Allows loading past conversations
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { X, Plus, PawPrint } from 'lucide-react';
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
          sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => handleSessionClick(session)}
              className={`mp-session-btn ${session.session_id === currentSessionId ? 'active' : ''}`}
              data-testid={`session-${session.session_id}`}
            >
              <div className="mp-session-meta">
                <PawPrint />
                <span className="mp-session-pet">{session.pet_name}</span>
                <span className="mp-session-date">{formatSessionDate(session.updated_at)}</span>
              </div>
              <p className="mp-session-preview">{session.preview || 'Empty conversation'}</p>
            </button>
          ))
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
