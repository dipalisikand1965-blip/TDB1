/**
 * groomingFlows.js
 * 
 * GROOMING FLOW SCHEMA for Mira OS
 * 
 * CONCIERGE-LED: No direct booking, no pricing display
 * All requests create GROOMING_REQUEST tickets
 * 
 * Flow: Mode → Format → Services → Comfort → Logistics → Review → Concierge
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
// GROOMING OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const GROOMING_OPTIONS = {
  // Step 1: Mode
  serviceMode: [
    { id: 'home', label: 'At Home', icon: '🏠', desc: 'Groomer comes to you' },
    { id: 'salon', label: 'Salon', icon: '✨', desc: 'Visit a grooming salon' },
    { id: 'mira_recommend', label: 'Let Mira Recommend', icon: '🤖', desc: 'Based on your pet\'s needs' }
  ],
  
  // Step 2: Format
  serviceFormat: [
    { id: 'individual', label: 'Individual Services', desc: 'Pick specific services' },
    { id: 'full_groom', label: 'Full Groom', desc: 'Complete grooming session' },
    { id: 'bundle', label: 'Bundle / Plan', desc: 'Multi-session packages' },
    { id: 'maintenance', label: 'Maintenance', desc: 'Regular upkeep schedule' }
  ],
  
  // Step 3: Services (multi-select)
  services: [
    { id: 'bath_blowdry', label: 'Bath + Blow Dry' },
    { id: 'haircut', label: 'Haircut / Trim' },
    { id: 'nail_clipping', label: 'Nail Clipping' },
    { id: 'ear_cleaning', label: 'Ear Cleaning' },
    { id: 'paw_care', label: 'Paw Care / Paw Trim' },
    { id: 'hygiene_trim', label: 'Hygiene Trim' },
    { id: 'deshedding', label: 'Deshedding' },
    { id: 'detangling', label: 'Detangling / De-matting' },
    { id: 'coat_styling', label: 'Coat Styling' },
    { id: 'tick_flea', label: 'Tick/Flea Wash' },
    { id: 'puppy_intro', label: 'Puppy Intro Groom' },
    { id: 'senior_comfort', label: 'Senior Comfort Groom' }
  ],
  
  // Step 4: Comfort & Behavior
  strangerComfort: [
    { id: 'yes', label: 'Yes' },
    { id: 'sometimes', label: 'Sometimes' },
    { id: 'no', label: 'No' }
  ],
  nervousDuringGrooming: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'not_sure', label: 'Not sure' }
  ],
  dryerComfort: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'not_sure', label: 'Not sure' }
  ],
  bitingHistory: [
    { id: 'no', label: 'No' },
    { id: 'occasionally', label: 'Occasionally' },
    { id: 'yes', label: 'Yes' }
  ],
  canStand: [
    { id: 'yes', label: 'Yes' },
    { id: 'needs_breaks', label: 'Needs breaks' },
    { id: 'no', label: 'No' }
  ],
  
  // Step 5A: At-Home Logistics
  waterAccess: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' }
  ],
  groomingSpace: [
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'balcony', label: 'Balcony' },
    { id: 'utility', label: 'Utility area' },
    { id: 'other', label: 'Other' }
  ],
  liftAvailable: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' }
  ],
  otherPetsAtHome: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' }
  ],
  
  // Step 5B: Salon Logistics
  distancePreference: [
    { id: 'nearby', label: 'Nearby only' },
    { id: '5km', label: 'Up to 5 km' },
    { id: '10km', label: 'Up to 10 km' },
    { id: 'best', label: 'Best option available' }
  ],
  pickupDrop: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'maybe', label: 'Maybe' }
  ],
  salonType: [
    { id: 'basic', label: 'Basic' },
    { id: 'premium', label: 'Premium' },
    { id: 'breed_specialist', label: 'Breed specialist' },
    { id: 'gentle', label: 'Gentle handling' }
  ],
  waitPreference: [
    { id: 'wait', label: 'Wait at salon' },
    { id: 'dropoff', label: 'Drop-off' },
    { id: 'either', label: 'Either is fine' }
  ],
  
  // Step 6: Plan preferences (for bundle/maintenance)
  planGoal: [
    { id: 'maintenance', label: 'Regular maintenance' },
    { id: 'shedding', label: 'Shedding control' },
    { id: 'coat_health', label: 'Coat health' },
    { id: 'styling', label: 'Styling upkeep' },
    { id: 'puppy_training', label: 'Puppy training' },
    { id: 'senior_comfort', label: 'Senior comfort' }
  ],
  frequency: [
    { id: 'weekly', label: 'Weekly' },
    { id: 'fortnightly', label: 'Fortnightly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'mira_recommend', label: 'Let Mira recommend' }
  ],
  planLength: [
    { id: '3', label: '3 sessions' },
    { id: '6', label: '6 sessions' },
    { id: '12', label: '12 sessions' },
    { id: 'open', label: 'Open-ended maintenance' }
  ],
  startTimeline: [
    { id: 'this_week', label: 'This week' },
    { id: 'next_week', label: 'Next week' },
    { id: 'flexible', label: 'Flexible' }
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
  
  // Preferred time
  preferredTime: [
    { id: 'morning', label: 'Morning (8am-12pm)' },
    { id: 'afternoon', label: 'Afternoon (12pm-5pm)' },
    { id: 'evening', label: 'Evening (5pm-8pm)' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// GROOMING FLOW SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
export const GROOMING_FLOW_SCHEMAS = {
  // Main grooming flow - opens from At-Home or Salon card
  'grooming-request': {
    id: 'grooming-request',
    title: 'Grooming for {petName}',
    subtitle: 'Arranged around {petName}\'s comfort and coat needs',
    ticketType: 'GROOMING_REQUEST',
    steps: [
      // Step 1: Mode Selection
      {
        id: 'mode',
        title: 'How would you like grooming arranged?',
        fields: [
          {
            id: 'service_mode',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Choose grooming mode',
            required: true,
            options: GROOMING_OPTIONS.serviceMode
          }
        ]
      },
      // Step 2: Service Format
      {
        id: 'format',
        title: 'What would you like today?',
        fields: [
          {
            id: 'service_format',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Select service format',
            required: true,
            options: GROOMING_OPTIONS.serviceFormat
          }
        ]
      },
      // Step 3: Services Selection (conditional - not for full_groom)
      {
        id: 'services',
        title: 'Select grooming services',
        showIf: (data) => data.service_format !== 'full_groom',
        fields: [
          {
            id: 'services_requested',
            type: FIELD_TYPES.MULTI_SELECT,
            label: 'Choose services for {petName}',
            required: false,
            options: GROOMING_OPTIONS.services
          }
        ]
      },
      // Step 4: Comfort & Behavior
      {
        id: 'comfort',
        title: 'Tell Mira what helps {petName} feel comfortable',
        fields: [
          {
            id: 'stranger_comfort',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Comfortable with strangers?',
            required: true,
            options: GROOMING_OPTIONS.strangerComfort
          },
          {
            id: 'nervous_grooming',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Nervous during grooming?',
            required: true,
            options: GROOMING_OPTIONS.nervousDuringGrooming
          },
          {
            id: 'dryer_comfort',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Comfortable with dryer/noise?',
            required: true,
            options: GROOMING_OPTIONS.dryerComfort
          },
          {
            id: 'biting_history',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Any biting/snap history?',
            required: true,
            options: GROOMING_OPTIONS.bitingHistory
          },
          {
            id: 'can_stand',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Can stand for a full session?',
            required: true,
            options: GROOMING_OPTIONS.canStand
          },
          {
            id: 'special_notes',
            type: FIELD_TYPES.TEXT,
            label: 'Special notes (optional)',
            required: false,
            placeholder: 'Any other details that help the groomer...'
          }
        ]
      },
      // Step 5: Logistics (dynamic based on mode)
      {
        id: 'logistics',
        title: 'Setup & timing',
        getDynamicTitle: (data) => data.service_mode === 'home' 
          ? 'At-home setup & timing' 
          : 'Salon location & timing',
        fields: [
          // At-Home fields
          {
            id: 'address',
            type: FIELD_TYPES.TEXT,
            label: 'Address',
            required: true,
            showIf: (data) => data.service_mode === 'home',
            placeholder: 'Full address for groomer visit'
          },
          {
            id: 'landmark',
            type: FIELD_TYPES.TEXT,
            label: 'Area / Landmark',
            required: false,
            showIf: (data) => data.service_mode === 'home',
            placeholder: 'Nearby landmark for easy navigation'
          },
          {
            id: 'water_access',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Water access available?',
            required: true,
            showIf: (data) => data.service_mode === 'home',
            options: GROOMING_OPTIONS.waterAccess
          },
          {
            id: 'grooming_space',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Space available for grooming?',
            required: true,
            showIf: (data) => data.service_mode === 'home',
            options: GROOMING_OPTIONS.groomingSpace
          },
          {
            id: 'lift_available',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Lift available?',
            required: false,
            showIf: (data) => data.service_mode === 'home',
            options: GROOMING_OPTIONS.liftAvailable
          },
          {
            id: 'other_pets',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Other pets at home?',
            required: false,
            showIf: (data) => data.service_mode === 'home',
            options: GROOMING_OPTIONS.otherPetsAtHome
          },
          // Salon fields
          {
            id: 'preferred_area',
            type: FIELD_TYPES.TEXT,
            label: 'Preferred area / locality',
            required: true,
            showIf: (data) => data.service_mode === 'salon',
            placeholder: 'e.g., Bandra, Koramangala'
          },
          {
            id: 'distance_preference',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Distance preference',
            required: true,
            showIf: (data) => data.service_mode === 'salon',
            options: GROOMING_OPTIONS.distancePreference
          },
          {
            id: 'pickup_drop',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Need pick-up/drop support?',
            required: true,
            showIf: (data) => data.service_mode === 'salon',
            options: GROOMING_OPTIONS.pickupDrop
          },
          {
            id: 'salon_type',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Salon type preference',
            required: true,
            showIf: (data) => data.service_mode === 'salon',
            options: GROOMING_OPTIONS.salonType
          },
          {
            id: 'wait_preference',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Wait at salon or drop-off?',
            required: true,
            showIf: (data) => data.service_mode === 'salon',
            options: GROOMING_OPTIONS.waitPreference
          },
          // Common timing fields
          {
            id: 'preferred_days',
            type: FIELD_TYPES.MULTI_SELECT,
            label: 'Preferred day(s)',
            required: true,
            options: GROOMING_OPTIONS.preferredDays
          },
          {
            id: 'preferred_time',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Preferred time window',
            required: true,
            options: GROOMING_OPTIONS.preferredTime
          }
        ]
      },
      // Step 6: Plan preferences (conditional - only for bundle/maintenance)
      {
        id: 'plan',
        title: 'Plan preferences',
        showIf: (data) => data.service_format === 'bundle' || data.service_format === 'maintenance',
        fields: [
          {
            id: 'plan_goal',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Goal',
            required: true,
            options: GROOMING_OPTIONS.planGoal
          },
          {
            id: 'frequency',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Frequency',
            required: true,
            options: GROOMING_OPTIONS.frequency
          },
          {
            id: 'plan_length',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Plan length',
            required: true,
            options: GROOMING_OPTIONS.planLength
          },
          {
            id: 'start_timeline',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Start timeline',
            required: true,
            options: GROOMING_OPTIONS.startTimeline
          }
        ]
      }
    ]
  },
  
  // Short flow for "Let Mira Recommend"
  'grooming-mira-recommend': {
    id: 'grooming-mira-recommend',
    title: 'Let Mira find the best grooming for {petName}',
    subtitle: 'We\'ll recommend based on {petName}\'s breed and needs',
    ticketType: 'GROOMING_REQUEST',
    steps: [
      {
        id: 'quick-intake',
        title: 'Quick questions for {petName}',
        fields: [
          {
            id: 'nervous_grooming',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Is {petName} nervous during grooming?',
            required: true,
            options: GROOMING_OPTIONS.nervousDuringGrooming
          },
          {
            id: 'last_groomed',
            type: FIELD_TYPES.TEXT,
            label: 'When was {petName} last groomed?',
            required: false,
            placeholder: 'e.g., 2 weeks ago, never'
          },
          {
            id: 'main_concern',
            type: FIELD_TYPES.TEXT,
            label: 'Main grooming concern (optional)',
            required: false,
            placeholder: 'e.g., matted coat, shedding, nails too long'
          }
        ]
      },
      {
        id: 'preference',
        title: 'Your preference',
        fields: [
          {
            id: 'mode_preference',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'Do you have a preference?',
            required: true,
            options: [
              { id: 'home', label: 'Prefer at-home' },
              { id: 'salon', label: 'Prefer salon' },
              { id: 'no_preference', label: 'No preference - recommend best' }
            ]
          },
          {
            id: 'urgency',
            type: FIELD_TYPES.SINGLE_SELECT,
            label: 'How soon do you need grooming?',
            required: true,
            options: [
              { id: 'asap', label: 'As soon as possible' },
              { id: 'this_week', label: 'This week' },
              { id: 'flexible', label: 'Flexible timing' }
            ]
          }
        ]
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build GROOMING_REQUEST ticket payload
 */
export const buildGroomingTicketPayload = (data, pet, user, entryPoint) => {
  return {
    ticket_type: 'GROOMING_REQUEST',
    pillar: 'care',
    sub_pillar: 'grooming',
    pet_id: pet?.id || pet?._id,
    pet_name: pet?.name,
    entry_point: entryPoint || 'care_grooming',
    context_source: 'care/grooming',
    metadata: {
      service_mode: data.service_mode || 'mira_recommend',
      service_format: data.service_format || null,
      services_requested: data.services_requested || [],
      comfort_notes: {
        stranger_comfort: data.stranger_comfort,
        nervous_grooming: data.nervous_grooming,
        dryer_comfort: data.dryer_comfort,
        biting_history: data.biting_history,
        can_stand: data.can_stand,
        special_notes: data.special_notes
      },
      behavior_flags: {
        nervous: data.nervous_grooming === 'yes',
        biting_risk: data.biting_history === 'yes' || data.biting_history === 'occasionally'
      },
      logistics: data.service_mode === 'home' ? {
        type: 'home',
        address: data.address,
        landmark: data.landmark,
        water_access: data.water_access,
        grooming_space: data.grooming_space,
        lift_available: data.lift_available,
        other_pets: data.other_pets
      } : {
        type: 'salon',
        preferred_area: data.preferred_area,
        distance_preference: data.distance_preference,
        pickup_drop: data.pickup_drop,
        salon_type: data.salon_type,
        wait_preference: data.wait_preference
      },
      timing: {
        preferred_days: data.preferred_days || [],
        preferred_time: data.preferred_time
      },
      plan_preferences: (data.service_format === 'bundle' || data.service_format === 'maintenance') ? {
        goal: data.plan_goal,
        frequency: data.frequency,
        plan_length: data.plan_length,
        start_timeline: data.start_timeline
      } : null,
      // For Mira recommend flow
      quick_intake: data.last_groomed || data.main_concern ? {
        last_groomed: data.last_groomed,
        main_concern: data.main_concern,
        mode_preference: data.mode_preference,
        urgency: data.urgency
      } : null
    },
    user_email: user?.email,
    status: 'open',
    priority: data.urgency === 'asap' ? 'high' : 'normal'
  };
};

/**
 * Save draft to localStorage
 */
export const saveGroomingDraft = (userId, petId, data) => {
  const key = `draft:${userId}:${petId}:grooming`;
  localStorage.setItem(key, JSON.stringify({
    data,
    savedAt: new Date().toISOString()
  }));
};

/**
 * Load draft from localStorage
 */
export const loadGroomingDraft = (userId, petId) => {
  const key = `draft:${userId}:${petId}:grooming`;
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
export const clearGroomingDraft = (userId, petId) => {
  const key = `draft:${userId}:${petId}:grooming`;
  localStorage.removeItem(key);
};

export default GROOMING_FLOW_SCHEMAS;
