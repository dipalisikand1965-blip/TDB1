/**
 * StayManager.jsx
 * Admin panel for Stay pillar management
 * Tabs: Requests, Plans, Partners, Products, Bundles, Stories, Tips, Settings
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import {
  Hotel, Building2, Home, Tent, TreePine, MapPin, Users, Package,
  Settings, Search, Plus, Edit2, Trash2, RefreshCw, Eye, Clock,
  CheckCircle, XCircle, Star, Download, Upload, Database, Calendar,
  PawPrint, Phone, Mail, DollarSign, Shield, Award, Sparkles
} from 'lucide-react';

const STAY_TYPE_ICONS = {
  resort: Hotel,
  hotel: Building2,
  villa: Home,
  homestay: Home,
  farmstay: TreePine,
  camping: Tent,
  boarding: PawPrint
};

const StayManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  // Engagement data
  const [transformationStories, setTransformationStories] = useState([]);
  const [quickWinTips, setQuickWinTips] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [seedingAll, setSeedingAll] = useState(false);
  
  // Modals
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [editingTip, setEditingTip] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Forms
  const [propertyForm, setPropertyForm] = useState({
    name: '', description: '', property_type: 'hotel', city: '', address: '',
    rating: '4', pet_fee: '', pet_policy: '', amenities: '',
    contact_name: '', contact_email: '', contact_phone: '',
    image: '', images: '', is_verified: false, is_featured: false
  });
  
  const [partnerForm, setPartnerForm] = useState({
    name: '', partner_type: 'property_owner', description: '',
    services: '', contact_name: '', contact_email: '', contact_phone: '',
    address: '', cities: '', commission_percent: '15',
    is_verified: false, is_active: true
  });
  
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    image: '', category: 'travel_accessories', tags: '', pet_sizes: 'small, medium, large',
    in_stock: true, paw_reward_points: '0'
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', items: '', price: '', original_price: '',
    paw_reward_points: '0', is_recommended: false
  });

  // Engagement forms
  const [storyForm, setStoryForm] = useState({
    pet_name: '', breed: '', owner_name: '', property_name: '', city: '',
    image: '', testimonial: '', rating: '5', trip_type: 'vacation', is_active: true
  });
  
  const [tipForm, setTipForm] = useState({
    tip: '', action: '', emoji: '', category: 'general', is_active: true
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchProperties(),
        fetchPartners(),
        fetchProducts(),
        fetchBundles(),
        fetchStories(),
        fetchTips(),
        fetchStats(),
        fetchSettings()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pillars/queues/stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching stay requests:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/properties?limit=100`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/partners?pillar=stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/products`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBundles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/bundles`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || data || []);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/engagement/transformation-stories?pillar=stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setTransformationStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchTips = async () => {
    try {
      const response = await fetch(`${API_URL}/api/engagement/tips?pillar=stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setQuickWinTips(data.tips || []);
      }
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pillars/queues/stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/stay`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data || {});
      }
    } catch (error) {
      console.debug('Error fetching settings:', error);
    }
  };

  // CRUD operations
  const saveProperty = async () => {
    try {
      const url = editingProperty 
        ? `${API_URL}/api/admin/stay/properties/${editingProperty.id}`
        : `${API_URL}/api/admin/stay/properties`;
      
      const response = await fetch(url, {
        method: editingProperty ? 'PUT' : 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyForm)
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `Property ${editingProperty ? 'updated' : 'created'}` });
        setShowPropertyModal(false);
        fetchProperties();
        resetPropertyForm();
      } else {
        toast({ title: 'Error', description: 'Failed to save property', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteProperty = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/properties/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Property deleted' });
        fetchProperties();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const saveTip = async () => {
    try {
      const url = editingTip 
        ? `${API_URL}/api/admin/engagement/tips/${editingTip.id}`
        : `${API_URL}/api/admin/engagement/tips`;
      
      const response = await fetch(url, {
        method: editingTip ? 'PUT' : 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...tipForm, pillar: 'stay' })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `Tip ${editingTip ? 'updated' : 'created'}` });
        setShowTipModal(false);
        fetchTips();
        resetTipForm();
      } else {
        toast({ title: 'Error', description: 'Failed to save tip', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const saveStory = async () => {
    try {
      const url = editingStory 
        ? `${API_URL}/api/admin/engagement/stories/${editingStory.id}`
        : `${API_URL}/api/admin/engagement/stories`;
      
      const response = await fetch(url, {
        method: editingStory ? 'PUT' : 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...storyForm, pillar: 'stay' })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `Story ${editingStory ? 'updated' : 'created'}` });
        setShowStoryModal(false);
        fetchStories();
        resetStoryForm();
      } else {
        toast({ title: 'Error', description: 'Failed to save story', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pillars/queues/stay/${requestId}?status=${newStatus}`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast({ title: 'Updated', description: `Request status changed to ${newStatus}` });
        fetchRequests();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Reset forms
  const resetPropertyForm = () => {
    setPropertyForm({
      name: '', description: '', property_type: 'hotel', city: '', address: '',
      rating: '4', pet_fee: '', pet_policy: '', amenities: '',
      contact_name: '', contact_email: '', contact_phone: '',
      image: '', images: '', is_verified: false, is_featured: false
    });
    setEditingProperty(null);
  };

  const resetTipForm = () => {
    setTipForm({ tip: '', action: '', emoji: '', category: 'general', is_active: true });
    setEditingTip(null);
  };

  const resetStoryForm = () => {
    setStoryForm({
      pet_name: '', breed: '', owner_name: '', property_name: '', city: '',
      image: '', testimonial: '', rating: '5', trip_type: 'vacation', is_active: true
    });
    setEditingStory(null);
  };

  const resetBundleForm = () => {
    setBundleForm({
      name: '', description: '', price: '', original_price: '', image: '',
      items: '', paw_reward_points: 0, is_recommended: true
    });
    setEditingBundle(null);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', original_price: '', image: '',
      category: 'travel', tags: '', stock: '100', paw_reward_points: 0
    });
    setEditingProduct(null);
  };

  // Save product (create or update)
  const saveProduct = async () => {
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        original_price: parseFloat(productForm.original_price) || null,
        image: productForm.image,
        category: productForm.category || 'travel',
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        stock: parseInt(productForm.stock) || 100,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        pillar: 'stay'
      };

      if (editingProduct) {
        await fetch(`${API_URL}/api/admin/stay/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(productData)
        });
        toast({ title: 'Product updated' });
      } else {
        await fetch(`${API_URL}/api/admin/stay/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(productData)
        });
        toast({ title: 'Product created' });
      }

      setShowProductModal(false);
      resetProductForm();
      fetchProducts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  // Filter data
  const filteredRequests = requests.filter(r => {
    if (searchQuery && !JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const filteredProperties = properties.filter(p => {
    if (searchQuery && !p.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter && p.property_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Hotel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stay Manager</h2>
            <p className="text-sm text-gray-500">Manage pet-friendly stays & boarding</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              setSeedingAll(true);
              try {
                const response = await fetch(`${API_URL}/api/admin/stay/seed-all`, {
                  method: 'POST',
                  headers: getAuthHeader()
                });
                if (response.ok) {
                  const data = await response.json();
                  toast({ title: '✅ Stay Data Seeded!', description: data.message });
                  fetchAllData();
                } else {
                  const error = await response.json();
                  toast({ title: 'Error', description: error.detail || 'Failed to seed stay data', variant: 'destructive' });
                }
              } catch (error) {
                console.error('Error seeding stay data:', error);
                toast({ title: 'Error', description: 'Failed to seed stay data', variant: 'destructive' });
              } finally {
                setSeedingAll(false);
              }
            }}
            disabled={seedingAll}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            data-testid="seed-all-stay-btn"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {seedingAll ? 'Seeding...' : 'Seed All Stay Data'}
          </Button>
          <Button onClick={fetchAllData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.pending || 0}</p>
              <p className="text-xs text-blue-700">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{stats.in_progress || 0}</p>
              <p className="text-xs text-purple-700">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{stats.completed || 0}</p>
              <p className="text-xs text-green-700">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900">{properties.length}</p>
              <p className="text-xs text-emerald-700">Properties</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1">
          <TabsTrigger value="requests" className="text-xs">Requests</TabsTrigger>
          <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
          <TabsTrigger value="partners" className="text-xs">Partners</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Products</TabsTrigger>
          <TabsTrigger value="bundles" className="text-xs">Bundles</TabsTrigger>
          <TabsTrigger value="stories" className="text-xs">Stories</TabsTrigger>
          <TabsTrigger value="tips" className="text-xs">Tips</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No stay requests found</p>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id || request.request_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {request.status || 'pending'}
                        </Badge>
                        <span className="text-xs text-gray-400">{request.id || request.request_id}</span>
                      </div>
                      <p className="font-medium">{request.pet_name || 'Pet'} - {request.travel_type || request.stay_type || 'Stay Request'}</p>
                      <p className="text-sm text-gray-500">{request.user_email}</p>
                      {request.destination_city && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {request.destination_city}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <Button size="sm" onClick={() => updateRequestStatus(request.id || request.request_id, 'in_progress')}>
                          Start
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button size="sm" className="bg-green-600" onClick={() => updateRequestStatus(request.id || request.request_id, 'completed')}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="resort">Resort</option>
                <option value="hotel">Hotel</option>
                <option value="villa">Villa</option>
                <option value="homestay">Homestay</option>
                <option value="farmstay">Farmstay</option>
              </select>
            </div>
            <Button onClick={() => { resetPropertyForm(); setShowPropertyModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {property.image ? (
                    <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Hotel className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {property.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-amber-500">Featured</Badge>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{property.name}</h3>
                    <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {property.city}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(parseInt(property.rating) || 4)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingProperty(property);
                      setPropertyForm(property);
                      setShowPropertyModal(true);
                    }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteProperty(property.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Stay Partners</h3>
            <Button onClick={() => setShowPartnerModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Partner
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{partner.name}</h4>
                    <p className="text-sm text-gray-500">{partner.partner_type}</p>
                    <p className="text-xs text-gray-400 mt-1">{partner.contact_email}</p>
                  </div>
                  {partner.is_verified && (
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-semibold">Stay Products ({products.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/api/admin/stay/seed-products`, {
                    method: 'POST',
                    headers: getAuthHeader()
                  });
                  if (response.ok) {
                    const data = await response.json();
                    toast({ title: 'Products Seeded', description: `${data.products_seeded || 'Products'} added` });
                    fetchProducts();
                  }
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
                }
              }}>
                <Database className="w-4 h-4 mr-2" /> Seed Products
              </Button>
              <Button onClick={() => { resetProductForm(); setShowProductModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                      <Package className="w-8 h-8 text-purple-300" />
                    </div>
                  )}
                  {/* Edit/Delete buttons overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow"
                      onClick={() => {
                        setEditingProduct(product);
                        setProductForm({
                          name: product.name || product.title || '',
                          description: product.description || '',
                          price: product.price?.toString() || '',
                          original_price: product.original_price?.toString() || '',
                          image: product.image || '',
                          category: product.category || 'travel',
                          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                          stock: product.stock?.toString() || '100',
                          paw_reward_points: product.paw_reward_points || 0
                        });
                        setShowProductModal(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 w-7 p-0 bg-white/90 hover:bg-red-50 text-red-500 shadow"
                      onClick={async () => {
                        if (!window.confirm('Delete this product?')) return;
                        try {
                          await fetch(`${API_URL}/api/admin/stay/products/${product.id}`, {
                            method: 'DELETE',
                            headers: getAuthHeader()
                          });
                          toast({ title: 'Product deleted' });
                          fetchProducts();
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-2">{product.name || product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-600 font-bold">₹{product.price}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">₹{product.original_price}</span>
                    )}
                  </div>
                  {product.paw_reward_points > 0 && (
                    <Badge className="mt-2 text-xs bg-amber-100 text-amber-700">+{product.paw_reward_points} paws</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {products.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h4 className="font-semibold mb-2">No Products Yet</h4>
              <p className="text-sm text-gray-500 mb-4">Click "Seed Products" to auto-populate with travel essentials</p>
              <Button onClick={async () => {
                try {
                  await fetch(`${API_URL}/api/admin/stay/seed-products`, {
                    method: 'POST',
                    headers: getAuthHeader()
                  });
                  toast({ title: 'Products seeded!' });
                  fetchProducts();
                } catch (error) {
                  toast({ title: 'Error seeding products', variant: 'destructive' });
                }
              }}>
                <Database className="w-4 h-4 mr-2" /> Seed Stay Products
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Stay Bundles ({bundles.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/api/admin/stay/seed-bundles`, {
                    method: 'POST',
                    headers: getAuthHeader()
                  });
                  if (response.ok) {
                    const data = await response.json();
                    toast({ title: 'Bundles Seeded', description: `${data.bundles_seeded} bundles added` });
                    fetchBundles();
                  }
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to seed bundles', variant: 'destructive' });
                }
              }}>
                <Database className="w-4 h-4 mr-2" /> Seed Bundles
              </Button>
              <Button onClick={() => { resetBundleForm(); setShowBundleModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Bundle
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Bundle Image */}
                  <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {bundle.image ? (
                      <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                        <Package className="w-8 h-8 text-purple-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Bundle Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900">{bundle.name}</h4>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingBundle(bundle);
                            setBundleForm({
                              name: bundle.name || '',
                              description: bundle.description || '',
                              price: bundle.price?.toString() || '',
                              original_price: bundle.original_price?.toString() || '',
                              image: bundle.image || '',
                              items: Array.isArray(bundle.items) ? bundle.items.join(', ') : '',
                              paw_reward_points: bundle.paw_reward_points || 0,
                              is_recommended: bundle.is_recommended || false
                            });
                            setShowBundleModal(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (!window.confirm('Delete this bundle?')) return;
                            try {
                              await fetch(`${API_URL}/api/admin/stay/bundles/${bundle.id}`, {
                                method: 'DELETE',
                                headers: getAuthHeader()
                              });
                              toast({ title: 'Bundle deleted' });
                              fetchBundles();
                            } catch (error) {
                              toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{bundle.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-emerald-600">₹{bundle.price}</span>
                      {bundle.original_price && bundle.original_price > bundle.price && (
                        <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                      )}
                      {bundle.paw_reward_points > 0 && (
                        <Badge className="text-xs bg-amber-100 text-amber-700">+{bundle.paw_reward_points} paws</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {bundles.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h4 className="font-semibold mb-2">No Bundles Yet</h4>
              <p className="text-sm text-gray-500 mb-4">Click &quot;Seed Bundles&quot; to auto-populate with curated travel bundles</p>
              <Button onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/api/admin/stay/seed-bundles`, {
                    method: 'POST',
                    headers: getAuthHeader()
                  });
                  if (response.ok) {
                    const data = await response.json();
                    toast({ title: 'Bundles seeded!', description: `${data.bundles_seeded} bundles added` });
                    fetchBundles();
                  }
                } catch (error) {
                  toast({ title: 'Error seeding bundles', variant: 'destructive' });
                }
              }}>
                <Database className="w-4 h-4 mr-2" /> Seed Stay Bundles
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Pawcation Stories</h3>
            <Button onClick={() => { resetStoryForm(); setShowStoryModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Story
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {transformationStories.map((story) => (
              <Card key={story.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
                    {story.image ? (
                      <img src={story.image} alt={story.pet_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{story.pet_name} - {story.property_name || 'Trip'}</h4>
                    <p className="text-sm text-gray-500">{story.owner_name}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{story.testimonial}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(parseInt(story.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-semibold">Stay Tips ({quickWinTips.length})</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/api/engagement/seed-pillar-tips?force_refresh=false`, {
                      method: 'POST',
                      headers: getAuthHeader()
                    });
                    const data = await response.json();
                    toast({ title: 'Tips Seeded', description: `${data.total_new} new tips added. Stay: ${data.pillar_counts?.stay || 0}` });
                    fetchTips();
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to seed tips', variant: 'destructive' });
                  }
                }}
              >
                <Database className="w-4 h-4 mr-2" /> Seed Tips
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Generate CSV template
                  const csvTemplate = "tip,action,emoji,category,action_type,action_url\n" +
                    "\"Book pet-friendly stays 2 weeks ahead\",\"Search stays\",\"🏨\",\"general\",\"navigate\",\"/stay\"\n" +
                    "\"Pack familiar bedding for comfort\",\"View checklist\",\"🛏️\",\"general\",\"checklist\",\"stay\"";
                  const blob = new Blob([csvTemplate], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'stay_tips_template.csv';
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" /> CSV Template
              </Button>
              <Button onClick={() => { resetTipForm(); setShowTipModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Tip
              </Button>
            </div>
          </div>
          
          {/* Tips Grid */}
          <div className="grid md:grid-cols-2 gap-3">
            {quickWinTips.map((tip) => (
              <Card key={tip.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl flex-shrink-0">{tip.emoji || '💡'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{tip.tip}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">{tip.action}</Badge>
                        {tip.action_type && (
                          <Badge className="text-xs bg-purple-100 text-purple-700">{tip.action_type}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                      setEditingTip(tip);
                      setTipForm({
                        tip: tip.tip,
                        action: tip.action,
                        emoji: tip.emoji,
                        category: tip.category || 'general',
                        action_type: tip.action_type || '',
                        action_url: tip.action_url || ''
                      });
                      setShowTipModal(true);
                    }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        if (!window.confirm('Delete this tip?')) return;
                        try {
                          await fetch(`${API_URL}/api/engagement/tips/${tip.id}`, {
                            method: 'DELETE',
                            headers: getAuthHeader()
                          });
                          toast({ title: 'Tip deleted' });
                          fetchTips();
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to delete tip', variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {quickWinTips.length === 0 && (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-amber-400 mb-3" />
              <h4 className="font-semibold mb-2">No Tips Yet</h4>
              <p className="text-sm text-gray-500 mb-4">Click "Seed Tips" to auto-populate with curated stay tips</p>
              <Button 
                onClick={async () => {
                  try {
                    await fetch(`${API_URL}/api/engagement/seed-pillar-tips?force_refresh=false`, {
                      method: 'POST',
                      headers: getAuthHeader()
                    });
                    toast({ title: 'Tips seeded!' });
                    fetchTips();
                  } catch (error) {
                    toast({ title: 'Error seeding tips', variant: 'destructive' });
                  }
                }}
              >
                <Database className="w-4 h-4 mr-2" /> Seed Stay Tips
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Stay Pillar Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-assign requests</p>
                  <p className="text-sm text-gray-500">Automatically assign new requests to available agents</p>
                </div>
                <Switch checked={settings.auto_assign || false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Send booking confirmations</p>
                  <p className="text-sm text-gray-500">Email customers when bookings are confirmed</p>
                </div>
                <Switch checked={settings.send_confirmations || true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show availability calendar</p>
                  <p className="text-sm text-gray-500">Display property availability on listing pages</p>
                </div>
                <Switch checked={settings.show_availability || true} />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Property Modal */}
      <Dialog open={showPropertyModal} onOpenChange={setShowPropertyModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add Property'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Name</Label>
                <Input
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={propertyForm.property_type}
                  onChange={(e) => setPropertyForm({...propertyForm, property_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="villa">Villa</option>
                  <option value="homestay">Homestay</option>
                  <option value="farmstay">Farmstay</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({...propertyForm, city: e.target.value})}
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={propertyForm.rating}
                  onChange={(e) => setPropertyForm({...propertyForm, rating: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Pet Policy</Label>
              <Textarea
                value={propertyForm.pet_policy}
                onChange={(e) => setPropertyForm({...propertyForm, pet_policy: e.target.value})}
                placeholder="e.g., Dogs up to 20kg allowed, Pet fee ₹500/night"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={propertyForm.image}
                onChange={(e) => setPropertyForm({...propertyForm, image: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={propertyForm.is_verified}
                  onCheckedChange={(checked) => setPropertyForm({...propertyForm, is_verified: checked})}
                />
                <Label>Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={propertyForm.is_featured}
                  onCheckedChange={(checked) => setPropertyForm({...propertyForm, is_featured: checked})}
                />
                <Label>Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPropertyModal(false)}>Cancel</Button>
            <Button onClick={saveProperty}>Save Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTip ? 'Edit Tip' : 'Add Stay Tip'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Tip Text</Label>
              <Textarea
                value={tipForm.tip}
                onChange={(e) => setTipForm({...tipForm, tip: e.target.value})}
                placeholder="e.g., Book pet-friendly stays 2 weeks ahead for best rates"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action Button Text</Label>
                <Input
                  value={tipForm.action}
                  onChange={(e) => setTipForm({...tipForm, action: e.target.value})}
                  placeholder="e.g., View checklist"
                />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input
                  value={tipForm.emoji}
                  onChange={(e) => setTipForm({...tipForm, emoji: e.target.value})}
                  placeholder="e.g., 🏨"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={tipForm.is_active}
                onCheckedChange={(checked) => setTipForm({...tipForm, is_active: checked})}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTipModal(false)}>Cancel</Button>
            <Button onClick={saveTip}>Save Tip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Story Modal */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStory ? 'Edit Story' : 'Add Pawcation Story'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pet Name</Label>
                <Input
                  value={storyForm.pet_name}
                  onChange={(e) => setStoryForm({...storyForm, pet_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Breed</Label>
                <Input
                  value={storyForm.breed}
                  onChange={(e) => setStoryForm({...storyForm, breed: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input
                  value={storyForm.owner_name}
                  onChange={(e) => setStoryForm({...storyForm, owner_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Property Name</Label>
                <Input
                  value={storyForm.property_name}
                  onChange={(e) => setStoryForm({...storyForm, property_name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Testimonial</Label>
              <Textarea
                value={storyForm.testimonial}
                onChange={(e) => setStoryForm({...storyForm, testimonial: e.target.value})}
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={storyForm.image}
                onChange={(e) => setStoryForm({...storyForm, image: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoryModal(false)}>Cancel</Button>
            <Button onClick={saveStory}>Save Story</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Product Name *</Label>
              <Input 
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g., Travel Carrier Bag"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Product description..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input 
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input 
                  type="number"
                  value={productForm.original_price}
                  onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                  placeholder="1299"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input 
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
              {productForm.image && (
                <img src={productForm.image} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={productForm.category} 
                  onValueChange={(v) => setProductForm({ ...productForm, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="comfort">Comfort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paw Points</Label>
                <Input 
                  type="number"
                  value={productForm.paw_reward_points}
                  onChange={(e) => setProductForm({ ...productForm, paw_reward_points: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input 
                value={productForm.tags}
                onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                placeholder="travel, essential, comfort"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductModal(false); resetProductForm(); }}>Cancel</Button>
            <Button onClick={saveProduct}>{editingProduct ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StayManager;
