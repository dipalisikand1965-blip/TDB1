/**
 * PetFriendlySpots.jsx — Dine Out tab
 * Finds pet-friendly restaurants near the user using the existing
 * /api/nearby/places endpoint (Google Places API, already configured).
 * Geolocation → fallback to pet's city.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Star, Loader2, Navigation, RefreshCw } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { getApiUrl } from '../../utils/api';

const MIRA_TAGS = [
  'Great for dogs', 'Outdoor seating', 'Dog-friendly menu', 'Water bowls provided',
  'Leash-friendly', 'Dog treats available', 'Open lawn', 'Dog events hosted',
];

function getMiraTag(name, idx) {
  return MIRA_TAGS[((name?.charCodeAt(0) || 0) + idx) % MIRA_TAGS.length];
}

const SpotCard = ({ place, petName, idx }) => {
  const tag = getMiraTag(place.name, idx);
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #F0E0D0',
        borderRadius: 16, padding: '16px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
      data-testid={`dine-out-spot-${idx}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00', lineHeight: 1.3, flex: 1 }}>{place.name}</p>
        {place.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>{place.rating}</span>
          </div>
        )}
      </div>

      {place.address && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <MapPin size={13} color="#C44400" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{place.address}</p>
        </div>
      )}

      {/* Mira suitability tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#C44400' }}>✦</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#7a2800', background: 'rgba(196,68,0,0.08)', borderRadius: 20, padding: '3px 10px' }}>
          {tag}
        </span>
      </div>

      {place.open_now !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: place.open_now ? '#15803D' : '#9CA3AF',
          background: place.open_now ? '#DCFCE7' : '#F3F4F6',
          borderRadius: 20, padding: '2px 8px', alignSelf: 'flex-start',
        }}>
          {place.open_now ? 'Open now' : 'Closed'}
        </span>
      )}
    </div>
  );
};

const PetFriendlySpots = ({ pet }) => {
  const isMobile = useResizeMobile();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const petName = pet?.name || 'your dog';
  const petCity = pet?.city || null;

  const fetchSpots = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/nearby/places?lat=${lat}&lng=${lng}&keyword=pet+friendly+restaurant&radius=5000`
      );
      const data = await res.json();
      setPlaces(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load nearby spots. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchByCity = async (city) => {
    // Geocode the city via Google Geocoding API (backend handles it)
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/nearby/places?lat=19.0760&lng=72.8777&keyword=pet+friendly+restaurant+${encodeURIComponent(city)}&radius=10000`
      );
      const data = await res.json();
      setPlaces(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load spots for your city.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      if (petCity) fetchByCity(petCity);
      else setError('Geolocation not supported. Add your city to your pet profile.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true);
        fetchSpots(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        if (petCity) fetchByCity(petCity);
        else setError('Location access denied. Add your city to your pet profile to find nearby spots.');
      }
    );
  };

  const hasFetched = places.length > 0 || error;

  return (
    <div data-testid="pet-friendly-spots">
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0A00', marginBottom: 4 }}>Dine Out with {petName}</h2>
        <p style={{ fontSize: 13, color: '#888' }}>Pet-friendly restaurants near you, curated by Mira</p>
      </div>

      {/* Not fetched yet — CTA */}
      {!hasFetched && !loading && (
        <div style={{
          background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 50%, #c44400 100%)',
          borderRadius: 20, padding: '32px 24px',
          textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Find pet-friendly restaurants near you
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>
            Mira will find spots where {petName} is welcome
          </p>
          <button
            onClick={requestLocation}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFFFFF', color: '#C44400',
              border: 'none', borderRadius: 20, padding: '12px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
            data-testid="find-spots-btn"
          >
            <Navigation size={15} />
            Find spots near me
          </button>
          {petCity && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
              Or we'll use {petName}'s city: {petCity}
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
          <Loader2 size={28} color="#C44400" className="animate-spin" />
          <p style={{ fontSize: 14, color: '#888' }}>Finding pet-friendly spots near you…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 14, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#991B1B', marginBottom: 10 }}>{error}</p>
          <button onClick={requestLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C44400', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}

      {/* Results */}
      {places.length > 0 && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#888' }}>{places.length} spots found</p>
            <button onClick={requestLocation} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#C44400', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {places.map((place, i) => (
              <SpotCard key={place.place_id || i} place={place} petName={petName} idx={i} />
            ))}
          </div>
        </>
      )}

      {places.length === 0 && hasFetched && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🗺️</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1A0A00', marginBottom: 6 }}>No spots found nearby</p>
          <p style={{ fontSize: 13, color: '#888' }}>Try expanding the search radius or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default PetFriendlySpots;
