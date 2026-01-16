import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, MapPin, Star, 
  UtensilsCrossed, Check, AlertCircle, Phone, Globe, Instagram,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DineManager = ({ credentials }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const emptyRestaurant = {
    name: '',
    area: '',
    city: '',
    petMenuAvailable: 'no',
    petPolicy: 'outdoor',
    cuisine: [],
    tags: [],
    rating: 4.0,
    reviewCount: 0,
    priceRange: '₹₹',
    image: '',
    petMenuItems: [],
    timings: '',
    phone: '',
    instagram: '',
    website: '',
    featured: false,
    verified: false,
  };

  const [formData, setFormData] = useState(emptyRestaurant);

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  };

  // Fetch restaurants
  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/restaurants`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Save restaurant
  const saveRestaurant = async () => {
    try {
      const url = editingRestaurant 
        ? `${API_URL}/api/admin/dine/restaurants/${editingRestaurant.id}`
        : `${API_URL}/api/admin/dine/restaurants`;
      
      const method = editingRestaurant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchRestaurants();
        setEditingRestaurant(null);
        setIsAddingNew(false);
        setFormData(emptyRestaurant);
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
    }
  };

  // Delete restaurant
  const deleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/restaurants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        fetchRestaurants();
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  const startEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData(restaurant);
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingRestaurant(null);
    setFormData(emptyRestaurant);
  };

  const cancelEdit = () => {
    setEditingRestaurant(null);
    setIsAddingNew(false);
    setFormData(emptyRestaurant);
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPetMenuBadge = (status) => {
    switch (status) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" /> Pet Menu</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" /> Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600"><X className="w-3 h-3 mr-1" /> No Menu</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="dine-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Dine Management
          </h2>
          <p className="text-gray-500">Manage pet-friendly restaurants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRestaurants}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Add Restaurant
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Restaurants</p>
          <p className="text-3xl font-bold text-gray-900">{restaurants.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-600">With Pet Menu</p>
          <p className="text-3xl font-bold text-green-700">
            {restaurants.filter(r => r.petMenuAvailable === 'yes').length}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <p className="text-sm text-yellow-600">Partial Menu</p>
          <p className="text-3xl font-bold text-yellow-700">
            {restaurants.filter(r => r.petMenuAvailable === 'partial').length}
          </p>
        </Card>
        <Card className="p-4 bg-orange-50">
          <p className="text-sm text-orange-600">Featured</p>
          <p className="text-3xl font-bold text-orange-700">
            {restaurants.filter(r => r.featured).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Add/Edit Form */}
      {(isAddingNew || editingRestaurant) && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Restaurant Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., TherPup Café"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Area *</label>
              <Input
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                placeholder="e.g., Koramangala"
              />
            </div>
            <div>
              <label className="text-sm font-medium">City *</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="e.g., Bangalore"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pet Menu Available *</label>
              <select
                value={formData.petMenuAvailable}
                onChange={(e) => setFormData({...formData, petMenuAvailable: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="yes">Yes - Full Pet Menu</option>
                <option value="partial">Partial - Some Items</option>
                <option value="no">No - Pet-Friendly Only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Pet Policy *</label>
              <select
                value={formData.petPolicy}
                onChange={(e) => setFormData({...formData, petPolicy: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all-pets">All Pets Welcome</option>
                <option value="outdoor">Outdoor Seating Only</option>
                <option value="small-pets">Small Pets Only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cuisine (comma separated)</label>
              <Input
                value={formData.cuisine?.join(', ') || ''}
                onChange={(e) => setFormData({...formData, cuisine: e.target.value.split(',').map(s => s.trim())})}
                placeholder="e.g., Café, Continental, Pet-Friendly"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(s => s.trim())})}
                placeholder="e.g., Outdoor Seating, Dog Menu"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pet Menu Items (comma separated)</label>
              <Input
                value={formData.petMenuItems?.join(', ') || ''}
                onChange={(e) => setFormData({...formData, petMenuItems: e.target.value.split(',').map(s => s.trim())})}
                placeholder="e.g., Pupcakes, Dog Ice Cream"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price Range</label>
              <select
                value={formData.priceRange}
                onChange={(e) => setFormData({...formData, priceRange: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="₹">₹ - Budget</option>
                <option value="₹₹">₹₹ - Moderate</option>
                <option value="₹₹₹">₹₹₹ - Expensive</option>
                <option value="₹₹₹₹">₹₹₹₹ - Premium</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Rating</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Timings</label>
              <Input
                value={formData.timings}
                onChange={(e) => setFormData({...formData, timings: e.target.value})}
                placeholder="e.g., 10 AM - 10 PM"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Instagram</label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                placeholder="@restauranthandle"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Verified</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={saveRestaurant} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" /> Save Restaurant
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Restaurant List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading restaurants...</p>
          </Card>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="p-8 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900">No restaurants found</h3>
            <p className="text-gray-500 mb-4">Add your first pet-friendly restaurant</p>
            <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" /> Add Restaurant
            </Button>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-4">
              <div className="flex gap-4">
                {restaurant.image && (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        {restaurant.featured && (
                          <Badge className="bg-orange-100 text-orange-700">
                            <Star className="w-3 h-3 mr-1" /> Featured
                          </Badge>
                        )}
                        {restaurant.verified && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Check className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {restaurant.area}, {restaurant.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPetMenuBadge(restaurant.petMenuAvailable)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {restaurant.rating}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {restaurant.cuisine?.map((c, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>

                  {restaurant.petMenuItems?.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      🍽️ Menu: {restaurant.petMenuItems.join(', ')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => startEdit(restaurant)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteRestaurant(restaurant.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DineManager;
