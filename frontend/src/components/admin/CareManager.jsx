/**
 * CareManager - Admin component for Care Pillar
 * Manages care requests, partners, products, bundles, and settings
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import {
  Scissors, PawPrint, GraduationCap, Stethoscope, AlertTriangle, Heart,
  ClipboardList, Bell, Building2, Package, Gift, Settings, Search,
  Plus, Edit2, Trash2, RefreshCw, Upload, Download, ChevronRight,
  Clock, CheckCircle, XCircle, User, Phone, Mail, MapPin, Star,
  Calendar, Filter, Eye
} from 'lucide-react';

// Care Type Icons
const CARE_TYPE_ICONS = {
  grooming: Scissors,
  walks: PawPrint,
  training: GraduationCap,
  vet_coordination: Stethoscope,
  emergency: AlertTriangle,
  special_needs: Heart,
  routine: ClipboardList
};

const CARE_TYPE_COLORS = {
  grooming: 'from-pink-500 to-rose-500',
  walks: 'from-green-500 to-emerald-500',
  training: 'from-blue-500 to-indigo-500',
  vet_coordination: 'from-purple-500 to-violet-500',
  emergency: 'from-red-500 to-orange-500',
  special_needs: 'from-amber-500 to-yellow-500',
  routine: 'from-cyan-500 to-teal-500'
};

const STATUS_BADGES = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  acknowledged: { label: 'Acknowledged', color: 'bg-cyan-100 text-cyan-700' },
  reviewing: { label: 'Reviewing', color: 'bg-yellow-100 text-yellow-700' },
  matched: { label: 'Matched', color: 'bg-purple-100 text-purple-700' },
  scheduled: { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
};

const PRIORITY_BADGES = {
  urgent: { label: 'Urgent', color: 'bg-red-500 text-white' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' }
};

const CareManager = ({ getAuthHeader }) => {
  // State
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '', image: '',
    care_type: 'grooming', subcategory: '', tags: '', pet_sizes: '',
    in_stock: true, paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', price: '', original_price: '', image: '',
    care_type: 'grooming', items: '', is_recommended: true, paw_reward_points: 0
  });
  
  const [partnerForm, setPartnerForm] = useState({
    name: '', type: 'groomer', description: '', logo: '',
    contact_name: '', contact_email: '', contact_phone: '', website: '',
    cities: '', services: '', specializations: '',
    commission_percent: 0, rating: 5, is_verified: false, is_active: true,
    home_service: false, salon_service: false
  });
  
  const fileInputRef = useRef(null);

  // Update nested settings
  const updateSettings = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value
      }
    }));
  };

  // Save settings to backend
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await axios.put(`${API_URL}/api/care/admin/settings`, settings);
      if (response.status === 200) {
        toast({ title: '✅ Settings Saved', description: 'Care pillar settings updated successfully' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [requestsRes, productsRes, bundlesRes, statsRes, settingsRes, partnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/care/requests`),
        axios.get(`${API_URL}/api/care/products`),
        axios.get(`${API_URL}/api/care/bundles`),
        axios.get(`${API_URL}/api/care/stats`),
        axios.get(`${API_URL}/api/care/admin/settings`),
        axios.get(`${API_URL}/api/care/admin/partners`)
      ]);
      
      setRequests(requestsRes.data.requests || []);
      setProducts(productsRes.data.products || []);
      setBundles(bundlesRes.data.bundles || []);
      setStats(statsRes.data || {});
      setSettings(settingsRes.data || {});
      setPartners(partnersRes.data.partners || []);
    } catch (error) {
      console.error('Error fetching care data:', error);
      toast({ title: 'Error', description: 'Failed to load care data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Seed default products
  const seedProducts = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/care/admin/seed-products`, {}, getAuthHeader());
      toast({ title: 'Success', description: `Seeded ${response.data.products_seeded} products and ${response.data.bundles_seeded} bundles` });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
    }
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '', image: '',
      care_type: 'grooming', subcategory: '', tags: '', pet_sizes: '',
      in_stock: true, paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const saveProduct = async () => {
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        birthday_discount_percent: productForm.birthday_discount_percent ? parseInt(productForm.birthday_discount_percent) : null,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        pet_sizes: productForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/api/care/admin/products/${editingProduct.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/care/admin/products`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product created' });
      }
      setShowProductModal(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/api/care/admin/products/${productId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Product deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  // Bundle CRUD
  const resetBundleForm = () => {
    setBundleForm({
      name: '', description: '', price: '', original_price: '', image: '',
      care_type: 'grooming', items: '', is_recommended: true, paw_reward_points: 0
    });
  };

  const saveBundle = async () => {
    try {
      const payload = {
        ...bundleForm,
        price: parseFloat(bundleForm.price) || 0,
        original_price: bundleForm.original_price ? parseFloat(bundleForm.original_price) : null,
        paw_reward_points: parseInt(bundleForm.paw_reward_points) || 0,
        items: bundleForm.items.split(',').map(i => i.trim()).filter(Boolean)
      };

      if (editingBundle) {
        await axios.put(`${API_URL}/api/care/admin/bundles/${editingBundle.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        await axios.post(`${API_URL}/api/care/admin/bundles`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle created' });
      }
      setShowBundleModal(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save bundle', variant: 'destructive' });
    }
  };

  const deleteBundle = async (bundleId) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      await axios.delete(`${API_URL}/api/care/admin/bundles/${bundleId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Bundle deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  // Partner CRUD
  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', type: 'groomer', description: '', logo: '',
      contact_name: '', contact_email: '', contact_phone: '', website: '',
      cities: '', services: '', specializations: '',
      commission_percent: 0, rating: 5, is_verified: false, is_active: true,
      home_service: false, salon_service: false
    });
  };

  const savePartner = async () => {
    try {
      const payload = {
        ...partnerForm,
        commission_percent: parseFloat(partnerForm.commission_percent) || 0,
        rating: parseFloat(partnerForm.rating) || 5,
        cities: partnerForm.cities.split(',').map(c => c.trim()).filter(Boolean),
        services: partnerForm.services.split(',').map(s => s.trim()).filter(Boolean),
        specializations: partnerForm.specializations.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingPartner) {
        await axios.put(`${API_URL}/api/care/admin/partners/${editingPartner.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/care/admin/partners`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner created' });
      }
      setShowPartnerModal(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save partner', variant: 'destructive' });
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm('Delete this partner?')) return;
    try {
      await axios.delete(`${API_URL}/api/care/admin/partners/${partnerId}`, getAuthHeader());
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/care/request/${requestId}`, { status: newStatus }, getAuthHeader());
      toast({ title: 'Success', description: 'Request status updated' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    }
  };

  // CSV Export
  const handleProductExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/care/admin/products/export`, getAuthHeader());
      const csvContent = convertToCSV(response.data.products);
      downloadCSV(csvContent, 'care-products.csv');
      toast({ title: 'Success', description: 'Products exported' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export products', variant: 'destructive' });
    }
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
  };

  // CSV Import
  const handleProductImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()));
        const headers = rows[0];
        const products = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = row[i]; });
          return obj;
        });

        const response = await axios.post(`${API_URL}/api/care/admin/products/import`, products, getAuthHeader());
        toast({ title: 'Success', description: `Imported ${response.data.imported} products` });
        fetchAllData();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to import products', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (statusFilter && statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter && typeFilter !== 'all' && r.care_type !== typeFilter) return false;
    if (priorityFilter && priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.request_id?.toLowerCase().includes(query) ||
        r.pet?.name?.toLowerCase().includes(query) ||
        r.customer?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-pink-600" />
            Care Manager
          </h2>
          <p className="text-gray-500">Manage care requests, partners, products & bundles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAllData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={seedProducts} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Seed Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Requests</p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending Review</p>
              <p className="text-2xl font-bold">{(stats.by_status?.submitted || 0) + (stats.by_status?.acknowledged || 0)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold">{stats.by_status?.completed || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-pink-400" />
          </div>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="requests" data-testid="care-tab-requests">
            <Bell className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="care-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="care-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="care-tab-bundles">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="care-tab-settings">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_BADGES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Care Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="walks">Walks & Sitting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="vet_coordination">Vet Coordination</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="special_needs">Special Needs</SelectItem>
                  <SelectItem value="routine">Routine Care</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const Icon = CARE_TYPE_ICONS[request.care_type] || Heart;
              const statusBadge = STATUS_BADGES[request.status] || STATUS_BADGES.submitted;
              const priorityBadge = PRIORITY_BADGES[request.priority] || PRIORITY_BADGES.normal;
              
              return (
                <Card key={request.request_id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CARE_TYPE_COLORS[request.care_type] || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">{request.request_id}</span>
                        <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                        <Badge className={priorityBadge.color}>{priorityBadge.label}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mt-1">
                        {request.care_type_name} for {request.pet?.name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">{request.details?.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {request.customer?.name || 'Unknown'}
                        </span>
                        {request.customer?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {request.customer.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={request.status}
                        onValueChange={(val) => updateRequestStatus(request.request_id, val)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_BADGES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedRequest(request); setShowRequestModal(true); }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredRequests.length === 0 && (
              <Card className="p-8 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No care requests found</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Care Partners</h3>
              <Button onClick={() => { resetPartnerForm(); setEditingPartner(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                      {partner.is_verified && <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{partner.type?.replace('_', ' ')}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-sm">{partner.rating}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {partner.home_service && <Badge variant="outline" className="text-xs">Home</Badge>}
                      {partner.salon_service && <Badge variant="outline" className="text-xs">Salon</Badge>}
                      {!partner.is_active && <Badge className="bg-red-100 text-red-600 text-xs">Inactive</Badge>}
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
                        type: partner.type || 'groomer',
                        description: partner.description || '',
                        logo: partner.logo || '',
                        contact_name: partner.contact_name || '',
                        contact_email: partner.contact_email || '',
                        contact_phone: partner.contact_phone || '',
                        website: partner.website || '',
                        cities: (partner.cities || []).join(', '),
                        services: (partner.services || []).join(', '),
                        specializations: (partner.specializations || []).join(', '),
                        commission_percent: partner.commission_percent || 0,
                        rating: partner.rating || 5,
                        is_verified: partner.is_verified || false,
                        is_active: partner.is_active !== false,
                        home_service: partner.home_service || false,
                        salon_service: partner.salon_service || false
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
            ))}
          </div>

          {partners.length === 0 && (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No partners yet</p>
              <Button className="mt-4" onClick={() => { resetPartnerForm(); setShowPartnerModal(true); }}>
                Add First Partner
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                <Button onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
                <Button variant="outline" onClick={seedProducts}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Seed Default Products
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleProductImport}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import CSV
                </Button>
                <Button variant="outline" onClick={handleProductExport}>
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="flex items-start gap-3">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{product.care_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-green-600">₹{product.price}</span>
                      {product.compare_price && (
                        <span className="text-sm text-gray-400 line-through">₹{product.compare_price}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.paw_reward_points > 0 && (
                        <Badge variant="outline" className="text-xs">🐾 {product.paw_reward_points} pts</Badge>
                      )}
                      {product.is_birthday_perk && (
                        <Badge variant="outline" className="text-xs text-pink-600">🎂 Birthday Perk</Badge>
                      )}
                      {!product.in_stock && (
                        <Badge className="bg-red-100 text-red-600 text-xs">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(product);
                      setProductForm({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price?.toString() || '',
                        compare_price: product.compare_price?.toString() || '',
                        image: product.image || '',
                        care_type: product.care_type || 'grooming',
                        subcategory: product.subcategory || '',
                        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                        pet_sizes: Array.isArray(product.pet_sizes) ? product.pet_sizes.join(', ') : '',
                        in_stock: product.in_stock !== false,
                        paw_reward_points: product.paw_reward_points || 0,
                        is_birthday_perk: product.is_birthday_perk || false,
                        birthday_discount_percent: product.birthday_discount_percent?.toString() || ''
                      });
                      setShowProductModal(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No care products yet</p>
              <Button className="mt-4" onClick={seedProducts}>Seed Default Products</Button>
            </Card>
          )}
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Care Bundles</h3>
              <Button onClick={() => { resetBundleForm(); setEditingBundle(null); setShowBundleModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Bundle
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="p-4">
                <div className="flex items-start gap-3">
                  {bundle.image ? (
                    <img src={bundle.image} alt={bundle.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-purple-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{bundle.care_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-green-600">₹{bundle.price}</span>
                      {bundle.original_price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                          <Badge className="bg-red-100 text-red-600 text-xs">
                            {Math.round((1 - bundle.price / bundle.original_price) * 100)}% OFF
                          </Badge>
                        </>
                      )}
                    </div>
                    {bundle.paw_reward_points > 0 && (
                      <p className="text-xs text-purple-600 mt-1">🐾 {bundle.paw_reward_points} Paw Points</p>
                    )}
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
                        care_type: bundle.care_type || 'grooming',
                        items: Array.isArray(bundle.items) ? bundle.items.join(', ') : '',
                        is_recommended: bundle.is_recommended !== false,
                        paw_reward_points: bundle.paw_reward_points || 0
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
            ))}
          </div>

          {bundles.length === 0 && (
            <Card className="p-8 text-center">
              <Gift className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No care bundles yet</p>
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
                <Label>Points per Care Request</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_request || 30}
                  onChange={(e) => updateSettings('paw_rewards', 'points_per_request', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Points per Product Purchase (per ₹100)</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_purchase || 10}
                  onChange={(e) => updateSettings('paw_rewards', 'points_per_purchase', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Bonus Points for Grooming</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.grooming_bonus || 20}
                  onChange={(e) => updateSettings('paw_rewards', 'grooming_bonus', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Repeat Customer Bonus</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.repeat_bonus || 15}
                  onChange={(e) => updateSettings('paw_rewards', 'repeat_bonus', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => updateSettings('birthday_perks', 'discount_percent', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valid Days (before/after birthday)</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.valid_days || 7}
                  onChange={(e) => updateSettings('birthday_perks', 'valid_days', parseInt(e.target.value) || 0)}
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
                <Switch 
                  checked={settings.notifications?.email_enabled !== false} 
                  onCheckedChange={(val) => updateSettings('notifications', 'email_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>WhatsApp Notifications</Label>
                <Switch 
                  checked={settings.notifications?.whatsapp_enabled || false} 
                  onCheckedChange={(val) => updateSettings('notifications', 'whatsapp_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch 
                  checked={settings.notifications?.sms_enabled || false} 
                  onCheckedChange={(val) => updateSettings('notifications', 'sms_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Appointment Reminders (24h before)</Label>
                <Switch 
                  checked={settings.notifications?.appointment_reminder !== false} 
                  onCheckedChange={(val) => updateSettings('notifications', 'appointment_reminder', val)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Service Desk Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-create tickets for requests</Label>
                <Switch 
                  checked={settings.service_desk?.auto_create_tickets !== false} 
                  onCheckedChange={(val) => updateSettings('service_desk', 'auto_create_tickets', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Route to Partners</Label>
                <Switch 
                  checked={settings.service_desk?.route_to_partners || false} 
                  onCheckedChange={(val) => updateSettings('service_desk', 'route_to_partners', val)}
                />
              </div>
              <div>
                <Label>Default SLA (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.service_desk?.default_sla || 48}
                  onChange={(e) => updateSettings('service_desk', 'default_sla', parseInt(e.target.value) || 48)}
                  className="mt-1 w-32"
                />
              </div>
            </div>
          </Card>
          
          {/* Save Settings Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings} 
              disabled={savingSettings}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save All Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input type="number" value={productForm.compare_price} onChange={(e) => setProductForm({...productForm, compare_price: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={productForm.image} onChange={(e) => setProductForm({...productForm, image: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Care Type</Label>
                <Select value={productForm.care_type} onValueChange={(val) => setProductForm({...productForm, care_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grooming">Grooming</SelectItem>
                    <SelectItem value="walks">Walks & Sitting</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input value={productForm.subcategory} onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={productForm.tags} onChange={(e) => setProductForm({...productForm, tags: e.target.value})} placeholder="grooming, brush, coat care" />
            </div>
            <div>
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={productForm.pet_sizes} onChange={(e) => setProductForm({...productForm, pet_sizes: e.target.value})} placeholder="small, medium, large" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paw Reward Points</Label>
                <Input type="number" value={productForm.paw_reward_points} onChange={(e) => setProductForm({...productForm, paw_reward_points: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <Label>Birthday Discount %</Label>
                <Input type="number" value={productForm.birthday_discount_percent} onChange={(e) => setProductForm({...productForm, birthday_discount_percent: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch checked={productForm.in_stock} onCheckedChange={(val) => setProductForm({...productForm, in_stock: val})} />
                <span>In Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={productForm.is_birthday_perk} onCheckedChange={(val) => setProductForm({...productForm, is_birthday_perk: val})} />
                <span>Birthday Perk</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button onClick={saveProduct}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bundle Modal */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Add Bundle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bundle Name</Label>
              <Input value={bundleForm.name} onChange={(e) => setBundleForm({...bundleForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={bundleForm.description} onChange={(e) => setBundleForm({...bundleForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={bundleForm.price} onChange={(e) => setBundleForm({...bundleForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input type="number" value={bundleForm.original_price} onChange={(e) => setBundleForm({...bundleForm, original_price: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={bundleForm.image} onChange={(e) => setBundleForm({...bundleForm, image: e.target.value})} />
            </div>
            <div>
              <Label>Care Type</Label>
              <Select value={bundleForm.care_type} onValueChange={(val) => setBundleForm({...bundleForm, care_type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="walks">Walks & Sitting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product IDs (comma-separated)</Label>
              <Input value={bundleForm.items} onChange={(e) => setBundleForm({...bundleForm, items: e.target.value})} placeholder="care-product-1, care-product-2" />
            </div>
            <div>
              <Label>Paw Reward Points</Label>
              <Input type="number" value={bundleForm.paw_reward_points} onChange={(e) => setBundleForm({...bundleForm, paw_reward_points: parseInt(e.target.value) || 0})} />
            </div>
            <label className="flex items-center gap-2">
              <Switch checked={bundleForm.is_recommended} onCheckedChange={(val) => setBundleForm({...bundleForm, is_recommended: val})} />
              <span>Recommended</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBundleModal(false)}>Cancel</Button>
            <Button onClick={saveBundle}>Save Bundle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Modal */}
      <Dialog open={showPartnerModal} onOpenChange={setShowPartnerModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner Name</Label>
              <Input value={partnerForm.name} onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Partner Type</Label>
              <Select value={partnerForm.type} onValueChange={(val) => setPartnerForm({...partnerForm, type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="groomer">Groomer</SelectItem>
                  <SelectItem value="walker">Dog Walker</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="sitter">Pet Sitter</SelectItem>
                  <SelectItem value="vet">Veterinarian</SelectItem>
                  <SelectItem value="behavioral">Behaviorist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={partnerForm.description} onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input value={partnerForm.contact_name} onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={partnerForm.contact_phone} onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={partnerForm.contact_email} onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})} />
            </div>
            <div>
              <Label>Cities (comma-separated)</Label>
              <Input value={partnerForm.cities} onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})} placeholder="Mumbai, Delhi, Bangalore" />
            </div>
            <div>
              <Label>Services (comma-separated)</Label>
              <Input value={partnerForm.services} onChange={(e) => setPartnerForm({...partnerForm, services: e.target.value})} placeholder="full groom, bath, nail trim" />
            </div>
            <div>
              <Label>Specializations (comma-separated)</Label>
              <Input value={partnerForm.specializations} onChange={(e) => setPartnerForm({...partnerForm, specializations: e.target.value})} placeholder="anxious dogs, large breeds, puppies" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rating (1-5)</Label>
                <Input type="number" min="1" max="5" step="0.1" value={partnerForm.rating} onChange={(e) => setPartnerForm({...partnerForm, rating: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input type="number" value={partnerForm.commission_percent} onChange={(e) => setPartnerForm({...partnerForm, commission_percent: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.is_active} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_active: val})} />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.is_verified} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_verified: val})} />
                <span>Verified</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.home_service} onCheckedChange={(val) => setPartnerForm({...partnerForm, home_service: val})} />
                <span>Home Service</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.salon_service} onCheckedChange={(val) => setPartnerForm({...partnerForm, salon_service: val})} />
                <span>Salon Service</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerModal(false)}>Cancel</Button>
            <Button onClick={savePartner}>Save Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Care Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={STATUS_BADGES[selectedRequest.status]?.color}>
                  {STATUS_BADGES[selectedRequest.status]?.label}
                </Badge>
                <Badge className={PRIORITY_BADGES[selectedRequest.priority]?.color}>
                  {PRIORITY_BADGES[selectedRequest.priority]?.label}
                </Badge>
                <span className="font-mono text-sm text-gray-500">{selectedRequest.request_id}</span>
              </div>
              
              <Card className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Pet Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> {selectedRequest.pet?.name}</div>
                  <div><span className="text-gray-500">Breed:</span> {selectedRequest.pet?.breed || 'Unknown'}</div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Request Details</h4>
                <p className="text-sm">{selectedRequest.details?.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div><span className="text-gray-500">Type:</span> {selectedRequest.care_type_name}</div>
                  <div><span className="text-gray-500">Preferred Date:</span> {selectedRequest.details?.preferred_date || 'Flexible'}</div>
                  <div><span className="text-gray-500">Location:</span> {selectedRequest.details?.location_type || 'Not specified'}</div>
                  <div><span className="text-gray-500">Frequency:</span> {selectedRequest.details?.frequency || 'One-time'}</div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Customer</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> {selectedRequest.customer?.name}</div>
                  <div><span className="text-gray-500">Phone:</span> {selectedRequest.customer?.phone}</div>
                  <div className="col-span-2"><span className="text-gray-500">Email:</span> {selectedRequest.customer?.email}</div>
                </div>
              </Card>
              
              {selectedRequest.profile_gaps?.length > 0 && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-semibold mb-2 text-yellow-800">Profile Gaps Identified</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.profile_gaps.map((gap, i) => (
                      <Badge key={i} variant="outline" className="text-yellow-700">{gap}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareManager;
