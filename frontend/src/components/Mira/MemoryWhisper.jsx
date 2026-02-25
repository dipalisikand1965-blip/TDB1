/**
 * MemoryWhisper.jsx
 * =================
 * A subtle, non-intrusive component that shows Mira's memory recall.
 * 
 * DESIGN PHILOSOPHY:
 * - Memory is like a whisper, not a shout
 * - Appears as a small chip/lozenge above the chat
 * - Auto-dismisses after a few seconds
 * - Can be manually dismissed
 * - Only shows when genuinely relevant
 * 
 * MIRA IS THE SOUL. She remembers, but doesn't brag about it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Brain, Sparkles } from 'lucide-react';

const MemoryWhisper = ({ 
  memoryContext,
  petName = 'your pet',
  onDismiss,
  autoDismissDelay = 8000 // 8 seconds
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Build the whisper text from memory context
  const buildWhisperText = useCallback(() => {
    if (!memoryContext?.relevant_memory) return null;
    
    const memory = memoryContext.relevant_memory;
    
    // Don't whisper about generic things
    if (memory.topic === 'general' || memory.topic === 'greeting') return null;
    
    // Build contextual whisper based on memory type
    const topicWhispers = {
      'diet': `I remember ${petName}'s dietary needs`,
      'food': `I recall what ${petName} enjoys`,
      'health': `I'm aware of ${petName}'s health history`,
      'allergy': `I remember ${petName}'s sensitivities`,
      'birthday': `I know ${petName}'s special day`,
      'travel': `I recall ${petName}'s travel preferences`,
      'grooming': `I remember ${petName}'s grooming routine`,
      'training': `I know ${petName}'s training progress`,
      'behavior': `I understand ${petName}'s temperament`,
      'meal_plan': `I have ${petName}'s meal preferences`,
      'vaccination': `I'm tracking ${petName}'s health records`,
      'vet': `I know ${petName}'s vet history`,
      'favorite': `I remember what ${petName} loves`
    };
    
    // Find matching whisper
    for (const [key, text] of Object.entries(topicWhispers)) {
      if (memory.topic?.toLowerCase().includes(key) || 
          memory.summary?.toLowerCase().includes(key)) {
        return text;
      }
    }
    
    // Generic but relevant memory whisper
    if (memory.summary && memory.summary.length > 10) {
      return `I remember our chat about ${memory.topic || 'this'}`;
    }
    
    return null;
  }, [memoryContext, petName]);
  
  // Show whisper when memory context changes
  useEffect(() => {
    const whisperText = buildWhisperText();
    
    if (whisperText && memoryContext?.relevant_memory) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-dismiss after delay
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);
      
      return () => clearTimeout(timer);
    }
  }, [memoryContext, buildWhisperText, autoDismissDelay]);
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss?.();
    }, 300); // Animation duration
  }, [onDismiss]);
  
  const whisperText = buildWhisperText();
  
  if (!isVisible || !whisperText) return null;
  
  return (
    <div 
      className={`
        memory-whisper
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2 
        bg-gradient-to-r from-amber-500/90 to-yellow-500/90
        backdrop-blur-md rounded-full shadow-lg
        border border-amber-300/30
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      style={{
        animation: !isExiting ? 'whisperEnter 0.4s ease-out' : undefined
      }}
    >
      {/* Memory icon with subtle pulse */}
      <div className="relative">
        <Brain className="w-4 h-4 text-amber-900" />
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-white animate-pulse" />
      </div>
      
      {/* Whisper text */}
      <span className="text-sm font-medium text-amber-900 whitespace-nowrap">
        {whisperText}
      </span>
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="ml-1 p-0.5 rounded-full hover:bg-amber-600/30 transition-colors"
        aria-label="Dismiss memory whisper"
      >
        <X className="w-3 h-3 text-amber-800" />
      </button>
      
      {/* Auto-dismiss progress bar */}
      <div 
        className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-700/30 rounded-full overflow-hidden"
      >
        <div 
          className="h-full bg-amber-800/50 rounded-full"
          style={{
            animation: `whisperProgress ${autoDismissDelay}ms linear`,
            transformOrigin: 'left'
          }}
        />
      </div>
      
      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes whisperEnter {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        @keyframes whisperProgress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default MemoryWhisper;
