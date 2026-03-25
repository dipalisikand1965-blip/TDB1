/**
 * ChatMessage - Individual Message Bubble Component
 * ==================================================
 * Renders a single message in the conversation
 * Supports ALL message types including complex data cards:
 * - User messages, Mira messages, system messages, topic shifts
 * - Products grid, nearby places, weather advisory
 * - Training videos, travel hotels, travel attractions
 * - Services, experiences, dynamic concierge requests
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5+ Refactoring
 */

import React from 'react';
import { 
  Sparkles, ChevronRight, PawPrint, Gift, Heart,
  RefreshCw, ExternalLink, ShoppingBag, Star, MapPin,
  Navigation, Phone, Play, Calendar, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import InlineConciergeCard from './InlineConciergeCard';
import PlacesWithConcierge from './PlacesWithConcierge';
import { QuickReplyChips } from '../mira-os/QuickReplyChips';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if message content mentions connecting to concierge
 */
const shouldShowConciergeCard = (content) => {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  
  // Patterns that indicate concierge handoff offer
  const conciergePatterns = [
    'connect you with your pet concierge',
    'connect you with your concierge',
    'connect you with concierge',
    'connect with concierge',
    'reach your concierge',
    'concierge® to handle',
    'concierge® team',
    'i can connect you',
    'shall i connect you',
    'would you like to speak with',
    'our live concierge',
    'concierge is on it',
    'concierge® is joining',
    'speak with your concierge',
    'your concierge can help',
    'reach out to concierge',
    'concierge will',
    'get our concierge',
    'connect me with concierge',
    'speak with a concierge',
    'chat with concierge',
    // Patterns based on actual Mira responses
    'to our concierge',
    'passing this request to',
    'request to our concierge',
    'concierge® with all',
    'starting the booking flow',
    "they'll pick it up",
    'taking action now',
    'concierge® is taking',
    'booking flow for you',
    'pet concierge® to help',
    'concierge® has been notified',
    'concierge® will reach',
    'your pet concierge®',
    "i've asked your pet concierge",
    // More patterns from actual responses
    'our human concierge',
    'loop in our',
    'concierge® to fine',
    'human concierge®'
  ];
  
  return conciergePatterns.some(pattern => lowerContent.includes(pattern));
};


/**
 * FormattedText - Renders markdown text with proper styling
 * Cross-browser compatible (iOS Safari, Android Chrome, Desktop)
 */
const FormattedText = ({ children, className = '' }) => {
  if (!children) return null;
  
  // Pre-process markdown for consistent rendering
  const processMarkdown = (text) => {
    if (typeof text !== 'string') return text;
    
    return text
      // Ensure bullet points are on new lines
      .replace(/([.:])(\s*)- /g, '$1\n\n- ')
      .replace(/ - ([A-Z])/g, '\n\n- $1')
      // Ensure numbered lists are on new lines
      .replace(/([.:]\s*)(\d+)\.\s+/g, '$1\n\n$2. ')
      // Ensure headers are on new lines
      .replace(/\s*(#{1,3})\s*/g, '\n\n$1 ')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  
  return (
    <div className={`formatted-text ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-white/95" style={{ letterSpacing: '0.01em' }}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-pink-400">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="not-italic font-medium text-purple-300">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="formatted-list my-3 space-y-2 list-none pl-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="formatted-list formatted-list-numbered my-3 space-y-2 list-none pl-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="formatted-list-item relative pl-6 text-white/95 leading-relaxed">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mt-4 mb-2 text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-3 mb-2 text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-2 text-purple-300">
              {children}
            </h3>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-purple-900/50 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-400 pl-3 my-3 italic text-purple-200">
              {children}
            </blockquote>
          ),
        }}
      >
        {processMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Split message to extract question for highlighting
 */
const splitMessageWithQuestion = (content) => {
  // DISABLED: Question extraction was causing issues where partial questions
  // like "?" were being shown separately. The question should stay inline
  // with the message text as part of the natural conversation flow.
  // Per MIRA_UNIVERSAL_RULES.md - Step 3 (CLARIFY) questions should be
  // part of the acknowledge/clarify flow, not extracted separately.
  return { mainText: content || '', questionText: '' };
};

/**
 * Get pillar icon
 */
const getPillarIcon = (pillar) => {
  const icons = {
    celebrate: '🎂',
    dine: '🍽️',
    stay: '🏨',
    travel: '✈️',
    care: '💊',
    enjoy: '🎾',
    fit: '🏃',
    learn: '🎓',
    shop: '🛒'
  };
  return icons[pillar] || '✨';
};

/**
 * Generate "Why for Pet" text - ENHANCED PERSONALIZATION
 * Shows the user WHY a product is recommended for their pet
 */
const generateWhyForPet = (product, pet) => {
  // If product already has a why_for_pet, use it
  if (product.why_for_pet) return product.why_for_pet;
  
  const productName = (product.name || '').toLowerCase();
  const petName = pet.name || 'your pet';
  const breed = (pet.breed || '').toLowerCase();
  const sensitivities = pet.sensitivities || [];
  const doggyAnswers = pet.doggy_soul_answers || {};
  
  // Priority 1: Check for allergies/sensitivities
  if (sensitivities.some(s => s.toLowerCase().includes('chicken'))) {
    if (!productName.includes('chicken')) {
      return `Chicken-free for ${petName}'s sensitivity`;
    }
  }
  
  if (sensitivities.some(s => s.toLowerCase().includes('grain'))) {
    if (productName.includes('grain-free') || productName.includes('grain free')) {
      return `Grain-free for ${petName}'s needs`;
    }
  }
  
  // Priority 2: Breed-specific recommendations
  if (breed.includes('golden') || breed.includes('retriever')) {
    if (productName.includes('hip') || productName.includes('joint')) {
      return `Great for ${petName}'s breed joint health`;
    }
  }
  
  if (breed.includes('shih tzu') || breed.includes('maltese') || breed.includes('poodle')) {
    if (productName.includes('eye') || productName.includes('tear')) {
      return `Perfect for ${petName}'s eye care needs`;
    }
    if (productName.includes('groom') || productName.includes('coat')) {
      return `Ideal for ${petName}'s beautiful coat`;
    }
  }
  
  if (breed.includes('labrador') || breed.includes('beagle')) {
    if (productName.includes('weight') || productName.includes('diet') || productName.includes('lite')) {
      return `Helps maintain ${petName}'s healthy weight`;
    }
  }
  
  // Priority 3: Age-specific
  const age = doggyAnswers.age || pet.age_years;
  if (age && (parseInt(age) >= 7 || (typeof age === 'string' && age.includes('senior')))) {
    if (productName.includes('senior') || productName.includes('mature') || productName.includes('joint')) {
      return `Formulated for ${petName}'s golden years`;
    }
  }
  
  // Priority 4: Product category fallbacks
  if (productName.includes('treat') || productName.includes('snack') || productName.includes('biscuit')) {
    return `A tasty reward ${petName} will love`;
  }
  
  if (productName.includes('shampoo') || productName.includes('brush') || productName.includes('groom')) {
    return `Keeps ${petName} looking beautiful`;
  }
  
  if (productName.includes('food') || productName.includes('kibble') || productName.includes('meal')) {
    return `Nutrition tailored for ${petName}`;
  }
  
  if (productName.includes('toy') || productName.includes('ball') || productName.includes('chew')) {
    return `Perfect for ${petName}'s playtime`;
  }
  
  if (productName.includes('bed') || productName.includes('crate') || productName.includes('blanket')) {
    return `Cozy comfort for ${petName}`;
  }
  
  // Default personalized message based on breed
  if (breed) {
    return `Perfect for ${breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}s`;
  }
  
  return `Selected for ${petName}'s profile`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC MESSAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * UserMessage Component - Softer, more elegant styling
 */
const UserMessage = ({ content, isOld = false }) => (
  <div className="mp-msg-user" data-testid="user-message">
    <div 
      className="mp-bubble-user" 
      style={{
        ...(isOld ? { fontSize: '13px' } : {}),
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.85) 100%)',
        borderRadius: '20px 20px 6px 20px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {content}
    </div>
  </div>
);

/**
 * SystemMessage Component
 */
const SystemMessage = ({ content }) => (
  <div style={{ textAlign: 'center', padding: '8px' }} data-testid="system-message">
    <span style={{ 
      fontSize: '12px', 
      color: 'rgba(255,255,255,0.5)', 
      background: 'rgba(255,255,255,0.1)', 
      padding: '4px 12px', 
      borderRadius: '12px' 
    }}>
      {content}
    </span>
  </div>
);

/**
 * TopicShiftIndicator Component
 */
const TopicShiftIndicator = () => (
  <div className="mp-topic-shift" data-testid="topic-shift">
    <div className="mp-topic-shift-line"></div>
    <span className="mp-topic-shift-label">
      <RefreshCw size={12} /> New Topic
    </span>
    <div className="mp-topic-shift-line"></div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA MESSAGE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiraMessageHeader Component
 * 
 * Includes C° and PICKS status indicators that:
 * - Light up (PULSE) when Mira has chosen something new
 * - Navigate to respective tabs when clicked (NO dropdown modals)
 * - Follow PET_OS_BEHAVIOR_BIBLE Section 2: Icon State System
 */
const MiraMessageHeader = ({ 
  msg, 
  pet, 
  miraPicks,
  // Icon states from useIconState hook (per Bible Section 2)
  picksState = { state: 'OFF', badge: null },
  conciergeState = { state: 'OFF', badge: null },
  // Handlers - navigate to tab, NOT open modal
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply,
  hapticFeedback
}) => {
  // Determine visual states for indicators
  const isPulsingPicks = picksState?.state === 'PULSE';
  const isOnPicks = picksState?.state === 'ON' || isPulsingPicks;
  const isPulsingConcierge = conciergeState?.state === 'PULSE';
  const isGlowingConcierge = conciergeState?.state === 'GLOW'; // NEW: Golden glow for Mira suggestions
  const isOnConcierge = conciergeState?.state === 'ON' || isPulsingConcierge || isGlowingConcierge;
  
  // Determine CSS class for concierge icon state
  const getConciergeStateClass = () => {
    if (isGlowingConcierge) return 'state-glow';
    if (isPulsingConcierge) return 'state-pulse';
    if (isOnConcierge) return 'state-on';
    return 'state-off';
  };
  
  return (
    <div className="mp-card-header">
      <div className="mp-mira-avatar"><Sparkles /></div>
      <span className="mp-mira-name">Mira</span>
      
      {/* Quick Reply Tiles - Restored */}
      {msg.quickReplies && msg.quickReplies.length > 0 && (
        <div className="mp-header-tiles">
          {msg.quickReplies.map((chip, cIdx) => (
            <button 
              key={cIdx} 
              onClick={() => { 
                hapticFeedback?.chipTap?.(); 
                onQuickReply(chip.value); 
              }} 
              className="mp-header-tile"
              data-testid={`header-tile-${cIdx}`}
            >
              {chip.text}
            </button>
          ))}
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          C° CONCIERGE INDICATOR - Status indicator per Bible Section 2
          - OFF: Dim/muted (no activity)
          - ON: Lit (threads exist)
          - PULSE: Animated green glow (unread replies - Concierge® responded!)
          - GLOW: Animated golden glow (Mira has actionable suggestion - CTA!)
          - Click: Navigate to CONCIERGE tab or open Quick Send modal if glowing
      ═══════════════════════════════════════════════════════════════════════ */}
      <button 
        className={`mp-header-concierge-icon ${getConciergeStateClass()}`}
        onClick={() => {
          hapticFeedback?.buttonTap?.();
          onShowConcierge?.(isGlowingConcierge ? conciergeState?.suggestionContext : null);
        }}
        title={conciergeState?.tooltip || 'Concierge®'}
        data-testid="header-concierge-btn"
      >
        <span className="mp-concierge-badge">C°</span>
        {conciergeState?.badge && (
          <span className="mp-concierge-count">{conciergeState.badge}</span>
        )}
      </button>
      
      {/* Insight Icon */}
      {(msg.data?.response?.tips?.length > 0 || msg.data?.insights?.length > 0) && (
        <button 
          className="mp-header-insight-icon"
          onClick={onShowInsights}
          title="View insights"
        >
          <PawPrint size={16} />
          <span className="mp-insight-count">
            {(msg.data?.response?.tips?.length || 0) + (msg.data?.insights?.length || 0)}
          </span>
        </button>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          PICKS INDICATOR - Status indicator per Bible Section 2
          - OFF: Dim/muted (no picks)
          - ON: Lit (picks exist)
          - PULSE: Animated glow (NEW picks - Mira chose something!)
          - Click: Navigate to PICKS tab (NO dropdown modal)
      ═══════════════════════════════════════════════════════════════════════ */}
      <button 
        className={`mp-header-picks-icon ${isPulsingPicks ? 'state-pulse' : ''} ${isOnPicks ? 'state-on' : 'state-off'}`}
        onClick={() => {
          hapticFeedback?.pickSelect?.();
          onShowPicks?.();
        }}
        title={picksState?.tooltip || `${pet.name}'s Picks`}
        data-testid="header-picks-btn"
      >
        <Gift size={18} className="mp-picks-gift" />
        {pet.photo ? (
          <img 
            src={pet.photo} 
            alt={pet.name}
            className="mp-picks-pet-face"
          />
        ) : (
          <div className="mp-picks-pet-face mp-picks-pet-fallback">
            <PawPrint size={10} />
          </div>
        )}
        {/* Show badge from icon state OR fallback to miraPicks count */}
        {(picksState?.badge || (miraPicks.products.length + miraPicks.services.length) > 0) && (
          <span className="mp-picks-count">
            {picksState?.badge || (miraPicks.products.length + miraPicks.services.length)}
          </span>
        )}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProductsGrid - REMOVED: Products now shown only in Top Bar PICKS panel
 * This keeps chat clean and focused on conversation.
 * Users see a subtle indicator to check their PICKS tab for recommendations.
 */
const ProductsGrid = ({ msg, pet, hapticFeedback, onShowPicks }) => {
  // ARCHITECTURE CHANGE: No longer showing products inline in chat
  // Products are curated in the PICKS layer (top bar) which is context-aware
  // This prevents irrelevant generic picks from cluttering the conversation
  return null;
};

/**
 * NearbyPlaces - Displays nearby pet-friendly places with Concierge® option
 * Uses the new PlacesWithConcierge component for better UX
 */
const NearbyPlaces = ({ msg, pet, onSendToConcierge }) => {
  if (!msg.data?.nearby_places?.places?.length) return null;
  
  const places = msg.data.nearby_places;
  const placeType = places.type;
  const petName = pet?.name || 'your pet';
  
  // Handler for concierge submission
  const handleConciergeSubmit = (conciergeData) => {
    if (onSendToConcierge) {
      onSendToConcierge({
        ...conciergeData,
        petName,
        requestType: placeType
      });
    }
  };
  
  return (
    <PlacesWithConcierge
      places={places.places}
      placeType={placeType}
      location={places.city || ''}
      petName={petName}
      petId={pet?.id}
      onSendToConcierge={handleConciergeSubmit}
    />
  );
};

/**
 * WeatherAdvisory - Displays weather info for pet activities
 */
const WeatherAdvisory = ({ msg }) => {
  if (!msg.data?.weather) return null;
  
  const weather = msg.data.weather;
  const safetyLevel = weather.pet_advisory?.safety_level || 'good';
  
  const getWeatherIcon = (level) => {
    const icons = {
      danger: '🔥',
      warning: '⚠️',
      caution: '☀️',
      good: '✨'
    };
    return icons[level] || '✨';
  };
  
  return (
    <div className={`weather-advisory-card weather-${safetyLevel}`} data-testid="weather-advisory">
      <div className="weather-advisory-header">
        <span className="weather-advisory-icon">{getWeatherIcon(safetyLevel)}</span>
        <span className="weather-advisory-title">
          {weather.current_weather?.temperature}°C in {weather.city}
        </span>
      </div>
      <div className="weather-advisory-message">
        {weather.pet_advisory?.walk_message}
      </div>
      {weather.suggested_activities?.length > 0 && (
        <div className="weather-activities">
          {weather.suggested_activities.slice(0, 3).map((activity, aIdx) => (
            <span key={aIdx} className="weather-activity">{activity}</span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TrainingVideos - Displays YouTube training videos
 */
const TrainingVideos = ({ msg, pet }) => {
  if (!msg.data?.training_videos?.length) return null;
  
  return (
    <div className="training-videos-section" data-testid="training-videos">
      <div className="training-videos-title">
        <span className="training-icon">📺</span>
        <span>Training Videos for {pet.name}</span>
      </div>
      <div className="training-videos-grid">
        {msg.data.training_videos.slice(0, 3).map((video, vIdx) => (
          <a 
            key={vIdx} 
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="training-video-card"
            data-testid={`video-card-${vIdx}`}
          >
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
              <div className="video-play-overlay">
                <Play size={24} fill="white" />
              </div>
            </div>
            <div className="video-info">
              <div className="video-title">{video.title?.substring(0, 60)}{video.title?.length > 60 ? '...' : ''}</div>
              <div className="video-channel">{video.channel}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

/**
 * TravelHotels - Displays pet-friendly hotels with FULL DETAILS
 * Enhanced: Expandable cards, all property types, pricing in INR, room options
 */
const TravelHotels = ({ msg, pet, onEngageConcierge }) => {
  const [expandedHotel, setExpandedHotel] = React.useState(null);
  
  if (!msg.data?.travel_hotels?.length) return null;
  
  const city = msg.data.travel_city;
  const currency = msg.data.currency || 'INR';
  
  const formatPrice = (price) => {
    if (!price) return null;
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };
  
  const getPropertyIcon = (type) => {
    const icons = {
      'Villa': '🏡',
      'Boutique Hotel': '✨',
      'Resort': '🌴',
      'Hostel': '🛏️',
      'Homestay': '🏠',
      'Serviced Apartment': '🏢',
      'Heritage Property': '🏰',
      'Lodge': '🏕️',
      'Hotel': '🏨'
    };
    return icons[type] || '🏨';
  };
  
  const toggleExpand = (hotelId) => {
    setExpandedHotel(expandedHotel === hotelId ? null : hotelId);
  };
  
  return (
    <div className="travel-hotels-section" data-testid="travel-hotels">
      <div className="travel-hotels-title">
        <span className="travel-icon">🏨</span>
        <span>
          Accommodations in {city?.charAt(0).toUpperCase() + city?.slice(1)}
          <span style={{ fontSize: '11px', marginLeft: '8px', opacity: 0.7 }}>
            ({msg.data.travel_hotels.length} options • All types • {currency})
          </span>
        </span>
      </div>
      
      {msg.data.travel_hotels.map((hotel, hIdx) => {
        const isExpanded = expandedHotel === hotel.id;
        const pricing = hotel.pricing || {};
        const location = hotel.location || {};
        const petFriendly = hotel.pet_friendly || {};
        const rooms = hotel.rooms || [];
        const propertyType = hotel.property_type || 'Hotel';
        
        return (
          <div 
            key={hIdx} 
            className={`travel-hotel-card ${isExpanded ? 'expanded' : ''}`}
            data-testid={`hotel-card-${hIdx}`}
          >
            {/* Main Card */}
            <div 
              className="hotel-card-main"
              onClick={() => toggleExpand(hotel.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`hotel-icon ${petFriendly.likelihood === 'high' ? 'pet-friendly' : ''}`}>
                {getPropertyIcon(propertyType)}
              </div>
              
              <div className="hotel-info">
                <div className="hotel-name-row">
                  <span className="hotel-name">{hotel.name}</span>
                  {hotel.star_rating && (
                    <span className="hotel-stars">
                      {'⭐'.repeat(Math.min(hotel.star_rating, 5))}
                    </span>
                  )}
                </div>
                
                <div className="hotel-type-badge">
                  <span className="property-type">{propertyType}</span>
                </div>
                
                <div className="hotel-details">
                  {petFriendly.likelihood === 'high' && (
                    <span className="hotel-badge pet-badge">🐾 Pet Friendly</span>
                  )}
                  {petFriendly.likelihood === 'medium' && (
                    <span className="hotel-badge verify-badge">🐾 Likely Pet Friendly</span>
                  )}
                  {hotel.distance?.value && (
                    <span className="hotel-distance">
                      {hotel.distance.value} {hotel.distance.unit || 'km'}
                    </span>
                  )}
                  {location.city && <span>{location.city}</span>}
                </div>
                
                {/* Pricing */}
                {pricing.min_price && (
                  <div className="hotel-pricing">
                    <span className="price-from">From</span>
                    <span className="price-amount">{formatPrice(pricing.min_price)}</span>
                    <span className="price-night">/night</span>
                    {pricing.max_price && pricing.max_price !== pricing.min_price && (
                      <span className="price-range"> - {formatPrice(pricing.max_price)}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="hotel-actions">
                <button 
                  className="hotel-expand-btn"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(hotel.id); }}
                >
                  {isExpanded ? '▲' : '▼'} {isExpanded ? 'Less' : 'More'}
                </button>
              </div>
            </div>
            
            {/* Expanded Details */}
            {isExpanded && (
              <div className="hotel-expanded-details">
                {/* Location */}
                {location.address && (
                  <div className="hotel-address">
                    <MapPin size={12} />
                    <span>{location.address}, {location.city}</span>
                  </div>
                )}
                
                {/* Amenities */}
                {hotel.amenities?.length > 0 && (
                  <div className="hotel-amenities">
                    <div className="amenities-title">Amenities:</div>
                    <div className="amenities-list">
                      {hotel.amenities.slice(0, 8).map((amenity, aIdx) => (
                        <span key={aIdx} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Room Options */}
                {rooms.length > 0 && (
                  <div className="hotel-rooms">
                    <div className="rooms-title">Room Options ({rooms.length}):</div>
                    {rooms.slice(0, 4).map((room, rIdx) => (
                      <div key={rIdx} className="room-option">
                        <div className="room-info">
                          <span className="room-type">{room.room_type}</span>
                          {room.board_type && room.board_type !== 'ROOM_ONLY' && (
                            <span className="room-board">
                              {room.board_type === 'BREAKFAST' ? '🍳 Breakfast included' :
                               room.board_type === 'HALF_BOARD' ? '🍽️ Half Board' :
                               room.board_type === 'FULL_BOARD' ? '🍽️ Full Board' :
                               room.board_type}
                            </span>
                          )}
                          {room.bed_type && (
                            <span className="room-bed">🛏️ {room.bed_type}</span>
                          )}
                        </div>
                        <div className="room-price">
                          <span className="price-total">{formatPrice(room.price?.total)}</span>
                          {room.price?.per_night && (
                            <span className="price-per-night">
                              ({formatPrice(room.price.per_night)}/night)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pet Policy Note */}
                {petFriendly.policy_note && (
                  <div className="hotel-pet-policy">
                    <span className="policy-icon">🐕</span>
                    <span>{petFriendly.policy_note}</span>
                  </div>
                )}
                
                {/* Book Button */}
                <button 
                  className="hotel-book-btn-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEngageConcierge?.('hotel_booking', {
                      hotel_name: hotel.name,
                      hotel_id: hotel.id,
                      city: location.city || city,
                      pet_name: pet.name,
                      property_type: propertyType,
                      check_in: msg.data.check_in,
                      check_out: msg.data.check_out,
                      pricing: pricing
                    });
                  }}
                  data-testid={`hotel-book-full-${hIdx}`}
                >
                  <Calendar size={14} /> Book with Concierge®
                </button>
                
                <div className="concierge-note">
                  Your Concierge® will verify pet policies and handle the booking.
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Show More */}
      {msg.data.travel_hotels.length > 5 && (
        <div className="hotels-show-more">
          Showing {Math.min(5, msg.data.travel_hotels.length)} of {msg.data.travel_hotels.length} options
        </div>
      )}
    </div>
  );
};

/**
 * TravelAttractions - Displays pet-friendly experiences
 */
const TravelAttractions = ({ msg }) => {
  if (!msg.data?.travel_attractions?.length) return null;
  
  const city = msg.data.travel_city;
  
  return (
    <div className="travel-attractions-section" data-testid="travel-attractions">
      <div className="travel-attractions-title">
        <span className="attractions-icon">🎯</span>
        <span>Pet-Friendly Experiences in {city?.charAt(0).toUpperCase() + city?.slice(1)}</span>
      </div>
      {msg.data.travel_attractions.slice(0, 3).map((attr, aIdx) => (
        <a 
          key={aIdx} 
          href={attr.booking_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="travel-attraction-card"
          data-testid={`attraction-card-${aIdx}`}
        >
          {attr.image_url && (
            <div className="attraction-image">
              <img src={attr.image_url} alt={attr.title} />
            </div>
          )}
          <div className="attraction-info">
            <div className="attraction-title">{attr.title?.substring(0, 50)}{attr.title?.length > 50 ? '...' : ''}</div>
            <div className="attraction-meta">
              {attr.rating && (
                <span className="attraction-rating">
                  <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {attr.rating.toFixed(1)}
                </span>
              )}
              {attr.duration && (
                <span className="attraction-duration">{attr.duration}</span>
              )}
              {attr.price_from && (
                <span className="attraction-price">From ₹{Math.round(attr.price_from)}</span>
              )}
            </div>
            {attr.is_outdoor && (
              <span className="attraction-badge outdoor-badge">🌿 Outdoor Activity</span>
            )}
          </div>
          <div className="attraction-book">
            Book <ArrowRight size={14} />
          </div>
        </a>
      ))}
    </div>
  );
};

/**
 * RememberedProviders - Shows past service providers
 */
const RememberedProviders = ({ msg, pet, onOpenServiceRequest }) => {
  if (!msg.data?.response?.remembered_providers?.length) return null;
  
  return (
    <div className="mp-remembered-providers" data-testid="remembered-providers">
      <p className="mp-remembered-intro">
        🕐 Based on {pet.name}'s history:
      </p>
      <div className="mp-remembered-list">
        {msg.data.response.remembered_providers.map((provider, pIdx) => (
          <button
            key={pIdx}
            onClick={() => onOpenServiceRequest?.({
              id: `remembered-${provider.provider_name}`,
              label: `Book ${provider.provider_name} again`,
              icon: '⭐',
              description: provider.notes || `Previously used for ${provider.service_type}`,
              color: '#F59E0B'
            }, false)}
            className="mp-remembered-card"
            data-testid={`remembered-provider-${pIdx}`}
          >
            <span className="mp-remembered-icon">⭐</span>
            <div className="mp-remembered-info">
              <span className="mp-remembered-name">{provider.provider_name}</span>
              <span className="mp-remembered-suggestion">{provider.suggested_message}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * ServiceCards - Service booking options
 */
const ServiceCards = ({ msg, onOpenServiceRequest }) => {
  if (!msg.showServices || !msg.detectedServices?.length) return null;
  
  const hasRemembered = msg.data?.response?.remembered_providers?.length > 0;
  
  return (
    <div className="mp-service-cards" data-testid="service-cards">
      <p className="mp-service-intro">
        {hasRemembered ? 'Or explore other options:' : 'Choose how you\'d like to proceed:'}
      </p>
      <div className="mp-service-grid">
        {msg.detectedServices.map((service, sIdx) => (
          <button
            key={sIdx}
            onClick={() => onOpenServiceRequest?.(service, false)}
            className={`mp-service-card ${service.isConcierge ? 'mp-concierge-card' : ''}`}
            style={{ '--service-color': service.color || '#A855F7' }}
            data-testid={`service-${service.id}`}
          >
            <span className="mp-service-icon">{service.icon}</span>
            <div className="mp-service-info">
              <span className="mp-service-label">{service.label}</span>
              <span className="mp-service-desc">{service.description}</span>
              {service.price && (
                <span className="mp-service-price">From ₹{service.price}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * ExperienceCards - Premium curated experiences
 */
const ExperienceCards = ({ msg, pet, onOpenServiceRequest }) => {
  if (!msg.showExperiences || !msg.detectedExperiences?.length) return null;
  
  return (
    <div className="mp-experience-cards" data-testid="experience-cards">
      <p className="mp-experience-intro">
        ✨ Curated experiences for {pet.name}:
      </p>
      <div className="mp-experience-grid">
        {msg.detectedExperiences.map((exp, eIdx) => (
          <button
            key={eIdx}
            onClick={() => onOpenServiceRequest?.(exp, true)}
            className="mp-experience-card"
            style={{ '--experience-color': exp.color }}
            data-testid={`experience-${exp.id}`}
          >
            <span className="mp-experience-icon">{exp.icon}</span>
            <div className="mp-experience-info">
              <span className="mp-experience-label">{exp.label}</span>
              <span className="mp-experience-desc">{exp.description}</span>
            </div>
            <span className="mp-experience-badge">Experience</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * DynamicConciergeRequest - REMOVED: Concierge® access now only via top bar
 * Users tap the C° icon in header or the CONCIERGE® tab in navigation
 */
const DynamicConciergeRequest = ({ msg, pet }) => {
  // ARCHITECTURE CHANGE: Removed to consolidate concierge entry points
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA MESSAGE BODY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiraMessageBody Component - Contains all card types
 */
const MiraMessageBody = ({ 
  msg, 
  pet,
  miraMode = 'ready',
  hapticFeedback,
  onEngageConcierge,
  onOpenServiceRequest,
  onShowPicks, // Handler to open PICKS panel
  onQuickReplyClick // Handler for quick reply chips (Phase 5)
}) => {
  const { mainText, questionText } = splitMessageWithQuestion(msg.content);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION CONTRACT (Phase 5) - Quick Replies
  // PRIORITY: Use contextual quick_replies over generic conversation_contract ones
  // This ensures conversational flow (e.g., "Stick with kibble") over navigational (e.g., "View in Services")
  // ═══════════════════════════════════════════════════════════════════════════
  const conversationContract = msg.data?.conversation_contract || msg.data?.response?.conversation_contract || {};
  
  // CRITICAL: Check for contextual quick_replies FIRST - these are conversational
  // Only fall back to conversation_contract.quick_replies (navigational) if no contextual ones exist
  const contextualReplies = Array.isArray(msg.data?.quick_replies) ? msg.data.quick_replies 
    : Array.isArray(msg.data?.response?.quick_replies) ? msg.data.response.quick_replies 
    : [];
  const contractReplies = Array.isArray(conversationContract.quick_replies) ? conversationContract.quick_replies : [];
  
  // Filter contract replies to remove purely navigational actions when contextual ones exist
  const filteredContractReplies = contextualReplies.length > 0 
    ? [] // Don't show contract replies when we have contextual ones
    : contractReplies.filter(r => 
        r && r.intent_type !== 'open_services' && 
        r.action !== 'open_layer' &&
        !r.label?.toLowerCase().includes('view in services')
      );
  
  // CRITICAL FIX: Use contextual replies when they exist, otherwise use filtered contract replies
  // This ensures Mira's question-specific chips (e.g., "Everyday training treats") are shown
  const quickReplies = contextualReplies.length > 0 
    ? contextualReplies.map(r => ({
        id: `qr-ctx-${Math.random().toString(36).substr(2, 9)}`,
        label: typeof r === 'string' ? r : r.label || r.text,
        payload_text: typeof r === 'string' ? r : (r.payload_text || r.value || r.label || r.text),
        intent_type: 'contextual_reply',
        action: 'none',
        action_args: {}
      }))
    : filteredContractReplies;
  const contractMode = conversationContract.mode || 'answer';
  
  // Check if message has context that warrants showing picks hint
  const hasTravelContext = msg.data?.response?.detected_destination || 
                           msg.data?.travel_info || 
                           msg.data?.os_context?.picks_context;
  const hasProductContext = msg.data?.response?.products?.length > 0 || 
                            msg.data?.os_context?.picks_update?.should_refresh;
  const shouldShowPicksHint = hasTravelContext || hasProductContext;
  
  return (
    <div className="mp-card-body">
      {/* Main Message Text */}
      {mainText && (
        <div className="mp-card-text">
          <FormattedText>{mainText}</FormattedText>
        </div>
      )}
      {questionText && (
        <div className="mp-question">
          <div className="mp-question-text">
            <FormattedText>{questionText}</FormattedText>
          </div>
        </div>
      )}
      
      {/* REMOVED: InlineConciergeCard - Users tap C° icon in header to reach Concierge® */}
      
      {/* REMOVED: ProductsGrid - Picks now only in top bar PICKS panel */}
      
      {/* Picks Hint - Subtle indicator to check PICKS tab */}
      {shouldShowPicksHint && onShowPicks && (
        <button 
          className="mp-picks-hint"
          onClick={() => { hapticFeedback?.pickSelect?.(); onShowPicks(); }}
          data-testid="picks-hint-btn"
        >
          <Gift size={14} />
          <span>View personalized picks for {pet?.name || 'your pet'}</span>
          <ChevronRight size={12} />
        </button>
      )}
      
      {/* Nearby Places */}
      <NearbyPlaces msg={msg} />
      
      {/* Weather Advisory */}
      <WeatherAdvisory msg={msg} />
      
      {/* Training Videos */}
      <TrainingVideos msg={msg} pet={pet} />
      
      {/* Travel Hotels */}
      <TravelHotels msg={msg} pet={pet} onEngageConcierge={onEngageConcierge} />
      
      {/* Travel Attractions */}
      <TravelAttractions msg={msg} />
      
      {/* Remembered Providers */}
      <RememberedProviders msg={msg} pet={pet} onOpenServiceRequest={onOpenServiceRequest} />
      
      {/* Service Cards */}
      <ServiceCards msg={msg} onOpenServiceRequest={onOpenServiceRequest} />
      
      {/* Experience Cards */}
      <ExperienceCards msg={msg} pet={pet} onOpenServiceRequest={onOpenServiceRequest} />
      
      {/* Dynamic Concierge® Request */}
      <DynamicConciergeRequest msg={msg} pet={pet} />
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          CONVERSATION CONTRACT (Phase 5) - Quick Reply Chips
          Deterministic rendering based on conversation_contract.quick_replies
          
          NOTE: Quick replies are shown in the HEADER only (per user decision).
          This body section is DISABLED to prevent duplicate quick replies.
          The header MiraMessageHeader component handles all quick reply display.
      ═══════════════════════════════════════════════════════════════════════════ */}
      {/* REMOVED: QuickReplyChips rendering - quick replies now only shown in header
      {quickReplies.length > 0 && onQuickReplyClick && (
        <QuickReplyChips
          quickReplies={quickReplies}
          onChipClick={onQuickReplyClick}
          contractMode={contractMode}
        />
      )}
      */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA MESSAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiraMessage Component - Full Mira response card
 */
const MiraMessage = ({ 
  msg, 
  pet, 
  miraPicks,
  miraMode,
  isOld = false,
  // Icon states (per Bible Section 2)
  picksState,
  conciergeState,
  hapticFeedback,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply,
  onEngageConcierge,
  onOpenServiceRequest
}) => {
  if (isOld) {
    // Simplified view for older messages
    return (
      <div className="mp-msg-mira" data-testid="mira-message-old">
        <div className="mp-card" style={{ padding: '12px' }}>
          <div className="mp-card-header" style={{ marginBottom: '8px' }}>
            <div className="mp-mira-avatar" style={{ width: '24px', height: '24px' }}>
              <Sparkles size={12} />
            </div>
            <span className="mp-mira-name" style={{ fontSize: '12px' }}>Mira</span>
          </div>
          <div className="mp-card-body" style={{ fontSize: '13px' }}>
            {msg.content?.substring(0, 200)}{msg.content?.length > 200 ? '...' : ''}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mp-msg-mira" data-testid="mira-message">
      <div className="mp-card">
        <MiraMessageHeader 
          msg={msg}
          pet={pet}
          miraPicks={miraPicks}
          picksState={picksState}
          conciergeState={conciergeState}
          onShowConcierge={onShowConcierge}
          onShowInsights={onShowInsights}
          onShowPicks={onShowPicks}
          onQuickReply={onQuickReply}
          hapticFeedback={hapticFeedback}
        />
        <MiraMessageBody 
          msg={msg} 
          pet={pet}
          miraMode={miraMode}
          hapticFeedback={hapticFeedback}
          onEngageConcierge={onEngageConcierge}
          onOpenServiceRequest={onOpenServiceRequest}
          onShowPicks={onShowPicks}
          onQuickReplyClick={(text, chip) => onQuickReply?.(text)}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ChatMessage - Main Export Component
 * Renders any type of message in the conversation
 */
const ChatMessage = ({ 
  msg, 
  index,
  pet, 
  miraPicks = { products: [], services: [] },
  miraMode = 'ready',
  isOld = false,
  // Icon states (per Bible Section 2)
  picksState,
  conciergeState,
  hapticFeedback,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply,
  onEngageConcierge,
  onOpenServiceRequest
}) => {
  // Topic shift indicator
  if (msg.type === 'topic_shift') {
    return <TopicShiftIndicator />;
  }
  
  // User message
  if (msg.type === 'user') {
    return <UserMessage content={msg.content} isOld={isOld} />;
  }
  
  // System message
  if (msg.type === 'system') {
    return <SystemMessage content={msg.content} />;
  }
  
  // Mira message (default)
  return (
    <MiraMessage 
      msg={msg}
      pet={pet}
      miraPicks={miraPicks}
      miraMode={miraMode}
      isOld={isOld}
      picksState={picksState}
      conciergeState={conciergeState}
      hapticFeedback={hapticFeedback}
      onShowConcierge={onShowConcierge}
      onShowInsights={onShowInsights}
      onShowPicks={onShowPicks}
      onQuickReply={onQuickReply}
      onEngageConcierge={onEngageConcierge}
      onOpenServiceRequest={onOpenServiceRequest}
    />
  );
};

export default ChatMessage;
export { 
  UserMessage, 
  SystemMessage, 
  MiraMessage, 
  TopicShiftIndicator, 
  ProductsGrid,
  NearbyPlaces,
  WeatherAdvisory,
  TrainingVideos,
  TravelHotels,
  TravelAttractions,
  ServiceCards,
  ExperienceCards,
  DynamicConciergeRequest,
  InlineConciergeCard
};
