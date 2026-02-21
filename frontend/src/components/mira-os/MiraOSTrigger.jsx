/**
 * MiraOSTrigger - Separate trigger button for Mira OS
 * 
 * This is a SEPARATE button from the existing FAB
 * Used for testing the new Mira OS experience
 * 
 * Placed as a secondary button on test pages (celebrate-new)
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import MiraOSModal from './MiraOSModal';

const MiraOSTrigger = ({ 
  pillar = 'general',
  position = 'bottom-left', // Different from existing FAB
  label = 'Mira OS',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const positionClasses = {
    'bottom-left': 'bottom-20 left-4 sm:bottom-6 sm:left-6',
    'bottom-right': 'bottom-20 right-4 sm:bottom-6 sm:right-6',
    'top-right': 'top-20 right-4'
  };
  
  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed ${positionClasses[position]} z-[9990]
          flex items-center gap-2 px-4 py-3
          bg-gradient-to-r from-violet-600 to-purple-600
          text-white rounded-full shadow-lg
          hover:from-violet-700 hover:to-purple-700
          transition-all active:scale-95
          ${className}
        `}
        data-testid="mira-os-trigger"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm hidden sm:inline">{label}</span>
        <span className="sm:hidden text-xs">OS</span>
        
        {/* Beta badge */}
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">
          BETA
        </span>
      </button>
      
      {/* Modal */}
      <MiraOSModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pillar={pillar}
      />
    </>
  );
};

export default MiraOSTrigger;
