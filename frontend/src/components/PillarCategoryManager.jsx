import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { API_URL } from '../utils/api';
import {
  Plus, Edit, Trash2, Save, X, GripVertical, ChevronDown, ChevronRight,
  Layers, Package, Utensils, Home, Plane, Heart, Cake, Tag, Settings,
  Eye, EyeOff, Loader2
} from 'lucide-react';

const ICON_MAP = {
  Cake: Cake,
  Utensils: Utensils,
  Home: Home,
  Plane: Plane,
  Heart: Heart,
  Package: Package,
  Layers: Layers,
  Tag: Tag
};

const AVAILABLE_ICONS = ['Cake', 'Utensils', 'Home', 'Plane', 'Heart', 'Package', 'Layers', 'Tag'];

const PillarCategoryManager = ({ getAuthHeader }) => {
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState(null);
  
  // Pillar Modal
  const [showPillarModal, setShowPillarModal] = useState(false);
  const [editingPillar, setEditingPillar] = useState(null);
  const [pillarForm, setPillarForm] = useState({
    name: '',
    slug: '',
    icon: 'Package',
    color: '#8B5CF6',
    description: '',
    show_in_nav: true,
    is_active: true
  });
  
  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    pillar_id: '',
    description: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);

  const fetchPillars = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pillars`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setPillars(data.pillars || []);
      }
    } catch (error) {
      console.error('Failed to fetch pillars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  // Generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-');
  };

  // Pillar CRUD
  const openPillarModal = (pillar = null) => {
    if (pillar) {
      setEditingPillar(pillar);
      setPillarForm({
        name: pillar.name,
        slug: pillar.slug,
        icon: pillar.icon || 'Package',
        color: pillar.color || '#8B5CF6',
        description: pillar.description || '',
        show_in_nav: pillar.show_in_nav !== false,
        is_active: pillar.is_active !== false
      });
    } else {
      setEditingPillar(null);
      setPillarForm({
        name: '',
        slug: '',
        icon: 'Package',
        color: '#8B5CF6',
        description: '',
        show_in_nav: true,
        is_active: true
      });
    }
    setShowPillarModal(true);
  };

  const savePillar = async () => {
    if (!pillarForm.name) return;
    
    setSaving(true);
    try {
      const url = editingPillar 
        ? `${API_URL}/api/admin/pillars/${editingPillar.id}`
        : `${API_URL}/api/admin/pillars`;
      
      const res = await fetch(url, {
        method: editingPillar ? 'PUT' : 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pillarForm,
          slug: pillarForm.slug || generateSlug(pillarForm.name)
        })
      });
      
      if (res.ok) {
        setShowPillarModal(false);
        fetchPillars();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save pillar');
      }
    } catch (error) {
      console.error('Failed to save pillar:', error);
    } finally {
      setSaving(false);
    }
  };

  const deletePillar = async (pillar) => {
    if (pillar.product_count > 0) {
      alert(`Cannot delete pillar with ${pillar.product_count} assigned products. Remove products first.`);
      return;
    }
    if (!window.confirm(`Delete pillar "${pillar.name}"? This will also delete all its categories.`)) return;
    
    try {
      await fetch(`${API_URL}/api/admin/pillars/${pillar.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      fetchPillars();
    } catch (error) {
      console.error('Failed to delete pillar:', error);
    }
  };

  // Category CRUD
  const openCategoryModal = (pillarId, category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        pillar_id: category.pillar_id,
        description: category.description || '',
        is_active: category.is_active !== false
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        pillar_id: pillarId,
        description: '',
        is_active: true
      });
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.pillar_id) return;
    
    setSaving(true);
    try {
      const url = editingCategory 
        ? `${API_URL}/api/admin/pillars/categories/${editingCategory.id}`
        : `${API_URL}/api/admin/pillars/categories`;
      
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          slug: categoryForm.slug || generateSlug(categoryForm.name)
        })
      });
      
      if (res.ok) {
        setShowCategoryModal(false);
        fetchPillars();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/pillars/categories/${category.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchPillars();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Pillars & Categories</h2>
          <p className="text-sm text-gray-500">Manage your product classification system</p>
        </div>
        <Button onClick={() => openPillarModal()} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Pillar
        </Button>
      </div>

      {/* Pillars List */}
      <div className="space-y-4">
        {pillars.map((pillar) => {
          const IconComponent = ICON_MAP[pillar.icon] || Package;
          const isExpanded = expandedPillar === pillar.id;
          
          return (
            <Card key={pillar.id} className="overflow-hidden">
              {/* Pillar Header */}
              <div 
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: pillar.color + '20', color: pillar.color }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{pillar.name}</h3>
                    {!pillar.is_active && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                    {pillar.show_in_nav && (
                      <Badge className="bg-green-100 text-green-700 text-xs">In Nav</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {pillar.product_count || 0} products • {pillar.categories?.length || 0} categories
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); openPillarModal(pillar); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={(e) => { e.stopPropagation(); deletePillar(pillar); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Categories (Expanded) */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm text-gray-700">Categories</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openCategoryModal(pillar.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Category
                    </Button>
                  </div>
                  
                  {pillar.categories?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {pillar.categories.map((cat) => (
                        <div 
                          key={cat.id}
                          className="flex items-center justify-between p-2 bg-white rounded border group"
                        >
                          <div className="flex items-center gap-2">
                            {!cat.is_active && <EyeOff className="w-3 h-3 text-gray-400" />}
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => openCategoryModal(pillar.id, cat)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-red-600"
                              onClick={() => deleteCategory(cat)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pillar Modal */}
      <Dialog open={showPillarModal} onOpenChange={setShowPillarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPillar ? 'Edit Pillar' : 'New Pillar'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input 
                value={pillarForm.name}
                onChange={(e) => setPillarForm({
                  ...pillarForm, 
                  name: e.target.value,
                  slug: editingPillar ? pillarForm.slug : generateSlug(e.target.value)
                })}
                placeholder="e.g. Celebrate"
              />
            </div>
            
            <div>
              <Label>Slug</Label>
              <Input 
                value={pillarForm.slug}
                onChange={(e) => setPillarForm({...pillarForm, slug: e.target.value})}
                placeholder="e.g. celebrate"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={pillarForm.description}
                onChange={(e) => setPillarForm({...pillarForm, description: e.target.value})}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {AVAILABLE_ICONS.map((icon) => {
                    const Icon = ICON_MAP[icon];
                    return (
                      <Button
                        key={icon}
                        type="button"
                        size="icon"
                        variant={pillarForm.icon === icon ? 'default' : 'outline'}
                        className={pillarForm.icon === icon ? 'bg-purple-600' : ''}
                        onClick={() => setPillarForm({...pillarForm, icon})}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="color"
                    value={pillarForm.color}
                    onChange={(e) => setPillarForm({...pillarForm, color: e.target.value})}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input 
                    value={pillarForm.color}
                    onChange={(e) => setPillarForm({...pillarForm, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Show in Navigation</Label>
                <p className="text-xs text-gray-500">Display in site navbar</p>
              </div>
              <Switch 
                checked={pillarForm.show_in_nav}
                onCheckedChange={(c) => setPillarForm({...pillarForm, show_in_nav: c})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-gray-500">Pillar is visible on site</p>
              </div>
              <Switch 
                checked={pillarForm.is_active}
                onCheckedChange={(c) => setPillarForm({...pillarForm, is_active: c})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPillarModal(false)}>Cancel</Button>
            <Button onClick={savePillar} disabled={saving} className="bg-purple-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({
                  ...categoryForm, 
                  name: e.target.value,
                  slug: editingCategory ? categoryForm.slug : generateSlug(e.target.value)
                })}
                placeholder="e.g. Birthday Cakes"
              />
            </div>
            
            <div>
              <Label>Slug</Label>
              <Input 
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                placeholder="e.g. birthday-cakes"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-gray-500">Category is visible on site</p>
              </div>
              <Switch 
                checked={categoryForm.is_active}
                onCheckedChange={(c) => setCategoryForm({...categoryForm, is_active: c})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving} className="bg-purple-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PillarCategoryManager;
