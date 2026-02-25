/**
 * WeatherCard.jsx - Weather & Pet Activity Component
 * 
 * MOJO INTEGRATION: Weather impacts MOJO's daily recommendations
 * - Displays current weather with pet-safe walk advisory
 * - Shows temperature, humidity, and safety level
 * - Dynamically adjusts recommendations based on conditions
 */

import React, { memo } from 'react';
import { Sun, Cloud, CloudRain, Thermometer, Wind, Droplets, AlertTriangle, CheckCircle } from 'lucide-react';

// Weather condition to icon mapping
const getWeatherIcon = (condition) => {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-8 h-8" />;
  if (cond.includes('cloud') || cond.includes('overcast')) return <Cloud className="w-8 h-8" />;
  return <Sun className="w-8 h-8" />;
};

// Safety level to color mapping
const getSafetyColor = (level) => {
  switch ((level || '').toLowerCase()) {
    case 'safe': return { bg: 'from-emerald-500/20 to-emerald-600/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'caution': return { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'unsafe': return { bg: 'from-red-500/20 to-red-600/10', text: 'text-red-400', border: 'border-red-500/30' };
    default: return { bg: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-400', border: 'border-blue-500/30' };
  }
};

const WeatherCard = memo(({ weather, petName, onAskMira }) => {
  if (!weather) return null;
  
  const {
    city,
    temp,
    humidity,
    condition,
    wind_speed,
    pet_advisory
  } = weather;
  
  const safetyLevel = pet_advisory?.safety_level || 'unknown';
  const safetyColors = getSafetyColor(safetyLevel);
  const isSafe = safetyLevel.toLowerCase() === 'safe';
  const isCaution = safetyLevel.toLowerCase() === 'caution';
  
  return (
    <div 
      className={`weather-card relative overflow-hidden rounded-2xl border ${safetyColors.border} bg-gradient-to-br ${safetyColors.bg} backdrop-blur-sm p-4`}
      data-testid="weather-card"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white/10 ${safetyColors.text}`}>
            {getWeatherIcon(condition)}
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{Math.round(temp || 0)}°C</div>
            <div className="text-gray-300 text-sm capitalize">{condition || 'Clear'}</div>
          </div>
        </div>
        
        {/* Safety Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 ${safetyColors.text}`}>
          {isSafe ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-xs font-medium uppercase">{safetyLevel}</span>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-gray-300">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className="text-sm">{humidity || 0}%</span>
        </div>
        {wind_speed && (
          <div className="flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">{wind_speed} km/h</span>
          </div>
        )}
        <div className="text-sm text-gray-400">{city || 'Your location'}</div>
      </div>
      
      {/* Pet Advisory */}
      <div className={`p-3 rounded-xl bg-black/20 ${safetyColors.text}`}>
        <div className="flex items-start gap-2">
          {isSafe ? (
            <>
              <span className="text-lg">🐕</span>
              <div>
                <div className="font-medium text-sm text-white">
                  Great day for a walk with {petName}!
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {pet_advisory?.recommendation || 'Weather conditions are ideal for outdoor activities.'}
                </div>
              </div>
            </>
          ) : isCaution ? (
            <>
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-medium text-sm text-white">
                  Be careful with {petName} outside
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {pet_advisory?.recommendation || 'Limit outdoor time and watch for signs of discomfort.'}
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg">🏠</span>
              <div>
                <div className="font-medium text-sm text-white">
                  Keep {petName} indoors
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {pet_advisory?.recommendation || 'Weather conditions are not suitable for outdoor activities.'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      {onAskMira && (
        <button
          onClick={() => onAskMira(`Is it safe to walk ${petName} right now?`)}
          className="mt-3 w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          data-testid="weather-ask-mira-btn"
        >
          <Thermometer className="w-4 h-4" />
          <span>Ask Mira about walk safety</span>
        </button>
      )}
      
      {/* Subtle decorative elements */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
});

WeatherCard.displayName = 'WeatherCard';

export default WeatherCard;
