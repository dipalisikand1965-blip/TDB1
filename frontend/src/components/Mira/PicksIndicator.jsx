/**
 * PicksIndicator - Subtle notification that Mira has curated picks
 * ================================================================
 * Shows a yellow gift icon when Mira has silently curated products/services
 * User clicks to open picks vault - NOT forced, user chooses when to view
 * 
 * Per golden standards: "Mira silently curates in background, 
 * yellow gift tells member picks are ready"
 */

import React from 'react';
import { Gift, Sparkles } from 'lucide-react';

const PicksIndicator = ({ 
  picksCount = 0, 
  hasNewPicks = false, 
  onClick,
  petName = 'your pet'
}) => {
  if (picksCount === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className={`picks-indicator ${hasNewPicks ? 'has-new' : ''}`}
      data-testid="picks-indicator"
      title={`Mira has ${picksCount} picks for ${petName}`}
    >
      <div className="picks-indicator-inner">
        <Gift className="picks-icon" />
        {hasNewPicks && (
          <span className="picks-badge">
            <Sparkles className="w-2 h-2" />
            {picksCount}
          </span>
        )}
      </div>
      {hasNewPicks && (
        <span className="picks-tooltip">
          Mira found {picksCount} picks for {petName}
        </span>
      )}
    </button>
  );
};

export default PicksIndicator;
