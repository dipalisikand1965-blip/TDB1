/**
 * SoulMadeCollection.jsx
 * 
 * "SOUL MADE" - Fully personalized products driven by pet data
 * 
 * The core principle:
 * "This is Milo. He is gentle, slightly dramatic, hates thunder, 
 *  sleeps near the left foot of the bed, loves mango, and becomes 
 *  absurdly proud on birthdays."
 * 
 * NOT: "This is a Labrador"
 * 
 * Shows:
 * - Products filtered by logged-in user's pet's EXACT breed
 * - AI-generated mockups with breed illustration printed ON products
 * - Pet's name on products
 * - Organized by emotional collection (Birthday & Gotcha, NOT Memorial)
 * 
 * Does NOT show:
 * - Generic products
 * - Wrong breed products (Great Dane for an Indie dog)
 * - Memorial products in Celebrate (those go to Farewell)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ChevronRight, RefreshCw, PawPrint, Heart } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';
import { usePillarContext } from '../context/PillarContext';
import { useAuth } from '../context/AuthContext';
import SoulMadeProductModal from './SoulMadeProductModal';
import { useToast } from '../hooks/use-toast';

// ═══════════════════════════════════════════════════════════════════════════
// EMOTIONAL COLLECTIONS - Organize by life moment, NOT just product type
// ═══════════════════════════════════════════════════════════════════════════

const EMOTIONAL_COLLECTIONS = {
  celebrate: {
    name: "Birthday & Gotcha",
    collections: ["birthday", "gotcha", "celebration", "party"],
    product_types: ["bandana", "party_hat", "frame", "keychain", "mug", "tote_bag"],
    exclude: ["memorial", "farewell", "remembrance", "cake"],  // EXCLUDE CAKES - use real Doggy Bakery cakes
    emoji: "🎂",
    copy: (name) => `Celebrate ${name}'s special moments`
  },
  dine: {
    name: "Dine & Treats",
    collections: ["feeding", "treats", "nutrition"],
    product_types: ["bowl", "treat_jar"],
    exclude: ["cake"],  // No cakes in Soul Made
    emoji: "🍖",
    copy: (name) => `${name}'s dining essentials`
  },
  stay: {
    name: "At Home",
    collections: ["home", "comfort", "cozy"],
    product_types: ["blanket", "welcome_mat"],
    exclude: ["cake"],
    emoji: "🏠",
    copy: (name) => `${name}'s cozy corner`
  },
  travel: {
    name: "Travel with Me",
    collections: ["travel", "adventure", "outdoor"],
    product_types: ["tote_bag", "collar_tag"],
    exclude: ["cake"],
    emoji: "✈️",
    copy: (name) => `Adventure awaits ${name}`
  },
  care: {
    name: "Care & Wellness",
    collections: ["wellness", "grooming", "care"],
    product_types: ["collar_tag"],
    exclude: [],
    emoji: "🩺",
    copy: (name) => `${name}'s wellness essentials`
  },
  farewell: {
    name: "Memorial & Remembrance",
    collections: ["memorial", "remembrance", "keepsake"],
    product_types: ["frame"],
    exclude: [],
    emoji: "🕊️",
    copy: (name) => `Always in our hearts`
  },
  parent_gifts: {
    name: "For Dog Mum/Dad",
    collections: ["parent", "gift", "human"],
    product_types: ["mug", "tote_bag", "keychain"],
    exclude: [],
    emoji: "❤️",
    copy: (name) => `Gifts for ${name}'s humans`
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BREED KEY MAPPING - Normalize breed names to database keys
// ═══════════════════════════════════════════════════════════════════════════

const BREED_KEY_MAP = {
  'labrador': 'labrador',
  'labrador retriever': 'labrador',
  'golden retriever': 'golden_retriever',
  'golden': 'golden_retriever',
  'cocker spaniel': 'cocker_spaniel',
  'irish setter': 'irish_setter',
  'german shepherd': 'german_shepherd',
  'rottweiler': 'rottweiler',
  'doberman': 'doberman',
  'doberman pinscher': 'doberman',
  'boxer': 'boxer',
  'st bernard': 'st_bernard',
  'saint bernard': 'st_bernard',
  'great dane': 'great_dane',
  'american bully': 'american_bully',
  'husky': 'husky',
  'siberian husky': 'husky',
  'pomeranian': 'pomeranian',
  'chow chow': 'chow_chow',
  'border collie': 'border_collie',
  'beagle': 'beagle',
  'dachshund': 'dachshund',
  'italian greyhound': 'italian_greyhound',
  'dalmatian': 'dalmatian',
  'jack russell': 'jack_russell',
  'jack russell terrier': 'jack_russell',
  'yorkshire terrier': 'yorkshire',
  'yorkshire': 'yorkshire',
  'yorkie': 'yorkshire',
  'scottish terrier': 'scottish_terrier',
  'pug': 'pug',
  'shih tzu': 'shih_tzu',
  'shitzu': 'shih_tzu',
  'chihuahua': 'chihuahua',
  'maltese': 'maltese',
  'lhasa apso': 'lhasa_apso',
  'cavalier king charles spaniel': 'cavalier',
  'cavalier': 'cavalier',
  'french bulldog': 'french_bulldog',
  'frenchie': 'french_bulldog',
  'english bulldog': 'bulldog',
  'bulldog': 'bulldog',
  'poodle': 'poodle',
  'schnoodle': 'schnoodle',
  'indie': 'indie',
  'indian pariah': 'indie',
  'indian pariah dog': 'indie',
  'desi dog': 'indie',
  'street dog': 'indie',
  'mixed': 'indie'
};

const getBreedKey = (breedName) => {
  if (!breedName) return null;
  const normalized = breedName.toLowerCase().trim();
  return BREED_KEY_MAP[normalized] || null;
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT CARD - Personalized with pet's name
// ═══════════════════════════════════════════════════════════════════════════

const SoulMadeProductCard = ({ product, petName, archetype, onViewDetails }) => {
  // Personalize the product name with pet's name
  const getPersonalizedName = () => {
    let name = product.name || product.title || '';
    
    // Replace generic breed with pet's name
    if (name.includes(product.breed_name)) {
      name = name.replace(product.breed_name, petName + "'s");
    }
    
    // Add "for {petName}" if not already personalized
    if (!name.toLowerCase().includes(petName.toLowerCase())) {
      // Smart naming based on product type
      const type = product.product_type;
      if (type === 'cake') return `${petName}'s Birthday Cake`;
      if (type === 'bandana') return `${petName}'s Special Bandana`;
      if (type === 'mug') return `${petName} Lover Mug`;
      if (type === 'bowl') return `${petName}'s Dinner Bowl`;
      if (type === 'blanket') return `${petName}'s Cozy Blanket`;
      if (type === 'welcome_mat') return `Welcome to ${petName}'s Home`;
      if (type === 'treat_jar') return `${petName}'s Treat Jar`;
      if (type === 'tote_bag') return `Proud ${petName} Parent Tote`;
      if (type === 'keychain') return `${petName} Keychain`;
      if (type === 'frame') return `${petName}'s Portrait Frame`;
      if (type === 'party_hat') return `${petName}'s Party Hat`;
      if (type === 'collar_tag') return `${petName}'s ID Tag`;
      return `${name} for ${petName}`;
    }
    return name;
  };

  const price = product.price ? `₹${product.price}` : 'Price on request';
  const personalizedName = getPersonalizedName();

  // Get archetype-based styling
  const getArchetypeAccent = () => {
    if (!archetype) return 'from-purple-600 to-pink-600';
    const styles = {
      'gentle_aristocrat': 'from-amber-600 to-yellow-600',
      'wild_explorer': 'from-green-600 to-emerald-600',
      'velcro_baby': 'from-pink-500 to-rose-500',
      'snack_negotiator': 'from-orange-500 to-amber-500',
      'quiet_watcher': 'from-slate-500 to-gray-600',
      'social_butterfly': 'from-purple-500 to-pink-500',
      'brave_worrier': 'from-violet-500 to-purple-600'
    };
    return styles[archetype] || 'from-purple-600 to-pink-600';
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white border-0 shadow-md"
      onClick={() => onViewDetails?.(product)}
      data-testid={`soul-made-product-${product.id}`}
    >
      {/* Image with Soul Made badge */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.mockup_url ? (
          <img 
            src={product.mockup_url}
            alt={personalizedName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-center">
              <PawPrint className="w-12 h-12 text-purple-300 mx-auto mb-2" />
              <p className="text-xs text-purple-400">Generating...</p>
            </div>
          </div>
        )}
        
        {/* Soul Made Badge - Premium feel */}
        <div className={`absolute top-3 left-3 bg-gradient-to-r ${getArchetypeAccent()} rounded-full px-3 py-1 shadow-lg`}>
          <span className="text-white text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Soul Made
          </span>
        </div>

        {/* For {Pet} tag - Shows this will be personalized */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
          <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Add {petName}'s name
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Name - Shows what it will be */}
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm leading-tight">
          {personalizedName}
        </h4>
        
        {/* Breed info */}
        <p className="text-xs text-gray-500 mb-2">
          {product.breed_name || 'Personalized'}
        </p>
        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-purple-600">
            {price}
          </p>
          <Badge className="bg-purple-100 text-purple-700 text-xs capitalize">
            {product.product_type?.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const SoulMadeCollection = ({ 
  pillar = 'celebrate',
  maxItems = 12,
  showTitle = true,
  className = '' 
}) => {
  const { currentPet } = usePillarContext();
  const { token } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [archetype, setArchetype] = useState(null);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get breed key and pet info
  const petBreedKey = currentPet?.breed ? getBreedKey(currentPet.breed) : null;
  const petName = currentPet?.name || 'Your Pet';
  const breedName = currentPet?.breed || '';

  // Get pillar-specific configuration
  const pillarConfig = EMOTIONAL_COLLECTIONS[pillar] || EMOTIONAL_COLLECTIONS.celebrate;

  // Handle product click - open modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Handle add to cart from modal
  const handleAddToCart = (cartItem) => {
    console.log('[SoulMadeCollection] Add to cart:', cartItem);
    toast({
      title: "Added to Cart",
      description: `${cartItem.name} has been added to your cart`,
    });
    // TODO: Integrate with actual cart system
  };

  // Fetch archetype for styling
  useEffect(() => {
    const fetchArchetype = async () => {
      if (!currentPet?.id || !token) return;
      
      try {
        const res = await fetch(`${API_URL}/api/pets/${currentPet.id}/archetype`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setArchetype(data.primary_archetype);
        }
      } catch (err) {
        console.log('[SoulMadeCollection] Could not fetch archetype');
      }
    };
    
    fetchArchetype();
  }, [currentPet?.id, token]);

  // Fetch breed-specific products
  const fetchBreedProducts = useCallback(async () => {
    if (!petBreedKey) {
      console.log('[SoulMadeCollection] No breed key, skipping fetch');
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query
      let url = `${API_URL}/api/mockups/breed-products?breed=${petBreedKey}&has_mockup=true&limit=${maxItems}`;
      
      // Add pillar filter
      if (pillar && pillar !== 'all') {
        url += `&pillar=${pillar}`;
      }

      console.log('[SoulMadeCollection] Fetching:', url);

      const response = await fetch(url);

      console.log('[SoulMadeCollection] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[SoulMadeCollection] Got products:', data.count);
        
        let filteredProducts = data.products || [];
        
        // Filter out excluded product types (exact match on product_type)
        if (pillarConfig.exclude.length > 0) {
          filteredProducts = filteredProducts.filter(p => {
            const pType = (p.product_type || '').toLowerCase();
            // Only exclude if product_type exactly matches an excluded type
            return !pillarConfig.exclude.includes(pType);
          });
        }
        
        console.log('[SoulMadeCollection] After filter:', filteredProducts.length);
        setProducts(filteredProducts);
      } else {
        const errorText = await response.text();
        console.error('[SoulMadeCollection] API error:', errorText);
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('[SoulMadeCollection] Error:', err);
      setError('Could not load personalized products');
    } finally {
      setLoading(false);
    }
  }, [petBreedKey, pillar, pillarConfig, maxItems]);

  // Load products when dependencies change
  useEffect(() => {
    fetchBreedProducts();
  }, [fetchBreedProducts]);

  // Debug logging
  useEffect(() => {
    console.log('[SoulMadeCollection] State:', {
      pet: petName,
      breed: currentPet?.breed,
      breedKey: petBreedKey,
      pillar,
      productsCount: products.length,
      archetype
    });
  }, [petName, currentPet?.breed, petBreedKey, pillar, products.length, archetype]);

  // Don't render if no pet or no breed
  if (!currentPet || !petBreedKey) {
    return null;
  }

  // Don't render if empty (after loading)
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`} data-testid="soul-made-collection">
      {/* Section Header */}
      {showTitle && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Made for {petName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {pillarConfig.copy(petName)} • {pillarConfig.emoji} {pillarConfig.name}
              </p>
            </div>
            {products.length > 0 && (
              <Button 
                variant="ghost" 
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                data-testid="soul-made-view-all"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-500">Loading {petName}'s products...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
          <p>{error}</p>
          <Button 
            variant="ghost" 
            className="mt-2 text-purple-600"
            onClick={fetchBreedProducts}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map(product => (
            <SoulMadeProductCard
              key={product.id}
              product={product}
              petName={petName}
              archetype={archetype}
              onViewDetails={handleProductClick}
            />
          ))}
        </div>
      )}

      {/* Soul-Level Personalization Note */}
      {!loading && products.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-6 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Soul-Level Personalization • Objects shaped around who {petName} really is
        </p>
      )}

      {/* Product Detail Modal */}
      <SoulMadeProductModal
        product={selectedProduct}
        petName={petName}
        breedName={breedName}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default SoulMadeCollection;
