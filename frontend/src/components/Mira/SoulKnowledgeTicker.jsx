/**
 * SoulKnowledgeTicker.jsx
 * =======================
 * A dynamic rolling ticker showing everything Mira knows about the pet.
 * 
 * DESIGN PHILOSOPHY:
 * - This is the PET OPERATING SYSTEM - deeply personalized
 * - Shows rich knowledge: favorites, allergies, personality, breed traits, memories
 * - Encourages pet parents to complete soul questions to grow the score
 * - Soul Score grows dynamically with each interaction
 * - Rolling animation makes it feel alive and always learning
 * - Score badge LINKS to My Pets page for full soul profile
 * - "What Mira Knows" card opens first on badge click
 * 
 * "Mira knows Mojo 67%" - and here's WHY she knows him
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Brain, Heart, X, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// Category colors for visual distinction
const CATEGORY_STYLES = {
  soul: { bg: 'bg-purple-500/20', border: 'border-purple-400/30', icon: 'text-purple-400' },
  diet: { bg: 'bg-orange-500/20', border: 'border-orange-400/30', icon: 'text-orange-400' },
  health: { bg: 'bg-red-500/20', border: 'border-red-400/30', icon: 'text-red-400' },
  activity: { bg: 'bg-green-500/20', border: 'border-green-400/30', icon: 'text-green-400' },
  personality: { bg: 'bg-blue-500/20', border: 'border-blue-400/30', icon: 'text-blue-400' },
  memory: { bg: 'bg-amber-500/20', border: 'border-amber-400/30', icon: 'text-amber-400' },
  breed: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', icon: 'text-cyan-400' }
};

const SoulKnowledgeTicker = ({
  petId,
  petName = 'your pet',
  soulScore = 0,
  knowledgeItems = [],
  onSoulQuestionClick,
  onKnowledgeItemClick,
  apiUrl,
  className = ''
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState(knowledgeItems);
  const [displayScore, setDisplayScore] = useState(soulScore);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const prevScoreRef = useRef(soulScore);
  const tickerRef = useRef(null);
  
  // Fetch knowledge items from backend - prioritize personal knowledge over places
  useEffect(() => {
    const fetchKnowledge = async () => {
      if (!petId || !apiUrl) return;
      
      try {
        const response = await fetch(`${apiUrl}/api/mira/personalization-stats/${petId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.knowledge_items && data.knowledge_items.length > 0) {
            // Sort by priority (highest first) and filter out low-value items
            const sortedItems = data.knowledge_items
              .filter(item => item.priority >= 4) // Only show items with priority 4+
              .sort((a, b) => (b.priority || 5) - (a.priority || 5));
            setItems(sortedItems);
          }
        }
      } catch (err) {
        console.debug('[TICKER] Could not fetch knowledge:', err);
      }
    };
    
    fetchKnowledge();
  }, [petId, apiUrl]);
  
  // Update items when knowledgeItems prop changes (e.g., when switching pets)
  useEffect(() => {
    if (knowledgeItems && knowledgeItems.length > 0) {
      // Filter and sort prop items too - prefer personal knowledge over places
      const personalItems = knowledgeItems.filter(item => 
        item.category !== 'place' && item.category !== 'activity'
      );
      const otherItems = knowledgeItems.filter(item => 
        item.category === 'place' || item.category === 'activity'
      );
      // Personal items first, then places/activities
      const sortedItems = [...personalItems, ...otherItems.slice(0, 2)]; // Limit places to 2
      setItems(sortedItems);
    }
  }, [knowledgeItems]);
  
  // Animate soul score when it increases
  useEffect(() => {
    if (soulScore > prevScoreRef.current) {
      setIsGlowing(true);
      
      // Animate counting up
      const start = prevScoreRef.current;
      const end = soulScore;
      const duration = 1200;
      const steps = 30;
      const increment = (end - start) / steps;
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= steps) {
          setDisplayScore(end);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.round(start + (increment * step)));
        }
      }, duration / steps);
      
      // Remove glow after animation
      setTimeout(() => setIsGlowing(false), 2000);
      prevScoreRef.current = soulScore;
      
      return () => clearInterval(interval);
    } else {
      setDisplayScore(soulScore);
      prevScoreRef.current = soulScore;
    }
  }, [soulScore]);
  
  // Handle item click
  const handleItemClick = useCallback((item) => {
    hapticFeedback.buttonTap();
    
    if (item.actionable && item.action_hint?.includes('soul')) {
      onSoulQuestionClick?.();
    } else {
      onKnowledgeItemClick?.(item);
    }
  }, [onSoulQuestionClick, onKnowledgeItemClick]);
  
  // Duplicate items for seamless loop
  const tickerItems = items.length > 0 ? [...items, ...items, ...items] : [];
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Main Ticker Bar */}
      <div 
        className={`soul-knowledge-ticker ${className} ${isGlowing ? 'ticker-glowing' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        data-testid="soul-knowledge-ticker"
      >
        {/* Soul Score Badge - Left side, always visible - LINKS TO MY PETS */}
        <div 
          className={`ticker-soul-badge ${isGlowing ? 'score-growing' : ''}`}
          onClick={() => {
            hapticFeedback.buttonTap();
            // Navigate to My Pets page with this pet's tab open
            navigate(`/my-pets?pet=${petId}`);
          }}
          title={`View ${petName}'s full Soul Profile`}
          data-testid="soul-score-badge"
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="score-value">{Math.round(displayScore)}%</span>
          <span className="score-label">SOUL</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </div>
        
        {/* Rolling Ticker Track */}
        <div className="ticker-track" ref={tickerRef}>
          <div 
            className={`ticker-content ${isPaused ? 'paused' : ''}`}
            style={{ 
              animationDuration: `${Math.max(items.length * 4, 20)}s`
            }}
          >
            {tickerItems.map((item, index) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.soul;
              
              return (
                <span
                  key={`ticker-${index}`}
                  className={`ticker-item ${style.bg} ${style.border} ${item.actionable ? 'actionable' : ''}`}
                  onClick={() => handleItemClick(item)}
                  data-testid={`ticker-item-${index}`}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-text">{item.text}</span>
                  {item.actionable && <ChevronRight className="item-arrow" />}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Encourage Soul Completion - Right side */}
        {displayScore < 50 && (
          <button
            className="ticker-cta"
            onClick={() => {
              hapticFeedback.buttonTap();
              onSoulQuestionClick?.();
            }}
            data-testid="soul-cta-button"
          >
            <Sparkles className="w-3 h-3" />
            <span>Grow Soul</span>
          </button>
        )}
      </div>
      
      {/* Expanded Panel - Shows all knowledge */}
      {showExpanded && (
        <div className="soul-knowledge-expanded" data-testid="soul-knowledge-expanded">
          <div className="expanded-header">
            <div className="expanded-title">
              <Heart className="w-4 h-4 text-purple-400" />
              <span>What Mira knows about {petName}</span>
            </div>
            <button 
              className="expanded-close"
              onClick={() => setShowExpanded(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="expanded-score">
            <div className={`score-circle ${isGlowing ? 'glowing' : ''}`}>
              <span className="score-number">{Math.round(displayScore)}%</span>
              <span className="score-text">Soul Known</span>
            </div>
            {displayScore < 50 && (
              <p className="score-hint">
                Answer more soul questions to help Mira know {petName} better!
              </p>
            )}
          </div>
          
          <div className="expanded-grid">
            {Object.entries(
              items.reduce((acc, item) => {
                const cat = item.category || 'soul';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {})
            ).map(([category, categoryItems]) => (
              <div key={category} className="expanded-category">
                <h4 className="category-title">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <ul className="category-items">
                  {categoryItems.map((item, i) => (
                    <li 
                      key={i} 
                      className={`category-item ${CATEGORY_STYLES[category]?.bg || ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-text">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {displayScore < 80 && (
            <button 
              className="expanded-grow-btn"
              onClick={() => {
                setShowExpanded(false);
                onSoulQuestionClick?.();
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Help Mira know {petName} better</span>
            </button>
          )}
        </div>
      )}
      
      {/* Styles */}
      <style jsx>{`
        .soul-knowledge-ticker {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1));
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          overflow: hidden;
          position: relative;
        }
        
        .soul-knowledge-ticker.ticker-glowing {
          animation: tickerGlow 1.5s ease-out;
        }
        
        @keyframes tickerGlow {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
        }
        
        .ticker-soul-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border-radius: 20px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          color: white;
          font-weight: 600;
        }
        
        .ticker-soul-badge:hover {
          transform: scale(1.05);
        }
        
        .ticker-soul-badge.score-growing {
          animation: scoreGrow 1.2s ease-out;
        }
        
        @keyframes scoreGrow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); box-shadow: 0 0 15px rgba(139, 92, 246, 0.6); }
        }
        
        .score-value {
          font-size: 13px;
          font-weight: 700;
        }
        
        .score-label {
          font-size: 9px;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }
        
        .ticker-track {
          flex: 1;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        
        .ticker-content {
          display: flex;
          gap: 12px;
          animation: tickerScroll linear infinite;
          width: max-content;
        }
        
        .ticker-content.paused {
          animation-play-state: paused;
        }
        
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 16px;
          border: 1px solid;
          font-size: 12px;
          white-space: nowrap;
          cursor: default;
          transition: all 0.2s ease;
        }
        
        .ticker-item.actionable {
          cursor: pointer;
        }
        
        .ticker-item.actionable:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
        
        .item-icon {
          font-size: 14px;
        }
        
        .item-text {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .item-arrow {
          width: 12px;
          height: 12px;
          opacity: 0.6;
        }
        
        .ticker-cta {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(139, 92, 246, 0.3);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 16px;
          color: #C4B5FD;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        
        .ticker-cta:hover {
          background: rgba(139, 92, 246, 0.5);
          transform: scale(1.05);
        }
        
        /* Expanded Panel */
        .soul-knowledge-expanded {
          position: fixed;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          max-height: 70vh;
          overflow-y: auto;
          background: linear-gradient(180deg, rgba(30, 20, 50, 0.98), rgba(20, 15, 40, 0.98));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 20px;
          z-index: 100;
          animation: expandIn 0.3s ease-out;
        }
        
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        .expanded-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .expanded-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }
        
        .expanded-close {
          padding: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .expanded-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .expanded-score {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .score-circle {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
          border: 3px solid rgba(139, 92, 246, 0.5);
          border-radius: 50%;
          margin-bottom: 8px;
        }
        
        .score-circle.glowing {
          animation: circleGlow 1.5s ease-out;
        }
        
        @keyframes circleGlow {
          0%, 100% { box-shadow: none; border-color: rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); border-color: #8B5CF6; }
        }
        
        .score-number {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .score-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .score-hint {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .expanded-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        
        @media (max-width: 480px) {
          .expanded-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .expanded-category {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 12px;
        }
        
        .category-title {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .category-items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .category-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .category-item:hover {
          filter: brightness(1.2);
        }
        
        .expanded-grow-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .expanded-grow-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </>
  );
};

export default SoulKnowledgeTicker;
