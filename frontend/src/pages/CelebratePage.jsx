/**
 * CelebratePage.jsx
 * 
 * The Celebrate pillar - Birthday celebrations, parties, and special moments for pets.
 * Features Elevated Concierge® Experiences for curated celebrations.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PartyPopper, Cake, Gift, Crown, Sparkles, Camera, Users, 
  Calendar, MapPin, ChevronRight, Star, Heart, Music,
  Palette, ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';

// Product categories for Celebrate pillar
const celebrateCategories = [
  { id: 'birthday-cakes', name: 'Birthday Cakes', icon: Cake, path: '/celebrate/birthday-cakes', color: 'bg-pink-100 text-pink-600' },
  { id: 'breed-cakes', name: 'Breed Cakes', icon: Heart, path: '/celebrate/breed-cakes', color: 'bg-purple-100 text-purple-600' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', icon: Sparkles, path: '/celebrate/pupcakes', color: 'bg-amber-100 text-amber-600' },
  { id: 'treats', name: 'Party Treats', icon: Gift, path: '/celebrate/treats', color: 'bg-green-100 text-green-600' },
  { id: 'hampers', name: 'Gift Hampers', icon: ShoppingBag, path: '/celebrate/hampers', color: 'bg-blue-100 text-blue-600' },
  { id: 'accessories', name: 'Party Accessories', icon: PartyPopper, path: '/celebrate/accessories', color: 'bg-rose-100 text-rose-600' },
];

const CelebratePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?category=cakes&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products || data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead 
        title="Celebrate - Pet Birthday Cakes & Parties | The Doggy Company"
        description="Make your pet's special day unforgettable with custom cakes, treats, and party planning services."
        path="/celebrate"
      />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1530041539828-114de669390e?w=1200"
            alt="Pet Celebration"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Floating decorations */}
        <div className="absolute top-10 left-10 text-4xl animate-bounce opacity-50">🎈</div>
        <div className="absolute top-20 right-20 text-3xl animate-pulse opacity-50">🎉</div>
        <div className="absolute bottom-10 left-1/4 text-2xl animate-bounce opacity-50" style={{animationDelay: '0.5s'}}>🎂</div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <PartyPopper className="w-5 h-5" />
            <span className="font-medium">Every Paw Deserves a Party</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Celebrate
          </h1>
          <p className="text-xl md:text-2xl text-pink-100 max-w-2xl mx-auto mb-8">
            Custom cakes, treats & unforgettable celebrations for your furry family members
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/celebrate/birthday-cakes">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-pink-50 gap-2">
                <Cake className="w-5 h-5" />
                Shop Birthday Cakes
              </Button>
            </Link>
            <Link to="/celebrate/custom-cake">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 gap-2">
                <Palette className="w-5 h-5" />
                Design Custom Cake
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {celebrateCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} to={cat.path}>
                <Card className="p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer bg-white">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{cat.name}</h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Elevated Concierge® Experiences */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 mb-4">
            <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Celebrations, Perfected
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            More than cakes. Our Celebrate Concierge® orchestrates every detail of your pet's special day - 
            from intimate gatherings to grand pawties.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Ultimate Birthday Bash®"
            description="A complete birthday celebration package with custom cake, decorations, venue, photography & entertainment."
            icon="🎉"
            gradient="from-pink-500 to-rose-500"
            badge="Signature"
            badgeColor="bg-pink-500"
            highlights={[
              "Custom themed decorations",
              "Professional pet photography",
              "Gourmet cake & treats for all guests",
              "Activity planning & coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Gotcha Day Special®"
            description="Celebrate the anniversary of when your furry friend joined your family with a meaningful experience."
            icon="💜"
            gradient="from-purple-500 to-violet-500"
            highlights={[
              "Memory book creation",
              "Professional photoshoot",
              "Custom celebration cake",
              "Special treats package"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Pawty Planning Pro®"
            description="Full-service party planning for pet birthdays, adoption anniversaries, or any celebration."
            icon="🎈"
            gradient="from-amber-500 to-orange-500"
            badge="Popular"
            badgeColor="bg-amber-500"
            highlights={[
              "Guest list management",
              "Venue sourcing & booking",
              "Catering for pets & humans",
              "Entertainment coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Puppy Shower®"
            description="Welcome a new furry family member with a beautifully organized puppy shower celebration."
            icon="🐾"
            gradient="from-cyan-500 to-teal-500"
            highlights={[
              "Baby shower style setup",
              "Gift registry coordination",
              "New parent essentials guide",
              "Photography included"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Pet Wedding Ceremony®"
            description="A magical ceremony for your pet's special union - complete with outfits, venue & photography."
            icon="💒"
            gradient="from-rose-400 to-pink-500"
            highlights={[
              "Custom pet outfits",
              "Venue decoration",
              "Pet-safe cake & treats",
              "Ceremony coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Milestone Moments®"
            description="Professional documentation of your pet's special milestones - first birthday, senior celebration, etc."
            icon="📸"
            gradient="from-indigo-500 to-purple-500"
            highlights={[
              "Professional photography session",
              "Custom milestone props",
              "Digital album creation",
              "Social media-ready photos"
            ]}
          />
        </div>
      </div>

      {/* How Concierge® Works */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            How Celebrate Concierge® Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: '💬', title: 'Share Your Vision', desc: 'Tell us about your celebration dreams' },
              { step: 2, icon: '✨', title: 'Custom Planning', desc: 'We craft a personalized celebration plan' },
              { step: 3, icon: '🎯', title: 'Perfect Execution', desc: 'Every detail handled with care' },
              { step: 4, icon: '🎉', title: 'Celebrate!', desc: 'Enjoy a stress-free, magical day' }
            ].map((item) => (
              <Card key={item.step} className="p-6 text-center bg-white">
                <div className="w-12 h-12 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="text-pink-500 font-bold mb-2">Step {item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Celebration Items</h2>
            <p className="text-gray-600">Hand-picked treats and cakes for your celebration</p>
          </div>
          <Link to="/celebrate/cakes">
            <Button variant="outline" className="gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Cake className="w-12 h-12 text-pink-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon!</h3>
            <p className="text-gray-600">Our celebration products will be available shortly.</p>
          </Card>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Plan the Pawfect Celebration?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Let our Celebrate Concierge® create an unforgettable experience for your furry friend.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-pink-600 hover:bg-pink-50 gap-2">
              <Sparkles className="w-5 h-5" />
              Ask Concierge®
            </Button>
            <Link to="/celebrate/birthday-cakes">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 gap-2">
                <ShoppingBag className="w-5 h-5" />
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebratePage;
