import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, MapPin, Search, Filter, Star, Clock, 
  Dog, Cat, ChevronRight, Phone, Globe, Instagram,
  Utensils, Coffee, Pizza, Leaf, Heart, Check, X, AlertCircle,
  Sparkles, ShoppingBag, Truck, Users, Calendar, MessageCircle, Send,
  Bell, Gift, Cake
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Get user from localStorage
const getUser = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Fresh Meals Categories
const freshMealsCategories = [
  { id: 'treats', name: 'Fresh Treats', icon: Utensils, description: 'Vet-approved fresh treats', path: '/search?q=treats' },
  { id: 'meals', name: 'Fresh Meals', icon: Coffee, description: 'Nutritious meals & food', path: '/search?q=meals' },
  { id: 'birthday', name: 'Birthday Cakes', icon: Sparkles, description: 'Celebrate with your pet', path: '/search?q=cake' },
];

const DinePage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [petMenuFilter, setPetMenuFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuddyModal, setShowBuddyModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(getUser());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch restaurants from API
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/dine/restaurants`);
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data.restaurants || []);
          setFilteredRestaurants(data.restaurants || []);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Get unique cities
  const cities = ['all', ...new Set(restaurants.map(r => r.city))];

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(query) ||
        r.area?.toLowerCase().includes(query) ||
        r.city?.toLowerCase().includes(query) ||
        r.cuisine?.some(c => c.toLowerCase().includes(query))
      );
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(r => r.city === selectedCity);
    }

    if (petMenuFilter !== 'all') {
      filtered = filtered.filter(r => r.petMenuAvailable === petMenuFilter);
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCity, petMenuFilter, restaurants]);

  const getPetMenuBadge = (status) => {
    switch (status) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" /> Pet Menu</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> Partial Menu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200"><X className="w-3 h-3 mr-1" /> No Pet Menu</Badge>;
    }
  };

  const getPetPolicyText = (policy) => {
    switch (policy) {
      case 'all-pets': return 'All pets welcome';
      case 'outdoor': return 'Outdoor seating only';
      case 'small-pets': return 'Small pets only';
      default: return 'Check with restaurant';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200"
            alt="Pet Dining"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Dine</h1>
              <p className="text-orange-100">Fresh Meals & Pet-Friendly Dining</p>
            </div>
          </div>
          <p className="text-lg md:text-xl max-w-2xl opacity-90">
            Discover nutritious fresh meals for your pet and find the best pet-friendly restaurants near you!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Fresh Meals Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-6 h-6 text-orange-500" />
                Fresh Pet Meals
              </h2>
              <p className="text-gray-600">Vet-approved, delivered to your door</p>
            </div>
            <Link to="/search?q=fresh">
              <Button variant="outline" className="gap-2">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {freshMealsCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} to={cat.path}>
                  <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-orange-500 transition-colors" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Pet Buddy Section - NEW */}
        <section className="mb-16">
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-20">
              <Users className="w-48 h-48 -mr-12 -mt-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Pet Buddy Meetups</h2>
                <Badge className="bg-white/20 text-white ml-2">NEW</Badge>
              </div>
              <p className="text-white/90 mb-4 max-w-xl">
                Going to a pet-friendly restaurant? Let other pet parents know! Schedule your visit and connect with fellow pet lovers for playdates and socializing.
              </p>
              <div className="flex gap-3">
                <Button className="bg-white text-purple-600 hover:bg-gray-100">
                  <Calendar className="w-4 h-4 mr-2" /> Schedule a Visit
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/20">
                  <MessageCircle className="w-4 h-4 mr-2" /> View Meetups
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Pet-Friendly Restaurants Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Coffee className="w-6 h-6 text-orange-500" />
              Pet-Friendly Restaurants
            </h2>
            <p className="text-gray-600">Dine out with your furry friend</p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="restaurant-search"
                  />
                </div>
              </div>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm bg-white"
                data-testid="city-filter"
              >
                <option value="all">All Cities</option>
                {cities.filter(c => c !== 'all').map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Pet Menu Filter */}
              <select
                value={petMenuFilter}
                onChange={(e) => setPetMenuFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm bg-white"
                data-testid="pet-menu-filter"
              >
                <option value="all">All Restaurants</option>
                <option value="yes">🍽️ Pet Menu Available</option>
                <option value="partial">⚠️ Partial Menu</option>
                <option value="no">🐕 Pet-Friendly Only</option>
              </select>
            </div>
          </Card>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading restaurants...</p>
            </div>
          ) : (
            <>
              {/* Featured Restaurants */}
              {filteredRestaurants.some(r => r.featured) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Featured
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredRestaurants.filter(r => r.featured).map((restaurant) => (
                      <RestaurantCard 
                        key={restaurant.id} 
                        restaurant={restaurant} 
                        getPetMenuBadge={getPetMenuBadge}
                        getPetPolicyText={getPetPolicyText}
                        featured={true}
                        onSelect={setSelectedRestaurant}
                        onBuddy={setShowBuddyModal}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Restaurants */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.filter(r => !r.featured).map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant}
                    getPetMenuBadge={getPetMenuBadge}
                    getPetPolicyText={getPetPolicyText}
                    onSelect={setSelectedRestaurant}
                    onBuddy={setShowBuddyModal}
                  />
                ))}
              </div>

              {filteredRestaurants.length === 0 && (
                <Card className="p-12 text-center">
                  <Dog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query</p>
                </Card>
              )}
            </>
          )}
        </section>

        {/* Add Your Restaurant CTA */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Own a Pet-Friendly Restaurant?</h3>
          <p className="opacity-90 mb-6">List your restaurant on The Doggy Company and reach thousands of pet parents!</p>
          <Link to="/contact">
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              Partner With Us
            </Button>
          </Link>
        </Card>
      </div>

      {/* Reservation Modal */}
      {selectedRestaurant && (
        <ReservationModal 
          restaurant={selectedRestaurant} 
          onClose={() => setSelectedRestaurant(null)}
          getPetMenuBadge={getPetMenuBadge}
        />
      )}

      {/* Pet Buddy Modal */}
      {showBuddyModal && (
        <PetBuddyModal
          restaurant={showBuddyModal}
          onClose={() => setShowBuddyModal(null)}
        />
      )}
    </div>
  );
};

// Restaurant Card Component
const RestaurantCard = ({ restaurant, getPetMenuBadge, getPetPolicyText, featured, onSelect, onBuddy }) => (
  <Card 
    className={`overflow-hidden hover:shadow-xl transition-all ${featured ? 'ring-2 ring-orange-400' : ''}`}
    data-testid={`restaurant-${restaurant.id}`}
  >
    <div className="relative h-48 cursor-pointer" onClick={() => onSelect(restaurant)}>
      <img 
        src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'} 
        alt={restaurant.name}
        className="w-full h-full object-cover"
      />
      {featured && (
        <div className="absolute top-3 left-3">
          <Badge className="bg-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" /> Featured
          </Badge>
        </div>
      )}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {getPetMenuBadge(restaurant.petMenuAvailable)}
        {restaurant.birthdayPerks && (
          <Badge className="bg-pink-500 text-white">
            🎂 Birthday Perks
          </Badge>
        )}
      </div>
      <div className="absolute bottom-3 left-3 flex gap-2">
        <Badge className="bg-black/70 text-white backdrop-blur-sm">
          {restaurant.priceRange || '₹₹'}
        </Badge>
        <Badge className="bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" />
          {restaurant.rating || 4.0}
        </Badge>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg text-gray-900 mb-1 cursor-pointer hover:text-orange-600" onClick={() => onSelect(restaurant)}>
        {restaurant.name}
      </h3>
      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
        <MapPin className="w-4 h-4" />
        {restaurant.area}, {restaurant.city}
      </p>
      
      {/* Concierge® Recommendation */}
      {restaurant.conciergeRecommendation && (
        <div className="p-2 bg-purple-50 rounded-lg mb-3 border border-purple-100">
          <p className="text-xs text-purple-700 flex items-start gap-1">
            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2"><strong>Concierge®:</strong> {restaurant.conciergeRecommendation}</span>
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1 mb-3">
        {restaurant.cuisine?.slice(0, 3).map((c, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Dog className="w-3 h-3" />
          {getPetPolicyText(restaurant.petPolicy)}
        </span>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onBuddy(restaurant); }}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Users className="w-3 h-3 mr-1" /> Buddy
          </Button>
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={(e) => { e.stopPropagation(); onSelect(restaurant); }}
          >
            Reserve
          </Button>
        </div>
      </div>
    </div>
  </Card>
);

// Pet Buddy Modal - NEW
const PetBuddyModal = ({ restaurant, onClose }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  const [visitForm, setVisitForm] = useState({
    date: '',
    time_slot: 'afternoon',
    looking_for_buddies: true,
    notes: ''
  });
  const [upcomingVisits, setUpcomingVisits] = useState([]);

  // Fetch upcoming visits
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dine/restaurants/${restaurant.id}/visits`);
        if (response.ok) {
          const data = await response.json();
          setUpcomingVisits(data.visits || []);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      }
    };
    fetchVisits();
  }, [restaurant.id]);

  const handleScheduleVisit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dine/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          ...visitForm
        })
      });
      
      if (response.ok) {
        alert('Visit scheduled! Other pet parents can now see your planned visit.');
        setSchedulingVisit(false);
        setVisitForm({ date: '', time_slot: 'afternoon', looking_for_buddies: true, notes: '' });
        // Refresh visits
        const refreshResponse = await fetch(`${API_URL}/api/dine/restaurants/${restaurant.id}/visits`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setUpcomingVisits(data.visits || []);
        }
      }
    } catch (error) {
      console.error('Error scheduling visit:', error);
    }
  };

  const handleSendMeetupRequest = async (visitId) => {
    try {
      const response = await fetch(`${API_URL}/api/dine/meetup-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_id: visitId,
          message: "Hey! Would love to meet up with you and your pet!"
        })
      });
      
      if (response.ok) {
        alert('Meetup request sent!');
      }
    } catch (error) {
      console.error('Error sending meetup request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative h-24 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-3 left-4 text-white">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-lg">Pet Buddy Meetups</h3>
            </div>
            <p className="text-sm opacity-90">{restaurant.name}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upcoming' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Users className="w-4 h-4 inline mr-1" /> Who's Going ({upcomingVisits.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'schedule' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar className="w-4 h-4 inline mr-1" /> Schedule Visit
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'upcoming' ? (
            <div className="space-y-4">
              {upcomingVisits.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No visits scheduled yet</p>
                  <p className="text-sm text-gray-400">Be the first to plan a visit!</p>
                  <Button 
                    className="mt-4 bg-purple-500 hover:bg-purple-600"
                    onClick={() => setActiveTab('schedule')}
                  >
                    Schedule Your Visit
                  </Button>
                </div>
              ) : (
                upcomingVisits.map((visit) => (
                  <Card key={visit.id} className="p-4 border-purple-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{visit.date}</span>
                          <Badge variant="outline" className="text-xs capitalize">{visit.time_slot}</Badge>
                        </div>
                        {visit.pets?.length > 0 && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Dog className="w-3 h-3" />
                            {visit.pets.map(p => p.name).join(', ')}
                          </p>
                        )}
                        {visit.notes && (
                          <p className="text-sm text-gray-500 mt-1">"{visit.notes}"</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-purple-500 hover:bg-purple-600"
                        onClick={() => handleSendMeetupRequest(visit.id)}
                      >
                        <Send className="w-3 h-3 mr-1" /> Connect
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  value={visitForm.date}
                  onChange={(e) => setVisitForm({...visitForm, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Time Slot</label>
                <select
                  value={visitForm.time_slot}
                  onChange={(e) => setVisitForm({...visitForm, time_slot: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="morning">Morning (9 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 10 PM)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={2}
                  placeholder="e.g., Bringing my Golden Retriever, looking for playmates!"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitForm.looking_for_buddies}
                  onChange={(e) => setVisitForm({...visitForm, looking_for_buddies: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm">I'm open to meetups with other pet parents</span>
              </label>
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={handleScheduleVisit}
                disabled={!visitForm.date}
              >
                <Calendar className="w-4 h-4 mr-2" /> Schedule My Visit
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Reservation Modal
const ReservationModal = ({ restaurant, onClose, getPetMenuBadge }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: 2,
    pets: 1,
    petMealPreorder: false,
    specialRequests: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/dine/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          ...formData
        })
      });
      
      if (response.ok) {
        alert(`Reservation request sent for ${restaurant.name}! We'll confirm shortly.`);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting reservation:', error);
      alert('Failed to submit reservation. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-32">
          <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <h3 className="font-bold text-xl">{restaurant.name}</h3>
            <p className="text-sm opacity-90">{restaurant.area}, {restaurant.city}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mira Recommendation in Modal */}
        {restaurant.miraRecommendation && (
          <div className="mx-4 mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Mira recommends:</strong> {restaurant.miraRecommendation}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Pet Menu Status</span>
            {getPetMenuBadge(restaurant.petMenuAvailable)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Your Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Time</label>
              <Input 
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Guests</label>
              <Input 
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pets</label>
              <Input 
                type="number"
                min="1"
                value={formData.pets}
                onChange={(e) => setFormData({...formData, pets: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {restaurant.petMenuAvailable === 'yes' && restaurant.petMenuItems?.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.petMealPreorder}
                  onChange={(e) => setFormData({...formData, petMealPreorder: e.target.checked})}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <div>
                  <span className="font-medium text-green-800">Pre-order Pet Meal</span>
                  <p className="text-xs text-green-600">Available: {restaurant.petMenuItems?.join(', ')}</p>
                </div>
              </label>
            </div>
          )}

          {/* Pet Menu Image */}
          {restaurant.petMenuImage && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">📋 View Pet Menu</p>
              <img 
                src={restaurant.petMenuImage} 
                alt="Pet Menu"
                className="w-full rounded-lg border cursor-pointer hover:opacity-90"
                onClick={() => window.open(restaurant.petMenuImage, '_blank')}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Special Requests</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              className="w-full p-3 border rounded-lg text-sm"
              rows={3}
              placeholder="Any special requirements for you or your pet..."
            />
          </div>

          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Request Reservation
          </Button>

          <p className="text-xs text-center text-gray-500">
            Our team will confirm availability within 2 hours
          </p>
        </form>
      </Card>
    </div>
  );
};

export default DinePage;
