import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { 
  Crown, 
  Star, 
  Sparkles, 
  Check, 
  Gift, 
  Percent, 
  Truck, 
  MessageCircle, 
  Calendar, 
  Heart,
  Award,
  Zap,
  Shield,
  Clock,
  Users,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';

const Membership = () => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('yearly');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleSubscribe = (plan) => {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const membershipItem = {
      id: `membership-${plan.id}-${billingCycle}`,
      name: `${plan.name} Membership (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
      price: price,
      image: 'https://thedoggybakery.com/cdn/shop/files/TDB_cakes_6_6c84dc0e-24b7-49f0-a5f9-0027610924db.png?v=1719482254&width=400',
      category: 'membership',
      description: `${plan.tagline} - ${plan.features.map(f => f.text).join(', ')}`,
      isMembership: true,
      membershipTier: plan.id,
      billingCycle: billingCycle,
    };
    
    addToCart(membershipItem, billingCycle === 'yearly' ? 'Annual' : 'Monthly', plan.name);
    
    toast({
      title: '🎉 Membership Added to Cart!',
      description: `${plan.name} ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Plan - ₹${price}`,
    });
    
    navigate('/checkout');
  };

  const plans = [
    {
      id: 'pawsome',
      name: 'Pawsome',
      tagline: 'Perfect for casual pet parents',
      icon: Star,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      monthlyPrice: 199,
      yearlyPrice: 1999,
      savings: '₹389',
      features: [
        { text: '5% discount on all orders', icon: Percent },
        { text: 'Early access to new products', icon: Sparkles },
        { text: 'Birthday reminder for your pet', icon: Calendar },
        { text: 'Basic Mira AI assistance', icon: MessageCircle },
        { text: 'Free delivery on orders above ₹999', icon: Truck },
        { text: 'Member-only treats monthly', icon: Gift },
      ],
      miraAccess: 'Basic',
      cta: 'Start Pawsome',
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'Most popular choice',
      icon: Crown,
      color: 'from-purple-600 to-pink-600',
      borderColor: 'border-purple-500/50',
      bgColor: 'bg-purple-500/10',
      monthlyPrice: 499,
      yearlyPrice: 4999,
      savings: '₹989',
      popular: true,
      features: [
        { text: '12% discount on all orders', icon: Percent },
        { text: 'Priority same-day delivery', icon: Truck },
        { text: 'Full Mira AI concierge access', icon: MessageCircle },
        { text: 'Exclusive party planning assistance', icon: Calendar },
        { text: 'Free delivery on all orders', icon: Truck },
        { text: 'Premium treats box monthly', icon: Gift },
        { text: 'Early access to limited editions', icon: Sparkles },
        { text: 'Dedicated customer support', icon: Shield },
      ],
      miraAccess: 'Full',
      cta: 'Go Premium',
    },
    {
      id: 'vip',
      name: 'VIP',
      tagline: 'The ultimate pet parent experience',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-500/10',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      savings: '₹1989',
      features: [
        { text: '20% discount on all orders', icon: Percent },
        { text: 'Express 2-hour delivery option', icon: Zap },
        { text: 'VIP Mira AI with priority queue', icon: MessageCircle },
        { text: 'Personal celebration coordinator', icon: Users },
        { text: 'Free delivery always + gift wrapping', icon: Gift },
        { text: 'Luxury treats hamper monthly', icon: Gift },
        { text: 'First access to collaborations', icon: Sparkles },
        { text: 'Complimentary custom cake annually', icon: Heart },
        { text: '24/7 VIP support line', icon: Shield },
        { text: 'Exclusive VIP events access', icon: Crown },
      ],
      miraAccess: 'VIP Priority',
      cta: 'Join VIP',
    },
  ];

  const testimonials = [
    {
      name: 'Priya S.',
      tier: 'Premium',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      quote: 'The Premium membership pays for itself! The discounts and free delivery have saved me so much. Plus, Mira helped plan Bruno\'s 5th birthday perfectly!',
      pet: 'Bruno, Golden Retriever',
    },
    {
      name: 'Rahul M.',
      tier: 'VIP',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      quote: 'VIP is worth every rupee. The personal coordinator made my twins\' joint birthday party absolutely magical. The 2-hour delivery is a lifesaver!',
      pet: 'Max & Bella, Huskies',
    },
    {
      name: 'Ananya K.',
      tier: 'Pawsome',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      quote: 'Started with Pawsome and already upgraded to Premium! The monthly treats box alone is worth the membership. My Coco goes crazy for them!',
      pet: 'Coco, Shih Tzu',
    },
  ];

  const faqs = [
    {
      q: 'Can I upgrade or downgrade my membership?',
      a: 'Absolutely! You can change your membership tier anytime. Upgrades take effect immediately, and downgrades apply at the next billing cycle.',
    },
    {
      q: 'How does the Mira AI access work?',
      a: 'Pawsome members get basic Mira assistance for product recommendations. Premium unlocks full concierge services including party planning. VIP members get priority queue with faster response times and dedicated support.',
    },
    {
      q: 'What\'s included in the monthly treats?',
      a: 'Pawsome: 2-3 sample treats. Premium: Full-size treats box worth ₹500+. VIP: Luxury hamper worth ₹1000+ with exclusive items.',
    },
    {
      q: 'Is there a commitment period?',
      a: 'Monthly plans can be cancelled anytime. Yearly plans are non-refundable but offer significant savings (up to ₹1989 for VIP!).',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Exclusive Membership Program
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Join the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Doggy Bakery Family
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Unlock exclusive discounts, priority delivery, full access to Mira AI Concierge, 
            and monthly treats delivered to your doorstep. Because your fur baby deserves VIP treatment!
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-lg mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative -mt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              const perMonth = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
              
              return (
                <Card
                  key={plan.id}
                  data-testid={`membership-card-${plan.id}`}
                  className={`relative p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    plan.popular 
                      ? 'border-2 border-purple-500 shadow-2xl shadow-purple-500/20' 
                      : `border ${plan.borderColor} shadow-lg`
                  } ${selectedPlan === plan.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className={`inline-flex p-3 rounded-xl ${plan.bgColor} mb-4`}>
                    <Icon className={`w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r ${plan.color}`} style={{color: plan.color.includes('purple') ? '#9333ea' : plan.color.includes('amber') ? '#f59e0b' : '#3b82f6'}} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">₹{perMonth}</span>
                    <span className="text-gray-500">/month</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Billed ₹{price}/year • Save {plan.savings}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${plan.bgColor}`}>
                            <FeatureIcon className="w-4 h-4" style={{color: plan.color.includes('purple') ? '#9333ea' : plan.color.includes('amber') ? '#f59e0b' : '#3b82f6'}} />
                          </div>
                          <span className="text-sm text-gray-700">{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`p-3 rounded-lg ${plan.bgColor} mb-6`}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" style={{color: plan.color.includes('purple') ? '#9333ea' : plan.color.includes('amber') ? '#f59e0b' : '#3b82f6'}} />
                      <span className="text-sm font-medium">Mira AI: {plan.miraAccess} Access</span>
                    </div>
                  </div>

                  <Button
                    data-testid={`membership-cta-${plan.id}`}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                  >
                    {plan.cta}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mira AI Highlight */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Concierge
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Meet Mira AI — Your Personal Pet Celebration Expert
              </h2>
              <p className="text-lg text-purple-100 mb-8">
                Mira isn't just a chatbot — she's your dedicated concierge for all things celebration. 
                From planning the perfect birthday party to finding the right treats for dietary needs, 
                Mira handles it all with the sophistication of a luxury concierge service.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Party Planning Assistance</h4>
                    <p className="text-sm text-purple-200">Complete party coordination with vendor referrals</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Personalized Recommendations</h4>
                    <p className="text-sm text-purple-200">Products tailored to your pet's preferences and needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">VIP Priority Queue</h4>
                    <p className="text-sm text-purple-200">Skip the line with instant responses for VIP members</p>
                  </div>
                </div>
              </div>

              <Link to="/concierge">
                <Button className="mt-8 bg-white text-purple-900 hover:bg-gray-100">
                  Chat with Mira Now
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-3xl blur-2xl"></div>
              <Card className="relative bg-white/10 backdrop-blur-sm border-white/20 p-6 rounded-3xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Mira AI</h4>
                    <p className="text-sm text-purple-200">Online now</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl rounded-bl-none p-4">
                    <p className="text-sm">Welcome to The Doggy Bakery! 🐾 I'm Mira, your personal celebration concierge. How may I assist you today?</p>
                  </div>
                  <div className="bg-purple-500 rounded-2xl rounded-br-none p-4 ml-8">
                    <p className="text-sm">I need to plan a birthday party for my Lab turning 3!</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-bl-none p-4">
                    <p className="text-sm">How wonderful! A 3rd birthday is such a special milestone. 🎂 Let me help you create an unforgettable celebration. What's your location?</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Pet Parents Across India
            </h2>
            <p className="text-gray-600">See why thousands have joined our membership family</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-6 bg-white" data-testid={`membership-testimonial-${idx}`}>
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.tier} Member
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                <p className="text-sm text-purple-600 font-medium">{testimonial.pet}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="p-6" data-testid={`membership-faq-${idx}`}>
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Give Your Pet the VIP Treatment?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Join thousands of happy pet parents and unlock exclusive benefits today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
              data-testid="membership-cta-start"
            >
              Start Your Membership
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Link to="/concierge">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Chat with Mira First
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Membership;
