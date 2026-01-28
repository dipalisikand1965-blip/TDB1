/**
 * SoulExplainerVideo Component
 * An animated, video-like explainer for Pet Soul™
 * Beautiful storytelling component showing what Pet Soul is and why it matters
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  PawPrint, Heart, Sparkles, Star, Trophy, Gift, Shield,
  ChevronRight, ChevronLeft, Play, Pause, Volume2, VolumeX,
  Brain, Zap, Users, Clock, ArrowRight, Check, X
} from 'lucide-react';

const SLIDES = [
  {
    id: 'intro',
    title: 'What is Pet Soul™?',
    subtitle: 'Your pet\'s digital personality passport',
    content: 'Pet Soul™ captures everything that makes your furry friend unique - their quirks, preferences, health needs, and personality traits.',
    icon: '✨',
    bgGradient: 'from-purple-600 via-pink-600 to-purple-700',
    animation: 'pulse'
  },
  {
    id: 'why',
    title: 'Why Does It Matter?',
    subtitle: 'Personalised care, every time',
    content: 'When you share your pet\'s soul profile, every recommendation, product suggestion, and service is tailored specifically for them.',
    icon: '🎯',
    bgGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    animation: 'bounce',
    points: [
      'Mira AI knows exactly what your pet loves',
      'Restaurants prepare meals your pet will adore',
      'Groomers understand their comfort levels',
      'Vets have instant access to health history'
    ]
  },
  {
    id: 'pillars',
    title: '14 Soul Pillars',
    subtitle: 'A complete picture of your pet\'s life',
    content: 'We explore 14 dimensions of your pet\'s life:',
    icon: '🧩',
    bgGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    pillars: [
      { name: 'Celebrate', icon: '🎂', desc: 'Birthdays & milestones' },
      { name: 'Dine', icon: '🍖', desc: 'Pet-friendly dining' },
      { name: 'Stay', icon: '🏨', desc: 'Boarding & daycare' },
      { name: 'Travel', icon: '✈️', desc: 'Adventures together' },
      { name: 'Care', icon: '💊', desc: 'Grooming & wellness' },
      { name: 'Enjoy', icon: '🎾', desc: 'Play & activities' },
      { name: 'Fit', icon: '🏃', desc: 'Exercise & fitness' },
      { name: 'Learn', icon: '🎓', desc: 'Training & behaviour' },
      { name: 'Paperwork', icon: '📋', desc: 'Documents & records' },
      { name: 'Advisory', icon: '💡', desc: 'Expert guidance' },
      { name: 'Emergency', icon: '🚨', desc: '24/7 support' },
      { name: 'Farewell', icon: '🌈', desc: 'End-of-life care' },
      { name: 'Adopt', icon: '🐾', desc: 'Find a friend' },
      { name: 'Shop', icon: '🛒', desc: 'Products & treats' }
    ]
  },
  {
    id: 'score',
    title: 'Your Soul Score',
    subtitle: 'Watch your bond grow',
    content: 'As you answer more questions, your Soul Score increases. Higher scores unlock exclusive rewards and personalised experiences.',
    icon: '📈',
    bgGradient: 'from-amber-500 via-orange-500 to-amber-600',
    tiers: [
      { name: 'Newcomer', range: '0-24%', icon: '🌱', color: 'green' },
      { name: 'Soul Seeker', range: '25-49%', icon: '🔍', color: 'blue' },
      { name: 'Soul Explorer', range: '50-74%', icon: '🧭', color: 'purple' },
      { name: 'Soul Guardian', range: '75-99%', icon: '🛡️', color: 'orange' },
      { name: 'Soul Master', range: '100%', icon: '👑', color: 'gold' }
    ]
  },
  {
    id: 'rewards',
    title: 'Earn Paw Points',
    subtitle: 'Your answers = Real rewards',
    content: 'Every soul question you answer earns you Paw Points. Redeem them for discounts, free treats, grooming sessions, and exclusive experiences!',
    icon: '🎁',
    bgGradient: 'from-pink-600 via-rose-600 to-pink-700',
    rewards: [
      { points: 100, reward: '₹50 Off' },
      { points: 250, reward: 'Free Treats' },
      { points: 500, reward: 'Free Grooming' },
      { points: 1000, reward: 'VIP Experience' }
    ]
  },
  {
    id: 'whisper',
    title: 'Soul Whisper™',
    subtitle: 'One question, every day',
    content: 'Enable Soul Whisper and we\'ll send you one gentle question daily via WhatsApp. Answer in seconds, build your pet\'s profile effortlessly.',
    icon: '💬',
    bgGradient: 'from-green-600 via-emerald-600 to-green-700',
    features: [
      'Daily WhatsApp message',
      'Quick tap to answer',
      'Never overwhelming',
      'Build score over time'
    ]
  },
  {
    id: 'cta',
    title: 'Start Your Journey',
    subtitle: 'Every answer brings you closer',
    content: 'The more we know about your pet, the better we can serve you both. Start building your pet\'s soul profile today!',
    icon: '🚀',
    bgGradient: 'from-purple-600 via-violet-600 to-purple-700',
    cta: true
  }
];

const SoulExplainerVideo = ({ onClose, onStartJourney, petName = 'your pet' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;
  
  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying) return;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next slide
          if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(c => c + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + 1;
      });
    }, 80); // ~8 seconds per slide
    
    return () => clearInterval(progressInterval);
  }, [isPlaying, currentSlide]);
  
  const goToSlide = (index) => {
    setCurrentSlide(index);
    setProgress(0);
  };
  
  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(c => c + 1);
      setProgress(0);
    }
  };
  
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(c => c - 1);
      setProgress(0);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="soul-explainer">
      <div className="w-full max-w-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide 
                  ? 'w-8 bg-white' 
                  : idx < currentSlide 
                    ? 'w-4 bg-white/60' 
                    : 'w-4 bg-white/30'
              }`}
            />
          ))}
        </div>
        
        {/* Main Card */}
        <Card className={`overflow-hidden bg-gradient-to-br ${slide.bgGradient} text-white border-none shadow-2xl`}>
          {/* Progress Bar */}
          <div className="h-1 bg-white/20">
            <div 
              className="h-full bg-white/60 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="p-8 min-h-[400px] flex flex-col">
            {/* Icon */}
            <div className={`text-6xl mb-4 ${slide.animation === 'pulse' ? 'animate-pulse' : slide.animation === 'bounce' ? 'animate-bounce' : ''}`}>
              {slide.icon}
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
            <p className="text-lg text-white/80 mb-4">{slide.subtitle}</p>
            
            {/* Content */}
            <p className="text-white/90 mb-6">{slide.content.replace('your pet', petName)}</p>
            
            {/* Slide-specific content */}
            {slide.points && (
              <ul className="space-y-2 mb-6">
                {slide.points.map((point, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-green-300" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
            
            {slide.pillars && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {slide.pillars.map((pillar, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                    <span className="text-xl">{pillar.icon}</span>
                    <p className="text-xs font-medium mt-1">{pillar.name}</p>
                  </div>
                ))}
              </div>
            )}
            
            {slide.tiers && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {slide.tiers.map((tier, idx) => (
                  <div key={idx} className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[100px]">
                    <span className="text-2xl">{tier.icon}</span>
                    <p className="text-xs font-bold mt-1">{tier.name}</p>
                    <p className="text-[10px] text-white/70">{tier.range}</p>
                  </div>
                ))}
              </div>
            )}
            
            {slide.rewards && (
              <div className="flex gap-3 mb-6">
                {slide.rewards.map((r, idx) => (
                  <div key={idx} className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">{r.points}</p>
                    <p className="text-[10px] text-white/70">points</p>
                    <p className="text-xs font-medium mt-1">{r.reward}</p>
                  </div>
                ))}
              </div>
            )}
            
            {slide.features && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {slide.features.map((feature, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-300 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}
            
            {slide.cta && (
              <div className="flex-1 flex items-end">
                <Button 
                  onClick={onStartJourney}
                  className="w-full bg-white text-purple-700 hover:bg-white/90 font-bold py-4 text-lg group"
                >
                  Start {petName}&apos;s Soul Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
            
            {/* Spacer */}
            <div className="flex-1" />
          </div>
          
          {/* Navigation */}
          <div className="px-8 pb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            {!isLastSlide ? (
              <Button
                variant="ghost"
                onClick={nextSlide}
                className="text-white hover:bg-white/10"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={onStartJourney}
                className="bg-white text-purple-700 hover:bg-white/90"
              >
                Let&apos;s Go!
                <Sparkles className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>
        
        {/* Skip Button */}
        <button 
          onClick={onClose}
          className="w-full mt-4 text-center text-white/60 hover:text-white/80 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

// Mini trigger button to open the explainer
export const SoulExplainerButton = ({ petName, onOpenExplainer }) => {
  return (
    <button
      onClick={onOpenExplainer}
      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-full transition-all"
      data-testid="soul-explainer-btn"
    >
      <span className="text-lg">✨</span>
      <span className="text-sm font-medium text-purple-700">What is Pet Soul?</span>
      <Play className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
    </button>
  );
};

export default SoulExplainerVideo;
