/**
 * StarterChips - Quick start chips for new chat sessions
 * =======================================================
 * Shows 3 starter chips after starting a new chat:
 * - Book something
 * - Find a place  
 * - Ask a question
 * 
 * These nudge users into the contract modes without them thinking.
 */

import React from 'react';
import { Calendar, MapPin, MessageCircle } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const STARTER_CHIPS = [
  {
    id: 'book',
    label: 'Book something',
    icon: Calendar,
    query: 'I need to book something for my pet',
    color: 'purple'
  },
  {
    id: 'find',
    label: 'Find a place',
    icon: MapPin,
    query: 'Find me a place nearby',
    color: 'pink'
  },
  {
    id: 'ask',
    label: 'Ask a question',
    icon: MessageCircle,
    query: '',  // Empty - just focuses input
    color: 'blue'
  }
];

/**
 * StarterChips Component
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether chips are visible
 * @param {Function} props.onChipClick - Called when a chip is clicked
 * @param {string} props.petName - Pet name for personalization
 */
const StarterChips = ({
  isVisible = false,
  onChipClick,
  petName = ''
}) => {
  if (!isVisible) return null;
  
  const handleClick = (chip) => {
    hapticFeedback.cardTap();
    if (onChipClick) {
      onChipClick(chip.query, chip.id);
    }
  };
  
  return (
    <div 
      className="starter-chips animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-testid="starter-chips"
    >
      {/* New chat indicator */}
      {petName && (
        <div className="text-center mb-3">
          <span className="text-xs text-slate-400">
            New chat started for <span className="text-purple-400 font-medium">{petName}</span>
          </span>
        </div>
      )}
      
      {/* Chips */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STARTER_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const bgColor = chip.color === 'purple' 
            ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20' 
            : chip.color === 'pink'
            ? 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20'
            : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20';
          const textColor = chip.color === 'purple' 
            ? 'text-purple-400' 
            : chip.color === 'pink'
            ? 'text-pink-400'
            : 'text-blue-400';
          
          return (
            <button
              key={chip.id}
              onClick={() => handleClick(chip)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full border
                ${bgColor} ${textColor}
                text-sm font-medium
                transition-all duration-200
                active:scale-95
              `}
              data-testid={`starter-chip-${chip.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StarterChips;
