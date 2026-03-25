/**
 * FarewellManager - Admin component for managing farewell/memorial services
 * Features: Service requests, partners, products, reports, settings
 * Pattern follows TravelManager and DineManager
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Heart, Package, Gift, Settings, RefreshCw, Upload, Download,
  Plus, Edit2, Trash2, Search, Eye, Calendar, Clock, MapPin, User, Phone, Mail,
  PawPrint, CheckCircle, XCircle, Loader2, Building2, Star, DollarSign, Bell,
  Sparkles, Flower2, Home, Briefcase
} from 'lucide-react';
import PillarServicesTab from './PillarServicesTab';
import PillarProductsTab from './PillarProductsTab';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import PillarBundlesTab from './PillarBundlesTab';
import PillarExperiencesTab from './PillarExperiencesTab';

const FarewellManager = ({ getAuthHeader }) => {
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const fileInputRef = useRef(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '', image: '',
    category: 'urns', subcategory: '', sizes: '', in_stock: true,
    paw_reward_points: 0
  });

  // Partner form state
  const [partnerForm, setPartnerForm] = useState({
    name: '', type: 'cremation', description: '', logo: '',
    contact_name: '', contact_email: '', contact_phone: '',
    website: '', cities: '', services: [],
    commission_percent: '', rating: 5, is_verified: false, is_active: true
  });

  const serviceTypes = {
    cremation: { name: 'Cremation Services', icon: Flower2, color: 'bg-purple-500' },
    burial: { name: 'Burial Services', icon: Home, color: 'bg-green-500' },
    memorial: { name: 'Memorial Products', icon: Heart, color: 'bg-pink-500' },
    transport: { name: 'Dignified Transport', icon: PawPrint, color: 'bg-blue-500' },
    grief_support: { name: 'Grief Support', icon: Sparkles, color: 'bg-amber-500' }
  };

  const statusColors = {
    submitted: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const productCategories = {
    urns: 'Urns & Containers',
    keepsakes: 'Keepsakes & Jewellery',
    memorial: 'Memorial Items',
    comfort: 'Comfort Products'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      
      const [requestsRes, productsRes, statsRes, settingsRes, partnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/farewell/requests`, authHeader),
        axios.get(`${API_URL}/api/farewell/products`),
        axios.get(`${API_URL}/api/farewell/stats`),
        axios.get(`${API_URL}/api/farewell/admin/settings`, authHeader).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/farewell/admin/partners`, authHeader).catch(() => ({ data: { partners: [] } }))
      ]);
      
      setRequests(requestsRes.data.requests || []);
      setProducts(productsRes.data.products || []);
      setStats(statsRes.data || {});
      setSettings(settingsRes.data || {});
      setPartners(partnersRes.data.partners || []);
    } catch (error) {
      console.error('Error fetching farewell data:', error);
      toast({ title: 'Error', description: 'Failed to load farewell data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const response = await axios.post(`${API_URL}/api/farewell/admin/seed-products`, {}, authHeader);
      toast({ title: 'Success', description: `Seeded ${response.data.products_seeded} products and ${response.data.partners_seeded} partners` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      await axios.patch(`${API_URL}/api/farewell/request/${requestId}`, { status }, authHeader);
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
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
        sizes: productForm.sizes ? productForm.sizes.split(',').map(s => s.trim()) : [],
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/api/farewell/admin/products/${editingProduct.id}`, payload, authHeader);
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/farewell/admin/products`, payload, authHeader);
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

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const payload = {
        ...partnerForm,
        cities: partnerForm.cities.split(',').map(c => c.trim()).filter(Boolean),
        commission_percent: parseFloat(partnerForm.commission_percent) || 0,
        rating: parseFloat(partnerForm.rating) || 5
      };

      if (editingPartner) {
        await axios.put(`${API_URL}/api/farewell/admin/partners/${editingPartner.id}`, payload, authHeader);
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/farewell/admin/partners`, payload, authHeader);
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

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      await axios.delete(`${API_URL}/api/farewell/admin/products/${productId}`, authHeader);
      toast({ title: 'Success', description: 'Product deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      await axios.delete(`${API_URL}/api/farewell/admin/partners/${partnerId}`, authHeader);
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '', image: '',
      category: 'urns', subcategory: '', sizes: '', in_stock: true,
      paw_reward_points: 0
    });
  };

  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', type: 'cremation', description: '', logo: '',
      contact_name: '', contact_email: '', contact_phone: '',
      website: '', cities: '', services: [],
      commission_percent: '', rating: 5, is_verified: false, is_active: true
    });
  };

  // CSV Export functions
  const handleProductExport = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Compare Price', 'In Stock', 'Paw Points'];
    const rows = products.map(p => [
      p.id, p.name, p.category, p.price, p.compare_price || '', p.in_stock ? 'Yes' : 'No', p.paw_reward_points || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    downloadCSV(csv, 'farewell-products.csv');
    toast({ title: 'Exported!', description: `${products.length} products exported` });
  };

  const handleRequestsExport = () => {
    const headers = ['Request ID', 'Service Type', 'Pet Name', 'Status', 'Created At', 'Customer Email'];
    const rows = requests.map(r => [
      r.request_id, r.service_type, r.pet_name || '', r.status, r.created_at?.split('T')[0], r.customer_email || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    downloadCSV(csv, 'farewell-requests.csv');
    toast({ title: 'Exported!', description: `${requests.length} requests exported` });
  };

  const handleProductImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const productsToImport = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });

      const response = await axios.post(`${API_URL}/api/farewell/admin/products/import`, productsToImport, authHeader);
      toast({ title: 'Success', description: `Imported ${response.data.imported} products` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import products', variant: 'destructive' });
    }
    e.target.value = '';
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
      req.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.service_type === typeFilter;
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
    <div className="space-y-6" data-testid="farewell-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌈 Farewell Manager</h2>
          <p className="text-gray-500">Manage memorial services, products & partners</p>
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
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 opacity-80" />
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
              <p className="text-2xl font-bold">{stats.by_status?.completed || 0}</p>
              <p className="text-sm opacity-90">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.products || products.length}</p>
              <p className="text-sm opacity-90">Products</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="requests" data-testid="farewell-tab-requests">
            <Bell className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="farewell-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="farewell-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="farewell-tab-bundles">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="experiences" data-testid="farewell-tab-experiences">
            <Sparkles className="w-4 h-4 mr-2" /> Experiences
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="farewell-tab-services">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid="farewell-tab-tips">
            <Sparkles className="w-4 h-4 mr-2" /> Tips
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="farewell-tab-settings">
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
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="cremation">Cremation</option>
                <option value="burial">Burial</option>
                <option value="memorial">Memorial</option>
                <option value="transport">Transport</option>
                <option value="grief_support">Grief Support</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleRequestsExport}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No farewell requests found</p>
              </Card>
            ) : (
              filteredRequests.map((req) => {
                const TypeIcon = serviceTypes[req.service_type]?.icon || Heart;
                return (
                  <Card 
                    key={req.request_id} 
                    className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedRequest?.request_id === req.request_id ? 'ring-2 ring-purple-500' : ''}`}
                    onClick={() => setSelectedRequest(selectedRequest?.request_id === req.request_id ? null : req)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${serviceTypes[req.service_type]?.color || 'bg-gray-500'} text-white`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{req.request_id}</h3>
                            <Badge className={statusColors[req.status] || 'bg-gray-100'}>{req.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <PawPrint className="w-3 h-3 inline mr-1" />
                            {req.pet_name || 'Pet'} • {serviceTypes[req.service_type]?.name}
                          </p>
                          {req.customer_email && (
                            <p className="text-sm text-gray-500">
                              <Mail className="w-3 h-3 inline mr-1" />
                              {req.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedRequest?.request_id === req.request_id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Contact</p>
                            <p className="font-medium">{req.customer_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{req.customer_email}</p>
                            <p className="text-sm text-gray-500">{req.customer_phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Pet Details</p>
                            <p className="text-sm">Name: {req.pet_name || 'N/A'}</p>
                            <p className="text-sm">Species: {req.pet_species || 'N/A'}</p>
                            <p className="text-sm">Weight: {req.pet_weight ? `${req.pet_weight}kg` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Service</p>
                            <p className="text-sm">{serviceTypes[req.service_type]?.name}</p>
                          </div>
                        </div>
                        
                        {req.message && (
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Message</p>
                            <p className="text-sm">{req.message}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.request_id, 'in_progress'); }}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Start Processing
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.request_id, 'completed'); }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Complete
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
            {Object.entries(serviceTypes).map(([key, type]) => {
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
                <p className="text-gray-500">No farewell partners yet</p>
                <p className="text-sm text-gray-400 mt-1">Add cremation services, cemeteries, and support providers</p>
                <Button className="mt-4" onClick={() => { resetPartnerForm(); setShowPartnerModal(true); }}>
                  Add First Partner
                </Button>
              </Card>
            ) : (
              partners.map((partner) => {
                const typeInfo = serviceTypes[partner.type] || serviceTypes.cremation;
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
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Verified</Badge>
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
                        </div>
                        {partner.contact_email && (
                          <p className="text-xs text-gray-400 mt-1">{partner.contact_email}</p>
                        )}
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
                            type: partner.type || 'cremation',
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
                            is_active: partner.is_active !== false
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
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <PillarProductsTab pillar="farewell" pillarName="Farewell" />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <PillarBundlesTab 
            pillar="farewell"
            credentials={getAuthHeader}
            accentColor="purple"
          />
        </TabsContent>

        {/* Experiences Tab */}
        <TabsContent value="experiences" className="space-y-4">
          <PillarExperiencesTab 
            pillar="farewell"
            credentials={getAuthHeader}
            accentColor="purple"
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <PillarServicesTab
            pillar="farewell"
            pillarName="Farewell"
            pillarIcon="🌈"
            pillarColor="bg-purple-500"
          />
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <Card className="p-8 text-center" data-testid="farewell-tips-panel">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Farewell Tips</p>
            <p className="text-sm text-gray-400 mt-1">Quick win tips and grief support guides for Farewell pillar coming soon</p>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per Service Request</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_service || 200}
                  onChange={(e) => setSettings({
                    ...settings,
                    paw_rewards: { ...settings.paw_rewards, points_per_service: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Points per Product Purchase</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_product_purchase || 50}
                  onChange={(e) => setSettings({
                    ...settings,
                    paw_rewards: { ...settings.paw_rewards, points_per_product_purchase: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">💜 Grief Support Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Grief Support</Label>
                  <p className="text-sm text-gray-500">Offer counselling and support resources</p>
                </div>
                <Switch 
                  checked={settings.grief_support?.enabled || false}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    grief_support: { ...settings.grief_support, enabled: checked }
                  })}
                />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input 
                  type="email"
                  value={settings.grief_support?.counsellor_email || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    grief_support: { ...settings.grief_support, counsellor_email: e.target.value }
                  })}
                  placeholder="support@example.com"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Memorial Product'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urns">Urns & Containers</SelectItem>
                    <SelectItem value="keepsakes">Keepsakes & Jewellery</SelectItem>
                    <SelectItem value="memorial">Memorial Items</SelectItem>
                    <SelectItem value="comfort">Comfort Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input 
                  value={productForm.subcategory}
                  onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})}
                  placeholder="e.g., Ceramic, Wooden"
                />
              </div>
              <div>
                <Label>Price (₹) *</Label>
                <Input 
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input 
                  type="number"
                  value={productForm.compare_price}
                  onChange={(e) => setProductForm({...productForm, compare_price: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Image URL</Label>
                <Input 
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <Label>Sizes (comma-separated)</Label>
                <Input 
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({...productForm, sizes: e.target.value})}
                  placeholder="Small, Medium, Large"
                />
              </div>
              <div>
                <Label>Paw Reward Points</Label>
                <Input 
                  type="number"
                  value={productForm.paw_reward_points}
                  onChange={(e) => setProductForm({...productForm, paw_reward_points: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch 
                  checked={productForm.in_stock}
                  onCheckedChange={(checked) => setProductForm({...productForm, in_stock: checked})}
                />
                <Label>In Stock</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Partner Modal */}
      <Dialog open={showPartnerModal} onOpenChange={setShowPartnerModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Farewell Partner'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePartnerSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Partner Name *</Label>
                <Input 
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Service Type</Label>
                <Select value={partnerForm.type} onValueChange={(v) => setPartnerForm({...partnerForm, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cremation">Cremation Services</SelectItem>
                    <SelectItem value="burial">Burial Services</SelectItem>
                    <SelectItem value="memorial">Memorial Products</SelectItem>
                    <SelectItem value="transport">Dignified Transport</SelectItem>
                    <SelectItem value="grief_support">Grief Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating</Label>
                <Input 
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={partnerForm.rating}
                  onChange={(e) => setPartnerForm({...partnerForm, rating: parseFloat(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={partnerForm.description}
                  onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input 
                  value={partnerForm.contact_name}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input 
                  value={partnerForm.contact_phone}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Contact Email</Label>
                <Input 
                  type="email"
                  value={partnerForm.contact_email}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Cities (comma-separated)</Label>
                <Input 
                  value={partnerForm.cities}
                  onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})}
                  placeholder="Mumbai, Bangalore, Delhi"
                />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input 
                  type="number"
                  value={partnerForm.commission_percent}
                  onChange={(e) => setPartnerForm({...partnerForm, commission_percent: e.target.value})}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input 
                  value={partnerForm.website}
                  onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={partnerForm.is_verified}
                    onCheckedChange={(checked) => setPartnerForm({...partnerForm, is_verified: checked})}
                  />
                  <Label>Verified</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={partnerForm.is_active}
                    onCheckedChange={(checked) => setPartnerForm({...partnerForm, is_active: checked})}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPartnerModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPartner ? 'Update' : 'Add'} Partner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarewellManager;
