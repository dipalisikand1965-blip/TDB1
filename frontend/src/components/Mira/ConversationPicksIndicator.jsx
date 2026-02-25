/**
 * ConversationPicksIndicator.jsx
 * 
 * Beautiful floating indicator showing conversation-specific picks
 * - Grows as conversation continues (products, services, tips)
 * - Shows count with sparkle animation
 * - Pretty golden basket with glow effect
 * - Positioned on the chat input bar
 * 
 * This is DIFFERENT from PersonalizedPicksPanel (general picks)
 * This shows CONVERSATION-SPECIFIC picks that build during chat
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBasket, Sparkles } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const ConversationPicksIndicator = ({ 
  picksCount = 0, 
  hasNewPicks = false, 
  onClick,
  petName = 'your pet'
}) => {
  // Don't show if no picks
  if (picksCount === 0) return null;
  
  const handleClick = () => {
    hapticFeedback.success();
    onClick?.();
  };
  
  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { type: 'spring', stiffness: 500, damping: 25 }
        }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="relative group"
        data-testid="conversation-picks-indicator"
        title={`Mira found ${picksCount} picks for ${petName} in this conversation`}
        style={{
          // Beautiful golden glow
          filter: hasNewPicks ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none'
        }}
      >
        {/* Outer glow ring - pulses when new picks */}
        {hasNewPicks && (
          <motion.div
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400/30 to-yellow-400/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
        
        {/* Main button - golden basket */}
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center
          bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500
          border-2 border-amber-300/50
          shadow-lg
          transition-all duration-300
          ${hasNewPicks ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-gray-900' : ''}
        `}>
          <ShoppingBasket className="w-6 h-6 text-amber-900" strokeWidth={2} />
        </div>
        
        {/* Count badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 flex items-center gap-0.5 
                     bg-gradient-to-r from-pink-500 to-purple-500 
                     text-white text-xs font-bold 
                     px-2 py-0.5 rounded-full
                     shadow-lg"
        >
          <Sparkles className="w-3 h-3" />
          <span>{picksCount}</span>
        </motion.div>
        
        {/* Tooltip on hover */}
        <div className="
          absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          bg-gray-900 text-white text-xs font-medium
          px-3 py-1.5 rounded-lg
          whitespace-nowrap
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          pointer-events-none
          border border-gray-700
        ">
          {picksCount} picks from this chat
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45" />
          </div>
        </div>
      </motion.button>
    </AnimatePresence>
  );
};

export default ConversationPicksIndicator;
