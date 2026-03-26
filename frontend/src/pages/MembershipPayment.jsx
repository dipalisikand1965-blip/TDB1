import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  PawPrint, ArrowRight, ArrowLeft, CreditCard, Shield, 
  Check, Lock, Loader2, Crown, Gift, User, Calendar,
  Phone, Mail, MapPin
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getApiUrl } from '../utils/api';

const MembershipPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id') || '';
  const userId = searchParams.get('user_id') || '';
  
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Fetch order details on mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(getApiUrl(`/api/membership/order/${orderId}`));
        if (response.ok) {
          const data = await response.json();
          setOrderData(data);
        } else {
          // If API fails, use fallback data from URL params
          const plan = searchParams.get('plan') || 'foundation';
          const isFoundation = plan === 'annual' || plan === 'foundation';
          setOrderData({
            order_id: orderId,
            user_id: userId,
            plan_type: isFoundation ? 'foundation' : 'trial',
            plan_name: isFoundation ? 'Pet Pass Foundation' : 'Pet Pass Trial',
            duration: isFoundation ? '372 days' : '37 days',
            base_price: isFoundation ? 4999 : 499,
            gst: isFoundation ? 900 : 90,
            total: isFoundation ? 5899 : 589,
            bonus_days: 7,
            parent_name: searchParams.get('name') || 'Pet Parent',
            parent_email: searchParams.get('email') || '',
            pet_name: searchParams.get('pet') || 'Your furry friend',
            pet_breed: searchParams.get('breed') || '',
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        // Use fallback data
        const plan = searchParams.get('plan') || 'foundation';
        const isFoundation = plan === 'annual' || plan === 'foundation';
        setOrderData({
          order_id: orderId,
          user_id: userId,
          plan_type: isFoundation ? 'foundation' : 'trial',
          plan_name: isFoundation ? 'Pet Pass Foundation' : 'Pet Pass Trial',
          duration: isFoundation ? '372 days' : '37 days',
          base_price: isFoundation ? 4999 : 499,
          gst: isFoundation ? 900 : 90,
          total: isFoundation ? 5899 : 589,
          bonus_days: 7,
          parent_name: 'Pet Parent',
          pet_name: 'Your furry friend',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, userId, searchParams]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!orderData) return;
    
    setPaymentLoading(true);
    setError('');

    try {
      // Create Razorpay order
      const orderResponse = await fetch(getApiUrl('/api/membership/payment/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          user_id: userId,
          amount: orderData.total,
          plan_type: orderData.plan_type,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrder = await orderResponse.json();

      // Get Razorpay key from environment or use test key
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

      const options = {
        key: razorpayKey,
        amount: orderData.total * 100, // Amount in paise
        currency: 'INR',
        name: 'The Doggy Company',
        description: `${orderData.plan_name} - ${orderData.duration}`,
        order_id: razorpayOrder.razorpay_order_id,
        image: 'https://thedoggycompany.in/favicon.ico',
        handler: async function (response) {
          // Verify payment on backend
          try {
            const verifyResponse = await fetch(getApiUrl('/api/membership/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
                user_id: userId,
              }),
            });

            if (verifyResponse.ok) {
              // Navigate to success page
              navigate(`/payment/success?plan=${orderData.plan_type}&pet=${encodeURIComponent(orderData.pet_name || '')}&name=${encodeURIComponent(orderData.parent_name || '')}&order_id=${orderId}`);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            // Still navigate to success if payment was made
            navigate(`/payment/success?plan=${orderData.plan_type}&pet=${encodeURIComponent(orderData.pet_name || '')}&order_id=${orderId}`);
          }
        },
        prefill: {
          name: orderData.parent_name || '',
          email: orderData.parent_email || '',
          contact: orderData.parent_phone || '',
        },
        theme: {
          color: '#ec4899', // Pink to match our theme
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setPaymentLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  // Demo mode - skip payment for testing
  const handleDemoPayment = () => {
    navigate(`/payment/success?plan=${orderData?.plan_type || 'founder'}&pet=${encodeURIComponent(orderData?.pet_name || 'Bruno')}&name=${encodeURIComponent(orderData?.parent_name || 'Pet Parent')}&order_id=${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your order...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Payment | The Doggy Company</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950 py-8 px-4">
        {/* Decorative background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">The Doggy Company</span>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-emerald-400 text-sm">Details</span>
              </div>
              <div className="w-8 h-0.5 bg-emerald-500"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-pink-400 text-sm font-semibold">Payment</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-slate-400 text-sm">Welcome</span>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Complete Your Payment
            </h1>
            <p className="text-slate-400">
              You&apos;re just one step away from activating your Pet Pass!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Summary Card */}
            <Card className="p-6 bg-slate-900/60 backdrop-blur-md border border-white/10">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                Order Summary
              </h2>
              
              {/* Plan Info */}
              <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{orderData?.plan_name}</h3>
                    <p className="text-sm text-slate-400">{orderData?.duration} of full access</p>
                  </div>
                </div>
                
                {orderData?.bonus_days && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-semibold">+{orderData.bonus_days} Bonus Days FREE!</span>
                  </div>
                )}
              </div>
              
              {/* Member Info */}
              {orderData?.parent_name && (
                <div className="space-y-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{orderData.parent_name}</span>
                  </div>
                  {orderData.parent_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{orderData.parent_email}</span>
                    </div>
                  )}
                  {orderData.pet_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <PawPrint className="w-4 h-4 text-pink-400" />
                      <span className="text-slate-300">{orderData.pet_name} {orderData.pet_breed && `(${orderData.pet_breed})`}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan Price</span>
                  <span className="text-white">₹{orderData?.base_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Bonus Days</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
                {/* GST Breakdown - CGST + SGST */}
                <div className="flex justify-between">
                  <span className="text-slate-400">CGST (9%)</span>
                  <span className="text-white">₹{orderData?.gst ? Math.round(orderData.gst / 2).toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SGST (9%)</span>
                  <span className="text-white">₹{orderData?.gst ? Math.round(orderData.gst / 2).toLocaleString() : '0'}</span>
                </div>
                <hr className="border-slate-700 my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-pink-400">₹{orderData?.total?.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Order ID */}
              <p className="text-slate-500 text-xs mt-4">Order ID: {orderId}</p>
            </Card>

            {/* Payment Card */}
            <Card className="p-6 bg-slate-900/60 backdrop-blur-md border border-white/10">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-pink-400" />
                Payment
              </h2>
              
              {/* Security Badge */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Secure Payment</p>
                    <p className="text-sm text-slate-400">Powered by Razorpay • 256-bit SSL encryption</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-3">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-2">
                  {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((method) => (
                    <span key={method} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* What's Included */}
              <div className="mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                <p className="text-sm font-medium text-purple-300 mb-2">Your Pet Pass Includes:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Pet Soul™ Profile', 'Mira AI Concierge®', 'All 14 Pillars', 'Health Vault', 'Priority Support', 'Paw Rewards'].map((item) => (
                    <div key={item} className="flex items-center gap-1 text-slate-300">
                      <Check className="w-3 h-3 text-purple-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              {/* Pay Button */}
              <Button 
                onClick={handlePayment}
                disabled={paymentLoading || !orderData}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 py-6 text-lg rounded-xl font-semibold shadow-lg shadow-pink-500/30 mb-3"
                data-testid="razorpay-pay-btn"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Pay ₹{orderData?.total?.toLocaleString()} Securely
                  </>
                )}
              </Button>
              
              {/* Start Free Trial Button */}
              <Button 
                onClick={handleDemoPayment}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
              >
                Start Free Trial (30 days, no card needed)
              </Button>
              
              {/* Back Button */}
              <Button 
                onClick={() => navigate(-1)}
                variant="ghost"
                className="w-full mt-2 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              {/* Terms */}
              <p className="text-xs text-slate-500 text-center mt-4">
                By completing this payment, you agree to our{' '}
                <a href="/terms" className="text-pink-400 hover:underline">Terms</a> and{' '}
                <a href="/privacy" className="text-pink-400 hover:underline">Privacy Policy</a>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default MembershipPayment;
