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
import axios from 'axios';
import {
  Dumbbell, Activity, Scale, TrendingUp, Users, Package, Building2,
  Settings, Search, Plus, Edit2, Trash2, RefreshCw, Eye, Clock,
  CheckCircle, XCircle, Star, Download, Upload, Database, Award
} from 'lucide-react';

const FIT_TYPE_ICONS = {
  assessment: Activity,
  exercise_plan: Dumbbell,
  weight_management: Scale,
  nutrition: TrendingUp,
  agility: Award,
  senior_fitness: Activity
};

const FitManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
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
  
  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [editingTip, setEditingTip] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Forms
  const [planForm, setPlanForm] = useState({
    name: '', description: '', plan_type: 'exercise', duration_weeks: '8',
    sessions_per_week: '3', price: '', member_price: '', pet_sizes: 'small, medium, large',
    pet_ages: 'puppy, adult, senior', activities: '', goals: '', image: '',
    paw_reward_points: '0', is_featured: false
  });
  
  const [partnerForm, setPartnerForm] = useState({
    name: '', partner_type: 'fitness_center', description: '',
    services: '', contact_name: '', contact_email: '', contact_phone: '',
    address: '', cities: '', commission_percent: '15',
    is_verified: false, is_active: true
  });
  
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    image: '', fit_type: 'equipment', tags: '', pet_sizes: 'small, medium, large',
    in_stock: true, paw_reward_points: '0',
    is_birthday_perk: false, birthday_discount_percent: ''
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', items: '', price: '', original_price: '',
    paw_reward_points: '0', is_recommended: false,
    is_birthday_perk: false, birthday_discount_percent: ''
  });

  // Engagement forms
  const [storyForm, setStoryForm] = useState({
    pet_name: '', breed: '', owner_name: '', before_image: '', after_image: '',
    achievement: '', testimonial: '', program: '', rating: '5', is_active: true
  });
  
  const [tipForm, setTipForm] = useState({
    tip: '', action: '', emoji: '💡', category: 'general', is_active: true
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [reqRes, planRes, partnerRes, productRes, bundleRes, statsRes, settingsRes, storiesRes, tipsRes] = await Promise.all([
        axios.get(`${API_URL}/api/fit/requests`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/plans`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/admin/partners`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/products`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/bundles`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/stats`, getAuthHeader()),
        axios.get(`${API_URL}/api/fit/admin/settings`, getAuthHeader()),
        axios.get(`${API_URL}/api/engagement/transformations?pillar=fit`, getAuthHeader()).catch(() => ({ data: { stories: [] } })),
        axios.get(`${API_URL}/api/engagement/tips?pillar=fit`, getAuthHeader()).catch(() => ({ data: { tips: [] } }))
      ]);
      
      setRequests(reqRes.data.requests || []);
      setPlans(planRes.data.plans || []);
      setPartners(partnerRes.data.partners || []);
      setProducts(productRes.data.products || []);
      setBundles(bundleRes.data.bundles || []);
      setStats(statsRes.data || {});
      setSettings(settingsRes.data || {});
      setTransformationStories(storiesRes.data.stories || []);
      setQuickWinTips(tipsRes.data.tips || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load fitness data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/fit/admin/seed`, {}, getAuthHeader());
      toast({ 
        title: 'Success', 
        description: `Seeded ${response.data.plans_seeded} plans, ${response.data.products_seeded} products, ${response.data.bundles_seeded} bundles, ${response.data.partners_seeded} partners` 
      });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  // Request Actions
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/fit/requests/${requestId}`, { status: newStatus }, getAuthHeader());
      toast({ title: 'Success', description: 'Request status updated' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Plan CRUD
  const resetPlanForm = () => {
    setPlanForm({
      name: '', description: '', plan_type: 'exercise', duration_weeks: '8',
      sessions_per_week: '3', price: '', member_price: '', pet_sizes: 'small, medium, large',
      pet_ages: 'puppy, adult, senior', activities: '', goals: '', image: '',
      paw_reward_points: '0', is_featured: false
    });
  };

  const savePlan = async () => {
    try {
      const payload = {
        ...planForm,
        duration_weeks: parseInt(planForm.duration_weeks) || 8,
        sessions_per_week: parseInt(planForm.sessions_per_week) || 3,
        price: parseFloat(planForm.price) || 0,
        member_price: parseFloat(planForm.member_price) || null,
        paw_reward_points: parseInt(planForm.paw_reward_points) || 0,
        pet_sizes: planForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean),
        pet_ages: planForm.pet_ages.split(',').map(s => s.trim()).filter(Boolean),
        activities: planForm.activities.split(',').map(s => s.trim()).filter(Boolean),
        goals: planForm.goals.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingPlan) {
        await axios.put(`${API_URL}/api/fit/admin/plans/${editingPlan.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Plan updated' });
      } else {
        await axios.post(`${API_URL}/api/fit/admin/plans`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Plan created' });
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' });
    }
  };

  const deletePlan = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await axios.delete(`${API_URL}/api/fit/admin/plans/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Plan deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
    }
  };

  // Partner CRUD
  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', partner_type: 'fitness_center', description: '',
      services: '', contact_name: '', contact_email: '', contact_phone: '',
      address: '', cities: '', commission_percent: '15',
      is_verified: false, is_active: true
    });
  };

  const savePartner = async () => {
    try {
      const payload = {
        ...partnerForm,
        services: partnerForm.services.split(',').map(s => s.trim()).filter(Boolean),
        cities: partnerForm.cities.split(',').map(s => s.trim()).filter(Boolean),
        commission_percent: parseFloat(partnerForm.commission_percent) || 0
      };
      
      if (editingPartner) {
        await axios.put(`${API_URL}/api/fit/admin/partners/${editingPartner.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/fit/admin/partners`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner created' });
      }
      setShowPartnerModal(false);
      setEditingPartner(null);
      resetPartnerForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save partner', variant: 'destructive' });
    }
  };

  const deletePartner = async (id) => {
    if (!confirm('Delete this partner?')) return;
    try {
      await axios.delete(`${API_URL}/api/fit/admin/partners/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '',
      image: '', fit_type: 'equipment', tags: '', pet_sizes: 'small, medium, large',
      in_stock: true, paw_reward_points: '0',
      is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const saveProduct = async () => {
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_price: parseFloat(productForm.compare_price) || null,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        birthday_discount_percent: productForm.is_birthday_perk ? (parseInt(productForm.birthday_discount_percent) || 0) : null,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        pet_sizes: productForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingProduct) {
        await axios.put(`${API_URL}/api/fit/admin/products/${editingProduct.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/fit/admin/products`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product created' });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/api/fit/admin/products/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Product deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  // Bundle CRUD
  const resetBundleForm = () => {
    setBundleForm({
      name: '', description: '', items: '', price: '', original_price: '',
      paw_reward_points: '0', is_recommended: false,
      is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const saveBundle = async () => {
    try {
      const payload = {
        ...bundleForm,
        price: parseFloat(bundleForm.price) || 0,
        original_price: parseFloat(bundleForm.original_price) || 0,
        paw_reward_points: parseInt(bundleForm.paw_reward_points) || 0,
        birthday_discount_percent: bundleForm.is_birthday_perk ? (parseInt(bundleForm.birthday_discount_percent) || 0) : null,
        items: bundleForm.items.split(',').map(i => i.trim()).filter(Boolean)
      };
      
      if (editingBundle) {
        await axios.put(`${API_URL}/api/fit/admin/bundles/${editingBundle.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        await axios.post(`${API_URL}/api/fit/admin/bundles`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle created' });
      }
      setShowBundleModal(false);
      setEditingBundle(null);
      resetBundleForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save bundle', variant: 'destructive' });
    }
  };

  const deleteBundle = async (id) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      await axios.delete(`${API_URL}/api/fit/admin/bundles/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Bundle deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  // CSV Export
  const exportProductsCSV = () => {
    const headers = ['Name', 'Description', 'Price', 'Compare Price', 'Type', 'In Stock', 'Paw Points'];
    const rows = products.map(p => [
      p.name, p.description, p.price, p.compare_price || '', p.fit_type, p.in_stock ? 'Yes' : 'No', p.paw_reward_points
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportRequestsCSV = () => {
    const headers = ['ID', 'Pet Name', 'Type', 'Status', 'User', 'Created At'];
    const rows = requests.map(r => [
      r.id, r.pet_name, r.fit_type, r.status, r.user_name, r.created_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filters
  const filteredRequests = requests.filter(req => {
    const q = searchQuery.toLowerCase();
    if (q) {
      const matchesSearch = req.pet_name?.toLowerCase().includes(q) ||
                           req.user_name?.toLowerCase().includes(q) ||
                           req.id?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (statusFilter && req.status !== statusFilter) return false;
    if (typeFilter && req.fit_type !== typeFilter) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-teal-600" />
            Fit Manager
          </h2>
          <p className="text-gray-500">Manage fitness plans, requests, partners & products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportRequestsCSV}>
            <Download className="w-4 h-4 mr-1" /> Export Requests
          </Button>
          <Button variant="outline" size="sm" onClick={exportProductsCSV}>
            <Download className="w-4 h-4 mr-1" /> Export Products
          </Button>
          <Button variant="outline" size="sm" onClick={seedData}>
            <Database className="w-4 h-4 mr-1" /> Seed Data
          </Button>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600">Total Requests</p>
              <p className="text-2xl font-bold">{stats.total_requests || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-teal-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Pending</p>
              <p className="text-2xl font-bold">{stats.pending_requests || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">In Progress</p>
              <p className="text-2xl font-bold">{stats.in_progress_requests || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">Completed</p>
              <p className="text-2xl font-bold">{stats.completed_requests || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Plans</p>
              <p className="text-2xl font-bold">{stats.total_plans || 0}</p>
            </div>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full max-w-3xl">
          <TabsTrigger value="requests" data-testid="fit-tab-requests">Requests</TabsTrigger>
          <TabsTrigger value="plans" data-testid="fit-tab-plans">Plans</TabsTrigger>
          <TabsTrigger value="partners" data-testid="fit-tab-partners">Partners</TabsTrigger>
          <TabsTrigger value="products" data-testid="fit-tab-products">Products</TabsTrigger>
          <TabsTrigger value="bundles" data-testid="fit-tab-bundles">Bundles</TabsTrigger>
          <TabsTrigger value="stories" data-testid="fit-tab-stories">Stories</TabsTrigger>
          <TabsTrigger value="tips" data-testid="fit-tab-tips">Tips</TabsTrigger>
          <TabsTrigger value="settings" data-testid="fit-tab-settings">Settings</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search requests..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter || 'all'} onValueChange={(val) => setTypeFilter(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="exercise_plan">Exercise Plan</SelectItem>
                  <SelectItem value="weight_management">Weight Management</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="agility">Agility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
          
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No fitness requests yet</p>
              </Card>
            ) : (
              filteredRequests.map((req) => {
                const TypeIcon = FIT_TYPE_ICONS[req.fit_type] || Activity;
                return (
                  <Card key={req.id} className="p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{req.id}</span>
                            <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                            <Badge variant="outline">{req.fit_type?.replace('_', ' ')}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>{req.pet_name}</strong> ({req.pet_breed}) • {req.user_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Goals: {req.fitness_goals?.join(', ') || 'Not specified'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={req.status} onValueChange={(val) => updateRequestStatus(req.id, val)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(req)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fitness Plans ({plans.length})</h3>
              <Button size="sm" onClick={() => { resetPlanForm(); setEditingPlan(null); setShowPlanModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Plan
              </Button>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      {plan.is_featured && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{plan.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{plan.plan_type}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingPlan(plan);
                      setPlanForm({
                        name: plan.name || '',
                        description: plan.description || '',
                        plan_type: plan.plan_type || 'exercise',
                        duration_weeks: plan.duration_weeks?.toString() || '8',
                        sessions_per_week: plan.sessions_per_week?.toString() || '3',
                        price: plan.price?.toString() || '',
                        member_price: plan.member_price?.toString() || '',
                        pet_sizes: (plan.pet_sizes || []).join(', '),
                        pet_ages: (plan.pet_ages || []).join(', '),
                        activities: (plan.activities || []).join(', '),
                        goals: (plan.goals || []).join(', '),
                        image: plan.image || '',
                        paw_reward_points: plan.paw_reward_points?.toString() || '0',
                        is_featured: plan.is_featured || false
                      });
                      setShowPlanModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div>
                    <span className="font-bold text-teal-600">₹{plan.price}</span>
                    <span className="text-xs text-gray-400 ml-1">/ {plan.duration_weeks} weeks</span>
                  </div>
                  <Badge variant="outline" className="text-xs">🐾 {plan.paw_reward_points || 0} pts</Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fitness Partners ({partners.length})</h3>
              <Button size="sm" onClick={() => { resetPartnerForm(); setEditingPartner(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Partner
              </Button>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{partner.name}</h4>
                      {partner.is_verified && <CheckCircle className="w-4 h-4 text-teal-600" />}
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">{partner.partner_type?.replace('_', ' ')}</Badge>
                    <p className="text-sm text-gray-500 mt-2">{partner.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Cities: {(partner.cities || []).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingPartner(partner);
                      setPartnerForm({
                        name: partner.name || '',
                        partner_type: partner.partner_type || 'fitness_center',
                        description: partner.description || '',
                        services: (partner.services || []).join(', '),
                        contact_name: partner.contact_name || '',
                        contact_email: partner.contact_email || '',
                        contact_phone: partner.contact_phone || '',
                        address: partner.address || '',
                        cities: (partner.cities || []).join(', '),
                        commission_percent: partner.commission_percent?.toString() || '15',
                        is_verified: partner.is_verified || false,
                        is_active: partner.is_active !== false
                      });
                      setShowPartnerModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deletePartner(partner.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fitness Products ({products.length})</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportProductsCSV}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                <Button size="sm" onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{product.fit_type || 'general'}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingProduct(product);
                      setProductForm({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price?.toString() || '',
                        compare_price: product.compare_price?.toString() || '',
                        image: product.image || '',
                        fit_type: product.fit_type || 'equipment',
                        tags: (product.tags || []).join(', '),
                        pet_sizes: (product.pet_sizes || ['small', 'medium', 'large']).join(', '),
                        in_stock: product.in_stock !== false,
                        paw_reward_points: product.paw_reward_points?.toString() || '0',
                        is_birthday_perk: product.is_birthday_perk || false,
                        birthday_discount_percent: product.birthday_discount_percent?.toString() || ''
                      });
                      setShowProductModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div>
                    <span className="font-bold text-teal-600">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="text-sm text-gray-400 line-through ml-2">₹{product.compare_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.paw_reward_points > 0 && (
                      <Badge variant="outline" className="text-xs">🐾 {product.paw_reward_points}</Badge>
                    )}
                    {product.is_birthday_perk && (
                      <Badge className="text-xs bg-pink-100 text-pink-700">🎂</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fitness Bundles ({bundles.length})</h3>
              <Button size="sm" onClick={() => { resetBundleForm(); setEditingBundle(null); setShowBundleModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Bundle
              </Button>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="p-4 border-2 border-teal-200 bg-teal-50/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{bundle.name}</h4>
                      {bundle.is_recommended && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                    </div>
                    <p className="text-sm text-gray-500">{bundle.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingBundle(bundle);
                      setBundleForm({
                        name: bundle.name || '',
                        description: bundle.description || '',
                        items: (bundle.items || []).join(', '),
                        price: bundle.price?.toString() || '',
                        original_price: bundle.original_price?.toString() || '',
                        paw_reward_points: bundle.paw_reward_points?.toString() || '0',
                        is_recommended: bundle.is_recommended || false,
                        is_birthday_perk: bundle.is_birthday_perk || false,
                        birthday_discount_percent: bundle.birthday_discount_percent?.toString() || ''
                      });
                      setShowBundleModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteBundle(bundle.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xl font-bold text-teal-600">₹{bundle.price}</span>
                  <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                  <Badge variant="outline" className="text-teal-600">
                    Save ₹{bundle.original_price - bundle.price}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transformation Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transformation Stories</h3>
              <Button onClick={() => { setEditingStory(null); setStoryForm({ pet_name: '', breed: '', owner_name: '', before_image: '', after_image: '', achievement: '', testimonial: '', program: '', rating: '5', is_active: true }); setShowStoryModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Story
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Before/After pet transformations shown on the Fit page carousel</p>
            
            {transformationStories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No transformation stories yet</p>
                <Button variant="outline" className="mt-2" onClick={() => axios.post(`${API_URL}/api/engagement/seed-engagement-data`, {}, getAuthHeader()).then(fetchAllData)}>
                  <Database className="w-4 h-4 mr-1" /> Seed Default Stories
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformationStories.map((story, idx) => (
                  <Card key={story.id || idx} className="p-4 border">
                    <div className="flex gap-4">
                      <div className="flex gap-2">
                        <img src={story.before_image} alt="Before" className="w-16 h-16 rounded object-cover grayscale" />
                        <img src={story.after_image} alt="After" className="w-16 h-16 rounded object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{story.pet_name}</h4>
                            <p className="text-xs text-gray-500">{story.breed} • {story.owner_name}</p>
                          </div>
                          <Badge className={story.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {story.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-teal-600 font-medium mt-1">{story.achievement}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{story.testimonial}</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingStory(story); setStoryForm({ ...story, rating: String(story.rating) }); setShowStoryModal(true); }}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => { if (confirm('Delete this story?')) axios.delete(`${API_URL}/api/engagement/transformations/${story.id}`, getAuthHeader()).then(fetchAllData); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Quick Win Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Win Tips</h3>
              <Button onClick={() => { setEditingTip(null); setTipForm({ tip: '', action: '', emoji: '💡', category: 'general', is_active: true }); setShowTipModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Tip
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Personalized tips shown to members on the Fit page</p>
            
            {quickWinTips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tips yet</p>
                <Button variant="outline" className="mt-2" onClick={() => axios.post(`${API_URL}/api/engagement/seed-engagement-data`, {}, getAuthHeader()).then(fetchAllData)}>
                  <Database className="w-4 h-4 mr-1" /> Seed Default Tips
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {quickWinTips.map((tip, idx) => (
                  <Card key={tip.id || idx} className="p-3 border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tip.emoji}</span>
                      <div>
                        <p className="font-medium">{tip.tip}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{tip.category}</Badge>
                          <span className="text-xs text-gray-500">Action: {tip.action}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={tip.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {tip.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => { setEditingTip(tip); setTipForm({ ...tip }); setShowTipModal(true); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => { if (confirm('Delete this tip?')) axios.delete(`${API_URL}/api/engagement/tips/${tip.id}`, getAuthHeader()).then(fetchAllData); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per Fitness Request</Label>
                <Input type="number" value={settings.paw_rewards?.points_per_request || 30} className="mt-1" />
              </div>
              <div>
                <Label>Points per Activity Log</Label>
                <Input type="number" value={settings.paw_rewards?.points_per_activity || 5} className="mt-1" />
              </div>
              <div>
                <Label>Points per Weight Log</Label>
                <Input type="number" value={settings.paw_rewards?.points_per_weight_log || 3} className="mt-1" />
              </div>
              <div>
                <Label>Milestone Bonus Points</Label>
                <Input type="number" value={settings.paw_rewards?.milestone_bonus || 50} className="mt-1" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎂 Birthday Perks Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Birthday Discount %</Label>
                <Input type="number" value={settings.birthday_perks?.discount_percent || 15} className="mt-1" />
              </div>
              <div>
                <Label>Valid Days (before/after birthday)</Label>
                <Input type="number" value={settings.birthday_perks?.valid_days || 7} className="mt-1" />
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
              <div className="flex items-center justify-between">
                <Label>Activity Reminders</Label>
                <Switch checked={settings.notifications?.activity_reminder !== false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Weekly Progress Summary</Label>
                <Switch checked={settings.notifications?.weekly_summary || false} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Service Desk Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-create tickets for requests</Label>
                <Switch checked={settings.service_desk?.auto_create_tickets !== false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Route to Partners</Label>
                <Switch checked={settings.service_desk?.route_to_partners || false} />
              </div>
              <div>
                <Label>Default SLA (hours)</Label>
                <Input type="number" value={settings.service_desk?.default_sla || 48} className="mt-1 w-32" />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Type</Label>
                <Select value={planForm.plan_type} onValueChange={(val) => setPlanForm({...planForm, plan_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="weight_management">Weight Management</SelectItem>
                    <SelectItem value="agility">Agility</SelectItem>
                    <SelectItem value="senior_fitness">Senior Fitness</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (weeks)</Label>
                <Input type="number" value={planForm.duration_weeks} onChange={(e) => setPlanForm({...planForm, duration_weeks: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sessions/Week</Label>
                <Input type="number" value={planForm.sessions_per_week} onChange={(e) => setPlanForm({...planForm, sessions_per_week: e.target.value})} />
              </div>
              <div>
                <Label>Paw Points</Label>
                <Input type="number" value={planForm.paw_reward_points} onChange={(e) => setPlanForm({...planForm, paw_reward_points: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Member Price (₹)</Label>
                <Input type="number" value={planForm.member_price} onChange={(e) => setPlanForm({...planForm, member_price: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={planForm.pet_sizes} onChange={(e) => setPlanForm({...planForm, pet_sizes: e.target.value})} />
            </div>
            <div>
              <Label>Pet Ages (comma-separated)</Label>
              <Input value={planForm.pet_ages} onChange={(e) => setPlanForm({...planForm, pet_ages: e.target.value})} />
            </div>
            <div>
              <Label>Activities (comma-separated)</Label>
              <Input value={planForm.activities} onChange={(e) => setPlanForm({...planForm, activities: e.target.value})} />
            </div>
            <div>
              <Label>Goals (comma-separated)</Label>
              <Input value={planForm.goals} onChange={(e) => setPlanForm({...planForm, goals: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={planForm.is_featured} onCheckedChange={(val) => setPlanForm({...planForm, is_featured: val})} />
              <Label>Featured Plan</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>Cancel</Button>
            <Button onClick={savePlan}>{editingPlan ? 'Update' : 'Create'} Plan</Button>
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
              <Select value={partnerForm.partner_type} onValueChange={(val) => setPartnerForm({...partnerForm, partner_type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fitness_center">Fitness Center</SelectItem>
                  <SelectItem value="agility_center">Agility Center</SelectItem>
                  <SelectItem value="hydrotherapy">Hydrotherapy</SelectItem>
                  <SelectItem value="trainer_network">Trainer Network</SelectItem>
                  <SelectItem value="nutritionist">Nutritionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={partnerForm.description} onChange={(e) => setPartnerForm({...partnerForm, description: e.target.value})} />
            </div>
            <div>
              <Label>Services (comma-separated)</Label>
              <Input value={partnerForm.services} onChange={(e) => setPartnerForm({...partnerForm, services: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input value={partnerForm.contact_name} onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input value={partnerForm.contact_email} onChange={(e) => setPartnerForm({...partnerForm, contact_email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Phone</Label>
                <Input value={partnerForm.contact_phone} onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})} />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input type="number" value={partnerForm.commission_percent} onChange={(e) => setPartnerForm({...partnerForm, commission_percent: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={partnerForm.address} onChange={(e) => setPartnerForm({...partnerForm, address: e.target.value})} />
            </div>
            <div>
              <Label>Cities (comma-separated)</Label>
              <Input value={partnerForm.cities} onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={partnerForm.is_verified} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_verified: val})} />
                <Label>Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={partnerForm.is_active} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_active: val})} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerModal(false)}>Cancel</Button>
            <Button onClick={savePartner}>{editingPartner ? 'Update' : 'Create'} Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fit Type</Label>
                <Select value={productForm.fit_type} onValueChange={(val) => setProductForm({...productForm, fit_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="tracking">Tracking</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paw Points</Label>
                <Input type="number" value={productForm.paw_reward_points} onChange={(e) => setProductForm({...productForm, paw_reward_points: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={productForm.tags} onChange={(e) => setProductForm({...productForm, tags: e.target.value})} />
            </div>
            <div>
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={productForm.pet_sizes} onChange={(e) => setProductForm({...productForm, pet_sizes: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={productForm.in_stock} onCheckedChange={(val) => setProductForm({...productForm, in_stock: val})} />
              <Label>In Stock</Label>
            </div>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-sm">🎂 Birthday Perks</h4>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.is_birthday_perk} onCheckedChange={(val) => setProductForm({...productForm, is_birthday_perk: val})} />
                <Label>Birthday Perk Item</Label>
              </div>
              {productForm.is_birthday_perk && (
                <div>
                  <Label>Birthday Discount %</Label>
                  <Input type="number" value={productForm.birthday_discount_percent} onChange={(e) => setProductForm({...productForm, birthday_discount_percent: e.target.value})} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>Cancel</Button>
            <Button onClick={saveProduct}>{editingProduct ? 'Update' : 'Create'} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bundle Modal */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div>
              <Label>Product IDs (comma-separated)</Label>
              <Input value={bundleForm.items} onChange={(e) => setBundleForm({...bundleForm, items: e.target.value})} placeholder="fit-activity-tracker, fit-treat-pouch" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bundle Price (₹)</Label>
                <Input type="number" value={bundleForm.price} onChange={(e) => setBundleForm({...bundleForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input type="number" value={bundleForm.original_price} onChange={(e) => setBundleForm({...bundleForm, original_price: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Paw Points</Label>
              <Input type="number" value={bundleForm.paw_reward_points} onChange={(e) => setBundleForm({...bundleForm, paw_reward_points: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={bundleForm.is_recommended} onCheckedChange={(val) => setBundleForm({...bundleForm, is_recommended: val})} />
              <Label>Recommended Bundle</Label>
            </div>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-sm">🎂 Birthday Perks</h4>
              <div className="flex items-center gap-2">
                <Switch checked={bundleForm.is_birthday_perk} onCheckedChange={(val) => setBundleForm({...bundleForm, is_birthday_perk: val})} />
                <Label>Birthday Perk Bundle</Label>
              </div>
              {bundleForm.is_birthday_perk && (
                <div>
                  <Label>Birthday Discount %</Label>
                  <Input type="number" value={bundleForm.birthday_discount_percent} onChange={(e) => setBundleForm({...bundleForm, birthday_discount_percent: e.target.value})} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBundleModal(false); setEditingBundle(null); }}>Cancel</Button>
            <Button onClick={saveBundle}>{editingBundle ? 'Update' : 'Create'} Bundle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FitManager;
