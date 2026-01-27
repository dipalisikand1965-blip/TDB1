/**
 * CelebrateConcierePicker.jsx
 * Rover-style celebration planner widget
 * Intercepts celebration planners before they browse products
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
  
  // Handle celebration planning submission
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
    
    // If multiple pets and none selected, show selector
    if (userPets.length > 1 && !selectedPet) {
      setShowPetSelector(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const celebrationType = CELEBRATION_TYPES.find(t => t.id === selectedType);
      
      // Create a Service Desk ticket (format expected by backend TicketCreate model)
      const ticketData = {
        member: {
          name: user?.name || 'Member',
          email: user?.email || '',
          phone: user?.phone || '',
          city: city || ''
        },
        category: 'celebrate',
        sub_category: selectedType,
        urgency: 'medium',
        description: `${celebrationType.emoji} ${celebrationType.name} - ${selectedPet?.name || 'New Pet'}\n\nCelebration planning started from ${category} page.\n\nType: ${celebrationType.name}\nLocation: ${city || 'Not specified'}\nDate: ${selectedDate ? format(selectedDate, 'PPP') : 'Flexible'}\nPet: ${selectedPet?.name || 'Not specified'}`,
        source: 'web',
        attachments: []
      };
      
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (response.ok) {
        const ticket = await response.json();
        setCreatedTicketId(ticket.id || ticket.ticket_id);
        setTicketCreated(true);
        
        toast({
          title: '🎉 Celebration planning started!',
          description: `We've created a ticket for ${selectedPet?.name || 'your'}'s ${celebrationType.name.toLowerCase()}. Our concierge will reach out soon!`
        });
        
        // Navigate to Service Desk view (or keep browsing)
        // For now, show success state
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating celebration ticket:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact us directly.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Planning a full celebration?</span>
        </div>
        
        {/* Main Card - Rover Style */}
        <Card className="p-6 md:p-8 border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl">
          {/* Celebration Type Tiles */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              What are we celebrating?
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
          
          {/* Input Row + CTA */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Pet Selector (if multiple pets) */}
            {userPets.length > 1 && (
              <div className="flex-1 min-w-[180px]">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  <PawPrint className="w-4 h-4 inline mr-1" /> Which pet?
                </Label>
                <Select value={selectedPet?.id || ''} onValueChange={(id) => setSelectedPet(userPets.find(p => p.id === id))}>
                  <SelectTrigger className="h-12" data-testid="pet-selector">
                    <SelectValue placeholder="Select pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <span className="flex items-center gap-2">
                          {pet.photo_url ? (
                            <img src={getPetPhotoUrl(pet)} alt={pet.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <PawPrint className="w-4 h-4" />
                          )}
                          {pet.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* City Input */}
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <MapPin className="w-4 h-4 inline mr-1" /> Where?
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City / Area"
                className="h-12"
                data-testid="city-input"
              />
            </div>
            
            {/* Date Picker */}
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <CalendarIcon className="w-4 h-4 inline mr-1" /> When?
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full h-12 justify-start text-left font-normal ${
                      !selectedDate && 'text-muted-foreground'
                    }`}
                    data-testid="date-picker"
                  >
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date (optional)'}
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
            
            {/* CTA Button */}
            <Button
              onClick={handlePlanCelebration}
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold whitespace-nowrap"
              data-testid="plan-celebration-btn"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Plan the Celebration
                </>
              )}
            </Button>
          </div>
          
          {/* Brand Stats */}
          <div className="mt-6 pt-6 border-t border-purple-100 flex flex-wrap justify-center gap-6 md:gap-10">
            {BRAND_STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-lg md:text-xl font-bold text-purple-600">{stat.number}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Helper Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't need planning help? Just scroll down to shop! 🛒
        </p>
      </div>
    </div>
  );
};

export default CelebrateConcierePicker;
