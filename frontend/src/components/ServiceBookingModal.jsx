/**
 * ServiceBookingModal - Unified Service Booking System
 * Handles bookings for: Grooming, Vets, Training, Walking, etc.
 * Creates tickets in Service Desk for tracking
 */

import React, { useState, useEffect } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import {
  Calendar, Clock, MapPin, User, Phone, PawPrint,
  Scissors, Stethoscope, GraduationCap, Heart, Home,
  Building2, CheckCircle, Loader2, AlertCircle, ChevronRight,
  Dog, Mail, MessageCircle, Sparkles
} from 'lucide-react';

// Service types configuration
const SERVICE_TYPES = {
  grooming: {
    name: 'Grooming',
    icon: Scissors,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    pillar: 'care',
    subServices: [
      { id: 'full-groom', name: 'Full Grooming', duration: '2-3 hours', price: '₹1,500 - ₹3,000' },
      { id: 'bath-brush', name: 'Bath & Brush', duration: '1-2 hours', price: '₹800 - ₹1,500' },
      { id: 'nail-trim', name: 'Nail Trimming', duration: '30 mins', price: '₹300 - ₹500' },
      { id: 'spa-package', name: 'Spa Package', duration: '3-4 hours', price: '₹2,500 - ₹4,000' }
    ]
  },
  vet: {
    name: 'Vet Consultation',
    icon: Stethoscope,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    pillar: 'care',
    subServices: [
      { id: 'general-checkup', name: 'General Checkup', duration: '30-45 mins', price: '₹500 - ₹1,000' },
      { id: 'vaccination', name: 'Vaccination', duration: '15-30 mins', price: '₹300 - ₹800' },
      { id: 'specialist', name: 'Specialist Consultation', duration: '45-60 mins', price: '₹1,500 - ₹3,000' },
      { id: 'home-visit', name: 'Home Visit', duration: '1 hour', price: '₹2,000 - ₹3,500' }
    ]
  },
  training: {
    name: 'Training',
    icon: GraduationCap,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    pillar: 'learn',
    subServices: [
      { id: 'basic-obedience', name: 'Basic Obedience', duration: '1 hour/session', price: '₹800 - ₹1,200' },
      { id: 'puppy-training', name: 'Puppy Training', duration: '45 mins/session', price: '₹600 - ₹1,000' },
      { id: 'behavior-correction', name: 'Behavior Correction', duration: '1-2 hours', price: '₹1,500 - ₹2,500' },
      { id: 'agility', name: 'Agility Training', duration: '1 hour/session', price: '₹1,000 - ₹1,500' }
    ]
  },
  walking: {
    name: 'Dog Walking',
    icon: Dog,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    pillar: 'care',
    subServices: [
      { id: 'daily-walk', name: 'Daily Walk', duration: '30-45 mins', price: '₹200 - ₹400/walk' },
      { id: 'extended-walk', name: 'Extended Walk', duration: '1-2 hours', price: '₹500 - ₹800/walk' },
      { id: 'group-walk', name: 'Group Walk', duration: '45 mins', price: '₹150 - ₹300/walk' },
      { id: 'monthly-package', name: 'Monthly Package (20 walks)', duration: 'Flexible', price: '₹3,500 - ₹6,000' }
    ]
  }
};

// Time slots
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
];

const ServiceBookingModal = ({ 
  isOpen, 
  onClose, 
  serviceType = 'grooming',
  preselectedService = null,
  onBookingComplete 
}) => {
  const { user, token } = useAuth();
  
  // Form state
  const [step, setStep] = useState(1); // 1: Service, 2: Pet, 3: Schedule, 4: Confirm
  const [selectedSubService, setSelectedSubService] = useState(preselectedService);
  const [selectedLocation, setSelectedLocation] = useState('home'); // home or salon
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Pet selection
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    petName: '',
    petBreed: '',
    petAge: '',
    petNotes: '',
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    preferredDate: '',
    preferredTime: '',
    address: '',
    additionalNotes: ''
  });
  
  const service = SERVICE_TYPES[serviceType];
  const ServiceIcon = service?.icon || Scissors;
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      setLoadingPets(true);
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserPets(data.pets || []);
        }
      } catch (err) {
        console.error('Error fetching pets:', err);
      } finally {
        setLoadingPets(false);
      }
    };
    if (isOpen) {
      fetchPets();
    }
  }, [isOpen, token]);
  
  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone
      }));
    }
  }, [user]);
  
  // Handle pet selection
  const handlePetSelect = (petId) => {
    setSelectedPetId(petId);
    if (petId === 'manual') {
      setFormData(prev => ({ ...prev, petName: '', petBreed: '', petAge: '' }));
      return;
    }
    const pet = userPets.find(p => p.id === petId);
    if (pet) {
      let ageStr = '';
      if (pet.birthday) {
        const birthDate = new Date(pet.birthday);
        const today = new Date();
        const years = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        ageStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : 'Less than 1 year';
      }
      setFormData(prev => ({
        ...prev,
        petName: pet.name || '',
        petBreed: pet.breed || '',
        petAge: ageStr,
        petNotes: pet.special_needs || ''
      }));
    }
  };
  
  // Submit booking
  const handleSubmit = async () => {
    // ── tdc.book — canonical intent ticket ──
    tdc.book({ service: service?.name || 'a service', pillar: "services", pet, channel: "service_booking_modal" });

    setIsSubmitting(true);
    try {
      const bookingPayload = {
        service_type: serviceType,
        sub_service: selectedSubService,
        service_name: service.name,
        sub_service_name: service.subServices.find(s => s.id === selectedSubService)?.name,
        pillar: service.pillar,
        location_type: selectedLocation,
        pet: {
          id: selectedPetId !== 'manual' ? selectedPetId : null,
          name: formData.petName,
          breed: formData.petBreed,
          age: formData.petAge,
          notes: formData.petNotes
        },
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail
        },
        schedule: {
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          address: selectedLocation === 'home' ? formData.address : 'Salon/Clinic'
        },
        additional_notes: formData.additionalNotes
      };
      
      const res = await fetch(`${API_URL}/api/services/unified-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(bookingPayload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setBookingId(data.booking_id || data.ticket_id);
        setBookingComplete(true);
        toast({
          title: '🎉 Booking Confirmed!',
          description: `Your ${service.name} booking has been received. We'll contact you shortly.`
        });
        if (onBookingComplete) {
          onBookingComplete(data);
        }
      } else {
        throw new Error(data.detail || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast({
        title: 'Booking Failed',
        description: err.message || 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Validate current step
  const canProceed = () => {
    if (step === 1) return !!selectedSubService;
    if (step === 2) return formData.petName && formData.customerName && formData.customerPhone;
    if (step === 3) return formData.preferredDate && formData.preferredTime && (selectedLocation !== 'home' || formData.address);
    return true;
  };
  
  // Reset on close
  const handleClose = () => {
    setStep(1);
    setSelectedSubService(preselectedService);
    setBookingComplete(false);
    setBookingId(null);
    onClose();
  };
  
  if (!service) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg md:max-w-2xl p-4 sm:p-6">
        {/* Header - Mobile Optimized */}
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center flex-shrink-0`}>
              <ServiceIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-bold">Book {service.name}</span>
              {!bookingComplete && (
                <p className="text-xs sm:text-sm text-gray-500 font-normal">Step {step} of 4</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Bar - Mobile Touch Friendly */}
        {!bookingComplete && (
          <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? `bg-gradient-to-r ${service.gradient}` : 'bg-gray-200'}`} />
            ))}
          </div>
        )}
        
        {/* Booking Complete - Mobile Optimized */}
        {bookingComplete && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Booking ID: <span className="font-mono font-bold text-purple-600 break-all">{bookingId}</span>
            </p>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-left max-w-sm mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-right">{service.subServices.find(s => s.id === selectedSubService)?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Pet</span>
                  <span className="font-medium">{formData.petName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{formData.preferredDate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{formData.preferredTime}</span>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-4">
              📱 You&apos;ll receive a confirmation message on WhatsApp shortly.
            </p>
            <Button onClick={handleClose} className="mt-6 w-full sm:w-auto min-h-[44px]">Done</Button>
          </div>
        )}
        
        {/* Step 1: Select Service - Mobile Optimized */}
        {!bookingComplete && step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Select Service Type</h3>
            {/* Stack on mobile, grid on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {service.subServices.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubService(sub.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all min-h-[70px] ${
                    selectedSubService === sub.id 
                      ? `border-${service.color}-500 bg-${service.color}-50 ring-2 ring-${service.color}-200` 
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                  }`}
                  data-testid={`service-option-${sub.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{sub.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{sub.duration}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-purple-600 ml-2 whitespace-nowrap">{sub.price}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Location preference - Mobile Optimized */}
            <div className="mt-4 sm:mt-6">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Preferred Location</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedLocation('home')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center min-h-[80px] ${
                    selectedLocation === 'home' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 active:bg-gray-50'
                  }`}
                  data-testid="location-home"
                >
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-purple-600 mx-auto" />
                  <p className="font-medium text-sm sm:text-base">At Home</p>
                  <p className="text-xs text-gray-500 hidden sm:block">We come to you</p>
                </button>
                <button
                  onClick={() => setSelectedLocation('salon')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center min-h-[80px] ${
                    selectedLocation === 'salon' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 active:bg-gray-50'
                  }`}
                  data-testid="location-salon"
                >
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-purple-600 mx-auto" />
                  <p className="font-medium text-sm sm:text-base">Salon/Clinic</p>
                  <p className="text-xs text-gray-500 hidden sm:block">Drop off your pet</p>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Pet & Contact Details - Mobile Optimized */}
        {!bookingComplete && step === 2 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Pet Details</h3>
            
            {/* Pet Selection - Horizontal Scroll on Mobile */}
            {userPets.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <Label className="text-xs sm:text-sm text-gray-600">Select from your pets</Label>
                <div className="flex overflow-x-auto gap-2 mt-2 pb-2 -mx-1 px-1 scrollbar-hide">
                  {userPets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => handlePetSelect(pet.id)}
                      className={`px-3 sm:px-4 py-2 rounded-full border-2 text-sm transition-all whitespace-nowrap flex-shrink-0 min-h-[40px] ${
                        selectedPetId === pet.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200' : 'border-gray-200 active:bg-gray-50'
                      }`}
                      data-testid={`pet-select-${pet.id}`}
                    >
                      <PawPrint className="w-4 h-4 inline mr-1" />
                      {pet.name}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePetSelect('manual')}
                    className={`px-3 sm:px-4 py-2 rounded-full border-2 text-sm transition-all whitespace-nowrap flex-shrink-0 min-h-[40px] ${
                      selectedPetId === 'manual' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 active:bg-gray-50'
                    }`}
                    data-testid="pet-select-manual"
                  >
                    + Add New
                  </button>
                </div>
              </div>
            )}
            
            {/* Stack on mobile, 2 cols on larger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="petName" className="text-sm">Pet Name *</Label>
                <Input
                  id="petName"
                  value={formData.petName}
                  onChange={(e) => setFormData(prev => ({ ...prev, petName: e.target.value }))}
                  placeholder="e.g., Bruno"
                  className="h-11 sm:h-10"
                  data-testid="booking-pet-name"
                />
              </div>
              <div>
                <Label htmlFor="petBreed" className="text-sm">Breed</Label>
                <Input
                  id="petBreed"
                  value={formData.petBreed}
                  onChange={(e) => setFormData(prev => ({ ...prev, petBreed: e.target.value }))}
                  placeholder="e.g., Labrador"
                  className="h-11 sm:h-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="petNotes" className="text-sm">Special Notes (allergies, behavior)</Label>
              <Textarea
                id="petNotes"
                value={formData.petNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, petNotes: e.target.value }))}
                placeholder="Any special requirements..."
                rows={2}
                className="text-base"
              />
            </div>
            
            <h3 className="font-semibold text-gray-900 pt-2 sm:pt-4 text-sm sm:text-base">Your Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="customerName" className="text-sm">Your Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Full name"
                  className="h-11 sm:h-10"
                  data-testid="booking-customer-name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone" className="text-sm">Phone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="10-digit number"
                  className="h-11 sm:h-10"
                  data-testid="booking-customer-phone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customerEmail" className="text-sm">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                inputMode="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="your@email.com"
                className="h-11 sm:h-10"
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Schedule - Mobile Optimized */}
        {!bookingComplete && step === 3 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Select Date & Time</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="preferredDate" className="text-sm">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                  className="h-11 sm:h-10"
                  data-testid="booking-date"
                />
              </div>
              <div>
                <Label className="text-sm">Preferred Time *</Label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-full h-11 sm:h-10 px-3 rounded-md border border-gray-200 bg-white text-base"
                  data-testid="booking-time"
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Quick Time Selection for Mobile */}
            <div className="sm:hidden">
              <Label className="text-sm text-gray-600 mb-2 block">Or tap to select:</Label>
              <div className="grid grid-cols-3 gap-2">
                {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, preferredTime: slot }))}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                      formData.preferredTime === slot 
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium' 
                        : 'border-gray-200 text-gray-600 active:bg-gray-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedLocation === 'home' && (
              <div>
                <Label htmlFor="address" className="text-sm">Service Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address: flat/house, building, street, area, city, pincode"
                  rows={3}
                  className="text-base"
                  data-testid="booking-address"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="additionalNotes" className="text-sm">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any special requests..."
                rows={2}
                className="text-base"
              />
            </div>
          </div>
        )}
        
        {/* Step 4: Review & Confirm - Mobile Optimized */}
        {!bookingComplete && step === 4 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Review Booking</h3>
            
            <Card className="p-3 sm:p-4 bg-gray-50">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between pb-2 sm:pb-3 border-b gap-2">
                  <span className="text-gray-500 text-sm">Service</span>
                  <span className="font-medium text-sm text-right">{service.subServices.find(s => s.id === selectedSubService)?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 text-sm">Pet</span>
                  <span className="font-medium text-sm text-right">{formData.petName} {formData.petBreed && `(${formData.petBreed})`}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 text-sm">Location</span>
                  <span className="font-medium text-sm">{selectedLocation === 'home' ? 'At Home' : 'Salon/Clinic'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 text-sm">Date</span>
                  <span className="font-medium text-sm">{formData.preferredDate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 text-sm">Time</span>
                  <span className="font-medium text-sm">{formData.preferredTime}</span>
                </div>
                {selectedLocation === 'home' && (
                  <div className="pt-2 sm:pt-3 border-t">
                    <span className="text-gray-500 text-xs sm:text-sm">Address</span>
                    <p className="text-xs sm:text-sm mt-1 text-gray-700">{formData.address}</p>
                  </div>
                )}
              </div>
            </Card>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 inline mr-1.5" />
              Our team will confirm availability and pricing before the appointment.
            </div>
          </div>
        )}
        
        {/* Navigation Buttons - Mobile Optimized with Sticky Footer */}
        {!bookingComplete && (
          <div className="flex justify-between items-center pt-3 sm:pt-4 border-t mt-4 sm:mt-6 gap-3">
            {step > 1 ? (
              <Button 
                variant="outline" 
                onClick={() => setStep(s => s - 1)}
                className="min-h-[44px] px-4 sm:px-6"
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <Button 
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className={`bg-gradient-to-r ${service.gradient} hover:opacity-90 min-h-[44px] px-4 sm:px-6 flex-1 sm:flex-none max-w-[200px]`}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`bg-gradient-to-r ${service.gradient} hover:opacity-90 min-h-[44px] px-4 sm:px-6 flex-1 sm:flex-none`}
                data-testid="booking-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
