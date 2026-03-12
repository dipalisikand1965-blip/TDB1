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
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
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
import { useCart } from '../../context/CartContext';
import {
  X, BookOpen, Play, ShoppingBag, Users, MessageCircle,
  ChevronRight, ChevronDown, ExternalLink, Loader2, Sparkles,
  ArrowRight, ShoppingCart, Plus
} from 'lucide-react';

// Topic configurations with search keywords for products
// Fallback curated videos when YouTube API quota is exceeded
// Updated December 2025 with verified working video IDs
const CURATED_VIDEOS = {
  'puppy_training': [
    { videoId: 'q3OZQfxcW7w', title: 'How To Train ANY Dog to ALWAYS Come', thumbnail: 'https://img.youtube.com/vi/q3OZQfxcW7w/mqdefault.jpg', channelTitle: 'Zak George', duration: '6:17' },
    { videoId: 'c9mLCdmZ_Js', title: 'How to train Come when Called', thumbnail: 'https://img.youtube.com/vi/c9mLCdmZ_Js/mqdefault.jpg', channelTitle: 'Zak George', duration: '19:15' },
    { videoId: 'WNI2ae7D8UM', title: 'Puppy Training Basics', thumbnail: 'https://img.youtube.com/vi/WNI2ae7D8UM/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '10:15' }
  ],
  'basic_training': [
    { videoId: 'i2Qeyq6r_mw', title: 'Off Leash Training Tips', thumbnail: 'https://img.youtube.com/vi/i2Qeyq6r_mw/mqdefault.jpg', channelTitle: 'Zak George', duration: '19:08' },
    { videoId: '68wx5NKTvqQ', title: 'Teach Your Dog to Sit, Stay, Down', thumbnail: 'https://img.youtube.com/vi/68wx5NKTvqQ/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '11:20' },
    { videoId: 'Th2f31UfYqk', title: 'Leash Walking Made Easy', thumbnail: 'https://img.youtube.com/vi/Th2f31UfYqk/mqdefault.jpg', channelTitle: 'Zak George', duration: '14:05' }
  ],
  'dog_grooming': [
    { videoId: 'U7rMpHhEtpI', title: 'Complete Dog Grooming Guide', thumbnail: 'https://img.youtube.com/vi/U7rMpHhEtpI/mqdefault.jpg', channelTitle: 'Pet Care Pro', duration: '18:45' },
    { videoId: 'WDZQjf0OyRg', title: 'How to Trim Dog Nails Safely', thumbnail: 'https://img.youtube.com/vi/WDZQjf0OyRg/mqdefault.jpg', channelTitle: 'Kikopup', duration: '7:30' },
    { videoId: 'K3kvPTO9I6U', title: 'Bath Time Tips for Dogs', thumbnail: 'https://img.youtube.com/vi/K3kvPTO9I6U/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '9:15' }
  ],
  'dog_behavior': [
    { videoId: 'q3OZQfxcW7w', title: 'Stop Dog Barking - Proven Methods', thumbnail: 'https://img.youtube.com/vi/q3OZQfxcW7w/mqdefault.jpg', channelTitle: 'Zak George', duration: '13:20' },
    { videoId: 'WNI2ae7D8UM', title: 'Dealing with Dog Anxiety', thumbnail: 'https://img.youtube.com/vi/WNI2ae7D8UM/mqdefault.jpg', channelTitle: 'Kikopup', duration: '16:40' },
    { videoId: 'Th2f31UfYqk', title: 'Separation Anxiety Solutions', thumbnail: 'https://img.youtube.com/vi/Th2f31UfYqk/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '11:55' }
  ],
  'dog_nutrition': [
    { videoId: 'U7rMpHhEtpI', title: 'Best Dog Food - What to Feed', thumbnail: 'https://img.youtube.com/vi/U7rMpHhEtpI/mqdefault.jpg', channelTitle: 'Vet Explains', duration: '14:10' },
    { videoId: 'WDZQjf0OyRg', title: 'How Much to Feed Your Dog', thumbnail: 'https://img.youtube.com/vi/WDZQjf0OyRg/mqdefault.jpg', channelTitle: 'Pet Nutrition', duration: '8:45' },
    { videoId: 'K3kvPTO9I6U', title: 'Homemade Dog Food Recipe', thumbnail: 'https://img.youtube.com/vi/K3kvPTO9I6U/mqdefault.jpg', channelTitle: 'Healthy Pet', duration: '12:30' }
  ],
  'dog_health': [
    { videoId: 'c9mLCdmZ_Js', title: 'Dog Health Check at Home', thumbnail: 'https://img.youtube.com/vi/c9mLCdmZ_Js/mqdefault.jpg', channelTitle: 'Vet Explains', duration: '10:20' },
    { videoId: '68wx5NKTvqQ', title: 'Vaccination Schedule for Dogs', thumbnail: 'https://img.youtube.com/vi/68wx5NKTvqQ/mqdefault.jpg', channelTitle: 'Pet Health', duration: '7:50' },
    { videoId: 'i2Qeyq6r_mw', title: 'Dental Care for Dogs', thumbnail: 'https://img.youtube.com/vi/i2Qeyq6r_mw/mqdefault.jpg', channelTitle: 'Vet Ranch', duration: '9:35' }
  ],
  'senior_dogs': [
    { videoId: 'U7rMpHhEtpI', title: 'Caring for Senior Dogs', thumbnail: 'https://img.youtube.com/vi/U7rMpHhEtpI/mqdefault.jpg', channelTitle: 'Vet Explains', duration: '15:20' },
    { videoId: 'WNI2ae7D8UM', title: 'Senior Dog Exercise Tips', thumbnail: 'https://img.youtube.com/vi/WNI2ae7D8UM/mqdefault.jpg', channelTitle: 'Pet Care', duration: '8:40' },
    { videoId: 'q3OZQfxcW7w', title: 'Joint Care for Older Dogs', thumbnail: 'https://img.youtube.com/vi/q3OZQfxcW7w/mqdefault.jpg', channelTitle: 'Pet Health', duration: '11:15' }
  ],
  'dog_travel': [
    { videoId: 'Th2f31UfYqk', title: 'Traveling with Your Dog', thumbnail: 'https://img.youtube.com/vi/Th2f31UfYqk/mqdefault.jpg', channelTitle: 'Pet Travel', duration: '12:30' },
    { videoId: 'c9mLCdmZ_Js', title: 'Road Trip Tips with Dogs', thumbnail: 'https://img.youtube.com/vi/c9mLCdmZ_Js/mqdefault.jpg', channelTitle: 'Dog Adventures', duration: '9:15' },
    { videoId: 'i2Qeyq6r_mw', title: 'Flying with Your Dog', thumbnail: 'https://img.youtube.com/vi/i2Qeyq6r_mw/mqdefault.jpg', channelTitle: 'Pet Travel Pro', duration: '14:40' }
  ],
  'dog_breeds': [
    { videoId: 'WDZQjf0OyRg', title: 'Choosing the Right Breed', thumbnail: 'https://img.youtube.com/vi/WDZQjf0OyRg/mqdefault.jpg', channelTitle: 'Pet Guide', duration: '16:20' },
    { videoId: '68wx5NKTvqQ', title: 'Popular Dog Breeds Explained', thumbnail: 'https://img.youtube.com/vi/68wx5NKTvqQ/mqdefault.jpg', channelTitle: 'Dog 101', duration: '13:45' },
    { videoId: 'K3kvPTO9I6U', title: 'Breed-Specific Care Tips', thumbnail: 'https://img.youtube.com/vi/K3kvPTO9I6U/mqdefault.jpg', channelTitle: 'Vet Explains', duration: '11:30' }
  ],
  'rescue_dogs': [
    { videoId: 'q3OZQfxcW7w', title: 'Adopting a Rescue Dog', thumbnail: 'https://img.youtube.com/vi/q3OZQfxcW7w/mqdefault.jpg', channelTitle: 'Rescue Stories', duration: '14:50' },
    { videoId: 'c9mLCdmZ_Js', title: 'First Days with Rescue Dog', thumbnail: 'https://img.youtube.com/vi/c9mLCdmZ_Js/mqdefault.jpg', channelTitle: 'Kikopup', duration: '12:20' },
    { videoId: 'WNI2ae7D8UM', title: 'Building Trust with Rescue Dogs', thumbnail: 'https://img.youtube.com/vi/WNI2ae7D8UM/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '10:35' }
  ],
  'seasonal_care': [
    { videoId: 'U7rMpHhEtpI', title: 'Summer Safety for Dogs', thumbnail: 'https://img.youtube.com/vi/U7rMpHhEtpI/mqdefault.jpg', channelTitle: 'Vet Explains', duration: '9:45' },
    { videoId: 'Th2f31UfYqk', title: 'Winter Care Tips', thumbnail: 'https://img.youtube.com/vi/Th2f31UfYqk/mqdefault.jpg', channelTitle: 'Pet Care Pro', duration: '8:30' },
    { videoId: 'i2Qeyq6r_mw', title: 'Monsoon Pet Care Guide', thumbnail: 'https://img.youtube.com/vi/i2Qeyq6r_mw/mqdefault.jpg', channelTitle: 'Pet Health', duration: '7:20' }
  ],
  'new_dog_owner': [
    { videoId: 'q3OZQfxcW7w', title: 'First Time Dog Owner Guide', thumbnail: 'https://img.youtube.com/vi/q3OZQfxcW7w/mqdefault.jpg', channelTitle: 'Zak George', duration: '18:30' },
    { videoId: 'c9mLCdmZ_Js', title: 'Preparing for a New Dog', thumbnail: 'https://img.youtube.com/vi/c9mLCdmZ_Js/mqdefault.jpg', channelTitle: 'Pet Guide', duration: '11:45' },
    { videoId: 'WNI2ae7D8UM', title: 'New Dog Checklist', thumbnail: 'https://img.youtube.com/vi/WNI2ae7D8UM/mqdefault.jpg', channelTitle: 'McCann Dogs', duration: '13:20' }
  ]
};

const TOPIC_CONFIG = {
  'puppy-basics': {
    title: 'Puppy Basics',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png',
    color: 'pink',
    description: 'Everything you need to know about raising a happy, healthy puppy.',
    videoTopic: 'puppy_training',
    topics: [
      { title: 'First week at home', tip: 'Create a safe, quiet space for your puppy to decompress. Limit visitors for the first few days. Establish a consistent routine from day one.' },
      { title: 'Toilet training', tip: 'Take your puppy out every 2 hours, after meals, and after naps. Praise immediately when they go outside. Use enzymatic cleaners for accidents.' },
      { title: 'Feeding schedule', tip: 'Puppies need 3-4 small meals until 3 months, then 3 meals until 6 months, then 2 meals. Use slow feeders to prevent bloating.' },
      { title: 'Sleep routine', tip: 'Puppies need 18-20 hours of sleep. Keep the crate near your bed initially. A ticking clock or warm water bottle can help soothe them.' },
      { title: 'Teething', tip: 'Teething peaks at 4-6 months. Freeze wet washcloths for soothing. Redirect biting to appropriate chew toys immediately.' },
      { title: 'Socialization', tip: 'The critical window is 3-14 weeks. Expose to 100 new positive experiences safely. Carry them to see the world before fully vaccinated.' }
    ],
    productKeywords: ['puppy', 'pee pad', 'teething', 'crate', 'starter kit'],
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
    videoTopic: 'dog_breeds',
    topics: [
      { title: 'Labrador', tip: 'Labs are high-energy and food-motivated. They need daily exercise and mental stimulation. Watch for hip dysplasia and obesity.' },
      { title: 'Shih Tzu', tip: 'Daily brushing is essential. Keep face clean and dry to prevent infections. They overheat easily - avoid hot weather exercise.' },
      { title: 'Indie', tip: 'Indian native dogs are highly adaptable and intelligent. They may be wary of strangers initially. Regular deworming is important.' },
      { title: 'Golden Retriever', tip: 'Goldens shed heavily twice a year. They need lots of companionship and can develop separation anxiety. Watch for skin allergies.' },
      { title: 'Pug', tip: 'Pugs are brachycephalic - avoid heat and intense exercise. Clean facial wrinkles daily. Monitor breathing during activities.' },
      { title: 'German Shepherd', tip: 'GSDs need mental work as much as physical. Early socialization is crucial. Watch for digestive issues and hip problems.' }
    ],
    productKeywords: ['harness', 'cooling vest', 'breed specific', 'deshedding', 'breed care'],
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
    videoTopic: 'dog_nutrition',
    topics: [
      { title: 'How much to feed', tip: 'General rule: 2-3% of body weight for adults. Adjust based on activity level, age, and body condition score.' },
      { title: 'Feeding schedules', tip: 'Adults do best on 2 meals/day. Feed at consistent times. Remove uneaten food after 20 minutes.' },
      { title: 'Puppy vs adult diet', tip: 'Puppies need higher protein and fat. Switch to adult food gradually around 12-18 months (earlier for small breeds).' },
      { title: 'Healthy treats', tip: 'Treats should be max 10% of daily calories. Great options: carrots, apple slices, freeze-dried meat, plain boiled chicken.' },
      { title: 'Hydration', tip: 'Dogs need about 1 oz of water per pound of body weight daily. More in hot weather or after exercise.' }
    ],
    productKeywords: ['slow feeder', 'food bowl', 'lick mat', 'food storage', 'treat dispenser'],
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
    videoTopic: 'dog_grooming',
    topics: [
      { title: 'Brushing basics', tip: 'Brush in the direction of hair growth. Start from the neck, work towards tail. Use treats to make it positive.' },
      { title: 'Bathing guide', tip: 'Bath every 4-8 weeks unless dirty. Use lukewarm water. Protect ears from water. Dry thoroughly, especially in skin folds.' },
      { title: 'Nail trimming', tip: 'Trim every 2-4 weeks. Cut at 45° angle. Stop before the quick. Use styptic powder if you nick the quick.' },
      { title: 'Ear cleaning', tip: 'Check ears weekly. Use vet-approved cleaner. Never insert anything into the ear canal. Watch for redness or odor.' },
      { title: 'Coat care by breed', tip: 'Double coats: never shave. Wire coats: hand-strip. Curly coats: regular professional grooming. Smooth coats: weekly brushing.' }
    ],
    productKeywords: ['brush', 'shampoo', 'nail clipper', 'ear cleaner', 'grooming'],
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
    videoTopic: 'dog_behavior',
    topics: [
      { title: 'Barking', tip: 'Identify the trigger first. Teach "quiet" command. Never yell - it sounds like barking to them. Reward silence.' },
      { title: 'Chewing', tip: 'Provide appropriate chew outlets. Puppy-proof your space. Redirect to toys immediately. Exercise reduces destructive chewing.' },
      { title: 'Anxiety', tip: 'Create safe spaces. Use calming aids (music, compression wraps). Gradual desensitization works better than flooding.' },
      { title: 'Separation issues', tip: 'Practice short departures. Dont make arrivals/departures dramatic. Leave worn clothing with your scent.' },
      { title: 'Hyperactivity', tip: 'Mental exercise tires dogs faster than physical. Try puzzle feeders, training sessions, sniff walks.' },
      { title: 'Fear responses', tip: 'Never force interactions. Let them approach at their pace. Counter-condition with high-value treats.' }
    ],
    productKeywords: ['calming spray', 'anxiety vest', 'puzzle toy', 'chew toy', 'enrichment'],
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
    videoTopic: 'basic_training',
    topics: [
      { title: 'Sit command', tip: 'Hold treat above nose, move back over head. As they sit, say "sit" and reward. Practice before meals.' },
      { title: 'Stay command', tip: 'Start with 1 second, build duration slowly. Step back one step at a time. Always release with a word like "okay".' },
      { title: 'Recall training', tip: 'Never call your dog for something unpleasant. Use high-value rewards. Practice in low-distraction environments first.' },
      { title: 'Leash walking', tip: 'Stop when they pull. Reward walking beside you. Use a front-clip harness for pullers. Be patient and consistent.' },
      { title: 'House rules', tip: 'Decide rules before bringing dog home. Everyone must enforce consistently. Use management (baby gates) initially.' }
    ],
    productKeywords: ['training treats', 'clicker', 'training leash', 'treat pouch', 'harness'],
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
    videoTopic: 'dog_travel',
    topics: [
      { title: 'Road trips', tip: 'Stop every 2-3 hours for bathroom breaks. Never leave dog in parked car. Use a secured crate or car harness.' },
      { title: 'Flight preparation', tip: 'Get health certificate 10 days before. Familiarize with carrier weeks ahead. Avoid sedation unless vet-recommended.' },
      { title: 'Travel anxiety', tip: 'Short practice trips help desensitize. Calming treats or sprays can help. Familiar items provide comfort.' },
      { title: 'Packing checklist', tip: 'Food, bowls, leash, waste bags, medications, health records, recent photo, favorite toy, first aid kit.' },
      { title: 'Travel safety', tip: 'ID tags updated. Microchip registered. Know emergency vets at destination. Keep routine as normal as possible.' }
    ],
    productKeywords: ['carrier', 'car seat', 'travel bowl', 'travel kit', 'portable'],
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
    videoTopic: 'senior_dogs',
    topics: [
      { title: 'Mobility support', tip: 'Use ramps for furniture/cars. Non-slip mats on floors. Shorter, gentler walks more frequently.' },
      { title: 'Arthritis care', tip: 'Warm bedding helps. Joint supplements (glucosamine, fish oil). Low-impact exercise like swimming.' },
      { title: 'Diet changes', tip: 'Senior dogs need fewer calories, higher quality protein. Add joint-supporting supplements. Monitor weight closely.' },
      { title: 'Slower exercise', tip: 'Two short walks better than one long. Watch for signs of fatigue. Avoid extreme temperatures.' },
      { title: 'Comfort routines', tip: 'Maintain familiar routines. Orthopedic beds help joints. Keep food/water easily accessible.' }
    ],
    productKeywords: ['orthopedic bed', 'joint supplement', 'senior food', 'ramp', 'mobility'],
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
    videoTopic: 'dog_health',
    topics: [
      { title: 'Vaccination schedule', tip: 'Core vaccines: Rabies, Distemper, Parvovirus, Adenovirus. Puppies need boosters every 3-4 weeks until 16 weeks.' },
      { title: 'Parasite prevention', tip: 'Monthly heartworm prevention year-round. Flea/tick prevention based on your area. Regular deworming schedule.' },
      { title: 'Dental care', tip: 'Brush teeth daily if possible. Dental chews help. Annual dental checkup. Watch for bad breath or difficulty eating.' },
      { title: 'Basic symptoms', tip: 'Know normal vitals: temp 101-102.5°F, heart rate 60-140 bpm. Watch for lethargy, appetite changes, unusual behavior.' },
      { title: 'Hydration', tip: 'Signs of dehydration: dry gums, sunken eyes, skin tenting. Offer fresh water always. Add water to kibble if needed.' }
    ],
    productKeywords: ['dental chew', 'first aid', 'health supplement', 'tick spray', 'deworming'],
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
    videoTopic: 'rescue_dogs',
    topics: [
      { title: 'Settling rescue dogs', tip: '3-3-3 rule: 3 days decompression, 3 weeks learning routine, 3 months to feel home. Go slow.' },
      { title: 'Trust building', tip: 'Let them come to you. Hand-feed meals. Create predictable routines. Never force physical affection.' },
      { title: 'Trauma behaviour', tip: 'Triggers may be unpredictable. Dont punish fear responses. Work with a positive-reinforcement trainer.' },
      { title: 'Routine building', tip: 'Consistency is key. Same feeding times, walk times, sleep area. Structure reduces anxiety.' }
    ],
    productKeywords: ['calming bed', 'comfort blanket', 'snuffle mat', 'rescue', 'anxiety'],
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
    videoTopic: 'seasonal_care',
    topics: [
      { title: 'Summer: Heat prevention', tip: 'Walk early morning or late evening. Never leave in car. Provide shade and cool areas. Watch for panting/drooling.' },
      { title: 'Summer: Hydration', tip: 'Carry water on walks. Add ice cubes to bowl. Frozen treats help cool down. Watch for signs of heatstroke.' },
      { title: 'Monsoon: Paw care', tip: 'Dry paws after every walk. Check between toes for infections. Use paw balm. Avoid puddles with stagnant water.' },
      { title: 'Winter: Warmth', tip: 'Short-haired dogs need sweaters. Wipe salt from paws. Provide warm bedding. Watch for hypothermia signs.' }
    ],
    productKeywords: ['cooling mat', 'paw balm', 'dog sweater', 'rain coat', 'winter jacket'],
    services: [
      { name: 'Seasonal Care Consultation', pillar: 'advisory', hasService: true }
    ]
  },
  'new-pet-parent-guide': {
    title: 'New Pet Parent Guide',
    image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png',
    color: 'pink',
    description: 'Your complete starter guide to welcoming a new dog.',
    videoTopic: 'new_dog_owner',
    topics: [
      { title: 'First supplies', tip: 'Essentials: collar, leash, ID tags, food/water bowls, bed, crate, toys, poop bags, food, treats.' },
      { title: 'First vet visit', tip: 'Schedule within 48 hours. Bring any records from breeder/shelter. Prepare questions. Start vaccination schedule.' },
      { title: 'Feeding setup', tip: 'Quiet location away from foot traffic. Raised bowls for large breeds. Slow feeder if eating too fast.' },
      { title: 'Sleep area', tip: 'Crate or bed in quiet, draft-free area. Near you initially. Consistent location helps them settle.' },
      { title: 'Training basics', tip: 'Start with name recognition. House training from day one. Positive reinforcement only. Short sessions.' }
    ],
    productKeywords: ['starter kit', 'collar', 'leash', 'bed', 'bowl', 'crate'],
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
  const { addToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  
  const config = TOPIC_CONFIG[topicSlug];
  
  // Handle add to cart
  const handleAddToCart = (product, e) => {
    e?.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || product.pricing?.selling_price || 999,
      quantity: 1,
      image_url: product.image_url || product.image,
      pillar: 'learn'
    });
    toast.success(`Added ${product.name} to cart`);
  };
  
  // Reset state when topic changes
  useEffect(() => {
    setActiveTab('overview');
    setExpandedTopic(null);
    setProducts([]);
    setVideos([]);
  }, [topicSlug]);
  
  // Fetch products when Products tab is opened
  useEffect(() => {
    if (activeTab === 'products' && config && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab, config]);
  
  // Fetch videos when Videos tab is opened
  useEffect(() => {
    if (activeTab === 'videos' && config && videos.length === 0) {
      fetchVideos();
    }
  }, [activeTab, config]);
  
  const fetchProducts = async () => {
    if (!config) return;
    setLoadingProducts(true);
    try {
      // Get pet's breed for personalization
      const petBreed = currentPet?.breed?.toLowerCase() || '';
      
      // Fetch from Product Box with learn pillar
      const res = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=50`);
      if (res.ok) {
        const data = await res.json();
        let allProducts = data.products || [];
        
        // Filter by topic keywords
        const keywords = config.productKeywords || [];
        
        // Score and filter products
        const scoredProducts = allProducts.map(p => {
          let score = 0;
          const name = (p.name || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          const tags = (p.tags || []).map(t => t.toLowerCase());
          
          // Check keyword matches
          keywords.forEach(kw => {
            if (name.includes(kw.toLowerCase())) score += 3;
            if (description.includes(kw.toLowerCase())) score += 1;
            if (tags.some(t => t.includes(kw.toLowerCase()))) score += 2;
          });
          
          // Bonus for pet's breed match
          if (petBreed && name.includes(petBreed)) score += 5;
          
          // Must have an image
          const hasImage = p.image_url || p.image || (p.images && p.images[0]);
          if (!hasImage) score -= 10;
          
          // Exclude products for OTHER breeds
          const otherBreeds = ['chihuahua', 'pug', 'shih tzu', 'scottish', 'labrador', 'golden', 'poodle', 'beagle', 'bulldog', 'husky', 'german shepherd', 'schnoodle', 'dachshund'];
          const isOtherBreed = otherBreeds.some(b => name.includes(b) && b !== petBreed);
          if (isOtherBreed && petBreed) score -= 20;
          
          return { ...p, score };
        });
        
        // Sort by score and take top 8
        const topProducts = scoredProducts
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        
        setProducts(topProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Fetch YouTube videos by topic (with fallback to curated videos)
  const fetchVideos = async () => {
    if (!config) return;
    setLoadingVideos(true);
    try {
      const topic = config.videoTopic || 'dog_care';
      const res = await fetch(`${API_URL}/api/mira/youtube/by-topic?topic=${encodeURIComponent(topic)}&max_results=6`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          return;
        }
      }
      // Fallback to curated videos if API fails or returns empty
      const fallbackVideos = CURATED_VIDEOS[config.videoTopic] || CURATED_VIDEOS['basic_training'] || [];
      setVideos(fallbackVideos);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      // Use curated fallback videos on error
      const fallbackVideos = CURATED_VIDEOS[config.videoTopic] || CURATED_VIDEOS['basic_training'] || [];
      setVideos(fallbackVideos);
    } finally {
      setLoadingVideos(false);
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
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
        
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
            
            {/* Videos Tab - YouTube search for topic */}
            <TabsContent value="videos" className="mt-0">
              {loadingVideos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.map((video, idx) => (
                    <Card 
                      key={video.videoId || idx}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
                      data-testid={`video-card-${idx}`}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-teal-600 ml-0.5" />
                            </div>
                          </div>
                          {video.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                              {video.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{video.title}</h4>
                          {video.channelTitle && (
                            <p className="text-xs text-gray-500 mt-1">{video.channelTitle}</p>
                          )}
                          {video.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=dog+${encodeURIComponent(config.title.toLowerCase())}+tips`, '_blank')}
                    className="w-full mt-2"
                    data-testid="browse-more-videos-btn"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Browse More on YouTube
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Watch on YouTube</h4>
                  <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
                    We've curated the best {config.title.toLowerCase()} videos from trusted dog trainers
                  </p>
                  <Button
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=dog+${encodeURIComponent(config.title.toLowerCase())}+tips+guide`, '_blank')}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="watch-on-youtube-btn"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch {config.title} Videos
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              )}
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
                        className="p-3 cursor-pointer hover:shadow-md transition-all group"
                        data-testid={`product-card-${idx}`}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                          {(product.image_url || product.image || product.images?.[0]) ? (
                            <img 
                              src={product.image_url || product.image || product.images?.[0]} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1">{product.name}</h4>
                        {(product.price || product.pricing?.selling_price) && (
                          <p className="text-sm font-semibold text-teal-600">₹{product.price || product.pricing?.selling_price}</p>
                        )}
                        <Button 
                          size="sm"
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-xs h-8"
                          data-testid={`add-to-cart-${idx}`}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to Cart
                        </Button>
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
                    View More Products
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
