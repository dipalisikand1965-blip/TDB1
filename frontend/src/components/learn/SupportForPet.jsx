/**
 * SupportForPet.jsx
 * "Support that might help [Pet Name]" - Services section
 * Bridges learning to real help with personalized service recommendations
 * Uses lucide-react icons instead of emojis
 */

import React from 'react';
import { Card } from '../ui/card';
import { 
  ChevronRight, Brain, Target, Sparkles, 
  Salad, Activity, Heart, PawPrint, Stethoscope,
  Dumbbell, Home, GraduationCap, HandHeart
} from 'lucide-react';

const getServiceRecommendations = (pet) => {
  const isSenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  const breed = pet?.breed?.toLowerCase() || '';
  const petName = pet?.name || 'Your Pet';
  
  if (isSenior) {
    return [
      { id: 'joint_care', icon: Stethoscope, iconColor: 'text-rose-600', iconBg: 'bg-rose-100', title: 'Joint Care Consultation', desc: 'Speak to a vet or pet wellness expert about joint comfort, mobility and ageing support.', type: 'consultation' },
      { id: 'senior_routine', icon: Target, iconColor: 'text-blue-600', iconBg: 'bg-blue-100', title: 'Senior Dog Routine Guidance', desc: `Help building the right daily routine for older ${breed || 'dogs'}.`, type: 'guidance' },
      { id: 'leash_training', icon: GraduationCap, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100', title: 'Training Support for Leash Manners', desc: 'Connect with a trainer who works with large energetic dogs.', type: 'training' },
      { id: 'nutrition', icon: Salad, iconColor: 'text-orange-600', iconBg: 'bg-orange-100', title: 'Weight & Nutrition Guidance', desc: 'Help managing weight and diet for joint health.', type: 'nutrition' },
      { id: 'physiotherapy', icon: Dumbbell, iconColor: 'text-teal-600', iconBg: 'bg-teal-100', title: 'Hydrotherapy / Physiotherapy', desc: 'Find specialists that support mobility and recovery.', type: 'therapy' },
      { id: 'home_comfort', icon: Home, iconColor: 'text-amber-600', iconBg: 'bg-amber-100', title: 'Home Comfort Consultation', desc: 'Help choosing beds, ramps, mats and comfort solutions.', type: 'products' }
    ];
  }
  
  if (isPuppy) {
    return [
      { id: 'puppy_basics', icon: PawPrint, iconColor: 'text-pink-600', iconBg: 'bg-pink-100', title: 'Puppy Training Basics', desc: 'Expert guidance on potty training, crate training, and early socialization.', type: 'training' },
      { id: 'vet_checkup', icon: Stethoscope, iconColor: 'text-rose-600', iconBg: 'bg-rose-100', title: 'First Vet Checkup Guidance', desc: 'What to expect and ask during your puppy\'s first health visits.', type: 'consultation' },
      { id: 'nutrition_puppy', icon: Salad, iconColor: 'text-orange-600', iconBg: 'bg-orange-100', title: 'Puppy Nutrition Planning', desc: 'Help choosing the right food for healthy growth.', type: 'nutrition' },
      { id: 'socialization', icon: HandHeart, iconColor: 'text-blue-600', iconBg: 'bg-blue-100', title: 'Socialization Support', desc: 'Connect with puppy playgroups and socialization experts.', type: 'social' },
      { id: 'teething', icon: Sparkles, iconColor: 'text-purple-600', iconBg: 'bg-purple-100', title: 'Teething & Biting Help', desc: 'Solutions for managing puppy teething and bite inhibition.', type: 'guidance' },
      { id: 'home_setup', icon: Home, iconColor: 'text-amber-600', iconBg: 'bg-amber-100', title: 'Puppy-Proofing Your Home', desc: 'Expert advice on creating a safe environment.', type: 'products' }
    ];
  }
  
  return [
    { id: 'behavior', icon: Brain, iconColor: 'text-purple-600', iconBg: 'bg-purple-100', title: 'Behavior Consultation', desc: 'Expert help understanding and addressing behavioral concerns.', type: 'consultation' },
    { id: 'training', icon: Target, iconColor: 'text-blue-600', iconBg: 'bg-blue-100', title: 'Advanced Training', desc: 'Obedience, tricks, and specialized training programs.', type: 'training' },
    { id: 'grooming', icon: Sparkles, iconColor: 'text-pink-600', iconBg: 'bg-pink-100', title: 'Grooming Guidance', desc: `Coat care tips specific to ${breed || 'your dog\'s'} needs.`, type: 'grooming' },
    { id: 'nutrition_adult', icon: Salad, iconColor: 'text-green-600', iconBg: 'bg-green-100', title: 'Nutrition Planning', desc: 'Personalized diet recommendations for optimal health.', type: 'nutrition' },
    { id: 'exercise', icon: Activity, iconColor: 'text-amber-600', iconBg: 'bg-amber-100', title: 'Exercise & Activity Planning', desc: 'Right amount of exercise for your dog\'s energy level.', type: 'guidance' },
    { id: 'wellness', icon: Heart, iconColor: 'text-rose-600', iconBg: 'bg-rose-100', title: 'Wellness Checkup', desc: 'Annual health review and preventive care planning.', type: 'consultation' }
  ];
};

const SupportForPet = ({ pet, onServiceClick }) => {
  if (!pet) return null;
  
  const services = getServiceRecommendations(pet);
  const petName = pet.name || 'Your Pet';
  
  return (
    <div className="py-12 bg-white" data-testid="support-for-pet">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Support that might help {petName}
          </h2>
          <p className="text-gray-600 mt-1">Services that bridge learning to real help</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const ServiceIcon = service.icon;
            return (
              <Card
                key={service.id}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => onServiceClick?.(service)}
                data-testid={`support-service-${service.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${service.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <ServiceIcon className={`w-6 h-6 ${service.iconColor}`} />
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupportForPet;
