/**
 * MiraLoader - Loading indicators for Mira responses
 * ==================================================
 * Shows skeleton loader and mode badge while Mira is processing
 * 
 * NO HAPTICS - Safe to extract without affecting device feedback
 * 
 * Extracted from MiraDemoPage.jsx - P2 Refactoring
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * MiraModeBadge - Shows current Mira mode with message
 */
const MiraModeBadge = ({ mode, petName }) => {
  const getModeContent = () => {
    switch (mode) {
      case 'thinking':
        return {
          icon: '🧠',
          label: `Mira is getting her thoughts together for ${petName}…`
        };
      case 'instant':
        return {
          icon: '⚡',
          label: `Finding that for ${petName}...`
        };
      case 'comfort':
        return {
          icon: '💜',
          label: 'I\'m here with you. We can go as slowly as you need.'
        };
      case 'emergency':
        return {
          icon: '🚨',
          label: `This sounds serious enough that a vet should see ${petName} as soon as possible.`
        };
      case 'ready':
      default:
        return {
          icon: '✨',
          label: `Mira is thinking about ${petName}...`
        };
    }
  };

  const { icon, label } = getModeContent();

  return (
    <div className={`mp-mode-badge mp-mode-${mode}`}>
      <span className="mp-mode-icon">{icon}</span>
      {label && <span className="mp-mode-label">{label}</span>}
    </div>
  );
};

/**
 * MiraSkeletonLoader - Full skeleton with mode badge
 */
const MiraSkeletonLoader = ({ mode, petName }) => (
  <div className="mp-msg-mira mp-skeleton-loader" data-testid="mira-skeleton">
    <div className="mp-mira-avatar">
      <Sparkles className="pulse" />
    </div>
    <div className="mp-skeleton-content">
      <MiraModeBadge mode={mode} petName={petName} />
      <div className="mp-skeleton-lines">
        <div className="mp-skeleton-line"></div>
        <div className="mp-skeleton-line short"></div>
      </div>
    </div>
  </div>
);

/**
 * MiraLoadingDots - Quick loading indicator before skeleton
 */
const MiraLoadingDots = () => (
  <div className="mp-msg-mira" data-testid="mira-loading-dots">
    <div className="mp-loading">
      <div className="mp-mira-avatar">
        <Sparkles />
      </div>
      <div className="mp-loading-dots">
        <div className="mp-loading-dot"></div>
        <div className="mp-loading-dot"></div>
        <div className="mp-loading-dot"></div>
      </div>
    </div>
  </div>
);

/**
 * MiraLoader - Main component that combines skeleton and dots
 */
const MiraLoader = ({ 
  isProcessing, 
  showSkeleton, 
  mode = 'ready', 
  petName = 'your pet' 
}) => {
  if (!isProcessing) return null;

  if (showSkeleton) {
    return <MiraSkeletonLoader mode={mode} petName={petName} />;
  }

  return <MiraLoadingDots />;
};

export default MiraLoader;
export { MiraModeBadge, MiraSkeletonLoader, MiraLoadingDots };
