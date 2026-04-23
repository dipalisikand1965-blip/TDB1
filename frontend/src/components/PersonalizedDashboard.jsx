/**
 * PersonalizedDashboard - The Pet Life OS Experience
 * 
 * THE DOCTRINE: "The homepage becomes 'for Mojo', not 'for everyone'."
 * 
 * This component replaces the generic homepage when a user is logged in with a pet.
 * It shows:
 * - Personalized greeting with pet name
 * - Pet Soul progress and score
 * - Tailored recommendations based on Pet Soul
 * - Upcoming reminders and suggestions
 * - Mira AI as a companion presence
 * - Next WhatsApp drip question teaser
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Sparkles, Heart, PawPrint, Brain, Calendar, Gift, Star, 
  ArrowRight, MessageCircle, Zap, TrendingUp, Clock, Bell,
  Cake, UtensilsCrossed, Plane, Home, Activity, Stethoscope,
  ChevronRight, Plus, Sun, Moon, CloudSun, GraduationCap,
  FileText, ClipboardList, AlertTriangle, Rainbow, ShoppingCart
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-500' };
  if (hour < 17) return { text: 'Good afternoon', icon: CloudSun, color: 'text-orange-500' };
  return { text: 'Good evening', icon: Moon, color: 'text-indigo-500' };
};

// Pillar icons mapping - THE 14 PILLARS
const PILLAR_ICONS = {
  celebrate: { icon: Cake, color: 'bg-pink-100 text-pink-600', gradient: 'from-pink-500 to-rose-500' },
  dine: { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600', gradient: 'from-orange-500 to-red-500' },
  stay: { icon: Home, color: 'bg-blue-100 text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
  travel: { icon: Plane, color: 'bg-cyan-100 text-cyan-600', gradient: 'from-cyan-500 to-blue-500' },
  care: { icon: Stethoscope, color: 'bg-red-100 text-red-600', gradient: 'from-red-500 to-rose-500' },
  enjoy: { icon: Activity, color: 'bg-violet-100 text-violet-600', gradient: 'from-violet-500 to-purple-500' },
  fit: { icon: Activity, color: 'bg-green-100 text-green-600', gradient: 'from-green-500 to-teal-500' },
  learn: { icon: GraduationCap, color: 'bg-teal-100 text-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  paperwork: { icon: FileText, color: 'bg-slate-100 text-slate-600', gradient: 'from-slate-500 to-gray-500' },
  advisory: { icon: ClipboardList, color: 'bg-gray-100 text-gray-600', gradient: 'from-gray-500 to-slate-500' },
  emergency: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', gradient: 'from-red-600 to-red-500' },
  farewell: { icon: Rainbow, color: 'bg-rose-100 text-rose-600', gradient: 'from-rose-400 to-pink-400' },
  adopt: { icon: PawPrint, color: 'bg-purple-100 text-purple-600', gradient: 'from-purple-500 to-violet-500' },
  shop: { icon: ShoppingCart, color: 'bg-amber-100 text-amber-600', gradient: 'from-amber-500 to-orange-500' },
};

const PersonalizedDashboard = ({ user, pets = [], onOpenMira }) => {
  const [selectedPet, setSelectedPet] = useState(pets[0] || null);
  const [soulCompleteness, setSoulCompleteness] = useState(null);
  const [nextDripQuestion, setNextDripQuestion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const greeting = getGreeting();
  const petName = selectedPet?.name || 'your pet';

  // Fetch personalized data
  useEffect(() => {
    const fetchPersonalizedData = async () => {
      if (!selectedPet?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch soul completeness
        const completenessRes = await fetch(`${getApiUrl()}/api/soul-drip/completeness/${selectedPet.id}`);
        if (completenessRes.ok) {
          const data = await completenessRes.json();
          setSoulCompleteness(data.completeness);
        }
        
        // Fetch next drip question
        const dripRes = await fetch(`${getApiUrl()}/api/soul-drip/next-question/${selectedPet.id}`);
        if (dripRes.ok) {
          const data = await dripRes.json();
          setNextDripQuestion(data.question);
        }
        
      } catch (error) {
        console.error('Error fetching personalized data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonalizedData();
  }, [selectedPet?.id]);

  // Generate personalized recommendations based on Pet Soul
  const getPersonalizedRecommendations = () => {
    const recs = [];
    const soul = selectedPet?.soul_answers || selectedPet?.doggy_soul_answers || {};
    const health = selectedPet?.health || {};
    
    // Birthday coming up?
    if (selectedPet?.birth_date) {
      const birthday = new Date(selectedPet.birth_date);
      const today = new Date();
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= 30) {
        recs.push({
          type: 'birthday',
          title: `${petName}'s birthday is in ${daysUntil} days!`,
          description: 'Order a special birthday cake and treats',
          link: '/celebrate?category=cakes',
          icon: Cake,
          color: 'from-pink-500 to-rose-500',
          priority: 1
        });
      }
    }
    
    // Based on allergies - suggest safe products
    if (health.allergies?.length > 0) {
      recs.push({
        type: 'health',
        title: `Safe treats for ${petName}`,
        description: `Allergy-friendly options avoiding ${health.allergies.slice(0, 2).join(', ')}`,
        link: `/celebrate?safe_for=${selectedPet.id}`,
        icon: Heart,
        color: 'from-green-500 to-emerald-500',
        priority: 2
      });
    }
    
    // Travel suggestions
    if (soul.travel_style || soul.car_rides === 'Loves them') {
      recs.push({
        type: 'travel',
        title: `Plan a trip with ${petName}`,
        description: 'Discover pet-friendly destinations',
        link: '/travel',
        icon: Plane,
        color: 'from-blue-500 to-indigo-500',
        priority: 3
      });
    }
    
    // Dining suggestions
    recs.push({
      type: 'dine',
      title: `Dine out with ${petName}`,
      description: 'Pet-friendly restaurants near you',
      link: '/dine',
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-red-500',
      priority: 4
    });
    
    return recs.sort((a, b) => a.priority - b.priority).slice(0, 4);
  };

  // Soul pillar progress data
  const soulPillars = [
    { name: 'Identity', score: soulCompleteness?.essential_score || 0, color: 'bg-purple-500' },
    { name: 'Health', score: soulCompleteness?.important_score || 0, color: 'bg-green-500' },
    { name: 'Personality', score: soulCompleteness?.nice_score || 0, color: 'bg-pink-500' },
  ];

  if (!selectedPet) {
    // No pet - show add pet prompt
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <PawPrint className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to The Doggy Company
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Add your pet to unlock a personalised experience. 
            We'll remember everything about them, so you never have to repeat yourself.
          </p>
          <Link to="/pet-soul-onboard">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-5 h-5 mr-2" />
              Add Your Pet
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const personalizedRecs = getPersonalizedRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="personalized-dashboard">
      {/* Personalized Hero */}
      <section className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Greeting */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <greeting.icon className={`w-6 h-6 ${greeting.color}`} />
                <span className="text-white/80">{greeting.text}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-xl text-white/90">
                Here's what's happening with <span className="font-semibold text-yellow-300">{petName}</span> today
              </p>
            </div>
            
            {/* Pet Switcher (if multiple pets) */}
            {pets.length > 1 && (
              <div className="flex gap-2">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      selectedPet?.id === pet.id
                        ? 'bg-white text-purple-600 font-semibold shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <PawPrint className="w-4 h-4 inline mr-1" />
                    {pet.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-8">
            <Button
              onClick={onOpenMira}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
              data-testid="dashboard-ask-mira-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Mira about {petName}
            </Button>
            <Link to={`/pet/${selectedPet?.id}`}>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Heart className="w-4 h-4 mr-2" />
                View {petName}&apos;s Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pet Soul Progress Card */}
        <section className="mb-10">
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">{petName}'s Pet Soul™</h2>
                  </div>
                  <p className="text-gray-600">
                    Every interaction makes us understand {petName} better
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                  {soulCompleteness?.overall_score || 0}% Complete
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <Progress 
                  value={soulCompleteness?.overall_score || 0} 
                  className="h-4 bg-purple-100"
                />
              </div>
              
              {/* Pillar Progress */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {soulPillars.map((pillar) => (
                  <div key={pillar.name} className="text-center">
                    <div className={`w-12 h-12 ${pillar.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold">{Math.round(pillar.score)}%</span>
                    </div>
                    <p className="text-sm text-gray-600">{pillar.name}</p>
                  </div>
                ))}
              </div>
              
              {/* Next Question Teaser */}
              {nextDripQuestion && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Help us know {petName} better
                      </p>
                      <p className="text-amber-700">
                        {nextDripQuestion.question}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {nextDripQuestion.options?.slice(0, 3).map((opt, i) => (
                          <Button 
                            key={i} 
                            size="sm" 
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Missing Fields Prompt */}
              {soulCompleteness?.missing_essential?.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
                  <Zap className="w-4 h-4" />
                  <span>
                    Add {soulCompleteness.missing_essential[0]} to unlock better recommendations
                  </span>
                  <Link to={`/pet/${selectedPet?.id}?tab=soul`} className="font-semibold hover:underline">
                    Complete Now →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Mira AI Companion Section */}
        <section className="mb-10">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-10 h-10 text-yellow-300" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Talk to Mira about {petName}</h3>
                <p className="text-white/90 mb-4">
                  Mira knows {petName}'s preferences, health history, and personality. 
                  Ask her anything — from dinner recommendations to travel advice.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white cursor-pointer hover:bg-white/30">
                    "Find a restaurant for {petName}"
                  </Badge>
                  <Badge className="bg-white/20 text-white cursor-pointer hover:bg-white/30">
                    "Order {petName}'s favorite treat"
                  </Badge>
                  <Badge className="bg-white/20 text-white cursor-pointer hover:bg-white/30">
                    "Plan a trip with {petName}"
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={onOpenMira}
                className="bg-white text-purple-600 hover:bg-purple-50 px-8"
                data-testid="dashboard-chat-mira-btn"
              >
                Chat with Mira
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </section>

        {/* Personalized Recommendations */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Just for {petName}
              </h2>
              <p className="text-gray-600">Personalised recommendations based on {petName}'s profile</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalizedRecs.map((rec, i) => (
              <Link key={i} to={rec.link}>
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden group">
                  <div className={`h-2 bg-gradient-to-r ${rec.color}`}></div>
                  <div className="p-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rec.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <rec.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                      Explore <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Access Pillars */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What would you like to do for {petName}?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(PILLAR_ICONS).map(([pillar, config]) => (
              <Link key={pillar} to={`/${pillar}`}>
                <Card className="p-4 text-center hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className={`w-14 h-14 ${config.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <config.icon className="w-7 h-7" />
                  </div>
                  <p className="font-medium text-gray-900 capitalize">{pillar}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Pet Soul Explanation Section */}
        <section className="mb-10">
          <Card className="bg-gradient-to-br from-slate-50 to-purple-50 border-slate-200">
            <div className="p-8">
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Meet Pet Soul™ — {petName}'s Evolving Identity
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Every time you interact with us, we learn something new about {petName}. 
                  From favorite treats to travel preferences, we're building the world's most 
                  intelligent pet profile — so you never have to explain twice.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Progressive Learning</h4>
                    <p className="text-sm text-gray-600">Gets smarter with every interaction</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-pink-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Personalization</h4>
                    <p className="text-sm text-gray-600">Tailored to {petName}'s unique needs</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Mira AI Companion</h4>
                    <p className="text-sm text-gray-600">Your 24/7 intelligent concierge</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default PersonalizedDashboard;
