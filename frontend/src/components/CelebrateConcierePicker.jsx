/**
 * CelebrateConcierePicker.jsx
 * Rover-style celebration planner widget
 * Intercepts celebration planners before they browse products
 * Now opens the full PartyPlanningWizard for a richer experience
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import { format } from 'date-fns';
import { getPetPhotoUrl } from '../utils/petAvatar';
import PartyPlanningWizard from './PartyPlanningWizard';
import {
  Cake, Gift, Camera, PartyPopper, Calendar as CalendarIcon, MapPin,
  Sparkles, ChevronRight, PawPrint, Heart, Star, Check, Loader2,
  MessageCircle, Send, X, Milestone, Package
} from 'lucide-react';

// Celebration Types - Rover-style tiles
const CELEBRATION_TYPES = [
  { id: 'birthday', name: 'Birthdays', icon: Cake, emoji: '🎂', color: 'from-pink-500 to-rose-500', description: 'Plan a paw-fect birthday party' },
  { id: 'gotcha_day', name: 'Gotcha Days', icon: Heart, emoji: '🐾', color: 'from-purple-500 to-violet-500', description: 'Celebrate adoption anniversaries' },
  { id: 'milestone', name: 'Milestones', icon: Star, emoji: '🌱', color: 'from-emerald-500 to-teal-500', description: 'First walk, 1 year, 100 treats...' },
  { id: 'surprise', name: 'Surprise Deliveries', icon: Gift, emoji: '🎁', color: 'from-amber-500 to-orange-500', description: 'Send surprise treats anywhere' },
  { id: 'party', name: 'Party Coordination', icon: PartyPopper, emoji: '🎉', color: 'from-blue-500 to-indigo-500', description: 'Full party planning service' },
  { id: 'photoshoot', name: 'Memory-Making', icon: Camera, emoji: '📸', color: 'from-rose-500 to-pink-500', description: 'Professional pet photoshoots' },
];

// Brand Stats
const BRAND_STATS = [
  { number: '45,000+', label: 'Dogs Celebrated' },
  { number: '75 Year', label: 'Heritage Recipes' },
  { number: 'Only', label: 'FSSAI Approved Pet Bakery' },
];

const CelebrateConcierePicker = ({ category = 'cakes', onClose }) => {
  const navigate = useNavigate();
  const { user, token, pets } = useAuth();
  
  // State
  const [selectedType, setSelectedType] = useState('birthday');
  const [city, setCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState(null);
  const [showPartyWizard, setShowPartyWizard] = useState(false);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const petsData = data.pets || [];
            setUserPets(petsData);
            
            // Auto-select first pet if only one, show selector if multiple
            if (petsData.length === 1) {
              setSelectedPet(petsData[0]);
            } else if (petsData.length > 1) {
              setShowPetSelector(true);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Handle celebration planning submission - Opens the Party Planning Wizard
  const handlePlanCelebration = async () => {
    // Require login
    if (!token) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to plan your celebration',
        variant: 'destructive'
      });
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    // Open the Party Planning Wizard modal
    setShowPartyWizard(true);
  };
  
  // If ticket was created, show success state
  if (ticketCreated) {
    return (
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Celebration Planning Started!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our Concierge® team will reach out shortly to help plan {selectedPet?.name ? `${selectedPet.name}'s` : 'your'} celebration.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => navigate('/my-account?tab=tickets')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> View Conversation
              </Button>
              <Button
                variant="outline"
                onClick={() => setTicketCreated(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <span className="text-xs sm:text-sm font-medium text-purple-700">Planning a full celebration?</span>
        </div>
        
        {/* Main Card - Mobile optimized */}
        <Card className="p-4 sm:p-6 md:p-8 border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl">
          {/* Celebration Type Tiles - Horizontal scroll on mobile */}
          <div className="mb-4 sm:mb-6">
            <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 block">
              What are we celebrating?
            </Label>
            {/* Mobile: Horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:hidden">
              {CELEBRATION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`relative flex-shrink-0 p-3 rounded-xl border-2 transition-all text-center w-[80px] ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 active:bg-gray-50'
                    }`}
                    data-testid={`celebration-type-${type.id}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className="text-xl mb-0.5">{type.emoji}</div>
                    <h4 className="font-medium text-[10px] text-gray-900 leading-tight">{type.name}</h4>
                  </button>
                );
              })}
            </div>
            {/* Desktop: Grid */}
            <div className="hidden sm:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
              {CELEBRATION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                    data-testid={`celebration-type-${type.id}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">{type.emoji}</div>
                    <h4 className="font-semibold text-sm text-gray-900">{type.name}</h4>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Input Row + CTA - Stack on mobile */}
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end">
            {/* Pet Selector (if multiple pets) */}
            {userPets.length > 1 && (
              <div className="w-full sm:flex-1 sm:min-w-[180px]">
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                  <PawPrint className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Which pet?
                </Label>
                <Select value={selectedPet?.id || 'all'} onValueChange={(id) => {
                  if (id === 'all') {
                    setSelectedPet(null);
                  } else {
                    setSelectedPet(userPets.find(p => p.id === id));
                  }
                }}>
                  <SelectTrigger className="h-10 sm:h-12 text-sm" data-testid="pet-selector">
                    <SelectValue placeholder="Select pet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <PawPrint className="w-3 h-3 sm:w-4 sm:h-4" />
                        🐾 All My Pets ({userPets.length})
                      </span>
                    </SelectItem>
                    {userPets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <span className="flex items-center gap-2">
                          {pet.photo_url ? (
                            <img src={getPetPhotoUrl(pet)} alt={pet.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover" />
                          ) : (
                            <PawPrint className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          {pet.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* City and Date Row - Side by side on mobile */}
            <div className="flex gap-2 sm:gap-4 w-full sm:flex-1">
              {/* City Input */}
              <div className="flex-1">
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Where?
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="h-10 sm:h-12 text-sm"
                  data-testid="city-input"
                />
              </div>
              
              {/* Date Picker */}
              <div className="flex-1">
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> When?
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-10 sm:h-12 justify-start text-left font-normal text-sm ${
                        !selectedDate && 'text-muted-foreground'
                      }`}
                      data-testid="date-picker"
                    >
                    {selectedDate ? format(selectedDate, 'MMM d') : 'Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              </div>
            </div>
            
            {/* CTA Button - Full width on mobile */}
            <Button
              onClick={handlePlanCelebration}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm sm:text-base whitespace-nowrap"
              data-testid="plan-celebration-btn"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Plan Celebration
                </>
              )}
            </Button>
          </div>
          
          {/* Brand Stats - Compact on mobile */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-purple-100 flex justify-center gap-4 sm:gap-6 md:gap-10">
            {BRAND_STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-sm sm:text-lg md:text-xl font-bold text-purple-600">{stat.number}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Helper Text */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
          Don&apos;t need planning help? Just scroll down to shop! 🛒
        </p>
      </div>
      
      {/* Party Planning Wizard Modal */}
      {showPartyWizard && (
        <PartyPlanningWizard 
          onClose={() => setShowPartyWizard(false)}
          onComplete={(data) => {
            toast({
              title: '🎉 Party plan submitted!',
              description: 'Our concierge will be in touch shortly.'
            });
            setShowPartyWizard(false);
          }}
        />
      )}
    </div>
  );
};

export default CelebrateConcierePicker;
