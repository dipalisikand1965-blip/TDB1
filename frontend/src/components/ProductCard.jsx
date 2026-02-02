import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Star, X, CalendarIcon, Plus, Sparkles, MessageSquare, PawPrint, ChevronDown, Award } from 'lucide-react';
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

const ProductCard = ({ product, pillar = 'celebrate' }) => {
  const [showModal, setShowModal] = useState(false);
  const { user, token } = useAuth();
  
  // Fallback placeholder image
  const PLACEHOLDER_IMAGE = 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579';
  const productImage = product.image && product.image.trim() !== '' ? product.image : PLACEHOLDER_IMAGE;
  
  const getMinPrice = () => {
    if (product.minPrice) return product.minPrice;
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

  return (
    <>
      <div 
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
        onClick={() => setShowModal(true)}
        data-testid={`product-card-${product.id}`}
      >
        <div className="relative overflow-hidden aspect-square">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
          />
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
          {optionsCount > 1 && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 hidden sm:block">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
                {optionsCount} options
              </Badge>
            </div>
          )}
        </div>

        <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
          {/* PawMeter Score Display - shown on all screens */}
          {(product.paw_score || product.rating) && (
            <div className="flex items-center gap-1">
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
            </div>
          )}

          <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm">{product.name}</h3>

          <p className="text-sm sm:text-base font-bold text-gray-900">
            From ₹{minPrice.toLocaleString('en-IN')}
          </p>
          
          {/* View Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="w-full mt-2 py-2 text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      {showModal && createPortal(
        <ProductDetailModal 
          product={product} 
          pillar={pillar}
          onClose={() => setShowModal(false)} 
        />,
        document.body
      )}
    </>
  );
};

const ProductDetailModal = ({ product, pillar = 'celebrate', onClose }) => {
  // Extract options from product (e.g., Base, Flavour, Weight)
  const productOptions = product.options || [];
  const variants = product.variants || [];
  const { user, token } = useAuth();
  
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
    // Build variant string from selected options
    const variantDescription = Object.entries(selectedOptions)
      .map(([key, value]) => value)
      .filter(Boolean)
      .join(' / ');
    
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
    
    toast({
      title: 'Added to cart! 🎉',
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
    toast({
      title: 'Added to cart! ✨',
      description: `${relatedProduct.name} - ₹${price}`,
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square bg-gray-100">
            <img
              src={product.image && product.image.trim() !== '' ? product.image : 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/TDB_cakes_28.png?v=1738050579'; }}
            />
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && <Badge className="bg-purple-600">New</Badge>}
              {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
            </div>
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

            <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
            
            {product.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
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
                  🎁 Customize Your Hamper
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
                  placeholder="Pet's Name (for cake)" 
                  value={cartInput.petName}
                  onChange={(e) => setCartInput({...cartInput, petName: e.target.value})}
                  className="text-sm"
                />
              )}
              
              {/* Show selected pet info */}
              {selectedPetId && selectedPetId !== 'manual' && cartInput.petName && (
                <div className="flex items-center gap-2 text-sm text-pink-700 bg-pink-50 px-3 py-2 rounded-lg">
                  <PawPrint className="w-4 h-4" />
                  <span>Cake for <strong>{cartInput.petName}</strong></span>
                  {cartInput.petBreed && <Badge variant="outline" className="text-xs">{cartInput.petBreed}</Badge>}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Pet's Age" 
                  value={cartInput.age}
                  onChange={(e) => setCartInput({...cartInput, age: e.target.value})}
                  className="text-sm"
                  disabled={selectedPetId && selectedPetId !== 'manual' && cartInput.age}
                />
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal text-sm h-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarOpen(true);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cartInput.date ? format(cartInput.date, 'PP') : <span className="text-gray-500">Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-[10000]" 
                    align="start"
                    onInteractOutside={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={cartInput.date}
                      onSelect={(date) => {
                        setCartInput({...cartInput, date});
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <select 
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={cartInput.time}
                onChange={(e) => setCartInput({...cartInput, time: e.target.value})}
              >
                <option value="">Select Pick Up | Delivery Time</option>
                <option value="10am-1pm">10 AM - 1 PM</option>
                <option value="1pm-4pm">1 PM - 4 PM</option>
                <option value="4pm-7pm">4 PM - 7 PM</option>
                <option value="7pm-9pm">7 PM - 9 PM</option>
              </select>
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

            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xs text-gray-500">Total Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{currentPrice}</p>
              </div>
              <Button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-6"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
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
        <div className="border-t bg-gradient-to-br from-amber-50 to-orange-50 p-6" data-testid="nps-section">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-amber-600" />
                    Net Pawmoter Score™
                </h3>
            </div>
            
            {/* NPS Score Display */}
            {npsScore !== null ? (
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-amber-200">
                        {/* Paw Rating - 5 paws for 0-10 scale (2 points per paw) */}
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((paw) => (
                                <PawPrint 
                                    key={paw}
                                    className={`w-6 h-6 ${
                                        paw <= Math.round(npsScore / 2) 
                                            ? 'fill-amber-500 text-amber-500' 
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-2xl font-bold text-amber-600">{npsScore}</span>
                        <span className="text-gray-500 text-sm">/10</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Based on customer satisfaction surveys</p>
                </div>
            ) : (
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1 text-gray-400">
                        {[1, 2, 3, 4, 5].map((paw) => (
                            <PawPrint key={paw} className="w-6 h-6" />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">No ratings yet</p>
                    <p className="text-xs text-amber-600 italic mt-1">
                        Purchase this product and share your experience!
                    </p>
                </div>
            )}
            
            {/* NPS Testimonials */}
            {npsTestimonials.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">What Pet Parents Say</h4>
                    {npsTestimonials.slice(0, 3).map((testimonial, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((paw) => (
                                        <PawPrint 
                                            key={paw}
                                            className={`w-4 h-4 ${
                                                paw <= Math.round((testimonial.score || 0) / 2) 
                                                    ? 'fill-amber-500 text-amber-500' 
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 text-xs">
                                    {testimonial.score}/10
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-700 italic">&ldquo;{testimonial.feedback}&rdquo;</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">— {testimonial.member_name || 'Happy Pet Parent'}</span>
                                {testimonial.pet_name && (
                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                        <PawPrint className="w-3 h-3" /> {testimonial.pet_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {npsTestimonials.length === 0 && npsScore === null && (
                <p className="text-center text-gray-500 italic py-4">Be the first to rate this product!</p>
            )}
        </div>

        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">{PILLAR_CROSS_SELL_TITLES[pillar] || PILLAR_CROSS_SELL_TITLES.default}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedProducts.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-purple-600">
                      ₹{item.minPrice || item.price || 0}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-purple-100"
                      onClick={() => handleQuickAdd(item)}
                      data-testid={`quick-add-${item.id}`}
                    >
                      <Plus className="w-4 h-4 text-purple-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
