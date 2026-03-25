/**
 * TIP CARD VAULT - Non-Product Advisory Flow
 * ============================================
 * "Mira is the Brain, Concierge® is the Hands"
 * 
 * Same plumbing as Picks, but for ADVICE:
 * - Meal plans
 * - Travel checklists
 * - Grooming routines
 * - Training guides
 * - Health advice
 */

import React, { useState, useCallback } from 'react';
import { 
  Check, X, Send, FileText, 
  UtensilsCrossed, Plane, Sparkles, GraduationCap,
  Heart, Dumbbell, ClipboardCheck, Lightbulb
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './TipCardVault.css';

// Use centralized haptic utility for iOS + Android support
const haptic = {
  light: () => hapticFeedback.buttonTap(),
  success: () => hapticFeedback.success()
};

// Icon mapping
const CARD_TYPE_ICONS = {
  meal_plan: UtensilsCrossed,
  travel_tips: Plane,
  grooming_routine: Sparkles,
  training_tips: GraduationCap,
  health_advice: Heart,
  exercise_routine: Dumbbell,
  checklist: ClipboardCheck,
  guide: FileText,
  general: Lightbulb
};

const CARD_TYPE_COLORS = {
  meal_plan: '#f97316',
  travel_tips: '#3b82f6',
  grooming_routine: '#ec4899',
  training_tips: '#8b5cf6',
  health_advice: '#ef4444',
  exercise_routine: '#22c55e',
  checklist: '#14b8a6',
  guide: '#6366f1',
  general: '#a855f7'
};

const TipCardVault = ({
  tipCard,
  pet = {},
  pillar = 'general',
  conversationContext = '',
  onSendToConcierge,
  onClose,
  onRequestFormal
}) => {
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestFormal, setRequestFormal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const cardType = tipCard?.type || 'general';
  const IconComponent = CARD_TYPE_ICONS[cardType] || Lightbulb;
  const cardColor = CARD_TYPE_COLORS[cardType] || '#a855f7';

  // Toggle formal request
  const toggleFormalRequest = useCallback(() => {
    haptic.light();
    setRequestFormal(prev => !prev);
  }, []);

  // Send to Concierge®
  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          card_type: cardType,
          card_title: tipCard?.title,
          card_content: tipCard?.content,
          conversation_context: conversationContext,
          request_formal_version: requestFormal,
          additional_notes: additionalNotes || undefined,
          pet,
          pillar
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send tip card:', error);
    } finally {
      setIsSending(false);
    }
  }, [tipCard, cardType, conversationContext, requestFormal, additionalNotes, pet, pillar, onSendToConcierge]);

  // Close
  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  // Confirmation view
  if (showConfirmation) {
    return (
      <div className="tcv-container" data-testid="tip-card-confirmation">
        <div className="tcv-confirmation">
          <div className="tcv-confirmation-icon" style={{ background: cardColor }}>
            <Check size={48} />
          </div>
          <h2>Sent to Concierge®</h2>
          <p>Your Pet Concierge® will get back to you shortly</p>
          {requestFormal && (
            <div className="tcv-confirmation-formal">
              <FileText size={16} />
              <span>Formal version requested</span>
            </div>
          )}
          <div className="tcv-confirmation-actions">
            <button 
              className="tcv-btn tcv-btn-primary"
              onClick={handleClose}
              data-testid="tip-card-continue"
            >
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tcv-container" data-testid="tip-card-vault">
      {/* Header */}
      <div className="tcv-header">
        <div className="tcv-header-left">
          <div className="tcv-icon-badge" style={{ background: cardColor }}>
            <IconComponent size={24} />
          </div>
          <div className="tcv-header-text">
            <h2>{tipCard?.title || 'Mira\'s Advice'}</h2>
            <p>For {pet?.name || 'Your Pet'}</p>
          </div>
        </div>
        <button 
          className="tcv-close-btn"
          onClick={handleClose}
          aria-label="Close"
          data-testid="tip-card-close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Card Content */}
      <div className="tcv-content">
        <div className="tcv-card" style={{ borderColor: `${cardColor}40` }}>
          <div className="tcv-card-header" style={{ background: `${cardColor}15` }}>
            <IconComponent size={20} style={{ color: cardColor }} />
            <span style={{ color: cardColor }}>
              {cardType.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="tcv-card-body">
            <p>{tipCard?.content}</p>
          </div>
        </div>

        {/* Formal Request Option */}
        <div className="tcv-formal-option">
          <button
            className={`tcv-formal-toggle ${requestFormal ? 'tcv-formal-active' : ''}`}
            onClick={toggleFormalRequest}
            data-testid="tip-card-formal-toggle"
          >
            <div className={`tcv-checkbox ${requestFormal ? 'tcv-checked' : ''}`}>
              {requestFormal && <Check size={14} />}
            </div>
            <div className="tcv-formal-text">
              <span className="tcv-formal-title">Request formal version</span>
              <span className="tcv-formal-desc">
                Your Concierge® will create an official document
              </span>
            </div>
          </button>
        </div>

        {/* Additional Notes */}
        {requestFormal && (
          <div className="tcv-notes">
            <label htmlFor="additional-notes">Add notes for your Concierge® (optional)</label>
            <textarea
              id="additional-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific requirements or preferences..."
              maxLength={500}
              data-testid="tip-card-notes"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tcv-footer">
        <div className="tcv-footer-message">
          <span className="tcv-concierge-icon">C°</span>
          <div className="tcv-footer-text">
            <span className="tcv-footer-title">Your Concierge® is by your side</span>
            <span className="tcv-footer-subtitle">
              They'll review this and help bring it to life for {pet?.name || 'your pet'}.
            </span>
          </div>
        </div>

        <button
          className="tcv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="tip-card-send"
        >
          {isSending ? (
            <span>Sending...</span>
          ) : (
            <>
              <Send size={20} />
              <span>Send to Concierge®</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TipCardVault;
