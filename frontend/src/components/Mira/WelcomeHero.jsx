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
  ChevronRight, Shield, Sun, Cloud, CloudRain, Thermometer, AlertTriangle, CheckCircle
} from 'lucide-react';
import ProactiveAlertsBanner from './ProactiveAlertsBanner';

// Inline Weather Card Component for WelcomeHero
const WeatherCardInline = ({ weather, petName, onAskMira }) => {
  if (!weather) return null;
  
  // Handle nested API response structure
  const city = weather.city || 'Your city';
  const currentWeather = weather.current_weather || {};
  const temp = currentWeather.temperature || currentWeather.temp || 0;
  const humidity = currentWeather.humidity || 0;
  const condition = currentWeather.condition || currentWeather.description || 'Clear';
  const petAdvisory = weather.pet_advisory || {};
  const safetyLevel = petAdvisory.safety_level || 'unknown';
  const isSafe = safetyLevel.toLowerCase() === 'safe';
  const isCaution = safetyLevel.toLowerCase() === 'caution';
  
  // Weather icon
  const WeatherIcon = () => {
    const cond = (condition || '').toLowerCase();
    if (cond.includes('rain')) return <CloudRain className="w-5 h-5" />;
    if (cond.includes('cloud')) return <Cloud className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };
  
  // Safety colors
  const safetyColors = isSafe 
    ? { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#22C55E' }
    : isCaution 
    ? { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' }
    : { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444' };
  
  return (
    <div 
      className="weather-card-inline"
      style={{
        background: safetyColors.bg,
        border: `1px solid ${safetyColors.border}`,
        borderRadius: '16px',
        padding: '12px 16px',
        marginTop: '12px',
        cursor: 'pointer'
      }}
      onClick={() => onAskMira?.(`Is it safe to walk ${petName} right now?`)}
      data-testid="weather-card-inline"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: safetyColors.text }}>
            <WeatherIcon />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
              {Math.round(temp || 0)}°C • {city || 'Your city'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>
              {isSafe ? `Great day to walk ${petName}!` : isCaution ? `Be careful with ${petName} outside` : `Keep ${petName} indoors`}
            </div>
          </div>
        </div>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.1)',
            color: safetyColors.text,
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          {isSafe ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {safetyLevel}
        </div>
      </div>
    </div>
  );
};

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
      {/* SECONDARY BUTTONS REMOVED - Soul moved to MOJO, Past Chats moved to CONCIERGE */}
      
      {/* Hero Layout - Avatar Left, Content Right */}
      <div className="hero-layout">
        {/* Pet Avatar with Multiple Animated Rings */}
        <div className="hero-avatar-container">
          <div className="avatar-glow"></div>
          <div className="avatar-ring ring-1"></div>
          <div className="avatar-ring ring-2"></div>
          <div className="avatar-ring ring-3"></div>
          
          {/* Pet Photo */}
          <div className="avatar-photo">
            {pet.photo ? (
              <img 
                src={pet.photo} 
                alt={pet.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${pet.name}&backgroundColor=ffdfbf`;
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                <PawPrint className="w-12 h-12" />
              </div>
            )}
          </div>
          
          {/* Soul Score Badge - Dynamic with glow */}
          {pet.soulScore > 10 ? (
            <div 
              className={`soul-score-badge soul-active ${isGlowing ? 'soul-growing' : ''}`} 
              onClick={() => onShowSoulForm ? onShowSoulForm() : navigate(`/pet-soul/${pet.id || ''}`)}
              title={`${pet.name}'s Soul Score - Click to grow`}
              style={{ cursor: 'pointer' }}
            >
              <span className={`soul-percent ${isGlowing ? 'counting' : ''}`}>{displayScore}%</span>
              <span className="soul-label">SOUL<br/>KNOWN</span>
            </div>
          ) : (
            <div 
              className="soul-score-badge soul-incomplete" 
              onClick={() => onShowSoulForm ? onShowSoulForm() : navigate(`/pet-soul/${pet.id || ''}`)}
              data-testid="soul-incomplete-prompt"
              style={{ cursor: 'pointer' }}
            >
              <span className="soul-sparkle">✨</span>
              <span className="soul-cta">Help Mira<br/>know {pet.name}</span>
            </div>
          )}
          
          {/* Health Tile */}
          <a href="/dashboard" className="health-tile" data-testid="health-tile">
            <div className="health-tile-icon">
              <Heart size={16} />
            </div>
            <div className="health-tile-content">
              <span className="health-tile-label">Health</span>
              {healthVault.completeness < 100 ? (
                <span className="health-tile-status incomplete">{healthVault.completeness}%</span>
              ) : (
                <span className="health-tile-status complete">✓</span>
              )}
            </div>
          </a>
        </div>
        
        {/* Content Side */}
        <div className="hero-content">
          <h1 className="hero-title">
            For <span className="gradient-text">{pet.name}</span>
          </h1>
          
          <p className="hero-subtitle">Curated for {pet.name} today</p>
          
          {/* Proactive Greeting */}
          {proactiveGreeting && (
            <div 
              className={`proactive-greeting ${proactiveGreeting.hasAlert ? 'has-alert' : ''}`}
              onClick={() => proactiveGreeting.hasAlert && handleQuickReply(proactiveGreeting.text)}
            >
              <span className="greeting-icon">{proactiveGreeting.icon}</span>
              <span className="greeting-text">{proactiveGreeting.text}</span>
              {proactiveGreeting.hasAlert && <ChevronRight className="greeting-arrow" />}
            </div>
          )}
          
          {/* WEATHER - Moved to TODAY layer. Minimal ambient hint only here */}
          
          {/* SMART PROACTIVE ALERTS - Vaccination, Birthday, Grooming */}
          {proactiveAlerts.smartAlerts && proactiveAlerts.smartAlerts.length > 0 && (
            <ProactiveAlertsBanner
              alerts={proactiveAlerts.smartAlerts}
              criticalCount={proactiveAlerts.criticalCount || 0}
              maxVisible={2}
              onAskMira={(message, alert) => {
                // "Ask Mira" - Start a conversation about this reminder
                handleQuickReply(message);
              }}
              onBookNow={(request, alert) => {
                // "Book Now" - Send as service request to Concierge®
                const conciergeMessage = `Please help me book: ${request.title}. Details: ${request.details}`;
                handleQuickReply(conciergeMessage);
              }}
              className="mb-4 mt-2"
            />
          )}
          
          {/* Soul Traits - Generate from pet data */}
          <div className="soul-traits">
            {(() => {
              // Generate traits dynamically from pet soul data
              const traits = [];
              
              // 1. Personality tag (if set)
              if (pet.soul?.personality_tag) {
                traits.push({ label: pet.soul.personality_tag, icon: '✨', color: '#a855f7' });
              } else if (pet.doggy_soul_answers?.general_nature) {
                traits.push({ label: `${pet.doggy_soul_answers.general_nature} soul`, icon: '✨', color: '#a855f7' });
              }
              
              // 2. Love language or describe words
              if (pet.soul?.love_language) {
                traits.push({ label: `${pet.soul.love_language} lover`, icon: '❤️', color: '#ef4444' });
              } else if (pet.doggy_soul_answers?.describe_3_words) {
                const firstWord = pet.doggy_soul_answers.describe_3_words.split(',')[0]?.trim();
                if (firstWord) traits.push({ label: firstWord, icon: '🎀', color: '#ec4899' });
              }
              
              // 3. Energy level or special trait
              if (pet.soul?.energy_level) {
                traits.push({ label: `${pet.soul.energy_level} energy`, icon: '⚡', color: '#f59e0b' });
              } else if (pet.doggy_soul_answers?.energy_level) {
                traits.push({ label: pet.doggy_soul_answers.energy_level, icon: '⚡', color: '#f59e0b' });
              }
              
              // Use soulTraits from prop if available
              const finalTraits = pet.soulTraits?.length > 0 ? pet.soulTraits : 
                                  traits.length > 0 ? traits : 
                                  [{ label: 'Unique soul', icon: '⭐', color: '#f59e0b' }];
              
              return finalTraits.slice(0, 3).map((trait, i) => (
                <div key={i} className="trait-chip">
                  <span className="trait-icon">{trait.icon}</span>
                  <span className="trait-label">{trait.label}</span>
                </div>
              ));
            })()}
          </div>
          
          {/* Removed: Personalized Picks Card - Duplicated pet selection + "For Lola" + Picks tab */}
          
          {/* Health Vault Prompt */}
          {healthVault.completeness < 100 && healthVault.missing_fields.length > 0 && (
            <div 
              className="health-vault-prompt"
              onClick={onShowHealthWizard}
              data-testid="health-vault-prompt"
            >
              <div className="vault-icon">
                <Shield className="w-5 h-5" />
              </div>
              <div className="vault-content">
                <div className="vault-progress">
                  <div className="vault-progress-bar" style={{ width: `${healthVault.completeness}%` }} />
                </div>
                <p className="vault-title">
                  Complete {pet.name}'s Health Vault
                </p>
                <p className="vault-subtitle">
                  {healthVault.completeness}% complete • {healthVault.missing_fields.length} items missing
                </p>
              </div>
              <ChevronRight className="vault-arrow" />
            </div>
          )}
          
          {/* Proactive Alerts */}
          {(proactiveAlerts.celebrations.length > 0 || proactiveAlerts.healthReminders.filter(r => r.needs_attention).length > 0) && (
            <div className="proactive-alerts">
              {/* Celebrations */}
              {proactiveAlerts.celebrations.filter(c => c.is_upcoming).map((celeb, i) => (
                <div 
                  key={`celeb-${i}`} 
                  className={`proactive-alert ${celeb.is_today ? 'alert-today' : 'alert-upcoming'}`}
                  onClick={() => handleQuickReply(celeb.is_today ? `It's ${pet.name}'s ${celeb.type}! What should we do?` : `${pet.name}'s ${celeb.type} is coming up!`)}
                >
                  <span className="alert-icon">{celeb.type === 'birthday' ? '🎂' : '💜'}</span>
                  <span className="alert-text">
                    {celeb.is_today 
                      ? `Today is ${pet.name}'s ${celeb.type === 'birthday' ? 'Birthday' : 'Gotcha Day'}!` 
                      : `${celeb.name} in ${celeb.days_until} days`}
                  </span>
                </div>
              ))}
              
              {/* Health Reminders */}
              {proactiveAlerts.healthReminders.filter(r => r.needs_attention).slice(0, 2).map((reminder, i) => (
                <div 
                  key={`health-${i}`} 
                  className={`proactive-alert ${reminder.urgent || reminder.is_overdue ? 'alert-urgent' : 'alert-notice'}`}
                  onClick={() => handleQuickReply(reminder.type === 'vaccine' ? `${pet.name} needs ${reminder.name} vaccine` : `Schedule a vet checkup for ${pet.name}`)}
                >
                  <span className="alert-icon">{reminder.urgent ? '⚠️' : '💉'}</span>
                  <span className="alert-text">
                    {reminder.type === 'vet_visit' 
                      ? reminder.message 
                      : `${reminder.name} ${reminder.is_overdue ? 'overdue' : 'due soon'}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Feature Showcase */}
      <div className="mira-feature-showcase" data-testid="feature-showcase">
        <div className="feature-showcase-header">
          <Sparkles className="w-4 h-4" />
          <span>What can Mira help with?</span>
        </div>
        
        {/* Weather Card removed - now only shown in TODAY panel */}
        
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
      
      {/* Quick Suggestion Chips - iOS Safari optimized */}
      <div className="quick-chips" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '12px' }}>
        {[
          { text: `Birthday party for ${pet.name}`, icon: '🎂' },
          { text: 'Health checkup reminder', icon: '💉' },
          { text: 'Custom meal plan', icon: '🍖' }
        ].map((s, i) => (
          <button 
            key={i} 
            onClick={() => handleQuickReply(s.text)} 
            className="quick-chip"
            style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'max-content' }}
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
