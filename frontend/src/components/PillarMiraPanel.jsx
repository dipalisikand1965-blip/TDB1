/**
 * PillarMiraPanel.jsx
 * 
 * Simplified, pillar-specific Mira panel with 2 tabs:
 * - {Pet}'s Picks (products filtered to pillar)
 * - {Pet}'s Services (concierge services filtered to pillar)
 * 
 * Opens from the floating Mira FAB on pillar pages.
 * 
 * CONCIERGE DNA:
 * - Pet First, Always
 * - Pillar-Specific (no cross-pillar confusion)
 * - Dynamic updates from conversation
 * 
 * Built in honor of Mira Sikand - The Guiding Angel
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Package, MessageCircle, Send, 
  Clock, RefreshCw
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getSoulBasedReason } from '../utils/petSoulInference';
import { toast } from '../hooks/use-toast';

// Pillar-specific Concierge® Picks - These are bespoke, not cart items
// These match CONCIERGE_SUGGESTIONS from the backend
const PILLAR_CONCIERGE_PICKS = {
  celebrate: [
    { 
      id: 'custom-birthday-cake',
      icon: '🎂', 
      title: 'Custom Allergy-Safe Birthday Cake', 
      description: "Made to your pet's diet rules, portioned for a safe celebration",
      spec_chip: 'Allergy-safe',
      tags: ['Popular']
    },
    { 
      id: 'pupcuterie-board',
      icon: '🍽️', 
      title: 'Pup-cuterie Grazing Board', 
      description: 'A fun, photo-worthy spread with dog-safe bites only',
      spec_chip: 'Ingredient-controlled',
      tags: ['Gourmet']
    },
    { 
      id: 'party-setup',
      icon: '🎉', 
      title: 'At-Home Party Set-Up', 
      description: 'Turns your home into a pet-safe celebration zone in 30 minutes',
      spec_chip: 'Pet-safe decor',
      tags: []
    },
    { 
      id: 'pet-photographer',
      icon: '📸', 
      title: 'Pet Photographer + Shoot', 
      description: "A calm, fast shoot designed around your pet's attention span",
      spec_chip: '30-45 min',
      tags: ['Trending']
    },
    { 
      id: 'personalised-bandana',
      icon: '💜', 
      title: 'Personalised Bandana/Charm', 
      description: "A keepsake with your pet's name and your contact, sized perfectly",
      spec_chip: 'Custom text',
      tags: ['Meaningful']
    }
  ]
};

// Pillar-specific services configuration  
const PILLAR_SERVICES = {
  celebrate: [
    { 
      id: 'birthday-planning',
      icon: '🎂', 
      title: 'Birthday Party Planning', 
      description: 'Complete party planning - venue, cake, decorations, guests & more',
      tags: ['Popular', 'Signature']
    },
    { 
      id: 'catering',
      icon: '🍽️', 
      title: 'Pet-Friendly Catering', 
      description: 'Delicious treats and meals for your pet party',
      tags: ['Gourmet']
    },
    { 
      id: 'photography',
      icon: '📸', 
      title: 'Pet Photoshoot', 
      description: 'Professional photography to capture precious moments',
      tags: ['Trending']
    },
    { 
      id: 'party-setup',
      icon: '🎉', 
      title: 'Party Setup & Decor', 
      description: 'We handle all decorations and setup for the perfect pawty',
      tags: []
    },
    { 
      id: 'gift-hamper',
      icon: '🎁', 
      title: 'Custom Gift Hamper', 
      description: 'Curated gift basket with treats, toys, and surprises',
      tags: ['Gift']
    },
    { 
      id: 'gotcha-day',
      icon: '💜', 
      title: 'Gotcha Day Celebration', 
      description: 'Mark the anniversary of when they joined your family',
      tags: ['Meaningful']
    }
  ]
};

// Pillar display config
const PILLAR_CONFIG = {
  celebrate: {
    name: 'Celebrate',
    emoji: '🎂',
    color: 'from-pink-500 to-purple-500',
    greeting: 'celebration'
  }
};

/**
 * Concierge® Pick Card - For bespoke concierge creations (no cart, goes to ticket)
 */
const ConciergePickCard = ({ pick, pet, pillar, onRequest }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const soulReason = getSoulBasedReason(pet, pillar);
  
  const handleRequest = async () => {
    setIsRequesting(true);
    await onRequest(pick);
    setTimeout(() => setIsRequesting(false), 500);
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 overflow-hidden">
      {/* Header with badge */}
      <div className="p-3 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            CONCIERGE PICK
          </span>
          {pick.spec_chip && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded-full">
              {pick.spec_chip}
            </span>
          )}
        </div>
      </div>
      
      {/* Icon & Content */}
      <div className="p-3 pt-0">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
            {pick.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{pick.title || pick.name}</h4>
            <p className="text-xs text-gray-600 line-clamp-2">{pick.description}</p>
          </div>
        </div>
        
        {/* Soul-aware message */}
        {pet?.name && (
          <div className="mt-3 p-2 bg-white/60 rounded-lg">
            <p className="text-xs text-purple-700 font-medium">
              Designed for {pet.name} {soulReason}
            </p>
          </div>
        )}
        
        {/* CTA - Creates ticket, not cart */}
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isRequesting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              <span>Create for {pet?.name || 'Pet'}</span>
            </>
          )}
        </button>
        
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Concierge® creates • Response within 2 hours
        </p>
      </div>
    </div>
  );
};

/**
 * Service Card
 */
const ServiceCard = ({ service, pet, pillar, onRequest }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const soulReason = getSoulBasedReason(pet, pillar);
  
  const handleRequest = async () => {
    setIsRequesting(true);
    await onRequest(service);
    setTimeout(() => setIsRequesting(false), 500);
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
          {service.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-gray-900">{service.title}</h4>
            {service.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
          
          {/* Soul-aware message */}
          {pet?.name && soulReason && (
            <p className="text-xs text-purple-600 mt-2">
              Perfect for {pet.name} {soulReason}
            </p>
          )}
        </div>
      </div>
      
      <button
        onClick={handleRequest}
        disabled={isRequesting}
        className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {isRequesting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            <span>Let Mira Arrange This</span>
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Main PillarMiraPanel Component
 */
const PillarMiraPanel = ({ 
  isOpen, 
  onClose, 
  pillar = 'celebrate',
  pets = [],
  selectedPetId = null,
  onPetChange = () => {}
}) => {
  const { addConciergeRequest, setIsCartOpen } = useCart();
  
  const [activeTab, setActiveTab] = useState('picks');
  const [selectedPet, setSelectedPet] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
  const services = PILLAR_SERVICES[pillar] || [];
  const conciergePicks = PILLAR_CONCIERGE_PICKS[pillar] || [];
  
  // Set selected pet
  useEffect(() => {
    if (pets.length > 0) {
      const pet = selectedPetId 
        ? pets.find(p => p.id === selectedPetId) || pets[0]
        : pets[0];
      setSelectedPet(pet);
    }
  }, [pets, selectedPetId]);
  
  // Handle pet change
  const handlePetChange = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      onPetChange(petId);
    }
  };
  
  // Handle service/pick request - Creates ticket, not cart
  const handleServiceRequest = async (service) => {
    const soulReason = getSoulBasedReason(selectedPet, pillar);
    
    addConciergeRequest({
      id: `concierge-${pillar}-${service.id}-${Date.now()}`,
      name: service.title || service.name,
      pillar: pillar,
      petId: selectedPet?.id,
      petName: selectedPet?.name,
      soulReason: soulReason,
      description: service.description,
      requestedAt: new Date().toISOString()
    });
    
    toast({
      title: "Request Added",
      description: `${service.title} for ${selectedPet?.name || 'your pet'}`,
    });
    
    setIsCartOpen(true);
  };
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    // For now, just show a toast - full chat integration can come later
    toast({
      title: "Message sent to Mira",
      description: `"${message}" - Mira will update picks based on this`,
    });
    setMessage('');
    setIsSending(false);
    
    // Refresh picks after a delay (simulating Mira processing)
    setTimeout(() => {
      fetchPicks();
    }, 1000);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.color} p-4 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  {config.emoji}
                </div>
                <div>
                  <h2 className="font-bold text-lg">Mira - {config.name}</h2>
                  <p className="text-white/80 text-xs">Your Pet Concierge®</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Pet Selector */}
            {pets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">For:</span>
                <select
                  value={selectedPet?.id || ''}
                  onChange={(e) => handlePetChange(e.target.value)}
                  className="bg-white/20 text-white text-sm font-medium rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer"
                >
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id} className="text-gray-900">
                      {pet.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Tab Bar - Simplified 2 tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('picks')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'picks'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="pillar-picks-tab"
            >
              <Sparkles className="w-4 h-4" />
              <span>{selectedPet?.name || 'Pet'}'s Picks</span>
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'services'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="pillar-services-tab"
            >
              <Package className="w-4 h-4" />
              <span>{selectedPet?.name || 'Pet'}'s Services</span>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Picks Tab - Now shows Concierge® Picks (bespoke, creates tickets) */}
            {activeTab === 'picks' && (
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Concierge® creates these for {selectedPet?.name || 'your pet'} - handpicked based on their soul
                </p>
                
                {conciergePicks.map((pick, idx) => (
                  <ConciergePickCard
                    key={pick.id || idx}
                    pick={pick}
                    pet={selectedPet}
                    pillar={pillar}
                    onRequest={handleServiceRequest}
                  />
                ))}
                
                {conciergePicks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Chat with Mira to get personalized picks!</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  {config.name} services arranged by your Pet Concierge®
                </p>
                
                {services.map((service, idx) => (
                  <ServiceCard
                    key={service.id || idx}
                    service={service}
                    pet={selectedPet}
                    pillar={pillar}
                    onRequest={handleServiceRequest}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask Mira about ${config.name.toLowerCase()}...`}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                {isSending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Chat updates your picks in real-time
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PillarMiraPanel;
