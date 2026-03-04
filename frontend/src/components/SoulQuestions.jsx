/**
 * SoulQuestions.jsx - Deep Soul Profile Questions
 * 
 * These questions are not a form. They are an act of seeing.
 * They help pet parents truly notice their dog.
 * 
 * Philosophy: /app/memory/SOUL_PHILOSOPHY_SSOT.md
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Heart, Sparkles, 
  Sun, Shield, Eye, Star, Users, Feather,
  X, Check
} from 'lucide-react';

// ============================================================
// SOUL QUESTIONS DATA
// ============================================================

const SOUL_SECTIONS = [
  {
    id: 'joy',
    title: 'Joy & Delight',
    subtitle: 'What does happiness look like in their body?',
    icon: Sun,
    color: 'from-amber-400 to-orange-500',
    questions: [
      {
        id: 'light',
        question: 'What makes {name}\'s eyes light up?',
        subtitle: 'Not just food or walks - what brings them genuine delight?',
        type: 'multi-select',
        options: [
          { value: 'homecoming', label: 'When I come home, no matter how long I\'ve been gone' },
          { value: 'toy', label: 'A particular toy or game that never gets old' },
          { value: 'nature', label: 'Being in nature - grass, wind, open space' },
          { value: 'dogs', label: 'Other dogs or animal friends' },
          { value: 'people', label: 'Specific people who understand them' },
          { value: 'quiet', label: 'Quiet moments together, just being' },
          { value: 'adventure', label: 'Adventure and new places' },
        ],
        allowCustom: true,
        customPrompt: 'Tell me more about what delights them...'
      },
      {
        id: 'joy_body',
        question: 'How does {name} show pure joy?',
        subtitle: 'What does their body do?',
        type: 'multi-select',
        options: [
          { value: 'wiggle', label: 'The full-body wiggle that starts at the nose' },
          { value: 'zoomies', label: 'Zoomies - sudden explosive running' },
          { value: 'sound', label: 'A specific sound - bark, howl, happy groan' },
          { value: 'roll', label: 'Rolling on their back, completely surrendered' },
          { value: 'bring', label: 'Bringing me something precious' },
          { value: 'stillness', label: 'A stillness that\'s actually vibrating with happiness' },
        ],
        allowCustom: true,
        customPrompt: 'Describe their joy...'
      }
    ]
  },
  {
    id: 'comfort',
    title: 'Comfort & Security',
    subtitle: 'How do they ask for reassurance?',
    icon: Shield,
    color: 'from-blue-400 to-indigo-500',
    questions: [
      {
        id: 'seeking_comfort',
        question: 'When {name} is unsettled, how do they come to you?',
        type: 'single-select',
        options: [
          { value: 'press', label: 'They press their body against mine' },
          { value: 'head', label: 'They put their head in my lap and wait' },
          { value: 'follow', label: 'They follow me from room to room, closer than usual' },
          { value: 'toy', label: 'They bring a toy, as if play might fix it' },
          { value: 'watch', label: 'They go quiet and just watch me' },
          { value: 'paw', label: 'They paw at me or nudge with their nose' },
          { value: 'hide', label: 'They don\'t come to me - they hide and wait for it to pass' },
        ],
        allowCustom: true,
        customPrompt: 'Their way of seeking comfort...'
      },
      {
        id: 'safe_place',
        question: 'Where does {name} go when they need to feel completely safe?',
        type: 'single-select',
        options: [
          { value: 'with_me', label: 'My bed, my feet, wherever I am' },
          { value: 'their_spot', label: 'A specific spot that has always been theirs' },
          { value: 'enclosed', label: 'Somewhere enclosed - under furniture, in a corner' },
          { value: 'window', label: 'Near a window, watching the outside' },
          { value: 'nowhere', label: 'They don\'t seem to have one - they\'re unsettled everywhere' },
        ],
        allowCustom: true,
        customPrompt: 'Their sanctuary...'
      }
    ]
  },
  {
    id: 'fear',
    title: 'Fear & Sensitivity',
    subtitle: 'What unsettles them that others might not notice?',
    icon: Eye,
    color: 'from-purple-400 to-violet-500',
    questions: [
      {
        id: 'fears',
        question: 'What frightens {name} that might surprise people?',
        type: 'multi-select',
        options: [
          { value: 'sounds', label: 'Loud sounds - thunder, fireworks, sudden noises' },
          { value: 'alone', label: 'Being alone, even briefly' },
          { value: 'strangers', label: 'New people or unfamiliar energy in the home' },
          { value: 'dogs', label: 'Other dogs, especially certain types' },
          { value: 'objects', label: 'Specific objects or situations (vacuum, stairs, cars)' },
          { value: 'routine', label: 'Changes in routine - they notice everything' },
          { value: 'nothing', label: 'Nothing seems to frighten them' },
        ],
        allowCustom: true,
        customPrompt: 'Their specific fear...'
      },
      {
        id: 'sensitivity',
        question: 'What does {name} sense that humans might miss?',
        type: 'multi-select',
        options: [
          { value: 'moods', label: 'My moods - they know before I do' },
          { value: 'tension', label: 'Tension between people in the room' },
          { value: 'health', label: 'When something is wrong with someone\'s health' },
          { value: 'weather', label: 'Weather changes, coming storms' },
          { value: 'leaving', label: 'When I\'m about to leave, even before I move' },
          { value: 'trust', label: 'Strangers who shouldn\'t be trusted' },
          { value: 'everything', label: 'They seem to sense everything' },
        ],
        allowCustom: true,
        customPrompt: 'What they notice...'
      }
    ]
  },
  {
    id: 'personality',
    title: 'Personality & Character',
    subtitle: 'Their unique way of being in the world',
    icon: Star,
    color: 'from-pink-400 to-rose-500',
    questions: [
      {
        id: 'essential_nature',
        question: 'If you had to describe {name}\'s personality in one phrase, what would it be?',
        type: 'single-select',
        options: [
          { value: 'gentle', label: 'The gentle soul - kind, patient, soft' },
          { value: 'dramatic', label: 'The dramatic one - everything is a big moment' },
          { value: 'comedian', label: 'The comedian - always making us laugh' },
          { value: 'guardian', label: 'The guardian - protective, watchful, serious about their job' },
          { value: 'adventurer', label: 'The adventurer - curious, brave, always exploring' },
          { value: 'sensitive', label: 'The sensitive artist - deep feelings, easily moved' },
          { value: 'stoic', label: 'The stoic warrior - strong, quiet, dignified' },
          { value: 'puppy', label: 'The eternal puppy - playful no matter their age' },
          { value: 'elder', label: 'The wise elder - calm knowing in their eyes' },
        ],
        allowCustom: true,
        customPrompt: 'Who they really are...'
      },
      {
        id: 'contradiction',
        question: 'What\'s something about {name} that surprises people who don\'t know them well?',
        type: 'text',
        placeholder: 'This requires reflection. Take your time...'
      }
    ]
  },
  {
    id: 'relationship',
    title: 'Relationship & Bond',
    subtitle: 'How they connect with you specifically',
    icon: Users,
    color: 'from-emerald-400 to-teal-500',
    questions: [
      {
        id: 'way_of_loving',
        question: 'How does {name} show love?',
        subtitle: 'Not generic dog love - their specific way.',
        type: 'multi-select',
        options: [
          { value: 'watch', label: 'They watch me constantly, checking I\'m okay' },
          { value: 'gifts', label: 'They bring me things - gifts, offerings' },
          { value: 'lean', label: 'They lean into me with their full weight' },
          { value: 'sounds', label: 'They make specific sounds only for me' },
          { value: 'wait', label: 'They wait - at doors, at windows, with patience that breaks my heart' },
          { value: 'protect', label: 'They protect me, even from things that don\'t need protecting' },
          { value: 'celebrate', label: 'They celebrate me, every single time' },
        ],
        allowCustom: true,
        customPrompt: 'Their love language...'
      },
      {
        id: 'witnessed',
        question: 'What has {name} seen you through?',
        type: 'multi-select',
        options: [
          { value: 'changes', label: 'Major life changes - moves, jobs, relationships' },
          { value: 'grief', label: 'Loss and grief' },
          { value: 'illness', label: 'Illness or recovery' },
          { value: 'parent', label: 'Becoming a parent' },
          { value: 'building', label: 'Building something important' },
          { value: 'breaking', label: 'Breaking down and rebuilding' },
          { value: 'daily', label: 'Daily life, which is its own kind of witnessing' },
        ],
        allowCustom: true,
        customPrompt: 'What they\'ve stood beside you for...'
      }
    ]
  },
  {
    id: 'deeper',
    title: 'The Deeper Questions',
    subtitle: 'For those ready to truly see',
    icon: Feather,
    color: 'from-slate-400 to-slate-600',
    questions: [
      {
        id: 'forgiveness',
        question: 'What has {name} forgiven you for?',
        type: 'text',
        placeholder: 'Times you were impatient. Days you were distracted. Moments you didn\'t notice them. What have they forgiven?',
        subtitle: 'This question requires honesty.'
      },
      {
        id: 'teaching',
        question: 'What has {name} taught you about love?',
        type: 'text',
        placeholder: 'Not what you\'ve taught them. What they\'ve taught you.',
        subtitle: 'This question requires reflection.'
      },
      {
        id: 'final',
        question: 'When the time comes - and we pray it\'s far away - what do you want to be able to say about how you loved them?',
        type: 'text',
        placeholder: 'Not that you adored them. That you knew them. That you paid attention. That you adjusted. That you loved with accuracy.',
        subtitle: 'This question requires courage.'
      }
    ]
  }
];

// ============================================================
// MAIN COMPONENT
// ============================================================

const SoulQuestions = ({ pet, onComplete, onClose }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  
  const currentSection = SOUL_SECTIONS[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  const petName = pet?.name || 'your baby';
  
  // Replace {name} placeholder in questions
  const formatText = (text) => text.replace(/{name}/g, petName);
  
  // Calculate progress
  const totalQuestions = SOUL_SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;
  
  // Handle answer selection
  const handleAnswer = (value) => {
    const questionId = currentQuestion.id;
    
    if (currentQuestion.type === 'multi-select') {
      const current = answers[questionId] || [];
      if (current.includes(value)) {
        setAnswers({ ...answers, [questionId]: current.filter(v => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };
  
  // Handle text input
  const handleTextInput = (value) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };
  
  // Handle custom input
  const handleCustomInput = (value) => {
    setCustomInputs({ ...customInputs, [currentQuestion.id]: value });
  };
  
  // Navigate
  const goNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < SOUL_SECTIONS.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Complete
      onComplete?.({ answers, customInputs });
    }
  };
  
  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = SOUL_SECTIONS[currentSectionIndex - 1];
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  };
  
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion = currentSectionIndex === SOUL_SECTIONS.length - 1 && 
                         currentQuestionIndex === currentSection.questions.length - 1;
  
  // Check if current question has answer
  const hasAnswer = answers[currentQuestion.id] !== undefined && 
                    (Array.isArray(answers[currentQuestion.id]) 
                      ? answers[currentQuestion.id].length > 0 
                      : answers[currentQuestion.id].length > 0);
  
  const SectionIcon = currentSection.icon;
  
  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-hidden">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="flex items-center gap-2">
              {pet?.avatar ? (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${pet.avatar.color} flex items-center justify-center text-lg`}>
                  {pet.avatar.emoji}
                </div>
              ) : pet?.photoPreview ? (
                <img src={pet.photoPreview} alt={petName} className="w-8 h-8 rounded-full object-cover" />
              ) : null}
              <span className="text-white font-medium">{petName}'s Soul</span>
            </div>
            
            <div className="w-9" />
          </div>
          
          {/* Progress */}
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Section indicator */}
        <div className="px-4 py-3 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentSection.color} flex items-center justify-center`}>
              <SectionIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{currentSection.title}</p>
              <p className="text-slate-400 text-sm">{currentSection.subtitle}</p>
            </div>
          </div>
        </div>
        
        {/* Question */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg mx-auto"
            >
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                {formatText(currentQuestion.question)}
              </h2>
              
              {currentQuestion.subtitle && (
                <p className="text-slate-400 mb-6">{currentQuestion.subtitle}</p>
              )}
              
              {/* Options */}
              {currentQuestion.type === 'single-select' && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        answers[currentQuestion.id] === option.value
                          ? 'bg-pink-500/20 border-2 border-pink-500 text-white'
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'multi-select' && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = (answers[currentQuestion.id] || []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-pink-500/20 border-2 border-pink-500 text-white'
                            : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'border-pink-500 bg-pink-500' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {currentQuestion.type === 'text' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleTextInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full h-40 p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none"
                />
              )}
              
              {/* Custom input */}
              {currentQuestion.allowCustom && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={customInputs[currentQuestion.id] || ''}
                    onChange={(e) => handleCustomInput(e.target.value)}
                    placeholder={currentQuestion.customPrompt}
                    className="w-full p-4 bg-slate-800/50 border border-dashed border-slate-600 rounded-xl text-white placeholder-slate-500"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="p-4 border-t border-slate-800 safe-area-bottom">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={isFirstQuestion}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                isFirstQuestion
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            
            <button
              onClick={goNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${
                hasAnswer || currentQuestion.type === 'text'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isLastQuestion ? 'Complete' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Skip option for text questions */}
          {currentQuestion.type === 'text' && (
            <p className="text-center text-slate-500 text-sm mt-3">
              This question can wait for a quiet moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoulQuestions;
