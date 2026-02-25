/**
 * ServiceRequestModal - Service Booking Request Modal
 * ===================================================
 * Handles service requests for grooming, vet, training, etc.
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * ServiceRequestModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Object} props.service - Service details { label, icon, color, description }
 * @param {Object} props.formData - Form data { notes, preferredDate, urgency }
 * @param {boolean} props.isSubmitting - Whether form is submitting
 * @param {boolean} props.submitted - Whether form was submitted
 * @param {string} props.petName - Pet's name
 * @param {boolean} props.isConciergeLive - Whether concierge is available
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Function} props.onSubmit - Called when form is submitted
 * @param {Function} props.onUpdateFormData - Called when form field changes
 */
const ServiceRequestModal = ({ 
  isOpen,
  service,
  formData = {},
  isSubmitting = false,
  submitted = false,
  petName = 'your pet',
  isConciergeLive = true,
  onClose,
  onSubmit,
  onUpdateFormData
}) => {
  if (!isOpen || !service) return null;
  
  const handleOverlayClick = () => {
    onClose();
  };
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  const handleFieldChange = (field, value) => {
    if (onUpdateFormData) {
      onUpdateFormData(field, value);
    }
  };
  
  // Success state after submission
  if (submitted) {
    return (
      <div className="mp-modal-overlay" onClick={handleOverlayClick}>
        <div className="mp-service-modal" onClick={handleModalClick}>
          <div className="mp-modal-success">
            <div className="mp-success-icon">✓</div>
            <h3>Request Submitted!</h3>
            <p>Your Concierge® has been notified and will reach out shortly.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mp-modal-overlay" onClick={handleOverlayClick} data-testid="service-request-modal">
      <div className="mp-service-modal" onClick={handleModalClick}>
        {/* Header */}
        <div className="mp-modal-header">
          <div className="mp-modal-title-row">
            <span className="mp-modal-icon" style={{ background: service.color }}>
              {service.icon}
            </span>
            <div>
              <h3 className="mp-modal-title">{service.label}</h3>
              <p className="mp-modal-subtitle">for {petName}</p>
            </div>
          </div>
          <button onClick={onClose} className="mp-modal-close">
            <X />
          </button>
        </div>
        
        {/* Body */}
        <div className="mp-modal-body">
          <p className="mp-modal-desc">{service.description}</p>
          
          {/* Notes Field */}
          <div className="mp-form-group">
            <label className="mp-form-label">Additional Details</label>
            <textarea
              className="mp-form-textarea"
              placeholder={`Tell us more about what you need for ${petName}...`}
              value={formData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={3}
              data-testid="service-notes-input"
            />
          </div>
          
          {/* Date & Urgency Row */}
          <div className="mp-form-row">
            <div className="mp-form-group">
              <label className="mp-form-label">Preferred Date</label>
              <input
                type="date"
                className="mp-form-input"
                value={formData.preferredDate || ''}
                onChange={(e) => handleFieldChange('preferredDate', e.target.value)}
                data-testid="service-date-input"
              />
            </div>
            
            <div className="mp-form-group">
              <label className="mp-form-label">Urgency</label>
              <select
                className="mp-form-select"
                value={formData.urgency || 'normal'}
                onChange={(e) => handleFieldChange('urgency', e.target.value)}
                data-testid="service-urgency-select"
              >
                <option value="flexible">Flexible</option>
                <option value="normal">Normal</option>
                <option value="soon">Soon (this week)</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          {/* After Hours Notice */}
          {!isConciergeLive && (
            <div className="mp-after-hours-notice">
              🌙 Our team is resting (11:30 PM - 6:30 AM). Your request will be processed first thing at 6:30 AM!
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mp-modal-footer">
          <button 
            onClick={onClose}
            className="mp-btn-secondary"
            data-testid="service-cancel-btn"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className="mp-btn-primary"
            disabled={isSubmitting}
            data-testid="service-submit-btn"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestModal;
