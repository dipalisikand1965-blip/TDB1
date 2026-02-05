/**
 * SoulScoreBanner - Friendly nudge to complete pet profile
 * 
 * Shows near Mira's recommendations with a mini arc and contextual message.
 * Encourages users to complete their pet's soul for better personalization.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, ArrowRight, X, Heart } from 'lucide-react';

const SoulScoreBanner = ({ 
  score = 0, 
  petId, 
  petName = 'your pet',
  onDismiss,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Animate score on mount
  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const end = Math.min(100, Math.max(0, score));

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(end * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Don't show if dismissed or score is 100%
  if (isDismissed) return null;

  // Arc configuration
  const size = 48;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getColors = (s) => {
    if (s >= 80) return { 
      stroke: '#10b981', 
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      accent: 'text-emerald-600'
    };
    if (s >= 50) return { 
      stroke: '#8b5cf6', 
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      accent: 'text-purple-600'
    };
    if (s >= 30) return { 
      stroke: '#f59e0b', 
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      accent: 'text-amber-600'
    };
    return { 
      stroke: '#ec4899', 
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      accent: 'text-pink-600'
    };
  };

  const colors = getColors(score);

  // Message based on score level
  const getMessage = () => {
    if (score >= 90) return {
      title: `I know ${petName} so well!`,
      subtitle: "Soul Master status unlocked",
      cta: null,
      icon: "👑"
    };
    if (score >= 70) return {
      title: `I know ${Math.round(score)}% of ${petName}'s soul!`,
      subtitle: "Almost a Soul Master! A few more questions?",
      cta: "Complete Profile",
      icon: "✨"
    };
    if (score >= 40) return {
      title: `I know ${Math.round(score)}% of ${petName}'s soul`,
      subtitle: "Help me know them better for perfect picks!",
      cta: "Quick Questions",
      icon: "🧠"
    };
    return {
      title: `Let's get to know ${petName}!`,
      subtitle: "Answer a few questions for personalized picks",
      cta: "Start Journey",
      icon: "🐾"
    };
  };

  const message = getMessage();

  const handleClick = () => {
    if (petId && message.cta) {
      navigate(`/pet/${petId}?tab=soul`);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div 
      className={`
        relative bg-gradient-to-r ${colors.bg} 
        rounded-xl border ${colors.border}
        p-3 sm:p-4 
        ${message.cta ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={handleClick}
      data-testid="soul-score-banner"
    >
      {/* Dismiss button - only show if not at 100% */}
      {score < 90 && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mini Arc */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
              style={{
                filter: score >= 70 ? `drop-shadow(0 0 4px ${colors.stroke}40)` : 'none'
              }}
            />
          </svg>
          {/* Center icon/score */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: colors.stroke }}>
              {Math.round(animatedScore)}%
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{message.icon}</span>
            <h4 className={`font-semibold text-sm sm:text-base ${colors.text} truncate`}>
              {message.title}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {message.subtitle}
          </p>
        </div>

        {/* CTA Arrow */}
        {message.cta && (
          <div className={`flex-shrink-0 flex items-center gap-1 ${colors.accent} text-xs sm:text-sm font-medium`}>
            <span className="hidden sm:inline">{message.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}

        {/* Soul Master Badge */}
        {score >= 90 && (
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Soul Master</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoulScoreBanner;
