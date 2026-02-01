/**
 * Service Box - Admin Component
 * Full CRUD for all 87 services across 14 pillars
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  Briefcase, Search, Plus, Edit, Trash2, Copy, Save, X,
  Eye, EyeOff, DollarSign, Clock, MapPin, Check,
  RefreshCw, Loader2, Download, Sparkles, Calendar,
  Phone, PawPrint, ChevronDown
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// All pillars
const ALL_PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂' },
  { id: 'dine', name: 'Dine', icon: '🍽️' },
  { id: 'stay', name: 'Stay', icon: '🏨' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'care', name: 'Care', icon: '💊' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾' },
  { id: 'fit', name: 'Fit', icon: '🏃' },
  { id: 'learn', name: 'Learn', icon: '🎓' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄' },
  { id: 'advisory', name: 'Advisory', icon: '📋' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'farewell', name: 'Farewell', icon: '🌈' },
  { id: 'adopt', name: 'Adopt', icon: '🐾' },
  { id: 'shop', name: 'Shop', icon: '🛒' }
];

const CITIES = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'jaipur'];
const PET_SIZES = ['toy', 'small', 'medium', 'large', 'giant'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const ServiceBox = () => {
  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterBookable, setFilterBookable] = useState('');
  const [filterActive, setFilterActive] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: (page * limit).toString(),
        limit: limit.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterPillar) params.append('pillar', filterPillar);
      if (filterBookable) params.append('is_bookable', filterBookable);
      if (filterActive) params.append('is_active', filterActive);
      
      const response = await fetch(`${API_URL}/api/service-box/services?${params}`);
      const data = await response.json();
      
      setServices(data.services || []);
      setTotalServices(data.total || 0);
    } catch (err) {
      console.error('Error fetching services:', err);
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterPillar, filterBookable, filterActive]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/service-box/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStats();
  }, [fetchServices]);

  // Save service
  const saveService = async () => {
    if (!selectedService) return;
    
    setSaving(true);
    try {
      const isNew = !selectedService.id || selectedService.id.startsWith('NEW-');
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew 
        ? `${API_URL}/api/service-box/services`
        : `${API_URL}/api/service-box/services/${selectedService.id}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedService)
      });
      
      if (response.ok) {
        toast({ title: 'Saved!', description: 'Service saved successfully' });
        setShowEditor(false);
        fetchServices();
        fetchStats();
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to save', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error saving service:', err);
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle service status
  const toggleService = async (serviceId) => {
    try {
      const response = await fetch(`${API_URL}/api/service-box/services/${serviceId}/toggle`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({ title: data.is_active ? 'Activated' : 'Deactivated', description: 'Service status updated' });
        fetchServices();
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling:', err);
      toast({ title: 'Error', description: 'Failed to toggle', variant: 'destructive' });
    }
  };

  // Clone service
  const cloneService = async (serviceId) => {
    try {
      const response = await fetch(`${API_URL}/api/service-box/services/${serviceId}/clone`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Cloned!', description: 'Service cloned successfully' });
        setSelectedService(data.service);
        setShowEditor(true);
        fetchServices();
      }
    } catch (err) {
      console.error('Error cloning:', err);
      toast({ title: 'Error', description: 'Failed to clone', variant: 'destructive' });
    }
  };

  // Delete (archive) service
  const archiveService = async (serviceId) => {
    if (!confirm('Are you sure you want to archive this service?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/service-box/services/${serviceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Archived', description: 'Service archived' });
        fetchServices();
        fetchStats();
      }
    } catch (err) {
      console.error('Error archiving:', err);
      toast({ title: 'Error', description: 'Failed to archive', variant: 'destructive' });
    }
  };

  // Seed all services
  const seedAll = async () => {
    if (!confirm('This will seed/update all 87 services from the master list. Continue?')) return;
    
    setSeeding(true);
    try {
      const response = await fetch(`${API_URL}/api/service-box/seed-all`, { method: 'POST' });
      const data = await response.json();
      
      toast({ 
        title: 'Seed Complete!', 
        description: `Created: ${data.created}, Updated: ${data.updated}` 
      });
      
      fetchServices();
      fetchStats();
    } catch (err) {
      console.error('Error seeding:', err);
      toast({ title: 'Error', description: 'Seeding failed', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  // Export CSV
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/api/service-box/export`);
      const data = await response.json();
      const allServices = data.services || [];
      
      if (allServices.length === 0) {
        toast({ title: 'No Data', description: 'No services to export', variant: 'destructive' });
        return;
      }
      
      const headers = [
        'ID', 'Name', 'Pillar', 'Description', 'Bookable', 'Free', '24x7',
        'Base Price', 'Duration (min)', 'Deposit %', 'Active', 'Cities'
      ];
      
      const rows = allServices.map(s => [
        s.id || '',
        `"${(s.name || '').replace(/"/g, '""')}"`,
        s.pillar || '',
        `"${(s.description || '').replace(/"/g, '""').substring(0, 100)}"`,
        s.is_bookable ? 'Yes' : 'No',
        s.is_free ? 'Yes' : 'No',
        s.is_24x7 ? 'Yes' : 'No',
        s.base_price || 0,
        s.duration_minutes || '',
        s.deposit_percentage || 20,
        s.is_active !== false ? 'Yes' : 'No',
        `"${(s.available_cities || []).join(', ')}"`
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `services_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Exported!', description: `${allServices.length} services exported` });
    } catch (err) {
      console.error('Error exporting:', err);
      toast({ title: 'Error', description: 'Failed to export', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Create new service
  const createNewService = () => {
    setSelectedService({
      id: `NEW-${Date.now()}`,
      name: '',
      pillar: 'care',
      description: '',
      is_bookable: true,
      requires_consultation: false,
      is_free: false,
      is_24x7: false,
      base_price: 0,
      duration_minutes: 60,
      city_pricing: {},
      pet_size_pricing: {},
      pet_count_pricing: {},
      deposit_percentage: 20,
      payment_timing: 'configurable',
      available_cities: [],
      available_days: [],
      available_time_slots: [],
      includes: [],
      add_ons: [],
      image_url: '',
      paw_points_eligible: false,
      paw_points_value: 0,
      is_active: true
    });
    setShowEditor(true);
  };

  // Handle editor input changes
  const handleInputChange = (field, value) => {
    setSelectedService(prev => ({ ...prev, [field]: value }));
  };

  // Handle city pricing
  const handleCityPricing = (city, multiplier) => {
    setSelectedService(prev => ({
      ...prev,
      city_pricing: { ...prev.city_pricing, [city]: parseFloat(multiplier) || 1 }
    }));
  };

  // Handle pet size pricing
  const handleSizePricing = (size, multiplier) => {
    setSelectedService(prev => ({
      ...prev,
      pet_size_pricing: { ...prev.pet_size_pricing, [size]: parseFloat(multiplier) || 1 }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-purple-600" />
            Service Box
          </h2>
          <p className="text-gray-500 text-sm">Manage all {stats?.total || 87} services across 14 pillars</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={seedAll} 
            variant="outline" 
            disabled={seeding}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Seed All Pillars
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            disabled={exporting}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button onClick={createNewService} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
            <p className="text-xs text-gray-500">Total Services</p>
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-xs text-gray-500">Bookable</p>
            <p className="text-2xl font-bold text-blue-600">{stats.bookable}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-white">
            <p className="text-xs text-gray-500">Free</p>
            <p className="text-2xl font-bold text-amber-600">{stats.free}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-white">
            <p className="text-xs text-gray-500">Consultation</p>
            <p className="text-2xl font-bold text-pink-600">{stats.consultation_required}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-white">
            <p className="text-xs text-gray-500">24x7 Emergency</p>
            <p className="text-2xl font-bold text-red-600">{stats.emergency_24x7}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={filterPillar}
            onChange={(e) => setFilterPillar(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All Pillars</option>
            {ALL_PILLARS.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
          
          <select
            value={filterBookable}
            onChange={(e) => setFilterBookable(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="true">Bookable</option>
            <option value="false">Consultation Only</option>
          </select>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          
          <Button variant="ghost" onClick={() => { setSearchTerm(''); setFilterPillar(''); setFilterBookable(''); setFilterActive(''); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pillar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No services found. Try adjusting filters or seed services.
                  </td>
                </tr>
              ) : (
                services.map(service => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {service.image_url && (
                          <img src={service.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{service.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {service.pillar_icon || '📦'} {service.pillar_name || service.pillar}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {service.is_free ? (
                        <Badge className="bg-green-100 text-green-700">FREE</Badge>
                      ) : (
                        <span className="font-medium">₹{service.base_price || 0}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {service.duration_minutes ? (
                        <span className="text-sm text-gray-600">{service.duration_minutes} min</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {service.is_bookable ? (
                        <Badge className="bg-blue-100 text-blue-700">Bookable</Badge>
                      ) : service.requires_consultation ? (
                        <Badge className="bg-amber-100 text-amber-700">Consultation</Badge>
                      ) : service.is_24x7 ? (
                        <Badge className="bg-red-100 text-red-700">24x7</Badge>
                      ) : (
                        <Badge variant="outline">Info</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleService(service.id)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          service.is_active !== false
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {service.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedService(service); setShowEditor(true); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cloneService(service.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => archiveService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-500">
            Showing {page * limit + 1} - {Math.min((page + 1) * limit, totalServices)} of {totalServices}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= totalServices}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              {selectedService?.id?.startsWith('NEW-') ? 'Create Service' : 'Edit Service'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Service Name *</Label>
                  <Input
                    value={selectedService.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Basic Grooming"
                  />
                </div>
                
                <div>
                  <Label>Pillar *</Label>
                  <select
                    value={selectedService.pillar}
                    onChange={(e) => handleInputChange('pillar', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 bg-white"
                  >
                    {ALL_PILLARS.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Service ID</Label>
                  <Input
                    value={selectedService.id?.startsWith('NEW-') ? '(Auto-generated)' : selectedService.id}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedService.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Service description..."
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Image URL</Label>
                  <Input
                    value={selectedService.image_url || ''}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              {/* Service Type Flags */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Service Type</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedService.is_bookable}
                      onCheckedChange={(v) => handleInputChange('is_bookable', v)}
                    />
                    <Label className="text-sm">Bookable</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedService.requires_consultation}
                      onCheckedChange={(v) => handleInputChange('requires_consultation', v)}
                    />
                    <Label className="text-sm">Needs Consultation</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedService.is_free}
                      onCheckedChange={(v) => handleInputChange('is_free', v)}
                    />
                    <Label className="text-sm">Free Service</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedService.is_24x7}
                      onCheckedChange={(v) => handleInputChange('is_24x7', v)}
                    />
                    <Label className="text-sm">24x7 Emergency</Label>
                  </div>
                </div>
              </div>
              
              {/* Pricing */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Pricing</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Base Price (₹)</Label>
                    <Input
                      type="number"
                      value={selectedService.base_price || 0}
                      onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={selectedService.duration_minutes || ''}
                      onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || null)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Deposit %</Label>
                    <Input
                      type="number"
                      value={selectedService.deposit_percentage || 20}
                      onChange={(e) => handleInputChange('deposit_percentage', parseFloat(e.target.value) || 20)}
                    />
                  </div>
                </div>
                
                {/* City Pricing */}
                <div>
                  <Label className="text-xs">City Price Multipliers</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {CITIES.slice(0, 4).map(city => (
                      <div key={city} className="flex items-center gap-1">
                        <span className="text-xs capitalize w-20">{city}</span>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={selectedService.city_pricing?.[city] || ''}
                          onChange={(e) => handleCityPricing(city, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pet Size Pricing */}
                <div>
                  <Label className="text-xs">Pet Size Multipliers</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {PET_SIZES.map(size => (
                      <div key={size} className="flex items-center gap-1">
                        <span className="text-xs capitalize w-12">{size}</span>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={selectedService.pet_size_pricing?.[size] || ''}
                          onChange={(e) => handleSizePricing(size, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Includes */}
              <div>
                <Label className="text-xs">What's Included (comma separated)</Label>
                <Input
                  value={(selectedService.includes || []).join(', ')}
                  onChange={(e) => handleInputChange('includes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Bath, Blow dry, Nail trim..."
                />
              </div>
              
              {/* Rewards */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Paw Rewards</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedService.paw_points_eligible}
                      onCheckedChange={(v) => handleInputChange('paw_points_eligible', v)}
                    />
                    <Label className="text-sm">Paw Points Eligible</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Points Value</Label>
                    <Input
                      type="number"
                      value={selectedService.paw_points_value || 0}
                      onChange={(e) => handleInputChange('paw_points_value', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Switch
                  checked={selectedService.is_active !== false}
                  onCheckedChange={(v) => handleInputChange('is_active', v)}
                />
                <Label>Active (visible to customers)</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={saveService} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceBox;
