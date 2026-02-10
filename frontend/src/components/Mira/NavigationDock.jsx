/**
 * NavigationDock - Horizontal Navigation Pills
 * ============================================
 * Bottom navigation bar with quick access buttons
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Play 
} from 'lucide-react';

/**
 * NavigationDock Component
 * 
 * @param {Object} props
 * @param {React.Ref} props.inputRef - Ref for focusing chat input
 * @param {Function} props.onShowHelp - Show help modal
 * @param {Function} props.onShowLearn - Show learn modal
 * @param {Function} props.onShowSoul - Show soul form modal (optional, falls back to navigation)
 * @param {boolean} props.hasNewVideos - Whether new training videos are available
 * @param {number} props.newVideosCount - Count of new videos
 */
const NavigationDock = ({
  inputRef,
  onShowHelp,
  onShowLearn,
  onShowSoul,
  hasNewVideos = false,
  newVideosCount = 0
}) => {
  const navigate = useNavigate();
  
  const handleConciergeClick = () => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <nav className="mp-dock" data-testid="navigation-dock">
      <button 
        onClick={handleConciergeClick} 
        className="mp-dock-btn" 
        data-testid="dock-concierge"
      >
        <MessageCircle /> <span>Concierge®</span>
      </button>
      
      <button 
        onClick={() => navigate('/orders')} 
        className="mp-dock-btn" 
        data-testid="dock-orders"
      >
        <Package /> <span>Orders</span>
      </button>
      
      <button 
        onClick={() => navigate('/family-dashboard')} 
        className="mp-dock-btn" 
        data-testid="dock-plan"
      >
        <Calendar /> <span>Plan</span>
      </button>
      
      <button 
        onClick={onShowHelp} 
        className="mp-dock-btn" 
        data-testid="dock-help"
      >
        <HelpCircle /> <span>Help</span>
      </button>
      
      <button 
        onClick={() => navigate('/dashboard')} 
        className="mp-dock-btn" 
        data-testid="dock-soul"
      >
        <Heart /> <span>Soul</span>
      </button>
      
      <button 
        onClick={onShowLearn} 
        className={`mp-dock-btn ${hasNewVideos ? 'mp-dock-btn-new' : ''}`}
        data-testid="dock-learn"
      >
        <Play /> 
        <span>Learn</span>
        {hasNewVideos && (
          <span className="mp-dock-badge" data-testid="learn-badge">
            {newVideosCount > 0 ? newVideosCount : '●'}
          </span>
        )}
      </button>
      
      {/* CSS for notification badge */}
      <style>{`
        .mp-dock-btn-new {
          position: relative;
          animation: learnPulse 2s ease-in-out infinite;
        }
        .mp-dock-btn-new svg {
          color: #f59e0b !important;
        }
        .mp-dock-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
          animation: badgeBounce 0.6s ease-out;
        }
        @keyframes learnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes badgeBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </nav>
  );
};

export default NavigationDock;
