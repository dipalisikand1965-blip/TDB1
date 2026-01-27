/**
 * CelebrateManager - Admin component for Celebrate Pillar
 * Manages cakes, treats, hampers - The flagship pillar
 * Tabs: Requests | Partners | Products | Bundles | Settings
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
  Cake, Gift, Heart, ShoppingBag, Settings, Search,
  Plus, Edit2, Trash2, RefreshCw, Upload, Download, ChevronRight,
  Clock, CheckCircle, XCircle, User, Phone, Mail, MapPin, Star,
  Calendar, Filter, Eye, Package, Building2, Sparkles, PartyPopper
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'cakes', label: '🎂 Birthday Cakes' },
  { value: 'breed-cakes', label: '🐕 Breed Cakes' },
  { value: 'treats', label: '🍪 Treats' },
  { value: 'pupcakes', label: '🧁 Pupcakes' },
  { value: 'desi-treats', label: '🪔 Desi Treats' },
  { value: 'hampers', label: '🎁 Hampers' },
  { value: 'frozen', label: '🧊 Frozen Treats' },
  { value: 'meals', label: '🍕 Fresh Meals' },
  { value: 'accessories', label: '🎀 Accessories' }
];

const STATUS_BADGES = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  acknowledged: { label: 'Acknowledged', color: 'bg-cyan-100 text-cyan-700' },
  reviewing: { label: 'Reviewing', color: 'bg-yellow-100 text-yellow-700' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700' },
  ready: { label: 'Ready', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
};

const REQUEST_TYPES = {
  custom_cake: { label: 'Custom Cake', icon: Cake },
  bulk_order: { label: 'Bulk Order', icon: Package },
  special_event: { label: 'Special Event', icon: PartyPopper },
  consultation: { label: 'Consultation', icon: Heart }
};

const CelebrateManager = ({ getAuthHeader }) => {
  // State
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Import states
  const [importingProducts, setImportingProducts] = useState(false);
  const [importingBundles, setImportingBundles] = useState(false);
  const productFileRef = useRef(null);
  const bundleFileRef = useRef(null);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '', image: '',
    category: 'cakes', subcategory: '', tags: '', sizes: '',
    flavors: '', bases: '', in_stock: true, is_bestseller: false, is_new: false,
    is_birthday_perk: false, birthday_discount_percent: '',
    paw_reward_points: 0, pan_india: false,
    fresh_delivery_cities: '', // NEW: Cities for fresh cake delivery
    life_stage: '', // NEW: Puppy, Adult, Senior, All Ages
    occasion: '', // NEW: Birthday, Anniversary, Gotcha Day, etc.
    dietary: '', // NEW: Grain-free, Vegan, Low-fat, etc.
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', price: '', original_price: '', image: '',
    category: 'hampers', items: '', occasion: '', is_recommended: true,
    paw_reward_points: 0
  });
  
  const [partnerForm, setPartnerForm] = useState({
    name: '', type: 'bakery', description: '', logo: '',
    contact_name: '', contact_email: '', contact_phone: '', website: '',
    cities: '', specializations: '',
    commission_percent: 0, rating: 5, is_verified: false, is_active: true
  });

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch from public products endpoint (Shopify synced) - no auth required
      const [requestsRes, productsRes, bundlesRes, settingsRes, partnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/celebrate/requests`),
        axios.get(`${API_URL}/api/products?limit=1000`),
        axios.get(`${API_URL}/api/celebrate/admin/bundles`),
        axios.get(`${API_URL}/api/celebrate/admin/settings`),
        axios.get(`${API_URL}/api/celebrate/admin/partners`)
      ]);
      
      setRequests(requestsRes.data.requests || []);
      // Filter products for celebrate categories (cakes, treats, hampers, pupcakes, dognuts, frozen-treats, etc.)
      const allProducts = productsRes.data.products || [];
      const celebrateCategories = ['cakes', 'treats', 'hampers', 'pupcakes', 'dognuts', 'frozen', 'celebrate', 'breed-cakes', 'mini-cakes', 'desi-treats'];
      const celebrateProducts = allProducts.filter(p => 
        celebrateCategories.some(cat => 
          (p.category || '').toLowerCase().includes(cat) ||
          (p.subcategory || '').toLowerCase().includes(cat)
        )
      );
      setProducts(celebrateProducts.length > 0 ? celebrateProducts : allProducts);
      setBundles(bundlesRes.data.bundles || []);
      // Calculate stats from actual data
      const statsData = {
        total_products: celebrateProducts.length || allProducts.length,
        total_bundles: (bundlesRes.data.bundles || []).length,
        total_partners: (partnersRes.data.partners || []).length,
        pending_requests: (requestsRes.data.requests || []).filter(r => ['submitted', 'acknowledged'].includes(r.status)).length,
        completed_requests: (requestsRes.data.requests || []).filter(r => r.status === 'completed').length
      };
      setStats(statsData);
      setSettings(settingsRes.data || {});
      setPartners(partnersRes.data.partners || []);
    } catch (error) {
      console.error('Error fetching celebrate data:', error);
      toast({ title: 'Error', description: 'Failed to load celebrate data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Sync with Shopify (main products)
  const syncWithShopify = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/sync-shopify`);
      toast({ 
        title: 'Success', 
        description: response.data.message || 'Shopify sync initiated'
      });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to sync with Shopify', variant: 'destructive' });
    }
  };

  // Seed sample products (for testing only)
  const seedProducts = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/celebrate/admin/seed`);
      toast({ 
        title: 'Success', 
        description: `Seeded ${response.data.products_seeded} products, ${response.data.bundles_seeded} bundles, ${response.data.partners_seeded} partners` 
      });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  // ============ PRODUCT CRUD ============
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '', image: '',
      category: 'cakes', subcategory: '', tags: '', sizes: '',
      flavors: '', in_stock: true, is_bestseller: false, is_new: false,
      is_birthday_perk: false, birthday_discount_percent: '',
      paw_reward_points: 0, pan_india: false
    });
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        compare_price: product.compare_price?.toString() || '',
        image: product.image || '',
        category: product.category || 'cakes',
        subcategory: product.subcategory || '',
        tags: (product.tags || []).join(', '),
        sizes: (product.sizes || []).map(s => `${s.name}:${s.price}`).join(', '),
        flavors: (product.flavors || []).join(', '),
        in_stock: product.in_stock ?? true,
        is_bestseller: product.is_bestseller ?? false,
        is_new: product.is_new ?? false,
        is_birthday_perk: product.is_birthday_perk ?? false,
        birthday_discount_percent: product.birthday_discount_percent?.toString() || '',
        paw_reward_points: product.paw_reward_points || 0,
        pan_india: product.pan_india ?? false
      });
    } else {
      setEditingProduct(null);
      resetProductForm();
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    try {
      // Parse sizes
      const sizes = productForm.sizes ? productForm.sizes.split(',').map(s => {
        const [name, price] = s.trim().split(':');
        return { name: name?.trim(), price: parseFloat(price) || 0 };
      }).filter(s => s.name) : [];

      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
        image: productForm.image,
        category: productForm.category,
        subcategory: productForm.subcategory,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        sizes: sizes,
        flavors: productForm.flavors.split(',').map(f => f.trim()).filter(Boolean),
        in_stock: productForm.in_stock,
        is_bestseller: productForm.is_bestseller,
        is_new: productForm.is_new,
        is_birthday_perk: productForm.is_birthday_perk,
        birthday_discount_percent: productForm.birthday_discount_percent ? parseInt(productForm.birthday_discount_percent) : null,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        pan_india: productForm.pan_india
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/api/celebrate/admin/products/${editingProduct.id}`, payload);
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/celebrate/admin/products`, payload);
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
      await axios.delete(`${API_URL}/api/celebrate/admin/products/${productId}`);
      toast({ title: 'Success', description: 'Product deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  // ============ BUNDLE CRUD ============
  const resetBundleForm = () => {
    setBundleForm({
      name: '', description: '', price: '', original_price: '', image: '',
      category: 'hampers', items: '', occasion: '', is_recommended: true,
      paw_reward_points: 0
    });
  };

  const openBundleModal = (bundle = null) => {
    if (bundle) {
      setEditingBundle(bundle);
      setBundleForm({
        name: bundle.name || '',
        description: bundle.description || '',
        price: bundle.price?.toString() || '',
        original_price: bundle.original_price?.toString() || '',
        image: bundle.image || '',
        category: bundle.category || 'hampers',
        items: (bundle.items || []).join(', '),
        occasion: bundle.occasion || '',
        is_recommended: bundle.is_recommended ?? true,
        paw_reward_points: bundle.paw_reward_points || 0
      });
    } else {
      setEditingBundle(null);
      resetBundleForm();
    }
    setShowBundleModal(true);
  };

  const saveBundle = async () => {
    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description,
        price: parseFloat(bundleForm.price) || 0,
        original_price: bundleForm.original_price ? parseFloat(bundleForm.original_price) : null,
        image: bundleForm.image,
        category: bundleForm.category,
        items: bundleForm.items.split(',').map(i => i.trim()).filter(Boolean),
        occasion: bundleForm.occasion,
        is_recommended: bundleForm.is_recommended,
        paw_reward_points: parseInt(bundleForm.paw_reward_points) || 0
      };

      if (editingBundle) {
        await axios.put(`${API_URL}/api/celebrate/admin/bundles/${editingBundle.id}`, payload);
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        await axios.post(`${API_URL}/api/celebrate/admin/bundles`, payload);
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
      await axios.delete(`${API_URL}/api/celebrate/admin/bundles/${bundleId}`);
      toast({ title: 'Success', description: 'Bundle deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  // ============ PARTNER CRUD ============
  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', type: 'bakery', description: '', logo: '',
      contact_name: '', contact_email: '', contact_phone: '', website: '',
      cities: '', specializations: '',
      commission_percent: 0, rating: 5, is_verified: false, is_active: true
    });
  };

  const openPartnerModal = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({
        name: partner.name || '',
        type: partner.type || 'bakery',
        description: partner.description || '',
        logo: partner.logo || '',
        contact_name: partner.contact_name || '',
        contact_email: partner.contact_email || '',
        contact_phone: partner.contact_phone || '',
        website: partner.website || '',
        cities: (partner.cities || []).join(', '),
        specializations: (partner.specializations || []).join(', '),
        commission_percent: partner.commission_percent || 0,
        rating: partner.rating || 5,
        is_verified: partner.is_verified ?? false,
        is_active: partner.is_active ?? true
      });
    } else {
      setEditingPartner(null);
      resetPartnerForm();
    }
    setShowPartnerModal(true);
  };

  const savePartner = async () => {
    try {
      const payload = {
        name: partnerForm.name,
        type: partnerForm.type,
        description: partnerForm.description,
        logo: partnerForm.logo,
        contact_name: partnerForm.contact_name,
        contact_email: partnerForm.contact_email,
        contact_phone: partnerForm.contact_phone,
        website: partnerForm.website,
        cities: partnerForm.cities.split(',').map(c => c.trim()).filter(Boolean),
        specializations: partnerForm.specializations.split(',').map(s => s.trim()).filter(Boolean),
        commission_percent: parseFloat(partnerForm.commission_percent) || 0,
        rating: parseFloat(partnerForm.rating) || 5,
        is_verified: partnerForm.is_verified,
        is_active: partnerForm.is_active
      };

      if (editingPartner) {
        await axios.put(`${API_URL}/api/celebrate/admin/partners/${editingPartner.id}`, payload);
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/celebrate/admin/partners`, payload);
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
      await axios.delete(`${API_URL}/api/celebrate/admin/partners/${partnerId}`);
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  // ============ REQUEST MANAGEMENT ============
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/celebrate/requests/${requestId}`, { status: newStatus });
      toast({ title: 'Success', description: 'Request status updated' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    }
  };

  // ============ CSV IMPORT/EXPORT ============
  const exportProductsCSV = () => {
    window.open(`${API_URL}/api/celebrate/admin/products/export-csv`, '_blank');
  };

  const exportBundlesCSV = () => {
    window.open(`${API_URL}/api/celebrate/admin/bundles/export-csv`, '_blank');
  };

  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportingProducts(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/celebrate/admin/products/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Success', description: response.data.message });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import products', variant: 'destructive' });
    } finally {
      setImportingProducts(false);
      e.target.value = '';
    }
  };

  const handleBundleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportingBundles(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/celebrate/admin/bundles/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Success', description: response.data.message });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import bundles', variant: 'destructive' });
    } finally {
      setImportingBundles(false);
      e.target.value = '';
    }
  };

  // ============ SETTINGS ============
  const saveSettings = async () => {
    try {
      await axios.put(`${API_URL}/api/celebrate/admin/settings`, settings);
      toast({ title: 'Success', description: 'Settings saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  // Filter functions
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="celebrate-manager">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 text-white">
          <div className="flex items-center gap-3">
            <Cake className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{stats.total_products || 0}</p>
              <p className="text-sm opacity-90">Products</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{stats.total_bundles || 0}</p>
              <p className="text-sm opacity-90">Bundles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{stats.total_partners || 0}</p>
              <p className="text-sm opacity-90">Partners</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{stats.pending_requests || 0}</p>
              <p className="text-sm opacity-90">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{stats.completed_requests || 0}</p>
              <p className="text-sm opacity-90">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-pink-50 p-1">
          <TabsTrigger value="requests" data-testid="celebrate-tab-requests" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="celebrate-tab-partners" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="celebrate-tab-products" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Cake className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="celebrate-tab-bundles" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="celebrate-tab-settings" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* REQUESTS TAB */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
            <Button variant="outline" onClick={fetchAllData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                No requests found
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_BADGES[request.status]?.color || 'bg-gray-100'}>
                          {STATUS_BADGES[request.status]?.label || request.status}
                        </Badge>
                        <Badge variant="outline">{REQUEST_TYPES[request.request_type]?.label || request.request_type}</Badge>
                        <span className="text-sm text-gray-500">#{request.id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {request.pet_name && <span className="font-medium">🐕 {request.pet_name}</span>}
                        {request.user_name && <span><User className="w-3 h-3 inline mr-1" />{request.user_name}</span>}
                        {request.city && <span><MapPin className="w-3 h-3 inline mr-1" />{request.city}</span>}
                      </div>
                      {request.details && <p className="text-sm text-gray-600">{request.details}</p>}
                      <p className="text-xs text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select value={request.status} onValueChange={(val) => updateRequestStatus(request.id, val)}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_BADGES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* PARTNERS TAB */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAllData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button onClick={() => openPartnerModal()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-4">
                <div className="flex items-start gap-3">
                  {partner.logo ? (
                    <img src={partner.logo} alt={partner.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-pink-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{partner.name}</h3>
                      {partner.is_verified && <Badge className="bg-green-100 text-green-700">Verified</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{partner.type}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{partner.rating}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{(partner.cities || []).join(', ')}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openPartnerModal(partner)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePartner(partner.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-wrap">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={fetchAllData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" onClick={syncWithShopify} className="bg-green-50 hover:bg-green-100 text-green-700">
                <RefreshCw className="w-4 h-4 mr-2" /> Sync Shopify
              </Button>
              <Button variant="outline" onClick={exportProductsCSV}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <input
                type="file"
                accept=".csv"
                ref={productFileRef}
                onChange={handleProductFileChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => productFileRef.current?.click()} disabled={importingProducts}>
                <Upload className="w-4 h-4 mr-2" /> {importingProducts ? 'Importing...' : 'Import CSV'}
              </Button>
              <Button onClick={() => openProductModal()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.is_bestseller && <Badge className="bg-yellow-500 text-white">Bestseller</Badge>}
                    {product.is_new && <Badge className="bg-green-500 text-white">New</Badge>}
                    {!product.in_stock && <Badge className="bg-red-500 text-white">Out of Stock</Badge>}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="text-sm text-gray-400 line-through">₹{product.compare_price}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openProductModal(product)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BUNDLES TAB */}
        <TabsContent value="bundles" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAllData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" onClick={exportBundlesCSV}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <input
                type="file"
                accept=".csv"
                ref={bundleFileRef}
                onChange={handleBundleFileChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => bundleFileRef.current?.click()} disabled={importingBundles}>
                <Upload className="w-4 h-4 mr-2" /> {importingBundles ? 'Importing...' : 'Import CSV'}
              </Button>
              <Button onClick={() => openBundleModal()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" /> Add Bundle
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={bundle.image || 'https://via.placeholder.com/400x200'} 
                    alt={bundle.name}
                    className="w-full h-full object-cover"
                  />
                  {bundle.is_recommended && (
                    <Badge className="absolute top-2 right-2 bg-purple-600">Recommended</Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{bundle.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{bundle.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-pink-600">₹{bundle.price}</span>
                    {bundle.original_price && (
                      <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(bundle.items || []).slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                    ))}
                    {(bundle.items || []).length > 3 && (
                      <Badge variant="outline" className="text-xs">+{bundle.items.length - 3} more</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openBundleModal(bundle)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteBundle(bundle.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label>Auto-acknowledge Requests</Label>
                <Switch
                  checked={settings.auto_acknowledge ?? true}
                  onCheckedChange={(val) => setSettings({...settings, auto_acknowledge: val})}
                />
              </div>
              <div>
                <Label>Notification Email</Label>
                <Input
                  value={settings.notification_email || ''}
                  onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                  placeholder="orders@company.com"
                />
              </div>
              <div>
                <Label>Notification WhatsApp</Label>
                <Input
                  value={settings.notification_whatsapp || ''}
                  onChange={(e) => setSettings({...settings, notification_whatsapp: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label>Default Lead Time (Days)</Label>
                <Input
                  type="number"
                  value={settings.default_lead_time_days || 2}
                  onChange={(e) => setSettings({...settings, default_lead_time_days: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Minimum Order Value (₹)</Label>
                <Input
                  type="number"
                  value={settings.min_order_value || 0}
                  onChange={(e) => setSettings({...settings, min_order_value: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Free Delivery Threshold (₹)</Label>
                <Input
                  type="number"
                  value={settings.free_delivery_threshold || 1500}
                  onChange={(e) => setSettings({...settings, free_delivery_threshold: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Standard Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  value={settings.delivery_fee || 100}
                  onChange={(e) => setSettings({...settings, delivery_fee: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Express Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  value={settings.express_delivery_fee || 200}
                  onChange={(e) => setSettings({...settings, express_delivery_fee: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Working Hours</Label>
                <Input
                  value={settings.working_hours || '9 AM - 8 PM'}
                  onChange={(e) => setSettings({...settings, working_hours: e.target.value})}
                />
              </div>
              <div>
                <Label>Order Cut-off Time</Label>
                <Input
                  value={settings.cut_off_time || '6 PM'}
                  onChange={(e) => setSettings({...settings, cut_off_time: e.target.value})}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Cities</h3>
            <div>
              <Label>Cities (comma-separated)</Label>
              <Textarea
                value={(settings.available_cities || []).join(', ')}
                onChange={(e) => setSettings({...settings, available_cities: e.target.value.split(',').map(c => c.trim()).filter(Boolean)})}
                placeholder="Mumbai, Bangalore, Delhi, Gurgaon..."
              />
            </div>
            <div className="mt-4">
              <Label>Pan-India Categories (comma-separated)</Label>
              <Input
                value={(settings.pan_india_categories || []).join(', ')}
                onChange={(e) => setSettings({...settings, pan_india_categories: e.target.value.split(',').map(c => c.trim()).filter(Boolean)})}
                placeholder="treats, nut-butters..."
              />
            </div>
          </Card>

          {/* REWARDS SETTINGS */}
          <Card className="p-6 border-2 border-amber-200 bg-amber-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              Paw Rewards Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label>Enable Paw Rewards</Label>
                <Switch
                  checked={settings.rewards_enabled ?? true}
                  onCheckedChange={(val) => setSettings({...settings, rewards_enabled: val})}
                />
              </div>
              <div>
                <Label>Points per ₹100 spent</Label>
                <Input
                  type="number"
                  value={settings.points_per_100 || 10}
                  onChange={(e) => setSettings({...settings, points_per_100: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Points to ₹ conversion (e.g., 100 points = ₹10)</Label>
                <Input
                  type="number"
                  value={settings.points_to_rupee_ratio || 10}
                  onChange={(e) => setSettings({...settings, points_to_rupee_ratio: parseInt(e.target.value)})}
                  placeholder="100 points = ₹X"
                />
              </div>
              <div>
                <Label>Minimum points to redeem</Label>
                <Input
                  type="number"
                  value={settings.min_points_redeem || 100}
                  onChange={(e) => setSettings({...settings, min_points_redeem: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Birthday Bonus Points</Label>
                <Input
                  type="number"
                  value={settings.birthday_bonus_points || 500}
                  onChange={(e) => setSettings({...settings, birthday_bonus_points: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Birthday Discount (%)</Label>
                <Input
                  type="number"
                  value={settings.birthday_discount_percent || 15}
                  onChange={(e) => setSettings({...settings, birthday_discount_percent: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Label>Enable Referral Rewards</Label>
                <Switch
                  checked={settings.referral_enabled ?? true}
                  onCheckedChange={(val) => setSettings({...settings, referral_enabled: val})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Referrer Bonus Points</Label>
                  <Input
                    type="number"
                    value={settings.referrer_bonus || 200}
                    onChange={(e) => setSettings({...settings, referrer_bonus: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Referee Bonus Points</Label>
                  <Input
                    type="number"
                    value={settings.referee_bonus || 100}
                    onChange={(e) => setSettings({...settings, referee_bonus: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Button onClick={saveSettings} className="bg-pink-600 hover:bg-pink-700">
            Save Settings
          </Button>
        </TabsContent>
      </Tabs>

      {/* PRODUCT MODAL */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
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
              <div>
                <Label>Paw Points</Label>
                <Input
                  type="number"
                  value={productForm.paw_reward_points}
                  onChange={(e) => setProductForm({...productForm, paw_reward_points: e.target.value})}
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
                <Label>Sizes (format: name:price, comma-separated)</Label>
                <Input
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({...productForm, sizes: e.target.value})}
                  placeholder="500g:599, 1kg:1099"
                />
              </div>
              <div>
                <Label>Flavours (comma-separated)</Label>
                <Input
                  value={productForm.flavors}
                  onChange={(e) => setProductForm({...productForm, flavors: e.target.value})}
                  placeholder="Chicken & Oats, Peanut Butter"
                />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={productForm.tags}
                onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                placeholder="bestseller, birthday, breed-special"
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.in_stock}
                  onCheckedChange={(val) => setProductForm({...productForm, in_stock: val})}
                />
                <Label>In Stock</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.is_bestseller}
                  onCheckedChange={(val) => setProductForm({...productForm, is_bestseller: val})}
                />
                <Label>Bestseller</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.is_new}
                  onCheckedChange={(val) => setProductForm({...productForm, is_new: val})}
                />
                <Label>New</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.pan_india}
                  onCheckedChange={(val) => setProductForm({...productForm, pan_india: val})}
                />
                <Label>Pan India</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button onClick={saveProduct} className="bg-pink-600 hover:bg-pink-700">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BUNDLE MODAL */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Add Bundle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={bundleForm.name}
                onChange={(e) => setBundleForm({...bundleForm, name: e.target.value})}
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
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={bundleForm.price}
                  onChange={(e) => setBundleForm({...bundleForm, price: e.target.value})}
                />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input
                  type="number"
                  value={bundleForm.original_price}
                  onChange={(e) => setBundleForm({...bundleForm, original_price: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={bundleForm.image}
                onChange={(e) => setBundleForm({...bundleForm, image: e.target.value})}
              />
            </div>
            <div>
              <Label>Items (comma-separated)</Label>
              <Textarea
                value={bundleForm.items}
                onChange={(e) => setBundleForm({...bundleForm, items: e.target.value})}
                placeholder="1 Birthday Cake (500g), 6 Pupcakes, Party Hat..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Occasion</Label>
                <Input
                  value={bundleForm.occasion}
                  onChange={(e) => setBundleForm({...bundleForm, occasion: e.target.value})}
                  placeholder="birthday, gotcha-day, pawty"
                />
              </div>
              <div>
                <Label>Paw Points</Label>
                <Input
                  type="number"
                  value={bundleForm.paw_reward_points}
                  onChange={(e) => setBundleForm({...bundleForm, paw_reward_points: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={bundleForm.is_recommended}
                onCheckedChange={(val) => setBundleForm({...bundleForm, is_recommended: val})}
              />
              <Label>Recommended</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBundleModal(false)}>Cancel</Button>
            <Button onClick={saveBundle} className="bg-pink-600 hover:bg-pink-700">Save Bundle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PARTNER MODAL */}
      <Dialog open={showPartnerModal} onOpenChange={setShowPartnerModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={partnerForm.type} onValueChange={(val) => setPartnerForm({...partnerForm, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="delivery">Delivery Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={partnerForm.description}
                onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})}
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={partnerForm.logo}
                onChange={(e) => setPartnerForm({...partnerForm, logo: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  value={partnerForm.contact_email}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={partnerForm.contact_phone}
                  onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={partnerForm.website}
                  onChange={(e) => setPartnerForm({...partnerForm, website: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Cities (comma-separated)</Label>
              <Input
                value={partnerForm.cities}
                onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})}
                placeholder="Mumbai, Thane, Navi Mumbai"
              />
            </div>
            <div>
              <Label>Specializations (comma-separated)</Label>
              <Input
                value={partnerForm.specializations}
                onChange={(e) => setPartnerForm({...partnerForm, specializations: e.target.value})}
                placeholder="Birthday Cakes, Breed Cakes, Custom Designs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Commission %</Label>
                <Input
                  type="number"
                  value={partnerForm.commission_percent}
                  onChange={(e) => setPartnerForm({...partnerForm, commission_percent: e.target.value})}
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={partnerForm.rating}
                  onChange={(e) => setPartnerForm({...partnerForm, rating: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={partnerForm.is_verified}
                  onCheckedChange={(val) => setPartnerForm({...partnerForm, is_verified: val})}
                />
                <Label>Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={partnerForm.is_active}
                  onCheckedChange={(val) => setPartnerForm({...partnerForm, is_active: val})}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerModal(false)}>Cancel</Button>
            <Button onClick={savePartner} className="bg-pink-600 hover:bg-pink-700">Save Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CelebrateManager;
