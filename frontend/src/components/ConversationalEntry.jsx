/**
 * ConversationalEntry.jsx
 * PREMIUM VERSION - Polished, interactive, delightful
 * Feels like chatting with a real AI assistant
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ChevronRight, Target, Scale, Zap, Heart, Baby, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FITNESS_GOALS = [
  { id: 'weight_loss', label: 'Weight loss', icon: Scale, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
  { id: 'build_muscle', label: 'Build strength', icon: Zap, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
  { id: 'senior_mobility', label: 'Senior care', icon: Award, gradient: 'from-violet-400 to-purple-500', bg: 'bg-gradient-to-br from-violet-50 to-purple-50' },
  { id: 'puppy_energy', label: 'Puppy training', icon: Baby, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
  { id: 'anxiety_calm', label: 'Calm anxiety', icon: Heart, gradient: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50' },
  { id: 'general_fitness', label: 'Stay active', icon: Target, gradient: 'from-lime-400 to-green-500', bg: 'bg-gradient-to-br from-lime-50 to-green-50' },
];

const ConversationalEntry = ({ 
  petName,
  onGoalSelect,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [hoveredGoal, setHoveredGoal] = useState(null);
  const [isTyping, setIsTyping] = useState(true);
  const [displayText, setDisplayText] = useState('');
  
  const fullText = petName 
    ? `What's your fitness goal for ${petName}?`
    : "What's your pet's fitness goal?";

  // Typing animation effect
  useEffect(() => {
    if (isTyping) {
      let i = 0;
      const timer = setInterval(() => {
        if (i <= fullText.length) {
          setDisplayText(fullText.slice(0, i));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 40);
      return () => clearInterval(timer);
    }
  }, [fullText, isTyping]);

  const handleGoalClick = (goal) => {
    const message = petName 
      ? `I want to help ${petName} with ${goal.label.toLowerCase()}`
      : `I'm interested in ${goal.label.toLowerCase()} for my pet`;
    
    if (onGoalSelect) {
      onGoalSelect(goal, message);
    } else {
      navigate(`/mira?context=fit_${goal.id}&preset=${encodeURIComponent(message)}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50 ${className}`}
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full blur-3xl opacity-50" />
      
      <div className="relative p-6">
        {/* Mira Avatar & Message */}
        <div className="flex items-start gap-4 mb-6">
          {/* Animated Mira Avatar */}
          <div className="relative flex-shrink-0">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[2px] shadow-lg shadow-purple-500/30"
              animate={{ 
                boxShadow: ['0 10px 30px rgba(168, 85, 247, 0.3)', '0 10px 40px rgba(236, 72, 153, 0.4)', '0 10px 30px rgba(168, 85, 247, 0.3)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="w-7 h-7 text-purple-500" />
                </motion.div>
              </div>
            </motion.div>
            {/* Online indicator */}
            <motion.div 
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-[3px] border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          {/* Message Bubble */}
          <div className="flex-1">
            <div className="inline-block bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
              <p className="text-gray-800 font-medium text-lg">
                {displayText}
                {isTyping && (
                  <motion.span 
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-5 bg-purple-500 ml-1 align-middle"
                  />
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Tap a goal to start chatting with Mira
              </p>
            </div>
          </div>
        </div>

        {/* Goal Pills - Premium Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FITNESS_GOALS.map((goal) => {
            const Icon = goal.icon;
            const isHovered = hoveredGoal === goal.id;
            
            return (
              <motion.button
                key={goal.id}
                onClick={() => handleGoalClick(goal)}
                onMouseEnter={() => setHoveredGoal(goal.id)}
                onMouseLeave={() => setHoveredGoal(null)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative group overflow-hidden rounded-2xl p-4 text-left transition-all duration-300
                           ${goal.bg} border border-white/50 shadow-sm hover:shadow-lg`}
              >
                {/* Gradient overlay on hover */}
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${goal.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                />
                
                <div className="relative flex items-center gap-3">
                  {/* Icon with gradient background */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${goal.gradient} 
                                  flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                       style={{ boxShadow: isHovered ? `0 8px 20px ${goal.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' : 
                                           goal.gradient.includes('amber') ? 'rgba(245, 158, 11, 0.3)' :
                                           goal.gradient.includes('violet') ? 'rgba(139, 92, 246, 0.3)' :
                                           goal.gradient.includes('pink') ? 'rgba(236, 72, 153, 0.3)' :
                                           goal.gradient.includes('cyan') ? 'rgba(6, 182, 212, 0.3)' :
                                           'rgba(132, 204, 22, 0.3)'}` : 'none' }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm block">{goal.label}</span>
                  </div>
                  
                  {/* Arrow on hover */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    className="text-gray-400"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Custom message link */}
        <motion.button
          onClick={() => navigate('/mira?context=fit')}
          whileHover={{ x: 5 }}
          className="mt-5 flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
            <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
          <span>Or describe what you need in your own words</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ConversationalEntry;
