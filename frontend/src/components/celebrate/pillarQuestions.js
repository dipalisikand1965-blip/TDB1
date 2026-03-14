/**
 * pillarQuestions.js
 * 4-6 soul questions per celebrate pillar.
 * Used in PillarSoulModal — answers update doggy_soul_answers
 * and feed Mira's memory (learned_facts).
 *
 * Question types:
 *   single_select  — one option (radio)
 *   multi_select   — multiple options (chips)
 *   text_input     — free text
 */

export const PILLAR_QUESTIONS = {

  food: [
    {
      id: 'favorite_treats',
      question: 'What flavours does {petName} go absolutely wild for?',
      type: 'multi_select',
      options: ['Salmon', 'Chicken', 'Beef', 'Peanut Butter', 'Banana', 'Cheese', 'Lamb', 'Duck'],
      soul_field: 'favorite_treats',
      icon: '🍗',
    },
    {
      id: 'food_allergies',
      question: 'Any food allergies or sensitivities we should know?',
      type: 'multi_select',
      options: ['Chicken', 'Beef', 'Wheat', 'Dairy', 'Soy', 'Corn', 'Egg'],
      none_option: 'No known allergies',
      soul_field: 'food_allergies',
      icon: '🛡️',
    },
    {
      id: 'meal_preference',
      question: 'How does {petName} prefer their food?',
      type: 'single_select',
      options: ['Wet food lover', 'Dry kibble devotee', 'Raw diet', 'Mix of both', 'Will eat anything'],
      soul_field: 'meal_preference',
      icon: '🍽️',
    },
    {
      id: 'birthday_feast_style',
      question: 'For the birthday feast — what would make {petName} the happiest?',
      type: 'single_select',
      options: ['A BIG cake — show stopper', 'Small & personal cake', 'Lots of small treats', 'A full birthday meal'],
      soul_field: 'birthday_feast_style',
      icon: '🎂',
    },
  ],

  play: [
    {
      id: 'toy_preferences',
      question: 'What kind of toys does {petName} love most?',
      type: 'multi_select',
      options: ['Squeaky toys', 'Tug rope', 'Fetch balls', 'Puzzle feeders', 'Plush toys', 'Chew toys', 'Frisbee'],
      soul_field: 'toy_preferences',
      icon: '🎾',
    },
    {
      id: 'energy_level',
      question: "What's {petName}'s energy level like?",
      type: 'single_select',
      options: ['Always ON — never stops', 'High energy, great napper', 'Moderate — balanced', 'Calm & gentle', 'Senior & low-key'],
      soul_field: 'energy_level',
      icon: '⚡',
    },
    {
      id: 'play_duration',
      question: 'How long does {petName} like to play at a stretch?',
      type: 'single_select',
      options: ['5-10 mins max', '20-30 mins', '30-60 mins', '1+ hours please'],
      soul_field: 'play_duration',
      icon: '⏱️',
    },
    {
      id: 'play_style',
      question: 'How does {petName} play best?',
      type: 'single_select',
      options: ['Solo explorer', 'With their human', 'With dog friends', 'All of the above'],
      soul_field: 'play_style',
      icon: '🤝',
    },
  ],

  social: [
    {
      id: 'social_level',
      question: 'Does {petName} have dog friends they love?',
      type: 'single_select',
      options: ['Yes — BFFs they see often', 'Yes — casual meetups', 'Just a couple', 'Not a social butterfly'],
      soul_field: 'social_level',
      icon: '🦋',
    },
    {
      id: 'pet_friends',
      question: "What are their dog friends' names? (Mira remembers all of them)",
      type: 'text_input',
      placeholder: 'Bruno, Cookie, Simba... (separate with commas)',
      soul_field: 'pet_friends',
      icon: '💌',
      transform: 'comma_to_array',
    },
    {
      id: 'party_preference',
      question: "What's {petName}'s ideal birthday party vibe?",
      type: 'single_select',
      options: ['Big pawty — all the dogs', 'Intimate — 2-3 close friends', 'Family-only celebration', 'Solo celebration with you'],
      soul_field: 'party_preference',
      icon: '🎊',
    },
    {
      id: 'meetup_frequency',
      question: 'How often does {petName} meet their friends?',
      type: 'single_select',
      options: ['Daily or near-daily', 'Few times a week', 'Weekly', 'Monthly', 'Rarely'],
      soul_field: 'meetup_frequency',
      icon: '📅',
    },
  ],

  adventure: [
    {
      id: 'favorite_activities',
      question: 'What outdoor adventures does {petName} live for?',
      type: 'multi_select',
      options: ['Morning walks', 'Trail hikes', 'Beach runs', 'City exploring', 'Dog park', 'Car rides', 'Swimming'],
      soul_field: 'favorite_activities',
      icon: '🌅',
    },
    {
      id: 'preferred_walk_duration',
      question: 'How far does {petName} love to go?',
      type: 'single_select',
      options: ['Short stroll (20 mins)', 'Medium walk (30-45 mins)', 'Long walk (1 hour)', 'Half-day hiker'],
      soul_field: 'preferred_walk_duration',
      icon: '🗺️',
    },
    {
      id: 'adventure_frequency',
      question: 'How often does {petName} go on outdoor adventures?',
      type: 'single_select',
      options: ['Every day', 'Most days', '3-4 times a week', 'Weekends mostly'],
      soul_field: 'adventure_frequency',
      icon: '📆',
    },
    {
      id: 'city',
      question: 'Which city do you adventure in? (Helps Mira suggest venues and trails)',
      type: 'text_input',
      placeholder: 'e.g. Bengaluru, Mumbai, Goa...',
      soul_field: 'city',
      icon: '📍',
    },
  ],

  grooming: [
    {
      id: 'groom_frequency',
      question: 'How often does {petName} get groomed?',
      type: 'single_select',
      options: ['Weekly spa day', 'Every 2-3 weeks', 'Monthly', 'Every couple months', 'As needed'],
      soul_field: 'groom_frequency',
      icon: '✂️',
    },
    {
      id: 'bath_reaction',
      question: 'How does {petName} feel about bath time?',
      type: 'single_select',
      options: ['Loves it — pure joy', 'Tolerates it fine', 'Not a fan but accepts', 'Full drama every time'],
      soul_field: 'bath_reaction',
      icon: '🛁',
    },
    {
      id: 'grooming_preference',
      question: "For their birthday look — what style does {petName} love?",
      type: 'single_select',
      options: ['Full spa — the works', 'Clean bath + blow-dry', 'Trim + basic clean', 'The natural look'],
      soul_field: 'grooming_preference',
      icon: '💅',
    },
    {
      id: 'accessory_preference',
      question: 'What accessories does {petName} look stunning in?',
      type: 'multi_select',
      options: ['Bandanas', 'Satin bows', 'Fancy collars', 'Birthday crown', 'Nothing — natural beauty'],
      soul_field: 'accessory_preference',
      icon: '🎀',
    },
  ],

  learning: [
    {
      id: 'known_tricks',
      question: 'What tricks does {petName} already know?',
      type: 'multi_select',
      options: ['Sit', 'Stay', 'Paw', 'Roll over', 'Fetch', 'Spin', 'Many advanced tricks', 'Working on basics'],
      soul_field: 'known_tricks',
      icon: '🎓',
    },
    {
      id: 'learning_speed',
      question: 'How quickly does {petName} pick up new things?',
      type: 'single_select',
      options: ['One-session wonder', 'Quick learner (2-3 tries)', 'Steady and sure', 'Takes time but always gets there'],
      soul_field: 'learning_speed',
      icon: '⚡',
    },
    {
      id: 'learning_motivation',
      question: "What motivates {petName} to learn?",
      type: 'single_select',
      options: ['Food treats — essential', 'Praise & love', 'Play as reward', 'Mix of all three'],
      soul_field: 'learning_motivation',
      icon: '🏆',
    },
    {
      id: 'challenge_preference',
      question: 'What challenge level does {petName} need for mental enrichment?',
      type: 'single_select',
      options: ['Beginner puzzles', 'Intermediate challenges', 'Advanced brain games', 'Maximum difficulty please'],
      soul_field: 'challenge_preference',
      icon: '🧩',
    },
  ],

  health: [
    {
      id: 'health_conditions',
      question: 'Does {petName} have any health conditions we should know about?',
      type: 'multi_select',
      options: ['Joint issues', 'Skin allergies', 'Digestive sensitivity', 'Heart condition', 'Anxiety', 'Dental issues', 'Vision/hearing'],
      none_option: 'Perfectly healthy',
      soul_field: 'health_conditions',
      icon: '💚',
    },
    {
      id: 'health_goals',
      question: "What aspects of {petName}'s health are you focused on for their birthday?",
      type: 'multi_select',
      options: ['Joint health', 'Gut health', 'Coat & skin', 'Immunity', 'Dental health', 'Calming & anxiety', 'Anti-ageing'],
      soul_field: 'health_goals',
      icon: '🌿',
    },
    {
      id: 'diet_type',
      question: "What's {petName}'s primary diet?",
      type: 'single_select',
      options: ['Kibble', 'Wet food', 'Raw/BARF', 'Home-cooked', 'Mix of above'],
      soul_field: 'diet_type',
      icon: '🥗',
    },
    {
      id: 'vet_frequency',
      question: 'How often does {petName} see the vet?',
      type: 'single_select',
      options: ['Every 6 months', 'Annually', 'Only when needed', 'Regularly for conditions'],
      soul_field: 'vet_frequency',
      icon: '🏥',
    },
  ],

  memory: [
    {
      id: 'memory_preference',
      question: 'How do you love to preserve {petName}\'s memories?',
      type: 'multi_select',
      options: ['Photos everywhere', 'Videos', 'Printed albums', 'Framed art', 'Digital only', 'Want to start now'],
      soul_field: 'memory_preference',
      icon: '📸',
    },
    {
      id: 'photoshoot_interest',
      question: 'Would you love a professional birthday photoshoot for {petName}?',
      type: 'single_select',
      options: ["Absolutely — let's plan it", 'Would love it — help me decide', 'Maybe later', 'Prefer DIY photos'],
      soul_field: 'photoshoot_interest',
      icon: '🎬',
    },
    {
      id: 'legacy_preference',
      question: 'What keepsake would mean the most for {petName}\'s birthday?',
      type: 'multi_select',
      options: ['Framed portrait', 'Memory book', 'Custom calendar', 'Paw print art', 'Soul story by Mira', 'Canvas painting'],
      soul_field: 'legacy_preference',
      icon: '🖼️',
    },
    {
      id: 'birthday_wish',
      question: 'One thing that would make this birthday perfect for {petName}?',
      type: 'text_input',
      placeholder: 'Tell Mira anything — she remembers everything...',
      soul_field: 'birthday_wish',
      icon: '✨',
    },
  ],
};

/**
 * Builds a human-readable Mira memory fact from a question + answer
 */
export const buildLearnedFact = (pillarName, question, answer, petName) => {
  const q = question.question.replace(/{petName}/g, petName);
  const a = Array.isArray(answer) ? answer.join(', ') : answer;
  return `[${pillarName}] ${q} → ${a}`;
};

/**
 * Transforms comma-separated string to array for pet_friends etc.
 */
export const transformAnswer = (question, rawAnswer) => {
  if (question.transform === 'comma_to_array' && typeof rawAnswer === 'string') {
    return rawAnswer.split(',').map(s => s.trim()).filter(Boolean);
  }
  return rawAnswer;
};
