/**
 * BundlesManager.jsx
 * Admin component for managing Curated Bundles
 * Allows creating, editing, and deleting product bundles
 */

import React, { useState, useEffect } from 'react';
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
  Package, Plus, Edit2, Trash2, Save, X, Loader2, 
  Gift, Star, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂' },
  { id: 'dine', name: 'Dine', icon: '🍽️' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'stay', name: 'Stay', icon: '🏠' },
  { id: 'care', name: 'Care', icon: '🛁' },
  { id: 'fit', name: 'Fit', icon: '💪' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾' },
  { id: 'learn', name: 'Learn', icon: '📚' },
  { id: 'farewell', name: 'Farewell', icon: '🌈' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'adopt', name: 'Adopt', icon: '🐕' },
  { id: 'advisory', name: 'Advisory', icon: '💡' },
  { id: 'paperwork', name: 'Paperwork', icon: '📋' }
];

const BUNDLE_ICONS = ['📦', '🎁', '🎂', '🍽️', '✈️', '🏠', '🛁', '💪', '🎾', '📚', '🌈', '🚨', '🐕', '💡', '📋', '🚗', '🦴', '🚶', '⭐'];

const BundlesManager = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [saving, setSaving] = useState(false);
  
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
    fetchBundles();
  }, [selectedPillar]);
  
  const fetchBundles = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/bundles?active_only=false`;
      if (selectedPillar !== 'all') {
        url += `&pillar=${selectedPillar}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast({
        title: "Error",
        description: "Failed to load bundles",
        variant: "destructive"
      });
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
        fetchBundles();
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
  
  const openCreateModal = () => {
    setEditingBundle(null);
    setFormData({
      name: '',
      description: '',
      pillar: selectedPillar !== 'all' ? selectedPillar : 'celebrate',
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
        fetchBundles();
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
        toast({
          title: "Deleted",
          description: "Bundle has been deactivated"
        });
        fetchBundles();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive"
      });
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
          <Button variant="outline" onClick={syncToProduction} className="bg-green-50 hover:bg-green-100 border-green-300">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            Sync → Prod
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </div>
      
      {/* Pillar Filter */}
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
              
              {/* Items */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
                <div className="flex flex-wrap gap-1">
                  {bundle.items?.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item}
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
      
      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
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
            
            {/* Pillar & Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Pillar *</label>
                <Select 
                  value={formData.pillar} 
                  onValueChange={(v) => setFormData({...formData, pillar: v})}
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
