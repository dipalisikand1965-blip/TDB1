import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { API_URL } from '../utils/api';
import {
  Search, Plus, Edit, Trash2, Save, X, Image,
  ChevronLeft, ChevronRight, Filter, Download, Upload,
  RefreshCw, Eye, EyeOff, Copy, MoreVertical,
  Briefcase, DollarSign, Tag, Layers, Grid, List,
  ArrowUpDown, Check, AlertCircle, Loader2, Clock, MapPin
} from 'lucide-react';

// Pillar options
const PILLARS = [
  { value: 'care', label: 'Care' },
  { value: 'fit', label: 'Fit' },
  { value: 'stay', label: 'Stay' },
  { value: 'travel', label: 'Travel' },
  { value: 'dine', label: 'Dine' },
  { value: 'celebrate', label: 'Celebrate' },
  { value: 'enjoy', label: 'Enjoy' },
  { value: 'learn', label: 'Learn' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'paperwork', label: 'Paperwork' },
  { value: 'farewell', label: 'Farewell' },
  { value: 'adopt', label: 'Adopt' },
  { value: 'insure', label: 'Insure' }
];

// Service categories
const SERVICE_CATEGORIES = [
  { value: 'grooming', label: 'Grooming' },
  { value: 'training', label: 'Training' },
  { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'veterinary', label: 'Veterinary' },
  { value: 'photography', label: 'Photography' },
  { value: 'transport', label: 'Transport' },
  { value: 'sitting', label: 'Pet Sitting' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'party', label: 'Party & Events' },
  { value: 'memorial', label: 'Memorial' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' }
];

const ServiceManager = ({ credentials }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Edit state
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Create state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'grooming',
    pillar: 'care',
    duration: '60',
    location: 'at_home',
    image: '',
    tags: [],
    in_stock: true,
    mira_hint: ''
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/services?limit=1000`, {
        headers: { 'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      setError('Failed to fetch services');
    }
    setLoading(false);
  }, [credentials]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter services
  const filteredServices = services.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPillar = pillarFilter === 'all' || s.pillar === pillarFilter;
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesPillar && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle image upload
  const handleImageUpload = async (file, formType = 'edit') => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_URL}/api/upload/service-image`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (formType === 'edit') {
          setEditForm(prev => ({ ...prev, image: data.url }));
        } else {
          setCreateForm(prev => ({ ...prev, image: data.url }));
        }
      } else {
        // Fallback: if upload endpoint doesn't exist, show message
        alert('Image upload endpoint not configured. Please paste image URL instead.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    }
    setUploadingImage(false);
  };

  // Create service
  const handleCreate = async () => {
    setSaving(true);
    try {
      const serviceData = {
        ...createForm,
        id: `svc-${Date.now()}`,
        price: parseFloat(createForm.price) || 0,
        duration: parseInt(createForm.duration) || 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        },
        body: JSON.stringify(serviceData)
      });

      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({
          name: '', description: '', price: '', category: 'grooming',
          pillar: 'care', duration: '60', location: 'at_home',
          image: '', tags: [], in_stock: true, mira_hint: ''
        });
        fetchServices();
      }
    } catch (err) {
      setError('Failed to create service');
    }
    setSaving(false);
  };

  // Update service
  const handleUpdate = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/services/${editingService}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price) || 0,
          duration: parseInt(editForm.duration) || 60,
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setEditingService(null);
        fetchServices();
      }
    } catch (err) {
      setError('Failed to update service');
    }
    setSaving(false);
  };

  // Delete service
  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}` }
      });

      if (res.ok) {
        fetchServices();
      }
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  // Start editing
  const startEdit = (service) => {
    setEditingService(service.id);
    setEditForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      category: service.category || 'grooming',
      pillar: service.pillar || 'care',
      duration: service.duration || '60',
      location: service.location || 'at_home',
      image: service.image || '',
      tags: service.tags || [],
      in_stock: service.in_stock !== false,
      mira_hint: service.mira_hint || ''
    });
  };

  // Service card component
  const ServiceCard = ({ service }) => {
    const isEditing = editingService === service.id;
    
    return (
      <Card className="p-4 bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all">
        {isEditing ? (
          // Edit mode
          <div className="space-y-3">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Service name"
              className="bg-gray-800 border-gray-700"
            />
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="bg-gray-800 border-gray-700"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-400">Price (₹)</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Duration (min)</Label>
                <Input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editForm.pillar}
                onChange={(e) => setEditForm({ ...editForm, pillar: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-md p-2 text-sm"
              >
                {PILLARS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-md p-2 text-sm"
              >
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="Paste URL or upload"
                  className="bg-gray-800 border-gray-700 flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files[0], 'edit')}
                  />
                  <Button variant="outline" size="sm" disabled={uploadingImage} asChild>
                    <span>{uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                  </Button>
                </label>
              </div>
              {editForm.image && (
                <img src={editForm.image} alt="" className="mt-2 w-full h-20 object-cover rounded" />
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-400">Mira Hint (AI Assistant)</Label>
              <Textarea
                value={editForm.mira_hint}
                onChange={(e) => setEditForm({ ...editForm, mira_hint: e.target.value })}
                placeholder="Help Mira recommend this service..."
                rows={2}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.in_stock}
                onCheckedChange={(v) => setEditForm({ ...editForm, in_stock: v })}
              />
              <Label className="text-sm">Available</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditingService(null)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          // View mode
          <>
            <div className="flex items-start gap-3">
              {service.image ? (
                <img src={service.image} alt="" className="w-16 h-16 rounded object-cover" />
              ) : (
                <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{service.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{service.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {service.pillar || 'care'}
                </Badge>
                <span className="text-purple-400 font-semibold">
                  ₹{service.price || 0}
                </span>
                {service.duration && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {service.duration}min
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(service)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6" data-testid="service-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Manager</h2>
          <p className="text-gray-400">{services.length} services total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-10 bg-gray-900 border-gray-700"
          />
        </div>
        <select
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-md p-2 text-sm"
        >
          <option value="all">All Pillars</option>
          {PILLARS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-md p-2 text-sm"
        >
          <option value="all">All Categories</option>
          {SERVICE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div className="flex gap-1 border border-gray-700 rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-sm">Total Services</p>
          <p className="text-2xl font-bold">{services.length}</p>
        </Card>
        <Card className="p-4 bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {services.filter(s => s.in_stock !== false).length}
          </p>
        </Card>
        <Card className="p-4 bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-sm">Categories</p>
          <p className="text-2xl font-bold">
            {new Set(services.map(s => s.category)).size}
          </p>
        </Card>
        <Card className="p-4 bg-gray-900 border-gray-800">
          <p className="text-gray-400 text-sm">Pillars</p>
          <p className="text-2xl font-bold">
            {new Set(services.map(s => s.pillar)).size}
          </p>
        </Card>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6 bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Service</h3>
            <div className="space-y-4">
              <div>
                <Label>Service Name</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Premium Grooming Package"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe the service..."
                  rows={3}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    placeholder="1500"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={createForm.duration}
                    onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                    placeholder="60"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pillar</Label>
                  <select
                    value={createForm.pillar}
                    onChange={(e) => setCreateForm({ ...createForm, pillar: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
                  >
                    {PILLARS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
                  >
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={createForm.image}
                    onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
                    placeholder="Paste image URL or upload"
                    className="bg-gray-800 border-gray-700 flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'create')}
                    />
                    <Button variant="outline" size="sm" disabled={uploadingImage} asChild>
                      <span>{uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                    </Button>
                  </label>
                </div>
                {createForm.image && (
                  <img src={createForm.image} alt="" className="mt-2 w-full h-32 object-cover rounded" />
                )}
              </div>
              <div>
                <Label>Mira Hint (AI Recommendation)</Label>
                <Textarea
                  value={createForm.mira_hint}
                  onChange={(e) => setCreateForm({ ...createForm, mira_hint: e.target.value })}
                  placeholder="Help Mira understand when to recommend this service..."
                  rows={2}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={createForm.in_stock}
                  onCheckedChange={(v) => setCreateForm({ ...createForm, in_stock: v })}
                />
                <Label>Available for booking</Label>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || !createForm.name}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Service
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Services Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
          }>
            {paginatedServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;
