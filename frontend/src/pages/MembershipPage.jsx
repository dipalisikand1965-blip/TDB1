import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { 
  PawPrint, Crown, Check, Star, Heart, Gift, Calendar, 
  Shield, Sparkles, ChevronRight, Eye, EyeOff, ArrowRight,
  Utensils, Plane, Home, Dumbbell, Brain, Phone, FileText,
  ShoppingBag, Users, Award, Zap, X
} from 'lucide-react';
import { API_URL } from '../utils/api';

const MembershipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register, loading: authLoading } = useAuth();
  
  // Redirect destination after login
  const from = location.state?.from || '/my-pets';
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to intended destination
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowAuthModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setSubmitting(false);
          return;
        }
        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      }
      // Auth context will update, useEffect will redirect
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pillar icons mapping
  const pillarIcons = {
    celebrate: Gift,
    dine: Utensils,
    travel: Plane,
    stay: Home,
    care: Heart,
    fit: Dumbbell,
    advisory: Brain,
    emergency: Phone,
    paperwork: FileText,
    shop: ShoppingBag,
    club: Users,
    enjoy: Star
  };

  const pillars = [
    { id: 'celebrate', name: 'Celebrate', desc: 'Birthday cakes, treats & parties', color: 'pink' },
    { id: 'dine', name: 'Dine', desc: 'Pet-friendly restaurants', color: 'orange' },
    { id: 'travel', name: 'Travel', desc: 'Pet travel assistance', color: 'blue' },
    { id: 'stay', name: 'Stay', desc: 'Pet-friendly hotels', color: 'green' },
    { id: 'care', name: 'Care', desc: 'Grooming, walking, sitting', color: 'purple' },
    { id: 'fit', name: 'Fit', desc: 'Exercise & wellness', color: 'teal' },
    { id: 'advisory', name: 'Advisory', desc: 'Expert consultations', color: 'indigo' },
    { id: 'emergency', name: 'Emergency', desc: '24/7 pet emergency help', color: 'red' },
    { id: 'paperwork', name: 'Paperwork', desc: 'Health records & docs', color: 'slate' },
    { id: 'shop', name: 'Shop Assist', desc: 'Curated products via Mira', color: 'amber' },
    { id: 'club', name: 'Club', desc: 'Community & rewards', color: 'violet' },
    { id: 'enjoy', name: 'Enjoy', desc: 'Events & experiences', color: 'rose' },
  ];

  const benefits = [
    { icon: PawPrint, title: 'Pet Soul Profile', desc: 'Deep, evolving profile for your pet' },
    { icon: Sparkles, title: 'Mira AI Concierge', desc: '24/7 intelligent pet assistant' },
    { icon: Award, title: 'Paw Rewards', desc: 'Earn points on every interaction' },
    { icon: Calendar, title: 'Smart Reminders', desc: 'Birthday, vaccine & event alerts' },
    { icon: Shield, title: 'Health Vault', desc: 'Secure medical records storage' },
    { icon: Zap, title: 'Priority Support', desc: 'Fast-track help when you need it' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          {/* Logo & Nav */}
          <div className="flex justify-between items-center mb-16">
            <Link to="/" className="flex items-center gap-2">
              <PawPrint className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">The Doggy Company</span>
            </Link>
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
            >
              Sign In
            </Button>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-white/90 text-sm">The World's First Pet Life Operating System</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              Everything Your Pet Needs,<br />
              <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                One Membership Away
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join The Doggy Company and unlock 12 pillars of pet care - from celebrations to emergencies, 
              all powered by your pet's unique Soul profile.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-8 py-6 text-lg"
                onClick={() => handleSelectPlan('annual')}
              >
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
              >
                View Plans
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 12 Pillars Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              12 Pillars of Pet Life
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              One membership unlocks everything. No more juggling multiple apps and services.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pillars.map((pillar) => {
              const Icon = pillarIcons[pillar.id];
              return (
                <Card 
                  key={pillar.id}
                  className={`p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-${pillar.color}-200 group`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-${pillar.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${pillar.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{pillar.name}</h3>
                  <p className="text-sm text-gray-500">{pillar.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              More Than Just Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your pet deserves a complete ecosystem that learns, remembers, and anticipates their needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600">
              One membership, unlimited access to all 12 pillars
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="p-8 border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Monthly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Billed monthly, cancel anytime</p>
              </div>

              <ul className="space-y-3 mb-8">
                {['All 12 pillars unlocked', 'Pet Soul profile', 'Mira AI concierge', 'Paw Rewards', 'Health Vault', 'Priority support'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800"
                onClick={() => handleSelectPlan('monthly')}
              >
                Get Started
              </Button>
            </Card>

            {/* Annual Plan - Recommended */}
            <Card className="p-8 border-2 border-purple-500 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                BEST VALUE
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Annual</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹999</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-sm text-green-600 mt-2 font-medium">Save ₹189 (16% off)</p>
              </div>

              <ul className="space-y-3 mb-8">
                {['All 12 pillars unlocked', 'Pet Soul profile', 'Mira AI concierge', 'Paw Rewards (2x points)', 'Health Vault', 'Priority support', 'Birthday surprise gift'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => handleSelectPlan('annual')}
              >
                Get Started - Save 16%
              </Button>
            </Card>
          </div>

          {/* Family Plan Note */}
          <div className="mt-8 text-center">
            <Card className="inline-block p-4 bg-purple-50 border-purple-200">
              <p className="text-purple-900">
                <strong>🐾 Multiple pets?</strong> Add more pets at just ₹499/year or ₹49/month each
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Give Your Pet the Best Life?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of pet parents who've transformed their pet care experience.
          </p>
          <Button 
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg"
            onClick={() => handleSelectPlan('annual')}
          >
            Start Your Journey Today <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          © 2026 The Doggy Company. All rights reserved.
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back!' : 'Join The Pack'}
              </h2>
              <p className="text-gray-500 mt-1">
                {isLogin ? 'Sign in to continue' : selectedPlan === 'annual' ? '₹999/year membership' : '₹99/month membership'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required={!isLogin}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required={!isLogin}
                    className="mt-1"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already a member? Sign in'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MembershipPage;
