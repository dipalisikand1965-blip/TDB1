/**
 * PillarProductsTab — Reusable component for showing & managing products in pillar admins
 * Reads/writes from products_master (single source of truth for all pillars)
 * Supports search, pagination, category filter, inline editing, image upload, AI image generation
 *
 * ARCHITECTURE RULES: See /app/memory/ARCHITECTURE.md
 * - Use this component in ALL pillar admins (never build a custom product list)
 * - Usage: <PillarProductsTab pillar="care" pillarName="Care" />
 * - All 12 pillars: celebrate, dine, care, stay, go, play, learn,
 *                  farewell, emergency, adopt, advisory, paperwork
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui/dialog';
import {
  Package, Search, Plus, Edit, Trash2, RefreshCw, Loader2,
  Image, Sparkles, ChevronLeft, ChevronRight, Upload, X, Check
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

const ITEMS_PER_PAGE = 50;

const emptyForm = {
  name: '', description: '', price: '', compare_price: '',
  category: '', sub_category: '', image_url: '', active: true
};

const PillarProductsTab = ({ pillar, pillarName = '', pillarColor = 'bg-purple-500' }) => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = useCallback(async (pageNum = page, catOverride = undefined) => {
    setLoading(true);
    const cat = catOverride !== undefined ? catOverride : filterCategory;
    try {
      let url = `${API_URL}/api/admin/pillar-products?pillar=${encodeURIComponent(pillar)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (cat) url += `&category=${encodeURIComponent(cat)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [pillar, search, filterCategory, page]);

  useEffect(() => { fetchProducts(page); }, [pillar]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProducts(newPage);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm, pillar });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      compare_price: product.compare_price?.toString() || '',
      category: product.category || '',
      sub_category: product.sub_category || '',
      image_url: product.image_url || '',
      active: product.active !== false
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        pillar,
        price: parseFloat(form.price) || 0,
        compare_price: parseFloat(form.compare_price) || 0,
      };

      let res;
      if (editingProduct) {
        res = await fetch(`${API_URL}/api/admin/pillar-products/${editingProduct.id || editingProduct.shopify_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/admin/pillar-products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast({ title: editingProduct ? 'Product updated!' : 'Product created!' });
        setShowModal(false);
        fetchProducts(page);
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail || 'Save failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/pillar-products/${product.id || product.shopify_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast({ title: 'Product deactivated' });
        fetchProducts(page);
      }
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/upload/product-image`, { method: 'POST', body: fd });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.url || data.image_url) {
        const url = data.url || data.image_url;
        setForm(prev => ({ ...prev, image_url: url }));
        toast({ title: 'Image uploaded!' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleGenerateImage = () => {
    if (!editingProduct?.id) {
      toast({ title: 'Save product first', description: 'Product must exist before generating an image', variant: 'destructive' });
      return;
    }
    setGeneratingImage(true);
    // Use XMLHttpRequest to bypass Emergent's fetch interceptor consuming the response body
    const adminAuth = localStorage.getItem('adminAuth');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/celebrate/admin/products/${editingProduct.id}/generate-image`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (adminAuth) xhr.setRequestHeader('Authorization', `Basic ${adminAuth}`);
    xhr.onload = () => {
      setGeneratingImage(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success && data.image_url) {
          setForm(prev => ({ ...prev, image_url: data.image_url }));
          toast({ title: 'AI Image Generated!', description: 'Image saved to Cloudinary' });
        } else {
          toast({ title: 'Generation failed', description: data.message || `Error ${xhr.status}`, variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Error', description: 'Could not parse server response', variant: 'destructive' });
      }
    };
    xhr.onerror = () => { setGeneratingImage(false); toast({ title: 'Error', description: 'Network error', variant: 'destructive' }); };
    xhr.send();
  };

  return (
    <div className="space-y-4" data-testid={`pillar-products-tab-${pillar}`}>
      {/* Header + Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${pillarName || pillar} products...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
              data-testid="product-search-input"
            />
          </div>
          {categories.length > 0 && (
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filterCategory}
              onChange={e => { const v = e.target.value; setFilterCategory(v); setPage(1); fetchProducts(1, v); }}
              data-testid="category-filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <Button variant="outline" onClick={handleSearch} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} products</Badge>
          <Button onClick={openCreate} size="sm" data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No products found for {pillarName || pillar}</p>
          <p className="text-sm text-gray-400 mt-1">Products from Product Box and Shopify sync will appear here</p>
          <Button onClick={openCreate} className="mt-4" size="sm">Add First Product</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map(product => (
            <Card key={product.id || product.shopify_id} className={`p-3 ${product.active === false ? 'opacity-60' : ''}`} data-testid={`product-card-${product.id}`}>
              <div className="flex gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {product.price > 0 && <span className="text-sm font-bold text-green-600">₹{product.price}</span>}
                    {product.category && <Badge variant="outline" className="text-xs">{product.category}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)} data-testid={`edit-product-${product.id}`}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(product)} data-testid={`delete-product-${product.id}`}>
                  <Trash2 className="w-3 h-3" />
                </Button>
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
            <DialogTitle>{editingProduct ? 'Edit Product' : `Add ${pillarName || pillar} Product`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="mt-1" data-testid="product-name-input" />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 p-2 border rounded-md text-sm resize-none"
                rows={3}
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" data-testid="product-price-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Compare Price (₹)</label>
                <Input type="number" value={form.compare_price} onChange={e => setForm({ ...form, compare_price: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. cakes, toys" className="mt-1" data-testid="product-category-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Sub-category</label>
                <Input value={form.sub_category} onChange={e => setForm({ ...form, sub_category: e.target.value })} placeholder="optional" className="mt-1" />
              </div>
            </div>

            {/* Image Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">Product Image</label>
              {form.image_url && (
                <div className="relative mb-2">
                  <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <button onClick={() => setForm({ ...form, image_url: '' })} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Image URL" className="flex-1 border rounded-md px-3 py-2 text-sm" />
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleUploadImage} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()} data-testid="upload-image-btn">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={generatingImage || !editingProduct?.id} onClick={handleGenerateImage} title={!editingProduct?.id ? 'Save product first' : 'Generate AI image'} data-testid="generate-image-btn">
                  {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
              {!editingProduct?.id && <p className="text-xs text-gray-400 mt-1">Save product first to enable AI image generation</p>}
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'} relative`}
                data-testid="product-active-toggle"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm">{form.active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-product-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PillarProductsTab;
