/**
 * InsightsPanel - Mira's Insights Overlay
 * ========================================
 * Shows tips and insights gathered from the conversation
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { PawPrint, Sparkles, X } from 'lucide-react';

/**
 * InsightsPanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {string} props.petName - Pet's name
 * @param {Array} props.conversationHistory - Conversation messages
 */
const InsightsPanel = ({ 
  isOpen, 
  onClose, 
  petName = 'your pet',
  conversationHistory = []
}) => {
  if (!isOpen) return null;
  
  // Extract tips from Mira's messages
  const tips = conversationHistory
    .filter(msg => msg.type === 'mira' && msg.data?.response?.tips?.length > 0)
    .flatMap(msg => msg.data.response.tips)
    .slice(-5);
  
  return (
    <div className="mp-insights-panel" data-testid="insights-panel">
      <div className="mp-insights-header">
        <span>
          <PawPrint size={14} /> <Sparkles size={12} /> Mira's Insights for {petName}
        </span>
        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="mp-insights-content">
        {tips.length > 0 ? (
          tips.map((tip, idx) => (
            <div key={idx} className="mp-insight-item">
              <span className="insight-bullet">💡</span>
              <span>{tip}</span>
            </div>
          ))
        ) : (
          <p className="mp-no-insights">
            Keep chatting and I'll share helpful insights for {petName}!
          </p>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
