/**
 * NearbyPlacesCarousel - Shows real nearby pet-friendly venues
 * 
 * Fetches data from Google Places API via our backend
 * and displays with ratings, distances, and CTA buttons.
 */
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Clock, ExternalLink, Phone, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';

const NearbyPlacesCarousel = ({ 
  pillar = 'dine',
  petId,
  petName = 'your pet',
  token,
  places: externalPlaces,
  title,
  subtitle,
  loading: externalLoading = false,
  onReserveClick,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const usingExternalPlaces = Array.isArray(externalPlaces);

  useEffect(() => {
    if (usingExternalPlaces) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchNearbyPlaces = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/mira/location-suggestions/${pillar}${petId ? `?pet_id=${petId}` : ''}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setData(result);
          } else {
            setError(result.error || 'Could not fetch nearby places');
          }
        }
      } catch (err) {
        console.error('[NEARBY] Error fetching places:', err);
        setError('Could not load nearby places');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [pillar, petId, token, usingExternalPlaces]);

  const handleReserve = (place) => {
    if (onReserveClick) {
      onReserveClick(place);
    } else {
      // Default: Create a concierge ticket for reservation
      console.log('[NEARBY] Reserve clicked:', place);
    }
  };

  const resolvedLoading = usingExternalPlaces ? externalLoading : loading;
  const places = usingExternalPlaces
    ? externalPlaces
    : (pillar === 'dine' 
      ? [...(data?.nearby_restaurants || []), ...(data?.nearby_parks || [])]
      : [...(data?.nearby_bakeries || []), ...(data?.nearby_parks || [])]);

  if (resolvedLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title || 'Nearby Pet-Friendly Spots'}</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!usingExternalPlaces && (error || !data)) {
    return null; // Silently fail - don't show if no location
  }

  if (places.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || `Nearby in ${data?.city || 'Your Area'}`}
            </h3>
            <p className="text-xs text-gray-500">
              {subtitle || `Pet-friendly spots within ${data?.search_radius_km || 5}km`}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
          <MapPin className="w-3 h-3 mr-1" />
          {places.length} found
        </Badge>
      </div>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {places.slice(0, 6).map((place, index) => (
          <div
            key={place.id || index}
            className="min-w-[300px] max-w-[300px] bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex-shrink-0"
          >
            {/* Place Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 line-clamp-1">
                  {place.name}
                </h4>
                {place.rating && (
                  <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{place.rating}</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                {place.address || 'Address available on request'}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                {place.distance_km && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.distance_km} km
                  </span>
                )}
                {place.is_open !== null && place.is_open !== undefined && (
                  <span className={`flex items-center gap-1 ${place.is_open ? 'text-emerald-600' : 'text-red-500'}`}>
                    <Clock className="w-3 h-3" />
                    {place.is_open ? 'Open now' : 'Closed'}
                  </span>
                )}
                {place.review_count > 0 && (
                  <span className="text-gray-400">
                    ({place.review_count} reviews)
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleReserve(place)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm h-9"
                data-testid={`reserve-btn-${index}`}
              >
                Reserve via Concierge
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}

        {/* "More" card */}
        {places.length > 6 && (
          <div className="min-w-[200px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
            <div className="text-center p-4">
              <p className="text-sm text-gray-600 mb-2">
                +{places.length - 6} more places
              </p>
              <Button variant="outline" size="sm">
                View all
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {!usingExternalPlaces && data?.suggestions && data.suggestions.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-800">
            💡 <strong>Mira's tip:</strong> {data.suggestions[0]?.description || data.suggestions[0]?.why}
          </p>
        </div>
      )}
    </div>
  );
};

export default NearbyPlacesCarousel;
