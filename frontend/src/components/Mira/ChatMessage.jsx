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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FormattedText - Renders markdown text with proper styling
 */
const FormattedText = ({ children, className = '' }) => {
  if (!children) return null;
  
  return (
    <div className={`formatted-text ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ color: 'var(--mp-gold, #D4AF37)' }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
          ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Split message to extract question for highlighting
 */
const splitMessageWithQuestion = (content) => {
  if (!content) return { mainText: '', questionText: '' };
  
  // Find the last complete question sentence
  // Look for the last sentence that ends with "?"
  const sentences = content.split(/(?<=[.!?])\s+/);
  
  // Find the last sentence that ends with a question mark
  let lastQuestionIndex = -1;
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].trim().endsWith('?')) {
      lastQuestionIndex = i;
      break;
    }
  }
  
  // If no question found, or it's the entire message, return as-is
  if (lastQuestionIndex === -1 || lastQuestionIndex === 0) {
    return { mainText: content, questionText: '' };
  }
  
  // Split into main text and question
  const mainText = sentences.slice(0, lastQuestionIndex).join(' ').trim();
  const questionText = sentences.slice(lastQuestionIndex).join(' ').trim();
  
  // Only split if the question is a reasonable length (avoid extracting just "?")
  if (questionText.length < 10 || questionText === '?') {
    return { mainText: content, questionText: '' };
  }
  
  return { mainText, questionText };
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
 * Generate "Why for Pet" text
 */
const generateWhyForPet = (product, pet) => {
  if (product.why_for_pet) return product.why_for_pet;
  const reasons = [
    `Perfect for ${pet.breed || 'your pet'}`,
    `Great for ${pet.name}'s lifestyle`,
    `Recommended for ${pet.name}`,
    `Curated for ${pet.name}`
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
};

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC MESSAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * UserMessage Component
 */
const UserMessage = ({ content, isOld = false }) => (
  <div className="mp-msg-user" data-testid="user-message">
    <div 
      className="mp-bubble-user" 
      style={isOld ? { fontSize: '13px' } : {}}
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
 */
const MiraMessageHeader = ({ 
  msg, 
  pet, 
  miraPicks,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply,
  hapticFeedback
}) => (
  <div className="mp-card-header">
    <div className="mp-mira-avatar"><Sparkles /></div>
    <span className="mp-mira-name">Mira</span>
    
    {/* Quick Reply Tiles */}
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
    
    {/* Concierge Help Button */}
    <button 
      className="mp-header-help"
      onClick={() => { hapticFeedback?.buttonTap?.(); onShowConcierge(); }}
    >
      C° <span>Need help? Tap here</span> <ChevronRight size={12} />
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
    
    {/* Picks Icon */}
    <button 
      className="mp-header-picks-icon"
      onClick={() => { hapticFeedback?.trayOpen?.(); onShowPicks(); }}
      title={`${pet.name}'s Picks`}
    >
      <div className="mp-picks-gift">
        <Gift size={18} />
      </div>
      {pet.photo ? (
        <img 
          src={pet.photo} 
          alt={pet.name}
          className="mp-picks-pet-face"
        />
      ) : (
        <div className="mp-picks-paw">
          <PawPrint size={12} />
        </div>
      )}
      {(miraPicks.products.length + miraPicks.services.length) > 0 && (
        <span className="mp-picks-count">
          {miraPicks.products.length + miraPicks.services.length}
        </span>
      )}
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DATA CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProductsGrid - Displays product recommendations
 */
const ProductsGrid = ({ msg, pet, hapticFeedback }) => {
  if (!msg.showProducts || !msg.data?.response?.products?.length) return null;
  
  const pillar = msg.data?.response?.pillar || msg.data?.current_pillar;
  
  return (
    <div className="mp-products mp-products-catalog" data-testid="products-catalog">
      <div className="mp-products-catalog-header">
        <div className="mp-products-catalog-left">
          {pet.photo && (
            <img 
              src={pet.photo} 
              alt={pet.name}
              className="mp-products-pet-photo"
            />
          )}
          <div>
            <p className="mp-products-title">
              <span className="pet-name">{pet.name}'s</span> Picks
            </p>
            {pillar && (
              <span className="mp-products-pillar-badge">
                <span className="mp-products-pillar-icon">{getPillarIcon(pillar)}</span>
                {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
              </span>
            )}
          </div>
        </div>
        
        {pillar && (
          <a 
            href={`/${pillar === 'shop' ? 'shop' : pillar}`}
            className="mp-see-more-btn"
            data-testid="see-more-btn"
          >
            See More <ArrowRight />
          </a>
        )}
      </div>
      
      <div className="mp-products-grid">
        {msg.data.response.products.slice(0, 4).map((product, pIdx) => (
          <div key={pIdx} className="mp-product-tile" data-testid={`product-tile-${pIdx}`}>
            {product.match_type && (
              <span className={`mp-product-match-badge ${product.match_type}`}>
                {product.match_type === 'breed' ? `🐕 ${pet.breed?.split(' ')[0] || 'Breed'} match` :
                 product.match_type === 'pillar' ? '✨ Context match' :
                 '✓ For ' + pet.name}
              </span>
            )}
            
            <div className="mp-product-img-wrapper">
              <img 
                src={product.image || product.images?.[0] || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop`} 
                alt={product.name} 
                className="mp-product-img"
                loading="lazy"
              />
            </div>
            <div className="mp-product-content">
              <p className="mp-product-name">{product.name || product.suggestion}</p>
              {product.price && <p className="mp-product-price">₹{product.price}</p>}
              
              <div className="mp-why-for-pet">
                <span className="mp-why-icon">💡</span>
                <span className="mp-why-text">
                  {generateWhyForPet(product, pet)}
                </span>
              </div>
              
              {product.concierge_whisper && (
                <div className="mp-concierge-whisper">
                  <span className="mp-whisper-badge">C°</span>
                  <span className="mp-whisper-text">{product.concierge_whisper}</span>
                </div>
              )}
              
              <button 
                className="mp-product-add mp-send-concierge"
                onClick={() => { 
                  hapticFeedback?.productSelect?.(); 
                  console.log(`[PICKS] Added ${product.name} to Concierge picks`);
                }}
                data-testid={`add-product-${pIdx}`}
              >
                <ShoppingBag /> Pick
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {msg.data.response.products.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a 
            href={`/${pillar || 'shop'}`}
            className="mp-see-more-btn"
            style={{ display: 'inline-flex' }}
          >
            View all {msg.data.response.products.length} products <ArrowRight />
          </a>
        </div>
      )}
      
      <div className="mp-concierge-curation-message" data-testid="concierge-curation-msg">
        <div className="curation-icon">C°</div>
        <p>Your pet Concierge® will review these picks and curate something special for {pet.name}.</p>
      </div>
    </div>
  );
};

/**
 * NearbyPlaces - Displays nearby pet-friendly places
 */
const NearbyPlaces = ({ msg }) => {
  if (!msg.data?.nearby_places?.places?.length) return null;
  
  const places = msg.data.nearby_places;
  const placeType = places.type;
  
  const getPlaceIcon = (type) => {
    const icons = {
      vet_clinics: '🏥',
      restaurants: '🍽️',
      dog_parks: '🌳',
      stays: '🏨',
      pet_stores: '🛍️'
    };
    return icons[type] || '📍';
  };
  
  const getPlaceTitle = (type) => {
    const titles = {
      vet_clinics: '🏥 Nearby Vet Clinics',
      restaurants: '🍽️ Pet-Friendly Restaurants',
      dog_parks: '🌳 Dog Parks',
      stays: '🏨 Pet-Friendly Stays',
      pet_stores: '🛍️ Pet Stores'
    };
    return titles[type] || '📍 Nearby Places';
  };
  
  return (
    <div className="nearby-places-section" data-testid="nearby-places">
      <div className="nearby-places-title">
        <MapPin size={14} />
        <span>
          {getPlaceTitle(placeType)}
          {places.city && ` in ${places.city}`}
        </span>
      </div>
      
      {places.places.slice(0, 3).map((place, pIdx) => (
        <div key={pIdx} className="nearby-place-card" data-testid={`place-card-${pIdx}`}>
          <div className={`place-icon ${place.is_emergency || place.is_24_hours ? 'emergency' : ''}`}>
            {getPlaceIcon(placeType)}
          </div>
          <div className="place-info">
            <div className="place-name">{place.name}</div>
            <div className="place-details">
              {place.rating && (
                <span className="place-rating">
                  <Star size={10} fill="#f59e0b" /> {place.rating}
                </span>
              )}
              {place.is_24_hours && (
                <span className="place-badge emergency-badge">24/7</span>
              )}
              {place.is_open_now === true && (
                <span className="place-badge">Open Now</span>
              )}
              {place.area && <span>{place.area}</span>}
            </div>
          </div>
          {place.phone && (
            <a 
              href={`tel:${place.phone}`} 
              className="place-phone"
              onClick={(e) => e.stopPropagation()}
              data-testid={`call-place-${pIdx}`}
            >
              <Phone size={12} /> Call
            </a>
          )}
        </div>
      ))}
      
      {places.places[0] && (
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(places.places[0].name + ' ' + (places.places[0].address || places.city))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="directions-btn"
          data-testid="get-directions-btn"
        >
          <Navigation size={14} /> Get Directions to {places.places[0].name?.split(' ').slice(0, 2).join(' ')}
        </a>
      )}
    </div>
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
 * DynamicConciergeRequest - For requests without direct match
 */
const DynamicConciergeRequest = ({ msg, pet }) => {
  if (!msg.dynamicConciergeRequest) return null;
  
  return (
    <div className="mp-dynamic-request" data-testid="dynamic-concierge-request">
      <p className="mp-dynamic-intro">
        Let your pet Concierge® handle this for {pet.name}:
      </p>
      <div 
        className="mp-dynamic-card"
        style={{ '--request-color': msg.dynamicConciergeRequest.color }}
      >
        <span className="mp-dynamic-icon">{msg.dynamicConciergeRequest.icon}</span>
        <div className="mp-dynamic-info">
          <span className="mp-dynamic-label">{msg.dynamicConciergeRequest.label}</span>
          <span className="mp-dynamic-desc">{msg.dynamicConciergeRequest.description}</span>
        </div>
        <span className="mp-dynamic-badge">Concierge® Request</span>
      </div>
    </div>
  );
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
  onOpenServiceRequest
}) => {
  const { mainText, questionText } = splitMessageWithQuestion(msg.content);
  
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
      
      {/* Products Grid */}
      <ProductsGrid msg={msg} pet={pet} hapticFeedback={hapticFeedback} />
      
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
      
      {/* Dynamic Concierge Request */}
      <DynamicConciergeRequest msg={msg} pet={pet} />
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
  DynamicConciergeRequest
};
