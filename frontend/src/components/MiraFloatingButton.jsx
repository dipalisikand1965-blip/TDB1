/**
 * MiraFloatingButton - Global floating button for Mira voice assistant
 * Appears on ALL pages, prominently on top
 * 
 * Features:
 * - Always visible in top-right corner
 * - Animated pulse effect
 * - Opens Mira chat/voice assistant
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, X, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MiraVoiceAssistant from './MiraVoiceAssistant';

const MiraFloatingButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);
  
  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
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
          if (data.pets?.length > 0) {
            setPetData(data.pets[0]);
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
      
      {/* Mira Voice Assistant Modal */}
      {isOpen && (
        <MiraVoiceAssistant
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          petName={petData?.name || 'your pup'}
          petId={petData?.id}
          petData={petData}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
};

export default MiraFloatingButton;
