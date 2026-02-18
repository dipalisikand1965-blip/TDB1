/**
 * HelpModal - Quick Help Options Modal
 * =====================================
 * Shows help options for order issues and concierge chat
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useState } from 'react';
import { X, Package, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * HelpModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Function} props.onOrderHelp - Called when order help is clicked
 * @param {Function} props.onConciergeChat - Called when concierge chat is clicked
 */
const HelpModal = ({ 
  isOpen, 
  onClose, 
  onOrderHelp,
  onConciergeChat
}) => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  if (!isOpen) return null;
  
  // FAQ data with mental model copy (member-facing)
  const faqs = [
    {
      id: 'replies',
      question: 'Where do I see replies from Concierge?',
      answer: 'You\'ll see them in Services. Every request becomes a tracked thread there, and that\'s where Concierge replies.'
    },
    {
      id: 'chat',
      question: 'What is Chat for, then?',
      answer: 'Chat is where you ask. If it needs action, we open a request and move it into Services so it\'s tracked and handled properly.'
    },
    {
      id: 'notification',
      question: 'I tapped a notification. Where will it take me?',
      answer: 'It opens the exact request thread in Services, so you can see the update and reply in the right place.'
    },
    {
      id: 'reply-notification',
      question: 'Can I reply from the notification itself?',
      answer: 'Not from the bell dropdown. Tap the notification to open the thread in Services, then reply there.'
    },
    {
      id: 'details',
      question: 'I added details in Chat. Will Concierge see it?',
      answer: 'If it\'s about an open request, add it in Services so it lands inside the same thread and nothing gets missed.'
    },
    {
      id: 'badge',
      question: 'What does the badge on Services mean?',
      answer: 'It means there\'s an unread update from Concierge for that pet.'
    }
  ];
  
  const handleOrderHelp = () => {
    onClose();
    if (onOrderHelp) onOrderHelp();
  };
  
  const handleConciergeChat = () => {
    onClose();
    if (onConciergeChat) onConciergeChat();
  };
  
  return (
    <div 
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }} 
      onClick={onClose}
      data-testid="help-modal"
    >
      <div 
        style={{
          background: 'white', borderRadius: '20px', maxWidth: '400px', width: '90%', overflow: 'hidden'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>How can we help?</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <X />
          </button>
        </div>
        
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={handleOrderHelp} 
            style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
              border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
            }}
            data-testid="help-order-btn"
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Order & Delivery</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Track, modify or report issues</p>
            </div>
          </button>
          
          <button 
            onClick={handleConciergeChat} 
            style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
              border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
            }}
            data-testid="help-concierge-btn"
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Chat with Concierge®</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Personal assistance</p>
            </div>
          </button>
        </div>
        
        {/* FAQ Section - Mental Model Copy */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <HelpCircle size={18} style={{ color: '#8b5cf6' }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Quick FAQs</span>
          </div>
          
          {faqs.map((faq) => (
            <div 
              key={faq.id}
              style={{ 
                marginBottom: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
              data-testid={`faq-${faq.id}`}
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: expandedFaq === faq.id ? '#f9fafb' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 13, color: '#1f2937' }}>{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronUp size={16} style={{ color: '#6b7280' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: '#6b7280' }} />
                )}
              </button>
              
              {expandedFaq === faq.id && (
                <div style={{ 
                  padding: '0 12px 12px 12px',
                  background: '#f9fafb',
                  fontSize: 13,
                  color: '#4b5563',
                  lineHeight: 1.5
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
