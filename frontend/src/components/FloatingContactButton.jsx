/**
 * FloatingContactButton.jsx
 * 
 * TDC Floating Contact Widget - "Contact Concierge®"
 * Provides multi-channel communication options:
 * - WhatsApp
 * - Email  
 * - In-App Chat
 * - Phone Call
 * 
 * Shows only for logged-in members.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Mail, X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';
const BUSINESS_EMAIL = process.env.REACT_APP_BUSINESS_EMAIL || 'woof@thedoggybakery.in';

const FloatingContactButton = ({ user, isLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [sending, setSending] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowQuickChat(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WhatsApp handler
  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I'm ${user?.name || 'a member'} and I need assistance.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setIsOpen(false);
  };

  // Email handler
  const openEmail = () => {
    const subject = encodeURIComponent('Support Request - The Doggy Company');
    const body = encodeURIComponent(
      `Hi Concierge Team,\n\nI need assistance with:\n\n[Please describe your request]\n\nBest regards,\n${user?.name || 'Member'}\n${user?.email || ''}`
    );
    window.open(`mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    setIsOpen(false);
  };

  // In-app chat handler
  const openInAppChat = () => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/member?tab=requests');
      return;
    }
    navigate('/member?tab=requests');
    setIsOpen(false);
  };

  // Quick message send
  const sendQuickMessage = async () => {
    if (!quickMessage.trim() || !user?.email) return;
    
    setSending(true);
    try {
      const API = process.env.REACT_APP_BACKEND_URL;
      
      // Start a conversation and send message
      const startRes = await fetch(
        `${API}/api/conversations/start?email=${encodeURIComponent(user.email)}&subject=${encodeURIComponent('Quick Message')}`,
        { method: 'POST' }
      );
      const startData = await startRes.json();
      
      if (startData.conversation_id) {
        await fetch(
          `${API}/api/conversations/${startData.conversation_id}/message?email=${encodeURIComponent(user.email)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: quickMessage.trim(), channel: 'in_app' })
          }
        );
        
        setQuickMessage('');
        setShowQuickChat(false);
        setIsOpen(false);
        navigate('/member?tab=requests');
      }
    } catch (error) {
      console.error('Failed to send quick message:', error);
    } finally {
      setSending(false);
    }
  };

  // Only show for logged-in members
  if (!isLoggedIn) return null;

  return (
    <>
      {/* Desktop Floating Button */}
      <div 
        ref={menuRef}
        className="fixed bottom-6 right-6 z-50 hidden md:block"
        data-testid="floating-contact-btn"
      >
        {/* Expanded Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {showQuickChat ? (
              /* Quick Chat Input */
              <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 w-80">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    Quick Message
                  </h4>
                  <button 
                    onClick={() => setShowQuickChat(false)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <textarea
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  autoFocus
                />
                <button
                  onClick={sendQuickMessage}
                  disabled={!quickMessage.trim() || sending}
                  className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Contact Options */
              <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden w-64">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                  <h4 className="text-white font-semibold">Contact Concierge®</h4>
                  <p className="text-white/80 text-xs">We&apos;re here to help!</p>
                </div>
                
                <div className="p-2">
                  {/* WhatsApp */}
                  <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group"
                    data-testid="contact-whatsapp"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">WhatsApp</p>
                      <p className="text-xs text-gray-500">Chat instantly</p>
                    </div>
                  </button>

                  {/* Email */}
                  <button
                    onClick={openEmail}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                    data-testid="contact-email"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Email</p>
                      <p className="text-xs text-gray-500">Send detailed request</p>
                    </div>
                  </button>

                  {/* In-App Chat */}
                  <button
                    onClick={() => setShowQuickChat(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                    data-testid="contact-inapp"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">In-App Chat</p>
                      <p className="text-xs text-gray-500">Message in dashboard</p>
                    </div>
                  </button>

                  {/* Call */}
                  <button
                    onClick={() => window.open(`tel:+${WHATSAPP_NUMBER}`, '_self')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                    data-testid="contact-call"
                  >
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Call Us</p>
                      <p className="text-xs text-gray-500">Speak directly</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main FAB Button - TDC Paw/Concierge styled */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowQuickChat(false);
          }}
          className={`
            w-14 h-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-300 hover:scale-110
            ${isOpen 
              ? 'bg-gray-800 rotate-90' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/30 hover:shadow-xl'
            }
          `}
          data-testid="floating-contact-toggle"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            /* TDC "C" Logo Style */
            <span className="text-white font-bold text-xl">C<sup className="text-[8px]">®</sup></span>
          )}
        </button>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white" />
        )}
      </div>

      {/* Mobile Floating Button & Sheet */}
      <MobileContactSheet 
        isLoggedIn={isLoggedIn}
        user={user}
        onWhatsApp={openWhatsApp}
        onEmail={openEmail}
        onInAppChat={openInAppChat}
      />
    </>
  );
};

// Mobile Contact Sheet Component
const MobileContactSheet = ({ isLoggedIn, user, onWhatsApp, onEmail, onInAppChat }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const WHATSAPP_NUMBER_LOCAL = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Expanded Contact Sheet */}
      {isExpanded && (
        <div 
          className="md:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            
            <h3 className="text-lg font-bold text-gray-800 mb-1">Contact Concierge®</h3>
            <p className="text-sm text-gray-500 mb-4">Choose how you&apos;d like to reach us</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <button
                onClick={() => { onWhatsApp(); setIsExpanded(false); }}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-800">WhatsApp</span>
              </button>

              {/* Call */}
              <button
                onClick={() => { window.open(`tel:+${WHATSAPP_NUMBER_LOCAL}`, '_self'); setIsExpanded(false); }}
                className="flex flex-col items-center gap-2 p-4 bg-amber-50 rounded-2xl hover:bg-amber-100 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-800">Call</span>
              </button>

              {/* Email */}
              <button
                onClick={() => { onEmail(); setIsExpanded(false); }}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-800">Email</span>
              </button>

              {/* In-App Chat */}
              <button
                onClick={() => { onInAppChat(); setIsExpanded(false); }}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-800">In-App</span>
              </button>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="w-full mt-4 py-3 text-gray-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mobile Floating Button (above bottom nav) */}
      <button
        onClick={() => setIsExpanded(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        data-testid="mobile-contact-btn"
      >
        <span className="text-white font-bold text-lg">C<sup className="text-[6px]">®</sup></span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white" />
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default FloatingContactButton;
