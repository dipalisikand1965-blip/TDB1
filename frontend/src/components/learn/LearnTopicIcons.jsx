/**
 * LearnTopicIcons.jsx
 * Soft, elegant, warm, slightly playful illustrated icons for Learn pillar
 * Icon-led with a lightly illustrated feel - NOT flat generic icons
 */

import React from 'react';

// Topic Icon configurations with soft illustrated style
// These use a combination of emojis and custom SVG backgrounds
export const TOPIC_ICONS = {
  'puppy_basics': {
    emoji: '🐕',
    bgColor: 'bg-gradient-to-br from-pink-100 to-rose-50',
    borderColor: 'border-pink-200',
    label: 'Puppy Basics'
  },
  'breed_guides': {
    emoji: '🐾',
    bgColor: 'bg-gradient-to-br from-blue-100 to-indigo-50',
    borderColor: 'border-blue-200',
    label: 'Breed Guides'
  },
  'food_feeding': {
    emoji: '🥣',
    bgColor: 'bg-gradient-to-br from-orange-100 to-amber-50',
    borderColor: 'border-orange-200',
    label: 'Food & Feeding'
  },
  'grooming': {
    emoji: '✂️',
    bgColor: 'bg-gradient-to-br from-purple-100 to-violet-50',
    borderColor: 'border-purple-200',
    label: 'Grooming'
  },
  'behavior': {
    emoji: '💡',
    bgColor: 'bg-gradient-to-br from-yellow-100 to-amber-50',
    borderColor: 'border-yellow-200',
    label: 'Behavior'
  },
  'training_basics': {
    emoji: '🎾',
    bgColor: 'bg-gradient-to-br from-green-100 to-emerald-50',
    borderColor: 'border-green-200',
    label: 'Training Basics'
  },
  'travel': {
    emoji: '🚗',
    bgColor: 'bg-gradient-to-br from-sky-100 to-blue-50',
    borderColor: 'border-sky-200',
    label: 'Travel with Dogs'
  },
  'senior_care': {
    emoji: '🦮',
    bgColor: 'bg-gradient-to-br from-amber-100 to-orange-50',
    borderColor: 'border-amber-200',
    label: 'Senior Dog Care'
  },
  'health_basics': {
    emoji: '➕',
    bgColor: 'bg-gradient-to-br from-red-100 to-rose-50',
    borderColor: 'border-red-200',
    label: 'Health Basics'
  },
  'rescue_indie': {
    emoji: '🏡',
    bgColor: 'bg-gradient-to-br from-teal-100 to-cyan-50',
    borderColor: 'border-teal-200',
    label: 'Rescue / Indie Care'
  },
  'seasonal_care': {
    emoji: '☀️',
    bgColor: 'bg-gradient-to-br from-yellow-100 to-orange-50',
    borderColor: 'border-yellow-200',
    label: 'Seasonal Care'
  },
  'new_pet_parent': {
    emoji: '💕',
    bgColor: 'bg-gradient-to-br from-pink-100 to-rose-50',
    borderColor: 'border-pink-200',
    label: 'New Pet Parent Guide'
  }
};

// Soft illustrated icon component
export const IllustratedTopicIcon = ({ topicKey, size = 'md', onClick, className = '' }) => {
  const config = TOPIC_ICONS[topicKey] || TOPIC_ICONS['puppy_basics'];
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${config.bgColor}
        ${config.borderColor}
        rounded-2xl border-2
        flex items-center justify-center
        shadow-sm hover:shadow-md
        transition-all duration-200
        hover:scale-105
        ${className}
      `}
    >
      <span className="drop-shadow-sm">{config.emoji}</span>
    </button>
  );
};

// Topic card with icon and label
export const TopicCard = ({ topicKey, onClick, showLabel = true, className = '' }) => {
  const config = TOPIC_ICONS[topicKey] || TOPIC_ICONS['puppy_basics'];
  
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-2xl
        ${config.bgColor}
        ${config.borderColor}
        border-2
        flex flex-col items-center gap-2
        hover:shadow-lg
        transition-all duration-200
        hover:scale-[1.02]
        ${className}
      `}
    >
      <span className="text-3xl drop-shadow-sm">{config.emoji}</span>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 text-center leading-tight">
          {config.label}
        </span>
      )}
    </button>
  );
};

// Personalized tips icons for "Learn for Bruno" section
export const PERSONALIZED_ICONS = {
  'joint_comfort': { emoji: '🦴', label: 'Joint comfort for senior dogs' },
  'heat_care': { emoji: '🌡️', label: 'Heat care for Labradors' },
  'leash_manners': { emoji: '🦮', label: 'Better leash manners' },
  'hydration': { emoji: '💧', label: 'Summer hydration tips' },
  'grooming': { emoji: '✨', label: 'Grooming guide' },
  'nutrition': { emoji: '🥗', label: 'Nutrition guidance' },
  'exercise': { emoji: '🏃', label: 'Exercise routines' },
  'anxiety': { emoji: '💆', label: 'Anxiety support' }
};

// Service icons for "Support that might help" section
export const SERVICE_ICONS = {
  'joint_care': { emoji: '🩺', label: 'Joint Care Consultation', desc: 'Speak to a wellness expert' },
  'senior_routine': { emoji: '📋', label: 'Senior Dog Routine', desc: 'Build a daily plan' },
  'leash_training': { emoji: '🎯', label: 'Training for Leash Manners', desc: 'Find the right trainer' },
  'nutrition': { emoji: '🥕', label: 'Nutrition & Weight', desc: 'Personal diet guide' },
  'physiotherapy': { emoji: '💪', label: 'Physiotherapy', desc: 'Hydrotherapy nearby' },
  'home_comfort': { emoji: '🏠', label: 'Home Comfort Solutions', desc: 'Beds, ramps & more' }
};

// Near Me service icons
export const NEAR_ME_ICONS = {
  'vets': { emoji: '🏥', label: 'Vets Nearby' },
  'trainers': { emoji: '🎓', label: 'Trainers' },
  'physio': { emoji: '💆', label: 'Physio Centers' },
  'pet_stores': { emoji: '🛒', label: 'Pet Stores' },
  'groomers': { emoji: '✂️', label: 'Groomers' },
  'boarding': { emoji: '🏨', label: 'Boarding' }
};

// Daily routine icons
export const ROUTINE_ICONS = {
  'morning': { emoji: '🌅', label: 'Morning', time: '7-9 AM' },
  'midday': { emoji: '☀️', label: 'Midday', time: '12-2 PM' },
  'evening': { emoji: '🌆', label: 'Evening', time: '5-7 PM' },
  'night': { emoji: '🌙', label: 'Night', time: '9-10 PM' }
};

// Concierge® action icons
export const CONCIERGE_ICONS = {
  'build_routine': { emoji: '📅', label: 'Build a routine' },
  'products': { emoji: '🛍️', label: 'Products for {petName}' },
  'find_vet': { emoji: '❤️', label: 'Find a vet' },
  'plan_travel': { emoji: '✈️', label: 'Plan travel' },
  'find_trainer': { emoji: '🎯', label: 'Find a trainer' }
};

export default {
  TOPIC_ICONS,
  IllustratedTopicIcon,
  TopicCard,
  PERSONALIZED_ICONS,
  SERVICE_ICONS,
  NEAR_ME_ICONS,
  ROUTINE_ICONS,
  CONCIERGE_ICONS
};
