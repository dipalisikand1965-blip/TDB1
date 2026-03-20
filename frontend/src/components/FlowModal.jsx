/**
 * FlowModal.jsx
 * 
 * UNIFIED FLOW ENGINE for Mira OS
 * 
 * One engine, multiple schemas. Handles:
 * - Multi-step intake flows
 * - Draft persistence & resume
 * - Constraint enforcement (blocked proteins)
 * - Ticket creation on submit ONLY
 * - Notification via existing WebSocket flow
 * 
 * ACCEPTANCE CRITERIA:
 * 1. No ticket created on open - only on final Submit
 * 2. Draft saved on close mid-way
 * 3. Resume shows previous answers
 * 4. Blocked proteins disabled in modal
 * 5. Uniform ticket payload structure
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import {
  FLOW_SCHEMAS,
  FIELD_TYPES,
  resolvePrefill,
  saveDraft,
  loadDraft,
  clearDraft,
  buildTicketPayload
} from '../schemas/freshMealsFlows';

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD RENDERERS - Each field type has its own renderer
// ═══════════════════════════════════════════════════════════════════════════════

const SingleSelectField = ({ field, value, onChange, petAvoid = [], petName }) => {
  const options = field.options || [];
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isBlocked = field.respectAvoidList && petAvoid.some(avoid => 
            avoid?.toLowerCase?.().includes(option.id) || option.id.includes(avoid?.toLowerCase?.())
          );
          const isSelected = value === option.id;
          
          return (
            <button
              key={option.id}
              type="button"
              disabled={isBlocked}
              onClick={() => !isBlocked && onChange(option.id)}
              title={isBlocked ? `${option.label} is blocked for ${petName}` : ''}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isBlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60' 
                  : isSelected 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
            >
              {option.label}
              {isBlocked && <X className="w-3 h-3 ml-1 inline" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MultiSelectField = ({ field, value = [], onChange, petAvoid = [], petName }) => {
  const options = field.options || [];
  
  const handleToggle = (optionId) => {
    const isBlocked = field.respectAvoidList && petAvoid.some(avoid => 
      avoid?.toLowerCase?.().includes(optionId) || optionId.includes(avoid?.toLowerCase?.())
    );
    if (isBlocked) return;
    
    const newValue = value.includes(optionId)
      ? value.filter(v => v !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isBlocked = field.respectAvoidList && petAvoid.some(avoid => 
            avoid?.toLowerCase?.().includes(option.id) || option.id.includes(avoid?.toLowerCase?.())
          );
          const isSelected = value.includes(option.id);
          
          return (
            <button
              key={option.id}
              type="button"
              disabled={isBlocked}
              onClick={() => handleToggle(option.id)}
              title={isBlocked ? `${option.label} is blocked for ${petName}` : ''}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isBlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60' 
                  : isSelected 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
                }`}
            >
              {isSelected && !isBlocked && <Check className="w-3 h-3 mr-1 inline" />}
              {option.label}
              {isBlocked && <X className="w-3 h-3 ml-1 inline" />}
            </button>
          );
        })}
      </div>
      {field.respectAvoidList && petAvoid.length > 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          Some options blocked based on {petName}'s restrictions
        </p>
      )}
    </div>
  );
};

const ConfirmListField = ({ field, value = [], onChange, petName }) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = () => {
    if (newItem.trim() && !value.includes(newItem.trim())) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };
  
  const handleRemove = (item) => {
    onChange(value.filter(v => v !== item));
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Existing items */}
      <div className="flex flex-wrap gap-2">
        {value.map((item, idx) => (
          <Badge 
            key={idx} 
            className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {item}
            <button 
              type="button"
              onClick={() => handleRemove(item)}
              className="ml-1 hover:text-red-900"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {/* Add new */}
      {field.allowAdd && (
        <div className="flex gap-2 mt-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add another allergy..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const NumberField = ({ field, value, onChange, petName }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        placeholder={field.placeholder}
        className="max-w-xs"
      />
    </div>
  );
};

const TextField = ({ field, value, onChange, petName }) => {
  const isTextarea = field.multiline;
  const Component = isTextarea ? Textarea : Input;
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Component
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
};

const ToggleField = ({ field, value, onChange, petName }) => {
  const isOn = value ?? field.defaultValue ?? false;
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <label className="text-sm font-medium text-gray-700">
        {field.label.replace('{petName}', petName || 'your pet')}
      </label>
      <button
        type="button"
        onClick={() => onChange(!isOn)}
        className={`relative w-12 h-6 rounded-full transition-all ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span 
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-6' : ''}`}
        />
      </button>
    </div>
  );
};

// Field renderer dispatcher
const FieldRenderer = ({ field, value, onChange, petAvoid, petName, allAnswers }) => {
  // Check showIf condition
  if (field.showIf) {
    const { field: condField, value: condValue } = field.showIf;
    if (allAnswers[condField] !== condValue) {
      return null;
    }
  }
  
  const props = { field, value, onChange, petAvoid, petName };
  
  switch (field.type) {
    case FIELD_TYPES.SINGLE_SELECT:
      return <SingleSelectField {...props} />;
    case FIELD_TYPES.MULTI_SELECT:
      return <MultiSelectField {...props} />;
    case FIELD_TYPES.CONFIRM_LIST:
      return <ConfirmListField {...props} />;
    case FIELD_TYPES.NUMBER:
      return <NumberField {...props} />;
    case FIELD_TYPES.TEXT:
      return <TextField {...props} />;
    case FIELD_TYPES.TOGGLE:
      return <ToggleField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FLOWMODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FlowModal = ({
  isOpen,
  onClose,
  cardId,
  pet,
  planBuilder,
  user,
  token,
  entryPoint = 'card_cta'
}) => {
  const navigate = useNavigate();
  
  // Get schema for this card
  const schema = FLOW_SCHEMAS[cardId];
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [editedFields, setEditedFields] = useState([]); // Track user-edited fields
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [draftId, setDraftId] = useState(null);
  
  // Pet avoid list for constraint enforcement
  const petAvoid = useMemo(() => {
    return pet?.allergies || pet?.soul_data?.allergies || [];
  }, [pet]);
  
  // Get constraints that will be applied
  const constraintsApplied = useMemo(() => {
    const constraints = [];
    if (petAvoid.length > 0) {
      constraints.push({ type: 'blocked_proteins', values: petAvoid });
    }
    if (planBuilder?.allergySafe) {
      constraints.push({ type: 'allergy_safe_mode', value: true });
    }
    return constraints;
  }, [petAvoid, planBuilder?.allergySafe]);
  
  // Load draft on open
  useEffect(() => {
    if (isOpen && user?.id && pet?.id) {
      const draft = loadDraft(user.id, pet.id);
      
      // Check if draft is for this card
      if (draft && draft.cardId === cardId) {
        setShowResume(true);
        setDraftId(draft.draftId || `draft-${Date.now()}`);
      } else {
        // New flow - generate draft ID
        setDraftId(`draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        initializeAnswers();
      }
    }
  }, [isOpen, cardId, user?.id, pet?.id]);
  
  // Initialize answers with prefill values
  const initializeAnswers = useCallback(() => {
    if (!schema) return;
    
    const initialAnswers = {};
    schema.steps.forEach(step => {
      step.fields.forEach(field => {
        const prefillValue = resolvePrefill(field.prefillPath, pet, planBuilder, null);
        if (prefillValue !== undefined) {
          initialAnswers[field.id] = prefillValue;
        } else if (field.defaultValue !== undefined) {
          initialAnswers[field.id] = field.defaultValue;
        }
      });
    });
    
    setAnswers(initialAnswers);
    setEditedFields([]);
    setCurrentStep(0);
  }, [schema, pet, planBuilder]);
  
  // Handle resume from draft
  const handleResume = () => {
    const draft = loadDraft(user.id, pet.id);
    if (draft) {
      setAnswers(draft.answers || {});
      setCurrentStep(draft.stepIndex || 0);
      setEditedFields(draft.edited || []);
      setDraftId(draft.draftId || draftId);
    }
    setShowResume(false);
  };
  
  // Handle start fresh
  const handleStartFresh = () => {
    clearDraft(user.id, pet.id);
    initializeAnswers();
    setShowResume(false);
  };
  
  // Handle field change
  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    
    // Track that user edited this field
    if (!editedFields.includes(fieldId)) {
      setEditedFields(prev => [...prev, fieldId]);
    }
  };
  
  // Handle close (save draft if mid-flow)
  const handleClose = () => {
    if (currentStep > 0 && user?.id && pet?.id) {
      // Save draft
      saveDraft(user.id, pet.id, cardId, currentStep, answers, editedFields);
      toast.info('Progress saved. You can resume anytime.');
    }
    onClose();
    // Reset state
    setCurrentStep(0);
    setShowResume(false);
  };
  
  // Validate current step
  const validateStep = () => {
    if (!schema) return false;
    const step = schema.steps[currentStep];
    
    for (const field of step.fields) {
      // Skip validation for conditionally hidden fields
      if (field.showIf) {
        const { field: condField, value: condValue } = field.showIf;
        if (answers[condField] !== condValue) continue;
      }
      
      if (field.required) {
        const value = answers[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          toast.error(`Please complete: ${field.label.replace('{petName}', pet?.name || 'your pet')}`);
          return false;
        }
      }
    }
    return true;
  };
  
  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < schema.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Save draft on each step
      saveDraft(user.id, pet.id, cardId, currentStep + 1, answers, editedFields);
    }
  };
  
  // Handle previous step
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Handle submit (ONLY creates ticket here)
  const handleSubmit = async () => {
    // ── tdc.book — canonical intent ticket ──
    tdc.book({ service: service?.name || service?.type || 'a service', pillar: "platform", pet, channel: "flow_modal" });

    if (!validateStep()) return;
    
    setIsSubmitting(true);
    
    try {
      // Build uniform ticket payload (includes user for customer info)
      const payload = buildTicketPayload({
        schema,
        pet,
        planBuilder,
        flowAnswers: answers,
        draftId,
        entryPoint,
        constraintsApplied,
        user
      });
      
      console.log('[FlowModal] Submitting ticket:', payload);
      
      // POST to service-requests endpoint
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create service request');
      }
      
      const data = await response.json();
      
      // Clear draft on success
      clearDraft(user.id, pet.id);
      
      // Show success toast with action button (no auto-navigation)
      toast.success('Request sent to Concierge®', {
        description: `Ticket #${data.ticket_id || data.id} created`,
        action: {
          label: 'View in inbox',
          onClick: () => navigate(`/mira-os?openConcierge=true&ticket=${data.ticket_id || data.id}`)
        },
        duration: 8000  // Keep toast visible longer
      });
      
      // Close modal - stay on current page
      onClose();
      
    } catch (error) {
      console.error('[FlowModal] Submit error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Don't render if no schema
  if (!schema) return null;
  
  const currentStepData = schema.steps[currentStep];
  const isLastStep = currentStep === schema.steps.length - 1;
  const progress = ((currentStep + 1) / schema.steps.length) * 100;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Resume Modal */}
        {showResume ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Resume Previous Progress?
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                You have an unfinished {schema.title} flow for {pet?.name}. Would you like to continue where you left off?
              </p>
              <div className="flex gap-3">
                <Button onClick={handleResume} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  Resume
                </Button>
                <Button onClick={handleStartFresh} variant="outline" className="flex-1">
                  Start Fresh
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-lg font-semibold">
                  {schema.title}
                </DialogTitle>
                <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {currentStep + 1}/{schema.steps.length}
                </span>
              </div>
              
              {/* Constraints indicator */}
              {constraintsApplied.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Constraints active
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Step Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title.replace('{petName}', pet?.name || 'your pet')}
                </h3>
                {currentStepData.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    {currentStepData.subtitle.replace('{petName}', pet?.name || 'your pet')}
                  </p>
                )}
              </div>
              
              {/* Fields */}
              <div className="space-y-6">
                {currentStepData.fields.map(field => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    petAvoid={petAvoid}
                    petName={pet?.name}
                    allAnswers={answers}
                  />
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit to Concierge®
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-orange-500 hover:bg-orange-600 gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowModal;
