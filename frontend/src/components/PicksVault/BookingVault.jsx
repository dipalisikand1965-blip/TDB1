/**
 * BOOKING VAULT - Service Appointments
 * =====================================
 * Grooming, Vet, Training, Boarding, Walking, etc.
 * Same plumbing: Notification → Ticket → Inbox
 */

import React, { useState, useCallback } from 'react';
import { 
  Check, X, Calendar, Clock, MapPin, 
  Scissors, Stethoscope, GraduationCap, Home, Dog, Camera
} from 'lucide-react';
import './BookingVault.css';

const haptic = {
  light: () => navigator.vibrate && navigator.vibrate(10),
  success: () => navigator.vibrate && navigator.vibrate([10, 50, 10])
};

const SERVICE_ICONS = {
  grooming: Scissors,
  vet: Stethoscope,
  training: GraduationCap,
  boarding: Home,
  daycare: Home,
  walking: Dog,
  sitting: Home,
  photoshoot: Camera
};

const SERVICE_COLORS = {
  grooming: '#ec4899',
  vet: '#ef4444',
  training: '#8b5cf6',
  boarding: '#6366f1',
  daycare: '#14b8a6',
  walking: '#22c55e',
  sitting: '#f97316',
  photoshoot: '#3b82f6'
};

const BookingVault = ({
  serviceType = 'grooming',
  pet = {},
  pillar = 'care',
  suggestedProviders = [],
  onSendToConcierge,
  onClose
}) => {
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [location, setLocation] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const IconComponent = SERVICE_ICONS[serviceType] || Scissors;
  const serviceColor = SERVICE_COLORS[serviceType] || '#a855f7';

  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'booking',
          service_type: serviceType,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          location: location || 'Flexible',
          special_requirements: specialRequirements,
          suggested_providers: suggestedProviders,
          pet,
          pillar
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send booking:', error);
    } finally {
      setIsSending(false);
    }
  }, [serviceType, preferredDate, preferredTime, location, specialRequirements, suggestedProviders, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="bv-container" data-testid="booking-vault-confirmation">
        <div className="bv-confirmation">
          <div className="bv-confirmation-icon" style={{ background: serviceColor }}>
            <Check size={48} />
          </div>
          <h2>Booking Request Sent</h2>
          <p>Your Pet Concierge® will confirm your {serviceType} appointment shortly</p>
          <div className="bv-confirmation-actions">
            <button className="bv-btn bv-btn-primary" onClick={handleClose}>
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bv-container" data-testid="booking-vault">
      {/* Header */}
      <div className="bv-header">
        <div className="bv-header-left">
          <div className="bv-icon-badge" style={{ background: serviceColor }}>
            <IconComponent size={24} />
          </div>
          <div className="bv-header-text">
            <h2>Book {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</h2>
            <p>For {pet?.name || 'Your Pet'}</p>
          </div>
        </div>
        <button className="bv-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="bv-content">
        {/* Date Selection */}
        <div className="bv-field">
          <label>
            <Calendar size={16} />
            Preferred Date
          </label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            data-testid="booking-date"
          />
        </div>

        {/* Time Selection */}
        <div className="bv-field">
          <label>
            <Clock size={16} />
            Preferred Time
          </label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            data-testid="booking-time"
          >
            <option value="">Select time</option>
            <option value="morning">Morning (9 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
            <option value="evening">Evening (4 PM - 7 PM)</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        {/* Location */}
        <div className="bv-field">
          <label>
            <MapPin size={16} />
            Location Preference
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Near Koramangala or Home visit"
            data-testid="booking-location"
          />
        </div>

        {/* Special Requirements */}
        <div className="bv-field">
          <label>Special Requirements</label>
          <textarea
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            placeholder={`Any special needs for ${pet?.name || 'your pet'}? (allergies, behavior notes, preferences...)`}
            maxLength={500}
            data-testid="booking-requirements"
          />
        </div>

        {/* Suggested Providers */}
        {suggestedProviders.length > 0 && (
          <div className="bv-providers">
            <label>Suggested Providers</label>
            {suggestedProviders.map((provider, idx) => (
              <div key={idx} className="bv-provider-item">
                <span className="bv-provider-name">{provider.name}</span>
                {provider.rating && <span className="bv-provider-rating">⭐ {provider.rating}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bv-footer">
        <div className="bv-footer-message">
          <span className="bv-concierge-icon">C°</span>
          <div className="bv-footer-text">
            <span className="bv-footer-title">Your Concierge® will handle everything</span>
            <span className="bv-footer-subtitle">
              We'll find the best {serviceType} provider for {pet?.name || 'your pet'}.
            </span>
          </div>
        </div>

        <button
          className="bv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="booking-send"
        >
          {isSending ? 'Sending...' : 'Send to Concierge®'}
        </button>
      </div>
    </div>
  );
};

export default BookingVault;
