/**
 * PlacesCard - Conversation Contract Phase 5
 * 
 * Renders Google Places results from the conversation_contract.places_results array.
 * Shows: name, rating, open/closed, address, phone, maps link
 */

import React from 'react';
import { MapPin, Phone, Star, ExternalLink, Clock, Navigation } from 'lucide-react';

export const PlacesCard = ({ 
  place,
  onGetDirections,
  onCall,
  compact = false
}) => {
  if (!place) return null;

  const { name, address, rating, is_open, phone, website, maps_link } = place;

  return (
    <div 
      className={`
        bg-slate-800/50 rounded-xl border border-slate-700/50
        ${compact ? 'p-3' : 'p-4'}
        hover:border-purple-500/30 transition-all duration-200
      `}
      data-testid={`places-card-${place.id || name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{name}</h3>
          
          {/* Rating & Status */}
          <div className="flex items-center gap-3 mt-1">
            {rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-sm text-amber-400">{rating}</span>
              </div>
            )}
            {is_open !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                is_open 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {is_open ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        </div>

        {/* Maps Link */}
        {maps_link && (
          <a
            href={maps_link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink size={16} className="text-purple-400" />
          </a>
        )}
      </div>

      {/* Address */}
      {address && (
        <div className="flex items-start gap-2 mt-3 text-sm text-slate-400">
          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{address}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        {phone && (
          <button
            onClick={() => onCall?.(phone)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-green-600/20 hover:bg-green-600/30 text-green-400
              text-sm font-medium transition-colors"
            data-testid="places-call-btn"
          >
            <Phone size={14} />
            <span>Call</span>
          </button>
        )}
        
        {maps_link && (
          <button
            onClick={() => onGetDirections?.(maps_link)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-blue-600/20 hover:bg-blue-600/30 text-blue-400
              text-sm font-medium transition-colors"
            data-testid="places-directions-btn"
          >
            <Navigation size={14} />
            <span>Directions</span>
          </button>
        )}
        
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-slate-600/30 hover:bg-slate-600/50 text-slate-300
              text-sm font-medium transition-colors"
          >
            <ExternalLink size={14} />
            <span>Website</span>
          </a>
        )}
      </div>
    </div>
  );
};

export const PlacesGrid = ({ 
  places = [],
  onGetDirections,
  onCall,
  title = "Nearby Places"
}) => {
  if (!places || places.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="places-grid">
      {title && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin size={16} className="text-purple-400" />
          <span>{title}</span>
          <span className="text-slate-500">({places.length} found)</span>
        </div>
      )}
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place, index) => (
          <PlacesCard
            key={place.id || index}
            place={place}
            onGetDirections={onGetDirections}
            onCall={onCall}
          />
        ))}
      </div>
    </div>
  );
};

export default PlacesCard;
