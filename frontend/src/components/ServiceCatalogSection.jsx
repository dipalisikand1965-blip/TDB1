/**
 * ServiceCatalogSection - Public-facing services browser with dynamic pricing
 * Shows services from the service catalog with real-time price calculation
 */
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { 
  Clock, MapPin, DollarSign, Check, ChevronRight, Loader2,
  Calendar, Phone, Star, Sparkles, PawPrint, Info, X
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import CrossSellSection from './CrossSellSection';

// Pet size options
const PET_SIZES = [
  { id: 'toy', label: 'Toy', desc: '< 4kg', icon: '🐕' },
  { id: 'small', label: 'Small', desc: '4-10kg', icon: '🐕' },
  { id: 'medium', label: 'Medium', desc: '10-25kg', icon: '🐕' },
  { id: 'large', label: 'Large', desc: '25-40kg', icon: '🦮' },
  { id: 'giant', label: 'Giant', desc: '40kg+', icon: '🦮' }
];

// Cities
const CITIES = [
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'delhi', label: 'Delhi' },
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'hyderabad', label: 'Hyderabad' },
  { id: 'pune', label: 'Pune' },
  { id: 'other', label: 'Other' }
];

const ServiceCatalogSection = ({ pillar = 'care', title, subtitle, maxServices = 8 }) => {
  const { user, pets } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Price calculator state
  const [priceConfig, setPriceConfig] = useState({
    city: 'mumbai',
    petSize: 'medium',
    petCount: 1,
    selectedAddOns: []
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  // Booking state
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
    petId: ''
  });
  const [booking, setBooking] = useState(false);
  
  // Cross-sell state
  const [showCrossSell, setShowCrossSell] = useState(false);
  const [bookedService, setBookedService] = useState(null);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_URL}/api/service-catalog/services?pillar=${pillar}&limit=${maxServices}`);
        const data = await response.json();
        setServices(data.services || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [pillar, maxServices]);

  // Calculate price when config changes
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
      toast({ title: 'Error', description: 'Failed to calculate price', variant: 'destructive' });
    } finally {
      setCalculating(false);
    }
  };

  // Auto-calculate when modal opens or config changes
  useEffect(() => {
    if (showPriceModal && selectedService) {
      calculatePrice();
    }
  }, [showPriceModal, priceConfig, selectedService]);

  // Handle service selection
  const handleServiceClick = (service) => {
    setSelectedService(service);
    
    // Pre-fill pet info from user's pets
    if (pets && pets.length > 0) {
      const firstPet = pets[0];
      setPriceConfig(prev => ({
        ...prev,
        petSize: firstPet.size || 'medium',
        petCount: pets.length
      }));
      setBookingData(prev => ({ ...prev, petId: firstPet.id || firstPet._id }));
    }
    
    if (service.is_bookable && !service.is_free) {
      setShowPriceModal(true);
    } else if (service.requires_consultation) {
      // Direct to consultation flow
      toast({ title: 'Consultation Required', description: 'This service requires a consultation. Our team will reach out.' });
    } else {
      setShowPriceModal(true);
    }
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
          pillar: pillar,
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
          description: `Request #${data.request_id || data.booking_id} created. We'll confirm shortly.` 
        });
        setShowBookingModal(false);
        
        // Show cross-sell recommendations
        setBookedService(selectedService);
        setShowCrossSell(true);
        
        setSelectedService(null);
      } else {
        throw new Error(data.detail || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
    }
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

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="bg-rose-100 text-rose-700 mb-3">
            <Sparkles className="w-3 h-3 mr-1" />
            Service Catalog
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title || `${pillar.charAt(0).toUpperCase() + pillar.slice(1)} Services`}
          </h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            {subtitle || 'Browse our services with transparent pricing. Click any service to see your personalized price.'}
          </p>
        </div>

        {/* Services Grid - Mobile First: 2x2 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {services.map((service) => (
            <Card 
              key={service.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-rose-200"
              onClick={() => handleServiceClick(service)}
              data-testid={`service-card-${service.id}`}
            >
              {/* Image or Gradient Header - Smaller on mobile */}
              <div className={`h-16 sm:h-24 bg-gradient-to-br ${
                service.pillar === 'care' ? 'from-rose-400 to-pink-500' :
                service.pillar === 'fit' ? 'from-green-400 to-emerald-500' :
                service.pillar === 'travel' ? 'from-blue-400 to-indigo-500' :
                service.pillar === 'celebrate' ? 'from-pink-400 to-rose-500' :
                service.pillar === 'dine' ? 'from-orange-400 to-amber-500' :
                service.pillar === 'stay' ? 'from-blue-400 to-sky-500' :
                service.pillar === 'enjoy' ? 'from-green-400 to-teal-500' :
                service.pillar === 'learn' ? 'from-purple-400 to-indigo-500' :
                'from-purple-400 to-violet-500'
              } flex items-center justify-center`}>
                <span className="text-2xl sm:text-4xl">{service.pillar_icon || '💊'}</span>
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
                </div>
                
                {/* Title */}
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-rose-600 transition-colors line-clamp-2">
                  {service.name}
                </h3>
                
                {/* Description - Hidden on mobile for space */}
                <p className="hidden sm:block text-sm text-gray-500 mb-3 line-clamp-2">
                  {service.description}
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
                
                {/* CTA - Simplified on mobile */}
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {service.is_bookable ? 'Tap to book' : 'Learn more'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Price Calculator Modal - Mobile Optimized */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-rose-500" />
              Get Your Price
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4">
              {/* Service Info - Compact on mobile */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-3 sm:p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">{selectedService.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{selectedService.description}</p>
                {selectedService.includes && selectedService.includes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedService.includes.slice(0, 3).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs bg-white px-1.5 py-0.5">
                        <Check className="w-2 h-2 mr-0.5" /> {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* City Selection - Compact */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Your City</Label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {CITIES.map(city => (
                    <button
                      key={city.id}
                      onClick={() => setPriceConfig(p => ({ ...p, city: city.id }))}
                      className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        priceConfig.city === city.id
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pet Size - More compact grid */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Pet Size</Label>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {PET_SIZES.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setPriceConfig(p => ({ ...p, petSize: size.id }))}
                      className={`px-1 py-1.5 sm:px-2 sm:py-2 rounded-lg text-center transition-all ${
                        priceConfig.petSize === size.id
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-base sm:text-lg">{size.icon}</div>
                      <div className="text-[10px] sm:text-xs font-medium">{size.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pet Count */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Number of Pets</Label>
                <div className="flex gap-1.5 sm:gap-2">
                  {[1, 2, 3].map(count => (
                    <button
                      key={count}
                      onClick={() => setPriceConfig(p => ({ ...p, petCount: count }))}
                      className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        priceConfig.petCount === count
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count} Pet{count > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Add-ons - Compact */}
              {selectedService.add_ons && selectedService.add_ons.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Add-ons (Optional)</Label>
                  <div className="space-y-1.5">
                    {selectedService.add_ons.map(addon => (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-all ${
                          priceConfig.selectedAddOns.includes(addon.id)
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                            priceConfig.selectedAddOns.includes(addon.id) ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                          }`}>
                            {priceConfig.selectedAddOns.includes(addon.id) && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                          </div>
                          <span className="font-medium text-xs sm:text-sm">{addon.name}</span>
                        </div>
                        <span className="text-rose-600 font-bold text-xs sm:text-sm">+₹{addon.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Calculated Price - Compact */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3 sm:p-5 rounded-xl">
                {calculating ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Calculating...</span>
                  </div>
                ) : calculatedPrice ? (
                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-gray-400">Base Price</span>
                      <span>₹{calculatedPrice.base_price}</span>
                    </div>
                    {calculatedPrice.modifiers?.city?.multiplier !== 1 && (
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-gray-400">{calculatedPrice.modifiers.city.value}</span>
                        <span>×{calculatedPrice.modifiers.city.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.modifiers?.pet_size?.multiplier !== 1 && (
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-gray-400">{calculatedPrice.modifiers.pet_size.value}</span>
                        <span>×{calculatedPrice.modifiers.pet_size.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.modifiers?.pet_count?.value > 1 && (
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-gray-400">{calculatedPrice.modifiers.pet_count.value} pets</span>
                        <span>×{calculatedPrice.modifiers.pet_count.multiplier}</span>
                      </div>
                    )}
                    {calculatedPrice.add_ons_total > 0 && (
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-gray-400">Add-ons</span>
                        <span>+₹{calculatedPrice.add_ons_total}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="font-bold">Your Price</span>
                      <span className="text-xl sm:text-2xl font-bold text-rose-400">₹{calculatedPrice.total.toLocaleString()}</span>
                    </div>
                    {calculatedPrice.deposit_amount && (
                      <div className="mt-2 text-xs text-gray-400">
                        <Info className="w-3 h-3 inline mr-1" />
                        Pay ₹{calculatedPrice.deposit_amount} deposit to book
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-400 text-sm">Select options above</div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowPriceModal(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={proceedToBooking}
              className="bg-rose-500 hover:bg-rose-600 flex-1 sm:flex-none"
              disabled={calculating || !calculatedPrice}
            >
              Book Now
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              Book {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Price Summary */}
            {calculatedPrice && (
              <div className="bg-rose-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-700">Total Price</span>
                <span className="text-xl font-bold text-rose-600">₹{calculatedPrice.total.toLocaleString()}</span>
              </div>
            )}
            
            {/* Pet Selector */}
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
            
            {/* Date */}
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
            
            {/* Time */}
            <div>
              <Label>Preferred Time</Label>
              <select
                value={bookingData.time}
                onChange={(e) => setBookingData(p => ({ ...p, time: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                <option value="">Select time...</option>
                {(selectedService?.available_time_slots || ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']).map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            {/* Notes */}
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
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              Back
            </Button>
            <Button 
              onClick={submitBooking}
              className="bg-rose-500 hover:bg-rose-600"
              disabled={booking}
            >
              {booking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cross-Sell Modal - Show related products after booking */}
      <Dialog open={showCrossSell} onOpenChange={setShowCrossSell}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Sparkles className="w-5 h-5 text-rose-500" />
              Complete Your {pillar?.charAt(0).toUpperCase() + pillar?.slice(1)} Routine
            </DialogTitle>
            <button 
              onClick={() => { setShowCrossSell(false); setBookedService(null); }}
              className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          
          {bookedService && (
            <CrossSellSection
              serviceId={bookedService.id}
              serviceName={bookedService.name}
              pillar={pillar}
              maxProducts={4}
              onAddToCart={(product) => {
                // Could integrate with cart context here
                console.log('Add to cart:', product);
              }}
            />
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setShowCrossSell(false); setBookedService(null); }}
              className="w-full"
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceCatalogSection;
