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
              e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
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
 * PetDropdown - Multi-pet switcher dropdown
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
  
  return (
    <div className="pet-dropdown" ref={dropdownRef} data-testid="pet-dropdown">
      <div className="pet-dropdown-header">
        <span>Switch Pet</span>
      </div>
      <div className="pet-dropdown-list">
        {pets.map((pet) => (
          <button
            key={pet.id}
            className={`pet-dropdown-item ${pet.id === currentPet?.id ? 'active' : ''}`}
            onClick={() => {
              hapticFeedback.buttonTap();
              onSelectPet(pet);
              onClose();
            }}
            data-testid={`pet-option-${pet.id}`}
          >
            <PetAvatarRing 
              pet={pet} 
              soulScore={pet.soulScore || pet.overall_score || 0}
              healthScore={pet.healthScore || 0}
              size="small"
            />
            <div className="pet-dropdown-info">
              <span className="pet-dropdown-name">{pet.name}</span>
              <span className="pet-dropdown-breed">{pet.breed}</span>
            </div>
            {pet.id === currentPet?.id && (
              <Check className="pet-dropdown-check" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

/**
 * OSLayerTab - Individual tab in the navigation
 */
const OSLayerTab = memo(({ 
  layer, 
  isActive, 
  onClick, 
  badge = null,
  hasNew = false // For PICKS "new" sparkle animation
}) => {
  const Icon = layer.icon;
  
  return (
    <button
      className={`os-layer-tab ${isActive ? 'active' : ''} ${hasNew ? 'has-new-picks' : ''}`}
      onClick={() => {
        hapticFeedback.buttonTap();
        onClick(layer.id);
      }}
      title={layer.description}
      data-testid={`os-tab-${layer.id}`}
    >
      {Icon && <Icon className="tab-icon" />}
      <span className="tab-label">{layer.label}</span>
      {badge && (
        <span className={`tab-badge ${hasNew ? 'badge-new' : ''}`}>
          {hasNew ? '✨' : ''}{badge}
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
  badges = {}, // { picks: 3, services: 1, insights: 2 }
  picksHasNew = false, // For PICKS "new" sparkle animation
}) => {
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  
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
      <div className="os-mojo-tab">
        <div 
          className={`mojo-avatar-wrapper ${activeTab === 'mojo' ? 'active' : ''}`}
          onClick={handleMojoClick}
          data-testid="mojo-avatar-wrapper"
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
        {OS_LAYERS.filter(l => l.id !== 'mojo').map((layer) => (
          <OSLayerTab
            key={layer.id}
            layer={layer}
            isActive={activeTab === layer.id}
            onClick={onTabChange}
            badge={badges[layer.id]}
            hasNew={layer.id === 'picks' && picksHasNew}
          />
        ))}
      </div>
      
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
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        
        .pet-os-navigation::-webkit-scrollbar {
          display: none;
        }
        
        /* MOJO Tab (Pet Avatar) */
        .os-mojo-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        
        .mojo-avatar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
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
