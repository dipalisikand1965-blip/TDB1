/**
 * PillarBundlesTab — Reusable Bundles Tab for all pillar admins
 * ============================================================
 * Uses the canonical /api/bundles?pillar=X endpoint (SSOT per ARCHITECTURE.md)
 * Supports CRUD + search + pagination
 *
 * USAGE: <PillarBundlesTab pillar="dine" pillarName="Dine" />
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Search, Upload, Download,
  Package, RefreshCw, Loader2, ChevronLeft, ChevronRight, Check, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

const ITEMS_PER_PAGE = 20;

const emptyBundle = {
  name: '',
  description: '',
  pillar: '',
  items: [],
  original_price: 0,
  bundle_price: 0,
  icon: '📦',
  popular: false,
  active: true,
};

const PillarBundlesTab = ({ pillar, pillarName = '', accentColor = 'green' }) => {
  const [bundles, setBundles] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [form, setForm] = useState({ ...emptyBundle });
  const [saving, setSaving] = useState(false);
  const [itemInput, setItemInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchBundles = useCallback(async (pageNum = page, searchVal = search) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/bundles?pillar=${encodeURIComponent(pillar)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}&active_only=false`;
      if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching bundles:', err);
    } finally {
      setLoading(false);
    }
  }, [pillar, page, search]);

  useEffect(() => { fetchBundles(1, ''); }, [pillar]);

  const handleSearch = () => {
    setPage(1);
    fetchBundles(1, search);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchBundles(newPage, search);
  };

  const openCreate = () => {
    setEditingBundle(null);
    setForm({ ...emptyBundle, pillar });
    setItemInput('');
    setShowModal(true);
  };

  const openEdit = (bundle) => {
    setEditingBundle(bundle);
    setForm({
      name: bundle.name || '',
      description: bundle.description || '',
      pillar: bundle.pillar || pillar,
      items: Array.isArray(bundle.items) ? bundle.items : [],
      original_price: bundle.original_price || 0,
      bundle_price: bundle.bundle_price || bundle.price || 0,
      icon: bundle.icon || '📦',
      popular: bundle.popular || false,
      active: bundle.active !== false,
      image_url: bundle.image_url || '',
    });
    setItemInput('');
    setShowModal(true);
  };

  const addItem = () => {
    const val = itemInput.trim();
    if (val) {
      setForm(prev => ({ ...prev, items: [...(prev.items || []), val] }));
      setItemInput('');
    }
  };

  const removeItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, pillar };
      let res;
      if (editingBundle?.id) {
        res = await fetch(`${API_URL}/api/bundles/${editingBundle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/bundles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        toast({ title: editingBundle ? 'Bundle updated!' : 'Bundle created!' });
        setShowModal(false);
        fetchBundles(page, search);
      } else {
        toast({ title: 'Error', description: data.detail || 'Save failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bundle) => {
    if (!window.confirm(`Delete "${bundle.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/bundles/${bundle.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Bundle deleted' });
        fetchBundles(page, search);
      }
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingBundle?.id) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/bundles/${editingBundle.id}/upload-image`, {
        method: 'POST',
        body: fd,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.image_url) {
        setForm(prev => ({ ...prev, image_url: data.image_url }));
        toast({ title: 'Image uploaded!' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const accentClass = {
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
    teal: 'bg-teal-500 hover:bg-teal-600',
    red: 'bg-red-500 hover:bg-red-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
  }[accentColor] || 'bg-green-500 hover:bg-green-600';

  return (
    <div className="space-y-4" data-testid={`pillar-bundles-tab-${pillar}`}>
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${pillarName || pillar} bundles...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
              data-testid="bundle-search-input"
            />
          </div>
          <Button variant="outline" onClick={handleSearch} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} bundles</Badge>
          <Button className={accentClass} onClick={openCreate} size="sm" data-testid="add-bundle-btn">
            <Plus className="w-4 h-4 mr-1" /> Add Bundle
          </Button>
        </div>
      </div>

      {/* Bundle List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : bundles.length === 0 ? (
        <Card className="p-10 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No bundles yet for {pillarName || pillar}</p>
          <p className="text-sm text-gray-400 mt-1">Create your first bundle using the button above</p>
          <Button className={`mt-4 ${accentClass}`} onClick={openCreate} size="sm">Add First Bundle</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bundles.map(bundle => (
            <Card key={bundle.id} className={`p-4 ${bundle.active === false ? 'opacity-60' : ''}`} data-testid={`bundle-card-${bundle.id}`}>
              <div className="flex items-start gap-4">
                {bundle.image_url ? (
                  <img src={bundle.image_url} alt={bundle.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                    {bundle.icon || '📦'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm">{bundle.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{bundle.description}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {bundle.popular && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Popular</Badge>}
                      <Badge variant={bundle.active !== false ? 'default' : 'secondary'} className="text-xs">
                        {bundle.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-green-600">
                      ₹{(bundle.bundle_price || bundle.price || 0).toLocaleString()}
                    </span>
                    {(bundle.original_price || 0) > (bundle.bundle_price || bundle.price || 0) && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{(bundle.original_price || 0).toLocaleString()}
                      </span>
                    )}
                    {bundle.items?.length > 0 && (
                      <span className="text-xs text-gray-500">{bundle.items.length} items</span>
                    )}
                  </div>
                  {bundle.items?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(bundle.items) ? bundle.items : []).slice(0, 4).map((item, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {typeof item === 'object' ? item.product_name || item.name : item}
                        </span>
                      ))}
                      {bundle.items.length > 4 && (
                        <span className="text-xs text-gray-400">+{bundle.items.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(bundle)} data-testid={`edit-bundle-${bundle.id}`}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(bundle)} data-testid={`delete-bundle-${bundle.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => handlePageChange(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Bundle' : `Add ${pillarName || pillar} Bundle`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bundle name" className="mt-1" data-testid="bundle-name-input" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 p-2 border rounded-md text-sm resize-none"
                rows={3}
                placeholder="Bundle description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Bundle Price (₹)</label>
                <Input type="number" value={form.bundle_price} onChange={e => setForm({ ...form, bundle_price: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Original Price (₹)</label>
                <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Icon (emoji)</label>
              <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="📦" className="mt-1" />
            </div>

            {/* Image */}
            <div>
              <label className="text-sm font-medium mb-1 block">Image</label>
              {form.image_url && (
                <div className="relative mb-2">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <button onClick={() => setForm({ ...form, image_url: '' })} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={form.image_url || ''}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleUploadImage} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingImage || !editingBundle?.id}
                  onClick={() => fileInputRef.current?.click()}
                  title={!editingBundle?.id ? 'Save bundle first to upload image' : 'Upload image'}
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
              {!editingBundle?.id && <p className="text-xs text-gray-400 mt-1">Save bundle first to enable image upload</p>}
            </div>

            {/* Items */}
            <div>
              <label className="text-sm font-medium">Items Included</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={itemInput}
                  onChange={e => setItemInput(e.target.value)}
                  placeholder="Add an item..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addItem}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.items || []).map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {typeof item === 'object' ? item.product_name || item.name : item}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem(idx)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'} relative`}
                  data-testid="bundle-active-toggle"
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm">{form.active ? 'Active' : 'Inactive'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, popular: !form.popular })}
                  className={`w-10 h-6 rounded-full transition-colors ${form.popular ? 'bg-yellow-500' : 'bg-gray-300'} relative`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.popular ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm">{form.popular ? 'Popular' : 'Not Popular'}</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className={accentClass} onClick={handleSave} disabled={saving} data-testid="save-bundle-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {editingBundle ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PillarBundlesTab;
