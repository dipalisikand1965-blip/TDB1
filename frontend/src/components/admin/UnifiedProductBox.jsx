/**
 * Unified Product Box - Admin Component
 * The single source of truth for all products, rewards, and experiences
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  Package, Search, Filter, Plus, Edit, Trash2, Copy, Save, X,
  Gift, Eye, EyeOff, Tag, DollarSign, Shield, Bot, Truck,
  AlertTriangle, Check, ChevronDown, ChevronRight, RefreshCw,
  PawPrint, Heart, Sparkles, ShoppingBag, Loader2, BarChart3,
  Download
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// All pillars
const ALL_PILLARS = [
  { id: 'feed', name: 'Feed', icon: '🍖' },
  { id: 'celebrate', name: 'Celebrate', icon: '🎂' },
  { id: 'dine', name: 'Dine', icon: '🍽️' },
  { id: 'stay', name: 'Stay', icon: '🏨' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'care', name: 'Care', icon: '🩺' },
  { id: 'groom', name: 'Groom', icon: '✂️' },
  { id: 'play', name: 'Play', icon: '🎾' },
  { id: 'train', name: 'Train', icon: '🎓' },
  { id: 'insure', name: 'Insure', icon: '🛡️' },
  { id: 'adopt', name: 'Adopt', icon: '🐕' },
  { id: 'farewell', name: 'Farewell', icon: '🌈' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
  { id: 'community', name: 'Community', icon: '👥' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'concierge', name: 'Concierge', icon: '🛎️' }
];

const PRODUCT_TYPES = [
  { id: 'physical', name: 'Physical Product', icon: '📦' },
  { id: 'service', name: 'Service', icon: '🛠️' },
  { id: 'experience', name: 'Experience', icon: '✨' },
  { id: 'reward', name: 'Reward Product', icon: '🎁' }
];

const LIFE_STAGES = ['puppy', 'adult', 'senior', 'all'];
const SIZE_OPTIONS = ['small', 'medium', 'large', 'all'];
const DIETARY_FLAGS = [
  'grain_free', 'single_protein', 'vegetarian', 'limited_ingredient',
  'hypoallergenic', 'high_protein', 'low_fat', 'raw_friendly'
];
const REWARD_TRIGGERS = [
  'birthday', 'booking', 'order', 'first_visit', 'membership_milestone',
  'referral', 'manual_grant', 'celebration', 'gotcha_day'
];

const UnifiedProductBox = () => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRewardEligible, setFilterRewardEligible] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const limit = 20;

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: page * limit,
        limit: limit.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('product_type', filterType);
      if (filterPillar) params.append('pillar', filterPillar);
      if (filterStatus) params.append('status', filterStatus);
      if (filterRewardEligible !== null) params.append('reward_eligible', filterRewardEligible.toString());
      
      const response = await fetch(`${API_URL}/api/product-box/products?${params}`);
      const data = await response.json();
      
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterType, filterPillar, filterStatus, filterRewardEligible]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/product-box/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts]);

  // Save product
  const saveProduct = async () => {
    if (!selectedProduct) return;
    
    setSaving(true);
    try {
      const isNew = !selectedProduct.id || selectedProduct.id.startsWith('NEW-');
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew 
        ? `${API_URL}/api/product-box/products`
        : `${API_URL}/api/product-box/products/${selectedProduct.id}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProduct)
      });
      
      if (response.ok) {
        toast({ title: 'Saved!', description: 'Product saved successfully' });
        setShowEditor(false);
        fetchProducts();
        fetchStats();
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to save', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error saving product:', err);
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Clone product
  const cloneProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/product-box/products/${productId}/clone`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Cloned!', description: 'Product cloned successfully' });
        setSelectedProduct(data.product);
        setShowEditor(true);
        fetchProducts();
      }
    } catch (err) {
      console.error('Error cloning:', err);
      toast({ title: 'Error', description: 'Failed to clone', variant: 'destructive' });
    }
  };

  // Delete (archive) product
  const archiveProduct = async (productId) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/product-box/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Archived', description: 'Product archived' });
        fetchProducts();
        fetchStats();
      }
    } catch (err) {
      console.error('Error archiving:', err);
      toast({ title: 'Error', description: 'Failed to archive', variant: 'destructive' });
    }
  };

  // Export products to CSV
  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Fetch ALL products (no pagination)
      const params = new URLSearchParams({ limit: '10000' });
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('product_type', filterType);
      if (filterPillar) params.append('pillar', filterPillar);
      if (filterStatus) params.append('status', filterStatus);
      if (filterRewardEligible !== null) params.append('reward_eligible', filterRewardEligible.toString());
      
      const response = await fetch(`${API_URL}/api/product-box/products?${params}`);
      const data = await response.json();
      const allProducts = data.products || [];
      
      if (allProducts.length === 0) {
        toast({ title: 'No Data', description: 'No products to export', variant: 'destructive' });
        return;
      }
      
      // CSV Headers
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Category', 'Tags',
        'Primary Pillar', 'All Pillars', 'Base Price', 'GST Rate',
        'In Stock', 'Reward Eligible', 'Reward Value', 'Reward Triggers',
        'Life Stages', 'Size Suitability', 'Dietary Flags',
        'Mira Can Reference', 'Mira Can Suggest', 'Short Description'
      ];
      
      // Build CSV rows
      const rows = allProducts.map(p => [
        p.id || '',
        `"${(p.name || p.product_name || '').replace(/"/g, '""')}"`,
        p.product_type || '',
        p.visibility?.status || p.status || '',
        p.category || '',
        `"${(p.tags || []).join(', ')}"`,
        p.primary_pillar || '',
        `"${(p.pillars || []).join(', ')}"`,
        p.pricing?.base_price || p.base_price || 0,
        p.pricing?.gst_rate || 18,
        p.in_stock ? 'Yes' : 'No',
        p.paw_rewards?.is_reward_eligible ? 'Yes' : 'No',
        p.paw_rewards?.reward_value || 0,
        `"${(p.paw_rewards?.trigger_conditions || []).join(', ')}"`,
        `"${(p.pet_safety?.life_stages || []).join(', ')}"`,
        `"${(p.pet_safety?.size_suitability || []).join(', ')}"`,
        `"${(p.pet_safety?.dietary_flags || []).join(', ')}"`,
        p.mira_visibility?.can_reference ? 'Yes' : 'No',
        p.mira_visibility?.can_suggest_proactively ? 'Yes' : 'No',
        `"${(p.short_description || '').replace(/"/g, '""').substring(0, 200)}"`
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Exported!', description: `${allProducts.length} products exported to CSV` });
    } catch (err) {
      console.error('Error exporting:', err);
      toast({ title: 'Error', description: 'Failed to export products', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Seed All - runs migration, pillar assignment, and rewards enablement
  const seedAll = async () => {
    if (!confirm('This will:\n1. Migrate products from old collection\n2. Auto-assign pillars based on categories/tags\n3. Enable rewards for 30% of products\n\nContinue?')) return;
    
    setSeeding(true);
    try {
      // Step 1: Migrate from old products collection
      toast({ title: 'Step 1/3', description: 'Migrating products...' });
      const migrateRes = await fetch(`${API_URL}/api/product-box/migrate-from-products`, { method: 'POST' });
      const migrateData = await migrateRes.json();
      
      // Step 2: Auto-seed pillars
      toast({ title: 'Step 2/3', description: 'Assigning pillars...' });
      const pillarsRes = await fetch(`${API_URL}/api/product-box/auto-seed-pillars`, { method: 'POST' });
      const pillarsData = await pillarsRes.json();
      
      // Step 3: Enable rewards
      toast({ title: 'Step 3/3', description: 'Enabling rewards...' });
      const rewardsRes = await fetch(`${API_URL}/api/product-box/auto-enable-rewards?percentage=30`, { method: 'POST' });
      const rewardsData = await rewardsRes.json();
      
      // Show results
      const totalMigrated = migrateData.migrated || 0;
      const totalSeeded = pillarsData.updated_count || 0;
      const totalRewards = rewardsData.updated_count || 0;
      
      toast({ 
        title: 'Seed Complete!', 
        description: `Migrated: ${totalMigrated}, Pillars assigned: ${totalSeeded}, Rewards enabled: ${totalRewards}` 
      });
      
      // Refresh data
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error('Error seeding:', err);
      toast({ title: 'Error', description: 'Seeding failed. Check console for details.', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  // Create new product
  const createNewProduct = () => {
    setSelectedProduct({
      id: `NEW-${Date.now()}`,
      name: '',
      product_type: 'physical',
      short_description: '',
      long_description: '',
      category: '',
      tags: [],
      pillars: ['shop'],
      primary_pillar: 'shop',
      images: [],
      pet_safety: {
        life_stages: ['all'],
        size_suitability: ['all'],
        dietary_flags: [],
        known_exclusions: [],
        is_validated: false
      },
      paw_rewards: {
        is_reward_eligible: false,
        is_reward_only: false,
        reward_value: 0,
        trigger_conditions: []
      },
      mira_visibility: {
        can_reference: true,
        can_suggest_proactively: false,
        mention_only_if_asked: true
      },
      pricing: {
        base_price: 0,
        gst_applicable: true,
        gst_rate: 18,
        requires_shipping: true
      },
      visibility: {
        status: 'draft',
        visible_on_site: true,
        visible_to_members: true
      },
      in_stock: true
    });
    setShowEditor(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            Unified Product Box
          </h2>
          <p className="text-gray-500 text-sm">Single source of truth for all products, rewards & experiences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            disabled={exporting}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={createNewProduct} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.by_status?.active || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Reward Eligible</p>
            <p className="text-2xl font-bold text-amber-600">{stats.rewards?.eligible || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Mira Visible</p>
            <p className="text-2xl font-bold text-blue-600">{stats.mira?.visible || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Mira Suggestable</p>
            <p className="text-2xl font-bold text-pink-600">{stats.mira?.suggestable || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-gray-50 to-white">
            <p className="text-xs text-gray-500 mb-1">Draft</p>
            <p className="text-2xl font-bold text-gray-600">{stats.by_status?.draft || 0}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 text-sm"
          >
            <option value="">All Types</option>
            {PRODUCT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
          
          <select 
            value={filterPillar} 
            onChange={(e) => setFilterPillar(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 text-sm"
          >
            <option value="">All Pillars</option>
            {ALL_PILLARS.map(p => (
              <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
            ))}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterType('');
            setFilterPillar('');
            setFilterStatus('');
            setFilterRewardEligible(null);
          }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Product</th>
                    <th className="text-left p-3 font-medium text-gray-600">Type</th>
                    <th className="text-left p-3 font-medium text-gray-600">Pillars</th>
                    <th className="text-left p-3 font-medium text-gray-600">Price</th>
                    <th className="text-center p-3 font-medium text-gray-600">Reward</th>
                    <th className="text-center p-3 font-medium text-gray-600">Mira</th>
                    <th className="text-center p-3 font-medium text-gray-600">Safety</th>
                    <th className="text-center p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {PRODUCT_TYPES.find(t => t.id === product.product_type)?.icon} {product.product_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(product.pillars || []).slice(0, 3).map(p => {
                            const pillar = ALL_PILLARS.find(ap => ap.id === p);
                            return (
                              <span key={p} className="text-lg" title={pillar?.name || p}>
                                {pillar?.icon || '📦'}
                              </span>
                            );
                          })}
                          {(product.pillars || []).length > 3 && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">+{product.pillars.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">₹{product.pricing?.base_price || 0}</span>
                      </td>
                      <td className="p-3 text-center">
                        {product.paw_rewards?.is_reward_eligible ? (
                          <Gift className="w-5 h-5 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {product.mira_visibility?.can_reference ? (
                          product.mira_visibility?.can_suggest_proactively ? (
                            <Bot className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <Bot className="w-5 h-5 text-blue-400 mx-auto" />
                          )
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {product.pet_safety?.is_validated ? (
                          <Shield className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={
                          product.visibility?.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.visibility?.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {product.visibility?.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedProduct(product); setShowEditor(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cloneProduct(product.id)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, totalProducts)} of {totalProducts}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={(page + 1) * limit >= totalProducts}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Product Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              {selectedProduct?.id?.startsWith('NEW-') ? 'Create Product' : 'Edit Product'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="pillars">Pillars</TabsTrigger>
                <TabsTrigger value="safety">Pet Safety</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="mira">Mira AI</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input 
                      value={selectedProduct.name}
                      onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label>Product Type *</Label>
                    <select 
                      value={selectedProduct.product_type}
                      onChange={(e) => setSelectedProduct({...selectedProduct, product_type: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      {PRODUCT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label>Short Description</Label>
                  <Textarea 
                    value={selectedProduct.short_description || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, short_description: e.target.value})}
                    placeholder="Brief care-led description (not salesy)"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label>Usage Context</Label>
                  <Textarea 
                    value={selectedProduct.usage_context || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, usage_context: e.target.value})}
                    placeholder="When is this appropriate? When is it not?"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input 
                      value={selectedProduct.category || ''}
                      onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                      placeholder="e.g., treats, cakes, toys"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input 
                      value={selectedProduct.sku || ''}
                      onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value})}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <select 
                      value={selectedProduct.visibility?.status || 'draft'}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct, 
                        visibility: {...selectedProduct.visibility, status: e.target.value}
                      })}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedProduct.in_stock}
                        onCheckedChange={(c) => setSelectedProduct({...selectedProduct, in_stock: c})}
                      />
                      <Label>In Stock</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedProduct.visibility?.visible_on_site ?? true}
                        onCheckedChange={(c) => setSelectedProduct({
                          ...selectedProduct, 
                          visibility: {...selectedProduct.visibility, visible_on_site: c}
                        })}
                      />
                      <Label>Visible on Site</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Pillars Tab */}
              <TabsContent value="pillars" className="space-y-4 mt-4">
                <div>
                  <Label className="mb-3 block">Assign to Pillars (determines where product appears)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_PILLARS.map(pillar => {
                      const isSelected = (selectedProduct.pillars || []).includes(pillar.id);
                      return (
                        <button
                          key={pillar.id}
                          onClick={() => {
                            const newPillars = isSelected
                              ? (selectedProduct.pillars || []).filter(p => p !== pillar.id)
                              : [...(selectedProduct.pillars || []), pillar.id];
                            setSelectedProduct({...selectedProduct, pillars: newPillars});
                          }}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{pillar.icon}</span>
                          <p className="font-medium text-sm mt-1">{pillar.name}</p>
                          {isSelected && <Check className="w-4 h-4 text-purple-600 absolute top-2 right-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label>Primary Pillar</Label>
                  <select 
                    value={selectedProduct.primary_pillar || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, primary_pillar: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                  >
                    <option value="">Select primary pillar</option>
                    {(selectedProduct.pillars || []).map(p => {
                      const pillar = ALL_PILLARS.find(ap => ap.id === p);
                      return (
                        <option key={p} value={p}>{pillar?.icon} {pillar?.name}</option>
                      );
                    })}
                  </select>
                </div>
              </TabsContent>
              
              {/* Pet Safety Tab */}
              <TabsContent value="safety" className="space-y-4 mt-4">
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Pet Safety is Critical</p>
                      <p className="text-sm text-amber-700">Mira will NOT suggest products without validated safety info</p>
                    </div>
                  </div>
                </Card>
                
                <div>
                  <Label className="mb-2 block">Suitable Life Stages</Label>
                  <div className="flex gap-2">
                    {LIFE_STAGES.map(stage => {
                      const isSelected = (selectedProduct.pet_safety?.life_stages || []).includes(stage);
                      return (
                        <button
                          key={stage}
                          onClick={() => {
                            const current = selectedProduct.pet_safety?.life_stages || [];
                            const newStages = isSelected
                              ? current.filter(s => s !== stage)
                              : [...current, stage];
                            setSelectedProduct({
                              ...selectedProduct,
                              pet_safety: {...selectedProduct.pet_safety, life_stages: newStages}
                            });
                          }}
                          className={`px-4 py-2 rounded-lg border capitalize ${
                            isSelected ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200'
                          }`}
                        >
                          {stage}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Size Suitability</Label>
                  <div className="flex gap-2">
                    {SIZE_OPTIONS.map(size => {
                      const isSelected = (selectedProduct.pet_safety?.size_suitability || []).includes(size);
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            const current = selectedProduct.pet_safety?.size_suitability || [];
                            const newSizes = isSelected
                              ? current.filter(s => s !== size)
                              : [...current, size];
                            setSelectedProduct({
                              ...selectedProduct,
                              pet_safety: {...selectedProduct.pet_safety, size_suitability: newSizes}
                            });
                          }}
                          className={`px-4 py-2 rounded-lg border capitalize ${
                            isSelected ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Dietary Flags</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_FLAGS.map(flag => {
                      const isSelected = (selectedProduct.pet_safety?.dietary_flags || []).includes(flag);
                      return (
                        <button
                          key={flag}
                          onClick={() => {
                            const current = selectedProduct.pet_safety?.dietary_flags || [];
                            const newFlags = isSelected
                              ? current.filter(f => f !== flag)
                              : [...current, flag];
                            setSelectedProduct({
                              ...selectedProduct,
                              pet_safety: {...selectedProduct.pet_safety, dietary_flags: newFlags}
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full border text-sm ${
                            isSelected ? 'bg-green-600 text-white border-green-600' : 'border-gray-200'
                          }`}
                        >
                          {flag.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label>Known Exclusions (allergies, restrictions)</Label>
                  <Input 
                    value={(selectedProduct.pet_safety?.known_exclusions || []).join(', ')}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      pet_safety: {
                        ...selectedProduct.pet_safety,
                        known_exclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="e.g., chicken, grain, lactose (comma separated)"
                  />
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Switch 
                    checked={selectedProduct.pet_safety?.is_validated || false}
                    onCheckedChange={(c) => setSelectedProduct({
                      ...selectedProduct,
                      pet_safety: {...selectedProduct.pet_safety, is_validated: c}
                    })}
                  />
                  <div>
                    <Label className="font-medium text-green-800">Mark Safety as Validated</Label>
                    <p className="text-sm text-green-700">Required for Mira to suggest this product</p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-4 mt-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                  <Switch 
                    checked={selectedProduct.paw_rewards?.is_reward_eligible || false}
                    onCheckedChange={(c) => setSelectedProduct({
                      ...selectedProduct,
                      paw_rewards: {...selectedProduct.paw_rewards, is_reward_eligible: c}
                    })}
                  />
                  <div>
                    <Label className="font-medium">Paw Reward Eligible</Label>
                    <p className="text-sm text-gray-600">Can be redeemed using Paw Rewards points</p>
                  </div>
                </div>
                
                {selectedProduct.paw_rewards?.is_reward_eligible && (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Switch 
                        checked={selectedProduct.paw_rewards?.is_reward_only || false}
                        onCheckedChange={(c) => setSelectedProduct({
                          ...selectedProduct,
                          paw_rewards: {...selectedProduct.paw_rewards, is_reward_only: c}
                        })}
                      />
                      <div>
                        <Label className="font-medium">Reward Only</Label>
                        <p className="text-sm text-gray-600">Cannot be purchased, only redeemable as reward</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Reward Value (points)</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.paw_rewards?.reward_value || 0}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            paw_rewards: {...selectedProduct.paw_rewards, reward_value: parseFloat(e.target.value)}
                          })}
                        />
                      </div>
                      <div>
                        <Label>Max Redemptions per Pet</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.paw_rewards?.max_redemptions_per_pet || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            paw_rewards: {...selectedProduct.paw_rewards, max_redemptions_per_pet: parseInt(e.target.value) || null}
                          })}
                          placeholder="Unlimited if empty"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Trigger Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {REWARD_TRIGGERS.map(trigger => {
                          const isSelected = (selectedProduct.paw_rewards?.trigger_conditions || []).includes(trigger);
                          return (
                            <button
                              key={trigger}
                              onClick={() => {
                                const current = selectedProduct.paw_rewards?.trigger_conditions || [];
                                const newTriggers = isSelected
                                  ? current.filter(t => t !== trigger)
                                  : [...current, trigger];
                                setSelectedProduct({
                                  ...selectedProduct,
                                  paw_rewards: {...selectedProduct.paw_rewards, trigger_conditions: newTriggers}
                                });
                              }}
                              className={`px-3 py-1.5 rounded-full border text-sm capitalize ${
                                isSelected ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200'
                              }`}
                            >
                              {trigger.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              {/* Mira AI Tab */}
              <TabsContent value="mira" className="space-y-4 mt-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-700">
                    <Bot className="w-4 h-4 inline mr-1" />
                    Control how Mira AI interacts with this product. Non-pushy by default.
                  </p>
                </Card>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Can Mira Reference?</Label>
                      <p className="text-sm text-gray-500">Allow Mira to mention this product</p>
                    </div>
                    <Switch 
                      checked={selectedProduct.mira_visibility?.can_reference ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        mira_visibility: {...selectedProduct.mira_visibility, can_reference: c}
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Can Suggest Proactively?</Label>
                      <p className="text-sm text-gray-500">Allow Mira to recommend without being asked</p>
                    </div>
                    <Switch 
                      checked={selectedProduct.mira_visibility?.can_suggest_proactively || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        mira_visibility: {...selectedProduct.mira_visibility, can_suggest_proactively: c}
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Mention Only if Asked?</Label>
                      <p className="text-sm text-gray-500">Only mention when user specifically asks</p>
                    </div>
                    <Switch 
                      checked={selectedProduct.mira_visibility?.mention_only_if_asked ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        mira_visibility: {...selectedProduct.mira_visibility, mention_only_if_asked: c}
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Suggestion Context</Label>
                  <Textarea 
                    value={selectedProduct.mira_visibility?.suggestion_context || ''}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      mira_visibility: {...selectedProduct.mira_visibility, suggestion_context: e.target.value}
                    })}
                    placeholder="When should Mira suggest this? e.g., 'When user mentions birthday celebration'"
                    rows={2}
                  />
                </div>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Base Price (₹)</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.pricing?.base_price || 0}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricing: {...selectedProduct.pricing, base_price: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  <div>
                    <Label>Compare At Price</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.pricing?.compare_at_price || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricing: {...selectedProduct.pricing, compare_at_price: parseFloat(e.target.value) || null}
                      })}
                      placeholder="Original price"
                    />
                  </div>
                  <div>
                    <Label>Cost Price</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.pricing?.cost_price || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricing: {...selectedProduct.pricing, cost_price: parseFloat(e.target.value) || null}
                      })}
                      placeholder="Your cost"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.pricing?.gst_applicable ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        pricing: {...selectedProduct.pricing, gst_applicable: c}
                      })}
                    />
                    <div>
                      <Label>GST Applicable</Label>
                    </div>
                  </div>
                  <div>
                    <Label>GST Rate (%)</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.pricing?.gst_rate || 18}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricing: {...selectedProduct.pricing, gst_rate: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Shipping
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Switch 
                        checked={selectedProduct.pricing?.requires_shipping ?? true}
                        onCheckedChange={(c) => setSelectedProduct({
                          ...selectedProduct,
                          pricing: {...selectedProduct.pricing, requires_shipping: c}
                        })}
                      />
                      <Label>Requires Shipping</Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Switch 
                        checked={selectedProduct.pricing?.free_shipping_eligible || false}
                        onCheckedChange={(c) => setSelectedProduct({
                          ...selectedProduct,
                          pricing: {...selectedProduct.pricing, free_shipping_eligible: c}
                        })}
                      />
                      <Label>Free Shipping Eligible</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Shipping Weight (kg)</Label>
                      <Input 
                        type="number"
                        step="0.1"
                        value={selectedProduct.pricing?.shipping_weight || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          pricing: {...selectedProduct.pricing, shipping_weight: parseFloat(e.target.value) || null}
                        })}
                      />
                    </div>
                    <div>
                      <Label>Shipping Class</Label>
                      <select 
                        value={selectedProduct.pricing?.shipping_class || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          pricing: {...selectedProduct.pricing, shipping_class: e.target.value}
                        })}
                        className="w-full h-10 px-3 rounded-md border border-gray-200"
                      >
                        <option value="">Standard</option>
                        <option value="express">Express</option>
                        <option value="fragile">Fragile</option>
                        <option value="refrigerated">Refrigerated</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={saveProduct} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedProductBox;
