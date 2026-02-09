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
  onShowHealthWizard
}) => {
  const navigate = useNavigate();
  
  const handleQuickReply = (text) => {
    if (onQuickReply) onQuickReply(text);
  };
  
  return (
    <div className="mira-hero-welcome">
      {/* Action Buttons Row */}
      <div className="hero-actions-row">
        {/* Soul / Dashboard Button */}
        <button 
          className="soul-journey-btn" 
          onClick={() => navigate(token ? '/dashboard' : `/pet-soul/${pet.id || ''}`)}
          data-testid="soul-journey-btn"
        >
          <Crown className="w-4 h-4" />
          <span>{token ? `Enhance ${pet.name}'s Soul` : `Start ${pet.name}'s soul journey`}</span>
        </button>
        
        {/* View Past Chats Button */}
        <button 
          className="history-btn" 
          onClick={onLoadPastChats}
          data-testid="view-history-btn"
        >
          <History className="w-4 h-4" />
          <span>Past Chats</span>
        </button>
      </div>
      
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
          
          {/* Soul Score Badge */}
          {pet.soulScore > 10 ? (
            <div className="soul-score-badge" onClick={() => navigate(`/pet-soul/${pet.id || ''}`)}>
              <span className="soul-percent">{pet.soulScore}%</span>
              <span className="soul-label">SOUL<br/>KNOWN</span>
            </div>
          ) : (
            <div 
              className="soul-score-badge soul-incomplete" 
              onClick={() => navigate(`/pet-soul/${pet.id || ''}`)}
              data-testid="soul-incomplete-prompt"
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
          
          <p className="hero-subtitle">Curated with love for {pet.name}</p>
          
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
          
          {/* Soul Traits */}
          <div className="soul-traits">
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
          
          {/* Personalized Picks Card */}
          <div className="mira-love-card" onClick={() => handleQuickReply(`Show me personalized picks for ${pet.name}`)}>
            <div className="love-card-icon">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="love-card-content">
              <p className="love-card-title">
                "💕 Personalized picks for {pet.name}"
              </p>
              <p className="love-card-subtitle">
                <Heart className="w-3 h-3" /> Mira knows {pet.name}
              </p>
            </div>
            <Sparkles className="love-card-sparkle" />
          </div>
          
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
    </div>
  );
};

export default WelcomeHero;
