/**
 * VetVisitFlowModal.jsx
 * 
 * CONCIERGE-LED VET VISIT INTAKE FLOW
 * 
 * Multi-step wizard for scheduling vet visits.
 * All requests go to Concierge® - no direct booking.
 * 
 * Flow: Reason → Concerns → Timing → Handling → Location → Review
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { X, ChevronRight, ChevronLeft, Check, Loader2, Sparkles, Stethoscope } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/api';
import {
  VET_VISIT_FLOW_SCHEMA,
  VET_VISIT_OPTIONS,
  FIELD_TYPES,
  buildVetVisitTicketPayload,
  saveVetVisitDraft,
  loadVetVisitDraft,
  clearVetVisitDraft
} from '../schemas/vetVisitFlows';

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

const SingleSelectField = ({ field, value, onChange, petName }) => {
  const options = field.options || [];
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-violet-500 ml-1">*</span>}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(option => {
          const isSelected = value === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-xl text-sm font-medium transition-all text-left flex items-start gap-3
                ${isSelected 
                  ? 'bg-violet-500 text-white shadow-lg ring-2 ring-violet-300' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
                }`}
            >
              {option.icon && <span className="text-lg">{option.icon}</span>}
              <div className="flex-1">
                <span className="block font-semibold">{option.label}</span>
                {option.desc && (
                  <span className={`block text-xs mt-0.5 ${isSelected ? 'text-violet-100' : 'text-gray-500'}`}>
                    {option.desc}
                  </span>
                )}
              </div>
              {isSelected && <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const MultiSelectField = ({ field, value = [], onChange, petName }) => {
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
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-violet-500 ml-1">*</span>}
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-violet-500 text-white shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-violet-300'
                }`}
            >
              {isSelected && <Check className="w-3 h-3 mr-1.5 inline" />}
              {option.label}
            </motion.button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-violet-600">{selectedIds.length} selected</p>
      )}
    </div>
  );
};

const TextField = ({ field, value, onChange, petName }) => {
  const isTextarea = field.multiline;
  const Component = isTextarea ? Textarea : Input;
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {(field.label || '').replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-violet-500 ml-1">*</span>}
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
// PET CONTEXT SIDEBAR - Shows pet info on the right
// ═══════════════════════════════════════════════════════════════════════════════

const PetContextSidebar = ({ pet, formData }) => {
  const petName = pet?.name || 'Your Pet';
  const petPhoto = pet?.photo_url || pet?.photo;
  
  // Get selected visit reason label
  const visitReasonOption = VET_VISIT_OPTIONS.visitReason.find(o => o.id === formData.visit_reason);
  
  return (
    <div className="bg-violet-50 rounded-xl p-4 space-y-3">
      <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
        Preparing vet visit for {petName}...
      </p>
      
      {/* Pet avatar and info */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-violet-200 overflow-hidden flex-shrink-0">
          {petPhoto ? (
            <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-600 font-bold text-xl">
              {petName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900">{petName}</p>
          <p className="text-xs text-gray-500">
            {pet?.breed || 'Pet'} {pet?.size && `• ${pet.size}`}
          </p>
        </div>
      </div>
      
      {/* Dynamic summary based on form progress */}
      <div className="space-y-2 pt-2 border-t border-violet-200">
        {visitReasonOption && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-violet-500">•</span>
            <span className="text-gray-600">{visitReasonOption.label}</span>
          </div>
        )}
        
        {formData.urgency && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-violet-500">•</span>
            <span className="text-gray-600">
              {VET_VISIT_OPTIONS.urgency.find(o => o.id === formData.urgency)?.label}
            </span>
          </div>
        )}
        
        {formData.temperament_flags?.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-violet-500">•</span>
            <span className="text-gray-600">
              Handling: {formData.temperament_flags.slice(0, 2).map(f => 
                VET_VISIT_OPTIONS.temperament.find(o => o.id === f)?.label
              ).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const VetVisitFlowModal = ({
  isOpen,
  onClose,
  pet,
  user,
  token,
  entryPoint = 'care_vet_visit',
  preselectedType = null // 'routine_checkup' | 'vaccination' | etc
}) => {
  const schema = VET_VISIT_FLOW_SCHEMA;
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  
  const petName = pet?.name || 'Your Pet';
  const userId = user?.id || user?._id || user?.email;
  const petId = pet?.id || pet?._id;
  
  // Initialize with preselected type
  useEffect(() => {
    if (isOpen && preselectedType) {
      setFormData(prev => ({ ...prev, visit_reason: preselectedType }));
    }
  }, [isOpen, preselectedType]);
  
  // Load draft on open
  useEffect(() => {
    if (isOpen && userId && petId) {
      const draft = loadVetVisitDraft(userId, petId);
      if (draft?.data) {
        setFormData(prev => ({ ...prev, ...draft.data }));
      }
    }
  }, [isOpen, userId, petId]);
  
  // Get visible steps
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
    setFormData(prev => {
      const updated = { ...prev, [fieldId]: value };
      // Auto-save draft
      if (userId && petId) {
        saveVetVisitDraft(userId, petId, updated);
      }
      return updated;
    });
  }, [userId, petId]);
  
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
  
  // Submit to Concierge®
  const handleSubmit = async () => {
    // ── tdc.book — canonical intent ticket ──
    tdc.book({ service: 'vet_visit', pillar: "care", pet, channel: "vet_visit_flow_modal" });

    setIsSubmitting(true);
    
    try {
      const payload = buildVetVisitTicketPayload(formData, pet, user, entryPoint);
      
      const response = await fetch(`${API_URL}/api/tickets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VetVisitFlowModal] Error response:', errorText);
        throw new Error(`Failed to create ticket: ${response.status}`);
      }
      
      const result = await response.json();
      setTicketId(result.ticket?.ticket_id || result.id || result.ticket_id);
      setIsSuccess(true);
      
      // Clear draft
      if (userId && petId) {
        clearVetVisitDraft(userId, petId);
      }
      
      toast.success(`Request sent to Concierge® for ${petName}`, {
        description: 'Check your inbox for updates.'
      });
    } catch (error) {
      console.error('Vet visit ticket error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset on close
  const handleClose = () => {
    // Save draft if not submitted
    if (!isSuccess && userId && petId && Object.keys(formData).length > 0) {
      saveVetVisitDraft(userId, petId, formData);
    }
    
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
        return <SingleSelectField key={field.id} field={field} value={value} onChange={onChange} petName={petName} />;
      case FIELD_TYPES.MULTI_SELECT:
        return <MultiSelectField key={field.id} field={field} value={value} onChange={onChange} petName={petName} />;
      case FIELD_TYPES.TEXT:
        return <TextField key={field.id} field={field} value={value} onChange={onChange} petName={petName} />;
      default:
        return <TextField key={field.id} field={field} value={value} onChange={onChange} petName={petName} />;
    }
  };
  
  // Success state - Shows confirmation with Concierge® and inbox notification
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Check className="w-10 h-10" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Request Sent to Concierge®</h2>
            <p className="text-violet-100 mb-2">
              Your vet visit request for {petName} has been received.
            </p>
            <p className="text-violet-200 text-sm mb-4">
              Our Concierge® team will review and coordinate with trusted clinics in your area.
            </p>
            
            {/* Inbox confirmation badge */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
              <span className="text-sm">Added to your Inbox</span>
            </div>
            
            <p className="text-violet-300 text-xs mb-6 italic">
              We do not provide medical advice. Mira coordinates clinic discovery and bookings.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = `/mira-os?openConcierge=true&ticket=${ticketId}`}
                className="w-full bg-white text-violet-600 hover:bg-violet-50"
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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={goBack} disabled={currentStep === 0} className={`text-white/80 hover:text-white ${currentStep === 0 ? 'invisible' : ''}`}>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-violet-100">
            Step {currentStep + 1} of {visibleSteps.length}
          </p>
        </div>
        
        {/* Main content area - Two column layout on desktop - Scrollable */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left column - Form */}
          <div className="flex-1 px-6 py-5 overflow-y-auto no-sb">
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
          
          {/* Right column - Pet context sidebar (desktop only) */}
          <div className="hidden md:block w-64 p-4 bg-gray-50 border-l flex-shrink-0">
            <PetContextSidebar pet={pet} formData={formData} />
          </div>
        </div>
        
        {/* Footer - Fixed at bottom */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray-500 hidden sm:block">
            Mira will recommend trusted vets in this area. We do not provide medical advice.
          </div>
          
          {isLastStep ? (
            <Button 
              onClick={handleSubmit}
              disabled={!isStepValid || isSubmitting}
              className="bg-violet-500 hover:bg-violet-600 text-white px-6"
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
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VetVisitFlowModal;
