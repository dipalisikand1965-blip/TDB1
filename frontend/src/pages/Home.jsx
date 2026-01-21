import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testimonials, faqs } from '../mockData';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Card } from '../components/ui/card';
import { Star, Award, Clock, Shield, ArrowRight, Sparkles, Heart, Check, Crown, Phone, MessageCircle, Calendar, MapPin, Stethoscope, Plane, Brain, TrendingUp, Zap } from 'lucide-react';
import { useInView, useCountUp } from '../hooks/useAnimations';
import { useAuth } from '../context/AuthContext';
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import { getApiUrl } from '../utils/api';

// 12 Pillars of The Doggy Company
const PILLARS = [
  { name: 'Celebrate', icon: '🎂', desc: 'Cakes, treats & party supplies', link: '/celebrate' },
  { name: 'Dine', icon: '🍽️', desc: 'Pet-friendly restaurants', link: '/dine' },
  { name: 'Travel', icon: '✈️', desc: 'Pet relocation & travel', link: '/travel' },
  { name: 'Stay', icon: '🏨', desc: 'Pet-friendly hotels & stays', link: '/stay' },
  { name: 'Enjoy', icon: '🎾', desc: 'Experiences & activities', link: '/enjoy' },
  { name: 'Care', icon: '💊', desc: 'Health, grooming & wellness', link: '/care' },
  { name: 'Fit', icon: '🏃', desc: 'Fitness & training', link: '/fit' },
  { name: 'Advisory', icon: '📋', desc: 'Expert consultations', link: '/advisory' },
  { name: 'Club', icon: '👑', desc: 'Exclusive membership', link: '/membership' },
  { name: 'Shop Assist', icon: '🛒', desc: 'Personal shopping help', link: '/shop-assist' },
  { name: 'Paperwork', icon: '📄', desc: 'Documents & certificates', link: '/paperwork' },
  { name: 'Emergency', icon: '🚨', desc: '24/7 emergency support', link: '/emergency' },
];

// Concierge Use Cases
const CONCIERGE_USE_CASES = [
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Book a Pet-Friendly Restaurant",
    description: "Find and reserve tables at verified pet-friendly restaurants in seconds",
    example: '"Mira, book a table for 2 with my dog at a pet-friendly cafe in Koramangala this Saturday"'
  },
  {
    icon: <Plane className="w-6 h-6" />,
    title: "Plan Pet Travel",
    description: "Domestic & international pet relocation, airline bookings, pet taxis",
    example: '"I need to fly my Golden Retriever from Bangalore to Mumbai next week"'
  },
  {
    icon: <Stethoscope className="w-6 h-6" />,
    title: "Coordinate Vet Appointments",
    description: "Find specialists, book appointments, and manage health records",
    example: '"Find a dermatologist for my dog who has skin allergies"'
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Find Pet-Friendly Stays",
    description: "Hotels, resorts, and home boarding options that welcome your furry friend",
    example: '"Looking for a pet-friendly resort in Goa for a 3-day trip"'
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Get Expert Advice",
    description: "Nutrition guidance, behavior consultations, senior pet care",
    example: '"My puppy is 6 months old, what should be his diet plan?"'
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "24/7 Emergency Support",
    description: "Lost pet alerts, medical emergencies, crisis coordination",
    example: '"My dog ate something toxic, what should I do?"'
  },
];

const Home = () => {
  const { user, token } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  
  const customersCount = useCountUp(45000, 2000, statsInView);
  const citiesCount = useCountUp(15, 1500, statsInView);
  const partnersCount = useCountUp(500, 1800, statsInView);

  const heroSlides = [
    {
      title: 'Your Pet\'s Life',
      subtitle: 'One Platform, Endless Care',
      description: 'The complete Pet Life Operating System — Celebrate, Dine, Travel, Stay, Care & more',
      image: 'https://images.unsplash.com/flagged/photo-1553802922-28e2f719977d?w=1200',
      cta: 'Explore Pillars'
    },
    {
      title: 'Meet Mira AI',
      subtitle: 'Your Super Concierge®',
      description: 'Get personalized recommendations, travel help, dining reservations & expert guidance 24/7',
      image: 'https://images.unsplash.com/photo-1537204696486-967f1b7198c8?w=1200',
      cta: 'Chat with Mira'
    },
    {
      title: 'Pet Soul™',
      subtitle: 'We Remember Everything',
      description: 'Every interaction enriches your pet\'s profile for truly personalized experiences',
      image: 'https://images.unsplash.com/photo-1679067652135-324b9535d288?w=1200',
      cta: 'Learn More'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's pets if logged in
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

  // Handle opening Mira AI
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
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section - Ultra Modern */}
      <section className="relative h-screen overflow-hidden bg-black">
        {/* Background Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex items-center z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === activeSlide
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10 absolute'
                  }`}
                >
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
                    <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-white text-sm font-medium">45,000+ Happy Pet Parents</span>
                  </div>
                  
                  <h1 className="text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6">
                    {slide.subtitle}
                  </h2>
                  <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                    {slide.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    {slide.cta === 'Chat with Mira' ? (
                      <Button
                        size="lg"
                        onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-600 text-white text-lg px-8 py-7 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                        data-testid="hero-chat-mira-btn"
                      >
                        {slide.cta}
                        <Sparkles className="w-5 h-5 ml-2" />
                      </Button>
                    ) : slide.cta === 'Explore Pillars' ? (
                      <Button
                        size="lg"
                        onClick={() => document.getElementById('pillars-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-600 text-white text-lg px-8 py-7 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                        data-testid="hero-explore-pillars-btn"
                      >
                        {slide.cta}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Link to="/membership">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:from-purple-700 hover:via-pink-700 hover:to-yellow-600 text-white text-lg px-8 py-7 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                        >
                          {slide.cta}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    )}
                    {/* Dynamic secondary CTA based on auth state */}
                    {user ? (
                      <Link to="/pets/add">
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-7"
                          data-testid="hero-add-pet-btn"
                        >
                          Start Your Pet Soul
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/membership">
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-7"
                          data-testid="hero-become-member-btn"
                        >
                          Become a Member
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeSlide ? 'w-12 bg-white' : 'w-6 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 py-6" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            <div className="flex items-center justify-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">{customersCount.toLocaleString()}+</p>
                <p className="text-sm opacity-90">Happy Pet Parents</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Heart className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">12</p>
                <p className="text-sm opacity-90">Pet Life Pillars</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">{citiesCount}+</p>
                <p className="text-sm opacity-90">Cities Covered</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <p className="font-bold text-lg">{partnersCount}+</p>
                <p className="text-sm opacity-90">Verified Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mira AI Concierge® Spotlight - MAIN FOCUS */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-purple-600 text-sm font-semibold">Introducing Mira AI</span>
              </div>
              <h2 className="text-5xl font-black text-gray-900 mb-6">
                Your Super
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Pet Concierge®
                </span>
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Mira is your AI-powered assistant across all 12 pillars — book restaurants, plan travel, schedule grooming, get health advice, and more. 24/7 intelligent support for all your pet&apos;s needs.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Book dining, stays & travel with one chat',
                  'Get personalized recommendations from Pet Soul™',
                  'Schedule appointments & manage pet health',
                  'Access emergency support anytime'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700 font-medium">{feature}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 shadow-xl"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                data-testid="chat-with-mira-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Chat with Mira Now
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl opacity-10 transform rotate-3"></div>
              <Card className="relative p-8 shadow-2xl">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl -mx-8 -mt-8 mb-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Mira AI</h3>
                      <p className="text-sm opacity-90">Super Concierge® • Online</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm text-gray-700">
                      Hi! I&apos;m Mira, your Super Concierge®! I can help with restaurant bookings, travel planning, grooming appointments, vet coordination & more!
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-4 shadow-sm max-w-[80%]">
                      <p className="text-sm">
                        I need a pet-friendly restaurant in Koramangala for this Saturday
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm text-gray-700">
                      Found 12 great options! I recommend &quot;Cafe Pawsome&quot; — they have a lovely garden area for pets. Shall I book a table?
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Concierge® Use Cases */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
              <MessageCircle className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-600 text-sm font-semibold">What Can Mira Do?</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Your Concierge® Does It All
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From restaurant reservations to emergency support — one chat handles everything
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CONCIERGE_USE_CASES.map((useCase, idx) => (
              <Card 
                key={idx} 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-purple-200"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  {useCase.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{useCase.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{useCase.description}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 italic">&quot;{useCase.example}&quot;</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Try Mira Now — It&apos;s Free!
            </Button>
          </div>
        </div>
      </section>

      {/* 12 Pillars Section */}
      <section id="pillars-section" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
              <Crown className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-600 text-sm font-semibold">Pet Life Operating System</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              12 Pillars of Pet Life
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything your pet needs, under one roof. From celebrations to emergencies.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, idx) => (
              <Link key={idx} to={pillar.link}>
                <Card className="group p-6 hover:shadow-xl transition-all duration-300 cursor-pointer h-full transform hover:scale-105 hover:border-purple-200 border-2 border-transparent">
                  <div className="text-4xl mb-4">{pillar.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">{pillar.name}</h3>
                  <p className="text-gray-600 text-sm">{pillar.desc}</p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            {user ? (
              <Link to="/pets/add">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
                >
                  <PawPrint className="w-5 h-5 mr-2" />
                  Add Your Pet to Unlock All Pillars
                </Button>
              </Link>
            ) : (
              <Link to="/membership">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Unlock All Pillars with Membership
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Meet Pet Soul Section - NEW */}
      <section className="py-24 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Brain className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-white text-sm font-semibold">Introducing</span>
            </div>
            <h2 className="text-5xl font-black mb-4">
              Meet Pet Soul™
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Your pet's evolving digital identity. Every interaction builds a smarter profile —
              so we understand your pet better than anyone else.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Progressive Learning</h3>
              <p className="text-white/70">
                Every order, every chat, every booking teaches us something new about your pet.
                The longer you're with us, the less you need to explain.
              </p>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">True Personalization</h3>
              <p className="text-white/70">
                From allergies to favorite treats, from travel anxiety to celebration preferences —
                we remember it all for a truly personalized experience.
              </p>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mira AI Companion</h3>
              <p className="text-white/70">
                Our AI concierge knows your pet personally. Ask her anything —
                she'll give recommendations tailored to your pet's unique profile.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-white/60 mb-6 text-lg">
              "The world's most intelligent pet life platform, continuously learning and anticipating your pet's needs."
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/membership">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-6 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Your Pet's Soul
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to Mira
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-pink-100 rounded-full mb-6">
              <Heart className="w-5 h-5 text-pink-600 mr-2" />
              <span className="text-pink-600 text-sm font-semibold">Pet Parent Reviews</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Loved by Pet Parents
            </h2>
            <p className="text-xl text-gray-600">Real stories from our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full border-2 border-purple-200"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                    <p className="text-xs text-purple-600 font-medium">Pet: {testimonial.petName}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">{testimonial.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pawsome Panel - Loyal Customers */}
      <section className="py-24 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 rounded-full mb-6">
              <Crown className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-600 text-sm font-semibold">The Pawsome Panel</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Meet Our Loyal Patrons
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our cherished group of loyal members who have been with The Doggy Company from the start, celebrating countless special moments along the way.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Bruno', breed: 'Golden Retriever', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop' },
              { name: 'Luna', breed: 'Labrador', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
              { name: 'Max', breed: 'Beagle', img: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop' },
              { name: 'Bella', breed: 'Shih Tzu', img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop' },
              { name: 'Rocky', breed: 'German Shepherd', img: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&h=200&fit=crop' },
              { name: 'Coco', breed: 'Pomeranian', img: 'https://images.unsplash.com/photo-1591856419156-ef0f0a1a5e2c?w=200&h=200&fit=crop' },
              { name: 'Charlie', breed: 'Indie', img: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=200&h=200&fit=crop' },
              { name: 'Milo', breed: 'Pug', img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop' },
              { name: 'Daisy', breed: 'Cocker Spaniel', img: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop' },
              { name: 'Oscar', breed: 'Husky', img: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=200&h=200&fit=crop' },
              { name: 'Rosie', breed: 'Dachshund', img: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=200&h=200&fit=crop' },
              { name: 'Leo', breed: 'Chow Chow', img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=200&h=200&fit=crop' },
            ].map((pet, idx) => (
              <div key={idx} className="group text-center">
                <div className="relative mb-3">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:border-yellow-400 transition-all duration-300 group-hover:scale-110">
                    <img src={pet.img} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full text-yellow-900">
                    VIP
                  </div>
                </div>
                <h4 className="font-bold text-gray-900">{pet.name}</h4>
                <p className="text-xs text-gray-500">{pet.breed}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Want to join the Pawsome Panel?</p>
            {user ? (
              <Link to="/pets/add">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                  <PawPrint className="w-4 h-4 mr-2" />
                  Add Your Pet
                </Button>
              </Link>
            ) : (
              <Link to="/membership">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Become a Member
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.slice(0, 5).map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="bg-white border-2 border-gray-100 rounded-xl px-6 hover:border-purple-200 transition-colors">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-purple-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <Link to="/faqs">
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 mr-4">
                View All FAQs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Mira AI
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1679067652135-324b9535d288?w=1600"
          alt="Happy dog"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-purple-900/90"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to Elevate Your Pet&apos;s Life?
          </h2>
          <p className="text-2xl text-white/90 mb-12">
            Join 45,000+ pet parents who trust The Doggy Company for everything their fur babies need.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/membership">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-10 py-8 shadow-2xl transform hover:scale-105 transition-all"
              >
                Become a Member
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-xl px-10 py-8"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Chat with Mira
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
