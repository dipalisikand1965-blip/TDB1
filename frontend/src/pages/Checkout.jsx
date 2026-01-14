import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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
  Crown, AlertCircle, Tag, Star, Loader2, X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919663185747';
const BUSINESS_EMAIL = process.env.REACT_APP_BUSINESS_EMAIL || 'woof@thedoggybakery.in';
const FREE_SHIPPING_THRESHOLD = 3000;
const SHIPPING_FEE = 150;

const addOns = [
  { id: 'ao-1', name: 'Birthday Bandana', price: 299, image: 'https://thedoggybakery.com/cdn/shop/products/WhatsAppImage2022-05-13at3.24.11PM.jpg?v=1655357921&width=100' },
  { id: 'ao-2', name: 'Party Hat', price: 199, image: 'https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7.jpg?v=1759129448&width=100' },
  { id: 'ao-3', name: 'Paw Balm', price: 350, image: 'https://thedoggybakery.com/cdn/shop/files/TDB_cakes_28.png?v=1738050579&width=100' },
  { id: 'ao-4', name: 'Treat Pack (100g)', price: 150, image: 'https://thedoggybakery.com/cdn/shop/products/IMG-8036.png?v=1680145248&width=100' }
];

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, addToCart, markCartConverted, captureEmail } = useCart();
  const navigate = useNavigate();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Discount & Loyalty State
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(false);
  
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
      const res = await fetch(`${API_URL}/api/discount-codes/validate?code=${encodeURIComponent(discountCode)}&order_total=${subtotal}`);
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

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.parentName.trim()) errors.parentName = 'Parent name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp number is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';
    
    // Pet name is MANDATORY for cakes (goes on the cake!)
    const hasCake = cartItems.some(item => 
      item.category?.includes('cake') || 
      item.name?.toLowerCase().includes('cake')
    );
    if (hasCake && !formData.petName.trim()) {
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
    return Object.keys(errors).length === 0;
  };

  const handleAddOn = (addOn) => {
    addToCart({
      ...addOn,
      description: 'Quick add-on item'
    }, 'Standard', 'Standard');
    toast({ title: "Added!", description: `${addOn.name} added to order.` });
  };

  // Generate order summary for WhatsApp
  const generateWhatsAppMessage = (orderData) => {
    const subtotal = getCartTotal();
    const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + deliveryFee;
    
    return `🐕 *NEW ORDER - The Doggy Bakery*

📋 *Order ID:* ${orderData.orderId}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

👤 *PET PARENT DETAILS:*
• Name: ${formData.parentName}
• Phone: ${formData.phone}
• WhatsApp: ${formData.whatsappNumber}
• Email: ${formData.email || 'Not provided'}

🐾 *PET DETAILS:*
• Pet Name: *${formData.petName || 'Not specified'}* ${formData.petName ? '(FOR CAKE)' : ''}
• Breed: ${formData.petBreed || 'Not specified'}
• Age: ${formData.petAge || 'Not specified'}

📍 *DELIVERY ADDRESS:*
${formData.address}
${formData.landmark ? `Landmark: ${formData.landmark}` : ''}
${formData.city} - ${formData.pincode}

📦 *ORDER ITEMS:*
${cartItems.map(item => `
• *${item.name}*
  Size: ${item.selectedSize} | Flavor: ${item.selectedFlavor}
  Qty: ${item.quantity} | Price: ₹${item.price * item.quantity}
  ${item.customDetails?.petName ? `Pet: ${item.customDetails.petName}` : ''}
  ${item.customDetails?.date ? `Del Date: ${new Date(item.customDetails.date).toDateString()}` : ''}`).join('')}

🚚 *DELIVERY:*
• Date: ${formData.deliveryDate ? new Date(formData.deliveryDate).toDateString() : 'ASAP'}
• Time: ${formData.deliveryTime === 'morning' ? '9AM-12PM' : formData.deliveryTime === 'afternoon' ? '12PM-4PM' : '4PM-8PM'}

${formData.specialInstructions ? `📝 *SPECIAL INSTRUCTIONS:*\n${formData.specialInstructions}\n` : ''}
${formData.isGift ? `🎁 *GIFT MESSAGE:*\n${formData.giftMessage || 'No message'}\n` : ''}

💰 *PAYMENT SUMMARY:*
Subtotal: ₹${subtotal}
Delivery: ${deliveryFee === 0 ? 'FREE! 🎉' : `₹${deliveryFee}`}
${orderData.discountCode ? `Discount (${orderData.discountCode}): -₹${orderData.discountAmount}` : ''}
${orderData.loyaltyPointsUsed ? `Loyalty Points (${orderData.loyaltyPointsUsed} pts): -₹${orderData.loyaltyDiscount}` : ''}
*TOTAL: ₹${orderData.finalTotal}*

_GST applicable on final invoice_

✅ *Please confirm this order and send me the payment link to proceed.*`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Please fill required fields',
        description: 'Some required information is missing.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const subtotal = getCartTotal();
    const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const discountAmount = appliedDiscount?.discount_amount || 0;
    const totalBeforeDelivery = subtotal - discountAmount - loyaltyDiscount;
    const total = Math.max(0, totalBeforeDelivery) + deliveryFee;
    const orderId = `TDB-${Date.now().toString(36).toUpperCase()}`;
    
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
          address: formData.address,
          landmark: formData.landmark,
          city: formData.city,
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
          customDetails: item.customDetails
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
        paymentStatus: 'unpaid'
      };
      
      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

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
      loyaltyDiscount
    });
    
    // Show order placed
    setIsOrderPlaced(true);
    setIsSubmitting(false);
    
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
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.quantity}</span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
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
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + deliveryFee;
  const hasCake = cartItems.some(item => 
    item.category?.includes('cake') || item.name?.toLowerCase().includes('cake')
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

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
              </Card>

              {/* Pet Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                  Pet Details
                  {hasCake && <Badge variant="destructive" className="ml-2">Required for Cake</Badge>}
                </h2>
                
                {hasCake && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>Pet's name is mandatory!</strong> We write it on the cake to make it extra special 🎂
                    </p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="petName">Pet's Name {hasCake ? '*' : ''}</Label>
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
                    <Input
                      id="petBreed"
                      name="petBreed"
                      value={formData.petBreed}
                      onChange={handleInputChange}
                      placeholder="e.g., Golden Retriever"
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
              </Card>

              {/* Delivery Address */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Delivery Address
                </h2>
                <div className="space-y-4">
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
                      <select
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg"
                        data-testid="checkout-city"
                      >
                        <option value="Bangalore">Bangalore</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Gurgaon">Gurgaon / Gurugram</option>
                        <option value="Delhi">Delhi NCR</option>
                      </select>
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
              </Card>

              {/* Delivery Preferences */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Delivery Preferences
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
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
                      placeholder="Any allergies, specific decorations, delivery instructions, etc."
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
                      <span className="text-gray-600">Delivery</span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-medium">FREE! 🎉</span>
                      ) : (
                        <span>₹{deliveryFee}</span>
                      )}
                    </div>
                    {subtotal < FREE_SHIPPING_THRESHOLD && (
                      <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        Add ₹{FREE_SHIPPING_THRESHOLD - subtotal} more for FREE delivery!
                      </p>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-purple-600">₹{total}</span>
                    </div>
                    <p className="text-xs text-gray-500">*GST applicable on final invoice</p>
                  </div>
                </Card>

                {/* Quick Add-ons */}
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Add-ons</h3>
                  <div className="space-y-2">
                    {addOns.map(addOn => (
                      <div key={addOn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img src={addOn.image} alt={addOn.name} className="w-10 h-10 object-cover rounded" />
                          <div>
                            <p className="text-sm font-medium">{addOn.name}</p>
                            <p className="text-xs text-gray-500">₹{addOn.price}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddOn(addOn)}>
                          Add
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
