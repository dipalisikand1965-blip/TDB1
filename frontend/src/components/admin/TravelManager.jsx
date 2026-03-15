import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Plane, Car, Train, Truck, Package, Gift, Settings, RefreshCw, Upload, Download,
  Plus, Edit2, Trash2, Search, Filter, Eye, Calendar, Clock, MapPin, User, Phone, Mail,
  PawPrint, AlertTriangle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
  TrendingUp, DollarSign, Star, Bell, FileText, Building2, Globe, Shield, Award, Briefcase
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import PillarServicesTab from './PillarServicesTab';
import PillarProductsTab from './PillarProductsTab';

const TravelManager = ({ getAuthHeader }) => {
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const fileInputRef = useRef(null);
  const bundleFileInputRef = useRef(null);
  const partnerFileInputRef = useRef(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '', image: '',
    subcategory: '', tags: '', pet_sizes: '', in_stock: true,
    paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
  });

  // Bundle form state
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', price: '', original_price: '', image: '',
    travel_type: 'cab', items: [], is_recommended: true,
    paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
  });

  // Partner form state
  const [partnerForm, setPartnerForm] = useState({
    name: '', type: 'cab_service', description: '', logo: '',
    contact_name: '', contact_email: '', contact_phone: '',
    website: '', cities: '', services: [],
    commission_percent: '', rating: 5, is_verified: false, is_active: true,
    pet_policy: '', special_features: ''
  });

  const travelTypes = {
    cab: { name: 'Cab / Road Travel', icon: Car, color: 'bg-green-500' },
    train: { name: 'Train / Bus Travel', icon: Train, color: 'bg-blue-500' },
    flight: { name: 'Domestic Flight', icon: Plane, color: 'bg-purple-500' },
    relocation: { name: 'Pet Relocation', icon: Truck, color: 'bg-orange-500' }
  };

  const statusColors = {
    submitted: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    coordinating: 'bg-indigo-100 text-indigo-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, productsRes, bundlesRes, statsRes, settingsRes, partnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/travel/requests`, getAuthHeader()),
        axios.get(`${API_URL}/api/travel/products`),
        axios.get(`${API_URL}/api/travel/bundles`),
        axios.get(`${API_URL}/api/travel/stats`),
        axios.get(`${API_URL}/api/travel/admin/settings`, getAuthHeader()),
        axios.get(`${API_URL}/api/travel/admin/partners`, getAuthHeader()).catch(() => ({ data: { partners: [] } }))
      ]);
      
      setRequests(requestsRes.data.requests || []);
      setProducts(productsRes.data.products || []);
      setBundles(bundlesRes.data.bundles || []);
      setStats(statsRes.data || {});
      setSettings(settingsRes.data || {});
      setPartners(partnersRes.data.partners || []);
    } catch (error) {
      console.error('Error fetching travel data:', error);
      toast({ title: 'Error', description: 'Failed to load travel data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/travel/admin/seed-products`, {}, getAuthHeader());
      toast({ title: 'Success', description: `Seeded ${response.data.products_seeded} products and ${response.data.bundles_seeded} bundles` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await axios.patch(`${API_URL}/api/travel/request/${requestId}`, { status }, getAuthHeader());
      toast({ title: 'Success', description: 'Request status updated' });
      fetchData();
      setSelectedRequest(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        pet_sizes: productForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean),
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        birthday_discount_percent: productForm.birthday_discount_percent ? parseInt(productForm.birthday_discount_percent) : null
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/api/travel/admin/products/${editingProduct.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/travel/admin/products`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product created' });
      }
      
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const handleBundleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...bundleForm,
        price: parseFloat(bundleForm.price) || 0,
        original_price: bundleForm.original_price ? parseFloat(bundleForm.original_price) : null,
        paw_reward_points: parseInt(bundleForm.paw_reward_points) || 0,
        birthday_discount_percent: bundleForm.birthday_discount_percent ? parseInt(bundleForm.birthday_discount_percent) : null
      };

      if (editingBundle) {
        await axios.put(`${API_URL}/api/travel/admin/bundles/${editingBundle.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        await axios.post(`${API_URL}/api/travel/admin/bundles`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle created' });
      }
      
      setShowBundleModal(false);
      setEditingBundle(null);
      resetBundleForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save bundle', variant: 'destructive' });
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/api/travel/admin/products/${productId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Product deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const deleteBundle = async (bundleId) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;
    try {
      await axios.delete(`${API_URL}/api/travel/admin/bundles/${bundleId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Bundle deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '', image: '',
      subcategory: '', tags: '', pet_sizes: '', in_stock: true,
      paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const resetBundleForm = () => {
    setBundleForm({
      name: '', description: '', price: '', original_price: '', image: '',
      travel_type: 'cab', items: [], is_recommended: true,
      paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', type: 'cab_service', description: '', logo: '',
      contact_name: '', contact_email: '', contact_phone: '',
      website: '', cities: '', services: [],
      commission_percent: '', rating: 5, is_verified: false, is_active: true,
      pet_policy: '', special_features: ''
    });
  };

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...partnerForm,
        cities: partnerForm.cities.split(',').map(c => c.trim()).filter(Boolean),
        commission_percent: parseFloat(partnerForm.commission_percent) || 0,
        rating: parseFloat(partnerForm.rating) || 5
      };

      if (editingPartner) {
        await axios.put(`${API_URL}/api/travel/admin/partners/${editingPartner.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/travel/admin/partners`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner created' });
      }
      
      setShowPartnerModal(false);
      setEditingPartner(null);
      resetPartnerForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save partner', variant: 'destructive' });
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    try {
      await axios.delete(`${API_URL}/api/travel/admin/partners/${partnerId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  const partnerTypes = {
    cab_service: { name: 'Pet Cab Service', icon: Car, color: 'bg-green-500' },
    airline: { name: 'Airline Partner', icon: Plane, color: 'bg-blue-500' },
    train_service: { name: 'Train/Bus Service', icon: Train, color: 'bg-purple-500' },
    relocation: { name: 'Relocation Company', icon: Truck, color: 'bg-orange-500' },
    cargo: { name: 'Cargo/Freight', icon: Package, color: 'bg-gray-500' }
  };

  const handleProductExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/travel/admin/products/export`, getAuthHeader());
      const csvContent = convertToCSV(response.data.products);
      downloadCSV(csvContent, 'travel-products.csv');
      toast({ title: 'Success', description: 'Products exported' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export products', variant: 'destructive' });
    }
  };

  const handleBundleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/travel/admin/bundles/export`, getAuthHeader());
      const csvContent = convertToCSV(response.data.bundles);
      downloadCSV(csvContent, 'travel-bundles.csv');
      toast({ title: 'Success', description: 'Bundles exported' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export bundles', variant: 'destructive' });
    }
  };

  const handleProductImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const products = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });

      const response = await axios.post(`${API_URL}/api/travel/admin/products/import`, products, getAuthHeader());
      toast({ title: 'Success', description: `Imported ${response.data.imported} products` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import products', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleBundleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const bundles = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });

      const response = await axios.post(`${API_URL}/api/travel/admin/bundles/import`, bundles, getAuthHeader());
      toast({ title: 'Success', description: `Imported ${response.data.imported} bundles` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import bundles', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.request_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.pet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.journey?.pickup_city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.travel_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="travel-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">✈️ Travel Manager</h2>
          <p className="text-gray-500">Manage travel requests, products & bundles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={seedProducts} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Seed Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <div className="flex items-center gap-3">
            <Plane className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
              <p className="text-sm opacity-90">Total Requests</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.by_status?.submitted || 0}</p>
              <p className="text-sm opacity-90">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.by_status?.confirmed || 0}</p>
              <p className="text-sm opacity-90">Confirmed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm opacity-90">Products</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="requests" data-testid="travel-tab-requests">
            <Bell className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="travel-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="travel-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="travel-tab-services">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="travel-tab-bundles">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="travel-tab-settings">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="coordinating">Coordinating</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="cab">Cab / Road</option>
                <option value="train">Train / Bus</option>
                <option value="flight">Flight</option>
                <option value="relocation">Relocation</option>
              </select>
            </div>
          </Card>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Plane className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No travel requests found</p>
              </Card>
            ) : (
              filteredRequests.map((req) => {
                const TypeIcon = travelTypes[req.travel_type]?.icon || Plane;
                return (
                  <Card 
                    key={req.request_id} 
                    className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedRequest?.request_id === req.request_id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedRequest(selectedRequest?.request_id === req.request_id ? null : req)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${travelTypes[req.travel_type]?.color} text-white`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{req.request_id}</h3>
                            <Badge className={statusColors[req.status] || 'bg-gray-100'}>{req.status}</Badge>
                            {req.risk_level === 'high' && (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-1" /> High Risk
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <PawPrint className="w-3 h-3 inline mr-1" />
                            {req.pet?.name} ({req.pet?.breed || 'Dog'})
                          </p>
                          <p className="text-sm text-gray-500">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {req.journey?.pickup_city} → {req.journey?.drop_city}
                          </p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {req.journey?.travel_date} {req.journey?.travel_time && `at ${req.journey.travel_time}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600 mt-1">{req.travel_type_name}</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedRequest?.request_id === req.request_id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Customer</p>
                            <p className="font-medium">{req.customer?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{req.customer?.email}</p>
                            <p className="text-sm text-gray-500">{req.customer?.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Pet Details</p>
                            <p className="text-sm">Size: {req.pet?.size || 'N/A'}</p>
                            <p className="text-sm">Weight: {req.pet?.weight ? `${req.pet.weight}kg` : 'N/A'}</p>
                            <p className="text-sm">Crate Trained: {req.pet?.crate_trained ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Risk Factors</p>
                            {req.risk_factors?.length > 0 ? (
                              <ul className="text-sm text-red-600">
                                {req.risk_factors.map((r, i) => <li key={i}>• {r}</li>)}
                              </ul>
                            ) : (
                              <p className="text-sm text-green-600">No concerns</p>
                            )}
                          </div>
                        </div>
                        
                        {req.special_requirements && (
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Special Requirements</p>
                            <p className="text-sm">{req.special_requirements}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.request_id, 'reviewing'); }}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Start Review
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.request_id, 'confirmed'); }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Confirm
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.request_id, 'cancelled'); }}
                            className="text-red-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Button onClick={() => { resetPartnerForm(); setEditingPartner(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
              <div className="text-sm text-gray-500">
                {partners.filter(p => p.is_active).length} Active Partners
              </div>
            </div>
          </Card>

          {/* Partner Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(partnerTypes).map(([key, type]) => {
              const count = partners.filter(p => p.type === key).length;
              const TypeIcon = type.icon;
              return (
                <Card key={key} className={`p-3 ${type.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5" />
                    <div>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs opacity-90">{type.name}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Partners List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.length === 0 ? (
              <Card className="col-span-2 p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No travel partners yet</p>
                <p className="text-sm text-gray-400 mt-1">Add cab services, airlines, and relocation companies</p>
                <Button className="mt-4" onClick={() => { resetPartnerForm(); setShowPartnerModal(true); }}>
                  Add First Partner
                </Button>
              </Card>
            ) : (
              partners.map((partner) => {
                const typeInfo = partnerTypes[partner.type] || partnerTypes.cab_service;
                const TypeIcon = typeInfo.icon;
                return (
                  <Card key={partner.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${typeInfo.color} text-white`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                          {partner.is_verified && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              <Shield className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{typeInfo.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" /> {partner.rating || 5}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {Array.isArray(partner.cities) ? partner.cities.length : 0} cities
                          </span>
                          {partner.commission_percent > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> {partner.commission_percent}% commission
                            </span>
                          )}
                        </div>
                        {partner.contact_email && (
                          <p className="text-xs text-gray-400 mt-1">{partner.contact_email}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {partner.is_active ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPartner(partner);
                          setPartnerForm({
                            name: partner.name || '',
                            type: partner.type || 'cab_service',
                            description: partner.description || '',
                            logo: partner.logo || '',
                            contact_name: partner.contact_name || '',
                            contact_email: partner.contact_email || '',
                            contact_phone: partner.contact_phone || '',
                            website: partner.website || '',
                            cities: Array.isArray(partner.cities) ? partner.cities.join(', ') : '',
                            services: partner.services || [],
                            commission_percent: partner.commission_percent?.toString() || '',
                            rating: partner.rating || 5,
                            is_verified: partner.is_verified || false,
                            is_active: partner.is_active !== false,
                            pet_policy: partner.pet_policy || '',
                            special_features: partner.special_features || ''
                          });
                          setShowPartnerModal(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => deletePartner(partner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {partner.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(partner.website, '_blank')}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <PillarProductsTab pillar="travel" pillarName="Travel" />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <PillarServicesTab 
            pillar="travel"
            pillarName="Travel"
            pillarIcon="✈️"
            pillarColor="bg-blue-500"
          />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Button onClick={() => { resetBundleForm(); setEditingBundle(null); setShowBundleModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Bundle
              </Button>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".csv"
                  ref={bundleFileInputRef}
                  onChange={handleBundleImport}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => bundleFileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import CSV
                </Button>
                <Button variant="outline" onClick={handleBundleExport}>
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((bundle) => {
              const TypeIcon = travelTypes[bundle.travel_type]?.icon || Package;
              return (
                <Card key={bundle.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${travelTypes[bundle.travel_type]?.color || 'bg-gray-500'} text-white`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                      <p className="text-sm text-gray-500">{bundle.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-green-600 text-lg">₹{bundle.price}</span>
                        {bundle.original_price && (
                          <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                        )}
                        {bundle.original_price && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {Math.round((1 - bundle.price / bundle.original_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">{travelTypes[bundle.travel_type]?.name}</Badge>
                        {bundle.paw_reward_points > 0 && (
                          <Badge variant="outline" className="text-xs">🐾 {bundle.paw_reward_points} pts</Badge>
                        )}
                        {bundle.is_birthday_perk && (
                          <Badge variant="outline" className="text-xs text-pink-600">🎂 Birthday</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {bundle.items?.length || 0} items included
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBundle(bundle);
                        setBundleForm({
                          name: bundle.name || '',
                          description: bundle.description || '',
                          price: bundle.price?.toString() || '',
                          original_price: bundle.original_price?.toString() || '',
                          image: bundle.image || '',
                          travel_type: bundle.travel_type || 'cab',
                          items: bundle.items || [],
                          is_recommended: bundle.is_recommended !== false,
                          paw_reward_points: bundle.paw_reward_points || 0,
                          is_birthday_perk: bundle.is_birthday_perk || false,
                          birthday_discount_percent: bundle.birthday_discount_percent?.toString() || ''
                        });
                        setShowBundleModal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => deleteBundle(bundle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {bundles.length === 0 && (
            <Card className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No travel bundles yet</p>
              <Button className="mt-4" onClick={seedProducts}>Seed Default Bundles</Button>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per Travel Request</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_request || 50}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Points per Product Purchase (per ₹100)</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_purchase || 10}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎂 Birthday Perks Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Birthday Discount %</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.discount_percent || 15}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valid Days (before/after birthday)</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.valid_days_before || 7}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🔔 Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch checked={settings.notifications?.email_enabled !== false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>WhatsApp Notifications</Label>
                <Switch checked={settings.notifications?.whatsapp_enabled || false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch checked={settings.notifications?.sms_enabled || false} />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Compare Price</Label>
                  <Input
                    type="number"
                    value={productForm.compare_price}
                    onChange={(e) => setProductForm({...productForm, compare_price: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subcategory</Label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="crate">Crate</option>
                    <option value="carrier">Carrier</option>
                    <option value="harness">Harness</option>
                    <option value="calming">Calming</option>
                    <option value="safety">Safety</option>
                    <option value="accessory">Accessory</option>
                    <option value="comfort">Comfort</option>
                  </select>
                </div>
                <div>
                  <Label>Pet Sizes (comma-separated)</Label>
                  <Input
                    value={productForm.pet_sizes}
                    onChange={(e) => setProductForm({...productForm, pet_sizes: e.target.value})}
                    placeholder="small, medium, large"
                  />
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={productForm.tags}
                  onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                  placeholder="travel, flight, safety"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Paw Reward Points</Label>
                  <Input
                    type="number"
                    value={productForm.paw_reward_points}
                    onChange={(e) => setProductForm({...productForm, paw_reward_points: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Birthday Discount %</Label>
                  <Input
                    type="number"
                    value={productForm.birthday_discount_percent}
                    onChange={(e) => setProductForm({...productForm, birthday_discount_percent: e.target.value})}
                    disabled={!productForm.is_birthday_perk}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.in_stock}
                    onChange={(e) => setProductForm({...productForm, in_stock: e.target.checked})}
                  />
                  In Stock
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.is_birthday_perk}
                    onChange={(e) => setProductForm({...productForm, is_birthday_perk: e.target.checked})}
                  />
                  Birthday Perk
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bundle Modal */}
      {showBundleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingBundle ? 'Edit Bundle' : 'Add Bundle'}
            </h3>
            <form onSubmit={handleBundleSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({...bundleForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({...bundleForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bundle Price *</Label>
                  <Input
                    type="number"
                    value={bundleForm.price}
                    onChange={(e) => setBundleForm({...bundleForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={bundleForm.original_price}
                    onChange={(e) => setBundleForm({...bundleForm, original_price: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Travel Type</Label>
                <select
                  value={bundleForm.travel_type}
                  onChange={(e) => setBundleForm({...bundleForm, travel_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="cab">Cab / Road Travel</option>
                  <option value="train">Train / Bus Travel</option>
                  <option value="flight">Domestic Flight</option>
                  <option value="relocation">Pet Relocation</option>
                </select>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={bundleForm.image}
                  onChange={(e) => setBundleForm({...bundleForm, image: e.target.value})}
                />
              </div>
              <div>
                <Label>Included Products</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 p-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={bundleForm.items.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBundleForm({...bundleForm, items: [...bundleForm.items, product.id]});
                          } else {
                            setBundleForm({...bundleForm, items: bundleForm.items.filter(i => i !== product.id)});
                          }
                        }}
                      />
                      <span className="text-sm">{product.name} - ₹{product.price}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Paw Reward Points</Label>
                  <Input
                    type="number"
                    value={bundleForm.paw_reward_points}
                    onChange={(e) => setBundleForm({...bundleForm, paw_reward_points: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Birthday Discount %</Label>
                  <Input
                    type="number"
                    value={bundleForm.birthday_discount_percent}
                    onChange={(e) => setBundleForm({...bundleForm, birthday_discount_percent: e.target.value})}
                    disabled={!bundleForm.is_birthday_perk}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bundleForm.is_recommended}
                    onChange={(e) => setBundleForm({...bundleForm, is_recommended: e.target.checked})}
                  />
                  Recommended
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bundleForm.is_birthday_perk}
                    onChange={(e) => setBundleForm({...bundleForm, is_birthday_perk: e.target.checked})}
                  />
                  Birthday Perk
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingBundle ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBundleModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingPartner ? 'Edit Partner' : 'Add Travel Partner'}
            </h3>
            <form onSubmit={handlePartnerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Partner Name *</Label>
                  <Input
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                    placeholder="e.g., PetCab India"
                    required
                  />
                </div>
                <div>
                  <Label>Partner Type *</Label>
                  <select
                    value={partnerForm.type}
                    onChange={(e) => setPartnerForm({...partnerForm, type: e.target.value})}
                    className="w-full h-10 px-3 border rounded-md"
                    required
                  >
                    <option value="cab_service">Pet Cab Service</option>
                    <option value="airline">Airline Partner</option>
                    <option value="train_service">Train/Bus Service</option>
                    <option value="relocation">Relocation Company</option>
                    <option value="cargo">Cargo/Freight</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={partnerForm.description}
                  onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})}
                  placeholder="Brief description of the partner and their services..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={partnerForm.contact_name}
                    onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={partnerForm.contact_email}
                    onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={partnerForm.contact_phone}
                    onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Website</Label>
                  <Input
                    type="url"
                    value={partnerForm.website}
                    onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={partnerForm.logo}
                    onChange={(e) => setPartnerForm({...partnerForm, logo: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label>Cities Covered (comma-separated)</Label>
                <Input
                  value={partnerForm.cities}
                  onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})}
                  placeholder="Mumbai, Delhi, Bangalore, Pune"
                />
              </div>

              <div>
                <Label>Pet Policy</Label>
                <Textarea
                  value={partnerForm.pet_policy}
                  onChange={(e) => setPartnerForm({...partnerForm, pet_policy: e.target.value})}
                  placeholder="What breeds/sizes they accept, any restrictions..."
                />
              </div>

              <div>
                <Label>Special Features</Label>
                <Textarea
                  value={partnerForm.special_features}
                  onChange={(e) => setPartnerForm({...partnerForm, special_features: e.target.value})}
                  placeholder="AC vehicles, trained handlers, crate included..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Commission %</Label>
                  <Input
                    type="number"
                    value={partnerForm.commission_percent}
                    onChange={(e) => setPartnerForm({...partnerForm, commission_percent: e.target.value})}
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={partnerForm.rating}
                    onChange={(e) => setPartnerForm({...partnerForm, rating: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={partnerForm.is_active}
                    onChange={(e) => setPartnerForm({...partnerForm, is_active: e.target.checked})}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={partnerForm.is_verified}
                    onChange={(e) => setPartnerForm({...partnerForm, is_verified: e.target.checked})}
                  />
                  Verified Partner
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPartner ? 'Update Partner' : 'Add Partner'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPartnerModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TravelManager;
