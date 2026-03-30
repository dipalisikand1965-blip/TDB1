/**
 * PetOSNavigation.jsx
 * ====================
 * The Pet Operating System Navigation Bar
 * 
 * 6 OS LAYERS:
 * - MOJO = Identity Layer (Pet Profile - ALWAYS FIRST)
 * - TODAY = Time Layer
 * - PICKS = Intelligence Layer
 * - SERVICES = Action Layer
 * - LEARN = Knowledge Layer
 * - CONCIERGE = Human Layer
 * 
 * "MOJO feeds all other layers"
 * 
 * Features:
 * - Beautiful pet avatar with concentric rings
 * - Health indicator badge
 * - Soul score badge
 * - Multi-pet dropdown for switching
 * - Click pet avatar → Opens MOJO Profile Modal
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  ChevronDown, Heart, Calendar, Sparkles, Briefcase, 
  GraduationCap, Users, Check
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// OS Layer configuration - Final primary nav: MOJO, TODAY, PICKS, SERVICES, LEARN, CONCIERGE
// Note: INSIGHTS removed per user request - moved to CONCIERGE layer
const OS_LAYERS = [
  { id: 'mojo', label: 'MOJO', icon: null, description: 'Identity Layer' }, // Pet avatar replaces icon
  { id: 'today', label: 'TODAY', icon: Calendar, description: 'Time Layer' },
  { id: 'picks', label: 'PICKS', icon: Sparkles, description: 'Intelligence Layer' },
  { id: 'services', label: 'SERVICES', icon: Briefcase, description: 'Action Layer' },
  { id: 'learn', label: 'LEARN', icon: GraduationCap, description: 'Knowledge Layer' },
  { id: 'concierge', label: 'CONCIERGE®', icon: Users, description: 'Human Layer' },
];

/**
 * PetAvatarRing - Beautiful circular pet avatar with concentric rings
 * Inspired by the design with health indicator and soul score badge
 */
const PetAvatarRing = memo(({ 
  pet, 
  soulScore = 0, 
  healthScore = 0,
  size = 'medium', // 'small' | 'medium' | 'large'
  onClick,
  showDropdownArrow = false,
  isSelected = false
}) => {
  const sizes = {
    small: { container: 40, photo: 32, ring: 38, badge: 10 },
    medium: { container: 56, photo: 44, ring: 52, badge: 14 },
    large: { container: 80, photo: 64, ring: 76, badge: 18 },
  };
  
  const s = sizes[size];
  // Handle different photo field names and relative URLs
  let petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  // If it's a relative URL, prepend the API base URL
  if (petPhoto && petPhoto.startsWith('/api/')) {
    petPhoto = `${window.location.origin}${petPhoto}`;
  }
  const petName = pet?.name || 'Pet';
  
  // Calculate ring gradient based on soul score
  const soulDegrees = (soulScore / 100) * 360;
  
  return (
    <div 
      className="pet-avatar-ring-container"
      onClick={onClick}
      style={{ width: s.container, height: s.container }}
      data-testid="pet-avatar-ring"
    >
      {/* Outer Animated Glow Ring */}
      <div 
        className="avatar-glow-ring"
        style={{
          width: s.container + 8,
          height: s.container + 8,
        }}
      />
      
      {/* Concentric Rings */}
      <div 
        className="avatar-concentric-rings"
        style={{
          width: s.ring + 8,
          height: s.ring + 8,
        }}
      >
        {/* Soul Progress Ring */}
        <svg 
          className="avatar-progress-ring" 
          viewBox="0 0 100 100"
          style={{ width: s.ring + 8, height: s.ring + 8 }}
        >
          {/* Background ring */}
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="3"
          />
          {/* Progress ring */}
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="url(#soulGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${soulDegrees * 0.8} 1000`}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <defs>
            <linearGradient id="soulGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Photo Container */}
      <div 
        className="avatar-photo-container"
        style={{ width: s.photo, height: s.photo }}
      >
        {petPhoto ? (
          <img 
            src={petPhoto} 
            alt={petName}
            className="avatar-photo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display='none';
            }}
          />
        ) : (
          <div className="avatar-placeholder">
            <span style={{ fontSize: s.photo * 0.5 }}>🐕</span>
          </div>
        )}
      </div>
      
      {/* Health Indicator Badge (Top-Left) */}
      <div 
        className={`avatar-health-badge ${healthScore > 50 ? 'healthy' : healthScore > 0 ? 'partial' : 'empty'}`}
        style={{
          width: s.badge + 8,
          height: s.badge + 8,
          fontSize: s.badge * 0.6,
        }}
        title={`Health: ${healthScore}%`}
      >
        <Heart className="health-icon" style={{ width: s.badge * 0.7, height: s.badge * 0.7 }} />
      </div>
      
      {/* Soul Score Badge (Bottom) */}
      <div 
        className="avatar-soul-badge"
        style={{ fontSize: s.badge * 0.75 }}
      >
        <span className="soul-value">{Math.round(soulScore)}%</span>
        <span className="soul-label">SOUL</span>
      </div>
      
      {/* Dropdown Arrow */}
      {showDropdownArrow && (
        <div className="avatar-dropdown-arrow">
          <ChevronDown style={{ width: 12, height: 12 }} />
        </div>
      )}
      
      {/* Selection Ring */}
      {isSelected && <div className="avatar-selection-ring" />}
    </div>
  );
});

/**
 * PetDropdown - Multi-pet switcher dropdown with soul score badges
 * Shows: Photo | Name | Breed | Soul Score % Badge | Checkmark
 * Per user request - restore the original design with soul scores
 */
const PetDropdown = memo(({ 
  pets = [], 
  currentPet, 
  onSelectPet, 
  isOpen, 
  onClose 
}) => {
  const dropdownRef = useRef(null);
  
  // Close on outside click
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
  
  // Paw placeholder SVG for pets without photos
  const PawPlaceholder = () => (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
    </div>
  );
  
  return (
    <div 
      className="pet-dropdown" 
      ref={dropdownRef} 
      data-testid="pet-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '8px',
        background: 'linear-gradient(145deg, rgba(88,28,135,0.98), rgba(59,7,100,0.98))',
        borderRadius: '16px',
        border: '1px solid rgba(168,85,247,0.3)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        minWidth: '280px',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      <div 
        className="pet-dropdown-header"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Switch Pet
        </span>
      </div>
      <div className="pet-dropdown-list" style={{ padding: '8px' }}>
        {pets.map((pet) => {
          const soulScore = Number(pet.soulScore) || Number(pet.overall_score) || 0;
          const hasPhoto = pet.photo || pet.image;
          
          return (
            <button
              key={pet.id}
              className={`pet-dropdown-item ${pet.id === currentPet?.id ? 'active' : ''}`}
              onClick={() => {
                hapticFeedback.buttonTap();
                onSelectPet(pet);
                onClose();
              }}
              data-testid={`pet-option-${pet.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                background: pet.id === currentPet?.id ? 'rgba(168,85,247,0.2)' : 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px'
              }}
              onMouseEnter={(e) => {
                if (pet.id !== currentPet?.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = pet.id === currentPet?.id ? 'rgba(168,85,247,0.2)' : 'transparent';
              }}
            >
              {/* Pet Avatar */}
              <div className="pet-dropdown-avatar">
                {hasPhoto ? (
                  <img 
                    src={hasPhoto} 
                    alt={pet.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255,255,255,0.2)'
                    }}
                  />
                ) : (
                  <PawPlaceholder />
                )}
              </div>
              
              {/* Pet Info */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ 
                  display: 'block', 
                  color: 'white', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  marginBottom: '2px'
                }}>
                  {pet.name}
                </span>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: '12px' 
                }}>
                  {pet.breed}
                  {/* Soul Score Badge */}
                  {soulScore > 10 ? (
                    <span 
                      style={{ 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {Math.round(soulScore)}%
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                      </svg>
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                        padding: '2px 6px', 
                        borderRadius: '8px', 
                        fontSize: '9px',
                        fontWeight: '600',
                        color: 'white'
                      }}
                    >
                      ✨ New
                    </span>
                  )}
                </span>
              </div>
              
              {/* Checkmark for selected pet */}
              {pet.id === currentPet?.id && (
                <Check style={{ color: '#a855f7', width: '20px', height: '20px' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

/**
 * OSLayerTab - Individual tab in the navigation
 * Updated for PET_OS_BEHAVIOR_BIBLE v1.1 Section 2 (OFF/ON/PULSE states)
 */
const OSLayerTab = memo(({ 
  layer, 
  isActive, 
  onClick, 
  badge = null,
  hasNew = false, // Legacy: For PICKS "new" sparkle animation
  iconState = 'OFF', // NEW: OFF | ON | PULSE per Bible
  iconCount = 0, // NEW: Count for badge
}) => {
  const Icon = layer.icon;
  const isOff = iconState === 'OFF';
  const isOn = iconState === 'ON';
  const isPulse = iconState === 'PULSE';
  
  return (
    <button
      className={`
        os-layer-tab 
        ${isActive ? 'active' : ''} 
        ${hasNew || isPulse ? 'has-new-picks' : ''}
        ${isOff ? 'icon-off' : ''}
        ${isPulse ? 'icon-pulse' : ''}
      `}
      onClick={() => {
        hapticFeedback.buttonTap();
        onClick(layer.id);
      }}
      title={layer.description}
      data-testid={`os-tab-${layer.id}`}
      data-icon-state={iconState}
      aria-label={`${layer.label}, ${isOff ? 'no items' : isPulse ? `${iconCount || badge} new items` : `${iconCount || badge || 0} items`}`}
    >
      {/* Icon with state-based styling */}
      {Icon && (
        <div className="tab-icon-wrapper">
          <Icon className={`tab-icon ${isOff ? 'opacity-50' : ''} ${isPulse ? 'animate-pulse-subtle' : ''}`} />
          {/* State indicator dot */}
          {(isOn || isPulse) && !badge && !iconCount && (
            <span className={`tab-state-dot ${isPulse ? 'dot-pulse' : 'dot-on'}`} />
          )}
        </div>
      )}
      <span className={`tab-label ${isOff ? 'opacity-50' : ''}`}>{layer.label}</span>
      {/* Badge: Show count from iconCount or legacy badge */}
      {(badge || iconCount > 0) && (
        <span className={`tab-badge ${hasNew || isPulse ? 'badge-new badge-pulse' : ''}`}>
          {isPulse ? '✨' : ''}{iconCount || badge}
        </span>
      )}
      {hasNew && layer.id === 'picks' && (
        <span className="new-picks-indicator" />
      )}
    </button>
  );
});

/**
 * Main PetOSNavigation Component
 * Updated for PET_OS_BEHAVIOR_BIBLE v1.1 Section 2 (OFF/ON/PULSE states)
 */
const PetOSNavigation = ({
  currentPet,
  allPets = [],
  soulScore = 0,
  healthScore = 0,
  activeTab = 'today',
  onTabChange,
  onPetClick, // Opens MOJO modal
  onSwitchPet,
  badges = {}, // Legacy: { picks: 3, services: 1, insights: 2 }
  picksHasNew = false, // Legacy: For PICKS "new" sparkle animation
  // NEW: Icon states per Bible Section 2
  iconStates = {
    mojo: { state: 'ON', count: 0 }, // MOJO is always at least ON
    today: { state: 'OFF', count: 0 },
    picks: { state: 'OFF', count: 0 },
    services: { state: 'OFF', count: 0 },
    learn: { state: 'OFF', count: 0 },
    concierge: { state: 'OFF', count: 0 },
  },
  // Weather hint for header
  weather = null,
  onWeatherClick = null, // Opens TODAY panel
}) => {
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  
  // Get MOJO icon state for visual feedback on pet avatar
  const mojoIconState = iconStates.mojo || { state: 'ON', count: 0 };
  const isMojoPulse = mojoIconState.state === 'PULSE';
  
  // Extract weather data for minimal display
  const weatherTemp = weather?.current_weather?.temperature || weather?.temperature;
  const weatherCity = weather?.city || currentPet?.city;
  
  const handleMojoClick = () => {
    hapticFeedback.buttonTap();
    // If clicking the MOJO tab area (not dropdown), open MOJO modal
    onPetClick?.();
    onTabChange?.('mojo');
  };
  
  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    hapticFeedback.buttonTap();
    setShowPetDropdown(!showPetDropdown);
  };
  
  return (
    <nav className="pet-os-navigation" data-testid="pet-os-navigation">
      {/* MOJO Tab (Pet Avatar) - Always First */}
      <div className={`os-mojo-tab ${isMojoPulse ? 'mojo-pulse' : ''}`}>
        <div 
          className={`mojo-avatar-wrapper ${activeTab === 'mojo' ? 'active' : ''} ${isMojoPulse ? 'needs-attention' : ''}`}
          onClick={handleMojoClick}
          data-testid="mojo-avatar-wrapper"
          data-icon-state={mojoIconState.state}
          title={isMojoPulse ? `Complete ${currentPet?.name || 'pet'}'s profile` : ''}
        >
          <PetAvatarRing
            pet={currentPet}
            soulScore={soulScore}
            healthScore={healthScore}
            size="medium"
            showDropdownArrow={allPets.length > 1}
          />
          <span className="mojo-pet-name">{currentPet?.name || 'Pet'}</span>
        </div>
        
        {/* Multi-pet dropdown toggle */}
        {allPets.length > 1 && (
          <button 
            className="mojo-dropdown-toggle"
            onClick={handleDropdownToggle}
            data-testid="pet-dropdown-toggle"
          >
            <ChevronDown className={`dropdown-chevron ${showPetDropdown ? 'open' : ''}`} />
          </button>
        )}
        
        {/* Pet Dropdown */}
        <PetDropdown
          pets={allPets}
          currentPet={currentPet}
          onSelectPet={onSwitchPet}
          isOpen={showPetDropdown}
          onClose={() => setShowPetDropdown(false)}
        />
      </div>
      
      {/* Divider */}
      <div className="os-nav-divider" />
      
      {/* Other OS Layer Tabs */}
      <div className="os-layer-tabs">
        {OS_LAYERS.filter(l => l.id !== 'mojo').map((layer) => {
          // Get icon state for this tab
          const tabIconState = iconStates[layer.id] || { state: 'OFF', count: 0 };
          
          return (
            <OSLayerTab
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
      </div>
      
      {/* Weather Hint - Minimal ambient display, taps to open TODAY */}
      {weatherTemp && weatherCity && (
        <button
          className="weather-hint"
          onClick={() => {
            hapticFeedback.buttonTap();
            onWeatherClick?.();
          }}
          data-testid="weather-hint"
        >
          <span className="weather-temp">{Math.round(weatherTemp)}°C</span>
          <span className="weather-city">· {weatherCity}</span>
        </button>
      )}
      
      {/* Styles */}
      <style jsx>{`
        .pet-os-navigation {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(180deg, rgba(26, 16, 37, 0.98) 0%, rgba(13, 10, 18, 0.95) 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          position: relative;
        }
        
        .pet-os-navigation::-webkit-scrollbar {
          display: none;
        }
        
        /* Weather Hint - Minimal ambient display */
        .weather-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-left: auto;
        }
        
        .weather-hint:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .weather-temp {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .weather-city {
          opacity: 0.7;
        }
        
        /* MOJO Tab (Pet Avatar) */
        .os-mojo-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          overflow: visible;
        }
        
        .mojo-avatar-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          overflow: visible;
        }
        
        .mojo-avatar-wrapper:hover {
          background: rgba(139, 92, 246, 0.1);
        }
        
        .mojo-avatar-wrapper.active {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
        }
        
        .mojo-pet-name {
          font-size: 11px;
          font-weight: 600;
          color: white;
          max-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .mojo-dropdown-toggle {
          position: absolute;
          bottom: 0;
          right: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.8);
          border: 2px solid #1a1025;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }
        
        .mojo-dropdown-toggle:hover {
          background: #8B5CF6;
          transform: scale(1.1);
        }
        
        .dropdown-chevron {
          width: 12px;
          height: 12px;
          transition: transform 0.2s;
        }
        
        .dropdown-chevron.open {
          transform: rotate(180deg);
        }
        
        /* Pet Avatar Ring Styles */
        .pet-avatar-ring-container {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-glow-ring {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          animation: pulseGlow 3s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        .avatar-concentric-rings {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-progress-ring {
          position: absolute;
          transform: rotate(-90deg);
        }
        
        .avatar-photo-container {
          position: relative;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(139, 92, 246, 0.5);
          background: linear-gradient(135deg, #2d1f42, #1a1025);
        }
        
        .avatar-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2d1f42, #1a1025);
        }
        
        .avatar-health-badge {
          position: absolute;
          top: -2px;
          left: -2px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #1a1025;
          z-index: 2;
        }
        
        .avatar-health-badge.empty {
          background: linear-gradient(135deg, #EF4444, #DC2626);
        }
        
        .avatar-health-badge.partial {
          background: linear-gradient(135deg, #F59E0B, #D97706);
        }
        
        .avatar-health-badge.healthy {
          background: linear-gradient(135deg, #22C55E, #16A34A);
        }
        
        .health-icon {
          color: white;
        }
        
        .avatar-soul-badge {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2px 8px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border-radius: 10px;
          border: 2px solid #1a1025;
          z-index: 2;
          line-height: 1;
        }
        
        .soul-value {
          font-weight: 700;
          color: white;
        }
        
        .soul-label {
          font-size: 6px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.5px;
        }
        
        .avatar-dropdown-arrow {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 2px solid #1a1025;
        }
        
        .avatar-selection-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #8B5CF6;
          animation: selectionPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes selectionPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Divider */
        .os-nav-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.3), transparent);
          flex-shrink: 0;
        }
        
        /* OS Layer Tabs */
        .os-layer-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .os-layer-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .os-layer-tab:hover {
          background: rgba(139, 92, 246, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .os-layer-tab.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1));
          border-color: rgba(139, 92, 246, 0.3);
          color: white;
        }
        
        .tab-icon {
          width: 16px;
          height: 16px;
        }
        
        .tab-label {
          letter-spacing: 0.5px;
        }
        
        .tab-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: linear-gradient(135deg, #EC4899, #8B5CF6);
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Icon State Styles (Bible Section 2) */
        .tab-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .os-layer-tab.icon-off {
          color: rgba(255, 255, 255, 0.4);
        }
        
        .os-layer-tab.icon-off:hover {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .os-layer-tab.icon-pulse .tab-icon {
          animation: icon-pulse 2s ease-in-out infinite;
        }
        
        .tab-state-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        
        .tab-state-dot.dot-on {
          background: rgba(255, 255, 255, 0.5);
        }
        
        .tab-state-dot.dot-pulse {
          background: #8B5CF6;
          animation: dot-ping 1.5s ease-out infinite;
        }
        
        .tab-badge.badge-pulse {
          animation: badge-glow 1.5s ease-in-out infinite;
        }
        
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }
        
        @keyframes dot-ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.8); }
        }
        
        /* MOJO PULSE STATE - Pet avatar needs attention (incomplete profile) */
        .os-mojo-tab.mojo-pulse .mojo-avatar-wrapper {
          animation: mojo-attention-pulse 2s ease-in-out infinite;
        }
        
        .mojo-avatar-wrapper.needs-attention::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          border-radius: 50%;
          border: 2px solid #1a1025;
          animation: mojo-dot-pulse 1.5s ease-out infinite;
        }
        
        @keyframes mojo-attention-pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
          }
          50% { 
            filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.7));
          }
        }
        
        @keyframes mojo-dot-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .os-layer-tab.icon-pulse .tab-icon,
          .tab-state-dot.dot-pulse,
          .tab-badge.badge-pulse,
          .os-mojo-tab.mojo-pulse .mojo-avatar-wrapper,
          .mojo-avatar-wrapper.needs-attention::after,
          .mojo-complete-prompt {
            animation: none;
          }
        }
        
        /* Complete Profile Prompt - Shows on MOJO PULSE */
        .mojo-complete-prompt {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15));
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 12px;
          white-space: nowrap;
          z-index: 100;
          animation: prompt-fade-in 0.3s ease-out;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2);
        }
        
        .mojo-complete-prompt::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid rgba(245, 158, 11, 0.4);
        }
        
        .mojo-complete-prompt .prompt-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
        }
        
        .mojo-complete-prompt .prompt-cta {
          font-size: 11px;
          color: #F59E0B;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        @keyframes prompt-fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        /* Pet Dropdown */
        .pet-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          min-width: 220px;
          background: linear-gradient(180deg, #1a1025 0%, #0d0a12 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          overflow: hidden;
        }
        
        .pet-dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .pet-dropdown-list {
          padding: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .pet-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pet-dropdown-item:hover {
          background: rgba(139, 92, 246, 0.1);
        }
        
        .pet-dropdown-item.active {
          background: rgba(139, 92, 246, 0.15);
        }
        
        .pet-dropdown-info {
          flex: 1;
          text-align: left;
        }
        
        .pet-dropdown-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        
        .pet-dropdown-breed {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .pet-dropdown-check {
          width: 18px;
          height: 18px;
          color: #22C55E;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .pet-os-navigation {
            padding: 8px 12px;
            gap: 6px;
          }
          
          .os-layer-tab {
            padding: 6px 10px;
            font-size: 11px;
          }
          
          .tab-label {
            display: none;
          }
          
          .os-layer-tab.active .tab-label {
            display: inline;
          }
          
          .mojo-pet-name {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .os-layer-tabs {
            gap: 2px;
          }
          
          .os-layer-tab {
            padding: 6px 8px;
          }
        }
        
        /* NEW PICKS Animation - Sparkle and Glow */
        .os-layer-tab.has-new-picks {
          animation: picksGlow 2s ease-in-out infinite;
        }
        
        @keyframes picksGlow {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(236, 72, 153, 0.4);
          }
          50% { 
            box-shadow: 0 0 16px rgba(236, 72, 153, 0.7), 0 0 24px rgba(139, 92, 246, 0.4);
          }
        }
        
        .tab-badge.badge-new {
          background: linear-gradient(135deg, #EC4899, #F472B6);
          animation: badgePulse 1.5s ease-in-out infinite;
        }
        
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .new-picks-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EC4899;
          animation: newDot 1s ease-in-out infinite;
        }
        
        @keyframes newDot {
          0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 4px #EC4899;
          }
          50% { 
            opacity: 0.6;
            box-shadow: 0 0 8px #EC4899, 0 0 12px #EC4899;
          }
        }
      `}</style>
    </nav>
  );
};

export default PetOSNavigation;
