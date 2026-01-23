import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Brain, Heart, PawPrint, Sparkles, Check, ChevronRight, Shield,
  Clock, TrendingUp, Star, Users, Calendar, Activity, Zap
} from 'lucide-react';
import MiraContextPanel from '../components/MiraContextPanel';

const SOUL_PILLARS = [
  { icon: '🎂', name: 'Celebrate', desc: 'Birthday parties, special occasions, custom cakes', color: 'from-pink-500 to-rose-500' },
  { icon: '🍽️', name: 'Dine', desc: 'Pet-friendly restaurants, special menus, dining', color: 'from-orange-500 to-amber-500' },
  { icon: '🏨', name: 'Stay', desc: 'Boarding, daycare, pet hotels, home sitters', color: 'from-blue-500 to-cyan-500' },
  { icon: '✈️', name: 'Travel', desc: 'Pet relocation, documentation, transport', color: 'from-indigo-500 to-purple-500' },
  { icon: '💊', name: 'Care', desc: 'Veterinary care, grooming, health monitoring', color: 'from-green-500 to-emerald-500' },
  { icon: '🎾', name: 'Enjoy', desc: 'Toys, accessories, enrichment activities', color: 'from-yellow-500 to-amber-500' },
  { icon: '🏃', name: 'Fit', desc: 'Exercise programs, swimming, agility', color: 'from-teal-500 to-cyan-500' },
  { icon: '🎓', name: 'Learn', desc: 'Training programs, behavior modification', color: 'from-blue-600 to-indigo-600' },
  { icon: '📄', name: 'Paperwork', desc: 'Registration, licenses, certificates', color: 'from-gray-500 to-slate-500' },
  { icon: '📋', name: 'Advisory', desc: 'Legal advice, insurance, pet planning', color: 'from-slate-500 to-gray-600' },
  { icon: '🚨', name: 'Emergency', desc: '24/7 emergency care, poison control', color: 'from-red-500 to-orange-500' },
  { icon: '🌈', name: 'Farewell', desc: 'End-of-life care, cremation, memorials', color: 'from-purple-500 to-pink-500' },
  { icon: '🐾', name: 'Adopt', desc: 'Adoption services, foster, rescue support', color: 'from-amber-500 to-orange-500' },
  { icon: '🛒', name: 'Shop', desc: 'Pet supplies, food, treats, essentials', color: 'from-green-600 to-teal-600' }
];

const WHAT_SOUL_LEARNS = [
  { icon: Heart, title: 'Personality & Temperament', desc: 'Learns if your pet is playful, calm, anxious, or energetic' },
  { icon: Activity, title: 'Health & Medical History', desc: 'Tracks vaccinations, allergies, medications, and vet visits' },
  { icon: Calendar, title: 'Important Dates', desc: 'Birthdays, adoption anniversaries, vaccination due dates' },
  { icon: PawPrint, title: 'Preferences & Favorites', desc: 'Favorite treats, toys, sleeping spots, and activities' },
  { icon: Users, title: 'Social Behavior', desc: 'How they interact with other pets, children, and strangers' },
  { icon: Clock, title: 'Routines & Schedules', desc: 'Feeding times, walk schedules, sleep patterns' }
];

const PetSoulPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white" data-testid="pet-soul-page">
      {/* Mira Context Panel */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="general" />
      </div>

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
            making every interaction personalized across all our pillars.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100">
                <PawPrint className="w-5 h-5 mr-2" />
                Create Your Pet's Soul
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Pet Soul Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Pet Soul™?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pet Soul™ is an intelligent profile system that captures everything about your pet — 
              their personality, preferences, health history, and life milestones. It's not just a profile; 
              it's a living memory that makes your pet's experience better every time.
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
              <p className="text-gray-600">One profile connects across all pillars — from boarding to travel to celebrations.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* What Pet Soul Learns */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Pet Soul™ Learns</h2>
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

      {/* Soul Pillars */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pet Soul™ Pillars</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your pet's Soul connects across all our pillars, creating a seamless experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SOUL_PILLARS.map((pillar, idx) => (
              <Link 
                key={idx} 
                to={`/${pillar.name.toLowerCase()}`}
                className="group"
              >
                <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-2xl mb-3`}>
                    {pillar.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{pillar.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{pillar.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
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
              { step: '2', title: 'Add Details', desc: 'Input health history, preferences, allergies, and important dates' },
              { step: '3', title: 'Use Services', desc: 'Book services across pillars — each interaction enriches their Soul' },
              { step: '4', title: 'Grow Smarter', desc: 'Mira® learns and adapts, making recommendations better over time' }
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
                  'Personalized recommendations based on preferences',
                  'Health reminders and milestone celebrations',
                  'Seamless handoff between service providers',
                  'Complete history in one place'
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
                  'Consistent care across all touchpoints'
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

      {/* CTA */}
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
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                I Already Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PetSoulPage;
