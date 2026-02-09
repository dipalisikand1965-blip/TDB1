/**
 * ADOPTION VAULT - Finding a New Friend
 * =======================================
 * Adoption, Foster, Rescue
 * New pet journey
 */

import React, { useState, useCallback } from 'react';
import { Check, X, Heart, Home, Users, Baby } from 'lucide-react';
import './AdoptionVault.css';

const haptic = {
  light: () => navigator.vibrate && navigator.vibrate(10),
  success: () => navigator.vibrate && navigator.vibrate([10, 50, 10])
};

const PET_TYPES = ['Dog', 'Cat', 'Both/Either'];
const AGE_PREFERENCES = ['Puppy/Kitten', 'Young Adult', 'Adult', 'Senior', 'Any Age'];
const EXPERIENCE_LEVELS = ['First-time pet parent', 'Some experience', 'Experienced pet parent'];

const AdoptionVault = ({
  pet = {}, // Existing pet if any
  pillar = 'adopt',
  onSendToConcierge,
  onClose
}) => {
  const [petType, setPetType] = useState('');
  const [breedPreference, setBreedPreference] = useState('');
  const [agePreference, setAgePreference] = useState('');
  const [livingSpace, setLivingSpace] = useState('');
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [experience, setExperience] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'adoption',
          pet_type: petType,
          breed_preference: breedPreference,
          age_preference: agePreference,
          living_space: livingSpace,
          has_other_pets: hasOtherPets,
          has_children: hasChildren,
          experience_level: experience,
          additional_info: additionalInfo,
          existing_pet: pet,
          pillar
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send adoption request:', error);
    } finally {
      setIsSending(false);
    }
  }, [petType, breedPreference, agePreference, livingSpace, hasOtherPets, hasChildren, experience, additionalInfo, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="av-container" data-testid="adoption-vault-confirmation">
        <div className="av-confirmation">
          <div className="av-confirmation-icon">
            <Heart size={48} />
          </div>
          <h2>Your Journey Begins!</h2>
          <p>Your Pet Concierge® will help find your perfect match</p>
          <div className="av-confirmation-paw">🐾</div>
          <div className="av-confirmation-actions">
            <button className="av-btn av-btn-primary" onClick={handleClose}>
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="av-container" data-testid="adoption-vault">
      {/* Header */}
      <div className="av-header">
        <div className="av-header-left">
          <div className="av-icon-badge">
            <span>🐾</span>
          </div>
          <div className="av-header-text">
            <h2>Find Your New Friend</h2>
            <p>Let us help you find the perfect match</p>
          </div>
        </div>
        <button className="av-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="av-content">
        {/* Pet Type */}
        <div className="av-field">
          <label>What type of pet are you looking for?</label>
          <div className="av-options">
            {PET_TYPES.map(type => (
              <button
                key={type}
                className={`av-option ${petType === type ? 'av-selected' : ''}`}
                onClick={() => setPetType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Breed Preference */}
        <div className="av-field">
          <label>Breed preference (if any)</label>
          <input
            type="text"
            value={breedPreference}
            onChange={(e) => setBreedPreference(e.target.value)}
            placeholder="e.g., Labrador, Mixed breed, No preference"
            data-testid="adoption-breed"
          />
        </div>

        {/* Age Preference */}
        <div className="av-field">
          <label>Age preference</label>
          <div className="av-options av-options-wrap">
            {AGE_PREFERENCES.map(age => (
              <button
                key={age}
                className={`av-option ${agePreference === age ? 'av-selected' : ''}`}
                onClick={() => setAgePreference(age)}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Living Situation */}
        <div className="av-field">
          <label>
            <Home size={16} />
            Your living space
          </label>
          <select
            value={livingSpace}
            onChange={(e) => setLivingSpace(e.target.value)}
            data-testid="adoption-living"
          >
            <option value="">Select...</option>
            <option value="apartment_small">Small Apartment</option>
            <option value="apartment_large">Large Apartment</option>
            <option value="house_small_yard">House with small yard</option>
            <option value="house_large_yard">House with large yard</option>
            <option value="farm">Farm/Rural property</option>
          </select>
        </div>

        {/* Household */}
        <div className="av-toggles">
          <button
            className={`av-toggle ${hasOtherPets ? 'av-active' : ''}`}
            onClick={() => setHasOtherPets(!hasOtherPets)}
          >
            <div className={`av-checkbox ${hasOtherPets ? 'av-checked' : ''}`}>
              {hasOtherPets && <Check size={14} />}
            </div>
            <Users size={16} />
            <span>I have other pets</span>
          </button>

          <button
            className={`av-toggle ${hasChildren ? 'av-active' : ''}`}
            onClick={() => setHasChildren(!hasChildren)}
          >
            <div className={`av-checkbox ${hasChildren ? 'av-checked' : ''}`}>
              {hasChildren && <Check size={14} />}
            </div>
            <Baby size={16} />
            <span>I have children</span>
          </button>
        </div>

        {/* Experience */}
        <div className="av-field">
          <label>Your experience level</label>
          <div className="av-options av-options-wrap">
            {EXPERIENCE_LEVELS.map(exp => (
              <button
                key={exp}
                className={`av-option ${experience === exp ? 'av-selected' : ''}`}
                onClick={() => setExperience(exp)}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="av-field">
          <label>Anything else we should know?</label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Work schedule, activity level, special requirements..."
            rows={3}
            data-testid="adoption-info"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="av-footer">
        <div className="av-footer-message">
          <span className="av-concierge-icon">C°</span>
          <div className="av-footer-text">
            <span className="av-footer-title">Your Concierge® will find the perfect match</span>
            <span className="av-footer-subtitle">
              We partner with trusted rescues and shelters.
            </span>
          </div>
        </div>

        <button
          className="av-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending || !petType}
          data-testid="adoption-send"
        >
          {isSending ? 'Sending...' : 'Send to Concierge®'}
        </button>
      </div>
    </div>
  );
};

export default AdoptionVault;
