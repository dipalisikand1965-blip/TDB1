/**
 * PersonalizedItemsSection.jsx
 * 
 * "PERSONALIZED FOR {PET}" section on the Celebrate page.
 * Shows concierge-curated custom items featuring the pet's name/photo.
 * All items flow through Universal Service Command - Concierge® creates these.
 * 
 * Matches the design from mira-demo page.
 */

import React, { useState } from 'react';
import { 
  Sparkles, ChevronRight, Send, X, Loader2, Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_URL } from '../../utils/api';
import { toast } from 'sonner';

// Personalized items that Concierge® creates
const PERSONALIZED_ITEMS = [
  {
    id: 'photo-mug',
    name: 'Custom Photo Mug',
    description: 'Start your day with your best friend\'s face',
    icon: '☕',
    category: 'home'
  },
  {
    id: 'photo-coaster',
    name: 'Photo Coaster Set',
    description: 'Protect your surfaces with pet love',
    icon: '🥤',
    category: 'home'
  },
  {
    id: 'name-bandana',
    name: 'Custom Name Bandana',
    description: 'Stylish bandana with embroidered name',
    icon: '🎀',
    category: 'accessories'
  },
  {
    id: 'pet-portrait',
    name: 'AI Pet Portrait',
    description: 'Artistic portrait generated from your pet...',
    icon: '🖼️',
    category: 'art'
  },
  {
    id: 'collar-tag',
    name: 'Custom Collar Tag',
    description: 'Engraved with name and your phone number',
    icon: '🏷️',
    category: 'accessories'
  },
  {
    id: 'lookalike-plush',
    name: 'Custom Lookalike Plush',
    description: 'A plush toy that looks just like your pet',
    icon: '🧸',
    category: 'toys'
  }
];

const PersonalizedItemsSection = ({ 
  pet, 
  token, 
  userEmail 
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!pet) return null;

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
          type: 'personalized_item_request',
          pillar: 'celebrate',
          source: 'personalized_items_section',
          priority: 'normal',
          intent: 'custom_item_creation',
          customer: {
            email: userEmail,
            name: pet.parent_name || ''
          },
          details: {
            pet_id: pet.id || pet._id,
            pet_name: pet.name,
            pet_breed: pet.breed || 'Not specified',
            
            // Item details
            item_id: selectedItem.id,
            item_name: selectedItem.name,
            item_category: selectedItem.category,
            item_description: selectedItem.description,
            
            // Personalization
            personalization_name: pet.name,
            special_notes: specialNotes || 'No additional notes',
            
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
      console.error('[PersonalizedItemsSection] Error:', error);
      toast.error('Network error', {
        description: 'Please check your connection'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Section Container - Dark theme matching mira-demo */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/90 to-slate-900 rounded-2xl p-5 sm:p-6" data-testid="personalized-items-section">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Personalized for {pet.name}
          </h3>
          <p className="text-xs text-pink-400/70 mt-1">
            Unique items featuring your pet - Concierge® creates these
          </p>
        </div>

        {/* Horizontal Scrollable Cards - iOS Native Feel */}
        <div className="relative">
          <div 
            className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {PERSONALIZED_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-44 sm:w-48 p-4 rounded-2xl bg-gradient-to-br from-pink-900/50 to-purple-900/30 border border-pink-500/40 cursor-pointer hover:border-pink-400/60 transition-all active:scale-[0.98] snap-start"
                onClick={() => handleItemClick(item)}
                data-testid={`personalized-item-${item.id}`}
              >
              {/* Icon */}
              <div className="flex justify-center mb-2">
                <span className="text-3xl">{item.icon}</span>
              </div>
              
              {/* Name */}
              <h4 className="text-xs font-medium text-white text-center mb-1">
                {item.name}
              </h4>
              
              {/* Description */}
              <p className="text-[10px] text-pink-300/80 text-center line-clamp-2">
                {item.description}
              </p>
              
              {/* Price/Source */}
              <p className="text-[10px] text-gray-500 text-center mt-2 italic">
                Concierge® creates
              </p>
              
              {/* CTA Button */}
              <button
                className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-medium transition-all bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
              >
                Create for {pet.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl">
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
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg">
                  🐕
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-600">{pet.breed || 'Pet'}</p>
                </div>
              </div>

              {/* Item Description */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>What you'll get:</strong> {selectedItem?.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Our Concierge® team will personally craft this item with {pet.name}'s name and/or photo.
                </p>
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Any special requests? (optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder={`E.g., "Include my phone number on the tag" or "Use this specific photo..."`}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  data-testid="personalized-item-notes"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl"
                data-testid="submit-personalized-item-btn"
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

export default PersonalizedItemsSection;
