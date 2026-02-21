/**
 * OccasionBoxManager - Admin component for managing occasion box templates
 * Allows creating/editing templates with categories and product filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';
import {
  Plus, Edit, Trash2, Save, X, Gift, Cake, Heart, PartyPopper,
  ChevronDown, ChevronUp, GripVertical, Eye, Loader2, Sparkles
} from 'lucide-react';

const OCCASION_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: '🎂', color: '#EC4899' },
  { value: 'gotcha_day', label: 'Gotcha Day', icon: '💝', color: '#8B5CF6' },
  { value: 'festival', label: 'Festival', icon: '🎉', color: '#F59E0B' },
  { value: 'vaccination', label: 'Vaccination', icon: '💉', color: '#10B981' },
  { value: 'grooming', label: 'Grooming', icon: '✂️', color: '#6366F1' },
  { value: 'first_year', label: 'First Year', icon: '🌟', color: '#F97316' },
  { value: 'custom', label: 'Custom', icon: '🎁', color: '#64748B' }
];

const DEFAULT_CATEGORY = {
  id: '',
  name: '',
  description: '',
  icon: '📦',
  min_items: 0,
  max_items: 5,
  required: false,
  product_filters: {},
  featured_product_ids: []
};

const OccasionBoxManager = ({ getAuthHeader }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    occasion_type: 'birthday',
    description: '',
    icon: '🎂',
    cover_image: '',
    theme_color: '#EC4899',
    categories: [],
    bundle_discount_percent: 10,
    min_total_items: 1,
    is_active: true,
    display_order: 0
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/occasion-boxes`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const seedDefaults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/occasion-boxes/seed-defaults`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      const data = await response.json();
      toast.success(data.message);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to seed defaults');
    }
  };

  const openEditor = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || '',
        slug: template.slug || '',
        occasion_type: template.occasion_type || 'birthday',
        description: template.description || '',
        icon: template.icon || '🎂',
        cover_image: template.cover_image || '',
        theme_color: template.theme_color || '#EC4899',
        categories: template.categories || [],
        bundle_discount_percent: template.bundle_discount_percent || 0,
        min_total_items: template.min_total_items || 1,
        is_active: template.is_active !== false,
        display_order: template.display_order || 0
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        slug: '',
        occasion_type: 'birthday',
        description: '',
        icon: '🎂',
        cover_image: '',
        theme_color: '#EC4899',
        categories: [],
        bundle_discount_percent: 10,
        min_total_items: 1,
        is_active: true,
        display_order: templates.length
      });
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate 
        ? `${API_URL}/api/admin/occasion-boxes/${editingTemplate.id}`
        : `${API_URL}/api/admin/occasion-boxes`;

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        setShowEditor(false);
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/occasion-boxes/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const addCategory = () => {
    const newCategory = {
      ...DEFAULT_CATEGORY,
      id: `cat-${Date.now()}`
    };
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const updateCategory = (index, field, value) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = { ...newCategories[index], [field]: value };
      return { ...prev, categories: newCategories };
    });
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-7 h-7 text-purple-600" />
            Occasion Box Templates
          </h2>
          <p className="text-gray-500 mt-1">
            Create and manage celebration box templates for pet parents
          </p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={seedDefaults}>
              <Sparkles className="w-4 h-4 mr-2" />
              Seed Defaults
            </Button>
          )}
          <Button onClick={() => openEditor()} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Templates Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first occasion box template or seed the defaults
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={seedDefaults}>
              <Sparkles className="w-4 h-4 mr-2" />
              Seed Defaults
            </Button>
            <Button onClick={() => openEditor()} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const occasionType = OCCASION_TYPES.find(t => t.value === template.occasion_type);
            const isExpanded = expandedTemplate === template.id;
            
            return (
              <Card key={template.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: template.theme_color + '20' }}
                      >
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {template.name}
                          {!template.is_active && (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {occasionType?.label || template.occasion_type} • {template.categories?.length || 0} categories
                          {template.bundle_discount_percent > 0 && (
                            <span className="text-green-600 ml-2">
                              {template.bundle_discount_percent}% bundle discount
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditor(template); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {template.categories?.map((cat, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{cat.icon}</span>
                            <span className="font-medium text-sm">{cat.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {cat.required ? 'Required' : 'Optional'} • {cat.min_items}-{cat.max_items} items
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }));
                  }}
                  placeholder="Birthday Box"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="birthday-box"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Occasion Type</Label>
                <select
                  value={formData.occasion_type}
                  onChange={(e) => {
                    const type = OCCASION_TYPES.find(t => t.value === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      occasion_type: e.target.value,
                      icon: type?.icon || prev.icon,
                      theme_color: type?.color || prev.theme_color
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-md border bg-white"
                >
                  {OCCASION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Bundle Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.bundle_discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, bundle_discount_percent: parseFloat(e.target.value) || 0 }))}
                  placeholder="10"
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Everything you need for the perfect birthday celebration!"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
              <div>
                <Label className="mr-2">Icon:</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-20 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div>
                <Label className="mr-2">Color:</Label>
                <input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">Categories</Label>
                <Button variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Category
                </Button>
              </div>

              {formData.categories.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-500">No categories yet. Add categories like Cake, Accessories, Treats.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.categories.map((category, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="cursor-move text-gray-400">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input
                            value={category.icon}
                            onChange={(e) => updateCategory(index, 'icon', e.target.value)}
                            placeholder="🎂"
                            className="w-16 text-center text-xl"
                            maxLength={2}
                          />
                          <Input
                            value={category.name}
                            onChange={(e) => updateCategory(index, 'name', e.target.value)}
                            placeholder="Category name"
                          />
                          <Input
                            value={category.id || generateSlug(category.name)}
                            onChange={(e) => updateCategory(index, 'id', e.target.value)}
                            placeholder="category-id"
                            className="text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={category.min_items}
                              onChange={(e) => updateCategory(index, 'min_items', parseInt(e.target.value) || 0)}
                              className="w-16"
                              min="0"
                              placeholder="Min"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={category.max_items}
                              onChange={(e) => updateCategory(index, 'max_items', parseInt(e.target.value) || 1)}
                              className="w-16"
                              min="1"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={category.required}
                              onChange={(e) => updateCategory(index, 'required', e.target.checked)}
                            />
                            Required
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCategory(index)}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 pl-8">
                        <Input
                          value={category.description || ''}
                          onChange={(e) => updateCategory(index, 'description', e.target.value)}
                          placeholder="Category description"
                          className="text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OccasionBoxManager;
