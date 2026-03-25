/**
 * FloatingActionBar - Quick Action Buttons
 * ========================================
 * Floating buttons for History, Insights, Concierge®, New Chat
 * Shows when conversation has messages
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { History, PawPrint, Sparkles, Plus } from 'lucide-react';

/**
 * FloatingActionBar Component
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether bar should be shown
 * @param {boolean} props.showPastChats - Past chats panel active
 * @param {boolean} props.showInsights - Insights panel active
 * @param {boolean} props.showConcierge - Concierge® panel active
 * @param {Function} props.onPastChatsClick - Open past chats
 * @param {Function} props.onInsightsClick - Toggle insights panel
 * @param {Function} props.onConciergeClick - Toggle concierge panel
 * @param {Function} props.onNewChatClick - Start new chat
 */
const FloatingActionBar = ({
  isVisible = false,
  showPastChats = false,
  showInsights = false,
  showConcierge = false,
  onPastChatsClick,
  onInsightsClick,
  onConciergeClick,
  onNewChatClick
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="mp-floating-bar" data-testid="floating-action-bar">
      {/* Past Chats */}
      <button 
        className={`mp-float-btn ${showPastChats ? 'active' : ''}`}
        onClick={onPastChatsClick}
        data-testid="float-history-btn"
        title="Past Chats"
      >
        <History size={18} />
      </button>
      
      {/* Mira's Insights - Paw icon */}
      <button 
        className={`mp-float-btn insight-btn ${showInsights ? 'active' : ''}`}
        onClick={onInsightsClick}
        data-testid="float-insight-btn"
        title="Mira's Insights"
      >
        <PawPrint size={18} />
        <Sparkles size={10} className="insight-sparkle" />
      </button>
      
      {/* Concierge® Help - C° icon */}
      <button 
        className={`mp-float-btn concierge-float-btn ${showConcierge ? 'active' : ''}`}
        onClick={onConciergeClick}
        data-testid="float-concierge-btn"
        title="Get Help"
      >
        <span className="float-c">C</span>
        <span className="float-degree">°</span>
      </button>
      
      {/* New Chat */}
      <button 
        className="mp-float-btn new-chat-btn"
        onClick={onNewChatClick}
        data-testid="float-new-chat-btn"
        title="New Chat"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

export default FloatingActionBar;
