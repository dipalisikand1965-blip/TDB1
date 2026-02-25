/**
 * QuickReplyChips - Conversation Contract Phase 5
 * 
 * Renders quick reply chips from the conversation_contract.quick_replies array.
 * Each chip sends its payload_text when clicked.
 * 
 * Rules:
 * - 3-6 chips max
 * - intent_type: continue | refine | execute
 * - No generic chips - must be grounded in mode + context
 */

import React from 'react';
import { Send, MapPin, Play, Ticket, MessageCircle, ArrowRight } from 'lucide-react';

const intentTypeStyles = {
  continue: 'bg-slate-700/50 hover:bg-slate-600/50 border-slate-600',
  refine: 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50',
  execute: 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/50'
};

const intentTypeIcons = {
  continue: MessageCircle,
  refine: ArrowRight,
  execute: Send
};

export const QuickReplyChips = ({ 
  quickReplies = [], 
  onChipClick,
  disabled = false,
  contractMode = 'answer'
}) => {
  if (!quickReplies || quickReplies.length === 0) return null;

  const getChipIcon = (chip) => {
    // Special icons based on label/payload
    if (chip.label?.toLowerCase().includes('location')) return MapPin;
    if (chip.label?.toLowerCase().includes('video') || chip.label?.toLowerCase().includes('watch')) return Play;
    if (chip.label?.toLowerCase().includes('book') || chip.label?.toLowerCase().includes('ticket')) return Ticket;
    if (chip.label?.toLowerCase().includes('concierge')) return Send;
    
    // Default based on intent type
    return intentTypeIcons[chip.intent_type] || MessageCircle;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3" data-testid="quick-reply-chips">
      {quickReplies.slice(0, 6).map((chip) => {
        const Icon = getChipIcon(chip);
        const styleClass = intentTypeStyles[chip.intent_type] || intentTypeStyles.continue;
        
        return (
          <button
            key={chip.id}
            data-testid={`quick-reply-${chip.id}`}
            onClick={() => onChipClick?.(chip.payload_text, chip)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full
              text-sm font-medium text-white/90
              border transition-all duration-200
              ${styleClass}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              hover:scale-[1.02]
            `}
          >
            <Icon size={14} className="opacity-70" />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickReplyChips;
