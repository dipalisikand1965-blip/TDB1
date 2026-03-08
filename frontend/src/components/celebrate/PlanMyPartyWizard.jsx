/**
 * PlanMyPartyWizard.jsx
 * 
 * A magical step-by-step party planning wizard that feels like planning
 * your child's birthday party, not shopping.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cake, Gift, PartyPopper, Sparkles, Users, Home, MapPin,
  ChevronRight, ChevronLeft, Heart, Star, Music, Camera,
  Check, Loader2, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_URL } from '../../utils/api';

const WIZARD_STEPS = [
  {
    id: 'occasion',
    title: "What's the occasion?",
    subtitle: "Every moment with {petName} is worth celebrating"
  },
  {
    id: 'style',
    title: "How does {petName} like to celebrate?",
    subtitle: "We'll plan around {petName}'s personality"
  },
  {
    id: 'happiness',
    title: "What makes {petName} happiest?",
    subtitle: "Select all that apply"
  },
  {
    id: 'result',
    title: "{petName}'s Perfect Party Plan",
    subtitle: "Personalized by Mira"
  }
];

const OCCASIONS = [
  { id: 'birthday', emoji: '🎂', label: 'Birthday', description: 'The big day!' },
  { id: 'gotcha', emoji: '💝', label: 'Gotcha Day', description: 'Adoption anniversary' },
  { id: 'milestone', emoji: '🏆', label: 'Milestone', description: 'First year, recovery, etc.' },
  { id: 'just-because', emoji: '💖', label: 'Just Because', description: 'Because they deserve it!' }
];

const CELEBRATION_STYLES = [
  { id: 'intimate', emoji: '🏠', label: 'Cozy at Home', description: 'Just family & favorite treats' },
  { id: 'party', emoji: '🎉', label: 'Pawty Time!', description: 'Invite the squad!' },
  { id: 'outdoor', emoji: '🌳', label: 'Park Adventure', description: 'Outdoor fun with friends' },
  { id: 'surprise', emoji: '🎁', label: 'Surprise!', description: 'Make it magical' }
];

const HAPPINESS_FACTORS = [
  { id: 'treats', emoji: '🍖', label: 'Yummy Treats' },
  { id: 'cake', emoji: '🎂', label: 'Birthday Cake' },
  { id: 'toys', emoji: '🎾', label: 'New Toys' },
  { id: 'attention', emoji: '👑', label: 'All the Attention' },
  { id: 'friends', emoji: '🐕', label: 'Doggy Friends' },
  { id: 'photos', emoji: '📸', label: 'Photo Session' },
  { id: 'outfit', emoji: '👗', label: 'Party Outfit' },
  { id: 'music', emoji: '🎵', label: 'Dance Party!' }
];

const PlanMyPartyWizard = ({ isOpen, onClose, pet, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    occasion: null,
    style: null,
    happiness: []
  });
  const [partyPlan, setPartyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const petName = pet?.name || 'Your pet';
  
  const handleOccasionSelect = (occasionId) => {
    setAnswers({ ...answers, occasion: occasionId });
  };
  
  const handleStyleSelect = (styleId) => {
    setAnswers({ ...answers, style: styleId });
  };
  
  const handleHappinessToggle = (factorId) => {
    const current = answers.happiness || [];
    if (current.includes(factorId)) {
      setAnswers({ ...answers, happiness: current.filter(h => h !== factorId) });
    } else {
      setAnswers({ ...answers, happiness: [...current, factorId] });
    }
  };
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return answers.occasion !== null;
      case 1: return answers.style !== null;
      case 2: return answers.happiness.length > 0;
      default: return true;
    }
  };
  
  const generatePartyPlan = async () => {
    setLoading(true);
    
    // Simulate AI generating a personalized plan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const occasion = OCCASIONS.find(o => o.id === answers.occasion);
    const style = CELEBRATION_STYLES.find(s => s.id === answers.style);
    const happinessItems = HAPPINESS_FACTORS.filter(h => answers.happiness.includes(h.id));
    
    // Generate plan based on selections
    const plan = {
      title: `${petName}'s ${occasion?.label || 'Special'} Celebration`,
      style: style?.label,
      recommendations: [],
      timeline: []
    };
    
    // Add recommendations based on happiness factors
    if (answers.happiness.includes('cake')) {
      plan.recommendations.push({
        type: 'product',
        category: 'Birthday Cake',
        emoji: '🎂',
        description: `A custom ${pet?.breed || 'breed'} birthday cake`,
        action: 'Browse Cakes',
        link: '/celebrate?category=cakes'
      });
    }
    
    if (answers.happiness.includes('treats')) {
      plan.recommendations.push({
        type: 'product',
        category: 'Party Treats',
        emoji: '🍖',
        description: 'Gourmet treat selection for the celebration',
        action: 'View Treats',
        link: '/celebrate?category=treats'
      });
    }
    
    if (answers.happiness.includes('photos')) {
      plan.recommendations.push({
        type: 'service',
        category: 'Photo Session',
        emoji: '📸',
        description: 'Professional pet photography session',
        action: 'Book Session',
        link: '/services?type=photography'
      });
    }
    
    if (answers.happiness.includes('outfit')) {
      plan.recommendations.push({
        type: 'product',
        category: 'Party Outfit',
        emoji: '👗',
        description: 'Birthday bandana & party accessories',
        action: 'Shop Accessories',
        link: '/celebrate?category=accessories'
      });
    }
    
    if (answers.happiness.includes('friends') || answers.style === 'party') {
      plan.recommendations.push({
        type: 'service',
        category: 'Party Planning',
        emoji: '🎉',
        description: 'Full party planning with doggy guest management',
        action: 'Plan Party',
        link: '/services?type=party'
      });
    }
    
    // Always suggest a hamper
    plan.recommendations.push({
      type: 'product',
      category: 'Birthday Hamper',
      emoji: '🎁',
      description: 'Complete celebration package with cake, treats & toys',
      action: 'View Hampers',
      link: '/celebrate?category=hampers'
    });
    
    // Generate timeline
    plan.timeline = [
      { time: 'Now', task: 'Order cake & treats (2-3 days lead time)', icon: '🛒' },
      { time: '1 day before', task: 'Set up party decorations', icon: '🎈' },
      { time: 'Day of', task: 'Morning walk to build appetite', icon: '🚶' },
      { time: 'Party time!', task: `${petName}'s grand celebration!`, icon: '🎉' },
      { time: 'After', task: 'Share photos & create memories', icon: '📸' }
    ];
    
    setPartyPlan(plan);
    setLoading(false);
    setCurrentStep(3);
  };
  
  const handleNext = () => {
    if (currentStep === 2) {
      generatePartyPlan();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const handleComplete = () => {
    onComplete?.(partyPlan);
    onClose();
  };
  
  const resetWizard = () => {
    setCurrentStep(0);
    setAnswers({ occasion: null, style: null, happiness: [] });
    setPartyPlan(null);
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {OCCASIONS.map((occasion) => (
              <motion.button
                key={occasion.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOccasionSelect(occasion.id)}
                className={`p-4 sm:p-6 rounded-2xl border-2 transition-all text-left ${
                  answers.occasion === occasion.id
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <span className="text-3xl sm:text-4xl block mb-2">{occasion.emoji}</span>
                <h4 className="font-bold text-gray-900">{occasion.label}</h4>
                <p className="text-xs sm:text-sm text-gray-500">{occasion.description}</p>
                {answers.occasion === occasion.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-purple-500" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        );
        
      case 1:
        return (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {CELEBRATION_STYLES.map((style) => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStyleSelect(style.id)}
                className={`p-4 sm:p-6 rounded-2xl border-2 transition-all text-left ${
                  answers.style === style.id
                    ? 'border-pink-500 bg-pink-50 shadow-lg'
                    : 'border-gray-200 hover:border-pink-300 bg-white'
                }`}
              >
                <span className="text-3xl sm:text-4xl block mb-2">{style.emoji}</span>
                <h4 className="font-bold text-gray-900">{style.label}</h4>
                <p className="text-xs sm:text-sm text-gray-500">{style.description}</p>
              </motion.button>
            ))}
          </div>
        );
        
      case 2:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HAPPINESS_FACTORS.map((factor) => (
              <motion.button
                key={factor.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleHappinessToggle(factor.id)}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  answers.happiness.includes(factor.id)
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-gray-200 hover:border-amber-300 bg-white'
                }`}
              >
                <span className="text-2xl sm:text-3xl block mb-1">{factor.emoji}</span>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{factor.label}</span>
              </motion.button>
            ))}
          </div>
        );
        
      case 3:
        if (loading) {
          return (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-purple-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700">Mira is creating your perfect party plan...</h3>
              <p className="text-sm text-gray-500 mt-2">Personalizing for {petName}'s unique personality</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {/* Party Plan Header */}
            <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl">
              <span className="text-4xl mb-2 block">🎉</span>
              <h3 className="text-xl font-bold text-gray-900">{partyPlan?.title}</h3>
              <p className="text-sm text-gray-600">{partyPlan?.style} celebration</p>
            </div>
            
            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Mira Recommends
              </h4>
              <div className="space-y-2">
                {partyPlan?.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <span className="text-2xl">{rec.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rec.category}</p>
                      <p className="text-xs text-gray-500">{rec.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => window.location.href = rec.link}
                    >
                      {rec.action}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Timeline */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Party Timeline
              </h4>
              <div className="space-y-2">
                {partyPlan?.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-purple-600">{item.time}</span>
                      <p className="text-sm text-gray-700">{item.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetWizard(); onClose(); } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                {WIZARD_STEPS[currentStep].title.replace('{petName}', petName)}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {WIZARD_STEPS[currentStep].subtitle.replace('{petName}', petName)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {WIZARD_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={currentStep === 0 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {currentStep === 2 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Party Plan
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Final step actions */}
        {currentStep === 3 && partyPlan && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetWizard}
              className="flex-1"
            >
              Start Over
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              <PartyPopper className="w-4 h-4 mr-2" />
              Let's Celebrate!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Clock icon component
const Clock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default PlanMyPartyWizard;
