/**
 * SoulScoreBanner - Friendly nudge to complete pet profile
 * 
 * Shows near Mira's recommendations with a mini arc and contextual message.
 * Encourages users to complete their pet's soul for better personalization.
 * 
 * MOBILE-FIRST: Compact on mobile, expands on desktop
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X, Sparkles } from 'lucide-react';

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

  // Arc configuration - smaller on mobile
  const size = 40; // Reduced from 48
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getColors = (s) => {
    if (s >= 80) return { 
      stroke: '#10b981', 
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200/60',
      text: 'text-emerald-700',
      accent: 'text-emerald-600'
    };
    if (s >= 50) return { 
      stroke: '#8b5cf6', 
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200/60',
      text: 'text-purple-700',
      accent: 'text-purple-600'
    };
    if (s >= 30) return { 
      stroke: '#f59e0b', 
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/60',
      text: 'text-amber-700',
      accent: 'text-amber-600'
    };
    return { 
      stroke: '#ec4899', 
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200/60',
      text: 'text-pink-700',
      accent: 'text-pink-600'
    };
  };

  const colors = getColors(score);

  // Shortened messages for mobile
  const getMessage = () => {
    if (score >= 90) return {
      title: `I know ${petName} so well!`,
      mobileTitle: `Soul Master!`,
      subtitle: "Soul Master status unlocked",
      mobileSubtitle: null,
      cta: null,
      icon: "👑"
    };
    if (score >= 70) return {
      title: `I know ${Math.round(score)}% of ${petName}'s soul!`,
      mobileTitle: `${Math.round(score)}% Soul`,
      subtitle: "Almost a Soul Master! A few more questions?",
      mobileSubtitle: "Almost there!",
      cta: "Complete",
      icon: "✨"
    };
    if (score >= 40) return {
      title: `I know ${Math.round(score)}% of ${petName}'s soul`,
      mobileTitle: `${Math.round(score)}% Soul`,
      subtitle: "Help me know them better for perfect picks!",
      mobileSubtitle: "Know them better",
      cta: "Quick Q's",
      icon: "🧠"
    };
    return {
      title: `Let's get to know ${petName}!`,
      mobileTitle: `Know ${petName}`,
      subtitle: "Answer a few questions for personalized picks",
      mobileSubtitle: "For better picks",
      cta: "Start",
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
        rounded-lg sm:rounded-xl border ${colors.border}
        p-2 sm:p-3 
        ${message.cta ? 'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''}
        ${className}
      `}
      onClick={handleClick}
      data-testid="soul-score-banner"
    >
      {/* Dismiss button */}
      {score < 90 && (
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 p-0.5 sm:p-1 rounded-full hover:bg-white/50 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
        </button>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mini Arc */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
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
                filter: score >= 70 ? `drop-shadow(0 0 3px ${colors.stroke}40)` : 'none'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.stroke }}>
              {Math.round(animatedScore)}%
            </span>
          </div>
        </div>

        {/* Message - adaptive for mobile/desktop */}
        <div className="flex-1 min-w-0 pr-4 sm:pr-0">
          <div className="flex items-center gap-1">
            <span className="text-sm sm:text-base">{message.icon}</span>
            {/* Desktop title */}
            <h4 className={`hidden sm:block font-semibold text-sm ${colors.text} truncate`}>
              {message.title}
            </h4>
            {/* Mobile title */}
            <h4 className={`sm:hidden font-semibold text-[11px] ${colors.text} truncate`}>
              {message.mobileTitle}
            </h4>
          </div>
          {/* Desktop subtitle */}
          <p className="hidden sm:block text-xs text-gray-600 mt-0.5 truncate">
            {message.subtitle}
          </p>
          {/* Mobile subtitle */}
          {message.mobileSubtitle && (
            <p className="sm:hidden text-[10px] text-gray-500 truncate">
              {message.mobileSubtitle}
            </p>
          )}
        </div>

        {/* CTA Arrow */}
        {message.cta && (
          <div className={`flex-shrink-0 flex items-center gap-0.5 sm:gap-1 ${colors.accent} text-[10px] sm:text-xs font-medium`}>
            <span>{message.cta}</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}

        {/* Soul Master Badge */}
        {score >= 90 && (
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Soul Master</span>
              <span className="sm:hidden">Master</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoulScoreBanner;
