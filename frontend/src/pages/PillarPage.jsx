import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Clock, Bell, ArrowLeft, Sparkles, Home, UtensilsCrossed, Plane, HeartPulse, Cake, Scissors, Dog, GraduationCap, Shield, Flower2, ShoppingBag, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const pillarConfig = {
  dine: {
    name: 'Dine',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-500',
    description: 'Fresh meals, nutrition plans & premium pet food',
    features: [
      'Customised meal plans for your pet',
      'Fresh, vet-approved recipes',
      'Subscription meal delivery',
      'Nutrition consultations',
    ],
  },
  stay: {
    name: 'Stay',
    icon: Home,
    color: 'from-green-500 to-teal-500',
    description: 'Premium boarding, daycare & pet sitting',
    features: [
      'Luxury pet boarding facilities',
      'Daycare with playtime & socialization',
      'In-home pet sitting',
      'Live camera access to your pet',
    ],
  },
  travel: {
    name: 'Travel',
    icon: Plane,
    color: 'from-blue-500 to-cyan-500',
    description: 'Pet-friendly adventures & travel planning',
    features: [
      'Pet-friendly destination guides',
      'Travel accessories & gear',
      'Pet relocation services',
      'Adventure trip planning',
    ],
  },
  care: {
    name: 'Care',
    icon: HeartPulse,
    color: 'from-red-500 to-pink-500',
    description: 'Health, wellness & veterinary services',
    features: [
      'Vet consultations (online & offline)',
      'Health checkup packages',
      'Pet insurance partnerships',
      'Wellness & grooming services',
    ],
  },
  celebrate: {
    name: 'Celebrate',
    icon: Cake,
    color: 'from-pink-500 to-purple-600',
    description: 'Cakes, treats & party essentials',
    features: [
      'Custom birthday cakes',
      'Healthy treats & biscuits',
      'Party supplies & accessories',
      'Gift hampers',
    ],
    isActive: true,
    redirectTo: '/cakes',
  },
  feed: {
    name: 'Feed',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-amber-500',
    description: 'Premium nutrition & fresh meals',
    features: [
      'Fresh, human-grade meals',
      'Customised nutrition plans',
      'Prescription diet support',
      'Subscription delivery',
    ],
  },
  groom: {
    name: 'Groom',
    icon: Scissors,
    color: 'from-violet-500 to-purple-500',
    description: 'Professional grooming & spa services',
    features: [
      'Full grooming packages',
      'Breed-specific styling',
      'Spa treatments & massages',
      'At-home grooming visits',
    ],
  },
  play: {
    name: 'Play',
    icon: Dog,
    color: 'from-green-500 to-emerald-500',
    description: 'Toys, activities & enrichment',
    features: [
      'Interactive toys & puzzles',
      'Outdoor play equipment',
      'Subscription toy boxes',
      'Activity recommendations',
    ],
  },
  train: {
    name: 'Train',
    icon: GraduationCap,
    color: 'from-indigo-500 to-purple-500',
    description: 'Professional training & behavior',
    features: [
      'Puppy training classes',
      'Behaviour modification',
      'Agility & tricks training',
      'Virtual training sessions',
    ],
  },
  insure: {
    name: 'Insure',
    icon: Shield,
    color: 'from-slate-500 to-gray-600',
    description: 'Pet insurance & protection plans',
    features: [
      'Comprehensive health coverage',
      'Accident & illness protection',
      'Wellness plan add-ons',
      'Multi-pet discounts',
    ],
  },
  adopt: {
    name: 'Adopt',
    icon: Dog,
    color: 'from-rose-500 to-pink-500',
    description: 'Find your perfect furry companion',
    features: [
      'Shelter partnerships',
      'Adoption counseling',
      'Foster programs',
      'Post-adoption support',
    ],
  },
  farewell: {
    name: 'Farewell',
    icon: Flower2,
    color: 'from-purple-500 to-indigo-500',
    description: 'Compassionate end-of-life care',
    features: [
      'Hospice & palliative care',
      'Memorial services',
      'Cremation options',
      'Grief support resources',
    ],
  },
  shop: {
    name: 'Shop',
    icon: ShoppingBag,
    color: 'from-teal-500 to-cyan-500',
    description: 'Everything your pet needs',
    features: [
      'Premium food & treats',
      'Toys & accessories',
      'Health & wellness products',
      'Exclusive member discounts',
    ],
    isActive: true,
    redirectTo: '/all',
  },
  community: {
    name: 'Community',
    icon: Users,
    color: 'from-yellow-500 to-amber-500',
    description: 'Connect with fellow pet parents',
    features: [
      'Pet parent meetups',
      'Online forums & groups',
      'Events & workshops',
      'Expert Q&A sessions',
    ],
  },
};

const PillarPage = () => {
  const { pillarId } = useParams();
  const location = useLocation();
  
  // Detect pillar from URL path if no param
  const detectedPillar = pillarId || location.pathname.replace('/', '');
  const pillar = pillarConfig[detectedPillar] || pillarConfig.dine;
  const Icon = pillar.icon;

  // If pillar is active, redirect to main page
  if (pillar.isActive && pillar.redirectTo) {
    window.location.href = pillar.redirectTo;
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-r ${pillar.color} text-white py-20 px-4 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)'}} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Coming Soon</span>
          </div>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Icon className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pillar.name}</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            {pillar.description}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            We're building something amazing!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The Doggy Company is expanding to bring you the ultimate Pet Life Operating System. 
            {pillar.name} is coming soon with these exciting features:
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {pillar.features.map((feature, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${pillar.color}`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{feature}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Notify Me Section */}
        <Card className="p-8 text-center bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
          <Bell className="w-12 h-12 mx-auto text-purple-600 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Be the first to know!
          </h3>
          <p className="text-gray-600 mb-6">
            Sign up to get notified when {pillar.name} launches
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button className={`bg-gradient-to-r ${pillar.color} hover:opacity-90 text-white px-6`}>
              Notify Me
            </Button>
          </div>
        </Card>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PillarPage;
