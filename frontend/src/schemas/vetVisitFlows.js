/**
 * vetVisitFlows.js
 * 
 * VET VISIT FLOW SCHEMA for Mira OS
 * 
 * CONCIERGE-LED: No direct booking, no pricing display
 * All requests create VET_VISIT_REQUEST tickets
 * 
 * Flow: Reason → Details → Timing → Handling → Location → Review → Concierge
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD TYPES - Reusable across schemas
// ═══════════════════════════════════════════════════════════════════════════════
export const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  CHIPS: 'chips',
  TEXT: 'text',
  NUMBER: 'number',
  TOGGLE: 'toggle',
  CONFIRM_LIST: 'confirm_list'
};

// ═══════════════════════════════════════════════════════════════════════════════
// VET VISIT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const VET_VISIT_OPTIONS = {
  // Step 1: Visit Reason
  visitReason: [
    { id: 'routine_checkup', label: 'Routine check-up', icon: '🩺', desc: 'Annual wellness exam' },
    { id: 'vaccination', label: 'Vaccination', icon: '💉', desc: 'Vaccines and boosters' },
    { id: 'ear_problem', label: 'Ear problem', icon: '👂', desc: 'Ear infection, discharge, or discomfort' },
    { id: 'skin_issue', label: 'Skin/Itchiness check', icon: '🔍', desc: 'Rashes, allergies, or coat issues' },
    { id: 'senior_wellness', label: 'Senior wellness check', icon: '🐾', desc: 'Comprehensive exam for older pets' },
    { id: 'digestive', label: 'Digestive issues', icon: '🍽️', desc: 'Vomiting, diarrhea, appetite changes' },
    { id: 'dental', label: 'Dental checkup', icon: '🦷', desc: 'Oral health examination' },
    { id: 'follow_up', label: 'Follow-up visit', icon: '📋', desc: 'Post-treatment check' },
    { id: 'other', label: 'Other concerns', icon: '❓', desc: 'Tell us more' },
    { id: 'mira_recommend', label: 'Let Mira Recommend', icon: '✨', desc: 'Based on your pet\'s health profile' }
  ],

  // Step 2: Additional concerns (multi-select)
  additionalConcerns: [
    { id: 'ear_check', label: 'Ear check' },
    { id: 'skin_itchiness', label: 'Skin/Itchiness' },
    { id: 'eye_check', label: 'Eye check' },
    { id: 'weight_concern', label: 'Weight concern' },
    { id: 'mobility', label: 'Mobility issues' },
    { id: 'behavior_change', label: 'Behavior change' },
    { id: 'appetite_change', label: 'Appetite change' },
    { id: 'coughing_sneezing', label: 'Coughing/Sneezing' }
  ],

  // Step 3: Timing
  urgency: [
    { id: 'asap', label: 'As soon as possible', icon: '⚡' },
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'tomorrow', label: 'Tomorrow, Morning', icon: '🌅', desc: 'Morning preferred' },
    { id: 'this_week', label: 'This week', icon: '📆' },
    { id: 'custom', label: 'Custom Date/time window', icon: '⏰' }
  ],

  // Step 4: Handling preferences
  temperament: [
    { id: 'calm', label: 'Calm' },
    { id: 'nervous_clinic', label: 'Nervous at clinic' },
    { id: 'sensitive_noise', label: 'Sensitive to noise' },
    { id: 'smart', label: 'Smart' },
    { id: 'scared_checkups', label: 'Scared during check-ups' },
    { id: 'toxic', label: 'Toxic/Aggressive' },
    { id: 'senior_illness', label: 'Senior illness' },
    { id: 'needs_care', label: 'Senior / needs-care' },
    { id: 'paralysis', label: 'Paralysis concern' }
  ],

  // Step 5: Location/Area preferences
  pickupDrop: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'unsure', label: 'Unsure' }
  ],
  
  languagePreference: [
    { id: 'english', label: 'English' },
    { id: 'hindi', label: 'Hindi' },
    { id: 'other', label: 'Other' }
  ],

  // Preferred days
  preferredDays: [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' }
  ],

  // Time windows
  timeWindow: [
    { id: 'morning', label: 'Morning (8am-12pm)' },
    { id: 'afternoon', label: 'Afternoon (12pm-5pm)' },
    { id: 'evening', label: 'Evening (5pm-8pm)' },
    { id: 'flexible', label: 'Flexible' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// VET VISIT FLOW SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
export const VET_VISIT_FLOW_SCHEMA = {
  id: 'vet-visit-request',
  title: 'Preparing vet visit for {petName}',
  subtitle: 'Mira will help coordinate a stress-free clinic experience',
  ticketType: 'VET_VISIT_REQUEST',
  steps: [
    // Step 1: Main reason for visit
    {
      id: 'reason',
      title: "What's the main reason for this vet visit?",
      fields: [
        {
          id: 'visit_reason',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Primary reason',
          required: true,
          options: VET_VISIT_OPTIONS.visitReason
        }
      ]
    },
    // Step 2: Additional concerns
    {
      id: 'concerns',
      title: "What's the main reason for this vet visit?",
      subtitle: 'Please share any other key concerns Mira should know.',
      fields: [
        {
          id: 'additional_concerns',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Additional concerns (optional)',
          required: false,
          options: VET_VISIT_OPTIONS.additionalConcerns
        },
        {
          id: 'other_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Other notes (optional)',
          required: false,
          placeholder: 'Tell us any other concerns or vet visit notes...'
        }
      ]
    },
    // Step 3: Timing
    {
      id: 'timing',
      title: 'When would you like to book this visit?',
      fields: [
        {
          id: 'urgency',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Timing preference',
          required: true,
          options: VET_VISIT_OPTIONS.urgency
        },
        {
          id: 'time_window',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Time window',
          required: false,
          options: VET_VISIT_OPTIONS.timeWindow
        }
      ]
    },
    // Step 4: Handling preferences
    {
      id: 'handling',
      title: 'Tell us about any sensitivities or handling preferences',
      subtitle: 'This helps Mira coordinate a more gentle experience. We do not provide medical advice.',
      fields: [
        {
          id: 'temperament_flags',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Temperament & handling',
          required: false,
          options: VET_VISIT_OPTIONS.temperament
        },
        {
          id: 'special_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Special notes',
          required: false,
          placeholder: 'e.g., prefers gentle handling, nervous with strangers'
        }
      ]
    },
    // Step 5: Location preferences
    {
      id: 'location',
      title: 'Where is your preferred area? (optional)',
      fields: [
        {
          id: 'preferred_area',
          type: FIELD_TYPES.TEXT,
          label: 'Preferred localities',
          required: false,
          placeholder: 'e.g., Indiranagar, HSR, Koramangala, Up to 5km'
        },
        {
          id: 'pickup_drop',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Pick up/drop needed?',
          required: false,
          options: VET_VISIT_OPTIONS.pickupDrop
        },
        {
          id: 'language_preference',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Language preference for vet',
          required: false,
          options: VET_VISIT_OPTIONS.languagePreference
        },
        {
          id: 'home_contact',
          type: FIELD_TYPES.TEXT,
          label: 'Home contact',
          required: false,
          placeholder: 'Contact name & number for clinic coordination'
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build VET_VISIT_REQUEST ticket payload
 * Matches the TicketCreate Pydantic model expected by /api/tickets
 */
export const buildVetVisitTicketPayload = (data, pet, user, entryPoint) => {
  // Build description from collected data
  const petName = pet?.name || 'Pet';
  const visitReason = VET_VISIT_OPTIONS.visitReason.find(o => o.id === data.visit_reason)?.label || data.visit_reason;
  const additionalConcerns = (data.additional_concerns || [])
    .map(c => VET_VISIT_OPTIONS.additionalConcerns.find(o => o.id === c)?.label)
    .filter(Boolean)
    .join(', ');
  const temperament = (data.temperament_flags || [])
    .map(t => VET_VISIT_OPTIONS.temperament.find(o => o.id === t)?.label)
    .filter(Boolean)
    .join(', ');
  
  const description = `
**Vet Visit Request for ${petName}**

**Primary Reason:** ${visitReason}
${additionalConcerns ? `**Additional Concerns:** ${additionalConcerns}` : ''}
${data.other_notes ? `**Notes:** ${data.other_notes}` : ''}

**Timing:**
- Urgency: ${data.urgency || 'Flexible'}
- Time window: ${data.time_window || 'Flexible'}

**Handling Preferences:**
${temperament ? `- Temperament: ${temperament}` : ''}
${data.special_notes ? `- Special notes: ${data.special_notes}` : ''}

**Location Preferences:**
- Preferred area: ${data.preferred_area || 'Not specified'}
- Pickup/drop needed: ${data.pickup_drop || 'Not specified'}
- Language preference: ${data.language_preference || 'English'}
${data.home_contact ? `- Contact: ${data.home_contact}` : ''}

**Pet Details:**
- Name: ${petName}
- Breed: ${pet?.breed || 'Not specified'}

---
Entry Point: ${entryPoint}
This helps Mira coordinate a more gentle experience. We do not provide medical advice.
`.trim();

  // Return in TicketCreate format
  return {
    member: {
      name: user?.name || user?.email?.split('@')[0] || 'Member',
      email: user?.email || '',
      phone: user?.phone || user?.whatsapp || ''
    },
    category: 'care',
    sub_category: 'vet_clinic_booking',
    urgency: data.urgency === 'asap' || data.urgency === 'today' ? 'high' : 'medium',
    description: description,
    source: 'flow_modal',
    source_reference: entryPoint || 'care_vet_visit',
    attachments: [],
    // Extended metadata for Mira OS
    metadata: {
      ticket_type: 'VET_VISIT_REQUEST',
      pillar: 'care',
      sub_pillar: 'vet_clinic_booking',
      pet_id: pet?.id || pet?._id,
      pet_name: petName,
      visit_reason: data.visit_reason,
      additional_concerns: data.additional_concerns || [],
      timing: {
        urgency: data.urgency,
        time_window: data.time_window
      },
      handling: {
        temperament_flags: data.temperament_flags || [],
        special_notes: data.special_notes
      },
      location: {
        preferred_area: data.preferred_area,
        pickup_drop: data.pickup_drop,
        language_preference: data.language_preference,
        home_contact: data.home_contact
      }
    }
  };
};

/**
 * Save draft to localStorage
 */
export const saveVetVisitDraft = (userId, petId, data) => {
  const key = `draft:${userId}:${petId}:vet_visit`;
  localStorage.setItem(key, JSON.stringify({
    data,
    savedAt: new Date().toISOString()
  }));
};

/**
 * Load draft from localStorage
 */
export const loadVetVisitDraft = (userId, petId) => {
  const key = `draft:${userId}:${petId}:vet_visit`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Clear draft from localStorage
 */
export const clearVetVisitDraft = (userId, petId) => {
  const key = `draft:${userId}:${petId}:vet_visit`;
  localStorage.removeItem(key);
};

export default VET_VISIT_FLOW_SCHEMA;
