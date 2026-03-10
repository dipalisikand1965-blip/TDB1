/**
 * NearbyAdvisoryServices.jsx
 * Google Places API section for nearby advisory services (trainers, groomers, vets, pet stores)
 * Uses same pattern as NearbyEmergencyHelp component
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Clock, Star, Navigation, 
  Loader2, AlertCircle, Edit2, Search, X, Target,
  GraduationCap, Scissors, Stethoscope, ShoppingBag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Service type mappings for Google Places
const SERVICE_TYPES = {
  trainers: { 
    name: 'Pet Trainers', 
    icon: GraduationCap, 
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    activeColor: 'bg-blue-600 text-white',
    googleType: 'pet_store', // No direct trainer type, use pet_store as proxy
    searchTerm: 'dog trainer'
  },
  groomers: { 
    name: 'Groomers', 
    icon: Scissors, 
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    activeColor: 'bg-purple-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'pet groomer'
  },
  vets: { 
    name: 'Veterinarians', 
    icon: Stethoscope, 
    color: 'bg-red-50 text-red-600 border-red-200',
    activeColor: 'bg-red-600 text-white',
    googleType: 'veterinary_care',
    searchTerm: 'veterinary clinic'
  },
  pet_stores: { 
    name: 'Pet Stores', 
    icon: ShoppingBag, 
    color: 'bg-green-50 text-green-600 border-green-200',
    activeColor: 'bg-green-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'pet store'
  }
};

const NearbyAdvisoryServices = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
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
      const savedCity = localStorage.getItem('advisoryCity');
      const savedCoords = localStorage.getItem('advisoryCoords');
      
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
                localStorage.setItem('advisoryCity', city);
                localStorage.setItem('advisoryCoords', JSON.stringify(coords));
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
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocationPermission('denied');
        setDetectingLocation(false);
      }
    };
    
    detectLocation();
  }, []);

  // Search for locations using Nominatim
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.map(result => ({
          name: result.display_name.split(',')[0],
          fullName: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        })));
      }
    } catch (e) {
      console.error('Location search failed:', e);
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

  // Fetch nearby places when service type is selected
  const fetchNearbyPlaces = async (serviceType) => {
    if (!currentLocation && !cityName) {
      setShowLocationModal(true);
      return;
    }
    
    setActiveType(serviceType);
    setLoading(true);
    setError(null);
    setPlaces([]);
    
    const service = SERVICE_TYPES[serviceType];
    
    try {
      let endpoint = '';
      const city = cityName || 'Bangalore';
      
      // Use the correct endpoint for each service type
      switch (serviceType) {
        case 'vets':
          endpoint = `${API_URL}/api/mira/local-places/vets?city=${encodeURIComponent(city)}&limit=8`;
          break;
        case 'groomers':
          endpoint = `${API_URL}/api/mira/local-places/groomers?city=${encodeURIComponent(city)}&limit=8`;
          break;
        case 'pet_stores':
          endpoint = `${API_URL}/api/mira/local-places/pet-stores?city=${encodeURIComponent(city)}&limit=8`;
          break;
        case 'trainers':
          // Trainers might not have a dedicated endpoint, use text search
          endpoint = `${API_URL}/api/mira/search-places?query=${encodeURIComponent('dog trainer in ' + city)}&limit=8`;
          break;
        default:
          endpoint = `${API_URL}/api/mira/nearby-places?lat=${currentLocation?.latitude || 12.9716}&lng=${currentLocation?.longitude || 77.5946}&type=${service.googleType}&radius=10000&limit=8`;
      }
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const results = data.places || data.vets || data.groomers || data.stores || data.trainers || data || [];
        
        if (results.length > 0) {
          // Sort by rating and open status
          const sortedResults = results.sort((a, b) => {
            if (a.is_open_now && !b.is_open_now) return -1;
            if (!a.is_open_now && b.is_open_now) return 1;
            return (b.rating || 0) - (a.rating || 0);
          });
          setPlaces(sortedResults.slice(0, 8));
          return;
        }
      }
      
      setError('No results found. Try a different location.');
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Unable to fetch nearby services');
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection from search
  const selectLocation = (result) => {
    const coords = { latitude: result.lat, longitude: result.lng };
    setCityName(result.name);
    setCurrentLocation(coords);
    localStorage.setItem('advisoryCity', result.name);
    localStorage.setItem('advisoryCoords', JSON.stringify(coords));
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Re-fetch if a service type was selected
    if (activeType) {
      setTimeout(() => fetchNearbyPlaces(activeType), 100);
    }
  };

  // Re-detect location
  const redetectLocation = () => {
    localStorage.removeItem('advisoryCity');
    localStorage.removeItem('advisoryCoords');
    setDetectingLocation(true);
    setCityName('');
    setCurrentLocation(null);
    setPlaces([]);
    setActiveType(null);
    
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
                          data.address?.district || data.address?.county || 'Your Location';
              setCityName(city);
              localStorage.setItem('advisoryCity', city);
              localStorage.setItem('advisoryCoords', JSON.stringify(coords));
            }
          } catch (e) {
            setCityName('Your Location');
          }
          setDetectingLocation(false);
        },
        () => {
          setLocationPermission('denied');
          setDetectingLocation(false);
          setShowLocationModal(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Render place card
  const PlaceCard = ({ place }) => (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{place.name}</h4>
        {place.rating && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>{place.rating}</span>
          </div>
        )}
      </div>
      
      {place.address && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2 flex items-start gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
          {place.address}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-3">
        {place.is_open_now !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            place.is_open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {place.is_open_now ? 'Open Now' : 'Closed'}
          </span>
        )}
        
        {place.phone && (
          <a 
            href={`tel:${place.phone}`}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"
          >
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
        
        {(place.google_maps_url || place.maps_url) && (
          <a 
            href={place.google_maps_url || place.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" /> Directions
          </a>
        )}
      </div>
    </Card>
  );

  return (
    <section className="py-8 px-4 bg-white" data-testid="nearby-advisory-services">
      <div className="max-w-6xl mx-auto">
        {/* Header with Location */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Find Services Near You</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            {detectingLocation ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Detecting location...
              </div>
            ) : cityName ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-violet-600" />
                  {cityName}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLocationModal(true)}
                  className="text-violet-600 text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Change
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowLocationModal(true)}
                className="text-violet-600"
              >
                <MapPin className="w-4 h-4 mr-1" /> Set Location
              </Button>
            )}
          </div>
        </div>
        
        {/* Service Type Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(SERVICE_TYPES).map(([key, service]) => {
            const Icon = service.icon;
            const isActive = activeType === key;
            
            return (
              <Card 
                key={key}
                className={`p-4 cursor-pointer transition-all text-center border-2 ${
                  isActive ? service.activeColor : service.color
                }`}
                onClick={() => fetchNearbyPlaces(key)}
              >
                <Icon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-medium text-sm">{service.name}</h4>
                <p className={`text-xs mt-1 ${isActive ? 'text-white/70' : 'opacity-70'}`}>
                  {isActive && loading ? 'Searching...' : 'Find nearby'}
                </p>
              </Card>
            );
          })}
        </div>
        
        {/* Results Section */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Finding {SERVICE_TYPES[activeType]?.name || 'services'} near you...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => activeType && fetchNearbyPlaces(activeType)}
            >
              Try Again
            </Button>
          </div>
        )}
        
        {!loading && !error && places.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {places.map((place, idx) => (
              <PlaceCard key={place.id || place.name + idx} place={place} />
            ))}
          </div>
        )}
        
        {!loading && !error && activeType && places.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Click a service category above to find nearby options
            </p>
          </div>
        )}
      </div>
      
      {/* Location Search Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Set Your Location
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for a city..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {searchLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left p-3 rounded-lg hover:bg-violet-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{result.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{result.fullName}</p>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={redetectLocation}
              >
                <Target className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NearbyAdvisoryServices;
