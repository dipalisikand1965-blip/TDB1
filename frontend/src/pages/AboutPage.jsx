import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Heart, Star, Award, Users, Crown, PawPrint, Sparkles,
  ArrowRight, Building, Calendar, Globe, Shield, Target
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">World's First Pet Concierge®</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            The Doggy Company
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto mb-8">
            A 75-year legacy of love, a mother's pioneering spirit, and a son's passion — 
            united to create India's first complete Pet Life Operating System.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold">1998</p>
              <p className="text-sm text-white/70">Les Concierges® Founded</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">75+</p>
              <p className="text-sm text-white/70">Years of Pet Care Legacy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-white/70">Pet Life Pillars</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">45K+</p>
              <p className="text-sm text-white/70">Happy Pet Parents</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Legacy Section - Mira Sikand */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-full mb-6">
                <Heart className="w-5 h-5 text-pink-600" />
                <span className="text-pink-700 text-sm font-medium">Where It All Began</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Mira Sikand: The Heart Behind It All
              </h2>
              
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  For over <strong>75 years</strong>, our beloved matriarch <strong>Mira Sikand</strong> dedicated 
                  her life to the care and feeding of dogs. From the streets of India to her own home, 
                  she developed time-honored recipes and care practices that became the foundation of 
                  our family's love for canines.
                </p>
                <p>
                  Her wisdom, passed down through generations, taught us that dogs don't just deserve 
                  our care — they deserve our <em>best</em>. Her recipes, her compassion, and her 
                  unwavering belief that every dog deserves to feel special became the soul of everything we do.
                </p>
                <p className="text-purple-600 font-semibold italic">
                  "Every dog deserves to feel loved. Not just the ones with homes — every single one."
                  <br />— Mira Sikand
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-pink-200 to-purple-200 rounded-3xl transform rotate-3"></div>
              <Card className="relative p-8 bg-white">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <Heart className="w-16 h-16 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Mira Sikand</h3>
                  <p className="text-gray-500 mb-4">The Inspirational Matriarch</p>
                  <div className="bg-pink-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">
                      Her 75 years of recipes and wisdom form the backbone of The Doggy Bakery. 
                      The AI assistant "Mira" is named in her honor — carrying forward her spirit 
                      of unconditional love and care for all dogs.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Pioneer Section - Dipali Sikand */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Card className="p-8 bg-white shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Crown className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Dipali Sikand</h3>
                  <p className="text-gray-500">Founder, Les Concierges® & Club Concierge®</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Building className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Les Concierges®</p>
                      <p className="text-sm text-gray-500">World's First Corporate Concierge (1998)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">1.5M+ Employees Served</p>
                      <p className="text-sm text-gray-500">Across 1,300 sites in 17 cities globally</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900">Concierge® Trademark Holder</p>
                      <p className="text-sm text-gray-500">Registered trademark in India since 2016</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-6">
                <Crown className="w-5 h-5 text-purple-600" />
                <span className="text-purple-700 text-sm font-medium">The Pioneer</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Dipali Sikand: Creating the Concierge® Industry
              </h2>
              
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  In <strong>1998</strong>, with just ₹5,000, <strong>Dipali Sikand</strong> founded 
                  <strong> Les Concierges®</strong> — the <em>world's first corporate concierge program</em>. 
                  What started as a vision to help employees balance work and life has grown into a global 
                  empire serving over 1.5 million people.
                </p>
                <p>
                  Her company <strong>Club Concierge®</strong> serves high-net-worth individuals and royalty, 
                  while holding the exclusive <strong>registered trademark for "Concierge®" in India</strong>.
                </p>
                <p>
                  When her son Aditya wanted to create something special for pets, she saw an opportunity 
                  to bring the same world-class concierge experience to a new audience — pet parents who 
                  treat their furry friends like family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Torchbearer Section - Aditya Sikand */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
                <Star className="w-5 h-5 text-amber-600" />
                <span className="text-amber-700 text-sm font-medium">The Torchbearer</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Aditya Sikand: From Bakery to Operating System
              </h2>
              
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  <strong>Aditya Sikand</strong> started <strong>The Doggy Bakery</strong> with his grandmother's 
                  75-year-old recipes, baking fresh, preservative-free treats that dogs absolutely love.
                </p>
                <p>
                  But as he served more and more pet parents, he realized something: they didn't just want 
                  birthday cakes. They wanted <em>everything</em> — restaurants that welcomed their pets, 
                  hotels for family vacations, travel assistance, grooming, health records, emergency help.
                </p>
                <p>
                  Combining his grandmother Mira's legacy of love, his mother Dipali's pioneering 
                  Concierge® expertise, and his own passion for innovation, Aditya transformed 
                  The Doggy Bakery into <strong>The Doggy Company</strong> — India's first and the 
                  world's most comprehensive Pet Life Operating System.
                </p>
              </div>
            </div>
            
            <div>
              <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-center mb-6">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <PawPrint className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Aditya Sikand</h3>
                  <p className="text-gray-500">Founder, The Doggy Company</p>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="font-bold text-2xl text-amber-600">2020</p>
                    <p className="text-sm text-gray-500">Founded The Doggy Bakery</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="font-bold text-2xl text-amber-600">12</p>
                    <p className="text-sm text-gray-500">Pillars of Pet Life</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="font-bold text-2xl text-amber-600">3</p>
                    <p className="text-sm text-gray-500">Cities (Mumbai, Bangalore, Gurugram)</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
            <Target className="w-5 h-5 text-pink-400" />
            <span className="text-sm font-medium">Our Vision</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            World's First Pet Concierge®
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12">
            We dream of a world where every pet — whether in a loving home or on the streets — 
            feels cherished. That's why 10% of every sale goes to our <strong>'Streats' program</strong>, 
            feeding and caring for street dogs across India.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Heart, title: 'Reciprocating Love', desc: 'Helping pet parents express love through our services' },
              { icon: Shield, title: 'Health & Wellbeing', desc: 'Every service promotes pet health and happiness' },
              { icon: Star, title: 'Celebrating Joy', desc: 'Creating special moments in pets\' lives' },
              { icon: Users, title: 'Community', desc: '10% to Streats program for street dogs' }
            ].map((item, idx) => (
              <Card key={idx} className="p-6 bg-white/10 backdrop-blur border-white/20 text-white">
                <item.icon className="w-10 h-10 mx-auto mb-4 text-pink-400" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-white/70">{item.desc}</p>
              </Card>
            ))}
          </div>
          
          <Link to="/membership">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
              Join the Family <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Concierge® Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why "Concierge®"?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              It's not just a name — it's our registered trademark and our promise.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Registered Trademark</h3>
              <p className="text-gray-600 text-sm">
                "Concierge®" is the registered trademark of Club Concierge® in India — 
                held by Dipali Sikand since 2016, protected by intellectual property law.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Named After Mira</h3>
              <p className="text-gray-600 text-sm">
                Our AI assistant "Mira" is named after Mira Sikand — the grandmother whose 
                75 years of love and wisdom inspired everything we do.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">World's First</h3>
              <p className="text-gray-600 text-sm">
                The Doggy Company is the world's first Pet Concierge® — 
                a complete operating system for your pet's entire life.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Experience the Concierge® Difference?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 45,000+ pet parents who trust The Doggy Company for everything their fur babies need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Become a Member <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="mr-2 w-5 h-5" /> Chat with Mira
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
