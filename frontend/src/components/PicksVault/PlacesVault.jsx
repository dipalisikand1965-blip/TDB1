/**
 * PLACES VAULT - Pet-Friendly Locations
 * =======================================
 * Restaurants, Hotels, Parks, Cafes, Beaches
 * Same plumbing: Notification → Ticket → Inbox
 */

import React, { useState, useCallback } from 'react';
import { 
  Check, X, MapPin, Star, Navigation, Phone,
  Utensils, Hotel, Trees, Coffee, Waves
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import './PlacesVault.css';

// Use centralized haptic utility for iOS + Android support
const haptic = {
  light: () => hapticFeedback.buttonTap(),
  selection: () => hapticFeedback.productSelect(),
  success: () => hapticFeedback.success()
};

const PLACE_ICONS = {
  restaurant: Utensils,
  hotel: Hotel,
  park: Trees,
  cafe: Coffee,
  beach: Waves
};

const PLACE_COLORS = {
  restaurant: '#f97316',
  hotel: '#8b5cf6',
  park: '#22c55e',
  cafe: '#6366f1',
  beach: '#3b82f6'
};

const PlacesVault = ({
  places = [],
  placeType = 'restaurant',
  location = '',
  pet = {},
  pillar = 'enjoy',
  onSendToConcierge,
  onRefresh,
  onClose
}) => {
  const [selectedPlaces, setSelectedPlaces] = useState(new Set());
  const [needReservation, setNeedReservation] = useState(false);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const IconComponent = PLACE_ICONS[placeType] || MapPin;
  const placeColor = PLACE_COLORS[placeType] || '#a855f7';

  const toggleSelect = useCallback((placeId) => {
    haptic.selection();
    setSelectedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  }, []);

  const handleSendToConcierge = useCallback(async () => {
    haptic.success();
    setIsSending(true);
    
    const selectedPlacesList = places.filter(p => selectedPlaces.has(p.id || p.name));
    
    try {
      if (onSendToConcierge) {
        await onSendToConcierge({
          vault_type: 'places',
          place_type: placeType,
          location,
          selected_places: selectedPlacesList,
          shown_places: places,
          need_reservation: needReservation,
          reservation_details: needReservation ? {
            date: reservationDate,
            time: reservationTime,
            party_size: partySize
          } : null,
          pet,
          pillar
        });
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to send places:', error);
    } finally {
      setIsSending(false);
    }
  }, [places, selectedPlaces, placeType, location, needReservation, reservationDate, reservationTime, partySize, pet, pillar, onSendToConcierge]);

  const handleClose = useCallback(() => {
    haptic.light();
    if (onClose) onClose();
  }, [onClose]);

  if (showConfirmation) {
    return (
      <div className="plv-container" data-testid="places-vault-confirmation">
        <div className="plv-confirmation">
          <div className="plv-confirmation-icon" style={{ background: placeColor }}>
            <Check size={48} />
          </div>
          <h2>Places Sent</h2>
          <p>Your Pet Concierge® will help with {needReservation ? 'reservations' : 'recommendations'}</p>
          <div className="plv-confirmation-actions">
            <button className="plv-btn plv-btn-primary" onClick={handleClose}>
              Continue Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plv-container" data-testid="places-vault">
      {/* Header */}
      <div className="plv-header">
        <div className="plv-header-left">
          <div className="plv-icon-badge" style={{ background: placeColor }}>
            <IconComponent size={24} />
          </div>
          <div className="plv-header-text">
            <h2>Pet-Friendly {placeType.charAt(0).toUpperCase() + placeType.slice(1)}s</h2>
            <p>{location || 'Near you'}</p>
          </div>
        </div>
        <button className="plv-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      {/* Places List */}
      <div className="plv-content">
        <div className="plv-places-list">
          {places.map((place, idx) => {
            const placeId = place.id || place.name;
            const isSelected = selectedPlaces.has(placeId);
            
            return (
              <div 
                key={placeId || idx}
                className={`plv-place-item ${isSelected ? 'plv-place-selected' : ''}`}
                data-testid={`places-item-${idx}`}
              >
                <div className="plv-place-image">
                  {place.image ? (
                    <img src={place.image} alt={place.name} />
                  ) : (
                    <div className="plv-place-placeholder">
                      <IconComponent size={32} />
                    </div>
                  )}
                  {place.pet_friendly_rating && (
                    <div className="plv-pet-badge">🐾 {place.pet_friendly_rating}</div>
                  )}
                </div>

                <div className="plv-place-info">
                  <span className="plv-place-name">{place.name}</span>
                  <div className="plv-place-meta">
                    {place.rating && (
                      <span className="plv-place-rating">
                        <Star size={12} fill="#fbbf24" color="#fbbf24" /> {place.rating}
                      </span>
                    )}
                    {place.distance && (
                      <span className="plv-place-distance">
                        <Navigation size={12} /> {place.distance}
                      </span>
                    )}
                  </div>
                  {place.pet_policy && (
                    <span className="plv-place-policy">{place.pet_policy}</span>
                  )}
                </div>

                <button
                  className={`plv-select-btn ${isSelected ? 'plv-select-btn-active' : ''}`}
                  onClick={() => toggleSelect(placeId)}
                  data-testid={`places-select-${idx}`}
                >
                  {isSelected ? <Check size={20} /> : <span>+</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Reservation Option */}
        <div className="plv-reservation-option">
          <button
            className={`plv-reservation-toggle ${needReservation ? 'plv-active' : ''}`}
            onClick={() => setNeedReservation(!needReservation)}
          >
            <div className={`plv-checkbox ${needReservation ? 'plv-checked' : ''}`}>
              {needReservation && <Check size={14} />}
            </div>
            <span>I need help with reservation</span>
          </button>
        </div>

        {/* Reservation Details */}
        {needReservation && (
          <div className="plv-reservation-fields">
            <div className="plv-field-row">
              <input
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                placeholder="Date"
              />
              <input
                type="time"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                placeholder="Time"
              />
            </div>
            <select
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            >
              <option value="1">1 person + pet</option>
              <option value="2">2 people + pet</option>
              <option value="3">3 people + pet</option>
              <option value="4">4 people + pet</option>
              <option value="5+">5+ people + pet</option>
            </select>
          </div>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button className="plv-refresh-btn" onClick={onRefresh}>
            Show More Places
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="plv-footer">
        <div className="plv-footer-message">
          <span className="plv-concierge-icon">C°</span>
          <div className="plv-footer-text">
            <span className="plv-footer-title">Your Concierge® knows the best spots</span>
            <span className="plv-footer-subtitle">
              We'll ensure {pet?.name || 'your pet'} is welcome and comfortable.
            </span>
          </div>
        </div>

        <button
          className="plv-send-btn"
          onClick={handleSendToConcierge}
          disabled={isSending}
          data-testid="places-send"
        >
          {isSending ? 'Sending...' : `Send to Concierge® ${selectedPlaces.size > 0 ? `(${selectedPlaces.size})` : ''}`}
        </button>
      </div>
    </div>
  );
};

export default PlacesVault;
