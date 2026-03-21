/**
 * MiraUnifiedHeader.jsx
 * ======================
 * Single Top Bar Header for Mira OS
 * 
 * Layout (from user's reference):
 * [Mira Logo] [Pet+Soul+Name (→MOJO)] [TODAY][PICKS][SERVICES][LEARN][CONCIERGE®] [Temp] [Bell] [Pet Switcher (→dropdown)]
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, Heart, Calendar, Sparkles, Briefcase, 
  GraduationCap, Users, Check, Bell, MapPin
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import hapticFeedback from '../../utils/haptic';

// OS Layer configuration
const OS_LAYERS = [
  { id: 'today',     label: 'TODAY',       icon: Calendar,       description: 'Time Layer' },
  { id: 'picks',     label: 'PICKS',       icon: Sparkles,       description: 'Intelligence Layer' },
  { id: 'services',  label: 'SERVICES',    icon: Briefcase,      description: 'Action Layer' },
  { id: 'nearme',    label: '📍',         icon: MapPin,         description: 'Location Layer' },
  { id: 'learn',     label: 'LEARN',       icon: GraduationCap,  description: 'Knowledge Layer' },
  { id: 'concierge', label: 'CONCIERGE®',  icon: Users,          description: 'Human Layer' },
];

/**
 * LEFT SIDE: Pet Identity Section - Opens MOJO Modal
 * Shows: Pet avatar with soul ring, soul % badge, pet name, heart icon
 * NOTE: Notification badge moved to separate bell icon
 */
const PetIdentitySection = memo(({ pet, soulScore = 0, onClick }) => {
  const petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  const petName = pet?.name || 'Pet';
  
  return (
    <div className="mira-pet-identity" onClick={onClick} data-testid="pet-identity-section">
      {/* Pet Avatar with Soul Progress Ring */}
      <div className="pet-identity-avatar">
        {/* Orange glow effect */}
        <div className="pet-avatar-glow" />
        
        {/* Progress ring */}
        <svg className="pet-soul-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="4" />
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
        <div className="pet-avatar-photo">
          {petPhoto ? (
            <img src={petPhoto} alt={petName} onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
            }} />
          ) : (
            <span>🐕</span>
          )}
        </div>
        
        {/* Heart icon overlay */}
        <div className="pet-avatar-heart">
          <Heart className="heart-icon" />
        </div>
        
        {/* Soul Score Badge */}
        <div className="pet-soul-badge">
          <span className="soul-percent">{Math.round(soulScore)}%</span>
          <span className="soul-label">SOUL</span>
        </div>
      </div>
      
      {/* Pet Name + Dropdown Arrow */}
      <div className="pet-identity-info">
        <span className="pet-identity-name">{petName}</span>
        <ChevronDown className="pet-identity-arrow" />
      </div>
    </div>
  );
});

/**
 * Notification Bell - Opens Inbox
 */
const NotificationBellInHeader = memo(({ count = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleClick = (e) => {
    e.stopPropagation();
    hapticFeedback.buttonTap();
    const returnTo = encodeURIComponent(location.pathname);
    navigate(`/notifications?returnTo=${returnTo}`);
  };
  
  return (
    <button
      className="mira-notification-bell"
      onClick={handleClick}
      data-testid="notification-bell"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Bell className="bell-icon" />
      {count > 0 && (
        <span className="bell-badge" data-testid="notification-badge">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
});

/**
 * OS Tab - Navigation tab with icon and label
 */
const OSTab = memo(({ layer, isActive, onClick, badge = null, iconState = 'OFF', iconCount = 0, forceRender }) => {
  const Icon = layer.icon;
  const isPulse = iconState === 'PULSE';
  const showBadge = badge || iconCount > 0;
  
  return (
    <button
      className={`mira-os-tab ${isActive ? 'active' : ''} ${isPulse ? 'pulse' : ''}`}
      onClick={() => {
        hapticFeedback.buttonTap();
        onClick(layer.id);
      }}
      data-testid={`os-tab-${layer.id}`}
    >
      <Icon className="tab-icon" />
      <span className="tab-label">{layer.label}</span>
      {showBadge && (
        <span className={`tab-badge ${isPulse ? 'badge-pulse' : ''}`}>
          {iconCount > 0 ? `+${iconCount}` : badge}
        </span>
      )}
    </button>
  );
});

/**
 * Temperature Display
 */
/**
 * Temperature Display with City
 */
const TemperatureDisplay = memo(({ weather, onLocationClick }) => {
  const temp = weather?.current_weather?.temperature || weather?.temperature;
  const city = weather?.city;
  if (!temp) return null;
  
  return (
    <div 
      className="mira-temp-display" 
      data-testid="temp-display"
      onClick={onLocationClick}
      style={{ cursor: onLocationClick ? 'pointer' : 'default' }}
      title={onLocationClick ? 'Click to change location' : undefined}
    >
      <span className="temp-value">{Math.round(temp)}°C</span>
      {city && <span className="temp-city">• {city}</span>}
    </div>
  );
});

/**
 * RIGHT SIDE: Pet Switcher - Opens dropdown to switch pets
 */
const PetSwitcher = memo(({ pet, allPets = [], onSwitchPet, isOpen, onToggle, onClose }) => {
  const petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  const petName = pet?.name || 'Pet';
  const petCount = allPets.length;
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  return (
    <div className="mira-pet-switcher" ref={dropdownRef}>
      {/* Switcher Button */}
      <button 
        className={`pet-switcher-btn ${isOpen ? 'active' : ''}`} 
        onClick={onToggle}
        data-testid="pet-switcher-btn"
      >
        {/* Pet Count Badge */}
        {petCount > 1 && <span className="pet-count-badge">{petCount}+</span>}
        
        {/* Pet Photo */}
        <div className="switcher-photo">
          {petPhoto ? (
            <img src={petPhoto} alt={petName} onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
            }} />
          ) : (
            <span>🐕</span>
          )}
        </div>
        
        {/* Pet Name */}
        <span className="switcher-name">{petName}</span>
      </button>
      
      {/* Dropdown - Use Portal on mobile for proper fixed positioning */}
      {isOpen && (
        typeof window !== 'undefined' && window.innerWidth <= 768 ? (
          createPortal(
            <div 
              className="pet-switcher-dropdown"
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: 'auto',
                bottom: '0px',
                left: '0px',
                right: '0px',
                width: '100%',
                maxHeight: '70vh',
                borderRadius: '20px 20px 0 0',
                zIndex: 9999,
                padding: '16px',
                paddingBottom: '40px',
                background: 'linear-gradient(145deg, rgba(88, 28, 135, 0.98), rgba(59, 7, 100, 0.98))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.5)',
                overflowY: 'auto'
              }}
            >
              {allPets.map((p) => {
                const pPhoto = p.photo || p.pet_photo || p.photo_url || p.image;
                const pScore = Number(p.soulScore) || Number(p.overall_score) || 0;
                const isNew = p.isNew || pScore < 20;
                const isSelected = p.id === pet?.id;
                
                return (
                  <button
                    key={p.id}
                    className={`switcher-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      hapticFeedback.buttonTap();
                      onSwitchPet(p);
                      onClose();
                    }}
                  >
                    <div className="item-avatar">
                      {pPhoto ? (
                        <img src={pPhoto} alt={p.name} />
                      ) : (
                        <div className="item-avatar-placeholder">🐕</div>
                      )}
                    </div>
                    <div className="item-info">
                      <span className="item-name">{p.name}</span>
                      <span className="item-breed">{p.breed}</span>
                    </div>
                    {isNew ? (
                      <span className="item-new">+ New</span>
                    ) : pScore > 0 ? (
                      <span className="item-score">{Math.round(pScore)}%</span>
                    ) : null}
                    {isSelected && <Check className="item-check" />}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        ) : (
          <div className="pet-switcher-dropdown">
            {allPets.map((p) => {
              const pPhoto = p.photo || p.pet_photo || p.photo_url || p.image;
              const pScore = Number(p.soulScore) || Number(p.overall_score) || 0;
              const isNew = p.isNew || pScore < 20;
              const isSelected = p.id === pet?.id;
              
              return (
                <button
                  key={p.id}
                  className={`switcher-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    hapticFeedback.buttonTap();
                    onSwitchPet(p);
                    onClose();
                  }}
                >
                  <div className="item-avatar">
                    {pPhoto ? (
                      <img src={pPhoto} alt={p.name} />
                    ) : (
                      <div className="item-avatar-placeholder">🐕</div>
                    )}
                  </div>
                  <div className="item-info">
                    <span className="item-name">{p.name}</span>
                    <span className="item-breed">{p.breed}</span>
                  </div>
                  {isNew ? (
                    <span className="item-new">+ New</span>
                  ) : pScore > 0 ? (
                    <span className="item-score">{Math.round(pScore)}%</span>
                  ) : null}
                  {isSelected && <Check className="item-check" />}
                </button>
              );
            })}
          </div>
        )
      )}
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
  activeTab = 'today',
  onTabChange,
  onPetClick,
  onSwitchPet,
  badges = {},
  picksHasNew = false,
  iconStates = {},
  weather = null,
  notificationCount = 0,
  servicesPulse = false, // Glowing effect when AI creates a service ticket
  onLocationClick = null, // Callback to change location
}) => {
  const [showPetSwitcher, setShowPetSwitcher] = useState(false);
  
  return (
    <header className="mira-unified-header">
      {/* LEFT: Mira Logo */}
      <div className="mira-logo-section">
        <div className="mira-logo-icon">
          <Sparkles />
        </div>
        <div className="mira-logo-text">
          <span className="logo-title">Mira</span>
          <span className="logo-subtitle">Your Pet Companion</span>
        </div>
      </div>
      
      {/* LEFT: Pet Identity (opens MOJO modal) */}
      <PetIdentitySection
        pet={currentPet}
        soulScore={soulScore}
        onClick={() => {
          hapticFeedback.buttonTap();
          setShowPetSwitcher(false);
          onPetClick?.();
        }}
      />
      
      {/* CENTER: OS Navigation Tabs */}
      <nav className="mira-os-tabs">
        {OS_LAYERS.map((layer) => {
          const tabIconState = iconStates[layer.id] || { state: 'OFF', count: 0 };
          // Override services tab state when servicesPulse is active
          const effectiveIconState = (layer.id === 'services' && servicesPulse) 
            ? 'PULSE' 
            : tabIconState.state;
          
          return (
            <OSTab
              key={layer.id}
              layer={layer}
              isActive={activeTab === layer.id}
              onClick={onTabChange}
              badge={badges[layer.id]}
              iconState={effectiveIconState}
              iconCount={tabIconState.count}
              forceRender={layer.id === 'services' ? servicesPulse : undefined}
            />
          );
        })}
      </nav>
      
      {/* CENTER-RIGHT: Temperature */}
      <TemperatureDisplay weather={weather} onLocationClick={onLocationClick} />
      
      {/* RIGHT: Notification Bell - Opens Inbox */}
      <NotificationBellInHeader count={notificationCount} />
      
      {/* RIGHT: Pet Switcher (opens dropdown) */}
      <PetSwitcher
        pet={currentPet}
        allPets={allPets}
        onSwitchPet={onSwitchPet}
        isOpen={showPetSwitcher}
        onToggle={() => {
          hapticFeedback.buttonTap();
          setShowPetSwitcher(!showPetSwitcher);
        }}
        onClose={() => setShowPetSwitcher(false)}
      />
    </header>
  );
};

export default MiraUnifiedHeader;
