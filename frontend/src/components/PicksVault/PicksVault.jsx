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
  const handleRefresh = useCallback(async () => {
    if (refreshCount >= maxRefreshes || isRefreshing) return;
    
    haptic.medium();
    setIsRefreshing(true);
    setRefreshCount(prev => prev + 1);
    
    if (onRefresh) {
      try {
        const newPicks = await onRefresh(displayedPicks.map(p => p.id)); // Pass current picks to exclude
        if (newPicks && newPicks.length > 0) {
          setDisplayedPicks(newPicks);
          setSelectedItems(new Set()); // Clear selections on refresh
          setSentItems(new Set()); // Clear sent status on refresh
        }
      } catch (error) {
        console.error('[PicksVault] Refresh failed:', error);
      }
    }
    setIsRefreshing(false);
  }, [refreshCount, maxRefreshes, isRefreshing, onRefresh, displayedPicks]);

  // Send to Concierge® with haptic - individual item
  const handleSendItemToConcierge = useCallback(async (item) => {
    haptic.success();
    
    // Mark this item as sent
    setSentItems(prev => new Set([...prev, item.id || item.name]));
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          picked_items: [item],
          shown_items: displayedPicks,
          pet,
          pillar,
          context,
          user_action: 'sent_single_item'
        });
      }
    } catch (error) {
      console.error('Failed to send item to Concierge®:', error);
      // Revert sent status on error
      setSentItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id || item.name);
        return newSet;
      });
    }
  }, [displayedPicks, pet, pillar, context, onSendToConcierge]);

  // Send to Concierge® with haptic - all selected items
  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    const pickedItems = displayedPicks.filter(p => selectedItems.has(p.id || p.name));
    const shownItems = displayedPicks;
    
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
      console.error('Failed to send to Concierge®:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedItems, displayedPicks, pet, pillar, context, onSendToConcierge]);

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

        {displayedPicks.slice(0, maxPicks).map((product, idx) => {
          const itemId = product.id || product.name;
          const isSelected = selectedItems.has(itemId);
          const isSent = sentItems.has(itemId);
          
          return (
            <div 
              key={itemId || idx}
              className={`pv-pick-item ${isSelected ? 'pv-pick-selected' : ''} ${isSent ? 'pv-pick-sent' : ''}`}
              data-testid={`picks-vault-item-${idx}`}
            >
              {/* Sent to Concierge® overlay */}
              {isSent && (
                <div className="pv-sent-overlay">
                  <Check size={20} className="pv-sent-icon" />
                  <span>Sent to Concierge®</span>
                </div>
              )}
              
              {/* Product Image - Tap for details */}
              <div 
                className="pv-pick-image"
                onClick={() => !isSent && handleViewDetails(product)}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${product.name}`}
              >
                {product.image_url || product.image ? (
                  <img src={product.image_url || product.image} alt={product.name} />
                ) : (
                  <div className="pv-pick-placeholder">
                    <span>🎁</span>
                  </div>
                )}
                {isSelected && !isSent && (
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
                {(product.why_for_pet || product.why_reason || product.why_it_fits || product.reason) && (
                  <span className="pv-pick-why">{product.why_for_pet || product.why_reason || product.why_it_fits || product.reason}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pv-pick-actions">
                {!isSent ? (
                  <>
                    {/* Send to Concierge® - Individual */}
                    <button
                      className="pv-send-item-btn"
                      onClick={() => handleSendItemToConcierge(product)}
                      aria-label="Send to Concierge®"
                      data-testid={`picks-vault-send-${idx}`}
                    >
                      <span className="pv-concierge-badge">C°</span>
                    </button>
                    
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
                  </>
                ) : (
                  <div className="pv-sent-badge">
                    <Check size={16} />
                    <span>Sent</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Refresh Button */}
        {refreshCount < maxRefreshes && (
          <button 
            className={`pv-refresh-btn ${isRefreshing ? 'pv-refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="picks-vault-refresh"
          >
            <RefreshCw size={16} className={isRefreshing ? 'pv-spin' : ''} />
            <span>{isRefreshing ? 'Loading...' : 'Show Different Options'}</span>
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
