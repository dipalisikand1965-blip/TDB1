/**
 * MiraBirthdayBoxCard.jsx
 * 
 * Soul-driven Birthday Box suggestion card for the Celebrate pillar.
 * Shows personalized box items based on pet's breed, allergies, and name.
 * All selections flow through Universal Service Command (ticket creation).
 * 
 * "Mira is the soul, the Concierge® controls the experience"
 */

import React, { useState, useEffect } from 'react';
import { 
  Gift, Cake, Sparkles, ChevronRight, X, Send, Check,
  Coffee, Utensils, Dog, Heart, Star, Loader2, PartyPopper
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_URL } from '../../utils/api';
import { toast } from 'sonner';

// Breed-specific cake suggestions
const BREED_CAKE_SUGGESTIONS = {
  'shih tzu': { name: 'Shih Tzu Silhouette Cake', emoji: '🐕', style: 'Adorable fluffy design' },
  'labrador': { name: 'Labrador Face Cake', emoji: '🦮', style: 'Happy Lab expression' },
  'golden retriever': { name: 'Golden Retriever Cake', emoji: '🐕', style: 'Golden sunshine theme' },
  'pug': { name: 'Pug Face Cake', emoji: '🐶', style: 'Cute wrinkly design' },
  'beagle': { name: 'Beagle Portrait Cake', emoji: '🐕‍🦺', style: 'Tri-color design' },
  'german shepherd': { name: 'GSD Silhouette Cake', emoji: '🐕‍🦺', style: 'Noble guardian theme' },
  'bulldog': { name: 'Bulldog Face Cake', emoji: '🐶', style: 'Squishy face design' },
  'poodle': { name: 'Poodle Pompom Cake', emoji: '🐩', style: 'Elegant curly design' },
  'rottweiler': { name: 'Rottweiler Cake', emoji: '🐕‍🦺', style: 'Strong & loyal theme' },
  'dachshund': { name: 'Dachshund Long Cake', emoji: '🌭', style: 'Adorable sausage shape' },
  'indie': { name: 'Desi Star Cake', emoji: '⭐', style: 'Celebrating Indian breeds' },
  'default': { name: 'Custom Breed Cake', emoji: '🎂', style: 'Personalized to your pet' }
};

// Personalized accessory items
const ACCESSORY_ITEMS = [
  {
    id: 'mug',
    name: 'Personalized Mug',
    description: "\"[Pet Name]'s Mom/Dad\" ceramic mug",
    icon: Coffee,
    emoji: '☕',
    priceRange: '₹399-599'
  },
  {
    id: 'feeding_mat',
    name: 'Custom Feeding Mat',
    description: 'Silicone mat with [Pet Name] printed',
    icon: Utensils,
    emoji: '🍽️',
    priceRange: '₹499-799'
  },
  {
    id: 'bandana',
    name: 'Birthday Bandana',
    description: '"Birthday Boy/Girl" with [Pet Name]',
    icon: Heart,
    emoji: '🎀',
    priceRange: '₹299-499'
  },
  {
    id: 'tag',
    name: 'Custom Name Tag',
    description: 'Engraved tag with [Pet Name] & your number',
    icon: Star,
    emoji: '🏷️',
    priceRange: '₹199-399'
  }
];

const MiraBirthdayBoxCard = ({ 
  pet, 
  token, 
  userEmail,
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState({
    cake: true,
    mug: true,
    feeding_mat: false,
    bandana: true,
    tag: false
  });
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!pet) return null;

  // Get breed-specific cake suggestion
  const breedLower = (pet.breed || '').toLowerCase();
  const cakeSuggestion = BREED_CAKE_SUGGESTIONS[breedLower] || BREED_CAKE_SUGGESTIONS['default'];
  
  // Get allergies for display
  const allergies = pet.allergies || pet.soul?.allergies || [];
  const hasAllergies = allergies.length > 0;
  
  // Generate personalized descriptions
  const getPersonalizedDescription = (item) => {
    return item.description
      .replace(/\[Pet Name\]/g, pet.name)
      .replace(/Boy\/Girl/g, pet.gender === 'female' ? 'Girl' : 'Boy');
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getSelectedItemsList = () => {
    const items = [];
    
    if (selectedItems.cake) {
      items.push({
        type: 'cake',
        name: cakeSuggestion.name,
        details: `${cakeSuggestion.style}${hasAllergies ? ` (avoiding: ${allergies.join(', ')})` : ''}`
      });
    }
    
    ACCESSORY_ITEMS.forEach(item => {
      if (selectedItems[item.id]) {
        items.push({
          type: item.id,
          name: item.name,
          details: getPersonalizedDescription(item)
        });
      }
    });
    
    return items;
  };

  const handleSubmit = async () => {
    const selectedItemsList = getSelectedItemsList();
    
    if (selectedItemsList.length === 0) {
      toast.error('Please select at least one item for the box');
      return;
    }

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
          type: 'mira_birthday_box',
          pillar: 'celebrate',
          source: 'mira_birthday_box_card',
          priority: 'high',
          intent: 'birthday_box_curation',
          customer: {
            email: userEmail,
            name: pet.parent_name || ''
          },
          details: {
            pet_id: pet.id || pet._id,
            pet_name: pet.name,
            pet_breed: pet.breed || 'Not specified',
            pet_gender: pet.gender || 'Not specified',
            pet_age: pet.age || pet.pet_age || 'Not specified',
            allergies: allergies,
            has_allergies: hasAllergies,
            
            // Box contents
            selected_items: selectedItemsList,
            item_count: selectedItemsList.length,
            
            // Cake details
            cake_style: selectedItems.cake ? cakeSuggestion.name : null,
            cake_breed_specific: selectedItems.cake,
            allergy_notes: hasAllergies ? `Avoid: ${allergies.join(', ')}` : 'No known allergies',
            
            // Personalization
            personalization_name: pet.name,
            special_notes: specialNotes || 'No additional notes',
            
            // Summary for concierge
            concierge_summary: `Birthday Box for ${pet.name} (${pet.breed || 'Pet'}): ${selectedItemsList.map(i => i.name).join(', ')}${hasAllergies ? `. ALLERGIES: ${allergies.join(', ')}` : ''}`
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(`Birthday Box request created!`, {
          description: `Ticket #${data.request_id || data.ticket_id || 'Created'} - Our concierge will curate ${pet.name}'s perfect box!`
        });
        
        if (onSuccess) {
          onSuccess(data);
        }

        // Close modal after short delay
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitted(false);
        }, 2000);
      } else {
        toast.error('Could not create request', {
          description: data.detail || 'Please try again'
        });
      }
    } catch (error) {
      console.error('[MiraBirthdayBoxCard] Error:', error);
      toast.error('Network error', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Main Suggestion Card */}
      <Card 
        className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 border-2 border-pink-200/50 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
        data-testid="mira-birthday-box-card"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-pink-100 via-transparent to-purple-100" />
        
        <div className="relative p-5 sm:p-6">
          {/* Header with Mira branding */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  Mira Suggests
                </Badge>
                {hasAllergies && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                    Allergy-Safe
                  </Badge>
                )}
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-1">
                {pet.name}'s Birthday Box
              </h3>
              
              <p className="text-sm text-gray-600 mb-3">
                I've picked a <span className="font-semibold text-pink-600">{cakeSuggestion.name}</span>
                {hasAllergies && <span className="text-amber-600"> (no {allergies[0]})</span>}, 
                plus personalized accessories with {pet.name}'s name!
              </p>
              
              {/* Preview items */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="tdc-chip" style={{ background:'rgba(255,255,255,0.85)', color:'#374151', borderColor:'rgba(0,0,0,0.1)' }}>
                  {cakeSuggestion.emoji} Breed Cake
                </span>
                <span className="tdc-chip" style={{ background:'rgba(255,255,255,0.85)', color:'#374151', borderColor:'rgba(0,0,0,0.1)' }}>
                  ☕ Custom Mug
                </span>
                <span className="tdc-chip" style={{ background:'rgba(255,255,255,0.85)', color:'#374151', borderColor:'rgba(0,0,0,0.1)' }}>
                  🎀 Bandana
                </span>
                <span className="tdc-chip" style={{ background:'rgba(255,255,255,0.85)', color:'#374151', borderColor:'rgba(0,0,0,0.1)' }}>
                  +2 more
                </span>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <Button 
            className="w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-5 rounded-xl shadow-md group-hover:shadow-lg transition-all"
            data-testid="build-birthday-box-btn"
          >
            <PartyPopper className="w-5 h-5 mr-2" />
            Build {pet.name}'s Box
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-2">
            Concierge® will curate & deliver the perfect celebration
          </p>
        </div>
      </Card>

      {/* Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{pet.name}'s Birthday Box</h2>
                <p className="text-sm text-gray-500 font-normal">Mira will curate this for you</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            /* Success State */
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600">
                Our concierge is preparing {pet.name}'s birthday box.
                <br />We'll reach out to confirm details soon!
              </p>
            </div>
          ) : (
            /* Selection Form */
            <div className="space-y-5 py-4">
              {/* Pet Info Banner */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg">
                  🐕
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-600">{pet.breed || 'Pet'} {pet.age ? `• ${pet.age}` : ''}</p>
                </div>
                {hasAllergies && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">
                    ⚠️ {allergies.join(', ')}
                  </Badge>
                )}
              </div>

              {/* Cake Selection */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Cake className="w-4 h-4 text-pink-500" />
                  Birthday Cake
                </h4>
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedItems.cake 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                  onClick={() => toggleItem('cake')}
                  data-testid="cake-selection"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{cakeSuggestion.emoji}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{cakeSuggestion.name}</p>
                      <p className="text-sm text-gray-600">{cakeSuggestion.style}</p>
                      {hasAllergies && (
                        <p className="text-xs text-amber-600 mt-1">
                          Will be made without: {allergies.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedItems.cake ? 'bg-pink-500 border-pink-500' : 'border-gray-300'
                    }`}>
                      {selectedItems.cake && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Accessories */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Personalized with "{pet.name}"
                </h4>
                <div className="space-y-2">
                  {ACCESSORY_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isSelected = selectedItems[item.id];
                    
                    return (
                      <div 
                        key={item.id}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => toggleItem(item.id)}
                        data-testid={`accessory-${item.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl">
                            {item.emoji}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{getPersonalizedDescription(item)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{item.priceRange}</p>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                              isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  Special Requests (optional)
                </h4>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder={`Any special requests for ${pet.name}'s birthday box? E.g., "Please include a card saying Happy 3rd Birthday!"`}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  data-testid="special-notes-input"
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Your selection:</strong> {getSelectedItemsList().length} items
                </p>
                <div className="flex flex-wrap gap-1">
                  {getSelectedItemsList().map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || getSelectedItemsList().length === 0}
                className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-base rounded-xl"
                data-testid="submit-birthday-box-btn"
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
                Our team will curate the perfect box and contact you to confirm details & pricing
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MiraBirthdayBoxCard;
