/**
 * BirthdayCountdown.jsx
 * 
 * A magical birthday countdown component that creates emotional anticipation.
 * Shows different UI based on days until birthday.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, Gift, PartyPopper, Sparkles, Calendar, Heart, Star, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import confetti from 'canvas-confetti';

const BirthdayCountdown = ({ pet, onPlanParty, onViewCakes }) => {
  const [daysUntil, setDaysUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (!pet?.birth_date) return;
    
    const calculateDaysUntil = () => {
      const today = new Date();
      const birthDate = new Date(pet.birth_date);
      
      // Get next birthday
      let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      // If birthday has passed this year, get next year's
      // Guard: don't jump to next year if today IS the birthday (calendar date match)
      const isBirthdayToday = today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
      if (!isBirthdayToday && nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      }
      
      const timeDiff = nextBirthday.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Calculate hours and minutes for day-of countdown
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      setDaysUntil(days);
      setTimeLeft({ days, hours, minutes });
      
      // Trigger confetti on birthday!
      if (days === 0 && !showConfetti) {
        setShowConfetti(true);
        triggerConfetti();
      }
    };
    
    calculateDaysUntil();
    const interval = setInterval(calculateDaysUntil, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [pet?.birth_date, showConfetti]);
  
  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff69b4', '#ff1493', '#da70d6', '#ba55d3', '#9370db']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ffd700', '#ffa500', '#ff6347', '#ff4500', '#ff69b4']
      });
    }, 250);
  };
  
  const getPetAge = () => {
    if (!pet?.birth_date) return null;
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age + 1; // Next birthday age
  };
  
  if (!pet?.birth_date || daysUntil === null) {
    return null;
  }
  
  const nextAge = getPetAge();
  const petName = pet?.name || 'Your pet';
  
  // Birthday is TODAY!
  if (daysUntil === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden"
      >
        <Card className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-0">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ 
                  x: Math.random() * 100 + '%',
                  y: -20,
                  opacity: 0.7
                }}
                animate={{ 
                  y: '120%',
                  rotate: 360
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                {['🎂', '🎁', '🎈', '🎉', '⭐', '💖'][i % 6]}
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-10 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-6xl sm:text-8xl mb-4"
            >
              🎂
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              Happy Birthday, {petName}!
            </h2>
            <p className="text-xl sm:text-2xl text-pink-100 mb-6">
              {petName} turns {nextAge} today! 🎉
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={onPlanParty}
                className="bg-white text-purple-600 hover:bg-pink-100 font-bold rounded-full px-8 shadow-lg"
              >
                <PartyPopper className="w-5 h-5 mr-2" />
                Celebrate Now!
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={onViewCakes}
                className="border-white text-white hover:bg-white/20 rounded-full px-8"
              >
                <Cake className="w-5 h-5 mr-2" />
                Order Birthday Cake
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  // Within 7 days - Excitement mode!
  if (daysUntil <= 7) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white p-5 sm:p-6 rounded-2xl shadow-xl border-0 overflow-hidden relative">
          {/* Sparkle effects */}
          <div className="absolute top-2 right-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </motion.div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <span className="text-3xl sm:text-4xl">🎂</span>
              </motion.div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                <span className="text-sm font-medium text-white/90">This week is special!</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                {petName}'s Birthday in {daysUntil} day{daysUntil !== 1 ? 's' : ''}!
              </h3>
              <p className="text-sm text-white/80">
                {petName} turns {nextAge} on {new Date(pet.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            
            <Button 
              onClick={onPlanParty}
              className="hidden sm:flex bg-white text-orange-600 hover:bg-orange-50 font-semibold rounded-full shadow-lg"
            >
              <Gift className="w-4 h-4 mr-2" />
              Plan Party
            </Button>
          </div>
          
          {/* Mobile button */}
          <Button 
            onClick={onPlanParty}
            className="sm:hidden w-full mt-4 bg-white text-orange-600 hover:bg-orange-50 font-semibold rounded-full"
          >
            <Gift className="w-4 h-4 mr-2" />
            Plan {petName}'s Party
          </Button>
        </Card>
      </motion.div>
    );
  }
  
  // Within 14 days - Time to plan!
  if (daysUntil <= 14) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 sm:p-5 rounded-2xl shadow-lg border-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-white/80 mb-0.5">Time to plan!</p>
              <h3 className="text-lg sm:text-xl font-bold">
                {petName}'s Birthday in {daysUntil} days
              </h3>
            </div>
            
            <Button 
              onClick={onPlanParty}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full"
            >
              Plan Now
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  // Within 30 days - Gentle reminder
  if (daysUntil <= 30) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="bg-gradient-to-r from-violet-100 to-pink-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Cake className="w-5 h-5 text-purple-600" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-purple-700 font-medium">
                {petName} turns {nextAge} in {daysUntil} days
              </p>
              <p className="text-xs text-purple-500">
                Start planning the celebration!
              </p>
            </div>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={onPlanParty}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
            >
              Plan <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  // More than 30 days - No countdown shown
  return null;
};

// Small ChevronRight import
const ChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default BirthdayCountdown;
