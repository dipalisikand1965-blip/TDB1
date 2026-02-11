/**
 * ConciergeServiceStrip.jsx
 * 
 * Primary service strip with 10 expandable categories:
 * Grooming, Training, Vet Care, Boarding, Daycare, Dog Walking, Travel, Celebrate, Emergency, Advisory
 * 
 * When clicked, each category expands to show sub-services
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, GraduationCap, Stethoscope, Home, Sun, 
  PawPrint, Plane, PartyPopper, AlertTriangle, Brain,
  ChevronDown, X, Sparkles
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// Primary service categories (always visible)
const SERVICE_CATEGORIES = [
  {
    id: 'grooming',
    name: 'Grooming',
    emoji: '✂️',
    icon: Scissors,
    gradient: 'from-cyan-500 to-teal-500',
    subServices: [
      { id: 'full_grooming', name: 'Full Grooming', emoji: '✂️' },
      { id: 'bath_brush', name: 'Bath & Brush', emoji: '🛁' },
      { id: 'nail_trim', name: 'Nail Trim', emoji: '💅' },
      { id: 'skin_coat', name: 'Skin & Coat Care', emoji: '🧴' }
    ]
  },
  {
    id: 'training',
    name: 'Training',
    emoji: '🎓',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-500',
    subServices: [
      { id: 'basic_obedience', name: 'Basic Obedience', emoji: '🎓' },
      { id: 'puppy_training', name: 'Puppy Training', emoji: '🐕' },
      { id: 'behaviour_consult', name: 'Behaviour Consult', emoji: '🧠' },
      { id: 'leash_reactivity', name: 'Leash Reactivity', emoji: '🦮' }
    ]
  },
  {
    id: 'vet_care',
    name: 'Vet Care',
    emoji: '🏥',
    icon: Stethoscope,
    gradient: 'from-pink-500 to-rose-500',
    subServices: [
      { id: 'wellness_checkup', name: 'Wellness Checkup', emoji: '🩺' },
      { id: 'dental_care', name: 'Dental Care', emoji: '🦷' },
      { id: 'second_opinion', name: 'Second Opinion', emoji: '🔍' },
      { id: 'nutrition_consult', name: 'Nutrition Consult', emoji: '🥗' },
      { id: 'health_tracking', name: 'Health Tracking', emoji: '📊' }
    ]
  },
  {
    id: 'boarding',
    name: 'Boarding',
    emoji: '🏠',
    icon: Home,
    gradient: 'from-green-500 to-emerald-500',
    subServices: [
      { id: 'overnight_boarding', name: 'Overnight Stay', emoji: '🏠' },
      { id: 'home_boarding', name: 'Home Boarding', emoji: '🏡' },
      { id: 'long_term_care', name: 'Long-Term Care', emoji: '📅' }
    ]
  },
  {
    id: 'daycare',
    name: 'Daycare',
    emoji: '🌞',
    icon: Sun,
    gradient: 'from-amber-500 to-yellow-500',
    subServices: [
      { id: 'full_day', name: 'Full Day', emoji: '🌞' },
      { id: 'half_day', name: 'Half Day', emoji: '⏰' },
      { id: 'enrichment_day', name: 'Enrichment Day', emoji: '🧩' }
    ]
  },
  {
    id: 'dog_walking',
    name: 'Walking',
    emoji: '🐕',
    icon: PawPrint,
    gradient: 'from-blue-500 to-sky-500',
    subServices: [
      { id: 'daily_walk', name: 'Daily Walk', emoji: '🐕' },
      { id: 'group_walk', name: 'Group Walk', emoji: '🐕‍🦺' },
      { id: 'private_walk', name: 'Private Walk', emoji: '🦮' },
      { id: 'adventure_walk', name: 'Adventure Walk', emoji: '🏞️' }
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    emoji: '✈️',
    icon: Plane,
    gradient: 'from-sky-500 to-blue-500',
    subServices: [
      { id: 'travel_planning', name: 'Travel Planning', emoji: '✈️' },
      { id: 'pet_transport', name: 'Pet Transport', emoji: '🚗' },
      { id: 'stay_curation', name: 'Stay Curation', emoji: '🏨' },
      { id: 'travel_docs', name: 'Travel Docs', emoji: '📋' },
      { id: 'international_papers', name: 'International Papers', emoji: '🛂' }
    ]
  },
  {
    id: 'celebrate',
    name: 'Celebrate',
    emoji: '🎉',
    icon: PartyPopper,
    gradient: 'from-pink-500 to-purple-500',
    subServices: [
      { id: 'birthday_planning', name: 'Birthday Party', emoji: '🎉' },
      { id: 'custom_cake', name: 'Custom Cake', emoji: '🎂' },
      { id: 'gift_sourcing', name: 'Gift Sourcing', emoji: '🎁' },
      { id: 'event_setup', name: 'Event Setup', emoji: '🎈' },
      { id: 'milestone_shoot', name: 'Photo Shoot', emoji: '📸' }
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency',
    emoji: '🚨',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-orange-500',
    subServices: [
      { id: 'emergency_vet', name: '24/7 Vet Routing', emoji: '🚨' },
      { id: 'emergency_transport', name: 'Emergency Transport', emoji: '🚑' },
      { id: 'emergency_kit', name: 'Go-Bag Setup', emoji: '🧳' },
      { id: 'emergency_care_plan', name: 'Care Plan', emoji: '📋' }
    ]
  },
  {
    id: 'advisory',
    name: 'Advisory',
    emoji: '🧠',
    icon: Brain,
    gradient: 'from-indigo-500 to-purple-500',
    subServices: [
      { id: 'second_opinion', name: 'Second Opinion', emoji: '🔍' },
      { id: 'behaviour_consult', name: 'Behaviour Consult', emoji: '🧠' },
      { id: 'nutrition_consult', name: 'Nutrition Consult', emoji: '🥗' },
      { id: 'senior_care', name: 'Senior Care', emoji: '🌅' },
      { id: 'adoption_guidance', name: 'Adoption Help', emoji: '🐶' },
      { id: 'hospice', name: 'Hospice Support', emoji: '💜' }
    ]
  }
];

/**
 * Service Category Button
 */
const ServiceCategoryButton = ({ category, isActive, onClick }) => {
  const Icon = category.icon;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
        ${isActive 
          ? `bg-gradient-to-br ${category.gradient} text-white shadow-lg` 
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }
      `}
    >
      <span className="text-xl">{category.emoji}</span>
      <span className="text-xs font-medium whitespace-nowrap">{category.name}</span>
    </motion.button>
  );
};

/**
 * Sub-service pill button
 */
const SubServicePill = ({ service, onSelect }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        hapticFeedback.buttonTap();
        onSelect(service);
      }}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 
                 rounded-full text-sm text-white border border-gray-700 transition-all"
    >
      <span>{service.emoji}</span>
      <span>{service.name}</span>
    </motion.button>
  );
};

/**
 * Main ConciergeServiceStrip Component
 */
const ConciergeServiceStrip = ({ 
  onServiceSelect,
  petName = 'your pet' 
}) => {
  const [activeCategory, setActiveCategory] = useState(null);
  
  const handleCategoryClick = (category) => {
    hapticFeedback.buttonTap();
    setActiveCategory(prev => prev?.id === category.id ? null : category);
  };
  
  const handleSubServiceSelect = (service) => {
    hapticFeedback.success();
    onServiceSelect?.({
      category: activeCategory,
      service: service,
      petName: petName
    });
    setActiveCategory(null);
  };
  
  return (
    <div className="w-full">
      {/* Primary Category Strip */}
      <div className="flex gap-2 overflow-x-auto py-3 px-1 scrollbar-hide"
           style={{ WebkitOverflowScrolling: 'touch' }}>
        {SERVICE_CATEGORIES.map((category) => (
          <ServiceCategoryButton
            key={category.id}
            category={category}
            isActive={activeCategory?.id === category.id}
            onClick={() => handleCategoryClick(category)}
          />
        ))}
      </div>
      
      {/* Expanded Sub-services */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-900/80 rounded-2xl p-4 mt-2 border border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeCategory.emoji}</span>
                  <span className="font-semibold text-white">{activeCategory.name}</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    for {petName}
                  </span>
                </div>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Sub-services grid */}
              <div className="flex flex-wrap gap-2">
                {activeCategory.subServices.map((service) => (
                  <SubServicePill
                    key={service.id}
                    service={service}
                    onSelect={handleSubServiceSelect}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConciergeServiceStrip;
