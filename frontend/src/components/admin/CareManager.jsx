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
import PillarServicesTab from './PillarServicesTab';
import PillarBundlesTab from './PillarBundlesTab';
import PillarProductsTab from './PillarProductsTab';
import {
  Scissors, PawPrint, GraduationCap, Stethoscope, AlertTriangle, Heart,
  ClipboardList, Bell, Building2, Package, Gift, Settings, Search,
  Plus, Edit2, Trash2, RefreshCw, Upload, Download, ChevronRight,
  Clock, CheckCircle, XCircle, User, Phone, Mail, MapPin, Star,
  Calendar, Filter, Eye, Sparkles, Database, Briefcase
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
  const [quickWinTips, setQuickWinTips] = useState([]);
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
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingTip, setEditingTip] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form states - COMPREHENSIVE CARE V3
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '', image: '',
    subcategory: 'grooming_essentials', product_type: 'individual',
    good_for_tags: '', intent_tags: '', concierge_note: '', cta_label: 'Ask Mira to Include',
    care_type: 'grooming', tags: '', pet_sizes: '', status: 'active',
    in_stock: true, paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: '',
    partner_vendor: '', availability_cities: ''
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', what_it_helps_with: '', price: '', original_price: '', image: '',
    bundle_type: 'routine_care', included_items: '', optional_addons: '',
    good_for_tags: '', intent_tags: '', concierge_flow_mapping: '',
    care_type: 'grooming', items: '', status: 'active', display_priority: 99,
    is_recommended: true, paw_reward_points: 0, guardrail_note: ''
  });
  
  const [partnerForm, setPartnerForm] = useState({
    name: '', type: 'groomer', description: '', logo: '',
    contact_name: '', contact_email: '', contact_phone: '', website: '',
    cities: '', services: '', specializations: '',
    commission_percent: 0, rating: 5, is_verified: false, is_active: true,
    home_service: false, salon_service: false
  });
  
  const [tipForm, setTipForm] = useState({
    tip: '', action: '', emoji: '💡', category: 'general',
    action_type: '', action_url: ''
  });
  
  const fileInputRef = useRef(null);
  
  // Tag options for dropdowns
  const SIZE_TAG_OPTIONS = ['xs', 'small', 'medium', 'large', 'xl'];
  const COAT_TAG_OPTIONS = ['short_coat', 'long_coat', 'double_coat', 'curly_coat', 'low_shed', 'high_shed'];
  const LIFE_STAGE_TAG_OPTIONS = ['puppy', 'adult', 'senior'];
  const TEMPERAMENT_TAG_OPTIONS = ['calm', 'anxious', 'reactive', 'grooming_nervous', 'vet_nervous', 'first_time_boarding'];
  const INTENT_TAG_OPTIONS = ['grooming', 'vet_clinic_booking', 'boarding_daycare', 'pet_sitting', 'behavior_anxiety_support', 'senior_special_needs_support', 'nutrition_consult_booking', 'emergency_help', 'recovery_support_coordination'];
  const SUBCATEGORY_OPTIONS = ['grooming_essentials', 'hygiene_cleaning', 'paw_coat_care', 'dental_care', 'preventive_support', 'recovery_support', 'senior_comfort', 'clinic_visit_prep', 'calm_handling_support'];
  const BUNDLE_TYPE_OPTIONS = ['starter_setup', 'routine_care', 'visit_prep', 'recovery_setup', 'senior_support', 'anxiety_support', 'seasonal_care'];
  
  // Reset tip form
  const resetTipForm = () => {
    setTipForm({ tip: '', action: '', emoji: '💡', category: 'general', action_type: '', action_url: '' });
    setEditingTip(null);
  };
  
  // Fetch tips
  const fetchTips = async () => {
    try {
      const response = await fetch(`${API_URL}/api/engagement/tips?pillar=care`, {
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
  
  // Save tip
  const saveTip = async () => {
    try {
      const tipData = { ...tipForm, pillar: 'care', is_active: true };
      
      if (editingTip) {
        await fetch(`${API_URL}/api/engagement/tips/${editingTip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(tipData)
        });
        toast({ title: 'Tip updated' });
      } else {
        await fetch(`${API_URL}/api/engagement/tips`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(tipData)
        });
        toast({ title: 'Tip created' });
      }
      
      setShowTipModal(false);
      resetTipForm();
      fetchTips();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save tip', variant: 'destructive' });
    }
  };

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
    fetchTips();
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

  // Seed comprehensive care products (v3 - with size/coat/life_stage/temperament/intent tags)
  const seedComprehensiveCare = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/care/admin/seed-comprehensive-care`, {}, getAuthHeader());
      toast({ 
        title: '✅ Comprehensive Care Seeded', 
        description: `Seeded ${response.data.products_seeded} products and ${response.data.bundles_seeded} bundles with full taxonomy` 
      });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed comprehensive care', variant: 'destructive' });
    }
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '', image: '',
      subcategory: 'grooming_essentials', product_type: 'individual',
      good_for_tags: '', intent_tags: '', concierge_note: '', cta_label: 'Ask Mira to Include',
      care_type: 'grooming', tags: '', pet_sizes: '', status: 'active',
      in_stock: true, paw_reward_points: 0, is_birthday_perk: false, birthday_discount_percent: '',
      partner_vendor: '', availability_cities: ''
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
        pet_sizes: productForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean),
        good_for_tags: productForm.good_for_tags.split(',').map(t => t.trim()).filter(Boolean),
        intent_tags: productForm.intent_tags.split(',').map(t => t.trim()).filter(Boolean),
        availability_cities: productForm.availability_cities.split(',').map(c => c.trim()).filter(Boolean)
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
      name: '', description: '', what_it_helps_with: '', price: '', original_price: '', image: '',
      bundle_type: 'routine_care', included_items: '', optional_addons: '',
      good_for_tags: '', intent_tags: '', concierge_flow_mapping: '',
      care_type: 'grooming', items: '', status: 'active', display_priority: 99,
      is_recommended: true, paw_reward_points: 0, guardrail_note: ''
    });
  };

  const saveBundle = async () => {
    try {
      const payload = {
        ...bundleForm,
        price: parseFloat(bundleForm.price) || 0,
        original_price: bundleForm.original_price ? parseFloat(bundleForm.original_price) : null,
        paw_reward_points: parseInt(bundleForm.paw_reward_points) || 0,
        display_priority: parseInt(bundleForm.display_priority) || 99,
        items: bundleForm.items.split(',').map(i => i.trim()).filter(Boolean),
        included_items: bundleForm.included_items.split(',').map(i => i.trim()).filter(Boolean),
        optional_addons: bundleForm.optional_addons.split(',').map(i => i.trim()).filter(Boolean),
        good_for_tags: bundleForm.good_for_tags.split(',').map(t => t.trim()).filter(Boolean),
        intent_tags: bundleForm.intent_tags.split(',').map(t => t.trim()).filter(Boolean)
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-pink-600" />
            Care Manager
          </h2>
          <p className="text-gray-500">Manage care requests, partners, products & bundles</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={seedComprehensiveCare} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" size="sm">
            <Sparkles className="w-4 h-4 mr-2" /> Seed Care Products
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
        <TabsList className="bg-white border flex-wrap">
          <TabsTrigger value="requests" data-testid="care-tab-requests">
            <Bell className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="care-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="care-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="care-tab-services">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="care-tab-bundles">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid="care-tab-tips">
            <Sparkles className="w-4 h-4 mr-2" /> Tips
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
          <PillarProductsTab pillar="care" pillarName="Care" />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <PillarServicesTab 
            pillar="care"
            pillarName="Care"
            pillarIcon="💊"
            pillarColor="bg-green-500"
          />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles">
          <PillarBundlesTab pillar="care" pillarName="Care" accentColor="pink" />
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-semibold">Care Tips ({quickWinTips.length})</h3>
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
                    toast({ title: 'Tips Seeded', description: `${data.total_new} new tips added. Care: ${data.pillar_counts?.care || 0}` });
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
                  const csvTemplate = "tip,action,emoji,category,action_type,action_url\n" +
                    "\"Regular grooming prevents skin issues\",\"Book grooming\",\"✨\",\"general\",\"navigate\",\"/care?type=grooming\"\n" +
                    "\"Dental chews reduce tartar by 70%\",\"Shop dental\",\"🦷\",\"general\",\"navigate\",\"/shop?category=dental\"";
                  const blob = new Blob([csvTemplate], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'care_tips_template.csv';
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
                          <Badge className="text-xs bg-teal-100 text-teal-700">{tip.action_type}</Badge>
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
              <p className="text-sm text-gray-500 mb-4">Click &quot;Seed Tips&quot; to auto-populate with curated care tips</p>
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
                <Database className="w-4 h-4 mr-2" /> Seed Care Tips
              </Button>
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

      {/* Product Modal - Comprehensive v3 */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Care Product' : 'Add Care Product'}</DialogTitle>
            <p className="text-sm text-gray-500">Products are building blocks - individual items only</p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} placeholder="Gentle Grooming Brush Kit" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} placeholder="Soft bristle brush set for sensitive coats..." rows={2} />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input type="number" value={productForm.compare_price} onChange={(e) => setProductForm({...productForm, compare_price: e.target.value})} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={productForm.status} onValueChange={(val) => setProductForm({...productForm, status: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subcategory *</Label>
                <Select value={productForm.subcategory} onValueChange={(val) => setProductForm({...productForm, subcategory: val})}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {SUBCATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={productForm.image} onChange={(e) => setProductForm({...productForm, image: e.target.value})} placeholder="https://..." />
              </div>
            </div>

            {/* GOOD FOR TAGS - Primary filtering */}
            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
              <Label className="text-purple-700 font-semibold">Good For Tags (Pet Matching)</Label>
              <p className="text-xs text-purple-600">Comma-separated: size, coat, life stage, temperament</p>
              <Input 
                value={productForm.good_for_tags} 
                onChange={(e) => setProductForm({...productForm, good_for_tags: e.target.value})} 
                placeholder="small, medium, long_coat, anxious, grooming_nervous"
              />
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="text-purple-500">Size:</span>
                {SIZE_TAG_OPTIONS.map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setProductForm({...productForm, good_for_tags: productForm.good_for_tags ? `${productForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
                <span className="text-purple-500 ml-2">Coat:</span>
                {COAT_TAG_OPTIONS.slice(0,4).map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setProductForm({...productForm, good_for_tags: productForm.good_for_tags ? `${productForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="text-purple-500">Life:</span>
                {LIFE_STAGE_TAG_OPTIONS.map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setProductForm({...productForm, good_for_tags: productForm.good_for_tags ? `${productForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
                <span className="text-purple-500 ml-2">Temp:</span>
                {TEMPERAMENT_TAG_OPTIONS.slice(0,4).map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setProductForm({...productForm, good_for_tags: productForm.good_for_tags ? `${productForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
              </div>
            </div>

            {/* INTENT TAGS - Use case mapping */}
            <div className="p-3 bg-teal-50 rounded-lg space-y-3">
              <Label className="text-teal-700 font-semibold">Intent Tags (Use Case)</Label>
              <p className="text-xs text-teal-600">What care intents this product supports</p>
              <Input 
                value={productForm.intent_tags} 
                onChange={(e) => setProductForm({...productForm, intent_tags: e.target.value})} 
                placeholder="grooming, pet_sitting, behavior_anxiety_support"
              />
              <div className="flex flex-wrap gap-1">
                {INTENT_TAG_OPTIONS.map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setProductForm({...productForm, intent_tags: productForm.intent_tags ? `${productForm.intent_tags}, ${t}` : t})}>{t.replace(/_/g, ' ')}</Badge>)}
              </div>
            </div>

            {/* Concierge */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Concierge Note</Label>
                <Input value={productForm.concierge_note} onChange={(e) => setProductForm({...productForm, concierge_note: e.target.value})} placeholder="Supports comfortable grooming prep" />
              </div>
              <div>
                <Label>CTA Label</Label>
                <Input value={productForm.cta_label} onChange={(e) => setProductForm({...productForm, cta_label: e.target.value})} placeholder="Ask Mira to Include" />
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Paw Points</Label>
                <Input type="number" value={productForm.paw_reward_points} onChange={(e) => setProductForm({...productForm, paw_reward_points: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <Label>Birthday Discount %</Label>
                <Input type="number" value={productForm.birthday_discount_percent} onChange={(e) => setProductForm({...productForm, birthday_discount_percent: e.target.value})} />
              </div>
              <div>
                <Label>Partner/Vendor</Label>
                <Input value={productForm.partner_vendor} onChange={(e) => setProductForm({...productForm, partner_vendor: e.target.value})} />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2">
                <Switch checked={productForm.in_stock} onCheckedChange={(val) => setProductForm({...productForm, in_stock: val})} />
                <span className="text-sm">In Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={productForm.is_birthday_perk} onCheckedChange={(val) => setProductForm({...productForm, is_birthday_perk: val})} />
                <span className="text-sm">Birthday Perk</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button onClick={saveProduct} className="bg-gradient-to-r from-purple-600 to-pink-600">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bundle Modal - Comprehensive v3 */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Care Bundle' : 'Add Care Bundle'}</DialogTitle>
            <p className="text-sm text-gray-500">Bundles are curated outcomes - use-case solutions</p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <Label>Bundle Name *</Label>
              <Input value={bundleForm.name} onChange={(e) => setBundleForm({...bundleForm, name: e.target.value})} placeholder="Small Breed Grooming Comfort Bundle" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={bundleForm.description} onChange={(e) => setBundleForm({...bundleForm, description: e.target.value})} rows={2} />
            </div>
            <div>
              <Label>What it helps with (1-line outcome)</Label>
              <Input value={bundleForm.what_it_helps_with} onChange={(e) => setBundleForm({...bundleForm, what_it_helps_with: e.target.value})} placeholder="Regular grooming prep for small breeds, salon prep, at-home maintenance" />
            </div>

            {/* Pricing & Type */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input type="number" value={bundleForm.price} onChange={(e) => setBundleForm({...bundleForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input type="number" value={bundleForm.original_price} onChange={(e) => setBundleForm({...bundleForm, original_price: e.target.value})} />
              </div>
              <div>
                <Label>Bundle Type *</Label>
                <Select value={bundleForm.bundle_type} onValueChange={(val) => setBundleForm({...bundleForm, bundle_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUNDLE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linked Products */}
            <div className="p-3 bg-blue-50 rounded-lg space-y-3">
              <Label className="text-blue-700 font-semibold">Included Items (Product IDs)</Label>
              <Input 
                value={bundleForm.included_items} 
                onChange={(e) => setBundleForm({...bundleForm, included_items: e.target.value})} 
                placeholder="gentle-grooming-brush-kit, ear-face-cleaning-kit, paw-care-protection-kit"
              />
              <Label className="text-blue-700 font-semibold">Optional Add-ons (Product IDs)</Label>
              <Input 
                value={bundleForm.optional_addons} 
                onChange={(e) => setBundleForm({...bundleForm, optional_addons: e.target.value})} 
                placeholder="calming-wrap-set, clinic-visit-calm-kit"
              />
            </div>

            {/* GOOD FOR TAGS */}
            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
              <Label className="text-purple-700 font-semibold">Good For Tags (Pet Matching)</Label>
              <Input 
                value={bundleForm.good_for_tags} 
                onChange={(e) => setBundleForm({...bundleForm, good_for_tags: e.target.value})} 
                placeholder="small, xs, long_coat, grooming_nervous, anxious"
              />
              <div className="flex flex-wrap gap-1 text-xs">
                {SIZE_TAG_OPTIONS.map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setBundleForm({...bundleForm, good_for_tags: bundleForm.good_for_tags ? `${bundleForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
                {TEMPERAMENT_TAG_OPTIONS.slice(0,3).map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setBundleForm({...bundleForm, good_for_tags: bundleForm.good_for_tags ? `${bundleForm.good_for_tags}, ${t}` : t})}>{t}</Badge>)}
              </div>
            </div>

            {/* INTENT TAGS */}
            <div className="p-3 bg-teal-50 rounded-lg space-y-3">
              <Label className="text-teal-700 font-semibold">Intent Tags</Label>
              <Input 
                value={bundleForm.intent_tags} 
                onChange={(e) => setBundleForm({...bundleForm, intent_tags: e.target.value})} 
                placeholder="grooming, behavior_anxiety_support, pet_sitting"
              />
              <div className="flex flex-wrap gap-1">
                {INTENT_TAG_OPTIONS.slice(0,5).map(t => <Badge key={t} variant="outline" className="cursor-pointer text-xs" onClick={() => setBundleForm({...bundleForm, intent_tags: bundleForm.intent_tags ? `${bundleForm.intent_tags}, ${t}` : t})}>{t.replace(/_/g, ' ')}</Badge>)}
              </div>
            </div>

            {/* Concierge Flow */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Concierge Flow Mapping</Label>
                <Input value={bundleForm.concierge_flow_mapping} onChange={(e) => setBundleForm({...bundleForm, concierge_flow_mapping: e.target.value})} placeholder="grooming_request" />
              </div>
              <div>
                <Label>Display Priority (lower = higher)</Label>
                <Input type="number" value={bundleForm.display_priority} onChange={(e) => setBundleForm({...bundleForm, display_priority: parseInt(e.target.value) || 99})} />
              </div>
            </div>

            {/* Image & Rewards */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Image URL</Label>
                <Input value={bundleForm.image} onChange={(e) => setBundleForm({...bundleForm, image: e.target.value})} />
              </div>
              <div>
                <Label>Paw Points</Label>
                <Input type="number" value={bundleForm.paw_reward_points} onChange={(e) => setBundleForm({...bundleForm, paw_reward_points: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            {/* Guardrail */}
            <div>
              <Label>Guardrail Note (optional)</Label>
              <Input value={bundleForm.guardrail_note} onChange={(e) => setBundleForm({...bundleForm, guardrail_note: e.target.value})} placeholder="Supports comfort only. Clinical guidance remains with vet." />
            </div>

            <label className="flex items-center gap-2">
              <Switch checked={bundleForm.is_recommended} onCheckedChange={(val) => setBundleForm({...bundleForm, is_recommended: val})} />
              <span className="text-sm">Recommended</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBundleModal(false)}>Cancel</Button>
            <Button onClick={saveBundle} className="bg-gradient-to-r from-purple-600 to-pink-600">Save Bundle</Button>
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
      
      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTip ? 'Edit Care Tip' : 'Add Care Tip'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tip Text</Label>
              <Textarea 
                value={tipForm.tip}
                onChange={(e) => setTipForm({ ...tipForm, tip: e.target.value })}
                placeholder="Enter the tip content..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action Button Text</Label>
                <Input 
                  value={tipForm.action}
                  onChange={(e) => setTipForm({ ...tipForm, action: e.target.value })}
                  placeholder="e.g., Book grooming"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input 
                  value={tipForm.emoji}
                  onChange={(e) => setTipForm({ ...tipForm, emoji: e.target.value })}
                  placeholder="e.g., ✨"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action Type</Label>
                <Select 
                  value={tipForm.action_type || 'none'} 
                  onValueChange={(v) => setTipForm({ ...tipForm, action_type: v === 'none' ? '' : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="navigate">Navigate</SelectItem>
                    <SelectItem value="checklist">Show Checklist</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action URL</Label>
                <Input 
                  value={tipForm.action_url}
                  onChange={(e) => setTipForm({ ...tipForm, action_url: e.target.value })}
                  placeholder="e.g., /care?type=grooming"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTipModal(false); resetTipForm(); }}>Cancel</Button>
            <Button onClick={saveTip}>{editingTip ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareManager;
