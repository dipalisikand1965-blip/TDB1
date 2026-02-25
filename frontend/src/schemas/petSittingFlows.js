/**
 * petSittingFlows.js
 * 
 * PET SITTING FLOW SCHEMA for Mira OS
 * 
 * CONCIERGE-LED: No direct booking, no pricing display
 * All requests create PET_SITTING_REQUEST tickets
 * 
 * Flow: Type → Schedule → Tasks → Pet Info → Location → Review → Concierge
 */

export const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  TEXT: 'text'
};

export const PET_SITTING_OPTIONS = {
  // Service type
  serviceType: [
    { id: 'drop_in', label: 'Drop-in visits', icon: '🚶', desc: 'Sitter visits your home' },
    { id: 'house_sitting', label: 'House sitting', icon: '🏠', desc: 'Sitter stays at your home' },
    { id: 'mira_recommend', label: 'Let Mira Recommend', icon: '✨', desc: 'Based on your pet\'s needs' }
  ],

  // Visit frequency for drop-in
  visitFrequency: [
    { id: 'once_daily', label: 'Once daily' },
    { id: 'twice_daily', label: 'Twice daily' },
    { id: 'three_times', label: 'Three times daily' },
    { id: 'custom', label: 'Custom schedule' }
  ],

  // Tasks needed
  tasks: [
    { id: 'feeding', label: 'Feeding' },
    { id: 'fresh_water', label: 'Fresh water' },
    { id: 'walks', label: 'Walks' },
    { id: 'playtime', label: 'Playtime' },
    { id: 'medications', label: 'Medications' },
    { id: 'litter_box', label: 'Litter box (cats)' },
    { id: 'companionship', label: 'Companionship' },
    { id: 'plant_watering', label: 'Plant watering' },
    { id: 'mail_collection', label: 'Mail collection' }
  ],

  // Pet temperament
  temperament: [
    { id: 'friendly', label: 'Friendly with strangers' },
    { id: 'shy', label: 'Shy, needs time to warm up' },
    { id: 'protective', label: 'Protective of home' },
    { id: 'nervous', label: 'Nervous/anxious' }
  ],

  // Access type
  accessType: [
    { id: 'key_handoff', label: 'Key handoff' },
    { id: 'smart_lock', label: 'Smart lock code' },
    { id: 'hidden_key', label: 'Hidden key' },
    { id: 'doorman', label: 'Building doorman/security' }
  ],

  // Urgency
  urgency: [
    { id: 'planned', label: 'Planned (1+ week away)' },
    { id: 'soon', label: 'Soon (within a week)' },
    { id: 'urgent', label: 'Urgent (next few days)' },
    { id: 'asap', label: 'ASAP' }
  ]
};

export const PET_SITTING_FLOW_SCHEMA = {
  id: 'pet-sitting-request',
  title: 'Pet Sitting for {petName}',
  subtitle: 'Mira will help find trusted care at home',
  ticketType: 'PET_SITTING_REQUEST',
  steps: [
    // Step 1: Service Type
    {
      id: 'type',
      title: 'What type of pet sitting do you need?',
      fields: [
        {
          id: 'service_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Sitting type',
          required: true,
          options: PET_SITTING_OPTIONS.serviceType
        }
      ]
    },
    // Step 2: Schedule
    {
      id: 'schedule',
      title: 'When do you need a sitter?',
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
          label: 'End date',
          required: true,
          placeholder: 'e.g., March 20, 2026'
        },
        {
          id: 'visit_frequency',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Visit frequency',
          required: false,
          showIf: (data) => data.service_type === 'drop_in',
          options: PET_SITTING_OPTIONS.visitFrequency
        },
        {
          id: 'urgency',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Urgency',
          required: true,
          options: PET_SITTING_OPTIONS.urgency
        }
      ]
    },
    // Step 3: Tasks
    {
      id: 'tasks',
      title: 'What does the sitter need to do?',
      fields: [
        {
          id: 'required_tasks',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Tasks needed',
          required: true,
          options: PET_SITTING_OPTIONS.tasks
        },
        {
          id: 'task_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Special instructions (optional)',
          required: false,
          placeholder: 'e.g., Feed at 8am and 6pm, 30-min walks'
        }
      ]
    },
    // Step 4: Pet Info
    {
      id: 'pet_info',
      title: 'Tell us about {petName}',
      fields: [
        {
          id: 'temperament',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Temperament with strangers',
          required: true,
          options: PET_SITTING_OPTIONS.temperament
        },
        {
          id: 'special_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Important notes for sitter',
          required: false,
          placeholder: 'e.g., Scared of loud noises, loves belly rubs'
        }
      ]
    },
    // Step 5: Location & Access
    {
      id: 'location',
      title: 'Home details',
      fields: [
        {
          id: 'address',
          type: FIELD_TYPES.TEXT,
          label: 'Address / Area',
          required: true,
          placeholder: 'e.g., Indiranagar, Bengaluru'
        },
        {
          id: 'access_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'How will sitter access?',
          required: true,
          options: PET_SITTING_OPTIONS.accessType
        },
        {
          id: 'emergency_contact',
          type: FIELD_TYPES.TEXT,
          label: 'Emergency contact',
          required: false,
          placeholder: 'Name & phone'
        }
      ]
    }
  ]
};

// Build ticket payload
export const buildPetSittingTicketPayload = (data, pet, user, entryPoint) => {
  const petName = pet?.name || 'Pet';
  const serviceType = PET_SITTING_OPTIONS.serviceType.find(o => o.id === data.service_type)?.label || data.service_type;
  const tasks = (data.required_tasks || []).map(t => PET_SITTING_OPTIONS.tasks.find(o => o.id === t)?.label).join(', ');
  
  const description = `
**Pet Sitting Request for ${petName}**

**Type:** ${serviceType}
**Dates:** ${data.start_date} to ${data.end_date}
${data.visit_frequency ? `**Visits:** ${PET_SITTING_OPTIONS.visitFrequency.find(o => o.id === data.visit_frequency)?.label}` : ''}
**Urgency:** ${PET_SITTING_OPTIONS.urgency.find(o => o.id === data.urgency)?.label}

**Tasks Needed:** ${tasks}
${data.task_notes ? `**Instructions:** ${data.task_notes}` : ''}

**Pet Temperament:** ${PET_SITTING_OPTIONS.temperament.find(o => o.id === data.temperament)?.label}
${data.special_notes ? `**Notes:** ${data.special_notes}` : ''}

**Location:** ${data.address}
**Access:** ${PET_SITTING_OPTIONS.accessType.find(o => o.id === data.access_type)?.label}
${data.emergency_contact ? `**Emergency Contact:** ${data.emergency_contact}` : ''}

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
    sub_category: 'pet_sitting',
    urgency: data.urgency === 'asap' || data.urgency === 'urgent' ? 'high' : 'medium',
    description: description,
    source: 'flow_modal',
    source_reference: entryPoint || 'care_pet_sitting',
    metadata: {
      ticket_type: 'PET_SITTING_REQUEST',
      pillar: 'care',
      sub_pillar: 'pet_sitting',
      pet_id: pet?.id || pet?._id,
      pet_name: petName,
      service_type: data.service_type,
      schedule: {
        start_date: data.start_date,
        end_date: data.end_date,
        visit_frequency: data.visit_frequency
      },
      tasks: {
        required_tasks: data.required_tasks || [],
        task_notes: data.task_notes
      },
      pet_info: {
        temperament: data.temperament,
        special_notes: data.special_notes
      },
      location: {
        address: data.address,
        access_type: data.access_type,
        emergency_contact: data.emergency_contact
      }
    }
  };
};

export default PET_SITTING_FLOW_SCHEMA;
