/**
 * MiraCarePlan.jsx
 * ================
 * Mira's proactive care recommendations for a pet.
 * 
 * Mira KNOWS what the pet needs - she doesn't ask.
 * Each recommendation opens a FLOW MODAL for detailed intake.
 * 
 * Philosophy: "Mira is the soul, Concierge® is the hands, System is the capillary"
 * 
 * UPDATED: Now opens FlowModal for grooming and vet visits instead of direct ticket creation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Stethoscope, 
  Building2, 
  Heart, 
  Award, 
  Home,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import useUniversalServiceCommand from '../hooks/useUniversalServiceCommand';
import GroomingFlowModal from './GroomingFlowModal';
import VetVisitFlowModal from './VetVisitFlowModal';

// Icon mapping
const ICON_MAP = {
  'Scissors': Scissors,
  'Stethoscope': Stethoscope,
  'Building2': Building2,
  'Heart': Heart,
  'Award': Award,
  'Home': Home
};

// Urgency styling
const URGENCY_STYLES = {
  urgent: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    border: 'border-red-200 hover:border-red-400',
    icon: AlertCircle,
    label: 'Needs attention'
  },
  recommended: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    border: 'border-amber-200 hover:border-amber-400',
    icon: Clock,
    label: 'Recommended'
  },
  upcoming: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    border: 'border-blue-200 hover:border-blue-400',
    icon: Clock,
    label: 'Coming up'
  },
  optional: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    border: 'border-gray-200 hover:border-gray-400',
    icon: Sparkles,
    label: 'Optional'
  }
};

const MiraCarePlan = ({ 
  petId, 
  petName: propPetName,
  pet: propPet, // Full pet object for FlowModals
  user,
  token,
  className = '' 
}) => {
  const [carePlan, setCarePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  
  // Flow Modal states - Open detailed wizard instead of simple ticket
  const [groomingModalOpen, setGroomingModalOpen] = useState(false);
  const [vetVisitModalOpen, setVetVisitModalOpen] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  
  const { submitRequest, isSubmitting } = useUniversalServiceCommand();

  // Fetch care plan
  useEffect(() => {
    const fetchCarePlan = async () => {
      if (!petId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/mira/care-plan/${petId}`, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch care plan');
        }
        
        const data = await response.json();
        setCarePlan(data);
      } catch (err) {
        console.error('[MiraCarePlan] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCarePlan();
  }, [petId, token]);

  // Handle booking action - Opens appropriate FlowModal
  const handleBookService = async (recommendation) => {
    const petName = carePlan?.pet_name || propPetName || 'your pet';
    const pet = propPet || {
      id: petId,
      name: petName,
      breed: carePlan?.pet_breed,
      photo_url: carePlan?.pet_photo
    };
    
    setActiveRecommendation(recommendation);
    
    // Check recommendation type and open appropriate FlowModal
    const recType = recommendation.type?.toLowerCase();
    
    // GROOMING - Open detailed grooming flow modal
    if (recType === 'grooming' || recType === 'groom') {
      setGroomingModalOpen(true);
      return;
    }
    
    // VET VISIT - Open detailed vet visit flow modal
    if (recType === 'vet_clinic_booking' || recType === 'vet' || recType === 'vet_visit' || recType === 'wellness_checkup' || recType === 'vaccination') {
      setVetVisitModalOpen(true);
      return;
    }
    
    // For other service types, use the existing ticket creation flow
    // (These will be converted to FlowModals in future iterations)
    setBookingInProgress(recommendation.id);
    
    try {
      // Create service desk ticket via Universal Service Command
      const result = await submitRequest({
        type: recommendation.type.toUpperCase(),
        pillar: 'care',
        entryPoint: 'mira_care_plan',
        pet: pet,
        details: {
          service_type: recommendation.type,
          recommendation_title: recommendation.title,
          recommendation_reason: recommendation.reason,
          urgency: recommendation.urgency,
          mira_recommended: true,
          ...recommendation.metadata
        },
        intent: `${recommendation.title} - Mira recommended`,
        showToast: false,
        navigateToInbox: false
      });
      
      if (result.success) {
        toast.success(
          `Booked! Your concierge will reach out shortly.`,
          { description: `We're on it for ${petName}.` }
        );
      } else {
        throw new Error(result.error || 'Failed to create request');
      }
    } catch (err) {
      console.error('[MiraCarePlan] Booking error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBookingInProgress(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return null; // Fail silently in production
  }

  // No pet selected
  if (!petId || !carePlan) {
    return null;
  }

  const petName = carePlan.pet_name || propPetName || 'Your Pet';
  const recommendations = carePlan.recommendations || [];

  // No recommendations
  if (recommendations.length === 0) {
    return (
      <div className={`py-10 bg-gradient-to-b from-teal-50/50 to-white ${className}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {petName} is all set!
          </h2>
          <p className="text-gray-600">
            Mira will let you know when {petName} needs anything.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-10 sm:py-12 bg-gradient-to-b from-teal-50/50 to-white ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Mira's Care Plan</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Care recommendations for {petName}
          </h2>
          
          <p className="text-gray-600 max-w-xl mx-auto">
            {carePlan.soul_summary}
          </p>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <AnimatePresence>
            {recommendations.map((rec, idx) => {
              const Icon = ICON_MAP[rec.icon] || Sparkles;
              const urgencyStyle = URGENCY_STYLES[rec.urgency] || URGENCY_STYLES.optional;
              const UrgencyIcon = urgencyStyle.icon;
              const isBooking = bookingInProgress === rec.id;
              
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`p-5 sm:p-6 border-2 ${urgencyStyle.border} transition-all duration-300 hover:shadow-lg h-full flex flex-col`}>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${rec.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <Badge className={`${urgencyStyle.badge} flex items-center gap-1`}>
                        <UrgencyIcon className="w-3 h-3" />
                        {urgencyStyle.label}
                      </Badge>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {rec.title}
                    </h3>
                    
                    {/* Reason - Soul-driven explanation */}
                    <p className="text-gray-600 text-sm sm:text-base mb-6 flex-grow">
                      {rec.reason}
                    </p>
                    
                    {/* CTA Button */}
                    <Button
                      onClick={() => handleBookService(rec)}
                      disabled={isBooking}
                      className={`w-full py-5 sm:py-6 bg-gradient-to-r ${rec.gradient} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                      data-testid={`care-plan-book-${rec.type}`}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating request...
                        </>
                      ) : (
                        <>
                          {rec.action_label}
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Mira updates this plan as she learns more about {petName}
        </motion.p>
      </div>
      
      {/* FLOW MODALS - Detailed intake wizards */}
      
      {/* Grooming Flow Modal */}
      <GroomingFlowModal
        isOpen={groomingModalOpen}
        onClose={() => {
          setGroomingModalOpen(false);
          setActiveRecommendation(null);
        }}
        pet={propPet || {
          id: petId,
          name: carePlan?.pet_name || propPetName,
          breed: carePlan?.pet_breed,
          photo_url: carePlan?.pet_photo
        }}
        user={user}
        token={token}
        entryPoint="mira_care_plan"
      />
      
      {/* Vet Visit Flow Modal */}
      <VetVisitFlowModal
        isOpen={vetVisitModalOpen}
        onClose={() => {
          setVetVisitModalOpen(false);
          setActiveRecommendation(null);
        }}
        pet={propPet || {
          id: petId,
          name: carePlan?.pet_name || propPetName,
          breed: carePlan?.pet_breed,
          photo_url: carePlan?.pet_photo
        }}
        user={user}
        token={token}
        entryPoint="mira_care_plan"
        preselectedType={activeRecommendation?.metadata?.visit_type}
      />
    </div>
  );
};

export default MiraCarePlan;
