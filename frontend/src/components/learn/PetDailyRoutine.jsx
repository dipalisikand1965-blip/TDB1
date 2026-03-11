/**
 * PetDailyRoutine.jsx
 * Bruno's Daily Routine Suggestions - personalized routine based on pet profile
 * Shows Morning, Midday, Evening, Night with activities and supporting products
 */

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Edit2, ChevronRight } from 'lucide-react';

// Routine suggestions based on pet characteristics
const getRoutineSuggestions = (pet) => {
  const issenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  const isLargeDog = pet?.size === 'large' || pet?.size === 'giant';
  const breed = pet?.breed?.toLowerCase() || '';
  
  // Senior dog routine
  if (issenior) {
    return {
      morning: {
        icon: '🌅',
        activities: ['20-30 min gentle walk', 'Hydration check', 'Joint supplement'],
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'
      },
      midday: {
        icon: '☀️',
        activities: ['Cool resting area', 'Short movement break', 'Light play'],
        image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&q=80'
      },
      evening: {
        icon: '🌆',
        activities: ['Long relaxed walk', 'Light stretching', 'Slow feeder dinner'],
        image: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80'
      },
      night: {
        icon: '🌙',
        activities: ['Orthopedic bed', 'Calm environment', 'Comfort check'],
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80'
      },
      products: [
        { name: 'Orthopedic Bed', price: '₹2,499' },
        { name: 'Slow Feeder Bowl', price: '₹599' },
        { name: 'Cooling Mat', price: '₹649' },
        { name: 'Joint Supplement', price: '₹899' }
      ]
    };
  }
  
  // Puppy routine
  if (isPuppy) {
    return {
      morning: {
        icon: '🌅',
        activities: ['Potty break', 'Breakfast', 'Short play session'],
        image: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&q=80'
      },
      midday: {
        icon: '☀️',
        activities: ['Training session (10 min)', 'Nap time', 'Socialization'],
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'
      },
      evening: {
        icon: '🌆',
        activities: ['Active play', 'Dinner', 'Calm bonding time'],
        image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&q=80'
      },
      night: {
        icon: '🌙',
        activities: ['Last potty break', 'Crate time', 'Quiet sleep'],
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80'
      },
      products: [
        { name: 'Puppy Crate', price: '₹1,999' },
        { name: 'Training Treats', price: '₹349' },
        { name: 'Teething Toys', price: '₹499' },
        { name: 'Potty Pads', price: '₹599' }
      ]
    };
  }
  
  // Adult dog routine (default)
  return {
    morning: {
      icon: '🌅',
      activities: ['30-45 min walk', 'Breakfast', 'Mental stimulation'],
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'
    },
    midday: {
      icon: '☀️',
      activities: ['Rest time', 'Short training', 'Puzzle toy'],
      image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&q=80'
    },
    evening: {
      icon: '🌆',
      activities: ['Active exercise', 'Dinner', 'Play session'],
      image: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80'
    },
    night: {
      icon: '🌙',
      activities: ['Evening walk', 'Grooming', 'Settle for sleep'],
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80'
    },
    products: [
      { name: 'Puzzle Feeder', price: '₹799' },
      { name: 'Quality Leash', price: '₹599' },
      { name: 'Grooming Kit', price: '₹1,299' },
      { name: 'Comfortable Bed', price: '₹1,999' }
    ]
  };
};

const PetDailyRoutine = ({ pet, onEditRoutine, onProductClick }) => {
  if (!pet) return null;
  
  const routine = getRoutineSuggestions(pet);
  const petName = pet.name || 'Your Pet';
  
  return (
    <div className="py-12 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {petName}'s Daily Routine
            </h2>
            <p className="text-gray-600 mt-1">Suggested schedule based on {petName}'s needs</p>
          </div>
          {onEditRoutine && (
            <Button 
              variant="outline" 
              onClick={onEditRoutine}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Routine
            </Button>
          )}
        </div>
        
        {/* Routine Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['morning', 'midday', 'evening', 'night'].map((time) => (
            <Card 
              key={time}
              className="overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative h-32">
                <img 
                  src={routine[time].image}
                  alt={time}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{routine[time].icon}</span>
                    <span className="font-semibold capitalize">{time}</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                {routine[time].activities.map((activity, idx) => (
                  <p key={idx} className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    {activity}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-3 mb-8">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-12 h-0.5 bg-gradient-to-r from-amber-400 to-green-400 self-center" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="w-12 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 self-center" />
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 self-center" />
          <span className="w-3 h-3 rounded-full bg-purple-400" />
        </div>
        
        {/* Products that support this routine */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Products that support this routine
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {routine.products.map((product, idx) => (
              <Card 
                key={idx}
                className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white"
                onClick={() => onProductClick?.(product.name)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-4xl opacity-50">🛍️</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                <p className="text-sm text-amber-600 font-semibold mt-1">From {product.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDailyRoutine;
