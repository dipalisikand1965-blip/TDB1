/**
 * MiraTopBar - Unified Top Navigation Bar
 * =======================================
 * Consolidates all quick actions into a clean, unified top bar:
 * - Pet photo + Soul score
 * - Picks (personalized for pet)
 * - Past Chats
 * - Reminders (consolidated)
 * - Insights
 * - Contact (WhatsApp/Email/Call)
 * - Refresh Chat
 * - Dashboard link
 * 
 * Works on desktop (horizontal) and mobile (scrollable/compact)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Gift, History, Bell, Lightbulb, RefreshCw, 
  LayoutDashboard, MessageCircle, Phone, Mail, X,
  ChevronDown, ChevronUp, Sparkles, Heart, Play, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Haptic feedback utility
const hapticFeedback = {
  light: () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  },
  medium: () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
  }
};

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';
const BUSINESS_EMAIL = process.env.REACT_APP_BUSINESS_EMAIL || 'woof@thedoggybakery.in';

const MiraTopBar = ({
  pet,
  soulScore = 0,
  userCity = 'Mumbai',
  onOpenPicks,
  onOpenPastChats,
  onOpenInsights,
  onRefreshChat,
  onOpenSoul,
  onOpenLearn,
  reminders = [],
  onDismissReminder,
  onReminderAction,
  hasNewVideos = false,
  newVideosCount = 0,
  userName = '',
  userEmail = '',
  isLoggedIn = false
}) => {
  const navigate = useNavigate();
  const [showReminders, setShowReminders] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const remindersRef = useRef(null);
  const contactRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (remindersRef.current && !remindersRef.current.contains(e.target)) {
        setShowReminders(false);
      }
      if (contactRef.current && !contactRef.current.contains(e.target)) {
        setShowContact(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Contact handlers
  const openWhatsApp = () => {
    hapticFeedback.medium();
    const message = encodeURIComponent(
      `Hi! I'm ${userName || 'a member'} and I need assistance for ${pet?.name || 'my pet'}.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setShowContact(false);
  };

  const openEmail = () => {
    hapticFeedback.medium();
    const subject = encodeURIComponent(`Support Request - ${pet?.name || 'Pet Care'}`);
    const body = encodeURIComponent(
      `Hi Concierge Team,\n\nI need assistance with:\n\n[Please describe your request]\n\nPet: ${pet?.name || 'N/A'}\n\nBest regards,\n${userName || 'Member'}\n${userEmail || ''}`
    );
    window.open(`mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    setShowContact(false);
  };

  const openPhone = () => {
    hapticFeedback.medium();
    window.open(`tel:+${WHATSAPP_NUMBER}`, '_self');
    setShowContact(false);
  };

  // Count urgent reminders
  const urgentCount = reminders.filter(r => r.days_until < 0 || r.priority === 'urgent').length;
  const totalReminders = reminders.length;

  return (
    <div className="mira-top-bar" data-testid="mira-top-bar">
      {/* Row 1: Pet Photo + Soul Score + Location */}
      <div className="mtb-pet-row">
        {/* Pet Avatar with Soul Score Ring */}
        <div 
          className="mtb-pet-avatar-wrap"
          onClick={() => {
            hapticFeedback.light();
            onOpenSoul?.();
          }}
          data-testid="pet-soul-btn"
        >
          <div 
            className="mtb-pet-avatar"
            style={{
              background: `conic-gradient(
                from 0deg,
                #f59e0b ${soulScore * 3.6}deg,
                rgba(255,255,255,0.1) ${soulScore * 3.6}deg
              )`
            }}
          >
            <div className="mtb-pet-photo">
              {pet?.image_url || pet?.photo_url ? (
                <img 
                  src={pet.image_url || pet.photo_url} 
                  alt={pet?.name || 'Pet'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">{pet?.name?.[0] || '🐕'}</span>
              )}
            </div>
          </div>
          <div className="mtb-soul-score">
            <Heart size={10} className="text-amber-400" />
            <span>{Math.round(soulScore)}%</span>
          </div>
        </div>

        {/* Pet Name + Location */}
        <div className="mtb-pet-info">
          <span className="mtb-pet-name">{pet?.name || 'Your Pet'}</span>
          <span className="mtb-location">{userCity}</span>
        </div>

        {/* Dashboard Button */}
        <button
          className="mtb-dashboard-btn"
          onClick={() => {
            hapticFeedback.light();
            navigate('/dashboard');
          }}
          data-testid="dashboard-btn"
          title={`${pet?.name || 'Pet'}'s Dashboard`}
        >
          <LayoutDashboard size={16} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>

      {/* Row 2: Action Buttons */}
      <div className="mtb-actions-row">
        {/* Personalized Picks */}
        <button
          className="mtb-action-btn mtb-picks-btn"
          onClick={() => {
            hapticFeedback.medium();
            onOpenPicks?.();
          }}
          data-testid="picks-btn"
        >
          <Gift size={16} />
          <span>{pet?.name ? `${pet.name}'s Picks` : 'Picks'}</span>
        </button>

        {/* Past Chats */}
        <button
          className="mtb-action-btn"
          onClick={() => {
            hapticFeedback.light();
            onOpenPastChats?.();
          }}
          data-testid="past-chats-btn"
        >
          <History size={16} />
          <span>History</span>
        </button>

        {/* Reminders - Dropdown */}
        <div className="relative" ref={remindersRef}>
          <button
            className={`mtb-action-btn ${showReminders ? 'active' : ''} ${urgentCount > 0 ? 'has-urgent' : ''}`}
            onClick={() => {
              hapticFeedback.light();
              setShowReminders(!showReminders);
            }}
            data-testid="reminders-btn"
          >
            <Bell size={16} />
            <span>Reminders</span>
            {totalReminders > 0 && (
              <span className={`mtb-badge ${urgentCount > 0 ? 'urgent' : ''}`}>
                {totalReminders}
              </span>
            )}
            {showReminders ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Reminders Dropdown */}
          {showReminders && (
            <div className="mtb-dropdown reminders-dropdown" data-testid="reminders-dropdown">
              {reminders.length === 0 ? (
                <div className="mtb-dropdown-empty">
                  <Bell size={20} className="opacity-40" />
                  <p>No reminders for {pet?.name || 'now'}</p>
                </div>
              ) : (
                <div className="mtb-reminders-list">
                  {reminders.map((reminder, idx) => (
                    <div 
                      key={reminder.id || idx}
                      className={`mtb-reminder-item ${reminder.days_until < 0 ? 'overdue' : ''}`}
                    >
                      <div className="mtb-reminder-content">
                        <h4>{reminder.title}</h4>
                        <p>{reminder.message}</p>
                        {reminder.days_until !== undefined && (
                          <span className="mtb-reminder-time">
                            {reminder.days_until === 0 
                              ? 'Today' 
                              : reminder.days_until < 0 
                                ? `${Math.abs(reminder.days_until)} days overdue`
                                : `In ${reminder.days_until} days`
                            }
                          </span>
                        )}
                      </div>
                      <button
                        className="mtb-reminder-dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          hapticFeedback.light();
                          onDismissReminder?.(reminder.id);
                        }}
                        data-testid={`dismiss-reminder-${reminder.id}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        <button
          className="mtb-action-btn"
          onClick={() => {
            hapticFeedback.light();
            onOpenInsights?.();
          }}
          data-testid="insights-btn"
        >
          <Lightbulb size={16} />
          <span>Insights</span>
        </button>

        {/* Soul - Quick Questions */}
        <button
          className="mtb-action-btn"
          onClick={() => {
            hapticFeedback.light();
            onOpenSoul?.();
          }}
          data-testid="soul-btn"
        >
          <Heart size={16} />
          <span>Soul</span>
        </button>

        {/* Learn - Videos */}
        <button
          className={`mtb-action-btn ${hasNewVideos ? 'has-new' : ''}`}
          onClick={() => {
            hapticFeedback.light();
            onOpenLearn?.();
          }}
          data-testid="learn-btn"
        >
          <Play size={16} />
          <span>Learn</span>
          {hasNewVideos && newVideosCount > 0 && (
            <span className="mtb-badge new">{newVideosCount}</span>
          )}
        </button>

        {/* Contact - Dropdown (replaces Concierge) */}
        <div className="relative" ref={contactRef}>
          <button
            className={`mtb-action-btn mtb-contact-btn ${showContact ? 'active' : ''}`}
            onClick={() => {
              hapticFeedback.light();
              setShowContact(!showContact);
            }}
            data-testid="contact-btn"
          >
            <MessageCircle size={16} />
            <span>Contact</span>
            {showContact ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Contact Dropdown */}
          {showContact && (
            <div className="mtb-dropdown contact-dropdown" data-testid="contact-dropdown">
              <button 
                className="mtb-contact-option whatsapp"
                onClick={openWhatsApp}
              >
                <div className="mtb-contact-icon whatsapp">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="mtb-contact-text">
                  <span>WhatsApp</span>
                  <small>Quick chat with us</small>
                </div>
              </button>
              
              <button 
                className="mtb-contact-option email"
                onClick={openEmail}
              >
                <div className="mtb-contact-icon email">
                  <Mail size={20} />
                </div>
                <div className="mtb-contact-text">
                  <span>Email</span>
                  <small>Send us a message</small>
                </div>
              </button>
              
              <button 
                className="mtb-contact-option phone"
                onClick={openPhone}
              >
                <div className="mtb-contact-icon phone">
                  <Phone size={20} />
                </div>
                <div className="mtb-contact-text">
                  <span>Call</span>
                  <small>Talk to concierge</small>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Chat */}
        <button
          className="mtb-action-btn mtb-refresh-btn"
          onClick={() => {
            hapticFeedback.medium();
            onRefreshChat?.();
          }}
          data-testid="refresh-chat-btn"
          title="New Chat"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .mira-top-bar {
          padding: 12px 16px;
          background: rgba(15, 7, 32, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        /* Row 1: Pet Info */
        .mtb-pet-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .mtb-pet-avatar-wrap {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .mtb-pet-avatar-wrap:hover {
          transform: scale(1.05);
        }
        .mtb-pet-avatar-wrap:active {
          transform: scale(0.95);
        }

        .mtb-pet-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          padding: 3px;
          transition: all 0.3s;
        }

        .mtb-pet-photo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a0f35, #2d1b50);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
          font-weight: 600;
        }

        .mtb-soul-score {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(15, 7, 32, 0.95);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .mtb-pet-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .mtb-pet-name {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .mtb-location {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .mtb-dashboard-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(255,255,255,0.8);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mtb-dashboard-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .mtb-dashboard-btn:active {
          transform: scale(0.95);
        }

        /* Row 2: Actions */
        .mtb-actions-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 4px;
        }
        .mtb-actions-row::-webkit-scrollbar {
          display: none;
        }

        .mtb-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .mtb-action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.15);
        }
        .mtb-action-btn:active {
          transform: scale(0.95);
        }
        .mtb-action-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
          color: #a78bfa;
        }

        /* Picks button - highlighted */
        .mtb-picks-btn {
          background: linear-gradient(135deg, rgba(233, 30, 154, 0.15), rgba(139, 92, 246, 0.15));
          border-color: rgba(233, 30, 154, 0.3);
          color: #f9a8d4;
        }
        .mtb-picks-btn:hover {
          background: linear-gradient(135deg, rgba(233, 30, 154, 0.25), rgba(139, 92, 246, 0.25));
          border-color: rgba(233, 30, 154, 0.5);
        }

        /* Refresh button */
        .mtb-refresh-btn {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15));
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }
        .mtb-refresh-btn:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.25));
        }

        /* Badges */
        .mtb-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: rgba(139, 92, 246, 0.8);
          border-radius: 9px;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }
        .mtb-badge.urgent {
          background: linear-gradient(135deg, #ef4444, #f97316);
          animation: pulse 2s infinite;
        }
        .mtb-badge.new {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
        }

        .mtb-action-btn.has-urgent {
          border-color: rgba(239, 68, 68, 0.4);
        }
        .mtb-action-btn.has-new {
          border-color: rgba(245, 158, 11, 0.4);
        }

        /* Dropdown */
        .mtb-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          min-width: 280px;
          background: rgba(26, 15, 53, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          overflow: hidden;
          animation: dropdownSlide 0.2s ease-out;
          z-index: 50;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mtb-dropdown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: rgba(255,255,255,0.5);
          text-align: center;
          gap: 8px;
        }

        /* Reminders List */
        .mtb-reminders-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .mtb-reminder-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: background 0.2s;
        }
        .mtb-reminder-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .mtb-reminder-item:last-child {
          border-bottom: none;
        }
        .mtb-reminder-item.overdue {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
        }

        .mtb-reminder-content {
          flex: 1;
        }
        .mtb-reminder-content h4 {
          font-size: 13px;
          font-weight: 600;
          color: white;
          margin-bottom: 2px;
        }
        .mtb-reminder-content p {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          line-height: 1.4;
        }
        .mtb-reminder-time {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          margin-top: 4px;
          display: block;
        }
        .mtb-reminder-item.overdue .mtb-reminder-time {
          color: #f87171;
        }

        .mtb-reminder-dismiss {
          padding: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .mtb-reminder-dismiss:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Contact Options */
        .contact-dropdown {
          padding: 8px;
        }

        .mtb-contact-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mtb-contact-option:hover {
          background: rgba(255,255,255,0.05);
        }
        .mtb-contact-option:active {
          transform: scale(0.98);
        }

        .mtb-contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .mtb-contact-icon.whatsapp {
          background: linear-gradient(135deg, #25D366, #128C7E);
        }
        .mtb-contact-icon.email {
          background: linear-gradient(135deg, #e91e9a, #8b5cf6);
        }
        .mtb-contact-icon.phone {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .mtb-contact-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .mtb-contact-text span {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .mtb-contact-text small {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .mira-top-bar {
            padding: 10px 12px;
          }
          
          .mtb-pet-row {
            margin-bottom: 10px;
            padding-bottom: 10px;
          }

          .mtb-pet-avatar {
            width: 40px;
            height: 40px;
          }

          .mtb-pet-name {
            font-size: 14px;
          }

          .mtb-action-btn {
            padding: 6px 10px;
            font-size: 11px;
          }

          .mtb-action-btn span {
            display: none;
          }
          
          .mtb-picks-btn span,
          .mtb-refresh-btn span {
            display: inline;
          }

          .mtb-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            margin: 0;
            border-radius: 20px 20px 0 0;
            min-width: 100%;
            max-height: 70vh;
          }
        }

        /* iOS safe area */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          @media (max-width: 640px) {
            .mtb-dropdown {
              padding-bottom: env(safe-area-inset-bottom);
            }
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default MiraTopBar;
