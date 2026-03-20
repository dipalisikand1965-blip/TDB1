/**
 * CareFlowModal.jsx
 * 
 * GENERIC CARE FLOW MODAL for Concierge®
 * Renders any Care service flow based on provided schema.
 * Used for: Boarding & Daycare, Pet Sitting, Emergency Help, etc.
 * 
 * Features:
 * - Auto-prefills address from user profile
 * - Breed intelligence support
 * - Creates ticket AND inbox entry for unified tracking
 * - Concierge® branding throughout
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { X, ChevronRight, ChevronLeft, Check, Loader2, Sparkles, AlertCircle, Info, Inbox } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/api';
import { getBreedIntelligence, getBreedGroomingTip } from '../utils/breedIntelligence';

// Field Types constant
const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  TEXT: 'text',
  DATE: 'date',
  NUMBER: 'number'
};


// ═══════════════════════════════════════════════════════════════════════════════
// FIELD RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

const SingleSelectField = ({ field, value, onChange, petName, accentColor = 'teal' }) => {
  const options = field.options || [];
  
  return (
    <div className="space-y-3" data-testid={`field-${field.id}`}>
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className={`text-${accentColor}-500 ml-1`}>*</span>}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(option => {
          const isSelected = value === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              whileTap={{ scale: 0.97 }}
              data-testid={`option-${field.id}-${option.id}`}
              className={`p-3 rounded-xl text-sm font-medium transition-all text-left
                ${isSelected 
                  ? `bg-${accentColor}-500 text-white shadow-lg ring-2 ring-${accentColor}-300` 
                  : `bg-white border border-gray-200 text-gray-700 hover:border-${accentColor}-300 hover:bg-${accentColor}-50`
                }`}
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              <span>{option.label}</span>
              {option.desc && (
                <span className={`block text-xs mt-0.5 ${isSelected ? `text-${accentColor}-100` : 'text-gray-500'}`}>
                  {option.desc}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const MultiSelectField = ({ field, value = [], onChange, petName, accentColor = 'teal' }) => {
  const options = field.options || [];
  const selectedIds = Array.isArray(value) ? value : [];
  
  const toggleOption = (optionId) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter(id => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };
  
  return (
    <div className="space-y-3" data-testid={`field-${field.id}`}>
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className={`text-${accentColor}-500 ml-1`}>*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              whileTap={{ scale: 0.95 }}
              data-testid={`option-${field.id}-${option.id}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isSelected 
                  ? `bg-${accentColor}-500 text-white shadow-md` 
                  : `bg-white border border-gray-200 text-gray-700 hover:border-${accentColor}-300`
                }`}
            >
              {isSelected && <Check className="w-3 h-3 mr-1.5 inline" />}
              {option.label}
            </motion.button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className={`text-xs text-${accentColor}-600`}>{selectedIds.length} selected</p>
      )}
    </div>
  );
};

const TextField = ({ field, value, onChange, petName }) => {
  const isTextarea = field.multiline;
  const Component = isTextarea ? Textarea : Input;
  
  return (
    <div className="space-y-2" data-testid={`field-${field.id}`}>
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Component
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={(field.placeholder || '').replace('{petName}', petName || 'your pet')}
        className="w-full"
        rows={isTextarea ? 3 : undefined}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CareFlowModal = ({
  isOpen,
  onClose,
  pet,
  user,
  token,
  schema,
  buildPayload,
  entryPoint = 'care_service',
  accentColor = 'teal', // teal, violet, red, blue
  headerGradient = 'from-teal-500 to-cyan-500',
  icon = null,
  iconLabel = 'Care'
}) => {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  
  const petName = pet?.name || 'Your Pet';
  
  // Get visible steps based on showIf conditions
  const visibleSteps = useMemo(() => {
    if (!schema?.steps) return [];
    return schema.steps.filter(step => {
      if (step.showIf) {
        return step.showIf(formData);
      }
      return true;
    });
  }, [schema, formData]);
  
  const currentStepData = visibleSteps[currentStep];
  const isLastStep = currentStep === visibleSteps.length - 1;
  const progress = visibleSteps.length > 0 ? ((currentStep + 1) / visibleSteps.length) * 100 : 0;
  
  // Get visible fields for current step
  const visibleFields = useMemo(() => {
    if (!currentStepData?.fields) return [];
    return currentStepData.fields.filter(field => {
      if (field.showIf) {
        return field.showIf(formData);
      }
      return true;
    });
  }, [currentStepData, formData]);
  
  // Check if current step is valid
  const isStepValid = useMemo(() => {
    return visibleFields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }, [visibleFields, formData]);
  
  // Update field value
  const updateField = useCallback((fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);
  
  // Navigation
  const goNext = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Submit
  const handleSubmit = async () => {
    // ── tdc.book — canonical intent ticket ──
    tdc.book({ service: service?.name || service?.type || 'a service', pillar: "care", pet, channel: "care_flow_modal" });

    setIsSubmitting(true);
    
    try {
      const payload = buildPayload(formData, pet, user, entryPoint);
      console.log(`[CareFlowModal] Submitting ${schema?.ticketType}:`, JSON.stringify(payload).substring(0, 500));
      
      const response = await fetch(`${API_URL}/api/tickets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.status}`);
      }
      
      const result = await response.json();
      setTicketId(result.ticket?.ticket_id || result.id);
      setIsSuccess(true);
      
      toast.success(`Request sent to Concierge® for ${petName}`, {
        description: 'Check your inbox for updates.'
      });
    } catch (error) {
      console.error('Care flow ticket error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset on close
  const handleClose = () => {
    setCurrentStep(0);
    setFormData({});
    setIsSuccess(false);
    setTicketId(null);
    onClose();
  };
  
  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.id];
    const onChange = (val) => updateField(field.id, val);
    
    switch (field.type) {
      case FIELD_TYPES.SINGLE_SELECT:
        return <SingleSelectField key={field.id} field={field} value={value} onChange={onChange} petName={petName} accentColor={accentColor} />;
      case FIELD_TYPES.MULTI_SELECT:
        return <MultiSelectField key={field.id} field={field} value={value} onChange={onChange} petName={petName} accentColor={accentColor} />;
      case FIELD_TYPES.TEXT:
      default:
        return <TextField key={field.id} field={field} value={value} onChange={onChange} petName={petName} />;
    }
  };
  
  // Success state - Shows confirmation with Concierge® and inbox notification
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className={`bg-gradient-to-br ${headerGradient} p-8 text-center text-white`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Check className="w-10 h-10" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Request Sent to Concierge®</h2>
            <p className="text-white/90 mb-2">
              Your request for {petName} has been received.
            </p>
            <p className="text-white/70 text-sm mb-4">
              Our Concierge® team will review and get back to you shortly with the best options.
            </p>
            
            {/* Inbox confirmation badge */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-white/10 rounded-full">
              <Inbox className="w-4 h-4" />
              <span className="text-sm">Added to your Inbox</span>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = `/mira-os?openConcierge=true&ticket=${ticketId}`}
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
              >
                View in Concierge® Inbox
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="w-full text-white hover:bg-white/10"
              >
                Back to Care
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} px-6 py-4 text-white flex-shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-white/20 text-white">
              {icon || <AlertCircle className="w-3 h-3 mr-1" />}
              {iconLabel}
            </Badge>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold">
            {(schema?.title || 'Care Request').replace('{petName}', petName)}
          </h2>
          <p className="text-white/80 text-sm">
            {(schema?.subtitle || '').replace('{petName}', petName)}
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-white/70 mt-1">
            Step {currentStep + 1} of {visibleSteps.length}
          </p>
        </div>
        
        {/* Pet context strip */}
        {pet && (
          <div className={`px-6 py-3 bg-${accentColor}-50 border-b border-${accentColor}-100 flex items-center gap-3 flex-shrink-0`}>
            <div className={`w-10 h-10 rounded-full bg-${accentColor}-200 overflow-hidden`}>
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-${accentColor}-600 font-bold`}>
                  {petName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">For {petName}</p>
              <p className="text-xs text-gray-500">
                {pet.breed} {pet.size && `• ${pet.size}`}
              </p>
            </div>
          </div>
        )}
        
        {/* Step content */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStepData && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(currentStepData.title || '').replace('{petName}', petName)}
                    </h3>
                    {currentStepData.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">
                        {currentStepData.subtitle.replace('{petName}', petName)}
                      </p>
                    )}
                  </div>
                  
                  {visibleFields.map(field => (
                    <div key={field.id}>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between gap-3 flex-shrink-0">
          {currentStep > 0 ? (
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {isLastStep ? (
            <Button 
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              className={`bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Send to Concierge®
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={goNext}
              disabled={!isStepValid}
              className={`bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CareFlowModal;
