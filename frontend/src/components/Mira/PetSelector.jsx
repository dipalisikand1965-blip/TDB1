/**
 * PetSelector - Pet Selection Dropdown
 * ====================================
 * Dropdown for switching between pets
 * Shows pet avatar, name, breed, and soul score
 * Soul score is clickable - links to pet profile
 * 
 * NEW: Includes Intelligence Indicator showing Mira's learned memories
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Check, ExternalLink, Brain, Sparkles } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

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
  
  // Simple pet selection - just switch pet, nothing else
  const handleSelectPet = (pet) => {
    hapticFeedback.buttonTap();
    if (onSelectPet) onSelectPet(pet);
  };
  
  // Calculate intelligence score
  const intelligenceScore = intelligenceData?.stats?.total || 0;
  const hasLearnings = intelligenceScore > 0;
  
  return (
    <>
      {/* Pet Badge Button with Intelligence Indicator */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Intelligence Indicator - Shows when Mira has learned things */}
        {hasLearnings && (
          <div
            onMouseEnter={() => setShowIntelligenceTooltip(true)}
            onMouseLeave={() => setShowIntelligenceTooltip(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(244,114,182,0.2))',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              hapticFeedback.buttonTap();
              navigate(`/my-pets?pet=${currentPet.id}&tab=intelligence`);
            }}
            data-testid="intelligence-indicator"
          >
            <Brain size={12} style={{ color: '#a855f7' }} />
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {intelligenceScore}
              <Sparkles size={8} style={{ color: '#fbbf24' }} />
            </span>
          </div>
        )}
        
        {/* Intelligence Tooltip */}
        {showIntelligenceTooltip && intelligenceData && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            padding: '12px',
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            minWidth: '200px',
            zIndex: 1000
          }}>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: 'white',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Brain size={14} style={{ color: '#a855f7' }} />
              {currentPet.name}'s Mind
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              Mira has learned {intelligenceScore} things about {currentPet.name}
            </div>
            {intelligenceData.recent_learnings?.slice(0, 3).map((l, i) => (
              <div key={i} style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                • {l.value}
              </div>
            ))}
            <div style={{ 
              fontSize: '9px', 
              color: '#a855f7', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Click to view full profile
            </div>
          </div>
        )}
        
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
          <span 
            className="mp-pet-name"
            onClick={handlePetNameClick}
            style={{ cursor: 'pointer' }}
            title={`View ${currentPet.name}'s profile`}
          >
            {currentPet.name}
          </span>
        </button>
      </div>
      
      {/* Pet Dropdown */}
      {isOpen && (
        <div className="mp-pet-dropdown" data-testid="pet-dropdown">
          {allPets.map((p) => {
            const soulScore = Number(p.soulScore) || 0;
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
