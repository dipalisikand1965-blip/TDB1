import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import {
  Brain, Plus, Edit, Trash2, Search, Filter, Download, Upload,
  Users, Package, Settings, Star, Loader2, CheckCircle, Clock,
  AlertCircle, TrendingUp, PawPrint, Gift, Bell, Shield, RefreshCw, Briefcase
} from 'lucide-react';
import PillarServicesTab from './PillarServicesTab';
import PillarBundlesTab from './PillarBundlesTab';
import PillarProductsTab from './PillarProductsTab';

const ADVISORY_TYPES = {
  behaviour: { name: 'Behaviour', color: 'bg-violet-100 text-violet-700' },
  nutrition: { name: 'Nutrition', color: 'bg-emerald-100 text-emerald-700' },
  senior_care: { name: 'Senior Care', color: 'bg-amber-100 text-amber-700' },
  new_pet: { name: 'New Pet', color: 'bg-blue-100 text-blue-700' },
  health: { name: 'Health', color: 'bg-rose-100 text-rose-700' },
  training: { name: 'Training', color: 'bg-indigo-100 text-indigo-700' }
};

const AdvisoryManager = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [requests, setRequests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // CSV Import states
  const [importingProducts, setImportingProducts] = useState(false);
  const [importingBundles, setImportingBundles] = useState(false);
  const productFileRef = useRef(null);
  const bundleFileRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchPartners(),
        fetchProducts(),
        fetchBundles(),
        fetchStats(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // CSV Export functions
  const exportProductsCSV = () => {
    window.open(`${API_URL}/api/advisory/admin/products/export-csv`, '_blank');
  };
  
  const exportBundlesCSV = () => {
    window.open(`${API_URL}/api/advisory/admin/bundles/export-csv`, '_blank');
  };
  
  // CSV Import functions
  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportingProducts(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/advisory/admin/products/import-csv`, formData, {
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
      const response = await axios.post(`${API_URL}/api/advisory/admin/bundles/import-csv`, formData, {
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

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/admin/partners`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBundles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/bundles`);
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/admin/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Request status updated' });
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/advisory/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Settings saved' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const seedData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/advisory/admin/seed`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Success', description: data.message });
        fetchAllData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (typeFilter !== 'all' && req.advisory_type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.pet_name?.toLowerCase().includes(query) ||
        req.user_name?.toLowerCase().includes(query) ||
        req.concern?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>;
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      mild: 'bg-green-100 text-green-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      severe: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return <Badge className={styles[severity] || 'bg-gray-100'}>{severity}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="advisory-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-600" />
            Advisory Manager
          </h2>
          <p className="text-gray-500">Manage consultations, advisors, products, and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={seedData}>
            <Download className="w-4 h-4 mr-2" /> Seed Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700">{stats.total_requests || 0}</p>
              <p className="text-xs text-violet-600">Total Requests</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending_requests || 0}</p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.scheduled_requests || 0}</p>
              <p className="text-xs text-blue-600">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completed_requests || 0}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{stats.total_partners || 0}</p>
              <p className="text-xs text-indigo-600">Advisors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700">{stats.total_products || 0}</p>
              <p className="text-xs text-rose-600">Products</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-violet-50">
          <TabsTrigger value="requests" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" /> Advisors
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <Card className="p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ADVISORY_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Requests Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-violet-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Request ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Pet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-violet-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{req.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{req.pet_name}</p>
                            <p className="text-xs text-gray-500">{req.pet_breed}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{req.user_name}</p>
                            <p className="text-xs text-gray-500">{req.user_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ADVISORY_TYPES[req.advisory_type]?.color || 'bg-gray-100'}>
                            {ADVISORY_TYPES[req.advisory_type]?.name || req.advisory_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{getSeverityBadge(req.severity)}</td>
                        <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                        <td className="px-4 py-3">
                          <Select 
                            value={req.status} 
                            onValueChange={(v) => updateRequestStatus(req.id, v)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No advisory requests found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Advisory Partners ({partners.length})</h3>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingItem(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Advisor
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <Card key={partner.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                      <p className="text-sm text-gray-500">{partner.partner_type}</p>
                    </div>
                    {partner.is_featured && (
                      <Badge className="bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{partner.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {partner.specialties?.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="outline" className="text-xs capitalize">
                        {spec.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{partner.rating || 4.5}</span>
                    </div>
                    <span className="font-semibold text-violet-600">₹{partner.consultation_fee || 1500}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingItem(partner); setShowPartnerModal(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <PillarProductsTab pillar="advisory" pillarName="Advisory" />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles">
          <PillarBundlesTab pillar="advisory" pillarName="Advisory" accentColor="purple" />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <PillarServicesTab
            pillar="advisory"
            pillarName="Advisory"
            pillarIcon="🧠"
            pillarColor="bg-violet-500"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Paw Rewards */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PawPrint className="w-5 h-5 text-violet-600" /> Paw Rewards
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Paw Rewards</Label>
                  <Switch 
                    checked={settings.paw_rewards?.enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      paw_rewards: { ...settings.paw_rewards, enabled: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Points per Consultation</Label>
                  <Input 
                    type="number"
                    value={settings.paw_rewards?.points_per_consultation || 50}
                    onChange={(e) => setSettings({
                      ...settings,
                      paw_rewards: { ...settings.paw_rewards, points_per_consultation: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Points per Follow-up</Label>
                  <Input 
                    type="number"
                    value={settings.paw_rewards?.points_per_follow_up || 25}
                    onChange={(e) => setSettings({
                      ...settings,
                      paw_rewards: { ...settings.paw_rewards, points_per_follow_up: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Birthday Perks */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-violet-600" /> Birthday Perks
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Birthday Perks</Label>
                  <Switch 
                    checked={settings.birthday_perks?.enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      birthday_perks: { ...settings.birthday_perks, enabled: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Birthday Discount (%)</Label>
                  <Input 
                    type="number"
                    value={settings.birthday_perks?.discount_percent || 20}
                    onChange={(e) => setSettings({
                      ...settings,
                      birthday_perks: { ...settings.birthday_perks, discount_percent: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-violet-600" /> Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch 
                    checked={settings.notifications?.email_enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email_enabled: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Reminder Hours Before</Label>
                  <Input 
                    type="number"
                    value={settings.notifications?.reminder_hours_before || 24}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, reminder_hours_before: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Follow-up Days After</Label>
                  <Input 
                    type="number"
                    value={settings.notifications?.follow_up_days_after || 7}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, follow_up_days_after: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Service Desk */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-violet-600" /> Service Desk Integration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Auto-create Ticket</Label>
                  <Switch 
                    checked={settings.service_desk?.auto_create_ticket || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      service_desk: { ...settings.service_desk, auto_create_ticket: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Default Priority</Label>
                  <Select 
                    value={settings.service_desk?.default_priority || 'normal'}
                    onValueChange={(v) => setSettings({
                      ...settings,
                      service_desk: { ...settings.service_desk, default_priority: v }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Escalation Hours</Label>
                  <Input 
                    type="number"
                    value={settings.service_desk?.escalation_hours || 24}
                    onChange={(e) => setSettings({
                      ...settings,
                      service_desk: { ...settings.service_desk, escalation_hours: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvisoryManager;
