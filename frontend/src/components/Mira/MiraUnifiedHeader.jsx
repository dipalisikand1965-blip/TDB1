/**
 * MiraUnifiedHeader.jsx
 * ======================
 * Single Top Bar Header for Mira OS
 * 
 * Based on user's design reference:
 * [Mira Logo] [Pet Avatar+Soul Score] [TODAY][PICKS][SERVICES][LEARN][CONCIERGE®] [Weather] [Pet Profile]
 * 
 * Features:
 * - Single horizontal row layout
 * - 3D perspective tab design with glass morphism
 * - Pet avatar with golden soul score badge
 * - Weather display on the right
 * - Responsive for mobile/desktop
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  ChevronDown, Heart, Calendar, Sparkles, Briefcase, 
  GraduationCap, Users, Check, Cloud
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// OS Layer configuration
const OS_LAYERS = [
  { id: 'today', label: 'TODAY', icon: Calendar, description: 'Time Layer' },
  { id: 'picks', label: 'PICKS', icon: Sparkles, description: 'Intelligence Layer' },
  { id: 'services', label: 'SERVICES', icon: Briefcase, description: 'Action Layer' },
  { id: 'learn', label: 'LEARN', icon: GraduationCap, description: 'Knowledge Layer' },
  { id: 'concierge', label: 'CONCIERGE®', icon: Users, description: 'Human Layer' },
];

/**
 * Pet Soul Badge - Golden badge showing soul score percentage
 */
const PetSoulBadge = memo(({ pet, soulScore = 0, onClick }) => {
  const petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  const petName = pet?.name || 'Pet';
  
  return (
    <div className="mira-pet-soul-section" onClick={onClick}>
      {/* Pet Avatar with Soul Ring */}
      <div className="soul-avatar-container">
        {/* Orange outer glow */}
        <div className="soul-avatar-glow" />
        
        {/* Progress ring showing soul score */}
        <svg className="soul-progress-ring" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="4"
          />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(soulScore / 100) * 276} 276`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Pet photo */}
        <div className="soul-avatar-photo">
          {petPhoto ? (
            <img 
              src={petPhoto} 
              alt={petName}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
              }}
            />
          ) : (
            <span className="soul-avatar-emoji">🐕</span>
          )}
        </div>
        
        {/* Soul Score Badge - Golden */}
        <div className="soul-score-badge">
          <span className="soul-score-value">{Math.round(soulScore)}%</span>
          <span className="soul-score-label">SOUL</span>
        </div>
      </div>
      
      {/* Pet Name with Dropdown Arrow */}
      <div className="soul-pet-info">
        <span className="soul-pet-name">{petName}</span>
        <ChevronDown className="soul-dropdown-arrow" />
      </div>
    </div>
  );
});

/**
 * OS Tab - 3D perspective style tab
 */
const OSTab = memo(({ 
  layer, 
  isActive, 
  onClick, 
  badge = null,
  hasNew = false,
  iconState = 'OFF',
  iconCount = 0,
}) => {
  const Icon = layer.icon;
  const isPulse = iconState === 'PULSE';
  const isOff = iconState === 'OFF';
  
  return (
    <button
      className={`mira-os-tab ${isActive ? 'active' : ''} ${isPulse ? 'pulse' : ''} ${isOff ? 'off' : ''}`}
      onClick={() => {
        hapticFeedback.buttonTap();
        onClick(layer.id);
      }}
      data-testid={`os-tab-${layer.id}`}
    >
      <Icon className="tab-icon" />
      <span className="tab-label">{layer.label}</span>
      {(badge || iconCount > 0) && (
        <span className={`tab-badge ${isPulse ? 'badge-pulse' : ''}`}>
          {iconCount || badge}
        </span>
      )}
    </button>
  );
});

/**
 * Weather Display - Compact weather info
 */
const WeatherDisplay = memo(({ weather, onClick }) => {
  const temp = weather?.current_weather?.temperature || weather?.temperature;
  const city = weather?.city;
  
  if (!temp) return null;
  
  return (
    <button className="mira-weather-display" onClick={onClick} data-testid="weather-display">
      <Cloud className="weather-icon" />
      <span className="weather-temp">{Math.round(temp)}°C</span>
    </button>
  );
});

/**
 * Pet Profile Avatar - Right side profile with name
 */
const PetProfileAvatar = memo(({ pet, onClick }) => {
  const petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  const petName = pet?.name || 'Pet';
  
  return (
    <button className="mira-profile-avatar" onClick={onClick} data-testid="pet-profile-avatar">
      <div className="profile-photo">
        {petPhoto ? (
          <img 
            src={petPhoto} 
            alt={petName}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
            }}
          />
        ) : (
          <span>🐕</span>
        )}
      </div>
      <span className="profile-name">{petName}</span>
    </button>
  );
});

/**
 * Pet Dropdown - Multi-pet switcher
 */
const PetDropdown = memo(({ pets = [], currentPet, onSelectPet, isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="mira-pet-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">Switch Pet</div>
      <div className="dropdown-list">
        {pets.map((pet) => {
          const soulScore = Number(pet.soulScore) || Number(pet.overall_score) || 0;
          const hasPhoto = pet.photo || pet.image;
          
          return (
            <button
              key={pet.id}
              className={`dropdown-item ${pet.id === currentPet?.id ? 'active' : ''}`}
              onClick={() => {
                hapticFeedback.buttonTap();
                onSelectPet(pet);
                onClose();
              }}
            >
              <div className="dropdown-avatar">
                {hasPhoto ? (
                  <img src={hasPhoto} alt={pet.name} />
                ) : (
                  <span>🐕</span>
                )}
              </div>
              <div className="dropdown-info">
                <span className="dropdown-name">{pet.name}</span>
                <span className="dropdown-breed">{pet.breed}</span>
              </div>
              {soulScore > 10 && (
                <span className="dropdown-score">{Math.round(soulScore)}%</span>
              )}
              {pet.id === currentPet?.id && <Check className="dropdown-check" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

/**
 * Main MiraUnifiedHeader Component
 */
const MiraUnifiedHeader = ({
  currentPet,
  allPets = [],
  soulScore = 0,
  healthScore = 0,
  activeTab = 'today',
  onTabChange,
  onPetClick,
  onSwitchPet,
  badges = {},
  picksHasNew = false,
  iconStates = {},
  weather = null,
  onWeatherClick = null,
}) => {
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  
  const handlePetSectionClick = () => {
    if (allPets.length > 1) {
      setShowPetDropdown(!showPetDropdown);
    } else {
      onPetClick?.();
    }
  };
  
  return (
    <header className="mira-unified-header">
      {/* Left: Mira Logo */}
      <div className="mira-logo-section">
        <div className="mira-logo-icon">
          <Sparkles />
        </div>
        <div className="mira-logo-text">
          <span className="logo-title">Mira</span>
          <span className="logo-subtitle">Your Pet Companion</span>
        </div>
      </div>
      
      {/* Center-Left: Pet Avatar with Soul Score */}
      <div className="mira-pet-section-wrapper">
        <PetSoulBadge
          pet={currentPet}
          soulScore={soulScore}
          onClick={handlePetSectionClick}
        />
        <PetDropdown
          pets={allPets}
          currentPet={currentPet}
          onSelectPet={onSwitchPet}
          isOpen={showPetDropdown}
          onClose={() => setShowPetDropdown(false)}
        />
      </div>
      
      {/* Center: OS Tabs with 3D perspective */}
      <nav className="mira-os-tabs-container">
        {OS_LAYERS.map((layer) => {
          const tabIconState = iconStates[layer.id] || { state: 'OFF', count: 0 };
          return (
            <OSTab
              key={layer.id}
              layer={layer}
              isActive={activeTab === layer.id}
              onClick={onTabChange}
              badge={badges[layer.id]}
              hasNew={layer.id === 'picks' && picksHasNew}
              iconState={tabIconState.state}
              iconCount={tabIconState.count}
            />
          );
        })}
      </nav>
      
      {/* Right: Weather + Pet Profile */}
      <div className="mira-right-section">
        <WeatherDisplay weather={weather} onClick={onWeatherClick} />
        <PetProfileAvatar pet={currentPet} onClick={onPetClick} />
      </div>
    </header>
  );
};

export default MiraUnifiedHeader;
