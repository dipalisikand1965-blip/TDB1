/**
 * ConversationalEntry.jsx
 * Smart conversational prompt with quick-tap goal options
 * Opens Mira with context pre-filled
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ChevronRight, Target, Scale, Zap, Heart, Baby, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const FITNESS_GOALS = [
  { id: 'weight_loss', label: 'Weight loss', icon: Scale, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { id: 'build_muscle', label: 'Build muscle', icon: Zap, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { id: 'senior_mobility', label: 'Senior mobility', icon: Award, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { id: 'puppy_energy', label: 'Puppy energy', icon: Baby, color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
  { id: 'anxiety_calm', label: 'Reduce anxiety', icon: Heart, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { id: 'general_fitness', label: 'General fitness', icon: Target, color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
];

const ConversationalEntry = ({ 
  petName,
  onGoalSelect,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal.id);
    
    // Navigate to Mira with context
    const context = `fit_goal_${goal.id}`;
    const message = petName 
      ? `I want to help ${petName} with ${goal.label.toLowerCase()}`
      : `I'm interested in ${goal.label.toLowerCase()} for my pet`;
    
    // Call callback if provided
    if (onGoalSelect) {
      onGoalSelect(goal, message);
    } else {
      // Default: navigate to Mira
      navigate(`/mira?context=${context}&preset=${encodeURIComponent(message)}`);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Conversational Prompt */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-medium">
            {petName ? (
              <>What's your fitness goal for <span className="text-teal-600">{petName}</span>?</>
            ) : (
              <>What's your pet's fitness goal?</>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Tap to start a conversation with Mira
          </p>
        </div>
      </div>

      {/* Quick-tap Goal Options */}
      <div className="flex flex-wrap gap-2">
        {FITNESS_GOALS.map((goal) => {
          const Icon = goal.icon;
          return (
            <motion.button
              key={goal.id}
              onClick={() => handleGoalClick(goal)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium
                         transition-all ${goal.color} ${selectedGoal === goal.id ? 'ring-2 ring-offset-1 ring-teal-500' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{goal.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Or type custom */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => navigate('/mira?context=fit')}
          className="text-sm text-gray-500 hover:text-teal-600 flex items-center gap-1 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Or tell Mira in your own words
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ConversationalEntry;
