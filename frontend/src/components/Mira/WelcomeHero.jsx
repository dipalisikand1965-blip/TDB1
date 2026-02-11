/**
 * WelcomeHero - Welcome Screen Component for Mira Chat
 * =====================================================
 * Shows when conversation is empty - premium pet experience
 * Includes pet avatar, soul traits, feature showcase, quick chips
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, History, PawPrint, Heart, Sparkles, 
  ChevronRight, Shield 
} from 'lucide-react';
import ProactiveAlertsBanner from './ProactiveAlertsBanner';

/**
 * WelcomeHero Component
 * 
 * @param {Object} props
 * @param {Object} props.pet - Current pet object
 * @param {string} props.token - Auth token (if logged in)
 * @param {Object} props.proactiveGreeting - Time-based greeting
 * @param {Object} props.proactiveAlerts - Birthday/health alerts
 * @param {Object} props.healthVault - Health vault data
 * @param {Object} props.currentWeather - Weather data
 * @param {Array} props.features - MIRA_FEATURES array
 * @param {Function} props.onQuickReply - Handle quick reply
 * @param {Function} props.onLoadPastChats - Load past chats
 * @param {Function} props.onShowHealthWizard - Show health wizard
 */
const WelcomeHero = ({ 
  pet,
  token,
  proactiveGreeting,
  proactiveAlerts = { celebrations: [], healthReminders: [] },
  healthVault = { completeness: 100, missing_fields: [] },
  currentWeather,
  features = [],
  onQuickReply,
  onLoadPastChats,
  onShowHealthWizard,
  onShowSoulForm, // New prop for Soul Form modal
  onShowTopPicks, // New prop for Top Picks panel
  soulScoreUpdated = false // New prop to trigger glow animation
}) => {
  const navigate = useNavigate();
  const [isGlowing, setIsGlowing] = React.useState(false);
  const [displayScore, setDisplayScore] = React.useState(pet?.soulScore || 0);
  const prevScoreRef = React.useRef(pet?.soulScore || 0);
  
  // Animate when soul score increases
  React.useEffect(() => {
    if (pet?.soulScore && pet.soulScore > prevScoreRef.current) {
      setIsGlowing(true);
      
      // Animate the score counting up
      const startScore = prevScoreRef.current;
      const endScore = pet.soulScore;
      const duration = 1000; // 1 second
      const steps = 20;
      const increment = (endScore - startScore) / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(endScore);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.round(startScore + (increment * currentStep)));
        }
      }, duration / steps);
      
      // Remove glow after animation
      setTimeout(() => setIsGlowing(false), 1500);
      
      prevScoreRef.current = pet.soulScore;
      
      return () => clearInterval(interval);
    } else if (pet?.soulScore) {
      setDisplayScore(pet.soulScore);
      prevScoreRef.current = pet.soulScore;
    }
  }, [pet?.soulScore]);
  
  // Also trigger glow when soulScoreUpdated prop changes
  React.useEffect(() => {
    if (soulScoreUpdated) {
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 1500);
    }
  }, [soulScoreUpdated]);
  
  const handleQuickReply = (text) => {
    if (onQuickReply) onQuickReply(text);
  };
  
  return (
    <div className="mira-hero-welcome">
      {/* Hero Layout - Content Only (Avatar/Soul moved to MiraTopBar) */}
      <div className="hero-layout hero-content-only">
        {/* Content Side */}
        <div className="hero-content" style={{ width: '100%' }}>
          <h1 className="hero-title" style={{ textAlign: 'center' }}>
            For <span className="gradient-text">{pet.name}</span>
          </h1>
          
          <p className="hero-subtitle" style={{ textAlign: 'center' }}>Curated with love for {pet.name}</p>
          
          {/* Proactive Greeting - REMOVED: Now in MiraTopBar Reminders dropdown */}
          
          {/* Soul Traits - Centered */}
          <div className="soul-traits" style={{ justifyContent: 'center' }}>
            {(pet.soulTraits || [
              { label: 'Glamorous soul', icon: '✨' },
              { label: 'Elegant paws', icon: '🎀' },
              { label: 'Devoted friend', icon: '💖' }
            ]).map((trait, i) => (
              <div key={i} className="trait-chip">
                <span className="trait-icon">{trait.icon}</span>
                <span className="trait-label">{trait.label}</span>
              </div>
            ))}
          </div>
          
          {/* Health Vault & Proactive Alerts - REMOVED: Now in MiraTopBar Reminders dropdown */}
        </div>
      </div>
      
      {/* Feature Showcase - Clean "Try asking Mira" section */}
      <div className="mira-feature-showcase" data-testid="feature-showcase">
        <div className="feature-showcase-header" style={{ justifyContent: 'center' }}>
          <Sparkles className="w-4 h-4" />
          <span>Try asking Mira:</span>
        </div>
        
        {/* Weather Card */}
        {currentWeather && (
          <div 
            className={`weather-card weather-${currentWeather.pet_advisory?.safety_level || 'good'}`}
            onClick={() => handleQuickReply(`Is it a good day to take ${pet.name} for a walk?`)}
            data-testid="weather-card"
          >
            <div className="weather-card-icon">
              {currentWeather.pet_advisory?.safety_level === 'danger' ? '🔥' :
               currentWeather.pet_advisory?.safety_level === 'warning' ? '⚠️' :
               currentWeather.pet_advisory?.safety_level === 'caution' ? '☀️' : '✨'}
            </div>
            <div className="weather-card-content">
              <div className="weather-card-title">
                {currentWeather.current_weather?.temperature}°C in {currentWeather.city}
              </div>
              <div className="weather-card-subtitle">
                {currentWeather.pet_advisory?.walk_message}
              </div>
            </div>
            <ChevronRight className="weather-card-arrow" />
          </div>
        )}
        
        {/* Feature Grid */}
        <div className="feature-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              className="feature-card"
              style={{ '--feature-color': feature.color }}
              onClick={() => handleQuickReply(feature.query)}
              data-testid={`feature-${feature.id}`}
            >
              <span className="feature-icon">{feature.icon}</span>
              <span className="feature-title">{feature.title}</span>
              <span className="feature-desc">{feature.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Quick Suggestion Chips */}
      <div className="quick-chips">
        {[
          { text: `Birthday party for ${pet.name}`, icon: '🎂' },
          { text: 'Health checkup reminder', icon: '💉' },
          { text: 'Custom meal plan', icon: '🍖' }
        ].map((s, i) => (
          <button 
            key={i} 
            onClick={() => handleQuickReply(s.text)} 
            className="quick-chip"
            data-testid={`quick-chip-${i}`}
          >
            <span className="chip-icon">{s.icon}</span>
            <span className="chip-text">{s.text}</span>
          </button>
        ))}
      </div>
      
      {/* TRY EXAMPLES - Golden Standard for First 30 Seconds */}
      <div className="try-examples" data-testid="try-examples">
        <div className="try-header">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try asking Mira:</span>
        </div>
        <div className="try-list">
          <button 
            className="try-item"
            onClick={() => handleQuickReply(`Plan a birthday party for ${pet.name}`)}
          >
            <span className="try-quote">"</span>
            <span className="try-text">Plan a birthday party for {pet.name}</span>
            <span className="try-quote">"</span>
          </button>
          <button 
            className="try-item"
            onClick={() => handleQuickReply(`Find pet-friendly cafes near me`)}
          >
            <span className="try-quote">"</span>
            <span className="try-text">Find pet-friendly cafes near me</span>
            <span className="try-quote">"</span>
          </button>
          <button 
            className="try-item"
            onClick={() => handleQuickReply(`Create a healthy meal plan for ${pet.name}`)}
          >
            <span className="try-quote">"</span>
            <span className="try-text">Create a healthy meal plan for {pet.name}</span>
            <span className="try-quote">"</span>
          </button>
          <button 
            className="try-item"
            onClick={() => handleQuickReply(`I need a dog walker for next week`)}
          >
            <span className="try-quote">"</span>
            <span className="try-text">I need a dog walker for next week</span>
            <span className="try-quote">"</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;
