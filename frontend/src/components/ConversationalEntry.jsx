/**
 * ConversationalEntry.jsx
 * PREMIUM VERSION - Polished, interactive, delightful
 * Feels like chatting with a real AI assistant
 * NOW PILLAR-AWARE: Shows relevant goals per pillar
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ChevronRight, Target, Scale, Zap, Heart, Baby, Award, ArrowRight, Plane, Home, Hotel, Utensils, Cake, Music, GraduationCap, Scissors, Stethoscope, MapPin, Calendar, Gift, Users, Dog, TreePine, Building, PartyPopper, Bell, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';

// PILLAR-SPECIFIC GOALS - Each pillar has its own relevant options
const PILLAR_GOALS = {
  fit: {
    title: (petName) => petName ? `What's your fitness goal for ${petName}?` : "What's your pet's fitness goal?",
    goals: [
      { id: 'weight_loss', label: 'Weight loss', icon: Scale, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'build_muscle', label: 'Build strength', icon: Zap, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'senior_mobility', label: 'Senior care', icon: Award, gradient: 'from-violet-400 to-purple-500', bg: 'bg-gradient-to-br from-violet-50 to-purple-50' },
      { id: 'puppy_energy', label: 'Puppy training', icon: Baby, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
      { id: 'anxiety_calm', label: 'Calm anxiety', icon: Heart, gradient: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50' },
      { id: 'general_fitness', label: 'Stay active', icon: Target, gradient: 'from-lime-400 to-green-500', bg: 'bg-gradient-to-br from-lime-50 to-green-50' },
    ]
  },
  stay: {
    title: (petName) => petName ? `Planning a trip with ${petName}?` : "What kind of stay are you looking for?",
    goals: [
      { id: 'vacation', label: 'Vacation getaway', icon: TreePine, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'pet_friendly_hotel', label: 'Pet-friendly hotel', icon: Hotel, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'staycation', label: 'Local staycation', icon: Building, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
      { id: 'resort', label: 'Pet-friendly resort', icon: Sparkles, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'weekend', label: 'Weekend escape', icon: MapPin, gradient: 'from-rose-400 to-pink-500', bg: 'bg-gradient-to-br from-rose-50 to-pink-50' },
      { id: 'travel_accommodation', label: 'Travel accommodation', icon: Home, gradient: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50' },
    ]
  },
  travel: {
    title: (petName) => petName ? `Where is ${petName} traveling?` : "How can we help with travel?",
    goals: [
      { id: 'flight', label: 'Flight booking', icon: Plane, gradient: 'from-blue-400 to-cyan-500', bg: 'bg-gradient-to-br from-blue-50 to-cyan-50' },
      { id: 'road_trip', label: 'Road trip', icon: MapPin, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'relocation', label: 'Pet relocation', icon: Home, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'documents', label: 'Travel documents', icon: Award, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'taxi', label: 'Pet taxi', icon: Target, gradient: 'from-rose-400 to-pink-500', bg: 'bg-gradient-to-br from-rose-50 to-pink-50' },
      { id: 'international', label: 'International', icon: Sparkles, gradient: 'from-indigo-400 to-blue-500', bg: 'bg-gradient-to-br from-indigo-50 to-blue-50' },
    ]
  },
  care: {
    title: (petName) => petName ? `What care does ${petName} need?` : "What care are you looking for?",
    goals: [
      { id: 'grooming', label: 'Grooming', icon: Scissors, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
      { id: 'vet_clinic_booking', label: 'Vet Visits', icon: Stethoscope, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
      { id: 'boarding_daycare', label: 'Boarding & Daycare', icon: Building, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'pet_sitting', label: 'Pet Sitting', icon: Home, gradient: 'from-green-400 to-emerald-500', bg: 'bg-gradient-to-br from-green-50 to-emerald-50' },
      { id: 'behavior_anxiety_support', label: 'Behavior Support', icon: Heart, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'senior_special_needs', label: 'Senior & Special Needs', icon: Award, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
    ]
  },
  dine: {
    title: (petName) => petName ? `Taking ${petName} out to eat?` : "What's the dining occasion?",
    goals: [
      { id: 'date_night', label: 'Date night', icon: Heart, gradient: 'from-rose-400 to-pink-500', bg: 'bg-gradient-to-br from-rose-50 to-pink-50' },
      { id: 'birthday', label: 'Birthday outing', icon: Cake, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'casual', label: 'Casual dining', icon: Utensils, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'brunch', label: 'Pet-friendly brunch', icon: Calendar, gradient: 'from-yellow-400 to-amber-500', bg: 'bg-gradient-to-br from-yellow-50 to-amber-50' },
      { id: 'cafe', label: 'Cafe hopping', icon: Target, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'group', label: 'Group dining', icon: Users, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
    ]
  },
  celebrate: {
    title: (petName) => petName ? `Celebrating with ${petName}?` : "What's the celebration?",
    goals: [
      { id: 'birthday', label: 'Birthday party', icon: Cake, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
      { id: 'adoption_day', label: 'Adoption day', icon: Heart, gradient: 'from-red-400 to-rose-500', bg: 'bg-gradient-to-br from-red-50 to-rose-50' },
      { id: 'gotcha_day', label: 'Gotcha day', icon: PartyPopper, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'holiday', label: 'Holiday treats', icon: Gift, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'milestone', label: 'Pet milestone', icon: Award, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'photoshoot', label: 'Photo session', icon: Sparkles, gradient: 'from-cyan-400 to-blue-500', bg: 'bg-gradient-to-br from-cyan-50 to-blue-50' },
    ]
  },
  enjoy: {
    title: (petName) => petName ? `Fun activities for ${petName}?` : "What fun are you looking for?",
    goals: [
      { id: 'playdate', label: 'Playdate', icon: Users, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
      { id: 'outdoor', label: 'Outdoor adventure', icon: TreePine, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'swimming', label: 'Swimming', icon: Target, gradient: 'from-blue-400 to-cyan-500', bg: 'bg-gradient-to-br from-blue-50 to-cyan-50' },
      { id: 'event', label: 'Pet events', icon: Calendar, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
      { id: 'social', label: 'Social meetup', icon: Heart, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'agility', label: 'Agility fun', icon: Zap, gradient: 'from-lime-400 to-green-500', bg: 'bg-gradient-to-br from-lime-50 to-green-50' },
    ]
  },
  learn: {
    title: (petName) => petName ? `What should ${petName} learn?` : "What training are you interested in?",
    goals: [
      { id: 'obedience', label: 'Obedience', icon: Award, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
      { id: 'tricks', label: 'Fun tricks', icon: Sparkles, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-50' },
      { id: 'puppy_basics', label: 'Puppy basics', icon: Baby, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-50' },
      { id: 'behavior', label: 'Behavior issues', icon: Heart, gradient: 'from-red-400 to-rose-500', bg: 'bg-gradient-to-br from-red-50 to-rose-50' },
      { id: 'agility', label: 'Agility training', icon: Zap, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
      { id: 'socialization', label: 'Socialization', icon: Users, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-50' },
    ]
  }
};

// Fallback to fit goals if pillar not found
const FITNESS_GOALS = PILLAR_GOALS.fit.goals;

const ConversationalEntry = ({ 
  petName,
  pillar = 'fit', // NEW: Accept pillar prop
  onGoalSelect,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [hoveredGoal, setHoveredGoal] = useState(null);
  const [isTyping, setIsTyping] = useState(true);
  const [displayText, setDisplayText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedGoal, setSubmittedGoal] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  
  // Get pillar-specific config
  const pillarConfig = PILLAR_GOALS[pillar] || PILLAR_GOALS.fit;
  const goals = pillarConfig.goals;
  const fullText = pillarConfig.title(petName);

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

  const handleGoalClick = async (goal) => {
    const message = petName 
      ? `I want to help ${petName} with ${goal.label.toLowerCase()}`
      : `I'm interested in ${goal.label.toLowerCase()} for my pet`;
    
    // Create a Service Desk ticket directly (UNIFIED FLOW)
    // User Action → Service Desk Ticket → Admin Notification → Member Notification
    try {
      const token = localStorage.getItem('token');
      
      
      // Create the pillar request via unified flow
      const response = await fetch(`${API_URL}/api/concierge/pillar-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          pillar: pillar,
          request_type: goal.id,
          request_label: goal.label,
          message: message,
          pet_name: petName || 'Pet',
          source: 'conversational_entry'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Show success modal instead of navigating away
        setSubmittedGoal(goal);
        setTicketId(result.ticket_id || result.request_id);
        setShowSuccessModal(true);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (err) {
      console.error('Goal interaction failed:', err);
      // Fallback: Still try to record the interaction
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/engagement/goal-interaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            goal_id: goal.id,
            goal_label: goal.label,
            pillar: pillar,
            message: message
          })
        });
      } catch (e) {
        console.debug('Goal interaction logging failed:', e);
      }
      
      // On error, fall back to Mira chat
      if (onGoalSelect) {
        onGoalSelect(goal, message);
      } else {
        navigate(`/mira?context=${pillar}_${goal.id}&preset=${encodeURIComponent(message)}`);
      }
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
                Tap a goal to request concierge assistance
              </p>
            </div>
          </div>
        </div>

        {/* Goal Pills - Premium Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {goals.map((goal) => {
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
          onClick={() => navigate(`/mira?context=${pillar}`)}
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
      
      {/* Success Modal - Concierge® Confirmation */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Concierge® Bell with Paw */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse opacity-20" />
                <div className="absolute inset-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-purple-200">
                  <span className="text-2xl">🐾</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-bold text-gray-900">Request Received!</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Your <span className="font-semibold text-purple-600">{submittedGoal?.label}</span> request has been submitted.
              </p>
              
              <div className="bg-purple-50 rounded-2xl p-4 mb-6">
                <p className="text-purple-800 font-medium">
                  🔔 Our Concierge® team will get back to you within <span className="font-bold">24 hours</span>
                </p>
                {ticketId && (
                  <p className="text-purple-600 text-sm mt-2">
                    Reference: <span className="font-mono">{ticketId}</span>
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Continue Browsing
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/dashboard?tab=requests');
                  }}
                >
                  View My Requests
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConversationalEntry;
