import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Sparkles, Dog, Calendar, Scissors, Heart, MapPin, Utensils, Plane, 
  ShoppingBag, GraduationCap, Bell, ChevronDown, ChevronRight, Sun, Cloud,
  Clock, Star, MessageCircle, Package, Stethoscope, Home, Dumbbell, Hotel, 
  Briefcase, HelpCircle, Camera, Gift, Coffee, X, ArrowLeft, User, Check,
  Phone, Mail, AlertCircle, Play, BookOpen, RefreshCw, ChevronUp
} from 'lucide-react';
import { API_URL } from '../utils/api';

const API = API_URL;

// ═══════════════════════════════════════════════════════════════════════════════
// OS TABS - The 7 Layers of Mira OS (from Bible)
// ═══════════════════════════════════════════════════════════════════════════════
const OS_TABS = [
  { id: 'today', label: 'Today', icon: Sun, color: 'from-amber-500 to-orange-500' },
  { id: 'picks', label: 'Picks', icon: Sparkles, color: 'from-pink-500 to-rose-500' },
  { id: 'services', label: 'Services', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'from-indigo-500 to-purple-500' },
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, color: 'from-emerald-500 to-teal-500' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PILLARS - The 10+ pillars of pet life
// ═══════════════════════════════════════════════════════════════════════════════
const PILLARS = [
  { id: 'celebrate', label: 'Celebrate', icon: Gift, color: 'from-pink-500 to-rose-500', emoji: '🎂' },
  { id: 'dine', label: 'Dine', icon: Utensils, color: 'from-orange-500 to-amber-500', emoji: '🍖' },
  { id: 'care', label: 'Care', icon: Heart, color: 'from-red-500 to-pink-500', emoji: '💝' },
  { id: 'go', label: 'Go', icon: Plane, color: 'from-teal-500 to-cyan-500', emoji: '✈️' },
  { id: 'play', label: 'Play', icon: Coffee, color: 'from-orange-500 to-amber-500', emoji: '🎾' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'from-indigo-500 to-blue-500', emoji: '📚' },
  { id: 'paperwork', label: 'Paperwork', icon: HelpCircle, color: 'from-yellow-500 to-orange-500', emoji: '📋' },
  { id: 'shop', label: 'Shop', icon: Briefcase, color: 'from-emerald-500 to-teal-500', emoji: '🛒' },
  { id: 'emergency', label: 'Emergency', icon: Dumbbell, color: 'from-red-600 to-rose-600', emoji: '🚨' },
  { id: 'farewell', label: 'Farewell', icon: Hotel, color: 'from-purple-500 to-violet-500', emoji: '🌈' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK REPLIES - Context-aware suggestions based on conversation
// ═══════════════════════════════════════════════════════════════════════════════
const getQuickReplies = (activePillar, petName, lastResponse, actions) => {
  const lower = lastResponse?.toLowerCase() || '';
  
  // Action-based quick replies (after service/picks actions)
  if (actions?.length > 0) {
    const lastAction = actions[actions.length - 1];
    if (lastAction.type === 'service_created') {
      return [
        { text: 'View in Services', icon: Briefcase, action: 'open_services' },
        { text: 'Add more details', icon: MessageCircle },
        { text: 'Start something new', icon: RefreshCw },
      ];
    }
    if (lastAction.type === 'picks') {
      return [
        { text: 'Show more options', icon: Sparkles },
        { text: 'Create one for me', icon: Gift },
        { text: 'Talk to Concierge®', icon: MessageCircle },
      ];
    }
  }
  
  // Context-aware from conversation
  if (lower.includes('birthday') || lower.includes('party')) {
    return [
      { text: `Just want to spoil ${petName}`, icon: Heart },
      { text: 'Cozy celebration at home', icon: Home },
      { text: 'Invite dog friends', icon: Dog },
    ];
  }
  if (lower.includes('walker') || lower.includes('walk')) {
    return [
      { text: 'Morning walks', icon: Sun },
      { text: 'Evening walks', icon: Clock },
      { text: 'Flexible timing', icon: Calendar },
    ];
  }
  if (lower.includes('groom') || lower.includes('spa')) {
    return [
      { text: 'Full spa session', icon: Sparkles },
      { text: 'Just a bath', icon: Heart },
      { text: 'Light trim', icon: Scissors },
    ];
  }
  if (lower.includes('vet') || lower.includes('checkup') || lower.includes('health')) {
    return [
      { text: 'Book vet visit', icon: Stethoscope },
      { text: 'Show me clinics nearby', icon: MapPin },
      { text: 'Regular checkup', icon: Calendar },
    ];
  }
  
  // Pillar-specific defaults
  switch (activePillar) {
    case 'celebrate':
      return [
        { text: `Birthday party for ${petName}`, icon: Gift },
        { text: 'Gotcha day celebration', icon: Heart },
        { text: 'Photo session', icon: Camera },
      ];
    case 'dine':
      return [
        { text: `Healthy treats for ${petName}`, icon: Utensils },
        { text: 'Special meal ideas', icon: Star },
        { text: 'Diet recommendations', icon: Heart },
      ];
    case 'care':
      return [
        { text: 'Book a grooming session', icon: Scissors },
        { text: 'Need a dog walker', icon: Dog },
        { text: 'Vet checkup', icon: Stethoscope },
      ];
    case 'go':
      return [
        { text: 'Plan a trip together', icon: Plane },
        { text: 'Pet-friendly hotels', icon: Hotel },
        { text: 'Travel checklist', icon: Package },
      ];
    case 'shop':
      return [
        { text: 'Browse pet products', icon: Briefcase },
        { text: 'Breed-specific picks', icon: Star },
        { text: 'Soul Made™ gifting', icon: Gift },
      ];
    case 'play':
      return [
        { text: 'Dog parks nearby', icon: MapPin },
        { text: 'Pet-friendly cafes', icon: Coffee },
        { text: 'Playdate ideas', icon: Dog },
      ];
    case 'learn':
      return [
        { text: 'Training tips', icon: GraduationCap },
        { text: 'Behavior help', icon: HelpCircle },
        { text: 'Health guides', icon: Heart },
      ];
    default:
      return [
        { text: `How is ${petName} today?`, icon: Heart },
        { text: 'Show me recommendations', icon: Sparkles },
        { text: 'I need help with something', icon: HelpCircle },
      ];
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PICKS DATA - Returns picks based on pillar
// ═══════════════════════════════════════════════════════════════════════════════
const getPillarPicks = (pillar, petName, allergies = []) => {
  const isChickenFree = allergies.some(a => a?.toLowerCase()?.includes('chicken'));
  
  const allPicks = {
    celebrate: [
      { id: 'c1', name: 'Custom Photo Mug', desc: 'Start your day with your best friend\'s face', price: 'Concierge® creates', icon: '☕', type: 'concierge' },
      { id: 'c2', name: 'Photo Coaster Set', desc: 'Protect surfaces with pet love', price: 'Concierge® creates', icon: '🥤', type: 'concierge' },
      { id: 'c3', name: 'Custom Name Bandana', desc: 'Stylish bandana with embroidered name', price: 'Concierge® creates', icon: '🎀', type: 'concierge' },
      { id: 'c4', name: 'AI Pet Portrait', desc: 'Artistic portrait generated from photos', price: 'Concierge® creates', icon: '🖼️', type: 'concierge' },
      { id: 'c5', name: 'Birthday Party Setup', desc: 'Complete pawty package with decorations', price: 'Price on request', icon: '🎉', type: 'service' },
      { id: 'c6', name: 'Custom Lookalike Plush', desc: 'A plush toy that looks like your pet', price: 'Concierge® creates', icon: '🧸', type: 'concierge' },
    ],
    dine: [
      { id: 'd1', name: 'Premium Wet Food', desc: isChickenFree ? 'Chicken-free recipe' : 'High protein formula', price: '₹450/pack', icon: '🥫', type: 'product' },
      { id: 'd2', name: 'Birthday Cake', desc: isChickenFree ? 'Chicken-free, dog-safe' : 'Dog-safe celebration cake', price: '₹650', icon: '🎂', type: 'product' },
      { id: 'd3', name: 'Dental Treats', desc: 'Keeps teeth clean naturally', price: '₹320/pack', icon: '🦷', type: 'product' },
      { id: 'd4', name: 'Freeze-dried Treats', desc: 'Single ingredient, healthy', price: '₹480', icon: '🍖', type: 'product' },
      { id: 'd5', name: 'Fresh Meal Plan', desc: 'Customised fresh meals delivered', price: 'Price on request', icon: '🥗', type: 'service' },
    ],
    care: [
      { id: 'care1', name: 'Dog Walking', desc: 'Professional walker for daily walks', price: 'Price on request', icon: '🚶', type: 'service' },
      { id: 'care2', name: 'Grooming & Spa', desc: 'Full grooming session', price: 'Price on request', icon: '✂️', type: 'service' },
      { id: 'care3', name: 'Vet Home Visit', desc: 'Veterinarian comes to you', price: 'Price on request', icon: '🏥', type: 'service' },
      { id: 'care4', name: 'Pet Sitting', desc: 'In-home pet care', price: 'Price on request', icon: '🏠', type: 'service' },
      { id: 'care5', name: 'Vaccination', desc: 'Keep vaccinations up to date', price: 'Price on request', icon: '💉', type: 'service' },
    ],
    go: [
      { id: 't1', name: 'Pet-Friendly Hotels', desc: 'Curated accommodations', price: 'Price on request', icon: '🏨', type: 'service' },
      { id: 't2', name: 'Travel Kit', desc: 'Everything for the journey', price: '₹2,200', icon: '🧳', type: 'product' },
      { id: 't3', name: 'Pet Taxi', desc: 'Safe pet transport', price: 'Price on request', icon: '🚗', type: 'service' },
      { id: 't4', name: 'Travel Documents', desc: 'Health certificates & more', price: 'Concierge® handles', icon: '📄', type: 'concierge' },
    ],
    play: [
      { id: 'e1', name: 'Dog Park Visit', desc: 'Find the best parks nearby', price: 'Free', icon: '🌳', type: 'info' },
      { id: 'e2', name: 'Pet Cafe Booking', desc: 'Reserve at pet-friendly spots', price: 'Price on request', icon: '☕', type: 'service' },
      { id: 'e3', name: 'Playdate Matching', desc: 'Find friends for your pet', price: 'Free', icon: '🐕', type: 'service' },
      { id: 'e4', name: 'Interactive Toys', desc: 'Mental stimulation picks', price: '₹850', icon: '🎾', type: 'product' },
    ],
    shop: [
      { id: 'sh1', name: 'Breed Collection', desc: 'Soul-made products for your breed', price: 'Concierge® creates', icon: '🐾', type: 'concierge' },
      { id: 'sh2', name: 'Hamper Gift Box', desc: 'Curated gift set for your dog', price: '₹2,500+', icon: '🎁', type: 'product' },
      { id: 'sh3', name: 'Custom Bandana', desc: 'Personalised with your pet\'s name', price: 'Concierge® creates', icon: '🎀', type: 'concierge' },
      { id: 'sh4', name: 'Merch & Keepsakes', desc: 'Print-on-demand pet merchandise', price: 'Price on request', icon: '👕', type: 'service' },
    ],
    emergency: [
      { id: 'em1', name: 'Emergency Vet', desc: '24/7 emergency vet support', price: 'Price on request', icon: '🚨', type: 'service' },
      { id: 'em2', name: 'First Aid Guide', desc: 'Immediate care instructions', price: 'Free', icon: '🩺', type: 'info' },
      { id: 'em3', name: 'Emergency Kit', desc: 'Essential supplies for any situation', price: '₹1,800', icon: '🏥', type: 'product' },
    ],
    farewell: [
      { id: 'f1', name: 'Rainbow Bridge Memorial', desc: 'A tribute to your beloved', price: 'Concierge® creates', icon: '🌈', type: 'concierge' },
      { id: 'f2', name: 'Memorial Canvas Print', desc: 'Beautiful portrait print', price: '₹3,500', icon: '🖼️', type: 'product' },
      { id: 'f3', name: 'Pawprint Keepsake', desc: 'Precious memory keepsake', price: '₹2,200', icon: '🐾', type: 'product' },
    ],
    learn: [
      { id: 'l1', name: 'Basic Training', desc: 'Obedience fundamentals', price: 'Price on request', icon: '📚', type: 'service' },
      { id: 'l2', name: 'Behavior Consultation', desc: 'Address specific issues', price: 'Price on request', icon: '🧠', type: 'service' },
      { id: 'l3', name: 'Puppy School', desc: 'Socialization & basics', price: 'Price on request', icon: '🎓', type: 'service' },
    ],
    paperwork: [
      { id: 'pw1', name: 'Pet Passport', desc: 'Travel documents arranged', price: 'Concierge® handles', icon: '🛂', type: 'concierge' },
      { id: 'pw2', name: 'Vaccination Certificate', desc: 'Official health certificate', price: 'Concierge® handles', icon: '💉', type: 'concierge' },
      { id: 'pw3', name: 'Microchip Registration', desc: 'Permanent ID registration', price: 'Price on request', icon: '📡', type: 'service' },
      { id: 'pw4', name: 'Insurance Documentation', desc: 'Pet insurance paperwork', price: 'Price on request', icon: '📋', type: 'service' },
    ],
    advisory: [
      { id: 'a1', name: 'Nutrition Advice', desc: 'Diet planning help', price: 'Free', icon: '🥗', type: 'info' },
      { id: 'a2', name: 'Health Questions', desc: 'General wellness guidance', price: 'Free', icon: '❤️', type: 'info' },
      { id: 'a3', name: 'Breed Guide', desc: 'Breed-specific info', price: 'Free', icon: '📖', type: 'info' },
    ],
    services: [
      { id: 'sv1', name: 'All Services', desc: 'Browse all available services', price: 'Varies', icon: '🔧', type: 'service' },
      { id: 'sv2', name: 'My Requests', desc: 'Track your service requests', price: '-', icon: '📋', type: 'info' },
      { id: 'sv3', name: 'Concierge® Chat', desc: 'Talk to our team', price: 'Free', icon: '💬', type: 'service' },
    ],
  };
  
  return allPicks[pillar] || allPicks.celebrate;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOJO PROFILE MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const MojoProfileModal = ({ pet, isOpen, onClose }) => {
  if (!isOpen || !pet) return null;
  
  const soulData = pet.soul_data || {};
  const healthData = pet.health_data || {};
  const allergies = healthData.allergies || pet.allergies || [];
  const personality = soulData.personality || [];
  const preferences = soulData.preferences || {};
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="mojo-modal">
      <div className="bg-slate-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
              {pet.name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{pet.name}</h2>
              <p className="text-xs text-slate-400">{pet.breed} • {pet.age || 'Age unknown'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="mojo-close-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Soul Score */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-300">Soul Score</span>
              <span className="text-2xl font-bold text-white">{soulData.soul_completeness || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${soulData.soul_completeness || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">The more Mira knows, the better she can help</p>
          </div>
          
          {/* Personality */}
          {personality.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                Personality
              </h3>
              <div className="flex flex-wrap gap-2">
                {personality.map((trait, i) => (
                  <span key={i} className="tdc-chip tdc-chip-dark" style={{ background:'rgba(236,72,153,0.2)', color:'#f9a8d4', borderColor:'rgba(236,72,153,0.3)' }}>
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Allergies */}
          {allergies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, i) => (
                  <span key={i} className="tdc-chip tdc-chip-dark" style={{ background:'rgba(239,68,68,0.2)', color:'#fca5a5', borderColor:'rgba(239,68,68,0.3)' }}>
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Favorites */}
          {preferences.favorite_activities?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Loves
              </h3>
              <div className="flex flex-wrap gap-2">
                {preferences.favorite_activities.map((activity, i) => (
                  <span key={i} className="tdc-chip tdc-chip-dark" style={{ background:'rgba(234,179,8,0.2)', color:'#fde047', borderColor:'rgba(234,179,8,0.3)' }}>
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            {pet.birthday && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Birthday</p>
                <p className="text-sm text-white">{pet.birthday}</p>
              </div>
            )}
            {pet.city && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">City</p>
                <p className="text-sm text-white">{pet.city}</p>
              </div>
            )}
            {soulData.energy_level && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Energy Level</p>
                <p className="text-sm text-white">{soulData.energy_level}/10</p>
              </div>
            )}
            {soulData.temperament && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Temperament</p>
                <p className="text-sm text-white">{soulData.temperament}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PICKS MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const PicksModal = ({ pet, pillar, picks, isOpen, onClose, onPickClick }) => {
  if (!isOpen) return null;
  
  const currentPillar = PILLARS.find(p => p.id === pillar);
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="picks-modal">
      <div className="bg-slate-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-semibold text-white">Picks for {pet?.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="picks-close-btn">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-pink-400/80">
            {currentPillar?.emoji} {currentPillar?.label} • Personalized because Mira knows {pet?.name}
          </p>
        </div>
        
        {/* Picks Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
          <div className="grid grid-cols-2 gap-3">
            {picks.map((pick) => (
              <div
                key={pick.id}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all group"
              >
                <div className="text-3xl mb-3">{pick.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{pick.name}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{pick.desc}</p>
                <p className="text-xs text-pink-400 mb-3">{pick.price}</p>
                <button
                  onClick={() => onPickClick(pick)}
                  className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-medium rounded-lg transition-all"
                  data-testid={`pick-${pick.id}-btn`}
                >
                  {pick.type === 'concierge' ? 'Have Concierge® create' : `Get for ${pet?.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ServicesModal = ({ pet, services, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="services-modal">
      <div className="bg-slate-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Services for {pet?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="services-close-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Services List */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No active service requests</p>
              <p className="text-slate-500 text-xs mt-1">Ask Mira to book something for {pet?.name}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{service.ticket_id}</p>
                      <p className="text-xs text-slate-400">{service.service_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`tdc-chip tdc-chip-dark ${
                      service.status === 'pending' ? '' :
                      service.status === 'confirmed' ? '' : ''
                    }`} style={
                      service.status === 'pending' ? { background:'rgba(245,158,11,0.2)', color:'#fcd34d', borderColor:'rgba(245,158,11,0.3)' } :
                      service.status === 'confirmed' ? { background:'rgba(16,185,129,0.2)', color:'#6ee7b7', borderColor:'rgba(16,185,129,0.3)' } :
                      { background:'rgba(100,116,139,0.2)', color:'#cbd5e1', borderColor:'rgba(100,116,139,0.3)' }
                    }>
                      {service.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{service.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TODAY MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TodayModal = ({ pet, actions, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="today-modal">
      <div className="bg-slate-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Today for {pet?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="today-close-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Actions List */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {actions.length === 0 ? (
            <div className="text-center py-12">
              <Sun className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nothing urgent today!</p>
              <p className="text-slate-500 text-xs mt-1">{pet?.name} is all caught up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action, idx) => (
                <div key={idx} className={`rounded-xl p-4 border ${
                  action.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                  action.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-slate-800/50 border-white/10'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const LearnModal = ({ pet, content, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="learn-modal">
      <div className="bg-slate-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Learn about {pet?.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="learn-close-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Content List */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {content.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading learning content...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'video' ? 'bg-red-500/20' :
                      item.type === 'guide' ? 'bg-indigo-500/20' :
                      'bg-emerald-500/20'
                    }`}>
                      {item.type === 'video' ? <Play className="w-5 h-5 text-red-400" /> :
                       item.type === 'guide' ? <BookOpen className="w-5 h-5 text-indigo-400" /> :
                       <Star className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      <p className="text-xs text-slate-500 mt-2">{item.read_time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeModal = ({ pet, isOpen, onClose, onStartChat }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" data-testid="concierge-modal">
      <div className="bg-slate-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Concierge®</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full" data-testid="concierge-close-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Human Concierge®</h3>
            <p className="text-sm text-slate-400 mb-6">
              Our team is here to help with anything Mira can't handle automatically.
              We'll arrange, source, and coordinate for {pet?.name}.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => onStartChat('I need help with something for ' + pet?.name)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl"
              >
                Start Concierge® Chat
              </button>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const MiraPureOSPage = () => {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [activePillar, setActivePillar] = useState('celebrate');
  const [activeTab, setActiveTab] = useState(null);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [sessionId] = useState(`pure-os-${Date.now()}`);
  
  // Modal states
  const [showMojoModal, setShowMojoModal] = useState(false);
  const [showPicksModal, setShowPicksModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  
  // Data states
  const [services, setServices] = useState([]);
  const [todayActions, setTodayActions] = useState([]);
  const [learnContent, setLearnContent] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch(`${API}/api/mira-pure/pets?email=dipali@clubconcierge.in`);
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            setPets(data.pets);
            setActivePet(data.pets[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };
    fetchPets();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch services from backend
  const fetchServices = async () => {
    if (!activePet) return;
    try {
      const response = await fetch(`${API}/api/mira-pure/services?pet_name=${activePet.name}&email=dipali@clubconcierge.in`);
      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setServices(data.services);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Get current state
  const lastMiraMessage = messages.filter(m => m.role === 'assistant').pop();
  const lastActions = lastMiraMessage?.actions || [];
  const quickReplies = getQuickReplies(activePillar, activePet?.name || 'your pet', lastMiraMessage?.content || '', lastActions);
  const pillarPicks = getPillarPicks(activePillar, activePet?.name, activePet?.health_data?.allergies || []);

  // Send message to backend
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/mira-pure/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          pet_id: activePet?._id || activePet?.id,
          pet_name: activePet?.name,
          user_email: 'dipali@clubconcierge.in',
          session_id: sessionId,
          active_pillar: activePillar,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage = { 
          role: 'assistant', 
          content: data.response,
          actions: data.actions || []
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update services list if a service was created
        if (data.actions?.some(a => a.type === 'service_created')) {
          const newService = data.actions.find(a => a.type === 'service_created')?.data;
          if (newService?.ticket_id) {
            setServices(prev => [newService, ...prev]);
          }
        }
        
        // Update today actions if fetched
        if (data.actions?.some(a => a.type === 'today')) {
          const todayData = data.actions.find(a => a.type === 'today')?.data;
          if (todayData?.actions) {
            setTodayActions(todayData.actions);
          }
        }
        
        // Update learn content if fetched
        if (data.actions?.some(a => a.type === 'learn')) {
          const learnData = data.actions.find(a => a.type === 'learn')?.data;
          if (learnData?.content) {
            setLearnContent(learnData.content);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Let me try again..." 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handlePickClick = async (pick) => {
    setShowPicksModal(false);
    const msg = pick.type === 'concierge' 
      ? `I'd like Concierge® to create ${pick.name} for ${activePet?.name}`
      : `I'd like to get ${pick.name} for ${activePet?.name}`;
    sendMessage(msg);
  };

  const handlePillarChange = (pillarId) => {
    setActivePillar(pillarId);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId === activeTab ? null : tabId);
    
    switch (tabId) {
      case 'today':
        setShowTodayModal(true);
        // Fetch today actions
        sendMessage(`What's happening today for ${activePet?.name}?`);
        break;
      case 'picks':
        setShowPicksModal(true);
        break;
      case 'services':
        fetchServices();  // Fetch latest services from DB
        setShowServicesModal(true);
        break;
      case 'learn':
        setShowLearnModal(true);
        // Fetch learn content
        sendMessage(`Show me learning content for ${activePet?.name}`);
        break;
      case 'concierge':
        setShowConciergeModal(true);
        break;
      default:
        break;
    }
  };

  const handleQuickReplyClick = (reply) => {
    if (reply.action === 'open_services') {
      fetchServices();  // Fetch latest services from DB
      setShowServicesModal(true);
    } else {
      sendMessage(reply.text);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col" data-testid="mira-pure-os">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Pet */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Mira Pure OS</h1>
                <p className="text-xs text-pink-400">Mira knows {activePet?.name || 'your pet'}</p>
              </div>
            </div>
            
            {/* Pet Selector */}
            <div className="relative flex items-center gap-2">
              {/* Pet Avatar - Opens profile modal */}
              {activePet && (
                <div 
                  onClick={() => setShowMojoModal(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/50 cursor-pointer hover:ring-purple-400"
                  data-testid="mojo-btn"
                  role="button"
                  tabIndex={0}
                >
                  {activePet.name?.[0]}
                </div>
              )}
              
              {/* Pet Selector Dropdown */}
              <button
                onClick={() => setShowPetSelector(!showPetSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10"
                data-testid="pet-selector-btn"
              >
                {activePet && (
                  <>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{activePet.name}</p>
                      <p className="text-xs text-purple-400">{activePet.soul_data?.soul_completeness || 0}% Soul</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </button>
              
              {showPetSelector && pets.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30" data-testid="pet-dropdown">
                  {pets.map((pet) => (
                    <button
                      key={pet._id || pet.id}
                      onClick={() => {
                        setActivePet(pet);
                        setShowPetSelector(false);
                        setMessages([]);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 ${
                        activePet?.name === pet.name ? 'bg-purple-500/20' : ''
                      }`}
                      data-testid={`pet-option-${pet.name}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {pet.name?.[0]}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-white">{pet.name}</p>
                        <p className="text-xs text-slate-400">{pet.breed}</p>
                      </div>
                      <span className="text-xs text-purple-400">{pet.soul_data?.soul_completeness || 0}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* OS Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {OS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Pillar Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {PILLARS.map((pillar) => {
              const isActive = activePillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarChange(pillar.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg`
                      : 'bg-slate-800/30 text-slate-500 hover:text-white hover:bg-slate-700/30'
                  }`}
                  data-testid={`pillar-${pillar.id}`}
                >
                  <span>{pillar.emoji}</span>
                  {pillar.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 pb-44">
        {/* Welcome / Picks Panel - Shows when no conversation */}
        {messages.length === 0 && (
          <div className="mb-6" data-testid="welcome-panel">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-semibold text-white">PERSONALIZED FOR {activePet?.name?.toUpperCase()}</h2>
            </div>
            <p className="text-xs text-pink-400/80 mb-4">
              {PILLARS.find(p => p.id === activePillar)?.emoji} {PILLARS.find(p => p.id === activePillar)?.label} • Items curated because Mira knows {activePet?.name}
            </p>
            
            {/* Picks Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pillarPicks.slice(0, 6).map((pick) => (
                <div
                  key={pick.id}
                  className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all group"
                  data-testid={`pick-card-${pick.id}`}
                >
                  <div className="text-3xl mb-3">{pick.icon}</div>
                  <h3 className="text-sm font-semibold text-white mb-1">{pick.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{pick.desc}</p>
                  <p className="text-xs text-pink-400 mb-3">{pick.price}</p>
                  <button
                    onClick={() => handlePickClick(pick)}
                    className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-medium rounded-lg transition-all"
                  >
                    {pick.type === 'concierge' ? 'Have Concierge® create' : `Get for ${activePet?.name}`}
                  </button>
                </div>
              ))}
            </div>
            
            {/* View All Picks */}
            <button 
              onClick={() => setShowPicksModal(true)}
              className="w-full mt-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl text-sm flex items-center justify-center gap-2"
              data-testid="view-all-picks-btn"
            >
              View all picks
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Concierge® Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">CONCIERGE ARRANGES FOR {activePet?.name?.toUpperCase()}</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">We'll source and arrange everything</p>
              
              {/* Chat prompt with quick replies */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-slate-300 mb-3">Ask for anything. If it needs action, we'll open a request and handle it in Services.</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickReplyClick(reply)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-full text-xs transition-all"
                      data-testid={`quick-reply-${idx}`}
                    >
                      <reply.icon className="w-3 h-3" />
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-md'
                  }`}
                  data-testid={`message-${idx}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span className="text-xs text-pink-400 font-medium">Mira</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Action Results */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.actions.map((action, aIdx) => (
                        <div key={aIdx}>
                          {/* Service Created */}
                          {action.type === 'service_created' && action.data?.success && (
                            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20" data-testid="service-created-card">
                              <p className="text-xs text-emerald-400 font-medium mb-1">Service Request Created</p>
                              <p className="text-sm text-white">Ticket: {action.data.ticket_id}</p>
                              <p className="text-xs text-slate-400 mt-1">{action.data.message}</p>
                              <button 
                                onClick={() => setShowServicesModal(true)}
                                className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                              >
                                View in Services <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          
                          {/* Picks */}
                          {action.type === 'picks' && action.data?.picks && (
                            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20" data-testid="picks-card">
                              <p className="text-xs text-purple-400 font-medium mb-2">Recommendations</p>
                              <div className="space-y-2">
                                {action.data.picks.slice(0, 3).map((pick, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                    <div>
                                      <p className="text-sm text-white">{pick.name}</p>
                                      <p className="text-xs text-slate-400">{pick.description}</p>
                                    </div>
                                    <span className="text-xs text-emerald-400 ml-2">{pick.price}</span>
                                  </div>
                                ))}
                              </div>
                              <button 
                                onClick={() => setShowPicksModal(true)}
                                className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                View all picks <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          
                          {/* Today */}
                          {action.type === 'today' && action.data?.actions && (
                            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20" data-testid="today-card">
                              <p className="text-xs text-amber-400 font-medium mb-2">Today</p>
                              <div className="space-y-2">
                                {action.data.actions.map((item, tIdx) => (
                                  <div key={tIdx} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                                    <span>{item.icon}</span>
                                    <div>
                                      <p className="text-sm text-white">{item.title}</p>
                                      <p className="text-xs text-slate-400">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Learn */}
                          {action.type === 'learn' && action.data?.content && (
                            <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20" data-testid="learn-card">
                              <p className="text-xs text-indigo-400 font-medium mb-2">Learning Content</p>
                              <div className="space-y-2">
                                {action.data.content.slice(0, 3).map((item, lIdx) => (
                                  <div key={lIdx} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-indigo-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm text-white">{item.title}</p>
                                      <p className="text-xs text-slate-400">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
                    <span className="text-sm text-slate-400">Mira is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Quick Replies - Above input when in conversation */}
      {messages.length > 0 && !isLoading && (
        <div className="fixed bottom-24 left-0 right-0 z-10" data-testid="quick-replies-bar">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReplyClick(reply)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-white/10 text-xs backdrop-blur-xl"
                >
                  <reply.icon className="w-3 h-3" />
                  {reply.text}
                </button>
              ))}
              <button
                onClick={() => { setMessages([]); }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full text-xs"
                data-testid="new-chat-btn"
              >
                New conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10" data-testid="chat-input-bar">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${activePet?.name || 'your pet'}...`}
              className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-pink-500 focus:outline-none text-sm"
              disabled={isLoading || !activePet}
              data-testid="chat-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activePet}
              className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition-all"
              data-testid="chat-send-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-2">
            Mira Pure OS • Soulful AI • Function Calling
          </p>
        </div>
      </div>

      {/* Modals */}
      <MojoProfileModal 
        pet={activePet} 
        isOpen={showMojoModal} 
        onClose={() => setShowMojoModal(false)} 
      />
      <PicksModal 
        pet={activePet} 
        pillar={activePillar}
        picks={pillarPicks} 
        isOpen={showPicksModal} 
        onClose={() => setShowPicksModal(false)}
        onPickClick={handlePickClick}
      />
      <ServicesModal 
        pet={activePet} 
        services={services} 
        isOpen={showServicesModal} 
        onClose={() => setShowServicesModal(false)} 
      />
      <TodayModal 
        pet={activePet} 
        actions={todayActions} 
        isOpen={showTodayModal} 
        onClose={() => setShowTodayModal(false)} 
      />
      <LearnModal 
        pet={activePet} 
        content={learnContent} 
        isOpen={showLearnModal} 
        onClose={() => setShowLearnModal(false)} 
      />
      <ConciergeModal 
        pet={activePet} 
        isOpen={showConciergeModal} 
        onClose={() => setShowConciergeModal(false)}
        onStartChat={(msg) => {
          setShowConciergeModal(false);
          sendMessage(msg);
        }}
      />
    </div>
  );
};

export default MiraPureOSPage;
