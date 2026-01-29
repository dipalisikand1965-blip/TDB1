/**
 * UnifiedCheckout - Amazon-like checkout experience with Razorpay
 * Features:
 * - GST calculation (18%)
 * - Multiple payment methods via Razorpay
 * - PDF invoice generation
 * - Order confirmation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import {
  ArrowLeft, CreditCard, Truck, MapPin, Phone, CheckCircle,
  User, Mail, PawPrint, Gift, Sparkles, Crown, AlertCircle,
  Loader2, Shield, FileText, Download, Store, ChevronRight,
  ChevronDown, ChevronUp, Package, Plus
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Indian States for GST calculation
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Chandigarh'
];

// Store locations for pickup
const STORE_LOCATIONS = [
  { id: 'bangalore', city: 'Bangalore', address: '147, 8th Main Rd, 3rd Block, Koramangala, Bengaluru 560034' },
  { id: 'mumbai', city: 'Mumbai', address: 'Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai 400061' },
  { id: 'gurugram', city: 'Gurugram', address: 'Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram 122003' }
];

const UnifiedCheckout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Checkout steps
  const [currentStep, setCurrentStep] = useState(1); // 1: Review, 2: Delivery, 3: Payment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Config from backend
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form state
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: ''
  });

  const [delivery, setDelivery] = useState({
    method: 'delivery',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    landmark: '',
    pickupLocation: ''
  });

  const [orderInfo, setOrderInfo] = useState({
    petName: '',
    petBreed: '',
    discountCode: '',
    discountAmount: 0,
    specialInstructions: '',
    isGift: false,
    giftMessage: ''
  });

  // GST calculation
  const [gstDetails, setGstDetails] = useState(null);
  const [calculatingGst, setCalculatingGst] = useState(false);
  
  // Smart Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Sections collapsed state
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    customer: true,
    delivery: true,
    payment: true
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch checkout config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/checkout/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to fetch checkout config:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);
  
  // Fetch smart recommendations based on cart items AND user's pet profile (Mira-powered)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cartItems.length === 0) return;
      setLoadingRecommendations(true);
      try {
        const categories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
        const cartIds = cartItems.map(item => item.id).join(',');
        
        // Use Mira-powered personalized endpoint if user is logged in
        let endpoint = `${API_URL}/api/products/recommendations?categories=${categories.join(',')}&limit=6&exclude_ids=${cartIds}`;
        
        // If user is logged in, use personalized recommendations
        if (user?.id) {
          endpoint = `${API_URL}/api/products/recommendations/personalized?user_id=${user.id}&categories=${categories.join(',')}&limit=6&exclude_ids=${cartIds}`;
        }
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setRecommendations((data.products || []).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [cartItems, user]);

  // Calculate shipping fee
  const shippingFee = useMemo(() => {
    if (delivery.method === 'pickup') return 0;
    const subtotal = getCartTotal();
    const threshold = config?.free_shipping_threshold || 3000;
    const defaultFee = config?.default_shipping_fee || 150;
    return subtotal >= threshold ? 0 : defaultFee;
  }, [delivery.method, getCartTotal, config]);

  // Calculate totals with GST
  useEffect(() => {
    const calculateTotals = async () => {
      const subtotal = getCartTotal();
      if (subtotal === 0) return;

      setCalculatingGst(true);
      try {
        const res = await fetch(`${API_URL}/api/checkout/calculate-total`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer,
            delivery: {
              method: delivery.method,
              address: delivery.address,
              city: delivery.city,
              state: delivery.state,
              pincode: delivery.pincode
            },
            items: cartItems.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.selectedSize,
              flavor: item.selectedFlavor,
              category: item.category
            })),
            subtotal,
            shipping_fee: shippingFee,
            discount_amount: orderInfo.discountAmount
          })
        });

        if (res.ok) {
          const data = await res.json();
          setGstDetails(data);
        }
      } catch (err) {
        console.error('Failed to calculate GST:', err);
      } finally {
        setCalculatingGst(false);
      }
    };

    // Debounce calculation
    const timeout = setTimeout(calculateTotals, 500);
    return () => clearTimeout(timeout);
  }, [cartItems, delivery.state, shippingFee, orderInfo.discountAmount, getCartTotal, customer, delivery]);

  // Validate discount code
  const validateDiscount = async () => {
    if (!orderInfo.discountCode) return;

    try {
      const subtotal = getCartTotal();
      const res = await fetch(
        `${API_URL}/api/checkout/discount/validate?code=${orderInfo.discountCode}&subtotal=${subtotal}`
      );

      if (res.ok) {
        const data = await res.json();
        setOrderInfo(prev => ({
          ...prev,
          discountAmount: data.discount_amount
        }));
        toast({ title: 'Discount Applied!', description: `You saved ₹${data.discount_amount}` });
      } else {
        const error = await res.json();
        toast({ title: 'Invalid Code', description: error.detail, variant: 'destructive' });
        setOrderInfo(prev => ({ ...prev, discountAmount: 0 }));
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to validate code', variant: 'destructive' });
    }
  };

  // Handle Razorpay payment
  const initiatePayment = async () => {
    setIsSubmitting(true);

    try {
      // Create order
      const orderRes = await fetch(`${API_URL}/api/checkout/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          delivery: {
            method: delivery.method,
            address: delivery.address,
            city: delivery.city,
            state: delivery.state,
            pincode: delivery.pincode,
            landmark: delivery.landmark
          },
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.selectedSize,
            flavor: item.selectedFlavor,
            category: item.category
          })),
          pet_name: orderInfo.petName,
          pet_breed: orderInfo.petBreed,
          subtotal: getCartTotal(),
          shipping_fee: shippingFee,
          discount_amount: orderInfo.discountAmount,
          discount_code: orderInfo.discountCode,
          special_instructions: orderInfo.specialInstructions,
          is_gift: orderInfo.isGift,
          gift_message: orderInfo.giftMessage
        })
      });

      // Handle non-OK response
      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        let errorMessage = 'Failed to create order';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const orderData = await orderRes.json();

      // If Razorpay not enabled, show WhatsApp flow
      if (orderData.fallback_to_whatsapp) {
        setOrderDetails({
          ...orderData,
          whatsappFlow: true
        });
        setOrderComplete(true);
        clearCart();
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Doggy Company',
        description: `Order ${orderData.order_id}`,
        order_id: orderData.razorpay_order_id,
        prefill: orderData.prefill,
        theme: { color: '#7c3aed' },
        handler: async (response) => {
          await verifyPayment(response, orderData.order_id);
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            toast({ title: 'Payment Cancelled', description: 'You can try again', variant: 'destructive' });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  // Verify payment
  const verifyPayment = async (razorpayResponse, orderId) => {
    try {
      const res = await fetch(`${API_URL}/api/checkout/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          order_id: orderId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOrderDetails({
          order_id: orderId,
          payment_id: razorpayResponse.razorpay_payment_id,
          ...data,
          gst_details: gstDetails
        });
        setOrderComplete(true);
        clearCart();
        toast({ title: 'Payment Successful!', description: `Order ${orderId} confirmed` });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err) {
      toast({ title: 'Verification Failed', description: 'Please contact support', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate current step
  const validateStep = (step) => {
    if (step === 1) {
      return cartItems.length > 0;
    }
    if (step === 2) {
      if (!customer.name || !customer.email || !customer.phone) {
        toast({ title: 'Missing Details', description: 'Please fill all required fields', variant: 'destructive' });
        return false;
      }
      if (delivery.method === 'delivery') {
        if (!delivery.address || !delivery.city || !delivery.pincode) {
          toast({ title: 'Missing Address', description: 'Please complete delivery address', variant: 'destructive' });
          return false;
        }
      } else if (!delivery.pickupLocation) {
        toast({ title: 'Select Store', description: 'Please select a pickup location', variant: 'destructive' });
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Order completion screen
  if (orderComplete && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 md:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-6 md:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed! 🎉
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Order ID: <span className="font-mono font-bold text-purple-600">{orderDetails.order_id}</span>
            </p>

            {/* GST Summary */}
            {orderDetails.gst_details && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Invoice Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{orderDetails.gst_details.subtotal?.toFixed(2)}</span>
                  </div>
                  {orderDetails.gst_details.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{orderDetails.gst_details.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Amount</span>
                    <span>₹{orderDetails.gst_details.taxable_amount?.toFixed(2)}</span>
                  </div>
                  {orderDetails.gst_details.gst_details?.is_same_state ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">CGST (9%)</span>
                        <span>₹{orderDetails.gst_details.gst_details?.cgst_amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">SGST (9%)</span>
                        <span>₹{orderDetails.gst_details.gst_details?.sgst_amount?.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">IGST (18%)</span>
                      <span>₹{orderDetails.gst_details.gst_details?.igst_amount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{orderDetails.gst_details.shipping === 0 ? 'FREE' : `₹${orderDetails.gst_details.shipping?.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-purple-700">
                    <span>Total Paid</span>
                    <span>₹{orderDetails.gst_details.grand_total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Download Invoice Button */}
            <Button
              onClick={() => window.open(`${API_URL}/api/checkout/order/${orderDetails.order_id}/invoice`, '_blank')}
              variant="outline"
              className="mb-4 w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice (PDF)
            </Button>

            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to your email address.
            </p>

            <Button onClick={() => navigate('/')} className="w-full bg-purple-600 hover:bg-purple-700">
              Continue Shopping
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto text-center px-4">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some treats for your furry friend!</p>
          <Button onClick={() => navigate('/cakes')} className="bg-purple-600 hover:bg-purple-700">
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Secure Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step, idx) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  currentStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {idx < 2 && (
                <div className={`w-16 md:w-24 h-1 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Step 1: Review Items */}
            {currentStep === 1 && (
              <Card className="p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Review Your Order ({cartItems.length} items)
                </h2>
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PawPrint className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedFlavor && ` • Flavor: ${item.selectedFlavor}`}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pet Details (optional) */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-purple-600" />
                    Pet Details (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="petName" className="text-xs">Pet&apos;s Name</Label>
                      <Input
                        id="petName"
                        placeholder="e.g., Bruno"
                        value={orderInfo.petName}
                        onChange={(e) => setOrderInfo(prev => ({ ...prev, petName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="petBreed" className="text-xs">Breed</Label>
                      <Input
                        id="petBreed"
                        placeholder="e.g., Labrador"
                        value={orderInfo.petBreed}
                        onChange={(e) => setOrderInfo(prev => ({ ...prev, petBreed: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Smart Recommendations / Add-ons */}
                {recommendations.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Frequently Bought Together
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="flex items-center gap-3 p-3 border rounded-lg hover:border-purple-300 transition-colors">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {rec.image ? (
                              <img src={rec.image} alt={rec.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 m-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{rec.name}</p>
                            <p className="text-sm text-purple-600 font-semibold">₹{rec.price}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => addToCart({ ...rec, quantity: 1 })}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={nextStep} className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
                  Continue to Delivery <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            )}

            {/* Step 2: Customer & Delivery */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Customer Details */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Your Details
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={customer.name}
                        onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                        data-testid="checkout-customer-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        data-testid="checkout-customer-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={customer.phone}
                        onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="10-digit mobile number"
                        data-testid="checkout-customer-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp (for updates)</Label>
                      <Input
                        id="whatsapp"
                        value={customer.whatsapp}
                        onChange={(e) => setCustomer(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="Same as phone if empty"
                      />
                    </div>
                  </div>
                </Card>

                {/* Delivery Method */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    Delivery
                  </h2>

                  {/* Delivery Info Banner */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 text-sm">
                          {subtotal >= (config?.free_shipping_threshold || 3000) 
                            ? 'Free Delivery! 🎉' 
                            : `Add ₹${(config?.free_shipping_threshold || 3000) - subtotal} for FREE delivery`}
                        </p>
                        <p className="text-xs text-green-600">We deliver across India with love 🇮🇳</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Form */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={delivery.address}
                        onChange={(e) => setDelivery(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="House/Flat No., Building, Street"
                        rows={2}
                        data-testid="checkout-delivery-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={delivery.city}
                          onChange={(e) => setDelivery(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          data-testid="checkout-delivery-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={delivery.pincode}
                          onChange={(e) => setDelivery(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="6-digit pincode"
                          data-testid="checkout-delivery-pincode"
                        />
                      </div>
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <select
                            id="state"
                            value={delivery.state}
                            onChange={(e) => setDelivery(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                            data-testid="checkout-delivery-state"
                          >
                            {INDIAN_STATES.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="landmark">Landmark</Label>
                          <Input
                            id="landmark"
                            value={delivery.landmark}
                            onChange={(e) => setDelivery(prev => ({ ...prev, landmark: e.target.value }))}
                            placeholder="Near..."
                          />
                        </div>
                      </div>
                    </div>
                </Card>

                {/* Navigation */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    Continue to Payment <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Gift Option */}
                <Card className="p-4 md:p-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderInfo.isGift}
                      onChange={(e) => setOrderInfo(prev => ({ ...prev, isGift: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600"
                    />
                    <Gift className="w-5 h-5 text-pink-500" />
                    <span className="font-medium">This is a gift</span>
                  </label>

                  {orderInfo.isGift && (
                    <div className="mt-3">
                      <Label htmlFor="giftMessage">Gift Message</Label>
                      <Textarea
                        id="giftMessage"
                        value={orderInfo.giftMessage}
                        onChange={(e) => setOrderInfo(prev => ({ ...prev, giftMessage: e.target.value }))}
                        placeholder="Add a personal message..."
                        rows={2}
                      />
                    </div>
                  )}
                </Card>

                {/* Special Instructions */}
                <Card className="p-4 md:p-6">
                  <Label htmlFor="instructions" className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Special Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    value={orderInfo.specialInstructions}
                    onChange={(e) => setOrderInfo(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special requests for your order..."
                    rows={2}
                  />
                </Card>

                {/* Discount Code */}
                <Card className="p-4 md:p-6">
                  <Label className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Discount Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={orderInfo.discountCode}
                      onChange={(e) => setOrderInfo(prev => ({ ...prev, discountCode: e.target.value.toUpperCase() }))}
                      placeholder="Enter code"
                      className="flex-1"
                    />
                    <Button onClick={validateDiscount} variant="outline">Apply</Button>
                  </div>
                  {orderInfo.discountAmount > 0 && (
                    <p className="text-sm text-green-600 mt-2">✓ Discount applied: -₹{orderInfo.discountAmount}</p>
                  )}
                </Card>

                {/* Pay Button */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Payment
                  </h2>

                  {config?.razorpay_enabled ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Secured by Razorpay - 256-bit SSL encryption</span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Pay securely with UPI, Credit/Debit Card, Net Banking, or Wallets
                      </p>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={initiatePayment}
                          disabled={isSubmitting}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          data-testid="checkout-pay-button"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Pay ₹{gstDetails?.grand_total?.toFixed(2) || (subtotal + shippingFee).toFixed(2)}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Online payment is being configured. Please use WhatsApp to complete your order.</p>
                      <Button onClick={initiatePayment} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                        Continue to WhatsApp
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 md:p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Items collapsed */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('items')}
                  className="w-full flex items-center justify-between text-sm text-gray-600"
                >
                  <span>{cartItems.length} items</span>
                  {expandedSections.items ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.items && (
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate flex-1">{item.name} x{item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {orderInfo.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{orderInfo.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* GST Display */}
                {gstDetails && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxable Amount</span>
                      <span>₹{gstDetails.taxable_amount?.toFixed(2)}</span>
                    </div>
                    {gstDetails.gst_details?.is_same_state ? (
                      <>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>CGST (9%)</span>
                          <span>₹{gstDetails.gst_details?.cgst_amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>SGST (9%)</span>
                          <span>₹{gstDetails.gst_details?.sgst_amount?.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>IGST (18%)</span>
                        <span>₹{gstDetails.gst_details?.igst_amount?.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                {subtotal < (config?.free_shipping_threshold || 3000) && delivery.method === 'delivery' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Add ₹{((config?.free_shipping_threshold || 3000) - subtotal).toFixed(0)} more for FREE shipping!
                  </p>
                )}

                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-600">
                    {calculatingGst ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `₹${gstDetails?.grand_total?.toFixed(2) || (subtotal - orderInfo.discountAmount + shippingFee).toFixed(2)}`
                    )}
                  </span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  *Inclusive of 18% GST
                </p>
              </div>

              {/* Secure payment badge */}
              <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>100% Secure Payment</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckout;
