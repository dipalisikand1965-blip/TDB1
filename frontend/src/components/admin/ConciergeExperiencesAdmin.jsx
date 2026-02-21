/**
 * ConciergeExperiencesAdmin.jsx
 * 
 * Admin panel for managing Concierge® experiences across all pillars.
 * Features: CRUD operations, pillar filtering, seed defaults, toggle active status.
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Copy, ChevronDown, ChevronUp, Search,
  Sparkles, Check, X, Image, Eye, EyeOff, RefreshCw, Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '../ui/dialog';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// Pillar options
const PILLARS = [
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'stay', name: 'Stay', icon: '🏨' },
  { id: 'care', name: 'Care', icon: '🩺' },
  { id: 'dine', name: 'Dine', icon: '🍽️' },
  { id: 'celebrate', name: 'Celebrate', icon: '🎉' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎯' },
  { id: 'learn', name: 'Learn', icon: '🎓' },
  { id: 'fit', name: 'Fit', icon: '💪' },
  { id: 'paperwork', name: 'Paperwork', icon: '📋' },
  { id: 'advisory', name: 'Advisory', icon: '💡' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'farewell', name: 'Farewell', icon: '🌈' },
  { id: 'adopt', name: 'Adopt', icon: '🏠' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
];

// Gradient options
const GRADIENT_OPTIONS = [
  { value: 'from-violet-500 to-purple-600', label: 'Violet → Purple', preview: 'bg-gradient-to-r from-violet-500 to-purple-600' },
  { value: 'from-pink-500 to-rose-500', label: 'Pink → Rose', preview: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { value: 'from-amber-500 to-orange-500', label: 'Amber → Orange', preview: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { value: 'from-green-500 to-emerald-500', label: 'Green → Emerald', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { value: 'from-blue-500 to-indigo-500', label: 'Blue → Indigo', preview: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  { value: 'from-teal-500 to-cyan-500', label: 'Teal → Cyan', preview: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
  { value: 'from-orange-500 to-red-500', label: 'Orange → Red', preview: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { value: 'from-purple-500 to-indigo-500', label: 'Purple → Indigo', preview: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
  { value: 'from-cyan-500 to-blue-500', label: 'Cyan → Blue', preview: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
  { value: 'from-rose-500 to-pink-500', label: 'Rose → Pink', preview: 'bg-gradient-to-r from-rose-500 to-pink-500' },
];

// Badge color options
const BADGE_COLORS = [
  { value: 'bg-amber-500', label: 'Amber' },
  { value: 'bg-violet-500', label: 'Violet' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-rose-500', label: 'Rose' },
];

const ConciergeExperiencesAdmin = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [showInactive, setShowInactive] = useState(true);
  const [editingExperience, setEditingExperience] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    pillar: 'travel',
    title: '',
    description: '',
    icon: '✨',
    gradient: 'from-violet-500 to-purple-600',
    image_url: '',
    badge: '',
    badge_color: 'bg-amber-500',
    highlights: [''],
    cta_text: 'Ask Concierge®',
    cta_url: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/concierge-experiences/`);
      if (response.ok) {
        const data = await response.json();
        setExperiences(data.experiences || []);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({ title: 'Error', description: 'Failed to load experiences', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/concierge-experiences/seed`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        toast({ 
          title: 'Seeded!', 
          description: `Created ${data.seeded} new, updated ${data.updated} existing experiences`
        });
        fetchExperiences();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed defaults', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/concierge-experiences/${id}/toggle`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchExperiences();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/concierge-experiences/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Experience removed' });
        fetchExperiences();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (exp) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/concierge-experiences/${exp.id}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({ title: 'Duplicated', description: 'Experience copied' });
        fetchExperiences();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate', variant: 'destructive' });
    }
  };

  const openEditDialog = (exp = null) => {
    if (exp) {
      setFormData({
        pillar: exp.pillar || 'travel',
        title: exp.title || '',
        description: exp.description || '',
        icon: exp.icon || '✨',
        gradient: exp.gradient || 'from-violet-500 to-purple-600',
        image_url: exp.image_url || '',
        badge: exp.badge || '',
        badge_color: exp.badge_color || 'bg-amber-500',
        highlights: exp.highlights?.length > 0 ? exp.highlights : [''],
        cta_text: exp.cta_text || 'Ask Concierge®',
        cta_url: exp.cta_url || '',
        is_active: exp.is_active !== false,
        sort_order: exp.sort_order || 0
      });
      setEditingExperience(exp);
    } else {
      setFormData({
        pillar: 'travel',
        title: '',
        description: '',
        icon: '✨',
        gradient: 'from-violet-500 to-purple-600',
        image_url: '',
        badge: '',
        badge_color: 'bg-amber-500',
        highlights: [''],
        cta_text: 'Ask Concierge®',
        cta_url: '',
        is_active: true,
        sort_order: 0
      });
      setEditingExperience(null);
    }
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: 'Required', description: 'Title and description are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        highlights: formData.highlights.filter(h => h.trim())
      };

      const url = editingExperience 
        ? `${API_URL}/api/admin/concierge-experiences/${editingExperience.id}`
        : `${API_URL}/api/admin/concierge-experiences/`;
      
      const response = await fetch(url, {
        method: editingExperience ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({ title: 'Saved!', description: editingExperience ? 'Experience updated' : 'Experience created' });
        setShowEditDialog(false);
        fetchExperiences();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const updateHighlight = (index, value) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  const removeHighlight = (index) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: newHighlights.length > 0 ? newHighlights : [''] });
  };

  // Filter experiences
  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = searchQuery === '' || 
      exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPillar = selectedPillar === 'all' || exp.pillar === selectedPillar;
    const matchesActive = showInactive || exp.is_active !== false;
    return matchesSearch && matchesPillar && matchesActive;
  });

  // Group by pillar
  const groupedExperiences = filteredExperiences.reduce((acc, exp) => {
    const pillar = exp.pillar || 'other';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(exp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Concierge® Experiences
          </h2>
          <p className="text-gray-500 text-sm">
            Manage elevated experiences across all pillars
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Seed Defaults
          </Button>
          <Button onClick={() => openEditDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-purple-600">{experiences.length}</p>
          <p className="text-sm text-gray-500">Total Experiences</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-green-600">{experiences.filter(e => e.is_active !== false).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{new Set(experiences.map(e => e.pillar)).size}</p>
          <p className="text-sm text-gray-500">Pillars Covered</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-blue-600">{experiences.filter(e => e.badge).length}</p>
          <p className="text-sm text-gray-500">With Badges</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search experiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedPillar} onValueChange={setSelectedPillar}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pillars</SelectItem>
            {PILLARS.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          <span className="text-sm text-gray-600">Show Inactive</span>
        </div>
      </div>

      {/* Experience List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="text-gray-500 mt-2">Loading experiences...</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Experiences Found</h3>
          <p className="text-gray-500 mb-4">
            {experiences.length === 0 
              ? 'Click "Seed Defaults" to add pre-configured experiences'
              : 'Try adjusting your filters'}
          </p>
          {experiences.length === 0 && (
            <Button onClick={handleSeedDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Seed Default Experiences
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExperiences).map(([pillar, exps]) => {
            const pillarInfo = PILLARS.find(p => p.id === pillar) || { name: pillar, icon: '📦' };
            return (
              <div key={pillar}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>{pillarInfo.icon}</span>
                  {pillarInfo.name}
                  <Badge variant="secondary">{exps.length}</Badge>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exps.map(exp => (
                    <Card 
                      key={exp.id} 
                      className={`p-4 relative ${exp.is_active === false ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      {/* Preview Header */}
                      <div className={`h-16 rounded-lg mb-3 bg-gradient-to-r ${exp.gradient} flex items-center justify-center text-3xl`}>
                        {exp.icon}
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        {exp.title}
                        {exp.badge && (
                          <Badge className={`${exp.badge_color} text-white text-xs`}>{exp.badge}</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{exp.description}</p>
                      
                      {/* Highlights */}
                      {exp.highlights?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">{exp.highlights.length} highlights</p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleActive(exp.id)}
                          >
                            {exp.is_active !== false ? (
                              <Eye className="w-4 h-4 text-green-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(exp)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(exp)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-400">#{exp.sort_order || 0}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExperience ? 'Edit Experience' : 'Create Experience'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className={`h-24 rounded-xl bg-gradient-to-r ${formData.gradient} flex items-center justify-center`}>
              <span className="text-5xl">{formData.icon}</span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pillar</Label>
                <Select value={formData.pillar} onValueChange={(v) => setFormData({...formData, pillar: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PILLARS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon (Emoji)</Label>
                <Input 
                  value={formData.icon} 
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="✨"
                />
              </div>
            </div>

            <div>
              <Label>Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Luxe Air Concierge®"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this experience..."
                rows={3}
              />
            </div>

            {/* Visual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gradient</Label>
                <Select value={formData.gradient} onValueChange={(v) => setFormData({...formData, gradient: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${g.preview}`} />
                          {g.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input 
                  value={formData.image_url} 
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Badge */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Badge (optional)</Label>
                <Input 
                  value={formData.badge} 
                  onChange={(e) => setFormData({...formData, badge: e.target.value})}
                  placeholder="Signature, Popular, New..."
                />
              </div>
              <div>
                <Label>Badge Color</Label>
                <Select value={formData.badge_color} onValueChange={(v) => setFormData({...formData, badge_color: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_COLORS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${c.value}`} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <Label className="flex items-center justify-between">
                <span>Highlights / Features</span>
                <Button variant="ghost" size="sm" onClick={addHighlight}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {formData.highlights.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      value={h}
                      onChange={(e) => updateHighlight(i, e.target.value)}
                      placeholder={`Highlight ${i + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeHighlight(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Text</Label>
                <Input 
                  value={formData.cta_text} 
                  onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                  placeholder="Ask Concierge®"
                />
              </div>
              <div>
                <Label>CTA URL (optional)</Label>
                <Input 
                  value={formData.cta_url} 
                  onChange={(e) => setFormData({...formData, cta_url: e.target.value})}
                  placeholder="/custom-url"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Sort Order</Label>
                  <Input 
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Experience'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConciergeExperiencesAdmin;
