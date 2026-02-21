/**
 * ConciergePanel - Quick Access Concierge Help
 * =============================================
 * Shows quick contact options for the Concierge team
 * 
 * LEARN Integration:
 * - When opened via "Ask Mira" from LEARN, displays pre-filled context
 * - Shows what the user was reading and suggests continuing conversation
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useState, useEffect } from 'react';
import { X, Phone, MessageSquare, Mail, BookOpen, Send } from 'lucide-react';

/**
 * ConciergePanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {Object} props.pet - Pet object { name, breed }
 * @param {Function} props.onChatHandoff - Called when chat option is clicked
 * @param {Object} props.initialContext - Context from LEARN layer (optional)
 */
const ConciergePanel = ({ 
  isOpen, 
  onClose, 
  pet = { name: 'your pet', breed: '' },
  onChatHandoff,
  initialContext = null
}) => {
  const [message, setMessage] = useState('');
  
  // Pre-fill message from LEARN context when panel opens
  useEffect(() => {
    if (isOpen && initialContext?.initialMessage) {
      setMessage(initialContext.initialMessage);
    } else if (isOpen) {
      setMessage('');
    }
  }, [isOpen, initialContext]);
  
  if (!isOpen) return null;
  
  // Build WhatsApp message with context
  const whatsappMessage = encodeURIComponent(
    initialContext?.initialMessage 
      ? initialContext.initialMessage
      : `Hi, I need help with ${pet.name}${pet.breed ? ` (${pet.breed})` : ''}.`
  );
  
  // Handle chat with context
  const handleChatWithContext = () => {
    if (onChatHandoff) {
      onChatHandoff({
        message: message || initialContext?.initialMessage,
        context: initialContext
      });
    }
  };
  
  // Check if coming from LEARN layer
  const hasLearnContext = initialContext?.source === 'learn' && initialContext?.learn_item;
  
  return (
    <div className="mp-concierge-panel" data-testid="concierge-panel" style={{
      maxWidth: hasLearnContext ? '400px' : undefined
    }}>
      <div className="mp-concierge-panel-header">
        <span>
          <span className="panel-c">C</span>
          <span className="panel-degree">°</span> Concierge Help
        </span>
        <button onClick={onClose} data-testid="concierge-close">
          <X size={16} />
        </button>
      </div>
      
      {/* LEARN Context Banner - Shows what user was reading */}
      {hasLearnContext && (
        <div 
          className="learn-context-banner"
          data-testid="concierge-learn-context"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            padding: '10px 12px',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <BookOpen size={16} style={{ color: '#a78bfa', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#a78bfa', 
              margin: '0 0 4px 0',
              fontWeight: 500
            }}>
              You were reading:
            </p>
            <p style={{ 
              fontSize: '13px', 
              color: 'white', 
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {initialContext.learn_item?.title || 'Guide'}
            </p>
          </div>
        </div>
      )}
      
      {/* Pre-filled message input when coming from LEARN */}
      {hasLearnContext && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.6)', 
            marginBottom: '6px',
            display: 'block'
          }}>
            Your message (you can edit):
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like help with?"
              data-testid="concierge-message-input"
              style={{
                width: '100%',
                minHeight: '80px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}
      
      <p className="mp-concierge-panel-desc">
        {hasLearnContext 
          ? `Your pet Concierge® will help with ${pet.name}'s needs based on what you've read.`
          : `Your pet Concierge® can help with anything for ${pet.name}.`
        }
      </p>
      
      <div className="mp-concierge-panel-options">
        <a 
          href={`https://wa.me/919663185747?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="concierge-panel-opt whatsapp"
          data-testid="concierge-whatsapp"
        >
          <Phone size={16} /> WhatsApp
        </a>
        
        <button 
          onClick={handleChatWithContext} 
          className="concierge-panel-opt chat"
          data-testid="concierge-chat"
          style={hasLearnContext ? {
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            borderColor: 'transparent'
          } : undefined}
        >
          <MessageSquare size={16} /> 
          {hasLearnContext ? 'Start Chat' : 'Chat'}
        </button>
        
        <a 
          href={`mailto:concierge@thedoggycompany.in?subject=Help with ${pet.name}${hasLearnContext ? ` - ${initialContext.learn_item?.title}` : ''}&body=${encodeURIComponent(message || '')}`}
          className="concierge-panel-opt email"
          data-testid="concierge-email"
        >
          <Mail size={16} /> Email
        </a>
      </div>
    </div>
  );
};

export default ConciergePanel;
