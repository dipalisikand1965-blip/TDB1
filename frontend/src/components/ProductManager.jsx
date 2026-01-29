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
  Package, DollarSign, Tag, Layers, Grid, List,
  ArrowUpDown, Check, AlertCircle, Loader2
} from 'lucide-react';

// Categories list
const CATEGORIES = [
  { value: 'cakes', label: 'Dog Cakes' },
  { value: 'breed-cakes', label: 'Breed Cakes' },
  { value: 'treats', label: 'Treats' },
  { value: 'dognuts', label: 'Pupcakes & Dognuts' },
  { value: 'hampers', label: 'Gift Hampers' },
  { value: 'frozen-treats', label: 'Frozen Treats' },
  { value: 'fresh-meals', label: 'Fresh Meals' },
  { value: 'desi-treats', label: 'Desi Treats' },
  { value: 'nut-butters', label: 'Nut Butters' },
  { value: 'cat-treats', label: 'Cat Treats' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'mini-cakes', label: 'Mini Cakes' },
  { value: 'pan-india', label: 'Pan India' },
  { value: 'other', label: 'Other' }
];

const ProductManager = ({ credentials }) => {
  // Get credentials from props or localStorage
  const getAuthHeader = () => {
    if (credentials?.username && credentials?.password) {
      return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
    }
    // Fallback to localStorage
    const storedAuth = localStorage.getItem('adminAuth');
    return storedAuth ? `Basic ${storedAuth}` : '';
  };

  // State
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  
  // Edit modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Create new product modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: 'cakes',
    price: 0,
    image: '',
    sizes: [],
    flavors: [],
    options: [],
    variants: [],
    status: 'active',
    tags: ''
  });
  
  // Sync status
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  
  // CSV Import
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  // CSV Export function
  const exportToCSV = () => {
    const headers = [
      'id', 'name', 'description', 'category', 'price', 'original_price',
      'image', 'status', 'available', 'tags', 'sizes', 'flavors', 'shopify_id', 'shopify_handle'
    ];
    
    const csvRows = [headers.join(',')];
    
    filteredProducts.forEach(product => {
      const row = [
        product.id || '',
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""').substring(0, 500)}"`,
        product.category || '',
        product.price || 0,
        product.original_price || '',
        product.image || '',
        product.status || 'active',
        product.available !== false ? 'true' : 'false',
        `"${(product.tags || []).join(', ')}"`,
        `"${(product.sizes || []).map(s => s.name || s).join(', ')}"`,
        `"${(product.flavors || []).map(f => f.name || f).join(', ')}"`,
        product.shopify_id || '',
        product.shopify_handle || ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // CSV Import function
  const handleCSVImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Parse CSV line (handling quoted values)
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const product = {};
        
        headers.forEach((header, idx) => {
          let value = values[idx] || '';
          // Remove quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          product[header] = value;
        });
        
        if (product.name) {
          products.push({
            name: product.name,
            description: product.description || '',
            category: product.category || 'other',
            price: parseFloat(product.price) || 0,
            original_price: product.original_price ? parseFloat(product.original_price) : null,
            image: product.image || '',
            status: product.status || 'active',
            available: product.available !== 'false',
            tags: product.tags ? product.tags.split(',').map(t => t.trim()) : []
          });
        }
      }
      
      // Send to backend
      const response = await fetch(`${API_URL}/api/admin/products/import-csv`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.imported} products!`);
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      alert('Failed to parse CSV file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch collections
  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/collections`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };


  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/products?limit=2000`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/sync/status`, {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCollections();
    fetchSyncStatus();
  }, [fetchProducts]);

  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(p => p.status !== 'draft');
    } else if (statusFilter === 'draft') {
      result = result.filter(p => p.status === 'draft');
    } else if (statusFilter === 'no-image') {
      result = result.filter(p => !p.image || p.image === '');
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      if (sortBy === 'price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sync from Shopify
  const handleSync = async () => {
    if (!window.confirm('This will sync all products from Shopify. Local-only changes may be overwritten. Continue?')) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/api/cron/sync-products?secret=midnight-sync-tdb-2025`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Synced ${data.synced} products from Shopify!`);
        fetchProducts();
        fetchSyncStatus();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Open edit modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'other',
      price: product.price || 0,
      image: product.image || '',
      sizes: product.sizes || [],
      flavors: product.flavors || [],
      options: product.options || [],
      variants: product.variants || [],
      status: product.status || 'active',
      tags: product.tags?.join(', ') || '',
      minPrice: product.minPrice || null,
      autoship_enabled: product.autoship_enabled || false,
      collection_ids: product.collection_ids || [],
      // Local edit flag
      locally_edited: true
    });
    setSaveMessage(null);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm({});
    setSaveMessage(null);
  };

  // Save product
  const saveProduct = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const payload = {
        ...editForm,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        price: parseFloat(editForm.price) || 0,
        minPrice: editForm.minPrice ? parseFloat(editForm.minPrice) : null,
        autoship_enabled: editForm.autoship_enabled,
        collection_ids: editForm.collection_ids,
        updated_at: new Date().toISOString(),
        locally_edited: true
      };
      
      const response = await fetch(`${API_URL}/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Product saved successfully!' });
        fetchProducts();
        setTimeout(() => closeEditModal(), 1500);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.detail || 'Failed to save' });
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  // Create new product
  const createProduct = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const payload = {
        ...createForm,
        id: `local-${Date.now()}`,
        price: parseFloat(createForm.price) || 0,
        tags: createForm.tags ? createForm.tags.split(',').map(t => t.trim()) : [],
        collection_ids: createForm.collection_ids || [],
        autoship_enabled: createForm.autoship_enabled || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        locally_edited: true,
        available: true
      };
      
      const response = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Product created successfully!' });
        fetchProducts();
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateForm({
            name: '',
            description: '',
            category: 'cakes',
            price: 0,
            image: '',
            sizes: [],
            flavors: [],
            status: 'active',
            tags: '',
            collection_ids: [],
            autoship_enabled: false
          });
          setSaveMessage(null);
        }, 1500);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.detail || 'Failed to create product' });
      }
    } catch (error) {
      console.error('Create failed:', error);
      setSaveMessage({ type: 'error', text: 'Failed to create product' });
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      
      if (response.ok) {
        // Use functional update to avoid stale closure
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        // Show success feedback
        alert('Product deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Add/Update variant (size)
  const updateSize = (index, field, value) => {
    const newSizes = [...(editForm.sizes || [])];
    if (typeof newSizes[index] === 'string') {
      // Convert old format to new format
      newSizes[index] = { name: newSizes[index], price: 0 };
    }
    newSizes[index] = { ...newSizes[index], [field]: field === 'price' ? parseFloat(value) || 0 : value };
    setEditForm({ ...editForm, sizes: newSizes });
  };

  const addSize = () => {
    setEditForm({
      ...editForm,
      sizes: [...(editForm.sizes || []), { name: '', price: 0 }]
    });
  };

  const removeSize = (index) => {
    const newSizes = editForm.sizes.filter((_, i) => i !== index);
    setEditForm({ ...editForm, sizes: newSizes });
  };

  // Add/Update flavor
  const updateFlavor = (index, field, value) => {
    const newFlavors = [...(editForm.flavors || [])];
    if (typeof newFlavors[index] === 'string') {
      newFlavors[index] = { name: newFlavors[index], price: 0 };
    }
    newFlavors[index] = { ...newFlavors[index], [field]: field === 'price' ? parseFloat(value) || 0 : value };
    setEditForm({ ...editForm, flavors: newFlavors });
  };

  const addFlavor = () => {
    setEditForm({
      ...editForm,
      flavors: [...(editForm.flavors || []), { name: '', price: 0 }]
    });
  };

  const removeFlavor = (index) => {
    const newFlavors = editForm.flavors.filter((_, i) => i !== index);
    setEditForm({ ...editForm, flavors: newFlavors });
  };

  // Category counts
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{products.filter(p => p.status !== 'draft').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">No Image</p>
              <p className="text-2xl font-bold">{products.filter(p => !p.image).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold">{Object.keys(categoryCounts).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Status & Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Shopify Sync</h3>
            {syncStatus?.last_sync && (
              <p className="text-sm text-gray-500">
                Last synced: {new Date(syncStatus.last_sync.timestamp).toLocaleString()} 
                {syncStatus.last_sync.products_synced && ` (${syncStatus.last_sync.products_synced} products)`}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {/* CSV Export */}
            <Button variant="outline" onClick={exportToCSV} title="Export to CSV">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            
            {/* CSV Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              title="Import from CSV"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import CSV
            </Button>
            
            <Button onClick={handleSync} disabled={syncing} className="bg-purple-600 hover:bg-purple-700">
              {syncing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Sync from Shopify</>
              )}
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-green-600 hover:bg-green-700"
              data-testid="create-product-btn"
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <select
            className="px-3 py-2 border rounded-lg bg-white min-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories ({products.length})</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label} ({categoryCounts[cat.value] || 0})
              </option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            className="px-3 py-2 border rounded-lg bg-white min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="no-image">No Image</option>
          </select>
          
          {/* Sort */}
          <select
            className="px-3 py-2 border rounded-lg bg-white min-w-[140px]"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="category-asc">Category A-Z</option>
          </select>
          
          {/* View Mode */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Results count */}
        <p className="text-sm text-gray-500 mt-3">
          Showing {paginatedProducts.length} of {filteredProducts.length} products
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </Card>

      {/* Products Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {paginatedProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => openEditModal(product)}
            >
              <div className="aspect-square bg-gray-100 relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                {product.locally_edited && (
                  <Badge className="absolute top-2 left-2 bg-blue-600 text-xs">Edited</Badge>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="secondary">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-purple-600 font-bold">₹{product.price || product.minPrice || 0}</span>
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Image</th>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Category</th>
                <th className="text-left p-3 font-medium text-gray-600">Collections</th>
                <th className="text-left p-3 font-medium text-gray-600">Price</th>
                <th className="text-left p-3 font-medium text-gray-600">Variants</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{product.name}</p>
                    {product.locally_edited && <Badge className="bg-blue-100 text-blue-700 text-xs">Edited</Badge>}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{product.category}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {product.collection_ids?.map(cid => {
                        const col = collections.find(c => c.id === cid);
                        return col ? <Badge key={cid} variant="secondary" className="text-xs">{col.name}</Badge> : null;
                      })}
                    </div>
                  </td>
                  <td className="p-3 font-medium">₹{product.price || product.minPrice || 0}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {product.sizes?.length || 0} sizes, {product.flavors?.length || 0} flavours
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(product)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`w-8 h-8 rounded ${
                    currentPage === pageNum 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-500 ml-4">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <Card className="w-full max-w-4xl my-8 bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Save Message */}
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {saveMessage.text}
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Base Price (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-lg mt-4">
                    <div>
                      <Label>Autoship Enabled</Label>
                      <p className="text-xs text-gray-500">Allow subscription</p>
                    </div>
                    <Switch 
                      checked={editForm.autoship_enabled} 
                      onCheckedChange={(c) => setEditForm({...editForm, autoship_enabled: c})} 
                    />
                  </div>

                  <div className="mt-4">
                    <Label className="mb-2 block">Collections</Label>
                    <div className="border rounded-lg p-2 h-40 overflow-y-auto space-y-1">
                      {collections.map(col => (
                        <div 
                          key={col.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            const ids = editForm.collection_ids?.includes(col.id)
                              ? editForm.collection_ids.filter(id => id !== col.id)
                              : [...(editForm.collection_ids || []), col.id];
                            setEditForm({ ...editForm, collection_ids: ids });
                          }}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${editForm.collection_ids?.includes(col.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {editForm.collection_ids?.includes(col.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm">{col.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    {editForm.image && (
                      <div className="mt-2 w-32 h-32 border rounded overflow-hidden">
                        <img src={editForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      placeholder="birthday, cake, dog"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              {/* Product Options (Base, Flavour, Weight, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-semibold">Product Options</Label>
                    <p className="text-xs text-gray-500">Add options like Base, Flavour, Weight</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newOptions = [...(editForm.options || []), { name: '', values: [], position: (editForm.options || []).length + 1 }];
                    setEditForm({ ...editForm, options: newOptions });
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                  </Button>
                </div>
                <div className="space-y-3">
                  {(editForm.options || []).map((option, idx) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">Option Name</Label>
                          <Input
                            value={option.name || ''}
                            onChange={(e) => {
                              const newOptions = [...(editForm.options || [])];
                              newOptions[idx] = { ...newOptions[idx], name: e.target.value };
                              setEditForm({ ...editForm, options: newOptions });
                            }}
                            placeholder="e.g., Base, Flavour, Weight"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newOptions = (editForm.options || []).filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, options: newOptions });
                          }}
                          className="text-red-500 hover:text-red-700 mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Values (comma-separated)</Label>
                        <Input
                          value={(option.values || []).join(', ')}
                          onChange={(e) => {
                            const newOptions = [...(editForm.options || [])];
                            newOptions[idx] = {
                              ...newOptions[idx],
                              values: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                            };
                            setEditForm({ ...editForm, options: newOptions });
                          }}
                          placeholder="e.g., Oats, Ragi"
                        />
                      </div>
                    </div>
                  ))}
                  {(!editForm.options || editForm.options.length === 0) && (
                    <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      <p>No options added.</p>
                      <p className="text-xs mt-1">Common options: Base (Oats, Ragi), Flavour (Chicken, Banana), Weight (500g, 1kg)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-semibold">Variants & Pricing</Label>
                    <p className="text-xs text-gray-500">Each combination of options with its price</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newVariants = [...(editForm.variants || []), { title: '', price: editForm.price || 0, option1: '', option2: '', option3: '' }];
                    setEditForm({ ...editForm, variants: newVariants });
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Variant
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(editForm.variants || []).slice(0, 20).map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg text-sm">
                      <div className="flex-1">
                        <Input
                          value={variant.title || ''}
                          onChange={(e) => {
                            const newVariants = [...(editForm.variants || [])];
                            newVariants[idx] = { ...newVariants[idx], title: e.target.value };
                            setEditForm({ ...editForm, variants: newVariants });
                          }}
                          placeholder="e.g., Oats / Chicken / 500g"
                          className="text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={variant.price || 0}
                          onChange={(e) => {
                            const newVariants = [...(editForm.variants || [])];
                            newVariants[idx] = { ...newVariants[idx], price: Number(e.target.value) };
                            setEditForm({ ...editForm, variants: newVariants });
                          }}
                          className="text-sm"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newVariants = (editForm.variants || []).filter((_, i) => i !== idx);
                          setEditForm({ ...editForm, variants: newVariants });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(editForm.variants || []).length > 20 && (
                    <p className="text-xs text-gray-500 text-center">Showing first 20 of {editForm.variants.length} variants</p>
                  )}
                  {(!editForm.variants || editForm.variants.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      No variants. Add variants for each option combination.
                    </p>
                  )}
                </div>
              </div>

              {/* Legacy Sizes/Flavors (collapsed) */}
              <details className="text-sm border rounded-lg p-2">
                <summary className="text-gray-500 cursor-pointer font-medium">Legacy Size/Flavor fields (deprecated)</summary>
                <div className="mt-3 space-y-4">
                  {/* Sizes/Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Sizes</Label>
                      <Button size="sm" variant="ghost" onClick={addSize}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {(editForm.sizes || []).map((size, idx) => {
                      const sizeObj = typeof size === 'string' ? { name: size, price: 0 } : size;
                      return (
                        <div key={idx} className="flex items-center gap-2 mb-1">
                          <Input
                            value={sizeObj.name}
                            onChange={(e) => updateSize(idx, 'name', e.target.value)}
                            placeholder="Size"
                            className="text-xs"
                          />
                          <Input
                            type="number"
                            value={sizeObj.price}
                            onChange={(e) => updateSize(idx, 'price', e.target.value)}
                            className="w-20 text-xs"
                          />
                          <button onClick={() => removeSize(idx)} className="text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Flavors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Flavors</Label>
                      <Button size="sm" variant="ghost" onClick={addFlavor}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {(editForm.flavors || []).map((flavor, idx) => {
                      const flavorObj = typeof flavor === 'string' ? { name: flavor, price: 0 } : flavor;
                      return (
                        <div key={idx} className="flex items-center gap-2 mb-1">
                          <Input
                            value={flavorObj.name}
                            onChange={(e) => updateFlavor(idx, 'name', e.target.value)}
                            placeholder="Flavor"
                            className="text-xs"
                          />
                          <Input
                            type="number"
                            value={flavorObj.price}
                            onChange={(e) => updateFlavor(idx, 'price', e.target.value)}
                            className="w-20 text-xs"
                          />
                          <button onClick={() => removeFlavor(idx)} className="text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => deleteProduct(editingProduct.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Product
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
                <Button onClick={saveProduct} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create New Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <Card className="w-full max-w-4xl my-8 bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <h2 className="text-xl font-bold text-green-800">
                <Plus className="w-5 h-5 inline mr-2" />
                Create New Product
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Save Message */}
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {saveMessage.text}
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Enter product name"
                      className="mt-1"
                      data-testid="create-product-name"
                    />
                  </div>
                  
                  <div>
                    <Label>Category *</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      data-testid="create-product-category"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      value={createForm.price}
                      onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                      data-testid="create-product-price"
                    />
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-lg mt-4">
                    <div>
                      <Label>Autoship Enabled</Label>
                      <p className="text-xs text-gray-500">Allow subscription</p>
                    </div>
                    <Switch 
                      checked={createForm.autoship_enabled} 
                      onCheckedChange={(c) => setCreateForm({...createForm, autoship_enabled: c})} 
                    />
                  </div>

                  <div className="mt-4">
                    <Label className="mb-2 block">Collections</Label>
                    <div className="border rounded-lg p-2 h-40 overflow-y-auto space-y-1">
                      {collections.map(col => (
                        <div 
                          key={col.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            const ids = createForm.collection_ids?.includes(col.id)
                              ? createForm.collection_ids.filter(id => id !== col.id)
                              : [...(createForm.collection_ids || []), col.id];
                            setCreateForm({ ...createForm, collection_ids: ids });
                          }}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${createForm.collection_ids?.includes(col.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {createForm.collection_ids?.includes(col.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm">{col.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={createForm.image}
                      onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
                      placeholder="https://..."
                      className="mt-1"
                      data-testid="create-product-image"
                    />
                    {createForm.image && (
                      <div className="mt-2 w-32 h-32 border rounded overflow-hidden">
                        <img src={createForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={createForm.tags}
                      onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                      placeholder="birthday, cake, dog"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Product description..."
                  className="mt-1"
                  rows={3}
                  data-testid="create-product-description"
                />
              </div>
              
              {/* Sizes/Variants for New Product */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Sizes / Variants</Label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setCreateForm({
                      ...createForm,
                      sizes: [...(createForm.sizes || []), { name: '', price: 0 }]
                    })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Size
                  </Button>
                </div>
                <div className="space-y-2">
                  {(createForm.sizes || []).map((size, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">Size Name</Label>
                        <Input
                          value={size.name}
                          onChange={(e) => {
                            const newSizes = [...createForm.sizes];
                            newSizes[idx] = { ...newSizes[idx], name: e.target.value };
                            setCreateForm({ ...createForm, sizes: newSizes });
                          }}
                          placeholder="e.g., 500g, Large"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs text-gray-500">Price (₹)</Label>
                        <Input
                          type="number"
                          value={size.price}
                          onChange={(e) => {
                            const newSizes = [...createForm.sizes];
                            newSizes[idx] = { ...newSizes[idx], price: parseFloat(e.target.value) || 0 };
                            setCreateForm({ ...createForm, sizes: newSizes });
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newSizes = createForm.sizes.filter((_, i) => i !== idx);
                          setCreateForm({ ...createForm, sizes: newSizes });
                        }}
                        className="text-red-500 hover:text-red-700 mt-5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!createForm.sizes || createForm.sizes.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      No sizes added. Click "Add Size" to add variants.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Flavors for New Product */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Flavors / Options</Label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setCreateForm({
                      ...createForm,
                      flavors: [...(createForm.flavors || []), { name: '', price: 0 }]
                    })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Flavor
                  </Button>
                </div>
                <div className="space-y-2">
                  {(createForm.flavors || []).map((flavor, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">Flavor Name</Label>
                        <Input
                          value={flavor.name}
                          onChange={(e) => {
                            const newFlavors = [...createForm.flavors];
                            newFlavors[idx] = { ...newFlavors[idx], name: e.target.value };
                            setCreateForm({ ...createForm, flavors: newFlavors });
                          }}
                          placeholder="e.g., Chicken, Peanut Butter"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs text-gray-500">Extra Price (₹)</Label>
                        <Input
                          type="number"
                          value={flavor.price}
                          onChange={(e) => {
                            const newFlavors = [...createForm.flavors];
                            newFlavors[idx] = { ...newFlavors[idx], price: parseFloat(e.target.value) || 0 };
                            setCreateForm({ ...createForm, flavors: newFlavors });
                          }}
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newFlavors = createForm.flavors.filter((_, i) => i !== idx);
                          setCreateForm({ ...createForm, flavors: newFlavors });
                        }}
                        className="text-red-500 hover:text-red-700 mt-5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!createForm.flavors || createForm.flavors.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      No flavors added. Click "Add Flavor" to add options.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end p-4 border-t bg-gray-50 gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button 
                onClick={createProduct} 
                disabled={saving || !createForm.name} 
                className="bg-green-600 hover:bg-green-700"
                data-testid="create-product-submit"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Create Product</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
