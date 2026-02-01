import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Sparkles, Heart, ArrowRight, PawPrint, 
  Eye, MessageCircle, Shield, Star,
  TrendingUp, Quote, ChevronRight, Check,
  Lock, Users, Award, ExternalLink, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';

// Outcome Statements (not feature tiles)
const OUTCOME_STATEMENTS = [
  { 
    statement: 'We remember how your dog reacts at the groomer.',
    subtext: 'Anxiety triggers, favorite handlers, special needs — all captured in their Soul.',
    icon: '✂️'
  },
  { 
    statement: 'We plan travel without making you repeat paperwork.',
    subtext: 'Vaccination records, carrier preferences, anxiety levels — already known.',
    icon: '✈️'
  },
  { 
    statement: 'We celebrate milestones without reminders.',
    subtext: 'Birthdays, gotcha days, vaccination due dates — we remember so you don\'t have to.',
    icon: '🎂'
  },
  { 
    statement: 'We suggest food they\'ll actually eat.',
    subtext: 'Based on allergies, past purchases, and what similar dogs loved.',
    icon: '🍖'
  },
  { 
    statement: 'We know which vet they trust.',
    subtext: 'Health history, preferred specialists, emergency contacts — all in one place.',
    icon: '🏥'
  },
  { 
    statement: 'We anticipate before you ask.',
    subtext: 'The longer you stay, the less you explain. That\'s the promise.',
    icon: '✨'
  },
];

const Home = () => {
  const { user, token } = useAuth();
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [showMiraModal, setShowMiraModal] = useState(false);

  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user?.email) {
        setLoadingPets(false);
        return;
      }
      
      try {
        const response = await fetch(`${getApiUrl()}/api/pets?email=${user.email}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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

  const handleOpenMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // If logged in, ALWAYS redirect to member dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" data-testid="home-page">
      {/* SEO Meta Tags */}
      <SEOHead page="home" path="/" />
      
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Elements - contained */}
        <div className="absolute inset-0 opacity-30 overflow-hidden">
          <div className="absolute top-20 -left-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-56 sm:w-80 h-56 sm:h-80 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-yellow-500 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 border border-white/20">
            <Brain className="w-4 h-4 text-yellow-400" />
            <span>Pet Concierge®</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Your Pet&apos;s Life,
            <span className="block mt-2 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Thoughtfully Orchestrated
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            From birthdays to vet visits, travel to daily routines — your pet&apos;s entire life, 
            managed by a dedicated concierge® who learns, remembers, and cares.
          </p>

          {/* Single Clear CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-10 py-7 text-lg rounded-full shadow-2xl shadow-pink-500/30 transition-all hover:scale-105"
                data-testid="hero-start-soul-btn"
              >
                <PawPrint className="w-5 h-5 mr-2" />
                Start Your Pet&apos;s Soul
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={handleOpenMira}
              className="text-white/80 hover:text-white hover:bg-white/10 px-8 py-7 text-lg rounded-full"
              data-testid="hero-talk-mira-btn"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Talk to Mira
            </Button>
          </div>

          {/* Proof Indicators (Not Claims) */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">1M+</p>
              <p className="text-xs text-white/60">Customers Served</p>
            </div>
            <div className="text-center p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">45,000+</p>
              <p className="text-xs text-white/60">Pets Fed</p>
            </div>
            <div className="text-center p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">Since 1990s</p>
              <p className="text-xs text-white/60">Concierge Heritage</p>
            </div>
            <div className="text-center p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">30+ Years</p>
              <p className="text-xs text-white/60">Service Excellence</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* ========== OUTCOME STATEMENTS (Not Feature Tiles) ========== */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Changes When You&apos;re With Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Not features. Outcomes. Here&apos;s what life actually looks like.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OUTCOME_STATEMENTS.map((item, idx) => (
              <Card key={idx} className="p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200 group">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                  {item.statement}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.subtext}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PET SOUL EXPLAINER ========== */}
      <section className="py-24 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Pet Soul™ Technology
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Every Interaction Builds
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Your Pet&apos;s Living Profile
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              So you never have to explain them again.
            </p>
          </div>

          {/* Visual Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-16">
            {[
              { icon: <PawPrint className="w-8 h-8" />, title: 'Your Pet', desc: 'Start with who they are', color: 'from-pink-500 to-rose-500' },
              { icon: <MessageCircle className="w-8 h-8" />, title: 'Interactions', desc: 'Orders, chats, bookings', color: 'from-purple-500 to-indigo-500' },
              { icon: <Brain className="w-8 h-8" />, title: 'Memory', desc: 'We learn & remember', color: 'from-blue-500 to-cyan-500' },
              { icon: <Heart className="w-8 h-8" />, title: 'Better Care', desc: 'Personalized everything', color: 'from-orange-500 to-amber-500' }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <Card className="p-6 text-center h-full hover:shadow-xl transition-shadow bg-white">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </Card>
                {idx < 3 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-300 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>

          {/* Soul Pillars Grid - What Pet Soul™ Tracks */}
          <Card className="p-8 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">What Gets Smarter Over Time</h3>
                <ul className="space-y-3">
                  {[
                    'Dietary preferences & allergies',
                    'Behavioral patterns & comfort zones',
                    'Health history & vet preferences',
                    'Travel readiness & anxiety triggers',
                    'Favorite treats & activities',
                    'Important dates & milestones'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/membership" className="inline-flex items-center gap-2 mt-6 text-purple-300 hover:text-white transition-colors">
                  Learn more about Pet Soul™ <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="text-center">
                <div className="inline-block p-4 bg-white/10 backdrop-blur rounded-3xl">
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { icon: '🎂', label: 'Celebrate' },
                      { icon: '🍽️', label: 'Dine' },
                      { icon: '🏨', label: 'Stay' },
                      { icon: '✈️', label: 'Travel' },
                      { icon: '💊', label: 'Care' },
                      { icon: '🎾', label: 'Enjoy' },
                      { icon: '🏃', label: 'Fit' },
                      { icon: '🎓', label: 'Learn' },
                      { icon: '📄', label: 'Paperwork' },
                      { icon: '📋', label: 'Advisory' },
                      { icon: '🚨', label: 'Emergency' },
                      { icon: '🌈', label: 'Farewell' },
                      { icon: '🐾', label: 'Adopt' },
                      { icon: '🛒', label: 'Shop' }
                    ].map((pillar, idx) => (
                      <div key={idx} className="group relative">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl hover:scale-110 hover:bg-white/20 transition-all cursor-pointer">
                          {pillar.icon}
                        </div>
                        <span className="text-[10px] text-purple-300 mt-1 block truncate">{pillar.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-purple-300 mt-4">14 Life Pillars</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ========== MEET MIRA SECTION ========== */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Meet Mira®
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Not a Chatbot.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Your Pet&apos;s Intelligence Layer.
                </span>
              </h2>

              <div className="space-y-6 text-gray-600">
                <p className="text-lg leading-relaxed">
                  Mira isn&apos;t here to answer generic questions. She <strong className="text-gray-900">knows your pet</strong> — 
                  their allergies, their fears, their favorite treats, their vet history.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                    <Eye className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Memory Layer</h4>
                      <p className="text-sm">She remembers every interaction. Never asks the same question twice.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-xl">
                    <Brain className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Judgement Layer</h4>
                      <p className="text-sm">She doesn&apos;t fabricate. Every answer is grounded in your pet&apos;s actual data.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Relationship Layer</h4>
                      <p className="text-sm">She grows with your pet. The longer you stay, the smarter she becomes.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleOpenMira}
                className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg"
                data-testid="mira-section-cta"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Talk to Mira Now
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8">
                <Card className="p-6 bg-white shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Mira®</p>
                      <p className="text-xs text-gray-500">Your Concierge</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-100 rounded-xl rounded-tl-none">
                      <p className="text-sm text-gray-700">
                        &quot;I see Bruno has a chicken allergy. I&apos;ve already filtered those products out. 
                        Would you like me to suggest some grain-free treats he&apos;d love?&quot;
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl rounded-tr-none ml-8">
                      <p className="text-sm text-purple-800">Yes please!</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-xl rounded-tl-none">
                      <p className="text-sm text-gray-700">
                        &quot;Based on his love for peanut butter and his medium size, here are 3 treats 
                        that other Golden Retriever parents loved...&quot;
                      </p>
                    </div>
                  </div>
                </Card>
                <p className="text-center text-sm text-purple-600 mt-4 font-medium">
                  Real context. Real memory. Real care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRIVACY & DATA SAFETY ========== */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Your Data, Your Control
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pet Soul Data is Sacred
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              We built this system to care for your pet — not to exploit their data.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            <Card className="p-6 bg-white/5 border-white/10 text-white">
              <Lock className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="font-bold text-lg mb-2">Your Data Stays Yours</h3>
              <p className="text-sm text-gray-400">
                We never sell, share, or monetize your pet&apos;s data. Period. It&apos;s used only to serve you better.
              </p>
            </Card>
            
            <Card className="p-6 bg-white/5 border-white/10 text-white">
              <Shield className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="font-bold text-lg mb-2">Bank-Grade Security</h3>
              <p className="text-sm text-gray-400">
                End-to-end encryption, secure cloud storage, and regular security audits protect every byte.
              </p>
            </Card>
            
            <Card className="p-6 bg-white/5 border-white/10 text-white">
              <Eye className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="font-bold text-lg mb-2">Full Transparency</h3>
              <p className="text-sm text-gray-400">
                See exactly what we know about your pet. Export or delete anytime. No questions asked.
              </p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              Your pet&apos;s health records, preferences, and history are stored securely and used solely to provide better care. 
              We follow GDPR-compliant data practices and give you complete control.
            </p>
          </div>
        </div>
      </section>

      {/* ========== CONCIERGE LINEAGE ========== */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built on 30 Years of Service Excellence
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The Doggy Company® didn&apos;t emerge from a startup playbook. 
              It comes from decades of understanding what real service means.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {/* Les Concierges */}
            <Card className="p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Les Concierges®</h3>
              <p className="text-sm text-gray-500 mb-4">Since 1998 — The foundation of our service philosophy</p>
              <a 
                href="https://lesconcierges.co.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 text-sm font-medium hover:underline"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>

            {/* Club Concierge */}
            <Card className="p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Club Concierge®</h3>
              <p className="text-sm text-gray-500 mb-4">Premium membership services with a personal touch</p>
              <a 
                href="https://clubconcierge.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-pink-600 text-sm font-medium hover:underline"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>

            {/* The Doggy Bakery */}
            <Card className="p-6 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">The Doggy Bakery®</h3>
              <p className="text-sm text-gray-500 mb-4">45,000+ pets fed with love — Where it began</p>
              <a 
                href="https://thedoggybakery.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium hover:underline"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* ========== DOCTRINE QUOTE ========== */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <Quote className="w-10 h-10 mx-auto text-white/50 mb-6" />
          <blockquote className="text-2xl sm:text-3xl font-medium leading-relaxed mb-6">
            &quot;The longer a pet lives with us,
            <span className="block text-yellow-300">the less their parent has to explain.&quot;</span>
          </blockquote>
          <p className="text-white/70">
            This is our North Star. Every feature is measured against this simple truth.
          </p>
        </div>
      </section>

      {/* ========== FOUNDING MEMBERS CTA ========== */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Founding Members
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Help Us Build the Future of Pet Care
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Join our founding members and be part of building India&apos;s first Pet Concierge® experience. 
            Not a discount — an invitation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/membership">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-10 py-7 text-lg"
              >
                <PawPrint className="w-5 h-5 mr-2" />
                Start Your Pet&apos;s Soul
              </Button>
            </Link>
            <Link to="/membership">
              <Button 
                size="lg" 
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 px-10 py-7 text-lg"
              >
                View Pet Life Pass
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== MIRA DEDICATION MODAL ========== */}
      {showMiraModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowMiraModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-purple-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mira</h3>
              <p className="text-purple-600 font-medium mb-6">The Soul Behind Everything We Build</p>
              
              <div className="text-gray-600 text-sm leading-relaxed space-y-4">
                <p>
                  At the heart of The Doggy Company® is <strong>Mira — Dipali&apos;s mother</strong>.
                </p>
                <p>
                  She believed in noticing without being asked, in remembering what mattered, 
                  and in showing up quietly but completely.
                </p>
                <p className="italic text-purple-700">
                  &quot;For her, care was never a transaction. It was responsibility carried with grace.&quot;
                </p>
                <p>
                  She remains the quiet standard behind everything we build.
                </p>
              </div>
              
              <Link to="/about">
                <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
                  Read Our Full Story
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Home;
