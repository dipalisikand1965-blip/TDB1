/**
 * MiraFloatingButton - Global floating button for Mira AI & Pulse voice
 * 
 * ARCHITECTURE:
 * - Mira: Core intelligence layer (chat, reasoning, memories)
 * - Pulse: Voice intent accelerator (fast capture, handoff to Mira)
 * 
 * Activation methods:
 * - User taps Mira icon → Opens Mira chat
 * - User taps Pulse/mic → Opens Pulse (voice capture → Mira)
 * - Auto-show (NOT auto-speak) in Care/Emergency/Farewell
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, X, Zap, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pulse from './Pulse';

// Pillars where Mira should auto-show (NOT auto-speak)
const AUTO_SHOW_PILLARS = ['/care', '/emergency', '/farewell'];

// Pillars where voice must NEVER auto-trigger
const NO_AUTO_SPEAK = ['/', '/shop', '/checkout', '/celebrate', '/dine', '/stay', '/travel'];

const MiraFloatingButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const [voicePreference, setVoicePreference] = useState('text'); // 'text' or 'voice'
  const [hasAskedPreference, setHasAskedPreference] = useState(false);
  const [startWithVoice, setStartWithVoice] = useState(false);
  
  // Listen for openMiraVoice event from floating contact button (now opens Pulse)
  useEffect(() => {
    const handleOpenMiraVoice = () => {
      setStartWithVoice(true);
      setVoicePreference('voice');
      setIsOpen(true);
    };
    window.addEventListener('openMiraVoice', handleOpenMiraVoice);
    return () => window.removeEventListener('openMiraVoice', handleOpenMiraVoice);
  }, []);
  
  // Check for Care/Emergency/Farewell pillars - auto-show (not auto-speak)
  useEffect(() => {
    const isCarePillar = AUTO_SHOW_PILLARS.some(p => location.pathname.startsWith(p));
    if (isCarePillar && !isOpen) {
      // Auto-show but DON'T auto-speak
      setShowTooltip(true);
    }
  }, [location.pathname, isOpen]);
  
  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // Load voice preference from localStorage
  useEffect(() => {
    const savedPref = localStorage.getItem('mira_voice_preference');
    const asked = localStorage.getItem('mira_asked_preference');
    if (savedPref) setVoicePreference(savedPref);
    if (asked) setHasAskedPreference(true);
  }, []);
  
  // Fetch user's pet data for personalization
  useEffect(() => {
    const fetchPetData = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Mira: Pet data fetched:', data); // Debug log
          if (data.pets?.length > 0) {
            const pet = data.pets[0];
            // Ensure we get the pet name correctly
            setPetData({
              id: pet.id,
              name: pet.name || pet.pet_name || 'your pup',
              breed: pet.breed,
              age: pet.age,
              overall_score: pet.overall_score
            });
          }
        }
      } catch (err) {
        console.error('Error fetching pet data:', err);
      }
    };
    fetchPetData();
  }, [token]);
  
  // Hide on pages where Mira is already prominent
  const hiddenPaths = ['/mira', '/ask-mira', '/admin'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }
  
  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Mira Button - Fixed top right */}
      <div 
        className="fixed top-20 right-4 z-[9998] flex flex-col items-end"
        data-testid="mira-floating-btn"
      >
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div className="absolute right-16 top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce whitespace-nowrap">
            <span className="mr-1">👋</span> Ask Mira!
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-pink-600"></div>
          </div>
        )}
        
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-xl flex items-center justify-center
            transition-all duration-300 transform hover:scale-110
            ${isOpen 
              ? 'bg-gray-700 rotate-90' 
              : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 animate-pulse'
            }
          `}
          aria-label={isOpen ? 'Close Mira' : 'Talk to Mira'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <Sparkles className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
          )}
        </button>
        
        {/* Quick Label */}
        {!isOpen && (
          <div className="mt-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow text-xs font-medium text-purple-700">
            Mira ✨
          </div>
        )}
      </div>
      
      {/* Mira Voice Assistant Modal - Unified Interface */}
      {isOpen && (
        <MiraVoiceAssistant
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setStartWithVoice(false);
          }}
          petName={petData?.name || 'your pup'}
          petId={petData?.id}
          petData={petData}
          onNavigate={handleNavigate}
          voicePreference={voicePreference}
          currentPillar={location.pathname.split('/')[1] || 'home'}
          startWithVoice={startWithVoice}
        />
      )}
    </>
  );
};

export default MiraFloatingButton;
