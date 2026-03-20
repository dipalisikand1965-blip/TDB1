/**
import { tdc } from '../utils/tdc_intent';
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
import { Sparkles, ChevronRight, RefreshCw, PawPrint, Heart, ShoppingCart } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';
import { usePillarContext } from '../context/PillarContext';
import { useAuth } from '../context/AuthContext';
import SoulMadeProductModal from './SoulMadeProductModal';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/use-toast';
import { getArchetypeDisplayInfo, getProductIntro, getPillarAwareProductIntro } from '../utils/archetypeCopy';

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
  },
  paperwork: {
    name: "Document Organization",
    collections: ["documents", "paperwork", "records"],
    product_types: ["collar_tag", "keychain"],
    exclude: [],
    emoji: "📋",
    copy: (name) => `${name}'s document essentials`
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

  // Handle price - could be number, object, or undefined/null
  const priceValue = (product.price && typeof product.price === 'object')
    ? (product.price.amount || product.price.price || product.price.value)
    : product.price;
  const price = priceValue ? `₹${priceValue}` : 'Price on request';
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50">
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-purple-700">{product.breed_name}</p>
              <p className="text-xs text-gray-500 mt-1">Personalized for {petName}</p>
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
            {petName}
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
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-purple-600">
            {price}
          </p>
          <Badge className="bg-purple-100 text-purple-700 text-xs capitalize">
            {product.product_type?.replace('_', ' ')}
          </Badge>
        </div>
        
        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            tdc.view({ product, pillar: product?.pillar || 'shop', channel: 'soul_made_collection_card' });
            onViewDetails?.(product);
          }}
          className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
          data-testid={`add-to-cart-${product.id}`}
        >
          <ShoppingCart className="w-4 h-4" />
          Add
        </button>
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
  const { addToCart, setIsCartOpen } = useCart();
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
    
    // Convert Soul Made item to cart format
    const cartProduct = {
      id: cartItem.product_id,
      name: cartItem.name,
      price: cartItem.unit_price,
      image: cartItem.mockup_url,
      // Soul Made specific fields
      isSoulMade: true,
      customization: {
        pet_name: cartItem.custom_name,
        breed: cartItem.breed,
        breed_name: cartItem.breed_name,
        size: cartItem.size,
        color: cartItem.color
      }
    };
    
    // Add to cart via context
    addToCart(cartProduct, cartItem.size, cartItem.color, cartItem.quantity);
    
    toast({
      title: "Added to Cart! 🎉",
      description: `${cartItem.name} has been added to your cart`,
    });
    
    // Open cart drawer
    setIsCartOpen(true);
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
      // Build query - Don't require mockups, show products even without images
      // The component will show a placeholder for products without mockups
      let url = `${API_URL}/api/mockups/breed-products?breed=${petBreedKey}&limit=${maxItems}`;
      
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

  // Clear products AND error when pet changes to prevent stale data
  useEffect(() => {
    console.log('[SoulMadeCollection] 🔄 Pet changed, clearing products and error');
    setProducts([]);
    setError(null);
    setLoading(true); // Show loading state immediately
  }, [currentPet?.id, currentPet?.name]);

  // Debug logging - Enhanced for breed tracking
  useEffect(() => {
    console.log('[SoulMadeCollection] 🐕 Pet State:', {
      petId: currentPet?.id,
      petName: currentPet?.name,
      petBreed: currentPet?.breed,
      computedBreedKey: petBreedKey,
      expectedApiUrl: petBreedKey ? `${API_URL}/api/mockups/breed-products?breed=${petBreedKey}` : 'N/A',
      pillar,
      productsCount: products.length,
      firstProductBreed: products[0]?.breed_name || 'N/A',
      archetype
    });
  }, [currentPet?.id, currentPet?.name, currentPet?.breed, petBreedKey, pillar, products.length, archetype, products]);

  // Fallback products when breed mockups aren't ready yet
  const fallbackProducts = [
    {
      id: 'fallback-custom-mug',
      name: 'Custom Photo Mug',
      product_type: 'mug',
      breed_name: petName ? `For ${petName}` : 'Custom',
      description: 'Your pet\'s photo on a beautiful ceramic mug',
      price: 599,
      mockup_url: null,
      is_fallback: true
    },
    {
      id: 'fallback-custom-bandana',
      name: 'Custom Name Bandana',
      product_type: 'bandana',
      breed_name: petName ? `For ${petName}` : 'Custom',
      description: 'Stylish bandana with your pet\'s name',
      price: 399,
      mockup_url: null,
      is_fallback: true
    },
    {
      id: 'fallback-custom-frame',
      name: 'Pet Portrait Frame',
      product_type: 'frame',
      breed_name: petName ? `For ${petName}` : 'Custom',
      description: 'Beautiful frame for your favorite pet photo',
      price: 799,
      mockup_url: null,
      is_fallback: true
    },
    {
      id: 'fallback-custom-tag',
      name: 'Custom ID Tag',
      product_type: 'collar_tag',
      breed_name: petName ? `For ${petName}` : 'Custom',
      description: 'Engraved with name and your contact info',
      price: 299,
      mockup_url: null,
      is_fallback: true
    }
  ];

  // Use fallback products if no breed products available
  const displayProducts = products.length > 0 ? products : fallbackProducts;
  const usingFallback = products.length === 0;

  // Don't render if no pet or no breed
  if (!currentPet || !petBreedKey) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`${className}`} data-testid="soul-made-collection-loading">
        <div className="animate-pulse flex space-x-4">
          <div className="h-48 bg-purple-100 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} data-testid="soul-made-collection">
      {/* Section Header */}
      {showTitle && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              {/* Get archetype info for personalized copy */}
              {(() => {
                const archetypeKey = archetype || currentPet?.soul_archetype?.primary_archetype;
                const archetypeInfo = getArchetypeDisplayInfo(archetypeKey);
                // Use pillar-aware copy to avoid inappropriate "fun/party" text on farewell page
                const personalizedIntro = getPillarAwareProductIntro(archetypeKey, petName, petBreedKey, pillar);
                
                // Special heading for farewell pillar
                const isMemorial = pillar === 'farewell';
                const headingText = isMemorial ? `Forever in our hearts` : `Made for ${petName}`;
                
                return (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-xl">{isMemorial ? '💜' : archetypeInfo.emoji}</span>
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      {headingText}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {personalizedIntro} • {pillarConfig.emoji} {pillarConfig.name}
                    </p>
                  </>
                );
              })()}
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
      {!loading && displayProducts.length > 0 && (
        <>
          {usingFallback && pillar !== 'farewell' && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  <strong>Breed-specific designs coming soon!</strong> 
                  {' '}Meanwhile, explore these custom options for {petName}.
                </span>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayProducts.map(product => (
              <SoulMadeProductCard
                key={product.id}
                product={product}
                petName={petName}
                archetype={archetype}
                onViewDetails={handleProductClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Soul-Level Personalization Note */}
      {!loading && displayProducts.length > 0 && (
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
