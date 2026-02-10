/**
 * HandoffSummary - Summary Card shown BEFORE sending to Concierge®
 * ================================================================
 * Shows what Mira is about to send to Concierge for confirmation
 * User sees the summary and confirms before handoff happens
 * 
 * "Like when Emergent hands off to next agent with full context"
 */

import React from 'react';
import { Send, Edit3, X, Sparkles, Calendar, MapPin, Gift, Heart } from 'lucide-react';

// Icon mapping for different pillars
const PILLAR_ICONS = {
  celebrate: Gift,
  dine: MapPin,
  travel: MapPin,
  care: Heart,
  stay: MapPin,
  fit: Heart,
  shop: Gift,
  default: Sparkles
};

const PILLAR_COLORS = {
  celebrate: 'from-pink-500/20 to-purple-500/20',
  dine: 'from-orange-500/20 to-amber-500/20',
  travel: 'from-blue-500/20 to-cyan-500/20',
  care: 'from-green-500/20 to-emerald-500/20',
  stay: 'from-indigo-500/20 to-violet-500/20',
  fit: 'from-rose-500/20 to-pink-500/20',
  shop: 'from-amber-500/20 to-yellow-500/20',
  default: 'from-purple-500/20 to-pink-500/20'
};

const HandoffSummary = ({
  isOpen,
  onClose,
  onConfirm,
  onEdit,
  petName = 'your pet',
  pillar = 'general',
  title = 'Request Summary',
  items = [],
  notes = '',
  ticketId = null
}) => {
  if (!isOpen) return null;
  
  const Icon = PILLAR_ICONS[pillar] || PILLAR_ICONS.default;
  const gradientClass = PILLAR_COLORS[pillar] || PILLAR_COLORS.default;
  
  return (
    <div className="handoff-overlay" data-testid="handoff-summary">
      <div className="handoff-backdrop" onClick={onClose} />
      
      <div className="handoff-card">
        {/* Header */}
        <div className={`handoff-header bg-gradient-to-r ${gradientClass}`}>
          <div className="handoff-icon">
            <Icon className="w-5 h-5" />
          </div>
          <div className="handoff-title-group">
            <h3 className="handoff-title">{title}</h3>
            <span className="handoff-subtitle">for {petName}</span>
          </div>
          <button onClick={onClose} className="handoff-close">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Summary Content */}
        <div className="handoff-content">
          {items.length > 0 && (
            <div className="handoff-items">
              {items.map((item, idx) => (
                <div key={idx} className="handoff-item">
                  <span className="handoff-item-label">{item.label}</span>
                  <span className="handoff-item-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {notes && (
            <div className="handoff-notes">
              <span className="handoff-notes-label">Notes for Concierge®</span>
              <p className="handoff-notes-text">{notes}</p>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="handoff-footer">
          <p className="handoff-footer-text">
            Your Pet Concierge® will review this and get back to you shortly.
          </p>
          
          <div className="handoff-actions">
            <button 
              onClick={onEdit} 
              className="handoff-btn-secondary"
              data-testid="handoff-edit"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            
            <button 
              onClick={onConfirm} 
              className="handoff-btn-primary"
              data-testid="handoff-confirm"
            >
              <Send className="w-4 h-4" />
              <span>Send to Concierge®</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoffSummary;
