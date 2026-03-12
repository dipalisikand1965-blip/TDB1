/**
 * PillarTopicModal.jsx
 * Generic topic modal for all pillars (same experience as LearnTopicModal)
 * Opens on same page with tabs: Overview | Products | Services
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { API_URL } from '../utils/api';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import {
  X, BookOpen, ShoppingBag, Users, MessageCircle,
  ChevronRight, ChevronDown, Loader2, Sparkles,
  ArrowRight, ShoppingCart, MapPin
} from 'lucide-react';

// Topic content configurations for each pillar
const PILLAR_TOPIC_CONTENT = {
  stay: {
    boarding: {
      title: 'Pet Boarding',
      description: 'Safe overnight stays for your furry friend while you\'re away',
      color: 'purple',
      topics: [
        { title: 'Choosing the right facility', tip: 'Visit beforehand, check cleanliness, staff-to-pet ratio, and ask about their emergency protocols. Trust your gut feeling.' },
        { title: 'What to pack', tip: 'Bring their regular food, favorite toy, a worn t-shirt with your scent, medications, and vaccination records.' },
        { title: 'First-time boarding', tip: 'Start with a short trial stay. Many dogs need 2-3 visits to feel comfortable. Avoid long goodbyes.' },
        { title: 'Health requirements', tip: 'Most facilities require up-to-date vaccinations including Bordetella (kennel cough). Get these 2 weeks before boarding.' },
      ],
      productKeywords: ['travel', 'carrier', 'comfort', 'anxiety'],
      serviceKeywords: ['boarding', 'overnight', 'kennel']
    },
    daycare: {
      title: 'Pet Daycare',
      description: 'Socialization and fun while you work',
      color: 'blue',
      topics: [
        { title: 'Benefits of daycare', tip: 'Regular socialization reduces anxiety, burns energy, and prevents destructive behavior at home.' },
        { title: 'Is your dog ready?', tip: 'Dogs should be vaccinated, spayed/neutered (usually 6+ months), and comfortable around other dogs.' },
        { title: 'What to expect', tip: 'Good daycares do temperament tests, separate by size/energy, and provide rest periods throughout the day.' },
        { title: 'Signs of a good daycare', tip: 'Webcams, small group sizes, trained staff, clean facilities, and clear communication about your dog\'s day.' },
      ],
      productKeywords: ['collar', 'harness', 'id tag'],
      serviceKeywords: ['daycare', 'day care', 'daily']
    },
    hotels: {
      title: 'Pet-Friendly Hotels',
      description: 'Travel stays that welcome your pet',
      color: 'amber',
      topics: [
        { title: 'Finding pet-friendly stays', tip: 'Book directly with hotels, confirm pet policies, ask about size limits and fees. Some "pet-friendly" hotels have restrictions.' },
        { title: 'Hotel etiquette', tip: 'Never leave your dog alone in the room. Use the "Do Not Disturb" sign. Clean up after accidents immediately.' },
        { title: 'Packing for hotel stays', tip: 'Bring a portable water bowl, bed/blanket from home, waste bags, and a lint roller for furniture.' },
        { title: 'Keeping pets calm', tip: 'Bring familiar items, maintain routine, exercise before settling in, and use calming aids if needed.' },
      ],
      productKeywords: ['travel', 'portable', 'bed', 'bowl'],
      serviceKeywords: ['hotel', 'resort', 'vacation']
    },
    sitting: {
      title: 'Pet Sitting',
      description: 'In-home care while you\'re away',
      color: 'green',
      topics: [
        { title: 'Sitter vs boarding', tip: 'Pet sitting is ideal for anxious dogs, seniors, or pets on medications. They stay in their familiar environment.' },
        { title: 'Finding a good sitter', tip: 'Ask for references, do a meet-and-greet, discuss emergency procedures, and start with a trial visit.' },
        { title: 'Preparing your home', tip: 'Leave detailed instructions, emergency contacts, vet info, and enough supplies. Show where everything is stored.' },
        { title: 'Communication expectations', tip: 'Agree on update frequency. Most sitters send daily photos/videos. Set up a camera if you want real-time checks.' },
      ],
      productKeywords: ['camera', 'feeder', 'smart', 'automatic'],
      serviceKeywords: ['sitting', 'sitter', 'home visit']
    }
  },
  care: {
    grooming: {
      title: 'Grooming',
      description: 'Bathing, brushing & professional coat care',
      color: 'purple',
      topics: [
        { title: 'Grooming frequency', tip: 'Most dogs need professional grooming every 4-8 weeks. Double-coated breeds need more frequent brushing at home.' },
        { title: 'At-home maintenance', tip: 'Brush 2-3 times weekly, check ears weekly, trim nails every 2-3 weeks, and brush teeth daily if possible.' },
        { title: 'Coat types matter', tip: 'Never shave double coats (Huskies, Goldens). Wire coats need hand-stripping. Curly coats mat easily without regular care.' },
        { title: 'Making grooming positive', tip: 'Start young, use treats, keep sessions short, and choose a groomer who uses positive handling techniques.' },
      ],
      productKeywords: ['brush', 'shampoo', 'grooming', 'coat'],
      serviceKeywords: ['grooming', 'groomer', 'bath', 'haircut']
    },
    health: {
      title: 'Health & Wellness',
      description: 'Preventive care & regular checkups',
      color: 'red',
      topics: [
        { title: 'Annual checkups', tip: 'Even healthy dogs need yearly exams. Senior dogs (7+) benefit from twice-yearly visits to catch issues early.' },
        { title: 'Vaccination schedule', tip: 'Core vaccines: Rabies, DHPP. Non-core based on lifestyle: Bordetella, Lyme, Leptospirosis. Follow your vet\'s advice.' },
        { title: 'Parasite prevention', tip: 'Year-round heartworm prevention is essential. Flea/tick prevention based on your area. Regular deworming schedule.' },
        { title: 'Warning signs', tip: 'Watch for changes in appetite, energy, bathroom habits, or behavior. When in doubt, call your vet.' },
      ],
      productKeywords: ['supplement', 'vitamin', 'health', 'wellness'],
      serviceKeywords: ['vet', 'checkup', 'vaccination', 'clinic']
    },
    dental: {
      title: 'Dental Care',
      description: 'Teeth cleaning & oral health',
      color: 'blue',
      topics: [
        { title: 'Why dental care matters', tip: '80% of dogs show dental disease by age 3. It can lead to heart, kidney, and liver problems if untreated.' },
        { title: 'Daily brushing', tip: 'Use dog-specific toothpaste (never human). Start slow, make it positive. Even 30 seconds daily helps.' },
        { title: 'Professional cleanings', tip: 'Annual dental cleanings under anesthesia allow thorough examination and cleaning below the gumline.' },
        { title: 'Signs of dental problems', tip: 'Bad breath, yellow/brown teeth, bleeding gums, difficulty eating, or pawing at mouth need vet attention.' },
      ],
      productKeywords: ['dental', 'tooth', 'chew', 'breath'],
      serviceKeywords: ['dental', 'teeth', 'cleaning']
    },
    skin: {
      title: 'Skin & Coat',
      description: 'Addressing skin issues & maintaining coat health',
      color: 'amber',
      topics: [
        { title: 'Common skin issues', tip: 'Allergies (food or environmental), hot spots, dry skin, and parasites are the most common causes of skin problems.' },
        { title: 'Diet and skin health', tip: 'Omega-3 fatty acids support skin health. Consider fish oil supplements or foods rich in healthy fats.' },
        { title: 'When to see a vet', tip: 'Excessive scratching, hair loss, redness, bumps, or changes in coat texture warrant a vet visit.' },
        { title: 'Seasonal care', tip: 'Humidity affects skin. Use humidifiers in winter. Rinse paws after walks. Protect from sun in summer.' },
      ],
      productKeywords: ['skin', 'coat', 'omega', 'allergy'],
      serviceKeywords: ['dermatology', 'skin', 'allergy']
    }
  },
  fit: {
    exercise: {
      title: 'Exercise Plans',
      description: 'Daily activity routines for a healthy dog',
      color: 'green',
      topics: [
        { title: 'Exercise needs by breed', tip: 'High-energy breeds need 1-2 hours daily. Brachycephalic breeds need shorter, gentler sessions. Know your dog.' },
        { title: 'Types of exercise', tip: 'Mix it up: walks, fetch, swimming, agility, nose work. Mental exercise tires dogs as much as physical.' },
        { title: 'Signs of enough exercise', tip: 'A well-exercised dog is calm at home, sleeps well, and doesn\'t engage in destructive behaviors.' },
        { title: 'Exercise safety', tip: 'Avoid exercise in extreme heat. Watch for limping or excessive panting. Build stamina gradually.' },
      ],
      productKeywords: ['ball', 'frisbee', 'toy', 'active'],
      serviceKeywords: ['walking', 'exercise', 'fitness']
    },
    weight: {
      title: 'Weight Management',
      description: 'Maintaining a healthy weight',
      color: 'orange',
      topics: [
        { title: 'Is your dog overweight?', tip: 'You should feel ribs easily, see a waist from above, and a tummy tuck from the side. Ask your vet for body condition score.' },
        { title: 'Portion control', tip: 'Measure food precisely. Treats should be max 10% of daily calories. Reduce portions if weight increases.' },
        { title: 'Weight loss tips', tip: 'Reduce food by 10-20%, increase exercise gradually, use low-calorie treats, and track progress weekly.' },
        { title: 'Health risks of obesity', tip: 'Overweight dogs face joint problems, diabetes, heart disease, and shorter lifespans. Prevention is easier than cure.' },
      ],
      productKeywords: ['diet', 'weight', 'low calorie', 'portion'],
      serviceKeywords: ['nutrition', 'weight', 'diet']
    },
    agility: {
      title: 'Agility Training',
      description: 'Fun obstacle courses and active play',
      color: 'blue',
      topics: [
        { title: 'Benefits of agility', tip: 'Builds confidence, strengthens bond, provides mental stimulation, and is great exercise for high-energy dogs.' },
        { title: 'Getting started', tip: 'Start with basic obedience first. Find a beginner class. Most dogs can start agility foundations at any age.' },
        { title: 'Home agility setup', tip: 'DIY jumps, tunnels, and weave poles. Start low and slow. Focus on fun, not perfection.' },
        { title: 'Safety considerations', tip: 'Wait until growth plates close (12-18 months) for high jumps. Always warm up. Stop if dog shows discomfort.' },
      ],
      productKeywords: ['agility', 'tunnel', 'jump', 'obstacle'],
      serviceKeywords: ['agility', 'training', 'class']
    },
    swimming: {
      title: 'Swimming',
      description: 'Low-impact exercise & water therapy',
      color: 'cyan',
      topics: [
        { title: 'Benefits of swimming', tip: 'Zero-impact on joints, great for arthritis, builds muscle, and most dogs love it once introduced properly.' },
        { title: 'Teaching your dog to swim', tip: 'Start shallow, support their belly, use a life jacket, never force it. Some breeds are natural swimmers, others aren\'t.' },
        { title: 'Pool safety', tip: 'Always supervise. Teach pool exit points. Rinse chlorine off after. Watch for water intoxication from drinking pool water.' },
        { title: 'Hydrotherapy', tip: 'Professional hydrotherapy helps recovery from surgery, manages arthritis, and builds strength safely.' },
      ],
      productKeywords: ['life jacket', 'pool', 'swim', 'water'],
      serviceKeywords: ['swimming', 'hydrotherapy', 'pool']
    }
  },
  travel: {
    flights: {
      title: 'Air Travel',
      description: 'Flying safely with your pet',
      color: 'sky',
      topics: [
        { title: 'Cabin vs cargo', tip: 'Small dogs under 8kg can usually fly in-cabin. Larger dogs fly cargo. Avoid cargo in extreme weather.' },
        { title: 'Preparation checklist', tip: 'Health certificate (10 days before), airline-approved carrier, familiar bedding, frozen water dish, and no sedation unless vet-approved.' },
        { title: 'Choosing airlines', tip: 'Research pet policies carefully. Some airlines are more pet-friendly. Direct flights are always better.' },
        { title: 'Arrival preparation', tip: 'Have carrier documents ready, find pet relief areas, and give your dog time to decompress after the flight.' },
      ],
      productKeywords: ['carrier', 'travel', 'airline', 'flight'],
      serviceKeywords: ['pet transport', 'travel', 'relocation']
    },
    road: {
      title: 'Road Trips',
      description: 'Car travel essentials and safety',
      color: 'green',
      topics: [
        { title: 'Car safety', tip: 'Use a crash-tested crate or car harness. Never let dogs ride in front seats or hang heads out windows.' },
        { title: 'Planning stops', tip: 'Stop every 2-3 hours for bathroom breaks and stretching. Research pet-friendly rest stops on your route.' },
        { title: 'Preventing car sickness', tip: 'Don\'t feed right before travel. Start with short trips. Keep car cool and well-ventilated. Ginger treats may help.' },
        { title: 'Never leave in car', tip: 'Even on mild days, cars heat up dangerously fast. Never leave your dog unattended, even for "just a minute."' },
      ],
      productKeywords: ['car seat', 'harness', 'barrier', 'travel bowl'],
      serviceKeywords: ['pet taxi', 'transport', 'travel']
    },
    destinations: {
      title: 'Pet-Friendly Destinations',
      description: 'Where to travel with your pet',
      color: 'amber',
      topics: [
        { title: 'Researching destinations', tip: 'Look for dog-friendly beaches, hiking trails, restaurants, and accommodations. Some cities are more welcoming than others.' },
        { title: 'International travel', tip: 'Start planning 6+ months ahead. Requirements vary by country: microchip, rabies titer tests, quarantine periods.' },
        { title: 'Pet-friendly activities', tip: 'Outdoor dining, hiking, beach visits, and pet-friendly attractions make trips enjoyable for everyone.' },
        { title: 'Emergency prep', tip: 'Research vets at your destination. Carry pet first aid kit. Have copies of medical records and recent photos.' },
      ],
      productKeywords: ['travel', 'portable', 'outdoor', 'adventure'],
      serviceKeywords: ['travel planning', 'concierge', 'vacation']
    },
    gear: {
      title: 'Travel Gear',
      description: 'Essential equipment for pet travel',
      color: 'purple',
      topics: [
        { title: 'Must-have items', tip: 'Collapsible bowls, travel water bottle, waste bags, first aid kit, vaccination records, and recent photos.' },
        { title: 'Choosing a carrier', tip: 'Size appropriately (room to stand and turn), check airline dimensions, ensure good ventilation, and practice using it before travel.' },
        { title: 'Comfort items', tip: 'Bring familiar bedding, favorite toy, and a worn t-shirt with your scent to reduce anxiety.' },
        { title: 'Tech for travel', tip: 'GPS collar/tag, portable water filter, cooling mat for hot destinations, and a pet camera for check-ins.' },
      ],
      productKeywords: ['travel', 'carrier', 'portable', 'gear'],
      serviceKeywords: ['pet store', 'supplies', 'equipment']
    }
  },
  dine: {
    fresh: {
      title: 'Fresh Food',
      description: 'Home-cooked & fresh meal options',
      color: 'green',
      topics: [
        { title: 'Benefits of fresh food', tip: 'Better digestibility, fewer fillers, you control ingredients. Great for dogs with allergies or sensitivities.' },
        { title: 'Balanced meals', tip: 'Dogs need protein, carbs, fats, vitamins, and minerals in the right proportions. Consult a pet nutritionist for recipes.' },
        { title: 'Fresh food services', tip: 'Subscription services deliver pre-portioned, balanced fresh meals. Convenient alternative to home cooking.' },
        { title: 'Transitioning to fresh', tip: 'Switch gradually over 7-10 days. Mix increasing amounts of new food with old to avoid digestive upset.' },
      ],
      productKeywords: ['fresh', 'meal', 'food', 'diet'],
      serviceKeywords: ['fresh food', 'meal delivery', 'nutrition']
    },
    dry: {
      title: 'Dry Food',
      description: 'Kibble selection and feeding tips',
      color: 'amber',
      topics: [
        { title: 'Choosing quality kibble', tip: 'Look for named meat as first ingredient, no artificial preservatives, appropriate for life stage (puppy/adult/senior).' },
        { title: 'Reading labels', tip: 'Ingredients listed by weight. "Chicken meal" is more concentrated protein than "chicken." Avoid vague terms like "meat by-products."' },
        { title: 'Storage tips', tip: 'Keep in original bag inside airtight container. Store in cool, dry place. Use within 6 weeks of opening.' },
        { title: 'Enhancing kibble', tip: 'Add warm water, bone broth, or fresh toppers to increase palatability and hydration.' },
      ],
      productKeywords: ['kibble', 'dry food', 'dog food'],
      serviceKeywords: ['nutrition', 'food', 'diet']
    },
    treats: {
      title: 'Treats',
      description: 'Healthy snacks and training rewards',
      color: 'pink',
      topics: [
        { title: 'Treat guidelines', tip: 'Treats should be max 10% of daily calories. Use small pieces for training. Balance treats with meal portions.' },
        { title: 'Healthy options', tip: 'Carrots, apple slices, frozen berries, plain cooked chicken, and commercial single-ingredient treats are great choices.' },
        { title: 'Treats to avoid', tip: 'Grapes, raisins, chocolate, xylitol, onions, and garlic are toxic. Check ingredients in commercial treats.' },
        { title: 'Training treats', tip: 'Use high-value treats (cheese, meat) for new behaviors. Lower value treats for known commands. Vary to keep interest.' },
      ],
      productKeywords: ['treat', 'snack', 'reward', 'chew'],
      serviceKeywords: ['bakery', 'treats', 'food']
    },
    special: {
      title: 'Special Diets',
      description: 'Allergies, sensitivities & medical diets',
      color: 'blue',
      topics: [
        { title: 'Common food allergies', tip: 'Beef, dairy, wheat, chicken, and eggs are common triggers. True food allergies require elimination diets to identify.' },
        { title: 'Prescription diets', tip: 'Vet-prescribed diets for kidney disease, diabetes, GI issues, or allergies. Don\'t switch without vet guidance.' },
        { title: 'Limited ingredient diets', tip: 'Fewer ingredients mean easier identification of triggers. Novel proteins (duck, venison, kangaroo) help with allergies.' },
        { title: 'Working with your vet', tip: 'Keep a food diary. Elimination trials take 8-12 weeks. Don\'t give up too early on dietary changes.' },
      ],
      productKeywords: ['hypoallergenic', 'sensitive', 'limited', 'special'],
      serviceKeywords: ['nutrition', 'diet', 'allergy']
    }
  },
  enjoy: {
    events: {
      title: 'Pet Events',
      description: 'Fun activities and gatherings for pets',
      color: 'pink',
      topics: [
        { title: 'Types of events', tip: 'Dog shows, pet expos, charity walks, breed meetups, and seasonal festivals. Check local pet communities for events.' },
        { title: 'Preparing for events', tip: 'Ensure vaccinations are current, bring water and snacks, plan rest breaks, and watch for signs of stress.' },
        { title: 'Event etiquette', tip: 'Keep dog on leash unless designated off-leash area. Ask before approaching other dogs. Clean up after your pet.' },
        { title: 'Finding events', tip: 'Follow local pet stores, breed clubs, and community pages. Apps like Meetup often list pet-friendly gatherings.' },
      ],
      productKeywords: ['bandana', 'costume', 'accessory', 'party'],
      serviceKeywords: ['event', 'party', 'gathering']
    },
    playdates: {
      title: 'Playdates',
      description: 'Socializing with other dogs',
      color: 'blue',
      topics: [
        { title: 'Benefits of playdates', tip: 'Regular socialization reduces anxiety, improves behavior, and provides mental stimulation. Dogs are social animals.' },
        { title: 'Finding playmates', tip: 'Similar size and energy levels work best. Introduce on neutral ground first. Start with one-on-one before groups.' },
        { title: 'Supervising play', tip: 'Watch body language. Breaks prevent overstimulation. Intervene if play gets too rough or one dog seems stressed.' },
        { title: 'Safety tips', tip: 'Both dogs should be vaccinated and parasite-free. Have separate water bowls. Know when to end the session.' },
      ],
      productKeywords: ['toy', 'ball', 'tug', 'interactive'],
      serviceKeywords: ['playdate', 'social', 'dog park']
    },
    toys: {
      title: 'Toys & Games',
      description: 'Interactive play and entertainment',
      color: 'amber',
      topics: [
        { title: 'Toy rotation', tip: 'Rotate toys weekly to maintain novelty. Keep favorites available but cycle others to prevent boredom.' },
        { title: 'Types of toys', tip: 'Chew toys for alone time, interactive toys for bonding, puzzle toys for mental stimulation, and comfort toys for security.' },
        { title: 'Safety considerations', tip: 'Choose size-appropriate toys. Inspect regularly for damage. Supervise with new toys until you know how your dog plays.' },
        { title: 'DIY games', tip: 'Hide and seek, muffin tin puzzle, cardboard box surprises, and frozen treats provide free enrichment.' },
      ],
      productKeywords: ['toy', 'ball', 'puzzle', 'interactive'],
      serviceKeywords: ['pet store', 'toys', 'games']
    },
    enrichment: {
      title: 'Enrichment',
      description: 'Mental stimulation activities',
      color: 'purple',
      topics: [
        { title: 'Why enrichment matters', tip: 'Mental exercise tires dogs faster than physical. Bored dogs develop behavioral problems. 15 minutes of enrichment = 30 min walk.' },
        { title: 'Enrichment ideas', tip: 'Snuffle mats, lick mats, frozen Kongs, nose work games, and training sessions all count as enrichment.' },
        { title: 'Sensory enrichment', tip: 'New scents, textures, sounds, and environments stimulate dogs. Even a new walking route provides enrichment.' },
        { title: 'Daily enrichment routine', tip: 'Incorporate enrichment into meals (puzzle feeders), walks (sniff time), and play (training games).' },
      ],
      productKeywords: ['puzzle', 'snuffle', 'lick mat', 'enrichment'],
      serviceKeywords: ['enrichment', 'training', 'activities']
    }
  },
  celebrate: {
    birthdays: {
      title: 'Birthdays',
      description: 'Celebrating your pet\'s special day',
      color: 'pink',
      topics: [
        { title: 'Planning a pawty', tip: 'Keep it small and low-stress. A few dog friends, some special treats, and a new toy make it memorable.' },
        { title: 'Dog-safe cakes', tip: 'Peanut butter, pumpkin, and banana are great cake bases. Avoid chocolate, xylitol, and excessive sugar.' },
        { title: 'Party favors', tip: 'Small treats, bandanas, or toys make great takeaways for dog guests. Human guests love pet-themed items.' },
        { title: 'Capturing memories', tip: 'Get a birthday photoshoot. The best shots come when dogs are relaxed - usually after playtime.' },
      ],
      productKeywords: ['cake', 'birthday', 'party', 'celebration'],
      serviceKeywords: ['birthday', 'party', 'celebration', 'bakery']
    },
    gotcha: {
      title: 'Gotcha Day',
      description: 'Celebrating adoption anniversaries',
      color: 'purple',
      topics: [
        { title: 'What is Gotcha Day?', tip: 'The anniversary of when you adopted your pet. Many pet parents celebrate this as their dog\'s "second birthday."' },
        { title: 'Celebration ideas', tip: 'Special outing to their favorite place, new toy, gourmet treats, or a spa day at the groomer.' },
        { title: 'Reflecting on the journey', tip: 'Compare photos from adoption day to now. Share your rescue story to inspire others to adopt.' },
        { title: 'Paying it forward', tip: 'Donate to the shelter you adopted from, volunteer, or foster another animal in need.' },
      ],
      productKeywords: ['hamper', 'gift', 'treat', 'special'],
      serviceKeywords: ['celebration', 'spa', 'grooming']
    },
    gifts: {
      title: 'Gifts',
      description: 'Perfect presents for pets',
      color: 'amber',
      topics: [
        { title: 'Choosing gifts', tip: 'Consider your dog\'s play style. Chewers need durable toys, fetchers want balls, snugglers love plush toys.' },
        { title: 'Subscription boxes', tip: 'Monthly pet boxes provide variety and excitement. Great for dogs who love surprises.' },
        { title: 'Experience gifts', tip: 'Training class enrollment, spa day, or adventure outing create memories beyond material items.' },
        { title: 'Gift safety', tip: 'Remove packaging, check for small parts, and supervise with new items until you know they\'re safe.' },
      ],
      productKeywords: ['gift', 'hamper', 'box', 'treat'],
      serviceKeywords: ['gift', 'shopping', 'delivery']
    },
    photoshoots: {
      title: 'Photoshoots',
      description: 'Professional pet photography',
      color: 'blue',
      topics: [
        { title: 'Preparing for a shoot', tip: 'Groom your dog, bring favorite treats, exercise beforehand for calm energy. Tired dogs photograph better.' },
        { title: 'Finding a pet photographer', tip: 'Look for someone experienced with animals. They know how to get natural expressions and handle unexpected moments.' },
        { title: 'DIY photography tips', tip: 'Natural light is best. Get down to dog\'s eye level. Use treats to get attention. Take lots of shots.' },
        { title: 'Display ideas', tip: 'Canvas prints, photo books, calendar with monthly photos, or digital frames that rotate images.' },
      ],
      productKeywords: ['accessory', 'costume', 'bandana', 'bow tie'],
      serviceKeywords: ['photography', 'photoshoot', 'portrait']
    }
  },
  emergency: {
    vet: {
      title: 'Emergency Vet',
      description: '24/7 veterinary emergency care',
      color: 'red',
      topics: [
        { title: 'When to go to ER', tip: 'Difficulty breathing, severe bleeding, collapse, bloated abdomen, seizures, inability to urinate, or ingestion of toxins need immediate care.' },
        { title: 'Be prepared', tip: 'Know your nearest 24-hour emergency vet. Save the number in your phone. Keep carrier accessible.' },
        { title: 'What to bring', tip: 'Medical records, list of medications, description of symptoms and timeline, any substance ingested.' },
        { title: 'Cost considerations', tip: 'Emergency care is expensive. Pet insurance or emergency fund helps. Most ERs offer payment plans.' },
      ],
      productKeywords: ['first aid', 'emergency', 'carrier'],
      serviceKeywords: ['emergency vet', '24 hour', 'urgent care']
    },
    firstaid: {
      title: 'First Aid',
      description: 'Basic emergency care skills',
      color: 'orange',
      topics: [
        { title: 'First aid kit essentials', tip: 'Gauze, bandages, hydrogen peroxide (for inducing vomiting only if directed), tweezers, emergency vet number, and muzzle.' },
        { title: 'Basic CPR', tip: 'Check airway, give rescue breaths, and chest compressions. Take a pet first aid class to learn proper technique.' },
        { title: 'Wound care', tip: 'Apply pressure to stop bleeding. Clean with saline. Don\'t use hydrogen peroxide on wounds. Seek vet care for deep wounds.' },
        { title: 'Choking', tip: 'Check mouth for obstructions. Small dogs: hold upside down and shake. Large dogs: Heimlich-like thrust. Then go to vet.' },
      ],
      productKeywords: ['first aid', 'kit', 'bandage', 'emergency'],
      serviceKeywords: ['first aid', 'training', 'class']
    },
    poison: {
      title: 'Poison Control',
      description: 'Toxin exposure and treatment',
      color: 'purple',
      topics: [
        { title: 'Common toxins', tip: 'Chocolate, xylitol, grapes, onions, certain plants, medications, and household chemicals can be fatal.' },
        { title: 'What to do', tip: 'Call poison control or vet immediately. Don\'t induce vomiting unless instructed. Note what and how much was ingested.' },
        { title: 'Prevention', tip: 'Store toxins out of reach. Check plant toxicity before buying. Read food labels. Keep medications secured.' },
        { title: 'Emergency numbers', tip: 'ASPCA Poison Control: 888-426-4435 (fee applies). Pet Poison Helpline: 855-764-7661. Save in your phone.' },
      ],
      productKeywords: ['safety', 'storage', 'lock', 'prevention'],
      serviceKeywords: ['poison control', 'toxicology', 'emergency']
    },
    lost: {
      title: 'Lost Pet',
      description: 'Finding lost pets and prevention',
      color: 'blue',
      topics: [
        { title: 'Immediate steps', tip: 'Search nearby areas. Post on social media immediately. Contact local shelters, vets, and microchip company.' },
        { title: 'Prevention', tip: 'Microchip (and keep info updated!), ID tags, GPS collar, and secure fencing/leashing prevent most lost pet situations.' },
        { title: 'Search tips', tip: 'Most dogs are found within a mile of home. Search at dawn/dusk when it\'s quiet. Bring treats and their favorite toy.' },
        { title: 'Flyers and posting', tip: 'Large, clear photo. Distinctive features. Reward. Post at eye level. Share in local Facebook groups and Nextdoor.' },
      ],
      productKeywords: ['gps', 'tracker', 'id tag', 'microchip'],
      serviceKeywords: ['lost pet', 'finder', 'rescue']
    }
  },
  advisory: {
    behavior: {
      title: 'Behavior',
      description: 'Expert behavior guidance',
      color: 'purple',
      topics: [
        { title: 'When to seek help', tip: 'Aggression, severe anxiety, destructive behavior, or any issue affecting quality of life needs professional assessment.' },
        { title: 'Behaviorist vs trainer', tip: 'Trainers teach commands. Behaviorists (often vets) address underlying psychological issues. Choose based on your needs.' },
        { title: 'What to expect', tip: 'Thorough history, observation, customized behavior modification plan, and ongoing support. Results take time and consistency.' },
        { title: 'Your role', tip: 'Consistency is key. All family members must follow the plan. Keep a behavior diary. Celebrate small wins.' },
      ],
      productKeywords: ['calming', 'anxiety', 'training', 'behavior'],
      serviceKeywords: ['behaviorist', 'behavior', 'consultation']
    },
    nutrition: {
      title: 'Nutrition',
      description: 'Diet and feeding guidance',
      color: 'green',
      topics: [
        { title: 'Consulting a nutritionist', tip: 'Especially helpful for allergies, medical conditions, homemade diets, or if your dog is a picky eater.' },
        { title: 'What they assess', tip: 'Current diet, health conditions, activity level, age, and goals. They create personalized feeding plans.' },
        { title: 'Homemade diet guidance', tip: 'If cooking for your dog, a nutritionist ensures meals are complete and balanced. This is crucial for long-term health.' },
        { title: 'Weight management', tip: 'Nutritionists calculate exact calorie needs, recommend appropriate foods, and create sustainable weight loss plans.' },
      ],
      productKeywords: ['food', 'supplement', 'diet', 'nutrition'],
      serviceKeywords: ['nutritionist', 'nutrition', 'diet']
    },
    training: {
      title: 'Training',
      description: 'Professional training guidance',
      color: 'blue',
      topics: [
        { title: 'Finding the right trainer', tip: 'Look for positive reinforcement methods, certifications (CPDT, KPA), and good reviews. Avoid anyone using punishment.' },
        { title: 'Types of training', tip: 'Group classes for socialization, private sessions for specific issues, board-and-train for intensive work.' },
        { title: 'Training success factors', tip: 'Consistency, patience, short sessions, high-value rewards, and practice between sessions are key.' },
        { title: 'Continuing education', tip: 'Training isn\'t one-and-done. Regular practice, new tricks, and ongoing enrichment keep skills sharp.' },
      ],
      productKeywords: ['training', 'treat', 'clicker', 'leash'],
      serviceKeywords: ['trainer', 'training', 'class']
    },
    health: {
      title: 'Health',
      description: 'Medical guidance and second opinions',
      color: 'red',
      topics: [
        { title: 'When to get a second opinion', tip: 'Major diagnoses, expensive treatments, or if something doesn\'t feel right. Good vets welcome second opinions.' },
        { title: 'Specialist referrals', tip: 'For complex issues, specialists (oncologists, cardiologists, etc.) offer expertise your regular vet may not have.' },
        { title: 'Telehealth options', tip: 'Virtual vet consultations can answer quick questions, help decide if ER is needed, and provide peace of mind.' },
        { title: 'Holistic options', tip: 'Acupuncture, chiropractic, and herbal medicine can complement conventional care. Choose practitioners with veterinary training.' },
      ],
      productKeywords: ['supplement', 'health', 'wellness', 'care'],
      serviceKeywords: ['vet', 'specialist', 'consultation']
    }
  },
  farewell: {
    endoflife: {
      title: 'End-of-Life Care',
      description: 'Compassionate care for senior pets',
      color: 'purple',
      topics: [
        { title: 'Quality of life assessment', tip: 'Track good days vs bad days. Consider mobility, pain levels, appetite, and joy. Your vet can help with assessment tools.' },
        { title: 'Palliative care', tip: 'Pain management, comfort measures, and quality-of-life focus help pets live their best remaining days.' },
        { title: 'Making the decision', tip: 'It\'s the hardest decision. Better a day too early than a day too late. Trust your bond with your pet.' },
        { title: 'Being present', tip: 'Most pets can have their family present during euthanasia. It\'s peaceful. Your presence brings comfort.' },
      ],
      productKeywords: ['comfort', 'bed', 'senior', 'care'],
      serviceKeywords: ['hospice', 'palliative', 'end of life']
    },
    cremation: {
      title: 'Cremation',
      description: 'Cremation services and options',
      color: 'amber',
      topics: [
        { title: 'Types of cremation', tip: 'Private (just your pet), partitioned (separated), or communal (multiple pets together). Understand what you\'re choosing.' },
        { title: 'Receiving ashes', tip: 'Private cremation returns your pet\'s ashes, usually within a week. You can choose urns or keepsakes.' },
        { title: 'Verification', tip: 'Reputable crematoriums offer tracking, certificates, and some even allow witnessing. Ask questions if uncertain.' },
        { title: 'Cost considerations', tip: 'Prices vary by pet size and cremation type. Many vets can arrange this or recommend trusted services.' },
      ],
      productKeywords: ['urn', 'memorial', 'keepsake'],
      serviceKeywords: ['cremation', 'crematory', 'ashes']
    },
    memorial: {
      title: 'Memorials',
      description: 'Honoring your pet\'s memory',
      color: 'blue',
      topics: [
        { title: 'Memorial options', tip: 'Urns, jewelry with ashes, garden stones, paw print art, photo books, or charitable donations in their name.' },
        { title: 'Creating rituals', tip: 'Plant a tree, create a memory box, write a letter, or hold a small ceremony. Rituals help process grief.' },
        { title: 'Digital memorials', tip: 'Online memorial pages, social media tributes, and photo slideshows let you share memories with others.' },
        { title: 'Living memorials', tip: 'Volunteer at shelters, foster animals, or donate to causes your pet would have supported.' },
      ],
      productKeywords: ['memorial', 'urn', 'keepsake', 'frame'],
      serviceKeywords: ['memorial', 'tribute', 'remembrance']
    },
    grief: {
      title: 'Grief Support',
      description: 'Coping with pet loss',
      color: 'pink',
      topics: [
        { title: 'Grief is valid', tip: 'Pet loss is real loss. Your feelings are valid. Don\'t let anyone minimize your grief.' },
        { title: 'Support resources', tip: 'Pet loss hotlines, support groups, counselors who specialize in pet loss, and online communities can help.' },
        { title: 'Helping children', tip: 'Be honest, age-appropriate, and allow them to express feelings. Include them in memorials if they want.' },
        { title: 'Other pets', tip: 'Pets grieve too. Maintain routines, give extra attention, and watch for changes in behavior.' },
      ],
      productKeywords: ['book', 'journal', 'comfort'],
      serviceKeywords: ['counseling', 'support', 'grief']
    }
  },
  adopt: {
    dogs: {
      title: 'Adopt a Dog',
      description: 'Finding your perfect rescue match',
      color: 'pink',
      topics: [
        { title: 'Where to adopt', tip: 'Shelters, rescue organizations, breed-specific rescues. Visit multiple places. The right dog will find you.' },
        { title: 'Choosing wisely', tip: 'Consider your lifestyle, space, experience level, and time. Puppies need more work. Adults are often calmer.' },
        { title: 'Meeting potential dogs', tip: 'Spend time together. Walk them if possible. Ask about history, behavior, and medical needs.' },
        { title: 'The adoption process', tip: 'Applications, home checks, and fees support responsible adoption. Be patient with the process.' },
      ],
      productKeywords: ['starter', 'essential', 'new dog', 'adoption'],
      serviceKeywords: ['adoption', 'shelter', 'rescue']
    },
    foster: {
      title: 'Foster',
      description: 'Temporary care for dogs in need',
      color: 'purple',
      topics: [
        { title: 'Why foster?', tip: 'Saves lives by freeing shelter space. Test dog ownership without permanent commitment. Incredibly rewarding.' },
        { title: 'What\'s involved', tip: 'Provide food, love, and basic care. Organization covers medical costs. Duration varies from days to months.' },
        { title: 'Foster challenges', tip: 'Letting go is hard (foster fail is real!). Some dogs have behavioral or medical needs. Support is available.' },
        { title: 'Getting started', tip: 'Contact local rescues. Fill out applications. Attend orientation. Start with short-term fosters.' },
      ],
      productKeywords: ['crate', 'bed', 'bowl', 'essential'],
      serviceKeywords: ['foster', 'rescue', 'shelter']
    },
    shelters: {
      title: 'Shelters',
      description: 'Supporting local shelters',
      color: 'blue',
      topics: [
        { title: 'How to help', tip: 'Adopt, foster, volunteer, donate supplies, or fundraise. Every bit helps shelters save more lives.' },
        { title: 'Volunteering', tip: 'Walk dogs, socialize cats, help with events, or use professional skills (photography, marketing, admin).' },
        { title: 'Donation needs', tip: 'Blankets, towels, toys, cleaning supplies, food, and monetary donations always needed. Call ahead for specific needs.' },
        { title: 'Spreading awareness', tip: 'Share adoptable pets on social media. Educate others about shelter myths. Advocate for adoption.' },
      ],
      productKeywords: ['donation', 'supplies', 'care'],
      serviceKeywords: ['shelter', 'volunteer', 'nonprofit']
    },
    prep: {
      title: 'Adoption Prep',
      description: 'Preparing for a new family member',
      color: 'green',
      topics: [
        { title: 'Home preparation', tip: 'Pet-proof your space. Set up a quiet area. Buy essentials: food, bowls, bed, crate, leash, collar, ID tag.' },
        { title: 'Family preparation', tip: 'Discuss responsibilities. Agree on rules (furniture? bedroom?). Prepare existing pets for new arrival.' },
        { title: 'First days plan', tip: 'Take time off if possible. Go slow. Let dog decompress. Establish routine gradually.' },
        { title: 'The 3-3-3 rule', tip: '3 days to decompress, 3 weeks to learn routine, 3 months to feel home. Be patient during adjustment.' },
      ],
      productKeywords: ['starter kit', 'essential', 'new dog', 'first'],
      serviceKeywords: ['consultation', 'training', 'vet']
    }
  },
  shop: {
    essentials: {
      title: 'Essentials',
      description: 'Must-have items for every pet',
      color: 'blue',
      topics: [
        { title: 'New pet essentials', tip: 'Collar with ID, leash, food & water bowls, bed, crate, food, treats, poop bags, and a few toys to start.' },
        { title: 'Quality matters', tip: 'Invest in durable items you use daily: leash, collar, bed. Save on items dogs destroy quickly.' },
        { title: 'Safety essentials', tip: 'ID tags, microchip registration, first aid kit, and secure crate or car restraint.' },
        { title: 'Seasonal essentials', tip: 'Cooling mats for summer, sweaters for winter, paw protection for extreme weather.' },
      ],
      productKeywords: ['essential', 'basic', 'starter', 'must have'],
      serviceKeywords: ['pet store', 'supplies', 'shopping']
    },
    new: {
      title: 'New Arrivals',
      description: 'Latest products and innovations',
      color: 'green',
      topics: [
        { title: 'Latest innovations', tip: 'Smart feeders, GPS collars, interactive toys, and health monitors are changing pet care.' },
        { title: 'Trending products', tip: 'Check what\'s new in enrichment, sustainable pet products, and health-focused items.' },
        { title: 'Seasonal releases', tip: 'New collections for holidays, weather seasons, and special occasions.' },
        { title: 'Trying new things', tip: 'Introduce new products gradually. Not every trending item suits every dog.' },
      ],
      productKeywords: ['new', 'latest', 'arrival', 'trending'],
      serviceKeywords: ['pet store', 'shopping', 'new']
    },
    bestsellers: {
      title: 'Bestsellers',
      description: 'Most loved products',
      color: 'amber',
      topics: [
        { title: 'Why bestsellers work', tip: 'Popular products have proven track records. Read reviews to understand why they\'re loved.' },
        { title: 'Value picks', tip: 'Bestsellers often offer best value - quality at reasonable prices, tested by many pet parents.' },
        { title: 'Category leaders', tip: 'Each category has standout products. Research before buying to find the best for your needs.' },
        { title: 'Trust but verify', tip: 'Bestseller doesn\'t mean best for YOUR dog. Consider your pet\'s specific needs.' },
      ],
      productKeywords: ['bestseller', 'popular', 'top', 'best'],
      serviceKeywords: ['shopping', 'pet store', 'supplies']
    },
    deals: {
      title: 'Deals',
      description: 'Savings and special offers',
      color: 'red',
      topics: [
        { title: 'Finding deals', tip: 'Subscribe to newsletters, follow social media, and check for seasonal sales.' },
        { title: 'Bulk buying', tip: 'Stock up on non-perishables (poop bags, cleaning supplies) during sales. Check expiration on food.' },
        { title: 'Subscription savings', tip: 'Auto-ship programs often offer 5-15% discounts. Great for regular purchases like food and treats.' },
        { title: 'Smart shopping', tip: 'Compare prices across stores. A deal isn\'t a deal if you don\'t need it.' },
      ],
      productKeywords: ['sale', 'deal', 'discount', 'offer'],
      serviceKeywords: ['shopping', 'deals', 'offers']
    }
  }
};

const PillarTopicModal = ({ isOpen, onClose, pillar, topicSlug }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Get topic configuration
  const pillarTopics = PILLAR_TOPIC_CONTENT[pillar] || {};
  const config = pillarTopics[topicSlug];
  
  // Reset state when topic changes
  useEffect(() => {
    setActiveTab('overview');
    setExpandedTopic(null);
    setProducts([]);
    setServices([]);
  }, [topicSlug, pillar]);
  
  // Fetch products when Products tab is opened
  useEffect(() => {
    if (activeTab === 'products' && config && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab, config]);
  
  // Fetch services when Services tab is opened
  useEffect(() => {
    if (activeTab === 'services' && config && services.length === 0) {
      fetchServices();
    }
  }, [activeTab, config]);
  
  const fetchProducts = async () => {
    if (!config?.productKeywords) return;
    setLoadingProducts(true);
    try {
      // Search for products matching topic keywords
      const keyword = config.productKeywords[0];
      const res = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(keyword)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  const fetchServices = async () => {
    if (!config?.serviceKeywords) return;
    setLoadingServices(true);
    try {
      // Search for services matching topic keywords
      const keyword = config.serviceKeywords[0];
      const res = await fetch(`${API_URL}/api/services?pillar=${pillar}&search=${encodeURIComponent(keyword)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoadingServices(false);
    }
  };
  
  const handleAddToCart = (product, e) => {
    e?.stopPropagation();
    addToCart({
      id: product.id || product._id,
      name: product.name || product.title,
      price: product.price || product.pricing?.selling_price || 999,
      quantity: 1,
      image_url: product.image_url || product.image || product.images?.[0],
      pillar: pillar
    });
    toast.success(`Added ${product.name || product.title} to cart`);
  };
  
  const handleServiceClick = (service) => {
    onClose();
    navigate(`/services?pillar=${pillar}&search=${encodeURIComponent(service.name)}`);
  };
  
  const handleViewAllProducts = () => {
    onClose();
    navigate(`/shop?pillar=${pillar}&search=${encodeURIComponent(config.productKeywords[0])}`);
  };
  
  const handleViewAllServices = () => {
    onClose();
    navigate(`/services?pillar=${pillar}&search=${encodeURIComponent(config.serviceKeywords[0])}`);
  };
  
  // Color mappings
  const colorClasses = {
    pink: 'from-pink-50 to-rose-50',
    purple: 'from-purple-50 to-indigo-50',
    blue: 'from-blue-50 to-cyan-50',
    green: 'from-green-50 to-emerald-50',
    amber: 'from-amber-50 to-yellow-50',
    orange: 'from-orange-50 to-amber-50',
    red: 'from-red-50 to-pink-50',
    sky: 'from-sky-50 to-blue-50',
    cyan: 'from-cyan-50 to-teal-50',
  };
  
  if (!config) return null;
  
  const bgGradient = colorClasses[config.color] || colorClasses.blue;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 rounded-3xl" data-testid="pillar-topic-modal">
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
        
        {/* Header */}
        <div className={`relative h-28 bg-gradient-to-br ${bgGradient}`}>
          <div className="absolute top-4 left-4 pr-12">
            <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-sm">{config.description}</p>
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
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Overview
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
          
          <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              <h3 className="font-semibold text-gray-900 mb-3">What You Should Know</h3>
              <div className="space-y-2">
                {config.topics?.map((topic, idx) => (
                  <Collapsible 
                    key={idx}
                    open={expandedTopic === idx}
                    onOpenChange={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
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
                            <p className="text-xs font-medium text-teal-700 mb-1">Pro Tip</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{topic.tip}</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>
            
            {/* Products Tab */}
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
                        key={product.id || product._id || idx}
                        className="p-3 cursor-pointer hover:shadow-md transition-all group"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                          {(product.image_url || product.image || product.images?.[0]) ? (
                            <img 
                              src={product.image_url || product.image || product.images?.[0]} 
                              alt={product.name || product.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1">{product.name || product.title}</h4>
                        {(product.price || product.pricing?.selling_price) && (
                          <p className="text-sm font-semibold text-teal-600">₹{product.price || product.pricing?.selling_price}</p>
                        )}
                        <Button 
                          size="sm"
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-xs h-8"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to Cart
                        </Button>
                      </Card>
                    ))}
                  </div>
                  <Button
                    onClick={handleViewAllProducts}
                    className="w-full bg-teal-600 hover:bg-teal-700"
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
                    onClick={handleViewAllProducts}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Browse Shop
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Services Tab */}
            <TabsContent value="services" className="mt-0">
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : services.length > 0 ? (
                <div className="space-y-3">
                  {services.map((service, idx) => (
                    <Card 
                      key={service.id || service._id || idx}
                      className="p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl overflow-hidden flex items-center justify-center">
                          {service.image ? (
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                          ) : (
                            <MapPin className="w-5 h-5 text-teal-600" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                          {service.location && (
                            <p className="text-xs text-gray-500">{service.location}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Card>
                  ))}
                  <Button
                    onClick={handleViewAllServices}
                    variant="outline"
                    className="w-full"
                  >
                    View All Services
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Find services near you</p>
                  <Button
                    onClick={handleViewAllServices}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Browse Services
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer */}
        <div className="border-t p-4 bg-gradient-to-br from-gray-50 to-white">
          <Button 
            onClick={() => {
              onClose();
              // Open Mira chat with context
              window.dispatchEvent(new CustomEvent('openMiraChat', { 
                detail: { context: `Help me with ${config.title} for my pet` }
              }));
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 gap-2 h-12 rounded-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Ask Mira About {config.title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PillarTopicModal;
