/**
 * PartyPlanningWizard.jsx
 * 
 * Step-by-step party planning wizard for THE DOGGY COMPANY.
 * Dogs Only - Multi-pet family support with auto-populate from profile.
 * 
 * Flow: User Intent → Service Desk Ticket → Admin Notification → Member Notification
 * Cross-pillar suggestions: Cakes, Decorations, Venue, Grooming, Photography
 */

import React, { useState, useEffect } from 'react';
import { 
  PartyPopper, Cake, Gift, Calendar, Users, MapPin, 
  Sparkles, ChevronRight, ChevronLeft, Check, Dog,
  Camera, Scissors, Music, Star, Heart, Package, X, Bell
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

// Pawmeter display component
const PawmeterDisplay = ({ pawmeter, size = 'sm' }) => {
  if (!pawmeter || !pawmeter.overall) return null;
  
  const score = pawmeter.overall;
  const stars = Math.round(score);
  
  return (
    <div className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className="text-amber-500 font-medium">🐾 {score.toFixed(1)}</span>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
              i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`} 
          />
        ))}
      </div>
    </div>
  );
};

// Occasions with cross-pillar suggestions
const OCCASIONS = [
  { 
    id: 'birthday', 
    name: 'Birthday Party', 
    icon: Cake, 
    color: 'bg-pink-100 text-pink-600',
    suggestions: ['cake', 'decorations', 'grooming', 'photography', 'treats']
  },
  { 
    id: 'gotcha-day', 
    name: 'Gotcha Day', 
    icon: Heart, 
    color: 'bg-red-100 text-red-600',
    suggestions: ['cake', 'treats', 'toys', 'photography']
  },
  { 
    id: 'graduation', 
    name: 'Training Graduation', 
    icon: Star, 
    color: 'bg-yellow-100 text-yellow-600',
    suggestions: ['treats', 'certificate', 'toys']
  },
  { 
    id: 'new-year', 
    name: 'New Year Party', 
    icon: Sparkles, 
    color: 'bg-purple-100 text-purple-600',
    suggestions: ['treats', 'decorations', 'outfits']
  },
  { 
    id: 'pawliday', 
    name: 'Pawliday Celebration', 
    icon: Gift, 
    color: 'bg-green-100 text-green-600',
    suggestions: ['hamper', 'treats', 'toys', 'outfits']
  },
  { 
    id: 'custom', 
    name: 'Custom Event', 
    icon: PartyPopper, 
    color: 'bg-blue-100 text-blue-600',
    suggestions: ['cake', 'treats', 'decorations']
  }
];

const BUDGET_RANGES = [
  { id: 'budget', name: 'Budget Friendly', range: '₹500 - ₹1,500', value: 1000 },
  { id: 'standard', name: 'Standard', range: '₹1,500 - ₹3,500', value: 2500 },
  { id: 'premium', name: 'Premium', range: '₹3,500 - ₹7,000', value: 5000 },
  { id: 'luxury', name: 'Luxury', range: '₹7,000+', value: 10000 }
];

const STEPS = [
  { id: 1, name: 'Pet', icon: Dog },
  { id: 2, name: 'Occasion', icon: PartyPopper },
  { id: 3, name: 'Date', icon: Calendar },
  { id: 4, name: 'Details', icon: Users },
  { id: 5, name: 'Budget', icon: Gift },
  { id: 6, name: 'Review', icon: Check }
];

const PartyPlanningWizard = ({ onClose, onComplete }) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Form state - Dogs only (The Doggy Company)
  const [formData, setFormData] = useState({
    petId: '',
    petName: '',
    petType: 'dog', // Always dog - The Doggy Company
    petBreed: '',
    petAge: '',
    occasion: '',
    date: '',
    time: '',
    guestCount: '5-10',
    venue: 'home',
    budget: 'standard',
    specialRequests: '',
    includeGrooming: false,
    includePhotography: false,
    includeVenue: false
  });
  
  // Fetch user's pets (dogs only)
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPets(data.pets || []);
          if (data.pets?.length === 1) {
            setFormData(prev => ({
              ...prev,
              petId: data.pets[0].id,
              petName: data.pets[0].name,
              petType: data.pets[0].species || 'dog'
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching pets:', err);
      }
    };
    fetchPets();
  }, [token]);
  
  // Fetch recommendations based on occasion and budget
  useEffect(() => {
    if (step === 6 && formData.occasion && formData.budget) {
      fetchRecommendations();
    }
  }, [step, formData.occasion, formData.budget]);
  
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Get products for celebrate pillar
      const res = await fetch(`${API_URL}/api/products?pillar=celebrate&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const products = data.products || [];
        
        // Filter by budget
        const budgetValue = BUDGET_RANGES.find(b => b.id === formData.budget)?.value || 2500;
        const filtered = products.filter(p => p.price <= budgetValue * 2);
        
        // Sort by pawmeter score (higher first)
        filtered.sort((a, b) => {
          const scoreA = a.pawmeter?.overall || 0;
          const scoreB = b.pawmeter?.overall || 0;
          return scoreB - scoreA;
        });
        
        setRecommendations(filtered.slice(0, 8));
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    if (step < 6) setStep(step + 1);
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create party planning request - goes to Service Desk + Notifications
      const res = await fetch(`${API_URL}/api/celebrate/party-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          user_email: user?.email,
          user_name: user?.name || 'Guest'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Show success with ticket ID
        toast.success(
          `🎉 Party request submitted! Reference: ${data.ticket_id}. Our Celebrate Concierge® will contact you within 2 hours with a full party plan and quote!`,
          { duration: 8000 }
        );
        onComplete?.(data);
        onClose?.();
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const addRecommendationToCart = (product) => {
    addToCart({
      id: product.id,
      title: product.name || product.title,
      price: product.price,
      image: product.image || product.images?.[0],
      quantity: 1
    });
    toast.success(`Added ${product.name} to cart!`);
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1: // Pet Selection
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Who&apos;s the star of the party?</h3>
            <p className="text-sm text-gray-500">Select your furry family member</p>
            
            {pets.length > 0 ? (
              <div className="space-y-3">
                {/* Multi-pet family - show all dogs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pets.filter(p => p.species !== 'cat').map(pet => (
                    <Card 
                      key={pet.id}
                      className={`p-4 cursor-pointer transition-all ${
                        formData.petId === pet.id 
                          ? 'ring-2 ring-amber-500 bg-amber-50' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        petId: pet.id,
                        petName: pet.name,
                        petType: 'dog',
                        petBreed: pet.breed,
                        petAge: pet.age
                      }))}
                      data-testid={`pet-select-${pet.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          {pet.image ? (
                            <img src={pet.image} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Dog className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{pet.name}</p>
                          <p className="text-xs text-gray-500">{pet.breed || 'Good Boy/Girl'}</p>
                          {pet.age && <p className="text-xs text-amber-600">{pet.age} years old</p>}
                        </div>
                        {formData.petId === pet.id && (
                          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Add new pet option */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => setPets([])}
                >
                  <Dog className="w-4 h-4 mr-2" />
                  Add a different pup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  🐕 Don&apos;t worry! Tell us about your pup and we&apos;ll make their day special!
                </p>
                <Input
                  placeholder="Your Dog's Name"
                  value={formData.petName}
                  onChange={(e) => setFormData(prev => ({ ...prev, petName: e.target.value }))}
                  className="h-12"
                  data-testid="pet-name-input"
                />
                <Input
                  placeholder="Breed (optional)"
                  value={formData.petBreed || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, petBreed: e.target.value }))}
                  className="h-12"
                />
                {/* Dogs only - The Doggy Company */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                  <Dog className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">The Doggy Company - Making every pup&apos;s day special!</span>
                </div>
              </div>
            )}
          </div>
        );
        
      case 2: // Occasion Selection
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">What are we celebrating?</h3>
            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map(occasion => {
                const Icon = occasion.icon;
                return (
                  <Card 
                    key={occasion.id}
                    className={`p-4 cursor-pointer transition-all ${
                      formData.occasion === occasion.id 
                        ? 'ring-2 ring-pink-500 bg-pink-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, occasion: occasion.id }))}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`p-3 rounded-full ${occasion.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-sm">{occasion.name}</p>
                      {formData.occasion === occasion.id && (
                        <Check className="w-4 h-4 text-pink-500" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
        
      case 3: // Date & Time
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">When&apos;s the pawty?</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Preferred Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Morning', 'Afternoon', 'Evening'].map(time => (
                    <Button
                      key={time}
                      variant={formData.time === time ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, time }))}
                      className="text-sm"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4: // Guest Details
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Party Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">How many guests? (humans + pups)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1-5', '5-10', '10-20', '20+'].map(count => (
                    <Button
                      key={count}
                      variant={formData.guestCount === count ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, guestCount: count }))}
                    >
                      <Users className="w-4 h-4 mr-2" /> {count}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Venue</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'home', name: 'At Home', icon: '🏠' },
                    { id: 'outdoor', name: 'Park/Outdoor', icon: '🌳' },
                    { id: 'cafe', name: 'Pet Café', icon: '☕' },
                    { id: 'venue', name: 'Party Venue', icon: '🎪' }
                  ].map(v => (
                    <Button
                      key={v.id}
                      variant={formData.venue === v.id ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, venue: v.id }))}
                    >
                      {v.icon} {v.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Cross-pillar add-ons */}
              <div className="pt-2 border-t">
                <label className="text-sm text-gray-600 mb-2 block">Add-on Services</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeGrooming}
                      onChange={(e) => setFormData(prev => ({ ...prev, includeGrooming: e.target.checked }))}
                      className="w-4 h-4 text-pink-500"
                    />
                    <Scissors className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">Pre-party Grooming</p>
                      <p className="text-xs text-gray-500">Look fabulous for photos!</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includePhotography}
                      onChange={(e) => setFormData(prev => ({ ...prev, includePhotography: e.target.checked }))}
                      className="w-4 h-4 text-pink-500"
                    />
                    <Camera className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Pet Photography</p>
                      <p className="text-xs text-gray-500">Capture the memories</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 5: // Budget
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">What&apos;s your budget?</h3>
            <div className="space-y-3">
              {BUDGET_RANGES.map(budget => (
                <Card 
                  key={budget.id}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.budget === budget.id 
                      ? 'ring-2 ring-pink-500 bg-pink-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, budget: budget.id }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{budget.name}</p>
                      <p className="text-sm text-gray-500">{budget.range}</p>
                    </div>
                    {formData.budget === budget.id && (
                      <Check className="w-5 h-5 text-pink-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="pt-4">
              <label className="text-sm text-gray-600 mb-2 block">Any special requests?</label>
              <Textarea
                placeholder="Allergies, theme preferences, dietary restrictions..."
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );
        
      case 6: // Review & Submit Request
        const selectedOccasion = OCCASIONS.find(o => o.id === formData.occasion);
        const selectedBudget = BUDGET_RANGES.find(b => b.id === formData.budget);
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Your Party Request</h3>
            
            {/* Summary Card */}
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <Dog className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">{formData.petName}&apos;s {selectedOccasion?.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">📅 Date & Time</span>
                  <span className="font-medium">{formData.date} ({formData.time})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">👥 Guests</span>
                  <span className="font-medium">{formData.guestCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">📍 Venue</span>
                  <span className="font-medium capitalize">{formData.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">💰 Budget</span>
                  <span className="font-medium">{selectedBudget?.range}</span>
                </div>
                
                {/* Add-ons */}
                {(formData.includeGrooming || formData.includePhotography) && (
                  <div className="pt-2 mt-2 border-t border-amber-200">
                    <p className="text-xs text-gray-500 mb-1">Add-on Services:</p>
                    {formData.includeGrooming && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Scissors className="w-4 h-4" />
                        <span className="text-sm">Pre-party Grooming</span>
                      </div>
                    )}
                    {formData.includePhotography && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Camera className="w-4 h-4" />
                        <span className="text-sm">Pet Photography</span>
                      </div>
                    )}
                  </div>
                )}
                
                {formData.specialRequests && (
                  <div className="pt-2 mt-2 border-t border-amber-200">
                    <p className="text-xs text-gray-500">Special Requests:</p>
                    <p className="text-sm italic">{formData.specialRequests}</p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* What happens next */}
            <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                What happens next?
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Request Received</p>
                    <p className="text-gray-500">Your party request goes to our Celebrate Concierge® team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Custom Party Plan</p>
                    <p className="text-gray-500">We&apos;ll curate the perfect cake, treats, decorations & services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Quote & Confirmation</p>
                    <p className="text-gray-500">Review our proposal and pay when you&apos;re happy!</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-pink-200">
                <p className="text-sm text-center text-gray-600">
                  <Bell className="w-4 h-4 inline mr-1 text-pink-500" />
                  Our Celebrate Concierge® will contact you within <strong>2 hours</strong> with a full party plan and quote!
                </p>
              </div>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return formData.petName;
      case 2: return formData.occasion;
      case 3: return formData.date && formData.time;
      case 4: return formData.guestCount && formData.venue;
      case 5: return formData.budget;
      case 6: return true;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-white">
        {/* Header - The Doggy Company branded */}
        <div className="p-4 border-b bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-6 h-6" />
              <h2 className="font-bold text-lg">Party Planning Wizard</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mt-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-white text-amber-500' :
                    isComplete ? 'bg-white/80 text-green-500' :
                    'bg-white/20 text-white/60'
                  }`}>
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs mt-1 opacity-80">{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          
          {step < 6 ? (
            <Button 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              data-testid="submit-party-request-btn"
            >
              {loading ? 'Submitting Request...' : '🎉 Submit Party Request'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PartyPlanningWizard;
