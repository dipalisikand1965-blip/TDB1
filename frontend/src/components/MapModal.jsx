/**
 * MapModal.jsx
 * 
 * Displays a Google Maps location in a modal dialog instead of opening external Google Maps.
 * Used for showing places (parks, cafes, restaurants) within the app experience.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { MapPin, Navigation, ExternalLink, X, Phone, Star, Clock, Loader2 } from 'lucide-react';

const MapModal = ({
  isOpen,
  onClose,
  place = null, // { name, address, city, lat, lng, rating, phone, hours }
  searchQuery = '' // Alternative: search query string
}) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  // Generate Google Maps embed URL
  const getMapEmbedUrl = () => {
    if (place?.lat && place?.lng) {
      // Use coordinates if available
      return `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDummy'}&q=${place.lat},${place.lng}&zoom=15`;
    } else if (place?.name && place?.city) {
      // Use name and city
      const query = encodeURIComponent(`${place.name} ${place.city || ''}`);
      return `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDummy'}&q=${query}&zoom=15`;
    } else if (searchQuery) {
      // Use search query
      return `https://www.google.com/maps/embed/v1/search?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDummy'}&q=${encodeURIComponent(searchQuery)}&zoom=14`;
    }
    return null;
  };

  // Generate directions URL (for "Get Directions" button)
  const getDirectionsUrl = () => {
    if (place?.lat && place?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    } else if (place?.name) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + ' ' + (place.city || ''))}`;
    }
    return null;
  };

  // Generate static map image URL as fallback
  const getStaticMapUrl = () => {
    const center = place?.lat && place?.lng 
      ? `${place.lat},${place.lng}` 
      : encodeURIComponent(`${place?.name || ''} ${place?.city || ''}`);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${center}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}`;
  };

  const embedUrl = getMapEmbedUrl();
  const directionsUrl = getDirectionsUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="w-5 h-5 text-orange-500" />
            {place?.name || 'Location'}
          </DialogTitle>
          {place?.address && (
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {place.address}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Map Container */}
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          )}
          
          {embedUrl ? (
            <iframe
              title="Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={embedUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoading(false)}
              onError={() => {
                setMapLoading(false);
                setMapError(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Unable to load map</p>
            </div>
          )}
          
          {/* Fallback to static map image if iframe fails */}
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
              <img 
                src={getStaticMapUrl()} 
                alt="Map location"
                className="max-w-full max-h-full object-contain rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <p className="text-sm text-gray-500 mt-2">Interactive map unavailable</p>
            </div>
          )}
        </div>

        {/* Place Details */}
        {(place?.rating || place?.phone || place?.hours) && (
          <div className="flex flex-wrap gap-4 py-2 text-sm">
            {place.rating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{place.rating}</span>
              </div>
            )}
            {place.phone && (
              <a 
                href={`tel:${place.phone}`}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                <Phone className="w-4 h-4" />
                <span>{place.phone}</span>
              </a>
            )}
            {place.hours && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{place.hours}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(embedUrl?.replace('/embed/v1/', '/'), '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </Button>
          
          {directionsUrl && (
            <Button
              size="sm"
              onClick={() => window.open(directionsUrl, '_blank')}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapModal;
