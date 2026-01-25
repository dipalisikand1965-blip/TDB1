/**
 * PetSoulScore Component
 * Animated circular progress ring with pet photo
 * Shows pet soul completion percentage with attention-grabbing animation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { resolvePetAvatar } from '../utils/petAvatar';

const PetSoulScore = ({ score, isLoggedIn, pet, className = '' }) => {
  // Calculate stroke dasharray and dashoffset for progress ring
  const size = 40;
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
  
  // Use centralized pet avatar resolver
  const { photoUrl, isBreedPhoto } = resolvePetAvatar(pet);
  const petName = pet?.name || 'Pet';

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
      title={`${petName}'s Soul: ${score}% complete${isBreedPhoto ? ' - Click to add photo' : ''}`}
    >
      {/* Pet Photo with Progress Ring */}
      <div className={`relative ${needsAttention ? 'animate-pulse-soft' : ''}`}>
        {/* Glow effect for incomplete profiles */}
        {needsAttention && (
          <div 
            className="absolute inset-0 rounded-full animate-ping-slow opacity-75"
            style={{ 
              backgroundColor: colors.glow,
              transform: 'scale(1.2)'
            }}
          />
        )}
        
        {/* SVG Progress Ring with Pet Photo */}
        <svg width={size} height={size} className="relative z-10">
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
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
          
          {/* Pet Photo in center - using resolved avatar */}
          <foreignObject x="4" y="4" width={size - 8} height={size - 8}>
            <div className="w-full h-full rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
              <img 
                src={photoUrl} 
                alt={petName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full items-center justify-center hidden">
                <PawPrint className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </foreignObject>
        </svg>
        
        {/* Upload indicator for breed photos */}
        {isBreedPhoto && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border border-white flex items-center justify-center">
            <span className="text-[6px] text-white">+</span>
          </div>
        )}
      </div>
      
      {/* Score Text */}
      <div className="hidden lg:flex flex-col">
        <span className="text-xs font-semibold text-gray-800 leading-tight">{petName}</span>
        <span 
          className="text-[10px] font-medium leading-tight"
          style={{ color: colors.ring }}
        >
          {score}% Soul
        </span>
      </div>
    </Link>
  );
};

export default PetSoulScore;
