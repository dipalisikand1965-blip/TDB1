/**
 * MiraDailyTip - Fun rotating daily tips from Mira
 * Changes each day, personalized to pet name
 * 
 * Categories: Fun Facts, Pro Tips, Health Tips, Training Tips, Seasonal Tips
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Lightbulb, Heart, Brain, Sparkles, Sun, Moon, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

// Comprehensive tip database organized by category
const DAILY_TIPS = {
  fun_facts: [
    { tip: "Dogs have about 1,700 taste buds, while humans have 9,000! That's why they'll eat almost anything 🐕", icon: "🦴" },
    { tip: "A dog's nose print is unique, just like a human fingerprint! Your {petName} is one of a kind 👃", icon: "🐾" },
    { tip: "Dogs can smell your emotions! {petName} knows when you're happy, sad, or stressed 💕", icon: "❤️" },
    { tip: "Dogs dream just like humans do! {petName} might be chasing squirrels in dreamland right now 💤", icon: "🌙" },
    { tip: "A dog's sense of smell is 10,000-100,000 times more acute than ours! {petName} lives in a world of scents 🌸", icon: "👃" },
    { tip: "Dogs can learn over 200 words! {petName} understands more than you think 🧠", icon: "📚" },
    { tip: "A wagging tail doesn't always mean happy! The direction and speed matters. Learn {petName}'s signals! 🐕", icon: "🎯" },
    { tip: "Dogs have three eyelids! The third one keeps their eyes moist and protected 👀", icon: "✨" },
    { tip: "Puppies are born deaf and blind! They develop these senses in their first few weeks 🐶", icon: "🍼" },
    { tip: "Dogs curl up when sleeping to protect their organs - an instinct from their wild ancestors! 🐺", icon: "😴" },
    { tip: "Your dog's wet nose helps absorb scent chemicals! The wetter, the better sniffer 💧", icon: "👃" },
    { tip: "Dogs can see in the dark much better than humans thanks to a special membrane in their eyes! 🌙", icon: "🔦" },
  ],
  
  pro_tips: [
    { tip: "Puzzle toys keep {petName}'s brain sharp! Mental stimulation is just as important as physical exercise 🧩", icon: "🧠" },
    { tip: "Rotate {petName}'s toys weekly to keep them exciting - 'new' toys are more fun! 🎾", icon: "🔄" },
    { tip: "The best time to train {petName} is right before meals when they're most motivated! 🦴", icon: "⏰" },
    { tip: "Sniffing is mentally tiring for dogs! Let {petName} explore on walks - it's like reading the news 📰", icon: "👃" },
    { tip: "Consistency is key! Use the same words for commands so {petName} doesn't get confused 📝", icon: "✅" },
    { tip: "End every training session on a win! Even if it's just a simple 'sit' - success builds confidence 🏆", icon: "🌟" },
    { tip: "Frozen treats last longer! Freeze {petName}'s favorite snacks for extended enjoyment 🧊", icon: "❄️" },
    { tip: "White noise can help anxious dogs relax during storms or fireworks! Try calming music too 🎵", icon: "🎧" },
    { tip: "A tired dog is a happy dog! {petName} needs both physical AND mental exercise daily 🏃", icon: "💪" },
    { tip: "Brush {petName}'s teeth 2-3 times a week! Dental health affects overall health 🦷", icon: "✨" },
  ],
  
  health_tips: [
    { tip: "Regular vet checkups catch issues early! Schedule {petName}'s annual wellness visit 🏥", icon: "💊" },
    { tip: "Keep {petName}'s nails trimmed! Long nails can cause pain and affect their gait 💅", icon: "✂️" },
    { tip: "Fresh water should always be available! Dogs need about 1 oz of water per pound of body weight daily 💧", icon: "🥤" },
    { tip: "Check {petName}'s ears weekly for redness, odor, or discharge - early detection prevents infections! 👂", icon: "🔍" },
    { tip: "Grapes, chocolate, onions, and xylitol are toxic to dogs! Keep them safely away from {petName} ⚠️", icon: "🚫" },
    { tip: "Watch {petName}'s weight! Extra pounds strain joints and can shorten their lifespan 📊", icon: "⚖️" },
    { tip: "Panting can mean {petName} is hot, excited, or stressed. Learn to read the difference! 🌡️", icon: "😮‍💨" },
    { tip: "Flea and tick prevention is year-round, not just summer! Protect {petName} always 🛡️", icon: "🐜" },
  ],
  
  seasonal: [
    { tip: "Hot pavement burns paws! If it's too hot for your hand, it's too hot for {petName}'s feet 🔥", icon: "☀️", season: "summer" },
    { tip: "Never leave {petName} in a parked car! Even with windows cracked, temperatures can be deadly 🚗", icon: "⚠️", season: "summer" },
    { tip: "Provide shade and cool water during summer walks! {petName} can overheat quickly 💦", icon: "🌴", season: "summer" },
    { tip: "Salt and de-icers can irritate {petName}'s paws! Wipe them after winter walks 🧂", icon: "❄️", season: "winter" },
    { tip: "Short-haired dogs may need a sweater in cold weather! Keep {petName} warm and cozy 🧥", icon: "🧣", season: "winter" },
    { tip: "Antifreeze is deadly and tastes sweet to dogs! Keep it away from {petName} ☠️", icon: "⚠️", season: "winter" },
    { tip: "Spring allergies affect dogs too! Watch for excessive scratching or licking 🌸", icon: "🤧", season: "spring" },
    { tip: "Rainy season means muddy paws! Keep towels by the door for {petName} 🌧️", icon: "🧹", season: "monsoon" },
  ],
  
  bonding: [
    { tip: "Eye contact releases oxytocin in both you and {petName}! Soft gazes strengthen your bond 👀", icon: "💕" },
    { tip: "Dogs love routine! Consistent schedules make {petName} feel safe and secure 📅", icon: "🏠" },
    { tip: "Quality time > quantity! 15 minutes of focused play beats hours of ignored presence 🎯", icon: "⏱️" },
    { tip: "Let {petName} choose sometimes! Follow their lead on walks to see what interests them 🐕‍🦺", icon: "🚶" },
    { tip: "Your calm energy calms {petName}! Dogs are emotional mirrors - stay relaxed around them 🧘", icon: "😌" },
    { tip: "Celebrate small victories with {petName}! Every good behavior deserves acknowledgment 🎉", icon: "🏆" },
    { tip: "Physical touch matters! Regular petting lowers stress hormones in both of you 🤲", icon: "💆" },
    { tip: "Talk to {petName}! They may not understand words, but they love your voice 🗣️", icon: "💬" },
  ]
};

// Get a tip based on day of year (so it changes daily but is consistent throughout the day)
const getDailyTip = (petName = 'your pup') => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Flatten all tips into one array
  const allTips = [
    ...DAILY_TIPS.fun_facts,
    ...DAILY_TIPS.pro_tips,
    ...DAILY_TIPS.health_tips,
    ...DAILY_TIPS.seasonal.filter(t => !t.season || isCurrentSeason(t.season)),
    ...DAILY_TIPS.bonding
  ];
  
  // Use day of year to pick a tip (cycles through all tips over the year)
  const tipIndex = dayOfYear % allTips.length;
  const tip = allTips[tipIndex];
  
  // Replace {petName} placeholder
  return {
    ...tip,
    tip: tip.tip.replace(/{petName}/g, petName)
  };
};

// Check if tip matches current season
const isCurrentSeason = (season) => {
  const month = new Date().getMonth();
  switch(season) {
    case 'summer': return month >= 3 && month <= 5; // April-June in India
    case 'monsoon': return month >= 6 && month <= 8; // July-September
    case 'winter': return month >= 10 || month <= 1; // November-February
    case 'spring': return month >= 2 && month <= 3; // March-April
    default: return true;
  }
};

// Get category color based on tip content
const getCategoryInfo = (tip) => {
  if (tip.tip.includes('health') || tip.tip.includes('vet') || tip.tip.includes('toxic') || tip.tip.includes('weight')) {
    return { color: 'from-red-400 to-rose-400', label: 'Health Tip', bg: 'bg-red-50' };
  }
  if (tip.tip.includes('train') || tip.tip.includes('command') || tip.tip.includes('behavior')) {
    return { color: 'from-blue-400 to-indigo-400', label: 'Training Tip', bg: 'bg-blue-50' };
  }
  if (tip.tip.includes('bond') || tip.tip.includes('love') || tip.tip.includes('quality time')) {
    return { color: 'from-pink-400 to-rose-400', label: 'Bonding Tip', bg: 'bg-pink-50' };
  }
  if (tip.tip.includes('hot') || tip.tip.includes('cold') || tip.tip.includes('winter') || tip.tip.includes('summer')) {
    return { color: 'from-amber-400 to-orange-400', label: 'Seasonal Tip', bg: 'bg-amber-50' };
  }
  return { color: 'from-purple-400 to-pink-400', label: 'Fun Fact', bg: 'bg-purple-50' };
};

// Main Component
const MiraDailyTip = ({ petName = 'your pup', className = '' }) => {
  const [tip, setTip] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setTip(getDailyTip(petName));
  }, [petName]);
  
  const refreshTip = () => {
    setIsAnimating(true);
    // Get a random tip instead of daily
    const allTips = [
      ...DAILY_TIPS.fun_facts,
      ...DAILY_TIPS.pro_tips,
      ...DAILY_TIPS.health_tips,
      ...DAILY_TIPS.bonding
    ];
    const randomTip = allTips[Math.floor(Math.random() * allTips.length)];
    
    setTimeout(() => {
      setTip({
        ...randomTip,
        tip: randomTip.tip.replace(/{petName}/g, petName)
      });
      setIsAnimating(false);
    }, 300);
  };
  
  if (!tip) return null;
  
  const category = getCategoryInfo(tip);
  
  return (
    <Card className={`overflow-hidden ${className}`} data-testid="mira-daily-tip">
      {/* Header */}
      <div className={`bg-gradient-to-r ${category.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-bounce-gentle">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Mira's Daily Tip</h3>
              <p className="text-white/80 text-xs">{category.label}</p>
            </div>
          </div>
          <button 
            onClick={refreshTip}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Get another tip"
          >
            <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Tip Content */}
      <div className={`p-4 ${category.bg} transition-all ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{tip.icon}</span>
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      </div>
      
      {/* Footer with Mira */}
      <div className="px-4 py-3 bg-white border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-lg">🐕‍🦺</span>
          <span className="italic">Mira knows best!</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={refreshTip}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          Another tip
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

// Compact inline version for dashboard
export const MiraDailyTipInline = ({ petName = 'your pup' }) => {
  const [tip, setTip] = useState(null);
  
  useEffect(() => {
    setTip(getDailyTip(petName));
  }, [petName]);
  
  if (!tip) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 border border-purple-200" data-testid="mira-daily-tip-inline">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce-slow">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-purple-600">💡 Mira's Tip of the Day</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="text-lg mr-2">{tip.icon}</span>
            {tip.tip}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraDailyTip;
