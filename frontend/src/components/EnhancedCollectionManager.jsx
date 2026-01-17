import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_URL } from '../utils/api';
import {
  Plus, Edit, Trash2, Save, X, Image, Layers, Search, GripVertical,
  Eye, EyeOff, Calendar, Link, Copy, ExternalLink, ChevronDown, Check,
  ShoppingBag, Utensils, Home, Heart, LayoutGrid, List, Loader2,
  Settings, Palette, Globe, ArrowUp, ArrowDown
} from 'lucide-react';

const ITEM_TYPE_ICONS = {
  product: ShoppingBag,
  restaurant: Utensils,
  stay: Home,
  service: Heart,
  custom: Layers
};

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'carousel', label: 'Carousel', icon: ArrowDown },
  { value: 'list', label: 'List', icon: List },
  { value: 'featured', label: 'Featured', icon: Layers }
];

const EnhancedCollectionManager = ({ getAuthHeader }) => {
  const [collections, setCollections] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [showEditor, setShowEditor] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cover_image: '',
    banner_image: '',
    theme_color: '#8B5CF6',
    display_locations: {
      show_in_navbar: false,
      navbar_position: 0,
      pillar_ids: [],
      show_on_homepage: false,
      homepage_section: ''
    },
    sections: [],
    visibility: {
      is_published: false,
      start_date: '',
      end_date: ''
    },
    seo_title: '',
    seo_description: ''
  });
  
  // Section Editor
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    subtitle: '',
    layout: 'grid',
    columns: 4,
    background: '',
    items: []
  });
  
  // Item Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, pillarRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/enhanced-collections`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/pillars`, { headers: getAuthHeader() })
      ]);
      
      if (colRes.ok) {
        const data = await colRes.json();
        setCollections(data.collections || []);
      }
      if (pillarRes.ok) {
        const data = await pillarRes.json();
        setPillars(data.pillars || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateSlug = (name) => {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-');
  };

  const openEditor = async (collection = null) => {
    if (collection) {
      // Fetch full collection details
      try {
        const res = await fetch(`${API_URL}/api/admin/enhanced-collections/${collection.id}`, {
          headers: getAuthHeader()
        });
        if (res.ok) {
          const data = await res.json();
          const col = data.collection;
          setEditingCollection(col);
          setFormData({
            name: col.name || '',
            slug: col.slug || '',
            description: col.description || '',
            cover_image: col.cover_image || '',
            banner_image: col.banner_image || '',
            theme_color: col.theme_color || '#8B5CF6',
            display_locations: col.display_locations || {
              show_in_navbar: false,
              navbar_position: 0,
              pillar_ids: [],
              show_on_homepage: false
            },
            sections: col.sections || [],
            visibility: col.visibility || { is_published: false },
            seo_title: col.seo_title || '',
            seo_description: col.seo_description || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      }
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        cover_image: '',
        banner_image: '',
        theme_color: '#8B5CF6',
        display_locations: {
          show_in_navbar: false,
          navbar_position: 0,
          pillar_ids: [],
          show_on_homepage: false
        },
        sections: [],
        visibility: { is_published: false, start_date: '', end_date: '' },
        seo_title: '',
        seo_description: ''
      });
    }
    setActiveTab('basic');
    setShowEditor(true);
  };

  const saveCollection = async () => {
    if (!formData.name) return;
    
    setSaving(true);
    try {
      const url = editingCollection 
        ? `${API_URL}/api/admin/enhanced-collections/${editingCollection.id}`
        : `${API_URL}/api/admin/enhanced-collections`;
      
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name)
      };
      
      const res = await fetch(url, {
        method: editingCollection ? 'PUT' : 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowEditor(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save collection');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async (collection) => {
    if (!window.confirm(`Delete collection "${collection.name}"?`)) return;
    
    try {
      await fetch(`${API_URL}/api/admin/enhanced-collections/${collection.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const duplicateCollection = async (collection) => {
    try {
      await fetch(`${API_URL}/api/admin/enhanced-collections/${collection.id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      fetchData();
    } catch (error) {
      console.error('Failed to duplicate:', error);
    }
  };

  // Section Management
  const addSection = () => {
    const newSection = {
      id: `sec-temp-${Date.now()}`,
      title: 'New Section',
      subtitle: '',
      layout: 'grid',
      columns: 4,
      background: '',
      items: []
    };
    setFormData({ ...formData, sections: [...formData.sections, newSection] });
  };

  const openSectionEditor = (index) => {
    setSectionForm({ ...formData.sections[index] });
    setEditingSectionIndex(index);
  };

  const saveSectionEdit = () => {
    const newSections = [...formData.sections];
    newSections[editingSectionIndex] = sectionForm;
    setFormData({ ...formData, sections: newSections });
    setEditingSectionIndex(null);
  };

  const deleteSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, sections: newSections });
  };

  const moveSection = (index, direction) => {
    const newSections = [...formData.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSections.length) return;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setFormData({ ...formData, sections: newSections });
  };

  // Item Search
  const searchItems = async () => {
    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/enhanced-collections/search/items?q=${encodeURIComponent(searchQuery)}&item_type=${searchType}&limit=20`,
        { headers: getAuthHeader() }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.items || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const addItemToSection = (item) => {
    const newItem = {
      item_type: item.item_type,
      item_id: item.item_id,
      display_name: '',
      display_image: '',
      button_text: 'View',
      display_order: sectionForm.items.length
    };
    setSectionForm({
      ...sectionForm,
      items: [...sectionForm.items, { ...newItem, actual_data: item }]
    });
  };

  const removeItemFromSection = (index) => {
    setSectionForm({
      ...sectionForm,
      items: sectionForm.items.filter((_, i) => i !== index)
    });
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
          <h2 className="text-xl font-bold">Campaign Collections</h2>
          <p className="text-sm text-gray-500">Create curated pages with items from across all pillars</p>
        </div>
        <Button onClick={() => openEditor()} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card className="p-8 text-center">
          <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-700 mb-2">No collections yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first campaign collection</p>
          <Button onClick={() => openEditor()} className="bg-purple-600">
            <Plus className="w-4 h-4 mr-2" /> Create Collection
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Card key={col.id} className="overflow-hidden group">
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 relative">
                {col.cover_image ? (
                  <img src={col.cover_image} alt={col.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: col.theme_color + '20' }}>
                    <Layers className="w-12 h-12" style={{ color: col.theme_color }} />
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {col.visibility?.is_published ? (
                    <Badge className="bg-green-500">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white">Draft</Badge>
                  )}
                  {col.display_locations?.show_in_navbar && (
                    <Badge className="bg-blue-500">In Navbar</Badge>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => window.open(`/collections/${col.slug}`, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => duplicateCollection(col)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{col.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{col.description || 'No description'}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>{col.section_count || 0} sections</span>
                  <span>{col.item_count || 0} items</span>
                  <span className="text-gray-300">|</span>
                  <span>/collections/{col.slug}</span>
                </div>
                
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" onClick={() => openEditor(col)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteCollection(col)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Collection Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? 'Edit Collection' : 'New Collection'}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="seo">SEO & Visibility</TabsTrigger>
            </TabsList>
            
            <div className="min-h-[400px]">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Collection Name *</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        name: e.target.value,
                        slug: editingCollection ? formData.slug : generateSlug(e.target.value)
                      })}
                      placeholder="e.g. Valentine's Special"
                    />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="valentines-special"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description for the collection..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cover Image URL</Label>
                    <Input 
                      value={formData.cover_image}
                      onChange={(e) => setFormData({...formData, cover_image: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Banner Image URL</Label>
                    <Input 
                      value={formData.banner_image}
                      onChange={(e) => setFormData({...formData, banner_image: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Theme Color</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input 
                      value={formData.theme_color}
                      onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                      className="w-32"
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-4 mt-0">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">{formData.sections.length} sections</p>
                  <Button size="sm" onClick={addSection} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-1" /> Add Section
                  </Button>
                </div>
                
                {formData.sections.length === 0 ? (
                  <Card className="p-8 text-center border-dashed border-2 border-purple-200 bg-purple-50">
                    <Layers className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                    <p className="text-gray-600 mb-4">No sections yet. Add your first section to start building your collection!</p>
                    <Button onClick={addSection} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-1" /> Add First Section
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {formData.sections.map((section, index) => (
                      <Card key={section.id || index} className="p-3">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          
                          <div className="flex-1">
                            <h4 className="font-medium">{section.title}</h4>
                            <p className="text-xs text-gray-500">
                              {section.layout} • {section.items?.length || 0} items
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSection(index, 'down')} disabled={index === formData.sections.length - 1}>
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openSectionEditor(index)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => deleteSection(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Display Tab */}
              <TabsContent value="display" className="space-y-4 mt-0">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show in Navbar</Label>
                      <p className="text-xs text-gray-500">Display as a temporary feature in site navigation</p>
                    </div>
                    <Switch 
                      checked={formData.display_locations?.show_in_navbar || false}
                      onCheckedChange={(c) => setFormData({
                        ...formData, 
                        display_locations: { ...formData.display_locations, show_in_navbar: c }
                      })}
                    />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show on Homepage</Label>
                      <p className="text-xs text-gray-500">Feature this collection on the homepage</p>
                    </div>
                    <Switch 
                      checked={formData.display_locations?.show_on_homepage || false}
                      onCheckedChange={(c) => setFormData({
                        ...formData, 
                        display_locations: { ...formData.display_locations, show_on_homepage: c }
                      })}
                    />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <Label className="mb-2 block">Show in Pillars</Label>
                  <p className="text-xs text-gray-500 mb-3">Display this collection inside pillar submenus</p>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map((pillar) => {
                      const isSelected = formData.display_locations?.pillar_ids?.includes(pillar.id);
                      return (
                        <button
                          key={pillar.id}
                          type="button"
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50 text-purple-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const currentIds = formData.display_locations?.pillar_ids || [];
                            const newIds = isSelected 
                              ? currentIds.filter(id => id !== pillar.id)
                              : [...currentIds, pillar.id];
                            setFormData({
                              ...formData,
                              display_locations: { ...formData.display_locations, pillar_ids: newIds }
                            });
                          }}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: pillar.color }} />
                          {pillar.name}
                          {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </TabsContent>
              
              {/* SEO & Visibility Tab */}
              <TabsContent value="seo" className="space-y-4 mt-0">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label>Published</Label>
                      <p className="text-xs text-gray-500">Make this collection visible to the public</p>
                    </div>
                    <Switch 
                      checked={formData.visibility?.is_published || false}
                      onCheckedChange={(c) => setFormData({
                        ...formData, 
                        visibility: { ...formData.visibility, is_published: c }
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date (optional)</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.visibility?.start_date || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          visibility: { ...formData.visibility, start_date: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>End Date (optional)</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.visibility?.end_date || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          visibility: { ...formData.visibility, end_date: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </Card>
                
                <div>
                  <Label>SEO Title</Label>
                  <Input 
                    value={formData.seo_title}
                    onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                    placeholder="Page title for search engines"
                  />
                </div>
                
                <div>
                  <Label>SEO Description</Label>
                  <Textarea 
                    value={formData.seo_description}
                    onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                    placeholder="Meta description for search engines"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={saveCollection} disabled={saving} className="bg-purple-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Editor Modal */}
      <Dialog open={editingSectionIndex !== null} onOpenChange={() => setEditingSectionIndex(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Section Title *</Label>
                <Input 
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({...sectionForm, title: e.target.value})}
                  placeholder="e.g. Featured Cakes"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input 
                  value={sectionForm.subtitle}
                  onChange={(e) => setSectionForm({...sectionForm, subtitle: e.target.value})}
                  placeholder="Optional subtitle"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Layout</Label>
                <div className="flex gap-2 mt-1">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={sectionForm.layout === opt.value ? 'default' : 'outline'}
                      className={sectionForm.layout === opt.value ? 'bg-purple-600' : ''}
                      onClick={() => setSectionForm({...sectionForm, layout: opt.value})}
                    >
                      <opt.icon className="w-4 h-4 mr-1" />
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Columns (for grid)</Label>
                <Input 
                  type="number"
                  min={1}
                  max={6}
                  value={sectionForm.columns}
                  onChange={(e) => setSectionForm({...sectionForm, columns: parseInt(e.target.value) || 4})}
                />
              </div>
            </div>
            
            {/* Item Search */}
            <div className="border-t pt-4">
              <Label className="mb-2 block">Add Items</Label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchItems()}
                    placeholder="Search products, restaurants, stays..."
                    className="pl-9"
                  />
                </div>
                <select 
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="border rounded-md px-3"
                >
                  <option value="all">All Types</option>
                  <option value="product">Products</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="stay">Stays</option>
                  <option value="service">Services</option>
                </select>
                <Button onClick={searchItems} disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto mb-4">
                  {searchResults.map((item) => {
                    const Icon = ITEM_TYPE_ICONS[item.item_type] || Layers;
                    const isAdded = sectionForm.items.some(i => i.item_id === item.item_id);
                    return (
                      <div 
                        key={`${item.item_type}-${item.item_id}`}
                        className={`flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer ${isAdded ? 'bg-green-50' : ''}`}
                        onClick={() => !isAdded && addItemToSection(item)}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.item_type} {item.price && `• ₹${item.price}`}</p>
                        </div>
                        {isAdded ? (
                          <Badge className="bg-green-500">Added</Badge>
                        ) : (
                          <Plus className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Current Items */}
              <Label className="mb-2 block">Section Items ({sectionForm.items.length})</Label>
              {sectionForm.items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 border rounded-lg border-dashed">
                  Search and add items above
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sectionForm.items.map((item, idx) => {
                    const Icon = ITEM_TYPE_ICONS[item.item_type] || Layers;
                    const data = item.actual_data || {};
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        {data.image || item.display_image ? (
                          <img src={item.display_image || data.image} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Input 
                            value={item.display_name || ''}
                            onChange={(e) => {
                              const newItems = [...sectionForm.items];
                              newItems[idx] = { ...newItems[idx], display_name: e.target.value };
                              setSectionForm({ ...sectionForm, items: newItems });
                            }}
                            placeholder={data.name || 'Display name'}
                            className="h-8 text-sm"
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">{item.item_type}</Badge>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => removeItemFromSection(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEditingSectionIndex(null)}>Cancel</Button>
            <Button onClick={saveSectionEdit} className="bg-purple-600">
              <Save className="w-4 h-4 mr-2" /> Save Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCollectionManager;
