/**
 * PersonalizedPillarSection.jsx
 * 
 * UNIVERSAL "PERSONALIZED FOR {PET}" section for ALL pillars.
 * Shows concierge-curated items featuring the pet's name/preferences.
 * All items flow through Universal Service Command - Concierge® creates these.
 * 
 * Usage:
 * <PersonalizedPillarSection
 *   pillar="care"
 *   pet={activePet}
 *   token={token}
 *   userEmail={user?.email}
 * />
 */

import React, { useState } from 'react';
import { 
  Sparkles, Heart, Loader2, Check, Send
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { API_URL } from '../utils/api';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// PILLAR CONFIGURATIONS - Items for each pillar
// ═══════════════════════════════════════════════════════════════════════════════

const PILLAR_CONFIGS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CARE - Grooming & Wellness
  // ─────────────────────────────────────────────────────────────────────────────
  care: {
    title: 'Care Essentials',
    subtitle: 'Grooming & wellness gear personalized for your pet',
    theme: {
      gradient: 'from-slate-900 via-teal-950/80 to-slate-900',
      accent: 'teal',
      buttonGradient: 'from-teal-500 to-cyan-500',
      scrollbarColor: 'rgba(20, 184, 166, 0.5)'
    },
    items: [
      { id: 'custom-brush', name: 'Personalized Brush Set', description: 'Brush with name engraved - matched to coat type', icon: '🪮', category: 'grooming', soulTip: 'Bristle type matched to coat' },
      { id: 'grooming-bag', name: 'Custom Grooming Bag', description: 'Organizer bag with pet\'s name embroidered', icon: '👜', category: 'grooming', soulTip: 'Perfect for spa day essentials' },
      { id: 'nail-kit', name: 'Nail Care Kit', description: 'Clippers & file in personalized pouch', icon: '💅', category: 'grooming', soulTip: 'Size matched to pet' },
      { id: 'spa-robe', name: 'Pet Spa Robe', description: 'Cozy robe with name - post-bath luxury', icon: '🛁', category: 'grooming', soulTip: 'Great for after grooming!' },
      { id: 'shampoo-set', name: 'Custom Shampoo Label', description: 'Premium shampoo with pet\'s name label', icon: '🧴', category: 'wellness', soulTip: 'Formula for your pet\'s coat' },
      { id: 'health-journal', name: 'Health & Wellness Journal', description: 'Track grooming, health, vet visits', icon: '📓', category: 'wellness', soulTip: 'Personalized cover with name' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STAY - Boarding & Home Comfort
  // ─────────────────────────────────────────────────────────────────────────────
  stay: {
    title: 'Stay Comforts',
    subtitle: 'Home & boarding essentials with your pet\'s name',
    theme: {
      gradient: 'from-slate-900 via-indigo-950/80 to-slate-900',
      accent: 'indigo',
      buttonGradient: 'from-indigo-500 to-purple-500',
      scrollbarColor: 'rgba(99, 102, 241, 0.5)'
    },
    items: [
      { id: 'custom-bed', name: 'Personalized Pet Bed', description: 'Luxury bed with name embroidered', icon: '🛏️', category: 'bedding', soulTip: 'Size matched to your pet' },
      { id: 'cozy-blanket', name: 'Name Blanket', description: 'Soft fleece with pet\'s name woven in', icon: '🧣', category: 'bedding', soulTip: 'Perfect for travel too' },
      { id: 'crate-tag', name: 'Crate Name Plate', description: 'Custom sign: "[Name]\'s Room"', icon: '🏷️', category: 'boarding', soulTip: 'For boarding & home crate' },
      { id: 'comfort-toy', name: 'Scented Comfort Toy', description: 'Plush with your scent + pet\'s name', icon: '🧸', category: 'comfort', soulTip: 'Reduces separation anxiety' },
      { id: 'door-sign', name: 'Pet Room Door Sign', description: '"[Name]\'s Den" custom sign', icon: '🚪', category: 'home', soulTip: 'Mark their special space' },
      { id: 'boarding-kit', name: 'Boarding Essentials Kit', description: 'Bag with all labeled items for stays', icon: '🎒', category: 'boarding', soulTip: 'Everything for overnight stays' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRAVEL - Adventures & Journeys
  // ─────────────────────────────────────────────────────────────────────────────
  travel: {
    title: 'Travel Gear',
    subtitle: 'Adventure essentials with your pet\'s name',
    theme: {
      gradient: 'from-slate-900 via-sky-950/80 to-slate-900',
      accent: 'sky',
      buttonGradient: 'from-sky-500 to-blue-500',
      scrollbarColor: 'rgba(14, 165, 233, 0.5)'
    },
    items: [
      { id: 'travel-carrier', name: 'Personalized Carrier', description: 'Airline-approved with name tag', icon: '🧳', category: 'carrier', soulTip: 'Size matched to pet' },
      { id: 'pet-passport', name: 'Pet Passport Holder', description: 'Stylish holder with name embossed', icon: '📘', category: 'documents', soulTip: 'Keep all travel docs safe' },
      { id: 'car-seat', name: 'Custom Car Seat', description: 'Safety seat with name embroidered', icon: '🚗', category: 'car', soulTip: 'Safe road trips!' },
      { id: 'travel-kit', name: 'Adventure Kit', description: 'Collapsible bowl, mat, bag with name', icon: '🎒', category: 'accessories', soulTip: 'All-in-one travel bundle' },
      { id: 'luggage-tag', name: 'Pet Luggage Tag', description: '"If lost, I belong to [Name]"', icon: '🏷️', category: 'safety', soulTip: 'With your contact info' },
      { id: 'travel-blanket', name: 'Travel Comfort Blanket', description: 'Compact blanket with name', icon: '🛫', category: 'comfort', soulTip: 'Familiar scent on the go' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ENJOY - Play & Entertainment
  // ─────────────────────────────────────────────────────────────────────────────
  enjoy: {
    title: 'Play Essentials',
    subtitle: 'Fun & enrichment items personalized for play',
    theme: {
      gradient: 'from-slate-900 via-rose-950/80 to-slate-900',
      accent: 'rose',
      buttonGradient: 'from-rose-500 to-pink-500',
      scrollbarColor: 'rgba(244, 63, 94, 0.5)'
    },
    items: [
      { id: 'toy-box', name: 'Custom Toy Box', description: '"[Name]\'s Toys" storage chest', icon: '📦', category: 'storage', soulTip: 'Keep toys organized!' },
      { id: 'name-ball', name: 'Personalized Ball', description: 'Tennis ball with name printed', icon: '🎾', category: 'toys', soulTip: 'Never lose it at the park' },
      { id: 'puzzle-toy', name: 'Custom Puzzle Toy', description: 'Brain game with difficulty for your pet', icon: '🧩', category: 'enrichment', soulTip: 'Matched to intelligence level' },
      { id: 'tug-rope', name: 'Name Rope Toy', description: 'Durable rope with name tag attached', icon: '🪢', category: 'toys', soulTip: 'Great for tug-of-war!' },
      { id: 'squeaky-plush', name: 'Custom Squeaky Toy', description: 'Plush in breed shape with name', icon: '🐾', category: 'toys', soulTip: 'Looks like your pet!' },
      { id: 'activity-mat', name: 'Snuffle Mat', description: 'Enrichment mat with name border', icon: '🌿', category: 'enrichment', soulTip: 'Hide treats for fun!' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FIT - Fitness & Exercise
  // ─────────────────────────────────────────────────────────────────────────────
  fit: {
    title: 'Fitness Gear',
    subtitle: 'Exercise essentials to keep your pet active',
    theme: {
      gradient: 'from-slate-900 via-lime-950/80 to-slate-900',
      accent: 'lime',
      buttonGradient: 'from-lime-500 to-green-500',
      scrollbarColor: 'rgba(132, 204, 22, 0.5)'
    },
    items: [
      { id: 'custom-leash', name: 'Personalized Leash', description: 'Premium leash with name woven in', icon: '🦮', category: 'walking', soulTip: 'Length matched to size' },
      { id: 'fitness-harness', name: 'Custom Harness', description: 'Ergonomic harness with name patch', icon: '🎽', category: 'walking', soulTip: 'Perfect fit for your pet' },
      { id: 'step-tracker', name: 'Activity Tracker Tag', description: 'Track walks & play with name display', icon: '📊', category: 'tech', soulTip: 'Monitor daily activity' },
      { id: 'agility-kit', name: 'Backyard Agility Set', description: 'Custom cones & hurdles with name', icon: '🏃', category: 'exercise', soulTip: 'Home training made fun' },
      { id: 'swim-vest', name: 'Personalized Swim Vest', description: 'Safety vest with name for water play', icon: '🏊', category: 'swimming', soulTip: 'Safe swimming sessions' },
      { id: 'cooling-vest', name: 'Cooling Vest', description: 'Summer vest with name - keeps cool', icon: '❄️', category: 'outdoor', soulTip: 'Essential for hot days' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEARN - Training & Education
  // ─────────────────────────────────────────────────────────────────────────────
  learn: {
    title: 'Training Essentials',
    subtitle: 'Learning tools personalized for training success',
    theme: {
      gradient: 'from-slate-900 via-emerald-950/80 to-slate-900',
      accent: 'emerald',
      buttonGradient: 'from-emerald-500 to-teal-500',
      scrollbarColor: 'rgba(16, 185, 129, 0.5)'
    },
    items: [
      { id: 'treat-pouch', name: 'Custom Treat Pouch', description: 'Training pouch with name embroidered', icon: '👛', category: 'training', soulTip: 'Quick access for rewards' },
      { id: 'clicker-set', name: 'Personalized Clicker Set', description: 'Clicker with name keychain', icon: '🔔', category: 'training', soulTip: 'Consistent training tool' },
      { id: 'training-journal', name: 'Training Progress Book', description: 'Track commands & milestones', icon: '📖', category: 'tracking', soulTip: 'Celebrate achievements!' },
      { id: 'command-cards', name: 'Custom Command Cards', description: 'Flashcards with pet\'s photo', icon: '🃏', category: 'training', soulTip: 'Visual learning aids' },
      { id: 'graduation-bandana', name: 'Training Graduate Bandana', description: '"[Name] Graduated!" celebration wear', icon: '🎓', category: 'rewards', soulTip: 'Celebrate milestones!' },
      { id: 'trick-kit', name: 'Advanced Tricks Kit', description: 'Props for fun tricks with name', icon: '🎪', category: 'enrichment', soulTip: 'Teach impressive tricks' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PAPERWORK - Documents & Records
  // ─────────────────────────────────────────────────────────────────────────────
  paperwork: {
    title: 'Pet Documents',
    subtitle: 'Important paperwork organized with your pet\'s name',
    theme: {
      gradient: 'from-slate-900 via-slate-800/80 to-slate-900',
      accent: 'slate',
      buttonGradient: 'from-slate-500 to-gray-500',
      scrollbarColor: 'rgba(100, 116, 139, 0.5)'
    },
    items: [
      { id: 'pet-id-card', name: 'Premium Pet ID Card', description: 'Laminated ID with photo & details', icon: '🪪', category: 'identity', soulTip: 'Include emergency contacts' },
      { id: 'records-folder', name: 'Health Records Folder', description: '"[Name]\'s Medical History" organizer', icon: '📁', category: 'medical', soulTip: 'Keep vet records safe' },
      { id: 'vaccine-book', name: 'Vaccination Booklet', description: 'Custom cover with all vaccine history', icon: '💉', category: 'medical', soulTip: 'Track all vaccinations' },
      { id: 'pet-resume', name: 'Pet Resume/Bio Card', description: 'Beautiful bio card for boarding/vets', icon: '📋', category: 'profile', soulTip: 'Share personality & needs' },
      { id: 'emergency-card', name: 'Emergency Contact Card', description: 'Wallet card with vet & contacts', icon: '🆘', category: 'emergency', soulTip: 'Always be prepared' },
      { id: 'insurance-holder', name: 'Insurance Doc Holder', description: 'Organize all insurance papers', icon: '🏥', category: 'insurance', soulTip: 'Quick access when needed' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADVISORY - Health & Vet
  // ─────────────────────────────────────────────────────────────────────────────
  advisory: {
    title: 'Health Advisory',
    subtitle: 'Wellness monitoring personalized for your pet',
    theme: {
      gradient: 'from-slate-900 via-blue-950/80 to-slate-900',
      accent: 'blue',
      buttonGradient: 'from-blue-500 to-indigo-500',
      scrollbarColor: 'rgba(59, 130, 246, 0.5)'
    },
    items: [
      { id: 'symptom-diary', name: 'Health Symptom Diary', description: 'Track symptoms & behaviors daily', icon: '📔', category: 'tracking', soulTip: 'Share with your vet' },
      { id: 'medication-box', name: 'Custom Pill Organizer', description: '"[Name]\'s Meds" weekly organizer', icon: '💊', category: 'medication', soulTip: 'Never miss a dose' },
      { id: 'weight-tracker', name: 'Weight Tracking Chart', description: 'Visual chart with name header', icon: '⚖️', category: 'wellness', soulTip: 'Monitor health trends' },
      { id: 'vet-visit-bag', name: 'Vet Visit Bag', description: 'Organized bag for vet appointments', icon: '🏥', category: 'vet', soulTip: 'All essentials in one place' },
      { id: 'allergy-tag', name: 'Medical Alert Tag', description: 'Tag showing allergies & conditions', icon: '⚠️', category: 'safety', soulTip: 'Critical info visible' },
      { id: 'senior-care-kit', name: 'Senior Care Kit', description: 'Comfort items for aging pets', icon: '🤍', category: 'senior', soulTip: 'Gentle care for seniors' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMERGENCY - Safety & Preparedness
  // ─────────────────────────────────────────────────────────────────────────────
  emergency: {
    title: 'Emergency Prep',
    subtitle: 'Safety essentials with your pet\'s info',
    theme: {
      gradient: 'from-slate-900 via-red-950/80 to-slate-900',
      accent: 'red',
      buttonGradient: 'from-red-500 to-orange-500',
      scrollbarColor: 'rgba(239, 68, 68, 0.5)'
    },
    items: [
      { id: 'first-aid-kit', name: 'Pet First Aid Kit', description: 'Custom kit labeled with name', icon: '🩹', category: 'safety', soulTip: 'Includes breed-specific items' },
      { id: 'emergency-bag', name: 'Go-Bag Emergency Kit', description: 'Evacuation kit with all essentials', icon: '🎒', category: 'evacuation', soulTip: '72-hour supply ready' },
      { id: 'gps-tag', name: 'GPS Tracker Tag', description: 'Real-time location with name display', icon: '📍', category: 'tracking', soulTip: 'Never lose your pet' },
      { id: 'reflective-vest', name: 'Safety Reflective Vest', description: 'High-vis vest with name', icon: '🦺', category: 'visibility', soulTip: 'For night walks & emergencies' },
      { id: 'rescue-sticker', name: 'Pet Rescue Window Sticker', description: '"[Name] Inside - Please Rescue"', icon: '🪟', category: 'home', soulTip: 'Alert responders' },
      { id: 'emergency-contacts', name: 'Emergency Contact Kit', description: 'Cards, tags & info sheet bundle', icon: '📞', category: 'contacts', soulTip: 'Multiple backups of info' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADOPT - Adoption & Welcome
  // ─────────────────────────────────────────────────────────────────────────────
  adopt: {
    title: 'Welcome Home',
    subtitle: 'Celebration items for your new family member',
    theme: {
      gradient: 'from-slate-900 via-violet-950/80 to-slate-900',
      accent: 'violet',
      buttonGradient: 'from-violet-500 to-purple-500',
      scrollbarColor: 'rgba(139, 92, 246, 0.5)'
    },
    items: [
      { id: 'gotcha-kit', name: '"Gotcha Day" Kit', description: 'Celebration bundle for adoption day', icon: '🎉', category: 'celebration', soulTip: 'Make the day special!' },
      { id: 'welcome-sign', name: 'Welcome Home Sign', description: '"Welcome Home [Name]!" banner', icon: '🏠', category: 'decor', soulTip: 'Photo-worthy moment' },
      { id: 'adoption-cert', name: 'Framed Adoption Certificate', description: 'Beautiful certificate with details', icon: '📜', category: 'keepsake', soulTip: 'Cherish forever' },
      { id: 'first-day-kit', name: 'First Day Essentials', description: 'Everything needed for day one', icon: '📦', category: 'essentials', soulTip: 'Curated starter kit' },
      { id: 'rescue-bandana', name: '"Rescued" Bandana', description: 'Proud rescue wear with name', icon: '🎀', category: 'apparel', soulTip: 'Spread the adoption message' },
      { id: 'story-book', name: 'Pet Story Book', description: 'Custom book: "[Name]\'s Journey Home"', icon: '📚', category: 'keepsake', soulTip: 'Document their story' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SHOP - General Merchandise
  // ─────────────────────────────────────────────────────────────────────────────
  shop: {
    title: 'Custom Shop',
    subtitle: 'Personalized merchandise for pet lovers',
    theme: {
      gradient: 'from-slate-900 via-fuchsia-950/80 to-slate-900',
      accent: 'fuchsia',
      buttonGradient: 'from-fuchsia-500 to-pink-500',
      scrollbarColor: 'rgba(217, 70, 239, 0.5)'
    },
    items: [
      { id: 'parent-mug', name: 'Pet Parent Mug', description: '"[Name]\'s Mom/Dad" ceramic mug', icon: '☕', category: 'drinkware', soulTip: 'Start your day with love' },
      { id: 'photo-blanket', name: 'Photo Throw Blanket', description: 'Cozy blanket with pet\'s photo', icon: '🛋️', category: 'home', soulTip: 'Snuggle with memories' },
      { id: 'car-decal', name: 'Custom Car Decal', description: '"[Name] On Board" window sticker', icon: '🚙', category: 'auto', soulTip: 'Show off your pet love' },
      { id: 'phone-case', name: 'Pet Photo Phone Case', description: 'Phone case with pet\'s face', icon: '📱', category: 'accessories', soulTip: 'Always carry them with you' },
      { id: 'calendar', name: 'Custom Pet Calendar', description: '12 months of [Name]', icon: '📅', category: 'home', soulTip: 'Great gift idea!' },
      { id: 'tote-bag', name: 'Pet Portrait Tote', description: 'Canvas tote with pet illustration', icon: '👜', category: 'bags', soulTip: 'Eco-friendly & stylish' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FAREWELL - Memorial (Handled sensitively)
  // ─────────────────────────────────────────────────────────────────────────────
  farewell: {
    title: 'Memory & Tribute',
    subtitle: 'Honoring the love that never fades',
    theme: {
      gradient: 'from-slate-900 via-slate-800/80 to-slate-900',
      accent: 'slate',
      buttonGradient: 'from-slate-400 to-gray-400',
      scrollbarColor: 'rgba(148, 163, 184, 0.5)'
    },
    items: [
      { id: 'memory-box', name: 'Memory Keepsake Box', description: 'Beautiful box for treasured items', icon: '💝', category: 'keepsake', soulTip: 'Store precious memories' },
      { id: 'paw-print-kit', name: 'Paw Print Impression Kit', description: 'Create a lasting paw impression', icon: '🐾', category: 'memorial', soulTip: 'Capture their unique print' },
      { id: 'photo-frame', name: 'Memorial Photo Frame', description: '"Forever in Our Hearts" frame', icon: '🖼️', category: 'memorial', soulTip: 'Display their memory' },
      { id: 'garden-stone', name: 'Garden Memorial Stone', description: 'Custom engraved garden marker', icon: '🪨', category: 'outdoor', soulTip: 'A peaceful tribute' },
      { id: 'memory-journal', name: 'Grief & Memory Journal', description: 'Space to process and remember', icon: '📝', category: 'healing', soulTip: 'Healing through writing' },
      { id: 'donation-card', name: 'Donation in Memory Card', description: 'Donate to shelter in their name', icon: '💜', category: 'giving', soulTip: 'Honor by helping others' }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const PersonalizedPillarSection = ({ 
  pillar,
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

  // Get pillar config
  const config = PILLAR_CONFIGS[pillar];
  if (!config || !pet) return null;

  const { title, subtitle, theme, items } = config;

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
          item_type: `personalized_${pillar}_item`,
          item_id: item.id,
          item_name: item.name,
          item_icon: item.icon,
          pillar: pillar,
          source: `personalized_${pillar}_section`
        })
      });

      if (response.ok) {
        setFavorites(prev => ({ ...prev, [item.id]: true }));
        toast.success(`Saved to ${pet.name}'s favorites!`);
        if (onSaveToFavorites) onSaveToFavorites(item);
      }
    } catch (error) {
      console.error(`[PersonalizedPillarSection:${pillar}] Favorite error:`, error);
    } finally {
      setSavingFavorite(null);
    }
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
          type: `personalized_${pillar}_item`,
          pillar: pillar,
          source: `personalized_${pillar}_section`,
          priority: 'normal',
          intent: `custom_${pillar}_item_creation`,
          customer: {
            email: userEmail,
            name: pet.parent_name || ''
          },
          details: {
            pet_id: pet.id || pet._id,
            pet_name: pet.name,
            pet_breed: pet.breed || 'Not specified',
            allergies: pet.allergies || [],
            
            item_id: selectedItem.id,
            item_name: selectedItem.name,
            item_category: selectedItem.category,
            item_description: selectedItem.description,
            
            personalization_name: pet.name,
            special_notes: specialNotes || 'No additional notes',
            
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
      console.error(`[PersonalizedPillarSection:${pillar}] Error:`, error);
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    const container = document.querySelector(`[data-scroll-container="${pillar}-personalized"]`);
    if (container) container.scrollBy({ left: -220, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = document.querySelector(`[data-scroll-container="${pillar}-personalized"]`);
    if (container) container.scrollBy({ left: 220, behavior: 'smooth' });
  };

  return (
    <>
      {/* Section Container */}
      <div 
        className={`bg-gradient-to-br ${theme.gradient} rounded-2xl p-5 sm:p-6`} 
        data-testid={`personalized-${pillar}-section`}
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className={`w-4 h-4 text-${theme.accent}-400`} />
            {title} for {pet.name}
          </h3>
          <p className={`text-xs text-${theme.accent}-400/70 mt-1`}>
            {subtitle} - Concierge® creates these
          </p>
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
          
          <div 
            data-scroll-container={`${pillar}-personalized`}
            className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.scrollbarColor} transparent`
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex-shrink-0 w-44 sm:w-48 p-4 rounded-2xl bg-gradient-to-br from-${theme.accent}-900/50 to-${theme.accent}-900/30 border border-${theme.accent}-500/40 cursor-pointer hover:border-${theme.accent}-400/60 transition-all active:scale-[0.98] snap-start relative`}
                style={{
                  background: `linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.5))`,
                  borderColor: `${theme.scrollbarColor}`
                }}
                onClick={() => handleItemClick(item)}
                data-testid={`${pillar}-item-${item.id}`}
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
                <p className="text-xs text-gray-300/80 text-center line-clamp-2 min-h-[2.5rem]">
                  {item.description}
                </p>
                
                {/* Source */}
                <p className="text-xs text-gray-400 text-center mt-2 italic">
                  Concierge® creates
                </p>
                
                {/* CTA Button */}
                <button
                  className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${theme.buttonGradient} text-white hover:opacity-90 active:scale-[0.98] shadow-lg`}
                >
                  Create for {pet.name}
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

      {/* Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.buttonGradient} flex items-center justify-center text-2xl`}>
                {selectedItem?.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedItem?.name}</h2>
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
                Our Concierge® will create this for {pet.name}
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
                  <p className="text-sm text-gray-600">{pet.breed || 'Pet'}</p>
                </div>
              </div>

              {/* Item Description */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>What you'll get:</strong> {selectedItem?.description}
                </p>
                {selectedItem?.soulTip && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 {selectedItem.soulTip}
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
                  placeholder="E.g., color preference, specific text, etc."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                Our team will contact you with pricing & delivery timeline
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonalizedPillarSection;
export { PILLAR_CONFIGS };
