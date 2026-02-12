/**
 * InlineConciergeCard - Concierge Help Card that appears in conversation
 * ======================================================================
 * When user or Mira mentions connecting to concierge, this card appears
 * inline in the chat with WhatsApp, Chat, and Email options.
 * 
 * Same design as the C° button panel but rendered in the conversation.
 */

import React from 'react';
import { Phone, MessageSquare, Mail, Headphones } from 'lucide-react';

/**
 * InlineConciergeCard Component
 * 
 * @param {Object} props
 * @param {Object} props.pet - Pet object { name, breed }
 * @param {Function} props.onChatHandoff - Called when chat option is clicked
 * @param {string} props.context - Optional context about why concierge is being offered
 */
const InlineConciergeCard = ({ 
  pet = { name: 'your pet', breed: '' },
  onChatHandoff,
  context = null
}) => {
  const whatsappMessage = encodeURIComponent(
    `Hi, I need help with ${pet.name}${pet.breed ? ` (${pet.breed})` : ''}.`
  );
  
  return (
    <div 
      className="inline-concierge-card"
      data-testid="inline-concierge-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(45, 25, 70, 0.95) 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
      }}
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        <div 
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Headphones size={16} color="white" />
        </div>
        <div>
          <span 
            style={{ 
              color: '#10B981',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '0.5px'
            }}
          >
            C° 
          </span>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
            Concierge Help
          </span>
        </div>
      </div>
      
      {/* Description */}
      <p 
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '14px',
          marginBottom: '16px',
          lineHeight: '1.5'
        }}
      >
        Your pet Concierge® can help with anything for <strong style={{ color: '#F472B6' }}>{pet.name}</strong>.
        {context && (
          <span style={{ display: 'block', marginTop: '8px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
            {context}
          </span>
        )}
      </p>
      
      {/* Contact Options */}
      <div 
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        {/* WhatsApp Button */}
        <a 
          href={`https://wa.me/919663185747?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="inline-concierge-whatsapp"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(37, 211, 102, 0.3)';
          }}
        >
          <Phone size={16} /> WhatsApp
        </a>
        
        {/* Chat Button */}
        <button 
          onClick={onChatHandoff}
          data-testid="inline-concierge-chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.3)';
          }}
        >
          <MessageSquare size={16} /> Chat
        </button>
        
        {/* Email Button */}
        <a 
          href={`mailto:concierge@thedoggycompany.in?subject=Help with ${pet.name}`}
          data-testid="inline-concierge-email"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(59, 130, 246, 0.3)';
          }}
        >
          <Mail size={16} /> Email
        </a>
      </div>
    </div>
  );
};

export default InlineConciergeCard;
