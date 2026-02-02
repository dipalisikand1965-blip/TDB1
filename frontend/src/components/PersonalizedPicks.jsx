/**
 * PersonalizedPicks.jsx
 * "Made with love for [Pet Name]" personalized recommendations bar
 * Shows on all pillar pages when user is logged in and has pets
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Sparkles, ChevronLeft, ChevronRight, Gift, Heart,
  ShoppingCart, Loader2, PawPrint, User
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Pillar-specific configurations
const PILLAR_CONFIG = {
  care: {
    emoji: '🩺',
    gradient: 'from-pink-50 to-rose-50',
    border: 'border-pink-200',
    accent: 'text-pink-700',
    accentBg: 'bg-pink-500',
    messages: (name) => [
      `Best care picks for ${name}! 💕`,
      `${name}'s wellness favorites 🩺`,
      `Perfect care for ${name}! ❤️`,
    ]
  },
  stay: {
    emoji: '🏠',
    gradient: 'from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-500',
    messages: (name) => [
      `Cozy stays for ${name}! 🏠`,
      `${name}'s comfort picks ✨`,
      `Home away from home for ${name}! 💛`,
    ]
  },
  travel: {
    emoji: '✈️',
    gradient: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    accent: 'text-purple-700',
    accentBg: 'bg-purple-500',
    messages: (name) => [
      `Travel essentials for ${name}! ✈️`,
      `${name}'s adventure gear 🧳`,
      `Safe travels for ${name}! 💜`,
    ]
  },
  enjoy: {
    emoji: '🎉',
    gradient: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    accent: 'text-red-700',
    accentBg: 'bg-red-500',
    messages: (name) => [
      `Fun picks for ${name}! 🎉`,
      `${name}'s favorite activities ❤️`,
      `Adventures for ${name}! 🎈`,
    ]
  },
  fit: {
    emoji: '💪',
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    accent: 'text-green-700',
    accentBg: 'bg-green-500',
    messages: (name) => [
      `Fitness picks for ${name}! 💪`,
      `${name}'s healthy choices 🥗`,
      `Keep ${name} fit! 🏃`,
    ]
  },
  dine: {
    emoji: '🍽️',
    gradient: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    accent: 'text-orange-700',
    accentBg: 'bg-orange-500',
    messages: (name) => [
      `Tasty picks for ${name}! 🍽️`,
      `${name}'s favorite treats 🦴`,
      `Made with love for ${name}! 💕`,
    ]
  },
  learn: {
    emoji: '📚',
    gradient: 'from-blue-50 to-sky-50',
    border: 'border-blue-200',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-500',
    messages: (name) => [
      `Learning picks for ${name}! 📚`,
      `${name}'s training favorites 🎓`,
      `Smart choices for ${name}! 🧠`,
    ]
  },
  shop: {
    emoji: '🛍️',
    gradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    accent: 'text-violet-700',
    accentBg: 'bg-violet-500',
    messages: (name) => [
      `Perfect picks for ${name}! 🛍️`,
      `${name} would love these! 💜`,
      `Curated for ${name}! ✨`,
    ]
  },
  celebrate: {
    emoji: '🎂',
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-500',
    messages: (name) => [
      `Made with love for ${name}! 💕`,
      `${name}'s celebration picks 🎂`,
      `Party time for ${name}! 🎉`,
    ]
  }
};

const PersonalizedPicks = ({ 
  pillar = 'shop',
  className = '',
  showPetSelector = true,
  maxProducts = 6
}) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.shop;

  // Listen for global pet selection changes (from Navbar)
  useEffect(() => {
    const handleGlobalPetChange = (event) => {
      const { petId, pet } = event.detail || {};
      if (pet) {
        // Full pet object passed in event
        setSelectedPet(pet);
        const messages = config.messages(pet?.name || 'your pet');
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
      } else if (petId && userPets.length > 0) {
        // Only petId passed, find the pet
        const foundPet = userPets.find(p => (p.id || p._id) === petId);
        if (foundPet) {
          setSelectedPet(foundPet);
          const messages = config.messages(foundPet?.name || 'your pet');
          setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
      }
    };
    
    window.addEventListener('petSelectionChanged', handleGlobalPetChange);
    return () => window.removeEventListener('petSelectionChanged', handleGlobalPetChange);
  }, [config, userPets]);

  // Check localStorage for previously selected pet on mount
  useEffect(() => {
    const savedPetId = localStorage.getItem('selectedPetId');
    if (savedPetId && userPets.length > 0) {
      const savedPet = userPets.find(p => (p.id || p._id) === savedPetId);
      if (savedPet) {
        setSelectedPet(savedPet);
        const messages = config.messages(savedPet?.name || 'your pet');
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
    }
  }, [userPets, config]);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (user && token) {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const pets = data.pets || [];
            setUserPets(pets);
            
            if (pets.length > 0) {
              const pet = pets[0];
              setSelectedPet(pet);
              const messages = config.messages(pet.name);
              setMessage(messages[Math.floor(Math.random() * messages.length)]);
            }
          }
        } catch (err) {
          console.debug('Failed to fetch pets:', err);
        }
      }
      setLoading(false);
    };
    fetchPets();
  }, [user, token, pillar]);

  // Fetch recommendations when pet changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!selectedPet) return;
      
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products/recommendations/for-pet/${selectedPet.id || selectedPet._id}?limit=${maxProducts}&pillar=${pillar}`
        );
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.debug('Failed to fetch recommendations:', err);
        // Fallback to general recommendations
        try {
          const res = await fetch(`${API_URL}/api/products?limit=${maxProducts}&is_recommended=true`);
          if (res.ok) {
            const data = await res.json();
            setRecommendations(data.products || []);
          }
        } catch (e) {
          console.debug('Fallback also failed:', e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [selectedPet, pillar, maxProducts]);

  const handlePetChange = (petId) => {
    const pet = userPets.find(p => (p.id || p._id) === petId);
    if (pet) {
      setSelectedPet(pet);
      const messages = config.messages(pet.name);
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      ...product,
      quantity: 1,
      type: 'product'
    });
  };

  // Don't render if no user or no pets
  if (!user || userPets.length === 0) {
    return null;
  }

  // Don't render if no recommendations and not loading
  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`mb-8 bg-gradient-to-r ${config.gradient} rounded-2xl p-6 border ${config.border} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Pet Avatar */}
          <div className="relative">
            {selectedPet?.photo ? (
              <img 
                src={getPetPhotoUrl(selectedPet.photo)} 
                alt={selectedPet.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full ${config.accentBg} flex items-center justify-center text-white text-xl`}>
                {config.emoji}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          
          <div>
            <h3 className={`font-bold text-lg ${config.accent}`}>{message}</h3>
            <p className={`text-sm ${config.accent} opacity-70`}>
              Based on {selectedPet?.name}&apos;s profile • {selectedPet?.breed || 'Mixed'} • {selectedPet?.age ? `${selectedPet.age} years` : ''}
            </p>
          </div>
        </div>
        
        {/* Pet Selector (if multiple pets) */}
        {showPetSelector && userPets.length > 1 && (
          <select 
            value={selectedPet?.id || selectedPet?._id || ''}
            onChange={(e) => handlePetChange(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${config.border} bg-white text-sm`}
          >
            {userPets.map(pet => (
              <option key={pet.id || pet._id} value={pet.id || pet._id}>
                🐕 {pet.name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 ${config.accent} animate-spin`} />
        </div>
      ) : (
        <>
          {/* Recommended Products Carousel */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendations.slice(0, maxProducts).map(product => (
              <div key={product.id || product._id} className="flex-shrink-0 w-40">
                <div 
                  onClick={() => navigate(`/product/${product.id || product._id}`)}
                  className="block group cursor-pointer"
                >
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.title || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{product.title || product.name}</p>
                      <p className={`text-xs ${config.accent} font-bold`}>₹{product.price || product.minPrice}</p>
                    </div>
                    <Badge className={`absolute top-2 right-2 ${config.accentBg} text-white text-[10px]`}>
                      For {selectedPet?.name}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-opacity-30 flex items-center justify-between" style={{ borderColor: 'currentColor' }}>
            <p className={`text-sm ${config.accent}`}>
              <Gift className="w-4 h-4 inline mr-1" />
              Shopping for another pet? 
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/shop?pillar=${pillar}`)}
                className={`text-sm font-medium ${config.accent} hover:opacity-80 underline`}
              >
                Browse Full Collection →
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPet(null);
                  setRecommendations([]);
                }}
                className={`text-xs ${config.border} hover:opacity-80`}
              >
                Clear
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonalizedPicks;
