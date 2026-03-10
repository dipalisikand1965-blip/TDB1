/**
 * NearbyEmergencyHelp.jsx
 * Google Places API section for nearby emergency services
 * Real-time clinic finder with filters
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Star, Navigation, 
  Filter, Loader2, AlertCircle, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NearbyEmergencyHelp = ({ userLocation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, open_now, 24h
  const [radius, setRadius] = useState(5000); // meters
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(userLocation);

  // Request location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (err) => {
          console.warn('Location error:', err);
          setLocationPermission('denied');
          // Default to Mumbai if location denied
          setCurrentLocation({ latitude: 19.076, longitude: 72.8777 });
        }
      );
    }
  }, []);

  // Fetch nearby places
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyPlaces();
    }
  }, [currentLocation, radius]);

  const fetchNearbyPlaces = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct local-places API which supports vets search
      const response = await fetch(
        `${API_URL}/api/mira/local-places/vets?city=Mumbai&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const vets = data.vets || data.places || data || [];
        // Sort by open status and rating
        const sortedVets = vets.sort((a, b) => {
          if (a.is_open_now && !b.is_open_now) return -1;
          if (!a.is_open_now && b.is_open_now) return 1;
          if (a.is_24_hours && !b.is_24_hours) return -1;
          if (!a.is_24_hours && b.is_24_hours) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
        setPlaces(sortedVets);
      } else {
        // Fallback to emergency vets API
        const fallbackResponse = await fetch(`${API_URL}/api/emergency/vets?limit=8`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setPlaces(fallbackData.vets || fallbackData || []);
        }
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      // Try emergency vets as final fallback
      try {
        const fallbackResponse = await fetch(`${API_URL}/api/emergency/vets?limit=8`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setPlaces(fallbackData.vets || fallbackData || []);
        }
      } catch (e) {
        setError('Unable to fetch nearby clinics');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter places
  const filteredPlaces = places.filter(place => {
    if (filter === 'open_now') return place.is_open || place.open_now;
    if (filter === '24h') return place.is_24_hours || place.open_24_hours;
    return true;
  });

  const openDirections = (place) => {
    const destination = place.latitude && place.longitude 
      ? `${place.latitude},${place.longitude}`
      : encodeURIComponent(place.address || place.name);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const callPlace = (phone) => {
    if (phone) window.open(`tel:${phone}`, '_self');
  };

  return (
    <section className="py-6 px-4 bg-gradient-to-b from-blue-50 to-white" data-testid="nearby-help-section">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Near Me Now
            </h2>
            <p className="text-sm text-gray-600">Emergency clinics near your location</p>
          </div>
          {locationPermission === 'denied' && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Using default location
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-blue-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filter === 'open_now' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('open_now')}
            className={filter === 'open_now' ? 'bg-green-600' : ''}
          >
            <Clock className="w-3 h-3 mr-1" />
            Open Now
          </Button>
          <Button
            variant={filter === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('24h')}
            className={filter === '24h' ? 'bg-purple-600' : ''}
          >
            24/7
          </Button>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="text-sm border rounded-lg px-2 py-1"
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Finding nearby clinics...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNearbyPlaces} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Places Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place, idx) => (
                <div 
                  key={place.id || idx}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{place.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{place.address || place.vicinity}</p>
                    </div>
                    {(place.is_open || place.open_now) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Open
                      </span>
                    )}
                    {(place.is_24_hours || place.open_24_hours) && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">
                        24/7
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {place.rating && (
                      <span className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                        {place.rating}
                      </span>
                    )}
                    {place.distance && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-0.5" />
                        {place.distance < 1000 ? `${place.distance}m` : `${(place.distance/1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => openDirections(place)}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                    {place.phone && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => callPlace(place.phone)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No clinics found with current filters</p>
                <Button variant="outline" size="sm" onClick={() => setFilter('all')} className="mt-2">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NearbyEmergencyHelp;
