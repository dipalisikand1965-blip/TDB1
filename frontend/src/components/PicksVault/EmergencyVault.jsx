/**
 * EMERGENCY VAULT - Urgent Help
 * ==============================
 * Vet Emergency, Poisoning, Injury, Lost Pet
 * URGENT FLAG - Immediate notification
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Check, X, Phone, AlertTriangle, MapPin, Clock,
  Ambulance, Heart, Search
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './EmergencyVault.css';

// Use centralized haptic utility - urgent pattern for emergencies
const haptic = {
  urgent: () => hapticFeedback.error() // Strong feedback for emergencies
};

const EMERGENCY_TYPES = {
  poisoning: { icon: AlertTriangle, label: 'Poisoning/Ingestion', color: '#dc2626' },
  injury: { icon: Ambulance, label: 'Injury/Accident', color: '#ea580c' },
  breathing: { icon: Heart, label: 'Breathing Difficulty', color: '#dc2626' },
  lost_pet: { icon: Search, label: 'Lost Pet', color: '#7c3aed' },
  seizure: { icon: AlertTriangle, label: 'Seizure', color: '#dc2626' },
  other: { icon: AlertTriangle, label: 'Other Emergency', color: '#ef4444' }
};

const EmergencyVault = ({
  emergencyType = 'other',
  pet = {},
  pillar = 'emergency',
  onSendToConcierge,
  onCallVet,
  onClose
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [location, setLocation] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const emergency = EMERGENCY_TYPES[emergencyType] || EMERGENCY_TYPES.other;
  const IconComponent = emergency.icon;

  // Haptic on mount for urgency
  useEffect(() => {
    haptic.urgent();
  }, []);

  const handleCallVet = useCallback(() => {
    haptic.urgent();
    if (onCallVet) {
      onCallVet();
    } else {
      // Default emergency vet number
      window.location.href = 'tel:+919876543210';
    }
  }, [onCallVet]);

  const handleSendToConcierge = useCallback(async () => {
    haptic.urgent();
    setIsSending(true);
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'emergency',
          emergency_type: emergencyType,
          symptoms,
          action_taken: actionTaken,
          location,
          pet,
          pillar,
          is_urgent: true
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send emergency:', error);
    } finally {
      setIsSending(false);
    }
  }, [emergencyType, symptoms, actionTaken, location, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="ev-container ev-urgent" data-testid="emergency-vault-confirmation">
        <div className="ev-confirmation">
          <div className="ev-confirmation-icon">
            <Check size={48} />
          </div>
          <h2>Help is Coming</h2>
          <p>Your Pet Concierge® has been alerted and will contact you immediately</p>
          <div className="ev-confirmation-tips">
            <h3>While you wait:</h3>
            <ul>
              <li>Stay calm - {pet?.name || 'your pet'} can sense your stress</li>
              <li>Keep {pet?.name || 'your pet'} warm and comfortable</li>
              <li>Don't give any medication unless advised</li>
            </ul>
          </div>
          <div className="ev-confirmation-actions">
            <button className="ev-btn ev-btn-call" onClick={handleCallVet}>
              <Phone size={20} />
              Call Emergency Vet
            </button>
            <button className="ev-btn ev-btn-secondary" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-container ev-urgent" data-testid="emergency-vault">
      {/* Header */}
      <div className="ev-header">
        <div className="ev-header-left">
          <div className="ev-icon-badge" style={{ background: emergency.color }}>
            <IconComponent size={24} />
          </div>
          <div className="ev-header-text">
            <h2>🚨 Emergency Help</h2>
            <p>{emergency.label} - {pet?.name || 'Your Pet'}</p>
          </div>
        </div>
        <button className="ev-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Urgent Call Button */}
      <div className="ev-call-section">
        <button className="ev-call-btn" onClick={handleCallVet} data-testid="emergency-call">
          <Phone size={24} />
          <span>Call Emergency Vet NOW</span>
        </button>
      </div>

      {/* Content */}
      <div className="ev-content">
        <div className="ev-field">
          <label>
            <AlertTriangle size={16} />
            What symptoms are you seeing?
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe what's happening..."
            data-testid="emergency-symptoms"
          />
        </div>

        <div className="ev-field">
          <label>
            <Clock size={16} />
            What have you done so far?
          </label>
          <textarea
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Any first aid or actions taken..."
            data-testid="emergency-action"
          />
        </div>

        <div className="ev-field">
          <label>
            <MapPin size={16} />
            Your current location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or landmark"
            data-testid="emergency-location"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="ev-footer">
        <button
          className="ev-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="emergency-send"
        >
          {isSending ? 'Alerting Concierge®...' : 'Alert Concierge® NOW'}
        </button>
        <p className="ev-footer-note">
          Your Concierge® will contact you immediately
        </p>
      </div>
    </div>
  );
};

export default EmergencyVault;
