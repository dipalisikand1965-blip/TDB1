import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, 
  PawPrint, Quote, Crown
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section */}
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
            Care That Came
            <span className="block mt-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
              Before The Company
            </span>
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            At the heart of Mira, The Doggy Bakery, and The Doggy Company is one person who taught us what care truly means.
          </p>
        </div>
      </section>

      {/* Mira's Story - The Real Story */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mira
            </h2>
            <p className="text-purple-600 font-medium">The Quiet Standard Behind Everything We Build</p>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed space-y-6">
            <p>
              At the heart of Mira, The Doggy Bakery, and The Doggy Company is <strong className="text-gray-900">Mira — Dipali&apos;s mother</strong>.
            </p>
            
            <p>
              Long before any of these brands existed, she embodied a way of caring that was instinctive, attentive, and deeply personal. She believed in <em>noticing without being asked</em>, in <em>remembering what mattered</em>, and in <em>showing up quietly but completely</em>.
            </p>
            
            <p className="text-center py-4">
              <span className="text-xl text-purple-700 font-medium italic">
                For her, care was never a transaction.<br />
                It was responsibility carried with grace.
              </span>
            </p>
            
            <p>
              That spirit first found expression in <strong className="text-gray-900">The Doggy Bakery</strong> — where celebrating pets was never about products alone, but about honouring moments, routines, and bonds. Serving over <strong className="text-gray-900">45,000 pets</strong>, the bakery grew not because of novelty, but because pet parents felt understood.
            </p>
            
            <p>
              The same spirit later shaped the <strong className="text-gray-900">concierge philosophy</strong> — where service is defined not by speed or scale, but by memory, judgement, and continuity.
            </p>
            
            <p>
              <strong className="text-gray-900">The Doggy Company</strong> brings these threads together. It takes the emotional intelligence learned through years of celebrating pets, and the discipline of concierge care, and builds a system designed to hold relationships over a lifetime.
            </p>
          </div>
        </div>
      </section>

      {/* The Doctrine / North Star */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Quote className="w-10 h-10 mx-auto text-purple-400 mb-6" />
          <blockquote className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
            Mira is not just a name.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
              She is the reason care comes before convenience,<br />
              memory before automation,<br />
              and relationships before transactions.
            </span>
          </blockquote>
          <p className="text-purple-300 text-lg">
            She remains the quiet standard behind everything we build.
          </p>
        </div>
      </section>

      {/* The Team */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Users className="w-10 h-10 mx-auto text-purple-500 mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Team
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
            {/* Dipali */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Dipali</h3>
              <p className="text-purple-600 font-medium text-sm mb-3">Creator, Les Concierge & Club Concierge</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Registered trademark holder with 30 years of understanding that true service is about memory, judgement, and showing up completely.
              </p>
            </Card>

            {/* Aditya */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Aditya</h3>
              <p className="text-purple-600 font-medium text-sm mb-3">Founder, The Doggy Bakery</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Built The Doggy Bakery to celebrate 45,000+ pets — not with products, but by honouring the moments and bonds that matter.
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

      {/* Pet Soul Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Pet Soul™ Technology
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Building What Mira Taught Us
          </h2>
          
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-4">
            <strong className="text-gray-900">Pet Soul™</strong> is our attempt to encode the philosophy Mira lived by — 
            a system that notices without being asked, remembers what matters, and shows up quietly but completely.
          </p>
          
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            It&apos;s a living profile that captures who your pet truly is — their personality, preferences, fears, joys, and quirks — 
            so you never have to explain twice.
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
              <Card key={idx} className="p-3 bg-white hover:shadow-md transition-shadow border">
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

      {/* Final Quote */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Quote className="w-8 h-8 mx-auto text-white/50 mb-4" />
          <p className="text-2xl font-medium mb-6 leading-relaxed">
            &quot;The longer a pet lives with us,<br />
            the less their parent has to explain.&quot;
          </p>
          <p className="text-white/70">
            This is our North Star. Every feature, every interaction, every decision is measured against this simple truth.
          </p>
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
