import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, 
  PawPrint, Quote, ArrowRight, Crown
} from 'lucide-react';

const AboutPage = () => {
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

      {/* The Beginning - Mira's Story */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <PawPrint className="w-12 h-12 mx-auto text-purple-500 mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              It All Started with Mira
            </h2>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed space-y-6">
            <p>
              Mira wasn&apos;t just a dog — she was family. And like any family member, 
              she deserved to be understood, not explained. Every vet visit, every groomer, 
              every hotel stay — we found ourselves repeating the same things: 
              &quot;She&apos;s anxious around loud sounds&quot;, &quot;She has a chicken allergy&quot;, 
              &quot;She needs her blanket to sleep&quot;.
            </p>
            <p className="text-center text-xl text-purple-700 font-medium">
              Why wasn&apos;t there a system that just... knew her?
            </p>
            <p>
              That question became our mission. That mission became The Doggy Company.
            </p>
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

      {/* The Team - Simple Credits */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Users className="w-12 h-12 mx-auto text-purple-500 mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Souls Behind The System
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A registered concierge, a bakery founder, and the spirit of one very special dog 
              — together building the world&apos;s first Pet Life Operating System.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Mira */}
            <Card className="p-8 text-center bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mira</h3>
              <p className="text-purple-600 font-medium text-sm mb-3">The Soul & Inspiration</p>
              <p className="text-gray-600 text-sm">
                The spirit behind everything we do. She taught us that every pet deserves to be truly understood.
              </p>
            </Card>

            {/* Dipali */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Dipali</h3>
              <p className="text-purple-600 font-medium text-sm mb-3">Keeper of the Concierge</p>
              <p className="text-gray-600 text-sm">
                Holder of India&apos;s first registered Concierge license. She believes service is an art, and pets deserve nothing less than perfection.
              </p>
            </Card>

            {/* Aditya */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Aditya</h3>
              <p className="text-purple-600 font-medium text-sm mb-3">Founder</p>
              <p className="text-gray-600 text-sm">
                Started baking treats for his own dogs and couldn&apos;t stop. Now building the Pet Life Operating System to give every pet parent the care their fur babies deserve.
              </p>
            </Card>
          </div>

          {/* Extended Team */}
          <div className="text-center">
            <Card className="inline-block px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-center justify-center gap-4">
                <div className="flex -space-x-3">
                  {['A','P','S','R','M'].map((letter, i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                    >
                      {letter}
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

      {/* What We Believe */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What We Believe</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These aren&apos;t just principles — they&apos;re promises we make to every pet and pet parent.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Recognition Over Asking</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                If it ever feels like a CRM, we&apos;ve failed. Our system remembers your pet&apos;s preferences, 
                allergies, favorite treats, and care history — so you never have to repeat yourself.
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Progressive Intelligence</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every order, every chat with Mira, every booking teaches us something new. 
                The more you use us, the smarter we get about your pet.
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Care, Not Commerce</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We don&apos;t push products. We understand your pet&apos;s needs and surface what&apos;s truly helpful. 
                If your pet has grain allergies, you&apos;ll never see grain products.
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mira Knows Your Pet</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our AI concierge, Mira, doesn&apos;t just answer questions — she knows your pet personally. 
                Ask her anything, and she&apos;ll give you personalized, context-aware guidance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pet Soul Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Pet Soul™ Technology
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Your Pet&apos;s Evolving Digital Identity
          </h2>
          
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            <strong className="text-gray-900">Pet Soul™</strong> is the heart of everything we do. 
            It&apos;s a living, evolving profile that captures who your pet truly is — not just their breed and age, 
            but their personality, preferences, fears, joys, and quirks.
          </p>
          
          {/* 8 Pillars Grid */}
          <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto mb-8">
            {[
              { icon: '🎭', name: 'Identity' },
              { icon: '👨‍👩‍👧‍👦', name: 'Family' },
              { icon: '⏰', name: 'Rhythm' },
              { icon: '🏠', name: 'Home' },
              { icon: '✈️', name: 'Travel' },
              { icon: '🍖', name: 'Taste' },
              { icon: '🎓', name: 'Training' },
              { icon: '🌅', name: 'Long Horizon' }
            ].map((pillar, idx) => (
              <Card key={idx} className="p-3 bg-white hover:shadow-md transition-shadow">
                <span className="text-2xl mb-1 block">{pillar.icon}</span>
                <span className="text-xs font-medium text-gray-700">{pillar.name}</span>
              </Card>
            ))}
          </div>
          
          <Link to="/membership">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg">
              <PawPrint className="w-5 h-5 mr-2" />
              Start Your Pet&apos;s Soul Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Join Us in Building the Future of Pet Care
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            We&apos;re not just building a platform — we&apos;re building a movement. 
            A world where every pet is truly understood, and every pet parent feels supported.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                <Crown className="w-5 h-5 mr-2" />
                Get Your Pet Life Pass
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8"
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
