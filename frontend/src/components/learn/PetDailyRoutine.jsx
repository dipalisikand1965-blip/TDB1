/**
 * PetDailyRoutine.jsx
 * Personalized daily routine suggestions based on pet profile
 * NOW FETCHES REAL PRODUCTS from Product Box with actual images
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Sun, Cloud, Sunset, Moon, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import { API_URL } from '../../utils/api';

const getRoutineSuggestions = (pet) => {
  const isSenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  
  if (isSenior) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['20-30 min gentle walk', 'Hydration check', 'Joint supplement'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Cool resting area', 'Short movement break', 'Light play'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Long relaxed walk', 'Light stretching', 'Slow feeder dinner'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Orthopedic bed', 'Calm environment', 'Comfort check'],
      },
      productKeywords: ['senior', 'orthopedic', 'joint', 'comfort', 'slow feeder', 'supplement']
    };
  }
  
  if (isPuppy) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['Potty break', 'Breakfast', 'Short play session'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Training session (10 min)', 'Nap time', 'Socialization'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Active play', 'Dinner', 'Calm bonding time'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Last potty break', 'Crate time', 'Quiet sleep'],
      },
      productKeywords: ['puppy', 'training', 'crate', 'treat', 'clicker', 'starter']
    };
  }
  
  // Adult dog default
  return {
    morning: {
      icon: Sun,
      color: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      activities: ['45-60 min walk', 'Morning meal', 'Training recap'],
    },
    midday: {
      icon: Cloud,
      color: 'from-sky-100 to-blue-100',
      iconColor: 'text-sky-600',
      activities: ['Enrichment toys', 'Rest period', 'Short play'],
    },
    evening: {
      icon: Sunset,
      color: 'from-rose-100 to-pink-100',
      iconColor: 'text-rose-600',
      activities: ['Long walk or run', 'Evening meal', 'Play time'],
    },
    night: {
      icon: Moon,
      color: 'from-indigo-100 to-purple-100',
      iconColor: 'text-indigo-600',
      activities: ['Last walk', 'Calm time', 'Sleep routine'],
    },
    productKeywords: ['training', 'enrichment', 'puzzle', 'leash', 'toy', 'bed']
  };
};

const PetDailyRoutine = ({ pet, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const routine = getRoutineSuggestions(pet);
  
  // Fetch REAL products from Product Box based on routine keywords
  useEffect(() => {
    const fetchRoutineProducts = async () => {
      setLoading(true);
      try {
        // Fetch products from Product Box
        const response = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || [];
          
          // Filter products based on routine keywords
          const keywords = routine.productKeywords || [];
          const petBreed = (pet?.breed || '').toLowerCase();
          
          // Score products by relevance
          const scoredProducts = allProducts.map(p => {
            let score = 0;
            const name = (p.name || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            const tags = (p.tags || []).map(t => t.toLowerCase());
            
            // Check keyword matches
            keywords.forEach(kw => {
              if (name.includes(kw)) score += 3;
              if (description.includes(kw)) score += 1;
              if (tags.includes(kw)) score += 2;
            });
            
            // Bonus for breed match
            if (petBreed && (name.includes(petBreed) || tags.includes(petBreed))) {
              score += 5;
            }
            
            // Must have an image
            const hasImage = p.image_url || p.image || (p.images && p.images[0]);
            if (!hasImage) score = 0;
            
            return { ...p, score };
          });
          
          // Sort by score and take top 4
          const topProducts = scoredProducts
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
          
          // If not enough products, fill with any products that have images
          if (topProducts.length < 4) {
            const remainingNeeded = 4 - topProducts.length;
            const existingIds = topProducts.map(p => p.id);
            const additionalProducts = allProducts
              .filter(p => !existingIds.includes(p.id) && (p.image_url || p.image))
              .slice(0, remainingNeeded);
            topProducts.push(...additionalProducts);
          }
          
          setProducts(topProducts);
        }
      } catch (error) {
        console.error('Failed to fetch routine products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutineProducts();
  }, [pet?.breed, pet?.age_months]);

  if (!pet) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-stone-50 to-amber-50 border-0 shadow-lg" data-testid="pet-daily-routine">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {pet.name}'s Daily Routine
      </h2>
      <p className="text-gray-600 mb-6">Personalized schedule based on {pet.breed || 'your pet'}'s needs</p>
      
      {/* Routine Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {['morning', 'midday', 'evening', 'night'].map((time) => {
          const slot = routine[time];
          const Icon = slot.icon;
          return (
            <Card key={time} className={`p-4 bg-gradient-to-br ${slot.color} border-0`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${slot.iconColor}`} />
                <h3 className="font-semibold capitalize text-gray-800">{time}</h3>
              </div>
              <ul className="space-y-1.5">
                {slot.activities.map((activity, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {activity}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      
      {/* Products Section - REAL products from Product Box */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Products that support {pet.name}'s routine
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {products.map((product, idx) => {
              const imageUrl = product.image_url || product.image || product.images?.[0];
              
              return (
                <Card 
                  key={product.id || idx}
                  className="p-3 cursor-pointer hover:shadow-lg transition-all bg-white group overflow-hidden"
                  onClick={() => onProductClick?.(product)}
                  data-testid={`routine-product-${idx}`}
                >
                  <div className="aspect-square rounded-xl mb-3 overflow-hidden bg-gradient-to-br from-stone-50 to-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                  <p className="text-sm text-amber-600 font-semibold mt-1">
                    ₹{product.price || product.pricing?.selling_price || '999'}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-2 group-hover:text-amber-500 transition-colors" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PetDailyRoutine;
