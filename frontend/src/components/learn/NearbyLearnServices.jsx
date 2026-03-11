/**
 * NearbyLearnServices.jsx
 * Google Places API section for Learn pillar - Find trainers, groomers, pet stores, vets nearby
 * Tailored for learning journey with relevant service categories
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Clock, Star, Navigation, 
  Loader2, AlertCircle, Edit2, Search, X, Target,
  GraduationCap, Scissors, ShoppingBag, Stethoscope, Brain
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Service types relevant for learning journey
const SERVICE_TYPES = {
  trainers: { 
    name: 'Dog Trainers', 
    icon: GraduationCap, 
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    activeColor: 'bg-blue-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'dog trainer obedience',
    description: 'Expert training guidance'
  },
  groomers: { 
    name: 'Groomers', 
    icon: Scissors, 
    color: 'bg-pink-50 text-pink-600 border-pink-200',
    activeColor: 'bg-pink-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'pet groomer dog grooming',
    description: 'Learn grooming techniques'
  },
  pet_stores: { 
    name: 'Pet Stores', 
    icon: ShoppingBag, 
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    activeColor: 'bg-amber-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'pet store',
    description: 'Training supplies & products'
  },
  vets: { 
    name: 'Veterinarians', 
    icon: Stethoscope, 
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    activeColor: 'bg-teal-600 text-white',
    googleType: 'veterinary_care',
    searchTerm: 'veterinary clinic',
    description: 'Health & behavior advice'
  },
  behaviorists: { 
    name: 'Behaviorists', 
    icon: Brain, 
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    activeColor: 'bg-purple-600 text-white',
    googleType: 'pet_store',
    searchTerm: 'dog behaviorist canine behavior',
    description: 'Behavior modification experts'
  }
};

const NearbyLearnServices = () => {
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

  // Detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      setDetectingLocation(true);
      
      const savedCity = localStorage.getItem('learnCity');
      const savedCoords = localStorage.getItem('learnCoords');
      
      if (savedCity && savedCoords) {
        try {
          const coords = JSON.parse(savedCoords);
          setCityName(savedCity);
          setCurrentLocation(coords);
          setLocationPermission('granted');
          setDetectingLocation(false);
          return;
        } catch (e) {
          // Continue with detection
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
                localStorage.setItem('learnCity', city);
                localStorage.setItem('learnCoords', JSON.stringify(coords));
              }
            } catch (e) {
              setCityName('Your Location');
            }
            setDetectingLocation(false);
          },
          (err) => {
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

  // Fetch places when type selected
  const fetchPlaces = async (type) => {
    if (!currentLocation) {
      setShowLocationModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setActiveType(type);

    try {
      const serviceConfig = SERVICE_TYPES[type];
      const response = await fetch(
        `${API_URL}/api/nearby/places?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&type=${serviceConfig.googleType}&keyword=${encodeURIComponent(serviceConfig.searchTerm)}&radius=10000`
      );
      
      if (!response.ok) throw new Error('Failed to fetch places');
      
      const data = await response.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Unable to find nearby services. Please try again.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Search for location
  const handleLocationSearch = async (query) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  // Select a location from search
  const selectLocation = (result) => {
    const coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    };
    const city = result.display_name.split(',')[0];
    
    setCurrentLocation(coords);
    setCityName(city);
    setLocationPermission('granted');
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
    
    localStorage.setItem('learnCity', city);
    localStorage.setItem('learnCoords', JSON.stringify(coords));
    
    // Refetch if a type was selected
    if (activeType) {
      fetchPlaces(activeType);
    }
  };

  // Detect current location
  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation?.getCurrentPosition(
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
            const city = data.address?.city || data.address?.town || 'Your Location';
            setCityName(city);
            localStorage.setItem('learnCity', city);
            localStorage.setItem('learnCoords', JSON.stringify(coords));
          }
        } catch (e) {
          setCityName('Your Location');
        }
        setShowLocationModal(false);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      }
    );
  };

  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-blue-50 to-white" data-testid="nearby-learn-services">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Near Me
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Find Learning Help Near You</h2>
          <p className="text-gray-600 mt-2">
            Trainers, groomers, and experts in your area
          </p>
          
          {/* Location Display */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {detectingLocation ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Detecting location...</span>
              </div>
            ) : cityName ? (
              <button 
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{cityName}</span>
                <Edit2 className="w-3 h-3" />
              </button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLocationModal(true)}
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Set Your Location
              </Button>
            )}
          </div>
        </div>

        {/* Service Type Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Object.entries(SERVICE_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeType === key;
            
            return (
              <button
                key={key}
                onClick={() => fetchPlaces(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  isActive ? config.activeColor : config.color
                }`}
                data-testid={`learn-service-type-${key}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.name}</span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Finding nearby {SERVICE_TYPES[activeType]?.name}...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : places.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.slice(0, 6).map((place, idx) => (
              <Card key={idx} className="p-4 hover:shadow-lg transition-shadow bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{place.name}</h3>
                  {renderRating(place.rating)}
                </div>
                
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {place.vicinity || place.address}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {place.phone && (
                    <a 
                      href={`tel:${place.phone}`}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  )}
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + ' ' + (place.vicinity || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs hover:bg-indigo-100"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                  </a>
                  
                  {place.opening_hours && (
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      place.opening_hours.open_now 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : activeType ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {SERVICE_TYPES[activeType]?.name} found nearby.</p>
            <p className="text-xs text-gray-400 mt-1">Try expanding your search area or check another category.</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
              <GraduationCap className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Select a service type above</p>
              <p className="text-xs text-gray-500 mt-1">We'll show you the best learning resources near {cityName || 'your location'}</p>
            </div>
          </div>
        )}

        {/* Location Modal */}
        <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Set Your Location
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search city or area..."
                  value={searchQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
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

              {/* Search Results */}
              {searchLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectLocation(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{result.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{result.display_name}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Detect Location Button */}
              <Button 
                onClick={detectCurrentLocation} 
                variant="outline" 
                className="w-full gap-2"
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                Use My Current Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default NearbyLearnServices;
