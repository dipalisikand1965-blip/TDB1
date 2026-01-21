/**
 * Membership Page - Pet Life OS Positioning
 * 
 * THE DOCTRINE: Membership is "Access to your pet's evolving intelligence system"
 * Not discounts. Not offers. Not perks.
 * 
 * Explain:
 * - Pet Soul
 * - Progressive learning
 * - Personalisation over time
 * - Mira AI as companion
 */

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
  Brain,
  MessageCircle, 
  Calendar, 
  Heart,
  Award,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  PawPrint,
  Activity,
  Database,
  Lightbulb,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Membership = () => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('yearly');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = (plan) => {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const membershipItem = {
      id: `membership-${plan.id}-${billingCycle}`,
      name: `${plan.name} - Pet Life OS (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
      price: price,
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      category: 'membership',
      description: plan.tagline,
      isMembership: true,
      membershipTier: plan.id,
      billingCycle: billingCycle,
    };
    
    addToCart(membershipItem, billingCycle === 'yearly' ? 'Annual' : 'Monthly', plan.name);
    
    toast({
      title: '🧠 Welcome to the Pet Life OS!',
      description: `${plan.name} access activated - Your pet's intelligence journey begins`,
    });
    
    navigate('/checkout');
  };

  // Pet Soul Intelligence Features
  const intelligenceFeatures = [
    {
      icon: Brain,
      title: 'Pet Soul™ Profile',
      description: 'A living, evolving digital identity for your pet that gets smarter with every interaction'
    },
    {
      icon: TrendingUp,
      title: 'Progressive Learning',
      description: 'We learn from orders, chats, bookings, and behavior — so you never explain twice'
    },
    {
      icon: Eye,
      title: 'Personalized Everything',
      description: 'Products, services, and recommendations tailored to your pet\'s unique profile'
    },
    {
      icon: MessageCircle,
      title: 'Mira AI Companion',
      description: 'Your 24/7 intelligent concierge who knows your pet personally'
    },
    {
      icon: Calendar,
      title: 'Smart Reminders',
      description: 'Birthdays, vaccines, grooming schedules — we remember so you don\'t have to'
    },
    {
      icon: RefreshCw,
      title: 'Weekly Soul Questions',
      description: 'One simple question per week via WhatsApp builds a richer pet profile'
    }
  ];

  // What Pet Soul Learns
  const soulPillars = [
    { name: 'Identity & Temperament', icon: '🎭', examples: 'Breed, personality, anxiety triggers' },
    { name: 'Family & Pack', icon: '👨‍👩‍👧‍👦', examples: 'Living situation, social preferences' },
    { name: 'Rhythm & Routine', icon: '⏰', examples: 'Daily schedule, separation comfort' },
    { name: 'Home Comforts', icon: '🏠', examples: 'Crate training, favorite spots' },
    { name: 'Travel Style', icon: '✈️', examples: 'Car comfort, hotel experience' },
    { name: 'Taste & Treats', icon: '🍖', examples: 'Allergies, favorite foods' },
    { name: 'Training & Behaviour', icon: '🎓', examples: 'Commands, leash behavior' },
    { name: 'Long Horizon', icon: '🌅', examples: 'Goals, celebration preferences' },
  ];

  const plans = [
    {
      id: 'companion',
      name: 'Companion',
      tagline: 'Start your pet\'s intelligence journey',
      icon: PawPrint,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      monthlyPrice: 199,
      yearlyPrice: 1999,
      savings: '₹389',
      intelligenceLevel: 'Foundation',
      features: [
        { text: 'Pet Soul™ Basic Profile', icon: Brain, highlight: true },
        { text: 'Mira AI Conversations (10/month)', icon: MessageCircle },
        { text: 'Birthday & Gotcha Day Reminders', icon: Calendar },
        { text: 'Health Vault (vaccines, meds)', icon: Shield },
        { text: '5% off all purchases', icon: Gift },
        { text: 'Weekly Soul Question (WhatsApp)', icon: RefreshCw },
      ],
      cta: 'Start Learning',
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'Full Pet Life Operating System',
      icon: Crown,
      color: 'from-purple-600 to-pink-600',
      borderColor: 'border-purple-500/50',
      bgColor: 'bg-purple-500/10',
      monthlyPrice: 499,
      yearlyPrice: 4999,
      savings: '₹989',
      popular: true,
      intelligenceLevel: 'Advanced',
      features: [
        { text: 'Pet Soul™ Full Intelligence', icon: Brain, highlight: true },
        { text: 'Unlimited Mira AI Concierge', icon: MessageCircle, highlight: true },
        { text: 'Behavioral Inference Engine', icon: Activity },
        { text: 'Personalized Recommendations', icon: Lightbulb },
        { text: 'Priority Service Across Pillars', icon: Zap },
        { text: '12% off all purchases', icon: Gift },
        { text: 'Advanced Health Tracking', icon: Shield },
        { text: 'Proactive Alerts & Suggestions', icon: TrendingUp },
      ],
      cta: 'Unlock Full OS',
    },
    {
      id: 'family',
      name: 'Family',
      tagline: 'For multi-pet households',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/10',
      monthlyPrice: 799,
      yearlyPrice: 7999,
      savings: '₹1589',
      intelligenceLevel: 'Multi-Pet',
      features: [
        { text: 'Pet Soul™ for up to 5 pets', icon: Brain, highlight: true },
        { text: 'Cross-pet intelligence', icon: Database },
        { text: 'Unlimited Mira AI for all pets', icon: MessageCircle },
        { text: 'Family scheduling & reminders', icon: Calendar },
        { text: '15% off all purchases', icon: Gift },
        { text: 'Dedicated family concierge', icon: Award },
        { text: 'Priority emergency support', icon: Shield },
        { text: 'All Premium features included', icon: Check },
      ],
      cta: 'Protect Your Pack',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="membership-page">
      {/* Hero Section - Intelligence Focused */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white overflow-hidden py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Badge className="bg-white/10 text-white border-white/20 mb-6">
            <Brain className="w-4 h-4 mr-1" />
            Pet Life Operating System
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Your Pet's Evolving<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
              Intelligence System
            </span>
          </h1>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Not just a membership. An intelligent companion that learns your pet's preferences,
            remembers their health history, and anticipates their needs — getting smarter every day.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-lg text-white/60">
            <span>"The longer a pet lives with us,</span>
            <span className="text-yellow-400 font-semibold">the less their parent has to explain."</span>
          </div>
        </div>
      </section>

      {/* Intelligence Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Makes Pet Soul™ Different
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This isn't about discounts or perks. It's about building the world's most 
              comprehensive understanding of your pet.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intelligenceFeatures.map((feature, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all border-2 hover:border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The 8 Soul Pillars */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-700 mb-4">
              <Database className="w-4 h-4 mr-1" />
              What We Learn
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The 8 Pillars of Pet Soul™
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every aspect of your pet's life, captured and remembered forever.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {soulPillars.map((pillar, idx) => (
              <Card key={idx} className="p-5 text-center bg-white/80 backdrop-blur-sm">
                <div className="text-4xl mb-3">{pillar.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{pillar.name}</h3>
                <p className="text-xs text-gray-500">{pillar.examples}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Intelligence Level
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Every plan includes Pet Soul™. The difference is in depth and capabilities.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Save 17%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? `ring-2 ring-offset-2 ${plan.borderColor} shadow-xl scale-105`
                    : 'hover:shadow-lg hover:scale-102'
                } ${plan.popular ? 'border-2 border-purple-500' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  {/* Header */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                    <plan.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.tagline}</p>
                  
                  <Badge className={`${plan.bgColor} ${plan.color.includes('purple') ? 'text-purple-700' : plan.color.includes('blue') ? 'text-blue-700' : 'text-rose-700'} mb-4`}>
                    <Brain className="w-3 h-3 mr-1" />
                    {plan.intelligenceLevel} Intelligence
                  </Badge>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">
                        ₹{billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Save {plan.savings} per year
                      </p>
                    )}
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          feature.highlight ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <feature.icon className={`w-3 h-3 ${
                            feature.highlight ? 'text-purple-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <span className={`text-sm ${feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* CTA */}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 py-6 text-lg`}
                    data-testid={`subscribe-${plan.id}-btn`}
                  >
                    {plan.cta}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Building Your Pet's Intelligence Today
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Every moment you wait is a moment of learning lost. 
            Let us start understanding your pet better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 px-8"
              onClick={() => document.querySelector('[data-testid="subscribe-premium-btn"]')?.click()}
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Premium Access
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Talk to Mira First
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Membership;
