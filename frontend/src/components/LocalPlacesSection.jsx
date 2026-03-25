/**
 * E042: Local Places Integration Component
 * 
 * Displays dog parks, pet stores, vets, and groomers in any city worldwide
 * using Google Places API (via backend)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { API_URL } from '../utils/api';
import {
  MapPin, Search, Loader2, Star, Phone, Globe, Clock,
  TreePine, Stethoscope, ShoppingBag, Scissors, Navigation,
  ChevronDown, ChevronUp, X
} from 'lucide-react';

// Place type configurations
const PLACE_TYPES = {
  dog_parks: {
    icon: TreePine,
    emoji: '🌳',
    color: 'emerald',
    title: 'Dog Parks',
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  },
  vets: {
    icon: Stethoscope,
    emoji: '🏥',
    color: 'violet',
    title: 'Veterinary Clinics',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700'
  },
  pet_stores: {
    icon: ShoppingBag,
    emoji: '🛍️',
    color: 'amber',
    title: 'Pet Stores',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700'
  },
  groomers: {
    icon: Scissors,
    emoji: '✂️',
    color: 'pink',
    title: 'Pet Groomers',
    gradient: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700'
  }
};

// Quick city picks
const QUICK_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Goa', 'Pune', 'Kolkata', 'Jaipur', 'Kochi'
];

// PlaceCard component for individual places
const PlaceCard = ({ place, type }) => {
  const config = PLACE_TYPES[type] || PLACE_TYPES.dog_parks;
  const Icon = config.icon;
  
  const openDirections = () => {
    const query = encodeURIComponent(`${place.name} ${place.address || place.city || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
      data-testid={`local-place-card-${type}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <span className="text-xl">{config.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{place.name}</h4>
            <p className="text-xs text-gray-500 line-clamp-1">
              {place.address || place.city || 'View on map'}
            </p>
            
            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-500 fill-current" />
                <span className="text-xs text-gray-600">{place.rating}</span>
                {place.reviews_count && (
                  <span className="text-xs text-gray-400">({place.reviews_count})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="mt-3 flex flex-wrap gap-1">
          {place.is_open_now === true && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Clock className="w-3 h-3 mr-1" /> Open Now
            </Badge>
          )}
          {place.is_open_now === false && (
            <Badge className="bg-red-100 text-red-700 text-xs">
              <Clock className="w-3 h-3 mr-1" /> Closed
            </Badge>
          )}
          {place.is_emergency && (
            <Badge className="bg-red-500 text-white text-xs">24/7 Emergency</Badge>
          )}
          {place.is_24_hours && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">24 Hours</Badge>
          )}
          <Badge className={`${config.bgColor} ${config.textColor} text-xs`}>
            {config.title}
          </Badge>
        </div>

        {/* Contact & Actions */}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className={`flex-1 bg-gradient-to-r ${config.gradient} hover:opacity-90 text-xs text-white`}
            onClick={openDirections}
            data-testid={`directions-${type}-btn`}
          >
            <Navigation className="w-3 h-3 mr-1" /> Directions
          </Button>
          
          {place.phone && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(`tel:${place.phone}`, '_self')}
            >
              <Phone className="w-3 h-3" />
            </Button>
          )}
          
          {place.website && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(place.website, '_blank')}
            >
              <Globe className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Main LocalPlacesSection component
const LocalPlacesSection = ({
  initialCity = 'Mumbai',
  placeTypes = ['dog_parks', 'pet_stores', 'vets', 'groomers'],
  limit = 4,
  showSearch = true,
  compact = false,
  title = 'Local Pet-Friendly Places',
  subtitle = 'Find dog parks, pet stores, vets, and groomers near you'
}) => {
  const [city, setCity] = useState(initialCity);
  const [searchInput, setSearchInput] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState({});
  const [activeType, setActiveType] = useState(placeTypes[0]);
  const [expanded, setExpanded] = useState(false);

  // Fetch places from API
  const fetchPlaces = useCallback(async (cityName) => {
    if (!cityName) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/mira/local-places?city=${encodeURIComponent(cityName)}&limit=${limit}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlaces(data.places || {});
          setCity(cityName);
        }
      }
    } catch (error) {
      console.error('Error fetching local places:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Fetch on mount
  useEffect(() => {
    fetchPlaces(initialCity);
  }, [initialCity, fetchPlaces]);

  // Handle search
  const handleSearch = () => {
    if (searchInput.trim()) {
      fetchPlaces(searchInput.trim());
    }
  };

  // Get current type's places
  const currentPlaces = places[activeType]?.items || [];
  const displayPlaces = expanded ? currentPlaces : currentPlaces.slice(0, compact ? 2 : 4);

  return (
    <section 
      className={`${compact ? 'py-4' : 'py-8'} rounded-2xl`}
      data-testid="local-places-section"
    >
      {/* Header */}
      {!compact && (
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter city name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-10"
                data-testid="local-places-city-input"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4"
              disabled={loading}
              data-testid="local-places-search-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Quick City Picks */}
          <div className="flex flex-wrap justify-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Quick picks:</span>
            {QUICK_CITIES.slice(0, 6).map((quickCity) => (
              <Button
                key={quickCity}
                variant={city.toLowerCase() === quickCity.toLowerCase() ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSearchInput(quickCity); fetchPlaces(quickCity); }}
                className={`text-xs h-7 px-2 ${
                  city.toLowerCase() === quickCity.toLowerCase() 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : ''
                }`}
                data-testid={`quick-city-${quickCity.toLowerCase()}`}
              >
                {quickCity}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Type Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {placeTypes.map((type) => {
          const config = PLACE_TYPES[type];
          if (!config) return null;
          
          const count = places[type]?.count || 0;
          const isActive = activeType === type;
          
          return (
            <Button
              key={type}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveType(type)}
              className={`text-xs ${isActive ? `bg-gradient-to-r ${config.gradient}` : ''}`}
              data-testid={`tab-${type}`}
            >
              <span className="mr-1">{config.emoji}</span>
              {config.title}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Finding places in {city}...</span>
        </div>
      ) : currentPlaces.length > 0 ? (
        <>
          <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-3`}>
            {displayPlaces.map((place, idx) => (
              <PlaceCard key={place.id || idx} place={place} type={activeType} />
            ))}
          </div>
          
          {/* Expand/Collapse Button */}
          {currentPlaces.length > (compact ? 2 : 4) && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Show {currentPlaces.length - (compact ? 2 : 4)} More
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-500 text-sm">No {PLACE_TYPES[activeType]?.title || 'places'} found in {city}</p>
          <p className="text-gray-400 text-xs mt-1">Try searching for a different city</p>
        </div>
      )}

      {/* Concierge® CTA */}
      {!compact && currentPlaces.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Need help booking or finding specific places? 
            <Button variant="link" className="text-emerald-600 text-xs px-1">
              Let Concierge® help you
            </Button>
          </p>
        </div>
      )}
    </section>
  );
};

export default LocalPlacesSection;
