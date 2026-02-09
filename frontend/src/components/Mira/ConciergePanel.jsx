/**
 * ConciergePanel - Quick Access Concierge Help
 * =============================================
 * Shows quick contact options for the Concierge team
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { X, Phone, MessageSquare, Mail } from 'lucide-react';

/**
 * ConciergePanel Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {Function} props.onClose - Called when panel is closed
 * @param {Object} props.pet - Pet object { name, breed }
 * @param {Function} props.onChatHandoff - Called when chat option is clicked
 */
const ConciergePanel = ({ 
  isOpen, 
  onClose, 
  pet = { name: 'your pet', breed: '' },
  onChatHandoff
}) => {
  if (!isOpen) return null;
  
  const whatsappMessage = encodeURIComponent(
    `Hi, I need help with ${pet.name}${pet.breed ? ` (${pet.breed})` : ''}.`
  );
  
  return (
    <div className="mp-concierge-panel" data-testid="concierge-panel">
      <div className="mp-concierge-panel-header">
        <span>
          <span className="panel-c">C</span>
          <span className="panel-degree">°</span> Concierge Help
        </span>
        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      
      <p className="mp-concierge-panel-desc">
        Your pet Concierge® can help with anything for {pet.name}.
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
          onClick={onChatHandoff} 
          className="concierge-panel-opt chat"
          data-testid="concierge-chat"
        >
          <MessageSquare size={16} /> Chat
        </button>
        
        <a 
          href={`mailto:concierge@thedoggycompany.in?subject=Help with ${pet.name}`}
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
