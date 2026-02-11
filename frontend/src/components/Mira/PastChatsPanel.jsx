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
  
  const panelContent = (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998
        }}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div 
        data-testid="past-chats-panel"
        style={{
          position: 'fixed',
          top: '80px',
          right: '16px',
          width: '340px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(26, 15, 53, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          zIndex: 9999,
          animation: 'slideInRight 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', margin: 0 }}>
            Past Chats
          </h3>
          <button 
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* List */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
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
              const isActive = session.session_id === currentSessionId;
              
              return (
                <button
                  key={session.session_id}
                  onClick={() => handleSessionClick(session)}
                  data-testid={`session-${session.session_id}`}
                  title={retentionInfo?.tooltip}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.target.style.background = 'rgba(139, 92, 246, 0.1)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.target.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <PawPrint size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{session.pet_name}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
                      {formatSessionDate(session.updated_at)}
                    </span>
                  </div>
                  
                  {isSummarized && session.summary ? (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                      <p style={{ margin: 0 }}>{session.summary.summary || session.summary.first_message || 'Conversation summarized'}</p>
                      {session.message_count && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{session.message_count} messages</span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>
                      {session.preview || 'Empty conversation'}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button 
            onClick={handleNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Start New Chat
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
  
  // Render via portal to ensure it's on top of everything
  return createPortal(panelContent, document.body);
};

export default PastChatsPanel;
