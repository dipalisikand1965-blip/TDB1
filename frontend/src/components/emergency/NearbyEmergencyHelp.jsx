/**
 * NearbyEmergencyHelp.jsx
 * Google Places API section for nearby emergency services
 * Uses Google Places Autocomplete for ANY location worldwide
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Clock, Star, Navigation, 
  Loader2, AlertCircle, Edit2, Search, X, Target
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NearbyEmergencyHelp = ({ userLocation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(userLocation);
  const [cityName, setCityName] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const searchTimeoutRef = useRef(null);

  // Request location permission and detect city on mount
  useEffect(() => {
    const detectLocation = async () => {
      setDetectingLocation(true);
      
      // Check localStorage for saved location
      const savedCity = localStorage.getItem('emergencyCity');
      const savedCoords = localStorage.getItem('emergencyCoords');
      
      if (savedCity && savedCoords) {
        try {
          const coords = JSON.parse(savedCoords);
          setCityName(savedCity);
          setCurrentLocation(coords);
          setLocationPermission('granted');
          setDetectingLocation(false);
          return;
        } catch (e) {
          // Invalid stored data, continue with detection
        }
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setCurrentLocation(coords);
            setLocationPermission('granted');
            
            // Reverse geocode to get city name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
              );
              if (response.ok) {
                const data = await response.json();
                const city = data.address?.city || data.address?.town || 
                            data.address?.district || data.address?.county || 
                            data.address?.state_district || 'Your Location';
                setCityName(city);
                localStorage.setItem('emergencyCity', city);
                localStorage.setItem('emergencyCoords', JSON.stringify(coords));
              }
            } catch (e) {
              console.warn('Reverse geocoding failed:', e);
              setCityName('Your Location');
            }
            setDetectingLocation(false);
          },
          (err) => {
            console.warn('Location error:', err);
            setLocationPermission('denied');
            setCityName('');
            setDetectingLocation(false);
            // Show location modal for manual entry
            setShowLocationModal(true);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocationPermission('denied');
        setDetectingLocation(false);
        setShowLocationModal(true);
      }
    };
    
    detectLocation();
  }, []);

  // Fetch nearby places when location changes
  useEffect(() => {
    if (currentLocation && !detectingLocation) {
      fetchNearbyPlaces();
    }
  }, [currentLocation, detectingLocation]);

  // Search for locations using Nominatim (free, no API key needed)
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&countrycodes=in`
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.map(r => ({
          name: r.display_name.split(',').slice(0, 3).join(', '),
          fullName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon)
        })));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const fetchNearbyPlaces = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try Google Places with coordinates
      const response = await fetch(
        `${API_URL}/api/mira/nearby-places?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&type=veterinary_care&radius=15000&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const vets = data.places || data.vets || data || [];
        if (vets.length > 0) {
          const sortedVets = vets.sort((a, b) => {
            if (a.is_open_now && !b.is_open_now) return -1;
            if (!a.is_open_now && b.is_open_now) return 1;
            if (a.is_24_hours && !b.is_24_hours) return -1;
            if (!a.is_24_hours && b.is_24_hours) return 1;
            return (b.rating || 0) - (a.rating || 0);
          });
          setPlaces(sortedVets);
          return;
        }
      }
      
      // Fallback to city-based search
      if (cityName) {
        const cityResponse = await fetch(
          `${API_URL}/api/mira/local-places/vets?city=${encodeURIComponent(cityName)}&limit=10`
        );
        
        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          const vets = cityData.vets || cityData.places || cityData || [];
          setPlaces(vets);
          return;
        }
      }
      
      // Final fallback
      const fallbackResponse = await fetch(`${API_URL}/api/emergency/vets?limit=8`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        setPlaces(fallbackData.vets || fallbackData || []);
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Unable to fetch nearby clinics');
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection from search
  const selectLocation = (result) => {
    const coords = { latitude: result.lat, longitude: result.lng };
    setCityName(result.name);
    setCurrentLocation(coords);
    localStorage.setItem('emergencyCity', result.name);
    localStorage.setItem('emergencyCoords', JSON.stringify(coords));
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Re-detect location
  const redetectLocation = () => {
    localStorage.removeItem('emergencyCity');
    localStorage.removeItem('emergencyCoords');
    setDetectingLocation(true);
    setCityName('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(coords);
          setLocationPermission('granted');
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
            );
            if (response.ok) {
              const data = await response.json();
              const city = data.address?.city || data.address?.town || 
                          data.address?.district || 'Your Location';
              setCityName(city);
              localStorage.setItem('emergencyCity', city);
              localStorage.setItem('emergencyCoords', JSON.stringify(coords));
            }
          } catch (e) {
            setCityName('Your Location');
          }
          setDetectingLocation(false);
          setShowLocationModal(false);
        },
        () => {
          setDetectingLocation(false);
          setLocationPermission('denied');
        }
      );
    }
  };

  // Filter places
  const filteredPlaces = places.filter(place => {
    if (filter === 'open_now') return place.is_open_now;
    if (filter === '24h') return place.is_24_hours;
    return true;
  });

  // Open Google Maps directions
  const openDirections = (place) => {
    const dest = place.geometry?.location 
      ? `${place.geometry.location.lat},${place.geometry.location.lng}`
      : place.address || place.name;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
  };

  return (
    <section className="py-6 px-4 bg-white" data-testid="nearby-emergency-help">
      <div className="max-w-6xl mx-auto">
        {/* Header with Location */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Near Me Now
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {detectingLocation ? (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting location...
                </span>
              ) : cityName ? (
                <>
                  <span className="text-sm text-gray-600">
                    Showing results for <strong className="text-red-600">{cityName}</strong>
                  </span>
                  <button 
                    onClick={() => setShowLocationModal(true)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Set your location
                </button>
              )}
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['all', 'open_now', '24h'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'open_now' ? 'Open Now' : '24/7'}
              </button>
            ))}
          </div>
        </div>

        {/* Location Permission Warning */}
        {locationPermission === 'denied' && !cityName && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Location access denied. 
              <button 
                onClick={() => setShowLocationModal(true)} 
                className="ml-1 underline font-medium"
              >
                Search for your location
              </button>
            </span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-red-500 mr-2" />
            <span className="text-gray-600">Finding nearby clinics...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchNearbyPlaces} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* Places Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.slice(0, 6).map((place, idx) => (
              <div 
                key={place.place_id || idx}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{place.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{place.address || place.vicinity}</p>
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium">{place.rating}</span>
                    </div>
                  )}
                </div>
                
                {/* Status Badges */}
                <div className="flex gap-2 mb-3">
                  {place.is_open_now && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Open
                    </span>
                  )}
                  {place.is_24_hours && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">24/7</span>
                  )}
                  {place.distance && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {place.distance}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  {place.phone && (
                    <a 
                      href={`tel:${place.phone}`}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                  <button
                    onClick={() => openDirections(place)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3 h-3" /> Directions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredPlaces.length === 0 && currentLocation && (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No clinics found with current filters</p>
            <Button size="sm" variant="outline" onClick={() => setFilter('all')} className="mt-2">
              Show All
            </Button>
          </div>
        )}

        {/* Talk to Concierge® CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">Can't find what you need?</p>
            <p className="text-sm text-gray-600">Our Concierge® team can help locate emergency services near you</p>
          </div>
          <a 
            href="https://wa.me/918971702582?text=Hi, I need help finding emergency pet services near me"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Phone className="w-4 h-4" />
            Talk to Concierge®
          </a>
        </div>
      </div>

      {/* Location Search Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Find Your Location
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Auto-detect button */}
            <Button 
              onClick={redetectLocation}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={detectingLocation}
            >
              {detectingLocation ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
              ) : (
                <><Target className="w-4 h-4 mr-2" /> Use My Current Location</>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or search any location</span>
              </div>
            </div>
            
            {/* Location Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search any city, town, or area..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-9"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Search Loading */}
            {searchLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectLocation(result)}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{result.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No Results */}
            {searchQuery && !searchLoading && searchResults.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No locations found. Try a different search term.
              </p>
            )}
            
            {/* Popular Locations */}
            {!searchQuery && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Popular cities</p>
                <div className="flex flex-wrap gap-2">
                  {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'].map(city => (
                    <button
                      key={city}
                      onClick={() => handleSearchChange(city)}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NearbyEmergencyHelp;
