/**
 * SupportForPet.jsx
 * "Support that might help Bruno" - Services section
 * Bridges learning → real help with personalized service recommendations
 */

import React from 'react';
import { Card } from '../ui/card';
import { ChevronRight } from 'lucide-react';

// Service recommendations based on pet profile
const getServiceRecommendations = (pet) => {
  const isSenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  const breed = pet?.breed?.toLowerCase() || '';
  const petName = pet?.name || 'Your Pet';
  
  // Senior dog services
  if (isSenior) {
    return [
      {
        id: 'joint_care',
        icon: '🩺',
        iconBg: 'bg-rose-100',
        title: 'Joint Care Consultation',
        desc: 'Speak to a vet or pet wellness expert about joint comfort, mobility and ageing support.',
        type: 'consultation'
      },
      {
        id: 'senior_routine',
        icon: '📋',
        iconBg: 'bg-blue-100',
        title: 'Senior Dog Routine Guidance',
        desc: `Help building the right daily routine for older ${breed || 'dogs'}.`,
        type: 'guidance'
      },
      {
        id: 'leash_training',
        icon: '🎯',
        iconBg: 'bg-indigo-100',
        title: 'Training Support for Leash Manners',
        desc: 'Connect with a trainer who works with large energetic dogs.',
        type: 'training'
      },
      {
        id: 'nutrition',
        icon: '🥕',
        iconBg: 'bg-orange-100',
        title: 'Weight & Nutrition Guidance',
        desc: 'Help managing weight and diet for joint health.',
        type: 'nutrition'
      },
      {
        id: 'physiotherapy',
        icon: '💪',
        iconBg: 'bg-teal-100',
        title: 'Hydrotherapy / Physiotherapy',
        desc: 'Find specialists that support mobility and recovery.',
        type: 'therapy'
      },
      {
        id: 'home_comfort',
        icon: '🏠',
        iconBg: 'bg-amber-100',
        title: 'Home Comfort Consultation',
        desc: 'Help choosing beds, ramps, mats and comfort solutions.',
        type: 'products'
      }
    ];
  }
  
  // Puppy services
  if (isPuppy) {
    return [
      {
        id: 'puppy_basics',
        icon: '🐕',
        iconBg: 'bg-pink-100',
        title: 'Puppy Training Basics',
        desc: 'Expert guidance on potty training, crate training, and early socialization.',
        type: 'training'
      },
      {
        id: 'vet_checkup',
        icon: '🩺',
        iconBg: 'bg-rose-100',
        title: 'First Vet Checkup Guidance',
        desc: 'What to expect and ask during your puppy\'s first health visits.',
        type: 'consultation'
      },
      {
        id: 'nutrition_puppy',
        icon: '🥣',
        iconBg: 'bg-orange-100',
        title: 'Puppy Nutrition Planning',
        desc: 'Help choosing the right food for healthy growth.',
        type: 'nutrition'
      },
      {
        id: 'socialization',
        icon: '🤝',
        iconBg: 'bg-blue-100',
        title: 'Socialization Support',
        desc: 'Connect with puppy playgroups and socialization experts.',
        type: 'social'
      },
      {
        id: 'teething',
        icon: '🦷',
        iconBg: 'bg-purple-100',
        title: 'Teething & Biting Help',
        desc: 'Solutions for managing puppy teething and bite inhibition.',
        type: 'guidance'
      },
      {
        id: 'home_setup',
        icon: '🏠',
        iconBg: 'bg-amber-100',
        title: 'Puppy-Proofing Your Home',
        desc: 'Expert advice on creating a safe environment.',
        type: 'products'
      }
    ];
  }
  
  // Adult dog services (default)
  return [
    {
      id: 'behavior',
      icon: '🧠',
      iconBg: 'bg-purple-100',
      title: 'Behavior Consultation',
      desc: 'Expert help understanding and addressing behavioral concerns.',
      type: 'consultation'
    },
    {
      id: 'training',
      icon: '🎯',
      iconBg: 'bg-blue-100',
      title: 'Advanced Training',
      desc: 'Obedience, tricks, and specialized training programs.',
      type: 'training'
    },
    {
      id: 'grooming',
      icon: '✨',
      iconBg: 'bg-pink-100',
      title: 'Grooming Guidance',
      desc: `Coat care tips specific to ${breed || 'your dog\'s'} needs.`,
      type: 'grooming'
    },
    {
      id: 'nutrition_adult',
      icon: '🥗',
      iconBg: 'bg-green-100',
      title: 'Nutrition Planning',
      desc: 'Personalized diet recommendations for optimal health.',
      type: 'nutrition'
    },
    {
      id: 'exercise',
      icon: '🏃',
      iconBg: 'bg-amber-100',
      title: 'Exercise & Activity Planning',
      desc: 'Right amount of exercise for your dog\'s energy level.',
      type: 'guidance'
    },
    {
      id: 'wellness',
      icon: '❤️',
      iconBg: 'bg-rose-100',
      title: 'Wellness Checkup',
      desc: 'Annual health review and preventive care planning.',
      type: 'consultation'
    }
  ];
};

const SupportForPet = ({ pet, onServiceClick }) => {
  if (!pet) return null;
  
  const services = getServiceRecommendations(pet);
  const petName = pet.name || 'Your Pet';
  
  return (
    <div className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Support that might help {petName}
          </h2>
          <p className="text-gray-600 mt-1">Services that bridge learning to real help</p>
        </div>
        
        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card
              key={service.id}
              className="p-5 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onServiceClick?.(service)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${service.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {service.desc}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportForPet;
