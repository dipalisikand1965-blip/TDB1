/**
 * PICK DETAIL VIEW - Product Detail Modal
 * =========================================
 * Luxury haptic detail view for mobile/iOS
 * Tap product image → Full screen details
 */

import React, { useCallback } from 'react';
import { ArrowLeft, Heart, Check, MessageCircle } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './PickDetail.css';

// Use centralized haptic utility for iOS + Android support
const haptic = {
  light: () => hapticFeedback.buttonTap(),
  selection: () => hapticFeedback.productSelect()
};

const PickDetail = ({
  product,
  pet,
  isSelected = false,
  onBack,
  onSelect,
  onAskMira
}) => {
  const handleBack = useCallback(() => {
    haptic.light();
    if (onBack) onBack();
  }, [onBack]);

  const handleSelect = useCallback(() => {
    haptic.selection();
    if (onSelect) onSelect(product);
  }, [onSelect, product]);

  const handleAskMira = useCallback(() => {
    haptic.light();
    if (onAskMira) onAskMira(product);
  }, [onAskMira, product]);

  if (!product) return null;

  return (
    <div className="pd-container" data-testid="pick-detail">
      {/* Header */}
      <div className="pd-header">
        <button 
          className="pd-back-btn"
          onClick={handleBack}
          aria-label="Go back"
          data-testid="pick-detail-back"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          className="pd-save-btn"
          aria-label="Save for later"
        >
          <Heart size={22} />
        </button>
      </div>

      {/* Product Image */}
      <div className="pd-image-section">
        {product.image_url || product.image ? (
          <img 
            src={product.image_url || product.image} 
            alt={product.name}
            className="pd-image"
          />
        ) : (
          <div className="pd-image-placeholder">
            <span>🎁</span>
          </div>
        )}
        {isSelected && (
          <div className="pd-selected-badge">
            <Check size={20} />
            <span>Selected</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pd-content">
        <h1 className="pd-name">{product.name}</h1>
        <div className="pd-price">
          {product.price ? `₹${product.price}` : 'Get Quote'}
        </div>

        {/* Why for Pet */}
        {product.why_for_pet && (
          <div className="pd-why-section">
            <h3>Perfect for {pet?.name || 'Your Pet'} because:</h3>
            <p>{product.why_for_pet}</p>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="pd-description">
            <h3>About this product</h3>
            <p>{product.description}</p>
          </div>
        )}

        {/* What's Inside (for boxes/hampers) */}
        {product.contents && product.contents.length > 0 && (
          <div className="pd-contents">
            <h3>What's inside:</h3>
            <ul>
              {product.contents.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Product Details */}
        <div className="pd-details">
          {product.category && (
            <div className="pd-detail-item">
              <span className="pd-detail-label">Category</span>
              <span className="pd-detail-value">{product.category}</span>
            </div>
          )}
          {product.brand && (
            <div className="pd-detail-item">
              <span className="pd-detail-label">Brand</span>
              <span className="pd-detail-value">{product.brand}</span>
            </div>
          )}
          {product.weight && (
            <div className="pd-detail-item">
              <span className="pd-detail-label">Weight</span>
              <span className="pd-detail-value">{product.weight}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pd-actions">
        <button
          className={`pd-action-btn pd-select-btn ${isSelected ? 'pd-selected' : ''}`}
          onClick={handleSelect}
          data-testid="pick-detail-select"
        >
          {isSelected ? (
            <>
              <Check size={20} />
              <span>Selected</span>
            </>
          ) : (
            <>
              <Check size={20} />
              <span>Pick This</span>
            </>
          )}
        </button>
        
        <button
          className="pd-action-btn pd-ask-btn"
          onClick={handleAskMira}
          data-testid="pick-detail-ask"
        >
          <MessageCircle size={20} />
          <span>Ask Mira</span>
        </button>
      </div>
    </div>
  );
};

export default PickDetail;
