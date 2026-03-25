/**
 * CareServiceFlowModal.jsx
 * ========================
 * Full-featured modal for each Care service type with:
 * - Service-specific options (grooming types, vet visit types, etc.)
 * - Mira's intelligent recommendations based on pet's soul/breed
 * - Pet parent makes final choice
 * - Creates service desk ticket on submission
 * 
 * Philosophy: "Mira suggests, Parent chooses, Concierge® executes"
 */

import React, { useState, useEffect } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Check, Loader2,
  Scissors, Stethoscope, Building2, Home, Heart, Award, Package, AlertTriangle,
  Calendar, MapPin, Clock, Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import useUniversalServiceCommand from '../hooks/useUniversalServiceCommand';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE OPTIONS BY TYPE
// Mira will highlight recommendations based on pet's soul/breed
// ═══════════════════════════════════════════════════════════════════════════════

const SERVICE_OPTIONS = {
  grooming: {
    title: 'Grooming Services',
    subtitle: 'Select the grooming services you need',
    icon: Scissors,
    gradient: 'from-pink-500 to-rose-600',
    options: [
      { id: 'full_groom', name: 'Full Groom', description: 'Complete bath, haircut, nail trim, ear cleaning', popular: true, forBreeds: ['all'] },
      { id: 'bath_brush', name: 'Bath & Brush', description: 'Thorough bath with brushing and blow dry', forBreeds: ['all'] },
      { id: 'haircut_trim', name: 'Haircut / Trim', description: 'Breed-specific styling or maintenance trim', forBreeds: ['poodle', 'shih tzu', 'maltese', 'yorkshire', 'bichon', 'cocker'] },
      { id: 'nail_trim', name: 'Nail Trim', description: 'Nail clipping and filing', forBreeds: ['all'] },
      { id: 'ear_cleaning', name: 'Ear Cleaning', description: 'Gentle ear cleaning and inspection', forBreeds: ['all'] },
      { id: 'teeth_cleaning', name: 'Teeth Cleaning', description: 'Dental hygiene and breath freshening', forBreeds: ['all'] },
      { id: 'deshedding', name: 'De-shedding Treatment', description: 'Removes loose undercoat and reduces shedding', forBreeds: ['golden', 'labrador', 'husky', 'german shepherd', 'akita'] },
      { id: 'spa_treatment', name: 'Spa Treatment', description: 'Moisturizing treatment, paw care, aromatherapy', premium: true, forBreeds: ['all'] },
      { id: 'medicated_bath', name: 'Medicated Bath', description: 'For skin conditions, allergies, or special needs', forBreeds: ['all'] },
    ],
    locationOptions: [
      { id: 'home', name: 'At Home', description: 'Groomer comes to you', icon: Home },
      { id: 'salon', name: 'At Salon', description: 'Visit a trusted salon', icon: Building2 },
      { id: 'mira_recommend', name: 'Let Mira Decide', description: 'Best option for your pet', icon: Sparkles, recommended: true }
    ]
  },
  
  vet_clinic_booking: {
    title: 'Vet Visits & Clinic Booking',
    subtitle: 'What kind of vet visit do you need?',
    icon: Stethoscope,
    gradient: 'from-blue-500 to-indigo-600',
    options: [
      { id: 'wellness_checkup', name: 'Wellness Checkup', description: 'Annual health examination', popular: true, forBreeds: ['all'] },
      { id: 'vaccination', name: 'Vaccination', description: 'Vaccines and boosters', forBreeds: ['all'] },
      { id: 'deworming', name: 'Deworming', description: 'Parasite prevention treatment', forBreeds: ['all'] },
      { id: 'tick_flea', name: 'Tick & Flea Prevention', description: 'Preventive treatment application', forBreeds: ['all'] },
      { id: 'dental_checkup', name: 'Dental Checkup', description: 'Oral health examination', forBreeds: ['all'] },
      { id: 'skin_checkup', name: 'Skin & Coat Checkup', description: 'For allergies, rashes, or coat issues', forBreeds: ['all'] },
      { id: 'senior_checkup', name: 'Senior Wellness', description: 'Comprehensive exam for older pets', forBreeds: ['all'] },
      { id: 'follow_up', name: 'Follow-up Visit', description: 'Post-treatment or surgery follow-up', forBreeds: ['all'] },
      { id: 'lab_tests', name: 'Lab Tests / Diagnostics', description: 'Blood work, X-rays, ultrasound', forBreeds: ['all'] },
      { id: 'mira_recommend', name: 'Let Mira Recommend', description: 'Based on your pet\'s health profile', icon: Sparkles, recommended: true }
    ]
  },
  
  boarding_daycare: {
    title: 'Boarding & Daycare',
    subtitle: 'When do you need care for your pet?',
    icon: Building2,
    gradient: 'from-emerald-500 to-teal-600',
    options: [
      { id: 'daycare', name: 'Daycare', description: 'Daytime supervision, play, and socialization', popular: true, forBreeds: ['all'] },
      { id: 'overnight', name: 'Overnight Boarding', description: 'Comfortable overnight stay', forBreeds: ['all'] },
      { id: 'extended_stay', name: 'Extended Stay (3+ days)', description: 'For vacations or travel', forBreeds: ['all'] },
      { id: 'premium_suite', name: 'Premium Suite', description: 'Private room with extra amenities', premium: true, forBreeds: ['all'] },
      { id: 'medical_boarding', name: 'Medical Boarding', description: 'For pets needing medication or special care', forBreeds: ['all'] },
      { id: 'senior_boarding', name: 'Senior Pet Boarding', description: 'Gentle care for older pets', forBreeds: ['all'] }
    ]
  },
  
  pet_sitting: {
    title: 'Pet Sitting',
    subtitle: 'In-home care while you\'re away',
    icon: Home,
    gradient: 'from-green-500 to-emerald-600',
    options: [
      { id: 'drop_in', name: 'Drop-in Visits', description: 'Sitter visits 1-2 times per day', forBreeds: ['all'] },
      { id: 'full_day', name: 'Full Day Sitting', description: 'Sitter stays during daytime hours', popular: true, forBreeds: ['all'] },
      { id: 'overnight', name: 'Overnight Sitting', description: 'Sitter stays overnight at your home', forBreeds: ['all'] },
      { id: 'live_in', name: 'Live-in Care', description: 'Sitter lives at your home while you\'re away', premium: true, forBreeds: ['all'] }
    ]
  },
  
  behavior_anxiety_support: {
    title: 'Behavior & Anxiety Support',
    subtitle: 'Gentle support for your pet\'s wellbeing',
    icon: Heart,
    gradient: 'from-purple-500 to-violet-600',
    options: [
      { id: 'separation_anxiety', name: 'Separation Anxiety', description: 'Support for pets stressed when alone', forBreeds: ['all'] },
      { id: 'grooming_anxiety', name: 'Grooming Anxiety', description: 'Help for pets anxious during grooming', forBreeds: ['all'] },
      { id: 'vet_anxiety', name: 'Vet Visit Anxiety', description: 'Support for stressful vet visits', forBreeds: ['all'] },
      { id: 'noise_fear', name: 'Noise & Thunder Fear', description: 'Help with loud noises and storms', forBreeds: ['all'] },
      { id: 'reactivity', name: 'Reactivity Support', description: 'For pets reactive to other animals/people', forBreeds: ['all'] },
      { id: 'general_anxiety', name: 'General Anxiety', description: 'Overall anxiety management', forBreeds: ['all'] }
    ]
  },
  
  senior_special_needs_support: {
    title: 'Senior & Special Needs Support',
    subtitle: 'Specialized care for your pet\'s unique needs',
    icon: Award,
    gradient: 'from-amber-500 to-orange-600',
    options: [
      { id: 'mobility_support', name: 'Mobility Support', description: 'Help with movement and comfort', forBreeds: ['all'] },
      { id: 'medication_management', name: 'Medication Management', description: 'Regular medication administration', forBreeds: ['all'] },
      { id: 'comfort_care', name: 'Comfort Care', description: 'Gentle handling and comfort support', popular: true, forBreeds: ['all'] },
      { id: 'hospice_care', name: 'Hospice Support', description: 'Compassionate end-of-life care', forBreeds: ['all'] },
      { id: 'special_diet', name: 'Special Diet Support', description: 'Feeding support for special diets', forBreeds: ['all'] }
    ]
  },
  
  nutrition_consult_booking: {
    title: 'Nutrition Consults',
    subtitle: 'Diet guidance for your pet\'s health',
    icon: Package,
    gradient: 'from-orange-500 to-amber-600',
    options: [
      { id: 'diet_planning', name: 'Diet Planning', description: 'Customised meal planning consultation', popular: true, forBreeds: ['all'] },
      { id: 'weight_management', name: 'Weight Management', description: 'Healthy weight guidance', forBreeds: ['all'] },
      { id: 'allergy_diet', name: 'Allergy-Safe Diet', description: 'Diet planning for food allergies', forBreeds: ['all'] },
      { id: 'senior_nutrition', name: 'Senior Nutrition', description: 'Nutrition for aging pets', forBreeds: ['all'] },
      { id: 'puppy_nutrition', name: 'Puppy Nutrition', description: 'Growth and development diet', forBreeds: ['all'] }
    ]
  },
  
  emergency_help: {
    title: 'Emergency Help',
    subtitle: 'Urgent care coordination',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600',
    options: [
      { id: 'emergency_vet', name: '24/7 Emergency Vet', description: 'Locate nearest emergency vet', urgent: true, forBreeds: ['all'] },
      { id: 'urgent_transport', name: 'Urgent Transport', description: 'Emergency pet transportation', urgent: true, forBreeds: ['all'] },
      { id: 'poison_help', name: 'Poison/Toxin Exposure', description: 'Immediate guidance for poisoning', urgent: true, forBreeds: ['all'] },
      { id: 'injury_help', name: 'Injury Assistance', description: 'Guidance for injured pets', urgent: true, forBreeds: ['all'] }
    ],
    emergencyNote: '⚠️ For life-threatening emergencies, please contact your nearest emergency vet immediately.'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA'S RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const getMiraRecommendation = (serviceType, pet) => {
  if (!pet) return null;
  
  const breed = (pet.breed || '').toLowerCase();
  const name = pet.name || 'your pet';
  
  const recommendations = {
    grooming: () => {
      // Long-coated breeds need more grooming
      const longCoatBreeds = ['shih tzu', 'maltese', 'poodle', 'yorkshire', 'lhasa', 'afghan', 'cocker spaniel'];
      const heavyShedders = ['golden retriever', 'labrador', 'husky', 'german shepherd', 'akita', 'malamute'];
      
      if (longCoatBreeds.some(b => breed.includes(b))) {
        return { option: 'full_groom', reason: `${name} has a beautiful long coat that needs regular professional grooming to stay healthy and mat-free.` };
      }
      if (heavyShedders.some(b => breed.includes(b))) {
        return { option: 'deshedding', reason: `${name}'s breed is known for shedding. A de-shedding treatment will help keep the coat healthy and reduce loose fur at home.` };
      }
      return { option: 'bath_brush', reason: `A thorough bath and brush is perfect for ${name}'s coat type.` };
    },
    
    vet_clinic_booking: () => {
      const age = pet.age || '';
      const isSenior = age.includes('10') || age.includes('11') || age.includes('12') || age.includes('13');
      
      if (isSenior) {
        return { option: 'senior_checkup', reason: `At ${age}, ${name} would benefit from a comprehensive senior wellness exam.` };
      }
      return { option: 'wellness_checkup', reason: `An annual wellness checkup helps catch any health concerns early.` };
    },
    
    boarding_daycare: () => {
      // Social breeds love daycare
      const socialBreeds = ['golden retriever', 'labrador', 'beagle', 'poodle', 'cavalier'];
      if (socialBreeds.some(b => breed.includes(b))) {
        return { option: 'daycare', reason: `${name}'s breed is naturally social and will love the interaction at daycare!` };
      }
      return { option: 'overnight', reason: `We'll find a comfortable, trusted place for ${name} to stay.` };
    }
  };
  
  const getRecommendation = recommendations[serviceType];
  return getRecommendation ? getRecommendation() : null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CareServiceFlowModal = ({
  isOpen,
  onClose,
  serviceType,
  pet,
  userPets = [],
  token
}) => {
  const [step, setStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedPet, setSelectedPet] = useState(pet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitRequest } = useUniversalServiceCommand();
  
  const serviceConfig = SERVICE_OPTIONS[serviceType] || SERVICE_OPTIONS.grooming;
  const miraRecommendation = getMiraRecommendation(serviceType, selectedPet);
  
  // Reset when modal opens with new service type
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedOptions([]);
      setSelectedLocation(null);
      setAdditionalNotes('');
      setSelectedPet(pet);
    }
  }, [isOpen, serviceType, pet]);
  
  const handleOptionToggle = (optionId) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      }
      return [...prev, optionId];
    });
  };
  
  const handleSubmit = async () => {
    if (!selectedPet || selectedOptions.length === 0) {
      toast.error('Please select at least one service option');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedOptionNames = selectedOptions
        .map(id => serviceConfig.options.find(o => o.id === id)?.name)
        .filter(Boolean);
      
      const result = await submitRequest({
        type: serviceType.toUpperCase(),
        pillar: 'care',
        entryPoint: 'care_service_flow_modal',
        pet: selectedPet,
        details: {
          service_type: serviceType,
          services_requested: selectedOptionNames.join(', '),
          selected_options: selectedOptions,
          selected_location: selectedLocation,
          additional_notes: additionalNotes,
          pet_breed: selectedPet?.breed,
          mira_recommended: miraRecommendation?.option
        },
        intent: `${serviceConfig.title} request for ${selectedPet?.name}`,
        showToast: false,
        navigateToInbox: false
      });
      
      if (result.success) {
        toast.success('Request sent to Concierge®', {
          description: `Opening your inbox to track ${selectedPet?.name}'s ${serviceConfig.title.toLowerCase()} request...`,
          duration: 3000
        });
        onClose();
        
        // Navigate to Mira OS with Concierge® panel open and ticket focused
        // Using state to tell MiraDemoPage to open Concierge® with this ticket
        setTimeout(() => {
          window.location.href = `/mira-demo?openConcierge=true&ticket=${result.ticketId}`;
        }, 500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[CareServiceFlowModal] Submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const Icon = serviceConfig.icon;
  const petName = selectedPet?.name || 'your pet';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className={`bg-gradient-to-r ${serviceConfig.gradient} px-6 py-5 text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {serviceConfig.title}
              </DialogTitle>
              <p className="text-white/80 text-sm">for {petName}</p>
            </div>
          </div>
          
          {/* Mira's Recommendation */}
          {miraRecommendation && (
            <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Mira recommends</p>
                <p className="text-xs text-white/80 mt-1">{miraRecommendation.reason}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Pet Selector (if multiple pets) */}
          {userPets.length > 1 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Pet</label>
              <div className="flex gap-2 flex-wrap">
                {userPets.map((p) => (
                  <button
                    key={p._id || p.id}
                    onClick={() => setSelectedPet(p)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (selectedPet?._id || selectedPet?.id) === (p._id || p.id)
                        ? `bg-gradient-to-r ${serviceConfig.gradient} text-white`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Emergency Note */}
          {serviceConfig.emergencyNote && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{serviceConfig.emergencyNote}</p>
            </div>
          )}
          
          {/* Service Options */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              {serviceConfig.subtitle}
            </label>
            <div className="grid gap-3">
              {serviceConfig.options.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const isRecommended = miraRecommendation?.option === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{option.name}</span>
                          {option.popular && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">Popular</Badge>
                          )}
                          {option.premium && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">Premium</Badge>
                          )}
                          {option.urgent && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>
                          )}
                          {isRecommended && (
                            <Badge className="bg-teal-100 text-teal-700 text-xs flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Mira Recommends
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                        isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Location Options (for grooming) */}
          {serviceConfig.locationOptions && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Where would you like the service?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {serviceConfig.locationOptions.map((loc) => {
                  const LocIcon = loc.icon;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedLocation === loc.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <LocIcon className={`w-6 h-6 mx-auto mb-2 ${
                        selectedLocation === loc.id ? 'text-teal-600' : 'text-gray-500'
                      }`} />
                      <p className="font-medium text-sm text-gray-900">{loc.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{loc.description}</p>
                      {loc.recommended && (
                        <Badge className="bg-teal-100 text-teal-700 text-xs mt-2">Recommended</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Additional Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Anything else we should know?
            </label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={`Any special instructions for ${petName}'s care...`}
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedOptions.length} service{selectedOptions.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className={`bg-gradient-to-r ${serviceConfig.gradient} text-white hover:opacity-90`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Request Service
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CareServiceFlowModal;
