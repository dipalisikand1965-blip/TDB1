/**
 * DiningConciergePicker.jsx
 * Rover-style dining concierge widget for the Dine pillar
 * Intercepts dining planners and creates Service Desk tickets
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import { format } from 'date-fns';
import {
  Utensils, ChefHat, Home, Truck, Users, Calendar as CalendarIcon,
  Sparkles, ChevronRight, PawPrint, Star, Check, Loader2,
  MessageCircle, MapPin, Clock, Phone, Wine, Cake
} from 'lucide-react';

// Dining Service Types
const DINING_SERVICES = [
  { 
    id: 'chefs_table', 
    name: "Chef's Table", 
    icon: ChefHat, 
    emoji: '👨‍🍳', 
    color: 'from-amber-500 to-orange-500', 
    description: 'Private chef experience at pet-friendly restaurants' 
  },
  { 
    id: 'private_dining', 
    name: 'Private Home Dining', 
    icon: Home, 
    emoji: '🏠', 
    color: 'from-emerald-500 to-teal-500', 
    description: 'Chef comes to your home with pet-safe menu' 
  },
  { 
    id: 'catering', 
    name: 'Pet Party Catering', 
    icon: Cake, 
    emoji: '🎂', 
    color: 'from-pink-500 to-rose-500', 
    description: 'Catering for pet birthdays & special events' 
  },
  { 
    id: 'restaurant_booking', 
    name: 'Restaurant Reservations', 
    icon: Utensils, 
    emoji: '🍽️', 
    color: 'from-violet-500 to-purple-500', 
    description: 'Book pet-friendly restaurant tables' 
  },
  { 
    id: 'meal_subscription', 
    name: 'Meal Subscriptions', 
    icon: Truck, 
    emoji: '📦', 
    color: 'from-blue-500 to-indigo-500', 
    description: 'Fresh pet meals delivered regularly' 
  },
  { 
    id: 'group_dining', 
    name: 'Group Dining Events', 
    icon: Users, 
    emoji: '🐕‍🦺', 
    color: 'from-cyan-500 to-sky-500', 
    description: 'Organize pet parent meetups & dining events' 
  },
];

// Available cities
const CITIES = [
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi NCR' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'pune', label: 'Pune' },
];

// Guest count options
const GUEST_COUNTS = [
  { value: '1-2', label: '1-2 guests' },
  { value: '3-5', label: '3-5 guests' },
  { value: '6-10', label: '6-10 guests' },
  { value: '10+', label: '10+ guests' },
];

const DiningConciergePicker = ({ onClose, compactMode = true }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // State
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedService, setSelectedService] = useState('restaurant_booking');
  const [city, setCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Handle opening form modal with selected service
  const handleServiceClick = (serviceId) => {
    setSelectedService(serviceId);
    setShowFormModal(true);
  };
  
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
            
            if (petsData.length === 1) {
              setSelectedPet(petsData[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Handle dining request submission
  const handleSubmitRequest = async () => {
    if (!token) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit a dining request',
        variant: 'destructive'
      });
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const serviceType = DINING_SERVICES.find(s => s.id === selectedService);
      
      // Build description
      const description = `${serviceType.emoji} ${serviceType.name}

**Service Requested:** ${serviceType.name}
**Location:** ${city || 'Not specified'}
**Date:** ${selectedDate ? format(selectedDate, 'PPP') : 'Flexible'}
**Time:** ${selectedTime || 'Flexible'}
**Number of Guests:** ${guestCount || 'Not specified'}
**Pet Attending:** ${selectedPet?.name || 'Not specified'} ${selectedPet?.breed ? `(${selectedPet.breed})` : ''}

**Special Requests/Notes:**
${specialRequests || 'None'}

---
Submitted via Dining Concierge on the Dine pillar page.`;

      // Create a Service Desk ticket
      const ticketData = {
        member: {
          name: user?.name || 'Member',
          email: user?.email || '',
          whatsapp: user?.phone || user?.whatsapp || '',
          city: city || ''
        },
        category: 'dine',
        sub_category: selectedService,
        urgency: selectedService === 'chefs_table' || selectedService === 'private_dining' ? 'high' : 'medium',
        description: description,
        source: 'web',
        attachments: [],
        pet_info: selectedPet ? {
          id: selectedPet.id,
          name: selectedPet.name,
          breed: selectedPet.breed
        } : null
      };
      
      const response = await fetch(`${API_URL}/api/tickets/`, {
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
          title: '🍽️ Dining request submitted!',
          description: `Our Concierge® team will reach out shortly to confirm your ${serviceType.name.toLowerCase()}.`
        });
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating dining ticket:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or contact us directly.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Success state
  if (ticketCreated) {
    const serviceType = DINING_SERVICES.find(s => s.id === selectedService);
    return (
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center border-2 border-amber-200 bg-white/80 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🍽️ Dining Request Submitted!
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Our Concierge® team will reach out shortly to arrange your {serviceType?.name.toLowerCase()}.
            </p>
            <div className="bg-amber-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
              <p className="text-sm text-amber-800">
                <strong>Ticket ID:</strong> {createdTicketId}
              </p>
              {selectedDate && (
                <p className="text-sm text-amber-800">
                  <strong>Requested Date:</strong> {format(selectedDate, 'PPP')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => navigate('/my-account?tab=tickets')}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> View Conversation
              </Button>
              <Button
                variant="outline"
                onClick={() => setTicketCreated(false)}
              >
                Make Another Request
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  // Full View (inline form - used when compactMode is false)
  const FullView = (
    <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 py-8 px-4" data-testid="dining-concierge-picker">
      <div className="max-w-5xl mx-auto">
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Planning a dining experience?</span>
          <span className="text-xs text-amber-500">Let our Concierge® help!</span>
        </div>
        
        {/* Main Card */}
        <Card className="p-6 md:p-8 border-2 border-amber-200 bg-white/80 backdrop-blur-sm shadow-xl">
          {/* Service Type Tiles */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              What dining experience are you looking for?
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DINING_SERVICES.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                    data-testid={`dining-service-${service.id}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">{service.emoji}</div>
                    <h4 className="font-semibold text-xs text-gray-900 line-clamp-2">{service.name}</h4>
                  </button>
                );
              })}
            </div>
            {/* Service Description */}
            <p className="mt-3 text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
              {DINING_SERVICES.find(s => s.id === selectedService)?.description}
            </p>
          </div>
          
          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* City */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <MapPin className="w-4 h-4 inline mr-1" /> City
              </Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Guest Count */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <Users className="w-4 h-4 inline mr-1" /> Number of Guests
              </Label>
              <Select value={guestCount} onValueChange={setGuestCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guest count" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_COUNTS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <CalendarIcon className="w-4 h-4 inline mr-1" /> Preferred Date
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Time */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <Clock className="w-4 h-4 inline mr-1" /> Preferred Time
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast (8 AM - 11 AM)</SelectItem>
                  <SelectItem value="lunch">Lunch (12 PM - 3 PM)</SelectItem>
                  <SelectItem value="evening">Evening (4 PM - 7 PM)</SelectItem>
                  <SelectItem value="dinner">Dinner (7 PM - 10 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Pet Selection */}
          {userPets.length > 0 && (
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <PawPrint className="w-4 h-4 inline mr-1" /> Which pet is joining?
              </Label>
              <div className="flex flex-wrap gap-2">
                {userPets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                      selectedPet?.id === pet.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <span>🐕</span>
                    <span className="font-medium text-sm">{pet.name}</span>
                    {pet.breed && <span className="text-xs text-gray-500">({pet.breed})</span>}
                    {selectedPet?.id === pet.id && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Requests */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Special Requests or Notes
            </Label>
            <textarea
              placeholder="E.g., dietary restrictions, preferred cuisine, special occasion..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4" />
              <span>Or call us: <strong>+91 98765 43210</strong></span>
            </div>
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-8"
              data-testid="submit-dining-request"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 mr-2" /> Submit Request
                </>
              )}
            </Button>
          </div>
        </Card>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span>50+ Partner Restaurants</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <PawPrint className="w-5 h-5" />
            <span>Pet-Friendly Verified</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <ChefHat className="w-5 h-5" />
            <span>Professional Chefs</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Full form content (used in modal or inline)
  const fullFormContent = (
    <div className="p-6" data-testid="dining-form-content">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${DINING_SERVICES.find(s => s.id === selectedService)?.color || 'from-amber-500 to-orange-500'} flex items-center justify-center text-2xl shadow-md`}>
            {DINING_SERVICES.find(s => s.id === selectedService)?.emoji}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{DINING_SERVICES.find(s => s.id === selectedService)?.name}</h3>
            <p className="text-xs text-gray-500">{DINING_SERVICES.find(s => s.id === selectedService)?.description}</p>
          </div>
        </div>
        {showFormModal && (
          <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">&times;</span>
          </button>
        )}
      </div>
      
      {/* Form Fields */}
      <div className="space-y-4">
        {/* City */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            <MapPin className="w-4 h-4 inline mr-1" /> City
          </Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <CalendarIcon className="w-4 h-4 inline mr-1" /> Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <Clock className="w-4 h-4 inline mr-1" /> Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {['11:00 AM', '12:00 PM', '1:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Guests */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            <Users className="w-4 h-4 inline mr-1" /> Number of Guests
          </Label>
          <Select value={guestCount} onValueChange={setGuestCount}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GUEST_COUNTS.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Pet Selection */}
        {userPets.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <PawPrint className="w-4 h-4 inline mr-1" /> Select Pet
            </Label>
            <Select value={selectedPet?.id || ''} onValueChange={(id) => setSelectedPet(userPets.find(p => p.id === id))}>
              <SelectTrigger>
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                {userPets.map(pet => (
                  <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Special Requests */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Special Requests
          </Label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            rows={3}
            placeholder="Any dietary restrictions, allergies, preferences..."
          />
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        onClick={handleSubmitRequest}
        disabled={isSubmitting || !city}
        className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" /> Submit Request</>
        )}
      </Button>
    </div>
  );
  
  // Return compact mode view by default
  if (compactMode) {
    return (
      <div className="py-8 px-4" data-testid="dining-concierge-picker-compact">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Need Dining Help?</span>
            </div>
            <p className="text-xs text-gray-500">Click a service to start a conversation with our Concierge®</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {DINING_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className="group p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg bg-white transition-all text-center"
                data-testid={`dining-service-compact-${service.id}`}
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                  {service.emoji}
                </div>
                <h4 className="font-semibold text-xs text-gray-900 mb-1">{service.name}</h4>
                <p className="text-[10px] text-gray-500 line-clamp-2">{service.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFormModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {fullFormContent}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return FullView;
};

export default DiningConciergePicker;
