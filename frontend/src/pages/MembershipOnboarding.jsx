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
  Dog, Sparkles, Crown, ArrowRight, CreditCard, Loader2, Gift
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
  const planType = searchParams.get('plan') || 'annual';
  const petCount = parseInt(searchParams.get('pets') || '1', 10);
  
  const [step, setStep] = useState(1); // 1: Parent Info, 2: Pet Info, 3: Celebrations, 4: Review & Pay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePetTab, setActivePetTab] = useState(0);
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create membership');
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

      // Redirect to payment with order details
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else if (data.order_id) {
        // Navigate to payment page with order details
        navigate(`/membership/payment?order_id=${data.order_id}&user_id=${data.user_id}`);
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

  // Calculate pricing - Updated for Pet Pass (Trial vs Annual)
  const getPricing = () => {
    // Trial = 1 month (₹499), Annual = 12 months (₹4,999)
    const isTrialPlan = planType === 'trial' || planType === 'monthly';
    const basePrice = isTrialPlan ? 499 : 4999;
    const additionalPetPrice = isTrialPlan ? 249 : 2499;
    const additionalPets = Math.max(0, petsData.length - 1);
    const subtotal = basePrice + (additionalPets * additionalPetPrice);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    
    return { basePrice, additionalPetPrice, additionalPets, subtotal, gst, total, isTrialPlan };
  };

  const pricing = getPricing();

  return (
    <>
      <Helmet>
        <title>Activate Pet Pass | The Doggy Company</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-100">
        {/* Decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Join The Pack</span>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s 
                      ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-200' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-8 h-1 rounded ${step > s ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            
            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 px-3 py-1">
              {planType === 'annual' ? '🌟 Pet Pass — Foundation' : '✨ Pet Pass — Trial'}
            </Badge>
          </div>
        </header>

        <main className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Step 1: Pet Parent Information */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-200/50">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Tell us about yourself
                </h1>
                <p className="text-gray-500">
                  We&apos;ll use this to create your Pet Parent account
                </p>
              </div>

              <Card className="p-6 md:p-8 max-w-xl mx-auto bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pet Parent Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={parentData.name}
                        onChange={(e) => setParentData({...parentData, name: e.target.value})}
                        placeholder="Your name"
                        className={`pl-10 ${parentErrors.name ? 'border-red-500' : ''}`}
                        data-testid="parent-name-input"
                      />
                    </div>
                    {parentErrors.name && <p className="text-red-500 text-xs mt-1">{parentErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        value={parentData.email}
                        onChange={(e) => setParentData({...parentData, email: e.target.value})}
                        placeholder="you@example.com"
                        className={`pl-10 ${parentErrors.email ? 'border-red-500' : ''}`}
                        data-testid="parent-email-input"
                      />
                    </div>
                    {parentErrors.email && <p className="text-red-500 text-xs mt-1">{parentErrors.email}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address *
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={parentData.address}
                        onChange={(e) => setParentData({...parentData, address: e.target.value})}
                        placeholder="House/Flat No., Street, Landmark..."
                        rows={2}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${parentErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                        data-testid="parent-address-input"
                        required
                      />
                    </div>
                    {parentErrors.address ? (
                      <p className="text-xs text-red-500 mt-1">{parentErrors.address}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Required for deliveries and service visits</p>
                    )}
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        City *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
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
                          className={`pl-10 ${parentErrors.city ? 'border-red-500' : ''}`}
                          data-testid="parent-city-input"
                        />
                        {showCitySuggestions && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredCities.length > 0 ? (
                              filteredCities.map((city) => (
                                <button
                                  key={city}
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 focus:bg-purple-50"
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
                                className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 focus:bg-purple-50 text-purple-600"
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
                      {parentErrors.city && <p className="text-red-500 text-xs mt-1">{parentErrors.city}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Pincode *
                      </label>
                      <Input
                        value={parentData.pincode}
                        onChange={(e) => setParentData({...parentData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                        placeholder="400001"
                        maxLength={6}
                        className={parentErrors.pincode ? 'border-red-500' : ''}
                        data-testid="parent-pincode-input"
                      />
                      {parentErrors.pincode && <p className="text-red-500 text-xs mt-1">{parentErrors.pincode}</p>}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Create Password *
                      </label>
                      <Input
                        type="password"
                        value={parentData.password}
                        onChange={(e) => setParentData({...parentData, password: e.target.value})}
                        placeholder="••••••••"
                        className={parentErrors.password ? 'border-red-500' : ''}
                        data-testid="parent-password-input"
                      />
                      {parentErrors.password && <p className="text-red-500 text-xs mt-1">{parentErrors.password}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm Password *
                      </label>
                      <Input
                        type="password"
                        value={parentData.confirmPassword}
                        onChange={(e) => setParentData({...parentData, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        className={parentErrors.confirmPassword ? 'border-red-500' : ''}
                        data-testid="parent-confirm-password-input"
                      />
                      {parentErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{parentErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="tel"
                          value={parentData.phone}
                          onChange={(e) => setParentData({...parentData, phone: e.target.value})}
                          placeholder="+91 98765 43210"
                          className={`pl-10 ${parentErrors.phone ? 'border-red-500' : ''}`}
                          data-testid="parent-phone-input"
                        />
                      </div>
                      {parentErrors.phone && <p className="text-red-500 text-xs mt-1">{parentErrors.phone}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        WhatsApp Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="tel"
                          value={parentData.whatsapp}
                          onChange={(e) => setParentData({...parentData, whatsapp: e.target.value})}
                          placeholder="+91 98765 43210"
                          className={`pl-10 ${parentErrors.whatsapp ? 'border-red-500' : ''}`}
                          data-testid="parent-whatsapp-input"
                        />
                      </div>
                      {parentErrors.whatsapp && <p className="text-red-500 text-xs mt-1">{parentErrors.whatsapp}</p>}
                      <button 
                        type="button"
                        onClick={() => setParentData({...parentData, whatsapp: parentData.phone})}
                        className="text-xs text-purple-600 hover:text-purple-700 mt-1"
                      >
                        Same as phone number
                      </button>
                    </div>
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className={`flex-1 p-3 rounded-xl border-2 text-sm transition-all ${
                            parentData.preferredContact === method.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Notification Preferences
                    </label>
                    <div className="space-y-3 bg-gradient-to-br from-orange-50 to-pink-50 p-4 rounded-xl border border-orange-100">
                      {[
                        { key: 'orderUpdates', label: 'Order & Delivery Updates', desc: 'Status of your orders and deliveries', icon: '📦' },
                        { key: 'petReminders', label: 'Pet Care Reminders', desc: 'Vaccination, grooming & health reminders', icon: '💊' },
                        { key: 'promotions', label: 'Offers & Promotions', desc: 'Exclusive deals and member discounts', icon: '🎁' },
                        { key: 'newsletter', label: 'Monthly Newsletter', desc: 'Pet care tips and community updates', icon: '📰' }
                      ].map((notif) => (
                        <label key={notif.key} className="flex items-start gap-3 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={parentData.notifications[notif.key]}
                            onChange={(e) => setParentData({
                              ...parentData, 
                              notifications: {...parentData.notifications, [notif.key]: e.target.checked}
                            })}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            data-testid={`notification-${notif.key}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{notif.icon} {notif.label}</p>
                            <p className="text-xs text-gray-500">{notif.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Soul Whispers - Weekly WhatsApp Drip */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.notifications.soulWhispers}
                        onChange={(e) => setParentData({
                          ...parentData, 
                          notifications: {...parentData.notifications, soulWhispers: e.target.checked}
                        })}
                        className="mt-1 w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                        data-testid="notification-soul-whispers"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <p className="font-semibold text-green-800">Soul Whispers</p>
                          <Badge className="bg-green-100 text-green-700 text-xs">Recommended</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Weekly WhatsApp messages with one gentle question about your pet. 
                          Helps us understand your furry friend better over time.
                        </p>
                        <p className="text-xs text-green-600 mt-2 italic">
                          "Quick questions, deep understanding. No spam, just love."
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-3 pt-4 border-t">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.acceptTerms}
                        onChange={(e) => setParentData({...parentData, acceptTerms: e.target.checked})}
                        className={`mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${parentErrors.acceptTerms ? 'border-red-500' : ''}`}
                        data-testid="accept-terms"
                      />
                      <div>
                        <p className="text-sm text-gray-700">
                          I agree to the <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms & Conditions</a> *
                        </p>
                        {parentErrors.acceptTerms && <p className="text-red-500 text-xs">{parentErrors.acceptTerms}</p>}
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentData.acceptPrivacy}
                        onChange={(e) => setParentData({...parentData, acceptPrivacy: e.target.checked})}
                        className={`mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${parentErrors.acceptPrivacy ? 'border-red-500' : ''}`}
                        data-testid="accept-privacy"
                      />
                      <div>
                        <p className="text-sm text-gray-700">
                          I agree to the <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">Privacy Policy</a> *
                        </p>
                        {parentErrors.acceptPrivacy && <p className="text-red-500 text-xs">{parentErrors.acceptPrivacy}</p>}
                      </div>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 h-12 shadow-lg shadow-orange-200/50 transition-all hover:scale-[1.02]"
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
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dog className="w-8 h-8 text-pink-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Tell us about your dog{petsData.length > 1 ? 's' : ''}
                </h1>
                <p className="text-gray-500">
                  This helps us personalize everything for them
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
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <PawPrint className="w-4 h-4" />
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
                  className="flex items-center gap-1 px-4 py-2 rounded-full border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 whitespace-nowrap"
                  data-testid="add-more-dogs-btn"
                >
                  <Plus className="w-4 h-4" />
                  {petsData.length === 0 ? 'Add Your Dog' : 'Add Another Dog'}
                </button>
              </div>

              <Card className="p-6 md:p-8 max-w-xl mx-auto">
                {petsData.map((pet, idx) => (
                  <div key={idx} className={activePetTab === idx ? 'block' : 'hidden'}>
                    <div className="space-y-5">
                      {/* Photo Upload */}
                      <div className="flex justify-center mb-4">
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
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border-3 border-dashed border-purple-300 flex items-center justify-center overflow-hidden hover:border-purple-500 transition-colors group-hover:shadow-lg">
                              {pet.photo_preview || pet.photo_url ? (
                                <img 
                                  src={pet.photo_preview || getPetPhotoUrl(pet)} 
                                  alt="Pet" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-8 h-8 text-purple-400 mx-auto" />
                                  <span className="text-xs text-purple-500 mt-1 block">Add Photo</span>
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-700 transition-colors">
                              <Plus className="w-5 h-5" />
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
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pet Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Dog&apos;s Name *
                        </label>
                        <div className="relative">
                          <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            value={pet.name}
                            onChange={(e) => updatePetData(idx, 'name', e.target.value)}
                            placeholder="What do you call them?"
                            className={`pl-10 ${petErrors[idx]?.name ? 'border-red-500' : ''}`}
                            data-testid={`pet-${idx}-name-input`}
                          />
                        </div>
                        {petErrors[idx]?.name && <p className="text-red-500 text-xs mt-1">{petErrors[idx].name}</p>}
                      </div>

                      {/* Breed */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Breed *
                        </label>
                        <BreedAutocomplete
                          value={pet.breed}
                          onChange={(e) => updatePetData(idx, 'breed', e.target.value)}
                          placeholder="e.g., Golden Retriever, Indie Mix"
                          name={`breed-${idx}`}
                          className={petErrors[idx]?.breed ? 'border-red-500' : ''}
                        />
                        {petErrors[idx]?.breed && <p className="text-red-500 text-xs mt-1">{petErrors[idx].breed}</p>}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <div className="flex gap-3">
                          {['male', 'female'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => updatePetData(idx, 'gender', g)}
                              className={`flex-1 p-3 rounded-xl border-2 capitalize transition-all ${
                                pet.gender === g
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
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
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline mr-1" /> Birth Date
                          </label>
                          <Input
                            type="date"
                            value={pet.birth_date}
                            onChange={(e) => updatePetData(idx, 'birth_date', e.target.value)}
                            data-testid={`pet-${idx}-birth-date`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Heart className="w-4 h-4 inline mr-1" /> Gotcha Day
                          </label>
                          <Input
                            type="date"
                            value={pet.gotcha_date}
                            onChange={(e) => updatePetData(idx, 'gotcha_date', e.target.value)}
                            data-testid={`pet-${idx}-gotcha-date`}
                          />
                        </div>
                      </div>
                      {petErrors[idx]?.dates && <p className="text-red-500 text-xs">{petErrors[idx].dates}</p>}

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <Scale className="w-4 h-4 inline mr-1" /> Weight (Optional)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={pet.weight}
                            onChange={(e) => updatePetData(idx, 'weight', e.target.value)}
                            placeholder="Current weight"
                            className="flex-1"
                            data-testid={`pet-${idx}-weight`}
                          />
                          <select
                            value={pet.weight_unit}
                            onChange={(e) => updatePetData(idx, 'weight_unit', e.target.value)}
                            className="px-3 py-2 border rounded-md"
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>

                      {/* Neutered */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Neutered/Spayed?</label>
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
                              className={`flex-1 p-2 rounded-lg border-2 text-sm transition-all ${
                                pet.is_neutered === opt.value
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
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
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Dog className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">Have more dogs?</p>
                        <p className="text-sm text-purple-600">
                          {petsData.length === 1 
                            ? 'Add them now to get family pricing!' 
                            : `${petsData.length} dogs added • ₹${pricing.additionalPetPrice}/dog extra`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addPet}
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-100"
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
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-200/50">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  What would you like to celebrate?
                </h1>
                <p className="text-gray-500">
                  Select the occasions you want us to remember for each pet
                </p>
              </div>

              <Card className="p-6 md:p-8 max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-xl border-0">
                {petsData.map((pet, petIdx) => (
                  <div key={petIdx} className={petIdx > 0 ? 'mt-8 pt-8 border-t border-gray-200' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
                        {pet.photo_preview ? (
                          <img src={pet.photo_preview} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <PawPrint className="w-6 h-6 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{pet.name || `Dog ${petIdx + 1}`}</h3>
                        <p className="text-sm text-gray-500">Select celebrations to track</p>
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
                                ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-pink-50 shadow-md'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                            }`}
                            data-testid={`celebration-${celebration.id}-pet-${petIdx}`}
                          >
                            <div className="text-2xl mb-2">{celebration.emoji}</div>
                            <p className="font-medium text-sm text-gray-900">{celebration.name}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{celebration.description}</p>
                            {isSelected && (
                              <div className="mt-2">
                                <Check className="w-5 h-5 text-orange-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick select all important ones */}
                    <div className="mt-4 flex gap-2">
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
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
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
                        className="text-pink-600 border-pink-300 hover:bg-pink-50"
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
                          className="text-gray-500"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Info Card */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-800">Why select celebrations?</p>
                      <p className="text-sm text-purple-600">
                        We&apos;ll send you timely reminders, special offers, and curated gift suggestions for each occasion. Never miss an important moment!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Review & Complete
                </h1>
                <p className="text-gray-500">
                  Almost there! Review your details and complete payment
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Summary Card */}
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Pet Parent
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {parentData.name}</p>
                    <p><span className="text-gray-500">Email:</span> {parentData.email}</p>
                    <p><span className="text-gray-500">WhatsApp:</span> {parentData.whatsapp}</p>
                    <p><span className="text-gray-500">City:</span> {parentData.city} - {parentData.pincode}</p>
                  </div>

                  <hr className="my-4" />

                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-pink-600" />
                    Your Dog{petsData.length > 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-3">
                    {petsData.map((pet, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed} • {pet.gender || 'Gender not specified'}</p>
                        {/* Show selected celebrations */}
                        {(pet.celebrations || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(pet.celebrations || []).map(celebId => {
                              const celeb = CELEBRATION_TYPES.find(c => c.id === celebId);
                              return celeb ? (
                                <span key={celebId} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
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
                    className="mt-4 text-purple-600"
                  >
                    Edit Details
                  </Button>
                </Card>

                {/* Pricing Card */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Pet Pass Summary
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Pet Pass — {pricing.isTrialPlan ? 'Trial (1 month)' : 'Foundation (12 months)'} (1 pet)
                      </span>
                      <span>₹{pricing.basePrice}</span>
                    </div>
                    
                    {pricing.additionalPets > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Additional Pet Pass ({pricing.additionalPets} × ₹{pricing.additionalPetPrice})
                        </span>
                        <span>₹{pricing.additionalPets * pricing.additionalPetPrice}</span>
                      </div>
                    )}
                    
                    <hr />
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{pricing.subtotal}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (18%)</span>
                      <span>₹{pricing.gst}</span>
                    </div>
                    
                    <hr />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-purple-600">₹{pricing.total}</span>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="mt-6 p-4 bg-white/60 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">YOUR PET PASS INCLUDES</p>
                    <div className="space-y-2 text-sm">
                      {['Unique Pet Pass number per pet', 'All 14 pillars unlocked', 'Pet Soul™ profile', 'Mira AI concierge', 'Health Vault', 'Priority support'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* PWA Install & Push Notifications Section */}
                  <div className="mt-6 space-y-4">
                    {/* Soul Whisper Info */}
                    {parentData.notifications.soulWhispers && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">💬</span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">Soul Whisper™ Enabled</p>
                            <p className="text-sm text-green-600">
                              We'll send you weekly WhatsApp messages with gentle questions to understand your pet better.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Push Notifications Reminder */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🔔</span>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">Enable Notifications</p>
                          <p className="text-sm text-blue-600">
                            After signup, enable push notifications to get order updates, pet care reminders, and exclusive offers.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PWA Install Prompt */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📱</span>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-800">Add to Home Screen</p>
                          <p className="text-sm text-purple-600">
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
                      className="flex-1"
                      disabled={loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      data-testid="complete-payment-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Activate Pet Pass — ₹{pricing.total}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
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
