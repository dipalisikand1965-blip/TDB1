/**
 * SoulFormModal - Quick Soul Questions Pop-up
 * ============================================
 * A modal that appears on /mira-demo page allowing users
 * to answer 3 quick questions to enrich their pet's Soul profile.
 * 
 * Updates the pet's doggy_soul_answers and recalculates Soul Score.
 * Now also syncs achievements and awards badges/paw points!
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ChevronRight, Trophy, Gift } from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// The 3 quick questions to show in the modal
const QUICK_SOUL_QUESTIONS = [
  {
    id: "energy_level",
    field: "energy_level",
    question: "What's {petName}'s typical energy level?",
    options: [
      { label: "High energy", value: "High energy", emoji: "⚡" },
      { label: "Moderate", value: "Moderate energy", emoji: "🌤️" },
      { label: "Calm and relaxed", value: "Calm and relaxed", emoji: "😌" }
    ]
  },
  {
    id: "food_motivation",
    field: "food_motivation",
    question: "How food-motivated is {petName}?",
    options: [
      { label: "Very - will do anything for treats!", value: "Very food motivated", emoji: "🍖" },
      { label: "Moderately", value: "Moderately food motivated", emoji: "🦴" },
      { label: "Not very interested in food", value: "Not food motivated", emoji: "😴" }
    ]
  },
  {
    id: "stranger_reaction",
    field: "stranger_reaction",
    question: "How does {petName} react to new people?",
    options: [
      { label: "Very friendly", value: "Very friendly", emoji: "🤗" },
      { label: "Cautious at first", value: "Cautious at first", emoji: "🤔" },
      { label: "Shy or nervous", value: "Shy or nervous", emoji: "🙈" }
    ]
  }
];

const SoulFormModal = ({ 
  isOpen, 
  onClose, 
  pet, 
  token,
  onSoulUpdated 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [newScore, setNewScore] = useState(null);
  const [pawPointsEarned, setPawPointsEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAnswers({});
      setIsComplete(false);
      setNewScore(null);
      setPawPointsEarned(0);
      setNewBadges([]);
    }
  }, [isOpen]);
  
  if (!isOpen || !pet) return null;
  
  const currentQuestion = QUICK_SOUL_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUICK_SOUL_QUESTIONS.length - 1;
  
  const handleSelectOption = async (option) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.field]: option.value
    };
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      // Submit all answers
      await submitAnswers(newAnswers);
    } else {
      // Move to next question
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const submitAnswers = async (allAnswers) => {
    setIsSubmitting(true);
    
    try {
      // Submit answers to update the pet's Soul using bulk endpoint
      const response = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answers/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(allAnswers)
      });
      
      if (response.ok) {
        const data = await response.json();
        const calculatedScore = data.scores?.overall || pet.soulScore + 15;
        setNewScore(calculatedScore);
        
        // Track paw points earned from answering questions
        if (data.paw_points_awarded) {
          setPawPointsEarned(data.paw_points_awarded);
        }
        
        // Now sync achievements to check for new badges
        try {
          const achievementResponse = await fetch(`${API_URL}/api/paw-points/sync-achievements`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (achievementResponse.ok) {
            const achievementData = await achievementResponse.json();
            
            // Check for newly credited achievements
            if (achievementData.new_achievements && achievementData.new_achievements.length > 0) {
              setNewBadges(achievementData.new_achievements);
              
              // Show toast for each new badge
              achievementData.new_achievements.forEach((badge, idx) => {
                setTimeout(() => {
                  toast({
                    title: `🏆 Badge Unlocked: ${formatBadgeName(badge)}`,
                    description: getBadgeDescription(badge),
                  });
                }, idx * 1000);
              });
            }
            
            // Add points earned from achievements to total
            if (achievementData.points_earned) {
              setPawPointsEarned(prev => prev + achievementData.points_earned);
            }
          }
        } catch (achievementError) {
          console.warn('[SoulFormModal] Achievement sync failed:', achievementError);
        }
        
        setIsComplete(true);
        
        // Notify parent to refresh pet data
        if (onSoulUpdated) {
          onSoulUpdated(calculatedScore, allAnswers, pawPointsEarned);
        }
      } else {
        console.error('[SoulFormModal] Failed to submit answers');
        // Still show completion for UX, score will update on next load
        setIsComplete(true);
      }
    } catch (error) {
      console.error('[SoulFormModal] Error submitting answers:', error);
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to format badge names nicely
  const formatBadgeName = (badge) => {
    const names = {
      'soul_starter': 'Soul Starter',
      'soul_seeker': 'Soul Seeker', 
      'soul_explorer': 'Soul Explorer',
      'soul_guardian': 'Soul Guardian',
      'curious_pup_tier': 'Curious Pup',
      'soul_seeker_tier': 'Soul Seeker',
      'kindred_spirit_tier': 'Kindred Spirit',
      'pack_leader_tier': 'Pack Leader'
    };
    return names[badge] || badge.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Helper to get badge descriptions
  const getBadgeDescription = (badge) => {
    const descriptions = {
      'soul_starter': 'Answered 5 soul questions! Mira is starting to know your pet.',
      'soul_seeker': 'Answered 10 soul questions! Deeper understanding unlocked.',
      'soul_explorer': 'Answered 15 soul questions! Your pet\'s personality shines through.',
      'soul_guardian': 'Answered 20+ soul questions! You truly know your pet.',
      'curious_pup_tier': 'Reached 0-24% Soul Score - The journey begins!',
      'soul_seeker_tier': 'Reached 25-49% Soul Score - Mira remembers your pet!',
      'kindred_spirit_tier': 'Reached 50-74% Soul Score - Smart safety alerts unlocked!',
      'pack_leader_tier': 'Reached 75%+ Soul Score - VIP concierge experience!'
    };
    return descriptions[badge] || 'New achievement unlocked!';
  };
  
  // Format question with pet name
  const formatQuestion = (q) => q.replace('{petName}', pet.name || 'your pet');
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="soul-form-modal"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#1a1025] to-[#0d0a12] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="soul-form-close-btn"
          >
            <X size={18} className="text-white/70" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isComplete ? '✨ Soul Updated!' : `Know ${pet.name} Better`}
              </h2>
              <p className="text-sm text-white/60">
                {isComplete 
                  ? 'Your answers help Mira personalize everything'
                  : '3 quick questions to enrich the soul'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress dots */}
        {!isComplete && (
          <div className="flex justify-center gap-2 px-6 pb-4">
            {QUICK_SOUL_QUESTIONS.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-purple-500' 
                    : idx < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 pb-6">
          {isComplete ? (
            // Completion state
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
                <Check size={40} className="text-white" />
              </div>
              
              {newScore && (
                <div className="mb-4">
                  <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {Math.round(newScore)}%
                  </span>
                  <p className="text-sm text-white/60 mt-1">New Soul Score</p>
                </div>
              )}
              
              {/* Show Paw Points Earned */}
              {pawPointsEarned > 0 && (
                <div className="mb-4 flex items-center justify-center gap-2 text-amber-400">
                  <Gift size={20} />
                  <span className="font-semibold">+{pawPointsEarned} Paw Points Earned!</span>
                </div>
              )}
              
              {/* Show New Badges */}
              {newBadges.length > 0 && (
                <div className="mb-4 p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <div className="flex items-center justify-center gap-2 text-purple-300 mb-2">
                    <Trophy size={18} />
                    <span className="font-medium text-sm">New Badge{newBadges.length > 1 ? 's' : ''} Unlocked!</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {newBadges.map((badge, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full"
                      >
                        {formatBadgeName(badge)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-white/80 mb-6">
                Mira now knows {pet.name} even better! 
                <br />
                <span className="text-purple-400">Recommendations will be more personalized.</span>
              </p>
              
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
                data-testid="soul-form-done-btn"
              >
                Continue to Chat
              </button>
            </div>
          ) : isSubmitting ? (
            // Loading state
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
              <p className="text-white/70">Enriching {pet.name}'s soul...</p>
            </div>
          ) : (
            // Question state
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {formatQuestion(currentQuestion.question)}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className="w-full p-4 flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all group"
                    data-testid={`soul-option-${idx}`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="flex-1 text-left text-white/90 font-medium">
                      {option.label}
                    </span>
                    <ChevronRight 
                      size={20} 
                      className="text-white/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" 
                    />
                  </button>
                ))}
              </div>
              
              <p className="text-center text-white/40 text-sm mt-4">
                Question {currentStep + 1} of {QUICK_SOUL_QUESTIONS.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoulFormModal;
