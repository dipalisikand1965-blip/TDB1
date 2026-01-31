import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Brain, Heart, PawPrint, Sparkles, Check, ChevronRight, Shield,
  Clock, TrendingUp, Star, Users, Calendar, Activity, Zap,
  Syringe, Pill, Stethoscope, FileText, AlertCircle, Plus,
  Edit2, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';
import MiraChatWidget from '../components/MiraChatWidget';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

// All 14 pillars
const SOUL_PILLARS = [
  { icon: '🎂', name: 'Celebrate', desc: 'Birthday parties, special occasions, custom cakes', color: 'from-pink-500 to-rose-500', path: '/celebrate' },
  { icon: '🍽️', name: 'Dine', desc: 'Pet-friendly restaurants, special menus', color: 'from-orange-500 to-amber-500', path: '/dine' },
  { icon: '🏨', name: 'Stay', desc: 'Boarding, daycare, pet hotels', color: 'from-blue-500 to-cyan-500', path: '/stay' },
  { icon: '✈️', name: 'Travel', desc: 'Pet relocation, documentation', color: 'from-indigo-500 to-purple-500', path: '/travel' },
  { icon: '💊', name: 'Care', desc: 'Veterinary care, grooming, health', color: 'from-green-500 to-emerald-500', path: '/care' },
  { icon: '🎾', name: 'Enjoy', desc: 'Toys, accessories, enrichment', color: 'from-yellow-500 to-amber-500', path: '/enjoy' },
  { icon: '🏃', name: 'Fit', desc: 'Exercise programs, swimming', color: 'from-teal-500 to-cyan-500', path: '/fit' },
  { icon: '🎓', name: 'Learn', desc: 'Training, behavior modification', color: 'from-blue-600 to-indigo-600', path: '/learn' },
  { icon: '📄', name: 'Paperwork', desc: 'Registration, licenses', color: 'from-gray-500 to-slate-500', path: '/paperwork' },
  { icon: '📋', name: 'Advisory', desc: 'Legal advice, insurance', color: 'from-slate-500 to-gray-600', path: '/advisory' },
  { icon: '🚨', name: 'Emergency', desc: '24/7 emergency care', color: 'from-red-500 to-orange-500', path: '/emergency' },
  { icon: '🌈', name: 'Farewell', desc: 'End-of-life care, memorials', color: 'from-purple-500 to-pink-500', path: '/farewell' },
  { icon: '🐾', name: 'Adopt', desc: 'Adoption, foster, rescue', color: 'from-amber-500 to-orange-500', path: '/adopt' },
  { icon: '🛒', name: 'Shop', desc: 'Pet supplies, food, treats', color: 'from-green-600 to-teal-600', path: '/shop' }
];

// What Pet Soul captures
const WHAT_SOUL_LEARNS = [
  { icon: Heart, title: 'Personality & Temperament', desc: 'Playful, calm, anxious, or energetic nature' },
  { icon: Activity, title: 'Health & Medical History', desc: 'Vaccinations, allergies, medications, vet visits' },
  { icon: Calendar, title: 'Important Dates', desc: 'Birthdays, adoption anniversaries, vaccination due dates' },
  { icon: PawPrint, title: 'Preferences & Favorites', desc: 'Favorite treats, toys, sleeping spots' },
  { icon: Users, title: 'Social Behavior', desc: 'How they interact with pets, children, strangers' },
  { icon: Clock, title: 'Routines & Schedules', desc: 'Feeding times, walk schedules, sleep patterns' }
];

// Health Information Categories - What We Collect
const HEALTH_CATEGORIES = [
  { 
    icon: Syringe, 
    title: 'Vaccinations', 
    desc: 'Track all vaccines with due dates and reminders',
    items: ['Rabies', 'DHPP', 'Bordetella', 'Leptospirosis', 'Lyme', 'Influenza']
  },
  { 
    icon: Pill, 
    title: 'Medications', 
    desc: 'Current and past medications with dosages',
    items: ['Heartworm Prevention', 'Flea/Tick', 'Allergies', 'Chronic Conditions']
  },
  { 
    icon: AlertCircle, 
    title: 'Allergies & Sensitivities', 
    desc: 'Food allergies, environmental triggers',
    items: ['Food Allergies', 'Environmental', 'Medication Reactions']
  },
  { 
    icon: Stethoscope, 
    title: 'Vet Records', 
    desc: 'Complete medical history and vet visits',
    items: ['Check-ups', 'Surgeries', 'Lab Results', 'X-rays']
  },
  { 
    icon: FileText, 
    title: 'Insurance & Documents', 
    desc: 'Pet insurance, licenses, certifications',
    items: ['Insurance Policy', 'License', 'Microchip', 'Certifications']
  }
];

const PetSoulPage = () => {
  const { petId } = useParams();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedHealth, setExpandedHealth] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);

  // Fetch user's pets if logged in
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user || !token) return;
      setLoadingPets(true);
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserPets(data.pets || []);
        }
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchUserPets();
  }, [user, token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white" data-testid="pet-soul-page">
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="general" />

      {/* Logged-in User's Pets Banner */}
      {user && userPets.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PawPrint className="w-6 h-6" />
              <div>
                <p className="font-medium">Welcome back, {user.name?.split(' ')[0]}!</p>
                <p className="text-sm text-purple-200">You have {userPets.length} pet(s) registered</p>
              </div>
            </div>
            <Link to="/my-pets">
              <Button className="bg-white text-purple-700 hover:bg-purple-100">
                View My Pets
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <Badge className="bg-white/10 text-white border-white/20 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            The Heart of The Doggy Company
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Pet Soul™
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            Your pet's unique digital identity that learns, remembers, and grows — 
            making every interaction personalized across all 14 life pillars.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100">
                <PawPrint className="w-5 h-5 mr-2" />
                Become a Member
              </Button>
            </Link>
            {user && (
              <Link to="/my-pets">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View My Pets
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="py-4 bg-white border-b sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">Health Information</TabsTrigger>
              <TabsTrigger value="pillars">14 Pillars</TabsTrigger>
              <TabsTrigger value="journey">How It Works</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* What is Pet Soul Section */}
          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Pet Soul™?</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Pet Soul™ is an intelligent profile system that captures everything about your pet — 
                  their personality, preferences, health history, and life milestones. It's a living memory 
                  that makes your pet's experience better every time.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-6 text-center border-2 border-purple-200 bg-purple-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                    <Brain className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Intelligent Memory</h3>
                  <p className="text-gray-600">Every interaction teaches us more about your pet, creating a smarter experience over time.</p>
                </Card>
                
                <Card className="p-6 text-center border-2 border-pink-200 bg-pink-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Personalized Care</h3>
                  <p className="text-gray-600">From food recommendations to care schedules, everything is tailored to your pet's unique needs.</p>
                </Card>
                
                <Card className="p-6 text-center border-2 border-blue-200 bg-blue-50/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Connected Ecosystem</h3>
                  <p className="text-gray-600">One profile connects across all 14 pillars — from boarding to travel to celebrations.</p>
                </Card>
              </div>
            </div>
          </section>

          {/* What Pet Soul Learns */}
          <section className="py-20 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What Pet Soul™ Captures</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Over time, your pet's Soul builds a comprehensive understanding of who they are.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {WHAT_SOUL_LEARNS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Health Information Tab */}
      {activeTab === 'health' && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-red-100 text-red-700 mb-4">
                <Heart className="w-4 h-4 mr-2" />
                Critical for Your Pet's Well-being
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Health Information We Collect</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Pet Soul™ keeps a comprehensive health record for your pet. This information is collected 
                during onboarding and can be updated anytime through your Pet Vault.
              </p>
            </div>

            {/* When Health Info is Collected */}
            <Card className="p-8 mb-12 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-red-500" />
                When Health Information is Collected
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: '1', title: 'Pet Registration', desc: 'Basic health info when you add your pet', icon: Plus },
                  { step: '2', title: 'Soul Journey', desc: 'Health preferences during personality quiz', icon: Sparkles },
                  { step: '3', title: 'Pet Vault', desc: 'Detailed records in your health vault', icon: FileText },
                  { step: '4', title: 'Service Bookings', desc: 'Updates when using Care, Fit, Stay pillars', icon: Calendar }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <Icon className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="text-sm font-bold text-red-600 mb-1">Step {item.step}</div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Health Categories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HEALTH_CATEGORIES.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.desc}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                All health information is securely stored and visible in your <strong>My Account</strong> section.
              </p>
              {user ? (
                <Link to="/my-pets">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    <Heart className="w-5 h-5 mr-2" />
                    Update My Pet's Health Info
                  </Button>
                </Link>
              ) : (
                <Link to="/membership">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    <Heart className="w-5 h-5 mr-2" />
                    Become a Member
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 14 Pillars Tab */}
      {activeTab === 'pillars' && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The 14 Life Pillars</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your pet's Soul connects across all our pillars, creating a seamless, personalized experience.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {SOUL_PILLARS.map((pillar, idx) => (
                <Link 
                  key={idx} 
                  to={pillar.path}
                  className="group"
                >
                  <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-2xl mb-3`}>
                      {pillar.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">{pillar.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pillar.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pillar Connection */}
            <Card className="mt-12 p-8 bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
              <div className="text-center">
                <h3 className="text-xl font-bold text-purple-900 mb-4">How Pillars Connect</h3>
                <p className="text-purple-700 max-w-2xl mx-auto mb-6">
                  When you book a <strong>Stay</strong>, we already know your pet's dietary needs from <strong>Care</strong>. 
                  When you order from <strong>Shop</strong>, we recommend based on their <strong>Learn</strong> training stage. 
                  Everything is connected through Pet Soul™.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SOUL_PILLARS.map((pillar, idx) => (
                    <Badge key={idx} className="bg-white/50 text-purple-800">
                      {pillar.icon} {pillar.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* How It Works Tab */}
      {activeTab === 'journey' && (
        <>
          <section className="py-20 px-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How Pet Soul™ Works</h2>
                <p className="text-lg text-purple-200 max-w-2xl mx-auto">
                  A simple flow that creates a lifetime of personalized care.
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: '1', title: 'Create Profile', desc: 'Add your pet with basic info, photos, and their unique traits' },
                  { step: '2', title: 'Add Health Info', desc: 'Input vaccinations, allergies, medications, and vet records' },
                  { step: '3', title: 'Complete Soul Journey', desc: 'Answer personality questions to discover their unique soul' },
                  { step: '4', title: 'Use Services', desc: 'Book across all 14 pillars — each interaction enriches their Soul' }
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-300">{item.step}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-purple-200">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Benefits of Pet Soul™</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    For Pet Parents
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'No need to repeat your pet\'s info at every service',
                      'View all your pet\'s data in My Account anytime',
                      'Health reminders and milestone celebrations',
                      'Seamless handoff between service providers',
                      'Complete history across all 14 pillars'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    For Your Pet
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Service providers already know their quirks',
                      'Special dietary needs are always remembered',
                      'Anxiety triggers are avoided proactively',
                      'Favorite treats and toys are always available',
                      'Consistent care across all 14 life pillars'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Final CTA */}
      <section className="py-20 px-4 bg-purple-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Give Your Pet a Soul
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of pet parents who've created intelligent profiles for their furry friends.
            All information is visible in your <strong>My Account</strong> section.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/my-pets">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <PawPrint className="w-5 h-5 mr-2" />
                    View My Pets
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline">
                    Go to My Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/membership">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    Become a Member
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    I Already Have an Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PetSoulPage;
