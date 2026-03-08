/**
 * SoulQuestionPrompts.jsx
 * =======================
 * Displays quick soul questions as interactive chips in the Mira chat area.
 * 
 * BIBLE RULE: "Mira should suggest questions to fill profile gaps"
 * 
 * Features:
 * - Shows 2-3 unanswered soul questions
 * - Tapping a question fills it into the chat input
 * - Answers are saved to pet's soul profile
 * - Dismisses after 3 questions per session
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Star, CheckCircle } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SoulQuestionPrompts = ({
  questions = [],
  petId,
  petName = 'your pet',
  token,
  onQuestionClick,
  onAnswerSubmit,
  onDismiss,
  className = ''
}) => {
  const [answeredCount, setAnsweredCount] = useState(0);
  const [dismissedQuestions, setDismissedQuestions] = useState(new Set());
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filter out dismissed questions
  const visibleQuestions = questions.filter(q => !dismissedQuestions.has(q.question_id));
  
  if (visibleQuestions.length === 0) return null;
  
  const handleQuestionClick = (question) => {
    hapticFeedback.buttonTap();
    
    if (question.type === 'multiple_choice' || question.options?.length > 0) {
      // Show options inline
      setExpandedQuestion(expandedQuestion === question.question_id ? null : question.question_id);
    } else {
      // For text questions, fill into chat input
      onQuestionClick?.(question.question);
    }
  };
  
  const handleOptionSelect = async (question, answer) => {
    hapticFeedback.success();
    setSelectedAnswer(answer);
    setIsSubmitting(true);
    
    try {
      // Save answer to soul profile
      const response = await fetch(`${API_URL}/api/pet-soul/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_id: petId,
          question_id: question.question_id,
          answer: answer
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnsweredCount(prev => prev + 1);
        setSuccessMessage(`${petName}'s soul profile updated!`);
        
        // Notify parent
        onAnswerSubmit?.(question.question_id, answer, data);
        
        // Dismiss this question after success
        setTimeout(() => {
          setDismissedQuestions(prev => new Set([...prev, question.question_id]));
          setExpandedQuestion(null);
          setSelectedAnswer(null);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (error) {
      console.error('[SoulQuestionPrompts] Error saving answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDismissQuestion = (questionId) => {
    hapticFeedback.light();
    setDismissedQuestions(prev => new Set([...prev, questionId]));
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    }
  };
  
  const handleDismissAll = () => {
    hapticFeedback.light();
    onDismiss?.();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`soul-question-prompts ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">
            Help Mira know {petName} better
          </span>
        </div>
        <button
          onClick={handleDismissAll}
          className="p-1 text-gray-500 hover:text-gray-300 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Question Chips */}
      <div className="space-y-2">
        {visibleQuestions.slice(0, 3).map((question, idx) => (
          <motion.div
            key={question.question_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            {/* Question Chip */}
            <button
              onClick={() => handleQuestionClick(question)}
              className={`
                w-full text-left px-3 py-2.5 rounded-xl
                bg-gradient-to-r from-purple-500/10 to-pink-500/10
                border border-purple-500/20 hover:border-purple-400/40
                transition-all duration-200
                ${expandedQuestion === question.question_id ? 'ring-2 ring-purple-400/30' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">
                    {question.folder_icon} {question.folder_name}
                  </span>
                  <p className="text-xs text-white/90 mt-0.5 leading-relaxed">
                    {question.question}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {question.options?.length > 0 && (
                    <ChevronRight 
                      className={`w-4 h-4 text-purple-400 transition-transform ${
                        expandedQuestion === question.question_id ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissQuestion(question.question_id);
                    }}
                    className="p-0.5 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </button>
            
            {/* Expanded Options */}
            <AnimatePresence>
              {expandedQuestion === question.question_id && question.options?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pl-2 border-l-2 border-purple-500/30"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {question.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(question, option)}
                        disabled={isSubmitting}
                        className={`
                          px-3 py-1.5 text-xs rounded-full
                          transition-all duration-200
                          ${selectedAnswer === option 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                          }
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      {/* Points Incentive */}
      {answeredCount < 3 && (
        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-amber-400/70">
          <Star className="w-3 h-3" />
          <span>Earn 10 Paw Points per answer</span>
        </div>
      )}
    </motion.div>
  );
};

export default SoulQuestionPrompts;
