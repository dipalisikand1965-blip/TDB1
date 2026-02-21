/**
 * SoulScoreArc - Animated Circular Progress for Pet Soul Score
 * 
 * A beautiful, animated arc/ring display showing the pet's soul score percentage.
 * Can be used across multiple pages to encourage users to keep answering questions.
 * 
 * Features:
 * - Smooth animation on load and score change
 * - Color changes based on score level
 * - Glowing effect when score is high
 * - Pet name display
 * - Click to navigate to soul journey
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, ArrowRight } from 'lucide-react';

const SoulScoreArc = ({ 
  score = 0, 
  petId, 
  petName = 'Pet',
  size = 'md', // 'sm', 'md', 'lg', 'xl' or numeric value
  strokeWidth, // Optional stroke width for numeric size
  showLabel = true,
  showCTA = true,
  animated = true,
  className = '',
  children // Allow children for wrapper pattern
}) => {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);

  // Size configurations
  const sizes = {
    sm: { container: 80, stroke: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { container: 120, stroke: 8, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { container: 160, stroke: 10, fontSize: 'text-3xl', labelSize: 'text-base' },
    xl: { container: 200, stroke: 12, fontSize: 'text-4xl', labelSize: 'text-lg' }
  };

  // Handle both string and numeric size prop
  const getConfig = () => {
    if (typeof size === 'number') {
      // Numeric size - calculate proportionally
      const strokeW = strokeWidth || Math.max(4, size / 20);
      return { container: size, stroke: strokeW, fontSize: 'text-2xl', labelSize: 'text-sm' };
    }
    return sizes[size] || sizes.md;
  };
  
  const config = getConfig();
  const radius = (config.container - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getScoreColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', text: 'text-emerald-600', bg: 'from-emerald-500 to-teal-500' };
    if (s >= 60) return { stroke: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', text: 'text-purple-600', bg: 'from-purple-500 to-pink-500' };
    if (s >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', text: 'text-amber-600', bg: 'from-amber-500 to-orange-500' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', text: 'text-red-500', bg: 'from-red-500 to-rose-500' };
  };

  const colors = getScoreColor(score);

  // Animate score on mount and change
  useEffect(() => {
    if (!animated) {
      setAnimatedScore(score);
      return;
    }

    let start = animatedScore;
    const end = Math.min(100, Math.max(0, score));
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (end - start) * eased;
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Trigger glow effect when animation completes
        if (end >= 50) {
          setIsGlowing(true);
          setTimeout(() => setIsGlowing(false), 2000);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  const handleClick = () => {
    if (petId) {
      navigate(`/pet/${petId}?tab=personality`);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Arc Container */}
      <div 
        className={`relative cursor-pointer transition-transform hover:scale-105 ${isGlowing ? 'animate-pulse' : ''}`}
        style={{ width: config.container, height: config.container }}
        onClick={handleClick}
      >
        {/* Glow Effect */}
        {isGlowing && (
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-50 animate-ping"
            style={{ backgroundColor: colors.glow }}
          />
        )}
        
        {/* SVG Arc */}
        <svg 
          className="w-full h-full transform -rotate-90"
          viewBox={`0 0 ${config.container} ${config.container}`}
        >
          {/* Background Circle */}
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.stroke}
          />
          
          {/* Progress Arc */}
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
            style={{
              filter: isGlowing ? `drop-shadow(0 0 8px ${colors.glow})` : 'none'
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ? (
            // If children provided, render them (wrapper pattern)
            children
          ) : (
            // Default center content
            <>
              <Brain className={`w-4 h-4 ${colors.text} mb-0.5 ${isGlowing ? 'animate-bounce' : ''}`} />
              <span className={`${config.fontSize} font-bold ${colors.text}`}>
                {Math.round(animatedScore)}%
              </span>
              {size !== 'sm' && (
                <span className={`${config.labelSize} text-gray-500 font-medium`}>Soul</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && petName && (
        <p className={`mt-2 font-semibold text-gray-900 ${config.labelSize}`}>
          {petName}&apos;s Soul
        </p>
      )}

      {/* CTA */}
      {showCTA && score < 100 && (
        <button
          onClick={handleClick}
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${colors.text} hover:underline`}
        >
          <Sparkles className="w-3 h-3" />
          {score < 30 ? 'Start Journey' : score < 70 ? 'Keep Growing' : 'Almost There!'}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default SoulScoreArc;
