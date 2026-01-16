import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, MapPin, Star, 
  UtensilsCrossed, Check, AlertCircle, Phone, Globe, Instagram,
  RefreshCw, Upload, Download, FileSpreadsheet, Image as ImageIcon,
  ExternalLink, MessageSquare, Sparkles
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPetMenu, setUploadingPetMenu] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  const fileInputRef = useRef(null);
  const petMenuInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const emptyRestaurant = {
    name: '',
    area: '',
    city: '',
    address: '',
    petMenuAvailable: 'no',
    petPolicy: 'outdoor',
    cuisine: [],
    tags: [],
    rating: 4.0,
    reviewCount: 0,
    priceRange: '₹₹',
    image: '',
    petMenuItems: [],
    petMenuImage: '',
    timings: '',
    phone: '',
    instagram: '',
    website: '',
    zomatoLink: '',
    googleMapsLink: '',
    conciergeRecommendation: '',
    specialOffers: '',
    birthdayPerks: false,
    featured: false,
    verified: false,
    country: 'India',
    state: '',
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

  // Image upload handler
  const handleImageUpload = async (e, field = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = field === 'petMenuImage' ? setUploadingPetMenu : setUploadingImage;
    setUploading(true);
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const endpoint = field === 'petMenuImage' 
      ? `${API_URL}/api/admin/dine/upload-pet-menu`
      : `${API_URL}/api/admin/dine/upload-image`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = `${API_URL}${data.url}`;
        setFormData(prev => ({ ...prev, [field]: imageUrl }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
      if (field === 'petMenuImage' && petMenuInputRef.current) {
        petMenuInputRef.current.value = '';
      } else if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // CSV Export handler
  const handleExportCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/export-csv`, {
        headers: { 'Authorization': getAuthHeader() }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurants_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export CSV');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    }
  };

  // CSV Import handler
  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    setImportResult(null);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/admin/dine/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setImportResult(data);
        fetchRestaurants();
      } else {
        const error = await response.json();
        alert(`Failed to import CSV: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error importing CSV');
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const startEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({...emptyRestaurant, ...restaurant});
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Dine Management
          </h2>
          <p className="text-gray-500">Manage pet-friendly restaurants</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchRestaurants} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExportCsv}
            disabled={restaurants.length === 0}
            data-testid="export-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => csvInputRef.current?.click()}
            disabled={importingCsv}
            data-testid="import-csv-btn"
          >
            {importingCsv ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
            ) : (
              <><FileSpreadsheet className="w-4 h-4 mr-2" /> Import CSV</>
            )}
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCsv}
            className="hidden"
          />
          
          <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600" data-testid="add-restaurant-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Restaurant
          </Button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-800">CSV Import Complete</h4>
              <p className="text-sm text-green-700">
                {importResult.imported} new restaurants added, {importResult.updated} updated
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportResult(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="p-4 bg-pink-50">
          <p className="text-sm text-pink-600">🎂 Birthday Perks</p>
          <p className="text-3xl font-bold text-pink-700">
            {restaurants.filter(r => r.birthdayPerks).length}
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
            data-testid="search-restaurants"
          />
        </div>
      </Card>

      {/* Add/Edit Form */}
      {(isAddingNew || editingRestaurant) && (
        <Card className="p-6" data-testid="restaurant-form">
          <h3 className="font-semibold text-lg mb-4">
            {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h3>
          
          {/* Basic Info */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Basic Information
            </h4>
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
                <label className="text-sm font-medium">Country</label>
                <select
                  value={formData.country || 'India'}
                  onChange={(e) => setFormData({...formData, country: e.target.value, state: '', city: ''})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="USA">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="UAE">🇦🇪 UAE</option>
                  <option value="Singapore">🇸🇬 Singapore</option>
                  <option value="Australia">🇦🇺 Australia</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select State</option>
                  {formData.country === 'India' && (
                    <>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Goa">Goa</option>
                    </>
                  )}
                  {formData.country === 'USA' && (
                    <>
                      <option value="California">California</option>
                      <option value="New York">New York</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                    </>
                  )}
                </select>
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
                <label className="text-sm font-medium">Area / Locality *</label>
                <Input
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g., Koramangala"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Full Address</label>
                <Input
                  value={formData.address || ''}}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123, 5th Cross, Koramangala..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Images
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Restaurant Image */}
              <div>
                <label className="text-sm font-medium">Restaurant Image</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="Image URL or upload"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image')}
                    className="hidden"
                  />
                </div>
                {formData.image && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                    <button onClick={() => setFormData({...formData, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Pet Menu Image */}
              <div>
                <label className="text-sm font-medium">Pet Menu Image 📋</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.petMenuImage || ''}
                    onChange={(e) => setFormData({...formData, petMenuImage: e.target.value})}
                    placeholder="Upload photo of pet menu"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => petMenuInputRef.current?.click()}
                    disabled={uploadingPetMenu}
                  >
                    {uploadingPetMenu ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  <input
                    ref={petMenuInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'petMenuImage')}
                    className="hidden"
                  />
                </div>
                {formData.petMenuImage && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={formData.petMenuImage} alt="Pet Menu" className="w-full h-full object-cover rounded-lg border" />
                    <button onClick={() => setFormData({...formData, petMenuImage: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Policy */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🐕 Pet Policy & Perks
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
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
                <label className="text-sm font-medium">Pet Menu Items</label>
                <Input
                  value={formData.petMenuItems?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, petMenuItems: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Pupcakes, Dog Ice Cream..."
                />
              </div>
              <div className="md:col-span-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.birthdayPerks || false}
                    onChange={(e) => setFormData({...formData, birthdayPerks: e.target.checked})}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-pink-800">🎂 Birthday Perks Available</span>
                    <p className="text-xs text-pink-600">Restaurant offers special treats/discounts for pet birthdays</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Concierge Recommendation */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Your Concierge® Recommends
            </h4>
            <textarea
              value={formData.conciergeRecommendation || ''}
              onChange={(e) => setFormData({...formData, conciergeRecommendation: e.target.value})}
              placeholder="Your Concierge® recommends: This cozy café is perfect for lazy Sunday brunches with your furry friend. The staff is incredibly pet-friendly, and they serve the best pupcakes in town! Pro tip: Book the garden table for the best experience."
              className="w-full p-3 border rounded-lg text-sm"
              rows={3}
            />
          </div>

          {/* Details */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Restaurant Details</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Cuisine (comma separated)</label>
                <Input
                  value={formData.cuisine?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, cuisine: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Café, Continental, Italian"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Outdoor Seating, Dog Menu"
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
                  value={formData.timings || ''}
                  onChange={(e) => setFormData({...formData, timings: e.target.value})}
                  placeholder="10 AM - 10 PM"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Special Offers</label>
                <Input
                  value={formData.specialOffers || ''}
                  onChange={(e) => setFormData({...formData, specialOffers: e.target.value})}
                  placeholder="20% off on pet meals"
                />
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Contact & Links
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Instagram</label>
                <Input
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  placeholder="@restauranthandle"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Zomato Link</label>
                <Input
                  value={formData.zomatoLink || ''}
                  onChange={(e) => setFormData({...formData, zomatoLink: e.target.value})}
                  placeholder="https://zomato.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Google Maps</label>
                <Input
                  value={formData.googleMapsLink || ''}
                  onChange={(e) => setFormData({...formData, googleMapsLink: e.target.value})}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">⭐ Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">✓ Verified</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveRestaurant} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" /> Save Restaurant
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* CSV Template */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-700">CSV Import Template</h4>
            <p className="text-sm text-gray-500">
              Use pipe (|) to separate multiple values in cuisine, tags, and petMenuItems.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const template = `name,area,city,petMenuAvailable,petPolicy,cuisine,tags,rating,priceRange,petMenuItems,timings,phone,instagram,website,featured,verified,miraRecommendation,specialOffers
Sample Café,Koramangala,Bangalore,yes,all-pets,Café|Continental,Outdoor Seating|Dog Menu,4.5,₹₹,Pupcakes|Dog Ice Cream,10 AM - 10 PM,+91 98765 43210,@samplecafe,https://sample.com,true,true,Great spot for pet parents!,10% off on weekdays`;
              const blob = new Blob([template], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'restaurants_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Download Template
          </Button>
        </div>
      </Card>

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
            <div className="flex gap-2 justify-center">
              <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Add Restaurant
              </Button>
              <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Import CSV
              </Button>
            </div>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-4">
              <div className="flex gap-4">
                {restaurant.image ? (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'; }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        {restaurant.featured && (
                          <Badge className="bg-orange-100 text-orange-700"><Star className="w-3 h-3 mr-1" /> Featured</Badge>
                        )}
                        {restaurant.verified && (
                          <Badge className="bg-blue-100 text-blue-700"><Check className="w-3 h-3 mr-1" /> Verified</Badge>
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
                    {restaurant.cuisine?.slice(0, 4).map((c, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>

                  {restaurant.conciergeRecommendation && (
                    <p className="text-sm text-purple-600 mt-2 flex items-start gap-1">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1"><strong>Concierge®:</strong> {restaurant.conciergeRecommendation}</span>
                    </p>
                  )}

                  {restaurant.petMenuItems?.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      🍽️ {restaurant.petMenuItems.slice(0, 3).join(', ')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => startEdit(restaurant)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteRestaurant(restaurant.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                    {restaurant.zomatoLink && (
                      <a href={restaurant.zomatoLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" /> Zomato</Button>
                      </a>
                    )}
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
