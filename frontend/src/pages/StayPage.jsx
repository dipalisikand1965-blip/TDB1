import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MiraContextPanel from '../components/MiraContextPanel';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import {
  Search, Filter, MapPin, Star, Heart, Dog, Calendar, Phone, Globe, 
  ChevronRight, Sparkles, Shield, TreePine, Sun, Waves, Mountain,
  Home, Building2, Building, Tent, CheckCircle, X, Users, Clock, Loader2,
  PawPrint, AlertTriangle, MessageCircle, ChevronDown, ShoppingBag,
  Package, Percent, PartyPopper, Camera, Footprints, Gift
} from 'lucide-react';

// Elevated Concierge® Stay Experiences
const STAY_EXPERIENCES = [
  {
    title: "Pawcation Curator®",
    description: "Dreaming of a pet-inclusive vacation? We curate destinations, handpick hotels with genuine pet love (not just tolerance), and arrange experiences that both you and your pet will cherish.",
    icon: "🏖️",
    gradient: "from-emerald-500 to-teal-600",
    badge: "Signature",
    badgeColor: "bg-amber-500",
    highlights: [
      "Curated pet-friendly destinations",
      "Hotel vetting for true pet hospitality",
      "In-room pet amenities arranged",
      "Pet-friendly activities & restaurants"
    ]
  },
  {
    title: "Home Away Coordinator®",
    description: "Need trusted boarding while you're away? We match your pet's personality with the perfect stay — whether that's a homely foster, luxury pet resort, or countryside retreat.",
    icon: "🏡",
    gradient: "from-blue-500 to-indigo-600",
    highlights: [
      "Personalized boarding matchmaking",
      "Facility tours & vet verification",
      "Daily updates & photo reports",
      "Emergency response protocols"
    ]
  },
  {
    title: "Staycation Architect®",
    description: "Planning a local getaway or work trip? We find pet-welcoming stays in your city, arrange daycare if needed, and ensure your pet feels at home wherever you go.",
    icon: "🌆",
    gradient: "from-rose-500 to-pink-600",
    highlights: [
      "Local pet-friendly hotel curation",
      "Daycare & walker arrangements",
      "Extended stay planning",
      "Pet spa & grooming bookings"
    ]
  },
  {
    title: "Multi-Pet Travel Suite®",
    description: "Traveling with multiple pets? We coordinate stays that welcome your entire fur family, ensure proper room setups, and manage logistics for multi-pet households.",
    icon: "🐕‍🦺",
    gradient: "from-amber-500 to-orange-600",
    highlights: [
      "Multi-pet room arrangements",
      "Group feeding & walking schedules",
      "Pet-count friendly venue sourcing",
      "Emergency vet proximity planning"
    ]
  }
];

const StayPage = () => {
  const { addToCart } = useCart();
  const [activeSection, setActiveSection] = useState('stays');
  const [properties, setProperties] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [socials, setSocials] = useState([]);
  const [boardingFacilities, setBoardingFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stays'); // 'stays' or 'boarding'
  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minRating: '',
    maxPetFee: '',
    vibe: ''
  });
  const [boardingFilters, setBoardingFilters] = useState({
    city: '',
    boardingType: ''
  });
  const [cities, setCities] = useState([]);
  const [boardingCities, setBoardingCities] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedSocial, setSelectedSocial] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  
  // Trip Planner state
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [tripPlannerLoading, setTripPlannerLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [tripForm, setTripForm] = useState({
    destination_city: '',
    trip_type: '',
    pet_name: '',
    pet_breed: '',
    check_in_date: '',
    check_out_date: ''
  });
  const [tripOptions, setTripOptions] = useState({ cities: [], trip_types: [] });

  useEffect(() => {
    // Check URL params for type=boarding
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'boarding') {
      setActiveTab('boarding');
      fetchBoardingFacilities();
    } else {
      setActiveTab('stays');
    }
    
    fetchProperties();
    fetchBundles();
    fetchSocials();
    fetchTripPlannerOptions();
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('stay_favorites') || '[]');
    setFavorites(savedFavorites);
    
    // Handle hash-based scrolling (e.g., /stay#essentials)
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500); // Delay to ensure content is loaded
    }
  }, []);
  
  const fetchBoardingFacilities = async () => {
    try {
      const params = new URLSearchParams();
      if (boardingFilters.city) params.append('city', boardingFilters.city);
      if (boardingFilters.boardingType) params.append('boarding_type', boardingFilters.boardingType);
      
      const response = await fetch(`${API_URL}/api/stay/boarding?${params}`);
      const data = await response.json();
      setBoardingFacilities(data.facilities || []);
      setBoardingCities(data.cities || []);
    } catch (error) {
      console.error('Error fetching boarding facilities:', error);
    }
  };
  
  // Re-fetch boarding when filters change
  useEffect(() => {
    if (activeTab === 'boarding') {
      fetchBoardingFacilities();
    }
  }, [boardingFilters, activeTab]);
  
  const fetchTripPlannerOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/trip-planner/options`);
      const data = await response.json();
      setTripOptions(data);
    } catch (error) {
      console.error('Error fetching trip planner options:', error);
    }
  };
  
  const generateTripPlan = async () => {
    setTripPlannerLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stay/trip-planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripForm)
      });
      const data = await response.json();
      setTripPlan(data);
    } catch (error) {
      console.error('Error generating trip plan:', error);
    } finally {
      setTripPlannerLoading(false);
    }
  };

  const fetchBundles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/products/bundles`);
      const data = await response.json();
      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  const fetchSocials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/social/events`);
      const data = await response.json();
      setSocials(data.events || []);
    } catch (error) {
      console.error('Error fetching socials:', error);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.propertyType) params.append('property_type', filters.propertyType);
      if (filters.minRating) params.append('min_rating', filters.minRating);
      if (filters.maxPetFee) params.append('max_pet_fee', filters.maxPetFee);
      if (filters.vibe) params.append('vibe', filters.vibe);
      
      const response = await fetch(`${API_URL}/api/stay/properties?${params.toString()}`);
      const data = await response.json();
      setProperties(data.properties || []);
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (propertyId) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    setFavorites(newFavorites);
    localStorage.setItem('stay_favorites', JSON.stringify(newFavorites));
  };

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'resort': return <Building2 className="w-4 h-4" />;
      case 'hotel': return <Building2 className="w-4 h-4" />;
      case 'villa': return <Home className="w-4 h-4" />;
      case 'farmstay': return <TreePine className="w-4 h-4" />;
      case 'homestay': return <Home className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getVibeIcon = (vibe) => {
    switch (vibe?.toLowerCase()) {
      case 'beach': return <Waves className="w-3 h-3" />;
      case 'mountain': return <Mountain className="w-3 h-3" />;
      case 'forest': return <TreePine className="w-3 h-3" />;
      case 'luxury': return <Sparkles className="w-3 h-3" />;
      default: return <Sun className="w-3 h-3" />;
    }
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Pet Menu': 'bg-green-100 text-green-700',
      'Off-leash area': 'bg-blue-100 text-blue-700',
      'Pet sitter': 'bg-purple-100 text-purple-700',
      'Grooming': 'bg-pink-100 text-pink-700',
      'Vet on call': 'bg-red-100 text-red-700',
      'Trails': 'bg-amber-100 text-amber-700',
      'Beach access': 'bg-cyan-100 text-cyan-700'
    };
    return colors[badge] || 'bg-gray-100 text-gray-700';
  };

  const PawRatingDisplay = ({ rating }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((paw) => (
        <PawPrint 
          key={paw}
          className={`w-4 h-4 ${paw <= Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 font-semibold text-amber-600">{rating?.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead page="stay" path="/stay" />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-emerald-500 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">STAY</h1>
          </div>
          <p className="text-xl md:text-2xl opacity-90 mb-2">
            Your dog's second home — everywhere.
          </p>
          <p className="text-sm opacity-75 max-w-2xl mx-auto mb-4">
            Discover India's most trusted pet-friendly stays. Each property is verified against 
            The Doggy Company Paw Standards for comfort, safety, and joy.
          </p>
          
          {/* Trip Planner CTA */}
          <Button 
            onClick={() => setShowTripPlanner(true)}
            className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-full shadow-lg"
            data-testid="trip-planner-btn"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Plan Your Pawcation
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Types</option>
                  <option value="resort">Resort</option>
                  <option value="hotel">Hotel</option>
                  <option value="villa">Villa</option>
                  <option value="farmstay">Farmstay</option>
                  <option value="homestay">Homestay</option>
                </select>
              </div>

              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Paws</option>
                  <option value="4">4+ Paws</option>
                  <option value="3.5">3.5+ Paws</option>
                </select>
              </div>

              <Button 
                onClick={fetchProperties}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
              >
                <Search className="w-5 h-5 mr-2" /> Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {['Beach', 'Mountain', 'Forest', 'Luxury', 'Quiet', 'Outdoorsy', 'Heritage'].map(vibe => (
            <button
              key={vibe}
              onClick={() => setFilters({...filters, vibe: filters.vibe === vibe ? '' : vibe})}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filters.vibe === vibe 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white border hover:border-green-500 text-gray-700'
              }`}
            >
              {getVibeIcon(vibe)} {vibe}
            </button>
          ))}
        </div>
        
        {/* Tabs: Stays vs Boarding */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => { setActiveTab('stays'); window.history.pushState({}, '', '/stay'); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'stays' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white border-2 border-green-200 text-green-700 hover:border-green-400'
            }`}
          >
            <Building className="w-5 h-5 inline mr-2" />
            Pet-Friendly Stays
          </button>
          <button
            onClick={() => { setActiveTab('boarding'); window.history.pushState({}, '', '/stay?type=boarding'); fetchBoardingFacilities(); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'boarding' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
            }`}
          >
            <Home className="w-5 h-5 inline mr-2" />
            Pet Boarding
          </button>
        </div>
      </div>

      {/* Boarding Section */}
      {activeTab === 'boarding' && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          {/* Boarding Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-2">
              🏠 Pet Boarding
            </h2>
            <p className="text-purple-600 mb-4">
              Thoughtful stays, built around your dog's routine.
            </p>
            <p className="text-sm text-gray-600 italic">
              Every boarding recommendation is guided by your dog's profile, habits, and comfort needs already on file.
            </p>
          </div>

          {/* What Boarding Means */}
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-3">What boarding means at The Doggy Company</h3>
            <p className="text-gray-600 mb-4">
              Boarding is not just a place to stay. It's continuity of care when you're away.
            </p>
            
            <h4 className="font-semibold text-gray-700 mb-2">Suitable For:</h4>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Short trips and weekends away</li>
              <li>• Longer holidays</li>
              <li>• Transition periods or relocations</li>
              <li>• Times when home care isn't possible</li>
            </ul>
            
            <h4 className="font-semibold text-gray-700 mb-2">How we decide what's right:</h4>
            <p className="text-sm text-gray-500">
              We consider age, life stage, social comfort with other dogs, sleep and feeding routines, 
              medical or behavioural notes already recorded, location and travel distance. No two dogs are placed the same way.
            </p>
          </div>

          {/* Boarding Type Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={boardingFilters.city}
              onChange={(e) => setBoardingFilters({...boardingFilters, city: e.target.value})}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="">All Cities</option>
              {boardingCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              value={boardingFilters.boardingType}
              onChange={(e) => setBoardingFilters({...boardingFilters, boardingType: e.target.value})}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="">All Boarding Types</option>
              <option value="Home-style">Home-style Boarding</option>
              <option value="Premium">Premium Facilities</option>
              <option value="Private">Private Stays</option>
              <option value="Luxury">Luxury Pet Hotels</option>
            </select>
          </div>

          {/* Boarding Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-2">🏡 Home-style Boarding</h4>
              <p className="text-sm text-amber-700">For dogs who do best in quieter, family environments.</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">🏨 Premium Facilities</h4>
              <p className="text-sm text-blue-700">For dogs comfortable with structured spaces and supervised play.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-2">🔒 Private Stays</h4>
              <p className="text-sm text-purple-700">For dogs that need space, routine, or calm continuity.</p>
            </div>
          </div>

          {/* Boarding Facilities Grid */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {boardingFacilities.length} Boarding Facilities
          </h3>
          
          {boardingFacilities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No boarding facilities found. Try different filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardingFacilities.map((facility) => (
                <Card key={facility.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <img 
                      src={facility.image || facility.photos?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'} 
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-3 right-3 ${
                      facility.boarding_type === 'Home-style' ? 'bg-amber-500' :
                      facility.boarding_type === 'Premium' ? 'bg-blue-500' :
                      facility.boarding_type === 'Private' ? 'bg-purple-500' : 'bg-pink-500'
                    } text-white`}>
                      {facility.boarding_type}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-800 mb-1">{facility.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4" /> {facility.city}, {facility.state}
                    </p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{facility.description}</p>
                    
                    {/* Paw Score */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((paw) => (
                          <PawPrint 
                            key={paw}
                            className={`w-4 h-4 ${paw <= Math.round(facility.paw_score || 4) ? 'text-purple-500 fill-purple-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-purple-600">{(facility.paw_score || 4).toFixed(1)}</span>
                    </div>
                    
                    {/* Price & Contact */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{facility.price_range || '₹500-1,500/night'}</span>
                      {facility.phone && (
                        <a href={`tel:${facility.phone}`} className="text-purple-600 hover:text-purple-700">
                          <Phone className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                      onClick={() => { setSelectedProperty({...facility, property_type: 'boarding'}); setShowBookingModal(true); }}
                    >
                      Enquire Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Properties Grid - Only show when activeTab is 'stays' */}
      {activeTab === 'stays' && (
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {loading ? 'Loading...' : `${properties.length} Pet-Friendly Stays`}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property}
                isFavorite={favorites.includes(property.id)}
                onToggleFavorite={() => toggleFavorite(property.id)}
                onViewDetails={() => setSelectedProperty(property)}
                onBookNow={() => { setSelectedProperty(property); setShowBookingModal(true); }}
                getPropertyTypeIcon={getPropertyTypeIcon}
                getBadgeColor={getBadgeColor}
                PawRatingDisplay={PawRatingDisplay}
              />
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <Dog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No properties found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
      )}

      {/* Stay Products / Travel Essentials Section */}
      {bundles.length > 0 && (
        <div id="essentials" className="bg-gradient-to-b from-amber-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Stay Essentials</h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Curated travel kits and bundles for your pawcation. Everything your furry friend needs for a comfortable stay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bundles.slice(0, 8).map((bundle) => (
                <Card 
                  key={bundle.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedBundle(bundle)}
                  data-testid={`bundle-card-${bundle.id}`}
                >
                  <div className="relative h-40">
                    <img 
                      src={bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600'} 
                      alt={bundle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {bundle.discount_percent > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full text-xs font-bold text-white">
                        <Percent className="w-3 h-3" /> {Math.round(bundle.discount_percent)}% OFF
                      </div>
                    )}
                    
                    {bundle.featured && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-amber-500 rounded-full text-xs font-medium text-white">
                        <Sparkles className="w-3 h-3" /> Featured
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <h3 className="font-bold text-sm line-clamp-1">{bundle.name}</h3>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{bundle.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bundle.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-green-600">₹{bundle.bundle_price}</span>
                        {bundle.original_price > bundle.bundle_price && (
                          <span className="text-xs text-gray-400 line-through ml-1">₹{bundle.original_price}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: bundle.id,
                            name: bundle.name,
                            price: bundle.bundle_price,
                            image: bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
                            description: bundle.description,
                            category: 'stay_bundle',
                            pillar: 'stay'
                          }, 'Bundle', bundle.category || 'travel', 1);
                        }}
                        data-testid={`add-bundle-${bundle.id}`}
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {bundles.length > 8 && (
              <div className="text-center mt-6">
                <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                  View All {bundles.length} Bundles <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stay Socials / Pawcation Events Section */}
      {socials.length > 0 && (
        <div className="bg-gradient-to-b from-purple-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Pawcation Socials</h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Connect with fellow pet parents! Join group activities, meetups, and events at our partner properties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socials.slice(0, 6).map((social) => (
                <Card 
                  key={social.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedSocial(social)}
                  data-testid={`social-card-${social.id}`}
                >
                  <div className="relative h-36">
                    <img 
                      src={social.image || social.property_image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600'} 
                      alt={social.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-purple-600 rounded-full text-xs font-medium text-white capitalize">
                      <Users className="w-3 h-3" /> {social.event_type?.replace(/_/g, ' ')}
                    </div>
                    
                    {social.price_per_pet === 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                        FREE
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <h3 className="font-bold text-sm line-clamp-1">{social.title}</h3>
                      <p className="text-xs opacity-90 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {social.property_name || social.property_city}
                      </p>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {social.event_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {social.event_time}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{social.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Footprints className="w-3 h-3" />
                        <span>{social.current_participants || 0}/{social.max_participants} spots</span>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs">
                        Join Event
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {socials.length > 6 && (
              <div className="text-center mt-6">
                <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                  View All Events <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Planner Modal */}
      {showTripPlanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTripPlanner(false)}>
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setShowTripPlanner(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Plan Your Pawcation</h2>
                  <p className="opacity-90 text-sm">Get personalized recommendations for the perfect pet-friendly trip</p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {!tripPlan ? (
                // Trip Planner Form
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Where do you want to go?</label>
                      <select
                        value={tripForm.destination_city}
                        onChange={e => setTripForm({...tripForm, destination_city: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Destination</option>
                        {tripOptions.cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">What kind of trip?</label>
                      <select
                        value={tripForm.trip_type}
                        onChange={e => setTripForm({...tripForm, trip_type: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Trip Type</option>
                        {tripOptions.trip_types.map(type => (
                          <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Your Pet's Name</label>
                      <Input
                        value={tripForm.pet_name}
                        onChange={e => setTripForm({...tripForm, pet_name: e.target.value})}
                        placeholder="e.g., Bruno"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Breed (optional)</label>
                      <Input
                        value={tripForm.pet_breed}
                        onChange={e => setTripForm({...tripForm, pet_breed: e.target.value})}
                        placeholder="e.g., Golden Retriever"
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Check-in Date</label>
                      <Input
                        type="date"
                        value={tripForm.check_in_date}
                        onChange={e => setTripForm({...tripForm, check_in_date: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Check-out Date</label>
                      <Input
                        type="date"
                        value={tripForm.check_out_date}
                        onChange={e => setTripForm({...tripForm, check_out_date: e.target.value})}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-semibold"
                    onClick={generateTripPlan}
                    disabled={tripPlannerLoading}
                    data-testid="generate-trip-plan-btn"
                  >
                    {tripPlannerLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating Your Plan...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 mr-2" /> Generate My Pawcation Plan</>
                    )}
                  </Button>
                </div>
              ) : (
                // Trip Plan Results
                <div className="space-y-6">
                  {/* Header with edit option */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {tripPlan.destination || 'Your'} {tripPlan.trip_type && `${tripPlan.trip_type.replace(/_/g, ' ')}`} Pawcation
                      </h3>
                      <p className="text-gray-600 text-sm">Here's what we recommend for {tripForm.pet_name || 'your pup'}!</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTripPlan(null)}>
                      Edit Plan
                    </Button>
                  </div>

                  {/* Tips Section */}
                  {tripPlan.tips?.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Trip Tips for {tripForm.pet_name || 'Your Pup'}
                      </h4>
                      <ul className="space-y-1">
                        {tripPlan.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Properties */}
                  {tripPlan.properties?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Home className="w-4 h-4" /> Recommended Stays ({tripPlan.properties.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tripPlan.properties.slice(0, 6).map(property => (
                          <Card 
                            key={property.id} 
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => { setSelectedProperty(property); setShowTripPlanner(false); }}
                          >
                            <div className="relative h-24">
                              <img 
                                src={property.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                                alt={property.name}
                                className="w-full h-full object-cover"
                              />
                              {property.paw_rating?.overall && (
                                <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <PawPrint className="w-3 h-3" /> {property.paw_rating.overall.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <h5 className="font-semibold text-sm line-clamp-1">{property.name}</h5>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {property.city}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Bundles */}
                  {tripPlan.bundles?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Pack These Essentials
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {tripPlan.bundles.map(bundle => (
                          <Card 
                            key={bundle.id} 
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => { setSelectedBundle(bundle); setShowTripPlanner(false); }}
                          >
                            <div className="relative h-20">
                              <img 
                                src={bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
                                alt={bundle.name}
                                className="w-full h-full object-cover"
                              />
                              {bundle.discount_percent > 0 && (
                                <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  {Math.round(bundle.discount_percent)}% OFF
                                </span>
                              )}
                            </div>
                            <div className="p-2">
                              <h5 className="font-semibold text-xs line-clamp-1">{bundle.name}</h5>
                              <p className="text-xs text-green-600 font-bold">₹{bundle.bundle_price}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Events */}
                  {tripPlan.events?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <PartyPopper className="w-4 h-4" /> Upcoming Pawcation Socials
                      </h4>
                      <div className="space-y-2">
                        {tripPlan.events.map(event => (
                          <div 
                            key={event.id}
                            className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                            onClick={() => { setSelectedSocial(event); setShowTripPlanner(false); }}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={event.image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=200'}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm text-purple-800 line-clamp-1">{event.title}</h5>
                              <p className="text-xs text-purple-600 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> {event.event_date}
                                <MapPin className="w-3 h-3" /> {event.property_city}
                              </p>
                            </div>
                            {event.price_per_pet === 0 && (
                              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">FREE</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowTripPlanner(false)}
                  >
                    Start Browsing Stays
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Bundle Details Modal */}
      {selectedBundle && (
        <BundleDetailsModal 
          bundle={selectedBundle}
          onClose={() => setSelectedBundle(null)}
          addToCart={addToCart}
        />
      )}

      {/* Social Event Details Modal */}
      {selectedSocial && (
        <SocialDetailsModal 
          social={selectedSocial}
          onClose={() => setSelectedSocial(null)}
        />
      )}

      {/* Property Details Modal */}
      {selectedProperty && !showBookingModal && (
        <PropertyDetailsModal 
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onBookNow={() => setShowBookingModal(true)}
          getBadgeColor={getBadgeColor}
          PawRatingDisplay={PawRatingDisplay}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedProperty && (
        <BookingRequestModal
          property={selectedProperty}
          onClose={() => { setShowBookingModal(false); setSelectedProperty(null); }}
        />
      )}
      
      {/* Mira Contextual Panel */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="stay" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="stay" position="bottom" />
      </div>
    </div>
  );
};

// Property Card Component
const PropertyCard = ({ property, isFavorite, onToggleFavorite, onViewDetails, onBookNow, getPropertyTypeIcon, getBadgeColor, PawRatingDisplay }) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={onViewDetails}>
      <div className="relative h-48">
        <img 
          src={property.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'} 
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
          {getPropertyTypeIcon(property.property_type)}
          {property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1)}
        </div>

        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-12 left-3 flex items-center gap-1 px-2 py-1 bg-amber-500 rounded-full text-xs font-medium text-white">
            <Sparkles className="w-3 h-3" /> Featured
          </div>
        )}
        
        {/* Paw Reward Badge */}
        {property.paw_reward?.enabled && (
          <div className="absolute bottom-14 right-3 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-semibold text-white shadow-lg">
            <Gift className="w-3 h-3" /> Paw Reward
          </div>
        )}

        {/* Location & Name */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-lg line-clamp-1">{property.name}</h3>
          <p className="text-sm opacity-90 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {property.area}, {property.city}
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Paw Rating */}
        <div className="flex items-center justify-between mb-3">
          <PawRatingDisplay rating={property.paw_rating?.overall || 0} />
          {property.pet_policy?.pet_fee_per_night > 0 && (
            <span className="text-sm text-gray-600">
              ₹{property.pet_policy.pet_fee_per_night}/night pet fee
            </span>
          )}
        </div>

        {/* Pet Policy Snapshot */}
        {property.pet_policy_snapshot && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex items-start gap-1">
            <Dog className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {property.pet_policy_snapshot}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.badges?.slice(0, 4).map((badge, idx) => (
            <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(badge)}`}>
              {badge}
            </span>
          ))}
          {property.badges?.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              +{property.badges.length - 4} more
            </span>
          )}
        </div>

        {/* Vibe Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {property.vibe_tags?.slice(0, 3).map((vibe, idx) => (
            <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
              {vibe}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          >
            View Details
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
            onClick={(e) => { e.stopPropagation(); onBookNow(); }}
          >
            Request Booking
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Property Details Modal
const PropertyDetailsModal = ({ property, onClose, onBookNow, getBadgeColor, PawRatingDisplay }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header Image */}
        <div className="relative h-64">
          <img 
            src={property.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold">{property.name}</h2>
            <p className="flex items-center gap-1 opacity-90">
              <MapPin className="w-4 h-4" /> {property.area}, {property.city}, {property.state}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <PawRatingDisplay rating={property.paw_rating?.overall || 0} />
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {property.property_type}
            </span>
            {property.verified && (
              <>
                <span className="text-sm text-gray-500">|</span>
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {property.badges?.map((badge, idx) => (
              <span key={idx} className={`text-sm px-3 py-1 rounded-full ${getBadgeColor(badge)}`}>
                {badge}
              </span>
            ))}
          </div>
          
          {/* Paw Reward Banner */}
          {property.paw_reward?.enabled && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-amber-800">🎁 Paw Reward Included!</h4>
                    <span className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full">TDC Special</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">
                    {property.paw_reward.custom_message || "Every stay earns your dog a Paw Reward!"}
                  </p>
                  <div className="flex items-center gap-3 bg-white rounded-lg p-2">
                    {property.paw_reward.product_image && (
                      <img 
                        src={property.paw_reward.product_image} 
                        alt={property.paw_reward.product_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{property.paw_reward.product_name}</p>
                      <p className="text-xs text-green-600">Complimentary (Worth ₹{property.paw_reward.product_price})</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pet-policy">Pet Policy</TabsTrigger>
              <TabsTrigger value="paw-rating">Paw Rating</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <p className="text-gray-600">{property.description}</p>
              
              {property.highlights?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Highlights</h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {property.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {property.vibe_tags?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Vibe</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.vibe_tags.map((v, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pet-policy" className="mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <Dog className="w-5 h-5" /> {property.pet_policy_snapshot}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Max Pets per Room</p>
                  <p className="font-semibold">{property.pet_policy?.max_pets_per_room || 1}</p>
                </div>
                {property.pet_policy?.max_weight_kg && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Max Weight</p>
                    <p className="font-semibold">{property.pet_policy.max_weight_kg} kg</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Pet Fee</p>
                  <p className="font-semibold">
                    {property.pet_policy?.pet_fee_per_night > 0 
                      ? `₹${property.pet_policy.pet_fee_per_night}/night`
                      : 'No charge'}
                  </p>
                </div>
                {property.pet_policy?.pet_deposit > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Deposit</p>
                    <p className="font-semibold">₹{property.pet_policy.pet_deposit}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Pets Allowed In</h4>
                <div className="flex flex-wrap gap-2">
                  {property.pet_policy?.allowed_in_room && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Room</span>}
                  {property.pet_policy?.allowed_in_lawn && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Lawn/Garden</span>}
                  {property.pet_policy?.allowed_in_lobby && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Lobby</span>}
                  {property.pet_policy?.allowed_in_restaurant_outdoor && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Restaurant (Outdoor)</span>}
                  {property.pet_policy?.allowed_in_pool_area && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Pool Area</span>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="paw-rating" className="mt-4">
              <div className="space-y-4">
                {['comfort', 'safety', 'freedom', 'care', 'joy'].map(category => (
                  <div key={category} className="flex items-center gap-4">
                    <span className="w-20 capitalize text-gray-600">{category}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-amber-500 rounded-full h-3 transition-all"
                        style={{ width: `${(property.paw_rating?.[category] || 0) / 5 * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-semibold">{property.paw_rating?.[category]?.toFixed(1) || '0.0'}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 text-sm">
                  <strong>Paw Rating</strong> is The Doggy Company's proprietary scoring system. 
                  Each property is evaluated on 5 dimensions: Comfort (beds, bowls, space), 
                  Safety (hygiene, policies), Freedom (access areas), Care (grooming, vet support), 
                  and Joy (play zones, activities).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="mt-4">
              {property.human_amenities?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">For Humans</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.human_amenities.map((a, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.room_categories?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Room Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.room_categories.map((r, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.website && (
                <a 
                  href={property.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:underline"
                >
                  <Globe className="w-4 h-4" /> Visit Website
                </a>
              )}
            </TabsContent>
          </Tabs>

          {/* CTAs */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onBookNow}>
              <Calendar className="w-4 h-4 mr-2" /> Request Booking
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Booking Request Modal
const BookingRequestModal = ({ property, onClose }) => {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Pet Soul Integration - Multi-pet selection
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Array of selected pet IDs
  const [loadingPets, setLoadingPets] = useState(false);
  
  const [formData, setFormData] = useState({
    guest_name: user?.name || '',
    guest_email: user?.email || '',
    guest_phone: user?.phone || '',
    guest_whatsapp: user?.whatsapp || user?.phone || '',
    // Removed pet_weight_kg and pet_age as they come from Pet Soul records
    sleep_habits: '',
    fears: '',
    food_preferences: '',
    walking_times: '',
    triggers: '',
    favourite_toy: '',
    special_needs: '',
    check_in_date: '',
    check_out_date: '',
    num_rooms: 1,
    num_adults: 2,
    room_type_preference: '',
    special_requests: '',
    pet_meal_preorder: false,
    welcome_kit: false,
    grooming_requested: false,
    // Pet Soul fields
    selectedPetIds: []
  });
  
  // Auto-populate user data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        guest_name: prev.guest_name || user.name || '',
        guest_email: prev.guest_email || user.email || '',
        guest_phone: prev.guest_phone || user.phone || '',
        guest_whatsapp: prev.guest_whatsapp || user.whatsapp || user.phone || ''
      }));
    }
  }, [user]);
  
  // Fetch user's pets on mount
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user || !token) return;
      setLoadingPets(true);
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
          // Auto-select all pets by default
          if (pets.length > 0) {
            const allPetIds = pets.map(p => p.id);
            setSelectedPets(allPetIds);
            setFormData(prev => ({ ...prev, selectedPetIds: allPetIds }));
          }
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchUserPets();
  }, [user, token]);
  
  // Handle pet toggle - multi-select
  const togglePetSelection = (petId) => {
    setSelectedPets(prev => {
      const newSelection = prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId];
      setFormData(f => ({ ...f, selectedPetIds: newSelection }));
      return newSelection;
    });
  };

  // Get combined pet info for display
  const getSelectedPetsInfo = () => {
    return userPets.filter(p => selectedPets.includes(p.id));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.guest_name || !formData.guest_email || !formData.guest_phone) {
      alert('Please fill in all required guest details');
      setStep(1);
      return;
    }
    if (selectedPets.length === 0 && userPets.length > 0) {
      alert('Please select at least one pet for your trip');
      setStep(2);
      return;
    }
    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates');
      setStep(3);
      return;
    }
    
    setLoading(true);
    try {
      // Get selected pets data
      const petsData = getSelectedPetsInfo().map(pet => ({
        id: pet.id,
        name: pet.name,
        breed: pet.identity?.breed || pet.breed,
        weight: pet.identity?.weight,
        age: pet.age || calculateAge(pet.birthday)
      }));
      
      const response = await fetch(`${API_URL}/api/stay/booking-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          property_id: property.id,
          ...formData,
          num_pets: selectedPets.length,
          pets: petsData,
          selectedPetIds: selectedPets
        })
      });

      if (response.ok) {
        setSuccess(true);
        
        // Write to Pet Soul for each selected pet
        for (const petId of selectedPets) {
          if (token) {
            try {
              await fetch(`${API_URL}/api/pets/${petId}/soul/stay`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  type: 'stay_booking',
                  property_id: property.id,
                  property_name: property.name,
                  city: property.city,
                  check_in_date: formData.check_in_date,
                  check_out_date: formData.check_out_date,
                  property_type: property.property_type,
                  pet_fee: property.pet_policy?.pet_fee_per_night
                })
              });
            } catch (error) {
              console.error('Failed to update Pet Soul:', error);
            }
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || 'Failed to submit booking request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    const ageYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    return ageYears > 0 ? `${ageYears} year${ageYears > 1 ? 's' : ''}` : 'Less than 1 year';
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Request Sent!</h3>
          <p className="text-gray-600 mb-6">
            Our Stay Concierge® will contact you within 4 hours to confirm availability and finalize your booking at <strong>{property.name}</strong>.
          </p>
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-green-700">
              🐕 Travelling with: <strong>{getSelectedPetsInfo().map(p => p.name).join(', ') || 'Your pets'}</strong>
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Check your email and WhatsApp for updates!
          </p>
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onClose}>
            Done
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={onClose}>
      {/* Bottom sheet modal - improved UI */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col z-[9999]"
        style={{ height: '75vh', maxHeight: '750px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Improved with property image */}
        <div className="border-b bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-3 p-3">
            <img 
              src={property.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'} 
              alt={property.name}
              className="w-14 h-14 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800 truncate">{property.name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {property.city}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Step Indicator - Improved */}
          <div className="flex items-center justify-between px-4 pb-3">
            {['You', 'Pets', 'Trip'].map((label, idx) => (
              <div key={idx} className={`flex items-center ${idx < 2 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > idx + 1 ? 'bg-green-600 text-white' : step === idx + 1 ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > idx + 1 ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${step === idx + 1 ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
                {idx < 2 && <div className={`flex-1 h-1 mx-3 rounded ${step > idx + 1 ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 flex-1">
          <div className="py-4">
            {/* Step 1: Guest Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-lg">Your Details</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                    <Input 
                      value={formData.guest_name}
                      onChange={e => setFormData({...formData, guest_name: e.target.value})}
                      placeholder="Your full name"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                    <Input 
                      type="email"
                      value={formData.guest_email}
                      onChange={e => setFormData({...formData, guest_email: e.target.value})}
                      placeholder="your@email.com"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Phone *</label>
                    <Input 
                      value={formData.guest_phone}
                      onChange={e => setFormData({...formData, guest_phone: e.target.value})}
                      placeholder="+91 XXXXX XXXXX"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp (for updates)</label>
                    <Input 
                      value={formData.guest_whatsapp}
                      onChange={e => setFormData({...formData, guest_whatsapp: e.target.value})}
                      placeholder="Same as phone?"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pet Selection - Multi-select with checkboxes */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <PawPrint className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-lg">Who's Coming Along?</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Select all the furry friends joining this trip. Their details from Pet Soul will be shared with the property.
                </p>
                
                {loadingPets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-500">Loading your pets...</span>
                  </div>
                ) : userPets.length > 0 ? (
                  <div className="space-y-3">
                    {userPets.map((pet) => {
                      const isSelected = selectedPets.includes(pet.id);
                      const age = calculateAge(pet.birthday);
                      
                      return (
                        <div 
                          key={pet.id}
                          onClick={() => togglePetSelection(pet.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-green-600' : 'bg-white border-2 border-gray-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            
                            {/* Pet Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                              {pet.photo_url ? (
                                <img src={`${API_URL}${pet.photo_url}`} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <Dog className="w-6 h-6 text-amber-600" />
                              )}
                            </div>
                            
                            {/* Pet Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-gray-800">{pet.name}</h5>
                                {isSelected && <Badge className="bg-green-100 text-green-700 text-xs">Travelling</Badge>}
                              </div>
                              <p className="text-sm text-gray-500">
                                {pet.identity?.breed || pet.breed || 'Mixed breed'}
                                {age && ` • ${age}`}
                                {pet.identity?.weight && ` • ${pet.identity.weight}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Summary */}
                    {selectedPets.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
                        <p className="text-sm text-green-700 font-medium">
                          ✨ {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''} travelling: {getSelectedPetsInfo().map(p => p.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Dog className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 mb-3">No pets in your Pet Soul yet</p>
                    <p className="text-sm text-gray-400">Add your pets to get personalized experiences</p>
                  </div>
                )}
                
                {/* Additional pet details */}
                {selectedPets.length > 0 && (
                  <div className="space-y-3 mt-6 pt-4 border-t">
                    <h5 className="font-medium text-gray-700">Additional Travel Info (Optional)</h5>
                    <div>
                      <label className="text-sm text-gray-600">Any special needs or requests?</label>
                      <textarea 
                        value={formData.special_needs}
                        onChange={e => setFormData({...formData, special_needs: e.target.value})}
                        className="w-full p-3 border rounded-lg text-sm mt-1"
                        rows={2}
                        placeholder="e.g., Needs a quiet room, scared of fireworks..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Trip Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-lg">Trip Details</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Check-in Date *</label>
                    <Input 
                      type="date"
                      value={formData.check_in_date}
                      onChange={e => setFormData({...formData, check_in_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Check-out Date *</label>
                    <Input 
                      type="date"
                      value={formData.check_out_date}
                      onChange={e => setFormData({...formData, check_out_date: e.target.value})}
                      min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Rooms</label>
                    <Input 
                      type="number"
                      min={1}
                      value={formData.num_rooms}
                      onChange={e => setFormData({...formData, num_rooms: parseInt(e.target.value) || 1})}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Adults</label>
                    <Input 
                      type="number"
                      min={1}
                      value={formData.num_adults}
                      onChange={e => setFormData({...formData, num_adults: parseInt(e.target.value) || 1})}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Travel Summary Card */}
                {selectedPets.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mt-4">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <PawPrint className="w-4 h-4" /> Trip Summary
                    </h5>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>🏨 <strong>{property.name}</strong></p>
                      <p>🐕 {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''}: {getSelectedPetsInfo().map(p => p.name).join(', ')}</p>
                      {formData.check_in_date && formData.check_out_date && (
                        <p>📅 {new Date(formData.check_in_date).toLocaleDateString()} - {new Date(formData.check_out_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Services */}
                <div className="space-y-3 mt-4">
                  <h5 className="font-medium text-gray-700">Add-on Services</h5>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox"
                      checked={formData.pet_meal_preorder}
                      onChange={e => setFormData({...formData, pet_meal_preorder: e.target.checked})}
                      className="w-5 h-5 rounded text-green-600"
                    />
                    <div>
                      <span className="font-medium">Pet Meal Pre-order</span>
                      <p className="text-xs text-gray-500">Fresh meals waiting for your pet</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox"
                      checked={formData.welcome_kit}
                      onChange={e => setFormData({...formData, welcome_kit: e.target.checked})}
                      className="w-5 h-5 rounded text-green-600"
                    />
                    <div>
                      <span className="font-medium">Pet Welcome Kit</span>
                      <p className="text-xs text-gray-500">Treats, toys & essentials</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox"
                      checked={formData.grooming_requested}
                      onChange={e => setFormData({...formData, grooming_requested: e.target.checked})}
                      className="w-5 h-5 rounded text-green-600"
                    />
                    <div>
                      <span className="font-medium">Grooming Service</span>
                      <p className="text-xs text-gray-500">Spa day during your stay</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Special Requests</label>
                  <textarea 
                    value={formData.special_requests}
                    onChange={e => setFormData({...formData, special_requests: e.target.value})}
                    className="w-full p-3 border rounded-lg text-sm"
                    rows={2}
                    placeholder="Any special arrangements needed?"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation - Improved */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex gap-3">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button 
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={() => setStep(step + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button 
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Request Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bundle Details Modal Component
const BundleDetailsModal = ({ bundle, onClose, addToCart }) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      // Create cart item from bundle
      const cartItem = {
        id: bundle.id,
        name: bundle.name,
        price: bundle.bundle_price,
        image: bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        description: bundle.description,
        category: 'stay_bundle',
        pillar: 'stay',
        bundleItems: bundle.items,
        originalPrice: bundle.original_price,
        discountPercent: bundle.discount_percent
      };
      
      // Add to cart using the cart context
      addToCart(cartItem, 'Bundle', bundle.category || 'travel', 1);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose(); // Close modal after adding
      }, 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header Image */}
        <div className="relative h-48">
          <img 
            src={bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'}
            alt={bundle.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {bundle.discount_percent > 0 && (
            <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-red-500 rounded-full text-sm font-bold text-white">
              <Percent className="w-4 h-4" /> {Math.round(bundle.discount_percent)}% OFF
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold">{bundle.name}</h2>
            <p className="text-sm opacity-90 capitalize">{bundle.category?.replace(/_/g, ' ')} Bundle</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          <p className="text-gray-600 mb-4">{bundle.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {bundle.tags?.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Trip Types */}
          {bundle.for_trip_type?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Perfect for:</h4>
              <div className="flex flex-wrap gap-2">
                {bundle.for_trip_type.map((trip, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                    {trip.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Items in Bundle */}
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700 mb-3">What's Included ({bundle.items?.length} items)</h4>
            <div className="space-y-2">
              {bundle.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">x{item.quantity}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pricing */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bundle Price</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-green-600">₹{bundle.bundle_price}</span>
                  {bundle.original_price > bundle.bundle_price && (
                    <span className="text-lg text-gray-400 line-through">₹{bundle.original_price}</span>
                  )}
                </div>
                <p className="text-sm text-green-600">You save ₹{bundle.original_price - bundle.bundle_price}</p>
              </div>
              <Button 
                className={`px-6 py-3 ${added ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                onClick={handleAddToCart}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : added ? (
                  <><CheckCircle className="w-5 h-5 mr-2" /> Added!</>
                ) : (
                  <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Social Event Details Modal Component
const SocialDetailsModal = ({ social, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    member_phone: '',
    pet_name: '',
    pet_breed: '',
    num_pets: 1,
    special_requirements: ''
  });

  const handleRegister = async () => {
    if (!formData.member_name || !formData.member_email || !formData.pet_name) {
      alert('Please fill in required fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stay/social/events/${social.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          social_id: social.id,
          ...formData
        })
      });
      
      if (response.ok) {
        setRegistered(true);
      } else {
        const error = await response.json();
        alert(error.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">You're In!</h3>
          <p className="text-gray-600 mb-6">
            You've successfully registered for <strong>{social.title}</strong>. 
            We'll send you event details and reminders via email.
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onClose}>
            Done
          </Button>
        </Card>
      </div>
    );
  }

  const spotsLeft = (social.max_participants || 10) - (social.current_participants || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header Image */}
        <div className="relative h-44">
          <img 
            src={social.image || social.property_image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800'}
            alt={social.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium text-white capitalize">
              {social.event_type?.replace(/_/g, ' ')}
            </span>
            {social.price_per_pet === 0 && (
              <span className="px-3 py-1 bg-green-500 rounded-full text-sm font-bold text-white">FREE</span>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-xl font-bold">{social.title}</h2>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {social.property_name}, {social.property_city}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-11rem)]">
          {/* Event Info */}
          <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{social.event_date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{social.event_time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{spotsLeft} spots left</span>
            </div>
            {social.price_per_pet > 0 && (
              <div className="flex items-center gap-1 font-semibold text-purple-600">
                ₹{social.price_per_pet}/pet
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">{social.description}</p>
          
          {/* Activities */}
          {social.activities?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Activities</h4>
              <div className="flex flex-wrap gap-2">
                {social.activities.map((activity, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* What to Bring */}
          {social.what_to_bring?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">What to Bring</h4>
              <ul className="grid grid-cols-2 gap-1">
                {social.what_to_bring.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Registration Form */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3">Register for this Event</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Your Name *</label>
                <Input 
                  value={formData.member_name}
                  onChange={e => setFormData({...formData, member_name: e.target.value})}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Email *</label>
                <Input 
                  type="email"
                  value={formData.member_email}
                  onChange={e => setFormData({...formData, member_email: e.target.value})}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Phone</label>
                <Input 
                  value={formData.member_phone}
                  onChange={e => setFormData({...formData, member_phone: e.target.value})}
                  placeholder="+91 XXXXX XXXXX"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Pet Name *</label>
                <Input 
                  value={formData.pet_name}
                  onChange={e => setFormData({...formData, pet_name: e.target.value})}
                  placeholder="Your pet's name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Pet Breed</label>
                <Input 
                  value={formData.pet_breed}
                  onChange={e => setFormData({...formData, pet_breed: e.target.value})}
                  placeholder="e.g., Golden Retriever"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Number of Pets</label>
                <Input 
                  type="number"
                  min={1}
                  max={3}
                  value={formData.num_pets}
                  onChange={e => setFormData({...formData, num_pets: parseInt(e.target.value) || 1})}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600">Special Requirements</label>
              <textarea 
                value={formData.special_requirements}
                onChange={e => setFormData({...formData, special_requirements: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm mt-1"
                rows={2}
                placeholder="Any special needs or requirements..."
              />
            </div>
            
            <Button 
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
              onClick={handleRegister}
              disabled={loading || spotsLeft <= 0}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : spotsLeft <= 0 ? (
                'Event Full'
              ) : (
                <>Register Now {social.price_per_pet > 0 && `- ₹${social.price_per_pet}`}</>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="stay" position="bottom-left" />
    </div>
  );
};

export default StayPage;
