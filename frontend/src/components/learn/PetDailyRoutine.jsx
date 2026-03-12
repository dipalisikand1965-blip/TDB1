/**
 * PetDailyRoutine.jsx
 * Personalized daily routine suggestions based on pet profile
 * Uses watercolor-themed cards instead of stock photos
 */

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Sun, Cloud, Sunset, Moon, ChevronRight, ShoppingBag } from 'lucide-react';

const getRoutineSuggestions = (pet) => {
  const isSenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  const breed = pet?.breed?.toLowerCase() || '';
  
  if (isSenior) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['20-30 min gentle walk', 'Hydration check', 'Joint supplement'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Cool resting area', 'Short movement break', 'Light play'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Long relaxed walk', 'Light stretching', 'Slow feeder dinner'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Orthopedic bed', 'Calm environment', 'Comfort check'],
      },
      products: [
        { name: 'Orthopedic Bed', price: '₹2,499' },
        { name: 'Slow Feeder Bowl', price: '₹599' },
        { name: 'Cooling Mat', price: '₹649' },
        { name: 'Joint Supplement', price: '₹899' }
      ]
    };
  }
  
  if (isPuppy) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['Potty break', 'Breakfast', 'Short play session'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Training session (10 min)', 'Nap time', 'Socialization'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Active play', 'Dinner', 'Calm bonding time'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Last potty break', 'Crate time', 'Quiet sleep'],
      },
      products: [
        { name: 'Puppy Crate', price: '₹1,999' },
        { name: 'Training Treats', price: '₹349' },
        { name: 'Teething Toys', price: '₹499' },
        { name: 'Potty Pads', price: '₹599' }
      ]
    };
  }
  
  return {
    morning: {
      icon: Sun,
      color: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      activities: ['30-45 min walk', 'Breakfast', 'Mental stimulation'],
    },
    midday: {
      icon: Cloud,
      color: 'from-sky-100 to-blue-100',
      iconColor: 'text-sky-600',
      activities: ['Rest time', 'Short training', 'Puzzle toy'],
    },
    evening: {
      icon: Sunset,
      color: 'from-rose-100 to-pink-100',
      iconColor: 'text-rose-600',
      activities: ['Active exercise', 'Dinner', 'Play session'],
    },
    night: {
      icon: Moon,
      color: 'from-indigo-100 to-purple-100',
      iconColor: 'text-indigo-600',
      activities: ['Evening walk', 'Grooming', 'Settle for sleep'],
    },
    products: [
      { name: 'Puzzle Feeder', price: '₹799' },
      { name: 'Quality Leash', price: '₹599' },
      { name: 'Grooming Kit', price: '₹1,299' },
      { name: 'Comfortable Bed', price: '₹1,999' }
    ]
  };
};

const PetDailyRoutine = ({ pet, onProductClick }) => {
  if (!pet) return null;
  
  const routine = getRoutineSuggestions(pet);
  const petName = pet.name || 'Your Pet';
  
  return (
    <div className="py-12 bg-gradient-to-br from-amber-50/50 to-orange-50/50" data-testid="pet-daily-routine">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {petName}'s Daily Routine
          </h2>
          <p className="text-gray-600 mt-1">A suggested schedule based on {petName}'s needs</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {['morning', 'midday', 'evening', 'night'].map((time) => {
            const TimeIcon = routine[time].icon;
            return (
              <Card 
                key={time}
                className="overflow-hidden hover:shadow-lg transition-all"
                data-testid={`routine-${time}`}
              >
                <div className={`relative h-24 sm:h-28 bg-gradient-to-br ${routine[time].color} flex items-center justify-center`}>
                  <TimeIcon className={`w-10 h-10 sm:w-12 sm:h-12 ${routine[time].iconColor} opacity-80`} />
                  <div className="absolute bottom-2 left-3">
                    <span className="font-semibold capitalize text-sm text-gray-800">{time}</span>
                  </div>
                </div>
                <div className="p-3">
                  {routine[time].activities.map((activity, idx) => (
                    <p key={idx} className="text-xs text-gray-600 flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {activity}
                    </p>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-center gap-2 mb-8">
          {['amber', 'sky', 'rose', 'indigo'].map((color, i) => (
            <React.Fragment key={i}>
              <span className={`w-2.5 h-2.5 rounded-full bg-${color}-400`} />
              {i < 3 && <span className={`w-8 h-0.5 bg-gradient-to-r from-${color}-300 to-${['sky','rose','indigo','indigo'][i]}-300 self-center`} />}
            </React.Fragment>
          ))}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Products that support this routine
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {routine.products.map((product, idx) => (
              <Card 
                key={idx}
                className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white group"
                onClick={() => onProductClick?.(product.name)}
                data-testid={`routine-product-${idx}`}
              >
                <div className="aspect-square bg-gradient-to-br from-stone-50 to-gray-100 rounded-xl mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300 group-hover:text-amber-400 transition-colors" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                <p className="text-sm text-amber-600 font-semibold mt-1">From {product.price}</p>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-2 group-hover:text-amber-500 transition-colors" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDailyRoutine;
