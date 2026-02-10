/**
 * InsightsPanel - Mira's Insights Overlay
 * ========================================
 * Shows tips, tip cards, and insights gathered from the conversation
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useState } from 'react';
import { PawPrint, Sparkles, X, Lightbulb, Brain, FileText, Heart, ChevronDown, ChevronUp, Send } from 'lucide-react';

/**
 * InsightsPanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {string} props.petName - Pet's name
 * @param {Array} props.conversationHistory - Conversation messages
 * @param {Object} props.tipCard - Current tip card from response
 * @param {Object} props.memoryContext - What Mira knows about the pet
 * @param {Function} props.onSendToConcierge - Called when sending tip to Concierge®
 */
const InsightsPanel = ({ 
  isOpen, 
  onClose, 
  petName = 'your pet',
  conversationHistory = [],
  tipCard = null,
  memoryContext = null,
  onSendToConcierge = null
}) => {
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [sendingTipId, setSendingTipId] = useState(null);
  
  if (!isOpen) return null;
  
  // Extract tips from Mira's messages
  const tips = conversationHistory
    .filter(msg => msg.type === 'mira' && msg.data?.response?.tips?.length > 0)
    .flatMap(msg => msg.data.response.tips)
    .slice(-5);
  
  // Extract tip cards from conversation
  const tipCards = conversationHistory
    .filter(msg => msg.type === 'mira' && msg.data?.response?.tip_card)
    .map(msg => msg.data.response.tip_card)
    .slice(-3);
  
  // Add current tip card if not already in list
  if (tipCard && !tipCards.find(tc => tc.id === tipCard.id)) {
    tipCards.unshift(tipCard);
  }
  
  // Icon mapping for tip card types
  const tipCardIcons = {
    meal_plan: '🍽️',
    travel_tips: '✈️',
    health_advice: '💊',
    training_tips: '🎓',
    festival_safety: '🎆',
    celebration_tips: '🎉',
    new_pet_guide: '🐾',
    home_tips: '🏠',
    grooming_routine: '✨',
    exercise_routine: '🏃',
    bonding_ritual: '💜',
    general: '💡'
  };
  
  // Toggle expand/collapse for a tip card
  const toggleTipExpand = (tipId) => {
    setExpandedTipId(prev => prev === tipId ? null : tipId);
  };
  
  // Handle sending tip card to Concierge®
  const handleSendToConcierge = async (tc, e) => {
    e.stopPropagation(); // Prevent card from collapsing
    
    if (!onSendToConcierge) return;
    
    const tipId = tc.id || `tip-${Date.now()}`;
    setSendingTipId(tipId);
    
    try {
      await onSendToConcierge({
        type: 'tip_card',
        title: tc.title,
        content: tc.content,
        tipType: tc.type,
        petName: petName
      });
    } catch (err) {
      console.error('[INSIGHTS] Failed to send to Concierge®:', err);
    }
    
    setSendingTipId(null);
  };
  
  return (
    <div className="mp-insights-panel" data-testid="insights-panel">
      <div className="mp-insights-header">
        <span>
          <Brain size={14} /> <Sparkles size={12} /> Mira's Insights for {petName}
        </span>
        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="mp-insights-content">
        {/* TIP CARDS SECTION */}
        {tipCards.length > 0 && (
          <div className="insights-section">
            <h4 className="insights-section-title">
              <FileText size={14} /> Saved Tips
            </h4>
            {tipCards.map((tc, idx) => {
              const tipId = tc.id || `tip-${idx}`;
              const isExpanded = expandedTipId === tipId;
              const isSending = sendingTipId === tipId;
              
              return (
                <div 
                  key={tipId} 
                  className={`mp-tip-card-mini ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleTipExpand(tipId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tip-card-header">
                    <span className="tip-card-icon">{tipCardIcons[tc.type] || '💡'}</span>
                    <div className="tip-card-content">
                      <span className="tip-card-title">{tc.title}</span>
                      <span className="tip-card-type">{tc.type?.replace('_', ' ')}</span>
                    </div>
                    <span className="tip-card-expand-icon">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="tip-card-expanded-content">
                      {tc.content && <p>{tc.content}</p>}
                      
                      {/* Send to Concierge® button */}
                      {onSendToConcierge && (
                        <button
                          className="tip-send-concierge-btn"
                          onClick={(e) => handleSendToConcierge(tc, e)}
                          disabled={isSending}
                          data-testid="tip-send-concierge"
                        >
                          <Send size={14} />
                          <span>{isSending ? 'Sending...' : 'Send to Concierge®'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* MEMORY CONTEXT - What Mira knows */}
        {memoryContext?.relevant_memory && (
          <div className="insights-section">
            <h4 className="insights-section-title">
              <Heart size={14} /> What I Know About {petName}
            </h4>
            <div className="mp-memory-item">
              <span className="memory-topic">{memoryContext.relevant_memory.topic}</span>
              {memoryContext.relevant_memory.summary && (
                <p className="memory-summary">{memoryContext.relevant_memory.summary}</p>
              )}
            </div>
          </div>
        )}
        
        {/* QUICK TIPS SECTION */}
        {tips.length > 0 && (
          <div className="insights-section">
            <h4 className="insights-section-title">
              <Lightbulb size={14} /> Quick Tips
            </h4>
            {tips.map((tip, idx) => (
              <div key={idx} className="mp-insight-item">
                <span className="insight-bullet">💡</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* EMPTY STATE */}
        {tips.length === 0 && tipCards.length === 0 && !memoryContext?.relevant_memory && (
          <p className="mp-no-insights">
            <PawPrint size={16} />
            Keep chatting and I'll share helpful insights for {petName}!
          </p>
        )}
      </div>
      
      {/* Additional styles for Concierge® button */}
      <style>{`
        .tip-send-concierge-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tip-send-concierge-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }
        .tip-send-concierge-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default InsightsPanel;
