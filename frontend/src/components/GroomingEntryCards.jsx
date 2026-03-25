/**
 * GroomingEntryCards.jsx
 * 
 * THREE ENTRY CARDS for Grooming on Care page:
 * 1. At-Home Grooming
 * 2. Salon Grooming  
 * 3. Let Mira Recommend
 * 
 * Each card opens GroomingFlowModal with preselected mode.
 * No prices, no direct booking - all goes to Concierge®.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Building2, Sparkles, ChevronRight, Scissors } from 'lucide-react';
import { Badge } from './ui/badge';

const GroomingEntryCards = ({ 
  petName = 'Your Pet',
  onSelectMode
}) => {
  const cards = [
    {
      id: 'home',
      icon: Home,
      title: 'At-Home Grooming',
      description: 'Groomer comes to you',
      subtext: 'Convenient. Comfortable for anxious pets.',
      gradient: 'from-teal-500 to-cyan-500',
      bgLight: 'bg-teal-50',
      borderColor: 'border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      entryPoint: 'care_grooming_home'
    },
    {
      id: 'salon',
      icon: Building2,
      title: 'Salon Grooming',
      description: 'Visit a grooming salon',
      subtext: 'Professional setup. Full equipment.',
      gradient: 'from-violet-500 to-purple-500',
      bgLight: 'bg-violet-50',
      borderColor: 'border-violet-200',
      hoverBorder: 'hover:border-violet-400',
      entryPoint: 'care_grooming_salon'
    },
    {
      id: 'mira_recommend',
      icon: Sparkles,
      title: 'Let Mira Recommend',
      description: `Best for ${petName}`,
      subtext: 'Based on breed, coat & comfort.',
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      entryPoint: 'care_grooming_mira'
    }
  ];

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6">
          <Badge className="bg-teal-100 text-teal-700 mb-3">
            <Scissors className="w-3 h-3 mr-1.5" />
            Grooming for {petName}
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            How would you like grooming arranged?
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            At-home or salon grooming, arranged around {petName}'s comfort and coat needs.
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                onClick={() => onSelectMode(card.id, card.entryPoint)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 ${card.borderColor} ${card.hoverBorder} 
                  ${card.bgLight} text-left transition-all duration-300
                  hover:shadow-lg group`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${card.gradient} 
                  flex items-center justify-center mb-4 shadow-lg
                  group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {card.description}
                </p>
                <p className="text-xs text-gray-500">
                  {card.subtext}
                </p>

                {/* CTA Arrow */}
                <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full 
                  bg-gradient-to-br ${card.gradient} flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Concierge® Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          All grooming requests are handled by our Concierge® team
        </p>
      </div>
    </div>
  );
};

export default GroomingEntryCards;
