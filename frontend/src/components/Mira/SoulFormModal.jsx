/**
 * SoulFormModal - Quick Soul Questions Pop-up
 * ============================================
 * A modal that appears on /mira-demo page allowing users
 * to answer 3 quick questions to enrich their pet's Soul profile.
 * 
 * Updates the pet's doggy_soul_answers and recalculates Soul Score.
 * 
 * DYNAMIC: Only shows questions that haven't been answered yet.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Check, ChevronRight } from 'lucide-react';
import { API_URL } from '../../utils/api';

// Full pool of soul questions - modal picks 3 unanswered ones
const ALL_SOUL_QUESTIONS = [
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
  },
  {
    id: "exercise_preference",
    field: "exercise_preference",
    question: "What kind of exercise does {petName} enjoy most?",
    options: [
      { label: "Long walks/hikes", value: "Long walks and hikes", emoji: "🥾" },
      { label: "Fetch and play", value: "Fetch and active play", emoji: "🎾" },
      { label: "Short leisurely walks", value: "Short leisurely walks", emoji: "🚶" },
      { label: "Indoor play", value: "Indoor play mostly", emoji: "🏠" }
    ]
  },
  {
    id: "sleep_habits",
    field: "sleep_habits",
    question: "How would you describe {petName}'s sleep habits?",
    options: [
      { label: "Early bird - up with the sun", value: "Early riser", emoji: "🌅" },
      { label: "Night owl - active in evenings", value: "Night owl", emoji: "🌙" },
      { label: "Sleeps a lot throughout the day", value: "Frequent napper", emoji: "😴" }
    ]
  },
  {
    id: "dog_sociability",
    field: "dog_sociability",
    question: "How does {petName} interact with other dogs?",
    options: [
      { label: "Loves playing with all dogs", value: "Very social with dogs", emoji: "🐕" },
      { label: "Selective about dog friends", value: "Selective with dogs", emoji: "🤝" },
      { label: "Prefers humans over dogs", value: "Prefers humans", emoji: "👤" },
      { label: "Can be reactive around dogs", value: "Reactive around dogs", emoji: "⚠️" }
    ]
  },
  {
    id: "grooming_tolerance",
    field: "grooming_tolerance",
    question: "How does {petName} handle grooming?",
    options: [
      { label: "Loves being groomed", value: "Loves grooming", emoji: "✨" },
      { label: "Tolerates it fine", value: "Tolerates grooming", emoji: "👍" },
      { label: "Gets anxious", value: "Anxious during grooming", emoji: "😰" }
    ]
  },
  {
    id: "car_travel",
    field: "car_travel",
    question: "How does {petName} handle car rides?",
    options: [
      { label: "Loves car rides!", value: "Loves car rides", emoji: "🚗" },
      { label: "Gets a bit anxious", value: "Anxious in cars", emoji: "😟" },
      { label: "Gets car sick", value: "Gets car sick", emoji: "🤢" }
    ]
  },
  {
    id: "alone_time",
    field: "alone_time",
    question: "How does {petName} handle being alone?",
    options: [
      { label: "Fine for hours", value: "Comfortable alone", emoji: "😊" },
      { label: "Gets anxious when alone", value: "Separation anxiety", emoji: "😢" },
      { label: "Rarely left alone", value: "Rarely alone", emoji: "🏠" }
    ]
  },
  {
    id: "noise_sensitivity",
    field: "noise_sensitivity",
    question: "How does {petName} react to loud noises?",
    options: [
      { label: "Not bothered at all", value: "Not noise sensitive", emoji: "😎" },
      { label: "Startled but recovers", value: "Mildly noise sensitive", emoji: "😮" },
      { label: "Very scared (fireworks, thunder)", value: "Very noise sensitive", emoji: "😨" }
    ]
  },
  {
    id: "favorite_activity",
    field: "favorite_activity",
    question: "What's {petName}'s absolute favorite activity?",
    options: [
      { label: "Playing fetch", value: "Playing fetch", emoji: "🎾" },
      { label: "Cuddles on the couch", value: "Cuddling", emoji: "🛋️" },
      { label: "Going for walks", value: "Going for walks", emoji: "🚶" },
      { label: "Meeting new people/dogs", value: "Socializing", emoji: "🤝" },
      { label: "Eating treats", value: "Eating treats", emoji: "🍖" }
    ]
  },
  {
    id: "training_style",
    field: "training_style",
    question: "What training approach works best for {petName}?",
    options: [
      { label: "Treat-based rewards", value: "Treat motivated", emoji: "🍖" },
      { label: "Praise and affection", value: "Praise motivated", emoji: "❤️" },
      { label: "Play-based rewards", value: "Play motivated", emoji: "🎾" }
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
  const [liveScore, setLiveScore] = useState(pet?.soulScore || pet?.overall_score || 0);
  
  // Dynamically pick 3 unanswered questions
  const unansweredQuestions = useMemo(() => {
    if (!pet) return [];
    const existingAnswers = pet.doggy_soul_answers || {};
    
    // Filter out questions that already have answers
    const available = ALL_SOUL_QUESTIONS.filter(q => {
      const existingAnswer = existingAnswers[q.field];
      return !existingAnswer || existingAnswer === '' || existingAnswer === null;
    });
    
    // Shuffle and pick up to 3
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [pet, isOpen]);
  
  // If all questions answered, show completion message
  const allQuestionsAnswered = unansweredQuestions.length === 0;
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAnswers({});
      setIsComplete(false);
      setNewScore(null);
    }
  }, [isOpen]);
  
  if (!isOpen || !pet) return null;
  
  // If all questions are answered, show completion state
  if (allQuestionsAnswered && !isComplete) {
    return (
      <div className="soul-form-modal-overlay" onClick={onClose}>
        <div className="soul-form-modal" onClick={e => e.stopPropagation()}>
          <button className="soul-form-close" onClick={onClose}>
            <X size={20} />
          </button>
          <div className="soul-form-complete">
            <div className="complete-icon">
              <Sparkles size={48} />
            </div>
            <h2>Mira knows {pet.name} well!</h2>
            <p>You've answered all the soul questions. {pet.name}'s soul profile is complete.</p>
            <p className="soul-score-display">Soul Score: {pet.soulScore || pet.overall_score || 0}%</p>
            <button className="soul-form-cta" onClick={onClose}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentQuestion = unansweredQuestions[currentStep];
  const isLastQuestion = currentStep === unansweredQuestions.length - 1;
  
  if (!currentQuestion) {
    onClose();
    return null;
  }
  
  // Save a single answer immediately and get updated score
  const saveAnswer = async (questionField, answerValue) => {
    try {
      const response = await fetch(`${API_URL}/api/pets/${pet.id}/soul-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: questionField,
          answer: answerValue
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedScore = data.new_score || data.overall_score || (liveScore + 5);
        setLiveScore(updatedScore);
        
        // Notify parent about score update (live update)
        if (onSoulUpdated) {
          onSoulUpdated(updatedScore, { [questionField]: answerValue });
        }
        return updatedScore;
      }
    } catch (error) {
      console.error('[SoulFormModal] Error saving answer:', error);
    }
    return liveScore + 5; // Fallback increment
  };
  
  const handleSelectOption = async (option) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.field]: option.value
    };
    setAnswers(newAnswers);
    
    // Save this answer immediately
    const newScore = await saveAnswer(currentQuestion.field, option.value);
    
    if (isLastQuestion) {
      // Show completion
      setNewScore(newScore);
      setIsComplete(true);
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
        setIsComplete(true);
        
        // Notify parent to refresh pet data
        if (onSoulUpdated) {
          onSoulUpdated(calculatedScore, allAnswers);
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
            {unansweredQuestions.map((_, idx) => (
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
                Question {currentStep + 1} of {unansweredQuestions.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoulFormModal;
