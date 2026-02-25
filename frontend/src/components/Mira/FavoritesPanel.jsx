/**
 * FavoritesPanel.jsx
 * 
 * Displays saved favorites for a pet, grouped by pillar.
 * Can be used in:
 * - "What Mira Knows" section on pet home
 * - Dedicated favorites page
 * - As a modal/drawer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Sparkles, X, ChevronRight, Trash2,
  Cake, Utensils, Stethoscope, Plane, Hotel,
  HeartPulse, GraduationCap, Loader2, Gift
} from 'lucide-react';
import { API_URL } from '../../utils/api';

// Pillar icons and colors
const PILLAR_CONFIG = {
  celebrate: { icon: Cake, color: 'from-pink-500 to-purple-500', emoji: '🎂', name: 'Celebrate' },
  dine: { icon: Utensils, color: 'from-amber-500 to-orange-500', emoji: '🍖', name: 'Dine' },
  care: { icon: Stethoscope, color: 'from-rose-400 to-pink-500', emoji: '💊', name: 'Care' },
  travel: { icon: Plane, color: 'from-teal-400 to-blue-500', emoji: '✈️', name: 'Travel' },
  stay: { icon: Hotel, color: 'from-green-400 to-emerald-500', emoji: '🏨', name: 'Stay' },
  fit: { icon: HeartPulse, color: 'from-orange-400 to-red-500', emoji: '🏃', name: 'Fit' },
  learn: { icon: GraduationCap, color: 'from-indigo-400 to-purple-500', emoji: '📚', name: 'Learn' },
  enjoy: { icon: Heart, color: 'from-blue-400 to-cyan-500', emoji: '🎾', name: 'Enjoy' },
  shop: { icon: Gift, color: 'from-violet-400 to-purple-500', emoji: '🛒', name: 'Shop' },
};

/**
 * FavoriteCard - Individual favorite item card
 */
const FavoriteCard = ({ item, onRemove, onSelect }) => {
  const [removing, setRemoving] = useState(false);
  const pillarConfig = PILLAR_CONFIG[item.pillar] || PILLAR_CONFIG.celebrate;
  
  const handleRemove = async (e) => {
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    await onRemove(item);
    setRemoving(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 hover:border-pink-500/30 transition-all cursor-pointer"
      onClick={() => onSelect?.(item)}
    >
      {/* Pillar Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${pillarConfig.color} text-white`}>
          {pillarConfig.emoji} {pillarConfig.name}
        </span>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
          data-testid={`remove-favorite-${item.item_id}`}
        >
          {removing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </div>
      
      {/* Title */}
      <div className="flex items-start gap-2">
        {item.icon && (
          <span className="text-lg">{item.icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate">
            {item.title || item.name}
          </h4>
          {item.category && (
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {item.category.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      </div>
      
      {/* Added date */}
      {item.added_at && (
        <p className="text-[10px] text-gray-500 mt-2">
          Saved {new Date(item.added_at).toLocaleDateString()}
        </p>
      )}
      
      {/* Favorite heart indicator */}
      <div className="absolute top-2 right-8 pointer-events-none">
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
      </div>
    </motion.div>
  );
};

/**
 * Main FavoritesPanel Component
 */
const FavoritesPanel = ({
  isOpen = false,
  onClose,
  petId,
  petName = 'Your Pet',
  token,
  onFavoriteSelect,
  compact = false, // For embedding in other panels
}) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!petId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/favorites/${petId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        throw new Error('Failed to load favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Could not load favorites');
    } finally {
      setLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    if (isOpen || compact) {
      fetchFavorites();
    }
  }, [isOpen, compact, fetchFavorites]);

  // Remove favorite
  const handleRemove = async (item) => {
    try {
      const response = await fetch(`${API_URL}/api/favorites/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_id: petId,
          item_id: item.item_id
        })
      });
      
      if (response.ok) {
        setFavorites(prev => prev.filter(f => f.item_id !== item.item_id));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Group favorites by pillar
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const pillar = fav.pillar || 'other';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(fav);
    return acc;
  }, {});

  // Get filtered favorites
  const filteredFavorites = filter === 'all' 
    ? favorites 
    : favorites.filter(f => f.pillar === filter);

  // Get unique pillars for filter
  const uniquePillars = [...new Set(favorites.map(f => f.pillar).filter(Boolean))];

  // Compact mode - for embedding
  if (compact) {
    if (loading) {
      return (
        <div className="p-4 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-pink-500 mx-auto" />
        </div>
      );
    }

    if (favorites.length === 0) {
      return (
        <div className="p-4 text-center">
          <Heart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No favorites saved yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Tap the heart on any pick to save it!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          <span className="text-sm font-medium text-white">
            {petName}'s Favorites ({favorites.length})
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {favorites.slice(0, 4).map((item) => (
            <FavoriteCard
              key={item.item_id}
              item={item}
              onRemove={handleRemove}
              onSelect={onFavoriteSelect}
            />
          ))}
        </div>
        {favorites.length > 4 && (
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-pink-400 hover:text-pink-300 flex items-center justify-center gap-1"
          >
            View all {favorites.length} favorites
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Full panel mode
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 top-0 bg-gray-900 rounded-t-3xl overflow-hidden mt-3"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-3 mb-2" />
            
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {petName}'s Favorites
                  </h2>
                  <p className="text-xs text-pink-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {favorites.length} saved picks
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700"
                data-testid="close-favorites-panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter tabs */}
            {uniquePillars.length > 0 && (
              <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                    filter === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All ({favorites.length})
                </button>
                {uniquePillars.map(pillar => {
                  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
                  const count = groupedFavorites[pillar]?.length || 0;
                  return (
                    <button
                      key={pillar}
                      onClick={() => setFilter(pillar)}
                      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all flex items-center gap-1 ${
                        filter === pillar
                          ? `bg-gradient-to-r ${config.color} text-white`
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <span>{config.emoji}</span>
                      {config.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
                <p className="text-gray-400">Loading {petName}'s favorites...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchFavorites}
                  className="px-6 py-2 bg-pink-600 text-white rounded-full"
                >
                  Try Again
                </button>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {filter === 'all' ? 'No favorites yet' : `No ${filter} favorites`}
                </h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  When you find something perfect for {petName}, tap the heart to save it here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filteredFavorites.map((item) => (
                    <FavoriteCard
                      key={item.item_id}
                      item={item}
                      onRemove={handleRemove}
                      onSelect={onFavoriteSelect}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FavoritesPanel;
