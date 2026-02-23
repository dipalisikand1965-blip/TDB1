/**
 * freshMealsFlows.js
 * 
 * SINGLE SOURCE OF TRUTH for Fresh Meals FlowModal schemas
 * 
 * GUARDRAILS:
 * - Each schema has MAX 5 steps
 * - Canonical card IDs must match EXACTLY
 * - Constraints (blocked proteins) enforced at schema level
 * - Draft/resume uses localStorage keyed by: draft:${userId}:${petId}:fresh-meals
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CANONICAL CARD IDs - Must match MealsPage.jsx
// ═══════════════════════════════════════════════════════════════════════════════
export const CANONICAL_CARD_IDS = {
  TRIAL_PACK: 'fresh-trial-pack',
  WEEKLY_PLAN: 'fresh-weekly-plan',
  ALLERGY_SAFE: 'fresh-allergy-safe'
};

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
// SHARED OPTIONS - Used across multiple schemas
// ═══════════════════════════════════════════════════════════════════════════════
export const SHARED_OPTIONS = {
  petSize: [
    { id: 'small', label: 'Small (< 10kg)', value: 'small' },
    { id: 'medium', label: 'Medium (10-25kg)', value: 'medium' },
    { id: 'large', label: 'Large (25kg+)', value: 'large' }
  ],
  goals: [
    { id: 'tummy', label: 'Tummy health' },
    { id: 'weight', label: 'Weight management' },
    { id: 'energy', label: 'Energy & vitality' },
    { id: 'coat', label: 'Skin & coat' },
    { id: 'picky', label: 'Picky eater' }
  ],
  proteins: [
    { id: 'chicken', label: 'Chicken' },
    { id: 'fish', label: 'Fish' },
    { id: 'mutton', label: 'Mutton' },
    { id: 'veg', label: 'Vegetarian' }
  ],
  mealsPerDay: [
    { id: '1', label: '1 meal/day', value: 1 },
    { id: '2', label: '2 meals/day', value: 2 },
    { id: '3', label: '3 meals/day', value: 3 }
  ],
  budgetBand: [
    { id: 'budget', label: '₹ Budget-friendly', value: 1 },
    { id: 'mid', label: '₹₹ Mid-range', value: 2 },
    { id: 'premium', label: '₹₹₹ Premium', value: 3 }
  ],
  deliveryWindow: [
    { id: 'morning', label: 'Morning (8am-12pm)' },
    { id: 'afternoon', label: 'Afternoon (12pm-5pm)' },
    { id: 'evening', label: 'Evening (5pm-9pm)' }
  ],
  cadence: [
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: '2x per week' },
    { id: 'monthly', label: 'Monthly' }
  ],
  portionMethod: [
    { id: 'calculate', label: 'Calculate for me (based on weight & activity)' },
    { id: 'manual', label: 'I know how much my pet needs (grams)' }
  ],
  storageReality: [
    { id: 'freezer', label: 'I have freezer space' },
    { id: 'fridge_only', label: 'Fridge only (no freezer)' },
    { id: 'limited', label: 'Limited space - smaller batches' }
  ],
  severityLevel: [
    { id: 'mild', label: 'Mild (slight discomfort)' },
    { id: 'moderate', label: 'Moderate (digestive issues)' },
    { id: 'severe', label: 'Severe (vet intervention needed)' }
  ],
  pastReactions: [
    { id: 'itching', label: 'Itching/scratching' },
    { id: 'vomiting', label: 'Vomiting' },
    { id: 'diarrhea', label: 'Diarrhea' },
    { id: 'ear_infection', label: 'Ear infections' },
    { id: 'skin_rash', label: 'Skin rash/hives' },
    { id: 'none', label: 'None of the above' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRIAL PACK SCHEMA (5 steps)
// ═══════════════════════════════════════════════════════════════════════════════
export const TRIAL_PACK_SCHEMA = {
  id: CANONICAL_CARD_IDS.TRIAL_PACK,
  title: 'Start Fresh Trial Pack',
  ticketType: 'FRESH_MEALS_TRIAL_PACK',
  steps: [
    {
      id: 'size_weight',
      title: 'Pet Size',
      subtitle: 'Help us portion correctly',
      fields: [
        {
          id: 'pet_size',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'What size is {petName}?',
          options: SHARED_OPTIONS.petSize,
          prefillPath: 'pet.size',
          required: true
        },
        {
          id: 'exact_weight',
          type: FIELD_TYPES.NUMBER,
          label: 'Exact weight (kg) if known',
          placeholder: 'e.g., 12.5',
          prefillPath: 'pet.weight',
          required: false
        }
      ]
    },
    {
      id: 'primary_goal',
      title: 'Primary Goal',
      subtitle: 'What should this trial focus on?',
      fields: [
        {
          id: 'goal',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Main health goal',
          options: SHARED_OPTIONS.goals,
          prefillPath: 'planBuilder.goals[0]',
          required: true
        }
      ]
    },
    {
      id: 'confirm_allergies',
      title: 'Confirm Allergies',
      subtitle: 'We\'ll avoid these completely',
      fields: [
        {
          id: 'allergies',
          type: FIELD_TYPES.CONFIRM_LIST,
          label: 'Known allergies/sensitivities',
          prefillPath: 'pet.allergies',
          allowAdd: true,
          required: false
        },
        {
          id: 'proteins_allowed',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Proteins {petName} CAN eat',
          options: SHARED_OPTIONS.proteins,
          respectAvoidList: true, // KEY: Blocked proteins disabled
          required: true
        }
      ]
    },
    {
      id: 'meals_frequency',
      title: 'Meal Frequency',
      subtitle: 'How often does {petName} eat?',
      fields: [
        {
          id: 'meals_per_day',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Meals per day',
          options: SHARED_OPTIONS.mealsPerDay,
          prefillPath: 'pet.mealsPerDay',
          required: true
        }
      ]
    },
    {
      id: 'budget_delivery',
      title: 'Budget & Delivery',
      subtitle: 'Final details',
      fields: [
        {
          id: 'budget',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Budget preference',
          options: SHARED_OPTIONS.budgetBand,
          prefillPath: 'planBuilder.budget',
          required: true
        },
        {
          id: 'delivery_window',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Preferred delivery time',
          options: SHARED_OPTIONS.deliveryWindow,
          required: false
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY PLAN SCHEMA (5 steps)
// ═══════════════════════════════════════════════════════════════════════════════
export const WEEKLY_PLAN_SCHEMA = {
  id: CANONICAL_CARD_IDS.WEEKLY_PLAN,
  title: 'Build Weekly Fresh Plan',
  ticketType: 'FRESH_MEALS_WEEKLY_PLAN',
  steps: [
    {
      id: 'plan_type',
      title: 'Plan Type',
      subtitle: 'Fresh only or mixed?',
      fields: [
        {
          id: 'meal_type',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'What kind of plan?',
          options: [
            { id: 'fresh_only', label: '100% Fresh meals' },
            { id: 'mixed', label: 'Mixed with kibble/dry food' }
          ],
          required: true
        }
      ]
    },
    {
      id: 'portion_method',
      title: 'Portion Calculation',
      subtitle: 'How should we size portions?',
      fields: [
        {
          id: 'portion_method',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Portion method',
          options: SHARED_OPTIONS.portionMethod,
          required: true
        },
        {
          id: 'manual_grams',
          type: FIELD_TYPES.NUMBER,
          label: 'Grams per meal (if you know)',
          placeholder: 'e.g., 200',
          showIf: { field: 'portion_method', value: 'manual' },
          required: false
        }
      ]
    },
    {
      id: 'cadence',
      title: 'Delivery Cadence',
      subtitle: 'How often should we deliver?',
      fields: [
        {
          id: 'cadence',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Delivery frequency',
          options: SHARED_OPTIONS.cadence,
          prefillPath: 'planBuilder.cadence',
          required: true
        }
      ]
    },
    {
      id: 'storage',
      title: 'Storage Reality',
      subtitle: 'Helps us plan batch sizes',
      fields: [
        {
          id: 'storage',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Your storage situation',
          options: SHARED_OPTIONS.storageReality,
          required: true
        }
      ]
    },
    {
      id: 'budget_confirm',
      title: 'Budget Band',
      subtitle: 'Almost done!',
      fields: [
        {
          id: 'budget',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Budget preference',
          options: SHARED_OPTIONS.budgetBand,
          prefillPath: 'planBuilder.budget',
          required: true
        },
        {
          id: 'special_notes',
          type: FIELD_TYPES.TEXT,
          label: 'Any special instructions?',
          placeholder: 'e.g., ring doorbell twice',
          required: false
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALLERGY-SAFE SCHEMA (5 steps)
// ═══════════════════════════════════════════════════════════════════════════════
export const ALLERGY_SAFE_SCHEMA = {
  id: CANONICAL_CARD_IDS.ALLERGY_SAFE,
  title: 'Allergy-Safe Fresh Plan',
  ticketType: 'FRESH_MEALS_ALLERGY_SAFE',
  steps: [
    {
      id: 'confirm_allergens',
      title: 'Confirm Allergen List',
      subtitle: 'Critical for {petName}\'s safety',
      fields: [
        {
          id: 'allergens',
          type: FIELD_TYPES.CONFIRM_LIST,
          label: 'Confirmed allergens/sensitivities',
          prefillPath: 'pet.allergies',
          allowAdd: true,
          required: true
        },
        {
          id: 'severity',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Severity level',
          options: SHARED_OPTIONS.severityLevel,
          required: true
        }
      ]
    },
    {
      id: 'allowed_proteins',
      title: 'Allowed Proteins',
      subtitle: 'Only safe options will be used',
      fields: [
        {
          id: 'proteins_allowed',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Proteins that are SAFE for {petName}',
          options: SHARED_OPTIONS.proteins,
          respectAvoidList: true, // KEY: Blocked proteins disabled
          required: true
        }
      ]
    },
    {
      id: 'past_reactions',
      title: 'Past Reactions',
      subtitle: 'Helps our kitchen team understand',
      fields: [
        {
          id: 'reactions',
          type: FIELD_TYPES.MULTI_SELECT,
          label: 'Has {petName} experienced any of these?',
          options: SHARED_OPTIONS.pastReactions,
          required: false
        }
      ]
    },
    {
      id: 'treats_question',
      title: 'Treats Allowed?',
      subtitle: 'Should we include safe treats?',
      fields: [
        {
          id: 'treats_allowed',
          type: FIELD_TYPES.TOGGLE,
          label: 'Include allergy-safe treats in plan?',
          defaultValue: true,
          required: true
        }
      ]
    },
    {
      id: 'budget_cadence',
      title: 'Budget & Cadence',
      subtitle: 'Final details',
      fields: [
        {
          id: 'budget',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Budget preference',
          options: SHARED_OPTIONS.budgetBand,
          prefillPath: 'planBuilder.budget',
          required: true
        },
        {
          id: 'cadence',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Delivery cadence',
          options: SHARED_OPTIONS.cadence,
          prefillPath: 'planBuilder.cadence',
          required: true
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA MAP - For easy lookup by card ID
// ═══════════════════════════════════════════════════════════════════════════════
export const FLOW_SCHEMAS = {
  [CANONICAL_CARD_IDS.TRIAL_PACK]: TRIAL_PACK_SCHEMA,
  [CANONICAL_CARD_IDS.WEEKLY_PLAN]: WEEKLY_PLAN_SCHEMA,
  [CANONICAL_CARD_IDS.ALLERGY_SAFE]: ALLERGY_SAFE_SCHEMA
};

// ═══════════════════════════════════════════════════════════════════════════════
// PREFILL RESOLVER - Resolves prefillPath to actual values
// ═══════════════════════════════════════════════════════════════════════════════
export const resolvePrefill = (path, pet, planBuilder, draft) => {
  if (!path) return undefined;
  
  // If draft has this field and user edited it, use draft value (don't overwrite)
  const draftValue = draft?.answers?.[path.split('.').pop()];
  if (draftValue !== undefined && draft?.edited?.includes(path.split('.').pop())) {
    return draftValue;
  }
  
  // Otherwise, resolve from source data
  const parts = path.split('.');
  const source = parts[0];
  const field = parts.slice(1).join('.');
  
  let value;
  
  switch (source) {
    case 'pet':
      value = getNestedValue(pet, field);
      // Handle soul_data fallback for allergies
      if (field === 'allergies' && (!value || value.length === 0)) {
        value = pet?.soul_data?.allergies || [];
      }
      break;
    case 'planBuilder':
      value = getNestedValue(planBuilder, field);
      break;
    default:
      value = undefined;
  }
  
  return value;
};

// Helper to get nested value from object
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  
  // Handle array notation like goals[0]
  const arrayMatch = path.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const [, arrayName, index] = arrayMatch;
    return obj[arrayName]?.[parseInt(index)];
  }
  
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// ═══════════════════════════════════════════════════════════════════════════════
// DRAFT STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
export const getDraftKey = (userId, petId, tab = 'fresh-meals') => {
  return `draft:${userId}:${petId}:${tab}`;
};

export const saveDraft = (userId, petId, cardId, stepIndex, answers, edited = []) => {
  const key = getDraftKey(userId, petId);
  const draft = {
    cardId,
    stepIndex,
    answers,
    edited, // Fields user manually edited (don't overwrite with prefill)
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch (e) {
    console.error('[FlowModal] Failed to save draft:', e);
    return false;
  }
};

export const loadDraft = (userId, petId) => {
  const key = getDraftKey(userId, petId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[FlowModal] Failed to load draft:', e);
  }
  return null;
};

export const clearDraft = (userId, petId) => {
  const key = getDraftKey(userId, petId);
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('[FlowModal] Failed to clear draft:', e);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TICKET PAYLOAD BUILDER - Uniform structure for all flows
// ═══════════════════════════════════════════════════════════════════════════════
export const buildTicketPayload = ({
  schema,
  pet,
  planBuilder,
  flowAnswers,
  draftId,
  entryPoint,
  constraintsApplied = []
}) => {
  return {
    // Required fields
    type: schema.ticketType,
    pillar: 'dine',
    sub_pillar: 'fresh_meals',
    card_id: schema.id,
    draft_id: draftId,
    pet_id: pet?.id,
    
    // Context
    context_source: 'dine/fresh-meals',
    entry_point: entryPoint || 'card_cta',
    
    // Data
    plan_builder: {
      goals: planBuilder?.goals || [],
      protein: planBuilder?.protein,
      allergySafe: planBuilder?.allergySafe || false,
      cadence: planBuilder?.cadence,
      budget: planBuilder?.budget
    },
    flow_answers: flowAnswers,
    
    // Metadata
    constraints_applied: constraintsApplied,
    metadata: {
      pet_name: pet?.name,
      pet_breed: pet?.breed,
      pet_weight: pet?.weight,
      allergies: pet?.allergies || pet?.soul_data?.allergies || [],
      schema_id: schema.id,
      schema_title: schema.title
    },
    
    // Priority
    priority: constraintsApplied.length > 0 ? 'high' : 'medium',
    intent: 'fresh_meal_plan'
  };
};

export default {
  CANONICAL_CARD_IDS,
  FLOW_SCHEMAS,
  TRIAL_PACK_SCHEMA,
  WEEKLY_PLAN_SCHEMA,
  ALLERGY_SAFE_SCHEMA,
  resolvePrefill,
  saveDraft,
  loadDraft,
  clearDraft,
  buildTicketPayload,
  getDraftKey
};
