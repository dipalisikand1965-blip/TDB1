import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Sparkles, Heart, ArrowRight, PawPrint, 
  Eye, MessageCircle, Calendar, Shield, Star,
  Zap, TrendingUp, Quote, ChevronRight, Check,
  Clock, Users, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import { getApiUrl } from '../utils/api';

// 12 Pillars of Pet Life
const PILLARS = [
  { name: 'Celebrate', icon: '🎂', desc: 'Birthdays & milestones', link: '/celebrate' },
  { name: 'Dine', icon: '🍽️', desc: 'Pet-friendly restaurants', link: '/dine' },
  { name: 'Travel', icon: '✈️', desc: 'Pet relocation', link: '/travel' },
  { name: 'Stay', icon: '🏨', desc: 'Pet-friendly stays', link: '/stay' },
  { name: 'Enjoy', icon: '🎾', desc: 'Experiences', link: '/enjoy' },
  { name: 'Care', icon: '💊', desc: 'Health & wellness', link: '/care' },
];

const Home = () => {
  const { user, token } = useAuth();
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

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

  // If logged in with pets, show personalized dashboard
  if (user && userPets.length > 0 && !loadingPets) {
    return (
      <PersonalizedDashboard 
        user={user} 
        pets={userPets} 
        onOpenMira={handleOpenMira}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="home-page">
      
      {/* ========== HERO SECTION ========== */}
      {/* Vision First - Answer: Why is this different? */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-500 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 border border-white/20">
            <Brain className="w-4 h-4 text-yellow-400" />
            <span>Pet Life Operating System</span>
          </div>

          {/* Main Headline - Answer the ONE question */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            A System That
            <span className="block mt-2 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Learns, Remembers & Cares
            </span>
          </h1>

          {/* Subtext - Explain the difference */}
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            From birthdays to vet visits, travel to daily routines — your pet&apos;s entire life, 
            held in one intelligent system that grows smarter with every interaction.
          </p>

          {/* Single Clear CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pet-soul">
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

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>45,000+ Pets Served</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Les Concierges® Legacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Your Data, Your Control</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* ========== PET SOUL EXPLAINER ========== */}
      {/* Immediately after hero - explain the magic */}
      <section className="py-24 bg-gradient-to-b from-white to-purple-50">
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

          {/* How Pet Soul Works - Visual Flow */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
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

          {/* What Pet Soul Captures */}
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
              </div>
              <div className="text-center">
                <div className="inline-block p-8 bg-white/10 backdrop-blur rounded-3xl">
                  <div className="grid grid-cols-4 gap-3">
                    {['🎭', '👨‍👩‍👧‍👦', '⏰', '🏠', '✈️', '🍖', '🎓', '🌅'].map((emoji, idx) => (
                      <div key={idx} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl hover:scale-110 transition-transform">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-purple-300 mt-4">8 Soul Pillars</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ========== MEET MIRA SECTION ========== */}
      {/* Mira as Intelligence Layer, not just a chatbot */}
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

      {/* ========== LIFE PILLARS SECTION ========== */}
      {/* Commerce comes AFTER vision */}
      <section id="pillars-section" className="py-24 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              One System. Twelve Life Pillars.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything your pet needs, connected to their Soul profile for truly personalized experiences.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {PILLARS.map((pillar, idx) => (
              <Link key={idx} to={pillar.link}>
                <Card className="p-4 text-center h-full hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer group">
                  <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{pillar.icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{pillar.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{pillar.desc}</p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Plus: Fit, Advisory, Club, Shop Assist, Paperwork, Emergency</p>
            <Link to="/membership">
              <Button variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50">
                Explore All Pillars <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
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
            Join our founding members and be part of building the world&apos;s first Pet Life Operating System. 
            Not a discount — an invitation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/pet-soul">
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

          <p className="text-sm text-gray-500">
            Founding Member pricing: ₹4,999/year or ₹499/month (+ GST)
          </p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <PawPrint className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white">The Doggy Company®</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/membership" className="hover:text-white transition-colors">Pet Life Pass</Link>
              <Link to="/policies" className="hover:text-white transition-colors">Policies</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 The Doggy Company®. Built with love for pets and their parents.</p>
            <p className="mt-2 text-gray-500">Les Concierges® • Club Concierge® • The Doggy Bakery® • Mira®</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
