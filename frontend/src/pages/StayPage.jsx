import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { API_URL } from '../utils/api';
import {
  Search, Filter, MapPin, Star, Heart, Dog, Calendar, Phone, Globe, 
  ChevronRight, Sparkles, Shield, TreePine, Sun, Waves, Mountain,
  Home, Building2, Tent, CheckCircle, X, Users, Clock, Loader2,
  PawPrint, AlertTriangle, MessageCircle, ChevronDown
} from 'lucide-react';

const StayPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minRating: '',
    maxPetFee: '',
    vibe: ''
  });
  const [cities, setCities] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchProperties();
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('stay_favorites') || '[]');
    setFavorites(savedFavorites);
  }, []);

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
          <p className="text-sm opacity-75 max-w-2xl mx-auto">
            Discover India's most trusted pet-friendly stays. Each property is verified against 
            The Doggy Company Paw Standards for comfort, safety, and joy.
          </p>
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
      </div>

      {/* Properties Grid */}
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_whatsapp: '',
    pet_name: '',
    pet_breed: '',
    pet_weight_kg: '',
    pet_age: '',
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
    num_pets: 1,
    room_type_preference: '',
    special_requests: '',
    pet_meal_preorder: false,
    welcome_kit: false,
    grooming_requested: false
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/stay/booking-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          ...formData,
          pet_weight_kg: formData.pet_weight_kg ? parseFloat(formData.pet_weight_kg) : null
        })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        alert('Failed to submit booking request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Our Stay Concierge will contact you within 4 hours to confirm availability and finalize your booking at <strong>{property.name}</strong>.
          </p>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Request Booking</h3>
              <p className="text-sm text-gray-500">{property.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Guest Details</span>
            <span>Pet Profile</span>
            <span>Stay Details</span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Your Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <Input 
                    value={formData.guest_name}
                    onChange={e => setFormData({...formData, guest_name: e.target.value})}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <Input 
                    type="email"
                    value={formData.guest_email}
                    onChange={e => setFormData({...formData, guest_email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone *</label>
                  <Input 
                    value={formData.guest_phone}
                    onChange={e => setFormData({...formData, guest_phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                  <Input 
                    value={formData.guest_whatsapp}
                    onChange={e => setFormData({...formData, guest_whatsapp: e.target.value})}
                    placeholder="For faster updates"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Your Dog's Stay Profile</h4>
              <p className="text-sm text-gray-500 mb-4">
                Help us ensure your dog feels at home. This information helps the property prepare for your pet.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Pet Name *</label>
                  <Input 
                    value={formData.pet_name}
                    onChange={e => setFormData({...formData, pet_name: e.target.value})}
                    placeholder="e.g., Bruno"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Breed</label>
                  <Input 
                    value={formData.pet_breed}
                    onChange={e => setFormData({...formData, pet_breed: e.target.value})}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                  <Input 
                    type="number"
                    value={formData.pet_weight_kg}
                    onChange={e => setFormData({...formData, pet_weight_kg: e.target.value})}
                    placeholder="e.g., 25"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Age</label>
                  <Input 
                    value={formData.pet_age}
                    onChange={e => setFormData({...formData, pet_age: e.target.value})}
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sleep Habits</label>
                  <textarea 
                    value={formData.sleep_habits}
                    onChange={e => setFormData({...formData, sleep_habits: e.target.value})}
                    className="w-full p-2 border rounded-lg text-sm"
                    rows={2}
                    placeholder="e.g., Sleeps through the night, needs a soft bed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fears or Triggers</label>
                  <textarea 
                    value={formData.fears}
                    onChange={e => setFormData({...formData, fears: e.target.value})}
                    className="w-full p-2 border rounded-lg text-sm"
                    rows={2}
                    placeholder="e.g., Scared of fireworks, anxious around other large dogs"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Food Preferences</label>
                  <textarea 
                    value={formData.food_preferences}
                    onChange={e => setFormData({...formData, food_preferences: e.target.value})}
                    className="w-full p-2 border rounded-lg text-sm"
                    rows={2}
                    placeholder="e.g., Grain-free diet, allergic to chicken"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Walking Times</label>
                  <Input 
                    value={formData.walking_times}
                    onChange={e => setFormData({...formData, walking_times: e.target.value})}
                    placeholder="e.g., 7 AM and 6 PM"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Favourite Toy</label>
                  <Input 
                    value={formData.favourite_toy}
                    onChange={e => setFormData({...formData, favourite_toy: e.target.value})}
                    placeholder="e.g., Tennis ball, rope toy"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Stay Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-in Date *</label>
                  <Input 
                    type="date"
                    value={formData.check_in_date}
                    onChange={e => setFormData({...formData, check_in_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-out Date *</label>
                  <Input 
                    type="date"
                    value={formData.check_out_date}
                    onChange={e => setFormData({...formData, check_out_date: e.target.value})}
                    min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Rooms</label>
                  <Input 
                    type="number"
                    min={1}
                    value={formData.num_rooms}
                    onChange={e => setFormData({...formData, num_rooms: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Adults</label>
                  <Input 
                    type="number"
                    min={1}
                    value={formData.num_adults}
                    onChange={e => setFormData({...formData, num_adults: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pets</label>
                  <Input 
                    type="number"
                    min={1}
                    value={formData.num_pets}
                    onChange={e => setFormData({...formData, num_pets: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Room Preference</label>
                  <select
                    value={formData.room_type_preference}
                    onChange={e => setFormData({...formData, room_type_preference: e.target.value})}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value="">No preference</option>
                    {property.room_categories?.map((room, idx) => (
                      <option key={idx} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add-ons */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800 mb-3">Add-ons</h5>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.pet_meal_preorder}
                      onChange={e => setFormData({...formData, pet_meal_preorder: e.target.checked})}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm">Pre-order Pet Meals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.welcome_kit}
                      onChange={e => setFormData({...formData, welcome_kit: e.target.checked})}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm">Doggy Bakery Welcome Kit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.grooming_requested}
                      onChange={e => setFormData({...formData, grooming_requested: e.target.checked})}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm">Grooming on Arrival</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Special Requests</label>
                <textarea 
                  value={formData.special_requests}
                  onChange={e => setFormData({...formData, special_requests: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="Any other requirements..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.guest_name || !formData.guest_email || !formData.guest_phone)}
            >
              Next
            </Button>
          ) : (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={loading || !formData.check_in_date || !formData.check_out_date || !formData.pet_name}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StayPage;
