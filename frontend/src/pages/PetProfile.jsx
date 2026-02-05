import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  PawPrint, Heart, Calendar, Camera, Sparkles, Gift, 
  ChevronRight, ChevronLeft, Check, Plus, X, Crown,
  Moon, Mountain, Sofa, Users, Utensils, Zap, Smile,
  Stethoscope, Syringe, Pill, AlertCircle, Phone, FileText
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';


import BreedAutocomplete from '../components/BreedAutocomplete';


// Persona icons mapping
const PERSONA_ICONS = {
  royal: Crown,
  shadow: Moon,
  adventurer: Mountain,
  couch_potato: Sofa,
  social_butterfly: Users,
  foodie: Utensils,
  athlete: Zap,
  mischief_maker: Smile
};

const PetProfile = ({ isEmbed = false }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [step, setStep] = useState(0); // Start at 0 for loading/check
  const [personas, setPersonas] = useState({});
  const [occasions, setOccasions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPet, setCreatedPet] = useState(null);
  const [customDate, setCustomDate] = useState({ name: '', date: '' });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [existingPets, setExistingPets] = useState([]);
  const [savedEmail, setSavedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    breed: '',
    species: 'dog',
    gender: '',
    photo_url: '',
    
    // Age Info
    birth_date: '',
    gotcha_date: '',
    
    // Soul & Personality
    soul: {
      persona: '',
      special_move: '',
      human_job: '',
      security_blanket: '',
      love_language: '',
      personality_tag: ''
    },
    
    // Celebrations
    celebrations: [],
    selectedOccasions: [],
    
    // Preferences
    preferences: {
      favorite_flavors: [],
      allergies: [],
      texture_preference: '',
      treat_size: ''
    },
    
    // Health Information
    health: {
      vet_name: '',
      vet_clinic: '',
      vet_phone: '',
      medical_conditions: '',
      current_medications: '',
      dietary_restrictions: '',
      spayed_neutered: '',
      microchipped: false,
      microchip_number: '',
      insurance_provider: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    },
    
    // Owner Info
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    
    // Notifications
    whatsapp_reminders: true,
    email_reminders: true
  });

  // Fetch personas and occasions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch personas and occasions
        const [personasRes, occasionsRes] = await Promise.all([
          fetch(`${API_URL}/api/pets/personas`),
          fetch(`${API_URL}/api/pets/occasions`)
        ]);
        
        if (personasRes.ok) {
          const data = await personasRes.json();
          setPersonas(data.personas || {});
        }
        
        if (occasionsRes.ok) {
          const data = await occasionsRes.json();
          setOccasions(data.occasions || {});
        }

        // Priority for email detection:
        // 1. Authenticated user
        // 2. URL params (iframe integration)
        // 3. localStorage (previous checkout)
        let email = '';
        let savedCustomerName = '';
        let savedPhone = '';
        
        // 1. Check if user is authenticated
        if (user && user.email) {
          email = user.email;
          savedCustomerName = user.name || '';
          // Pre-fill owner details from auth
          setFormData(prev => ({
            ...prev,
            owner_email: email,
            owner_name: savedCustomerName || prev.owner_name,
            owner_phone: user.phone || prev.owner_phone
          }));
        } else {
          // 2. Check for email in URL params (iframe integration)
          const params = new URLSearchParams(window.location.search);
          email = params.get('email');
          
          // If email in URL, save it and pre-fill form
          if (email) {
            localStorage.setItem('tdb_pet_parent_email', email);
            setFormData(prev => ({ ...prev, owner_email: email }));
          } else {
            // 3. Try to get from checkout saved details
            try {
              const savedCustomer = localStorage.getItem('tdc_customer_details');
              if (savedCustomer) {
                const parsed = JSON.parse(savedCustomer);
                email = parsed.email;
                savedCustomerName = parsed.parentName;
                savedPhone = parsed.phone;
                // Pre-fill owner details from checkout
                setFormData(prev => ({
                  ...prev,
                  owner_email: email || prev.owner_email,
                  owner_name: savedCustomerName || prev.owner_name,
                  owner_phone: savedPhone || prev.owner_phone
                }));
              }
            } catch (err) {
              console.error('Error loading saved customer:', err);
            }
            
            // Fallback to legacy localStorage key
            if (!email) {
              email = localStorage.getItem('tdb_pet_parent_email');
            }
          }
        }

        if (email) {
          setSavedEmail(email);
          
          // Fetch existing pets - use auth token if available for better security
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const petsEndpoint = token 
            ? `${API_URL}/api/pets/my-pets`
            : `${API_URL}/api/pets?owner_email=${encodeURIComponent(email)}&limit=50`;
          
          const petsRes = await fetch(petsEndpoint, { headers });
          if (petsRes.ok) {
            const data = await petsRes.json();
            if (data.pets && data.pets.length > 0) {
              setExistingPets(data.pets);
              setStep(0); // Show pet list
            } else {
              setStep(1); // No pets, show onboarding
            }
          } else {
            setStep(1);
          }
        } else {
          setStep(1); // New user, show onboarding
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setStep(1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, token]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSoul = (field, value) => {
    setFormData(prev => ({
      ...prev,
      soul: {
        ...prev.soul,
        [field]: value
      }
    }));
  };

  const updatePreferences = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const updateHealth = (field, value) => {
    setFormData(prev => ({
      ...prev,
      health: {
        ...prev.health,
        [field]: value
      }
    }));
  };

  const toggleOccasion = (occasionKey) => {
    setFormData(prev => {
      const selected = prev.selectedOccasions.includes(occasionKey)
        ? prev.selectedOccasions.filter(o => o !== occasionKey)
        : [...prev.selectedOccasions, occasionKey];
      return { ...prev, selectedOccasions: selected };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Build celebrations from selected occasions
      const celebrations = formData.selectedOccasions.map(occasionKey => {
        const occasion = occasions[occasionKey];
        let date = '';
        
        // Set dates for recurring occasions
        if (occasionKey === 'birthday' && formData.birth_date) {
          date = formData.birth_date;
        } else if (occasionKey === 'gotcha_day' && formData.gotcha_date) {
          date = formData.gotcha_date;
        } else {
          // Use default dates for fixed occasions
          const defaultDates = {
            diwali: '11-01',
            christmas: '12-25',
            valentines: '02-14',
            easter: '04-20',
            holi: '03-14',
            halloween: '10-31',
            summer: '05-01',
            new_year: '01-01'
          };
          date = defaultDates[occasionKey] || '';
        }
        
        return {
          occasion: occasionKey,
          date,
          is_recurring: true
        };
      });

      const payload = {
        name: formData.name,
        nicknames: formData.nicknames || '',
        breed: formData.breed,
        species: formData.species,
        gender: formData.gender,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        photo_url: formData.photo_url?.startsWith('data:') ? '' : formData.photo_url, // Don't send base64
        birth_date: formData.birth_date,
        gotcha_date: formData.gotcha_date,
        soul: formData.soul,
        celebrations,
        preferences: formData.preferences,
        health: formData.health,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_phone: formData.owner_phone,
        whatsapp_reminders: formData.whatsapp_reminders,
        email_reminders: formData.email_reminders,
        source: isEmbed ? 'shopify_embed' : 'direct'
      };

      // Use public endpoint if not logged in, authenticated endpoint if logged in
      const endpoint = token ? `${API_URL}/api/pets` : `${API_URL}/api/pets/public`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const petId = data.pet?.id;
        
        // If we have a photo file to upload, do it now
        if (petId && formData.photo_file && token) {
          try {
            const photoFormData = new FormData();
            photoFormData.append('photo', formData.photo_file);
            
            const photoResponse = await fetch(`${API_URL}/api/pets/${petId}/photo`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: photoFormData
            });
            
            if (photoResponse.ok) {
              const photoData = await photoResponse.json();
              data.pet.photo_url = photoData.photo_url;
            }
          } catch (photoError) {
            console.error('Photo upload failed:', photoError);
            // Continue anyway - pet was created
          }
        }
        
        setCreatedPet(data.pet);
        // Save email for returning user recognition
        if (formData.owner_email) {
          localStorage.setItem('tdb_pet_parent_email', formData.owner_email);
        }
        setStep(6); // Success step
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to create pet profile'}`);
      }
    } catch (error) {
      console.error('Error creating pet:', error);
      alert('Failed to create pet profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PawPrint className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Let's meet your furry friend!</h2>
        <p className="text-gray-600 mt-2">The basics - their "ID Card"</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Pet's Name *</Label>
            <Input
              id="name"
              placeholder="What do you call your furry friend?"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="nicknames">Nicknames</Label>
            <Input
              id="nicknames"
              placeholder="e.g., Floofy, Mr. Wigglebutt, Stinky"
              value={formData.nicknames || ''}
              onChange={(e) => updateFormData('nicknames', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Because they only hear their "real" name when in trouble 😉</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="species">Species</Label>
            <select
              id="species"
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.species}
              onChange={(e) => updateFormData('species', e.target.value)}
            >
              <option value="dog">🐕 Dog</option>
              <option value="cat">🐱 Cat</option>
              <option value="other">🐾 Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.gender}
              onChange={(e) => updateFormData('gender', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="male">Male (Good Boy)</option>
              <option value="female">Female (Good Girl)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 12"
              value={formData.weight || ''}
              onChange={(e) => updateFormData('weight', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="breed">Breed</Label>
          <BreedAutocomplete
            id="breed"
            placeholder="Start typing breed name..."
            value={formData.breed}
            onChange={(e) => updateFormData('breed', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birth_date">Birthday 🎂</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => updateFormData('birth_date', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="gotcha_date">Gotcha Day 🏠</Label>
            <Input
              id="gotcha_date"
              type="date"
              value={formData.gotcha_date}
              onChange={(e) => updateFormData('gotcha_date', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg">
          💡 Don't know their birthday? No worries! Celebrate their Gotcha Day - the day they joined your family!
        </p>

        {/* Photo Upload Section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Pet Photo
          </Label>
          
          {/* Photo Preview */}
          {formData.photo_url && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <img 
                src={formData.photo_url} 
                alt="Pet preview" 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                onError={(e) => e.target.style.display = 'none'}
              />
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">Photo added! ✨</p>
                <button 
                  type="button"
                  onClick={() => updateFormData('photo_url', '')}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all shadow-md">
              <Camera className="w-5 h-5" />
              <span className="font-medium">Upload from Phone</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Validate
                  if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be less than 5MB');
                    return;
                  }
                  
                  // Create preview immediately
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    updateFormData('photo_url', ev.target.result);
                    updateFormData('photo_file', file);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            📱 Tap to select a photo from your gallery or take a new one
          </p>
          
          {/* Optional URL input */}
          <details className="text-sm">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
              Or paste a URL instead
            </summary>
            <Input
              id="photo_url"
              placeholder="https://... link to pet's photo"
              value={formData.photo_url?.startsWith('data:') ? '' : formData.photo_url}
              onChange={(e) => updateFormData('photo_url', e.target.value)}
              className="mt-2"
            />
          </details>
        </div>
      </div>
    </div>
  );

  // Step 1b: Lifestyle (The "User Manual")
  const renderStep1b = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{formData.name}'s Lifestyle</h2>
        <p className="text-gray-600 mt-2">Their "User Manual" - helps us pick the perfect treats!</p>
      </div>

      <div className="space-y-5">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            ⚠️ Allergies & Sensitivities
          </Label>
          <Input
            placeholder="e.g., Grain-free, No chicken, Sensitive stomach"
            value={formData.preferences?.allergies || ''}
            onChange={(e) => updateFormData('preferences', { ...formData.preferences, allergies: e.target.value })}
          />
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
            🏃 Activity Level
          </Label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.preferences?.activity_level || ''}
            onChange={(e) => updateFormData('preferences', { ...formData.preferences, activity_level: e.target.value })}
          >
            <option value="">Select activity level...</option>
            <option value="couch_potato">🛋️ Couch Potato - Loves lazy days</option>
            <option value="moderate">🚶 Moderate - Regular walks, some play</option>
            <option value="active">🏃 Active - Loves outdoor adventures</option>
            <option value="athlete">⚡ Athlete - High energy, always on the go!</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            🍖 Favorite Flavor Profile
          </Label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            value={formData.preferences?.flavor_profile || ''}
            onChange={(e) => updateFormData('preferences', { ...formData.preferences, flavor_profile: e.target.value })}
          >
            <option value="">What flavors do they love?</option>
            <option value="farmhouse">🏠 Farmhouse - Liver, Chicken, Mutton</option>
            <option value="ocean">🌊 Ocean - Salmon, Whitefish, Tuna</option>
            <option value="garden">🌿 Garden - Peanut Butter, Sweet Potato, Pumpkin</option>
            <option value="adventurous">🎯 Adventurous - Loves trying everything!</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
            🍪 Treat Texture Preference
          </Label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            value={formData.preferences?.treat_texture || ''}
            onChange={(e) => updateFormData('preferences', { ...formData.preferences, treat_texture: e.target.value })}
          >
            <option value="">How do they like their treats?</option>
            <option value="crunchy">🥨 Crunchy - Loves the crunch!</option>
            <option value="chewy">🍬 Chewy - Soft and chewy is best</option>
            <option value="frozen">🧊 Frozen - Cold treats for hot days</option>
            <option value="any">✨ Any - Not picky at all!</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-green-700 font-semibold mb-2">
            🎯 Current Goals
          </Label>
          <Input
            placeholder="e.g., Weight loss, Shiny coat, Anxiety reduction, Just here for the party!"
            value={formData.preferences?.goals || ''}
            onChange={(e) => updateFormData('preferences', { ...formData.preferences, goals: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // Step 1c: Health Information (NEW)
  const renderStepHealth = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{formData.name}'s Health Profile</h2>
        <p className="text-gray-600 mt-2">Important health information for better care</p>
        <p className="text-sm text-purple-600 mt-1">💡 This info is stored securely and visible in your My Account area</p>
      </div>

      <div className="space-y-5">
        {/* Vet Information */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-blue-700 font-semibold mb-3">
            <Stethoscope className="w-4 h-4" />
            Primary Veterinarian
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600">Vet's Name</Label>
              <Input
                placeholder="Dr. Smith"
                value={formData.health?.vet_name || ''}
                onChange={(e) => updateHealth('vet_name', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Clinic Name</Label>
              <Input
                placeholder="Pawsome Pet Clinic"
                value={formData.health?.vet_clinic || ''}
                onChange={(e) => updateHealth('vet_clinic', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm text-gray-600">Vet Contact Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={formData.health?.vet_phone || ''}
                onChange={(e) => updateHealth('vet_phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
            <AlertCircle className="w-4 h-4" />
            Medical Conditions
          </Label>
          <p className="text-sm text-gray-600 mb-3">Any chronic conditions, past surgeries, or health concerns</p>
          <Textarea
            placeholder="e.g., Hip dysplasia, Heart murmur, Recovering from ACL surgery..."
            value={formData.health?.medical_conditions || ''}
            onChange={(e) => updateHealth('medical_conditions', e.target.value)}
            rows={3}
          />
        </div>

        {/* Current Medications */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
            <Pill className="w-4 h-4" />
            Current Medications
          </Label>
          <p className="text-sm text-gray-600 mb-3">Include dosage and frequency if known</p>
          <Textarea
            placeholder="e.g., Apoquel 16mg daily, Heartgard monthly, Joint supplements..."
            value={formData.health?.current_medications || ''}
            onChange={(e) => updateHealth('current_medications', e.target.value)}
            rows={3}
          />
        </div>

        {/* Dietary Restrictions */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-green-700 font-semibold mb-2">
            <Utensils className="w-4 h-4" />
            Dietary Restrictions
          </Label>
          <p className="text-sm text-gray-600 mb-3">Beyond allergies - any special diet requirements</p>
          <Input
            placeholder="e.g., Low protein diet, No raw food, Prescription diet only..."
            value={formData.health?.dietary_restrictions || ''}
            onChange={(e) => updateHealth('dietary_restrictions', e.target.value)}
          />
        </div>

        {/* Quick Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <Label className="text-gray-700 font-semibold mb-3 block">Spayed/Neutered?</Label>
            <div className="flex gap-3">
              {['Yes', 'No', 'Not Sure'].map((option) => (
                <button
                  key={option}
                  onClick={() => updateHealth('spayed_neutered', option.toLowerCase().replace(' ', '_'))}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    formData.health?.spayed_neutered === option.toLowerCase().replace(' ', '_')
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <Label className="text-gray-700 font-semibold mb-3 block">Microchipped?</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.health?.microchipped || false}
                  onChange={(e) => updateHealth('microchipped', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm">Yes, they are microchipped</span>
              </label>
            </div>
            {formData.health?.microchipped && (
              <Input
                placeholder="Microchip Number (optional)"
                value={formData.health?.microchip_number || ''}
                onChange={(e) => updateHealth('microchip_number', e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-indigo-700 font-semibold mb-2">
            <FileText className="w-4 h-4" />
            Pet Insurance (Optional)
          </Label>
          <Input
            placeholder="Insurance provider name (if any)"
            value={formData.health?.insurance_provider || ''}
            onChange={(e) => updateHealth('insurance_provider', e.target.value)}
          />
        </div>

        {/* Emergency Contact */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-red-700 font-semibold mb-3">
            <Phone className="w-4 h-4" />
            Emergency Contact (Other than you)
          </Label>
          <p className="text-sm text-gray-600 mb-3">Who should we contact if we can't reach you?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={formData.health?.emergency_contact_name || ''}
              onChange={(e) => updateHealth('emergency_contact_name', e.target.value)}
            />
            <Input
              placeholder="Phone Number"
              value={formData.health?.emergency_contact_phone || ''}
              onChange={(e) => updateHealth('emergency_contact_phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-xl p-4 mt-4">
        <p className="text-sm text-purple-700">
          <strong>🔒 Your pet's health data is secure.</strong> This information helps our Care, Stay, and Travel teams 
          provide better service. You can view and update it anytime in your My Account → My Pets section.
        </p>
      </div>
    </div>
  );

  // Step 2: Soul Persona Selection
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">What's {formData.name || 'your pet'}'s personality?</h2>
        <p className="text-gray-600 mt-2">Choose the soul type that best describes them</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(personas).map(([key, persona]) => {
          const Icon = PERSONA_ICONS[key] || PawPrint;
          const isSelected = formData.soul.persona === key;
          
          return (
            <button
              key={key}
              onClick={() => updateSoul('persona', key)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                isSelected 
                  ? 'border-purple-600 bg-purple-50 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-2xl">{persona.emoji}</span>
              <h3 className="font-semibold text-sm mt-1">{persona.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{persona.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 3: Soul Questions
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Tell us about {formData.name}'s soul</h2>
        <p className="text-gray-600 mt-2">These details help us create magical, personalized messages</p>
      </div>

      <div className="space-y-5">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
            <Sparkles className="w-4 h-4" />
            The "Special Move"
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            What's that one weird or cute thing they do that always makes you smile?
          </p>
          <Input
            placeholder='e.g., "The zoomies after a bath" or "The paw-tap when they want a treat"'
            value={formData.soul.special_move}
            onChange={(e) => updateSoul('special_move', e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
            <Users className="w-4 h-4" />
            The "Human Persona"
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            If {formData.name} had a human job, what would it be?
          </p>
          <Input
            placeholder='e.g., "A grumpy librarian", "A frat boy", "CEO", "Yoga instructor"'
            value={formData.soul.human_job}
            onChange={(e) => updateSoul('human_job', e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-green-700 font-semibold mb-2">
            <Gift className="w-4 h-4" />
            The "Security Blanket"
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            What's their one "must-have" item?
          </p>
          <Input
            placeholder='e.g., "A tattered tennis ball", "Their spot on the rug", "Your left slipper"'
            value={formData.soul.security_blanket}
            onChange={(e) => updateSoul('security_blanket', e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-5">
          <Label className="flex items-center gap-2 text-rose-700 font-semibold mb-2">
            <Heart className="w-4 h-4" />
            The "Love Language"
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            How does {formData.name} show love?
          </p>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
            value={formData.soul.love_language}
            onChange={(e) => updateSoul('love_language', e.target.value)}
          >
            <option value="">Select their love language...</option>
            <option value="leaning">Leaning (Physical touch)</option>
            <option value="gifts">Bringing Gifts (Toys to you)</option>
            <option value="velcro">Velcro-ing (Following room to room)</option>
            <option value="staring">The Stare (Intense eye contact)</option>
            <option value="licking">The Licker (Kisses everywhere)</option>
          </select>
        </div>

        <div>
          <Label className="text-gray-700 font-semibold">Personality Tag (optional)</Label>
          <p className="text-sm text-gray-500 mb-2">A fun nickname for their personality</p>
          <Input
            placeholder='e.g., "The Grumpy Professor", "The Drama Queen", "The Gentle Giant"'
            value={formData.soul.personality_tag}
            onChange={(e) => updateSoul('personality_tag', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Step 4: Celebrations
  const addCustomCelebration = () => {
    if (customDate.name && customDate.date) {
      const newCelebration = {
        occasion: `custom_${Date.now()}`,
        date: customDate.date,
        is_recurring: true,
        custom_name: customDate.name
      };
      setFormData(prev => ({
        ...prev,
        celebrations: [...prev.celebrations, newCelebration],
        selectedOccasions: [...prev.selectedOccasions, newCelebration.occasion]
      }));
      setCustomDate({ name: '', date: '' });
      setShowCustomForm(false);
    }
  };

  const removeCustomCelebration = (occasionKey) => {
    setFormData(prev => ({
      ...prev,
      celebrations: prev.celebrations.filter(c => c.occasion !== occasionKey),
      selectedOccasions: prev.selectedOccasions.filter(o => o !== occasionKey)
    }));
  };

  const renderStep4 = () => {
    return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Celebration Calendar 🎉</h2>
        <p className="text-gray-600 mt-2">
          Life is short - celebrate often! Pick occasions to get reminders & treat suggestions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(occasions).map(([key, occasion]) => {
          const isSelected = formData.selectedOccasions.includes(key);
          const needsDate = (key === 'birthday' && !formData.birth_date) || 
                           (key === 'gotcha_day' && !formData.gotcha_date);
          
          return (
            <button
              key={key}
              onClick={() => toggleOccasion(key)}
              disabled={needsDate}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected 
                  ? 'border-green-600 bg-green-50 shadow-md' 
                  : needsDate
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{occasion.emoji}</span>
                {isSelected && (
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm mt-2">{occasion.name}</h3>
              {needsDate && (
                <p className="text-xs text-red-500 mt-1">Add date in Step 1</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Celebrations Added */}
      {formData.celebrations.filter(c => c.custom_name).length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-700 mb-2">Your Custom Dates:</h4>
          <div className="space-y-2">
            {formData.celebrations.filter(c => c.custom_name).map((celeb) => (
              <div key={celeb.occasion} className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <div>
                    <p className="font-medium text-purple-800">{celeb.custom_name}</p>
                    <p className="text-xs text-purple-600">{celeb.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeCustomCelebration(celeb.occasion)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Celebration */}
      <div className="mt-6 border-t pt-6">
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full p-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Custom Celebration Date
          </button>
        ) : (
          <div className="bg-purple-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-purple-800">Add Custom Date</h4>
            <div>
              <Label className="text-sm text-purple-700">What are you celebrating?</Label>
              <Input
                placeholder="e.g., First Walk Anniversary, Gotcha Day, Adoption Day"
                value={customDate.name}
                onChange={(e) => setCustomDate(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-purple-700">Date</Label>
              <Input
                type="date"
                value={customDate.date}
                onChange={(e) => setCustomDate(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addCustomCelebration}
                disabled={!customDate.name || !customDate.date}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomDate({ name: '', date: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-purple-50 rounded-xl p-4 mt-6">
        <p className="text-sm text-purple-700">
          <strong>✨ You'll receive:</strong> Personalized reminders 7 days before and 1 day before each celebration, 
          with treat recommendations based on {formData.name}'s personality!
        </p>
      </div>
    </div>
    );
  };

  // Step 5: Preferences & Contact
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-10 h-10 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Almost done! 🐾</h2>
        <p className="text-gray-600 mt-2">Food preferences & how to reach you</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="font-semibold">Favorite Flavors</Label>
          <p className="text-sm text-gray-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {['Chicken', 'Mutton', 'Peanut Butter', 'Banana', 'Carrot', 'Fish', 'Cheese', 'Pumpkin'].map(flavor => (
              <button
                key={flavor}
                onClick={() => {
                  const current = formData.preferences.favorite_flavors;
                  const updated = current.includes(flavor)
                    ? current.filter(f => f !== flavor)
                    : [...current, flavor];
                  updatePreferences('favorite_flavors', updated);
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  formData.preferences.favorite_flavors.includes(flavor)
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="font-semibold">Allergies / Avoid</Label>
          <p className="text-sm text-gray-500 mb-2">Select any ingredients to avoid</p>
          <div className="flex flex-wrap gap-2">
            {['Wheat', 'Dairy', 'Eggs', 'Chicken', 'Soy', 'None'].map(allergy => (
              <button
                key={allergy}
                onClick={() => {
                  const current = formData.preferences.allergies;
                  const updated = current.includes(allergy)
                    ? current.filter(a => a !== allergy)
                    : [...current, allergy];
                  updatePreferences('allergies', updated);
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  formData.preferences.allergies.includes(allergy)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Texture Preference</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              value={formData.preferences.texture_preference}
              onChange={(e) => updatePreferences('texture_preference', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="crunchy">Crunchy</option>
              <option value="chewy">Chewy</option>
              <option value="soft">Soft</option>
              <option value="any">Any</option>
            </select>
          </div>
          <div>
            <Label>Treat Size</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              value={formData.preferences.treat_size}
              onChange={(e) => updatePreferences('treat_size', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="small">Small bites</option>
              <option value="medium">Medium</option>
              <option value="large">Large chunks</option>
            </select>
          </div>
        </div>

        <hr className="my-6" />

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Your Contact Info</h3>
          {existingPets.length > 0 && formData.owner_email && (
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
              <Check className="w-3 h-3 mr-1" /> Pre-filled from your account
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_name">Your Name</Label>
            <Input
              id="owner_name"
              placeholder="Pet Parent's name"
              value={formData.owner_name}
              onChange={(e) => updateFormData('owner_name', e.target.value)}
              className={`mt-1 ${existingPets.length > 0 && formData.owner_name ? 'bg-gray-50' : ''}`}
            />
          </div>
          <div>
            <Label htmlFor="owner_phone">WhatsApp Number</Label>
            <Input
              id="owner_phone"
              placeholder="+91 98765 43210"
              value={formData.owner_phone}
              onChange={(e) => updateFormData('owner_phone', e.target.value)}
              className={`mt-1 ${existingPets.length > 0 && formData.owner_phone ? 'bg-gray-50' : ''}`}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="owner_email">Email</Label>
          <Input
            id="owner_email"
            type="email"
            placeholder="your@email.com"
            value={formData.owner_email}
            onChange={(e) => updateFormData('owner_email', e.target.value)}
            className={`mt-1 ${existingPets.length > 0 && formData.owner_email ? 'bg-gray-50' : ''}`}
            readOnly={existingPets.length > 0 && !!formData.owner_email}
          />
          {existingPets.length > 0 && formData.owner_email && (
            <p className="text-xs text-gray-500 mt-1">Email linked to your existing pets</p>
          )}
        </div>

        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.whatsapp_reminders}
              onChange={(e) => updateFormData('whatsapp_reminders', e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm">WhatsApp reminders</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.email_reminders}
              onChange={(e) => updateFormData('email_reminders', e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm">Email reminders</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Step 6: Success
  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-12 h-12 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to the family, {createdPet?.name}! 🎉</h2>
        <p className="text-gray-600 mt-2">
          {createdPet?.name}'s soul profile has been captured
        </p>
      </div>

      {createdPet && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 text-left max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            {createdPet.photo_url ? (
              <img src={createdPet.photo_url} alt={createdPet.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                <PawPrint className="w-8 h-8 text-purple-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-xl">{createdPet.name}</h3>
              <p className="text-sm text-gray-600">{createdPet.breed || 'Adorable Furball'}</p>
            </div>
          </div>
          
          {createdPet.soul?.persona && personas[createdPet.soul.persona] && (
            <Badge className="bg-purple-600 text-white">
              {personas[createdPet.soul.persona].emoji} {personas[createdPet.soul.persona].name}
            </Badge>
          )}
          
          {createdPet.soul?.personality_tag && (
            <p className="text-purple-700 font-medium mt-2">"{createdPet.soul.personality_tag}"</p>
          )}
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        {isEmbed ? (
          <>
            <a href="https://thedoggybakery.com/collections/cakes" target="_blank" rel="noopener noreferrer">
              <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                <Gift className="w-4 h-4 mr-2" />
                Shop Celebration Cakes
              </Button>
            </a>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Another Pet
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => navigate('/cakes')} className="bg-purple-600 hover:bg-purple-700">
              <Gift className="w-4 h-4 mr-2" />
              Shop Celebration Cakes
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Another Pet
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.trim() !== '';
      case 1.5: return true; // Lifestyle step - all optional
      case 1.75: return true; // Health step - all optional
      case 2: return formData.soul.persona !== '';
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  // Render existing pets view (step 0) for returning users
  const renderMyPets = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back! 🐾</h2>
        <p className="text-gray-600 mt-1">Here are your furry family members</p>
      </div>

      <div className="space-y-3">
        {existingPets.map((pet) => {
          const PersonaIcon = PERSONA_ICONS[pet.soul?.persona] || PawPrint;
          return (
            <div key={pet.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <PawPrint className="w-7 h-7 text-purple-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{pet.name}</h3>
                  {pet.soul?.persona && (
                    <Badge variant="outline" className="text-xs">
                      {personas[pet.soul.persona]?.emoji} {personas[pet.soul.persona]?.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{pet.breed || pet.species}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                {pet.birth_date && <p>🎂 {new Date(pet.birth_date).toLocaleDateString()}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Button 
        onClick={() => {
          // Pre-fill owner info from existing pets
          if (existingPets.length > 0) {
            const firstPet = existingPets[0];
            setFormData(prev => ({
              ...prev,
              owner_email: firstPet.owner_email || savedEmail || prev.owner_email,
              owner_name: firstPet.owner_name || prev.owner_name,
              owner_phone: firstPet.owner_phone || prev.owner_phone,
              // Reset pet-specific info
              name: '',
              breed: '',
              gender: '',
              photo_url: '',
              birth_date: '',
              gotcha_date: '',
              soul: {
                persona: '',
                special_move: '',
                human_job: '',
                security_blanket: '',
                love_language: '',
                personality_tag: ''
              },
              celebrations: [],
              selectedOccasions: [],
              preferences: {
                favorite_flavors: [],
                allergies: [],
                texture_preference: '',
                treat_size: ''
              }
            }));
          }
          setStep(1);
        }} 
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Pet
      </Button>

      <p className="text-center text-sm text-gray-500 mt-2">
        Your details (name, email, phone) will be carried over automatically
      </p>

      <p className="text-center text-xs text-gray-400">
        Logged in as {savedEmail}
        <button 
          onClick={() => {
            localStorage.removeItem('tdb_pet_parent_email');
            setExistingPets([]);
            setSavedEmail('');
            setStep(1);
          }}
          className="ml-2 text-purple-600 hover:underline"
        >
          Switch account
        </button>
      </p>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-12 h-12 text-purple-600 animate-bounce mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50">
      {/* Decorative Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white py-8 mb-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <PawPrint className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Pet Soul Profile</h1>
          <p className="text-white/80">Create your pet's unique digital identity</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Progress Bar */}
        {step > 0 && step < 6 && (
          <div className="mb-8 bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {step === 1.5 ? '2' : step === 1.75 ? '3' : step > 1.75 ? Math.floor(step) + 2 : step} of 7
              </span>
              <span className="text-sm font-medium text-purple-600">
                {Math.round((step === 1.5 ? 2 : step === 1.75 ? 3 : step > 1.75 ? step + 2 : step) / 7 * 100)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${((step === 1.5 ? 2 : step === 1.75 ? 3 : step > 1.75 ? step + 2 : step) / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="p-6 md:p-8 shadow-2xl border-0 bg-white/95 backdrop-blur">
          {step === 0 && renderMyPets()}
          {step === 1 && renderStep1()}
          {step === 1.5 && renderStep1b()}
          {step === 1.75 && renderStepHealth()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderSuccess()}

          {/* Navigation Buttons */}
          {step > 0 && step < 6 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 1.5) setStep(1);
                  else if (step === 1.75) setStep(1.5);
                  else if (step === 2) setStep(1.75);
                  else setStep(s => s - 1);
                }}
                disabled={step === 1}
                className={step === 1 ? 'invisible' : 'border-gray-300 hover:bg-gray-50'}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              {step < 5 ? (
                <Button
                  onClick={() => {
                    if (step === 1) setStep(1.5);
                    else if (step === 1.5) setStep(1.75);
                    else if (step === 1.75) setStep(2);
                    else setStep(s => s + 1);
                  }}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 hover:from-purple-700 hover:via-pink-600 hover:to-amber-600 shadow-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Pet Profile'}
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by <span className="font-semibold text-purple-600">The Doggy Company</span></p>
          <p className="mt-1">Your pet's data is safe and secure 🔒</p>
        </div>
      </div>
    </div>
  );
};

export default PetProfile;
