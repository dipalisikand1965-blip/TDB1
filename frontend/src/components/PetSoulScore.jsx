/**
 * PetSoulScore Component
 * Animated circular progress ring with paw icon
 * Shows pet soul completion percentage with attention-grabbing animation
 */

import React from 'react';
import { Link } from 'react-router-dom';

const PetSoulScore = ({ score, isLoggedIn, className = '' }) => {
  // Calculate stroke dasharray and dashoffset for progress ring
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const getColor = () => {
    if (score >= 80) return { ring: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' }; // Green
    if (score >= 50) return { ring: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' }; // Amber
    return { ring: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)' }; // Purple
  };
  
  const colors = getColor();
  const needsAttention = score < 70;

  if (!isLoggedIn) {
    // Simple button for non-logged-in users
    return (
      <Link
        to="/pet-soul"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
          bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-all
          ${className}`}
        data-testid="pet-soul-nav-btn"
      >
        <span className="text-sm">🐾</span>
        <span>Pet Soul™</span>
      </Link>
    );
  }

  return (
    <Link
      to="/my-pets"
      className={`flex items-center gap-2 group ${className}`}
      data-testid="pet-soul-nav-btn"
      title={`Pet Soul: ${score}% complete - Click to view your pets`}
    >
      {/* Animated Score Circle */}
      <div className={`relative ${needsAttention ? 'animate-pulse-soft' : ''}`}>
        {/* Glow effect for incomplete profiles */}
        {needsAttention && (
          <div 
            className="absolute inset-0 rounded-full animate-ping-slow opacity-75"
            style={{ 
              backgroundColor: colors.glow,
              transform: 'scale(1.3)'
            }}
          />
        )}
        
        {/* SVG Progress Ring */}
        <svg width={size} height={size} className="transform -rotate-90 relative z-10">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="white"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colors.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Paw Icon in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs ${needsAttention ? 'animate-bounce-slow' : ''}`}>🐾</span>
        </div>
      </div>
      
      {/* Score Text */}
      <div className="hidden sm:flex flex-col items-start leading-tight">
        <span className="text-[10px] text-gray-500 font-medium">Pet Soul</span>
        <span 
          className="text-xs font-bold"
          style={{ color: colors.ring }}
        >
          {score}%
        </span>
      </div>
      
      {/* Tooltip for low scores */}
      {needsAttention && (
        <div className="hidden group-hover:block absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap">
            Complete your Pet Soul for better recommendations!
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
          </div>
        </div>
      )}
    </Link>
  );
};

export default PetSoulScore;
