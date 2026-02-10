/**
 * PICKS VAULT - Luxury Haptic Experience
 * ========================================
 * "Mira is the Brain, Concierge® is the Hands"
 * 
 * This component enables seamless product selection:
 * - Tap to select/deselect (haptic feedback)
 * - Tap image to view details
 * - Send picks to Concierge® (always available)
 * - Refresh for different options
 */

import React, { useState, useCallback } from 'react';
import { Check, X, RefreshCw, ChevronRight, Heart, Info } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './PicksVault.css';

// Use centralized haptic utility for iOS + Android support
const haptic = {
  light: () => hapticFeedback.buttonTap(),
  medium: () => hapticFeedback.toggle(),
  success: () => hapticFeedback.success(),
  selection: () => hapticFeedback.productSelect()
};

const PicksVault = ({
  picks: initialPicks = [],
  pet = {},
  pillar = 'general',
  context = '',
  onSendToConcierge,
  onRefresh,
  onClose,
  onViewDetails,
  maxPicks = 4,
  maxRefreshes = 3
}) => {
  const [displayedPicks, setDisplayedPicks] = useState(initialPicks);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [refreshCount, setRefreshCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sentItems, setSentItems] = useState(new Set()); // Track sent items

  // Update displayed picks when initial picks change
  React.useEffect(() => {
    setDisplayedPicks(initialPicks);
    setSelectedItems(new Set());
    setSentItems(new Set());
  }, [initialPicks]);

  // Toggle item selection with haptic
  const toggleSelect = useCallback((itemId) => {
    haptic.selection();
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // View product details with haptic
  const handleViewDetails = useCallback((product) => {
    haptic.light();
    if (onViewDetails) {
      onViewDetails(product);
    }
  }, [onViewDetails]);

  // Refresh picks with haptic
  const handleRefresh = useCallback(() => {
    if (refreshCount >= maxRefreshes) return;
    haptic.medium();
    setRefreshCount(prev => prev + 1);
    if (onRefresh) {
      onRefresh(picks.map(p => p.id)); // Pass current picks to exclude
    }
  }, [refreshCount, maxRefreshes, onRefresh, picks]);

  // Send to Concierge with haptic
  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    const pickedItems = picks.filter(p => selectedItems.has(p.id || p.name));
    const shownItems = picks;
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          picked_items: pickedItems,
          shown_items: shownItems,
          pet,
          pillar,
          context,
          user_action: pickedItems.length > 0 ? 'sent_with_picks' : 'sent_without_picks'
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send to Concierge:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedItems, picks, pet, pillar, context, onSendToConcierge]);

  // Close with haptic
  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  // Confirmation view
  if (showConfirmation) {
    return (
      <div className="pv-container" data-testid="picks-vault-confirmation">
        <div className="pv-confirmation">
          <div className="pv-confirmation-icon">
            <Check size={48} />
          </div>
          <h2>Picks Sent</h2>
          <p>Your Pet Concierge® will get back to you shortly</p>
          <div className="pv-confirmation-summary">
            {selectedItems.size > 0 ? (
              <span>{selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected</span>
            ) : (
              <span>Request sent for review</span>
            )}
          </div>
          <div className="pv-confirmation-actions">
            <button 
              className="pv-btn pv-btn-primary"
              onClick={handleClose}
              data-testid="picks-vault-continue"
            >
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-container" data-testid="picks-vault">
      {/* Header */}
      <div className="pv-header">
        <div className="pv-header-left">
          {pet.photo && (
            <img 
              src={pet.photo} 
              alt={pet.name} 
              className="pv-pet-photo"
            />
          )}
          <div className="pv-header-text">
            <h2>Picks for {pet.name || 'Your Pet'}</h2>
            <p>Curated with <Heart size={12} className="pv-heart" /> by Mira</p>
          </div>
        </div>
        <button 
          className="pv-close-btn"
          onClick={handleClose}
          aria-label="Close"
          data-testid="picks-vault-close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Picks List */}
      <div className="pv-picks-list">
        <div className="pv-section-header">
          <span className="pv-section-icon">☐</span>
          <span>PICKS FOR {(pet.name || 'YOUR PET').toUpperCase()}</span>
        </div>

        {picks.slice(0, maxPicks).map((product, idx) => {
          const itemId = product.id || product.name;
          const isSelected = selectedItems.has(itemId);
          
          return (
            <div 
              key={itemId || idx}
              className={`pv-pick-item ${isSelected ? 'pv-pick-selected' : ''}`}
              data-testid={`picks-vault-item-${idx}`}
            >
              {/* Product Image - Tap for details */}
              <div 
                className="pv-pick-image"
                onClick={() => handleViewDetails(product)}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${product.name}`}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="pv-pick-placeholder">
                    <span>🎁</span>
                  </div>
                )}
                {isSelected && (
                  <div className="pv-pick-selected-badge">
                    <Check size={16} />
                  </div>
                )}
                <div className="pv-pick-info-hint">
                  <Info size={14} />
                </div>
              </div>

              {/* Product Info */}
              <div className="pv-pick-info">
                <span className="pv-pick-name">{product.name}</span>
                <span className="pv-pick-price">
                  {product.price ? `₹${product.price}` : 'Get Quote'}
                </span>
                {product.why_for_pet && (
                  <span className="pv-pick-why">{product.why_for_pet}</span>
                )}
              </div>

              {/* Select Button */}
              <button
                className={`pv-select-btn ${isSelected ? 'pv-select-btn-active' : ''}`}
                onClick={() => toggleSelect(itemId)}
                aria-label={isSelected ? 'Deselect' : 'Select'}
                data-testid={`picks-vault-select-${idx}`}
              >
                {isSelected ? (
                  <Check size={20} />
                ) : (
                  <span className="pv-select-plus">+</span>
                )}
              </button>
            </div>
          );
        })}

        {/* Refresh Button */}
        {refreshCount < maxRefreshes && (
          <button 
            className="pv-refresh-btn"
            onClick={handleRefresh}
            data-testid="picks-vault-refresh"
          >
            <RefreshCw size={16} />
            <span>Show Different Options</span>
            <span className="pv-refresh-count">({maxRefreshes - refreshCount} left)</span>
          </button>
        )}
      </div>

      {/* Footer - Always visible */}
      <div className="pv-footer">
        <div className="pv-footer-message">
          <span className="pv-concierge-icon">C°</span>
          <div className="pv-footer-text">
            <span className="pv-footer-title">Your Concierge® is by your side</span>
            <span className="pv-footer-subtitle">
              For anything, anytime, anywhere — we're here for you and {pet.name || 'your pet'}.
            </span>
          </div>
        </div>

        <button
          className="pv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="picks-vault-send"
        >
          {isSending ? (
            <span>Sending...</span>
          ) : (
            <>
              <span className="pv-send-icon">C°</span>
              <span>Send to Concierge®</span>
              {selectedItems.size > 0 && (
                <span className="pv-send-count">({selectedItems.size})</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PicksVault;
