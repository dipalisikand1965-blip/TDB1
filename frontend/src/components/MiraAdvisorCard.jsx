/**
 * MiraAdvisorCard.jsx
 * Reusable "Ask Mira" advisor component for all pillar pages
 * 
 * IMPORTANT: This component opens the full Mira chat widget with context.
 * DO NOT create separate API calls - Mira handles everything.
 * 
 * See /app/memory/MIRA_ADVISOR_GUIDE.md for full documentation.
 */

import React, { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Pillar configurations
const PILLAR_CONFIG = {
  celebrate: {
    name: 'Party Planner',
    subtitle: 'Plan the perfect celebration for your pet',
    placeholder: "e.g., What cake is best for my Labrador's birthday?",
    color: 'pink',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    btnColor: 'bg-pink-600 hover:bg-pink-700'
  },
  dine: {
    name: 'Nutrition Advisor',
    subtitle: 'Get personalized food recommendations',
    placeholder: "e.g., What food is best for my dog's allergies?",
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    btnColor: 'bg-orange-600 hover:bg-orange-700'
  },
  stay: {
    name: 'Boarding Guide',
    subtitle: 'Find the perfect stay for your pet',
    placeholder: "e.g., How do I prepare my anxious dog for boarding?",
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700'
  },
  travel: {
    name: 'Travel Companion',
    subtitle: 'Plan adventures with your furry friend',
    placeholder: "e.g., What documents do I need to fly with my dog?",
    color: 'sky',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
    borderColor: 'border-sky-200',
    btnColor: 'bg-sky-600 hover:bg-sky-700'
  },
  care: {
    name: 'Wellness Expert',
    subtitle: 'Keep your pet healthy and happy',
    placeholder: "e.g., How often should I groom my Shih Tzu?",
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-200',
    btnColor: 'bg-teal-600 hover:bg-teal-700'
  },
  enjoy: {
    name: 'Activity Buddy',
    subtitle: 'Discover fun activities together',
    placeholder: "e.g., Best outdoor activities for a senior dog?",
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    btnColor: 'bg-purple-600 hover:bg-purple-700'
  },
  fit: {
    name: 'Fitness Coach',
    subtitle: 'Help your pet stay fit and active',
    placeholder: "e.g., Exercise plan for my overweight Pug?",
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    btnColor: 'bg-green-600 hover:bg-green-700'
  },
  learn: {
    name: 'Training Mentor',
    subtitle: 'Expert guidance for training your pet',
    placeholder: "e.g., How to stop my puppy from biting?",
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700'
  },
  farewell: {
    name: 'Compassion Guide',
    subtitle: 'Supportive guidance during difficult times',
    placeholder: "e.g., How do I know when it's time?",
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    btnColor: 'bg-rose-600 hover:bg-rose-700'
  },
  adopt: {
    name: 'Adoption Advisor',
    subtitle: 'Start your adoption journey right',
    placeholder: "e.g., How to help a rescue dog settle in?",
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    btnColor: 'bg-green-600 hover:bg-green-700'
  },
  emergency: {
    name: 'Emergency Triage',
    subtitle: 'Urgent help when you need it most',
    placeholder: "e.g., My dog ate chocolate, what do I do?",
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    btnColor: 'bg-red-600 hover:bg-red-700'
  },
  advisory: {
    name: 'Life Advisor',
    subtitle: 'Guidance for all aspects of pet parenting',
    placeholder: "e.g., How do I manage multiple dogs?",
    color: 'violet',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    btnColor: 'bg-violet-600 hover:bg-violet-700'
  },
  paperwork: {
    name: 'Document Assistant',
    subtitle: 'Help organizing your pet records',
    placeholder: "e.g., What vaccination records do I need?",
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    btnColor: 'bg-slate-600 hover:bg-slate-700'
  }
};

const MiraAdvisorCard = ({ 
  pillar, 
  activePet = null,
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.advisory;
  
  const handleAskMira = () => {
    if (!query.trim()) return;
    
    // Open Mira with pillar-specific context
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: query,
        initialQuery: query,
        context: pillar,
        pillar: pillar,
        pet_name: activePet?.name,
        pet_breed: activePet?.breed,
        pet_age: activePet?.age_years
      }
    }));
    
    // Clear input after sending
    setQuery('');
  };
  
  return (
    <Card className={`p-6 border-2 ${config.borderColor} bg-white shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 ${config.bgColor} rounded-full`}>
          <MessageCircle className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{config.name}</h3>
          <p className="text-gray-600 text-sm">{config.subtitle}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder={config.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAskMira()}
          className="flex-1"
          data-testid={`${pillar}-advisor-input`}
        />
        <Button 
          onClick={handleAskMira}
          disabled={!query.trim()}
          className={config.btnColor}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Ask Mira
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Powered by Mira AI - your personal pet advisor
      </p>
    </Card>
  );
};

export default MiraAdvisorCard;
export { PILLAR_CONFIG };
