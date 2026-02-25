/**
 * PersonalizedDineSection.jsx
 * 
 * "PERSONALIZED FOR {PET}" section on the Dine page.
 * Shows concierge-curated dining items featuring the pet's name/preferences.
 * All items flow through Universal Service Command - Concierge® creates these.
 * 
 * Soul-driven: suggests items based on breed, allergies, eating habits.
 * Includes favorites (heart icon) functionality.
 */

import React, { useState } from 'react';
import { 
  Sparkles, ChevronRight, Send, Heart, Loader2, Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_URL } from '../../utils/api';
import { toast } from 'sonner';

// Personalized dining items that Concierge® creates
const PERSONALIZED_DINE_ITEMS = [
  {
    id: 'custom-bowl',
    name: 'Custom Name Bowl',
    description: 'Ceramic bowl with pet\'s name beautifully engraved',
    icon: '🥣',
    category: 'feeding',
    soulTip: 'Elevated style recommended for flat-faced breeds'
  },
  {
    id: 'feeding-mat',
    name: 'Personalized Feeding Mat',
    description: 'Silicone mat with name & "Dining Area" design',
    icon: '🍽️',
    category: 'feeding',
    soulTip: 'Can include allergy warnings'
  },
  {
    id: 'treat-jar',
    name: 'Custom Treat Jar',
    description: '"[Name]\'s Treats" glass jar with photo option',
    icon: '🫙',
    category: 'storage',
    soulTip: 'Perfect for training rewards'
  },
  {
    id: 'slow-feeder',
    name: 'Slow Feeder Bowl',
    description: 'Puzzle bowl with name - for enthusiastic eaters',
    icon: '🐌',
    category: 'feeding',
    soulTip: 'Great for fast eaters & portion control'
  },
  {
    id: 'elevated-stand',
    name: 'Elevated Bowl Stand',
    description: 'Wooden stand with name plate - ergonomic dining',
    icon: '🏔️',
    category: 'furniture',
    soulTip: 'Height matched to pet\'s size'
  },
  {
    id: 'travel-bowl-set',
    name: 'Travel Bowl Set',
    description: 'Portable collapsible bowls with name tag',
    icon: '🧳',
    category: 'travel',
    soulTip: 'Perfect for adventures & outings'
  },
  {
    id: 'bib-bandana',
    name: 'Dining Bib Bandana',
    description: '"Messy Eater" bandana - keeps fur clean!',
    icon: '🎀',
    category: 'accessories',
    soulTip: 'Great for bearded breeds & drooly pups'
  },
  {
    id: 'breed-bowl',
    name: 'Breed-Themed Bowl',
    description: 'Bowl shaped/designed for your pet\'s breed',
    icon: '👑',
    category: 'premium',
    soulTip: 'Artisan crafted for your breed'
  }
];

const PersonalizedDineSection = ({ 
  pet, 
  token, 
  userEmail,
  onSaveToFavorites 
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [savingFavorite, setSavingFavorite] = useState(null);

  if (!pet) return null;

  // Get soul-based recommendations
  const getSoulTip = (item) => {
    const breed = (pet.breed || '').toLowerCase();
    const allergies = pet.allergies || pet.soul?.allergies || [];
    
    // Custom tips based on soul data
    if (item.id === 'elevated-stand' && ['shih tzu', 'pug', 'bulldog', 'pekingese'].some(b => breed.includes(b))) {
      return '✨ Recommended for ' + pet.breed + ' - easier on neck & digestion';
    }
    if (item.id === 'feeding-mat' && allergies.length > 0) {
      return '⚠️ Can print "No ' + allergies.join(', ') + '" warning';
    }
    if (item.id === 'bib-bandana' && ['shih tzu', 'schnauzer', 'maltese'].some(b => breed.includes(b))) {
      return '✨ Perfect for ' + pet.breed + '\'s beautiful beard!';
    }
    if (item.id === 'breed-bowl') {
      return '🎨 Custom ' + (pet.breed || 'breed') + ' design available';
    }
    return item.soulTip;
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setSpecialNotes('');
    setSubmitted(false);
  };

  const handleFavoriteClick = async (e, item) => {
    e.stopPropagation();
    setSavingFavorite(item.id);
    
    try {
      const response = await fetch(`${API_URL}/api/pets/${pet.id || pet._id}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          item_type: 'personalized_dine_item',
          item_id: item.id,
          item_name: item.name,
          item_icon: item.icon,
          pillar: 'dine',
          source: 'personalized_dine_section'
        })
      });

      if (response.ok) {
        setFavorites(prev => ({ ...prev, [item.id]: true }));
        toast.success(`Saved to ${pet.name}'s favorites!`);
        if (onSaveToFavorites) onSaveToFavorites(item);
      }
    } catch (error) {
      console.error('[PersonalizedDineSection] Favorite error:', error);
    } finally {
      setSavingFavorite(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);

    try {
      // Create service ticket via Universal Service Command
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'personalized_dine_item',
          pillar: 'dine',
          source: 'personalized_dine_section',
          priority: 'normal',
          intent: 'custom_dine_item_creation',
          customer: {
            email: userEmail,
            name: pet.parent_name || ''
          },
          details: {
            pet_id: pet.id || pet._id,
            pet_name: pet.name,
            pet_breed: pet.breed || 'Not specified',
            pet_size: pet.size || pet.weight || 'Not specified',
            allergies: pet.allergies || [],
            
            // Item details
            item_id: selectedItem.id,
            item_name: selectedItem.name,
            item_category: selectedItem.category,
            item_description: selectedItem.description,
            
            // Personalization
            personalization_name: pet.name,
            special_notes: specialNotes || 'No additional notes',
            soul_tip: getSoulTip(selectedItem),
            
            // Summary for concierge
            concierge_summary: `${selectedItem.name} for ${pet.name} (${pet.breed || 'Pet'})${specialNotes ? `. Notes: ${specialNotes}` : ''}`
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(`Request sent to Concierge®!`, {
          description: `We'll create a ${selectedItem.name} for ${pet.name}`
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
      console.error('[PersonalizedDineSection] Error:', error);
      toast.error('Network error', {
        description: 'Please check your connection'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll handlers for desktop
  const scrollLeft = () => {
    const container = document.querySelector('[data-scroll-container="dine-personalized"]');
    if (container) container.scrollBy({ left: -220, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = document.querySelector('[data-scroll-container="dine-personalized"]');
    if (container) container.scrollBy({ left: 220, behavior: 'smooth' });
  };

  return (
    <>
      {/* Section Container - Dark theme */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/80 to-slate-900 rounded-2xl p-5 sm:p-6" data-testid="personalized-dine-section">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Dining Essentials for {pet.name}
          </h3>
          <p className="text-xs text-amber-400/70 mt-1">
            Personalized dining gear - Concierge® creates these
          </p>
        </div>

        {/* Horizontal Scrollable Cards - Desktop & Mobile */}
        <div className="relative group">
          {/* Left scroll button - Desktop only */}
          <button
            onClick={scrollLeft}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-4"
            aria-label="Scroll left"
          >
            ←
          </button>
          
          {/* Right scroll button - Desktop only */}
          <button
            onClick={scrollRight}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-4"
            aria-label="Scroll right"
          >
            →
          </button>
          
          <div 
            data-scroll-container="dine-personalized"
            className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(251, 191, 36, 0.5) transparent'
            }}
          >
            {PERSONALIZED_DINE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-44 sm:w-48 p-4 rounded-2xl bg-gradient-to-br from-amber-900/50 to-orange-900/30 border border-amber-500/40 cursor-pointer hover:border-amber-400/60 transition-all active:scale-[0.98] snap-start relative"
                onClick={() => handleItemClick(item)}
                data-testid={`dine-item-${item.id}`}
              >
                {/* Favorite button */}
                <button
                  onClick={(e) => handleFavoriteClick(e, item)}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    favorites[item.id] 
                      ? 'bg-red-500 text-white' 
                      : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-red-400'
                  }`}
                  disabled={savingFavorite === item.id}
                  data-testid={`favorite-${item.id}`}
                >
                  {savingFavorite === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${favorites[item.id] ? 'fill-current' : ''}`} />
                  )}
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-2">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                
                {/* Name */}
                <h4 className="text-sm font-semibold text-white text-center mb-1">
                  {item.name}
                </h4>
                
                {/* Description */}
                <p className="text-xs text-amber-300/80 text-center line-clamp-2 min-h-[2.5rem]">
                  {item.description}
                </p>
                
                {/* Soul Tip - if applicable */}
                {getSoulTip(item) && getSoulTip(item) !== item.soulTip && (
                  <p className="text-[10px] text-green-400 text-center mt-1 line-clamp-1">
                    {getSoulTip(item).slice(0, 40)}...
                  </p>
                )}
                
                {/* Source */}
                <p className="text-xs text-gray-400 text-center mt-2 italic">
                  Concierge® creates
                </p>
                
                {/* CTA Button */}
                <button
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 active:scale-[0.98] shadow-lg"
                >
                  Create for {pet.name}
                </button>
              </div>
            ))}
          </div>
          
          {/* Scroll Indicator - Mobile hint */}
          <div className="flex justify-center mt-3 sm:hidden">
            <span className="text-xs text-amber-400/50">← Swipe for more →</span>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">
                {selectedItem?.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedItem?.name}</h2>
                <p className="text-sm text-gray-500 font-normal">for {pet.name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            /* Success State */
            <div className="py-10 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600 text-sm">
                Our Concierge® will create this for {pet.name}
              </p>
            </div>
          ) : (
            /* Request Form */
            <div className="space-y-4 py-4">
              {/* Pet Info */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg">
                  🐕
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-600">{pet.breed || 'Pet'}</p>
                </div>
                {(pet.allergies || []).length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    ⚠️ {pet.allergies.join(', ')}
                  </span>
                )}
              </div>

              {/* Item Description */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>What you'll get:</strong> {selectedItem?.description}
                </p>
                {selectedItem && getSoulTip(selectedItem) && (
                  <p className="text-xs text-amber-600 mt-2">
                    💡 {getSoulTip(selectedItem)}
                  </p>
                )}
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Any special requests? (optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder={`E.g., "Blue color please" or "Add my phone number on the bowl"`}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  data-testid="dine-item-notes"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl"
                data-testid="submit-dine-item-btn"
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
                Our team will contact you with pricing & delivery timeline
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonalizedDineSection;
