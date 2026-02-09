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
 */
const NavigationDock = ({
  inputRef,
  onShowHelp,
  onShowLearn
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
        className="mp-dock-btn" 
        data-testid="dock-learn"
      >
        <Play /> <span>Learn</span>
      </button>
    </nav>
  );
};

export default NavigationDock;
