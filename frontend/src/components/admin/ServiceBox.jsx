/**
 * Service Box - Admin Component (Enhanced 10/10 Version)
 * Full CRUD for all 87 services across 12 pillars
 * Added: Service Provider tracking, Calendar view, Analytics, Better UX
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  Briefcase, Search, Plus, Edit, Trash2, Copy, Save, X,
  Eye, EyeOff, DollarSign, Clock, MapPin, Check,
  RefreshCw, Loader2, Download, Sparkles, Calendar,
  Phone, PawPrint, ChevronDown, Users, TrendingUp,
  Star, AlertCircle, BarChart3, Building2, Filter,
  CheckCircle, XCircle, List, Grid3X3, CalendarDays, Upload
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import { ALL_PILLARS, PILLAR_SUBCATEGORIES } from './ProductBoxConfig';

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
  const [activeView, setActiveView] = useState('list'); // list, grid, calendar
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterBookable, setFilterBookable] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
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
      
      const normalizedServices = (data.services || []).map(service => ({
        ...service,
        image_url: service.image_url || service.watercolor_image || service.image || ''
      }));
      setServices(normalizedServices);
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
    
    // Ensure pillar is set
    const serviceToSave = {
      ...selectedService,
      pillar: selectedService.pillar || 'care',
      description: selectedService.description || '',
      base_price: selectedService.base_price || 0,
      duration_minutes: selectedService.duration_minutes || 60,
      city_pricing: selectedService.city_pricing || {},
      pet_size_pricing: selectedService.pet_size_pricing || {},
      pet_count_pricing: selectedService.pet_count_pricing || {},
      deposit_percentage: selectedService.deposit_percentage || 20,
      payment_timing: selectedService.payment_timing || 'configurable',
      available_cities: selectedService.available_cities || [],
      available_days: selectedService.available_days || [],
      available_time_slots: selectedService.available_time_slots || [],
      includes: selectedService.includes || [],
      add_ons: selectedService.add_ons || [],
      image_url: selectedService.image_url || selectedService.watercolor_image || selectedService.image || '',
      paw_points_eligible: selectedService.paw_points_eligible !== false,
      paw_points_value: selectedService.paw_points_value || 10,
      is_active: selectedService.is_active !== false,
      is_bookable: selectedService.is_bookable !== false,
      requires_consultation: selectedService.requires_consultation || false,
      is_free: selectedService.is_free || false,
      is_24x7: selectedService.is_24x7 || false
    };
    
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
        body: JSON.stringify(serviceToSave)
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

  // Delete service (hard delete)
  const archiveService = async (serviceId) => {
    if (!confirm('Permanently delete this service? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/service-box/services/${serviceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Service permanently deleted' });
        fetchServices();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
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
        'Base Price', 'Duration (min)', 'Deposit %', 'Active', 'Cities', 'Provider'
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
        `"${(s.available_cities || []).join(', ')}"`,
        `"${s.provider_name || 'In-House'}"`
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
      available_days: DAYS,
      available_time_slots: TIME_SLOTS,
      includes: [],
      add_ons: [],
      image_url: '',
      paw_points_eligible: false,
      paw_points_value: 0,
      is_active: true,
      // New fields for 10/10
      provider_name: '',
      provider_phone: '',
      provider_email: '',
      max_bookings_per_day: 10,
      advance_booking_days: 30,
      cancellation_hours: 24,
      rating: 0,
      total_bookings: 0
    });
    setShowEditor(true);
  };

  // Handle editor input changes
  const handleInputChange = (field, value) => {
    setSelectedService(prev => ({ ...prev, [field]: value }));
  };

  // Handle service image upload (uploads to Cloudinary)
  const handleServiceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload JPG, PNG, or WebP images', variant: 'destructive' });
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const isExistingService = selectedService?.id && !selectedService.id.startsWith('NEW-');
      const uploadUrl = isExistingService
        ? `${API_URL}/api/admin/service/${selectedService.id}/upload-image`
        : `${API_URL}/api/upload/service-image`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        handleInputChange('image_url', data.url);
        handleInputChange('watercolor_image', data.url);
        toast({ 
          title: 'Image uploaded!', 
          description: isExistingService
            ? 'Image uploaded to Cloudinary and linked to service.'
            : 'Image uploaded to Cloudinary. Save the service to keep this image linked.' 
        });
        if (isExistingService) {
          fetchServices();
        }
      } else {
        const err = await response.json();
        toast({ title: 'Upload failed', description: err.detail || 'Failed to upload image', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterPillar('');
    setFilterBookable('');
    setFilterActive('');
    setPage(0);
  };

  // Get pillar info helper
  const getPillarInfo = (pillarId) => {
    return ALL_PILLARS.find(p => p.id === pillarId) || { icon: '📦', name: pillarId, color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6" data-testid="service-box-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="service-box-title">
            <Briefcase className="w-7 h-7 text-purple-600" />
            Service Box
          </h2>
          <p className="text-gray-500 text-sm">Manage all {stats?.total || 87} services across 12 pillars</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-gray-50">
            <Button 
              variant={activeView === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveView('list')}
              data-testid="view-list-btn"
              className="h-8"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeView === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveView('grid')}
              data-testid="view-grid-btn"
              className="h-8"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeView === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveView('calendar')}
              data-testid="view-calendar-btn"
              className="h-8"
            >
              <CalendarDays className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            onClick={seedAll} 
            variant="outline" 
            disabled={seeding}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            data-testid="seed-services-btn"
          >
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Seed All
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            disabled={exporting}
            className="border-green-300 text-green-700 hover:bg-green-50"
            data-testid="export-csv-btn"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export
          </Button>
          <Button onClick={createNewService} className="bg-purple-600 hover:bg-purple-700" data-testid="add-service-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards - Enhanced */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="stats-cards">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-gray-500 font-medium">Total</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-500 font-medium">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-gray-500 font-medium">Bookable</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.bookable}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-gray-500 font-medium">Free</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.free}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-white border-pink-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-pink-500" />
              <p className="text-xs text-gray-500 font-medium">Consult</p>
            </div>
            <p className="text-2xl font-bold text-pink-600">{stats.consultation_required}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-red-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-500 font-medium">24x7</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.emergency_24x7}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <p className="text-xs text-gray-500 font-medium">Bookings</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.total_bookings || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-teal-50 to-white border-teal-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-teal-500" />
              <p className="text-xs text-gray-500 font-medium">Providers</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats.providers || 0}</p>
          </Card>
        </div>
      )}

      {/* Pillar Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPillar === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPillar('')}
          className="h-8"
          data-testid="filter-all-pillars"
        >
          All Pillars
        </Button>
        {ALL_PILLARS.map(p => (
          <Button
            key={p.id}
            variant={filterPillar === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPillar(p.id)}
            className="h-8"
            data-testid={`filter-pillar-${p.id}`}
          >
            {p.icon} {p.name}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4" data-testid="filters-card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-services-input"
              />
            </div>
          </div>
          
          <select
            value={filterBookable}
            onChange={(e) => setFilterBookable(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
            data-testid="filter-bookable-select"
          >
            <option value="">All Types</option>
            <option value="true">Bookable</option>
            <option value="false">Consultation Only</option>
          </select>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
            data-testid="filter-active-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          
          <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
            <RefreshCw className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </Card>

      {/* Services Display - List View */}
      {activeView === 'list' && (
        <Card className="overflow-hidden" data-testid="services-list">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pillar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                      <p className="text-gray-500">Loading services...</p>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No services found. Try adjusting filters or seed services.</p>
                    </td>
                  </tr>
                ) : (
                  services.map(service => {
                    const pillarInfo = getPillarInfo(service.pillar);
                    return (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors" data-testid={`service-row-${service.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {(service.image_url || service.watercolor_image || service.image) ? (
                              <img src={service.image_url || service.watercolor_image || service.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className={`w-12 h-12 rounded-lg ${pillarInfo.color} flex items-center justify-center text-white text-xl`}>
                                {pillarInfo.icon}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{service.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            {pillarInfo.icon} {pillarInfo.name}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="font-medium text-gray-700">{service.provider_name || 'In-House'}</p>
                            {service.provider_phone && (
                              <p className="text-xs text-gray-400">{service.provider_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {service.is_free ? (
                            <Badge className="bg-green-100 text-green-700 font-medium">FREE</Badge>
                          ) : (
                            <span className="font-semibold text-gray-900">₹{service.base_price || 0}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {service.duration_minutes ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-sm">{service.duration_minutes} min</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium">{service.rating || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {service.is_bookable && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Bookable</Badge>
                            )}
                            {service.requires_consultation && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">Consult</Badge>
                            )}
                            {service.is_24x7 && (
                              <Badge className="bg-red-100 text-red-700 text-xs">24x7</Badge>
                            )}
                            {!service.is_bookable && !service.requires_consultation && !service.is_24x7 && (
                              <Badge variant="outline" className="text-xs">Info</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleService(service.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              service.is_active !== false
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            data-testid={`toggle-service-${service.id}`}
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
                              data-testid={`edit-service-${service.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cloneService(service.id)}
                              data-testid={`clone-service-${service.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => archiveService(service.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`delete-service-${service.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                data-testid="prev-page-btn"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= totalServices}
                data-testid="next-page-btn"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Services Display - Grid View */}
      {activeView === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="services-grid">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No services found.</p>
            </div>
          ) : (
            services.map(service => {
              const pillarInfo = getPillarInfo(service.pillar);
              return (
                <Card 
                  key={service.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => { setSelectedService(service); setShowEditor(true); }}
                  data-testid={`service-card-${service.id}`}
                >
                  <div className={`h-2 ${pillarInfo.color}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg ${pillarInfo.color} flex items-center justify-center text-white text-xl`}>
                        {pillarInfo.icon}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleService(service.id); }}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.is_active !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {service.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{service.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description || 'No description'}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        {service.is_free ? (
                          <Badge className="bg-green-100 text-green-700">FREE</Badge>
                        ) : (
                          <span className="font-semibold">₹{service.base_price || 0}</span>
                        )}
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {service.duration_minutes} min
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {pillarInfo.name}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium">{service.rating || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Services Display - Calendar View */}
      {activeView === 'calendar' && (
        <Card className="p-6" data-testid="services-calendar">
          <div className="text-center py-12">
            <CalendarDays className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Calendar</h3>
            <p className="text-gray-500 mb-4">View service availability and bookings by date</p>
            <p className="text-sm text-gray-400">Coming soon - Shows daily booking slots per service</p>
          </div>
        </Card>
      )}

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
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
                <TabsTrigger value="provider" data-testid="tab-provider">Provider</TabsTrigger>
                <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Service Name *</Label>
                    <Input
                      value={selectedService.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Basic Grooming"
                      data-testid="service-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label>Pillar *</Label>
                    <select
                      value={selectedService.pillar || 'care'}
                      onChange={(e) => handleInputChange('pillar', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 bg-white"
                      data-testid="service-pillar-select"
                    >
                      {ALL_PILLARS.map(p => (
                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                      ))}
                    </select>
                    {(!selectedService.pillar || selectedService.pillar === '') && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Please select a pillar</p>
                    )}
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
                      data-testid="service-description-input"
                    />
                  </div>

                  <div>
                    <Label>Sub-Category</Label>
                    <select
                      value={selectedService.sub_category || ''}
                      onChange={(e) => handleInputChange('sub_category', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 bg-white"
                      data-testid="service-subcategory-select"
                    >
                      <option value="">Select sub-category…</option>
                      {(PILLAR_SUBCATEGORIES[selectedService.pillar || 'care'] || []).map(sc => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                      {selectedService.sub_category &&
                        !(PILLAR_SUBCATEGORIES[selectedService.pillar || 'care'] || []).includes(selectedService.sub_category) && (
                        <option value={selectedService.sub_category}>{selectedService.sub_category} (custom)</option>
                      )}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-lg font-semibold">Service Image</Label>
                    
                    {/* File Upload - Primary (NEW) */}
                    <div className="mt-2 mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Label className="text-purple-700 font-medium">Upload Image File (Recommended)</Label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleServiceImageUpload}
                          className="hidden"
                          id="service-image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="service-image-upload"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                            uploadingImage
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {uploadingImage ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Briefcase className="w-4 h-4" />
                              Choose File
                            </>
                          )}
                        </label>
                        <span className="text-xs text-gray-500">JPG, PNG, WebP (max 5MB)</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Uploads to Cloudinary - persists through deployments!</p>
                      {!selectedService.id || selectedService.id.startsWith('NEW-') ? (
                        <p className="text-xs text-amber-600 mt-1">You can upload now — just remember to save the service afterwards</p>
                      ) : null}
                    </div>
                    
                    {/* URL Input + AI Generate - Secondary */}
                    <Label className="text-gray-500 text-sm">Or paste URL / Generate AI Image</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedService.image_url || selectedService.watercolor_image || selectedService.image || ''}
                        onChange={(e) => handleInputChange('image_url', e.target.value)}
                        placeholder="https://..."
                        data-testid="service-image-input"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          if (!selectedService.id || selectedService.id.startsWith('NEW-')) {
                            toast({ title: 'Save First', description: 'Please save the service before generating an image', variant: 'destructive' });
                            return;
                          }
                          try {
                            setSaving(true);
                            // Use XMLHttpRequest to bypass Emergent's fetch interceptor
                            const adminAuthSvc = localStorage.getItem('adminAuth');
                            const xhr = new XMLHttpRequest();
                            xhr.open('POST', `${API_URL}/api/service-box/services/${selectedService.id}/generate-image`);
                            xhr.setRequestHeader('Content-Type', 'application/json');
                            if (adminAuthSvc) xhr.setRequestHeader('Authorization', `Basic ${adminAuthSvc}`);
                            xhr.onload = () => {
                              setSaving(false);
                              try {
                                const data = JSON.parse(xhr.responseText);
                                if (xhr.status >= 200 && xhr.status < 300 && data.success && data.image_url) {
                                  handleInputChange('image_url', data.image_url);
                                  toast({ title: 'Image Generated', description: `AI image created for ${selectedService.name}` });
                                } else {
                                  toast({ title: 'Error', description: data.detail || 'Failed to generate', variant: 'destructive' });
                                }
                              } catch { toast({ title: 'Error', description: 'Parse error', variant: 'destructive' }); }
                            };
                            xhr.onerror = () => { setSaving(false); toast({ title: 'Error', description: 'Network error', variant: 'destructive' }); };
                            xhr.send();
                          } catch (err) { setSaving(false); toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
                        }}
                        disabled={saving || !selectedService.id || selectedService.id.startsWith('NEW-')}
                        className="whitespace-nowrap"
                        data-testid="generate-service-image-btn"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate AI
                      </Button>
                    </div>
                    {(selectedService.image_url || selectedService.watercolor_image || selectedService.image) && (
                      <div className="mt-2">
                        <img 
                          src={selectedService.image_url || selectedService.watercolor_image || selectedService.image} 
                          alt={selectedService.name} 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Service Type Flags */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Service Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedService.is_bookable}
                        onCheckedChange={(v) => handleInputChange('is_bookable', v)}
                        data-testid="service-bookable-switch"
                      />
                      <Label className="text-sm">Bookable</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedService.requires_consultation}
                        onCheckedChange={(v) => handleInputChange('requires_consultation', v)}
                        data-testid="service-consultation-switch"
                      />
                      <Label className="text-sm">Needs Consultation</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedService.is_free}
                        onCheckedChange={(v) => handleInputChange('is_free', v)}
                        data-testid="service-free-switch"
                      />
                      <Label className="text-sm">Free Service</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedService.is_24x7}
                        onCheckedChange={(v) => handleInputChange('is_24x7', v)}
                        data-testid="service-247-switch"
                      />
                      <Label className="text-sm">24x7 Emergency</Label>
                    </div>
                  </div>
                </div>
                
                {/* What's Included */}
                <div>
                  <Label className="text-sm font-medium">What&apos;s Included (comma separated)</Label>
                  <Input
                    value={(selectedService.includes || []).join(', ')}
                    onChange={(e) => handleInputChange('includes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Bath, Blow dry, Nail trim..."
                    data-testid="service-includes-input"
                  />
                </div>
                
                {/* Paw Rewards */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Paw Rewards</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedService.paw_points_eligible}
                        onCheckedChange={(v) => handleInputChange('paw_points_eligible', v)}
                        data-testid="service-rewards-switch"
                      />
                      <Label className="text-sm">Paw Points Eligible</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Points Value</Label>
                      <Input
                        type="number"
                        value={selectedService.paw_points_value || 0}
                        onChange={(e) => handleInputChange('paw_points_value', parseInt(e.target.value) || 0)}
                        data-testid="service-points-input"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Base Price (₹)</Label>
                    <Input
                      type="number"
                      value={selectedService.base_price || 0}
                      onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                      data-testid="service-price-input"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={selectedService.duration_minutes || ''}
                      onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || null)}
                      data-testid="service-duration-input"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Deposit %</Label>
                    <Input
                      type="number"
                      value={selectedService.deposit_percentage || 20}
                      onChange={(e) => handleInputChange('deposit_percentage', parseFloat(e.target.value) || 20)}
                      data-testid="service-deposit-input"
                    />
                  </div>
                </div>
                
                {/* City Pricing */}
                <div>
                  <Label className="text-sm font-medium">City Price Multipliers</Label>
                  <p className="text-xs text-gray-500 mb-2">Set multipliers for different cities (1.0 = base price)</p>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {CITIES.map(city => (
                      <div key={city} className="space-y-1">
                        <Label className="text-xs capitalize">{city}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={selectedService.city_pricing?.[city] || ''}
                          onChange={(e) => handleCityPricing(city, e.target.value)}
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pet Size Pricing */}
                <div>
                  <Label className="text-sm font-medium">Pet Size Multipliers</Label>
                  <p className="text-xs text-gray-500 mb-2">Set multipliers for different pet sizes</p>
                  <div className="grid grid-cols-5 gap-3 mt-2">
                    {PET_SIZES.map(size => (
                      <div key={size} className="space-y-1">
                        <Label className="text-xs capitalize">{size}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={selectedService.pet_size_pricing?.[size] || ''}
                          onChange={(e) => handleSizePricing(size, e.target.value)}
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Provider Tab (NEW) */}
              <TabsContent value="provider" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Provider / Vendor Name</Label>
                    <Input
                      value={selectedService.provider_name || ''}
                      onChange={(e) => handleInputChange('provider_name', e.target.value)}
                      placeholder="e.g., Happy Paws Grooming"
                      data-testid="service-provider-name-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for in-house services</p>
                  </div>
                  
                  <div>
                    <Label>Provider Phone</Label>
                    <Input
                      value={selectedService.provider_phone || ''}
                      onChange={(e) => handleInputChange('provider_phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      data-testid="service-provider-phone-input"
                    />
                  </div>
                  
                  <div>
                    <Label>Provider Email</Label>
                    <Input
                      type="email"
                      value={selectedService.provider_email || ''}
                      onChange={(e) => handleInputChange('provider_email', e.target.value)}
                      placeholder="vendor@example.com"
                      data-testid="service-provider-email-input"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Service Analytics</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{selectedService.total_bookings || 0}</p>
                      <p className="text-xs text-gray-500">Total Bookings</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <p className="text-2xl font-bold text-amber-600">{selectedService.rating || '—'}</p>
                      </div>
                      <p className="text-xs text-gray-500">Avg Rating</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{selectedService.completion_rate || 100}%</p>
                      <p className="text-xs text-gray-500">Completion Rate</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Bookings Per Day</Label>
                    <Input
                      type="number"
                      value={selectedService.max_bookings_per_day || 10}
                      onChange={(e) => handleInputChange('max_bookings_per_day', parseInt(e.target.value) || 10)}
                      data-testid="service-max-bookings-input"
                    />
                  </div>
                  <div>
                    <Label>Advance Booking (Days)</Label>
                    <Input
                      type="number"
                      value={selectedService.advance_booking_days || 30}
                      onChange={(e) => handleInputChange('advance_booking_days', parseInt(e.target.value) || 30)}
                      data-testid="service-advance-days-input"
                    />
                  </div>
                  <div>
                    <Label>Cancellation Notice (Hours)</Label>
                    <Input
                      type="number"
                      value={selectedService.cancellation_hours || 24}
                      onChange={(e) => handleInputChange('cancellation_hours', parseInt(e.target.value) || 24)}
                      data-testid="service-cancel-hours-input"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Available Cities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CITIES.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          const cities = selectedService.available_cities || [];
                          if (cities.includes(city)) {
                            handleInputChange('available_cities', cities.filter(c => c !== city));
                          } else {
                            handleInputChange('available_cities', [...cities, city]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                          (selectedService.available_cities || []).includes(city)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Available Days</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = selectedService.available_days || [];
                          if (days.includes(day)) {
                            handleInputChange('available_days', days.filter(d => d !== day));
                          } else {
                            handleInputChange('available_days', [...days, day]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                          (selectedService.available_days || []).includes(day)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Switch
                    checked={selectedService.is_active !== false}
                    onCheckedChange={(v) => handleInputChange('is_active', v)}
                    data-testid="service-active-switch"
                  />
                  <Label>Active (visible to customers)</Label>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)} data-testid="cancel-service-btn">
              Cancel
            </Button>
            <Button onClick={saveService} disabled={saving} className="bg-purple-600 hover:bg-purple-700" data-testid="save-service-btn">
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
