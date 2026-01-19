import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import {
  Car, Train, Plane, Truck, MapPin, Calendar, Clock, Dog, PawPrint,
  Shield, Heart, CheckCircle, AlertTriangle, MessageCircle, Phone,
  ChevronRight, Sparkles, Package, Star, Loader2, Info, Send,
  Navigation, Route, Briefcase, Home, ArrowRight, Users, Scale
} from 'lucide-react';

// Travel Types Configuration
const TRAVEL_TYPES = {
  cab: {
    id: 'cab',
    name: 'Cab / Road Travel',
    icon: Car,
    description: 'Vet visits, grooming, short trips, intercity drives',
    color: 'from-blue-500 to-cyan-500',
    examples: ['Vet appointment', 'Grooming salon', 'Day trip', 'Airport transfer']
  },
  train: {
    id: 'train',
    name: 'Train / Bus Travel',
    icon: Train,
    description: 'Medium-distance domestic travel',
    color: 'from-green-500 to-emerald-500',
    examples: ['Weekend getaway', 'Family visit', 'City hopping']
  },
  flight: {
    id: 'flight',
    name: 'Flight (Domestic)',
    icon: Plane,
    description: 'Air travel within India - high care required',
    color: 'from-purple-500 to-violet-500',
    examples: ['Vacation', 'Relocation', 'Family emergency']
  },
  relocation: {
    id: 'relocation',
    name: 'Pet Relocation',
    icon: Truck,
    description: 'Full service city-to-city moves - premium concierge',
    color: 'from-amber-500 to-orange-500',
    examples: ['Job transfer', 'Permanent move', 'Long-term relocation']
  }
};

// Travel Request Status
const REQUEST_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  reviewing: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  coordinating: { label: 'Coordinating', color: 'bg-purple-100 text-purple-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
};

// Pet Profile Card Component
const PetProfileCard = ({ pet, onSelect, selected }) => (
  <Card 
    className={`p-4 cursor-pointer transition-all ${
      selected ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
    }`}
    onClick={() => onSelect(pet)}
  >
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <PawPrint className="w-6 h-6 text-purple-500" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{pet.name}</h4>
        <p className="text-sm text-gray-500">{pet.breed} • {pet.age || 'Age unknown'}</p>
        {pet.soul?.travel_comfort && (
          <Badge variant="outline" className="mt-1 text-xs">
            {pet.soul.travel_comfort === 'loves_it' ? '✈️ Loves Travel' : 
             pet.soul.travel_comfort === 'nervous' ? '😰 Gets Nervous' : '🚗 Okay with Travel'}
          </Badge>
        )}
      </div>
      {selected && <CheckCircle className="w-5 h-5 text-purple-600" />}
    </div>
  </Card>
);

// Travel Type Card Component
const TravelTypeCard = ({ type, onSelect, disabled }) => {
  const Icon = type.icon;
  return (
    <Card 
      className={`p-5 cursor-pointer transition-all hover:shadow-lg ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={() => !disabled && onSelect(type.id)}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
      <p className="text-sm text-gray-500 mb-3">{type.description}</p>
      <div className="flex flex-wrap gap-1">
        {type.examples.slice(0, 2).map((ex, i) => (
          <Badge key={i} variant="outline" className="text-xs">{ex}</Badge>
        ))}
      </div>
    </Card>
  );
};

// Travel Request Form Component
const TravelRequestForm = ({ travelType, pet, onSubmit, onBack, loading }) => {
  const [formData, setFormData] = useState({
    pickup_location: '',
    pickup_city: '',
    drop_location: '',
    drop_city: '',
    travel_date: '',
    travel_time: '',
    return_date: '',
    is_round_trip: false,
    special_requirements: '',
    // From pet profile (auto-populated)
    pet_size: pet?.soul?.size || '',
    pet_weight: pet?.soul?.weight || '',
    crate_trained: pet?.soul?.crate_trained || null,
    travel_anxiety: pet?.soul?.travel_anxiety || null,
    motion_sickness: pet?.soul?.motion_sickness || false,
    // Additional questions if missing
    additional_notes: ''
  });

  const typeConfig = TRAVEL_TYPES[travelType];
  const Icon = typeConfig?.icon || Car;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Check what info is missing from pet profile
  const missingInfo = [];
  if (!pet?.soul?.size) missingInfo.push('size');
  if (!pet?.soul?.weight && (travelType === 'flight' || travelType === 'relocation')) missingInfo.push('weight');
  if (pet?.soul?.crate_trained === null && travelType === 'flight') missingInfo.push('crate_training');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${typeConfig?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{typeConfig?.name || 'Travel Request'}</h2>
          <p className="text-sm text-gray-500">Traveling with {pet?.name}</p>
        </div>
      </div>

      {/* Pet Profile Summary (Auto-populated) */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <PawPrint className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-purple-900">Pet Profile (Auto-filled)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Size:</span>
            <span className="ml-1 font-medium">{pet?.soul?.size || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500">Weight:</span>
            <span className="ml-1 font-medium">{pet?.soul?.weight ? `${pet.soul.weight} kg` : 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500">Crate Trained:</span>
            <span className="ml-1 font-medium">{pet?.soul?.crate_trained ? 'Yes' : pet?.soul?.crate_trained === false ? 'No' : 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500">Travel Comfort:</span>
            <span className="ml-1 font-medium">{pet?.soul?.travel_comfort || 'Unknown'}</span>
          </div>
        </div>
      </Card>

      {/* Missing Info Alert */}
      {missingInfo.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">A few details needed</p>
              <p className="text-sm text-amber-700">We'll ask about: {missingInfo.join(', ')}. This helps ensure {pet?.name}'s safety.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Location Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Pickup Location</Label>
          <Input
            value={formData.pickup_location}
            onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
            placeholder="Address or landmark"
            required
          />
        </div>
        <div>
          <Label>Pickup City</Label>
          <Input
            value={formData.pickup_city}
            onChange={(e) => setFormData({...formData, pickup_city: e.target.value})}
            placeholder="City"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Drop Location</Label>
          <Input
            value={formData.drop_location}
            onChange={(e) => setFormData({...formData, drop_location: e.target.value})}
            placeholder="Destination address"
            required
          />
        </div>
        <div>
          <Label>Drop City</Label>
          <Input
            value={formData.drop_city}
            onChange={(e) => setFormData({...formData, drop_city: e.target.value})}
            placeholder="Destination city"
            required
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Travel Date</Label>
          <Input
            type="date"
            value={formData.travel_date}
            onChange={(e) => setFormData({...formData, travel_date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <Label>Preferred Time</Label>
          <select
            value={formData.travel_time}
            onChange={(e) => setFormData({...formData, travel_time: e.target.value})}
            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select time</option>
            {Array.from({ length: 48 }, (_, i) => {
              const hours = Math.floor(i / 2);
              const minutes = i % 2 === 0 ? '00' : '30';
              const time24 = `${hours.toString().padStart(2, '0')}:${minutes}`;
              const period = hours < 12 ? 'AM' : 'PM';
              const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
              const displayTime = `${displayHours}:${minutes} ${period}`;
              return (
                <option key={time24} value={time24}>{displayTime}</option>
              );
            })}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_round_trip}
              onChange={(e) => setFormData({...formData, is_round_trip: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm">Round Trip</span>
          </label>
        </div>
      </div>

      {formData.is_round_trip && (
        <div className="w-1/3">
          <Label>Return Date</Label>
          <Input
            type="date"
            value={formData.return_date}
            onChange={(e) => setFormData({...formData, return_date: e.target.value})}
            min={formData.travel_date || new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      {/* Missing Info Questions */}
      {missingInfo.includes('weight') && (
        <div>
          <Label>{pet?.name}'s weight (kg) - Required for {travelType === 'flight' ? 'flight' : 'relocation'}</Label>
          <Input
            type="number"
            value={formData.pet_weight}
            onChange={(e) => setFormData({...formData, pet_weight: e.target.value})}
            placeholder="e.g., 15"
            required
          />
        </div>
      )}

      {missingInfo.includes('crate_training') && (
        <div>
          <Label>Is {pet?.name} crate trained?</Label>
          <div className="flex gap-3 mt-2">
            <Button 
              type="button"
              variant={formData.crate_trained === true ? 'default' : 'outline'}
              onClick={() => setFormData({...formData, crate_trained: true})}
              className="flex-1"
            >
              Yes, crate trained
            </Button>
            <Button 
              type="button"
              variant={formData.crate_trained === false ? 'default' : 'outline'}
              onClick={() => setFormData({...formData, crate_trained: false})}
              className="flex-1"
            >
              Not yet
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">This is important for flight safety</p>
        </div>
      )}

      {/* Special Requirements */}
      <div>
        <Label>Special Requirements or Notes</Label>
        <Textarea
          value={formData.special_requirements}
          onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
          placeholder={`Any specific needs for ${pet?.name}? (e.g., anxiety medication, favorite toy, feeding schedule)`}
          rows={3}
        />
      </div>

      {/* Important Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">What happens next?</p>
            <ul className="text-blue-700 mt-1 space-y-1">
              <li>• Our concierge will review your request</li>
              <li>• We'll assess {pet?.name}'s specific needs</li>
              <li>• You'll receive a detailed plan via WhatsApp/Email</li>
              <li>• No payment until everything is confirmed</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Request
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Travel Products Section
const TravelProducts = ({ products, bundles, onAddToCart }) => (
  <div className="space-y-8">
    {/* Travel Bundles Section */}
    {bundles && bundles.length > 0 && (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Travel Kits & Bundles
          <Badge className="bg-green-100 text-green-700 ml-2">Save up to 30%</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="overflow-hidden hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                {bundle.image ? (
                  <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-16 h-16 text-blue-400" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{bundle.travel_type}</Badge>
                  {bundle.is_recommended && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">⭐ Recommended</Badge>
                  )}
                </div>
                <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{bundle.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xl font-bold text-green-600">₹{bundle.price}</span>
                  {bundle.original_price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        {Math.round((1 - bundle.price / bundle.original_price) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>
                {bundle.paw_reward_points > 0 && (
                  <p className="text-xs text-purple-600 mt-1">🐾 Earn {bundle.paw_reward_points} Paw Points</p>
                )}
                <Button 
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => onAddToCart(bundle)}
                >
                  Add Bundle to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )}

    {/* Individual Products Section */}
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-6 h-6 text-purple-600" />
        Travel Essentials
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-purple-600">₹{product.price}</span>
                {product.compare_price && (
                  <span className="text-xs text-gray-400 line-through">₹{product.compare_price}</span>
                )}
              </div>
              {product.paw_reward_points > 0 && (
                <p className="text-xs text-purple-500 mt-1">🐾 {product.paw_reward_points} pts</p>
              )}
              {product.is_birthday_perk && (
                <Badge className="bg-pink-100 text-pink-600 text-xs mt-1">🎂 Birthday Perk</Badge>
              )}
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onAddToCart(product)}
              >
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Main Travel Page Component
const TravelPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // State
  const [step, setStep] = useState('entry'); // entry, select-pet, select-type, form, confirmation
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [travelProducts, setTravelProducts] = useState([]);
  const [travelBundles, setTravelBundles] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [freeformQuery, setFreeformQuery] = useState('');
  
  // Fetch user's pets
  useEffect(() => {
    if (user && token) {
      fetchUserPets();
    }
    fetchTravelProducts();
  }, [user, token]);

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchTravelProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?category=travel&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setTravelProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching travel products:', error);
    }
  };

  const handleFreeformSubmit = () => {
    // Parse freeform query and proceed to pet selection
    if (freeformQuery.trim()) {
      setStep('select-pet');
    }
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
    setStep('select-type');
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setStep('form');
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const requestPayload = {
        travel_type: selectedType,
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
        pet_breed: selectedPet.breed,
        ...formData,
        user_email: user?.email,
        user_phone: user?.phone,
        user_name: user?.name,
        freeform_query: freeformQuery
      };

      const response = await fetch(`${API_URL}/api/travel/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setRequestResult(result);
        setStep('confirmation');
        toast({
          title: "Request Submitted! 🐾",
          description: `We'll review ${selectedPet.name}'s travel needs and get back to you soon.`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to submit request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      category: 'travel'
    });
    toast({
      title: "Added to cart! 🛒",
      description: product.name
    });
  };

  const resetFlow = () => {
    setStep('entry');
    setSelectedPet(null);
    setSelectedType(null);
    setRequestResult(null);
    setFreeformQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-3 mb-4">
            <Car className="w-8 h-8" />
            <Train className="w-8 h-8" />
            <Plane className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Travel with Your Best Friend</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Whether it's a quick vet visit or a cross-country move, we ensure your pet travels safely, 
            calmly, and with the care they deserve.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge className="bg-white/20 text-white px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Pet-First Always
            </Badge>
            <Badge className="bg-white/20 text-white px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Concierge Coordinated
            </Badge>
            <Badge className="bg-white/20 text-white px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Safety Assessed
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Entry Step - How can we help? */}
        {step === 'entry' && (
          <div className="space-y-8">
            {/* Free-form Entry */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                Tell us what you need
              </h2>
              <div className="flex gap-3">
                <Input
                  value={freeformQuery}
                  onChange={(e) => setFreeformQuery(e.target.value)}
                  placeholder="e.g., I need to take Bruno to Delhi next month..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleFreeformSubmit()}
                />
                <Button 
                  onClick={handleFreeformSubmit}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Go
                </Button>
              </div>
            </Card>

            {/* Or Choose Travel Type */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Or choose your travel type
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.values(TRAVEL_TYPES).map((type) => (
                  <TravelTypeCard 
                    key={type.id}
                    type={type}
                    onSelect={() => {
                      setSelectedType(type.id);
                      setStep('select-pet');
                    }}
                  />
                ))}
              </div>
            </div>

            {/* How it Works */}
            <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                How Travel Works
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Tell Us', desc: 'Share your travel needs' },
                  { step: '2', title: 'We Assess', desc: 'Review pet profile & safety' },
                  { step: '3', title: 'Coordinate', desc: 'Plan with trusted partners' },
                  { step: '4', title: 'Travel Safe', desc: 'Confirmed & supported' }
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                      {item.step}
                    </div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Travel Products */}
            {travelProducts.length > 0 && (
              <TravelProducts products={travelProducts} onAddToCart={handleAddToCart} />
            )}
          </div>
        )}

        {/* Select Pet Step */}
        {step === 'select-pet' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Who's traveling?</h2>
              <Button variant="ghost" onClick={() => setStep('entry')}>
                Back
              </Button>
            </div>

            {!user ? (
              <Card className="p-6 text-center">
                <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Login to continue</h3>
                <p className="text-gray-500 mb-4">We need to know your pet's profile for safe travel planning</p>
                <Button onClick={() => window.location.href = '/login?redirect=/travel'}>
                  Login / Sign Up
                </Button>
              </Card>
            ) : userPets.length === 0 ? (
              <Card className="p-6 text-center">
                <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No pets found</h3>
                <p className="text-gray-500 mb-4">Add your pet's profile first for personalized travel planning</p>
                <Button onClick={() => window.location.href = '/pet-profile'}>
                  Add Pet Profile
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userPets.map((pet) => (
                  <PetProfileCard
                    key={pet.id}
                    pet={pet}
                    onSelect={handlePetSelect}
                    selected={selectedPet?.id === pet.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select Type Step (if not already selected) */}
        {step === 'select-type' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">What type of travel?</h2>
                <p className="text-gray-500">Traveling with {selectedPet?.name}</p>
              </div>
              <Button variant="ghost" onClick={() => setStep('select-pet')}>
                Back
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.values(TRAVEL_TYPES).map((type) => (
                <TravelTypeCard 
                  key={type.id}
                  type={type}
                  onSelect={handleTypeSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Form Step */}
        {step === 'form' && selectedPet && selectedType && (
          <div>
            <TravelRequestForm
              travelType={selectedType}
              pet={selectedPet}
              onSubmit={handleFormSubmit}
              onBack={() => setStep('select-type')}
              loading={submitting}
            />
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirmation' && requestResult && (
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your travel request for {selectedPet?.name} has been received. 
              Our concierge team will review and contact you within 24 hours.
            </p>
            
            <Card className="p-4 bg-purple-50 border-purple-200 mb-6 text-left">
              <h3 className="font-semibold text-purple-900 mb-2">Request Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Request ID:</span> <span className="font-medium">{requestResult.request_id}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{TRAVEL_TYPES[selectedType]?.name}</span></div>
                <div><span className="text-gray-500">Pet:</span> <span className="font-medium">{selectedPet?.name}</span></div>
                <div><span className="text-gray-500">Status:</span> <Badge className="bg-blue-100 text-blue-700">Under Review</Badge></div>
              </div>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetFlow}>
                New Request
              </Button>
              <Button onClick={() => window.location.href = '/my-pets'}>
                View My Requests
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TravelPage;
