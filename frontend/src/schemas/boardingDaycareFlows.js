/**
 * boardingDaycareFlows.js
 * 
 * BOARDING & DAYCARE FLOW SCHEMA for Mira OS
 * 
 * CONCIERGE-LED: No direct booking, no pricing display
 * All requests create BOARDING_DAYCARE_REQUEST tickets
 * 
 * Flow: Type → Dates → Pet Needs → Preferences → Location → Review → Concierge
 */

// Field Types
export const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  TEXT: 'text',
  DATE: 'date',
  NUMBER: 'number'
};

// Boarding/Daycare Options
export const BOARDING_OPTIONS = {
  // Step 1: Service Type
  serviceType: [
    { id: 'daycare', label: 'Daycare', icon: '🌞', desc: 'Daytime supervision & play' },
    { id: 'overnight', label: 'Overnight Boarding', icon: '🌙', desc: 'Multi-day stays' },
    { id: 'extended', label: 'Extended Stay', icon: '📅', desc: 'Week+ vacation care' },
    { id: 'mira_recommend', label: 'Let Mira Recommend', icon: '✨', desc: 'Based on your pet\'s needs' }
  ],

  // Step 2: Duration/Frequency
  daycareFrequency: [
    { id: 'once', label: 'One-time' },
    { id: 'weekly', label: 'Weekly (1-2 days)' },
    { id: 'frequent', label: 'Frequent (3+ days/week)' },
    { id: 'flexible', label: 'Flexible' }
  ],

  // Pet personality
  socialPreference: [
    { id: 'loves_dogs', label: 'Loves playing with dogs' },
    { id: 'selective', label: 'Selective with friends' },
    { id: 'prefers_solo', label: 'Prefers solo time' },
    { id: 'not_sure', label: 'Not sure' }
  ],

  // Energy level
  energyLevel: [
    { id: 'high', label: 'High energy, needs lots of play' },
    { id: 'moderate', label: 'Moderate - mix of play & rest' },
    { id: 'low', label: 'Low energy, prefers calm' },
    { id: 'senior', label: 'Senior - gentle activity only' }
  ],

  // Special needs
  specialNeeds: [
    { id: 'medications', label: 'Needs medications' },
    { id: 'special_diet', label: 'Special diet' },
    { id: 'separation_anxiety', label: 'Separation anxiety' },
    { id: 'reactive', label: 'Can be reactive' },
    { id: 'mobility_issues', label: 'Mobility issues' },
    { id: 'none', label: 'No special needs' }
  ],

  // Boarding accommodation type
  accommodationType: [
    { id: 'home_based', label: 'Home-based boarding', desc: 'Stay with a vetted host family' },
    { id: 'facility', label: 'Professional facility', desc: 'Dedicated pet boarding center' },
    { id: 'luxury', label: 'Luxury boarding', desc: 'Premium accommodation & services' },
    { id: 'flexible', label: 'No preference' }
  ],

  // Pickup/drop
  pickupDrop: [
    { id: 'yes', label: 'Yes, need pickup/drop' },
    { id: 'no', label: 'No, I can transport' },
    { id: 'maybe', label: 'Maybe, depends on location' }
  ],

  // Urgency
  urgency: [
    { id: 'planned', label: 'Planned (1+ week away)' },
    { id: 'soon', label: 'Soon (within a week)' },
    { id: 'urgent', label: 'Urgent (next few days)' },
    { id: 'asap', label: 'ASAP - Emergency' }
  ]
};

// Flow Schema
export const BOARDING_DAYCARE_FLOW_SCHEMA = {
  id: 'boarding-daycare-request',
  title: 'Boarding & Daycare for {petName}',
  subtitle: 'Mira will help find the perfect care while you\'re away',
  ticketType: 'BOARDING_DAYCARE_REQUEST',
  steps: [
    // Step 1: Service Type
    {
      id: 'type',
      title: 'What type of care does {petName} need?',
      fields: [
        {
          id: 'service_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Care type',
          required: true,
          options: BOARDING_OPTIONS.serviceType
        }
      ]
    },
    // Step 2: Dates
    {
      id: 'dates',
      title: 'When do you need care?',
      fields: [
        {
          id: 'start_date',
          type: FIELD_TYPES.TEXT,
          label: 'Start date',
          required: true,
          placeholder: 'e.g., March 15, 2026'
        },
        {
          id: 'end_date',
          type: FIELD_TYPES.TEXT,
          label: 'End date (for boarding)',
          required: false,
          showIf: (data) => data.service_type !== 'daycare',
          placeholder: 'e.g., March 20, 2026'
        },
        {
          id: 'daycare_frequency',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'How often?',
          required: false,
          showIf: (data) => data.service_type === 'daycare',
          options: BOARDING_OPTIONS.daycareFrequency
        },
        {
          id: 'urgency',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Urgency',
          required: true,
          options: BOARDING_OPTIONS.urgency
        }
      ]
    },
    // Step 3: Pet Needs
    {
      id: 'pet_needs',
      title: 'Tell us about {petName}\'s personality & needs',
      fields: [
        {
          id: 'social_preference',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Social preference',
          required: true,
          options: BOARDING_OPTIONS.socialPreference
        },
        {
          id: 'energy_level',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Energy level',
          required: true,
          options: BOARDING_OPTIONS.energyLevel
        },
        {
          id: 'special_needs',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Any special needs?',
          required: false,
          options: BOARDING_OPTIONS.specialNeeds
        },
        {
          id: 'care_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Care notes (optional)',
          required: false,
          placeholder: 'e.g., Feeding schedule, favorite toys, bedtime routine'
        }
      ]
    },
    // Step 4: Preferences
    {
      id: 'preferences',
      title: 'Your preferences',
      showIf: (data) => data.service_type !== 'daycare',
      fields: [
        {
          id: 'accommodation_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Accommodation preference',
          required: false,
          options: BOARDING_OPTIONS.accommodationType
        },
        {
          id: 'pickup_drop',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Need pickup/drop service?',
          required: false,
          options: BOARDING_OPTIONS.pickupDrop
        }
      ]
    },
    // Step 5: Location
    {
      id: 'location',
      title: 'Where should we look?',
      fields: [
        {
          id: 'preferred_area',
          type: FIELD_TYPES.TEXT,
          label: 'Preferred area',
          required: true,
          placeholder: 'e.g., Indiranagar, Koramangala'
        },
        {
          id: 'home_contact',
          type: FIELD_TYPES.TEXT,
          label: 'Emergency contact',
          required: false,
          placeholder: 'Name & phone for emergencies'
        }
      ]
    }
  ]
};

// Build ticket payload
export const buildBoardingTicketPayload = (data, pet, user, entryPoint) => {
  const petName = pet?.name || 'Pet';
  const serviceType = BOARDING_OPTIONS.serviceType.find(o => o.id === data.service_type)?.label || data.service_type;
  
  const description = `
**Boarding/Daycare Request for ${petName}**

**Service Type:** ${serviceType}
**Dates:** ${data.start_date}${data.end_date ? ` to ${data.end_date}` : ''}
${data.daycare_frequency ? `**Frequency:** ${BOARDING_OPTIONS.daycareFrequency.find(o => o.id === data.daycare_frequency)?.label}` : ''}
**Urgency:** ${BOARDING_OPTIONS.urgency.find(o => o.id === data.urgency)?.label}

**Pet Personality:**
- Social: ${BOARDING_OPTIONS.socialPreference.find(o => o.id === data.social_preference)?.label}
- Energy: ${BOARDING_OPTIONS.energyLevel.find(o => o.id === data.energy_level)?.label}
${data.special_needs?.length > 0 ? `- Special needs: ${data.special_needs.map(n => BOARDING_OPTIONS.specialNeeds.find(o => o.id === n)?.label).join(', ')}` : ''}
${data.care_notes ? `- Notes: ${data.care_notes}` : ''}

**Preferences:**
${data.accommodation_type ? `- Accommodation: ${BOARDING_OPTIONS.accommodationType.find(o => o.id === data.accommodation_type)?.label}` : ''}
${data.pickup_drop ? `- Pickup/drop: ${BOARDING_OPTIONS.pickupDrop.find(o => o.id === data.pickup_drop)?.label}` : ''}

**Location:** ${data.preferred_area}
${data.home_contact ? `**Emergency Contact:** ${data.home_contact}` : ''}

---
Entry Point: ${entryPoint}
`.trim();

  return {
    member: {
      name: user?.name || user?.email?.split('@')[0] || 'Member',
      email: user?.email || '',
      phone: user?.phone || ''
    },
    category: 'care',
    sub_category: 'boarding_daycare',
    urgency: data.urgency === 'asap' || data.urgency === 'urgent' ? 'high' : 'medium',
    description: description,
    source: 'flow_modal',
    source_reference: entryPoint || 'care_boarding_daycare',
    metadata: {
      ticket_type: 'BOARDING_DAYCARE_REQUEST',
      pillar: 'care',
      sub_pillar: 'boarding_daycare',
      pet_id: pet?.id || pet?._id,
      pet_name: petName,
      service_type: data.service_type,
      dates: {
        start_date: data.start_date,
        end_date: data.end_date,
        daycare_frequency: data.daycare_frequency
      },
      pet_profile: {
        social_preference: data.social_preference,
        energy_level: data.energy_level,
        special_needs: data.special_needs || [],
        care_notes: data.care_notes
      },
      preferences: {
        accommodation_type: data.accommodation_type,
        pickup_drop: data.pickup_drop
      },
      location: data.preferred_area
    }
  };
};

export default BOARDING_DAYCARE_FLOW_SCHEMA;
