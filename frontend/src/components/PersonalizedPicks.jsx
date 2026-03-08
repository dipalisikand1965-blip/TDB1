/**
 * PersonalizedPicks.jsx
 * "Made with love for [Pet Name]" personalized recommendations bar
 * Shows on all pillar pages when user is logged in and has pets
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Sparkles, ChevronLeft, ChevronRight, Gift, Heart,
  ShoppingCart, Loader2, PawPrint, User, Cake, Coffee,
  Frame, PartyPopper, Image, Key, Crown, Star
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductCard';
import ProductMockupGenerator from './ProductMockupGenerator';
import { getBreedIllustrationByName } from '../utils/breedIllustrations';

// Category icon mapping for beautiful icon cards
const CATEGORY_ICONS = {
  'breed-cakes': { icon: Cake, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-100' },
  'cakes': { icon: Cake, gradient: 'from-pink-400 to-rose-500', bg: 'bg-gradient-to-br from-pink-50 to-rose-100' },
  'celebration': { icon: PartyPopper, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-100' },
  'cups_merch': { icon: Coffee, gradient: 'from-amber-400 to-orange-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-100' },
  'bandanas': { icon: Crown, gradient: 'from-purple-400 to-violet-500', bg: 'bg-gradient-to-br from-purple-50 to-violet-100' },
  'accessories': { icon: Star, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
  'celebration_addons': { icon: PartyPopper, gradient: 'from-green-400 to-emerald-500', bg: 'bg-gradient-to-br from-green-50 to-emerald-100' },
  'treats': { icon: Gift, gradient: 'from-red-400 to-pink-500', bg: 'bg-gradient-to-br from-red-50 to-pink-100' },
  'default': { icon: Gift, gradient: 'from-gray-400 to-slate-500', bg: 'bg-gradient-to-br from-gray-50 to-slate-100' }
};

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
  const [repeatSuggestions, setRepeatSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Modal state for product detail
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
            } else {
              // No pets - stop loading
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.debug('Failed to fetch pets:', err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
      // Note: Don't set loading=false here if pets were found
      // The recommendations useEffect will handle that
    };
    fetchPets();
  }, [user, token, pillar]);

  // Fetch recommendations when pet changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!selectedPet) return;
      
      setLoading(true);
      try {
        // Fetch personalized recommendations
        const res = await fetch(
          `${API_URL}/api/products/recommendations/for-pet/${selectedPet.id || selectedPet._id}?limit=${maxProducts}&pillar=${pillar}`
        );
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
        
        // Also fetch repeat purchase suggestions (buying behavior)
        try {
          const repeatRes = await fetch(
            `${API_URL}/api/buying-behavior/repeat-purchase-suggestions/${selectedPet.id || selectedPet._id}?limit=4`
          );
          if (repeatRes.ok) {
            const repeatData = await repeatRes.json();
            setRepeatSuggestions(repeatData.repeat_suggestions || []);
          }
        } catch (repeatErr) {
          console.debug('Failed to fetch repeat suggestions:', repeatErr);
        }
      } catch (err) {
        console.debug('Failed to fetch recommendations:', err);
        // Fallback to pillar-specific products from product-box
        try {
          const res = await fetch(`${API_URL}/api/product-box/products?limit=${maxProducts}&pillar=${pillar}`);
          if (res.ok) {
            const data = await res.json();
            setRecommendations(data.products || []);
          }
        } catch (e) {
          // Final fallback - get any products
          try {
            const finalRes = await fetch(`${API_URL}/api/product-box/products?limit=${maxProducts}`);
            if (finalRes.ok) {
              const finalData = await finalRes.json();
              setRecommendations(finalData.products || []);
            }
          } catch (finalErr) {
            console.debug('All fallbacks failed:', finalErr);
          }
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

  // Show a minimal version if no recommendations but has pets - try to fetch fallback products
  if (!loading && recommendations.length === 0) {
    // Try to fetch some products for this pillar as a last resort
    const fetchFallback = async () => {
      try {
        const res = await fetch(`${API_URL}/api/product-box/products?limit=8&pillar=${pillar}`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setRecommendations(data.products);
          }
        }
      } catch (e) {
        console.debug('Fallback fetch failed:', e);
      }
    };
    fetchFallback();
    
    return (
      <div className={`mb-8 bg-gradient-to-r ${config.gradient} rounded-2xl p-4 sm:p-6 border ${config.border} ${className}`}>
        <div className="flex items-center gap-3">
          {selectedPet?.photo ? (
            <img 
              src={getPetPhotoUrl(selectedPet.photo)} 
              alt={selectedPet?.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${config.accentBg} flex items-center justify-center text-white text-xl`}>
              {config.emoji}
            </div>
          )}
          <div>
            <h3 className={`font-bold text-base sm:text-lg ${config.accent}`}>
              {config.emoji} Loading picks for {selectedPet?.name || 'your pet'}...
            </h3>
            <p className={`text-xs sm:text-sm ${config.accent} opacity-70`}>
              Based on {selectedPet?.breed || 'your pet'}'s profile • Browse our collection below
            </p>
          </div>
        </div>
      </div>
    );
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
          {/* Recommended Products Carousel - Real images for Shopify, Icons for PICKS */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendations.slice(0, maxProducts).map(product => {
              // Detect if this is a breed-specific PICK (seeded product) vs real Shopify product
              const isBreedPick = product.who_for || product.id?.startsWith('bp-') || product.what_is;
              
              // Get icon config for breed picks
              const categoryKey = product.category || product.sub_category || 'default';
              const iconConfig = CATEGORY_ICONS[categoryKey] || CATEGORY_ICONS['default'];
              const IconComponent = iconConfig.icon;
              
              // Check if product has a real image (Shopify products)
              const hasRealImage = product.image?.startsWith('http') || product.images?.[0]?.startsWith('http');
              const productImage = product.image || product.images?.[0];
              
              return (
                <div key={product.id || product._id} className="flex-shrink-0 w-44">
                  <div 
                    data-testid={`pick-card-${product.id || product._id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Open modal instead of navigating
                      setSelectedProduct(product);
                      setShowModal(true);
                    }}
                    className="block group cursor-pointer"
                  >
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                      {/* Show real image for Shopify products, icon for PICKS */}
                      {hasRealImage && !isBreedPick ? (
                        // Real Shopify product with image - use mockup generator for soul_made
                        <div className="aspect-square bg-gray-100">
                          {product.soul_tier === 'soul_made' && selectedPet?.name ? (
                            <ProductMockupGenerator
                              productImage={productImage}
                              productName={product.title || product.name}
                              petName={selectedPet.name}
                              breedIllustration={selectedPet?.breed ? getBreedIllustrationByName(selectedPet.breed) : null}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <img 
                              src={productImage} 
                              alt={product.title || product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                // Use purple gradient as fallback
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');
                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div>';
                              }}
                            />
                          )}
                          <Badge className={`absolute top-2 right-2 ${config.accentBg} text-white text-[10px]`}>
                            For {selectedPet?.name}
                          </Badge>
                        </div>
                      ) : (
                        // Breed-specific PICK with beautiful icon card
                        <div className={`aspect-square ${iconConfig.bg} flex items-center justify-center relative`}>
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${iconConfig.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-white/60" />
                          <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white/40" />
                          <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-white/60" />
                          <Badge className={`absolute top-2 right-2 bg-gradient-to-r ${iconConfig.gradient} text-white text-[10px] border-0 shadow-sm`}>
                            For {selectedPet?.name}
                          </Badge>
                        </div>
                      )}
                      {/* Product info */}
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {product.title || product.what_is || product.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {product.why_fits || product.vendor || product.category || 'Special Edition'}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <p className={`text-sm font-bold ${config.accent}`}>
                            ₹{product.price || product.minPrice || '999'}
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className={`p-1.5 rounded-full ${config.accentBg} text-white hover:opacity-90 transition-opacity`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer Actions - Simplified */}
          <div className="mt-4 pt-4 border-t border-opacity-30 flex items-center justify-end gap-3" style={{ borderColor: 'currentColor' }}>
            <button 
              onClick={() => navigate(`/${pillar}?category=custom`)}
              className={`text-sm font-medium ${config.accent} hover:opacity-80 flex items-center gap-1`}
            >
              ✨ Custom for {selectedPet?.name} →
            </button>
            <button 
              onClick={() => navigate(`/shop?pillar=${pillar}`)}
              className={`text-sm font-medium ${config.accent} hover:opacity-80 underline`}
            >
              Browse All →
            </button>
          </div>
          
          {/* Product Detail Modal - Using Portal for proper z-index */}
          {showModal && selectedProduct && createPortal(
            <ProductDetailModal 
              product={selectedProduct}
              pillar={pillar}
              selectedPet={selectedPet}
              onClose={() => {
                setShowModal(false);
                setSelectedProduct(null);
              }}
            />,
            document.body
          )}
        </>
      )}
    </div>
  );
};

export default PersonalizedPicks;
