/**
 * InlineConciergeCard - Concierge® Help Card that appears in conversation
 * ======================================================================
 * When user or Mira mentions connecting to concierge, this card appears
 * inline in the chat with WhatsApp, Chat, and Email options.
 * 
 * Same design as the C° button panel but rendered in the conversation.
 */

import React from 'react';
import { Phone, MessageSquare, Mail, Headphones, RefreshCw } from 'lucide-react';
import { API_URL } from '../../utils/api';

/**
 * InlineConciergeCard Component
 * 
 * @param {Object} props
 * @param {Object} props.pet - Pet object { name, breed }
 * @param {Function} props.onChatHandoff - Called when chat option is clicked
 * @param {string} props.context - Optional context about why concierge is being offered
 * @param {Function} props.onNewTopic - Called when New Topic is clicked
 * @param {Object} props.user - User object for service ticket creation
 */
const InlineConciergeCard = ({ 
  pet = { name: 'your pet', breed: '' },
  onChatHandoff,
  context = null,
  onNewTopic,
  user = null
}) => {
  const whatsappMessage = encodeURIComponent(
    `Hi, I need help with ${pet.name}${pet.breed ? ` (${pet.breed})` : ''}.`
  );
  
  // 🎯 UNIVERSAL SERVICE FLOW: Handle WhatsApp click with ticket creation
  const handleWhatsAppClick = async (e) => {
    e.preventDefault();
    
    const messageText = `Hi, I need help with ${pet.name}${pet.breed ? ` (${pet.breed})` : ''}.`;
    
    // Create service ticket BEFORE opening WhatsApp
    try {
      const ticketPayload = {
        type: 'whatsapp_intent',
        pillar: 'mira_chat',
        source: 'inline_concierge_card',
        customer: {
          name: user?.name || 'Guest User',
          email: user?.email || 'guest@thedoggycompany.com',
          phone: user?.phone || '',
          user_id: user?.id || 'anonymous'
        },
        details: {
          message: `[WhatsApp Intent] User clicked WhatsApp from InlineConciergeCard. Message: "${messageText}"${context ? ` Context: ${context}` : ''}`,
          pet_name: pet?.name || 'Not specified',
          channel: 'whatsapp',
          source_component: 'InlineConciergeCard'
        },
        priority: 'medium'
      };
      
      await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });
      console.log('[InlineConciergeCard] Service ticket created for WhatsApp intent');
    } catch (err) {
      console.warn('[InlineConciergeCard] Could not create service ticket:', err);
    }
    
    // Now open WhatsApp
    window.open(`https://wa.me/919663185747?text=${whatsappMessage}`, '_blank');
  };
  
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
      {/* Top Bar with New Topic */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* Left: Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
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
                color: '#F472B6',
                fontWeight: '700',
                fontSize: '15px',
                letterSpacing: '0.5px',
                textShadow: '0 0 10px rgba(244, 114, 182, 0.4)'
              }}
            >
              Pet Concierge®
            </span>
          </div>
        </div>
        
        {/* Right: New Topic Button */}
        {onNewTopic && (
          <button
            onClick={onNewTopic}
            data-testid="inline-concierge-new-topic"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <RefreshCw size={12} /> New Topic
          </button>
        )}
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
        Your <span style={{ color: '#F472B6', fontWeight: '600' }}>Pet Concierge®</span> can help with anything for <strong style={{ color: '#F472B6' }}>{pet.name}</strong>.
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
        <button 
          onClick={handleWhatsAppClick}
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
            boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)',
            border: 'none',
            cursor: 'pointer'
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
        </button>
        
        {/* Chat Button */}
        <button 
          onClick={() => onChatHandoff?.()}
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
