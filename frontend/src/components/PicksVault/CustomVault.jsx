/**
 * CUSTOM REQUEST VAULT - Special/Bespoke Requests
 * =================================================
 * For anything not in catalog
 * "I want X but different" / "Can you source Y?"
 */

import React, { useState, useCallback } from 'react';
import { Check, X, Sparkles, Upload, DollarSign, Clock } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './CustomVault.css';

// Use centralized haptic utility for iOS + Android support
const haptic = {
  light: () => hapticFeedback.buttonTap(),
  success: () => hapticFeedback.success()
};

const CustomVault = ({
  pet = {},
  pillar = 'general',
  initialRequest = '',
  onSendToConcierge,
  onClose
}) => {
  const [description, setDescription] = useState(initialRequest);
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'custom',
          description,
          requirements,
          budget,
          timeline,
          reference_image: referenceImage,
          pet,
          pillar
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send custom request:', error);
    } finally {
      setIsSending(false);
    }
  }, [description, requirements, budget, timeline, referenceImage, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="cv-container" data-testid="custom-vault-confirmation">
        <div className="cv-confirmation">
          <div className="cv-confirmation-icon">
            <Check size={48} />
          </div>
          <h2>Custom Request Sent</h2>
          <p>Your Pet Concierge® will review and get back to you shortly</p>
          <div className="cv-confirmation-actions">
            <button className="cv-btn cv-btn-primary" onClick={handleClose}>
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-container" data-testid="custom-vault">
      {/* Header */}
      <div className="cv-header">
        <div className="cv-header-left">
          <div className="cv-icon-badge">
            <Sparkles size={24} />
          </div>
          <div className="cv-header-text">
            <h2>Custom Request</h2>
            <p>For {pet?.name || 'Your Pet'}</p>
          </div>
        </div>
        <button className="cv-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="cv-content">
        {/* MIRA'S SUGGESTIONS - When present, show as selectable cards */}
        {miraSuggestions.length > 0 && (
          <div className="cv-mira-suggestions" data-testid="mira-suggestions-section">
            <div className="cv-section-header">
              <Sparkles size={18} className="text-pink-500" />
              <span>Mira's Picks for {pet?.name || 'Your Pet'}</span>
            </div>
            <p className="cv-section-desc">Tap to select what you want included</p>
            
            <div className="cv-suggestions-grid">
              {miraSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className={`cv-suggestion-card ${selectedSuggestions.has(suggestion.id) ? 'selected' : ''}`}
                  onClick={() => toggleSuggestion(suggestion.id)}
                  data-testid={`suggestion-${suggestion.id}`}
                >
                  <div className="cv-suggestion-icon">
                    {selectedSuggestions.has(suggestion.id) ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <span className="cv-emoji">{suggestion.title?.match(/^[\p{Emoji}]/u)?.[0] || '✨'}</span>
                    )}
                  </div>
                  <div className="cv-suggestion-content">
                    <h4>{suggestion.title?.replace(/^[\p{Emoji}]\s*/u, '') || 'Suggestion'}</h4>
                    {suggestion.subtitle && suggestion.subtitle !== 'Price on request' && (
                      <span className="cv-suggestion-price">{suggestion.subtitle}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cv-selection-summary">
              {selectedSuggestions.size > 0 ? (
                <span>{selectedSuggestions.size} item{selectedSuggestions.size > 1 ? 's' : ''} selected</span>
              ) : (
                <span className="cv-hint">Select items or send all to Concierge</span>
              )}
            </div>
          </div>
        )}

        {/* Only show manual form fields if NO Mira suggestions */}
        {miraSuggestions.length === 0 && (
          <>
            <div className="cv-field">
              <label>What are you looking for?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want in detail..."
                rows={4}
                data-testid="custom-description"
              />
            </div>

            <div className="cv-field">
              <label>Specific Requirements</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Size, color, material, ingredients to avoid..."
                rows={3}
                data-testid="custom-requirements"
              />
            </div>
          </>
        )}

        <div className="cv-field-row">
          <div className="cv-field">
            <label>
              <DollarSign size={14} />
              Budget Range
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              data-testid="custom-budget"
            >
              <option value="">Select budget</option>
              <option value="under_500">Under ₹500</option>
              <option value="500_1000">₹500 - ₹1,000</option>
              <option value="1000_2500">₹1,000 - ₹2,500</option>
              <option value="2500_5000">₹2,500 - ₹5,000</option>
              <option value="above_5000">Above ₹5,000</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div className="cv-field">
            <label>
              <Clock size={14} />
              Timeline
            </label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              data-testid="custom-timeline"
            >
              <option value="">Select timeline</option>
              <option value="urgent">Urgent (1-3 days)</option>
              <option value="week">Within a week</option>
              <option value="two_weeks">Within 2 weeks</option>
              <option value="month">Within a month</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Reference Image Upload */}
        <div className="cv-upload-section">
          <label>Reference Image (optional)</label>
          <div className="cv-upload-area">
            {referenceImage ? (
              <div className="cv-preview">
                <img src={referenceImage} alt="Reference" />
                <button onClick={() => setReferenceImage(null)}>Remove</button>
              </div>
            ) : (
              <label className="cv-upload-btn">
                <Upload size={24} />
                <span>Upload reference image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="cv-footer">
        <div className="cv-footer-message">
          <span className="cv-concierge-icon">C°</span>
          <div className="cv-footer-text">
            <span className="cv-footer-title">We love special requests</span>
            <span className="cv-footer-subtitle">
              Your Concierge® will find exactly what {pet?.name || 'your pet'} needs.
            </span>
          </div>
        </div>

        <button
          className="cv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending || !description}
          data-testid="custom-send"
        >
          {isSending ? 'Sending...' : 'Send to Concierge®'}
        </button>
      </div>
    </div>
  );
};

export default CustomVault;
