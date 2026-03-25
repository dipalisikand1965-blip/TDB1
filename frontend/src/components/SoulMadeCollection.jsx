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
    label: "Birthday & Gotcha",
    collections: ["birthday", "gotcha", "celebration", "party"],
    product_types: ["bandana", "party_hat", "frame", "keychain", "mug", "tote_bag"],
    exclude: ["memorial", "farewell", "remembrance", "cake"],
    emoji: "🎂",
    color: "#A855F7",
    copy: (name) => `Celebrate ${name}'s special moments`
  },
  play: {
    name: "Play & Enrichment",
    label: "Play & Enrichment",
    collections: ["play", "fun", "enrichment", "games"],
    product_types: ["bandana", "tote_bag", "keychain", "mug"],
    exclude: ["memorial", "farewell", "remembrance"],
    emoji: "🎾",
    color: "#E76F51",
    copy: (name) => `${name}'s playtime essentials`
  },
  go: {
    name: "Travel & Adventure",
    label: "Travel & Adventure",
    collections: ["travel", "adventure", "outdoor", "go"],
    product_types: ["tote_bag", "collar_tag", "keychain"],
    exclude: ["memorial", "farewell", "remembrance"],
    emoji: "✈️",
    color: "#3498DB",
    copy: (name) => `Adventure awaits ${name}`
  },
  dine: {
    name: "Dine & Treats",
    label: "Food & Treats",
    collections: ["feeding", "treats", "nutrition"],
    product_types: ["bowl", "treat_jar"],
    exclude: ["cake"],
    emoji: "🍽️",
    color: "#C9973A",
    copy: (name) => `${name}'s dining essentials`
  },
  care: {
    name: "Care & Wellness",
    label: "Wellness & Grooming",
    collections: ["wellness", "grooming", "care"],
    product_types: ["collar_tag"],
    exclude: [],
    emoji: "🌿",
    color: "#40916C",
    copy: (name) => `${name}'s wellness essentials`
  },
  farewell: {
    name: "Memorial & Remembrance",
    label: "Memory & Farewell",
    collections: ["memorial", "remembrance", "keepsake"],
    product_types: ["frame"],
    exclude: [],
    emoji: "🌷",
    color: "#8B5CF6",
    copy: (name) => `Always in our hearts`
  },
  learn: {
    name: "Training & Learning",
    label: "Training & Learning",
    collections: ["training", "learning", "education"],
    product_types: ["collar_tag", "keychain"],
    exclude: [],
    emoji: "🎓",
    color: "#7C3AED",
    copy: (name) => `${name}'s learning journey`
  },
  shop: {
    name: "Soul Made Collection",
    label: "Soul Made Collection",
    collections: ["shop", "general"],
    product_types: ["bandana", "mug", "tote_bag", "keychain", "frame", "collar_tag"],
    exclude: [],
    emoji: "✨",
    color: "#F59E0B",
    copy: (name) => `${name}'s soul collection`
  },
  paperwork: {
    name: "Identity & Documents",
    label: "Identity & Documents",
    collections: ["documents", "paperwork", "records"],
    product_types: ["collar_tag", "keychain"],
    exclude: [],
    emoji: "📄",
    color: "#0D9488",
    copy: (name) => `${name}'s document essentials`
  },
  emergency: {
    name: "Safety & Emergency",
    label: "Safety & Emergency",
    collections: ["emergency", "safety"],
    product_types: ["collar_tag"],
    exclude: [],
    emoji: "🚨",
    color: "#EF4444",
    copy: (name) => `${name}'s safety essentials`
  },
  adopt: {
    name: "New Beginnings",
    label: "New Beginnings",
    collections: ["adoption", "new_pet"],
    product_types: ["bandana", "collar_tag", "keychain"],
    exclude: [],
    emoji: "🐾",
    color: "#65A30D",
    copy: (name) => `Welcome home, ${name}`
  },
  parent_gifts: {
    name: "For Dog Mum/Dad",
    label: "Concierge® Services",
    collections: ["parent", "gift", "human"],
    product_types: ["mug", "tote_bag", "keychain"],
    exclude: [],
    emoji: "🤝",
    color: "#0EA5E9",
    copy: (name) => `Gifts for ${name}'s humans`
  },
  advisory: {
    name: "Expert Advisory",
    label: "Expert Advisory",
    collections: ["advisory", "expert"],
    product_types: ["collar_tag"],
    exclude: [],
    emoji: "💡",
    color: "#10B981",
    copy: (name) => `Expert care for ${name}`
  },
  default: {
    name: "Soul Made Collection",
    label: "Soul Made Collection",
    collections: [],
    product_types: [],
    exclude: [],
    emoji: "✨",
    color: "#9B59B6",
    copy: (name) => `${name}'s collection`
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// BREED KEY MAPPING - Normalize breed names to database keys
// ═══════════════════════════════════════════════════════════════════════════

const BREED_KEY_MAP = {
  'labrador': 'labrador',
  'labrador retriever': 'labrador',
  'golden retriever': 'golden_retriever',
  'golden': 'golden_retriever',
  'golden retriever': 'golden_retriever',
  'golden': 'golden_retriever',
  'labrador': 'labrador',
  'labrador retriever': 'labrador',
  'lab': 'labrador',
  'black labrador': 'labrador',
  'yellow labrador': 'labrador',
  'chocolate labrador': 'labrador',
  'black husky': 'husky',
  'grey husky': 'husky',
  'white husky': 'husky',
  'toy poodle': 'poodle',
  'miniature poodle': 'poodle',
  'dobermann': 'doberman',
  'shnoodle': 'schnoodle',
  'maltipoo': 'maltipoo',
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
  // Try exact map match first
  if (BREED_KEY_MAP[normalized]) return BREED_KEY_MAP[normalized];
  // Smart fallback: spaces → underscores (handles any breed not in the map)
  return normalized.replace(/\s+/g, '_').replace(/-/g, '_');
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
  maxItems = 60,
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
  const [visibleCount, setVisibleCount] = useState(12);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get breed key and pet info
  const petBreedKey = currentPet?.breed ? getBreedKey(currentPet.breed) : null;
  const petName = currentPet?.name || 'Your Pet';
  const breedName = currentPet?.breed || '';

  // Get pillar-specific configuration
  const pillarConfig = EMOTIONAL_COLLECTIONS[pillar] || EMOTIONAL_COLLECTIONS.default;

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
        
        // Safety net: only show proper product mockups (breed- prefix filename)
        filteredProducts = filteredProducts.filter(p => {
          const url = p.mockup_url || p.cloudinary_url || p.image_url || "";
          if (!url) return false;
          const fname = url.split("/").pop() || "";
          return fname.startsWith("breed-");
        });
        
        // Filter out excluded product types (exact match on product_type)
        if (pillarConfig.exclude?.length > 0) {
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

  // Separate flat art and watercolour, then interleave them for side-by-side display
  const flatProducts = (products.length > 0 ? products : fallbackProducts)
    .filter(p => p.art_style === 'flat' || p.product_type?.startsWith('flat_'));
  const watercolourProducts = (products.length > 0 ? products : fallbackProducts)
    .filter(p => p.art_style !== 'flat' && !p.product_type?.startsWith('flat_'));

  // Pair: watercolour first, flat art second for each product type
  const pairedProducts = [];
  const usedFlat = new Set();
  watercolourProducts.forEach(wc => {
    pairedProducts.push({ ...wc, _displayStyle: 'watercolour' });
    // Find matching flat art by product_type base
    const wcType = wc.product_type?.replace('flat_','');
    const match = flatProducts.find(f =>
      !usedFlat.has(f.id) &&
      (f.product_type === `flat_${wcType}` || f.product_type?.replace('flat_','') === wcType)
    );
    if (match) { pairedProducts.push({ ...match, _displayStyle: 'flat' }); usedFlat.add(match.id); }
  });
  // Add any remaining flat products not paired
  flatProducts.filter(f => !usedFlat.has(f.id)).forEach(f =>
    pairedProducts.push({ ...f, _displayStyle: 'flat' })
  );

  const displayProducts = pairedProducts.length > 0 ? pairedProducts : (products.length > 0 ? products : fallbackProducts);
  const visibleProducts = displayProducts.slice(0, visibleCount);
  const hasMore = displayProducts.length > visibleCount;
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
            {visibleProducts.map(product => (
              <div key={product.id} className="relative">
                {/* Art style badge */}
                {product._displayStyle === 'flat' && (
                  <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    Flat Art
                  </div>
                )}
                {product._displayStyle === 'watercolour' && (
                  <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    Watercolour
                  </div>
                )}
                <SoulMadeProductCard
                  product={product}
                  petName={petName}
                  archetype={archetype}
                  onViewDetails={handleProductClick}
                />
              </div>
            ))}
          </div>

          {/* See more button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + 12)}
                data-testid="soul-made-see-more"
                className="px-6 py-2.5 rounded-full text-sm font-semibold border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
              >
                See more ({displayProducts.length - visibleCount} more) →
              </button>
            </div>
          )}
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
