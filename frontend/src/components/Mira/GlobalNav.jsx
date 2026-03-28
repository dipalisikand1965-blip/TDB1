/**
 * GlobalNav - Dashboard | Inbox segmented control + Pet Switcher
 * 
 * Appears on: /notifications, /tickets/:id, /dashboard/*, /my-pets
 * 
 * Active states:
 * - Dashboard active: /dashboard, /dashboard/*, /my-pets
 * - Inbox active: /notifications, /notifications?view=archive, /tickets/*
 * 
 * Badge truth: Inbox badge count = unread notification events (single source)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Sparkles, ChevronDown, PawPrint, Check } from 'lucide-react';

const GlobalNav = ({ 
  unreadCount = 0,
  activePetName,
  activePetId,
  pets = [],
  onPetSelect,
  onPetClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPetDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Determine active tab based on current path
  const isInboxActive = location.pathname.startsWith('/notifications') || 
                        location.pathname.startsWith('/tickets');
  
  const isDashboardActive = location.pathname === '/dashboard' || 
                            location.pathname.startsWith('/dashboard/') ||
                            location.pathname === '/my-pets' ||
                            location.pathname.startsWith('/my-pets/');

  const isMiraActive = location.pathname === '/mira-demo';

  const handlePetSelect = (pet) => {
    setShowPetDropdown(false);
    
    // Update localStorage
    localStorage.setItem('selectedPetId', pet.id);
    localStorage.setItem('selectedPetName', pet.name || '');
    localStorage.setItem('selectedPetBreed', pet.breed || '');
    
    // Dispatch custom event for same-window listeners
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { 
      detail: { 
        petId: pet.id, 
        petName: pet.name || '', 
        petBreed: pet.breed || '',
        pet: pet 
      } 
    }));
    
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'selectedPetId',
      newValue: pet.id
    }));
    
    // Callback to parent
    if (onPetSelect) {
      onPetSelect(pet);
    }
  };

  // ── Birthday Whisper Logic (mobile) ──────────────────────────────────────
  const [mobileWhisperDismissed, setMobileWhisperDismissed] = useState(false);
  const activePet = pets.find(p => p.id === activePetId) || pets[0];
  const getMobileBirthdayWhisper = () => {
    if (mobileWhisperDismissed || !activePet) return null;
    const rawDate = activePet?.birthday || activePet?.birth_date || activePet?.dob || activePet?.gotcha_date;
    if (!rawDate) return null;
    try {
      const now = new Date();
      const bday = new Date(rawDate);
      const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const daysUntil = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
      if (daysUntil > 7) return null;
      const petName = activePet.name || 'Your pup';
      const isGotcha = !!(activePet?.gotcha_date) && !activePet?.birthday && !activePet?.birth_date;
      const label = isGotcha ? 'Gotcha Day' : 'birthday';
      if (daysUntil === 0) return { text: `It's ${petName}'s ${label} today`, icon: '🎉' };
      if (daysUntil === 1) return { text: `${petName}'s ${label} is tomorrow`, icon: '🎂' };
      return { text: `${petName}'s ${label} in ${daysUntil} days`, icon: '🐾' };
    } catch { return null; }
  };
  const mobileWhisper = getMobileBirthdayWhisper();

  return (
    <>
    {/* ── Mobile Birthday Whisper Bar ── */}
    {mobileWhisper && (
      <div
        data-testid="mobile-birthday-whisper"
        style={{
          background: 'linear-gradient(90deg, #1a0a1e, #0f1a2e)',
          borderBottom: '1px solid rgba(236,72,153,0.3)',
          padding: '6px 14px 6px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12,
        }}
      >
        <span>{mobileWhisper.icon}</span>
        <span style={{ flex: 1, color: '#F9A8D4', fontWeight: 600 }}>
          {mobileWhisper.text}
          {' — '}
          <button
            onClick={() => navigate('/celebrate')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#C084FC', fontWeight:700, fontSize:12, padding:0, textDecoration:'underline', textUnderlineOffset:2 }}
          >
            Plan now →
          </button>
        </span>
        <button onClick={() => setMobileWhisperDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:16, padding:'0 2px', lineHeight:1 }}>×</button>
      </div>
    )}
    <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800/50">
      {/* Segmented Control: Dashboard | Inbox | Ask Mira */}
      <div className="flex bg-gray-800/50 rounded-full p-1">
        <button
          onClick={() => navigate('/dashboard')}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${isDashboardActive 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          data-testid="global-nav-dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => navigate('/notifications')}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all relative
            ${isInboxActive 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          data-testid="global-nav-inbox"
        >
          <Inbox className="w-4 h-4" />
          <span>Inbox</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/mira-demo')}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${isMiraActive 
              ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          data-testid="global-nav-mira"
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Ask Mira</span>
        </button>
      </div>
      
      {/* Active Pet Pill with Dropdown */}
      {activePetName && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => pets.length > 1 ? setShowPetDropdown(!showPetDropdown) : (onPetClick ? onPetClick() : navigate('/my-pets'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-all"
            data-testid="active-pet-pill"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {activePetName}
            {pets.length > 1 && (
              <ChevronDown className={`w-3 h-3 transition-transform ${showPetDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {/* Pet Dropdown */}
          {showPetDropdown && pets.length > 1 && (
            <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[9999] min-w-[180px]">
              {/* Header */}
              <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400">Switch Pet</span>
              </div>
              
              {/* Pet List */}
              <div className="py-1 max-h-[200px] overflow-y-auto">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => handlePetSelect(pet)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors text-left
                      ${activePetId === pet.id ? 'bg-gray-800' : ''}
                    `}
                    data-testid={`pet-option-${pet.id}`}
                  >
                    {/* Pet avatar */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      {pet.profile_image ? (
                        <img src={pet.profile_image} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <PawPrint className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    
                    {/* Pet info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{pet.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{pet.breed || 'Pet'}</p>
                    </div>
                    
                    {/* Selected indicator */}
                    {activePetId === pet.id && (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Footer - View All */}
              <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowPetDropdown(false);
                    navigate('/my-pets');
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View all pets →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default GlobalNav;
