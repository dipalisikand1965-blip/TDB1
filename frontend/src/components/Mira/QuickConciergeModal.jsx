/**
 * QuickConciergeModal.jsx
 * ========================
 * Quick confirmation modal for sending Mira's suggestions to Concierge®.
 * 
 * FLOW:
 * 1. Mira suggests something actionable (recipe, service, product)
 * 2. C° button glows golden
 * 3. User clicks C°
 * 4. This modal appears with suggestion context
 * 5. User clicks "Send to Concierge®"
 * 6. Creates ticket via UNIFIED SERVICE FLOW
 * 7. Real concierge sees it in Service Desk
 * 
 * SSOT Reference: /app/memory/SSOT.md - "Quick Send to Concierge®" feature
 */

import React, { useState } from 'react';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
import { X, Send, Users, Sparkles } from 'lucide-react';
import { API_URL } from '../../utils/api';

const QuickConciergeModal = ({ 
  isOpen, 
  onClose, 
  suggestionContext,
  petId,
  petName,
  userId,
  onSuccess 
}) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSendToConcierge = async () => {
    setSending(true);
    setError(null);
    // ── tdc.book ──
    tdc.book({ service: selectedService || message || "concierge request", pillar: "platform", channel: "quick_concierge_modal" });


    try {
      // Create service request via UNIFIED SERVICE FLOW
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'mira_suggestion',
          pillar: suggestionContext?.pillar || 'advisory',
          pet_id: petId,
          pet_name: petName,
          user_id: userId,
          source: 'mira_quick_send',
          details: {
            mira_suggestion: suggestionContext?.summary || suggestionContext?.message || 'Mira suggestion',
            original_message: suggestionContext?.originalMessage,
            suggested_items: suggestionContext?.items || [],
            context_type: suggestionContext?.type || 'general'
          },
          notes: `Mira suggested: ${suggestionContext?.summary || 'See details'}`,
          priority: 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send to Concierge®');
      }

      const data = await response.json();
      setSent(true);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(data);
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSent(false);
      }, 2000);

    } catch (err) {
      console.error('Error sending to concierge:', err);
      setError('Could not send to Concierge®. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="quick-concierge-modal-overlay"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-sm border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-testid="quick-concierge-modal"
      >
        {/* Golden glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          data-testid="quick-concierge-close"
        >
          <X size={16} className="text-white/60" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Users size={20} className="text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Send to Concierge®?</h3>
              <p className="text-xs text-amber-400/80">Our team will assist you</p>
            </div>
          </div>

          {/* Suggestion Preview */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-amber-400/80 uppercase tracking-wide">Mira suggested</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              {suggestionContext?.summary || suggestionContext?.message || 'View Mira\'s suggestion'}
            </p>
            {suggestionContext?.items?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {suggestionContext.items.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    {item.name || item.title || item}
                  </span>
                ))}
                {suggestionContext.items.length > 3 && (
                  <span className="text-xs text-white/40">+{suggestionContext.items.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-white/50 text-xs mb-5 text-center">
            Our Concierge® team will help you find products, arrange delivery, or answer any questions.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              disabled={sending}
              data-testid="quick-concierge-cancel"
            >
              Not now
            </button>
            <button
              onClick={handleSendToConcierge}
              disabled={sending || sent}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                sent 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900'
              }`}
              data-testid="quick-concierge-send"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <span>✓</span>
                  Sent!
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send to Concierge®
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickConciergeModal;
