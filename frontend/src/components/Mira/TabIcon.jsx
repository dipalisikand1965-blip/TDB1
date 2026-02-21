/**
 * TabIcon.jsx
 * ===========
 * OS Tab Icon with OFF/ON/PULSE states
 * Per PET_OS_BEHAVIOR_BIBLE v1.1 Section 2
 * 
 * Visual States:
 * - OFF: Muted icon (opacity 0.5), no dot
 * - ON: Lit icon (full opacity), subtle dot
 * - PULSE: Subtle pulse animation + dot + optional count badge
 * 
 * Accessibility (Section 2.7):
 * - Dot + count badge (color is never the only signal)
 * - Screen reader announces: "{Tab}, {count} items, {new/updated}"
 * - Reduced motion: no animation; show "New" badge instead
 */

import React from 'react';
import { ICON_STATE } from '../../hooks/mira/useIconState';

const TabIcon = ({
  icon: Icon,
  label,
  state = ICON_STATE.OFF,
  count = 0,
  isActive = false,
  onClick,
  className = '',
  'data-testid': testId,
}) => {
  const isOff = state === ICON_STATE.OFF;
  const isOn = state === ICON_STATE.ON;
  const isPulse = state === ICON_STATE.PULSE;

  // Screen reader text
  const getAriaLabel = () => {
    if (isOff) return `${label}, no items`;
    if (isPulse) return `${label}, ${count} new items`;
    return `${label}, ${count} items`;
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl
        transition-all duration-200 ease-out
        ${isActive ? 'bg-purple-500/20 text-purple-400' : ''}
        ${isOff ? 'text-gray-500 hover:text-gray-400' : 'text-white hover:text-purple-300'}
        ${className}
      `}
      aria-label={getAriaLabel()}
      data-testid={testId}
      data-icon-state={state}
    >
      {/* Icon Container */}
      <div className="relative">
        {/* Icon */}
        {typeof Icon === 'function' ? (
          <Icon 
            size={20} 
            className={`
              transition-all duration-200
              ${isOff ? 'opacity-50' : 'opacity-100'}
              ${isPulse ? 'animate-pulse-subtle' : ''}
            `}
          />
        ) : (
          <span 
            className={`
              text-lg
              ${isOff ? 'opacity-50' : 'opacity-100'}
              ${isPulse ? 'animate-pulse-subtle' : ''}
            `}
          >
            {Icon}
          </span>
        )}

        {/* State Indicator Dot */}
        {(isOn || isPulse) && (
          <span 
            className={`
              absolute -top-1 -right-1 w-2 h-2 rounded-full
              ${isPulse ? 'bg-purple-400 animate-ping-slow' : 'bg-gray-400'}
            `}
            aria-hidden="true"
          />
        )}

        {/* Count Badge (only for PULSE with count > 0) */}
        {isPulse && count > 0 && (
          <span 
            className="
              absolute -top-2 -right-3 min-w-[18px] h-[18px] 
              flex items-center justify-center
              bg-purple-500 text-white text-[10px] font-bold 
              rounded-full px-1
            "
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>

      {/* Label */}
      <span 
        className={`
          text-[10px] font-medium uppercase tracking-wider
          ${isOff ? 'opacity-50' : 'opacity-100'}
        `}
      >
        {label}
      </span>

      {/* Reduced Motion: "New" badge instead of animation */}
      {isPulse && (
        <span className="sr-only">New</span>
      )}
    </button>
  );
};

// CSS for animations (add to global styles or component)
export const tabIconStyles = `
  @keyframes pulse-subtle {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 1; }
    75%, 100% { transform: scale(1.5); opacity: 0; }
  }
  
  .animate-pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
  }
  
  .animate-ping-slow {
    animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .animate-pulse-subtle,
    .animate-ping-slow {
      animation: none;
    }
  }
`;

export default TabIcon;
