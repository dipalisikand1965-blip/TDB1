/**
 * CinematicKitAssembly - Immersive guided kit building experience
 * 
 * Features:
 * - Step-by-step product reveal with animations
 * - Visual storytelling for each kit item
 * - Mira's voice narration explaining each product
 * - Progress indicator
 * - Smooth transitions between items
 * - Final summary with "Add All" option
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, ShoppingBag, Sparkles, 
  Check, X, Star, Package, Heart, PawPrint, Volume2, VolumeX 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

// Product narration templates - Mira explains why each item is in the kit
// Personalized with pet info when available (name, breed, size, favorites, allergies)
const getProductNarration = (product, kitName, petInfo = {}) => {
  const name = product.title || product.name || "this item";
  const price = product.price ? `at just ${product.price} rupees` : "";
  const petName = petInfo.name || "your furry friend";
  const petBreed = petInfo.breed || "";
  const petSize = petInfo.size || "";
  const favorites = petInfo.favorites || []; // e.g., ["chicken", "peanut butter"]
  const allergies = petInfo.allergies || []; // e.g., ["beef", "grain"]
  const activityLevel = petInfo.activityLevel || "";
  const personality = petInfo.personality || "";
  
  // Category-specific narrations with personalization
  const category = (product.category || product.collections?.[0] || "").toLowerCase();
  const productName = name.toLowerCase();
  const productTags = (product.tags || []).map(t => t.toLowerCase()).join(' ');
  
  // Check if product matches favorites
  const matchesFavorite = favorites.some(fav => 
    productName.includes(fav.toLowerCase()) || productTags.includes(fav.toLowerCase())
  );
  
  // Check for allergy concerns (to avoid or note)
  const hasAllergyWarning = allergies.some(allergy => 
    productName.includes(allergy.toLowerCase()) || productTags.includes(allergy.toLowerCase())
  );
  
  // Personalized favorite match prefix
  const favoritePrefix = matchesFavorite && favorites.length > 0
    ? `Ooh! I know ${petName} loves ${favorites[0]}! ` 
    : "";
  
  // Carrier recommendations
  if (category.includes("carrier") || productName.includes("carrier")) {
    if (petSize === "small" || petSize === "toy") {
      return `${favoritePrefix}Next up, the ${name}! Perfect size for ${petName}'s compact frame, keeping them safe during travel. ${price}`;
    } else if (petSize === "large" || petSize === "giant") {
      return `${favoritePrefix}The ${name}! Spacious enough for ${petName}'s size, with great ventilation for comfort. ${price}`;
    }
    return `${favoritePrefix}Next up, the ${name}! Perfect for keeping ${petName} safe and comfortable during travel. ${price}`;
  }
  
  // Food and treats - can reference preferences and favorites
  if (category.includes("treat") || productName.includes("treat")) {
    // Match favorite flavors
    if (matchesFavorite) {
      return `${petName} is going to love this! The ${name} - one of their favorites! Healthy and delicious. ${price}`;
    }
    // Breed-specific
    if (petBreed.toLowerCase().includes("lab") || petBreed.toLowerCase().includes("retriever")) {
      return `${petName} being a ${petBreed}, I know they'll love these ${name}! Healthy and delicious. ${price}`;
    }
    // Activity-based
    if (activityLevel === "high" || activityLevel === "very_active") {
      return `High-energy treats for an active pup like ${petName}! The ${name} will keep them fueled. ${price}`;
    }
    return `The ${name}! Because ${petName} deserves tasty, healthy rewards. ${price}`;
  }
  
  // Bowls and bottles
  if (category.includes("bowl") || productName.includes("bowl") || productName.includes("bottle")) {
    return `Here's the ${name}! Keeping ${petName} hydrated is so important, especially on adventures. ${price}`;
  }
  
  // Leash and harness - consider activity level
  if (category.includes("leash") || productName.includes("leash") || productName.includes("harness")) {
    if (petSize === "large" || petSize === "giant") {
      return `A sturdy ${name} for ${petName}! Essential for safe, controlled walks. ${price}`;
    }
    if (activityLevel === "high" || personality === "adventurer") {
      return `For ${petName}'s adventures, the ${name}! Built for active pups who love to explore. ${price}`;
    }
    return `The ${name}! Perfect for ${petName}'s walks and outings. ${price}`;
  }
  
  // Toys - consider personality
  if (category.includes("toy") || productName.includes("toy")) {
    if (personality === "playful" || personality === "energetic") {
      return `${petName} the playful one will go crazy for the ${name}! Hours of entertainment guaranteed. ${price}`;
    }
    if (activityLevel === "low" || activityLevel === "calm") {
      return `A gentle ${name} for ${petName}'s cozy play sessions. Perfect for quiet time together. ${price}`;
    }
    return `Play time with the ${name}! Keeping ${petName} happy and entertained is so important. ${price}`;
  }
  
  // Grooming
  if (category.includes("groom") || category.includes("shampoo") || category.includes("brush")) {
    if (petBreed && (petBreed.toLowerCase().includes("poodle") || petBreed.toLowerCase().includes("shih") || petBreed.toLowerCase().includes("maltese"))) {
      return `For ${petName}'s gorgeous coat, the ${name}! ${petBreed}s need special care. ${price}`;
    }
    if (petBreed && (petBreed.toLowerCase().includes("husky") || petBreed.toLowerCase().includes("golden"))) {
      return `Essential for ${petName}'s thick coat! The ${name} will make grooming a breeze. ${price}`;
    }
    return `For grooming, the ${name}! Keeping ${petName} looking fabulous. ${price}`;
  }
  
  // Training
  if (category.includes("train") || category.includes("clicker")) {
    if (personality === "smart" || personality === "eager_to_please") {
      return `${petName} is such a quick learner! The ${name} will make training sessions even better. ${price}`;
    }
    return `Training essential: ${name}! Great for building ${petName}'s good habits. ${price}`;
  }
  
  // Beds and comfort
  if (category.includes("bed") || productName.includes("bed") || productName.includes("blanket")) {
    if (petSize === "large" || petSize === "giant") {
      return `A cozy ${name} sized just right for ${petName}! Big dogs deserve big comfort. ${price}`;
    }
    return `The ${name} for ${petName}'s comfort! Every pup deserves a cozy spot. ${price}`;
  }
  
  // Health and supplements - mention allergies if relevant
  if (category.includes("health") || category.includes("supplement")) {
    if (allergies.length > 0) {
      return `I've checked and this ${name} is safe for ${petName}'s dietary needs. Great for their wellbeing! ${price}`;
    }
    return `For ${petName}'s health, the ${name}! Keeping them in top shape. ${price}`;
  }
  
  // Default narration with favorite match
  if (matchesFavorite) {
    return `${petName} will love this! I picked the ${name} knowing their preferences. A perfect addition! ${price}`;
  }
  
  return `I've selected the ${name} especially for ${petName}'s kit. A great choice ${price}!`;
};

const CinematicKitAssembly = ({ 
  kitName = "Your Pawfect Kit",
  items = [],
  onComplete,
  onClose,
  addToCart,
  petInfo = {} // { name, breed, size, age, favorites, allergies, activityLevel, personality }
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRevealing, setIsRevealing] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const petName = petInfo.name || "your furry friend";
  
  // Speech synthesis ref
  const synthRef = useRef(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);
  
  // Text-to-Speech function - MIRA IS A WOMAN (moved before its usage)
  // Fixed Chrome bug where speech cuts off after ~15s
  const speakText = useCallback((text) => {
    if (!synthRef.current || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Get voices and select best female voice
    const voices = synthRef.current.getVoices();
    const preferredVoices = ['Samantha', 'Victoria', 'Karen', 'Google UK English Female', 'Google US English Female', 'Microsoft Zira'];
    
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(v => v.name.includes(voiceName));
      if (selectedVoice) break;
    }
    
    // Fallback to any English female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };
    
    // Chrome workaround: pause/resume to prevent cutoff after ~15s
    // This keeps the speech synthesis active
    let resumeInterval = null;
    utterance.onstart = () => {
      setIsSpeaking(true);
      // Every 10 seconds, pause and resume to prevent Chrome from cutting off
      resumeInterval = setInterval(() => {
        if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
          synthRef.current.pause();
          synthRef.current.resume();
        }
      }, 10000);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (resumeInterval) clearInterval(resumeInterval);
    };
    
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      if (resumeInterval) clearInterval(resumeInterval);
    };
    
    // Small delay to ensure voices are loaded
    setTimeout(() => {
      if (synthRef.current) {
        synthRef.current.speak(utterance);
      }
    }, 100);
  }, [voiceEnabled]);
  
  // Speak introduction on mount (after speakText is declared)
  useEffect(() => {
    if (voiceEnabled && synthRef.current && items.length > 0) {
      const intro = `Hi! I'm Meera, your pet concierge. Let me show you the ${kitName} I've curated just for ${petName}. ${items.length} amazing items await!`;
      speakText(intro);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount
  
  // Narrate current product when revealed
  useEffect(() => {
    if (!isRevealing && items[currentStep] && voiceEnabled) {
      const narration = getProductNarration(items[currentStep], kitName, petInfo);
      speakText(narration);
    }
  }, [isRevealing, currentStep, items, kitName, petInfo, voiceEnabled, speakText]);
  
  // Initialize with all items selected by default
  useEffect(() => {
    setSelectedItems(items.map(item => item.id || item._id));
  }, [items]);
  
  const totalSteps = items.length;
  const currentItem = items[currentStep];
  
  // Auto-advance after reveal animation
  useEffect(() => {
    if (isRevealing) {
      const timer = setTimeout(() => {
        setIsRevealing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isRevealing, currentStep]);
  
  const goToNext = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel(); // Stop current speech
    if (currentStep < totalSteps - 1) {
      setIsRevealing(true);
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
      if (voiceEnabled) {
        setTimeout(() => {
          speakText(`And that's your complete ${kitName}! ${items.length} items hand-picked for ${petName}. You can customize your selection before adding to cart.`);
        }, 500);
      }
    }
  }, [currentStep, totalSteps, voiceEnabled, kitName, items.length, petName, speakText]);
  
  const goToPrev = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel(); // Stop current speech
    if (currentStep > 0) {
      setIsRevealing(true);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const toggleVoice = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    setVoiceEnabled(prev => !prev);
    setIsSpeaking(false);
  }, []);
  
  const toggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const handleAddAllToCart = () => {
    const itemsToAdd = items.filter(item => 
      selectedItems.includes(item.id || item._id)
    );
    itemsToAdd.forEach(item => addToCart(item));
    onComplete?.(itemsToAdd);
  };
  
  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id || item._id))
    .reduce((sum, item) => sum + (item.price || 0), 0);
  
  // Summary view
  if (showSummary) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">{kitName}</h2>
            <p className="text-white/80 text-sm">Your kit is ready!</p>
          </div>
          
          {/* Items List */}
          <div className="p-4 max-h-[40vh] overflow-y-auto">
            {items.map((item, idx) => {
              const isSelected = selectedItems.includes(item.id || item._id);
              return (
                <motion.div
                  key={item.id || item._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all ${
                    isSelected ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border-2 border-transparent'
                  }`}
                  onClick={() => toggleItem(item.id || item._id)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <img 
                    src={item.image || item.images?.[0] || '/placeholder-product.png'} 
                    alt={item.title || item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.title || item.name}</p>
                    <p className="text-purple-600 font-bold text-sm">₹{(item.price || 0).toLocaleString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">{selectedItems.length} of {items.length} items</p>
                <p className="text-xl font-bold text-gray-900">₹{selectedTotal.toLocaleString()}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <Heart className="w-3 h-3 mr-1" />
                Curated for you
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSummary(false)}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={handleAddAllToCart}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                disabled={selectedItems.length === 0}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add {selectedItems.length} to Cart
              </Button>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Item reveal view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Voice Toggle */}
        <button
          onClick={toggleVoice}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            voiceEnabled 
              ? 'bg-purple-500 text-white' 
              : 'bg-white/10 text-white/60'
          } hover:bg-purple-600`}
          title={voiceEnabled ? "Mute Mira" : "Enable Mira's voice"}
        >
          {voiceEnabled ? (
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
        
        {/* Close Button */}
        <button
          onClick={() => {
            if (synthRef.current) synthRef.current.cancel();
            onClose();
          }}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Header */}
      <div className="pt-12 pb-4 px-6 text-center">
        <motion.div
          key={`header-${currentStep}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="bg-white/10 text-white border-white/20 mb-2">
            <Sparkles className="w-3 h-3 mr-1" />
            {kitName}
          </Badge>
          <h2 className="text-white/60 text-sm">
            Item {currentStep + 1} of {totalSteps}
          </h2>
        </motion.div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-32">
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={currentItem.id || currentItem._id}
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                transition: { duration: 0.6, ease: "easeOut" }
              }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              className="max-w-sm w-full"
            >
              <Card className="overflow-hidden bg-white shadow-2xl rounded-3xl">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
                  <motion.img
                    src={currentItem.image || currentItem.images?.[0] || '/placeholder-product.png'}
                    alt={currentItem.title || currentItem.name}
                    className="w-full h-full object-contain p-8"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                  
                  {/* Sparkle Effects */}
                  {isRevealing && (
                    <>
                      <motion.div
                        className="absolute top-1/4 left-1/4 w-4 h-4 text-purple-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        <Sparkles className="w-full h-full" />
                      </motion.div>
                      <motion.div
                        className="absolute top-1/3 right-1/4 w-3 h-3 text-pink-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 1, delay: 0.7 }}
                      >
                        <Star className="w-full h-full" />
                      </motion.div>
                    </>
                  )}
                  
                  {/* Selection Indicator */}
                  <motion.button
                    onClick={() => toggleItem(currentItem.id || currentItem._id)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      selectedItems.includes(currentItem.id || currentItem._id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-400'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {selectedItems.includes(currentItem.id || currentItem._id) 
                      ? <Check className="w-5 h-5" />
                      : <Heart className="w-5 h-5" />
                    }
                  </motion.button>
                </div>
                
                {/* Product Info */}
                <div className="p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {currentItem.title || currentItem.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {currentItem.description || "Perfect for your furry friend!"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-purple-600">
                          ₹{(currentItem.price || 0).toLocaleString()}
                        </span>
                        {currentItem.compare_at_price && currentItem.compare_at_price > currentItem.price && (
                          <span className="text-sm text-gray-400 line-through ml-2">
                            ₹{currentItem.compare_at_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        <PawPrint className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentStep === 0}
            className="w-12 h-12 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          {/* Step Indicators */}
          <div className="flex gap-2">
            {items.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => { setCurrentStep(idx); setIsRevealing(true); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'bg-purple-400 w-6' 
                    : idx < currentStep 
                      ? 'bg-white/60' 
                      : 'bg-white/20'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
          
          <Button
            onClick={goToNext}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Skip to Summary */}
        <button
          onClick={() => setShowSummary(true)}
          className="mt-4 text-white/60 text-sm hover:text-white mx-auto block"
        >
          Skip to summary →
        </button>
      </div>
    </motion.div>
  );
};

export default CinematicKitAssembly;
