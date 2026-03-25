/**
 * ChatStatusIndicators.jsx
 * ========================
 * Non-clickable status indicators for the chat view.
 * Shows C° (Concierge® status) and PICKS (curated items) as passive indicators.
 * 
 * SPEC:
 * - NOT clickable, no tap target, no hover state
 * - Visual language: dot + count
 *   - Dot (no number) = new but low urgency
 *   - Number badge = requires attention
 * - Glow ONLY for urgent (TODAY pulse)
 * - Copy: Just "New" / "1" / "!" — never "debug", "state", "contracts"
 */

import React from 'react';
import { Gift } from 'lucide-react';

/**
 * ChatStatusIndicators Component
 * 
 * @param {number} conciergeCount - Number of concierge items/replies awaiting
 * @param {number} picksCount - Number of curated picks
 * @param {boolean} hasConciergeNew - Has new concierge activity (shows dot)
 * @param {boolean} hasPicksNew - Has new picks (shows dot)
 */
const ChatStatusIndicators = ({
  conciergeCount = 0,
  picksCount = 0,
  hasConciergeNew = false,
  hasPicksNew = false
}) => {
  // Don't show if nothing to display
  if (conciergeCount === 0 && picksCount === 0 && !hasConciergeNew && !hasPicksNew) {
    return null;
  }
  
  return (
    <div 
      className="chat-status-indicators"
      data-testid="chat-status-indicators"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none', // NOT clickable
        userSelect: 'none'
      }}
    >
      {/* C° Indicator - Concierge® status */}
      {(conciergeCount > 0 || hasConciergeNew) && (
        <div 
          className="status-indicator concierge-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            position: 'relative'
          }}
        >
          <span style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#10b981',
            letterSpacing: '-0.5px'
          }}>
            C°
          </span>
          
          {/* Count or dot badge */}
          {conciergeCount > 0 ? (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {conciergeCount > 9 ? '9+' : conciergeCount}
            </span>
          ) : hasConciergeNew ? (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981'
            }} />
          ) : null}
        </div>
      )}
      
      {/* PICKS Indicator - Curated items */}
      {(picksCount > 0 || hasPicksNew) && (
        <div 
          className="status-indicator picks-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '36px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '2px solid rgba(236, 72, 153, 0.6)',
            position: 'relative'
          }}
        >
          <Gift 
            size={16} 
            style={{ color: 'white', opacity: 0.9 }}
          />
          
          {/* Count or dot badge */}
          {picksCount > 0 ? (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              background: '#ec4899',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {picksCount > 9 ? '9+' : picksCount}
            </span>
          ) : hasPicksNew ? (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ec4899'
            }} />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ChatStatusIndicators;
