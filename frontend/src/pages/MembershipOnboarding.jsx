import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Home, PawPrint, Plus, X, Check,
  ChevronRight, ChevronLeft, Camera, Calendar, Scale, Heart,
  Dog, Sparkles, Crown, ArrowRight, CreditCard, Loader2, Gift,
  Eye, EyeOff
} from 'lucide-react';
import { getApiUrl, API_URL } from '../utils/api';
import BreedAutocomplete from '../components/BreedAutocomplete';
import { getPetPhotoUrl } from '../utils/petAvatar';

// Indian cities for autocomplete
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 
  'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
  'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
  'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',
  'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur',
  'Hubli', 'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Tiruppur',
  'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur',
  'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida',
  'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore',
  'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded',
  'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni',
  'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli', 'Mangalore',
  'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya'
];

const MembershipOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'annual';
  const petCount = parseInt(searchParams.get('pets') || '1', 10);
  
  const [step, setStep] = useState(1); // 1: Parent Info, 2: Pet Info, 3: Celebrations, 4: Review & Pay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePetTab, setActivePetTab] = useState(0);
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [planType, setPlanType] = useState(initialPlan); // Plan selection state
  
  // Celebrations selection state
  const [celebrationsData, setCelebrationsData] = useState([]);
  
  // Pet Parent form state
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    photo: null, // Pet Parent photo
    photoPreview: null, // Preview URL
    // New fields
    preferredContact: 'whatsapp', // whatsapp, phone, email
    notifications: {
      orderUpdates: true,
      promotions: true,
      petReminders: true,
      newsletter: false,
      soulWhispers: true // Weekly WhatsApp drip - default ON
    },
    acceptTerms: false,
    acceptPrivacy: false
  });
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Pets form state - array based on petCount
  const [petsData, setPetsData] = useState(
    Array.from({ length: petCount }, () => ({
      name: '',
      breed: '',
      gender: '',
      birth_date: '',
      gotcha_date: '',
      weight: '',
      weight_unit: 'kg',
      is_neutered: null,
      photo_url: '',
      photo_preview: null,  // For local preview before upload
      celebrations: [] // Array of selected celebration types for this pet
    }))
  );
  
  // Available celebration types
  const CELEBRATION_TYPES = [
    { id: 'birthday', name: 'Birthday', emoji: '🎂', description: 'Celebrate their special day with cakes & treats' },
    { id: 'gotcha_day', name: 'Gotcha Day', emoji: '💝', description: 'The day they joined your family' },
    { id: 'vaccination', name: 'Vaccination Day', emoji: '💉', description: 'Reminders for vaccines & health checkups' },
    { id: 'grooming', name: 'Grooming Day', emoji: '✂️', description: 'Regular grooming schedule reminders' },
    { id: 'training', name: 'Training Milestones', emoji: '🎓', description: 'Track and celebrate training achievements' },
    { id: 'adoption', name: 'Adoption Anniversary', emoji: '🏠', description: 'Yearly anniversary of adoption' },
    { id: 'festival', name: 'Festival Celebrations', emoji: '🎉', description: 'Diwali, Holi, Christmas & more' },
    { id: 'first_year', name: 'First Year Milestones', emoji: '🌟', description: 'Track puppy\'s first year achievements' }
  ];
  
  const [parentErrors, setParentErrors] = useState({});
  const [petErrors, setPetErrors] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(null); // Track which pet is uploading

  // Handle pet photo upload
  const handlePetPhotoSelect = async (petIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    updatePetData(petIndex, 'photo_preview', previewUrl);

    // Store the file for later upload (during form submission)
    updatePetData(petIndex, 'photo_file', file);
  };

  // Handle parent photo upload
  const handleParentPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setParentData(prev => ({
        ...prev,
        photo: file,
        photoPreview: previewUrl
      }));
    }
  };

  // Filter cities based on search
  const filteredCities = INDIAN_CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 8);

  // Validate parent form
  const validateParentForm = () => {
    const errors = {};
    if (!parentData.name.trim()) errors.name = 'Name is required';
    if (!parentData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(parentData.email)) errors.email = 'Invalid email format';
    if (!parentData.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\+?[0-9]{10,13}$/.test(parentData.phone.replace(/\s/g, ''))) 
      errors.phone = 'Invalid phone number';
    if (!parentData.whatsapp.trim()) errors.whatsapp = 'WhatsApp number is required';
    else if (!/^\+?[0-9]{10,13}$/.test(parentData.whatsapp.replace(/\s/g, ''))) 
      errors.whatsapp = 'Invalid WhatsApp number';
    if (!parentData.address.trim()) errors.address = 'Address is required for deliveries';
    if (!parentData.city.trim()) errors.city = 'City is required';
    if (!parentData.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^[0-9]{6}$/.test(parentData.pincode)) errors.pincode = 'Invalid pincode (6 digits)';
    if (!parentData.password) errors.password = 'Password is required';
    else if (parentData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (parentData.password !== parentData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!parentData.acceptTerms) errors.acceptTerms = 'You must accept the Terms & Conditions';
    if (!parentData.acceptPrivacy) errors.acceptPrivacy = 'You must accept the Privacy Policy';
    
    setParentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate pet forms
  const validatePetForms = () => {
    const errors = petsData.map((pet, idx) => {
      const petErr = {};
      if (!pet.name.trim()) petErr.name = 'Pet name is required';
      if (!pet.breed.trim()) petErr.breed = 'Breed is required';
      if (!pet.birth_date && !pet.gotcha_date) petErr.dates = 'Please provide birth date or gotcha day';
      return petErr;
    });
    
    setPetErrors(errors);
    return errors.every(e => Object.keys(e).length === 0);
  };

  // Handle next step
  const handleNext = () => {
    if (step === 1 && validateParentForm()) {
      setStep(2);
    } else if (step === 2 && validatePetForms()) {
      setStep(3);
    } else if (step === 3) {
      // Celebrations step - no validation required, just move forward
      setStep(4);
    }
  };

  // Handle back
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  // Toggle celebration for a pet
  const toggleCelebration = (petIndex, celebrationId) => {
    const newPets = [...petsData];
    const celebrations = newPets[petIndex].celebrations || [];
    
    if (celebrations.includes(celebrationId)) {
      newPets[petIndex].celebrations = celebrations.filter(c => c !== celebrationId);
    } else {
      newPets[petIndex].celebrations = [...celebrations, celebrationId];
    }
    
    setPetsData(newPets);
  };

  // Update pet data
  const updatePetData = (index, field, value) => {
    const newPets = [...petsData];
    newPets[index] = { ...newPets[index], [field]: value };
    setPetsData(newPets);
  };

  // Add another pet
  const addPet = () => {
    setPetsData([...petsData, {
      name: '',
      breed: '',
      gender: '',
      birth_date: '',
      gotcha_date: '',
      weight: '',
      weight_unit: 'kg',
      is_neutered: null,
      photo_url: ''
    }]);
    setActivePetTab(petsData.length);
  };

  // Remove pet
  const removePet = (index) => {
    if (petsData.length > 1) {
      const newPets = petsData.filter((_, i) => i !== index);
      setPetsData(newPets);
      if (activePetTab >= newPets.length) {
        setActivePetTab(newPets.length - 1);
      }
    }
  };

  // Submit and proceed to payment
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${getApiUrl()}/api/membership/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: {
            name: parentData.name,
            email: parentData.email,
            phone: parentData.phone,
            whatsapp: parentData.whatsapp,
            address: parentData.address,
            city: parentData.city,
            pincode: parentData.pincode,
            password: parentData.password,
            preferred_contact: parentData.preferredContact,
            notifications: parentData.notifications,
            accepted_terms: parentData.acceptTerms,
            accepted_privacy: parentData.acceptPrivacy
          },
          pets: petsData.map(pet => ({
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            birth_date: pet.birth_date,
            gotcha_date: pet.gotcha_date,
            weight: pet.weight ? parseFloat(pet.weight) : null,
            weight_unit: pet.weight_unit,
            is_neutered: pet.is_neutered,
            species: 'dog',
            celebrations: pet.celebrations || [] // Include selected celebrations
          })),
          plan_type: planType,
          pet_count: petsData.length
        })
      });

      // Clone response before reading to avoid "body stream already read" error
      const responseClone = response.clone();
      
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // If JSON parsing fails, try to get text
        const text = await responseClone.text();
        console.error('Response parsing error:', text);
        throw new Error('Server returned invalid response');
      }
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to create membership');
      }

      // Upload pet photos if any were selected
      if (data.pet_ids && data.pet_ids.length > 0) {
        for (let i = 0; i < petsData.length; i++) {
          const pet = petsData[i];
          const petId = data.pet_ids[i];
          
          if (pet.photo_file && petId) {
            try {
              const photoFormData = new FormData();
              photoFormData.append('photo', pet.photo_file);
              
              await fetch(`${getApiUrl()}/api/pets/${petId}/photo`, {
                method: 'POST',
                body: photoFormData
              });
              console.log(`Uploaded photo for pet ${pet.name}`);
            } catch (photoErr) {
              console.error(`Failed to upload photo for pet ${pet.name}:`, photoErr);
              // Don't fail the whole process for photo upload errors
            }
          }
        }
      }

      // Upload parent photo if selected
      if (parentData.photo && data.user_id) {
        try {
          const parentPhotoFormData = new FormData();
          parentPhotoFormData.append('photo', parentData.photo);
          
          await fetch(`${getApiUrl()}/api/users/${data.user_id}/photo`, {
            method: 'POST',
            body: parentPhotoFormData
          });
          console.log('Uploaded parent photo');
        } catch (photoErr) {
          console.error('Failed to upload parent photo:', photoErr);
          // Don't fail the whole process for photo upload errors
        }
      }

      // Redirect to payment with order details
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else if (data.order_id) {
        // Navigate to payment page with order details
        const petName = petsData[0]?.name || '';
        const petBreed = petsData[0]?.breed || '';
        const params = new URLSearchParams({
          order_id: data.order_id,
          user_id: data.user_id,
          plan: planType,
          name: parentData.name,
          email: parentData.email,
          pet: petName,
          breed: petBreed,
        });
        navigate(`/membership/payment?${params.toString()}`);
      } else {
        // If free or already processed, go to my-pets
        navigate('/my-pets');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing - All dogs included at same price!
  const getPricing = () => {
    // Trial = 1 month (₹499 + GST) + 7 bonus days = 37 days
    // Foundation = 12 months (₹4,999 + GST) + 7 bonus days = 372 days
    // ALL DOGS INCLUDED - no additional pet pricing
    const isTrialPlan = planType === 'trial' || planType === 'monthly';
    const isFoundation = planType === 'annual' || planType === 'foundation';
    
    let basePrice = isTrialPlan ? 499 : 4999;
    let planName = isTrialPlan ? 'Trial (37 days)' : 'Foundation (372 days)';
    let validityDays = isTrialPlan ? 37 : 372; // Including 7 bonus days
    let bonusDays = 7;
    
    const subtotal = basePrice;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    
    return { basePrice, subtotal, gst, total, isTrialPlan, isFoundation, planName, validityDays, bonusDays, petCount: petsData.length };
  };

  const pricing = getPricing();

  return (
    <>
      <Helmet>
        <title>Activate Pet Pass | The Doggy Company</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950">
        {/* Decorative elements - matching landing page */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Join The Pack</span>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s 
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-8 h-1 rounded ${step > s ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
            
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-pink-500/20 text-white border-0 px-3 py-1 shadow-lg">
              {pricing.isFoundation ? '🌟 Pet Pass — Foundation' : '✨ Pet Pass — Trial'}
            </Badge>
          </div>
        </header>

        <main className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Step 1: Pet Parent Information */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                {/* Pet Parent Photo Upload */}
                <div className="relative w-28 h-28 mx-auto mb-6 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleParentPhotoUpload}
                    className="hidden"
                    id="parent-photo-upload"
                    data-testid="parent-photo-input"
                  />
                  <label 
                    htmlFor="parent-photo-upload"
                    className="cursor-pointer block"
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full animate-pulse opacity-50 blur-xl"></div>
                    
                    {/* Photo container */}
                    <div className="relative w-28 h-28 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/40 overflow-hidden transition-transform group-hover:scale-105">
                      {parentData.photoPreview ? (
                        <img 
                          src={parentData.photoPreview} 
                          alt="Pet Parent" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                      
                      {/* Camera overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </label>
                  
                  {/* Upload hint */}
                  <p className="text-xs text-pink-400 mt-2 opacity-80">
                    {parentData.photoPreview ? 'Tap to change photo' : 'Add your photo'}
                  </p>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Tell us about yourself
                </h1>
                <p className="text-slate-400">
                  We&apos;ll use this to create your Pet Parent account
                </p>
              </div>

              <Card className="p-6 md:p-8 max-w-xl mx-auto bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl">
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Pet Parent Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        value={parentData.name}
                        onChange={(e) => setParentData({...parentData, name: e.target.value})}
                        placeholder="Your name"
                        className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20 ${parentErrors.name ? 'border-red-500' : ''}`}
                        data-testid="parent-name-input"
                      />
                    </div>
                    {parentErrors.name && <p className="text-red-400 text-xs mt-1">{parentErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        type="email"
                        value={parentData.email}
                        onChange={(e) => setParentData({...parentData, email: e.target.value})}
                        placeholder="you@example.com"
                        className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20 ${parentErrors.email ? 'border-red-500' : ''}`}
                        data-testid="parent-email-input"
                      />
                    </div>
                    {parentErrors.email && <p className="text-red-400 text-xs mt-1">{parentErrors.email}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Address *
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <textarea
                        value={parentData.address}
                        onChange={(e) => setParentData({...parentData, address: e.target.value})}
                        placeholder="House/Flat No., Street, Landmark..."
                        rows={2}
                        className={`w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 ${parentErrors.address ? 'border-red-500' : ''}`}
                        data-testid="parent-address-input"
                        required
                      />
                    </div>
                    {parentErrors.address ? (
                      <p className="text-xs text-red-400 mt-1">{parentErrors.address}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Required for deliveries and service visits</p>
                    )}
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        City *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                        <Input
                          value={parentData.city}
                          onChange={(e) => {
                            setParentData({...parentData, city: e.target.value});
                            setCitySearch(e.target.value);
                            setShowCitySuggestions(true);
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                          placeholder="Select city"
                          className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.city ? 'border-red-500' : ''}`}
                          data-testid="parent-city-input"
                        />
                        {showCitySuggestions && (
                          <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredCities.length > 0 ? (
                              filteredCities.map((city) => (
                                <button
                                  key={city}
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-pink-500/20 focus:bg-pink-500/20"
                                  onMouseDown={() => {
                                    setParentData({...parentData, city});
                                    setCitySearch(city);
                                    setShowCitySuggestions(false);
                                  }}
                                >
                                  {city}
                                </button>
                              ))
                            ) : citySearch.trim().length > 0 ? (
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-pink-400 hover:bg-pink-500/20 focus:bg-pink-500/20"
                                onMouseDown={() => {
                                  setParentData({...parentData, city: citySearch.trim()});
                                  setShowCitySuggestions(false);
                                }}
                              >
                                Use "{citySearch.trim()}" as your city
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {parentErrors.city && <p className="text-red-400 text-xs mt-1">{parentErrors.city}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Pincode *
                      </label>
                      <Input
                        value={parentData.pincode}
                        onChange={(e) => setParentData({...parentData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                        placeholder="400001"
                        maxLength={6}
                        className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.pincode ? 'border-red-500' : ''}`}
                        data-testid="parent-pincode-input"
                      />
                      {parentErrors.pincode && <p className="text-red-400 text-xs mt-1">{parentErrors.pincode}</p>}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Create Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={parentData.password}
                          onChange={(e) => setParentData({...parentData, password: e.target.value})}
                          placeholder="••••••••"
                          className={`pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.password ? 'border-red-500' : ''}`}
                          data-testid="parent-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition-colors"
                          data-testid="toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {parentErrors.password && <p className="text-red-400 text-xs mt-1">{parentErrors.password}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={parentData.confirmPassword}
                          onChange={(e) => setParentData({...parentData, confirmPassword: e.target.value})}
                          placeholder="••••••••"
                          className={`pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.confirmPassword ? 'border-red-500' : ''}`}
                          data-testid="parent-confirm-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition-colors"
                          data-testid="toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {parentErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{parentErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          type="tel"
                          value={parentData.phone}
                          onChange={(e) => setParentData({...parentData, phone: e.target.value})}
                          placeholder="+91 98765 43210"
                          className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.phone ? 'border-red-500' : ''}`}
                          data-testid="parent-phone-input"
                        />
                      </div>
                      {parentErrors.phone && <p className="text-red-400 text-xs mt-1">{parentErrors.phone}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        WhatsApp Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          type="tel"
                          value={parentData.whatsapp}
                          onChange={(e) => setParentData({...parentData, whatsapp: e.target.value})}
                          placeholder="+91 98765 43210"
                          className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${parentErrors.whatsapp ? 'border-red-500' : ''}`}
                          data-testid="parent-whatsapp-input"
                        />
                      </div>
                      {parentErrors.whatsapp && <p className="text-red-400 text-xs mt-1">{parentErrors.whatsapp}</p>}
                      <button 
                        type="button"
                        onClick={() => setParentData({...parentData, whatsapp: parentData.phone})}
                        className="text-xs text-pink-400 hover:text-pink-300 mt-1"
                      >
                        Same as phone number
                      </button>
                    </div>
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Preferred Contact Method *
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { value: 'phone', label: 'Phone Call', icon: '📞' },
                        { value: 'email', label: 'Email', icon: '📧' }
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setParentData({...parentData, preferredContact: method.value})}
                          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            parentData.preferredContact === method.value
                              ? 'border-pink-500 bg-pink-500/20 text-white'
                              : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-pink-500/50'
                          }`}
                          data-testid={`contact-method-${method.value}`}
                        >
                          <span className="mr-1">{method.icon}</span> {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Notification Preferences
                    </label>
                    <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      {[
                        { key: 'orderUpdates', label: 'Order & Delivery Updates', desc: 'Status of your orders and deliveries', icon: '📦' },
                        { key: 'petReminders', label: 'Pet Care Reminders', desc: 'Vaccination, grooming & health reminders', icon: '💊' },
                        { key: 'promotions', label: 'Offers & Promotions', desc: 'Exclusive deals and member discounts', icon: '🎁' },
                        { key: 'newsletter', label: 'Monthly Newsletter', desc: 'Pet care tips and community updates', icon: '📰' }
                      ].map((notif) => (
                        <label key={notif.key} className="flex items-start gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={parentData.notifications[notif.key]}
                            onChange={(e) => setParentData({
                              ...parentData, 
                              notifications: {...parentData.notifications, [notif.key]: e.target.checked}
                            })}
                            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500/20"
                            data-testid={`notification-${notif.key}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-200">{notif.icon} {notif.label}</p>
                            <p className="text-xs text-slate-400">{notif.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Soul Whispers - Weekly WhatsApp Drip */}
                  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-4 rounded-xl border border-emerald-500/30">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.notifications.soulWhispers}
                        onChange={(e) => setParentData({
                          ...parentData, 
                          notifications: {...parentData.notifications, soulWhispers: e.target.checked}
                        })}
                        className="mt-1 w-5 h-5 rounded border-emerald-500/50 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                        data-testid="notification-soul-whispers"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">💬</span>
                          <p className="font-semibold text-emerald-300">Soul Whispers</p>
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">Recommended</Badge>
                        </div>
                        <p className="text-sm text-emerald-200/80 mt-1">
                          Weekly WhatsApp messages with one gentle question about your pet. 
                          Helps us understand your furry friend better over time.
                        </p>
                        <p className="text-xs text-emerald-400/70 mt-2 italic">
                          "Quick questions, deep understanding. No spam, just love."
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.acceptTerms}
                        onChange={(e) => setParentData({...parentData, acceptTerms: e.target.checked})}
                        className={`mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500/20 ${parentErrors.acceptTerms ? 'border-red-500' : ''}`}
                        data-testid="accept-terms"
                      />
                      <div>
                        <p className="text-sm text-slate-300">
                          I agree to the <a href="/terms" target="_blank" className="text-pink-400 hover:underline">Terms & Conditions</a> *
                        </p>
                        {parentErrors.acceptTerms && <p className="text-red-400 text-xs">{parentErrors.acceptTerms}</p>}
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.acceptPrivacy}
                        onChange={(e) => setParentData({...parentData, acceptPrivacy: e.target.checked})}
                        className={`mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500/20 ${parentErrors.acceptPrivacy ? 'border-red-500' : ''}`}
                        data-testid="accept-privacy"
                      />
                      <div>
                        <p className="text-sm text-slate-300">
                          I agree to the <a href="/privacy" target="_blank" className="text-pink-400 hover:underline">Privacy Policy</a> *
                        </p>
                        {parentErrors.acceptPrivacy && <p className="text-red-400 text-xs">{parentErrors.acceptPrivacy}</p>}
                      </div>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 h-12 shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02] text-white font-semibold"
                  data-testid="parent-next-btn"
                >
                  Continue to Add Your Dog
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </div>
          )}

          {/* Step 2: Pet Information */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                {/* Soul Orb for Pet */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full animate-pulse opacity-50 blur-xl"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/40">
                    <Dog className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  About Your Pet{petsData.length > 1 ? 's' : ''}
                </h1>
                <p className="text-slate-400">
                  Help us get to know your furry family member
                </p>
              </div>

              {/* Pet Tabs - Always show add button */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {petsData.map((pet, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePetTab(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      activePetTab === idx
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {pet.photo_preview ? (
                      <img src={pet.photo_preview} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <PawPrint className="w-4 h-4" />
                    )}
                    {pet.name || `Dog ${idx + 1}`}
                    {petsData.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePet(idx);
                        }}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                ))}
                {/* Always show Add Dog button - supporting 1-15+ pets */}
                <button
                  onClick={addPet}
                  className="flex items-center gap-1 px-4 py-2 rounded-full border-2 border-dashed border-pink-500/50 text-pink-400 hover:bg-pink-500/10 whitespace-nowrap"
                  data-testid="add-more-dogs-btn"
                >
                  <Plus className="w-4 h-4" />
                  {petsData.length === 0 ? 'Add Your Dog' : 'Add Another Dog'}
                </button>
              </div>

              <Card className="p-6 md:p-8 max-w-xl mx-auto bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl">
                {petsData.map((pet, idx) => (
                  <div key={idx} className={activePetTab === idx ? 'block' : 'hidden'}>
                    <div className="space-y-5">
                      {/* Photo Upload - More Prominent */}
                      <div className="text-center mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Upload Photo *
                        </label>
                        <div className="flex justify-center">
                          <div className="relative group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePetPhotoSelect(idx, e)}
                              className="hidden"
                              id={`pet-photo-${idx}`}
                              data-testid={`pet-${idx}-photo-input`}
                            />
                            <label
                              htmlFor={`pet-photo-${idx}`}
                              className="cursor-pointer block"
                            >
                              <div className={`w-32 h-32 rounded-full border-3 border-dashed flex items-center justify-center overflow-hidden transition-all group-hover:shadow-lg ${
                                pet.photo_preview || pet.photo_url 
                                  ? 'border-pink-500 bg-slate-800' 
                                  : 'border-pink-500/50 bg-slate-800/50 hover:border-pink-500 group-hover:shadow-pink-500/20'
                              }`}>
                                {pet.photo_preview || pet.photo_url ? (
                                  <img 
                                    src={pet.photo_preview || getPetPhotoUrl(pet)} 
                                    alt="Pet" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-center p-2">
                                    <Camera className="w-10 h-10 text-pink-400 mx-auto mb-1" />
                                    <span className="text-xs text-pink-400 font-medium">Tap to Upload</span>
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity">
                                <Plus className="w-6 h-6" />
                              </div>
                            </label>
                            {(pet.photo_preview || pet.photo_url) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePetData(idx, 'photo_preview', null);
                                  updatePetData(idx, 'photo_url', '');
                                  updatePetData(idx, 'photo_file', null);
                                }}
                                className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">A clear photo helps us personalize your experience</p>
                      </div>

                      {/* Pet Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Dog&apos;s Name *
                        </label>
                        <div className="relative">
                          <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <Input
                            value={pet.name}
                            onChange={(e) => updatePetData(idx, 'name', e.target.value)}
                            placeholder="What do you call them?"
                            className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 ${petErrors[idx]?.name ? 'border-red-500' : ''}`}
                            data-testid={`pet-${idx}-name-input`}
                          />
                        </div>
                        {petErrors[idx]?.name && <p className="text-red-400 text-xs mt-1">{petErrors[idx].name}</p>}
                      </div>

                      {/* Breed */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Breed *
                        </label>
                        <BreedAutocomplete
                          value={pet.breed}
                          onChange={(e) => updatePetData(idx, 'breed', e.target.value)}
                          placeholder="e.g., Golden Retriever, Indie Mix"
                          name={`breed-${idx}`}
                          className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${petErrors[idx]?.breed ? 'border-red-500' : ''}`}
                        />
                        {petErrors[idx]?.breed && <p className="text-red-400 text-xs mt-1">{petErrors[idx].breed}</p>}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                        <div className="flex gap-3">
                          {['male', 'female'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => updatePetData(idx, 'gender', g)}
                              className={`flex-1 p-3 rounded-xl border-2 capitalize transition-all font-medium ${
                                pet.gender === g
                                  ? 'border-pink-500 bg-pink-500/20 text-white'
                                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-pink-500/50'
                              }`}
                            >
                              {g === 'male' ? '♂️' : '♀️'} {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            <Calendar className="w-4 h-4 inline mr-1" /> Birth Date
                          </label>
                          <Input
                            type="date"
                            value={pet.birth_date}
                            onChange={(e) => updatePetData(idx, 'birth_date', e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white focus:border-pink-500"
                            data-testid={`pet-${idx}-birth-date`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            <Heart className="w-4 h-4 inline mr-1" /> Gotcha Day
                          </label>
                          <Input
                            type="date"
                            value={pet.gotcha_date}
                            onChange={(e) => updatePetData(idx, 'gotcha_date', e.target.value)}
                            className="bg-slate-800/50 border-slate-700 text-white focus:border-pink-500"
                            data-testid={`pet-${idx}-gotcha-date`}
                          />
                        </div>
                      </div>
                      {petErrors[idx]?.dates && <p className="text-red-400 text-xs">{petErrors[idx].dates}</p>}

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          <Scale className="w-4 h-4 inline mr-1" /> Weight (Optional)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={pet.weight}
                            onChange={(e) => updatePetData(idx, 'weight', e.target.value)}
                            placeholder="Current weight"
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500"
                            data-testid={`pet-${idx}-weight`}
                          />
                          <select
                            value={pet.weight_unit}
                            onChange={(e) => updatePetData(idx, 'weight_unit', e.target.value)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:border-pink-500"
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>

                      {/* Neutered */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Neutered/Spayed?</label>
                        <div className="flex gap-3">
                          {[
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' },
                            { value: null, label: 'Not sure' }
                          ].map((opt) => (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() => updatePetData(idx, 'is_neutered', opt.value)}
                              className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                pet.is_neutered === opt.value
                                  ? 'border-pink-500 bg-pink-500/20 text-white'
                                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-pink-500/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Another Dog - Always visible, more prominent */}
                <div className="mt-6 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <Dog className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Have more dogs?</p>
                        <p className="text-sm text-pink-300">
                          {petsData.length === 1 
                            ? 'Add them now — same price for the whole pack!' 
                            : `${petsData.length} dogs added — all included!`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addPet}
                      variant="outline"
                      className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500"
                      data-testid="add-another-dog-btn"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Dog
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/30"
                    data-testid="pet-next-btn"
                  >
                    Select Celebrations
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Celebrations Selection */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                {/* Soul Orb for Celebrations */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full animate-pulse opacity-50 blur-xl"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/40">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  What would you like to celebrate?
                </h1>
                <p className="text-slate-400">
                  Select the occasions you want us to remember for each pet
                </p>
              </div>

              <Card className="p-6 md:p-8 max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl">
                {petsData.map((pet, petIdx) => (
                  <div key={petIdx} className={petIdx > 0 ? 'mt-8 pt-8 border-t border-slate-700' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/30">
                        {pet.photo_preview ? (
                          <img src={pet.photo_preview} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <PawPrint className="w-6 h-6 text-pink-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{pet.name || `Dog ${petIdx + 1}`}</h3>
                        <p className="text-sm text-slate-400">Select celebrations to track</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CELEBRATION_TYPES.map((celebration) => {
                        const isSelected = (pet.celebrations || []).includes(celebration.id);
                        return (
                          <button
                            key={celebration.id}
                            type="button"
                            onClick={() => toggleCelebration(petIdx, celebration.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                                : 'border-slate-700 bg-slate-800/50 hover:border-pink-500/50 hover:bg-slate-700/50'
                            }`}
                            data-testid={`celebration-${celebration.id}-pet-${petIdx}`}
                          >
                            <div className="text-2xl mb-2">{celebration.emoji}</div>
                            <p className="font-medium text-sm text-white">{celebration.name}</p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{celebration.description}</p>
                            {isSelected && (
                              <div className="mt-2">
                                <Check className="w-5 h-5 text-pink-400" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick select all important ones */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const importantOnes = ['birthday', 'gotcha_day', 'vaccination'];
                          const newPets = [...petsData];
                          newPets[petIdx].celebrations = importantOnes;
                          setPetsData(newPets);
                        }}
                        className="text-pink-400 border-pink-500/50 hover:bg-pink-500/20"
                      >
                        Select Essentials
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPets = [...petsData];
                          newPets[petIdx].celebrations = CELEBRATION_TYPES.map(c => c.id);
                          setPetsData(newPets);
                        }}
                        className="text-purple-400 border-purple-500/50 hover:bg-purple-500/20"
                      >
                        Select All
                      </Button>
                      {(pet.celebrations || []).length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newPets = [...petsData];
                            newPets[petIdx].celebrations = [];
                            setPetsData(newPets);
                          }}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Info Card */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Why select celebrations?</p>
                      <p className="text-sm text-slate-300">
                        We&apos;ll send you timely reminders, special offers, and curated gift suggestions for each occasion. Never miss an important moment!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/30"
                    data-testid="celebrations-next-btn"
                  >
                    Review & Pay
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Review & Pay */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                {/* Soul Orb for Review */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full animate-pulse opacity-50 blur-xl"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Review & Complete
                </h1>
                <p className="text-slate-400">
                  Almost there! Review your details and complete payment
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Summary Card */}
                <Card className="p-6 bg-slate-900/60 backdrop-blur-md border border-white/10">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-pink-400" />
                    Pet Parent
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300"><span className="text-slate-500">Name:</span> {parentData.name}</p>
                    <p className="text-slate-300"><span className="text-slate-500">Email:</span> {parentData.email}</p>
                    <p className="text-slate-300"><span className="text-slate-500">WhatsApp:</span> {parentData.whatsapp}</p>
                    <p className="text-slate-300"><span className="text-slate-500">City:</span> {parentData.city} - {parentData.pincode}</p>
                  </div>

                  <hr className="my-4 border-slate-700" />

                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-pink-400" />
                    Your Dog{petsData.length > 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-3">
                    {petsData.map((pet, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="font-medium text-white">{pet.name}</p>
                        <p className="text-sm text-slate-400">{pet.breed} • {pet.gender || 'Gender not specified'}</p>
                        {/* Show selected celebrations */}
                        {(pet.celebrations || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(pet.celebrations || []).map(celebId => {
                              const celeb = CELEBRATION_TYPES.find(c => c.id === celebId);
                              return celeb ? (
                                <span key={celebId} className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                                  {celeb.emoji} {celeb.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    className="mt-4 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                  >
                    Edit Details
                  </Button>
                </Card>

                {/* Pricing Card */}
                <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-500/30">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Choose Your Pet Pass
                  </h3>

                  {/* 7 Bonus Days Offer Banner */}
                  <div className="mb-6 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 text-center">
                    <p className="text-amber-300 font-semibold">
                      🎁 Get <span className="text-amber-400">7 Bonus Days FREE</span> with your Pet Pass!
                    </p>
                  </div>
                  
                  {/* Plan Selection */}
                  <div className="space-y-3 mb-6">
                    {/* Monthly Trial Option */}
                    <button
                      type="button"
                      onClick={() => setPlanType('trial')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        pricing.isTrialPlan
                          ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/20'
                          : 'border-slate-600 bg-slate-800/50 hover:border-pink-500/50'
                      }`}
                      data-testid="plan-trial-btn"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">Pet Pass Trial</p>
                          <p className="text-sm text-slate-400">30 days + 7 bonus = <span className="text-emerald-400 font-semibold">37 days</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">₹499</p>
                          <p className="text-xs text-slate-400">+ ₹90 GST</p>
                        </div>
                      </div>
                      {pricing.isTrialPlan && (
                        <div className="mt-2 flex items-center gap-1 text-pink-400 text-sm">
                          <Check className="w-4 h-4" /> Selected
                        </div>
                      )}
                    </button>

                    {/* Annual Foundation Option */}
                    <button
                      type="button"
                      onClick={() => setPlanType('annual')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                        pricing.isFounder
                          ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/20'
                          : 'border-slate-600 bg-slate-800/50 hover:border-pink-500/50'
                      }`}
                      data-testid="plan-founder-btn"
                    >
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                        Best Value
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">Pet Pass Founder</p>
                          <p className="text-sm text-slate-400">365 days + 7 bonus = <span className="text-emerald-400 font-semibold">372 days</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">₹4,999</p>
                          <p className="text-xs text-slate-400">+ ₹900 GST</p>
                        </div>
                      </div>
                      <p className="text-emerald-400 text-xs mt-1 font-semibold">Save ₹989/year vs monthly</p>
                      {pricing.isFounder && (
                        <div className="mt-2 flex items-center gap-1 text-pink-400 text-sm">
                          <Check className="w-4 h-4" /> Selected
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 text-sm p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-300">
                        Pet Pass — {pricing.planName}
                      </span>
                      <span className="text-white">₹{pricing.basePrice.toLocaleString()}</span>
                    </div>
                    
                    {/* Bonus Days */}
                    <div className="flex justify-between">
                      <span className="text-emerald-400">
                        +{pricing.bonusDays} Bonus Days
                      </span>
                      <span className="text-emerald-400">FREE</span>
                    </div>
                    
                    {petsData.length > 1 && (
                      <div className="flex justify-between">
                        <span className="text-emerald-400">
                          + {petsData.length - 1} more dog{petsData.length > 2 ? 's' : ''} (Included!)
                        </span>
                        <span className="text-emerald-400">₹0</span>
                      </div>
                    )}
                    
                    <hr className="border-slate-600" />
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white">₹{pricing.subtotal.toLocaleString()}</span>
                    </div>
                    
                    {/* GST Breakdown - CGST + SGST */}
                    <div className="flex justify-between">
                      <span className="text-slate-400">CGST (9%)</span>
                      <span className="text-white">₹{Math.round(pricing.gst / 2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SGST (9%)</span>
                      <span className="text-white">₹{Math.round(pricing.gst / 2).toLocaleString()}</span>
                    </div>
                    
                    <hr className="border-slate-600" />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-pink-400">₹{pricing.total.toLocaleString()}</span>
                    </div>
                  </div>
                  }

                  {/* What's Included */}
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs font-medium text-slate-400 mb-2">YOUR PET PASS INCLUDES</p>
                    <div className="space-y-2 text-sm">
                      {['Unique Pet Pass number per pet', 'All 14 pillars unlocked', 'Pet Soul™ profile', 'Mira AI Concierge®', 'Health Vault', 'Priority support'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  {/* PWA Install & Push Notifications Section */}
                  <div className="mt-6 space-y-4">
                    {/* Soul Whisper Info */}
                    {parentData.notifications.soulWhispers && (
                      <div className="p-4 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl border border-emerald-500/30">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">💬</span>
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-300">Soul Whisper™ Enabled</p>
                            <p className="text-sm text-emerald-200/80">
                              We'll send you weekly WhatsApp messages with gentle questions to understand your pet better.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Push Notifications Reminder */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🔔</span>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-300">Enable Notifications</p>
                          <p className="text-sm text-blue-200/80">
                            After signup, enable push notifications to get order updates, pet care reminders, and exclusive offers.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PWA Install Prompt */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📱</span>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-300">Add to Home Screen</p>
                          <p className="text-sm text-purple-200/80">
                            Install The Doggy Company app on your phone for instant access. Look for "Add to Home Screen" in your browser menu after signup.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      disabled={loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-pink-500/30 text-white font-semibold shadow-lg"
                      data-testid="complete-payment-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ₹{pricing.total.toLocaleString()} — Activate Pet Pass
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Skip Payment for Demo Mode */}
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/my-pets')}
                      className="text-sm text-slate-400 hover:text-pink-400 underline"
                      data-testid="skip-payment-btn"
                    >
                      Skip Payment (Demo Mode)
                    </button>
                  </div>
                  
                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MembershipOnboarding;
