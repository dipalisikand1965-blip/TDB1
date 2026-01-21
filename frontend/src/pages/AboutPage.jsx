import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Brain, Heart, Sparkles, Users, Clock, Shield, 
  PawPrint, Star, Eye, MessageCircle, 
  TrendingUp, Leaf, Crown
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="about-page">
      {/* Hero Section - The Vision */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8">
            <Brain className="w-4 h-4" />
            <span>The Pet Life Operating System</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            The longer a pet lives with us,
            <span className="block mt-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
              the less their parent has to explain.
            </span>
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            We&apos;re building the world&apos;s most intelligent pet care platform — one that remembers, 
            understands, and anticipates your pet&apos;s needs before you even ask.
          </p>
        </div>
      </section>

      {/* The Doctrine */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Belief</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every pet deserves to be truly understood. Not through forms and surveys, 
              but through a system that quietly pays attention.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
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
                  <MessageCircle className="w-6 h-6 text-green-600" />
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
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
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
                    { icon: '🌅', name: 'Long Horizon', desc: 'Health & milestones' }
                  ].map((pillar) => (
                    <Card key={pillar.name} className="p-4 bg-white/80 backdrop-blur">
                      <span className="text-2xl mb-2 block">{pillar.icon}</span>
                      <p className="font-semibold text-gray-900 text-sm">{pillar.name}</p>
                      <p className="text-xs text-gray-500">{pillar.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 12 Service Pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">12 Pillars of Pet Life</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From celebrations to emergencies, we&apos;ve built services around every aspect of your pet&apos;s life.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🎂', name: 'Celebrate', desc: 'Cakes, treats & parties' },
              { emoji: '🍽️', name: 'Dine', desc: 'Pet-friendly restaurants' },
              { emoji: '🛒', name: 'Shop', desc: 'Curated products' },
              { emoji: '🏨', name: 'Stay', desc: 'Hotels & boarding' },
              { emoji: '🎾', name: 'Enjoy', desc: 'Activities & fun' },
              { emoji: '💊', name: 'Care', desc: 'Health & grooming' },
              { emoji: '🏃', name: 'Fit', desc: 'Fitness & walks' },
              { emoji: '✈️', name: 'Travel', desc: 'Adventures & trips' },
              { emoji: '📋', name: 'Advisory', desc: 'Expert guidance' },
              { emoji: '📄', name: 'Paperwork', desc: 'Documents & records' },
              { emoji: '🚨', name: 'Emergency', desc: '24/7 urgent support' },
              { emoji: '👥', name: 'Community', desc: 'Connect with others' }
            ].map((pillar) => (
              <Card key={pillar.name} className="p-4 text-center hover:shadow-lg transition-shadow">
                <span className="text-3xl mb-2 block">{pillar.emoji}</span>
                <p className="font-semibold text-gray-900">{pillar.name}</p>
                <p className="text-sm text-gray-500">{pillar.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What We Stand For</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Natural</h3>
              <p className="text-gray-600">
                All products are made with natural, wholesome ingredients. No artificial preservatives, 
                colors, or flavors — ever.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Freshly Made</h3>
              <p className="text-gray-600">
                Every order is prepared fresh. No mass production, no sitting in warehouses. 
                Your pet deserves the best.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">FSSAI Approved</h3>
              <p className="text-gray-600">
                All recipes are FSSAI-approved and meet the highest standards of pet food safety and quality.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-5xl font-bold mb-2">45,000+</p>
              <p className="text-lg opacity-90">Happy Pet Parents</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">12</p>
              <p className="text-lg opacity-90">Life Pillars</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">8</p>
              <p className="text-lg opacity-90">Soul Dimensions</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">24/7</p>
              <p className="text-lg opacity-90">Mira AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built by Pet Parents, for Pet Parents</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;re a team of dog lovers who believe technology should make pet parenting easier, not more complicated.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto mb-4 flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Founding Team</h3>
              <p className="text-gray-600 text-sm mt-2">
                Started with a vision to revolutionize pet care in India
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">The Pack</h3>
              <p className="text-gray-600 text-sm mt-2">
                A passionate team across tech, operations, and pet care
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 mx-auto mb-4 flex items-center justify-center">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Our Pups</h3>
              <p className="text-gray-600 text-sm mt-2">
                The real bosses who inspired and tested everything we build
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to experience pet care that truly understands?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of pet parents who&apos;ve discovered a smarter way to care for their furry family members.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg">
                <PawPrint className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-6 text-lg"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Chat with Mira
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
