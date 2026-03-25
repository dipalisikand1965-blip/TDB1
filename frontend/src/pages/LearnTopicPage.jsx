/**
 * LearnTopicPage.jsx
 * Generic topic hub page for Learn pillar
 * 
 * Each topic page contains:
 * - Quick explanation
 * - Videos
 * - Product suggestions
 * - Services
 * - Concierge® help
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  ChevronLeft, ChevronRight, Play, ShoppingBag, Users,
  MessageCircle, BookOpen, Loader2, ArrowRight
} from 'lucide-react';

// Topic configurations with content
const TOPIC_CONFIG = {
  'puppy-basics': {
    title: 'Puppy Basics',
    icon: '🐕',
    color: 'pink',
    description: 'Everything you need to know about raising a happy, healthy puppy from day one.',
    topics: [
      'First week at home',
      'Toilet training',
      'Feeding schedule',
      'Puppy sleep routine',
      'Teething',
      'Socialization basics'
    ],
    videoKeywords: ['bringing puppy home', 'crate training', 'puppy biting'],
    productCategories: ['puppy starter kit', 'pee pads', 'teething toys', 'puppy bowls'],
    services: ['Puppy training', 'Vet first visit guidance']
  },
  'breed-guides': {
    title: 'Breed Guides',
    icon: '🐾',
    color: 'blue',
    description: 'Understand the unique traits, needs, and care requirements of different dog breeds.',
    topics: [
      'Labrador',
      'Shih Tzu',
      'Indie',
      'Golden Retriever',
      'Pug',
      'German Shepherd'
    ],
    videoKeywords: ['labrador care', 'breed guide'],
    productCategories: ['shedding brush', 'slow feeder', 'harness', 'cooling mat'],
    services: ['Breed-specific consultation']
  },
  'food-feeding': {
    title: 'Food & Feeding',
    icon: '🥣',
    color: 'orange',
    description: 'Learn about proper nutrition, feeding schedules, and healthy diet choices for your dog.',
    topics: [
      'How much to feed',
      'Feeding schedules',
      'Puppy vs adult diet',
      'Healthy treats',
      'Hydration'
    ],
    videoKeywords: ['feeding routine', 'slow feeder usage'],
    productCategories: ['slow feeder bowls', 'lick mats', 'feeding mats', 'treat jars', 'food storage'],
    services: ['Nutrition consultation']
  },
  'grooming': {
    title: 'Grooming',
    icon: '✂️',
    color: 'purple',
    description: 'Master grooming techniques for brushing, bathing, nail care, and coat maintenance.',
    topics: [
      'Brushing basics',
      'Bathing guide',
      'Nail trimming',
      'Ear cleaning',
      'Coat care by breed'
    ],
    videoKeywords: ['brushing long coat', 'grooming double coats'],
    productCategories: ['brushes', 'combs', 'towels', 'shampoo', 'ear wipes', 'eye wipes'],
    services: ['Groomers near me', 'Grooming consultation']
  },
  'behavior': {
    title: 'Behavior',
    icon: '💡',
    color: 'yellow',
    description: 'Understand and address common behavioral issues like barking, anxiety, and more.',
    topics: [
      'Barking',
      'Chewing',
      'Anxiety',
      'Separation issues',
      'Hyperactivity',
      'Fear responses'
    ],
    videoKeywords: ['calming anxious dogs', 'stopping chewing'],
    productCategories: ['enrichment toys', 'chew toys', 'calming mats'],
    services: ['Behavior trainers', 'Behavior consultation']
  },
  'training-basics': {
    title: 'Training Basics',
    icon: '🎾',
    color: 'green',
    description: 'Learn fundamental training techniques for obedience, commands, and leash walking.',
    topics: [
      'Sit command',
      'Stay command',
      'Recall training',
      'Leash walking',
      'House rules'
    ],
    videoKeywords: ['basic commands', 'leash training'],
    productCategories: ['training treats', 'clicker', 'training leash', 'treat pouch'],
    services: ['Trainers near me', 'Training consultation']
  },
  'travel-with-dogs': {
    title: 'Travel with Dogs',
    icon: '🚗',
    color: 'sky',
    description: 'Prepare for safe and stress-free travel with your dog, whether by car or plane.',
    topics: [
      'Road trips',
      'Flight preparation',
      'Travel anxiety',
      'Packing checklist',
      'Travel safety'
    ],
    videoKeywords: ['preparing dogs for travel'],
    productCategories: ['travel bowls', 'carriers', 'harness', 'seat belt harness', 'travel kits'],
    services: ['Travel concierge']
  },
  'senior-dog-care': {
    title: 'Senior Dog Care',
    icon: '🦮',
    color: 'amber',
    description: 'Caring for your aging companion with comfort, health, and mobility support.',
    topics: [
      'Mobility support',
      'Arthritis care',
      'Diet changes',
      'Slower exercise',
      'Comfort routines'
    ],
    videoKeywords: ['caring for older dogs'],
    productCategories: ['orthopedic beds', 'support harness', 'raised feeders', 'joint supplements'],
    services: ['Physiotherapy', 'Vet consult']
  },
  'health-basics': {
    title: 'Health Basics',
    icon: '➕',
    color: 'red',
    description: 'Essential health knowledge including vaccinations, dental care, and basic first aid.',
    topics: [
      'Vaccination schedule',
      'Parasite prevention',
      'Dental care',
      'Basic symptoms',
      'Hydration'
    ],
    videoKeywords: ['basic health checks'],
    productCategories: ['dental chews', 'toothbrush', 'grooming wipes'],
    services: ['Vets near me']
  },
  'rescue-indie-care': {
    title: 'Rescue / Indie Care',
    icon: '🏡',
    color: 'teal',
    description: 'Special guidance for adopted dogs and indie breeds adjusting to their new home.',
    topics: [
      'Settling rescue dogs',
      'Trust building',
      'Trauma behaviour',
      'Routine building'
    ],
    videoKeywords: ['helping rescued dog settle'],
    productCategories: ['calming beds', 'chew toys', 'enrichment toys'],
    services: ['Behaviour help', 'Adoption support']
  },
  'seasonal-care': {
    title: 'Seasonal Care',
    icon: '☀️',
    color: 'yellow',
    description: 'Weather-specific care tips to keep your dog comfortable throughout the year.',
    topics: [
      'Summer: Heat stroke prevention',
      'Summer: Hydration',
      'Summer: Walking times',
      'Monsoon: Paw infections',
      'Monsoon: Drying routines',
      'Winter: Warmth',
      'Winter: Senior joint care'
    ],
    videoKeywords: ['summer dog care', 'winter dog care'],
    productCategories: ['cooling mats', 'paw balm', 'raincoats', 'blankets'],
    services: ['Seasonal consultation']
  },
  'new-pet-parent-guide': {
    title: 'New Pet Parent Guide',
    icon: '💕',
    color: 'pink',
    description: 'Your complete starter guide to welcoming a new dog into your family.',
    topics: [
      'First supplies checklist',
      'First vet visit',
      'Feeding setup',
      'Sleep area',
      'Training basics'
    ],
    videoKeywords: ['bringing dog home', 'home preparation'],
    productCategories: ['starter kits', 'bowls', 'beds', 'leash and collar'],
    services: ['New pet consultation']
  }
};

const LearnTopicPage = () => {
  const { topicSlug } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState([]);
  
  const config = TOPIC_CONFIG[topicSlug];
  
  // Redirect if invalid topic
  useEffect(() => {
    if (!config) {
      navigate('/learn');
    } else {
      setLoading(false);
    }
  }, [topicSlug, config, navigate]);
  
  // Fetch products for this topic
  useEffect(() => {
    if (config?.productCategories?.[0]) {
      fetch(`${API_URL}/api/products?search=${encodeURIComponent(config.productCategories[0])}&limit=4`)
        .then(res => res.json())
        .then(data => setProducts(data.products || []))
        .catch(console.error);
    }
  }, [config]);
  
  if (!config || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  return (
    <PillarPageLayout
      pillar="learn"
      title={`${config.title} | Learn | The Doggy Company`}
      description={config.description}
    >
      {/* Breadcrumb */}
      <div className="bg-stone-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/learn')}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Learn
          </button>
        </div>
      </div>
      
      {/* Hero */}
      <section className={`py-12 px-4 bg-gradient-to-br from-${config.color}-50 to-${config.color}-100`}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-5xl mb-4 block">{config.icon}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{config.title}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{config.description}</p>
        </div>
      </section>
      
      {/* Topics */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            What's Covered
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {config.topics.map((topic, idx) => (
              <Card key={idx} className="p-4 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-sm text-gray-700">{topic}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Videos */}
      <section className="py-10 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" />
            Watch & Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.videoKeywords.map((keyword, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                <div className="relative aspect-video bg-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-200">
                    <span className="text-4xl opacity-50">📺</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-gray-800 ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm capitalize">{keyword}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Products */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            Products That Help
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {config.productCategories.map((cat, idx) => (
              <Badge 
                key={idx} 
                variant="outline"
                className="cursor-pointer hover:bg-amber-50 capitalize"
                onClick={() => navigate(`/shop?search=${encodeURIComponent(cat)}`)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(`/shop?pillar=learn`)}
            className="gap-2"
          >
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
      
      {/* Services */}
      <section className="py-10 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            Services That Help
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.services.map((service, idx) => (
              <Card key={idx} className="p-5 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                    {service}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Concierge® Help */}
      <section className="py-10 px-4 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-600" />
            Need Personal Help?
          </h2>
          <p className="text-gray-600 mb-6">Our concierge team can guide you through {config.title.toLowerCase()} for your specific dog.</p>
          <Button 
            className="bg-teal-600 hover:bg-teal-700 gap-2"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: { context: 'concierge', topic: config.title }
              }));
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Ask Concierge®
          </Button>
        </div>
      </section>
    </PillarPageLayout>
  );
};

export default LearnTopicPage;
