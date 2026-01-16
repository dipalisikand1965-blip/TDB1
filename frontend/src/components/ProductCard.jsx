import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Star, X, CalendarIcon, Plus, Sparkles, MessageSquare } from 'lucide-react';
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

const ProductCard = ({ product }) => {
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
  const optionsCount = (product.sizes?.length || 1) * (product.flavors?.length || 1);

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
          {product.rating && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviews || 0})</span>
            </div>
          )}

          <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm">{product.name}</h3>

          <p className="text-sm sm:text-base font-bold text-gray-900">
            From ₹{minPrice.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {showModal && createPortal(
        <ProductDetailModal 
          product={product} 
          onClose={() => setShowModal(false)} 
        />,
        document.body
      )}
    </>
  );
};

const ProductDetailModal = ({ product, onClose }) => {
  // Extract options from product (e.g., Base, Flavour, Weight)
  const productOptions = product.options || [];
  const variants = product.variants || [];
  
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
    addPartyBox: false
  });
  
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  
  const { addToCart } = useCart();
  
  // Reviews state - declared at component level
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '', author_name: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

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

  // Fetch related products
  React.useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products/${product.id}/related?limit=4`);
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
  }, [product.id, API_URL]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products/${product.id}/reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (e) { console.error(e); }
    };
    fetchReviews();
  }, [product.id, API_URL]);

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

  const handleAddToCart = () => {
    // Build variant string from selected options
    const variantDescription = Object.entries(selectedOptions)
      .map(([key, value]) => value)
      .filter(Boolean)
      .join(' / ');
    
    const cartItem = {
      ...product,
      price: currentPrice,
      selectedVariant: matchingVariant?.title || variantDescription,
      selectedOptions: selectedOptions,
      purchaseType: cartInput.purchaseType,
      autoshipFrequency: cartInput.purchaseType === 'autoship' ? cartInput.autoshipFrequency : null,
      isAutoship: cartInput.purchaseType === 'autoship',
      customDetails: { ...cartInput }
    };
    addToCart(cartItem, variantDescription, 'Selected');
    
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
    
    const autoshipMsg = cartInput.purchaseType === 'autoship' 
      ? ` (Autoship every ${cartInput.autoshipFrequency} weeks)` 
      : '';
    
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
          <div className="relative aspect-square bg-gray-100 md:sticky md:top-0">
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

            {/* Personalization - Only for food/cake products */}
            {['cakes', 'celebrate', 'hampers', 'fresh-food', 'meals', 'pupcakes', 'dognuts'].some(cat => 
              (product.category || '').toLowerCase().includes(cat) || 
              (product.name || '').toLowerCase().includes('cake') ||
              (product.name || '').toLowerCase().includes('meal') ||
              (product.name || '').toLowerCase().includes('pupcake') ||
              (product.name || '').toLowerCase().includes('dognut')
            ) && (
            <div className="space-y-3 mb-4 pt-3 border-t">
              <label className="text-sm font-semibold text-gray-700 block">Personalization</label>
              <Input 
                placeholder="Pet's Name (for cake)" 
                value={cartInput.petName}
                onChange={(e) => setCartInput({...cartInput, petName: e.target.value})}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Pet's Age" 
                  value={cartInput.age}
                  onChange={(e) => setCartInput({...cartInput, age: e.target.value})}
                  className="text-sm"
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
                      onChange={() => setCartInput({...cartInput, purchaseType: 'onetime', autoshipFrequency: ''})}
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
                      onChange={() => setCartInput({...cartInput, purchaseType: 'autoship', autoshipFrequency: '4'})}
                      className="w-4 h-4 text-purple-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">Autoship & Save</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Auto-deliver on your schedule</p>
                      
                      {cartInput.purchaseType === 'autoship' && (
                        <div className="mt-3 space-y-3">
                          {/* Frequency selector */}
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Delivery Frequency</label>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                              value={cartInput.autoshipFrequency || '4'}
                              onChange={(e) => setCartInput({...cartInput, autoshipFrequency: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="2">Every 2 weeks</option>
                              <option value="4">Every 4 weeks</option>
                              <option value="6">Every 6 weeks</option>
                            </select>
                          </div>
                          
                          {/* Benefits info */}
                          <div className="bg-blue-50 rounded-lg p-3 text-xs">
                            <p className="font-semibold text-blue-900 mb-2">🎁 Your Autoship Savings:</p>
                            <ul className="space-y-1 text-blue-800">
                              <li>• <strong>25% off</strong> your first Autoship order (max ₹300)</li>
                              <li>• <strong>40% off</strong> on 4th & 5th deliveries</li>
                              <li>• <strong>50% off</strong> on 6th & 7th deliveries</li>
                            </ul>
                            <p className="mt-2 text-blue-700 italic">
                              Every dog deserves at least 7 celebrations a year — one for each dog year! 🐕
                            </p>
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            ✓ Skip, pause, or cancel anytime • ✓ Free to join
                          </p>
                        </div>
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
              <p className="text-yellow-800">
                <strong>Shipping:</strong> ₹150 flat for orders below ₹3000. FREE delivery above ₹3000!
              </p>
            </div>

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
        {/* Reviews Section */}
        <div className="border-t bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Customer Reviews ({reviews.length})
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                </Button>
            </div>

            {showReviewForm && (
                <div className="bg-white p-4 rounded-xl border mb-6 animate-in slide-in-from-top-2">
                    <h4 className="font-semibold mb-3">Write a Review</h4>
                    <div className="space-y-3">
                        <Input 
                            placeholder="Your Name" 
                            value={newReview.author_name}
                            onChange={(e) => setNewReview({...newReview, author_name: e.target.value})}
                        />
                        <Input 
                            placeholder="Review Title" 
                            value={newReview.title}
                            onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(star => (
                                    <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})}>
                                        <Star className={`w-5 h-5 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Textarea 
                            placeholder="Share your experience..." 
                            value={newReview.content}
                            onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                        />
                        <Button onClick={submitReview} disabled={submittingReview} className="w-full bg-purple-600">
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h5 className="font-semibold">{review.title}</h5>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.content}</p>
                        <p className="text-xs text-gray-400 mt-2">- {review.author_name}</p>
                    </div>
                ))}
                {reviews.length === 0 && !showReviewForm && (
                    <p className="text-center text-gray-500 italic py-4">No reviews yet. Be the first!</p>
                )}
            </div>
        </div>

        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Complete the Celebration!</h3>
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
