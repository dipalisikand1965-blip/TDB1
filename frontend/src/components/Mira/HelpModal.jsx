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
  if (!isOpen) return null;
  
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
      </div>
    </div>
  );
};

export default HelpModal;
