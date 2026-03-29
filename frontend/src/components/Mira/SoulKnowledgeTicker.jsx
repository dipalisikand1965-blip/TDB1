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
import { Sparkles, ChevronRight, Brain, Heart, X, ExternalLink, ArrowRight, Loader2, Star } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import FavoritesPanel from './FavoritesPanel';

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
  petPhoto = null,
  soulScore = 0,
  knowledgeItems = [],
  onSoulQuestionClick,
  onKnowledgeItemClick,
  onSoulBadgeClick, // NEW: Opens MOJO Profile Modal
  apiUrl,
  token,  // Auth token for fetching knowledge
  className = ''
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState(knowledgeItems);
  const [displayScore, setDisplayScore] = useState(soulScore);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showKnowledgeCard, setShowKnowledgeCard] = useState(false);
  const [miraKnowledge, setMiraKnowledge] = useState(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);
  const prevScoreRef = useRef(soulScore);
  const tickerRef = useRef(null);
  
  // Fetch "What Mira Knows" data
  const fetchMiraKnowledge = async () => {
    if (!petId || !apiUrl || loadingKnowledge || miraKnowledge) return;
    
    setLoadingKnowledge(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Fetch both knowledge and favorites in parallel
      const [knowledgeRes, favoritesRes] = await Promise.all([
        fetch(`${apiUrl}/api/mira/memory/pet/${petId}/what-mira-knows`, { headers }),
        fetch(`${apiUrl}/api/favorites/${petId}`, { headers })
      ]);
      
      if (knowledgeRes.ok) {
        const data = await knowledgeRes.json();
        setMiraKnowledge(data);
      }
      
      if (favoritesRes.ok) {
        const favData = await favoritesRes.json();
        setFavorites(favData.favorites || []);
      }
    } catch (err) {
      console.debug('[TICKER] Could not fetch Mira knowledge:', err);
    } finally {
      setLoadingKnowledge(false);
    }
  };
  
  // Fetch knowledge when expanded panel opens
  useEffect(() => {
    if (showExpanded && !miraKnowledge && !loadingKnowledge) {
      fetchMiraKnowledge();
    }
  }, [showExpanded]);
  
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
  
  // Reset knowledge when pet changes
  useEffect(() => {
    setMiraKnowledge(null);
    setShowKnowledgeCard(false);
  }, [petId]);
  
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
  
  // Dedup then triplicate for seamless CSS loop
  const uniqueItems = items.filter((item, idx, arr) =>
    arr.findIndex(i => (i.text || i.label || i.id) === (item.text || item.label || item.id)) === idx
  );
  const tickerItems = uniqueItems.length > 0 ? [...uniqueItems, ...uniqueItems, ...uniqueItems] : [];
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Main Ticker Bar */}
      <div 
        className={`soul-knowledge-ticker ${className} ${isGlowing ? 'ticker-glowing' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          // Safety: force unpause after 3 seconds in case mouseleave doesn't fire
          setTimeout(() => setIsPaused(false), 3000);
        }}
        data-testid="soul-knowledge-ticker"
      >
        {/* Soul Score Badge - Left side, always visible - Opens MOJO Profile Modal */}
        <div 
          className={`ticker-soul-badge ${isGlowing ? 'score-growing' : ''}`}
          onClick={() => {
            hapticFeedback.buttonTap();
            // If MOJO modal handler provided, use it; otherwise fallback to expanded view
            if (onSoulBadgeClick) {
              onSoulBadgeClick('soul'); // Deep link to soul section
            } else {
              setShowExpanded(true);
            }
          }}
          title={`What Mira knows about ${petName}`}
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
      
      {/* Expanded Panel - Shows all knowledge (Soul, Breed, Memory sections) */}
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
            {/* Pet Photo with Soul Score Ring */}
            <div className={`score-circle-container ${isGlowing ? 'glowing' : ''}`}>
              {petPhoto ? (
                <img 
                  src={petPhoto} 
                  alt={petName}
                  className="score-pet-photo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
                  }}
                />
              ) : (
                <div className="score-circle">
                  <span className="score-number">{Math.round(displayScore)}%</span>
                  <span className="score-text">SOUL KNOWN</span>
                </div>
              )}
              {petPhoto && (
                <div className="score-overlay">
                  <span className="score-number">{Math.round(displayScore)}%</span>
                  <span className="score-text">SOUL</span>
                </div>
              )}
            </div>
            {displayScore < 50 && (
              <p className="score-hint">
                Answer more soul questions to help Mira know {petName} better!
              </p>
            )}
          </div>
          
          {/* Action Buttons Row */}
          <div className="expanded-actions-row">
            <button className="action-icon-btn" title="History" onClick={() => navigate(`/my-pets?pet=${petId}`)}>
              <span>⏱️</span>
            </button>
            <button className="action-icon-btn" title="Soul Questions" onClick={() => onSoulQuestionClick?.()}>
              <Sparkles className="w-4 h-4" />
            </button>
            <button className="action-icon-btn" title="Profile" onClick={() => navigate(`/my-pets?pet=${petId}`)}>
              <span>🔗</span>
            </button>
            <button className="action-icon-btn" title="Add Memory" onClick={() => navigate(`/mira-demo`)}>
              <span>+</span>
            </button>
          </div>
          
          {/* Loading state */}
          {loadingKnowledge && (
            <div className="expanded-loading">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading {petName}'s soul...</span>
            </div>
          )}
          
          {/* Content Grid - Soul, Breed, Memory sections */}
          {!loadingKnowledge && (
            <div className="expanded-grid">
              {/* SOUL Section */}
              <div className="expanded-category soul-section">
                <h4 className="category-title">SOUL</h4>
                <ul className="category-items">
                  <li className="category-item soul-item">
                    <span className="item-icon">💜</span>
                    <span className="item-text">Soul Score: {Math.round(displayScore)}%</span>
                  </li>
                  {miraKnowledge?.soul_knowledge?.slice(1, 4).map((item, i) => (
                    <li key={i} className="category-item soul-item" onClick={() => handleItemClick(item)}>
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-text">{item.text}</span>
                    </li>
                  ))}
                  <li className="category-item soul-item help-item" onClick={() => onSoulQuestionClick?.()}>
                    <span className="item-icon">✨</span>
                    <span className="item-text">Help Mira know {petName} better</span>
                  </li>
                </ul>
              </div>
              
              {/* BREED Section */}
              <div className="expanded-category breed-section">
                <h4 className="category-title">BREED</h4>
                <ul className="category-items">
                  {miraKnowledge?.breed_knowledge?.length > 0 ? (
                    miraKnowledge.breed_knowledge.map((item, i) => (
                      <li key={i} className="category-item breed-item" onClick={() => handleItemClick(item)}>
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-text">{item.text}</span>
                      </li>
                    ))
                  ) : (
                    items.filter(i => i.category === 'breed').slice(0, 3).map((item, i) => (
                      <li key={i} className="category-item breed-item" onClick={() => handleItemClick(item)}>
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-text">{item.text}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              
              {/* MEMORY Section */}
              <div className="expanded-category memory-section">
                <h4 className="category-title">MEMORY</h4>
                <ul className="category-items">
                  {miraKnowledge?.memory_knowledge?.length > 0 ? (
                    <>
                      <li className="category-item memory-item">
                        <span className="item-icon">📝</span>
                        <span className="item-text">{miraKnowledge.memory_knowledge.length} memories with {petName}</span>
                      </li>
                      {miraKnowledge.memory_knowledge.slice(0, 2).map((item, i) => (
                        <li key={i} className="category-item memory-item" onClick={() => handleItemClick(item)}>
                          <span className="item-icon">💭</span>
                          <span className="item-text">{petName}: {item.text?.substring(0, 30)}...</span>
                        </li>
                      ))}
                    </>
                  ) : (
                    <li className="category-item memory-item">
                      <span className="item-icon">💭</span>
                      <span className="item-text">Chat with Mira to build memories</span>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* FAVORITES Section */}
              <div className="expanded-category favorites-section">
                <h4 className="category-title">
                  <Heart className="w-3 h-3 inline-block mr-1 text-pink-400" />
                  FAVORITES
                </h4>
                <ul className="category-items">
                  {favorites.length > 0 ? (
                    <>
                      <li className="category-item favorites-item">
                        <span className="item-icon">♥️</span>
                        <span className="item-text">{favorites.length} saved picks</span>
                      </li>
                      {favorites.slice(0, 2).map((fav, i) => (
                        <li key={i} className="category-item favorites-item" onClick={() => setShowFavoritesPanel(true)}>
                          <span className="item-icon">{fav.icon || '⭐'}</span>
                          <span className="item-text">{fav.title?.substring(0, 25) || 'Saved pick'}...</span>
                        </li>
                      ))}
                      <li 
                        className="category-item favorites-item help-item"
                        onClick={() => setShowFavoritesPanel(true)}
                      >
                        <span className="item-icon">👀</span>
                        <span className="item-text">View all favorites</span>
                      </li>
                    </>
                  ) : (
                    <li className="category-item favorites-item">
                      <span className="item-icon">💗</span>
                      <span className="item-text">Tap ♥ to save picks for {petName}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {/* View Full Profile Button */}
          <button 
            className="expanded-view-profile-btn"
            onClick={() => {
              hapticFeedback.buttonTap();
              navigate(`/my-pets?pet=${petId}`);
            }}
          >
            <span>View Full Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
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
      
      {/* Favorites Panel */}
      <FavoritesPanel
        isOpen={showFavoritesPanel}
        onClose={() => setShowFavoritesPanel(false)}
        petId={petId}
        petName={petName}
        token={token}
        onFavoriteSelect={(fav) => {
          console.log('Favorite selected:', fav);
          setShowFavoritesPanel(false);
        }}
      />
      
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
          z-index: 100; /* Above navbar content but below modals */
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
        
        .score-circle-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 12px;
          border-radius: 50%;
          border: 4px solid;
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          overflow: hidden;
        }
        
        .score-circle-container.glowing {
          animation: circleGlow 1.5s ease-out;
        }
        
        .score-pet-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
        }
        
        .score-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 4px;
          background: linear-gradient(to top, rgba(139, 92, 246, 0.95), transparent);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .score-overlay .score-number {
          font-size: 18px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4);
        }
        
        .score-overlay .score-text {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 1px;
        }
        
        .score-circle {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
        }
        
        @keyframes circleGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); border-color: rgba(139, 92, 246, 0.6); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.7); border-color: #8B5CF6; }
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
        
        /* Section-specific styles */
        .soul-section .category-items {
          gap: 8px;
        }
        
        .soul-item {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .soul-item.help-item {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(236, 72, 153, 0.3);
        }
        
        .breed-section {
          background: rgba(6, 182, 212, 0.05);
        }
        
        .breed-item {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1));
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        
        .memory-section {
          grid-column: span 2;
        }
        
        @media (max-width: 480px) {
          .memory-section {
            grid-column: span 1;
          }
        }
        
        .memory-item {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .favorites-item {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1));
          border: 1px solid rgba(236, 72, 153, 0.3);
        }
        
        .favorites-section .category-title {
          color: #ec4899;
        }
        
        /* Action buttons row */
        .expanded-actions-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .action-icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-icon-btn:hover {
          background: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.5);
        }
        
        /* Loading state */
        .expanded-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 30px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        /* View Full Profile button */
        .expanded-view-profile-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          color: #C4B5FD;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        
        .expanded-view-profile-btn:hover {
          background: rgba(139, 92, 246, 0.3);
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
        
        /* WHAT MIRA KNOWS CARD - Premium Overlay */
        .mira-knowledge-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .mira-knowledge-card {
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.2);
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .knowledge-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .knowledge-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        
        .knowledge-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .knowledge-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .knowledge-score-section {
          padding: 24px;
          text-align: center;
        }
        
        .knowledge-score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 60px rgba(236, 72, 153, 0.5); }
        }
        
        .knowledge-score-value {
          font-size: 36px;
          font-weight: 800;
          color: white;
        }
        
        .knowledge-score-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .knowledge-score-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin-top: 8px;
        }
        
        .knowledge-content {
          padding: 0 20px 20px;
        }
        
        .knowledge-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 30px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .knowledge-section {
          margin-bottom: 20px;
        }
        
        .knowledge-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        
        .knowledge-items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .knowledge-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
        }
        
        .knowledge-item-icon {
          font-size: 16px;
        }
        
        .knowledge-memories {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .knowledge-memory-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
        }
        
        .memory-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .knowledge-empty {
          text-align: center;
          padding: 30px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .knowledge-actions {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .knowledge-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .knowledge-action-btn.secondary {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #C4B5FD;
        }
        
        .knowledge-action-btn.secondary:hover {
          background: rgba(139, 92, 246, 0.3);
        }
        
        .knowledge-action-btn.primary {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border: none;
          color: white;
        }
        
        .knowledge-action-btn.primary:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }
        
        /* Mobile optimization */
        @media (max-width: 480px) {
          .mira-knowledge-overlay {
            padding: 12px;
          }
          
          .mira-knowledge-card {
            max-height: 85vh;
          }
          
          .knowledge-items-grid {
            grid-template-columns: 1fr;
          }
          
          .knowledge-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};

export default SoulKnowledgeTicker;
