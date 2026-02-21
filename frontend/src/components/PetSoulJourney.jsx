/**
 * PetSoulJourney - A Living Portrait, Not a Dashboard
 * 
 * THE DOCTRINE: 
 * "The Pet Soul Journey should feel like someone quietly paying attention — 
 * not like a system asking for information."
 * 
 * CORE PRINCIPLES:
 * - This is a confidence-of-understanding system, NOT a profile completion system
 * - Fewer questions over time, better recognition over time
 * - Less visible "system", more visible care
 * 
 * STAGES:
 * - 0-20%: "We've just met" - Minimal data, early trust
 * - 20-50%: "Patterns are emerging" - Early preferences visible
 * - 50-80%: "We know [Pet]" - Strong confidence, clear preferences  
 * - 80-100%: "This system knows my pet" - Deep trust, longitudinal memory
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Brain, Heart, PawPrint, Sparkles, 
  ChevronRight, Clock, Star
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

// 14 Soul Pillars - Visual representation
const SOUL_PILLARS = [
  { key: 'celebrate', name: 'Celebrate', icon: '🎂', colorClass: 'bg-pink-400' },
  { key: 'dine', name: 'Dine', icon: '🍖', colorClass: 'bg-orange-400' },
  { key: 'stay', name: 'Stay', icon: '🏨', colorClass: 'bg-emerald-400' },
  { key: 'travel', name: 'Travel', icon: '✈️', colorClass: 'bg-sky-400' },
  { key: 'care', name: 'Care', icon: '💊', colorClass: 'bg-rose-400' },
  { key: 'enjoy', name: 'Enjoy', icon: '🎾', colorClass: 'bg-yellow-400' },
  { key: 'fit', name: 'Fit', icon: '🏃', colorClass: 'bg-green-400' },
  { key: 'learn', name: 'Learn', icon: '🎓', colorClass: 'bg-indigo-400' },
  { key: 'paperwork', name: 'Paperwork', icon: '📋', colorClass: 'bg-gray-400' },
  { key: 'advisory', name: 'Advisory', icon: '💡', colorClass: 'bg-amber-400' },
  { key: 'emergency', name: 'Emergency', icon: '🚨', colorClass: 'bg-red-400' },
  { key: 'farewell', name: 'Farewell', icon: '🌈', colorClass: 'bg-purple-400' },
  { key: 'adopt', name: 'Adopt', icon: '🐾', colorClass: 'bg-teal-400' },
  { key: 'shop', name: 'Shop', icon: '🛒', colorClass: 'bg-blue-400' }
];

// Generate pillar insight text based on soul data
const getPillarInsight = (pillarKey, soulData, petName) => {
  const answers = soulData?.doggy_soul_answers || {};
  
  const insightMap = {
    identity_temperament: answers.describe_3_words 
      ? `${petName} is ${answers.describe_3_words.toLowerCase()}`
      : answers.general_nature 
        ? `Generally ${answers.general_nature.toLowerCase()}`
        : null,
    family_pack: answers.most_attached_to
      ? `Most attached to ${answers.most_attached_to.toLowerCase()}`
      : answers.behavior_with_dogs
        ? `${answers.behavior_with_dogs} with other dogs`
        : null,
    rhythm_routine: answers.walks_per_day
      ? `${answers.walks_per_day} walks daily, active in ${(answers.energetic_time || 'day').toLowerCase()}`
      : null,
    home_comforts: answers.space_preference
      ? `Prefers ${answers.space_preference.toLowerCase()}`
      : answers.crate_trained === 'Yes'
        ? 'Comfortable with crate training'
        : null,
    travel_style: answers.car_rides
      ? answers.car_rides.toLowerCase().includes('love') 
        ? 'Enjoys car rides'
        : answers.car_rides.toLowerCase().includes('anxi')
          ? 'Gets anxious during travel'
          : `Travel: ${answers.car_rides}`
      : null,
    taste_treat: answers.favorite_treats?.length
      ? `Loves ${Array.isArray(answers.favorite_treats) ? answers.favorite_treats.join(', ').toLowerCase() : answers.favorite_treats}`
      : answers.food_allergies?.length
        ? `Sensitive to ${Array.isArray(answers.food_allergies) ? answers.food_allergies.join(', ').toLowerCase() : answers.food_allergies}`
        : null,
    training_behaviour: answers.training_level
      ? `${answers.training_level}`
      : null,
    long_horizon: null
  };
  
  return insightMap[pillarKey];
};

// Get learning timeline entries from soul data
const getLearningTimeline = (soulData, petName) => {
  const entries = [];
  const answers = soulData?.doggy_soul_answers || {};
  const pillarInteractions = soulData?.pillar_interactions || [];
  
  if (answers.auto_learned_from) {
    entries.push({
      text: 'Preferences learned from recent activity',
      source: 'behaviour'
    });
  }
  
  if (answers.food_allergies?.length && answers.food_allergies[0] !== 'None') {
    const allergies = Array.isArray(answers.food_allergies) ? answers.food_allergies.join(', ') : answers.food_allergies;
    entries.push({
      text: `${allergies} sensitivity noted`,
      source: 'you'
    });
  }
  
  if (answers.prefers_grain_free) {
    entries.push({
      text: 'Prefers grain-free options',
      source: 'behaviour'
    });
  }
  
  if (answers.separation_anxiety && answers.separation_anxiety !== 'None') {
    entries.push({
      text: `${answers.separation_anxiety} separation comfort`,
      source: 'you'
    });
  }
  
  if (answers.car_rides?.toLowerCase().includes('love')) {
    entries.push({
      text: `${petName} enjoys car rides`,
      source: 'you'
    });
  }
  
  if (answers.crate_trained === 'Yes') {
    entries.push({
      text: 'Comfortable with crate',
      source: 'you'
    });
  }
  
  if (answers.loves_celebrations) {
    entries.push({
      text: `${petName} loves celebrations`,
      source: 'behaviour'
    });
  }
  
  pillarInteractions.forEach(interaction => {
    if (interaction.learned?.favorite_treats?.length) {
      entries.push({
        text: `Loves ${interaction.learned.favorite_treats.join(', ')}`,
        source: 'behaviour'
      });
    }
  });
  
  return entries.slice(0, 8);
};

// Get achievements based on soul progress
const getAchievements = (soulData, overallScore) => {
  const achievements = [];
  const folderScores = soulData?.folder_scores || {};
  
  if (overallScore < 50) return [];
  
  if (folderScores.rhythm_routine >= 80) {
    achievements.push({ name: 'Routine Understood', icon: '⏰' });
  }
  if (folderScores.home_comforts >= 80) {
    achievements.push({ name: 'Home Preferences Known', icon: '🏠' });
  }
  if (folderScores.identity_temperament >= 80) {
    achievements.push({ name: 'Personality Mapped', icon: '🎭' });
  }
  if (folderScores.family_pack >= 80) {
    achievements.push({ name: 'Pack Dynamics Clear', icon: '👨‍👩‍👧‍👦' });
  }
  if (folderScores.travel_style >= 50) {
    achievements.push({ name: 'Travel-Aware', icon: '✈️' });
  }
  if (soulData?.vault?.vaccines?.length > 0) {
    achievements.push({ name: 'Health Vault Active', icon: '💉' });
  }
  if (soulData?.doggy_soul_answers?.loves_celebrations) {
    achievements.push({ name: 'Celebration Ready', icon: '🎂' });
  }
  
  return achievements.slice(0, 4);
};

// Get personalized care insights
const getCareInsights = (soulData, petName) => {
  const insights = [];
  const answers = soulData?.doggy_soul_answers || {};
  
  if (answers.separation_anxiety === 'Moderate' || answers.separation_anxiety === 'Severe') {
    insights.push(`Advance notice helps ${petName} stay calm during changes`);
  }
  
  if (answers.space_preference?.toLowerCase().includes('busy')) {
    insights.push(`${petName} does well in lively environments`);
  } else if (answers.space_preference?.toLowerCase().includes('quiet')) {
    insights.push(`${petName} prefers calm, quiet spaces`);
  }
  
  if (answers.handling_comfort === 'Very comfortable') {
    insights.push(`${petName} is comfortable with handling and grooming`);
  }
  
  if (answers.car_rides?.toLowerCase().includes('anxi')) {
    insights.push(`Short, positive car experiences help build confidence`);
  }
  
  if (answers.food_allergies?.length && answers.food_allergies[0] !== 'None') {
    const allergies = Array.isArray(answers.food_allergies) ? answers.food_allergies.join(' and ') : answers.food_allergies;
    insights.push(`Avoid ${allergies} in treats and food`);
  }
  
  if (answers.energetic_time) {
    insights.push(`${petName} is most active in the ${answers.energetic_time.toLowerCase()}`);
  }
  
  return insights.slice(0, 3);
};

// Determine current stage (0-20, 20-50, 50-80, 80-100)
const getStage = (score) => {
  if (score < 20) return 1;
  if (score < 50) return 2;
  if (score < 80) return 3;
  return 4;
};

// Generate identity line based on stage and data
const getIdentityLine = (stage, soulData, petName) => {
  const answers = soulData?.doggy_soul_answers || {};
  
  if (stage === 1) {
    return `We're getting to know ${petName} and their daily rhythm.`;
  }
  
  if (stage === 2) {
    const traits = [];
    if (answers.space_preference) traits.push(answers.space_preference.toLowerCase().includes('busy') ? 'social' : 'calm');
    if (answers.general_nature) traits.push(answers.general_nature.toLowerCase());
    return traits.length 
      ? `${petName} seems to prefer ${traits.join(' and ')} environments.`
      : `${petName}'s preferences are becoming clearer.`;
  }
  
  if (stage === 3) {
    const personality = answers.describe_3_words || answers.general_nature || 'unique';
    const comfort = answers.space_preference?.toLowerCase().includes('quiet') ? 'quiet comfort' : 'daily rhythm';
    return `${petName} is ${personality.toLowerCase()} and thrives on routine and ${comfort}.`;
  }
  
  const traits = [answers.describe_3_words, answers.general_nature].filter(Boolean).join(', ').toLowerCase();
  const travel = answers.car_rides?.toLowerCase().includes('anxi') ? ' — especially during travel or change' : '';
  return `${petName} prefers ${answers.space_preference?.toLowerCase() || 'familiar'} spaces${traits ? `, ${traits}` : ''}${travel}`;
};

const PetSoulJourney = ({ user, pets = [], onOpenMira }) => {
  const [selectedPet, setSelectedPet] = useState(pets[0] || null);
  const [soulData, setSoulData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [pillarDetails, setPillarDetails] = useState(null);
  
  const petName = selectedPet?.name || 'your pet';
  
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!selectedPet?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const [completenessRes, petRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/soul-drip/completeness/${selectedPet.id}`),
          fetch(`${getApiUrl()}/api/pets/${selectedPet.id}`)
        ]);
        
        let data = {};
        if (completenessRes.ok) {
          data = await completenessRes.json();
        }
        if (petRes.ok) {
          const petData = await petRes.json();
          data = { ...data, ...petData };
        }
        setSoulData(data);
      } catch (error) {
        console.error('Error fetching soul data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSoulData();
  }, [selectedPet?.id]);

  // Save answer from gentle next step
  const handleSaveAnswer = async (questionType, answer) => {
    if (!selectedPet?.id || answerSaving) return;
    
    setAnswerSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/soul-drip/journey-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPet.id,
          question_type: questionType,
          answer: answer,
          source: 'journey_page'
        })
      });
      
      if (res.ok) {
        setAnsweredQuestions(prev => new Set([...prev, questionType]));
        // Refresh soul data
        const petRes = await fetch(`${getApiUrl()}/api/pets/${selectedPet.id}`);
        if (petRes.ok) {
          const petData = await petRes.json();
          setSoulData(prev => ({ ...prev, ...petData }));
        }
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setAnswerSaving(false);
    }
  };

  // Fetch pillar details when a pillar is clicked
  const handlePillarClick = async (pillarKey) => {
    if (selectedPillar === pillarKey) {
      setSelectedPillar(null);
      setPillarDetails(null);
      return;
    }
    
    setSelectedPillar(pillarKey);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/pet-gate/pillar-preferences/${selectedPet.id}`);
      if (res.ok) {
        const data = await res.json();
        setPillarDetails(data.pillars[pillarKey]);
      }
    } catch (error) {
      console.error('Error fetching pillar details:', error);
    }
  };

  // Get next unanswered question
  const getNextQuestion = () => {
    const questions = [
      { type: 'grooming_preference', question: `Does ${petName} enjoy being groomed at home or prefer salon visits?`, options: ['At home', 'Salon visits'] },
      { type: 'car_comfort', question: `How does ${petName} feel about car rides?`, options: ['Loves them', 'Gets anxious', 'Neutral'] },
      { type: 'social_preference', question: `Does ${petName} prefer busy places or quiet spaces?`, options: ['Busy places', 'Quiet spaces', 'Either'] },
      { type: 'treat_frequency', question: `How often does ${petName} get treats?`, options: ['Multiple daily', 'Once daily', 'Occasionally'] },
      { type: 'vet_comfort', question: `How is ${petName} at vet visits?`, options: ['Calm', 'Anxious', 'Varies'] }
    ];
    
    const answers = soulData?.doggy_soul_answers || {};
    
    // Find first unanswered question
    for (const q of questions) {
      const fieldMap = {
        'grooming_preference': 'grooming_style',
        'car_comfort': 'car_rides',
        'social_preference': 'social_preference',
        'treat_frequency': 'treat_frequency',
        'vet_comfort': 'vet_comfort'
      };
      
      if (!answeredQuestions.has(q.type) && !answers[fieldMap[q.type]]) {
        return q;
      }
    }
    
    return null;
  };

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4">
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
          <Link to="/pet-soul-onboard">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
              <PawPrint className="w-5 h-5 mr-2" />
              Add Your Pet
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = soulData?.overall_score || selectedPet?.overall_score || 0;
  const stage = getStage(overallScore);
  const identityLine = getIdentityLine(stage, soulData, petName);
  const learningTimeline = getLearningTimeline(soulData, petName);
  const achievements = getAchievements(soulData, overallScore);
  const careInsights = getCareInsights(soulData, petName);
  const folderScores = soulData?.folder_scores || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="pet-soul-journey">
      {/* ========== PET IDENTITY HEADER ========== */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Pet Photo */}
            <div className="relative">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl">
                {selectedPet?.image_url || selectedPet?.photo_url ? (
                  <img 
                    src={selectedPet.image_url || selectedPet.photo_url} 
                    alt={petName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <PawPrint className="w-14 h-14 text-white/50" />
                )}
              </div>
            </div>
            
            {/* Pet Identity */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{petName}</h1>
              
              {/* Identity line - evolves with understanding */}
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-xl">
                {identityLine}
              </p>
              
              {selectedPet?.breed && (
                <p className="text-white/60 mt-2">
                  {selectedPet.breed}
                  {selectedPet?.age ? ` • ${selectedPet.age}` : ''}
                </p>
              )}
            </div>
          </div>
          
          {/* Pet Switcher */}
          {pets.length > 1 && (
            <div className="flex gap-2 mt-8 pt-6 border-t border-white/20 justify-center md:justify-start">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedPet?.id === pet.id
                      ? 'bg-white text-purple-700 font-semibold shadow-lg'
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* ========== PET SOUL SCORE - Soft, Not Dominant ========== */}
        <section className="mb-10">
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e9d5ff" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke="url(#soulGradient)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${overallScore * 1.76} 176`}
                    />
                    <defs>
                      <linearGradient id="soulGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-700">{Math.round(overallScore)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">How well we understand {petName}</p>
                  <p className="text-gray-600 text-sm">
                    {stage === 1 && 'Just getting started'}
                    {stage === 2 && 'Patterns are emerging'}
                    {stage === 3 && `We know ${petName} well`}
                    {stage === 4 && 'Deep understanding'}
                  </p>
                </div>
              </div>
              
              {/* Stage 1: Gentle assurance */}
              {stage === 1 && (
                <p className="text-sm text-purple-600/80 max-w-xs text-right">
                  You don&apos;t need to fill anything out. We&apos;ll learn naturally as you go.
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* ========== THE 8 SOUL PILLARS ========== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              What We Know About {petName}
            </h2>
            <Link to={`/pet/${selectedPet?.id}`}>
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                View Full Soul <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SOUL_PILLARS.map((pillar) => {
              const score = folderScores[pillar.key] || 0;
              const insight = getPillarInsight(pillar.key, soulData, petName);
              const hasContent = score > 0 || insight;
              const isSelected = selectedPillar === pillar.key;
              
              return (
                <Card 
                  key={pillar.key} 
                  onClick={() => handlePillarClick(pillar.key)}
                  className={`p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 ring-2 ring-purple-300 shadow-md'
                      : hasContent 
                        ? 'bg-white hover:shadow-md hover:border-purple-200' 
                        : 'bg-gray-50/50 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{pillar.icon}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{pillar.name}</span>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all ${pillar.colorClass}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                  
                  {/* Insight line */}
                  {insight && (
                    <p className="text-xs text-gray-600 line-clamp-2">{insight}</p>
                  )}
                </Card>
              );
            })}
          </div>
          
          {/* Pillar Detail Panel */}
          {selectedPillar && pillarDetails && (
            <Card className="mt-4 p-5 bg-white border-purple-100 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{pillarDetails.icon}</span>
                  <h3 className="font-bold text-gray-900">{pillarDetails.name}</h3>
                  <Badge variant="outline" className="ml-2">{pillarDetails.percentage}% complete</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPillar(null)}
                  className="text-gray-400"
                >
                  Close
                </Button>
              </div>
              
              {Object.keys(pillarDetails.data).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(pillarDetails.data).map(([key, value]) => {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = value;
                      
                      if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                      } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'boolean') {
                        displayValue = value ? 'Yes' : 'No';
                      }
                      
                      return (
                        <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-purple-500 text-xs">•</span>
                          <div>
                            <p className="text-xs text-gray-500">{displayKey}</p>
                            <p className="text-sm text-gray-800 font-medium">{displayValue}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Fill More Questions Button */}
                  <div className="pt-3 border-t border-gray-100">
                    <Link to={`/pet/${selectedPet?.id}?section=${selectedPillar}`}>
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <PawPrint className="w-4 h-4 mr-2" />
                        Fill More Questions
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-gray-500 text-sm">
                    No information yet. Talk to Mira or answer questions to build this pillar.
                  </p>
                  <Link to={`/pet/${selectedPet?.id}?section=${selectedPillar}`}>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <PawPrint className="w-4 h-4 mr-2" />
                      Start Questions
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          )}
        </section>

        {/* ========== WHAT WE'VE LEARNED TIMELINE - Stage 2+ ========== */}
        {stage >= 2 && learningTimeline.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-purple-600" />
              What We&apos;ve Learned
            </h2>
            
            <div className="relative pl-6 border-l-2 border-purple-100 space-y-4">
              {learningTimeline.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-8 w-4 h-4 rounded-full bg-white border-2 border-purple-300"></div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-gray-800">{entry.text}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${
                      entry.source === 'behaviour' ? 'border-green-300 text-green-700' :
                      entry.source === 'mira' ? 'border-purple-300 text-purple-700' :
                      'border-blue-300 text-blue-700'
                    }`}>
                      {entry.source === 'behaviour' ? 'From behaviour' :
                       entry.source === 'mira' ? 'From Mira' : 'From you'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== ACHIEVEMENTS - Stage 3+ Only ========== */}
        {stage >= 3 && achievements.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-500" />
              {petName}&apos;s Milestones
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {achievements.map((achievement, idx) => (
                <Card key={idx} className="p-4 bg-amber-50/50 border-amber-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <p className="text-sm font-medium text-gray-700">{achievement.name}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ========== PERSONALISED CARE INSIGHTS - Stage 3+ ========== */}
        {stage >= 3 && careInsights.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              What Helps {petName} Most
            </h2>
            
            <Card className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
              <ul className="space-y-3">
                {careInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <p className="text-gray-700">{insight}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* ========== MIRA AI ========== */}
        <section className="mb-10">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-yellow-300" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold mb-1">Mira Knows {petName}</h3>
                <p className="text-white/80 text-sm">
                  Ask Mira anything — she already knows {petName}&apos;s preferences and history.
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

        {/* ========== GENTLE NEXT STEP - Stage 2-3 Only ========== */}
        {stage >= 2 && stage < 4 && (() => {
          const nextQ = getNextQuestion();
          if (!nextQ) return null;
          
          return (
            <section className="mb-10">
              <Card className="p-6 bg-white border-dashed border-2 border-purple-200">
                <p className="text-gray-600 text-sm mb-2">One thing that would help us care better:</p>
                <p className="text-gray-900 font-medium mb-4">{nextQ.question}</p>
                <div className="flex gap-2 flex-wrap">
                  {nextQ.options.map((option) => (
                    <Button 
                      key={option}
                      variant="outline" 
                      size="sm" 
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      disabled={answerSaving}
                      onClick={() => handleSaveAnswer(nextQ.type, option)}
                    >
                      {answerSaving ? '...' : option}
                    </Button>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400"
                    onClick={() => setAnsweredQuestions(prev => new Set([...prev, nextQ.type]))}
                  >
                    Skip for now
                  </Button>
                </div>
              </Card>
            </section>
          );
        })()}

        {/* Stage 4: Minimal prompt */}
        {stage === 4 && (
          <section className="mb-10">
            <Card className="p-6 bg-gray-50 border-gray-100 text-center">
              <p className="text-gray-600">
                If anything changes with {petName}, tell us. We&apos;ll adjust.
              </p>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default PetSoulJourney;
