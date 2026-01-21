/**
 * PetSoulJourney - The logged-in member's view of their Pet Soul progress
 * 
 * THE DOCTRINE: "The system must feel like it remembers, not like it asks."
 * 
 * This replaces the generic sales pitch on /membership for logged-in members.
 * It shows their actual journey - achievements, progress, and next steps.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Brain, Heart, PawPrint, Trophy, Star, Sparkles, 
  TrendingUp, Calendar, Shield, Check, ChevronRight,
  Cake, UtensilsCrossed, Plane, Home, Activity, Stethoscope,
  Crown, Zap, Gift, FileText, Clock, ArrowRight
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

// Membership level badges
const MEMBERSHIP_LEVELS = {
  curious_pup: { name: 'Curious Pup', emoji: '🐕', color: 'from-gray-400 to-gray-500' },
  loyal_companion: { name: 'Loyal Companion', emoji: '🦮', color: 'from-blue-400 to-blue-600' },
  trusted_guardian: { name: 'Trusted Guardian', emoji: '🐕‍🦺', color: 'from-purple-400 to-purple-600' },
  pack_leader: { name: 'Pack Leader', emoji: '👑', color: 'from-amber-400 to-amber-600' }
};

// Pillar configuration
const PILLARS = [
  { key: 'identity', name: 'Identity & Temperament', icon: '🎭', color: 'bg-purple-100 text-purple-600' },
  { key: 'family', name: 'Family & Pack', icon: '👨‍👩‍👧‍👦', color: 'bg-blue-100 text-blue-600' },
  { key: 'rhythm', name: 'Rhythm & Routine', icon: '⏰', color: 'bg-green-100 text-green-600' },
  { key: 'home', name: 'Home Comforts', icon: '🏠', color: 'bg-amber-100 text-amber-600' },
  { key: 'travel', name: 'Travel Style', icon: '✈️', color: 'bg-sky-100 text-sky-600' },
  { key: 'taste', name: 'Taste & Treat', icon: '🍖', color: 'bg-orange-100 text-orange-600' },
  { key: 'training', name: 'Training & Behaviour', icon: '🎓', color: 'bg-indigo-100 text-indigo-600' },
  { key: 'horizon', name: 'Long Horizon', icon: '🌅', color: 'bg-rose-100 text-rose-600' }
];

const PetSoulJourney = ({ user, pets = [], onOpenMira }) => {
  const [selectedPet, setSelectedPet] = useState(pets[0] || null);
  const [soulData, setSoulData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const petName = selectedPet?.name || 'your pet';
  const memberLevel = MEMBERSHIP_LEVELS[user?.membership_level || 'curious_pup'];
  
  // Calculate membership tenure
  const getMembershipTenure = () => {
    if (!user?.created_at) return 'New member';
    const start = new Date(user.created_at);
    const now = new Date();
    const months = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'New member';
    if (months === 1) return '1 month';
    return `${months} months`;
  };

  // Fetch soul completeness data
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!selectedPet?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${getApiUrl()}/api/pet-gate/soul-completeness/${selectedPet.id}`);
        if (res.ok) {
          const data = await res.json();
          setSoulData(data);
        }
      } catch (error) {
        console.error('Error fetching soul data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSoulData();
  }, [selectedPet?.id]);

  // Get pet's achievements from soul data
  const getAchievements = () => {
    const achievements = selectedPet?.achievements || [];
    if (achievements.length > 0) return achievements;
    
    // Default achievements based on activity
    const defaultAchievements = [];
    if (selectedPet?.name) {
      defaultAchievements.push({ icon: '🐾', name: 'Soul Created', desc: 'Started the journey' });
    }
    if (soulData?.overall_score > 20) {
      defaultAchievements.push({ icon: '🌟', name: 'Getting Started', desc: '20% soul complete' });
    }
    if (soulData?.overall_score > 50) {
      defaultAchievements.push({ icon: '🏆', name: 'Halfway There', desc: '50% soul complete' });
    }
    return defaultAchievements;
  };

  // Get next actions to improve soul
  const getNextActions = () => {
    const actions = [];
    
    if (soulData?.missing_essential?.length > 0) {
      actions.push({
        title: `Add ${soulData.missing_essential[0]}`,
        desc: 'Essential info for better recommendations',
        link: `/pets/${selectedPet?.id}?tab=soul`,
        priority: 'high'
      });
    }
    
    if (soulData?.missing_important?.length > 0) {
      actions.push({
        title: `Tell us about ${petName}'s ${soulData.missing_important[0]}`,
        desc: 'Helps Mira understand better',
        link: `/pets/${selectedPet?.id}?tab=soul`,
        priority: 'medium'
      });
    }
    
    // Always suggest talking to Mira
    actions.push({
      title: `Ask Mira about ${petName}`,
      desc: 'Every chat enriches the soul',
      action: 'mira',
      priority: 'low'
    });
    
    return actions.slice(0, 3);
  };

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PawPrint className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Pet Soul Journey
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Add your first pet to begin building their evolving digital soul.
          </p>
          <Link to="/pets/add">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
              <PawPrint className="w-5 h-5 mr-2" />
              Add Your Pet
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const achievements = getAchievements();
  const nextActions = getNextActions();
  const overallScore = soulData?.overall_score || selectedPet?.overall_score || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="pet-soul-journey">
      {/* Hero - Recognition, not sales */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left - Pet info */}
            <div className="flex items-center gap-6">
              {/* Pet avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {selectedPet?.image_url ? (
                    <img src={selectedPet.image_url} alt={petName} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-12 h-12 text-white/60" />
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${memberLevel.color} text-white shadow-lg`}>
                  {memberLevel.emoji} {memberLevel.name}
                </div>
              </div>
              
              {/* Pet details */}
              <div>
                <p className="text-white/70 text-sm mb-1">Pet Soul Journey</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{petName}</h1>
                <p className="text-white/80">
                  {selectedPet?.breed || 'Your beloved pet'} 
                  {selectedPet?.age ? ` • ${selectedPet.age}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Member for {getMembershipTenure()}</span>
                </div>
              </div>
            </div>
            
            {/* Right - Soul Score */}
            <div className="text-center md:text-right">
              <p className="text-white/70 text-sm mb-2">Pet Soul Score</p>
              <div className="flex items-center justify-center md:justify-end gap-3">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${overallScore * 2.26} 226`}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(overallScore)}%</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">
                    {overallScore < 30 ? 'Just Getting Started' : 
                     overallScore < 60 ? 'Growing Together' : 
                     overallScore < 80 ? 'Deep Understanding' : 'Soul Mates'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {100 - Math.round(overallScore)}% left to discover
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pet switcher if multiple pets */}
          {pets.length > 1 && (
            <div className="flex gap-2 mt-6 pt-6 border-t border-white/20">
              <span className="text-white/60 text-sm self-center mr-2">Switch pet:</span>
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedPet?.id === pet.id
                      ? 'bg-white text-purple-700 font-semibold'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {pet.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* What We Know Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                What We Know About {petName}
              </h2>
              <p className="text-gray-600">This is {petName}&apos;s evolving digital soul</p>
            </div>
            <Link to={`/pets/${selectedPet?.id}?tab=soul`}>
              <Button variant="outline" className="border-purple-200 text-purple-600">
                View Full Soul <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {/* 8 Pillars Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PILLARS.map((pillar) => {
              const score = soulData?.pillar_scores?.[pillar.key] || 0;
              return (
                <Card key={pillar.key} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{pillar.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{pillar.name}</p>
                    </div>
                  </div>
                  <Progress value={score} className="h-2 mb-1" />
                  <p className="text-xs text-gray-500 text-right">{Math.round(score)}%</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-amber-500" />
            {petName}&apos;s Achievements
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {achievements.length > 0 ? achievements.slice(0, 6).map((achievement, idx) => (
              <Card key={idx} className="p-4 flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">
                  {achievement.icon || '🏆'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{achievement.name}</p>
                  <p className="text-sm text-gray-600">{achievement.desc || achievement.date}</p>
                </div>
              </Card>
            )) : (
              <Card className="p-6 col-span-3 text-center bg-gray-50">
                <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Achievements unlock as you build {petName}&apos;s soul</p>
              </Card>
            )}
          </div>
        </section>

        {/* Next Steps Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-purple-600" />
            Continue {petName}&apos;s Journey
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {nextActions.map((action, idx) => (
              <Card 
                key={idx} 
                className={`p-5 cursor-pointer hover:shadow-lg transition-all group ${
                  action.priority === 'high' ? 'border-2 border-purple-200 bg-purple-50' : ''
                }`}
                onClick={() => action.action === 'mira' ? onOpenMira?.() : null}
              >
                {action.link ? (
                  <Link to={action.link} className="block">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.desc}</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Mira Section */}
        <section className="mb-10">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">Mira Remembers Everything</h3>
                <p className="text-white/90">
                  Ask Mira anything about {petName} - she already knows their preferences, 
                  health history, and personality. No need to repeat yourself.
                </p>
              </div>
              <Button 
                onClick={onOpenMira}
                className="bg-white text-purple-600 hover:bg-purple-50 px-6"
                data-testid="journey-chat-mira-btn"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Chat with Mira
              </Button>
            </div>
          </Card>
        </section>

        {/* Membership Benefits Reminder */}
        <section>
          <Card className="p-6 bg-gradient-to-r from-slate-50 to-purple-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${memberLevel.color} flex items-center justify-center text-white text-xl`}>
                  {memberLevel.emoji}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{memberLevel.name} Benefits Active</p>
                  <p className="text-sm text-gray-600">
                    All 12 pillars unlocked • Priority support • Health vault access
                  </p>
                </div>
              </div>
              <Link to="/my-pets">
                <Button variant="ghost" className="text-purple-600">
                  Manage Membership <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default PetSoulJourney;
