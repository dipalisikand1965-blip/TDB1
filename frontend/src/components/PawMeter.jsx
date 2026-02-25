/**
 * PawMeter Component
 * 
 * Interactive 1-10 paw rating system replacing traditional star reviews.
 * Users click paws to rate products with optional feedback.
 */

import React, { useState } from 'react';
import { PawPrint, MessageSquare, Send, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Display-only PawMeter (for product cards)
export const PawMeterDisplay = ({ score, totalRatings = 0, size = 'sm' }) => {
  const normalizedScore = Math.min(10, Math.max(0, score || 0));
  const fullPaws = Math.floor(normalizedScore);
  const hasHalfPaw = normalizedScore % 1 >= 0.5;
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const pawSize = sizeClasses[size] || sizeClasses.sm;
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(10)].map((_, i) => (
          <PawPrint
            key={i}
            className={`${pawSize} transition-colors ${
              i < fullPaws
                ? 'fill-amber-500 text-amber-500'
                : i === fullPaws && hasHalfPaw
                ? 'fill-amber-300 text-amber-300'
                : 'text-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 font-medium">
        {normalizedScore.toFixed(1)}/10
        {totalRatings > 0 && ` (${totalRatings})`}
      </span>
    </div>
  );
};

// Compact display for cards
export const PawMeterCompact = ({ score, totalRatings = 0 }) => {
  const normalizedScore = Math.min(10, Math.max(0, score || 0));
  
  return (
    <div className="flex items-center gap-1">
      <PawPrint className="w-4 h-4 fill-amber-500 text-amber-500" />
      <span className="text-sm font-semibold text-gray-700">
        {normalizedScore.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">
        /10 {totalRatings > 0 && `(${totalRatings})`}
      </span>
    </div>
  );
};

// Interactive PawMeter for rating products
export const PawMeterInteractive = ({ 
  productId, 
  productName,
  currentScore = 0,
  onRatingSubmit,
  className = '' 
}) => {
  const { user, token } = useAuth();
  const [hoveredPaw, setHoveredPaw] = useState(0);
  const [selectedPaw, setSelectedPaw] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handlePawClick = (pawNumber) => {
    setSelectedPaw(pawNumber);
    setShowFeedback(true);
  };

  const handleSubmit = async () => {
    if (!selectedPaw) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/pawmeter/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          product_id: productId,
          paw_score: selectedPaw,
          feedback: feedback.trim() || null,
          user_email: user?.email || null,
          user_name: user?.name || 'Anonymous'
        })
      });
      
      if (response.ok) {
        setSubmitted(true);
        setShowFeedback(false);
        if (onRatingSubmit) {
          const data = await response.json();
          onRatingSubmit(data);
        }
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to submit rating');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPawLabel = (score) => {
    if (score <= 2) return 'Not for us';
    if (score <= 4) return 'Could be better';
    if (score <= 6) return 'It\'s okay';
    if (score <= 8) return 'Really good!';
    return 'Absolutely love it!';
  };

  if (submitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span className="font-medium">Thanks for your PawMeter rating!</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(10)].map((_, i) => (
            <PawPrint
              key={i}
              className={`w-4 h-4 ${
                i < selectedPaw ? 'fill-amber-500 text-amber-500' : 'text-gray-200'
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">{selectedPaw}/10</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-amber-600" />
          Rate this product
        </h4>
        {currentScore > 0 && (
          <span className="text-xs text-gray-500">
            Current: {currentScore.toFixed(1)}/10
          </span>
        )}
      </div>
      
      {/* Paw Rating Row */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(10)].map((_, i) => {
            const pawNumber = i + 1;
            const isActive = pawNumber <= (hoveredPaw || selectedPaw);
            
            return (
              <button
                key={i}
                onClick={() => handlePawClick(pawNumber)}
                onMouseEnter={() => setHoveredPaw(pawNumber)}
                onMouseLeave={() => setHoveredPaw(0)}
                className={`p-1 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
                  isActive ? 'bg-amber-100' : 'hover:bg-gray-100'
                }`}
                data-testid={`paw-${pawNumber}`}
              >
                <PawPrint
                  className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                    isActive
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
        
        {/* Rating Label */}
        <div className="h-6 text-center">
          {(hoveredPaw || selectedPaw) > 0 && (
            <span className="text-sm font-medium text-amber-700">
              {hoveredPaw || selectedPaw}/10 - {getPawLabel(hoveredPaw || selectedPaw)}
            </span>
          )}
        </div>
      </div>
      
      {/* Feedback Section */}
      {showFeedback && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>Add feedback (optional)</span>
          </div>
          
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`What do you think about ${productName}?`}
            className="min-h-[80px] bg-white resize-none"
            maxLength={500}
          />
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setShowFeedback(false);
                setSelectedPaw(0);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPaw}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {!showFeedback && !selectedPaw && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Click a paw to rate from 1-10
        </p>
      )}
    </div>
  );
};

// Main export
const PawMeter = PawMeterInteractive;
export default PawMeter;
