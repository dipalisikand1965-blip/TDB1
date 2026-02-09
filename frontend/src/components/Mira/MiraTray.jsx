/**
 * MiraTray - Picks Preview Tray Component
 * ========================================
 * Shows a mini preview of Mira's curated picks
 * Opens the full Vault when user wants to see more
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { X, ChevronRight } from 'lucide-react';

/**
 * MiraTray Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether tray is visible
 * @param {Function} props.onClose - Called when tray is closed
 * @param {Object} props.pet - Current pet object
 * @param {Object} props.miraPicks - Picks data { products, services, context }
 * @param {Function} props.onOpenVault - Called when user wants to open full vault
 */
const MiraTray = ({ 
  isOpen, 
  onClose, 
  pet, 
  miraPicks,
  onOpenVault 
}) => {
  if (!isOpen) return null;
  
  const handleOverlayClick = () => {
    onClose();
  };
  
  const handleTrayClick = (e) => {
    e.stopPropagation();
  };
  
  const handleOpenVault = () => {
    onClose();
    onOpenVault({
      products: miraPicks.products,
      services: miraPicks.services
    }, miraPicks.context || '');
  };
  
  return (
    <div className="mp-tray-overlay" onClick={handleOverlayClick}>
      <div className="mp-tray mp-tray-mini" onClick={handleTrayClick}>
        {/* Tray Header */}
        <div className="mp-tray-header">
          <div className="mp-tray-handle" />
          <div className="mp-tray-title">
            <img 
              src={pet.photo || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100`} 
              alt={pet.name}
              className="mp-tray-pet-photo"
            />
            <div>
              <h3>{miraPicks.context || `Picks for ${pet.name}`}</h3>
              <p>{miraPicks.products?.length || 0} items curated by Mira</p>
            </div>
          </div>
          <button className="mp-tray-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {/* Quick Preview + Open Vault Button */}
        <div className="mp-tray-content mp-tray-mini-content">
          <div className="mp-tray-preview">
            {miraPicks.products?.slice(0, 3).map((product, idx) => (
              <div key={idx} className="mp-tray-preview-item">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="mp-tray-preview-placeholder">🎁</div>
                )}
              </div>
            ))}
            {miraPicks.products?.length > 3 && (
              <div className="mp-tray-preview-more">
                +{miraPicks.products.length - 3}
              </div>
            )}
          </div>
          
          <button 
            className="mp-tray-open-vault"
            onClick={handleOpenVault}
            data-testid="open-vault-btn"
          >
            <span>View & Select Picks</span>
            <ChevronRight size={20} />
          </button>
          
          <p className="mp-tray-concierge-note">
            <span className="mp-concierge-icon">C°</span>
            Your Concierge® will help finalize your selections
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraTray;
