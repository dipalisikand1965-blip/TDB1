/**
 * PetSelector - Pet Selection Dropdown
 * ====================================
 * Dropdown for switching between pets
 * Shows pet avatar, name, breed, and soul score
 * Soul score is clickable - links to pet profile
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Check, ExternalLink } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

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
  const navigate = useNavigate();
  
  const handleToggle = () => {
    if (onToggle) onToggle();
  };
  
  const handleSelectPet = (pet) => {
    if (onSelectPet) onSelectPet(pet);
  };
  
  // Handle score click - navigate to pet profile
  const handleScoreClick = (e, petId) => {
    e.stopPropagation();
    hapticFeedback.buttonTap();
    navigate(`/my-pets?pet=${petId}`);
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
          {allPets.map((p) => {
            console.log('[PetSelector] Pet:', p.name, 'soulScore:', p.soulScore, 'type:', typeof p.soulScore, '>10:', Number(p.soulScore) > 10);
            return (
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
                  {/* Soul Score - Clickable to pet profile */}
                  {Number(p.soulScore) > 10 ? (
                    <span 
                      onClick={(e) => handleScoreClick(e, p.id)}
                      style={{ 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      title={`View ${p.name}'s profile`}
                      data-testid={`pet-score-${p.id}`}
                    >
                      {p.soulScore}%
                      <ExternalLink style={{ width: 8, height: 8, opacity: 0.7 }} />
                    </span>
                  ) : (
                    <span 
                      onClick={(e) => handleScoreClick(e, p.id)}
                      style={{ 
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                        padding: '2px 6px', 
                        borderRadius: '8px', 
                        fontSize: '9px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        animation: 'pulse 2s infinite'
                      }}
                      title={`Build ${p.name}'s soul profile`}
                    >
                      ✨ New
                    </span>
                  )}
                </span>
              </div>
              {p.id === currentPet.id && (
                <Check style={{ color: '#a855f7' }} />
              )}
            </button>
          );})}
        </div>
      )}
    </>
  );
};

export default PetSelector;
