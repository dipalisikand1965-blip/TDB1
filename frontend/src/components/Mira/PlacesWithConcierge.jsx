/**
 * PlacesWithConcierge - Shows Google Places results with Concierge® handoff option
 * ================================================================================
 * This is NOT a chatbot dump - it's a curated recommendation with:
 * - Beautiful place cards (clickable for details)
 * - Concierge® button if user isn't satisfied
 * - Styled like the Send to Concierge® modal
 */

import React, { useState } from 'react';
import { Star, MapPin, Phone, Clock, MessageSquare, ChevronRight, Check, X } from 'lucide-react';

/**
 * Individual Place Card - Clickable to expand/select
 */
const PlaceCard = ({ place, isSelected, onSelect, onViewDetails }) => {
  return (
    <div 
      className={`place-recommendation-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(place)}
      data-testid={`place-card-${place.place_id || place.name}`}
      style={{
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
          : 'rgba(30, 20, 50, 0.6)',
        border: isSelected ? '2px solid #EC4899' : '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Place Name */}
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#fff',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isSelected && <Check size={16} color="#EC4899" />}
            {place.name}
          </div>
          
          {/* Rating & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            {place.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                {place.rating}
                {place.user_ratings_total && (
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>({place.user_ratings_total})</span>
                )}
              </span>
            )}
            {place.is_open_now !== undefined && (
              <span style={{ 
                color: place.is_open_now ? '#22c55e' : '#ef4444',
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                <Clock size={12} />
                {place.is_open_now ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>
          
          {/* Address */}
          {place.address && (
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(255,255,255,0.5)', 
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MapPin size={11} />
              {place.address.length > 50 ? place.address.substring(0, 50) + '...' : place.address}
            </div>
          )}
        </div>
        
        {/* Call Button */}
        {place.phone && (
          <a 
            href={`tel:${place.phone}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#A78BFA',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            <Phone size={12} /> Call
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * Main Component - Places with Concierge® Handoff
 */
const PlacesWithConcierge = ({ 
  places = [], 
  placeType = 'restaurants',
  location = '',
  petName = 'your pet',
  petId = null,
  onSendToConcierge,
  onClose
}) => {
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showConciergeForm, setShowConciergeForm] = useState(false);
  
  const getTypeLabel = (type) => {
    const labels = {
      restaurants: 'Pet-Friendly Restaurants',
      vet_clinics: 'Veterinary Clinics',
      dog_parks: 'Dog Parks',
      stays: 'Pet-Friendly Stays',
      hotels: 'Pet-Friendly Hotels',
      pet_stores: 'Pet Stores',
      groomers: 'Pet Groomers',
      cafes: 'Pet-Friendly Cafés'
    };
    return labels[type] || 'Recommended Places';
  };
  
  const togglePlaceSelection = (place) => {
    setSelectedPlaces(prev => {
      const exists = prev.find(p => p.name === place.name);
      if (exists) {
        return prev.filter(p => p.name !== place.name);
      }
      return [...prev, place];
    });
  };
  
  const handleConciergeSubmit = () => {
    if (onSendToConcierge) {
      onSendToConcierge({
        places: selectedPlaces,
        placeType,
        location,
        petId,
        notes: additionalNotes,
        timestamp: new Date().toISOString()
      });
    }
    setShowConciergeForm(false);
  };
  
  return (
    <div 
      className="places-with-concierge"
      data-testid="places-with-concierge"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(45, 25, 70, 0.95) 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={18} color="white" />
          </div>
          <div>
            <div style={{ color: '#F472B6', fontWeight: '700', fontSize: '15px' }}>
              {getTypeLabel(placeType)}
            </div>
            {location && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                in {location}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Intro Text */}
      <div style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: '14px',
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        Here are my top picks for {petName}. Tap to select any you'd like help booking:
      </div>
      
      {/* Place Cards */}
      <div style={{ marginBottom: '16px' }}>
        {places.slice(0, 4).map((place, idx) => (
          <PlaceCard 
            key={place.place_id || idx}
            place={place}
            isSelected={selectedPlaces.some(p => p.name === place.name)}
            onSelect={togglePlaceSelection}
          />
        ))}
      </div>
      
      {/* Concierge® Section */}
      {!showConciergeForm ? (
        <div style={{
          background: 'rgba(236, 72, 153, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px dashed rgba(236, 72, 153, 0.4)'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            marginBottom: '12px',
            lineHeight: '1.5'
          }}>
            Not quite what you're looking for? Our Pet Concierge® team can curate personalized recommendations just for {petName}.
          </div>
          <button
            onClick={() => setShowConciergeForm(true)}
            data-testid="open-concierge-form"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={16} />
            Send to Concierge®
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        /* Concierge® Form */
        <div style={{
          background: 'rgba(30, 20, 50, 0.8)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(236, 72, 153, 0.4)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={20} color="white" />
            </div>
            <div>
              <div style={{ color: '#F472B6', fontWeight: '700', fontSize: '16px' }}>
                Send to Concierge®
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                For {petName}
              </div>
            </div>
          </div>
          
          {/* Selected Places Summary */}
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            marginBottom: '12px'
          }}>
            Your concierge will receive {selectedPlaces.length > 0 ? `these ${selectedPlaces.length} picks` : 'your request'} and reach out to help you:
          </div>
          
          {selectedPlaces.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {selectedPlaces.map((place, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '14px',
                    marginBottom: '6px'
                  }}
                >
                  <Check size={14} color="#22c55e" />
                  {place.name}
                </div>
              ))}
            </div>
          )}
          
          {/* Additional Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Anything else? (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any specific requests or details..."
              data-testid="concierge-notes-input"
              style={{
                width: '100%',
                minHeight: '80px',
                background: 'rgba(30, 20, 50, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowConciergeForm(false)}
              style={{
                flex: 1,
                background: 'rgba(107, 114, 128, 0.3)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConciergeSubmit}
              data-testid="confirm-concierge-btn"
              style={{
                flex: 1.5,
                background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ChevronRight size={16} />
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesWithConcierge;
