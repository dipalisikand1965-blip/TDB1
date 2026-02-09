/**
 * HealthVaultWizard - Pet Health Information Wizard
 * ================================================
 * Guides users to complete their pet's health profile
 * Shows missing fields with priority levels
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { Shield, X, ChevronRight } from 'lucide-react';

/**
 * Get icon for a health field
 */
const getFieldIcon = (fieldName) => {
  const icons = {
    birthday: '🎂',
    gotcha_day: '💜',
    last_vet_visit: '🏥',
    vaccinations: '💉',
    allergies: '⚠️',
    weight: '⚖️',
  };
  return icons[fieldName] || '📋';
};

/**
 * Get priority label
 */
const getPriorityLabel = (priority) => {
  if (priority === 'high') return 'Required';
  if (priority === 'medium') return 'Recommended';
  return 'Optional';
};

/**
 * HealthVaultWizard Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether wizard is visible
 * @param {Function} props.onClose - Called when wizard is closed
 * @param {Object} props.pet - Pet object { name }
 * @param {number} props.completeness - Completion percentage (0-100)
 * @param {Array} props.missingFields - List of { field, label, priority }
 * @param {Function} props.onFieldClick - Called when a field is clicked
 */
const HealthVaultWizard = ({ 
  isOpen,
  onClose,
  pet = { name: 'your pet' },
  completeness = 0,
  missingFields = [],
  onFieldClick
}) => {
  if (!isOpen) return null;
  
  const handleOverlayClick = () => {
    onClose();
  };
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  const handleFieldClick = (field) => {
    onClose();
    if (onFieldClick) {
      onFieldClick(field);
    }
  };
  
  return (
    <div 
      className="mp-modal-overlay" 
      onClick={handleOverlayClick}
      data-testid="health-vault-wizard"
    >
      <div className="health-vault-modal" onClick={handleModalClick}>
        {/* Header */}
        <div className="vault-modal-header">
          <div className="vault-modal-icon">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2>{pet.name}'s Health Vault</h2>
            <p>{completeness}% complete</p>
          </div>
          <button onClick={onClose} className="vault-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="vault-modal-progress">
          <div 
            className="vault-modal-progress-bar" 
            style={{ width: `${completeness}%` }} 
          />
        </div>
        
        {/* Missing Fields */}
        <div className="vault-fields">
          <p className="vault-fields-intro">
            Help Mira care for {pet.name} better! Complete these fields to unlock proactive health reminders.
          </p>
          
          {missingFields.map((field) => (
            <button 
              key={field.field}
              className={`vault-field-item ${
                field.priority === 'high' ? 'priority-high' : 
                field.priority === 'medium' ? 'priority-medium' : 
                'priority-low'
              }`}
              onClick={() => handleFieldClick(field)}
              data-testid={`health-field-${field.field}`}
            >
              <span className="field-icon">
                {getFieldIcon(field.field)}
              </span>
              <span className="field-label">{field.label}</span>
              <span className="field-priority">
                {getPriorityLabel(field.priority)}
              </span>
              <ChevronRight className="field-arrow" />
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="vault-modal-footer">
          <button 
            className="vault-skip-btn"
            onClick={onClose}
            data-testid="health-vault-skip"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthVaultWizard;
