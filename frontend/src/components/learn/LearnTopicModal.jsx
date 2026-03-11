/**
 * LearnTopicModal.jsx
 * Beautiful popup modal for Learn topics
 * Opens on same page with tabs: Overview | Videos | Products | Services
 * 
 * FLOW:
 * - Overview topics: Clickable → Expands with Mira tips
 * - Products: Real products from catalogue → "Continue to Shop"
 * - Services: Navigate to /services if available, or trigger service desk flow
 * - "Send to Concierge": Uses Universal Service Command (Service Desk → Admin → Inbox)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { API_URL } from '../../utils/api';
import { toast } from 'sonner';
import useUniversalServiceCommand, { ENTRY_POINTS, REQUEST_TYPES } from '../../hooks/useUniversalServiceCommand';
import { useAuth } from '../../context/AuthContext';
import { usePillarContext } from '../../context/PillarContext';
import {
  X, BookOpen, Play, ShoppingBag, Users, MessageCircle,
  ChevronRight, ChevronDown, ExternalLink, Loader2, Sparkles,
  ArrowRight
} from 'lucide-react';

// Topic configurations with search keywords for products
const TOPIC_CONFIG = {
  'puppy-basics': {
    title: 'Puppy Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png',
    color: 'pink',
    description: 'Everything you need to know about raising a happy, healthy puppy.',
    topics: [
      { title: 'First week at home', tip: 'Create a safe, quiet space for your puppy to decompress. Limit visitors for the first few days. Establish a consistent routine from day one.' },
      { title: 'Toilet training', tip: 'Take your puppy out every 2 hours, after meals, and after naps. Praise immediately when they go outside. Use enzymatic cleaners for accidents.' },
      { title: 'Feeding schedule', tip: 'Puppies need 3-4 small meals until 3 months, then 3 meals until 6 months, then 2 meals. Use slow feeders to prevent bloating.' },
      { title: 'Sleep routine', tip: 'Puppies need 18-20 hours of sleep. Keep the crate near your bed initially. A ticking clock or warm water bottle can help soothe them.' },
      { title: 'Teething', tip: 'Teething peaks at 4-6 months. Freeze wet washcloths for soothing. Redirect biting to appropriate chew toys immediately.' },
      { title: 'Socialization', tip: 'The critical window is 3-14 weeks. Expose to 100 new positive experiences safely. Carry them to see the world before fully vaccinated.' }
    ],
    productKeywords: ['puppy', 'starter', 'pee pad', 'teething', 'crate'],
    services: [
      { name: 'Puppy Training Session', pillar: 'learn', hasService: true },
      { name: 'First Vet Visit Guidance', pillar: 'care', hasService: true },
      { name: 'Puppy Socialization Class', pillar: 'learn', hasService: false }
    ]
  },
  'breed-guides': {
    title: 'Breed Guides',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png',
    color: 'blue',
    description: 'Understand the unique traits and care needs of different dog breeds.',
    topics: [
      { title: 'Labrador', tip: 'Labs are high-energy and food-motivated. They need daily exercise and mental stimulation. Watch for hip dysplasia and obesity.' },
      { title: 'Shih Tzu', tip: 'Daily brushing is essential. Keep face clean and dry to prevent infections. They overheat easily - avoid hot weather exercise.' },
      { title: 'Indie', tip: 'Indian native dogs are highly adaptable and intelligent. They may be wary of strangers initially. Regular deworming is important.' },
      { title: 'Golden Retriever', tip: 'Goldens shed heavily twice a year. They need lots of companionship and can develop separation anxiety. Watch for skin allergies.' },
      { title: 'Pug', tip: 'Pugs are brachycephalic - avoid heat and intense exercise. Clean facial wrinkles daily. Monitor breathing during activities.' },
      { title: 'German Shepherd', tip: 'GSDs need mental work as much as physical. Early socialization is crucial. Watch for digestive issues and hip problems.' }
    ],
    productKeywords: ['breed', 'harness', 'cooling', 'shedding', 'brush'],
    services: [
      { name: 'Breed Consultation', pillar: 'advisory', hasService: true },
      { name: 'Grooming for Your Breed', pillar: 'care', hasService: true }
    ]
  },
  'food-feeding': {
    title: 'Food & Feeding',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png',
    color: 'orange',
    description: 'Learn about proper nutrition, feeding schedules, and healthy diet choices.',
    topics: [
      { title: 'How much to feed', tip: 'General rule: 2-3% of body weight for adults. Adjust based on activity level, age, and body condition score.' },
      { title: 'Feeding schedules', tip: 'Adults do best on 2 meals/day. Feed at consistent times. Remove uneaten food after 20 minutes.' },
      { title: 'Puppy vs adult diet', tip: 'Puppies need higher protein and fat. Switch to adult food gradually around 12-18 months (earlier for small breeds).' },
      { title: 'Healthy treats', tip: 'Treats should be max 10% of daily calories. Great options: carrots, apple slices, freeze-dried meat, plain boiled chicken.' },
      { title: 'Hydration', tip: 'Dogs need about 1 oz of water per pound of body weight daily. More in hot weather or after exercise.' }
    ],
    productKeywords: ['food', 'bowl', 'feeder', 'slow feeder', 'lick mat', 'treat'],
    services: [
      { name: 'Nutrition Consultation', pillar: 'dine', hasService: true },
      { name: 'Diet Planning', pillar: 'dine', hasService: true }
    ]
  },
  'grooming': {
    title: 'Grooming',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png',
    color: 'purple',
    description: 'Master grooming techniques for brushing, bathing, nail care, and coat maintenance.',
    topics: [
      { title: 'Brushing basics', tip: 'Brush in the direction of hair growth. Start from the neck, work towards tail. Use treats to make it positive.' },
      { title: 'Bathing guide', tip: 'Bath every 4-8 weeks unless dirty. Use lukewarm water. Protect ears from water. Dry thoroughly, especially in skin folds.' },
      { title: 'Nail trimming', tip: 'Trim every 2-4 weeks. Cut at 45° angle. Stop before the quick. Use styptic powder if you nick the quick.' },
      { title: 'Ear cleaning', tip: 'Check ears weekly. Use vet-approved cleaner. Never insert anything into the ear canal. Watch for redness or odor.' },
      { title: 'Coat care by breed', tip: 'Double coats: never shave. Wire coats: hand-strip. Curly coats: regular professional grooming. Smooth coats: weekly brushing.' }
    ],
    productKeywords: ['grooming', 'brush', 'shampoo', 'nail', 'ear', 'towel'],
    services: [
      { name: 'Groomers Near You', pillar: 'care', hasService: true },
      { name: 'Grooming Consultation', pillar: 'care', hasService: true },
      { name: 'At-Home Grooming Session', pillar: 'care', hasService: false }
    ]
  },
  'behavior': {
    title: 'Behavior',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png',
    color: 'yellow',
    description: 'Understand and address common behavioral issues like barking, anxiety, and more.',
    topics: [
      { title: 'Barking', tip: 'Identify the trigger first. Teach "quiet" command. Never yell - it sounds like barking to them. Reward silence.' },
      { title: 'Chewing', tip: 'Provide appropriate chew outlets. Puppy-proof your space. Redirect to toys immediately. Exercise reduces destructive chewing.' },
      { title: 'Anxiety', tip: 'Create safe spaces. Use calming aids (music, compression wraps). Gradual desensitization works better than flooding.' },
      { title: 'Separation issues', tip: 'Practice short departures. Dont make arrivals/departures dramatic. Leave worn clothing with your scent.' },
      { title: 'Hyperactivity', tip: 'Mental exercise tires dogs faster than physical. Try puzzle feeders, training sessions, sniff walks.' },
      { title: 'Fear responses', tip: 'Never force interactions. Let them approach at their pace. Counter-condition with high-value treats.' }
    ],
    productKeywords: ['calming', 'anxiety', 'chew', 'enrichment', 'puzzle'],
    services: [
      { name: 'Behavior Consultation', pillar: 'learn', hasService: true },
      { name: 'Behavior Trainer', pillar: 'learn', hasService: true }
    ]
  },
  'training-basics': {
    title: 'Training Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png',
    color: 'green',
    description: 'Learn fundamental training techniques for obedience, commands, and leash walking.',
    topics: [
      { title: 'Sit command', tip: 'Hold treat above nose, move back over head. As they sit, say "sit" and reward. Practice before meals.' },
      { title: 'Stay command', tip: 'Start with 1 second, build duration slowly. Step back one step at a time. Always release with a word like "okay".' },
      { title: 'Recall training', tip: 'Never call your dog for something unpleasant. Use high-value rewards. Practice in low-distraction environments first.' },
      { title: 'Leash walking', tip: 'Stop when they pull. Reward walking beside you. Use a front-clip harness for pullers. Be patient and consistent.' },
      { title: 'House rules', tip: 'Decide rules before bringing dog home. Everyone must enforce consistently. Use management (baby gates) initially.' }
    ],
    productKeywords: ['training', 'treat', 'clicker', 'leash', 'harness'],
    services: [
      { name: 'Trainers Near You', pillar: 'learn', hasService: true },
      { name: 'Training Consultation', pillar: 'learn', hasService: true },
      { name: 'Group Training Class', pillar: 'learn', hasService: false }
    ]
  },
  'travel-with-dogs': {
    title: 'Travel with Dogs',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png',
    color: 'sky',
    description: 'Prepare for safe and stress-free travel with your dog.',
    topics: [
      { title: 'Road trips', tip: 'Stop every 2-3 hours for bathroom breaks. Never leave dog in parked car. Use a secured crate or car harness.' },
      { title: 'Flight preparation', tip: 'Get health certificate 10 days before. Familiarize with carrier weeks ahead. Avoid sedation unless vet-recommended.' },
      { title: 'Travel anxiety', tip: 'Short practice trips help desensitize. Calming treats or sprays can help. Familiar items provide comfort.' },
      { title: 'Packing checklist', tip: 'Food, bowls, leash, waste bags, medications, health records, recent photo, favorite toy, first aid kit.' },
      { title: 'Travel safety', tip: 'ID tags updated. Microchip registered. Know emergency vets at destination. Keep routine as normal as possible.' }
    ],
    productKeywords: ['travel', 'carrier', 'car', 'seat belt', 'portable', 'bowl'],
    services: [
      { name: 'Travel Concierge', pillar: 'travel', hasService: true },
      { name: 'Pet-Friendly Hotel Booking', pillar: 'travel', hasService: true }
    ]
  },
  'senior-dog-care': {
    title: 'Senior Dog Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png',
    color: 'amber',
    description: 'Caring for your aging companion with comfort and health support.',
    topics: [
      { title: 'Mobility support', tip: 'Use ramps for furniture/cars. Non-slip mats on floors. Shorter, gentler walks more frequently.' },
      { title: 'Arthritis care', tip: 'Warm bedding helps. Joint supplements (glucosamine, fish oil). Low-impact exercise like swimming.' },
      { title: 'Diet changes', tip: 'Senior dogs need fewer calories, higher quality protein. Add joint-supporting supplements. Monitor weight closely.' },
      { title: 'Slower exercise', tip: 'Two short walks better than one long. Watch for signs of fatigue. Avoid extreme temperatures.' },
      { title: 'Comfort routines', tip: 'Maintain familiar routines. Orthopedic beds help joints. Keep food/water easily accessible.' }
    ],
    productKeywords: ['senior', 'orthopedic', 'joint', 'supplement', 'raised', 'ramp'],
    services: [
      { name: 'Physiotherapy', pillar: 'care', hasService: true },
      { name: 'Senior Dog Vet Consult', pillar: 'care', hasService: true },
      { name: 'Comfort Solutions', pillar: 'stay', hasService: false }
    ]
  },
  'health-basics': {
    title: 'Health Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png',
    color: 'red',
    description: 'Essential health knowledge including vaccinations and dental care.',
    topics: [
      { title: 'Vaccination schedule', tip: 'Core vaccines: Rabies, Distemper, Parvovirus, Adenovirus. Puppies need boosters every 3-4 weeks until 16 weeks.' },
      { title: 'Parasite prevention', tip: 'Monthly heartworm prevention year-round. Flea/tick prevention based on your area. Regular deworming schedule.' },
      { title: 'Dental care', tip: 'Brush teeth daily if possible. Dental chews help. Annual dental checkup. Watch for bad breath or difficulty eating.' },
      { title: 'Basic symptoms', tip: 'Know normal vitals: temp 101-102.5°F, heart rate 60-140 bpm. Watch for lethargy, appetite changes, unusual behavior.' },
      { title: 'Hydration', tip: 'Signs of dehydration: dry gums, sunken eyes, skin tenting. Offer fresh water always. Add water to kibble if needed.' }
    ],
    productKeywords: ['dental', 'health', 'supplement', 'first aid', 'wipes'],
    services: [
      { name: 'Vets Near You', pillar: 'care', hasService: true },
      { name: 'Health Checkup', pillar: 'care', hasService: true },
      { name: 'Vaccination Guidance', pillar: 'care', hasService: true }
    ]
  },
  'rescue-indie-care': {
    title: 'Rescue / Indie Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png',
    color: 'teal',
    description: 'Special guidance for adopted dogs and indie breeds.',
    topics: [
      { title: 'Settling rescue dogs', tip: '3-3-3 rule: 3 days decompression, 3 weeks learning routine, 3 months to feel home. Go slow.' },
      { title: 'Trust building', tip: 'Let them come to you. Hand-feed meals. Create predictable routines. Never force physical affection.' },
      { title: 'Trauma behaviour', tip: 'Triggers may be unpredictable. Dont punish fear responses. Work with a positive-reinforcement trainer.' },
      { title: 'Routine building', tip: 'Consistency is key. Same feeding times, walk times, sleep area. Structure reduces anxiety.' }
    ],
    productKeywords: ['calming', 'bed', 'comfort', 'enrichment', 'anxiety'],
    services: [
      { name: 'Behaviour Help', pillar: 'learn', hasService: true },
      { name: 'Adoption Support', pillar: 'adopt', hasService: true },
      { name: 'Trust Building Sessions', pillar: 'learn', hasService: false }
    ]
  },
  'seasonal-care': {
    title: 'Seasonal Care',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png',
    color: 'yellow',
    description: 'Weather-specific care tips for summer, monsoon, and winter.',
    topics: [
      { title: 'Summer: Heat prevention', tip: 'Walk early morning or late evening. Never leave in car. Provide shade and cool areas. Watch for panting/drooling.' },
      { title: 'Summer: Hydration', tip: 'Carry water on walks. Add ice cubes to bowl. Frozen treats help cool down. Watch for signs of heatstroke.' },
      { title: 'Monsoon: Paw care', tip: 'Dry paws after every walk. Check between toes for infections. Use paw balm. Avoid puddles with stagnant water.' },
      { title: 'Winter: Warmth', tip: 'Short-haired dogs need sweaters. Wipe salt from paws. Provide warm bedding. Watch for hypothermia signs.' }
    ],
    productKeywords: ['cooling', 'paw', 'sweater', 'coat', 'balm', 'blanket'],
    services: [
      { name: 'Seasonal Care Consultation', pillar: 'advisory', hasService: true }
    ]
  },
  'new-pet-parent-guide': {
    title: 'New Pet Parent Guide',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png',
    color: 'pink',
    description: 'Your complete starter guide to welcoming a new dog.',
    topics: [
      { title: 'First supplies', tip: 'Essentials: collar, leash, ID tags, food/water bowls, bed, crate, toys, poop bags, food, treats.' },
      { title: 'First vet visit', tip: 'Schedule within 48 hours. Bring any records from breeder/shelter. Prepare questions. Start vaccination schedule.' },
      { title: 'Feeding setup', tip: 'Quiet location away from foot traffic. Raised bowls for large breeds. Slow feeder if eating too fast.' },
      { title: 'Sleep area', tip: 'Crate or bed in quiet, draft-free area. Near you initially. Consistent location helps them settle.' },
      { title: 'Training basics', tip: 'Start with name recognition. House training from day one. Positive reinforcement only. Short sessions.' }
    ],
    productKeywords: ['starter', 'kit', 'bed', 'bowl', 'collar', 'leash', 'crate'],
    services: [
      { name: 'New Pet Onboarding', pillar: 'advisory', hasService: true },
      { name: 'First Vet Visit', pillar: 'care', hasService: true },
      { name: 'Setup Consultation', pillar: 'advisory', hasService: false }
    ]
  }
};

const LearnTopicModal = ({ isOpen, onClose, topicSlug }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { currentPet } = usePillarContext();
  const { submitRequest, isSubmitting } = useUniversalServiceCommand();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const config = TOPIC_CONFIG[topicSlug];
  
  // Fetch products when Products tab is opened
  useEffect(() => {
    if (activeTab === 'products' && config && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab, config]);
  
  const fetchProducts = async () => {
    if (!config) return;
    setLoadingProducts(true);
    try {
      const keywords = config.productKeywords.join(',');
      const res = await fetch(`${API_URL}/api/products?pillar=learn&keywords=${encodeURIComponent(keywords)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Handle service click - navigate to /services or trigger concierge flow
  const handleServiceClick = async (service) => {
    if (service.hasService) {
      // Navigate to services page with the pillar filter
      onClose();
      navigate(`/services?pillar=${service.pillar}&search=${encodeURIComponent(service.name)}`);
    } else {
      // Trigger Universal Service Command flow (creates service desk ticket)
      try {
        await submitRequest({
          type: REQUEST_TYPES.GENERAL_INQUIRY,
          pillar: 'learn',
          source: ENTRY_POINTS.CARD_CTA,
          details: {
            topic: config.title,
            service: service.name,
            context: `User interested in ${service.name} from Learn > ${config.title}`
          },
          pet: currentPet,
          entryPoint: 'learn_topic_modal'
        });
        
        toast.success('Request sent to concierge!', {
          description: 'Our team will reach out within 2 hours.'
        });
        onClose();
      } catch (err) {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };
  
  // Handle "Send to Concierge" button - creates service desk ticket
  const handleSendToConcierge = async () => {
    try {
      await submitRequest({
        type: REQUEST_TYPES.HELP_REQUEST,
        pillar: 'learn',
        source: ENTRY_POINTS.CONCIERGE_BUTTON,
        details: {
          topic: config.title,
          context: `Help request from Learn > ${config.title} popup`,
          petName: currentPet?.name
        },
        pet: currentPet,
        entryPoint: 'learn_topic_modal'
      });
      
      toast.success('Request submitted!', {
        description: 'Check your inbox for updates.'
      });
      onClose();
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    }
  };
  
  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 rounded-3xl" data-testid="learn-topic-modal">
        {/* Header with Image */}
        <div className="relative h-32 bg-gradient-to-br from-pink-50 to-purple-50">
          <img 
            src={config.image} 
            alt={config.title}
            className="absolute right-4 bottom-0 h-36 w-36 object-contain"
          />
          <div className="absolute top-4 left-4 pr-20">
            <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xs">{config.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
            data-testid="close-modal-btn"
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
                data-testid="tab-overview"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="videos"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
                data-testid="tab-videos"
              >
                <Play className="w-4 h-4 mr-1.5" />
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="products"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
                data-testid="tab-products"
              >
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none bg-transparent px-0"
                data-testid="tab-services"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Services
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(85vh-220px)] p-4">
            {/* Overview Tab - Clickable topics with expandable Mira tips */}
            <TabsContent value="overview" className="mt-0">
              <h3 className="font-semibold text-gray-900 mb-3">What You'll Learn</h3>
              <div className="space-y-2">
                {config.topics.map((topic, idx) => (
                  <Collapsible 
                    key={idx}
                    open={expandedTopic === idx}
                    onOpenChange={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
                  >
                    <CollapsibleTrigger className="w-full" data-testid={`topic-trigger-${idx}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pink-400" />
                          <span className="text-sm font-medium text-gray-700">{topic.title}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedTopic === idx ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 ml-4 p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-teal-700 mb-1">Mira's Tip</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{topic.tip}</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>
            
            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-0">
              <p className="text-sm text-gray-500 mb-4">Video content coming soon! In the meantime, ask Mira for personalized guidance.</p>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: {
                      message: `Tell me about ${config.title}`,
                      context: 'learn',
                      pillar: 'learn'
                    }
                  }));
                }}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask Mira about {config.title}
              </Button>
            </TabsContent>
            
            {/* Products Tab - Real products from catalogue */}
            <TabsContent value="products" className="mt-0">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {products.slice(0, 4).map((product, idx) => (
                      <Card 
                        key={product.id || idx}
                        className="p-3 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => {
                          onClose();
                          navigate(`/product/${product.id}`);
                        }}
                        data-testid={`product-card-${idx}`}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-xs line-clamp-2">{product.name}</h4>
                        {product.price && (
                          <p className="text-sm font-semibold text-teal-600 mt-1">₹{product.price}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      onClose();
                      navigate(`/shop?pillar=learn&search=${encodeURIComponent(config.productKeywords[0])}`);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    data-testid="continue-to-shop-btn"
                  >
                    Continue to Shop
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Explore our curated collection</p>
                  <Button
                    onClick={() => {
                      onClose();
                      navigate('/shop?pillar=learn');
                    }}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Browse Shop
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Services Tab - Navigate to /services or trigger concierge */}
            <TabsContent value="services" className="mt-0">
              <div className="space-y-3">
                {config.services.map((service, idx) => (
                  <Card 
                    key={idx}
                    className="p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
                    onClick={() => handleServiceClick(service)}
                    data-testid={`service-card-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                        {!service.hasService && (
                          <Badge variant="outline" className="ml-2 text-xs">Ask Concierge</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer - Send to Concierge (Universal Service Command flow) */}
        <div className="border-t p-4 bg-gradient-to-br from-teal-50 to-blue-50">
          <Button 
            onClick={handleSendToConcierge}
            disabled={isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-700 gap-2 h-12 rounded-xl"
            data-testid="send-to-concierge-btn"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
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
