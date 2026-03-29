/**
 * PetSelector - Simple Pet Selection Dropdown
 * ============================================
 * A clean, simple dropdown for switching between pets.
 * Shows: pet avatar, name, breed, soul score badge, checkmark for selected.
 * 
 * Click pet card = Select that pet (no modal, no navigation)
 * MOJO profile is accessed via the nav bar, not here.
 */

import React from 'react';
import { PawPrint, Check } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

/**
 * PetSelector Component
 * 
 * @param {Object} props.currentPet - Currently selected pet
 * @param {Array} props.allPets - List of all pets
 * @param {boolean} props.isOpen - Whether dropdown is visible
 * @param {Function} props.onToggle - Toggle dropdown visibility
 * @param {Function} props.onSelectPet - Called when a pet is selected
 */
const PetSelector = ({
  currentPet,
  allPets = [],
  isOpen = false,
  onToggle,
  onSelectPet
}) => {
  
  const handleToggle = () => {
    hapticFeedback.buttonTap();
    if (onToggle) onToggle();
  };
  
  // Simple pet selection - just switch pet, close dropdown
  const handleSelectPet = (pet) => {
    hapticFeedback.buttonTap();
    if (onSelectPet) onSelectPet(pet);
  };
  
  return (
    <>
      {/* Pet Badge Button - Click to open dropdown */}
      <button 
        className="mp-pet-badge"
        onClick={handleToggle}
        data-testid="pet-selector-btn"
      >
        <div className="mp-pet-avatar">
          {currentPet?.photo_url || currentPet?.photo ? (
            <img src={currentPet.photo_url || currentPet.photo} alt={currentPet.name} />
          ) : (
            <PawPrint />
          )}
        </div>
        <span className="mp-pet-name">
          {currentPet?.name || 'Pet'}
        </span>
      </button>
      
      {/* Pet Dropdown - Simple list to select pets */}
      {isOpen && (
        <div className="mp-pet-dropdown" data-testid="pet-dropdown">
          {allPets.map((p) => {
            const soulScore = Number(p.soulScore) || 0;
            const hasPhoto = p.photo_url || p.photo || p.image;
            
            return (
              <button 
                key={p.id} 
                onClick={() => handleSelectPet(p)} 
                className={`mp-pet-option ${p.id === currentPet?.id ? 'active' : ''}`}
                data-testid={`pet-option-${p.id}`}
              >
                {/* Pet Avatar */}
                <div className="mp-pet-avatar">
                  {hasPhoto ? (
                    <img src={hasPhoto} alt={p.name} />
                  ) : (
                    <PawPrint />
                  )}
                </div>
                
                {/* Pet Info */}
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 600, 
                    fontSize: 14 
                  }}>
                    {p.name}
                  </span>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: 12 
                  }}>
                    {p.breed}
                    {/* Soul Score Badge - Display only, not clickable */}
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
                          alignItems: 'center'
                        }}
                      >
                        {Math.round(soulScore)}%
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
                {p.id === currentPet?.id && (
                  <Check style={{ color: '#a855f7', width: 20, height: 20 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default PetSelector;
