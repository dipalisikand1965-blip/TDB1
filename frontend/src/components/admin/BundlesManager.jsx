/**
 * BundlesManager.jsx
 * Admin component for managing Curated Bundles
 * Allows creating, editing, and deleting product bundles
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Package, Plus, Edit2, Trash2, Save, X, Loader2, Upload,
  Gift, Star, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Image,
  Search, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { ALL_PILLARS, PILLAR_SUBCATEGORIES } from './ProductBoxConfig';

const PILLARS = ALL_PILLARS;
import { toast } from '../../hooks/use-toast';
import CloudinaryUploader from './CloudinaryUploader';
import AIImagePromptField from './AIImagePromptField';

const BUNDLE_ICONS = ['📦', '🎁', '🎂', '🍽️', '✈️', '🏠', '🛁', '💪', '🎾', '📚', '🌈', '🚨', '🐕', '💡', '📋', '🚗', '🦴', '🚶', '⭐'];

const BundlesManager = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBundles, setTotalBundles] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingModalImage, setGeneratingModalImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pillar: 'celebrate',
    items: '',
    original_price: '',
    bundle_price: '',
    icon: '📦',
    popular: false,
    active: true
  });
  
  useEffect(() => {
    setPage(1);
    fetchBundles(1);
  }, [selectedPillar]);
  
  const fetchBundles = async (pageNum = page) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/bundles?active_only=false&page=${pageNum}&limit=30`;
      if (selectedPillar !== 'all') url += `&pillar=${selectedPillar}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || []);
        setTotalBundles(data.total || (data.bundles || []).length);
        setTotalPages(data.pages || 1);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast({ title: "Error", description: "Failed to load bundles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const seedDefaults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bundles/seed-defaults`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message
        });
        fetchBundles(1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed bundles",
        variant: "destructive"
      });
    }
  };
  
  const syncToProduction = async () => {
    try {
      toast({
        title: "Syncing...",
        description: "Syncing bundles to production"
      });
      
      const response = await fetch(`${API_URL}/api/bundles/sync-to-production`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.success ? "Sync Complete" : "Sync Issue",
          description: data.message,
          variant: data.success ? "default" : "destructive"
        });
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const getAdminAuth = () => {
    let auth = localStorage.getItem('adminAuth');
    if (!auth) {
      const sessionAuth = sessionStorage.getItem('admin_authenticated');
      if (sessionAuth === 'true') {
        const u = sessionStorage.getItem('admin_username') || 'aditya';
        auth = btoa(`${u}:lola4304`);
      }
    }
    return auth;
  };

  const generateBundleImage = async (bundleId) => {
    try {
      toast({ title: "Generating...", description: "Creating AI watercolor image for bundle" });
      const adminAuth = getAdminAuth();
      const response = await fetch(`${API_URL}/api/admin/bundles/${bundleId}/generate-image`, {
        method: 'POST',
        headers: { ...(adminAuth ? { 'Authorization': `Basic ${adminAuth}` } : {}) }
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (data.success) {
        toast({ title: "Image Generated!", description: "Watercolor illustration ready" });
        fetchBundles(page);
      } else {
        throw new Error(data.detail || data.message || 'Generation failed');
      }
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleModalGenerateImage = async () => {
    if (!editingBundle?.id) {
      toast({ title: 'Save bundle first', description: 'Bundle must exist before generating an AI image', variant: 'destructive' });
      return;
    }
    setGeneratingModalImage(true);
    try {
      const adminAuth = getAdminAuth();
      const response = await fetch(`${API_URL}/api/admin/bundles/${editingBundle.id}/generate-image`, {
        method: 'POST',
        headers: { ...(adminAuth ? { 'Authorization': `Basic ${adminAuth}` } : {}) }
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (data.success && data.image_url) {
        setFormData(prev => ({ ...prev, image_url: data.image_url }));
        toast({ title: 'AI Image Generated!', description: 'Watercolor illustration saved to Cloudinary' });
      } else {
        toast({ title: 'Generation failed', description: data.detail || data.message || 'Unknown error', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingModalImage(false);
    }
  };

  const handleModalUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/bundle-image`, { method: 'POST', body: fd });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.url) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
        toast({ title: 'Image uploaded!' });
      } else {
        toast({ title: 'Upload failed', description: data.detail || 'Unknown error', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  };
  
  const generateAllImages = async () => {
    try {
      toast({
        title: "Generating All Images...",
        description: "This may take a few minutes"
      });
      
      const response = await fetch(`${API_URL}/api/bundles/generate-all-images`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Complete!",
          description: `Generated ${data.generated} images`
        });
        fetchBundles(page);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const openCreateModal = () => {
    setEditingBundle(null);
    setFormData({
      name: '',
      description: '',
      pillar: selectedPillar !== 'all' ? selectedPillar : 'celebrate',
      sub_category: '',
      items: '',
      original_price: '',
      bundle_price: '',
      icon: '📦',
      popular: false,
      active: true
    });
    setShowModal(true);
  };
  
  const openEditModal = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description,
      pillar: bundle.pillar,
      sub_category: bundle.sub_category || '',
      items: bundle.items?.join(', ') || '',
      original_price: bundle.original_price?.toString() || '',
      bundle_price: bundle.bundle_price?.toString() || '',
      icon: bundle.icon || '📦',
      popular: bundle.popular || false,
      active: bundle.active !== false
    });
    setShowModal(true);
  };
  
  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.pillar || !formData.original_price || !formData.bundle_price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        pillar: formData.pillar,
        sub_category: formData.sub_category || '',
        items: formData.items.split(',').map(item => item.trim()).filter(Boolean),
        original_price: parseFloat(formData.original_price),
        bundle_price: parseFloat(formData.bundle_price),
        icon: formData.icon,
        popular: formData.popular,
        active: formData.active
      };
      
      let response;
      if (editingBundle) {
        // Update existing bundle
        response = await fetch(`${API_URL}/api/bundles/${editingBundle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new bundle
        response = await fetch(`${API_URL}/api/bundles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (response.ok) {
        toast({
          title: "Success",
          description: editingBundle ? "Bundle updated!" : "Bundle created!"
        });
        setShowModal(false);
        fetchBundles(page);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save bundle');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async (bundle) => {
    if (!window.confirm(`Are you sure you want to delete "${bundle.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/bundles/${bundle.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: "Deleted", description: "Bundle has been deactivated" });
        fetchBundles(page);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (bundle) => {
    const newActive = !(bundle.is_active !== false);
    try {
      const response = await fetch(`${API_URL}/api/bundles/${bundle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bundle, is_active: newActive })
      });
      if (response.ok) {
        toast({ title: newActive ? "Bundle Activated" : "Bundle Deactivated" });
        fetchBundles(page);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update bundle status", variant: "destructive" });
    }
  };
  
  const calculateDiscount = () => {
    const original = parseFloat(formData.original_price) || 0;
    const bundle = parseFloat(formData.bundle_price) || 0;
    if (original > 0 && bundle > 0) {
      return Math.round((1 - bundle / original) * 100);
    }
    return 0;
  };

  const exportToCSV = async () => {
    try {
      // Fetch all bundles (no pagination limit)
      let url = `${API_URL}/api/bundles?active_only=false&limit=1000`;
      if (selectedPillar !== 'all') url += `&pillar=${selectedPillar}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch bundles');
      const data = await response.json();
      const allBundles = data.bundles || [];
      if (!allBundles.length) {
        toast({ title: 'No Data', description: 'No bundles to export', variant: 'destructive' });
        return;
      }
      const headers = ['ID', 'Name', 'Pillar', 'Description', 'Items', 'Original Price', 'Bundle Price', 'Discount %', 'Popular', 'Active', 'Image URL', 'Icon'];
      const rows = allBundles.map(b => [
        b.id || '',
        `"${(b.name || '').replace(/"/g, '""')}"`,
        b.pillar || '',
        `"${(b.description || '').replace(/"/g, '""')}"`,
        `"${(b.items || []).map(i => (typeof i === 'object' ? i.name || JSON.stringify(i) : i)).join(', ')}"`,
        b.original_price || '',
        b.bundle_price || '',
        b.discount || Math.round((1 - (b.bundle_price || 0) / (b.original_price || 1)) * 100),
        b.popular ? 'Yes' : 'No',
        b.active !== false ? 'Yes' : 'No',
        b.image_url || '',
        b.icon || ''
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bundles_${selectedPillar}_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      toast({ title: 'Exported!', description: `${allBundles.length} bundles exported to CSV` });
    } catch (err) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    }
  };
  
  return (
    <div className="p-6 space-y-6" data-testid="bundles-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Curated Bundles Manager
          </h2>
          <p className="text-gray-500 mt-1">
            Create and manage product bundles for each pillar
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Seed Defaults
          </Button>
          <Button variant="outline" onClick={generateAllImages} className="bg-purple-50 hover:bg-purple-100 border-purple-300">
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            Generate All Images
          </Button>
          <Button variant="outline" onClick={syncToProduction} className="bg-green-50 hover:bg-green-100 border-green-300">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            Sync → Prod
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="bg-blue-50 hover:bg-blue-100 border-blue-300">
            <Download className="w-4 h-4 mr-2 text-blue-600" />
            Export CSV
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </div>
      
      {/* Pillar Filter + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search bundles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchBundles(1)}
            className="pl-9 w-56"
            data-testid="bundle-search-input"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchBundles(1)}>
          <Search className="w-4 h-4 mr-1" /> Search
        </Button>
        <div className="text-sm text-gray-500">{totalBundles} bundles</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedPillar === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPillar('all')}
        >
          All Pillars
        </Button>
        {PILLARS.map(pillar => (
          <Button
            key={pillar.id}
            variant={selectedPillar === pillar.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPillar(pillar.id)}
          >
            {pillar.icon} {pillar.name}
          </Button>
        ))}
      </div>
      
      {/* Bundles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : bundles.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bundles Found</h3>
          <p className="text-gray-500 mb-4">
            {selectedPillar !== 'all' 
              ? `No bundles for ${PILLARS.find(p => p.id === selectedPillar)?.name || selectedPillar} pillar yet.`
              : "No bundles have been created yet."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={seedDefaults} variant="outline">
              Seed Default Bundles
            </Button>
            <Button onClick={openCreateModal}>
              Create First Bundle
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map(bundle => (
            <Card 
              key={bundle.id} 
              className={`p-4 ${!bundle.active ? 'opacity-60 bg-gray-50' : ''}`}
              data-testid={`bundle-card-${bundle.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{bundle.icon}</span>
                  <div>
                    <h4 className="font-semibold">{bundle.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {PILLARS.find(p => p.id === bundle.pillar)?.name || bundle.pillar}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {bundle.popular && (
                    <Badge className="bg-amber-500">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  {!bundle.active && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
              
              {/* Bundle Image */}
              <div className="mb-3">
                {bundle.image_url ? (
                  <img 
                    src={bundle.image_url} 
                    alt={bundle.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateBundleImage(bundle.id)}
                      className="text-purple-600"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generate AI Image
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Items */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
                <div className="flex flex-wrap gap-1">
                  {bundle.items?.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {typeof item === 'object' ? (item.name || item.title || JSON.stringify(item)) : item}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Pricing */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-400 line-through text-sm">₹{bundle.original_price}</span>
                  <span className="text-xl font-bold text-green-600 ml-2">₹{bundle.bundle_price}</span>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  Save {bundle.discount}%
                </Badge>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditModal(bundle)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(bundle)}
                  className={bundle.is_active !== false ? 'text-green-600 hover:bg-green-50 border-green-200' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}
                  title={bundle.is_active !== false ? 'Click to deactivate' : 'Click to activate'}
                >
                  {bundle.is_active !== false ? 'Active' : 'Off'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(bundle)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchBundles(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchBundles(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
            </DialogTitle>
            <DialogDescription>
              {editingBundle 
                ? 'Update the bundle details below'
                : 'Fill in the details to create a new curated bundle'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Bundle Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Birthday Pawty Bundle"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the bundle"
                rows={2}
              />
            </div>
            
            {/* Pillar, Sub-Category & Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Pillar *</label>
                <Select 
                  value={formData.pillar} 
                  onValueChange={(v) => setFormData({...formData, pillar: v, sub_category: ''})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PILLARS.map(pillar => (
                      <SelectItem key={pillar.id} value={pillar.id}>
                        {pillar.icon} {pillar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sub-Category</label>
                <Select
                  value={formData.sub_category || ''}
                  onValueChange={(v) => setFormData({...formData, sub_category: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(PILLAR_SUBCATEGORIES[formData.pillar] || []).map(sc => (
                      <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="text-sm font-medium">Icon</label>
              <Select 
                value={formData.icon} 
                onValueChange={(v) => setFormData({...formData, icon: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUNDLE_ICONS.map(icon => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Items */}
            <div>
              <label className="text-sm font-medium">Items (comma-separated)</label>
              <Input
                value={formData.items}
                onChange={(e) => setFormData({...formData, items: e.target.value})}
                placeholder="Party Hat, Birthday Bandana, Treat Jar"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter product names separated by commas
              </p>
            </div>
            
            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Original Price (₹) *</label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                  placeholder="2196"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bundle Price (₹) *</label>
                <Input
                  type="number"
                  value={formData.bundle_price}
                  onChange={(e) => setFormData({...formData, bundle_price: e.target.value})}
                  placeholder="1799"
                />
              </div>
            </div>
            
            {/* Discount Preview */}
            {calculateDiscount() > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 inline mr-2" />
                <span className="text-green-700 font-medium">
                  Customers save {calculateDiscount()}% with this bundle!
                </span>
              </div>
            )}
            
            {/* Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Bundle Image</label>
              {formData.image_url && (
                <div className="relative mb-2">
                  <img src={formData.image_url} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
                  <button onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={formData.image_url || ''}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleModalUploadImage} />
                <Button type="button" variant="outline" size="sm" disabled={!editingBundle?.id}
                  onClick={() => fileInputRef.current?.click()}
                  title={!editingBundle?.id ? 'Save bundle first' : 'Upload image'}
                  data-testid="bundle-upload-image-btn">
                  <Upload className="w-4 h-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={generatingModalImage || !editingBundle?.id}
                  onClick={handleModalGenerateImage}
                  title={!editingBundle?.id ? 'Save bundle first' : 'Generate AI image'}
                  data-testid="bundle-generate-image-btn">
                  {generatingModalImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                </Button>
              </div>
              {!editingBundle?.id && <p className="text-xs text-gray-400 mt-1">Save bundle first to enable image upload/generation</p>}
            </div>

            {/* AI Image Prompt */}
            <AIImagePromptField
              entityType="bundle"
              entityId={editingBundle?.id}
              currentPrompt={formData.ai_image_prompt || ''}
              onPromptChange={val => setFormData(prev => ({ ...prev, ai_image_prompt: val }))}
              onImageGenerated={(url, prompt) => setFormData(prev => ({ ...prev, image_url: url, ai_image_prompt: prompt }))}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BundlesManager;
