/**
 * PetSelector - Pet Selection Dropdown
 * ====================================
 * Dropdown for switching between pets
 * Shows pet avatar, name, breed, and soul score
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { PawPrint, Check } from 'lucide-react';

/**
 * PetSelector Component
 * 
 * @param {Object} props
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
    if (onToggle) onToggle();
  };
  
  const handleSelectPet = (pet) => {
    if (onSelectPet) onSelectPet(pet);
  };
  
  return (
    <>
      {/* Pet Badge Button */}
      <button 
        className="mp-pet-badge"
        onClick={handleToggle}
        data-testid="pet-selector-btn"
      >
        <div className="mp-pet-avatar">
          {currentPet.photo ? (
            <img src={currentPet.photo} alt={currentPet.name} />
          ) : (
            <PawPrint />
          )}
        </div>
        <span className="mp-pet-name">{currentPet.name}</span>
      </button>
      
      {/* Pet Dropdown */}
      {isOpen && (
        <div className="mp-pet-dropdown" data-testid="pet-dropdown">
          {allPets.map((p) => (
            <button 
              key={p.id} 
              onClick={() => handleSelectPet(p)} 
              className={`mp-pet-option ${p.id === currentPet.id ? 'active' : ''}`}
              data-testid={`pet-option-${p.id}`}
            >
              <div className="mp-pet-avatar">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} />
                ) : (
                  <PawPrint />
                )}
              </div>
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
                  {p.soulScore > 10 ? (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      padding: '2px 6px', 
                      borderRadius: '8px', 
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'white'
                    }}>
                      {p.soulScore}%
                    </span>
                  ) : (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                      padding: '2px 6px', 
                      borderRadius: '8px', 
                      fontSize: '9px',
                      fontWeight: '600',
                      color: 'white',
                      animation: 'pulse 2s infinite'
                    }}>
                      ✨ New
                    </span>
                  )}
                </span>
              </div>
              {p.id === currentPet.id && (
                <Check style={{ color: '#a855f7' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default PetSelector;
