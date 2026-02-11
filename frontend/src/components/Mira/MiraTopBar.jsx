/**
 * MiraTopBar - Unified Top Navigation Bar v2
 * ==========================================
 * Redesigned based on user feedback:
 * - Mojo as the central hero with Soul Orb
 * - Weather + Location in header
 * - Logical tab order
 * - Concierge® branding (not "Contact")
 * - Working Reminders dropdown
 * - No duplicates
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Gift, History, Bell, Lightbulb, RefreshCw, 
  LayoutDashboard, Phone, Mail, X,
  ChevronDown, ChevronUp, Heart, Play,
  Cloud, Sun, CloudRain, Thermometer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hapticFeedback from '../../utils/haptic';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';
const BUSINESS_EMAIL = process.env.REACT_APP_BUSINESS_EMAIL || 'woof@thedoggybakery.in';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MiraTopBar = ({
  pet,
  allPets = [],
  onSwitchPet,
  soulScore = 0,
  userCity = 'Mumbai',
  weather = null, // { temp: 26, condition: 'sunny' }
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
  const [showConcierge, setShowConcierge] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const remindersRef = useRef(null);
  const petSelectorRef = useRef(null);
  const conciergeRef = useRef(null);
  const remindersBtnRef = useRef(null);
  const conciergeBtnRef = useRef(null);

  // Calculate dropdown position when opening
  const openReminders = (e) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback.light();
    
    if (remindersBtnRef.current) {
      const rect = remindersBtnRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 300;
      
      // Position dropdown centered under button, but constrain to viewport
      let leftPos = rect.left + rect.width / 2;
      
      // Ensure dropdown stays within viewport with 16px padding
      const minLeft = dropdownWidth / 2 + 16;
      const maxLeft = viewportWidth - dropdownWidth / 2 - 16;
      leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));
      
      setDropdownPos({
        top: rect.bottom + 8,
        left: leftPos
      });
    }
    setShowReminders(!showReminders);
    setShowConcierge(false);
  };

  const openConcierge = (e) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback.light();
    
    if (conciergeBtnRef.current) {
      const rect = conciergeBtnRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 300;
      
      let leftPos = rect.left + rect.width / 2;
      
      const minLeft = dropdownWidth / 2 + 16;
      const maxLeft = viewportWidth - dropdownWidth / 2 - 16;
      leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));
      
      setDropdownPos({
        top: rect.bottom + 8,
        left: leftPos
      });
    }
    setShowConcierge(!showConcierge);
    setShowReminders(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (remindersRef.current && !remindersRef.current.contains(e.target)) {
        setShowReminders(false);
      }
      if (conciergeRef.current && !conciergeRef.current.contains(e.target)) {
        setShowConcierge(false);
      }
      if (petSelectorRef.current && !petSelectorRef.current.contains(e.target)) {
        setShowPetSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Concierge handlers
  const openWhatsApp = () => {
    hapticFeedback.medium();
    const message = encodeURIComponent(
      `Hi! I'm ${userName || 'a member'} and I need assistance for ${pet?.name || 'my pet'}.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setShowConcierge(false);
  };

  const openEmail = () => {
    hapticFeedback.medium();
    const subject = encodeURIComponent(`Support Request - ${pet?.name || 'Pet Care'}`);
    const body = encodeURIComponent(
      `Hi Concierge Team,\n\nI need assistance with:\n\n[Please describe your request]\n\nPet: ${pet?.name || 'N/A'}\n\nBest regards,\n${userName || 'Member'}\n${userEmail || ''}`
    );
    window.open(`mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    setShowConcierge(false);
  };

  const openChat = () => {
    hapticFeedback.medium();
    // This could open an in-app chat or redirect
    setShowConcierge(false);
  };

  // Count urgent reminders
  const urgentCount = reminders.filter(r => r.days_until < 0 || r.priority === 'urgent').length;
  const totalReminders = reminders.length;

  // Weather icon based on condition
  const getWeatherIcon = () => {
    if (!weather) return <Sun size={14} className="text-amber-400" />;
    const condition = weather.condition?.toLowerCase() || '';
    if (condition.includes('rain')) return <CloudRain size={14} className="text-blue-400" />;
    if (condition.includes('cloud')) return <Cloud size={14} className="text-gray-400" />;
    return <Sun size={14} className="text-amber-400" />;
  };

  return (
    <div className="mira-top-bar-v2" data-testid="mira-top-bar">
      {/* Row 1: Location + Weather + Dashboard */}
      <div className="mtb-header-row">
        <div className="mtb-location-weather">
          <span className="mtb-city">{userCity}</span>
          <div className="mtb-weather">
            {getWeatherIcon()}
            <span>{weather?.temp || '--'}°C</span>
          </div>
        </div>
        <button
          className="mtb-dashboard-btn"
          onClick={() => {
            hapticFeedback.light();
            navigate('/dashboard');
          }}
          data-testid="dashboard-btn"
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Row 2: MOJO - The Hero with Soul Orb */}
      <div className="mtb-hero-row">
        <div 
          className="mtb-soul-orb"
          onClick={() => {
            hapticFeedback.medium();
            onOpenSoul?.();
          }}
          data-testid="soul-orb"
        >
          {/* Animated rings */}
          <div className="mtb-orb-ring mtb-orb-ring-1" />
          <div className="mtb-orb-ring mtb-orb-ring-2" />
          <div className="mtb-orb-ring mtb-orb-ring-3" />
          
          {/* Soul score circle */}
          <svg className="mtb-orb-progress" viewBox="0 0 100 100">
            <circle
              className="mtb-orb-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="mtb-orb-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="4"
              strokeDasharray={`${soulScore * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Pet photo in center */}
          <div className="mtb-pet-photo">
            {(pet?.image_url || pet?.photo_url || pet?.photo) ? (
              <img 
                src={
                  (pet.image_url || pet.photo_url || pet.photo)?.startsWith('http') 
                    ? (pet.image_url || pet.photo_url || pet.photo)
                    : `${API_URL}${pet.image_url || pet.photo_url || pet.photo}`
                } 
                alt={pet?.name || 'Pet'}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                }}
              />
            ) : null}
            <span 
              className="mtb-pet-initial" 
              style={{ display: (pet?.image_url || pet?.photo_url || pet?.photo) ? 'none' : 'flex' }}
            >
              {pet?.name?.[0] || '🐕'}
            </span>
          </div>
          
          {/* Soul score label */}
          <div className="mtb-soul-label">
            <Heart size={10} className="text-amber-400" />
            <span>{Math.round(soulScore)}% Soul</span>
          </div>
        </div>
        
        {/* Pet name */}
        <h2 className="mtb-pet-name">{pet?.name || 'Your Pet'}</h2>
        <p className="mtb-pet-tagline">Mira knows {pet?.name || 'your pet'}</p>
        
        {/* Multi-Pet Selector */}
        {allPets.length > 1 && (
          <div className="mtb-pet-selector" ref={petSelectorRef}>
            <button
              className="mtb-pet-switch-btn"
              onClick={() => {
                hapticFeedback.light();
                setShowPetSelector(!showPetSelector);
              }}
              data-testid="pet-selector-btn"
            >
              <span>Switch Pet</span>
              {showPetSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showPetSelector && (
              <div className="mtb-pet-dropdown" data-testid="pet-selector-dropdown">
                {allPets.map((p) => (
                  <button
                    key={p.id}
                    className={`mtb-pet-option ${p.id === pet?.id ? 'active' : ''}`}
                    onClick={() => {
                      hapticFeedback.medium();
                      onSwitchPet?.(p);
                      setShowPetSelector(false);
                    }}
                    data-testid={`pet-option-${p.id}`}
                  >
                    <div className="mtb-pet-option-avatar">
                      {(p.image_url || p.photo_url || p.photo) ? (
                        <img 
                          src={
                            (p.image_url || p.photo_url || p.photo)?.startsWith('http') 
                              ? (p.image_url || p.photo_url || p.photo)
                              : `${API_URL}${p.image_url || p.photo_url || p.photo}`
                          }
                          alt={p.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span>{p.name?.[0] || '🐕'}</span>
                      )}
                    </div>
                    <div className="mtb-pet-option-info">
                      <span className="mtb-pet-option-name">{p.name}</span>
                      <span className="mtb-pet-option-breed">{p.breed || 'Pet'}</span>
                    </div>
                    {p.id === pet?.id && <span className="mtb-pet-option-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Action Tabs - Logical Order */}
      <div className="mtb-actions-row">
        {/* Picks - Primary action */}
        <button
          className="mtb-tab mtb-tab-picks"
          onClick={() => {
            hapticFeedback.medium();
            onOpenPicks?.();
          }}
          data-testid="picks-btn"
        >
          <Gift size={16} />
          <span>{pet?.name}'s Picks</span>
        </button>

        {/* History */}
        <button
          className="mtb-tab"
          onClick={() => {
            hapticFeedback.light();
            onOpenPastChats?.();
          }}
          data-testid="history-btn"
        >
          <History size={16} />
          <span>History</span>
        </button>

        {/* Reminders - Dropdown */}
        <div className="mtb-dropdown-wrap" ref={remindersRef}>
          <button
            ref={remindersBtnRef}
            className={`mtb-tab ${showReminders ? 'active' : ''} ${urgentCount > 0 ? 'has-urgent' : ''}`}
            onClick={openReminders}
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

          {/* Reminders Dropdown - Rendered via Portal */}
          {showReminders && createPortal(
            <div 
              className="mtb-dropdown mtb-dropdown-portal" 
              data-testid="reminders-dropdown"
              style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="mtb-dropdown-header">
                <Bell size={16} />
                <span>Mira's Reminders</span>
                {urgentCount > 0 && (
                  <span className="mtb-badge urgent">{urgentCount} urgent</span>
                )}
              </div>
              {reminders.length === 0 ? (
                <div className="mtb-dropdown-empty">
                  <Bell size={24} className="opacity-40" />
                  <p>No reminders for {pet?.name || 'now'}</p>
                </div>
              ) : (
                <div className="mtb-reminders-list">
                  {reminders.map((reminder, idx) => (
                    <div 
                      key={reminder.id || idx}
                      className={`mtb-reminder-item ${reminder.days_until < 0 ? 'overdue' : ''}`}
                      onClick={() => {
                        hapticFeedback.light();
                        onReminderAction?.(reminder);
                      }}
                    >
                      <div className="mtb-reminder-icon">
                        {reminder.type === 'health' ? '💊' : 
                         reminder.type === 'celebration' ? '🎂' : 
                         reminder.type === 'grooming' ? '✂️' : '📋'}
                      </div>
                      <div className="mtb-reminder-content">
                        <h4>{reminder.title}</h4>
                        <p>{reminder.message}</p>
                        <span className="mtb-reminder-time">
                          {reminder.days_until === 0 
                            ? 'Today' 
                            : reminder.days_until < 0 
                              ? `${Math.abs(reminder.days_until)} days overdue`
                              : `In ${reminder.days_until} days`
                          }
                        </span>
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
            </div>,
            document.body
          )}
        </div>

        {/* Insights */}
        <button
          className="mtb-tab"
          onClick={() => {
            hapticFeedback.light();
            onOpenInsights?.();
          }}
          data-testid="insights-btn"
        >
          <Lightbulb size={16} />
          <span>Insights</span>
        </button>

        {/* Soul */}
        <button
          className="mtb-tab"
          onClick={() => {
            hapticFeedback.light();
            onOpenSoul?.();
          }}
          data-testid="soul-btn"
        >
          <Heart size={16} />
          <span>Soul</span>
        </button>

        {/* Learn */}
        <button
          className={`mtb-tab ${hasNewVideos ? 'has-new' : ''}`}
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

        {/* Concierge® - Dropdown */}
        <div className="mtb-dropdown-wrap" ref={conciergeRef}>
          <button
            ref={conciergeBtnRef}
            className={`mtb-tab mtb-tab-concierge ${showConcierge ? 'active' : ''}`}
            onClick={openConcierge}
            data-testid="concierge-btn"
          >
            <span className="mtb-concierge-icon">C</span>
            <span>Concierge<sup>®</sup></span>
            {showConcierge ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Concierge Dropdown - Rendered via Portal */}
          {showConcierge && createPortal(
            <div 
              className="mtb-dropdown mtb-concierge-dropdown" 
              data-testid="concierge-dropdown"
              style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="mtb-dropdown-header">
                <span className="mtb-concierge-icon">C</span>
                <span>Concierge® Help</span>
              </div>
              <p className="mtb-concierge-tagline">
                Your pet Concierge® can help with anything for {pet?.name || 'your pet'}.
              </p>
              <div className="mtb-concierge-options">
                <button 
                  className="mtb-concierge-option whatsapp"
                  onClick={openWhatsApp}
                >
                  <div className="mtb-option-icon whatsapp">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </button>
                
                <button 
                  className="mtb-concierge-option chat"
                  onClick={openChat}
                >
                  <div className="mtb-option-icon chat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span>Chat</span>
                </button>
                
                <button 
                  className="mtb-concierge-option email"
                  onClick={openEmail}
                >
                  <div className="mtb-option-icon email">
                    <Mail size={20} />
                  </div>
                  <span>Email</span>
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* New Chat */}
        <button
          className="mtb-tab mtb-tab-new"
          onClick={() => {
            hapticFeedback.medium();
            onRefreshChat?.();
          }}
          data-testid="new-chat-btn"
        >
          <RefreshCw size={16} />
          <span>New Chat</span>
        </button>
      </div>

      <style>{`
        .mira-top-bar-v2 {
          background: linear-gradient(180deg, rgba(15, 7, 32, 0.98) 0%, rgba(15, 7, 32, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 16px 16px;
          /* Removed sticky positioning - allows content to scroll naturally */
          position: relative;
          z-index: 40;
        }

        /* Row 1: Location + Weather */
        .mtb-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .mtb-location-weather {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mtb-city {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
        }

        .mtb-weather {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .mtb-dashboard-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
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

        /* Row 2: Hero - Pet with Soul Orb */
        .mtb-hero-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .mtb-soul-orb {
          position: relative;
          width: 100px;
          height: 100px;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .mtb-orb-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(245, 158, 11, 0.2);
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .mtb-orb-ring-1 { animation-delay: 0s; }
        .mtb-orb-ring-2 { inset: -16px; animation-delay: 1s; opacity: 0.6; }
        .mtb-orb-ring-3 { inset: -24px; animation-delay: 2s; opacity: 0.3; }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.6; }
        }

        .mtb-orb-progress {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .mtb-orb-bg {
          stroke: rgba(255,255,255,0.1);
        }

        .mtb-orb-fill {
          stroke: url(#soul-gradient);
          stroke: #f59e0b;
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
          transition: stroke-dasharray 0.5s ease;
        }

        .mtb-pet-photo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a0f35, #2d1b50);
          overflow: hidden;
          border: 2px solid rgba(245, 158, 11, 0.3);
        }
        .mtb-pet-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mtb-pet-initial {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        .mtb-soul-label {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(15, 7, 32, 0.95);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
          white-space: nowrap;
        }

        .mtb-pet-name {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .mtb-pet-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin: 4px 0 0;
        }

        /* Pet Selector */
        .mtb-pet-selector {
          position: relative;
          margin-top: 12px;
        }

        .mtb-pet-switch-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mtb-pet-switch-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .mtb-pet-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
          min-width: 220px;
          background: rgba(26, 15, 53, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          overflow: hidden;
          z-index: 100;
        }

        .mtb-pet-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .mtb-pet-option:hover {
          background: rgba(255,255,255,0.05);
        }
        .mtb-pet-option.active {
          background: rgba(139, 92, 246, 0.1);
        }

        .mtb-pet-option-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a0f35, #2d1b50);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .mtb-pet-option-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mtb-pet-option-info {
          flex: 1;
          text-align: left;
        }
        .mtb-pet-option-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .mtb-pet-option-breed {
          display: block;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }

        .mtb-pet-option-check {
          color: #10b981;
          font-weight: 700;
        }

        /* Row 3: Action Tabs */
        .mtb-actions-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 4px 0;
        }
        .mtb-actions-row::-webkit-scrollbar {
          display: none;
        }
        
        /* Allow dropdowns to overflow when open */
        .mtb-actions-row:has(.mtb-dropdown) {
          overflow: visible;
        }

        .mtb-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
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
        .mtb-tab:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.15);
        }
        .mtb-tab:active {
          transform: scale(0.95);
        }
        .mtb-tab.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
          color: #a78bfa;
        }

        /* Picks tab - highlighted */
        .mtb-tab-picks {
          background: linear-gradient(135deg, rgba(233, 30, 154, 0.15), rgba(139, 92, 246, 0.15));
          border-color: rgba(233, 30, 154, 0.3);
          color: #f9a8d4;
        }
        .mtb-tab-picks:hover {
          background: linear-gradient(135deg, rgba(233, 30, 154, 0.25), rgba(139, 92, 246, 0.25));
          border-color: rgba(233, 30, 154, 0.5);
        }

        /* Concierge tab */
        .mtb-tab-concierge {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }
        .mtb-concierge-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }

        /* New Chat tab */
        .mtb-tab-new {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
          border-color: rgba(59, 130, 246, 0.3);
          color: #93c5fd;
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

        .mtb-tab.has-urgent {
          border-color: rgba(239, 68, 68, 0.4);
        }
        .mtb-tab.has-new {
          border-color: rgba(245, 158, 11, 0.4);
        }

        /* Dropdown wrapper */
        .mtb-dropdown-wrap {
          position: relative;
        }

        /* Dropdown - Portaled to body */
        .mtb-dropdown {
          min-width: 280px;
          max-width: 320px;
          background: rgba(26, 15, 53, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          overflow: hidden;
          animation: dropdownSlide 0.2s ease-out;
          z-index: 9999;
        }
        
        .mtb-dropdown-portal {
          max-width: 320px;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .mtb-dropdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .mtb-dropdown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: rgba(255,255,255,0.5);
          text-align: center;
          gap: 8px;
        }

        /* Reminders List */
        .mtb-reminders-list {
          max-height: 320px;
          overflow-y: auto;
        }

        .mtb-reminder-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: background 0.2s;
        }
        .mtb-reminder-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .mtb-reminder-item:last-child {
          border-bottom: none;
        }
        .mtb-reminder-item.overdue {
          background: rgba(239, 68, 68, 0.08);
          border-left: 3px solid #ef4444;
        }

        .mtb-reminder-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .mtb-reminder-content {
          flex: 1;
          min-width: 0;
        }
        .mtb-reminder-content h4 {
          font-size: 13px;
          font-weight: 600;
          color: white;
          margin: 0 0 2px;
        }
        .mtb-reminder-content p {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          line-height: 1.4;
          margin: 0;
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
          padding: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          border: none;
        }
        .mtb-reminder-dismiss:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Concierge Dropdown */
        .mtb-concierge-dropdown {
          padding-bottom: 16px;
        }

        .mtb-concierge-tagline {
          padding: 0 16px 16px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }

        .mtb-concierge-options {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 0 16px;
        }

        .mtb-concierge-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mtb-concierge-option:hover {
          transform: scale(1.05);
        }
        .mtb-concierge-option:active {
          transform: scale(0.95);
        }
        .mtb-concierge-option span {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .mtb-option-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .mtb-option-icon svg {
          width: 24px;
          height: 24px;
        }
        .mtb-option-icon.whatsapp {
          background: linear-gradient(135deg, #25D366, #128C7E);
        }
        .mtb-option-icon.chat {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }
        .mtb-option-icon.email {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .mira-top-bar-v2 {
            padding: 10px 12px 14px;
          }

          .mtb-soul-orb {
            width: 80px;
            height: 80px;
          }

          .mtb-pet-photo {
            width: 56px;
            height: 56px;
          }

          .mtb-pet-name {
            font-size: 18px;
          }

          .mtb-tab {
            padding: 8px 12px;
            font-size: 11px;
          }

          .mtb-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
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
