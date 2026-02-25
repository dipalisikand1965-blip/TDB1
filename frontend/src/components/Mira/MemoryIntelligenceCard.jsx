/**
 * MemoryIntelligenceCard - Pet Intelligence Dashboard
 * ====================================================
 * Beautiful card overlay on pet photo showing what Mira has learned
 * 
 * Features:
 * - Intelligence score with animated ring
 * - Recent learnings from conversations
 * - Category breakdown (behavior, health, preferences)
 * - Growth indicator since last session
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Heart, 
  Shield, 
  Utensils, 
  Moon,
  Activity,
  TrendingUp,
  ChevronRight,
  Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Category icons and colors mapping
 */
const CATEGORY_CONFIG = {
  behavior: { icon: Heart, color: '#f472b6', label: 'Behavior' },
  food_preference: { icon: Utensils, color: '#fbbf24', label: 'Food' },
  allergy: { icon: Shield, color: '#ef4444', label: 'Allergies' },
  health: { icon: Activity, color: '#34d399', label: 'Health' },
  routine: { icon: Moon, color: '#a78bfa', label: 'Routine' },
  emotional: { icon: Heart, color: '#ec4899', label: 'Emotional' },
  environment: { icon: Eye, color: '#60a5fa', label: 'Environment' }
};

/**
 * Animated Score Ring Component
 */
const ScoreRing = ({ score, size = 80 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  
  useEffect(() => {
    // Animate score on mount
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <span style={{ 
          fontSize: size * 0.25, 
          fontWeight: 700, 
          color: 'white',
          display: 'block',
          lineHeight: 1
        }}>
          {Math.round(animatedScore)}
        </span>
        <span style={{ 
          fontSize: size * 0.12, 
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          IQ
        </span>
      </div>
    </div>
  );
};

/**
 * Learning Item Component
 */
const LearningItem = ({ category, value, confidence }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.behavior;
  const Icon = config.icon;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      borderLeft: `2px solid ${config.color}`
    }}>
      <Icon size={12} style={{ color: config.color, flexShrink: 0 }} />
      <span style={{ 
        fontSize: '11px', 
        color: 'rgba(255,255,255,0.8)',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {value}
      </span>
      {confidence >= 85 && (
        <span style={{ 
          fontSize: '8px', 
          background: '#22c55e', 
          color: 'white',
          padding: '1px 4px',
          borderRadius: '4px',
          fontWeight: 600
        }}>
          ✓
        </span>
      )}
    </div>
  );
};

/**
 * Main Memory Intelligence Card Component
 */
const MemoryIntelligenceCard = ({ 
  petId, 
  petName,
  petPhoto,
  soulScore = 0,
  isExpanded = false,
  onToggle,
  style = {}
}) => {
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState({ total: 0, categories: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [growth, setGrowth] = useState(0);
  
  // Fetch pet memories
  useEffect(() => {
    if (!petId) return;
    
    const fetchMemories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/mira/pet-intelligence/${petId}`);
        if (response.ok) {
          const data = await response.json();
          setMemories(data.recent_learnings || []);
          setStats(data.stats || { total: 0, categories: {} });
          setGrowth(data.growth_since_last_session || 0);
        }
      } catch (err) {
        console.error('[MemoryCard] Error fetching intelligence:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemories();
  }, [petId]);
  
  // Calculate intelligence score (combines soul score + conversation learnings)
  const intelligenceScore = Math.min(100, Math.round(soulScore + (stats.total * 2)));
  
  return (
    <div 
      className="memory-intelligence-card"
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        ...style
      }}
      data-testid="memory-intelligence-card"
    >
      {/* Pet Photo Background with Gradient Overlay */}
      <div style={{
        position: 'relative',
        height: isExpanded ? '120px' : '100px',
        overflow: 'hidden',
        transition: 'height 0.3s ease'
      }}>
        {petPhoto ? (
          <img 
            src={petPhoto} 
            alt={petName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7)'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }} />
        )}
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70%',
          background: 'linear-gradient(to top, #1a1a2e 0%, transparent 100%)'
        }} />
        
        {/* Intelligence Score Badge - Top Right */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          padding: '4px 10px',
          borderRadius: '20px'
        }}>
          <Brain size={12} style={{ color: '#a855f7' }} />
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'white' 
          }}>
            {intelligenceScore}% IQ
          </span>
          {growth > 0 && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              color: '#22c55e',
              fontSize: '9px',
              fontWeight: 600
            }}>
              <TrendingUp size={10} />
              +{growth}
            </span>
          )}
        </div>
        
        {/* Pet Name Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            {petName}'s Mind
          </span>
          <Sparkles size={14} style={{ color: '#fbbf24' }} />
        </div>
      </div>
      
      {/* Intelligence Content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          {Object.entries(stats.categories || {}).slice(0, 4).map(([cat, count]) => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.behavior;
            const Icon = config.icon;
            return (
              <div 
                key={cat}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: `${config.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={14} style={{ color: config.color }} />
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {config.label}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: 'white' 
                }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Recent Learnings */}
        {memories.length > 0 && (
          <>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              Recent Learnings
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: isExpanded ? '200px' : '80px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease'
            }}>
              {memories.slice(0, isExpanded ? 10 : 3).map((m, i) => (
                <LearningItem 
                  key={i}
                  category={m.category}
                  value={m.value}
                  confidence={m.confidence}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Empty State */}
        {memories.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <Brain size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', margin: 0 }}>
              Chat with Mira to build {petName}'s intelligence profile
            </p>
          </div>
        )}
        
        {/* Expand/Collapse Button */}
        {memories.length > 3 && (
          <button
            onClick={onToggle}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '8px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '8px',
              color: '#a855f7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(168, 85, 247, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(168, 85, 247, 0.1)'}
            data-testid="expand-intelligence-btn"
          >
            {isExpanded ? 'Show Less' : `View All ${memories.length} Learnings`}
            <ChevronRight 
              size={14} 
              style={{ 
                transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default MemoryIntelligenceCard;
