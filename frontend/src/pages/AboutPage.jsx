import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Heart, Star, Award, Users, Crown, PawPrint, Sparkles,
  ArrowRight, Shield, Target, ChevronRight
} from 'lucide-react';
import { API_URL } from '../utils/api';

const AboutPage = () => {
  const [team, setTeam] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/about/content`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team || []);
        setDogs(data.dogs || []);
      }
    } catch (error) {
      console.error('Failed to fetch about content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section - Mission Focused */}
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
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-4">
            Because every dog deserves to feel special.
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            A complete Pet Life Operating System built on 75 years of love, recipes, and the pioneering spirit of the Concierge® industry.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-center px-6">
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-white/70">Pet Life Pillars</p>
            </div>
            <div className="text-center px-6">
              <p className="text-3xl font-bold">45K+</p>
              <p className="text-sm text-white/70">Happy Pet Parents</p>
            </div>
            <div className="text-center px-6">
              <p className="text-3xl font-bold">10%</p>
              <p className="text-sm text-white/70">To Street Dogs</p>
            </div>
            <div className="text-center px-6">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-white/70">Concierge® Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                To reciprocate the unconditional love our pets give us — through fresh treats baked with 75-year-old recipes, 
                seamless services across all 12 pillars of pet life, and the world's first Pet Concierge® that remembers 
                and anticipates every need.
              </p>
            </Card>
            
            <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                A world where every pet — whether in a loving home or on the streets — feels cherished. 
                That's why 10% of every sale goes to our <strong>Streats program</strong>, feeding and caring 
                for street dogs across India. Because every dog deserves love.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* The Real Stars - Dogs Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
              <PawPrint className="w-5 h-5 text-pink-400" />
              <span className="text-sm font-medium">The Real Stars</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Meet Our Furry Team Members
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              The dogs who taste-test every recipe, supervise every operation, and remind us daily why we do what we do.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto"></div>
            </div>
          ) : dogs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.filter(d => d.is_active).map((dog) => (
                <Card key={dog.id} className="overflow-hidden bg-white/10 backdrop-blur border-white/20 text-white">
                  {dog.image && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={dog.image} 
                        alt={dog.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{dog.emoji}</span>
                      <h3 className="text-xl font-bold">{dog.name}</h3>
                    </div>
                    <p className="text-pink-300 text-sm mb-3">{dog.breed} • {dog.role}</p>
                    <p className="text-white/80 text-sm">{dog.story}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/60">
              <PawPrint className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Our furry team members are being photographed...</p>
            </div>
          )}
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-6">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 text-sm font-medium">Our Human Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The People Behind the Magic
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From bakers to concierges, nutritionists to care specialists — meet the passionate people who make it all happen.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto"></div>
            </div>
          ) : team.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.filter(t => t.is_active).map((member) => (
                <Card key={member.id} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl">
                    {member.emoji}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-purple-600 text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Team profiles coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* Our Story - Compact Family Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
            <p className="text-gray-600">Three generations united by love for dogs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center bg-pink-50 border-0">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Mira Sikand</h3>
              <p className="text-pink-600 text-sm mb-2">The Inspiration</p>
              <p className="text-gray-600 text-sm">
                75 years of pet care recipes and wisdom. The grandmother whose love inspired it all — 
                and whom our AI assistant Mira is named after.
              </p>
            </Card>
            
            <Card className="p-6 text-center bg-purple-50 border-0">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Dipali Sikand</h3>
              <p className="text-purple-600 text-sm mb-2">The Pioneer</p>
              <p className="text-gray-600 text-sm">
                Created the world's first corporate concierge (Les Concierges®, 1998). 
                Holds the Concierge® trademark in India.
              </p>
            </Card>
            
            <Card className="p-6 text-center bg-amber-50 border-0">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <PawPrint className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Aditya Sikand</h3>
              <p className="text-amber-600 text-sm mb-2">The Torchbearer</p>
              <p className="text-gray-600 text-sm">
                Combined grandmother's recipes with mother's concierge expertise to build 
                The Doggy Company — the world's first Pet Concierge®.
              </p>
            </Card>
          </div>
          
          <p className="text-center text-gray-500 mt-8 text-sm italic">
            "But the real credit goes to our team and our dogs — they make the magic happen every day."
          </p>
        </div>
      </section>

      {/* Why Concierge® Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why "Pet Concierge®"?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Registered Trademark</h3>
              <p className="text-gray-600 text-sm">
                "Concierge®" is the registered trademark of Club Concierge® in India — 
                a legacy of excellence since 1998.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Mira's Spirit</h3>
              <p className="text-gray-600 text-sm">
                Our AI assistant "Mira" carries the spirit of Mira Sikand — 
                her wisdom, her recipes, her unconditional love for all dogs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">World's First</h3>
              <p className="text-gray-600 text-sm">
                The Doggy Company is the world's first Pet Concierge® — 
                a complete operating system for your pet's entire life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Join the Family?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Experience the world's first Pet Concierge® — where every interaction makes your pet's life better.
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
