import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Star, X, CalendarIcon, Plus, Sparkles, MessageSquare, PawPrint, ChevronDown, Award, Check, Loader2, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { API_URL } from '../utils/api';
import { findBreedIllustration, getBreedIllustrationByName } from '../utils/breedIllustrations';
import { getProductMockup } from '../utils/productMockups';
import { tdc } from '../utils/tdc_intent';
import { bookViaConcierge } from '../utils/MiraCardActions';

// Autoship tier discount rates
const AUTOSHIP_DISCOUNT_TIERS = [
  { delivery: 1, discount: 0.20, label: '1st delivery: 20% off' },
  { delivery: 2, discount: 0.25, label: '2nd delivery: 25% off' },
  { delivery: 3, discount: 0.30, label: '3rd delivery: 30% off' },
  { delivery: 4, discount: 0.35, label: '4th delivery: 35% off' },
  { delivery: 5, discount: 0.40, label: '5th delivery: 40% off' },
  { delivery: 6, discount: 0.45, label: '6th delivery: 45% off' },
  { delivery: 7, discount: 0.50, label: '7th+ delivery: 50% off' },
];

// Autoship Calculator Component
const AutoshipCalculator = ({ cartInput, setCartInput, currentPrice, product }) => {
  // Calculate number of deliveries based on date range and frequency
  const calculateDeliveries = () => {
    if (!cartInput.autoshipStartDate || !cartInput.autoshipEndDate || !cartInput.autoshipFrequency) {
      return 0;
    }
    const start = new Date(cartInput.autoshipStartDate);
    const end = new Date(cartInput.autoshipEndDate);
    const frequencyWeeks = parseInt(cartInput.autoshipFrequency);
    const frequencyDays = frequencyWeeks * 7;
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return Math.floor(diffDays / frequencyDays) + 1; // +1 for the first delivery
  };

  // Calculate total price with tiered discounts
  const calculateTotalWithDiscounts = () => {
    const numDeliveries = calculateDeliveries();
    if (numDeliveries <= 0) return { total: 0, savings: 0, breakdown: [] };
    
    let total = 0;
    let savings = 0;
    const breakdown = [];
    
    for (let i = 0; i < numDeliveries; i++) {
      const deliveryNum = i + 1;
      // Find the applicable discount tier
      const tier = AUTOSHIP_DISCOUNT_TIERS.find(t => t.delivery === deliveryNum) 
        || AUTOSHIP_DISCOUNT_TIERS[AUTOSHIP_DISCOUNT_TIERS.length - 1]; // Use 50% for 7+
      
      const originalPrice = currentPrice;
      const discountedPrice = originalPrice * (1 - tier.discount);
      const savingsForDelivery = originalPrice - discountedPrice;
      
      total += discountedPrice;
      savings += savingsForDelivery;
      breakdown.push({
        delivery: deliveryNum,
        originalPrice,
        discountedPrice: Math.round(discountedPrice),
        discount: tier.discount * 100,
        label: tier.label
      });
    }
    
    return { 
      total: Math.round(total), 
      savings: Math.round(savings), 
      breakdown,
      numDeliveries
    };
  };

  const { total, savings, breakdown, numDeliveries } = calculateTotalWithDiscounts();

  return (
    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Frequency selector */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Delivery Frequency</label>
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          value={cartInput.autoshipFrequency || '4'}
          onChange={(e) => setCartInput({...cartInput, autoshipFrequency: e.target.value})}
        >
          <option value="1">Every week</option>
          <option value="2">Every 2 weeks</option>
          <option value="4">Every 4 weeks (Monthly)</option>
          <option value="6">Every 6 weeks</option>
        </select>
      </div>
      
      {/* Date Range Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Start Date</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            value={cartInput.autoshipStartDate || ''}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCartInput({...cartInput, autoshipStartDate: e.target.value})}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">End Date</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            value={cartInput.autoshipEndDate || ''}
            min={cartInput.autoshipStartDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setCartInput({...cartInput, autoshipEndDate: e.target.value})}
          />
        </div>
      </div>
      
      {/* Autoship Summary */}
      {numDeliveries > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
          <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Your Autoship Plan
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Number of deliveries:</span>
              <span className="font-semibold text-green-800">{numDeliveries} deliveries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Regular price:</span>
              <span className="text-gray-500 line-through">₹{currentPrice * numDeliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your total:</span>
              <span className="font-bold text-green-700 text-lg">₹{total}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-green-200">
              <span className="text-green-700 font-medium">You save:</span>
              <span className="font-bold text-green-600">₹{savings} 🎉</span>
            </div>
          </div>
          
          {/* Discount breakdown tooltip */}
          <details className="mt-2">
            <summary className="text-xs text-green-700 cursor-pointer hover:text-green-900">
              View discount breakdown →
            </summary>
            <div className="mt-2 space-y-1 text-xs bg-white rounded p-2 border border-green-100">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between text-gray-600">
                  <span>Delivery {item.delivery} ({item.discount}% off):</span>
                  <span>₹{item.discountedPrice}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Benefits info */}
      <div className="bg-blue-50 rounded-lg p-3 text-xs">
        <p className="font-semibold text-blue-900 mb-2">🎁 Autoship Discount Tiers:</p>
        <ul className="space-y-1 text-blue-800">
          <li>• <strong>1st delivery:</strong> 20% off</li>
          <li>• <strong>2nd delivery:</strong> 25% off</li>
          <li>• <strong>3rd-5th:</strong> 30-40% off</li>
          <li>• <strong>6th+ deliveries:</strong> Up to 50% off!</li>
        </ul>
        <p className="mt-2 text-blue-700 italic">
          Every dog deserves regular treats! 🐕
        </p>
      </div>
      
      <p className="text-xs text-gray-500">
        ✓ Skip, pause, or cancel anytime • ✓ Free to join
      </p>
    </div>
  );
};

// Pillar-specific cross-sell titles
const PILLAR_CROSS_SELL_TITLES = {
  celebrate: "Complete the Celebration!",
  dine: "Complete the Dining Experience!",
  stay: "Complete the Stay!",
  travel: "Complete the Trip!",
  care: "Complete the Care Package!",
  shop: "Complete Your Order!",
  enjoy: "Add More Fun!",
  fit: "Complete the Fitness Pack!",
  learn: "Enhance the Learning!",
  adopt: "Welcome Home Essentials!",
  insure: "Add More Coverage!",
  farewell: "Memorial Additions",
  community: "Community Favorites!",
  default: "You May Also Like"
};

const ProductCard = ({ product, pillar = 'celebrate', selectedPet = null, pet = null, miraContext = null, overrideImageUrl = null, artStyleLabel = null }) => {
  const [showModal, setShowModal] = useState(false);
  const [miraExpanded, setMiraExpanded] = useState(false);
  const { user, token } = useAuth();
  const isServiceProduct = (product.product_type === 'service') || (product.category === 'service');
  const effectiveSelectedPet = selectedPet || pet;
  const isConciergeOnly = pillar === 'paperwork';
  
  // Default miraContext if not provided - generates pillar-appropriate messaging
  const defaultMiraContext = {
    celebrate: {
      quietHints: ['Often paired with celebration setup', 'Can be delivered with a helper', 'Usually combined with a small surprise plan'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s celebration plan`
    },
    dine: {
      quietHints: ['Can be scheduled with feeding times', 'Often paired with portion planning', 'Usually combined with diet tracking'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s meal plan`
    },
    care: {
      quietHints: ['Often paired with vet consultations', 'Can include dosage reminders', 'Usually combined with health tracking'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s care routine`
    },
    travel: {
      quietHints: ['Often paired with travel checklist', 'Can include comfort stops planning', 'Usually combined with accommodation help'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s travel kit`
    },
    enjoy: {
      quietHints: ['Often paired with activity planning', 'Can include weather-based suggestions', 'Usually combined with safety checklist'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s adventure pack`
    },
    fit: {
      quietHints: ['Often paired with exercise tracking', 'Can include progress milestones', 'Usually combined with diet coordination'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s fitness plan`
    },
    shop: {
      quietHints: ['Can be auto-reordered when low', 'Often paired with subscription savings', 'Usually combined with usage tracking'],
      includeText: 'Include',
      addedMessage: (petName) => `Added to ${petName || 'your pet'}'s essentials`
    }
  };
  
  // Use provided miraContext or fall back to default based on pillar
  const effectiveMiraContext = miraContext || defaultMiraContext[pillar] || defaultMiraContext.celebrate;
  
  // Use product's mira_hint from database if available, otherwise generate one
  const getProductMiraTip = () => {
    // First check if product has a mira_hint from database
    if (product.mira_hint) {
      return product.mira_hint;
    }
    
    // Fallback: Generate based on product name/category
    const name = (product.name || '').toLowerCase();
    const tags = (product.tags || []).map(t => t?.toLowerCase() || '');
    const category = (product.category || '').toLowerCase();
    const allText = `${name} ${category} ${tags.join(' ')}`;
    
    // Grooming products
    if (allText.match(/shampoo|conditioner|soap|wash|grooming/)) {
      if (name.includes('oatmeal')) return '✨ Soothes sensitive skin naturally';
      if (name.includes('puppy')) return '✨ Gentle formula for young pups';
      return '✨ For a healthy, shiny coat';
    }
    
    // Travel products
    if (allText.match(/carrier|crate|travel|harness|leash/)) {
      if (name.includes('iata')) return '✨ IATA approved for safe flights';
      if (name.includes('car') || name.includes('safety')) return '✨ Safety-tested for road trips';
      return '✨ Travel-friendly choice';
    }
    
    // Cake-specific tips
    if (name.includes('cake') || category.includes('cake')) {
      if (name.includes('peanut butter')) return '✨ Peanut butter is a pet favorite!';
      if (name.includes('carrot')) return '✨ Carrots add natural sweetness';
      if (name.includes('banana')) return '✨ Banana makes it extra moist';
      if (name.includes('chicken')) return '✨ Savory choice for meat lovers';
      return '✨ Freshly baked with love';
    }
    
    // Meal-specific tips
    if (name.includes('meal') || category.includes('meal') || category.includes('dine')) {
      if (name.includes('mutton')) return '✨ Rich in protein & iron';
      if (name.includes('chicken')) return '✨ Lean protein, easy to digest';
      if (name.includes('paneer')) return '✨ Great vegetarian option';
      if (name.includes('fish')) return '✨ Omega-3 for healthy coat';
      return '✨ Balanced nutrition in every bite';
    }
    
    // Treat-specific tips
    if (name.includes('treat') || category.includes('treat')) {
      if (name.includes('dental')) return '✨ Helps keep teeth clean';
      if (name.includes('training')) return '✨ Perfect size for rewards';
      if (name.includes('soft')) return '✨ Easy for seniors to chew';
      return '✨ Tail-wagging guaranteed';
    }
    
    // Pizza/burger tips
    if (name.includes('pizza') || name.includes('burger')) {
      return '✨ A fun twist on mealtime';
    }
    
    // Frozen treats
    if (name.includes('frozen') || name.includes('ice')) {
      return '✨ Perfect for hot days';
    }
    
    // Default based on pillar
    if (pillar === 'celebrate') return '✨ Makes celebrations special';
    if (pillar === 'dine') return '✨ Nutritious & delicious';
    if (pillar === 'care') return '✨ For your pet\'s wellbeing';
    if (pillar === 'travel') return '✨ Travel-friendly choice';
    if (pillar === 'enjoy') return '✨ Adventure ready';
    
    return '✨ Mira recommends';
  };
  
  const productMiraTip = getProductMiraTip();
  
  // Fallback placeholder image
  const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F5F0EB"/><g fill="%23C4A882" opacity="0.7"><circle cx="50" cy="56" r="15"/><circle cx="34" cy="43" r="7"/><circle cx="66" cy="43" r="7"/><circle cx="42" cy="37" r="7"/><circle cx="58" cy="37" r="7"/></g></svg>')}`;

  // Helper: reject broken/staging URLs — never show emergentagent.com or empty URLs
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('http')) return false;
    if (url.includes('emergentagent.com')) return false; // broken staging URLs — always skip
    if (url.includes('static.prod-images')) return false; // same staging CDN
    return true;
  };
  
  // Get valid image - PRIORITY: watercolor_image → cloudinary_url → mockup_url → primary_image → image_url → image (only Shopify/Cloudinary) → images[0] (only Shopify)
  const getValidImage = () => {
    // 1. watercolor_image — admin AI-generated breed illustration (highest priority)
    if (isValidUrl(product.watercolor_image)) return product.watercolor_image;

    // 2. cloudinary_url — direct Cloudinary upload
    if (isValidUrl(product.cloudinary_url)) return product.cloudinary_url;

    // 3. mockup_url — breed product mockup
    if (isValidUrl(product.mockup_url)) return product.mockup_url;

    // 4. primary_image
    if (isValidUrl(product.primary_image)) return product.primary_image;

    // 5. image_url — clean curated URL
    if (isValidUrl(product.image_url)) return product.image_url;

    // 6. Shopify CDN or Cloudinary images in `image` field
    if (isValidUrl(product.image) && (product.image.includes('shopify.com') || product.image.includes('cloudinary.com'))) {
      return product.image;
    }
    
    // 3. For breed-specific products (IDs like "breed-cavalier-welcome_kit"), use breed illustration
    const productId = product.id || '';
    if (productId.startsWith('breed-')) {
      const breedKey = productId.replace('breed-', '').split('-')[0];
      const breedIllustration = getBreedIllustrationByName(breedKey);
      if (breedIllustration) {
        return breedIllustration;
      }
      const productName = (product.name || product.title || '').toLowerCase();
      const breedMatch = findBreedIllustration(productName);
      if (breedMatch) {
        return breedMatch.imageUrl;
      }
    }
    
    // 4. For soul_made products only, check for breed illustration
    if (product.soul_tier === 'soul_made') {
      const productName = (product.name || product.title || '').toLowerCase();
      const breedMatch = findBreedIllustration(productName);
      if (breedMatch) {
        return breedMatch.imageUrl;
      }
    }
    
    // 5. Fallback: legacy image field — ONLY Shopify or Cloudinary, never emergentagent
    if (isValidUrl(product.image) && (product.image.includes('shopify.com') || product.image.includes('cloudinary.com'))) {
      return product.image;
    }
    
    // 6. Last resort: images array (Shopify or Cloudinary only — never emergentagent)
    if (product.images?.[0] && isValidUrl(product.images[0]) && (product.images[0].includes('shopify.com') || product.images[0].includes('cloudinary.com'))) {
      return product.images[0];
    }
    
    return PLACEHOLDER_IMAGE;
  };
  
  const productImage = getValidImage();
  
  const getMinPrice = () => {
    if (product.minPrice) return product.minPrice;
    if (product.price_locked && (product.manual_price || product.pricing?.selling_price || product.pricing?.base_price || product.price)) {
      return product.manual_price || product.pricing?.selling_price || product.pricing?.base_price || product.price;
    }
    if (product.pricing?.selling_price && Number(product.pricing.selling_price) > 0) {
      return Number(product.pricing.selling_price);
    }
    if (product.pricing?.base_price && Number(product.pricing.base_price) > 0) {
      return Number(product.pricing.base_price);
    }
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes.map(s => typeof s === 'object' ? s.price : product.price);
      return Math.min(...prices.filter(p => p > 0));
    }
    return product.price || 0;
  };

  const minPrice = getMinPrice();
  
  // Calculate options count from actual product options (Shopify-style) or legacy sizes/flavors
  const getOptionsCount = () => {
    // If product has Shopify-style options with multiple values, count those
    const shopifyOptions = product.options || [];
    const realOptions = shopifyOptions.filter(opt => 
      opt.name !== 'Title' && (opt.values?.length > 1 || false)
    );
    
    if (realOptions.length > 0) {
      // Multiply all option value counts together
      return realOptions.reduce((acc, opt) => acc * (opt.values?.length || 1), 1);
    }
    
    // Fallback to legacy sizes/flavors calculation
    return (product.sizes?.length || 1) * (product.flavors?.length || 1);
  };
  
  const optionsCount = getOptionsCount();

  const openDetails = () => {
    if (isConciergeOnly) {
      tdc.view({ product, pillar, pet: effectiveSelectedPet, channel: `${pillar}_product_card_view` });
    }
    setShowModal(true);
  };

  return (
    <>
      <div 
        className="ios-card group flex flex-col cursor-pointer transition-all duration-300"
        onClick={openDetails}
        data-testid={`product-card-${product.id}`}
      >
        {/* MOBILE: Larger images (h-44 = 176px vs h-40 = 160px) */}
      <div className="relative overflow-hidden aspect-[4/5] sm:aspect-square">
          {/* Check for pre-generated mockup ONLY for Soul Made products, never for regular Shopify products */}
          {(() => {
            // IMPORTANT: Only apply mockups to soul_made products
            // Regular Shopify products should ALWAYS use their original product images
            const isSoulMade = product.soul_tier === 'soul_made';
            const mockup = (isSoulMade && effectiveSelectedPet?.breed) ? getProductMockup(product, effectiveSelectedPet.breed) : null;
            const displayImage = overrideImageUrl || mockup?.mockupUrl || productImage;
            
            return (
              <>
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  style={{ background: '#fafafa' }}
                  onError={(e) => { e.target.src = productImage || PLACEHOLDER_IMAGE; }}
                />
                {artStyleLabel && (
                  <div style={{
                    position:'absolute', bottom:6, left:6,
                    background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderRadius:999,
                    padding:'3px 9px', fontSize:9, fontWeight:700,
                    color:'#fff', letterSpacing:'0.04em', pointerEvents:'none',
                  }}>
                    {artStyleLabel === 'flat_art' ? '🐾 Flat Art' : '🎨 Watercolour'}
                  </div>
                )}
              </>
            );
          })()}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
            {product.isNew && <Badge className="bg-purple-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">New</Badge>}
            {product.isBestseller && <Badge className="bg-pink-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">Bestseller</Badge>}
            {product.onSale && <Badge className="bg-orange-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">Sale</Badge>}
            {/* Custom Product Tags */}
            {product.display_tags?.includes('best-seller') && !product.isBestseller && (
              <Badge className="bg-pink-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">🏆 Best Seller</Badge>
            )}
            {product.display_tags?.includes('limited') && (
              <Badge className="bg-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">⏰ Limited</Badge>
            )}
            {product.display_tags?.includes('selling-fast') && (
              <Badge className="bg-amber-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">🔥 Selling Fast</Badge>
            )}
            {product.display_tags?.includes('discount') && !product.onSale && (
              <Badge className="bg-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">💰 Discount</Badge>
            )}
            {product.display_tags?.includes('new-arrival') && !product.isNew && (
              <Badge className="bg-blue-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">✨ New Arrival</Badge>
            )}
            {product.display_tags?.includes('staff-pick') && (
              <Badge className="bg-indigo-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">⭐ Staff Pick</Badge>
            )}
            {product.display_tags?.includes('popular') && (
              <Badge className="bg-purple-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">💜 Popular</Badge>
            )}
          </div>
          {optionsCount > 1 && pillar === 'shop' && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 hidden sm:block">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
                {optionsCount} options
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
          {/* PawMeter Score Display - shown on all screens */}
          {(product.paw_score || product.rating) ? (
            <div className="flex items-center gap-1 flex-wrap">
              <PawPrint className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {(product.paw_score || product.rating * 2).toFixed(1)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400">/10</span>
              {(product.paw_ratings_count || product.reviews) > 0 && (
                <span className="text-[10px] sm:text-xs text-gray-400">
                  ({product.paw_ratings_count || product.reviews})
                </span>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="text-[10px] text-amber-600 hover:text-amber-700 underline ml-1"
              >
                Rate
              </button>
            </div>
          ) : (
            <p className="text-[10px] sm:text-[11px] text-purple-500/80">
              {productMiraTip}
            </p>
          )}

          <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm">
            {product.breed === "all" && (product.name||"").includes(" · ")
              ? (product.name||"").split(" · ").slice(1).join(" · ")
              : (product.name||"")}
          </h3>

          {isConciergeOnly ? (
            <p className="text-sm font-semibold text-teal-700" style={{ letterSpacing: '-0.01em' }}>
              Pricing shared by Concierge®
            </p>
          ) : isServiceProduct ? (
            <p className="text-sm font-semibold text-orange-600" style={{ letterSpacing: '-0.01em' }}>
              Price on Request · Concierge®
            </p>
          ) : minPrice > 0 ? (
            <p className="text-sm sm:text-base font-bold text-gray-900">
              From ₹{minPrice.toLocaleString('en-IN')}
            </p>
          ) : (
            <p className="text-sm sm:text-base font-medium text-purple-600">
              Price on request
            </p>
          )}
          
          {/* ✦ MIRA EXPLAINS WHY — show when product has mira_score or mira_hint */}
          {(() => {
            const miraText = product.mira_hint || productMiraTip ||
              (product.mira_score >= 80 ? `Top pick for ${product.name?.split(' ')[0]} — scored ${product.mira_score} by Mira` :
               product.mira_score >= 60 ? `Mira scored this ${product.mira_score} for your dog's profile` : '');
            if (!miraText) return null;
            const previewText = miraText.replace(/^✨\s*/, '');
            return (
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop:4 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMiraExpanded(x => !x); }}
                  data-testid={`mira-explains-${product.id}`}
                  style={{
                    display:'flex', alignItems:'center', gap:5,
                    background: miraExpanded ? 'rgba(155,89,182,0.12)' : 'rgba(155,89,182,0.07)',
                    border: '1px solid rgba(155,89,182,0.22)',
                    borderRadius: miraExpanded ? '8px 8px 0 0' : 8,
                    cursor:'pointer', padding:'5px 8px', width:'100%', textAlign:'left',
                    transition:'all 0.18s ease',
                  }}
                >
                  <span style={{ fontSize:9, fontWeight:900, color:'#9B59B6', letterSpacing:'0.1em', lineHeight:1, flexShrink:0 }}>✦ MIRA</span>
                  <span style={{ fontSize:10, fontWeight:600, color:'#9B59B6', lineHeight:1.2, flex:1 }}>
                    {previewText.length > 38 ? previewText.slice(0,38)+'…' : previewText}
                  </span>
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ flexShrink:0, transition:'transform 0.2s', transform: miraExpanded ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="#9B59B6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {miraExpanded && (
                  <div style={{
                    fontSize:11, lineHeight:1.6,
                    padding:'8px 10px 10px',
                    background:'rgba(155,89,182,0.05)',
                    border:'1px solid rgba(155,89,182,0.22)',
                    borderTop:'none',
                    borderRadius:'0 0 8px 8px',
                    animation:'fadeIn 0.18s ease',
                  }}>
                    <div style={{ color:'#7D3C98', fontWeight:700, fontSize:10, letterSpacing:'0.06em', marginBottom:4 }}>✦ WHY MIRA PICKED THIS</div>
                    <div style={{ color:'#5D3A6E' }}>
                      {miraText}
                      {product._miraRank && product._miraRank <= 2 && (
                        <span style={{ display:'inline-block', marginLeft:6, fontSize:9, fontWeight:800, background:'#F3E8FF', color:'#7D3C98', borderRadius:4, padding:'1px 5px' }}>
                          #{product._miraRank} Match
                        </span>
                      )}
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div style={{ marginTop:5, display:'flex', flexWrap:'wrap', gap:3 }}>
                        {product.tags.slice(0,4).map((tag,i) => (
                          <span key={i} style={{ fontSize:9, background:'#EDE7F6', color:'#6A0DAD', borderRadius:4, padding:'2px 5px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* CTA — opens modal; modal handles Concierge® for services */}
          <button
            onClick={(e) => { e.stopPropagation(); openDetails(); }}
            className={`w-full mt-2 py-2 text-xs font-semibold rounded-lg transition-colors ${isServiceProduct || isConciergeOnly ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
            data-testid={`view-product-${product.id}`}
          >
            {isServiceProduct || isConciergeOnly ? 'Talk to Concierge® →' : 'View Details'}
          </button>
        </div>
      </div>

      {showModal && (
        isConciergeOnly ? (
          <ConciergeOnlyProductDetailModal
            product={product}
            pillar={pillar}
            selectedPet={effectiveSelectedPet}
            onClose={() => setShowModal(false)}
          />
        ) : (
          <ProductDetailModal 
            product={product} 
            pillar={pillar}
            selectedPet={effectiveSelectedPet}
            miraContext={effectiveMiraContext}
            onClose={() => setShowModal(false)} 
          />
        )
      )}
    </>
  );
};

const ConciergeOnlyProductDetailModal = ({ product, pillar = 'paperwork', selectedPet = null, onClose }) => {
  const { token } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const petName = selectedPet?.name || 'your dog';
  const productImage = product.watercolor_image || product.cloudinary_url || product.mockup_url || product.primary_image || product.image_url || product.image || product.images?.[0] || 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579';

  const handleRequest = async () => {
    setSending(true);
    await bookViaConcierge({
      service: product?.name || 'Paperwork recommendation',
      pillar,
      pet: selectedPet,
      token,
      channel: `${pillar}_product_card`,
      amount: product?.price,
      onSuccess: () => setSent(true),
      onError: () => setSent(true),
    });
    setSending(false);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center sm:p-4 z-[50000]" style={{ backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }} onClick={onClose}>
      <div className="bg-white w-full max-w-3xl max-h-[88dvh] overflow-y-auto no-sb shadow-2xl relative" style={{ borderRadius:'28px 28px 0 0', animation:'slideUp 0.38s cubic-bezier(0.32,0.72,0,1) both' }} onClick={(e) => e.stopPropagation()} data-testid={`paperwork-product-modal-${product.id || 'item'}`}>
        <div style={{ width:40, height:5, background:'#E5E7EB', borderRadius:999, margin:'12px auto 0' }} />
        <button
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
          data-testid="paperwork-product-modal-close-button"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square bg-slate-50 p-6">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579'; }}
            />
          </div>

          <div className="p-6 flex flex-col">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Concierge®-first paperwork pick
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 pr-8">
              {product.breed === "all" && (product.name||"").includes(" · ")
                ? (product.name||"").split(" · ").slice(1).join(" · ")
                : (product.name||"")}
            </h2>
            <p className="text-sm text-slate-500 mb-4">Curated for {petName}. Pricing is shared by Concierge® after review.</p>

            {(product.mira_hint || product.mira_score > 0) && (
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 mb-4">
                <p className="text-xs font-semibold text-teal-800 mb-1">Why Mira picked this</p>
                <p className="text-sm text-teal-700">{product.mira_hint}</p>
              </div>
            )}

            {(product.short_description || product.description) && (
              <div className="mb-4">
                <p className="text-sm text-slate-700 leading-6">{product.short_description || product.description}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">What happens next</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Concierge® receives the request with {petName}'s pet context.</li>
                <li>• Pricing and fit are shared after document needs are reviewed.</li>
                <li>• The request appears in Admin Service Desk for follow-up.</li>
              </ul>
            </div>

            <div className="mt-auto flex items-center justify-between gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-slate-500">Concierge® handling</p>
                <p className="text-base font-semibold text-teal-700">Pricing shared on WhatsApp</p>
              </div>
              {sent ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold" data-testid="paperwork-product-modal-sent-state">
                  <Check className="w-4 h-4" /> Sent to Concierge®!
                </div>
              ) : (
                <Button
                  onClick={handleRequest}
                  disabled={sending}
                  className="bg-gradient-to-r from-teal-600 to-slate-800 hover:from-teal-700 hover:to-slate-900 px-6"
                  data-testid={`paperwork-product-modal-request-${product.id || 'item'}`}
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><MessageSquare className="w-4 h-4 mr-2" /> Talk to Concierge®</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body);
};

const ProductDetailModal = ({ product, pillar = 'celebrate', selectedPet = null, miraContext = null, onClose, onAddToPicks = null }) => {
  // miraContext is now always passed (effectiveMiraContext from parent)
  // onAddToPicks - callback for Mira picks panel (instead of cart)
  
  // Get valid product image — PRIORITY: watercolor_image → cloudinary_url → mockup_url → primary_image → image_url → image → images[0]
  const PLACEHOLDER_IMAGE = 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579';
  const getValidProductImage = () => {
    // 1. watercolor_image — admin AI-generated breed illustration (highest priority)
    if (product.watercolor_image && product.watercolor_image.startsWith('http')) {
      return product.watercolor_image;
    }

    // 2. cloudinary_url — direct Cloudinary upload
    if (product.cloudinary_url && product.cloudinary_url.startsWith('http')) {
      return product.cloudinary_url;
    }

    // 3. mockup_url — breed product mockup
    if (product.mockup_url && product.mockup_url.startsWith('http')) {
      return product.mockup_url;
    }

    // 4. primary_image
    if (product.primary_image && product.primary_image.startsWith('http')) {
      return product.primary_image;
    }

    // 5. image_url — clean curated URL
    if (product.image_url && product.image_url.startsWith('http')) {
      return product.image_url;
    }

    // 6. Shopify CDN images
    if (product.image && product.image.startsWith('http') && product.image.includes('shopify.com')) {
      return product.image;
    }
    
    // 3. For breed-specific products (IDs like "breed-cavalier-welcome_kit"), use breed illustration
    const productId = product.id || '';
    if (productId.startsWith('breed-')) {
      const breedKey = productId.replace('breed-', '').split('-')[0];
      const breedIllustration = getBreedIllustrationByName(breedKey);
      if (breedIllustration) {
        return breedIllustration;
      }
      const productName = (product.name || product.title || '').toLowerCase();
      const breedMatch = findBreedIllustration(productName);
      if (breedMatch) {
        return breedMatch.imageUrl;
      }
    }
    
    // 4. For soul_made products only, check for breed illustration
    if (product.soul_tier === 'soul_made') {
      const productName = (product.name || product.title || '').toLowerCase();
      const breedMatch = findBreedIllustration(productName);
      if (breedMatch) {
        return breedMatch.imageUrl;
      }
    }
    
    // 5. Fallback: legacy image field — ONLY Shopify or Cloudinary, never emergentagent
    if (isValidUrl(product.image) && (product.image.includes('shopify.com') || product.image.includes('cloudinary.com'))) {
      return product.image;
    }
    
    // 6. Last resort: images array (Shopify or Cloudinary only — never emergentagent)
    if (product.images?.[0] && isValidUrl(product.images[0]) && (product.images[0].includes('shopify.com') || product.images[0].includes('cloudinary.com'))) {
      return product.images[0];
    }
    
    return PLACEHOLDER_IMAGE;
  };
  const productImage = getValidProductImage();
  
  // Extract options from product (e.g., Base, Flavour, Weight)
  const productOptions = product.options || [];
  const variants = product.variants || [];
  const { user, token } = useAuth();
  
  // ── Service detection & concierge flow ─────────────────────────────────────
  const isService = (product.product_type === 'service') || (product.category === 'service');
  const isDisplayOnly = !!(product.display_only || product.is_display_only);
  const [serviceSent, setServiceSent] = useState(false);
  const [serviceSending, setServiceSending] = useState(false);
  
  // Check if this is a customisable Soul/breed product
  const isSoulProduct = product.is_mockup || product.id?.startsWith('bp-') || (product.product_type && !isService);

  const handleServiceRequest = async () => {
    setServiceSending(true);
    const petName = selectedPet?.name || 'my dog';
    const allergies = selectedPet?.allergies || [];
    const lifeVision = selectedPet?.doggy_soul_answers?.life_vision || '';
    try {
      const userRaw = localStorage.getItem('user') || '{}';
      let storedUser = {};
      try { storedUser = JSON.parse(userRaw); } catch {}
      const parentUser = user || storedUser;

      const briefingLines = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🐾 PET',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `Name:      ${petName}`,
        `Breed:     ${selectedPet?.breed || '—'}`,
        `Allergies: ${allergies.length ? '⚠️ NO ' + allergies.join(', NO ') : 'None known'}`,
        lifeVision ? `North Star: "${lifeVision}"` : '',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '👤 PET PARENT',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `Name:      ${parentUser?.name || parentUser?.full_name || '—'}`,
        `Phone:     ${parentUser?.phone || parentUser?.whatsapp || '—'}`,
        `Email:     ${parentUser?.email || '—'}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '📋 REQUEST',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `Intent:    Product interest / Concierge enquiry`,
        `Pillar:    ${pillar || 'dine'}`,
        `Product:   ${product.name}`,
        product.original_price ? `Price:     ₹${product.original_price}` : '',
        product.category ? `Category:  ${product.category}` : '',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '⚡ ACTION REQUIRED',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        allergies.length ? `🔴 ALLERGY ALERT: No ${allergies.join(', ')} in ANY product` : '',
        lifeVision ? `🌟 NORTH STAR: ${lifeVision}` : '',
        'Please confirm availability and pricing via WhatsApp within 2 hours.',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].filter(l => l !== '').join('\n');

      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id:     parentUser?.id || parentUser?.email || 'guest',
          parent_email:  parentUser?.email || '',
          parent_name:   parentUser?.name || parentUser?.full_name || '',
          parent_phone:  parentUser?.phone || parentUser?.whatsapp || '',
          pet_id:        selectedPet?.id || 'unknown',
          pet_name:      petName,
          pet_breed:     selectedPet?.breed || '',
          pet_allergies: allergies,
          life_vision:   lifeVision,
          pillar:        pillar || 'dine',
          intent_primary: 'product_interest',
          channel:       `${pillar}_product_card`,
          force_new:     true,
          subject:       `Product Interest: ${product.name} for ${petName}`,
          initial_message: {
            sender: 'parent',
            source: `${pillar}_product_card`,
            text:   briefingLines,
          },
          metadata: {
            pet_name:      petName,
            pet_breed:     selectedPet?.breed || '',
            pet_allergies: allergies,
            life_vision:   lifeVision,
            parent_phone:  parentUser?.phone || parentUser?.whatsapp || '',
            parent_email:  parentUser?.email || '',
            parent_name:   parentUser?.name  || parentUser?.full_name || '',
            product_name:  product.name,
            product_id:    product.id || product._id,
            price:         product.original_price,
            pillar:        pillar || 'dine',
            channel:       `${pillar}_product_card`,
            urgency:       'normal',
          },
        }),
      });
    } catch (err) {
      console.error('[ProductCard] Service request error:', err);
    } finally {
      setServiceSending(false);
      setServiceSent(true);
      toast({
        title: 'Sent to Concierge®!',
        description: (
          <span>
            {product.name} request received.{' '}
            <a href="/admin/requests" className="font-bold underline text-purple-700">Handle Requests →</a>
          </span>
        ),
      });
    }
  };
  // ────────────────────────────────────────────────────────────────────────────
  
  // Pet Soul Integration - Fetch user's pets
  const [userPets, setUserPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [loadingPets, setLoadingPets] = useState(false);
  
  // Fetch user's pets on mount if logged in
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user || !token) return;
      setLoadingPets(true);
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserPets(data.pets || []);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchUserPets();
  }, [user, token]);
  
  // Handle pet selection - auto-fill details
  const handlePetSelect = (petId) => {
    setSelectedPetId(petId);
    if (petId === 'manual') {
      // User wants to type manually
      setCartInput(prev => ({ ...prev, petName: '', age: '', selectedPetId: null }));
      return;
    }
    const pet = userPets.find(p => p.id === petId);
    if (pet) {
      // Calculate age from birthday
      let ageStr = '';
      if (pet.birthday) {
        const birthDate = new Date(pet.birthday);
        const today = new Date();
        const ageYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        ageStr = ageYears > 0 ? `${ageYears} year${ageYears > 1 ? 's' : ''}` : 'Less than 1 year';
      }
      setCartInput(prev => ({ 
        ...prev, 
        petName: pet.name || '',
        age: ageStr,
        selectedPetId: pet.id,
        petBreed: pet.breed || '',
        petSize: pet.size || ''
      }));
    }
  };
  
  // Build option values dynamically from variants
  const getOptionValues = (optionName, optionIndex) => {
    const values = new Set();
    variants.forEach(v => {
      const val = v[`option${optionIndex + 1}`];
      if (val) values.add(val);
    });
    return Array.from(values);
  };

  // Initialize selected options based on first available values
  const initializeSelectedOptions = () => {
    const initial = {};
    productOptions.forEach((opt, idx) => {
      const values = getOptionValues(opt.name, idx);
      if (values.length > 0) {
        initial[opt.name] = values[0];
      }
    });
    return initial;
  };

  const [selectedOptions, setSelectedOptions] = useState(initializeSelectedOptions);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateError, setDateError] = useState(false); // Bug fix: track missing required date
  const [nameError, setNameError] = useState(false);
  const [ageError, setAgeError] = useState(false);

  // Determine if this product REQUIRES a delivery/pickup date before checkout
  const isCakeProduct = (product.category || '').toLowerCase().includes('cake') ||
                        (product.name || '').toLowerCase().includes('cake') ||
                        (product.product_type || '').toLowerCase().includes('cake') ||
                        (product.sub_category || '').toLowerCase().includes('cake');
  const requiresDate = isCakeProduct || !!product.requires_date;
  
  const [cartInput, setCartInput] = useState({
    petName: '',
    date: null,
    time: '',
    age: '',
    purchaseType: 'onetime',
    autoshipFrequency: '',
    autoshipStartDate: null,
    autoshipEndDate: null,
    addPartyBox: false,
    // Bundle selections
    selectedCake: '',
    selectedToy: '',
    // Pet Soul fields
    selectedPetId: null,
    petBreed: '',
    petSize: ''
  });
  
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [celebrateSoulProducts, setCelebrateSoulProducts] = useState([]);
  
  // Bundle products (cakes and toys for hamper selection)
  const [bundleCakes, setBundleCakes] = useState([]);
  const [bundleToys, setBundleToys] = useState([]);
  const [loadingBundle, setLoadingBundle] = useState(false);
  
  // Check if this is a bundle/hamper product
  const isHamperProduct = (product.category || '').toLowerCase().includes('hamper') || 
                          (product.name || '').toLowerCase().includes('hamper') ||
                          (product.bundle_type === 'hamper');
  
  const { addToCart } = useCart();
  
  // Reviews state - declared at component level (legacy, keeping for reference)
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '', author_name: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // NPS Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [npsScore, setNpsScore] = useState(null);
  const [npsTestimonials, setNpsTestimonials] = useState([]);
  const [userPawRating, setUserPawRating] = useState(0);
  
  // Submit paw rating to backend
  const submitPawRating = async (score) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}/paw-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          score,
          user_email: user?.email,
          pet_name: selectedPet?.name || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: "Thanks for rating! 🐾", 
          description: `You gave ${score}/10 paws` 
        });
        // Update displayed score
        if (data.new_average) {
          setNpsScore(Math.round(data.new_average));
        }
      } else {
        // If endpoint doesn't exist, store locally
        toast({ 
          title: "Rating saved! 🐾", 
          description: `You gave ${score}/10 paws` 
        });
      }
    } catch (e) {
      // Graceful fallback - show success anyway
      toast({ 
        title: "Thanks for rating! 🐾", 
        description: `You gave ${score}/10 paws` 
      });
    }
  };

  // Find matching variant based on selected options
  const findMatchingVariant = () => {
    if (!variants.length || !productOptions.length) {
      return { price: product.price || 0, title: 'Standard' };
    }
    
    const match = variants.find(v => {
      return productOptions.every((opt, idx) => {
        const variantValue = v[`option${idx + 1}`];
        const selectedValue = selectedOptions[opt.name];
        return variantValue === selectedValue;
      });
    });
    
    return match || variants[0] || { price: product.price || 0, title: 'Standard' };
  };

  const matchingVariant = findMatchingVariant();
  const currentPrice = matchingVariant?.price || product.price || 0;

  // Update a specific option
  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  // Fetch related products - pillar-aware
  React.useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products/${product.id}/related?limit=4&pillar=${pillar}`);
        if (response.ok) {
          const data = await response.json();
          setRelatedProducts(data.related || []);
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
      setLoadingRelated(false);
    };
    fetchRelated();
  }, [product.id, pillar]);

  // All pillars: fetch breed-specific soul made products for "✦ SOUL MADE™" section
  React.useEffect(() => {
    if (!selectedPet?.breed) return;
    const breedKey = (selectedPet.breed || '').toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
    const fetchBreedSoul = async () => {
      try {
        // First try pillar-specific, fall back to celebrate (richest soul_made catalogue)
        const res = await fetch(`${API_URL}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&pillar=${pillar}&limit=4`);
        if (res.ok) {
          const data = await res.json();
          let prods = (data.products || []).filter(p =>
            p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'
          );
          // If pillar has no breed products, fall back to celebrate soul_made
          if (!prods.length && pillar !== 'celebrate') {
            const fallback = await fetch(`${API_URL}/api/mockups/breed-products?breed=${encodeURIComponent(breedKey)}&pillar=celebrate&limit=4`);
            if (fallback.ok) {
              const fb = await fallback.json();
              prods = (fb.products || []).filter(p =>
                p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'
              );
            }
          }
          setCelebrateSoulProducts(prods.slice(0, 3));
        }
      } catch (e) { /* silent */ }
    };
    fetchBreedSoul();
  }, [pillar, selectedPet?.breed]);

  // Fetch bundle products (cakes and toys) for hamper products
  React.useEffect(() => {
    if (!isHamperProduct) return;
    
    const fetchBundleProducts = async () => {
      setLoadingBundle(true);
      try {
        // Fetch cakes
        const cakesRes = await fetch(`${API_URL}/api/products?category=cakes&limit=20`);
        if (cakesRes.ok) {
          const data = await cakesRes.json();
          setBundleCakes(data.products || []);
        }
        
        // Fetch toys
        const toysRes = await fetch(`${API_URL}/api/products?category=accessories&limit=20`);
        if (toysRes.ok) {
          const data = await toysRes.json();
          // Filter for toys only
          const toys = (data.products || []).filter(p => 
            (p.name || '').toLowerCase().includes('toy') ||
            (p.name || '').toLowerCase().includes('squeaky')
          );
          setBundleToys(toys);
        }
      } catch (error) {
        console.error('Failed to fetch bundle products:', error);
      }
      setLoadingBundle(false);
    };
    
    fetchBundleProducts();
  }, [isHamperProduct, API_URL]);

  // Fetch NPS Score and Testimonials
  useEffect(() => {
    const fetchNPSData = async () => {
      try {
        // Fetch NPS testimonials  
        const testimonialsRes = await fetch(`${API_URL}/api/concierge/nps/testimonials?limit=5`);
        if (testimonialsRes.ok) {
          const data = await testimonialsRes.json();
          setNpsTestimonials(data.testimonials || []);
          
          // Calculate average score from testimonials
          if (data.testimonials?.length > 0) {
            const avgScore = Math.round(
              data.testimonials.reduce((sum, t) => sum + (t.score || 0), 0) / data.testimonials.length
            );
            setNpsScore(avgScore);
          }
        }
        
        // Try to get overall NPS stats
        const statsRes = await fetch(`${API_URL}/api/analytics/nps-summary`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.average_score) {
            setNpsScore(Math.round(statsData.average_score));
          }
        }
      } catch (e) { 
        console.error('Failed to fetch NPS data:', e); 
      }
    };
    fetchNPSData();
  }, [API_URL]);

  const submitReview = async () => {
      if (!newReview.content || !newReview.author_name) {
          toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
          return;
      }
      setSubmittingReview(true);
      try {
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const res = await fetch(`${API_URL}/api/reviews`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ 
                product_id: product.id,
                rating: newReview.rating,
                comment: newReview.content,
                reviewer_name: newReview.author_name,
                reviewer_email: user?.email || null,
                title: newReview.title || null
              })
          });
          if (res.ok) {
              toast({ title: "Review Submitted", description: "Thank you! It will appear after approval." });
              setShowReviewForm(false);
              setNewReview({ rating: 5, title: '', content: '', author_name: '' });
              // Refresh reviews
              const reviewRes = await fetch(`${API_URL}/api/products/${product.id}/reviews`);
              if (reviewRes.ok) {
                const data = await reviewRes.json();
                setReviews(data.reviews || []);
              }
          } else {
              const errData = await res.json().catch(() => ({}));
              toast({ title: "Error", description: errData.detail || "Failed to submit review", variant: "destructive" });
          }
      } catch (e) {
          console.error('Review submission error:', e);
          toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
      } finally {
          setSubmittingReview(false);
      }
  };

  const handleAddToCart = async () => {
    // For cake/celebration products: name, age and date are all required
    const isCelebrationProduct = requiresDate || ['cakes','hampers','pupcakes','dognuts'].some(c => (product.category||'').toLowerCase().includes(c));
    if (isCelebrationProduct) {
      const missingName = !cartInput.petName?.trim();
      const missingAge  = !cartInput.age?.trim();
      const missingDate = !cartInput.date;
      setNameError(missingName);
      setAgeError(missingAge);
      setDateError(missingDate);
      if (missingDate) setCalendarOpen(true);
      if (missingName || missingAge || missingDate) return;
    }

    // Build variant string from selected options
    const variantDescription = Object.entries(selectedOptions)
      .map(([key, value]) => value)
      .filter(Boolean)
      .join(' / ');
    
    // If this is from Mira Picks panel, use the onAddToPicks callback instead
    if (onAddToPicks) {
      const pickItem = {
        ...product,
        price: currentPrice,
        selectedVariant: matchingVariant?.title || variantDescription,
        selectedOptions: selectedOptions,
        petName: cartInput.petName || selectedPet?.name,
        pick_type: 'catalogue',
        addedAt: new Date().toISOString()
      };
      onAddToPicks(pickItem);
      onClose();
      return;
    }
    
    // Calculate autoship details if applicable
    let autoshipDetails = null;
    if (cartInput.purchaseType === 'autoship' && cartInput.autoshipStartDate && cartInput.autoshipEndDate) {
      const start = new Date(cartInput.autoshipStartDate);
      const end = new Date(cartInput.autoshipEndDate);
      const frequencyWeeks = parseInt(cartInput.autoshipFrequency);
      const frequencyDays = frequencyWeeks * 7;
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const numDeliveries = diffDays > 0 ? Math.floor(diffDays / frequencyDays) + 1 : 0;
      
      // Calculate total with tiered discounts
      let total = 0;
      for (let i = 0; i < numDeliveries; i++) {
        const deliveryNum = i + 1;
        const discountRates = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50];
        const discount = deliveryNum <= 7 ? discountRates[deliveryNum - 1] : 0.50;
        total += currentPrice * (1 - discount);
      }
      
      autoshipDetails = {
        startDate: cartInput.autoshipStartDate,
        endDate: cartInput.autoshipEndDate,
        frequency: cartInput.autoshipFrequency,
        numDeliveries,
        totalPrice: Math.round(total),
        regularTotal: currentPrice * numDeliveries,
        savings: Math.round(currentPrice * numDeliveries - total)
      };
    }
    
    const cartItem = {
      ...product,
      price: currentPrice,
      selectedVariant: matchingVariant?.title || variantDescription,
      selectedOptions: selectedOptions,
      purchaseType: cartInput.purchaseType,
      autoshipFrequency: cartInput.purchaseType === 'autoship' ? cartInput.autoshipFrequency : null,
      isAutoship: cartInput.purchaseType === 'autoship',
      autoshipDetails: autoshipDetails,
      customDetails: { ...cartInput },
      // Pet Soul integration
      petId: cartInput.selectedPetId,
      petName: cartInput.petName,
      petBreed: cartInput.petBreed
    };
    addToCart(cartItem, variantDescription, 'Selected');
    
    // Write to Pet Soul if pet is selected
    if (cartInput.selectedPetId && token) {
      try {
        await fetch(`${API_URL}/api/pets/${cartInput.selectedPetId}/soul/celebrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'cake_order',
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            price: currentPrice,
            variant: variantDescription,
            delivery_date: cartInput.date ? cartInput.date.toISOString() : null,
            occasion: cartInput.date ? 'celebration' : 'treat'
          })
        });
      } catch (error) {
        console.error('Failed to update Pet Soul:', error);
        // Don't block the cart - Pet Soul update is best effort
      }
    }
    
    // Add Party Box
    if (cartInput.addPartyBox) {
      addToCart({
        id: 'party-box-addon',
        name: 'Party Box (Add On)',
        price: 499,
        image: 'https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7.jpg?v=1759129448&width=100',
        category: 'hampers'
      }, 'Standard', 'Standard');
    }
    
    let autoshipMsg = '';
    if (cartInput.purchaseType === 'autoship' && autoshipDetails) {
      autoshipMsg = ` (Autoship: ${autoshipDetails.numDeliveries} deliveries, save ₹${autoshipDetails.savings})`;
    }
    
    // Use pillar-specific success message
    const petName = selectedPet?.name || 'your pet';
    const successMessage = miraContext?.addedMessage?.(petName) || `Added to cart! 🎉`;
    
    toast({
      title: successMessage,
      description: `${product.name} - ₹${currentPrice}${autoshipMsg}`,
    });
    onClose();
  };

  const handleQuickAdd = (relatedProduct) => {
    const price = relatedProduct.minPrice || relatedProduct.price || 0;
    const cartItem = {
      ...relatedProduct,
      price: price,
      selectedSize: relatedProduct.sizes?.[0]?.name || 'Standard',
      selectedFlavor: relatedProduct.flavors?.[0]?.name || 'Standard',
    };
    addToCart(cartItem, cartItem.selectedSize, cartItem.selectedFlavor);
    
    const petName = selectedPet?.name || 'your pet';
    const successMessage = miraContext?.addedMessage?.(petName) || `Added to cart! ✨`;
    
    toast({
      title: successMessage,
      description: `${relatedProduct.name} - ₹${price}`,
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center sm:p-4 z-[50000]"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white w-full max-w-2xl max-h-[88dvh] overflow-y-auto no-sb shadow-2xl relative"
        style={{ borderRadius: '28px 28px 0 0', animation: 'slideUp 0.38s cubic-bezier(0.32,0.72,0,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ width:40, height:5, background:'#E5E7EB', borderRadius:999, margin:'12px auto 0' }} />
        <button 
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square bg-gray-50">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
            />
            {/* Soul Tier Badge + Standard Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.soul_tier === 'soul_made' && (
                <Badge className="bg-purple-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" /> Soul Made
                </Badge>
              )}
              {product.soul_tier === 'soul_selected' && (
                <Badge className="bg-blue-600 text-white">🎯 Soul Selected</Badge>
              )}
              {product.soul_tier === 'soul_gifted' && (
                <Badge className="bg-pink-600 text-white">🎁 Soul Gifted</Badge>
              )}
              {product.isNew && <Badge className="bg-purple-600">New</Badge>}
              {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
            </div>
            {/* Personalized Name Overlay for Soul Made products */}
            {product.soul_tier === 'soul_made' && cartInput.petName && (
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg py-2 px-4 text-center shadow-lg border border-purple-200">
                <span className="text-purple-700 font-bold text-lg">{cartInput.petName}</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {product.rating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviews || 0})</span>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-2 pr-8">
              {product.breed === "all" && (product.name||"").includes(" · ")
                ? (product.name||"").split(" · ").slice(1).join(" · ")
                : (product.name||"")}
            </h2>
            
            {/* Full Description - Expandable */}
            {product.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Flavors Display - For Cakes */}
            {product.flavors && product.flavors.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span>🍰</span> Available Flavours
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.flavors.map((flavor, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 bg-white text-xs rounded-full border border-amber-200 text-amber-700"
                    >
                      {flavor.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Display - For Cakes with multiple sizes */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <span>📏</span> Available Sizes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-white text-xs rounded-full border border-purple-200 text-purple-700 font-medium"
                    >
                      {size.name} - ₹{size.price}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Breed Tag - For Breed Cakes */}
            {product.breed_tags && product.breed_tags.length > 0 && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                  <span>🐕</span> Perfect for {product.breed_tags
                    .map((breed) => {
                      const prettyBreed = String(breed).replace(/_/g, ' ').trim();
                      return /^(all|all breeds)$/i.test(prettyBreed) ? 'all breeds' : prettyBreed;
                    })
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Dynamic Options Selector */}
            {productOptions.length > 0 && (
              <div className="space-y-4 mb-4">
                {productOptions.map((option, optionIndex) => {
                  const values = getOptionValues(option.name, optionIndex);
                  if (values.length <= 1) return null;
                  
                  return (
                    <div key={option.name}>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Select {option.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => {
                          const isSelected = selectedOptions[option.name] === value;
                          return (
                            <button
                              key={value}
                              onClick={() => handleOptionChange(option.name, value)}
                              className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bundle Product Selectors - For Hampers */}
            {isHamperProduct && (
              <div className="space-y-4 mb-4 pt-3 border-t bg-gradient-to-br from-pink-50 to-purple-50 -mx-6 px-6 py-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  🎁 Customise Your Hamper
                </h4>
                
                {/* Select Cake */}
                {bundleCakes.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Select Cake
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={cartInput.selectedCake}
                      onChange={(e) => setCartInput({...cartInput, selectedCake: e.target.value})}
                    >
                      <option value="">Choose a cake style...</option>
                      {bundleCakes.map(cake => (
                        <option key={cake.id} value={cake.name}>
                          {cake.name} {cake.price ? `- ₹${cake.price}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Select Toy */}
                {bundleToys.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Select Toy
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={cartInput.selectedToy}
                      onChange={(e) => setCartInput({...cartInput, selectedToy: e.target.value})}
                    >
                      <option value="">Choose a toy...</option>
                      {bundleToys.map(toy => (
                        <option key={toy.id} value={toy.name}>
                          {toy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {loadingBundle && (
                  <p className="text-xs text-gray-500">Loading options...</p>
                )}
              </div>
            )}

            {/* Personalization - Only for celebration/cake products (NOT meals) */}
            {(
              ['cakes', 'celebrate', 'hampers', 'pupcakes', 'dognuts'].some(cat => 
                (product.category || '').toLowerCase().includes(cat)
              ) || 
              (product.name || '').toLowerCase().includes('cake') ||
              (product.name || '').toLowerCase().includes('pupcake') ||
              (product.name || '').toLowerCase().includes('dognut') ||
              (product.name || '').toLowerCase().includes('hamper')
            ) && !(
              // Exclude meals and fresh food
              (product.category || '').toLowerCase().includes('meal') ||
              (product.category || '').toLowerCase().includes('fresh-food') ||
              (product.name || '').toLowerCase().includes('meal')
            ) && (
            <div className="space-y-3 mb-4 pt-3 border-t">
              <label className="text-sm font-semibold text-gray-700 block flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-pink-600" />
                Personalization
              </label>
              
              {/* Pet Selection - Show if user has pets */}
              {user && userPets.length > 0 && (
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                  <label className="text-xs text-pink-700 font-medium block mb-2">
                    Select your pet for personalized recommendations
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-pink-400"
                    value={selectedPetId}
                    onChange={(e) => handlePetSelect(e.target.value)}
                  >
                    <option value="">Choose your furry friend...</option>
                    {userPets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        🐕 {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                      </option>
                    ))}
                    <option value="manual">✏️ Enter manually</option>
                  </select>
                </div>
              )}
              
              {/* Manual input - show if no pets or user selected manual */}
              {(!user || userPets.length === 0 || selectedPetId === 'manual' || selectedPetId === '') && (
                <Input 
                  placeholder="Pet's Name (for cake) *" 
                  value={cartInput.petName}
                  onChange={(e) => { setCartInput({...cartInput, petName: e.target.value}); setNameError(false); }}
                  className={`text-sm ${nameError ? 'border-red-400 border-2' : ''}`}
                />
              )}
              {nameError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 -mt-1">
                  <span>⚠</span> Pet name is required
                </p>
              )}
              
              {/* Show selected pet info */}
              {selectedPetId && selectedPetId !== 'manual' && cartInput.petName && (
                <div className="flex items-center gap-2 text-sm text-pink-700 bg-pink-50 px-3 py-2 rounded-lg">
                  <PawPrint className="w-4 h-4" />
                  <span>Cake for <strong>{cartInput.petName}</strong></span>
                  {cartInput.petBreed && <Badge variant="outline" className="text-xs">{cartInput.petBreed}</Badge>}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="Pet's Age *" 
                  value={cartInput.age}
                  onChange={(e) => { setCartInput({...cartInput, age: e.target.value}); setAgeError(false); }}
                  className={`text-sm ${ageError ? 'border-red-400 border-2' : ''}`}
                  disabled={selectedPetId && selectedPetId !== 'manual' && !!cartInput.age}
                />
                {ageError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 -mt-1">
                    <span>⚠</span> Pet's age is required
                  </p>
                )}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-left font-normal text-sm h-10 ${dateError && !cartInput.date ? 'border-red-400 border-2' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarOpen(true);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cartInput.date ? format(cartInput.date, 'PP') : <span className={dateError ? 'text-red-400 font-medium' : 'text-gray-500'}>Pick delivery date *</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-[99999]" 
                    align="start"
                    style={{ zIndex: 99999 }}
                    sideOffset={4}
                    avoidCollisions={false}
                  >
                    <Calendar
                      mode="single"
                      selected={cartInput.date}
                      onSelect={(date) => {
                        setCartInput({...cartInput, date});
                        setCalendarOpen(false);
                        setDateError(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 -mt-1">
                    <span>⚠</span> Please select a delivery date before proceeding
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Autoship Option */}
            {product.autoship_enabled && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔄</span> How would you like to purchase?
                </h4>
                
                <div className="space-y-3">
                  {/* One-time purchase */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${cartInput.purchaseType === 'onetime' ? 'border-purple-500 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input 
                      type="radio" 
                      name="purchaseType" 
                      checked={cartInput.purchaseType === 'onetime'}
                      onChange={() => setCartInput({...cartInput, purchaseType: 'onetime', autoshipFrequency: '', autoshipStartDate: null, autoshipEndDate: null})}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">One-time purchase</span>
                      <p className="text-xs text-gray-500">Buy once, no commitment</p>
                    </div>
                  </label>
                  
                  {/* Autoship option */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${cartInput.purchaseType === 'autoship' ? 'border-purple-500 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input 
                      type="radio" 
                      name="purchaseType" 
                      checked={cartInput.purchaseType === 'autoship'}
                      onChange={() => {
                        const today = new Date();
                        const sixMonthsLater = new Date(today);
                        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                        setCartInput({
                          ...cartInput, 
                          purchaseType: 'autoship', 
                          autoshipFrequency: '4',
                          autoshipStartDate: today.toISOString().split('T')[0],
                          autoshipEndDate: sixMonthsLater.toISOString().split('T')[0]
                        });
                      }}
                      className="w-4 h-4 text-purple-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">Autoship & Save</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Auto-deliver on your schedule, save up to 50%!</p>
                      
                      {cartInput.purchaseType === 'autoship' && (
                        <AutoshipCalculator 
                          cartInput={cartInput} 
                          setCartInput={setCartInput} 
                          currentPrice={currentPrice}
                          product={product}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Party Box Upsell */}
            {product.category === 'cakes' && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 cursor-pointer"
                    checked={cartInput.addPartyBox}
                    onChange={(e) => setCartInput({...cartInput, addPartyBox: e.target.checked})}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Add a Party Box? 🎁</h4>
                    <p className="text-xs text-gray-600">Includes Birthday Bandana, Party Hat & Treats!</p>
                    <p className="text-sm font-bold text-purple-600 mt-1">+₹499</p>
                  </div>
                  <img src="https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7.jpg?v=1759129448&width=100" alt="Party Box" className="w-16 h-16 object-cover rounded-md" />
                </div>
              </div>
            )}

            {/* Why Mira suggests this — shown when mira_hint is set (e.g. from DimExpanded intelligence) */}
            {(product.mira_hint || product.mira_score > 0) && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">✦</div>
                <div>
                  <p className="text-xs font-bold text-amber-900 mb-0.5">Why Mira suggests this</p>
                  <p className="text-xs text-amber-800">{product.mira_hint}</p>
                </div>
              </div>
            )}

            {!isDisplayOnly && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xs text-gray-500">{isService ? 'Service' : 'Total Price'}</p>
                {isService ? (
                  <p className="text-base font-semibold text-purple-600">Concierge® Request</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">₹{currentPrice}</p>
                )}
              </div>
              {isService ? (
                serviceSent ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
                    <Check className="w-4 h-4" /> Sent to Concierge®!
                  </div>
                ) : (
                  <Button
                    onClick={handleServiceRequest}
                    disabled={serviceSending}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 px-6"
                    data-testid={`request-service-${product.id}`}
                  >
                    {serviceSending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <><MessageSquare className="w-4 h-4 mr-2" /> Request This Service</>
                    )}
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={requiresDate && !cartInput.date}
                  className={`px-6 transition-all ${
                    requiresDate && !cartInput.date
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                  }`}
                  data-testid={`add-to-cart-${product.id}`}
                  title={requiresDate && !cartInput.date ? 'Select a delivery date to continue' : ''}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {requiresDate && !cartInput.date
                    ? 'Select a date to continue'
                    : (miraContext?.includeText || 'Add to Cart')}
                </Button>
              )}
            </div>
            )}
          </div>
        {/* NPS Testimonials Section - Happy Customers */}
        {testimonials.length > 0 && (
          <div className="border-t bg-gradient-to-br from-green-50 to-emerald-50 p-6" data-testid="nps-testimonials">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-green-600" />
              What Our Members Say
              <Badge className="bg-green-100 text-green-700 text-xs ml-2">NPS 9-10</Badge>
            </h3>
            <div className="space-y-3">
              {testimonials.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg">😊</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{testimonial.member_name}</span>
                        {testimonial.pet_name && (
                          <span className="text-xs text-gray-500">with {testimonial.pet_name}</span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-sm font-bold text-green-600">{testimonial.score}/10</span>
                          <Star className="w-4 h-4 text-green-500 fill-green-500" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 italic">&ldquo;{testimonial.feedback}&rdquo;</p>
                      {testimonial.responded_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(testimonial.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Net Pawmoter Score Section - Using Paws instead of Stars */}
        <div className="border-t bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6" data-testid="nps-section">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    Pawmeter™
                </h3>
                {user && (
                  <span className="text-[10px] sm:text-xs text-amber-600/70">Rate this product</span>
                )}
            </div>
            
            {/* Interactive Paw Rating - Users can click to rate */}
            <div className="text-center mb-4">
                <div className="inline-flex flex-col items-center gap-2 bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-sm border border-amber-200">
                    {/* Display current score if exists */}
                    {npsScore !== null && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl sm:text-2xl font-bold text-amber-600">{npsScore}</span>
                        <span className="text-gray-500 text-xs sm:text-sm">/10 avg</span>
                      </div>
                    )}
                    
                    {/* Clickable Paw Rating */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((paw) => (
                            <button
                                key={paw}
                                onClick={() => {
                                  if (!user) {
                                    toast({ title: "Sign in required", description: "Please sign in to rate products", variant: "default" });
                                    return;
                                  }
                                  const score = paw * 2; // 1 paw = 2 points, 5 paws = 10
                                  setUserPawRating(paw);
                                  // Submit rating to backend
                                  submitPawRating(score);
                                }}
                                className={`transition-all transform hover:scale-110 active:scale-95 ${
                                  userPawRating >= paw 
                                    ? 'text-amber-500' 
                                    : npsScore && paw <= Math.round(npsScore / 2)
                                      ? 'text-amber-300'
                                      : 'text-gray-300 hover:text-amber-200'
                                }`}
                                data-testid={`paw-rating-${paw}`}
                            >
                                <PawPrint 
                                    className={`w-7 h-7 sm:w-8 sm:h-8 ${
                                      userPawRating >= paw ? 'fill-amber-500' : ''
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    
                    {/* Rating feedback */}
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {userPawRating > 0 
                        ? `You rated: ${userPawRating * 2}/10 ${userPawRating >= 4 ? '🎉' : userPawRating >= 3 ? '👍' : '🤔'}`
                        : user 
                          ? 'Tap to rate' 
                          : 'Sign in to rate'
                      }
                    </p>
                </div>
            </div>
            
            {/* NPS Testimonials */}
            {npsTestimonials.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700">What Pet Parents Say</h4>
                    {npsTestimonials.slice(0, 3).map((testimonial, idx) => (
                        <div key={idx} className="bg-white p-3 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((paw) => (
                                        <PawPrint 
                                            key={paw}
                                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                                paw <= Math.round((testimonial.score || 0) / 2) 
                                                    ? 'fill-amber-500 text-amber-500' 
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs">
                                    {testimonial.score}/10
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 italic">&ldquo;{testimonial.feedback}&rdquo;</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] sm:text-xs text-gray-500">— {testimonial.member_name || 'Happy Pet Parent'}</span>
                                {testimonial.pet_name && (
                                    <span className="text-[10px] sm:text-xs text-amber-600 flex items-center gap-1">
                                        <PawPrint className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {testimonial.pet_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {npsTestimonials.length === 0 && npsScore === null && (
                <p className="text-center text-xs sm:text-sm text-gray-500 italic py-2">
                  {user ? 'Be the first to rate! Tap the paws above.' : 'Sign in to be the first to rate!'}
                </p>
            )}
        </div>

        </div>

        {/* ✦ SOUL MADE™ — breed-specific products, shown on every pillar */}
        {(celebrateSoulProducts.length > 0 || relatedProducts.length > 0) && (
          <div style={{ background: '#0A0A14', borderTop: '1px solid rgba(201,151,58,0.15)', padding: '20px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9973A', letterSpacing: '0.14em', marginBottom: 3 }}>
                  ✦ Mira also recommends for {selectedPet?.name || 'your dog'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  {selectedPet?.breed ? `Made for ${selectedPet.breed.split('(')[0].trim()}s` : 'Personalised for your dog'}
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/celebrate'}
                style={{ fontSize: 12, fontWeight: 700, color: '#C9973A', background: 'none', border: '1px solid rgba(201,151,58,0.30)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Explore Soul Made →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {(celebrateSoulProducts.length > 0 ? celebrateSoulProducts : relatedProducts.slice(0, 3)).map((item, idx) => {
                const img = item.mockup_url || item.watercolor_image || item.cloudinary_url || item.image_url || item.image;
                const name = item.product_name || item.name || item.title;
                const price = item.price || item.minPrice || 0;
                return (
                  <div key={item.id || idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                    onClick={() => handleQuickAdd(item)}>
                    <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#111' }}>
                      {img ? (
                        <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🐾</div>
                      )}
                    </div>
                    <div style={{ padding: '8px 8px 10px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 600, lineHeight: 1.35, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#C9973A' }}>{price > 0 ? `₹${price}` : 'Custom'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  , document.body);
};

export { ProductDetailModal, ConciergeOnlyProductDetailModal };
export default ProductCard;
