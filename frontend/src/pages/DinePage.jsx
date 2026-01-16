import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, MapPin, Search, Filter, Star, Clock, 
  Dog, Cat, ChevronRight, Phone, Globe, Instagram,
  Utensils, Coffee, Pizza, Leaf, Heart, Check, X, AlertCircle,
  Sparkles, ShoppingBag, Truck
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Fresh Meals Data (Products from Celebrate pillar that fit Dine)
const freshMealsCategories = [
  { id: 'fresh-meals', name: 'Fresh Meals', icon: Utensils, description: 'Vet-approved fresh food' },
  { id: 'nut-butters', name: 'Nut Butters', icon: Coffee, description: 'Healthy spreads & treats' },
  { id: 'frozen', name: 'Frozen Treats', icon: Sparkles, description: 'Cool summer delights' },
];

// Sample Restaurant Data
const sampleRestaurants = [
  {
    id: 'therpup-cafe',
    name: 'TherPup Café',
    area: 'Koramangala',
    city: 'Bangalore',
    petMenuAvailable: 'yes',
    petPolicy: 'all-pets',
    cuisine: ['Café', 'Continental', 'Pet-Friendly'],
    tags: ['Outdoor Seating', 'Dog Menu', 'Pet Play Area', 'Instagram Worthy'],
    rating: 4.8,
    reviewCount: 156,
    priceRange: '₹₹',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    petMenuItems: ['Pupcakes', 'Dog Ice Cream', 'Meat Patties'],
    timings: '10 AM - 10 PM',
    phone: '+91 98765 43210',
    instagram: '@therpupcafe',
    featured: true,
  },
  {
    id: 'pet-people-cafe',
    name: 'The Pet People Cafe',
    area: 'Indiranagar',
    city: 'Bangalore',
    petMenuAvailable: 'partial',
    petPolicy: 'all-pets',
    cuisine: ['Café', 'Bakery', 'Pet-Friendly'],
    tags: ['Outdoor Seating', 'Pet Welcome', 'Cozy Ambience'],
    rating: 4.5,
    reviewCount: 89,
    priceRange: '₹₹',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
    petMenuItems: ['Water Bowl', 'Basic Treats'],
    timings: '9 AM - 9 PM',
    phone: '+91 98765 43211',
    instagram: '@petpeoplecafe',
    featured: false,
  },
  {
    id: 'reservoire',
    name: 'The Reservoire',
    area: 'Whitefield',
    city: 'Bangalore',
    petMenuAvailable: 'partial',
    petPolicy: 'outdoor',
    cuisine: ['Multi-Cuisine', 'Bar', 'Pet-Friendly'],
    tags: ['Outdoor Seating', 'Lake View', 'Weekend Brunch'],
    rating: 4.3,
    reviewCount: 234,
    priceRange: '₹₹₹',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    petMenuItems: [],
    timings: '11 AM - 11 PM',
    phone: '+91 98765 43212',
    instagram: '@thereservoire',
    featured: false,
  },
  {
    id: 'third-wave-coffee',
    name: 'Third Wave Coffee',
    area: 'HSR Layout',
    city: 'Bangalore',
    petMenuAvailable: 'no',
    petPolicy: 'outdoor',
    cuisine: ['Café', 'Coffee', 'Pet-Friendly'],
    tags: ['Outdoor Seating', 'Great Coffee', 'Work Friendly'],
    rating: 4.4,
    reviewCount: 567,
    priceRange: '₹₹',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    petMenuItems: [],
    timings: '8 AM - 11 PM',
    phone: '+91 98765 43213',
    instagram: '@thirdwavecoffee',
    featured: false,
  },
  {
    id: 'cafe-azzure',
    name: 'Cafe Azzure',
    area: 'Bandra',
    city: 'Mumbai',
    petMenuAvailable: 'yes',
    petPolicy: 'all-pets',
    cuisine: ['Italian', 'Continental', 'Pet-Friendly'],
    tags: ['Indoor Allowed', 'Dog Menu', 'Brunch Spot'],
    rating: 4.6,
    reviewCount: 312,
    priceRange: '₹₹₹',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
    petMenuItems: ['Pup Pizza', 'Dog Pasta', 'Frozen Yogurt'],
    timings: '9 AM - 11 PM',
    phone: '+91 98765 43214',
    instagram: '@cafeazzure',
    featured: true,
  },
  {
    id: 'paws-cafe',
    name: 'Paws & Claws Café',
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    petMenuAvailable: 'yes',
    petPolicy: 'all-pets',
    cuisine: ['Café', 'Desserts', 'Pet-Friendly'],
    tags: ['Pet Play Area', 'Dog Menu', 'Cat Friendly', 'Birthday Parties'],
    rating: 4.7,
    reviewCount: 198,
    priceRange: '₹₹',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800',
    petMenuItems: ['Pupcakes', 'Doggy Ice Cream', 'Cat Treats', 'Birthday Cakes'],
    timings: '10 AM - 9 PM',
    phone: '+91 98765 43215',
    instagram: '@pawsandclaws',
    featured: true,
  },
];

const DinePage = () => {
  const [restaurants, setRestaurants] = useState(sampleRestaurants);
  const [filteredRestaurants, setFilteredRestaurants] = useState(sampleRestaurants);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [petMenuFilter, setPetMenuFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [freshMeals, setFreshMeals] = useState([]);

  // Get unique cities
  const cities = ['all', ...new Set(restaurants.map(r => r.city))];

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.area.toLowerCase().includes(query) ||
        r.city.toLowerCase().includes(query) ||
        r.cuisine.some(c => c.toLowerCase().includes(query))
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

  // Fetch fresh meals products
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products?category=fresh-meals`);
        if (response.ok) {
          const data = await response.json();
          setFreshMeals(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching meals:', error);
      }
    };
    fetchMeals();
  }, []);

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
            <Link to="/meals">
              <Button variant="outline" className="gap-2">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {freshMealsCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} to={`/${cat.id}`}>
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
    </div>
  );
};

// Restaurant Card Component
const RestaurantCard = ({ restaurant, getPetMenuBadge, getPetPolicyText, featured, onSelect }) => (
  <Card 
    className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer ${featured ? 'ring-2 ring-orange-400' : ''}`}
    onClick={() => onSelect(restaurant)}
    data-testid={`restaurant-${restaurant.id}`}
  >
    <div className="relative h-48">
      <img 
        src={restaurant.image} 
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
      <div className="absolute top-3 right-3">
        {getPetMenuBadge(restaurant.petMenuAvailable)}
      </div>
      <div className="absolute bottom-3 left-3 flex gap-2">
        <Badge className="bg-black/70 text-white backdrop-blur-sm">
          {restaurant.priceRange}
        </Badge>
        <Badge className="bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" />
          {restaurant.rating}
        </Badge>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
        <MapPin className="w-4 h-4" />
        {restaurant.area}, {restaurant.city}
      </p>
      <div className="flex flex-wrap gap-1 mb-3">
        {restaurant.cuisine.slice(0, 3).map((c, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Dog className="w-3 h-3" />
          {getPetPolicyText(restaurant.petPolicy)}
        </span>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          Reserve
        </Button>
      </div>
    </div>
  </Card>
);

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
    // TODO: Submit to backend
    alert(`Reservation request sent for ${restaurant.name}! We'll confirm shortly.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-32">
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
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

          {restaurant.petMenuAvailable === 'yes' && (
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
