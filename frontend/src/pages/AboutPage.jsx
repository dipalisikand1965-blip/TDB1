import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, Clock, Shield, 
  PawPrint, Star, Eye, MessageCircle, 
  TrendingUp, Leaf, Crown, Quote
} from 'lucide-react';

const AboutPage = () => {
  // Team data
  const founders = [
    {
      name: 'Mira',
      role: 'The Soul & Inspiration',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
      description: 'The spirit behind everything we do. Mira taught us that every pet deserves to be truly understood.',
      isPet: true
    },
    {
      name: 'Dipali',
      role: 'Keeper of the Concierge',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      description: 'Holder of India\'s first registered Concierge license. She believes service is an art, and pets deserve nothing less than perfection.',
      isPet: false
    },
    {
      name: 'Aditya',
      role: 'Founder, The Doggy Bakery',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      description: 'Started baking treats for his own dogs and couldn\'t stop. Now he\'s building the Pet Life Operating System to give every pet parent the care their fur babies deserve.',
      isPet: false
    }
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section - The Story */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>Our Story</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Born from Love,
            <span className="block mt-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
              Built for Every Pet Parent
            </span>
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            We didn&apos;t start as a company. We started as pet parents — frustrated, 
            juggling apps, repeating ourselves, never feeling truly understood. 
            So we built what we wished existed.
          </p>
        </div>
      </section>

      {/* The Beginning */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                It All Started with Mira
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Mira wasn&apos;t just a dog — she was family. And like any family member, 
                  she deserved to be understood, not explained. Every vet visit, every groomer, 
                  every hotel stay — we found ourselves repeating the same things: 
                  &quot;She&apos;s anxious around loud sounds&quot;, &quot;She has a chicken allergy&quot;, 
                  &quot;She needs her blanket to sleep&quot;.
                </p>
                <p>
                  Why wasn&apos;t there a system that just... knew her?
                </p>
                <p className="font-semibold text-gray-900">
                  That question became our mission. That mission became The Doggy Company.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-pink-100 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-100 rounded-full opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=500&fit=crop"
                alt="Mira - Our Inspiration"
                className="relative rounded-2xl shadow-2xl w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full">
                <span className="font-semibold text-purple-700">Mira — Forever in our hearts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Founding Team */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Souls Behind The System
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A registered concierge, a bakery founder, and the spirit of one very special dog 
              — together building the world&apos;s first Pet Life Operating System.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {founders.map((person, idx) => (
              <Card 
                key={idx} 
                className={`overflow-hidden transition-all hover:shadow-xl ${
                  person.isPet ? 'ring-2 ring-pink-300 ring-offset-4' : ''
                }`}
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{person.name}</h3>
                    {person.isPet && (
                      <span className="text-pink-500 text-lg">🐾</span>
                    )}
                  </div>
                  <p className="text-purple-600 font-medium text-sm mb-3">{person.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{person.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* The Extended Team */}
          <div className="mt-16 text-center">
            <Card className="inline-block p-8 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex -space-x-4">
                  {[1,2,3,4,5].map(i => (
                    <div 
                      key={i}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white font-bold"
                    >
                      {['A','P','S','R','M'][i-1]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">+15 Pet Parents & Their Babies</p>
                  <p className="text-sm text-gray-500">Building with love from Mumbai, Delhi & Bangalore</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Doctrine / North Star */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Quote className="w-12 h-12 mx-auto text-purple-400 mb-6" />
          <blockquote className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            &quot;The longer a pet lives with us,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
              the less their parent has to explain.&quot;
            </span>
          </blockquote>
          <p className="text-purple-300 text-lg max-w-2xl mx-auto">
            This is our North Star. Every feature, every interaction, every decision 
            is measured against this simple truth.
          </p>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What We Believe</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These aren&apos;t just principles — they&apos;re promises we make to every pet and pet parent.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Recognition Over Asking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    If it ever feels like a CRM, we&apos;ve failed. Our system remembers your pet&apos;s preferences, 
                    allergies, favorite treats, and care history — so you never have to repeat yourself.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Progressive Intelligence</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every order, every chat with Mira, every booking teaches us something new. 
                    The more you use us, the smarter we get about your pet.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Care, Not Commerce</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We don&apos;t push products. We understand your pet&apos;s needs and surface what&apos;s truly helpful. 
                    If your pet has grain allergies, you&apos;ll never see grain products.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Mira Knows Your Pet</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our AI concierge, Mira, doesn&apos;t just answer questions — she knows your pet personally. 
                    Ask her anything, and she&apos;ll give you personalized, context-aware guidance.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pet Soul Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                Pet Soul™ Technology
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Your Pet&apos;s Evolving Digital Identity
              </h2>
              
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  <strong className="text-gray-900">Pet Soul™</strong> is the heart of everything we do. 
                  It&apos;s a living, evolving profile that captures who your pet truly is — not just their breed and age, 
                  but their personality, preferences, fears, joys, and quirks.
                </p>
                
                <p>
                  Built across <strong className="text-gray-900">8 Life Pillars</strong> — Identity, Family, Rhythm, 
                  Home, Travel, Taste, Training, and Long Horizon — your pet&apos;s soul grows richer with every interaction.
                </p>
                
                <p>
                  The result? A platform that feels like a trusted friend who truly understands your pet, 
                  not a generic service asking the same questions every time.
                </p>
              </div>
              
              <Link to="/membership">
                <Button className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg">
                  <PawPrint className="w-5 h-5 mr-2" />
                  Start Your Pet&apos;s Soul Journey
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '🎭', name: 'Identity', desc: 'Personality & temperament' },
                    { icon: '👨‍👩‍👧‍👦', name: 'Family', desc: 'Pack dynamics & bonds' },
                    { icon: '⏰', name: 'Rhythm', desc: 'Daily routine & habits' },
                    { icon: '🏠', name: 'Home', desc: 'Comfort preferences' },
                    { icon: '✈️', name: 'Travel', desc: 'Adventure readiness' },
                    { icon: '🍖', name: 'Taste', desc: 'Food & treat likes' },
                    { icon: '🎓', name: 'Training', desc: 'Skills & behaviour' },
                    { icon: '🌅', name: 'Long Horizon', desc: 'Health & dreams' }
                  ].map((pillar, idx) => (
                    <Card key={idx} className="p-4 bg-white hover:shadow-lg transition-shadow">
                      <span className="text-2xl mb-2 block">{pillar.icon}</span>
                      <h4 className="font-semibold text-gray-900">{pillar.name}</h4>
                      <p className="text-xs text-gray-500">{pillar.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Us in Building the Future of Pet Care
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            We&apos;re not just building a platform — we&apos;re building a movement. 
            A world where every pet is truly understood, and every pet parent feels supported.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Get Your Pet Life Pass
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Talk to Mira
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">The Doggy Company</span>
          </div>
          <p className="mb-4">Built with love for pets and their parents</p>
          <p className="text-sm">© 2026 The Doggy Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
