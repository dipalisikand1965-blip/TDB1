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
  GraduationCap, BookOpen, Brain, Users, Package, Building2,
  Settings, Search, Plus, Edit2, Trash2, RefreshCw, Eye, Clock,
  CheckCircle, XCircle, Star, Download, Upload, Database, Award,
  Heart, Zap, Shield, Target, Calendar, MapPin, Briefcase
} from 'lucide-react';
import PillarServicesTab from './PillarServicesTab';
import PillarProductsTab from './PillarProductsTab';

const LEARN_TYPE_ICONS = {
  basic_obedience: GraduationCap,
  puppy_training: Heart,
  behavior_modification: Brain,
  advanced_training: Award,
  agility: Zap,
  therapy_training: Shield
};

const LEARN_TYPES = {
  basic_obedience: 'Basic Obedience',
  puppy_training: 'Puppy Training',
  behavior_modification: 'Behavior Modification',
  advanced_training: 'Advanced Training',
  agility: 'Agility Training',
  therapy_training: 'Therapy Dog Training'
};

const LearnManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [requests, setRequests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  
  // Settings
  const [settings, setSettings] = useState({
    paw_rewards: {
      points_per_request: 30,
      points_per_session: 10,
      points_per_completion: 100,
      milestone_bonus: 50
    },
    birthday_perks: {
      discount_percent: 15,
      valid_days: 7
    },
    notifications: {
      email_enabled: true,
      whatsapp_enabled: false,
      sms_enabled: false,
      training_reminder: true,
      weekly_progress: false
    },
    service_desk: {
      auto_create_tickets: true,
      route_to_trainers: false,
      default_sla: 48
    }
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modals
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Forms
  const [programForm, setProgramForm] = useState({
    name: '', description: '', learn_type: 'basic_obedience', duration: '4 weeks',
    sessions: 8, price: '', member_price: '', pet_sizes: 'small, medium, large',
    includes: '', image: '', paw_reward_points: '0', is_featured: false
  });
  
  const [trainerForm, setTrainerForm] = useState({
    name: '', title: '', description: '', specializations: '',
    experience_years: '5', rating: '4.8', reviews_count: '0',
    city: '', contact_email: '', contact_phone: '',
    image: '', is_featured: false, is_active: true
  });
  
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    image: '', learn_type: 'training_tool', tags: '', pet_sizes: 'small, medium, large',
    in_stock: true, paw_reward_points: '0',
    is_birthday_perk: false, birthday_discount_percent: ''
  });
  
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', items: '', price: '', original_price: '',
    paw_reward_points: '0', is_recommended: false,
    is_birthday_perk: false, birthday_discount_percent: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [reqRes, programRes, trainerRes, productRes, bundleRes] = await Promise.all([
        axios.get(`${API_URL}/api/learn/requests`, getAuthHeader()),
        axios.get(`${API_URL}/api/learn/programs`, getAuthHeader()),
        axios.get(`${API_URL}/api/learn/trainers`, getAuthHeader()),
        axios.get(`${API_URL}/api/learn/products`, getAuthHeader()),
        axios.get(`${API_URL}/api/learn/bundles`, getAuthHeader())
      ]);
      
      setRequests(reqRes.data.requests || []);
      setPrograms(programRes.data.programs || []);
      setTrainers(trainerRes.data.trainers || []);
      setProducts(productRes.data.products || []);
      setBundles(bundleRes.data.bundles || []);
      
      // Calculate stats
      setStats({
        total_requests: reqRes.data.requests?.length || 0,
        pending: reqRes.data.requests?.filter(r => r.status === 'pending').length || 0,
        in_progress: reqRes.data.requests?.filter(r => r.status === 'in_progress').length || 0,
        completed: reqRes.data.requests?.filter(r => r.status === 'completed').length || 0,
        programs_count: programRes.data.programs?.length || 0
      });
    } catch (error) {
      console.error('Failed to load learn data:', error);
      toast({ title: 'Error', description: 'Failed to load training data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/learn/admin/seed`, {}, getAuthHeader());
      toast({ 
        title: 'Success', 
        description: `Seeded ${response.data.programs_seeded || 0} programs, ${response.data.products_seeded || 0} products, ${response.data.trainers_seeded || 0} trainers` 
      });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  // Request Actions
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/learn/requests/${requestId}`, { status: newStatus }, getAuthHeader());
      toast({ title: 'Success', description: 'Request status updated' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Program CRUD
  const resetProgramForm = () => {
    setProgramForm({
      name: '', description: '', learn_type: 'basic_obedience', duration: '4 weeks',
      sessions: 8, price: '', member_price: '', pet_sizes: 'small, medium, large',
      includes: '', image: '', paw_reward_points: '0', is_featured: false
    });
  };

  const saveProgram = async () => {
    try {
      const payload = {
        ...programForm,
        sessions: parseInt(programForm.sessions) || 8,
        price: parseFloat(programForm.price) || 0,
        member_price: parseFloat(programForm.member_price) || null,
        paw_reward_points: parseInt(programForm.paw_reward_points) || 0,
        pet_sizes: programForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean),
        includes: programForm.includes.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingProgram) {
        await axios.put(`${API_URL}/api/learn/admin/programs/${editingProgram.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Program updated' });
      } else {
        await axios.post(`${API_URL}/api/learn/admin/programs`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Program created' });
      }
      setShowProgramModal(false);
      setEditingProgram(null);
      resetProgramForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save program', variant: 'destructive' });
    }
  };

  const deleteProgram = async (id) => {
    if (!confirm('Delete this program?')) return;
    try {
      await axios.delete(`${API_URL}/api/learn/admin/programs/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Program deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete program', variant: 'destructive' });
    }
  };

  // Trainer CRUD
  const resetTrainerForm = () => {
    setTrainerForm({
      name: '', title: '', description: '', specializations: '',
      experience_years: '5', rating: '4.8', reviews_count: '0',
      city: '', contact_email: '', contact_phone: '',
      image: '', is_featured: false, is_active: true
    });
  };

  const saveTrainer = async () => {
    try {
      const payload = {
        ...trainerForm,
        experience_years: parseInt(trainerForm.experience_years) || 0,
        rating: parseFloat(trainerForm.rating) || 4.8,
        reviews_count: parseInt(trainerForm.reviews_count) || 0,
        specializations: trainerForm.specializations.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingTrainer) {
        await axios.put(`${API_URL}/api/learn/admin/trainers/${editingTrainer.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Trainer updated' });
      } else {
        await axios.post(`${API_URL}/api/learn/admin/trainers`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Trainer created' });
      }
      setShowTrainerModal(false);
      setEditingTrainer(null);
      resetTrainerForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save trainer', variant: 'destructive' });
    }
  };

  const deleteTrainer = async (id) => {
    if (!confirm('Delete this trainer?')) return;
    try {
      await axios.delete(`${API_URL}/api/learn/admin/trainers/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Trainer deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete trainer', variant: 'destructive' });
    }
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '',
      image: '', learn_type: 'training_tool', tags: '', pet_sizes: 'small, medium, large',
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
        await axios.put(`${API_URL}/api/learn/admin/products/${editingProduct.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/learn/admin/products`, payload, getAuthHeader());
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
      await axios.delete(`${API_URL}/api/learn/admin/products/${id}`, getAuthHeader());
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
        await axios.put(`${API_URL}/api/learn/admin/bundles/${editingBundle.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        await axios.post(`${API_URL}/api/learn/admin/bundles`, payload, getAuthHeader());
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
      await axios.delete(`${API_URL}/api/learn/admin/bundles/${id}`, getAuthHeader());
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
      p.name, p.description, p.price, p.compare_price || '', p.learn_type, p.in_stock ? 'Yes' : 'No', p.paw_reward_points
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learn-products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportRequestsCSV = () => {
    const headers = ['ID', 'Pet Name', 'Type', 'Status', 'User', 'Created At'];
    const rows = requests.map(r => [
      r.id, r.pet_name, r.learn_type, r.status, r.user_name, r.created_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learn-requests.csv';
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
    if (typeFilter && req.learn_type !== typeFilter) return false;
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
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="learn-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learn Manager</h1>
            <p className="text-gray-500">Manage training programs, requests, trainers & products</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportRequestsCSV}>
            <Download className="w-4 h-4 mr-2" /> Export Requests
          </Button>
          <Button variant="outline" onClick={exportProductsCSV}>
            <Download className="w-4 h-4 mr-2" /> Export Products
          </Button>
          <Button variant="outline" onClick={seedData}>
            <Database className="w-4 h-4 mr-2" /> Seed Data
          </Button>
          <Button onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total_requests || 0}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-indigo-700">{stats.in_progress || 0}</p>
            </div>
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{stats.completed || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programs</p>
              <p className="text-2xl font-bold text-purple-700">{stats.programs_count || 0}</p>
            </div>
            <Award className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="services"><Briefcase className="w-4 h-4 mr-1" />Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(LEARN_TYPES).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No training requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const TypeIcon = LEARN_TYPE_ICONS[req.learn_type] || GraduationCap;
                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">{req.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{req.pet_name}</p>
                            <p className="text-xs text-gray-500">{req.pet_breed}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{LEARN_TYPES[req.learn_type] || req.learn_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm">{req.user_name}</p>
                            <p className="text-xs text-gray-500">{req.user_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(req.status)}>
                            {req.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedRequest(req)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {req.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(req.id, 'in_progress')}
                              >
                                Start
                              </Button>
                            )}
                            {req.status === 'in_progress' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateRequestStatus(req.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Training Programs</h3>
            <Button onClick={() => { resetProgramForm(); setEditingProgram(null); setShowProgramModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Program
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="p-4">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-3 overflow-hidden">
                  {program.image ? (
                    <img src={program.image} alt={program.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-blue-300" />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{program.name}</h4>
                  {program.is_featured && <Badge className="bg-amber-100 text-amber-700">Featured</Badge>}
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{program.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {program.duration}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {program.sessions} sessions</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₹{program.price?.toLocaleString()}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingProgram(program);
                      setProgramForm({
                        name: program.name || '',
                        description: program.description || '',
                        learn_type: program.learn_type || 'basic_obedience',
                        duration: program.duration || '4 weeks',
                        sessions: program.sessions || 8,
                        price: program.price?.toString() || '',
                        member_price: program.member_price?.toString() || '',
                        pet_sizes: program.pet_sizes?.join(', ') || 'small, medium, large',
                        includes: program.includes?.join(', ') || '',
                        image: program.image || '',
                        paw_reward_points: program.paw_reward_points?.toString() || '0',
                        is_featured: program.is_featured || false
                      });
                      setShowProgramModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteProgram(program.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trainers Tab */}
        <TabsContent value="trainers" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Training Experts</h3>
            <Button onClick={() => { resetTrainerForm(); setEditingTrainer(null); setShowTrainerModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Trainer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainers.map((trainer) => (
              <Card key={trainer.id} className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {trainer.image ? (
                      <img src={trainer.image} alt={trainer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{trainer.name}</h4>
                    <p className="text-sm text-blue-600">{trainer.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" /> {trainer.city}
                  <span>•</span>
                  <span>{trainer.experience_years}+ years</span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{trainer.rating}</span>
                  <span className="text-gray-400">({trainer.reviews_count} reviews)</span>
                </div>
                {trainer.specializations && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {trainer.specializations.slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{spec.replace(/_/g, ' ')}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge className={trainer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {trainer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingTrainer(trainer);
                      setTrainerForm({
                        name: trainer.name || '',
                        title: trainer.title || '',
                        description: trainer.description || '',
                        specializations: trainer.specializations?.join(', ') || '',
                        experience_years: trainer.experience_years?.toString() || '5',
                        rating: trainer.rating?.toString() || '4.8',
                        reviews_count: trainer.reviews_count?.toString() || '0',
                        city: trainer.city || '',
                        contact_email: trainer.contact_email || '',
                        contact_phone: trainer.contact_phone || '',
                        image: trainer.image || '',
                        is_featured: trainer.is_featured || false,
                        is_active: trainer.is_active !== false
                      });
                      setShowTrainerModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteTrainer(trainer.id)}>
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
          <PillarProductsTab pillar="learn" pillarName="Learn" />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Training Bundles</h3>
            <Button onClick={() => { resetBundleForm(); setEditingBundle(null); setShowBundleModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Bundle
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{bundle.name}</h4>
                  {bundle.is_recommended && <Badge className="bg-amber-100 text-amber-700">Recommended</Badge>}
                </div>
                <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                {bundle.items && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bundle.items.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {typeof item === 'object' ? (item.name || item.title || JSON.stringify(item)) : item}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-blue-600">₹{bundle.price?.toLocaleString()}</span>
                    {bundle.original_price && (
                      <span className="text-sm text-gray-400 line-through ml-2">₹{bundle.original_price?.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingBundle(bundle);
                      setBundleForm({
                        name: bundle.name || '',
                        description: bundle.description || '',
                        items: bundle.items?.join(', ') || '',
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
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6 space-y-4">
          <PillarServicesTab
            pillar="learn"
            pillarName="Learn"
            pillarIcon="🎓"
            pillarColor="bg-blue-500"
          />
        </TabsContent>

        {/* Settings Tab - Full Settings like FitManager */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per Training Request</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_request || 30} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    paw_rewards: { ...prev.paw_rewards, points_per_request: parseInt(e.target.value) }
                  }))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Points per Session Attended</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_session || 10} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    paw_rewards: { ...prev.paw_rewards, points_per_session: parseInt(e.target.value) }
                  }))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Points per Program Completion</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_completion || 100} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    paw_rewards: { ...prev.paw_rewards, points_per_completion: parseInt(e.target.value) }
                  }))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Milestone Bonus Points</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.milestone_bonus || 50} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    paw_rewards: { ...prev.paw_rewards, milestone_bonus: parseInt(e.target.value) }
                  }))}
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
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    birthday_perks: { ...prev.birthday_perks, discount_percent: parseInt(e.target.value) }
                  }))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Valid Days (before/after birthday)</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.valid_days || 7} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    birthday_perks: { ...prev.birthday_perks, valid_days: parseInt(e.target.value) }
                  }))}
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
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email_enabled: v }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>WhatsApp Notifications</Label>
                <Switch 
                  checked={settings.notifications?.whatsapp_enabled || false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, whatsapp_enabled: v }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch 
                  checked={settings.notifications?.sms_enabled || false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms_enabled: v }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Training Reminders</Label>
                <Switch 
                  checked={settings.notifications?.training_reminder !== false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, training_reminder: v }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Weekly Progress Summary</Label>
                <Switch 
                  checked={settings.notifications?.weekly_progress || false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, weekly_progress: v }
                  }))}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Service Desk Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-create tickets for training requests</Label>
                <Switch 
                  checked={settings.service_desk?.auto_create_tickets !== false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    service_desk: { ...prev.service_desk, auto_create_tickets: v }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Route to Certified Trainers</Label>
                <Switch 
                  checked={settings.service_desk?.route_to_trainers || false} 
                  onCheckedChange={(v) => setSettings(prev => ({
                    ...prev,
                    service_desk: { ...prev.service_desk, route_to_trainers: v }
                  }))}
                />
              </div>
              <div>
                <Label>Default SLA (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.service_desk?.default_sla || 48} 
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    service_desk: { ...prev.service_desk, default_sla: parseInt(e.target.value) }
                  }))}
                  className="mt-1 w-32" 
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎓 Training Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Allow Online Training Sessions</Label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Trainer Certification</Label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Group Training</Label>
                <Switch checked={false} />
              </div>
              <div>
                <Label>Max Session Duration (minutes)</Label>
                <Input type="number" defaultValue={60} className="mt-1 w-32" />
              </div>
              <div>
                <Label>Min Days Notice for Booking</Label>
                <Input type="number" defaultValue={2} className="mt-1 w-32" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Reset to Defaults</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Program Modal */}
      <Dialog open={showProgramModal} onOpenChange={setShowProgramModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'Add Program'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Program Name</Label>
              <Input value={programForm.name} onChange={(e) => setProgramForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={programForm.description} onChange={(e) => setProgramForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div>
              <Label>Training Type</Label>
              <Select value={programForm.learn_type} onValueChange={(v) => setProgramForm(prev => ({ ...prev, learn_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEARN_TYPES).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={programForm.duration} onChange={(e) => setProgramForm(prev => ({ ...prev, duration: e.target.value }))} placeholder="e.g., 4 weeks" />
            </div>
            <div>
              <Label>Sessions</Label>
              <Input type="number" value={programForm.sessions} onChange={(e) => setProgramForm(prev => ({ ...prev, sessions: e.target.value }))} />
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" value={programForm.price} onChange={(e) => setProgramForm(prev => ({ ...prev, price: e.target.value }))} />
            </div>
            <div>
              <Label>Member Price (₹)</Label>
              <Input type="number" value={programForm.member_price} onChange={(e) => setProgramForm(prev => ({ ...prev, member_price: e.target.value }))} />
            </div>
            <div>
              <Label>Paw Reward Points</Label>
              <Input type="number" value={programForm.paw_reward_points} onChange={(e) => setProgramForm(prev => ({ ...prev, paw_reward_points: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Includes (comma-separated)</Label>
              <Input value={programForm.includes} onChange={(e) => setProgramForm(prev => ({ ...prev, includes: e.target.value }))} placeholder="e.g., 1-on-1 sessions, Training materials, Progress reports" />
            </div>
            <div className="col-span-2">
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={programForm.pet_sizes} onChange={(e) => setProgramForm(prev => ({ ...prev, pet_sizes: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input value={programForm.image} onChange={(e) => setProgramForm(prev => ({ ...prev, image: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={programForm.is_featured} onCheckedChange={(v) => setProgramForm(prev => ({ ...prev, is_featured: v }))} />
              <Label>Featured Program</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgramModal(false)}>Cancel</Button>
            <Button onClick={saveProgram}>Save Program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trainer Modal */}
      <Dialog open={showTrainerModal} onOpenChange={setShowTrainerModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrainer ? 'Edit Trainer' : 'Add Trainer'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input value={trainerForm.name} onChange={(e) => setTrainerForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={trainerForm.title} onChange={(e) => setTrainerForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Certified Dog Trainer" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={trainerForm.description} onChange={(e) => setTrainerForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Specializations (comma-separated)</Label>
              <Input value={trainerForm.specializations} onChange={(e) => setTrainerForm(prev => ({ ...prev, specializations: e.target.value }))} placeholder="e.g., puppy_training, behavior_modification" />
            </div>
            <div>
              <Label>Experience (years)</Label>
              <Input type="number" value={trainerForm.experience_years} onChange={(e) => setTrainerForm(prev => ({ ...prev, experience_years: e.target.value }))} />
            </div>
            <div>
              <Label>Rating</Label>
              <Input type="number" step="0.1" value={trainerForm.rating} onChange={(e) => setTrainerForm(prev => ({ ...prev, rating: e.target.value }))} />
            </div>
            <div>
              <Label>Reviews Count</Label>
              <Input type="number" value={trainerForm.reviews_count} onChange={(e) => setTrainerForm(prev => ({ ...prev, reviews_count: e.target.value }))} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={trainerForm.city} onChange={(e) => setTrainerForm(prev => ({ ...prev, city: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={trainerForm.contact_email} onChange={(e) => setTrainerForm(prev => ({ ...prev, contact_email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={trainerForm.contact_phone} onChange={(e) => setTrainerForm(prev => ({ ...prev, contact_phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input value={trainerForm.image} onChange={(e) => setTrainerForm(prev => ({ ...prev, image: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={trainerForm.is_featured} onCheckedChange={(v) => setTrainerForm(prev => ({ ...prev, is_featured: v }))} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={trainerForm.is_active} onCheckedChange={(v) => setTrainerForm(prev => ({ ...prev, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrainerModal(false)}>Cancel</Button>
            <Button onClick={saveTrainer}>Save Trainer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div>
              <Label>Product Type</Label>
              <Select value={productForm.learn_type} onValueChange={(v) => setProductForm(prev => ({ ...prev, learn_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="training_tool">Training Tool</SelectItem>
                  <SelectItem value="treats">Training Treats</SelectItem>
                  <SelectItem value="book">Book/Guide</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" value={productForm.price} onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))} />
            </div>
            <div>
              <Label>Compare Price (₹)</Label>
              <Input type="number" value={productForm.compare_price} onChange={(e) => setProductForm(prev => ({ ...prev, compare_price: e.target.value }))} />
            </div>
            <div>
              <Label>Paw Reward Points</Label>
              <Input type="number" value={productForm.paw_reward_points} onChange={(e) => setProductForm(prev => ({ ...prev, paw_reward_points: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={productForm.tags} onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={productForm.pet_sizes} onChange={(e) => setProductForm(prev => ({ ...prev, pet_sizes: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input value={productForm.image} onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={productForm.in_stock} onCheckedChange={(v) => setProductForm(prev => ({ ...prev, in_stock: v }))} />
              <Label>In Stock</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={productForm.is_birthday_perk} onCheckedChange={(v) => setProductForm(prev => ({ ...prev, is_birthday_perk: v }))} />
              <Label>Birthday Perk</Label>
            </div>
            {productForm.is_birthday_perk && (
              <div>
                <Label>Birthday Discount %</Label>
                <Input type="number" value={productForm.birthday_discount_percent} onChange={(e) => setProductForm(prev => ({ ...prev, birthday_discount_percent: e.target.value }))} />
              </div>
            )}
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
          <div className="space-y-4 py-4">
            <div>
              <Label>Bundle Name</Label>
              <Input value={bundleForm.name} onChange={(e) => setBundleForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={bundleForm.description} onChange={(e) => setBundleForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div>
              <Label>Items (comma-separated)</Label>
              <Input value={bundleForm.items} onChange={(e) => setBundleForm(prev => ({ ...prev, items: e.target.value }))} placeholder="e.g., Clicker, Treat Pouch, Training Guide" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={bundleForm.price} onChange={(e) => setBundleForm(prev => ({ ...prev, price: e.target.value }))} />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input type="number" value={bundleForm.original_price} onChange={(e) => setBundleForm(prev => ({ ...prev, original_price: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Paw Reward Points</Label>
              <Input type="number" value={bundleForm.paw_reward_points} onChange={(e) => setBundleForm(prev => ({ ...prev, paw_reward_points: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={bundleForm.is_recommended} onCheckedChange={(v) => setBundleForm(prev => ({ ...prev, is_recommended: v }))} />
                <Label>Recommended</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={bundleForm.is_birthday_perk} onCheckedChange={(v) => setBundleForm(prev => ({ ...prev, is_birthday_perk: v }))} />
                <Label>Birthday Perk</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBundleModal(false)}>Cancel</Button>
            <Button onClick={saveBundle}>Save Bundle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Training Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Request ID</Label>
                  <p className="font-mono">{selectedRequest.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Pet</Label>
                  <p className="font-medium">{selectedRequest.pet_name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.pet_breed} • {selectedRequest.pet_age}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Training Type</Label>
                  <p>{LEARN_TYPES[selectedRequest.learn_type] || selectedRequest.learn_type}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Customer</Label>
                  <p className="font-medium">{selectedRequest.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.user_email}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.user_phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Location Preference</Label>
                  <p>{selectedRequest.location_preference?.replace('_', ' ')}</p>
                </div>
              </div>
              {selectedRequest.training_goals?.length > 0 && (
                <div>
                  <Label className="text-gray-500">Training Goals</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.training_goals.map((goal, i) => (
                      <Badge key={i} variant="outline">{goal.replace(/_/g, ' ')}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRequest.behavior_issues?.length > 0 && (
                <div>
                  <Label className="text-gray-500">Behavior Issues</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.behavior_issues.map((issue, i) => (
                      <Badge key={i} variant="outline" className="bg-orange-50">{issue.replace(/_/g, ' ')}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRequest.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="text-sm mt-1">{selectedRequest.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.status === 'pending' && (
                  <Button onClick={() => { updateRequestStatus(selectedRequest.id, 'in_progress'); setSelectedRequest(null); }}>
                    Start Training
                  </Button>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => { updateRequestStatus(selectedRequest.id, 'completed'); setSelectedRequest(null); }}>
                    Mark Completed
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnManager;
