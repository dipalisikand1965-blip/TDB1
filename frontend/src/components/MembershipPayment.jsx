import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Crown, Check, Sparkles, Shield, PawPrint, Star,
  CreditCard, Loader2, AlertCircle
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Doggy-themed tier names
const TIER_NAMES = {
  pawsome: '🦮 Loyal Companion',
  premium: '🐕‍🦺 Trusted Guardian',
  vip: '👑 Pack Leader'
};

const PLAN_FEATURES = {
  monthly: [
    'Full access to all 12 pillars',
    'Mira AI Concierge® 24/7',
    'Pet Soul™ profile',
    'Basic Paw Points (1x)',
    'Email support'
  ],
  annual: [
    'Everything in Monthly',
    '2 months FREE (save ₹198)',
    'Priority booking',
    '1.5x Paw Points',
    'Priority support'
  ],
  premium_annual: [
    'Everything in Annual',
    'Personal concierge assigned',
    '2x Paw Points',
    'Early access to features',
    'Exclusive events access',
    'Phone support'
  ],
  vip_annual: [
    'Everything in Premium',
    'Dedicated Pack Leader concierge',
    '3x Paw Points',
    'VIP event invitations',
    'Free same-day delivery',
    'Complimentary birthday cake',
    '24/7 phone support'
  ]
};

const MembershipPayment = ({ userEmail, userName, userPhone, onSuccess, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    fetchPlans();
    // Load Razorpay script
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const handlePayment = async () => {
    if (!userEmail) {
      setError('Please sign in to purchase a membership');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          user_email: userEmail,
          user_name: userName,
          user_phone: userPhone
        })
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.detail || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Doggy Company',
        description: orderData.plan_name,
        order_id: orderData.order_id,
        prefill: orderData.prefill,
        theme: {
          color: '#7c3aed'
        },
        handler: async (response) => {
          await verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const verifyPayment = async (razorpayResponse) => {
    try {
      const response = await fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          user_email: userEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus('success');
        if (onSuccess) {
          onSuccess(data.membership);
        }
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Payment verification failed');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Payment verification failed. Please contact support.');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const getPlanById = (planId) => plans.find(p => p.id === planId);

  if (paymentStatus === 'success') {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Pack!</h2>
        <p className="text-gray-600 mb-6">
          Your membership has been activated. You now have access to all 12 pillars and Mira AI Concierge®!
        </p>
        <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
          Start Exploring
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="membership-payment">
      {/* Plan Selection */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'monthly', name: 'Monthly', price: '₹99', period: '/month', popular: false },
          { id: 'annual', name: 'Annual', price: '₹999', period: '/year', popular: true, badge: 'Save ₹189' },
          { id: 'premium_annual', name: 'Premium', price: '₹1,999', period: '/year', popular: false },
          { id: 'vip_annual', name: 'VIP Pack Leader', price: '₹4,999', period: '/year', popular: false, badge: 'Best Value' }
        ].map((plan) => (
          <Card 
            key={plan.id}
            className={`p-4 cursor-pointer transition-all relative ${
              selectedPlan === plan.id 
                ? 'border-2 border-purple-500 bg-purple-50' 
                : 'border-2 border-transparent hover:border-purple-200'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600">
                Most Popular
              </Badge>
            )}
            {plan.badge && !plan.popular && (
              <Badge className="absolute -top-2 -right-2 bg-amber-500">
                {plan.badge}
              </Badge>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPlan === plan.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="font-semibold">{plan.name}</span>
            </div>
            
            <div className="mt-2">
              <span className="text-2xl font-bold">{plan.price}</span>
              <span className="text-gray-500 text-sm">{plan.period}</span>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              {TIER_NAMES[getPlanById(plan.id)?.tier] || '🦮 Loyal Companion'}
            </div>
          </Card>
        ))}
      </div>

      {/* Features List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          What's Included
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {(PLAN_FEATURES[selectedPlan] || []).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay {plans.find(p => p.id === selectedPlan)?.amount ? `₹${plans.find(p => p.id === selectedPlan).amount}` : ''}
            </>
          )}
        </Button>
        
        {onClose && (
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secured by Razorpay • 256-bit SSL encryption</span>
      </div>
    </div>
  );
};

export default MembershipPayment;
