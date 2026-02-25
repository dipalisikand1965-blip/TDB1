/**
 * emergencyHelpFlows.js
 * 
 * EMERGENCY HELP FLOW SCHEMA for Mira OS
 * 
 * FAST-TRACK VARIANT: Shorter flow for urgent situations
 * Creates EMERGENCY_HELP_REQUEST with priority: urgent
 * 
 * Flow: Situation → Current State → Location → Contact → Submit
 */

export const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  TEXT: 'text'
};

export const EMERGENCY_OPTIONS = {
  // Situation type
  situationType: [
    { id: 'vet_emergency', label: 'Vet Emergency', icon: '🚨', desc: 'Urgent medical attention needed' },
    { id: 'lost_pet', label: 'Lost Pet', icon: '🔍', desc: 'Pet is missing' },
    { id: 'found_pet', label: 'Found a Pet', icon: '🐕', desc: 'Found a lost pet' },
    { id: 'transport_needed', label: 'Transport Needed', icon: '🚗', desc: 'Need help getting to vet' },
    { id: 'after_hours', label: 'After Hours Care', icon: '🌙', desc: 'Need late night/weekend help' },
    { id: 'other', label: 'Other Emergency', icon: '❗', desc: 'Something else urgent' }
  ],

  // Current pet state (for vet emergencies)
  petState: [
    { id: 'conscious', label: 'Conscious but distressed' },
    { id: 'lethargic', label: 'Lethargic/unresponsive' },
    { id: 'bleeding', label: 'Bleeding/injured' },
    { id: 'vomiting', label: 'Vomiting/diarrhea' },
    { id: 'breathing_difficulty', label: 'Difficulty breathing' },
    { id: 'seizure', label: 'Seizure/convulsions' },
    { id: 'ingested_toxin', label: 'Ingested something toxic' },
    { id: 'accident', label: 'Hit by vehicle/accident' },
    { id: 'unknown', label: 'Not sure' }
  ],

  // Help needed
  helpNeeded: [
    { id: 'vet_clinic_routing', label: 'Find nearest emergency vet' },
    { id: 'transport', label: 'Transport coordination' },
    { id: 'companion_support', label: 'Companion to accompany' },
    { id: 'all_support', label: 'All of the above' }
  ],

  // Contact preference
  contactPreference: [
    { id: 'call_now', label: 'Call me immediately' },
    { id: 'whatsapp', label: 'WhatsApp is better' },
    { id: 'either', label: 'Either is fine' }
  ]
};

export const EMERGENCY_HELP_FLOW_SCHEMA = {
  id: 'emergency-help-request',
  title: 'Emergency Help for {petName}',
  subtitle: 'Mira will prioritize this request immediately',
  ticketType: 'EMERGENCY_HELP_REQUEST',
  steps: [
    // Step 1: Situation
    {
      id: 'situation',
      title: 'What type of emergency?',
      subtitle: 'For life-threatening emergencies, please also call your nearest emergency vet.',
      fields: [
        {
          id: 'situation_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Emergency type',
          required: true,
          options: EMERGENCY_OPTIONS.situationType
        }
      ]
    },
    // Step 2: Current State (for vet emergencies)
    {
      id: 'state',
      title: 'What\'s happening with {petName}?',
      showIf: (data) => data.situation_type === 'vet_emergency',
      fields: [
        {
          id: 'pet_state',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Current condition (select all that apply)',
          required: true,
          options: EMERGENCY_OPTIONS.petState
        },
        {
          id: 'symptoms_note',
          type: FIELD_TYPES.TEXT,
          label: 'Describe what happened',
          required: true,
          placeholder: 'e.g., Started vomiting 2 hours ago, ate chocolate'
        }
      ]
    },
    // Step 3: Help Needed
    {
      id: 'help',
      title: 'What help do you need?',
      fields: [
        {
          id: 'help_needed',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'How can Mira help?',
          required: true,
          options: EMERGENCY_OPTIONS.helpNeeded
        }
      ]
    },
    // Step 4: Location & Contact (combined for speed)
    {
      id: 'contact',
      title: 'Where are you? How can we reach you?',
      fields: [
        {
          id: 'current_location',
          type: FIELD_TYPES.TEXT,
          label: 'Current location',
          required: true,
          placeholder: 'e.g., Indiranagar, near 12th Main'
        },
        {
          id: 'phone_number',
          type: FIELD_TYPES.TEXT,
          label: 'Phone number',
          required: true,
          placeholder: 'Your phone number'
        },
        {
          id: 'contact_preference',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Best way to reach you',
          required: true,
          options: EMERGENCY_OPTIONS.contactPreference
        }
      ]
    }
  ]
};

// Build ticket payload
export const buildEmergencyTicketPayload = (data, pet, user, entryPoint) => {
  const petName = pet?.name || 'Pet';
  const situationType = EMERGENCY_OPTIONS.situationType.find(o => o.id === data.situation_type)?.label || data.situation_type;
  const petStates = (data.pet_state || []).map(s => EMERGENCY_OPTIONS.petState.find(o => o.id === s)?.label).join(', ');
  
  const description = `
🚨 **EMERGENCY HELP REQUEST for ${petName}** 🚨

**Emergency Type:** ${situationType}
${data.pet_state?.length > 0 ? `**Pet Condition:** ${petStates}` : ''}
${data.symptoms_note ? `**Description:** ${data.symptoms_note}` : ''}

**Help Needed:** ${EMERGENCY_OPTIONS.helpNeeded.find(o => o.id === data.help_needed)?.label}

**CONTACT INFO:**
- Location: ${data.current_location}
- Phone: ${data.phone_number}
- Preference: ${EMERGENCY_OPTIONS.contactPreference.find(o => o.id === data.contact_preference)?.label}

---
⚠️ PRIORITY: URGENT
Entry Point: ${entryPoint}
`.trim();

  return {
    member: {
      name: user?.name || user?.email?.split('@')[0] || 'Member',
      email: user?.email || '',
      phone: data.phone_number || user?.phone || ''
    },
    category: 'care',
    sub_category: 'emergency_help',
    urgency: 'high', // Always high for emergencies
    description: description,
    source: 'flow_modal',
    source_reference: entryPoint || 'care_emergency_help',
    tags: ['urgent', 'emergency'],
    metadata: {
      ticket_type: 'EMERGENCY_HELP_REQUEST',
      pillar: 'care',
      sub_pillar: 'emergency_help',
      pet_id: pet?.id || pet?._id,
      pet_name: petName,
      emergency: {
        situation_type: data.situation_type,
        pet_state: data.pet_state || [],
        symptoms_note: data.symptoms_note,
        help_needed: data.help_needed
      },
      contact: {
        current_location: data.current_location,
        phone_number: data.phone_number,
        contact_preference: data.contact_preference
      },
      priority: 'urgent'
    }
  };
};

export default EMERGENCY_HELP_FLOW_SCHEMA;
