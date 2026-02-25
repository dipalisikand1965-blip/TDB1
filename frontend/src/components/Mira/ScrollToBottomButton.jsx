/**
 * ScrollToBottomButton - Floating action button for new messages
 * ==============================================================
 * Shows when user has scrolled up and new messages are available
 * 
 * NO HAPTICS - Safe to extract without affecting device feedback
 * 
 * Extracted from MiraDemoPage.jsx - P1 Refactoring
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const ScrollToBottomButton = ({ 
  visible, 
  onClick,
  label = 'New messages'
}) => {
  if (!visible) return null;

  const handleClick = (e) => {
    hapticFeedback.navigate(e);
    onClick?.();
  };

  return (
    <button 
      onClick={handleClick}
      data-testid="scroll-to-bottom-btn"
      style={{
        position: 'fixed',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'rgba(168, 85, 247, 0.9)',
        border: 'none',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'white'
      }}
    >
      <ChevronDown size={16} /> {label}
    </button>
  );
};

export default ScrollToBottomButton;
