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
  AlertTriangle, Plus, Edit, Trash2, Search, Filter, Download, Upload,
  Users, Package, Settings, Star, Loader2, CheckCircle, Clock,
  TrendingUp, PawPrint, Gift, Bell, Shield, RefreshCw, Siren,
  Phone, MapPin, Ambulance, Heart, Briefcase
} from 'lucide-react';
import PillarServicesTab from './PillarServicesTab';

const EMERGENCY_TYPES = {
  lost_pet: { name: 'Lost Pet', color: 'bg-red-100 text-red-700' },
  medical_emergency: { name: 'Medical', color: 'bg-red-100 text-red-700' },
  accident_injury: { name: 'Accident', color: 'bg-orange-100 text-orange-700' },
  poisoning: { name: 'Poisoning', color: 'bg-purple-100 text-purple-700' },
  breathing_distress: { name: 'Breathing', color: 'bg-blue-100 text-blue-700' },
  found_pet: { name: 'Found Pet', color: 'bg-green-100 text-green-700' },
  natural_disaster: { name: 'Disaster', color: 'bg-slate-100 text-slate-700' },
  aggressive_animal: { name: 'Aggressive', color: 'bg-amber-100 text-amber-700' }
};

const EmergencyManager = () => {
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
  
  // CSV Export/Import functions
  const exportProductsCSV = () => {
    window.open(`${API_URL}/api/emergency/admin/products/export-csv`, '_blank');
  };
  
  const exportBundlesCSV = () => {
    window.open(`${API_URL}/api/emergency/admin/bundles/export-csv`, '_blank');
  };
  
  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportingProducts(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/emergency/admin/products/import-csv`, formData, {
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
      const response = await axios.post(`${API_URL}/api/emergency/admin/bundles/import-csv`, formData, {
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
      const res = await fetch(`${API_URL}/api/emergency/requests`);
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
      const res = await fetch(`${API_URL}/api/emergency/admin/partners`);
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
      const res = await fetch(`${API_URL}/api/emergency/products`);
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
      const res = await fetch(`${API_URL}/api/emergency/bundles`);
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
      const res = await fetch(`${API_URL}/api/emergency/admin/stats`);
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
      const res = await fetch(`${API_URL}/api/emergency/admin/settings`);
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
      const res = await fetch(`${API_URL}/api/emergency/requests/${requestId}`, {
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
      const res = await fetch(`${API_URL}/api/emergency/admin/settings`, {
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
      const res = await fetch(`${API_URL}/api/emergency/admin/seed`, { method: 'POST' });
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
    if (typeFilter !== 'all' && req.emergency_type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.pet_name?.toLowerCase().includes(query) ||
        req.user_name?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.location?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-red-100 text-red-700 animate-pulse',
      responding: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      critical: 'bg-red-600 text-white animate-pulse',
      urgent: 'bg-orange-500 text-white',
      high: 'bg-amber-500 text-white',
      moderate: 'bg-yellow-500 text-white'
    };
    return <Badge className={styles[severity] || 'bg-gray-100'}>{severity}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="emergency-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Siren className="w-6 h-6 text-red-600" />
            Emergency Manager
          </h2>
          <p className="text-gray-500">Manage emergencies, partners, products, and settings</p>
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
        <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.active_requests || 0}</p>
              <p className="text-xs text-red-600">Active Emergencies</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.responding_requests || 0}</p>
              <p className="text-xs text-orange-600">Responding</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.resolved_requests || 0}</p>
              <p className="text-xs text-green-600">Resolved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.lost_pet_active || 0}</p>
              <p className="text-xs text-purple-600">Lost Pets Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Ambulance className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total_partners || 0}</p>
              <p className="text-xs text-blue-600">Partners</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{stats.total_products || 0}</p>
              <p className="text-xs text-indigo-600">Products</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-red-50">
          <TabsTrigger value="requests" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Siren className="w-4 h-4 mr-2" /> Emergencies
          </TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Ambulance className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
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
                    placeholder="Search emergencies..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="responding">Responding</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(EMERGENCY_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Requests Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Request ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Pet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className={`hover:bg-gray-50 ${req.status === 'active' ? 'bg-red-50/50' : ''}`}>
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
                            <p className="text-xs text-gray-500">{req.user_phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={EMERGENCY_TYPES[req.emergency_type]?.color || 'bg-gray-100'}>
                            {EMERGENCY_TYPES[req.emergency_type]?.name || req.emergency_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{getSeverityBadge(req.severity)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {req.city || req.location?.slice(0, 20) || 'N/A'}
                          </div>
                        </td>
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
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="responding">Responding</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
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
                <Siren className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No emergency requests found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Emergency Partners ({partners.length})</h3>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingItem(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <Card key={partner.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-red-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{partner.partner_type?.replace('_', ' ')}</p>
                    </div>
                    {partner.is_24hr && (
                      <Badge className="bg-red-100 text-red-700">
                        <Clock className="w-3 h-3 mr-1" /> 24/7
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{partner.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Phone className="w-3 h-3" />
                    {partner.emergency_phone || partner.phone}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {partner.services?.slice(0, 3).map((service) => (
                      <Badge key={service} variant="outline" className="text-xs capitalize">
                        {service.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{partner.rating || 4.5}</span>
                    </div>
                    {partner.response_time_minutes && (
                      <span className="text-red-600 font-semibold">~{partner.response_time_minutes} min</span>
                    )}
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
        <TabsContent value="products" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Emergency Products ({products.length})</h3>
              <div className="flex gap-2">
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
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingItem(null); setShowProductModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-red-100 to-orange-50 rounded-lg mb-3 flex items-center justify-center">
                    <Shield className="w-12 h-12 text-red-300" />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-red-600">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="text-xs text-gray-400 line-through">₹{product.compare_price}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingItem(product); setShowProductModal(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Emergency Bundles ({bundles.length})</h3>
              <div className="flex gap-2">
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
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingItem(null); setShowBundleModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Bundle
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((bundle) => (
                <Card key={bundle.id} className="p-4 border-2 border-red-200 bg-red-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                    {bundle.is_recommended && (
                      <Badge className="bg-red-500">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bundle.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-red-600">₹{bundle.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                  </div>
                  {bundle.paw_reward_points > 0 && (
                    <p className="text-xs text-red-600 mb-2">🐾 {bundle.paw_reward_points} Paw Points</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingItem(bundle); setShowBundleModal(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <PillarServicesTab
            pillar="emergency"
            pillarName="Emergency"
            pillarIcon="🚨"
            pillarColor="bg-red-500"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Response Settings */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-red-600" /> Response Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Critical SLA (minutes)</Label>
                  <Input 
                    type="number"
                    value={settings.response_settings?.critical_sla_minutes || 15}
                    onChange={(e) => setSettings({
                      ...settings,
                      response_settings: { ...settings.response_settings, critical_sla_minutes: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Urgent SLA (minutes)</Label>
                  <Input 
                    type="number"
                    value={settings.response_settings?.urgent_sla_minutes || 30}
                    onChange={(e) => setSettings({
                      ...settings,
                      response_settings: { ...settings.response_settings, urgent_sla_minutes: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-Escalate</Label>
                  <Switch 
                    checked={settings.response_settings?.auto_escalate || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      response_settings: { ...settings.response_settings, auto_escalate: v }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-red-600" /> Notifications
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
                <div className="flex items-center justify-between">
                  <Label>SMS Notifications</Label>
                  <Switch 
                    checked={settings.notifications?.sms_enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sms_enabled: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>WhatsApp Notifications</Label>
                  <Switch 
                    checked={settings.notifications?.whatsapp_enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, whatsapp_enabled: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Sound Alerts</Label>
                  <Switch 
                    checked={settings.notifications?.sound_alerts || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sound_alerts: v }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Lost Pet Settings */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-red-600" /> Lost Pet Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Auto-Create Alert</Label>
                  <Switch 
                    checked={settings.lost_pet_settings?.auto_create_alert || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      lost_pet_settings: { ...settings.lost_pet_settings, auto_create_alert: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Alert Radius (km)</Label>
                  <Input 
                    type="number"
                    value={settings.lost_pet_settings?.alert_radius_km || 10}
                    onChange={(e) => setSettings({
                      ...settings,
                      lost_pet_settings: { ...settings.lost_pet_settings, alert_radius_km: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Include Nearby Vets</Label>
                  <Switch 
                    checked={settings.lost_pet_settings?.include_nearby_vets || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      lost_pet_settings: { ...settings.lost_pet_settings, include_nearby_vets: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Include Nearby Shelters</Label>
                  <Switch 
                    checked={settings.lost_pet_settings?.include_nearby_shelters || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      lost_pet_settings: { ...settings.lost_pet_settings, include_nearby_shelters: v }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Service Desk */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-600" /> Service Desk Integration
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
                    value={settings.service_desk?.default_priority || 'urgent'}
                    onValueChange={(v) => setSettings({
                      ...settings,
                      service_desk: { ...settings.service_desk, default_priority: v }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-Assign</Label>
                  <Switch 
                    checked={settings.service_desk?.auto_assign || true}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      service_desk: { ...settings.service_desk, auto_assign: v }
                    })}
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-red-600 hover:bg-red-700" onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmergencyManager;
