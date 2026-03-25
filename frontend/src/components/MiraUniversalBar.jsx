/**
 * MiraUniversalBar.jsx
 * 
 * THE MIRA AI OS - Universal Intelligence Bar
 * Everything in one place - the operating system for pet life
 * 
 * Features:
 * - Universal search: "Ask Mira anything for [Pet]..."
 * - 14 Pillar navigation
 * - Voice input with ElevenLabs Eloise
 * - Pet context always present
 * - Floating Mira widget trigger
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Mic, MicOff, Volume2, VolumeX,
  PartyPopper, UtensilsCrossed, Home, Plane, Heart, 
  Smile, Dumbbell, GraduationCap, FileText, ShieldAlert,
  AlertTriangle, PawPrint, HeartHandshake, ShoppingBag,
  ChevronDown, X, Sparkles, MessageCircle
} from 'lucide-react';
import { API_URL } from '../utils/api';

// 14 Life Pillars
const PILLARS = [
  { id: 'celebrate', label: 'Celebrate', icon: PartyPopper, color: '#EC4899', path: '/celebrate' },
  { id: 'dine', label: 'Dine', icon: UtensilsCrossed, color: '#F59E0B', path: '/dine' },
  { id: 'stay', label: 'Stay', icon: Home, color: '#10B981', path: '/stay' },
  { id: 'travel', label: 'Travel', icon: Plane, color: '#3B82F6', path: '/travel' },
  { id: 'care', label: 'Care', icon: Heart, color: '#EF4444', path: '/care' },
  { id: 'enjoy', label: 'Enjoy', icon: Smile, color: '#8B5CF6', path: '/enjoy' },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: '#06B6D4', path: '/fit' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: '#6366F1', path: '/learn' },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: '#64748B', path: '/paperwork' },
  { id: 'advisory', label: 'Advisory', icon: ShieldAlert, color: '#0EA5E9', path: '/advisory' },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: '#DC2626', path: '/emergency' },
  { id: 'adopt', label: 'Adopt', icon: PawPrint, color: '#84CC16', path: '/adopt' },
  { id: 'farewell', label: 'Farewell', icon: HeartHandshake, color: '#A855F7', path: '/farewell' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, color: '#F472B6', path: '/shop' },
];

const MiraUniversalBar = ({ 
  pet = null, 
  onMiraOpen = () => {},
  showPillars = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showMiraResponse, setShowMiraResponse] = useState(false);
  const [miraResponse, setMiraResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const recognitionRef = useRef(null);

  // Default pet
  const currentPet = pet || {
    id: 'demo-pet',
    name: 'Meister',
    breed: 'Shih Tzu',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
    traits: ['human', 'loving', 'understanding'],
    favorites: { treat: 'liver, jerkies' },
    soul_percentage: 70.4
  };

  // Get current pillar from URL
  const getCurrentPillar = () => {
    const path = location.pathname.split('/')[1];
    return PILLARS.find(p => p.id === path) || null;
  };

  const currentPillar = getCurrentPillar();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        // Auto-submit after voice input
        handleSearch(transcript);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Toggle voice input
  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle search/query submission
  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowMiraResponse(true);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: query,
          pet_context: {
            name: currentPet.name,
            breed: currentPet.breed,
            traits: currentPet.traits,
            sensitivities: currentPet.sensitivities,
            favorites: currentPet.favorites
          },
          page_context: currentPillar?.id || 'home',
          include_products: true,
          pillar: currentPillar?.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMiraResponse({
          message: data.response?.message || data.message,
          intent: data.understanding?.intent || data.intent,
          execution_type: data.execution_type,
          products: data.response?.products || []
        });
      }
    } catch (error) {
      console.error('Mira error:', error);
      setMiraResponse({
        message: "I'm here to help! Let me connect you with your Pet Concierge®.",
        intent: 'EXPLORE',
        execution_type: 'CONCIERGE'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Navigate to pillar
  const handlePillarClick = (pillar) => {
    navigate(pillar.path);
  };

  // Close Mira response
  const closeMiraResponse = () => {
    setShowMiraResponse(false);
    setMiraResponse(null);
    setSearchQuery('');
  };

  return (
    <>
      {/* Universal Header Bar */}
      <header className="mira-universal-header">
        {/* Top Banner */}
        <div className="mira-universal-banner">
          <Sparkles className="w-4 h-4" />
          <span>The World's First Pet Life Operating System — Your Pet Concierge®</span>
        </div>
        
        {/* Main Navigation */}
        <div className="mira-universal-nav">
          {/* Logo */}
          <div className="mira-universal-logo" onClick={() => navigate('/')}>
            <PawPrint className="w-6 h-6" />
            <div className="mira-universal-logo-text">
              <span className="mira-logo-the">the</span>
              <span className="mira-logo-doggy">doggy</span>
              <span className="mira-logo-company">company</span>
            </div>
            <span className="mira-logo-tagline">PET CONCIERGE®</span>
          </div>
          
          {/* Universal Search Bar */}
          <form 
            onSubmit={handleSubmit}
            className={`mira-universal-search ${isFocused ? 'focused' : ''}`}
          >
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={`Ask Mira anything for ${currentPet.name}...`}
              className="mira-universal-search-input"
            />
            <button 
              type="button"
              onClick={toggleVoice}
              className={`mira-universal-voice-btn ${isListening ? 'listening' : ''}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button type="submit" className="mira-universal-search-btn">
              <Search className="w-5 h-5" />
            </button>
          </form>
          
          {/* User/Pet Area */}
          <div className="mira-universal-user">
            <button 
              onClick={onMiraOpen}
              className="mira-universal-mira-btn"
              title="Open Mira"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <div className="mira-universal-pet-avatar">
              <img src={currentPet.photo} alt={currentPet.name} />
            </div>
          </div>
        </div>
        
        {/* Pillar Navigation */}
        {showPillars && (
          <nav className="mira-universal-pillars">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = currentPillar?.id === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar)}
                  className={`mira-universal-pillar ${isActive ? 'active' : ''}`}
                  style={{ '--pillar-color': pillar.color }}
                >
                  <span>{pillar.label}</span>
                  <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </button>
              );
            })}
          </nav>
        )}
      </header>
      
      {/* Mira Response Overlay */}
      {showMiraResponse && (
        <div className="mira-response-overlay" onClick={closeMiraResponse}>
          <div className="mira-response-modal" onClick={(e) => e.stopPropagation()}>
            {/* Mira Header */}
            <div className="mira-response-header">
              <div className="mira-response-title">
                <Sparkles className="w-5 h-5" />
                <span>Mira</span>
                {miraResponse?.intent && (
                  <span className="mira-response-badge">{miraResponse.intent}</span>
                )}
              </div>
              <button onClick={closeMiraResponse} className="mira-response-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Response Content */}
            <div className="mira-response-content">
              {isLoading ? (
                <div className="mira-response-loading">
                  <div className="mira-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mira-response-text">{miraResponse?.message}</p>
                  
                  {/* Concierge® Card */}
                  {miraResponse?.execution_type === 'CONCIERGE' && (
                    <div className="mira-concierge-card">
                      <div className="mira-concierge-icon">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="mira-concierge-info">
                        <strong>This needs your Pet Concierge®</strong>
                        <p>This request involves planning, coordination, or personalized service that our concierge team handles best.</p>
                      </div>
                      <button 
                        onClick={async () => {
                          const messageText = `Hi, I need help with ${currentPet.name} (${currentPet.breed}). ${searchQuery}`;
                          // 🎯 UNIVERSAL SERVICE FLOW: Create ticket BEFORE opening WhatsApp
                          try {
                            await fetch(`${API_URL}/api/service-requests`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                type: 'whatsapp_intent',
                                pillar: currentPillar?.id || 'general',
                                source: 'mira_universal_bar',
                                customer: {
                                  name: 'Search Bar User',
                                  email: 'guest@thedoggycompany.com',
                                  phone: ''
                                },
                                details: {
                                  message: `[WhatsApp Intent] User clicked Connect with Concierge® from Universal Search Bar. Query: "${searchQuery}"`,
                                  pet_name: currentPet.name,
                                  channel: 'whatsapp',
                                  source_component: 'MiraUniversalBar'
                                },
                                priority: 'medium'
                              })
                            });
                            console.log('[MiraUniversalBar] Service ticket created');
                          } catch (err) {
                            console.warn('[MiraUniversalBar] Ticket error:', err);
                          }
                          window.open(`https://wa.me/919663185747?text=${encodeURIComponent(messageText)}`, '_blank');
                        }}
                        className="mira-concierge-btn"
                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', border: 'none', cursor: 'pointer', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: '600' }}
                      >
                        Connect with Concierge®
                      </button>
                    </div>
                  )}
                  
                  {/* Products */}
                  {miraResponse?.products?.length > 0 && (
                    <div className="mira-response-products">
                      <h4>✨ Suggested for {currentPet.name}</h4>
                      <div className="mira-response-products-grid">
                        {miraResponse.products.slice(0, 4).map((product, idx) => (
                          <div key={idx} className="mira-response-product">
                            <img 
                              src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100'} 
                              alt={product.name}
                            />
                            <div className="mira-response-product-info">
                              <span className="mira-response-product-name">{product.name?.substring(0, 20)}...</span>
                              <span className="mira-response-product-price">₹{product.price || product.base_price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiraUniversalBar;
