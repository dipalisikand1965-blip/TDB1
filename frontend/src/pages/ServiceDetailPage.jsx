/**
 * ServiceDetailPage.jsx
 * 
 * Detailed service view - concierge-grade experience
 * "Is this right for my dog?" - not a marketplace listing
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { 
  ArrowLeft, Clock, MapPin, Star, Phone, Mail, Globe,
  Check, Shield, Award, Users, Sparkles, Heart, Share2,
  Calendar, ChevronRight, PawPrint, Crown, MessageCircle,
  Scissors, Bath, Syringe, Car, Camera, Brain, Home,
  Dumbbell, Plane, PartyPopper, Lightbulb, AlertTriangle,
  FileText, Sunrise, Package
} from 'lucide-react';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';

// =============================================================================
// SERVICE CATEGORY VISUALS
// =============================================================================
const SERVICE_VISUALS = {
  'grooming': { icon: Scissors, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800', color: 'from-pink-500 to-rose-500' },
  'spa': { icon: Bath, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-purple-500 to-indigo-500' },
  'vet': { icon: Syringe, image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800', color: 'from-blue-500 to-cyan-500' },
  'training': { icon: Brain, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-amber-500 to-orange-500' },
  'boarding': { icon: Home, image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800', color: 'from-green-500 to-emerald-500' },
  'daycare': { icon: Users, image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800', color: 'from-teal-500 to-cyan-500' },
  'walking': { icon: PawPrint, image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800', color: 'from-lime-500 to-green-500' },
  'travel': { icon: Car, image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=800', color: 'from-sky-500 to-blue-500' },
  'photography': { icon: Camera, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-violet-500 to-purple-500' },
  'adoption': { icon: Heart, image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800', color: 'from-rose-500 to-pink-500' },
  'emergency': { icon: AlertTriangle, image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800', color: 'from-red-500 to-rose-500' },
  'fitness': { icon: Dumbbell, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-green-500 to-emerald-500' },
  'celebrate': { icon: PartyPopper, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-pink-500 to-rose-500' },
  'advisory': { icon: Lightbulb, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-amber-500 to-yellow-500' },
  'default': { icon: Sparkles, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800', color: 'from-purple-500 to-pink-500' }
};

// =============================================================================
// BREED-SPECIFIC MIRA INSIGHTS
// =============================================================================
const BREED_INSIGHTS = {
  'shih tzu': {
    'grooming': "Shih Tzus need professional grooming every 4-6 weeks to keep their luxurious coat healthy and mat-free.",
    'training': "Shih Tzus respond best to gentle, reward-based training with short, fun sessions.",
    'boarding': "Shih Tzus prefer calm, quiet environments. Look for smaller group settings.",
    'default': "Shih Tzus are companion dogs who thrive with personalized attention."
  },
  'golden retriever': {
    'grooming': "Golden Retrievers need regular brushing and occasional professional grooming to manage shedding.",
    'swimming': "Golden Retrievers are natural swimmers! This is excellent exercise for them.",
    'training': "Goldens are eager to please and excel at obedience training.",
    'default': "Golden Retrievers are social, active dogs who love structured activities."
  },
  'labrador': {
    'grooming': "Labs have a double coat that benefits from regular deshedding treatments.",
    'swimming': "Labs are water lovers - swimming is perfect exercise and keeps them fit.",
    'training': "Labs are food-motivated and respond well to positive reinforcement.",
    'fitness': "Labs are prone to weight gain - regular fitness activities are important.",
    'default': "Labradors are energetic and benefit from structured activities."
  },
  'pug': {
    'grooming': "Pugs need facial fold cleaning and regular bathing to stay healthy.",
    'fitness': "Short, gentle walks work best for Pugs - they can overheat easily.",
    'boarding': "Climate-controlled environments are essential for Pugs.",
    'default': "Pugs need special consideration for their brachycephalic (flat-faced) needs."
  },
  'default': {
    'default': "Every dog is unique. This service can be tailored to your companion's specific needs."
  }
};

const getMiraInsight = (service, breed) => {
  const breedLower = (breed || '').toLowerCase();
  const serviceName = (service?.name || '').toLowerCase();
  
  let breedInsights = BREED_INSIGHTS.default;
  for (const [key, insights] of Object.entries(BREED_INSIGHTS)) {
    if (breedLower.includes(key)) {
      breedInsights = insights;
      break;
    }
  }
  
  for (const [keyword, insight] of Object.entries(breedInsights)) {
    if (serviceName.includes(keyword)) {
      return insight;
    }
  }
  
  return breedInsights.default || BREED_INSIGHTS.default.default;
};

// =============================================================================
// SERVICE DETAIL PAGE
// =============================================================================
const ServiceDetailPage = () => {
  const { pillar, serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedServices, setRelatedServices] = useState([]);
  
  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        // Try fetching by ID first
        let response = await fetch(`${API_URL}/api/service-box/services/${serviceId}`);
        
        if (!response.ok) {
          // If not found, try fetching all and filtering
          response = await fetch(`${API_URL}/api/service-box/services?limit=500`);
          if (response.ok) {
            const data = await response.json();
            const foundService = data.services?.find(s => 
              s.id === serviceId || s._id === serviceId || s.slug === serviceId
            );
            if (foundService) {
              setService(foundService);
              // Fetch related services from same pillar
              const related = data.services
                ?.filter(s => s.id !== foundService.id && (s.pillar === pillar || s.pillars?.includes(pillar)))
                .slice(0, 4);
              setRelatedServices(related || []);
            } else {
              throw new Error('Service not found');
            }
          }
        } else {
          const data = await response.json();
          setService(data.service || data);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        toast({
          title: "Service not found",
          description: "This service may no longer be available",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [serviceId, pillar, toast]);
  
  // Fetch user's pets
  useEffect(() => {
    if (token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userPets = data.pets || [];
            setPets(userPets);
            if (userPets.length > 0) {
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId ? userPets.find(p => p.id === savedPetId) : userPets[0];
              setSelectedPet(pet || userPets[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Get visual config for service
  const visuals = useMemo(() => {
    if (!service) return SERVICE_VISUALS.default;
    const name = (service.name || '').toLowerCase();
    const category = (service.category || pillar || '').toLowerCase();
    for (const [key, val] of Object.entries(SERVICE_VISUALS)) {
      if (name.includes(key) || category.includes(key)) return val;
    }
    return SERVICE_VISUALS.default;
  }, [service, pillar]);
  
  const Icon = visuals.icon;
  const petName = selectedPet?.name || '';
  const petBreed = selectedPet?.breed || '';
  const miraInsight = service ? getMiraInsight(service, petBreed) : '';
  
  // Handle booking - Creates a service request ticket
  const handleBookNow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book this service",
      });
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    // Create service request ticket via unified flow
    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_id: service.id,
          service_name: service.name,
          pillar: service.pillar || service.pillars?.[0] || 'care',
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name,
          pet_breed: selectedPet?.breed,
          user_email: user.email,
          user_name: user.name,
          source: 'service_detail_page',
          message: `I'd like to book ${service.name} for ${selectedPet?.name || 'my pet'}`,
          price: service.base_price
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✨ Request Sent!",
          description: `Our team will contact you shortly about ${service.name}`,
          duration: 5000
        });
        
        // Also open Mira chat for immediate assistance
        window.dispatchEvent(new CustomEvent('openMiraChat', {
          detail: { prompt: `I just requested ${service.name} for ${selectedPet?.name || 'my pet'}. Can you help me with any questions?` }
        }));
      } else {
        // Fallback to just opening Mira
        window.dispatchEvent(new CustomEvent('openMiraChat'));
        toast({
          title: "Let's book this!",
          description: "Mira will help you schedule this service",
        });
      }
    } catch (error) {
      console.error('Booking request failed:', error);
      // Fallback to Mira chat
      window.dispatchEvent(new CustomEvent('openMiraChat'));
      toast({
        title: "Let's book this!",
        description: "Mira will help you schedule this service",
      });
    }
  };
  
  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.name,
          text: `Check out ${service?.name} for your pet!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share this service with friends" });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
        <div className="animate-pulse">
          <div className="h-64 sm:h-80 bg-gray-200"></div>
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24 md:pb-0">
        <div className="text-center px-4">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h2>
          <p className="text-gray-500 mb-6">This service may have been removed or is no longer available.</p>
          <Button onClick={() => navigate('/services')} className="bg-purple-600 hover:bg-purple-700">
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0" data-testid="service-detail-page">
      <SEOHead page="service-detail" path={`/services/${pillar}/${serviceId}`} />
      
      {/* Hero Image */}
      <div className={`relative h-56 sm:h-72 md:h-80 bg-gradient-to-br ${visuals.color} overflow-hidden`}>
        <img 
          src={service.image_url || visuals.image} 
          alt={service.name}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {/* Share & Wishlist */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
        
        {/* Service Icon */}
        <div className="absolute bottom-4 left-4 p-3 bg-white/20 backdrop-blur-sm rounded-xl">
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        {/* Service Name */}
        <div className="absolute bottom-4 left-20 right-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {service.name}
          </h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Price & Quick Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">
            {service.base_price ? `₹${service.base_price.toLocaleString()}` : 'Get Quote'}
          </span>
          {service.duration && (
            <span className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-4 h-4" />
              {service.duration}
            </span>
          )}
          {service.location && (
            <span className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-4 h-4" />
              {service.location}
            </span>
          )}
        </div>
        
        {/* Pet Selector (if logged in with pets) */}
        {pets.length > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {pets.slice(0, 3).map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPet(pet);
                        localStorage.setItem('selectedPetId', pet.id);
                      }}
                      className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all ${
                        pet.id === selectedPet?.id ? 'border-purple-500 scale-110 z-10' : 'border-white'
                      }`}
                    >
                      {pet.photo_url || pet.image_url ? (
                        <img src={pet.photo_url || pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{pet.name?.[0]}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Booking for <span className="text-purple-600">{petName}</span>
                  </p>
                  <p className="text-xs text-gray-500">{petBreed}</p>
                </div>
              </div>
              {pets.length > 1 && (
                <span className="text-xs text-purple-600">Tap to switch pet</span>
              )}
            </div>
          </Card>
        )}
        
        {/* Mira's Insight for this Pet */}
        {miraInsight && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Mira&apos;s insight {petName ? `for ${petName}` : ''}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{miraInsight}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About this service</h2>
          <p className="text-gray-600 leading-relaxed">
            {service.description || `Professional ${service.name?.toLowerCase()} service designed to meet your pet's unique needs. Our experienced team ensures a comfortable and stress-free experience for your companion.`}
          </p>
        </div>
        
        {/* What's Included */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What&apos;s included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(service.features || [
              'Professional service by trained staff',
              'Pet-safe products & equipment',
              'Personalized attention',
              'Post-service care tips'
            ]).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap gap-4 mb-8 py-4 border-y border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Verified Provider</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Quality Assured</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-5 h-5 text-blue-500" />
            <span>500+ happy pets</span>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button 
            onClick={handleBookNow}
            className="flex-1 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-xl"
            data-testid="book-now-btn"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Now
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="flex-1 py-6 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 text-lg font-semibold rounded-xl"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Ask Mira
          </Button>
        </div>
        
        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedServices.map((related) => (
                <Link
                  key={related.id}
                  to={`/services/${related.pillar || pillar}/${related.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-20 bg-gradient-to-br ${SERVICE_VISUALS[related.name?.toLowerCase().split(' ')[0]] ? SERVICE_VISUALS[related.name.toLowerCase().split(' ')[0]].color : 'from-purple-500 to-pink-500'}`}>
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white/50" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {related.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {related.base_price ? `₹${related.base_price}` : 'Get Quote'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Book Button (Mobile) */}
      <div className="fixed bottom-20 left-4 right-4 md:hidden z-40">
        <Button 
          onClick={handleBookNow}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg"
        >
          Book for {service.base_price ? `₹${service.base_price.toLocaleString()}` : 'Quote'}
        </Button>
      </div>
      
      <MiraChatWidget pillar={pillar || 'services'} />
    </div>
  );
};

export default ServiceDetailPage;
