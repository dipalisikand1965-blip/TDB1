/**
 * LearnTopicModal.jsx
 * Beautiful popup modal for Learn topics
 * Opens on same page with tabs: Overview | Videos | Products | Services
 * "Send to Concierge" button at bottom
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { API_URL } from '../../utils/api';
import {
  X, BookOpen, Play, ShoppingBag, Users, MessageCircle,
  ChevronRight, ExternalLink, Loader2
} from 'lucide-react';

// Topic configurations
const TOPIC_CONFIG = {
  'puppy-basics': {
    title: 'Puppy Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png',
    color: 'pink',
    description: 'Everything you need to know about raising a happy, healthy puppy.',
    topics: ['First week at home', 'Toilet training', 'Feeding schedule', 'Sleep routine', 'Teething', 'Socialization'],
    videos: [
      { title: 'Bringing Your Puppy Home', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Crate Training 101', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&q=80' },
      { title: 'Stop Puppy Biting', duration: '6 min', thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' }
    ],
    products: ['Puppy Starter Kit', 'Pee Pads', 'Teething Toys', 'Puppy Bowls'],
    services: ['Puppy Training Session', 'First Vet Visit Guidance', 'Puppy Socialization Class']
  },
  'breed-guides': {
    title: 'Breed Guides',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png',
    color: 'blue',
    description: 'Understand the unique traits and care needs of different dog breeds.',
    topics: ['Labrador', 'Shih Tzu', 'Indie', 'Golden Retriever', 'Pug', 'German Shepherd'],
    videos: [
      { title: 'Labrador Care Guide', duration: '15 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Indie Dog Care', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80' }
    ],
    products: ['Shedding Brush', 'Slow Feeder', 'Breed-Specific Harness', 'Cooling Mat'],
    services: ['Breed Consultation', 'Grooming for Your Breed']
  },
  'food-feeding': {
    title: 'Food & Feeding',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png',
    color: 'orange',
    description: 'Learn about proper nutrition, feeding schedules, and healthy diet choices.',
    topics: ['How much to feed', 'Feeding schedules', 'Puppy vs adult diet', 'Healthy treats', 'Hydration'],
    videos: [
      { title: 'Building a Feeding Routine', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Slow Feeder Benefits', duration: '5 min', thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' }
    ],
    products: ['Slow Feeder Bowls', 'Lick Mats', 'Feeding Mats', 'Treat Jars', 'Food Storage'],
    services: ['Nutrition Consultation', 'Diet Planning']
  },
  'grooming': {
    title: 'Grooming',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png',
    color: 'purple',
    description: 'Master grooming techniques for brushing, bathing, nail care, and coat maintenance.',
    topics: ['Brushing basics', 'Bathing guide', 'Nail trimming', 'Ear cleaning', 'Coat care by breed'],
    videos: [
      { title: 'Brushing Long Coats', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Double Coat Grooming', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80' }
    ],
    products: ['Brushes', 'Combs', 'Towels', 'Shampoo', 'Ear Wipes', 'Eye Wipes'],
    services: ['Groomers Near You', 'Grooming Consultation', 'At-Home Grooming Session']
  },
  'behavior': {
    title: 'Behavior',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png',
    color: 'yellow',
    description: 'Understand and address common behavioral issues like barking, anxiety, and more.',
    topics: ['Barking', 'Chewing', 'Anxiety', 'Separation issues', 'Hyperactivity', 'Fear responses'],
    videos: [
      { title: 'Calming Anxious Dogs', duration: '15 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Stop Destructive Chewing', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' }
    ],
    products: ['Enrichment Toys', 'Chew Toys', 'Calming Mats', 'Anxiety Wraps'],
    services: ['Behavior Consultation', 'Behavior Trainer']
  },
  'training-basics': {
    title: 'Training Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png',
    color: 'green',
    description: 'Learn fundamental training techniques for obedience, commands, and leash walking.',
    topics: ['Sit command', 'Stay command', 'Recall training', 'Leash walking', 'House rules'],
    videos: [
      { title: 'Basic Commands', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Leash Training', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80' }
    ],
    products: ['Training Treats', 'Clicker', 'Training Leash', 'Treat Pouch'],
    services: ['Trainers Near You', 'Training Consultation', 'Group Training Class']
  },
  'travel-with-dogs': {
    title: 'Travel with Dogs',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png',
    color: 'sky',
    description: 'Prepare for safe and stress-free travel with your dog.',
    topics: ['Road trips', 'Flight preparation', 'Travel anxiety', 'Packing checklist', 'Travel safety'],
    videos: [
      { title: 'Preparing for Travel', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' }
    ],
    products: ['Travel Bowls', 'Carriers', 'Harness', 'Seat Belt', 'Travel Kit'],
    services: ['Travel Concierge', 'Pet-Friendly Hotel Booking']
  },
  'senior-dog-care': {
    title: 'Senior Dog Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png',
    color: 'amber',
    description: 'Caring for your aging companion with comfort and health support.',
    topics: ['Mobility support', 'Arthritis care', 'Diet changes', 'Slower exercise', 'Comfort routines'],
    videos: [
      { title: 'Caring for Older Dogs', duration: '15 min', thumbnail: 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&q=80' }
    ],
    products: ['Orthopedic Beds', 'Support Harness', 'Raised Feeders', 'Joint Supplements'],
    services: ['Physiotherapy', 'Senior Dog Vet Consult', 'Comfort Solutions']
  },
  'health-basics': {
    title: 'Health Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png',
    color: 'red',
    description: 'Essential health knowledge including vaccinations and dental care.',
    topics: ['Vaccination schedule', 'Parasite prevention', 'Dental care', 'Basic symptoms', 'Hydration'],
    videos: [
      { title: 'Basic Health Checks', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' }
    ],
    products: ['Dental Chews', 'Toothbrush', 'Grooming Wipes', 'First Aid Kit'],
    services: ['Vets Near You', 'Health Checkup', 'Vaccination Guidance']
  },
  'rescue-indie-care': {
    title: 'Rescue / Indie Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png',
    color: 'teal',
    description: 'Special guidance for adopted dogs and indie breeds.',
    topics: ['Settling rescue dogs', 'Trust building', 'Trauma behaviour', 'Routine building'],
    videos: [
      { title: 'Helping a Rescued Dog Settle', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' }
    ],
    products: ['Calming Beds', 'Chew Toys', 'Enrichment Toys', 'Comfort Items'],
    services: ['Behaviour Help', 'Adoption Support', 'Trust Building Sessions']
  },
  'seasonal-care': {
    title: 'Seasonal Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png',
    color: 'yellow',
    description: 'Weather-specific care tips for summer, monsoon, and winter.',
    topics: ['Summer: Heat prevention', 'Summer: Hydration', 'Monsoon: Paw care', 'Winter: Warmth'],
    videos: [
      { title: 'Summer Dog Care', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' }
    ],
    products: ['Cooling Mats', 'Paw Balm', 'Raincoats', 'Blankets', 'Hydration Bottles'],
    services: ['Seasonal Care Consultation']
  },
  'new-pet-parent-guide': {
    title: 'New Pet Parent Guide',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png',
    color: 'pink',
    description: 'Your complete starter guide to welcoming a new dog.',
    topics: ['First supplies', 'First vet visit', 'Feeding setup', 'Sleep area', 'Training basics'],
    videos: [
      { title: 'Bringing Your Dog Home', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
      { title: 'Home Preparation', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80' }
    ],
    products: ['Starter Kit', 'Bowls', 'Bed', 'Leash & Collar', 'First Aid'],
    services: ['New Pet Onboarding', 'First Vet Visit', 'Setup Consultation']
  }
};

const LearnTopicModal = ({ isOpen, onClose, topicSlug, onSendToConcierge }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const config = TOPIC_CONFIG[topicSlug];
  
  if (!config) return null;
  
  const handleConciergeRequest = (requestType) => {
    onClose();
    onSendToConcierge?.({
      topic: config.title,
      requestType,
      topicSlug
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 rounded-3xl">
        {/* Header with Image */}
        <div className={`relative h-32 bg-gradient-to-br from-${config.color}-100 to-${config.color}-200`}>
          <img 
            src={config.image} 
            alt={config.title}
            className="absolute right-4 bottom-0 h-36 w-36 object-contain"
          />
          <div className="absolute top-4 left-4">
            <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xs">{config.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-4">
            <TabsList className="h-12 bg-transparent gap-4">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="videos"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
              >
                <Play className="w-4 h-4 mr-1.5" />
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="products"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
              >
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Services
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(85vh-220px)] p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              <h3 className="font-semibold text-gray-900 mb-3">What You'll Learn</h3>
              <div className="grid grid-cols-2 gap-2">
                {config.topics.map((topic, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
                  >
                    <span className={`w-2 h-2 rounded-full bg-${config.color}-400`} />
                    <span className="text-sm text-gray-700">{topic}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-0">
              <div className="space-y-3">
                {config.videos.map((video, idx) => (
                  <Card 
                    key={idx}
                    className="flex items-center gap-4 p-3 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-800 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{video.title}</h4>
                      <p className="text-xs text-gray-500">{video.duration}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Products Tab */}
            <TabsContent value="products" className="mt-0">
              <div className="grid grid-cols-2 gap-3">
                {config.products.map((product, idx) => (
                  <Card 
                    key={idx}
                    className="p-4 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">{product}</h4>
                    <button className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                      View options <ChevronRight className="w-3 h-3" />
                    </button>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Services Tab */}
            <TabsContent value="services" className="mt-0">
              <div className="space-y-3">
                {config.services.map((service, idx) => (
                  <Card 
                    key={idx}
                    className="p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
                    onClick={() => handleConciergeRequest(service)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${config.color}-100 rounded-xl flex items-center justify-center`}>
                        <Users className={`w-5 h-5 text-${config.color}-600`} />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{service}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer - Send to Concierge */}
        <div className="border-t p-4 bg-gradient-to-br from-teal-50 to-blue-50">
          <Button 
            onClick={() => handleConciergeRequest(`Help with ${config.title}`)}
            className="w-full bg-teal-600 hover:bg-teal-700 gap-2 h-12 rounded-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Send to Concierge for More Details
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Our team will reach out within 2 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearnTopicModal;
