/**
 * Services Hub Page - Central page for all 89 services across 14 pillars
 * With intelligent filters, dynamic search, and personalization
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import MiraChatWidget from '../components/MiraChatWidget';
import { 
  Search, Filter, Clock, MapPin, DollarSign, Check, ChevronRight, 
  Loader2, Calendar, Sparkles, PawPrint, X, SlidersHorizontal,
  Star, Zap, Heart, TrendingUp, Info
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';

// All pillars with colors
const ALL_PILLARS = [
  { id: 'all', name: 'All Services', icon: '✨', color: 'from-gray-500 to-gray-600' },
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', color: 'from-pink-500 to-rose-600' },
  { id: 'dine', name: 'Dine', icon: '🍽️', color: 'from-orange-500 to-amber-600' },
  { id: 'stay', name: 'Stay', icon: '🏨', color: 'from-blue-500 to-indigo-600' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'from-sky-500 to-blue-600' },
  { id: 'care', name: 'Care', icon: '💊', color: 'from-rose-500 to-pink-600' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', color: 'from-green-500 to-emerald-600' },
  { id: 'fit', name: 'Fit', icon: '🏃', color: 'from-lime-500 to-green-600' },
  { id: 'learn', name: 'Learn', icon: '🎓', color: 'from-purple-500 to-violet-600' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', color: 'from-slate-500 to-gray-600' },
  { id: 'advisory', name: 'Advisory', icon: '📋', color: 'from-teal-500 to-cyan-600' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: 'from-red-500 to-rose-600' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', color: 'from-violet-500 to-purple-600' },
  { id: 'adopt', name: 'Adopt', icon: '🐾', color: 'from-amber-500 to-yellow-600' },
  { id: 'shop', name: 'Shop', icon: '🛒', color: 'from-indigo-500 to-blue-600' },
];

// Pet sizes
const PET_SIZES = [
  { id: 'toy', label: 'Toy', desc: '< 4kg' },
  { id: 'small', label: 'Small', desc: '4-10kg' },
  { id: 'medium', label: 'Medium', desc: '10-25kg' },
  { id: 'large', label: 'Large', desc: '25-40kg' },
  { id: 'giant', label: 'Giant', desc: '40kg+' }
];

// Cities
const CITIES = [
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'delhi', label: 'Delhi' },
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'hyderabad', label: 'Hyderabad' },
  { id: 'pune', label: 'Pune' }
];

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, pets } = useAuth();
  
  // Services state
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedPillar, setSelectedPillar] = useState(searchParams.get('pillar') || 'all');
  const [filterBookable, setFilterBookable] = useState(searchParams.get('bookable') || '');
  const [filterFree, setFilterFree] = useState(searchParams.get('free') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  
  // Price calculator modal
  const [selectedService, setSelectedService] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [priceConfig, setPriceConfig] = useState({
    city: 'mumbai',
    petSize: 'medium',
    petCount: 1,
    selectedAddOns: []
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [bookingData, setBookingData] = useState({ date: '', time: '', notes: '', petId: '' });
  const [booking, setBooking] = useState(false);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/api/service-catalog/services?limit=100`;
        if (selectedPillar && selectedPillar !== 'all') {
          url += `&pillar=${selectedPillar}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        setServices(data.services || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [selectedPillar]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/service-box/stats`);
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Filter services by search term
  const filteredServices = useMemo(() => {
    let result = services;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search) ||
        s.pillar?.toLowerCase().includes(search)
      );
    }
    
    if (filterBookable === 'true') {
      result = result.filter(s => s.is_bookable);
    } else if (filterBookable === 'false') {
      result = result.filter(s => !s.is_bookable);
    }
    
    if (filterFree) {
      result = result.filter(s => s.is_free);
    }
    
    return result;
  }, [services, searchTerm, filterBookable, filterFree]);

  // Handle pillar change
  const handlePillarChange = (pillarId) => {
    setSelectedPillar(pillarId);
    const newParams = new URLSearchParams(searchParams);
    if (pillarId === 'all') {
      newParams.delete('pillar');
    } else {
      newParams.set('pillar', pillarId);
    }
    setSearchParams(newParams);
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  // Price calculator
  const calculatePrice = async () => {
    if (!selectedService) return;
    
    setCalculating(true);
    try {
      const response = await fetch(`${API_URL}/api/service-catalog/calculate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          city: priceConfig.city,
          pet_size: priceConfig.petSize,
          pet_count: priceConfig.petCount,
          add_on_ids: priceConfig.selectedAddOns
        })
      });
      const data = await response.json();
      setCalculatedPrice(data);
    } catch (err) {
      console.error('Error calculating price:', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (showPriceModal && selectedService) {
      calculatePrice();
    }
  }, [showPriceModal, priceConfig, selectedService]);

  // Handle service click
  const handleServiceClick = (service) => {
    setSelectedService(service);
    
    if (pets && pets.length > 0) {
      const firstPet = pets[0];
      setPriceConfig(prev => ({
        ...prev,
        petSize: firstPet.size || 'medium',
        petCount: pets.length
      }));
      setBookingData(prev => ({ ...prev, petId: firstPet.id || firstPet._id }));
    }
    
    setShowPriceModal(true);
  };

  // Toggle add-on
  const toggleAddOn = (addOnId) => {
    setPriceConfig(prev => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.includes(addOnId)
        ? prev.selectedAddOns.filter(id => id !== addOnId)
        : [...prev.selectedAddOns, addOnId]
    }));
  };

  // Proceed to booking
  const proceedToBooking = () => {
    setShowPriceModal(false);
    setShowBookingModal(true);
  };

  // Submit booking
  const submitBooking = async () => {
    if (!selectedService || !bookingData.date || !bookingData.time) {
      toast({ title: 'Missing Info', description: 'Please select date and time', variant: 'destructive' });
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/mira/quick-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          serviceType: selectedService.id,
          serviceName: selectedService.name,
          pillar: selectedService.pillar,
          city: priceConfig.city,
          petSize: priceConfig.petSize,
          petCount: priceConfig.petCount,
          addOns: priceConfig.selectedAddOns,
          calculatedPrice: calculatedPrice?.total || selectedService.base_price,
          date: bookingData.date,
          time: bookingData.time,
          notes: bookingData.notes,
          pet_id: bookingData.petId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({ 
          title: '🎉 Booking Submitted!', 
          description: `Request #${data.request_id || data.booking_id} created.` 
        });
        setShowBookingModal(false);
        setSelectedService(null);
      } else {
        throw new Error(data.detail || 'Booking failed');
      }
    } catch (err) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  // Get pillar info
  const getPillarInfo = (pillarId) => {
    return ALL_PILLARS.find(p => p.id === pillarId) || ALL_PILLARS[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="text-center">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              {stats?.total || 89} Services Across 14 Pillars
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
              Services, Personalised
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-6">
              Find the perfect service for your pet. Dynamic pricing based on your city, pet size, and requirements.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search services... try 'grooming' or 'training'"
                  className="pl-12 pr-4 py-5 text-base rounded-full bg-white text-gray-900 border-0 shadow-xl"
                  data-testid="services-search"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar Filter Pills */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {ALL_PILLARS.map(pillar => (
              <button
                key={pillar.id}
                onClick={() => handlePillarChange(pillar.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-sm ${
                  selectedPillar === pillar.id
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`pillar-filter-${pillar.id}`}
              >
                <span>{pillar.icon}</span>
                <span className="font-medium">{pillar.name}</span>
                {pillar.id !== 'all' && stats?.by_pillar?.[pillar.id] && (
                  <Badge variant="secondary" className="ml-1 text-[10px] bg-white/20">
                    {stats.by_pillar[pillar.id]}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <Card className="p-3 bg-gradient-to-br from-violet-50 to-white border-violet-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-violet-600">{stats.total}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{stats.bookable}</p>
                  <p className="text-[10px] text-gray-500">Bookable</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">{stats.free}</p>
                  <p className="text-[10px] text-gray-500">Complimentary</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-white border-blue-100 hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{stats.consultation_required}</p>
                  <p className="text-[10px] text-gray-500">Consult</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-red-50 to-white border-red-100 hidden md:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{stats.emergency_24x7}</p>
                  <p className="text-[10px] text-gray-500">24x7</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* === FOR YOUR PETS - Personalized Section === */}
      {user && pets && pets.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">For Your Pets</h2>
                <p className="text-sm text-gray-500">Personalized recommendations based on your pet profiles</p>
              </div>
            </div>
            
            {/* Pet Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {pets.map(pet => (
                <button
                  key={pet.id || pet._id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-violet-100 hover:border-violet-300 transition-all"
                >
                  <span className="text-lg">{pet.species === 'cat' ? '🐱' : '🐕'}</span>
                  <span className="font-medium text-gray-900">{pet.name}</span>
                  <span className="text-xs text-gray-500">({pet.breed || pet.species})</span>
                </button>
              ))}
            </div>
            
            {/* Quick Recommendations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '💊', label: 'Health Check', service: 'vet', desc: 'Based on age' },
                { icon: '✂️', label: 'Grooming', service: 'grooming', desc: 'Coat care' },
                { icon: '🎓', label: 'Training', service: 'training', desc: 'Behavior support' },
                { icon: '🏃', label: 'Fitness', service: 'fitness', desc: 'Stay active' }
              ].map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchTerm(rec.service);
                    handleSearch(rec.service);
                  }}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all text-left"
                >
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{rec.label}</p>
                    <p className="text-xs text-gray-500">{rec.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedPillar === 'all' ? 'All Services' : `${getPillarInfo(selectedPillar).icon} ${getPillarInfo(selectedPillar).name} Services`}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredServices.length} services found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterFree(!filterFree)}
              className={filterFree ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : ''}
            >
              Complimentary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterBookable(filterBookable === 'true' ? '' : 'true')}
              className={filterBookable === 'true' ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
            >
              Bookable
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <PawPrint className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => { setSearchTerm(''); setSelectedPillar('all'); setFilterFree(false); setFilterBookable(''); }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredServices.map((service) => {
              const pillarInfo = getPillarInfo(service.pillar);
              return (
                <Card 
                  key={service.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-violet-200"
                  onClick={() => handleServiceClick(service)}
                  data-testid={`service-card-${service.id}`}
                >
                  {/* Gradient Header - Smaller on mobile */}
                  <div className={`h-14 sm:h-20 bg-gradient-to-br ${pillarInfo.color} flex items-center justify-center relative`}>
                    <span className="text-2xl sm:text-3xl">{pillarInfo.icon}</span>
                    <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-white/20 text-white text-[10px] sm:text-xs px-1.5">
                      {service.pillar_name || service.pillar}
                    </Badge>
                  </div>
                  
                  <div className="p-2 sm:p-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mb-1 sm:mb-2">
                      {service.is_free && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs px-1.5 py-0.5">Complimentary</Badge>
                      )}
                      {service.is_24x7 && (
                        <Badge className="bg-red-100 text-red-700 text-[10px] sm:text-xs px-1.5 py-0.5">24x7</Badge>
                      )}
                      {service.requires_consultation && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs px-1.5 py-0.5">Consult</Badge>
                      )}
                      {service.is_bookable && !service.is_free && (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-1.5 py-0.5">Bookable</Badge>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-violet-600 transition-colors line-clamp-2">
                      {service.name}
                    </h3>
                    
                    {/* Description - Hidden on mobile */}
                    <p className="hidden sm:block text-sm text-gray-500 mb-3 line-clamp-2">
                      {service.description || 'Professional service tailored for your pet'}
                    </p>
                    
                    {/* Price & Duration */}
                    <div className="flex items-center justify-between">
                      <div>
                        {service.is_free ? (
                          <span className="text-sm sm:text-lg font-bold text-emerald-600">Complimentary</span>
                        ) : service.base_price ? (
                          <span className="text-sm sm:text-lg font-bold text-gray-900">
                            ₹{service.base_price.toLocaleString()}
                            <span className="text-[10px] sm:text-xs text-gray-400 font-normal">+</span>
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-500">Quote</span>
                        )}
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center text-[10px] sm:text-sm text-gray-500">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          {service.duration_minutes}m
                        </div>
                      )}
                    </div>
                    
                    {/* CTA */}
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        {service.is_bookable ? 'Tap for price' : 'Learn more'}
                      </span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-violet-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Calculator Modal */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-violet-500" />
              Get Your Price
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-5">
              {/* Service Info */}
              <div className={`bg-gradient-to-r ${getPillarInfo(selectedService.pillar).color} p-4 rounded-xl text-white`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getPillarInfo(selectedService.pillar).icon}</span>
                  <Badge className="bg-white/20 text-white">{selectedService.pillar_name || selectedService.pillar}</Badge>
                </div>
                <h3 className="font-bold text-lg">{selectedService.name}</h3>
                <p className="text-sm text-white/80 mt-1">{selectedService.description}</p>
              </div>
              
              {/* Includes */}
              {selectedService.includes && selectedService.includes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedService.includes.slice(0, 4).map((item, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Check className="w-2 h-2 mr-1" /> {item}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* City */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Your City</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map(city => (
                    <button
                      key={city.id}
                      onClick={() => setPriceConfig(p => ({ ...p, city: city.id }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        priceConfig.city === city.id
                          ? 'bg-violet-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pet Size */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Pet Size</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PET_SIZES.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setPriceConfig(p => ({ ...p, petSize: size.id }))}
                      className={`px-2 py-2 rounded-lg text-center transition-all ${
                        priceConfig.petSize === size.id
                          ? 'bg-violet-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium">{size.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pet Count */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Pets</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(count => (
                    <button
                      key={count}
                      onClick={() => setPriceConfig(p => ({ ...p, petCount: count }))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        priceConfig.petCount === count
                          ? 'bg-violet-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count} Pet{count > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Add-ons */}
              {selectedService.add_ons && selectedService.add_ons.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Add-ons (Optional)</Label>
                  <div className="space-y-2">
                    {selectedService.add_ons.map(addon => (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                          priceConfig.selectedAddOns.includes(addon.id)
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            priceConfig.selectedAddOns.includes(addon.id) ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                          }`}>
                            {priceConfig.selectedAddOns.includes(addon.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        <span className="text-violet-600 font-bold">+₹{addon.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Price Breakdown */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-xl">
                {calculating ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Calculating...
                  </div>
                ) : calculatedPrice ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Base Price</span>
                      <span>₹{calculatedPrice.base_price}</span>
                    </div>
                    {calculatedPrice.modifiers?.city?.multiplier !== 1 && (
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-400">{calculatedPrice.modifiers.city.value} pricing</span>
                        <span>×{calculatedPrice.modifiers.city.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.modifiers?.pet_size?.multiplier !== 1 && (
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-400">{calculatedPrice.modifiers.pet_size.value} size</span>
                        <span>×{calculatedPrice.modifiers.pet_size.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.modifiers?.pet_count?.value > 1 && (
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-400">{calculatedPrice.modifiers.pet_count.value} pets</span>
                        <span>×{calculatedPrice.modifiers.pet_count.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.add_ons_total > 0 && (
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-400">Add-ons</span>
                        <span>+₹{calculatedPrice.add_ons_total}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                      <span className="text-lg font-bold">Your Price</span>
                      <span className="text-2xl font-bold text-violet-400">₹{calculatedPrice.total.toLocaleString()}</span>
                    </div>
                  </div>
                ) : selectedService.is_free ? (
                  <div className="text-center py-2">
                    <span className="text-2xl font-bold text-green-400">Free Service</span>
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-400">Select options above</div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>Cancel</Button>
            <Button 
              onClick={proceedToBooking}
              className="bg-violet-500 hover:bg-violet-600"
              disabled={calculating || (!calculatedPrice && !selectedService?.is_free)}
            >
              Book Now <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500" />
              Book {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {calculatedPrice && (
              <div className="bg-violet-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-700">Total Price</span>
                <span className="text-xl font-bold text-violet-600">₹{calculatedPrice.total.toLocaleString()}</span>
              </div>
            )}
            
            {pets && pets.length > 0 && (
              <div>
                <Label>Select Pet</Label>
                <select
                  value={bookingData.petId}
                  onChange={(e) => setBookingData(p => ({ ...p, petId: e.target.value }))}
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                >
                  {pets.map(pet => (
                    <option key={pet.id || pet._id} value={pet.id || pet._id}>
                      {pet.name} ({pet.breed || pet.species})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData(p => ({ ...p, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Preferred Time</Label>
              <select
                value={bookingData.time}
                onChange={(e) => setBookingData(p => ({ ...p, time: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                <option value="">Select time...</option>
                {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label>Special Requests (Optional)</Label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any special requirements..."
                className="w-full mt-1 border rounded-lg px-3 py-2 h-20 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>Back</Button>
            <Button 
              onClick={submitBooking}
              className="bg-violet-500 hover:bg-violet-600"
              disabled={booking}
            >
              {booking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
      <MiraChatWidget pillar="services" />
    </div>
  );
};

export default ServicesPage;
