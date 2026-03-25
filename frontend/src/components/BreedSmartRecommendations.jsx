/**
 * BreedSmartRecommendations.jsx
 * 
 * "MIRA RECOMMENDS FOR {BREED}" section showing breed-specific product recommendations.
 * Uses the breed_matrix data to show items tailored to the pet's breed traits.
 * Same style as PersonalizedPillarSection - cards that open concierge modal.
 * 
 * Usage:
 * <BreedSmartRecommendations
 *   pillar="travel"
 *   pet={activePet}
 *   token={token}
 *   userEmail={user?.email}
 * />
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Heart, Loader2, Check, Send, Lightbulb
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { API_URL } from '../utils/api';
import { toast } from 'sonner';

// Theme configs for each pillar (matching PersonalizedPillarSection)
const PILLAR_THEMES = {
  care: {
    gradient: 'from-slate-900 via-teal-950/80 to-slate-900',
    accent: 'teal',
    buttonGradient: 'from-teal-500 to-cyan-500',
    icon: '🧴'
  },
  stay: {
    gradient: 'from-slate-900 via-indigo-950/80 to-slate-900',
    accent: 'indigo',
    buttonGradient: 'from-indigo-500 to-purple-500',
    icon: '🏠'
  },
  travel: {
    gradient: 'from-slate-900 via-sky-950/80 to-slate-900',
    accent: 'sky',
    buttonGradient: 'from-sky-500 to-blue-500',
    icon: '✈️'
  },
  enjoy: {
    gradient: 'from-slate-900 via-amber-950/80 to-slate-900',
    accent: 'amber',
    buttonGradient: 'from-amber-500 to-orange-500',
    icon: '🎾'
  },
  celebrate: {
    gradient: 'from-slate-900 via-pink-950/80 to-slate-900',
    accent: 'pink',
    buttonGradient: 'from-pink-500 to-rose-500',
    icon: '🎉'
  },
  dine: {
    gradient: 'from-slate-900 via-orange-950/80 to-slate-900',
    accent: 'orange',
    buttonGradient: 'from-orange-500 to-red-500',
    icon: '🍽️'
  },
  fit: {
    gradient: 'from-slate-900 via-green-950/80 to-slate-900',
    accent: 'green',
    buttonGradient: 'from-green-500 to-emerald-500',
    icon: '💪'
  },
  learn: {
    gradient: 'from-slate-900 via-blue-950/80 to-slate-900',
    accent: 'blue',
    buttonGradient: 'from-blue-500 to-indigo-500',
    icon: '📚'
  },
  emergency: {
    gradient: 'from-slate-900 via-red-950/80 to-slate-900',
    accent: 'red',
    buttonGradient: 'from-red-500 to-rose-500',
    icon: '🚨'
  },
  farewell: {
    gradient: 'from-slate-900 via-slate-800/80 to-slate-900',
    accent: 'slate',
    buttonGradient: 'from-slate-400 to-gray-400',
    icon: '💜'
  }
};

// Icon mapping for common product types
const PRODUCT_ICONS = {
  'bowl': '🥣',
  'feeder': '🥣',
  'slow feeder': '🥣',
  'bed': '🛏️',
  'blanket': '🧣',
  'mat': '🟦',
  'cooling mat': '❄️',
  'harness': '🎗️',
  'carrier': '🧳',
  'brush': '🪮',
  'comb': '🪮',
  'toy': '🎾',
  'chew': '🦴',
  'puzzle': '🧩',
  'kit': '🎒',
  'tag': '🏷️',
  'card': '🪪',
  'frame': '🖼️',
  'journal': '📓',
  'default': '✨'
};

const getProductIcon = (productName) => {
  const nameLower = productName.toLowerCase();
  for (const [key, icon] of Object.entries(PRODUCT_ICONS)) {
    if (nameLower.includes(key)) return icon;
  }
  return PRODUCT_ICONS.default;
};

// Get breed-specific "why" copy
const getBreedWhy = (productName, traits) => {
  const nameLower = productName.toLowerCase();
  const traitsLower = traits.map(t => t.toLowerCase());
  
  if (traitsLower.includes('flat-faced') || traitsLower.includes('brachy')) {
    if (nameLower.includes('bowl') || nameLower.includes('feeder')) {
      return 'Perfect for flat-faced comfort';
    }
    if (nameLower.includes('cooling') || nameLower.includes('mat')) {
      return 'Essential - flat-faced breeds overheat easily';
    }
  }
  
  if (traitsLower.includes('large') || traitsLower.includes('big')) {
    if (nameLower.includes('bed') || nameLower.includes('orthopedic')) {
      return 'Extra support for larger breeds';
    }
    if (nameLower.includes('harness') || nameLower.includes('lead')) {
      return 'Heavy-duty for strong pullers';
    }
  }
  
  if (traitsLower.includes('small') || traitsLower.includes('toy') || traitsLower.includes('mini')) {
    if (nameLower.includes('carrier') || nameLower.includes('bag')) {
      return 'Perfect size for small breeds';
    }
    if (nameLower.includes('bowl') || nameLower.includes('feeder')) {
      return 'Sized right for little mouths';
    }
  }
  
  if (traitsLower.includes('double-coat') || traitsLower.includes('long-coat')) {
    if (nameLower.includes('brush') || nameLower.includes('comb') || nameLower.includes('deshed')) {
      return 'Essential for coat maintenance';
    }
    if (nameLower.includes('cooling')) {
      return 'Helps thick coats stay cool';
    }
  }
  
  if (traitsLower.includes('high-energy') || traitsLower.includes('active')) {
    if (nameLower.includes('toy') || nameLower.includes('fetch') || nameLower.includes('ball')) {
      return 'Great for burning energy';
    }
    if (nameLower.includes('puzzle') || nameLower.includes('enrichment')) {
      return 'Mental stimulation for active minds';
    }
  }
  
  if (traitsLower.includes('floppy-ear')) {
    if (nameLower.includes('ear') || nameLower.includes('care kit')) {
      return 'Floppy ears need regular care';
    }
  }
  
  return 'Recommended for your breed';
};


const BreedSmartRecommendations = ({ 
  pillar,
  pet, 
  token, 
  userEmail,
  onSaveToFavorites,
  maxItems = 6
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const theme = PILLAR_THEMES[pillar] || PILLAR_THEMES.care;

  // Fetch breed recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!pet?.breed) {
        setLoading(false);
        return;
      }

      try {
        const breedKey = pet.breed.toLowerCase().replace(/ /g, '_');
        const response = await fetch(
          `${API_URL}/api/mockups/breed-recommendations/${breedKey}?pillar=${pillar}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.recommendations[pillar]) {
            const items = data.recommendations[pillar].items || [];
            setRecommendations(items.slice(0, maxItems));
            setTraits(data.traits || []);
          }
        }
      } catch (error) {
        console.error('[BreedSmartRecommendations] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [pet?.breed, pillar, maxItems]);

  // Don't render if no pet, no breed, or no recommendations
  if (!pet || !pet.breed || loading) return null;
  if (recommendations.length === 0) return null;

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setSpecialNotes('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: `breed_smart_recommendation`,
          pillar: pillar,
          source: `breed_smart_${pillar}_section`,
          priority: 'normal',
          intent: `breed_recommendation_inquiry`,
          customer: {
            email: userEmail,
            name: pet.parent_name || ''
          },
          details: {
            pet_id: pet.id || pet._id,
            pet_name: pet.name,
            pet_breed: pet.breed,
            breed_traits: traits,
            
            item_name: selectedItem.display_name || selectedItem.name,
            item_original: selectedItem.original,
            
            why_recommended: getBreedWhy(selectedItem.name, traits),
            special_notes: specialNotes || 'No additional notes',
            
            concierge_summary: `Breed-smart recommendation: ${selectedItem.display_name || selectedItem.name} for ${pet.name} (${pet.breed}). ${getBreedWhy(selectedItem.name, traits)}${specialNotes ? `. Notes: ${specialNotes}` : ''}`
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(`Request sent to Concierge®!`, {
          description: `We'll help you find the perfect ${selectedItem.display_name || selectedItem.name}`
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setSubmitted(false);
        }, 2000);
      } else {
        toast.error('Could not send request', {
          description: data.detail || 'Please try again'
        });
      }
    } catch (error) {
      console.error('[BreedSmartRecommendations] Error:', error);
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    const container = document.querySelector(`[data-scroll-container="${pillar}-breed-smart"]`);
    if (container) container.scrollBy({ left: -220, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = document.querySelector(`[data-scroll-container="${pillar}-breed-smart"]`);
    if (container) container.scrollBy({ left: 220, behavior: 'smooth' });
  };

  return (
    <>
      {/* Section Container */}
      <div 
        className={`bg-gradient-to-br ${theme.gradient} rounded-2xl p-5 sm:p-6 relative overflow-hidden mt-4`}
        data-testid={`breed-smart-${pillar}-section`}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 drop-shadow-lg">
              <Lightbulb className={`w-4 h-4 text-${theme.accent}-300`} />
              Mira Recommends for {pet.breed}s
            </h3>
            <p className="text-sm text-white/90 mt-1 drop-shadow">
              Breed-smart essentials - Ask Concierge® for help
            </p>
            {traits.length > 0 && (
              <p className="text-xs text-white/60 mt-1">
                Based on: {traits.slice(0, 3).join(', ')}
              </p>
            )}
          </div>

          {/* Horizontal Scrollable Cards */}
          <div className="relative group">
            {/* Left scroll button */}
            <button
              onClick={scrollLeft}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-4"
            >
              ←
            </button>
            
            {/* Right scroll button */}
            <button
              onClick={scrollRight}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-4"
            >
              →
            </button>

            {/* Cards Container */}
            <div
              data-scroll-container={`${pillar}-breed-smart`}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
              style={{
                scrollbarColor: `${theme.scrollbarColor || 'rgba(255,255,255,0.3)'} transparent`,
                scrollbarWidth: 'thin'
              }}
            >
              {recommendations.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  onClick={() => handleItemClick(item)}
                  className="flex-none w-[180px] bg-slate-800/60 hover:bg-slate-700/70 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-slate-700/50 flex items-center justify-center text-3xl">
                    {getProductIcon(item.name)}
                  </div>

                  {/* Name */}
                  <h4 className="text-white font-semibold text-sm text-center mb-1 line-clamp-2">
                    {item.display_name || item.name}
                  </h4>

                  {/* Why this product */}
                  <p className="text-white/60 text-xs text-center mb-3 line-clamp-2">
                    {getBreedWhy(item.name, traits)}
                  </p>

                  {/* Concierge® badge */}
                  <p className="text-white/40 text-[10px] text-center uppercase tracking-wider mb-2">
                    Concierge® helps
                  </p>

                  {/* Button */}
                  <button
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition-all bg-gradient-to-r ${theme.buttonGradient} text-white hover:opacity-90 active:scale-[0.98]`}
                  >
                    Ask for {pet.name}
                  </button>
                </div>
              ))}
            </div>
            
            {/* Mobile hint */}
            <div className="flex justify-center mt-3 sm:hidden">
              <span className="text-xs text-gray-400/50">← Swipe for more →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.buttonGradient} flex items-center justify-center text-2xl`}>
                {selectedItem && getProductIcon(selectedItem.name)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedItem?.display_name || selectedItem?.name}
                </h2>
                <p className="text-sm text-gray-500 font-normal">for {pet.name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600 text-sm">
                Our Concierge® will help find the perfect option for {pet.name}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Pet Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                  🐕
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-600">{pet.breed}</p>
                </div>
              </div>

              {/* Why Recommended */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-gray-700">
                  <strong>Why Mira recommends this:</strong>
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  💡 {selectedItem && getBreedWhy(selectedItem.name, traits)}
                </p>
                {traits.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Based on {pet.breed} traits: {traits.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Any specific preferences? (optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="E.g., budget range, brand preference, size needs..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-5 bg-gradient-to-r ${theme.buttonGradient} text-white font-semibold rounded-xl`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending to Concierge®...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send to Concierge®
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Our team will find the best options and get back to you
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BreedSmartRecommendations;
