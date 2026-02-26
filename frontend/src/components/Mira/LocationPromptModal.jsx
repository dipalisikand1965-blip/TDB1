/**
 * LocationPromptModal - Proactive location permission prompt
 * 
 * Shows on first login to ask user to enable location for personalized recommendations.
 * Also used when user clicks on weather widget to change location.
 */

import React, { useState } from 'react';
import { MapPin, Navigation, X, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const LocationPromptModal = ({ 
  isOpen, 
  onClose, 
  onLocationSet, 
  currentCity = null,
  mode = 'prompt' // 'prompt' for first-time, 'change' for changing location
}) => {
  const [searchCity, setSearchCity] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  // Common Indian cities for quick selection
  const popularCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa'];

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Location detection not supported by your browser');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get city name
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
          
          onLocationSet(city, { latitude, longitude });
          onClose();
        } catch (err) {
          setError('Could not detect your city. Please enter it manually.');
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setError('Location access denied. Please enter your city manually.');
        setIsDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  const handleCitySelect = (city) => {
    onLocationSet(city, null);
    onClose();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      onLocationSet(searchCity.trim(), null);
      onClose();
    }
  };

  const handleSkip = () => {
    // Use Mumbai as default
    onLocationSet('Mumbai', null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-pink-500" />
            {mode === 'prompt' ? 'Enable Location' : 'Change Location'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'prompt' 
              ? "Help Mira find pet-friendly places, vets, and services near you."
              : `Currently set to: ${currentCity || 'Not set'}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Auto-detect button */}
          <Button
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2"
            data-testid="auto-detect-location"
          >
            <Navigation className="w-4 h-4" />
            {isDetecting ? 'Detecting...' : 'Use My Current Location'}
          </Button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <span className="relative bg-[#1a1a2e] px-3 text-sm text-gray-500">or</span>
          </div>

          {/* Manual city search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              data-testid="city-input"
            />
            <Button type="submit" variant="outline" className="border-gray-600">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Popular cities */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Popular cities:</p>
            <div className="flex flex-wrap gap-2">
              {popularCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentCity === city 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  data-testid={`city-${city.toLowerCase()}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Skip option for first-time prompt */}
          {mode === 'prompt' && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-400 mt-2"
              data-testid="skip-location"
            >
              Skip for now (will use Mumbai)
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPromptModal;
