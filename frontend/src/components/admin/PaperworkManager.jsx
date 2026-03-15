import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import {
  FileText, Upload, Download, Search, RefreshCw, Plus, Edit, Trash2,
  Shield, Heart, Plane, Sparkles, Scale, Bell, Settings, Package,
  Loader2, CheckCircle, Clock, AlertCircle, PawPrint, Gift, Users,
  Folder, File, Eye, Calendar, TrendingUp, Briefcase
} from 'lucide-react';
import PillarServicesTab from './PillarServicesTab';

const CATEGORY_CONFIG = {
  identity: { name: 'Identity', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  medical: { name: 'Medical', icon: Heart, color: 'bg-red-100 text-red-700' },
  travel: { name: 'Travel', icon: Plane, color: 'bg-cyan-100 text-cyan-700' },
  insurance: { name: 'Insurance', icon: FileText, color: 'bg-emerald-100 text-emerald-700' },
  care: { name: 'Care', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  legal: { name: 'Legal', icon: Scale, color: 'bg-amber-100 text-amber-700' }
};

const PaperworkManager = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
    window.open(`${API_URL}/api/paperwork/admin/products/export-csv`, '_blank');
  };
  
  const exportBundlesCSV = () => {
    window.open(`${API_URL}/api/paperwork/admin/bundles/export-csv`, '_blank');
  };
  
  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportingProducts(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/paperwork/admin/products/import-csv`, formData, {
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
      const response = await axios.post(`${API_URL}/api/paperwork/admin/bundles/import-csv`, formData, {
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
      const res = await fetch(`${API_URL}/api/paperwork/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paperwork/products`);
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
      const res = await fetch(`${API_URL}/api/paperwork/bundles`);
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
      const res = await fetch(`${API_URL}/api/paperwork/admin/stats`);
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
      const res = await fetch(`${API_URL}/api/paperwork/admin/settings`);
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
      const res = await fetch(`${API_URL}/api/paperwork/requests/${requestId}`, {
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
      const res = await fetch(`${API_URL}/api/paperwork/admin/settings`, {
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

  // Document Vault State
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultStats, setVaultStats] = useState({});
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCategory, setVaultCategory] = useState('all');
  
  const fetchVaultDocuments = async () => {
    setVaultLoading(true);
    try {
      const params = new URLSearchParams();
      if (vaultSearch) params.append('search', vaultSearch);
      if (vaultCategory && vaultCategory !== 'all') params.append('category', vaultCategory);
      params.append('limit', '100');
      
      const res = await fetch(`${API_URL}/api/paperwork/admin/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVaultDocuments(data.documents || []);
        setVaultStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching vault documents:', error);
    } finally {
      setVaultLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'vault') {
      fetchVaultDocuments();
    }
  }, [activeTab, vaultSearch, vaultCategory]);

  const seedData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paperwork/admin/seed`, { method: 'POST' });
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.pet_name?.toLowerCase().includes(query) ||
        req.user_name?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="paperwork-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Paperwork Manager
          </h2>
          <p className="text-gray-500">Manage documents, requests, products, and settings</p>
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
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total_documents || 0}</p>
              <p className="text-xs text-blue-600">Documents</p>
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
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.pending_reminders || 0}</p>
              <p className="text-xs text-purple-600">Reminders</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.pets_with_documents || 0}</p>
              <p className="text-xs text-green-600">Pets w/ Docs</p>
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
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{stats.total_bundles || 0}</p>
              <p className="text-xs text-indigo-600">Bundles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Document Categories Breakdown */}
      {stats.by_category && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Documents by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(CATEGORY_CONFIG).map(([catId, config]) => {
              const Icon = config.icon;
              const count = stats.by_category?.[catId] || 0;
              return (
                <div key={catId} className={`p-3 rounded-lg ${config.color.split(' ')[0]}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                    <span className={`font-medium ${config.color.split(' ')[1]}`}>{config.name}</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-blue-50">
          <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="vault" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" /> Document Vault
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Document Vault Tab */}
        <TabsContent value="vault" className="mt-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search documents by pet name, owner..."
                    value={vaultSearch}
                    onChange={(e) => setVaultSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={vaultCategory}
                onChange={(e) => setVaultCategory(e.target.value)}
                className="border rounded-lg px-4 py-2"
              >
                <option value="all">All Categories</option>
                <option value="identity">Identity</option>
                <option value="medical">Medical</option>
                <option value="travel">Travel</option>
                <option value="insurance">Insurance</option>
                <option value="care">Care</option>
                <option value="legal">Legal</option>
              </select>
              <Button onClick={fetchVaultDocuments} variant="outline" disabled={vaultLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${vaultLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{vaultStats.total || 0}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              {Object.entries(vaultStats.by_category || {}).map(([cat, count]) => (
                <div key={cat} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-xs text-gray-500 capitalize">{cat}</p>
                </div>
              ))}
            </div>

            {/* Documents Table */}
            {vaultLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : vaultDocuments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Document</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pet</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Owner</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expiry</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vaultDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{doc.document_name}</p>
                              <p className="text-xs text-gray-500">{doc.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">{doc.category}</Badge>
                          {doc.subcategory && <span className="text-xs text-gray-400 ml-1">/ {doc.subcategory}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{doc.pet_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{doc.pet_breed}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{doc.owner_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{doc.owner_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {doc.document_date || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {doc.expiry_date ? (
                            <Badge className={new Date(doc.expiry_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                              {doc.expiry_date}
                            </Badge>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {doc.file_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(doc.file_url.startsWith('/') ? `${API_URL}${doc.file_url}` : doc.file_url, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Member documents will appear here once uploaded</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <Card className="p-4">
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
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Request ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Pet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{req.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{req.pet_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{req.user_name}</p>
                          <p className="text-xs text-gray-500">{req.user_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {req.request_type?.replace(/_/g, ' ')}
                          </Badge>
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
                              <SelectItem value="pending">Pending</SelectItem>
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
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No document requests found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Paperwork Products ({products.length})</h3>
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-50 rounded-lg mb-3 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-300" />
                  </div>
                  <Badge variant="outline" className="text-xs mb-2 capitalize">
                    {product.product_type}
                  </Badge>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-600">₹{product.price}</span>
                    {product.paw_reward_points > 0 && (
                      <span className="text-xs text-blue-600">🐾 {product.paw_reward_points}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
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
              <h3 className="font-semibold text-gray-900">Paperwork Bundles ({bundles.length})</h3>
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Bundle
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((bundle) => (
                <Card key={bundle.id} className={`p-4 border-2 ${bundle.is_premium ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                    {bundle.is_recommended && (
                      <Badge className="bg-green-500">Recommended</Badge>
                    )}
                    {bundle.is_premium && (
                      <Badge className="bg-blue-500">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bundle.description}</p>
                  {bundle.includes_service && (
                    <Badge variant="outline" className="text-blue-600 mb-2">
                      Includes {bundle.service_type?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-blue-600">₹{bundle.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                  </div>
                  {bundle.paw_reward_points > 0 && (
                    <p className="text-xs text-blue-600 mb-2">🐾 {bundle.paw_reward_points} Paw Points</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
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
            pillar="paperwork"
            pillarName="Paperwork"
            pillarIcon="📋"
            pillarColor="bg-blue-600"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Paw Rewards */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PawPrint className="w-5 h-5 text-blue-600" /> Paw Rewards
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
                  <Label>Points per Document Upload</Label>
                  <Input 
                    type="number"
                    value={settings.paw_rewards?.points_per_document_upload || 5}
                    onChange={(e) => setSettings({
                      ...settings,
                      paw_rewards: { ...settings.paw_rewards, points_per_document_upload: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Bonus for All Folders Complete</Label>
                  <Input 
                    type="number"
                    value={settings.paw_rewards?.bonus_points_all_folders_complete || 100}
                    onChange={(e) => setSettings({
                      ...settings,
                      paw_rewards: { ...settings.paw_rewards, bonus_points_all_folders_complete: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Birthday Perks */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-blue-600" /> Birthday Perks
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
                    value={settings.birthday_perks?.discount_percent || 15}
                    onChange={(e) => setSettings({
                      ...settings,
                      birthday_perks: { ...settings.birthday_perks, discount_percent: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Free Document Organization</Label>
                  <Switch 
                    checked={settings.birthday_perks?.free_document_organization || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      birthday_perks: { ...settings.birthday_perks, free_document_organization: v }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Reminders */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" /> Reminders
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminders</Label>
                  <Switch 
                    checked={settings.reminders?.enabled || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      reminders: { ...settings.reminders, enabled: v }
                    })}
                  />
                </div>
                <div>
                  <Label>Default Channel</Label>
                  <Select 
                    value={settings.reminders?.default_channel || 'email'}
                    onValueChange={(v) => setSettings({
                      ...settings,
                      reminders: { ...settings.reminders, default_channel: v }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="app">App Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Repeat Reminders</Label>
                  <Switch 
                    checked={settings.reminders?.repeat_reminders || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      reminders: { ...settings.reminders, repeat_reminders: v }
                    })}
                  />
                </div>
              </div>
            </Card>

            {/* Quick Access */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-blue-600" /> Quick Access Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable for Mira AI</Label>
                  <Switch 
                    checked={settings.quick_access?.enabled_for_mira || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      quick_access: { ...settings.quick_access, enabled_for_mira: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable for Concierge</Label>
                  <Switch 
                    checked={settings.quick_access?.enabled_for_concierge || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      quick_access: { ...settings.quick_access, enabled_for_concierge: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable for Travel</Label>
                  <Switch 
                    checked={settings.quick_access?.enabled_for_travel || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      quick_access: { ...settings.quick_access, enabled_for_travel: v }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable for Emergency</Label>
                  <Switch 
                    checked={settings.quick_access?.enabled_for_emergency || false}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      quick_access: { ...settings.quick_access, enabled_for_emergency: v }
                    })}
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaperworkManager;
