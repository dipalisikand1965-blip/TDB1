import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from '../hooks/use-toast';
import { 
  ArrowLeft, CreditCard, Truck, MapPin, Phone, MessageCircle, 
  CheckCircle, User, Mail, PawPrint, Calendar, Gift, Sparkles,
  Crown, AlertCircle, Tag, Star, Loader2, X, Store, Package, Info, Plus, ChevronDown
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedAutocomplete from '../components/BreedAutocomplete';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';
const BUSINESS_EMAIL = process.env.REACT_APP_BUSINESS_EMAIL || 'woof@thedoggybakery.in';

// Default values (will be overridden by API settings)
const DEFAULT_FREE_SHIPPING_THRESHOLD = 3000;
const DEFAULT_SHIPPING_FEE = 150;

// Default store locations (will be fetched from API)
const DEFAULT_STORE_LOCATIONS = [
  { id: 'mumbai', city: 'Mumbai', address: 'Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061' },
  { id: 'gurugram', city: 'Gurugram', address: 'Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003' },
  { id: 'bangalore', city: 'Bangalore', address: '147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034' }
];

// Default pickup cities
const DEFAULT_PICKUP_CITIES = ['Mumbai', 'Gurugram', 'Bangalore'];

// Categories that require store pickup in 3 cities
const DEFAULT_BAKERY_CATEGORIES = ['cakes', 'fresh_treats', 'celebration'];

const addOns = [
  { id: 'ao-1', name: 'Birthday Bandana', price: 299, image: 'https://thedoggybakery.com/cdn/shop/products/WhatsAppImage2022-05-13at3.24.11PM.jpg?v=1655357921&width=100' },
  { id: 'ao-2', name: 'Party Hat', price: 199, image: 'https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7.jpg?v=1759129448&width=100' },
  { id: 'ao-3', name: 'Paw Balm', price: 350, image: 'https://thedoggybakery.com/cdn/shop/files/TDB_cakes_28.png?v=1738050579&width=100' },
  { id: 'ao-4', name: 'Treat Pack (100g)', price: 150, image: 'https://thedoggybakery.com/cdn/shop/products/IMG-8036.png?v=1680145248&width=100' }
];

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, addToCart, markCartConverted, captureEmail } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // User's registered pets (for logged-in users)
  const [registeredPets, setRegisteredPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // App Settings State (includes admin-editable shipping thresholds)
  const [appSettings, setAppSettings] = useState({
    pickup_cities: DEFAULT_PICKUP_CITIES,
    store_locations: DEFAULT_STORE_LOCATIONS,
    bakery_pickup_only_categories: DEFAULT_BAKERY_CATEGORIES,
    pan_india_shipping: true,
    shipping_thresholds: [
      { min_cart_value: 0, max_cart_value: 3000, shipping_fee: 150 },
      { min_cart_value: 3000, max_cart_value: 999999, shipping_fee: 0 }
    ],
    free_shipping_threshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    default_shipping_fee: DEFAULT_SHIPPING_FEE
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [pickupLocation, setPickupLocation] = useState('');
  const [isPanIndiaDelivery, setIsPanIndiaDelivery] = useState(false);

  // Discount & Loyalty State
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true for convenience
  
  // Pet Soul Insights
  const [petSoulInsights, setPetSoulInsights] = useState(null);
  const [loadingPetSoul, setLoadingPetSoul] = useState(false);
  
  // Breed-specific product recommendations
  const [breedProducts, setBreedProducts] = useState([]);
  const [loadingBreedProducts, setLoadingBreedProducts] = useState(false);
  
  const [formData, setFormData] = useState({
    // Pet Parent Details
    parentName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    
    // Delivery Address
    address: '',
    landmark: '',
    city: 'Bangalore',
    customCity: '', // For Pan-India text input
    pincode: '',
    
    // Pet Details (MANDATORY for cakes)
    petName: '',  // MANDATORY - Goes on cake
    petBreed: '',
    petAge: '',
    
    // Order Details
    deliveryDate: '',
    deliveryTime: 'afternoon',
    specialInstructions: '',
    giftMessage: '',
    isGift: false,
    
    // Offers
    couponCode: ''
  });

  // Load saved customer data from localStorage on mount
  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem('tdc_customer_details');
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        
        // Validate pet name - should not be an email address
        const isValidPetName = (name) => {
          if (!name) return false;
          // Pet name should not contain @ (email indicator)
          if (name.includes('@')) return false;
          // Pet name should be reasonable length
          if (name.length > 50) return false;
          return true;
        };
        
        setFormData(prev => ({
          ...prev,
          parentName: parsed.parentName || prev.parentName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          whatsappNumber: parsed.whatsappNumber || prev.whatsappNumber,
          address: parsed.address || prev.address,
          landmark: parsed.landmark || prev.landmark,
          city: parsed.city || prev.city,
          pincode: parsed.pincode || prev.pincode,
          // Only use saved pet name if it's valid (not an email)
          petName: isValidPetName(parsed.petName) ? parsed.petName : prev.petName,
          petBreed: parsed.petBreed || prev.petBreed,
        }));
        // Check if user had opted to remember
        setRememberMe(parsed.rememberMe !== false);
      }
    } catch (err) {
      console.error('Error loading saved customer details:', err);
    }
  }, []);
  
  // Fetch registered pets for logged-in users
  useEffect(() => {
    const fetchRegisteredPets = async () => {
      if (!token || !user) return;
      
      // Auto-fill user info first
      setFormData(prev => ({
        ...prev,
        parentName: prev.parentName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        whatsappNumber: prev.whatsappNumber || user.phone || ''
      }));
      
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRegisteredPets(data.pets || []);
          
          // If user has pets and form is empty, pre-fill with first pet
          if (data.pets?.length > 0 && !formData.petName) {
            const firstPet = data.pets[0];
            setSelectedPetId(firstPet.id);
            setFormData(prev => ({
              ...prev,
              petName: firstPet.name || '',
              petBreed: firstPet.identity?.breed || firstPet.breed || '',
              petAge: calculateAge(firstPet.birth_date) || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching registered pets:', err);
      }
    };
    
    fetchRegisteredPets();
  }, [token, user]);
  
  // Helper to calculate pet age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const years = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) {
      const months = Math.floor((now - birth) / (30.44 * 24 * 60 * 60 * 1000));
      return `${months} months`;
    }
    return `${years} year${years > 1 ? 's' : ''}`;
  };
  
  // Handle pet selection from dropdown
  const handlePetSelect = (petId) => {
    setSelectedPetId(petId);
    if (petId === 'manual') {
      // User wants to enter manually
      setFormData(prev => ({ ...prev, petName: '', petBreed: '', petAge: '' }));
      return;
    }
    
    const selectedPet = registeredPets.find(p => p.id === petId);
    if (selectedPet) {
      setFormData(prev => ({
        ...prev,
        petName: selectedPet.name || '',
        petBreed: selectedPet.identity?.breed || selectedPet.breed || '',
        petAge: calculateAge(selectedPet.birth_date) || ''
      }));
      toast({ title: `${selectedPet.name} selected`, description: 'Pet details filled automatically' });
    }
  };

  // Fetch Pet Soul insights when pet name changes
  useEffect(() => {
    const fetchPetSoul = async () => {
      if (!formData.petName || formData.petName.length < 2) {
        setPetSoulInsights(null);
        return;
      }
      
      setLoadingPetSoul(true);
      try {
        // Search for pet by name
        const res = await fetch(`${API_URL}/api/pets/public?search=${encodeURIComponent(formData.petName)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const pets = data.pets || [];
          
          // Find exact match
          const matchedPet = pets.find(p => 
            p.name?.toLowerCase() === formData.petName.toLowerCase()
          );
          
          if (matchedPet) {
            // Fetch full Pet Soul profile
            const profileRes = await fetch(`${API_URL}/api/pet-soul/profile/${matchedPet.id}`);
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              setPetSoulInsights({
                pet: profileData.pet,
                scores: profileData.scores,
                insights: profileData.insights,
                answers: profileData.pet?.doggy_soul_answers || {}
              });
              
              // Auto-fill breed if not set
              if (!formData.petBreed && matchedPet.breed) {
                setFormData(prev => ({ ...prev, petBreed: matchedPet.breed }));
              }
            }
          } else {
            setPetSoulInsights(null);
          }
        }
      } catch (err) {
        console.error('Error fetching Pet Soul:', err);
      }
      setLoadingPetSoul(false);
    };
    
    // Debounce the fetch
    const timeoutId = setTimeout(fetchPetSoul, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.petName]);

  // Fetch breed-specific product recommendations
  useEffect(() => {
    const fetchBreedProducts = async () => {
      if (!formData.petBreed || formData.petBreed.length < 2) {
        setBreedProducts([]);
        return;
      }
      
      setLoadingBreedProducts(true);
      try {
        const res = await fetch(`${API_URL}/api/pet-soul/breed-products/${encodeURIComponent(formData.petBreed)}?limit=4`);
        if (res.ok) {
          const data = await res.json();
          setBreedProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error fetching breed products:', err);
      }
      setLoadingBreedProducts(false);
    };
    
    // Debounce the fetch
    const timeoutId = setTimeout(fetchBreedProducts, 600);
    return () => clearTimeout(timeoutId);
  }, [formData.petBreed]);

  // Fetch app settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/public`);
        if (res.ok) {
          const data = await res.json();
          setAppSettings({
            pickup_cities: data.pickup_cities || DEFAULT_PICKUP_CITIES,
            store_locations: data.store_locations || DEFAULT_STORE_LOCATIONS,
            bakery_pickup_only_categories: data.bakery_pickup_only_categories || DEFAULT_BAKERY_CATEGORIES,
            pan_india_shipping: data.pan_india_shipping !== false,
            shipping_thresholds: data.shipping_thresholds || [
              { min_cart_value: 0, max_cart_value: 3000, shipping_fee: 150 },
              { min_cart_value: 3000, max_cart_value: 999999, shipping_fee: 0 }
            ],
            free_shipping_threshold: data.free_shipping_threshold || DEFAULT_FREE_SHIPPING_THRESHOLD,
            default_shipping_fee: data.default_shipping_fee || DEFAULT_SHIPPING_FEE
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Analyze cart for fulfillment requirements
  const cartAnalysis = useMemo(() => {
    const bakeryCategories = appSettings.bakery_pickup_only_categories;
    
    const hasBakeryItems = cartItems.some(item => {
      const category = item.category?.toLowerCase() || '';
      const name = item.name?.toLowerCase() || '';
      return bakeryCategories.some(cat => category.includes(cat) || name.includes('cake'));
    });
    
    const hasShippableItems = cartItems.some(item => {
      const category = item.category?.toLowerCase() || '';
      const name = item.name?.toLowerCase() || '';
      const isBakery = bakeryCategories.some(cat => category.includes(cat) || name.includes('cake'));
      return !isBakery;
    });
    
    const isMixedCart = hasBakeryItems && hasShippableItems;
    const bakeryOnlyCart = hasBakeryItems && !hasShippableItems;
    const shippableOnlyCart = hasShippableItems && !hasBakeryItems;
    
    // Get bakery items for display
    const bakeryItems = cartItems.filter(item => {
      const category = item.category?.toLowerCase() || '';
      const name = item.name?.toLowerCase() || '';
      return bakeryCategories.some(cat => category.includes(cat) || name.includes('cake'));
    });
    
    // Get shippable items for display
    const shippableItems = cartItems.filter(item => {
      const category = item.category?.toLowerCase() || '';
      const name = item.name?.toLowerCase() || '';
      const isBakery = bakeryCategories.some(cat => category.includes(cat) || name.includes('cake'));
      return !isBakery;
    });
    
    return {
      hasBakeryItems,
      hasShippableItems,
      isMixedCart,
      bakeryOnlyCart,
      shippableOnlyCart,
      bakeryItems,
      shippableItems
    };
  }, [cartItems, appSettings.bakery_pickup_only_categories]);

  // Auto-set delivery method based on cart analysis
  // Note: Bakery items can be delivered OR picked up - delivery is default (99% customers prefer shipping)
  // Only auto-set when cart analysis changes, not to override user choice
  useEffect(() => {
    // Only set default if user hasn't made a selection yet (initial load)
    // We don't force pickup for bakery items anymore - delivery is the default
    // Pickup is available in Mumbai, Gurugram, Bangalore for those who prefer it
  }, []);

  // Auto-populate from Cart Items (PDP Data)
  useEffect(() => {
    // Find the first item with custom details (usually the cake)
    const customizedItem = cartItems.find(item => item.customDetails && (item.customDetails.petName || item.customDetails.date));
    
    if (customizedItem) {
      const details = customizedItem.customDetails;
      setFormData(prev => ({
        ...prev,
        petName: details.petName || prev.petName,
        petAge: details.age || prev.petAge,
        deliveryDate: details.date ? new Date(details.date).toISOString().split('T')[0] : prev.deliveryDate,
        deliveryTime: details.time || prev.deliveryTime
      }));
    }
  }, [cartItems]);

  // Fetch loyalty balance when email is entered
  useEffect(() => {
    const fetchLoyaltyBalance = async () => {
      if (formData.email && formData.email.includes('@')) {
        setIsLoadingLoyalty(true);
        try {
          const res = await fetch(`${API_URL}/api/loyalty/balance?user_id=${encodeURIComponent(formData.email)}`);
          if (res.ok) {
            const data = await res.json();
            setLoyaltyBalance(data);
          }
        } catch (err) {
          console.error('Failed to fetch loyalty balance:', err);
        } finally {
          setIsLoadingLoyalty(false);
        }
      }
    };
    fetchLoyaltyBalance();
  }, [formData.email]);

  // Validate discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast({ title: 'Enter a code', description: 'Please enter a discount code', variant: 'destructive' });
      return;
    }
    
    setIsValidatingCode(true);
    try {
      const subtotal = getCartTotal();
      const res = await fetch(`${API_URL}/api/discount-codes/validate?code=${encodeURIComponent(discountCode)}&order_total=${subtotal}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setAppliedDiscount(data);
        toast({ 
          title: 'Code Applied! 🎉', 
          description: `You saved ₹${data.discount_amount}` 
        });
      } else {
        toast({ 
          title: 'Invalid Code', 
          description: data.detail || 'This code cannot be applied', 
          variant: 'destructive' 
        });
        setAppliedDiscount(null);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to validate code', variant: 'destructive' });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  // Handle loyalty points redemption
  const handleRedeemPoints = (points) => {
    const maxRedeemable = Math.min(loyaltyBalance?.points || 0, Math.floor(getCartTotal() / 0.5)); // Max based on cart value
    const validPoints = Math.max(0, Math.min(points, maxRedeemable));
    setPointsToRedeem(validPoints);
    setLoyaltyDiscount(validPoints * 0.5); // 1 point = ₹0.50
  };

  const clearLoyaltyRedemption = () => {
    setPointsToRedeem(0);
    setLoyaltyDiscount(0);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  // Handle Pan-India toggle
  const handlePanIndiaToggle = (enabled) => {
    setIsPanIndiaDelivery(enabled);
    if (enabled) {
      setFormData(prev => ({ ...prev, city: '', customCity: '' }));
    } else {
      setFormData(prev => ({ ...prev, city: 'Bangalore', customCity: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.parentName.trim()) errors.parentName = 'Parent name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp number is required';
    
    // Address validation based on delivery method
    if (deliveryMethod === 'delivery') {
      if (!formData.address.trim()) errors.address = 'Address is required';
      
      // City validation
      if (isPanIndiaDelivery) {
        if (!formData.customCity.trim()) errors.customCity = 'City name is required for Pan-India delivery';
      } else if (formData.city === 'Others') {
        // User selected "Others" - must provide custom city
        if (!formData.customCity.trim()) errors.customCity = 'Please enter your city name';
      } else {
        if (!formData.city.trim()) errors.city = 'City is required';
      }
      
      if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';
    } else {
      if (!pickupLocation) errors.pickupLocation = 'Please select a store location';
    }
    
    // For mixed cart, validate that user selected a pickup location for bakery items
    if (cartAnalysis.isMixedCart && !pickupLocation) {
      errors.pickupLocation = 'Please select a pickup location for bakery items (cakes)';
    }
    
    // Pet name is MANDATORY for cakes (goes on the cake!)
    if (cartAnalysis.hasBakeryItems && !formData.petName.trim()) {
      errors.petName = "Pet's name is required - we put it on the cake! 🎂";
    }
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Phone validation
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleAddOn = (addOn) => {
    addToCart({
      ...addOn,
      description: 'Quick add-on item'
    }, 'Standard', 'Standard');
    toast({ title: "Added!", description: `${addOn.name} added to order.` });
  };

  // Get the effective city for the order
  const getEffectiveCity = () => {
    if (deliveryMethod === 'pickup') {
      const store = appSettings.store_locations.find(s => s.id === pickupLocation);
      return store?.city || '';
    }
    // For "Others" selection or Pan-India, use customCity
    if (isPanIndiaDelivery || formData.city === 'Others') {
      return formData.customCity;
    }
    return formData.city;
  };

  // Generate order summary for WhatsApp
  const generateWhatsAppMessage = (orderData) => {
    const subtotal = getCartTotal();
    const deliveryFee = calculateDeliveryFee();
    const total = orderData.finalTotal;
    
    // Build location details based on fulfilment type
    let locationDetails = '';
    if (cartAnalysis.isMixedCart) {
      const store = appSettings.store_locations.find(s => s.id === pickupLocation);
      locationDetails = `🍰 *BAKERY ITEMS PICKUP:* ${store?.city} (${store?.address})

📦 *SHIPPABLE ITEMS DELIVERY:*
${formData.address}
${formData.landmark ? `Landmark: ${formData.landmark}\n` : ''}${getEffectiveCity()} - ${formData.pincode}
${isPanIndiaDelivery ? '(Pan-India Delivery)' : ''}`;
    } else if (deliveryMethod === 'pickup') {
      const store = appSettings.store_locations.find(s => s.id === pickupLocation);
      locationDetails = `🛍️ *PICKUP:* ${store?.city} (${store?.address})`;
    } else {
      locationDetails = `📍 *DELIVERY ADDRESS:*
${formData.address}
${formData.landmark ? `Landmark: ${formData.landmark}\n` : ''}${getEffectiveCity()} - ${formData.pincode}
${isPanIndiaDelivery ? '(Pan-India Delivery)' : ''}`;
    }

    // Build fulfilment type info
    let fulfilmentInfo = '';
    if (cartAnalysis.isMixedCart) {
      fulfilmentInfo = `*SPLIT FULFILMENT ORDER*
🍰 Bakery Items: Store Pickup
📦 Other Items: ${isPanIndiaDelivery ? 'Pan-India Shipping' : 'City Delivery'}`;
    } else if (deliveryMethod === 'pickup') {
      fulfilmentInfo = 'Store Pickup';
    } else {
      fulfilmentInfo = isPanIndiaDelivery ? 'Pan-India Shipping' : 'City Delivery';
    }

    return `🐕 *NEW ORDER - The Doggy Company*
    
📋 *Order ID:* ${orderData.orderId}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

👤 *PET PARENT DETAILS:*
• Name: ${formData.parentName}
• Phone: ${formData.phone}
• WhatsApp: ${formData.whatsappNumber}
• Email: ${formData.email || 'Not provided'}

🐾 *PET DETAILS:*
• Pet Name: *${formData.petName || 'Not specified'}* ${formData.petName && cartAnalysis.hasBakeryItems ? '(FOR CAKE)' : ''}
• Breed: ${formData.petBreed || 'Not specified'}
• Age: ${formData.petAge || 'Not specified'}

${locationDetails}

🚚 *FULFILMENT:* ${fulfilmentInfo}

📦 *ORDER ITEMS:*
${cartItems.map(item => `
• *${item.name}*
  Size: ${item.selectedSize} | Flavor: ${item.selectedFlavor}
  Qty: ${item.quantity} | Price: ₹${item.price * item.quantity}
  ${item.customDetails?.petName ? `Pet: ${item.customDetails.petName}` : ''}
  ${item.customDetails?.date ? `Date: ${new Date(item.customDetails.date).toDateString()}` : ''}`).join('')}

🚚 *PREFERENCE:*
• Date: ${formData.deliveryDate ? new Date(formData.deliveryDate).toDateString() : 'ASAP'}
• Time: ${formData.deliveryTime === 'morning' ? '9AM-12PM' : formData.deliveryTime === 'afternoon' ? '12PM-4PM' : '4PM-8PM'}

${formData.specialInstructions ? `📝 *SPECIAL INSTRUCTIONS:*\n${formData.specialInstructions}\n` : ''}
${formData.isGift ? `🎁 *GIFT MESSAGE:*\n${formData.giftMessage || 'No message'}\n` : ''}

💰 *PAYMENT SUMMARY:*
Subtotal: ₹${subtotal}
Delivery: ${deliveryFee === 0 ? 'FREE! 🎉' : `₹${deliveryFee}`}
${orderData.discountCode ? `Discount (${orderData.discountCode}): -₹${orderData.discountAmount}` : ''}
${orderData.loyaltyPointsUsed ? `Loyalty Points (${orderData.loyaltyPointsUsed} pts): -₹${orderData.loyaltyDiscount}` : ''}
*TOTAL: ₹${total}*

_GST applicable on final invoice_

✅ *Please confirm this order and send me the payment link to proceed.*`;
  };

  // Calculate delivery fee based on fulfilment type
  // Calculate delivery fee based on admin-configurable thresholds
  const calculateDeliveryFee = () => {
    const subtotal = getCartTotal();
    
    // Pure pickup - no delivery fee
    if (deliveryMethod === 'pickup' && !cartAnalysis.isMixedCart) {
      return 0;
    }
    
    // Use admin-configured shipping thresholds
    const thresholds = appSettings.shipping_thresholds || [];
    const freeThreshold = appSettings.free_shipping_threshold || DEFAULT_FREE_SHIPPING_THRESHOLD;
    const defaultFee = appSettings.default_shipping_fee || DEFAULT_SHIPPING_FEE;
    
    // Check if above free shipping threshold
    if (subtotal >= freeThreshold) {
      return 0;
    }
    
    // Find applicable shipping fee from thresholds
    const applicableThreshold = thresholds.find(
      t => subtotal >= t.min_cart_value && subtotal < t.max_cart_value
    );
    
    if (applicableThreshold) {
      return applicableThreshold.shipping_fee;
    }
    
    // Fallback to default fee
    return defaultFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      const missingFields = Object.keys(validation.errors).map(key => {
        // Convert camelCase to readable format
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      }).join(', ');
      toast({
        title: 'Please fill required fields',
        description: missingFields || 'Some required information is missing',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const subtotal = getCartTotal();
    const deliveryFee = calculateDeliveryFee();
    const discountAmount = appliedDiscount?.discount_amount || 0;
    const totalBeforeDelivery = subtotal - discountAmount - loyaltyDiscount;
    const total = Math.max(0, totalBeforeDelivery) + deliveryFee;
    const orderId = `TDB-${Date.now().toString(36).toUpperCase()}`;
    
    // Determine fulfilment type
    let fulfilmentType = 'delivery';
    if (cartAnalysis.isMixedCart) {
      fulfilmentType = 'split';
    } else if (deliveryMethod === 'pickup') {
      fulfilmentType = 'store_pickup';
    } else if (isPanIndiaDelivery) {
      fulfilmentType = 'pan_india_shipping';
    }
    
    // Save order to backend
    try {
      const orderPayload = {
        orderId,
        customer: {
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber
        },
        pet: {
          name: formData.petName,
          breed: formData.petBreed,
          age: formData.petAge
        },
        delivery: {
          method: deliveryMethod,
          fulfilmentType: fulfilmentType,
          pickupLocation: pickupLocation || null,
          isPanIndia: isPanIndiaDelivery,
          address: formData.address,
          landmark: formData.landmark,
          city: getEffectiveCity(),
          pincode: formData.pincode,
          date: formData.deliveryDate,
          time: formData.deliveryTime
        },
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          size: item.selectedSize,
          flavor: item.selectedFlavor,
          quantity: item.quantity,
          price: item.price,
          customDetails: item.customDetails,
          category: item.category,
          image: item.image,
          // Include reference image if present
          reference_image: item.customDetails?.referenceImage || item.referenceImage || null
        })),
        specialInstructions: formData.specialInstructions,
        isGift: formData.isGift,
        giftMessage: formData.giftMessage,
        couponCode: appliedDiscount?.code || '',
        discountAmount: discountAmount,
        loyaltyPointsUsed: pointsToRedeem,
        loyaltyDiscount: loyaltyDiscount,
        subtotal: getCartTotal(),
        deliveryFee,
        total,
        status: 'pending',
        paymentStatus: 'unpaid',
        // Split fulfillment details for mixed carts
        splitFulfilment: cartAnalysis.isMixedCart ? {
          bakeryPickup: {
            location: pickupLocation,
            items: cartAnalysis.bakeryItems.map(i => i.name)
          },
          shipping: {
            address: `${formData.address}, ${getEffectiveCity()} - ${formData.pincode}`,
            items: cartAnalysis.shippableItems.map(i => i.name),
            isPanIndia: isPanIndiaDelivery
          }
        } : null
      };
      
      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const orderResult = await orderResponse.json();
      
      // Log if service desk ticket was created
      if (orderResult.ticket_id) {
        console.log(`Service Desk Ticket created: ${orderResult.ticket_id} (same as Order ID)`);
      }

      // Record discount code usage if applied
      if (appliedDiscount?.code) {
        await fetch(`${API_URL}/api/discount-codes/apply?code=${encodeURIComponent(appliedDiscount.code)}&order_id=${orderId}`, {
          method: 'POST'
        });
      }

      // Redeem loyalty points if used
      if (pointsToRedeem > 0 && formData.email) {
        await fetch(`${API_URL}/api/loyalty/redeem?user_id=${encodeURIComponent(formData.email)}&points_to_redeem=${pointsToRedeem}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      // Continue anyway - WhatsApp will have the order
    }
    
    // Generate WhatsApp URL with discount info
    const waMessage = generateWhatsAppMessage({ 
      orderId,
      discountCode: appliedDiscount?.code,
      discountAmount: discountAmount,
      loyaltyPointsUsed: pointsToRedeem,
      loyaltyDiscount: loyaltyDiscount,
      finalTotal: total
    });
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
    setWhatsappUrl(waUrl);
    
    // Store order details for confirmation screen
    setOrderDetails({
      items: [...cartItems],
      customer: { ...formData },
      total,
      orderId,
      discountCode: appliedDiscount?.code,
      discountAmount,
      loyaltyPointsUsed: pointsToRedeem,
      loyaltyDiscount,
      deliveryMethod,
      fulfilmentType,
      pickupLocation,
      deliveryFee,
      isPanIndia: isPanIndiaDelivery,
      isMixedCart: cartAnalysis.isMixedCart
    });
    
    // Show order placed
    setIsOrderPlaced(true);
    setIsSubmitting(false);
    
    // Save customer details for future orders (if opted in)
    if (rememberMe) {
      try {
        // Validate pet name before saving - should not be an email
        const validatedPetName = (formData.petName && !formData.petName.includes('@')) 
          ? formData.petName 
          : '';
        
        const customerToSave = {
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          address: formData.address,
          landmark: formData.landmark,
          city: formData.city,
          pincode: formData.pincode,
          petName: validatedPetName,
          petBreed: formData.petBreed,
          rememberMe: true,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('tdc_customer_details', JSON.stringify(customerToSave));
      } catch (err) {
        console.error('Error saving customer details:', err);
      }
    }
    
    toast({
      title: 'Order placed successfully! 🎉',
      description: 'Please confirm your order on WhatsApp to complete.',
    });
    
    // Mark cart as converted and clear
    if (orderDetails?.orderId) {
      markCartConverted(orderDetails.orderId);
    }
    clearCart();
  };

  // Capture email for abandoned cart recovery when user enters it
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    if (email && email.includes('@')) {
      captureEmail(email, formData.parentName);
    }
  };

  // Order confirmation screen
  if (isOrderPlaced && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Order Received! 🎉
            </h1>
            
            <p className="text-gray-600 mb-2">
              Order ID: <span className="font-mono font-bold text-purple-600">{orderDetails.orderId}</span>
            </p>
            <p className="text-gray-600 mb-8">
              Thank you, {orderDetails.customer.parentName}! Your pawsome treats are being prepared.
            </p>

            {/* Split Fulfilment Notice */}
            {orderDetails.isMixedCart && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 font-semibold">Split Fulfilment Order</p>
                </div>
                <p className="text-sm text-blue-700">
                  🍰 <strong>Bakery items:</strong> Pickup from store<br />
                  📦 <strong>Other items:</strong> {orderDetails.isPanIndia ? 'Pan-India shipping' : 'Delivery to your address'}
                </p>
              </div>
            )}

            {/* Savings Banner */}
            {(orderDetails.discountAmount > 0 || orderDetails.loyaltyDiscount > 0) && (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  You saved ₹{(orderDetails.discountAmount || 0) + (orderDetails.loyaltyDiscount || 0)} on this order!
                </p>
              </div>
            )}

            {/* WhatsApp Confirmation CTA */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Step 1: Confirm on WhatsApp</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Click below to send your order details to our team.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold text-lg inline-flex items-center gap-2"
                data-testid="whatsapp-confirm-btn"
              >
                <MessageCircle className="w-5 h-5" />
                Send Order on WhatsApp
              </a>
            </div>

            {/* Payment Info */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CreditCard className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">Step 2: Complete Payment</h3>
              </div>
              <p className="text-purple-700 text-sm">
                Once you confirm your order on WhatsApp, our team will send you a 
                <span className="font-bold"> secure payment link</span> within 5 minutes.
              </p>
              <p className="text-purple-600 text-xs mt-2">
                We accept UPI, Cards, Net Banking & Wallets
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="text-sm font-medium text-purple-700 mb-2">
                  Fulfilment: {orderDetails.fulfilmentType === 'split' ? 'Split (Pickup + Delivery)' : 
                              orderDetails.fulfilmentType === 'store_pickup' ? 'Store Pickup' : 
                              orderDetails.fulfilmentType === 'pan_india_shipping' ? 'Pan-India Shipping' : 'Delivery'}
                </div>
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.quantity}</span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                {orderDetails.discountCode && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({orderDetails.discountCode})</span>
                    <span>-₹{orderDetails.discountAmount}</span>
                  </div>
                )}
                {orderDetails.loyaltyPointsUsed > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Loyalty Points ({orderDetails.loyaltyPointsUsed} pts)</span>
                    <span>-₹{orderDetails.loyaltyDiscount}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-purple-600">
                  <span>Total</span>
                  <span>₹{orderDetails.total}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-sm text-gray-500 space-y-2">
              <p>Questions? Contact us:</p>
              <p className="font-medium">📧 {BUSINESS_EMAIL}</p>
              <p className="font-medium">📱 +91 96631 85747</p>
            </div>

            <Button variant="outline" onClick={() => navigate('/')} className="mt-8">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some treats to get started!</p>
          <Button onClick={() => navigate('/cakes')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = calculateDeliveryFee();
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Mixed Cart Alert */}
        {cartAnalysis.isMixedCart && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-blue-900">Split Fulfilment Order</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your cart contains both <strong>bakery items</strong> (cakes, fresh treats) and <strong>shippable products</strong>.
                </p>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm">Store Pickup (Bakery)</span>
                    </div>
                    <ul className="text-xs text-gray-600">
                      {cartAnalysis.bakeryItems.map((item, idx) => (
                        <li key={idx}>• {item.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">Home Delivery / Shipping</span>
                    </div>
                    <ul className="text-xs text-gray-600">
                      {cartAnalysis.shippableItems.map((item, idx) => (
                        <li key={idx}>• {item.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bakery Only Alert */}
        {cartAnalysis.bakeryOnlyCart && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Store className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-amber-900">Store Pickup Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  Fresh cakes and bakery items require <strong>store pickup</strong> to ensure freshness. 
                  Please select your nearest store below.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Membership Promotion */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8" />
              <div>
                <p className="font-semibold">Become a Member & Save!</p>
                <p className="text-sm text-purple-100">Get up to 20% off on every order + free delivery</p>
              </div>
            </div>
            <Link to="/membership">
              <Button variant="secondary" size="sm" className="bg-white text-purple-600 hover:bg-purple-50">
                <Sparkles className="w-4 h-4 mr-2" /> View Plans
              </Button>
            </Link>
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Pet Parent Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Pet Parent Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Your Name *</Label>
                    <Input
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={formErrors.parentName ? 'border-red-500' : ''}
                      data-testid="checkout-parent-name"
                    />
                    {formErrors.parentName && <p className="text-red-500 text-xs mt-1">{formErrors.parentName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      onBlur={(e) => captureEmail(e.target.value, formData.parentName)}
                      placeholder="your@email.com"
                      className={formErrors.email ? 'border-red-500' : ''}
                      data-testid="checkout-email"
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={formErrors.phone ? 'border-red-500' : ''}
                      data-testid="checkout-phone"
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="For order updates"
                      className={formErrors.whatsappNumber ? 'border-red-500' : ''}
                      data-testid="checkout-whatsapp"
                    />
                    {formErrors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{formErrors.whatsappNumber}</p>}
                  </div>
                </div>
                
                {/* Remember Me Checkbox */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          data-testid="remember-me-checkbox"
                        />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          Remember my details for next time
                        </span>
                        <p className="text-xs text-gray-500">
                          Save your info for faster checkout on future orders
                        </p>
                      </div>
                    </label>
                    
                    {/* Clear saved data button */}
                    {localStorage.getItem('tdc_customer_details') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-red-600"
                        onClick={() => {
                          localStorage.removeItem('tdc_customer_details');
                          setFormData(prev => ({
                            ...prev,
                            parentName: '',
                            email: '',
                            phone: '',
                            whatsappNumber: '',
                            address: '',
                            landmark: '',
                            city: 'Bangalore',
                            pincode: '',
                            petName: '',
                            petBreed: '',
                            petAge: ''
                          }));
                          toast({ title: 'Saved details cleared', description: 'You can enter fresh information' });
                        }}
                        data-testid="clear-saved-details"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear saved details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Pet Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                  Pet Details
                  {cartAnalysis.hasBakeryItems && <Badge variant="destructive" className="ml-2">Required for Cake</Badge>}
                </h2>
                
                {cartAnalysis.hasBakeryItems && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>Pet&apos;s name is mandatory!</strong> We write it on the cake to make it extra special 🎂
                    </p>
                  </div>
                )}
                
                {/* Quick Pet Selector for logged-in users with pets */}
                {registeredPets.length > 0 && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <Label className="text-sm font-medium text-purple-700 mb-2 block">
                      Quick Select from Your Pets
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {registeredPets.map(pet => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => handlePetSelect(pet.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            selectedPetId === pet.id 
                              ? 'bg-purple-600 text-white border-purple-600' 
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <img 
                            src={getPetPhotoUrl(pet)} 
                            alt={pet.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium">{pet.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handlePetSelect('manual')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          selectedPetId === 'manual' 
                            ? 'bg-gray-600 text-white border-gray-600' 
                            : 'bg-white text-gray-500 border-dashed border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Other Pet</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Info about where data comes from - only show if no pet selector */}
                {registeredPets.length === 0 && (formData.petName || formData.petBreed) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p>Pet details loaded from your previous order. <button 
                        type="button"
                        className="underline hover:text-blue-900 font-medium"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, petName: '', petBreed: '', petAge: '' }));
                        }}
                      >Clear pet details</button> if ordering for a different pet.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="petName">Pet&apos;s Name {cartAnalysis.hasBakeryItems ? '*' : ''}</Label>
                    <Input

                      id="petName"
                      name="petName"
                      value={formData.petName}
                      onChange={handleInputChange}
                      placeholder="e.g., Bruno"
                      className={formErrors.petName ? 'border-red-500' : ''}
                      data-testid="checkout-pet-name"
                    />
                    {formErrors.petName && <p className="text-red-500 text-xs mt-1">{formErrors.petName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="petBreed">Breed</Label>
                    <BreedAutocomplete
                      id="petBreed"
                      name="petBreed"
                      value={formData.petBreed}
                      onChange={handleInputChange}
                      placeholder="e.g., Golden Retriever"
                      data-testid="checkout-pet-breed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petAge">Age</Label>
                    <Input
                      id="petAge"
                      name="petAge"
                      value={formData.petAge}
                      onChange={handleInputChange}
                      placeholder="e.g., 3 years"
                    />
                  </div>
                </div>
                
                {/* Pet Soul Insights Card */}
                {loadingPetSoul && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Looking up {formData.petName}&apos;s profile...</span>
                  </div>
                )}
                
                {petSoulInsights && (
                  <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">We know {petSoulInsights.pet?.name}! 🐾</h3>
                        <p className="text-xs text-purple-600">Soul Score: {Math.round(petSoulInsights.scores?.overall || 0)}% complete</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Allergies Warning */}
                      {petSoulInsights.insights?.key_flags?.has_allergies && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span><strong>Allergies:</strong> {petSoulInsights.insights.key_flags.allergy_list?.join(', ') || 'Yes'}</span>
                        </div>
                      )}
                      
                      {/* Sensitive Stomach */}
                      {petSoulInsights.insights?.key_flags?.has_sensitive_stomach && (
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 rounded-lg px-3 py-2 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span><strong>Note:</strong> {petSoulInsights.pet?.name} has a sensitive stomach</span>
                        </div>
                      )}
                      
                      {/* Favorite Treats */}
                      {petSoulInsights.answers?.favorite_treats && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-sm">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span><strong>Loves:</strong> {Array.isArray(petSoulInsights.answers.favorite_treats) ? petSoulInsights.answers.favorite_treats.join(', ') : petSoulInsights.answers.favorite_treats}</span>
                        </div>
                      )}
                      
                      {/* Diet Type */}
                      {petSoulInsights.answers?.diet_type && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-sm">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span><strong>Diet:</strong> {petSoulInsights.answers.diet_type}</span>
                        </div>
                      )}
                      
                      {/* Birthday Coming Up */}
                      {petSoulInsights.pet?.birth_date && (() => {
                        const bday = new Date(petSoulInsights.pet.birth_date);
                        const today = new Date();
                        bday.setFullYear(today.getFullYear());
                        if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                        const daysUntil = Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
                        if (daysUntil <= 30) {
                          return (
                            <div className="flex items-center gap-2 bg-pink-50 text-pink-700 rounded-lg px-3 py-2 text-sm">
                              <Gift className="w-4 h-4 flex-shrink-0" />
                              <span><strong>Birthday in {daysUntil} days!</strong> Make it special 🎂</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    <p className="text-xs text-purple-500 mt-3 text-center">
                      We&apos;ll use this to make sure your order is perfect for {petSoulInsights.pet?.name}
                    </p>
                  </div>
                )}
                
                {/* Breed-Specific Product Recommendations */}
                {breedProducts.length > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <PawPrint className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Perfect for {formData.petBreed}! 🐕</h3>
                        <p className="text-xs text-blue-600">Products specially made for this breed</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {breedProducts.slice(0, 4).map((product, idx) => (
                        <div 
                          key={product.id || idx}
                          className="bg-white rounded-lg p-2 flex items-center gap-2 hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/cakes?product=${product.id}`)}
                          >
                            {(product.image || product.images?.[0]) ? (
                              <img 
                                src={product.image || product.images[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p 
                              className="text-xs font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-blue-600"
                              onClick={() => navigate(`/cakes?product=${product.id}`)}
                            >
                              {product.name}
                            </p>
                            <p className="text-xs text-blue-600 font-semibold">₹{product.price}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.image || product.images?.[0] || '',
                                  quantity: 1,
                                  category: product.category
                                });
                                toast({
                                  title: "Added to cart! 🛒",
                                  description: `${product.name} added`,
                                });
                              }}
                              className="mt-1 px-2 py-0.5 text-[10px] font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"
                              data-testid={`add-breed-product-${idx}`}
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 text-xs"
                      onClick={() => navigate(`/cakes?breed=${encodeURIComponent(formData.petBreed)}`)}
                    >
                      View all products for {formData.petBreed}
                    </Button>
                  </div>
                )}
                
                {loadingBreedProducts && formData.petBreed && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finding products for {formData.petBreed}...</span>
                  </div>
                )}
              </Card>

              {/* Store Pickup Section removed - delivery only */}

              {/* Mixed Cart - Bakery Pickup + Delivery Address */}
              {cartAnalysis.isMixedCart && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-600" />
                    Bakery Items Pickup Location *
                  </h2>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Select where to pick up your fresh cakes and bakery items:
                  </p>
                  
                  <div className="grid gap-3">
                    {appSettings.store_locations.map((loc) => (
                      <div 
                        key={loc.id}
                        className={`p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
                          pickupLocation === loc.id 
                            ? 'border-purple-600 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => {
                          setPickupLocation(loc.id);
                        }}
                        data-testid={`pickup-location-${loc.id}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          pickupLocation === loc.id ? 'border-purple-600' : 'border-gray-300'
                        }`}>
                          {pickupLocation === loc.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{loc.city}</p>
                          <p className="text-sm text-gray-500">{loc.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formErrors.pickupLocation && <p className="text-red-500 text-xs mt-2">{formErrors.pickupLocation}</p>}
                </Card>
              )}

              {/* Delivery Address Section - Show for ALL cart types when delivery is selected */}
              {(deliveryMethod === 'delivery' || cartAnalysis.isMixedCart) && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    {cartAnalysis.isMixedCart ? 'Delivery Address (For Shippable Items) *' : 'Delivery Address *'}
                  </h2>

                  {/* Delivery Info Banner */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <Truck className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Free Delivery on orders above ₹3000!</p>
                        <p className="text-sm text-green-600">We deliver fresh treats across India 🇮🇳</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery address form (for delivery method or mixed carts) */}
                  {(deliveryMethod === 'delivery' || cartAnalysis.isMixedCart) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      
                      {/* Pan-India Toggle */}
                      {appSettings.pan_india_shipping && (
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" />
                            <div>
                              <p className="font-medium text-sm text-indigo-900">Pan-India Shipping</p>
                              <p className="text-xs text-indigo-600">Ship to any city across India</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePanIndiaToggle(!isPanIndiaDelivery)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              isPanIndiaDelivery ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                            data-testid="pan-india-toggle"
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              isPanIndiaDelivery ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="House/Flat No., Building Name, Street"
                          className={formErrors.address ? 'border-red-500' : ''}
                          data-testid="checkout-address"
                        />
                        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                      </div>
                      <div>
                        <Label htmlFor="landmark">Landmark</Label>
                        <Input
                          id="landmark"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleInputChange}
                          placeholder="Near any famous place"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          {isPanIndiaDelivery ? (
                            /* Pan-India: Free text input */
                            <>
                              <Input
                                id="customCity"
                                name="customCity"
                                value={formData.customCity}
                                onChange={handleInputChange}
                                placeholder="Enter any city in India"
                                className={formErrors.customCity ? 'border-red-500' : ''}
                                data-testid="checkout-custom-city"
                              />
                              {formErrors.customCity && <p className="text-red-500 text-xs mt-1">{formErrors.customCity}</p>}
                            </>
                          ) : (
                            /* Standard: Dropdown for service cities with "Others" option */
                            <div className="space-y-2">
                              <select
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={(e) => {
                                  handleInputChange(e);
                                  // Clear custom city when selecting from dropdown (unless Others)
                                  if (e.target.value !== 'Others') {
                                    setFormData(prev => ({ ...prev, customCity: '' }));
                                  }
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                                data-testid="checkout-city"
                              >
                                {appSettings.pickup_cities.map(city => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                                <option value="Delhi">Delhi NCR</option>
                                <option value="Others">Others (Type your city)</option>
                              </select>
                              {formData.city === 'Others' && (
                                <Input
                                  id="customCity"
                                  name="customCity"
                                  value={formData.customCity}
                                  onChange={handleInputChange}
                                  placeholder="Enter your city name"
                                  className={formErrors.customCity ? 'border-red-500' : ''}
                                  data-testid="checkout-other-city-input"
                                />
                              )}
                              {formErrors.customCity && formData.city === 'Others' && (
                                <p className="text-red-500 text-xs">{formErrors.customCity}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleInputChange}
                            placeholder="6-digit pincode"
                            className={formErrors.pincode ? 'border-red-500' : ''}
                            data-testid="checkout-pincode"
                          />
                          {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Delivery Preferences (Date/Time) */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {deliveryMethod === 'pickup' && !cartAnalysis.isMixedCart ? 'Pickup' : 'Delivery'} Preferences
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryDate">Preferred Date</Label>
                    <Input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryTime">Preferred Time Slot</Label>
                    <select
                      id="deliveryTime"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Special Instructions */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  Special Instructions & Gift Options
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions / Notes</Label>
                    <Textarea
                      id="specialInstructions"
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      placeholder="Any allergies, specific decorations, instructions, etc."
                      rows={3}
                      data-testid="checkout-instructions"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isGift"
                      name="isGift"
                      checked={formData.isGift}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <Label htmlFor="isGift" className="cursor-pointer">This is a gift 🎁</Label>
                  </div>
                  
                  {formData.isGift && (
                    <div>
                      <Label htmlFor="giftMessage">Gift Message</Label>
                      <Textarea
                        id="giftMessage"
                        name="giftMessage"
                        value={formData.giftMessage}
                        onChange={handleInputChange}
                        placeholder="Write a message for the recipient..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Order Summary */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.selectedSize} • {item.selectedFlavor}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {cartAnalysis.isMixedCart ? 'Shipping' : deliveryMethod === 'pickup' ? 'Store Pickup' : 'Delivery'}
                      </span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-medium">FREE! 🎉</span>
                      ) : (
                        <span>₹{deliveryFee}</span>
                      )}
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {appliedDiscount.code}
                        </span>
                        <span>-₹{appliedDiscount.discount_amount}</span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {pointsToRedeem} points
                        </span>
                        <span>-₹{loyaltyDiscount}</span>
                      </div>
                    )}
                    {deliveryMethod === 'delivery' && subtotal < appSettings.free_shipping_threshold && !cartAnalysis.bakeryOnlyCart && (
                      <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        Add ₹{appSettings.free_shipping_threshold - subtotal} more for FREE delivery!
                      </p>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-purple-600">₹{Math.max(0, subtotal - (appliedDiscount?.discount_amount || 0) - loyaltyDiscount) + deliveryFee}</span>
                    </div>
                    <p className="text-xs text-gray-500">*GST applicable on final invoice</p>
                  </div>
                </Card>

                {/* Discount Code */}
                <Card className="p-6" data-testid="discount-code-section">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600" />
                    Discount Code
                  </h3>
                  {appliedDiscount ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-700">{appliedDiscount.code}</p>
                          <p className="text-xs text-green-600">{appliedDiscount.description || `${appliedDiscount.type === 'percentage' ? appliedDiscount.value + '%' : '₹' + appliedDiscount.value} off`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-700 font-bold">-₹{appliedDiscount.discount_amount}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={removeDiscount}
                            data-testid="remove-discount-btn"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        data-testid="discount-code-input"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handleApplyDiscount}
                        disabled={isValidatingCode || !discountCode.trim()}
                        data-testid="apply-discount-btn"
                      >
                        {isValidatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Try: COMEBACK10 for 10% off</p>
                </Card>

                {/* Loyalty Points */}
                <Card className="p-6" data-testid="loyalty-points-section">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Pawsome Points
                  </h3>
                  {isLoadingLoyalty ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    </div>
                  ) : loyaltyBalance && loyaltyBalance.points > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Available Points</span>
                          <span className="font-bold text-yellow-700">{loyaltyBalance.points.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">Worth up to ₹{(loyaltyBalance.points * 0.5).toFixed(0)} in savings</p>
                      </div>
                      
                      {pointsToRedeem > 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-green-700">Redeeming {pointsToRedeem} points</p>
                              <p className="text-xs text-green-600">Saving ₹{loyaltyDiscount}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={clearLoyaltyRedemption}
                              data-testid="clear-loyalty-btn"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Points to redeem"
                              min={100}
                              max={loyaltyBalance.points}
                              value={pointsToRedeem || ''}
                              onChange={(e) => handleRedeemPoints(parseInt(e.target.value) || 0)}
                              className="flex-1"
                              data-testid="loyalty-points-input"
                            />
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={() => handleRedeemPoints(loyaltyBalance.points)}
                              data-testid="use-all-points-btn"
                            >
                              Use All
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">Min 100 points. 1 point = ₹0.50</p>
                        </div>
                      )}
                    </div>
                  ) : formData.email ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No points yet</p>
                      <p className="text-xs text-gray-400 mt-1">Earn 1 point for every ₹10 spent!</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Enter your email to check points</p>
                      <p className="text-xs text-gray-400 mt-1">Already a customer? You might have points!</p>
                    </div>
                  )}
                </Card>

                {/* Mira's Recommended Add-ons */}
                <Card className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Mira's Picks</h3>
                      <p className="text-xs text-gray-500">Perfect add-ons for {formData.petName || 'your pup'}!</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {addOns.map(addOn => (
                      <div 
                        key={addOn.id} 
                        className="flex flex-col items-center p-3 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors"
                      >
                        <img src={addOn.image} alt={addOn.name} className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-lg mb-2" />
                        <p className="text-xs md:text-sm font-medium text-center line-clamp-1">{addOn.name}</p>
                        <p className="text-xs text-purple-600 font-semibold">₹{addOn.price}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddOn(addOn)}
                          className="mt-2 h-7 text-xs w-full border-purple-300 text-purple-600 hover:bg-purple-100"
                          data-testid={`addon-${addOn.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Place Order Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg"
                  disabled={isSubmitting}
                  data-testid="place-order-btn"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Place Order via WhatsApp
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-gray-500">
                  By placing this order, you agree to our terms and conditions.
                </p>
                <p className="text-xs text-center text-purple-600 font-medium mt-1">
                  💳 Payment link will be sent on WhatsApp after confirmation
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
