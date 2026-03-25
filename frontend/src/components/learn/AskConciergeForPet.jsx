/**
 * AskConciergeForPet.jsx
 * "Need help for Bruno?" - Concierge® action cards
 * Human help layer with illustrated icons
 */

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle } from 'lucide-react';

const AskConciergeForPet = ({ pet, onAction, onAskConcierge }) => {
  const petName = pet?.name || 'Your Pet';
  
  const actions = [
    {
      id: 'build_routine',
      icon: '📅',
      iconBg: 'bg-blue-100',
      label: 'Build a routine',
      desc: `Create a daily schedule for ${petName}`
    },
    {
      id: 'products',
      icon: '🛍️',
      iconBg: 'bg-amber-100',
      label: `Products for ${petName}`,
      desc: 'Personalized product recommendations'
    },
    {
      id: 'find_vet',
      icon: '❤️',
      iconBg: 'bg-rose-100',
      label: 'Find a vet',
      desc: 'Trusted vets near you'
    },
    {
      id: 'plan_travel',
      icon: '✈️',
      iconBg: 'bg-sky-100',
      label: 'Plan travel',
      desc: `Travel tips for ${petName}`
    },
    {
      id: 'find_trainer',
      icon: '🎯',
      iconBg: 'bg-purple-100',
      label: 'Find a trainer',
      desc: 'Expert training support'
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Need help for {petName}?
          </h2>
          <p className="text-gray-600 mt-1">Our concierge team is here to help</p>
        </div>
        
        {/* Action Cards */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {actions.map((action) => (
            <Card
              key={action.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white/80 hover:bg-white min-w-[140px]"
              onClick={() => onAction?.(action.id)}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 ${action.iconBg} rounded-2xl flex items-center justify-center mb-2`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Ask Concierge® Button */}
        <div className="flex justify-center">
          <Button
            onClick={onAskConcierge}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200 border-2 rounded-full px-8 py-6 text-lg font-medium gap-3"
            variant="outline"
          >
            <MessageCircle className="w-5 h-5" />
            Ask Concierge®
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AskConciergeForPet;
