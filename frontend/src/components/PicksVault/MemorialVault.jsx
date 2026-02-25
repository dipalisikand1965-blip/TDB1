/**
 * MEMORIAL VAULT - Grief & Farewell
 * ==================================
 * With sensitivity and care
 * Memorial, Cremation, Rainbow Bridge
 */

import React, { useState, useCallback } from 'react';
import { Check, X, Heart, Feather, Star, Camera } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './MemorialVault.css';

// Use centralized haptic utility - gentle feedback for sensitive context
const haptic = {
  gentle: () => hapticFeedback.buttonTap() // Soft tap for sensitive moments
};

const MEMORIAL_SERVICES = [
  { id: 'cremation', label: 'Cremation Services', icon: Feather },
  { id: 'memorial', label: 'Memorial/Tribute', icon: Star },
  { id: 'keepsake', label: 'Memorial Keepsake', icon: Heart },
  { id: 'photo_tribute', label: 'Photo Tribute', icon: Camera },
  { id: 'support', label: 'Grief Support', icon: Heart }
];

const MemorialVault = ({
  pet = {},
  pillar = 'farewell',
  onSendToConcierge,
  onClose
}) => {
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [specialWishes, setSpecialWishes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const toggleService = useCallback((serviceId) => {
    haptic.gentle();
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  }, []);

  const handleSendToConcierge = useCallback(async () => {
    haptic.gentle();
    setIsSending(true);
    
    const services = MEMORIAL_SERVICES.filter(s => selectedServices.has(s.id));
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'memorial',
          selected_services: services.map(s => s.id),
          special_wishes: specialWishes,
          pet,
          pillar,
          is_sensitive: true
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send memorial request:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedServices, specialWishes, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    haptic.gentle();
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="mv-container mv-gentle" data-testid="memorial-vault-confirmation">
        <div className="mv-confirmation">
          <div className="mv-confirmation-icon">
            <Heart size={48} />
          </div>
          <h2>We're Here With You</h2>
          <p>Our team will reach out with care and respect</p>
          <div className="mv-rainbow">🌈</div>
          <p className="mv-poem">
            "Until we meet again at the Rainbow Bridge"
          </p>
          <div className="mv-confirmation-actions">
            <button className="mv-btn mv-btn-primary" onClick={handleClose}>
              Thank You
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mv-container mv-gentle" data-testid="memorial-vault">
      {/* Header */}
      <div className="mv-header">
        <div className="mv-header-left">
          <div className="mv-icon-badge">
            <span>🌈</span>
          </div>
          <div className="mv-header-text">
            <h2>Remembering {pet?.name || 'Your Beloved Pet'}</h2>
            <p>We're here with you</p>
          </div>
        </div>
        <button className="mv-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="mv-content">
        <p className="mv-intro">
          We understand this is a difficult time. Let us help you honor {pet?.name || 'your beloved companion'}'s memory.
        </p>

        {/* Services */}
        <div className="mv-services">
          <label>How can we help?</label>
          {MEMORIAL_SERVICES.map(service => {
            const IconComponent = service.icon;
            const isSelected = selectedServices.has(service.id);
            
            return (
              <button
                key={service.id}
                className={`mv-service-item ${isSelected ? 'mv-selected' : ''}`}
                onClick={() => toggleService(service.id)}
                data-testid={`memorial-service-${service.id}`}
              >
                <div className={`mv-checkbox ${isSelected ? 'mv-checked' : ''}`}>
                  {isSelected && <Check size={14} />}
                </div>
                <IconComponent size={20} />
                <span>{service.label}</span>
              </button>
            );
          })}
        </div>

        {/* Special Wishes */}
        <div className="mv-field">
          <label>Special wishes or memories to share</label>
          <textarea
            value={specialWishes}
            onChange={(e) => setSpecialWishes(e.target.value)}
            placeholder={`Tell us about ${pet?.name || 'your pet'}... favorite things, special moments, how you'd like to remember them...`}
            rows={4}
            data-testid="memorial-wishes"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mv-footer">
        <div className="mv-footer-message">
          <span className="mv-concierge-icon">C°</span>
          <div className="mv-footer-text">
            <span className="mv-footer-title">Your Concierge® is here for you</span>
            <span className="mv-footer-subtitle">
              We'll handle everything with the utmost care and respect.
            </span>
          </div>
        </div>

        <button
          className="mv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="memorial-send"
        >
          {isSending ? 'Sending...' : 'Send to Concierge®'}
        </button>
      </div>
    </div>
  );
};

export default MemorialVault;
