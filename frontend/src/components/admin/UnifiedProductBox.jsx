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
  Download, Image, ImagePlus
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// All pillars - THE 14 PILLARS
const ALL_PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂' },
  { id: 'dine', name: 'Dine', icon: '🍽️' },
  { id: 'stay', name: 'Stay', icon: '🏨' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'care', name: 'Care', icon: '💊' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾' },
  { id: 'fit', name: 'Fit', icon: '🏃' },
  { id: 'learn', name: 'Learn', icon: '🎓' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄' },
  { id: 'advisory', name: 'Advisory', icon: '📋' },
  { id: 'emergency', name: 'Emergency', icon: '🚨' },
  { id: 'farewell', name: 'Farewell', icon: '🌈' },
  { id: 'adopt', name: 'Adopt', icon: '🐾' },
  { id: 'shop', name: 'Shop', icon: '🛒' }
];

const PRODUCT_TYPES = [
  { id: 'physical', name: 'Physical Product', icon: '📦' },
  { id: 'service', name: 'Service', icon: '🛠️' },
  { id: 'experience', name: 'Experience', icon: '✨' },
  { id: 'reward', name: 'Reward Product', icon: '🎁' },
  { id: 'concierge', name: 'Concierge®', icon: '🛎️' },
  { id: 'bundle', name: 'Bundle', icon: '📦✨' }
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

// Common product tags for auto-fill
const COMMON_TAGS = [
  // Pet types
  'dog', 'cat', 'puppy', 'kitten', 'senior',
  // Diet
  'grain-free', 'organic', 'natural', 'human-grade', 'vegan', 'vegetarian', 'single-protein',
  // Categories
  'treats', 'food', 'toys', 'grooming', 'health', 'accessories', 'celebration', 'birthday',
  // Features
  'bestseller', 'new-arrival', 'sale', 'limited-edition', 'handmade', 'personalised',
  'eco-friendly', 'locally-made', 'imported', 'premium',
  // Occasions
  'birthday-cake', 'party', 'gift', 'travel', 'training', 'dental', 'calming',
  // Subscription
  'autoship-eligible', 'subscribe-save'
];

// Shipping zones
const SHIPPING_ZONES = [
  { id: 'local', name: 'Local (Same City)', baseCost: 50 },
  { id: 'metro', name: 'Metro Cities', baseCost: 99 },
  { id: 'national', name: 'National', baseCost: 149 },
  { id: 'remote', name: 'Remote Areas', baseCost: 249 }
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
  const [filterShipping, setFilterShipping] = useState('');
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
      if (filterShipping) params.append('shipping', filterShipping);
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
  }, [page, searchTerm, filterType, filterPillar, filterStatus, filterShipping, filterRewardEligible]);

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
      
      // Sanitize the product data to avoid serialization issues
      const sanitizedProduct = {};
      const allowedFields = [
        'name', 'product_type', 'short_description', 'long_description', 'description',
        'category', 'subcategory', 'tags', 'image_url', 'images', 'pricing',
        'variants', 'options', 'has_variants', 'in_stock', 'visibility',
        'primary_pillar', 'pillars', 'paw_rewards', 'pet_safety', 'mira_visibility',
        'shopify_handle', 'sku', 'intelligent_tags', 'search_keywords',
        'breed_tags', 'health_tags', 'occasion_tags', 'diet_tags', 'lifestage_tags', 'size_tags'
      ];
      
      for (const field of allowedFields) {
        if (selectedProduct[field] !== undefined) {
          sanitizedProduct[field] = selectedProduct[field];
        }
      }
      
      // For new products, include the ID if it's not a temp ID
      if (isNew && selectedProduct.id && !selectedProduct.id.startsWith('NEW-')) {
        sanitizedProduct.id = selectedProduct.id;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedProduct)
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
      if (filterShipping) params.append('shipping', filterShipping);
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
        'Mira Can Reference', 'Mira Can Suggest', 'Short Description', 'Image URL'
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
        `"${(p.short_description || '').replace(/"/g, '""').substring(0, 200)}"`,
        `"${p.image_url || p.images?.[0] || p.thumbnail || ''}"`
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
    if (!confirm('This will:\n1. Migrate products from old collection\n2. Sync Stay properties to products\n3. Auto-assign pillars based on categories/tags\n4. Enable rewards for 30% of products\n\nContinue?')) return;
    
    setSeeding(true);
    try {
      // Step 1: Migrate from old products collection + sync Stay
      toast({ title: 'Step 1/4', description: 'Migrating products & syncing Stay...' });
      const migrateRes = await fetch(`${API_URL}/api/product-box/migrate-from-products`, { method: 'POST' });
      const migrateData = await migrateRes.json();
      
      // Step 2: Auto-seed pillars
      toast({ title: 'Step 2/4', description: 'Assigning pillars...' });
      const pillarsRes = await fetch(`${API_URL}/api/product-box/auto-seed-pillars`, { method: 'POST' });
      const pillarsData = await pillarsRes.json();
      
      // Step 3: Enable rewards
      toast({ title: 'Step 3/4', description: 'Enabling rewards...' });
      const rewardsRes = await fetch(`${API_URL}/api/product-box/auto-enable-rewards?percentage=30`, { method: 'POST' });
      const rewardsData = await rewardsRes.json();
      
      // Step 4: Also seed Stay properties and bundles
      toast({ title: 'Step 4/4', description: 'Seeding Stay bundles...' });
      try {
        await fetch(`${API_URL}/api/admin/stay/seed`, { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa('aditya:lola4304') } });
        await fetch(`${API_URL}/api/admin/stay/seed-bundles`, { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa('aditya:lola4304') } });
      } catch (e) { console.log('Stay seed skipped:', e); }
      
      // Show results
      const totalMigrated = migrateData.migrated || 0;
      const staySynced = migrateData.stay_synced || 0;
      const totalSeeded = pillarsData.updated_count || 0;
      const totalRewards = rewardsData.updated_count || 0;
      
      toast({ 
        title: 'Seed Complete!', 
        description: `Migrated: ${totalMigrated}, Stay: ${staySynced}, Pillars: ${totalSeeded}, Rewards: ${totalRewards}` 
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
      primary_pillar: 'shop',
      pillars: ['shop'],
      
      // Basic info
      short_description: '',
      long_description: '',
      usage_context: '',
      key_benefits: [],
      brand: '',
      
      // Categorization
      category: '',
      subcategory: '',
      tags: [],
      intelligent_tags: [],
      collections: [],
      
      // Media
      image_url: '',
      image_alt: '',
      images: [],
      video_url: '',
      
      // Identity
      identity: {
        barcode: '',
        shopify_id: '',
        external_source: 'manual',
        vendor_id: '',
        partner_id: ''
      },
      
      // Pricing
      pricing: {
        base_price: 0,
        compare_at_price: null,
        cost_price: null,
        gst_applicable: true,
        gst_rate: 18,
        hsn_code: '',
        price_includes_gst: false,
        price_model: 'fixed',
        currency: 'INR'
      },
      
      // Inventory
      inventory: {
        in_stock: true,
        track_inventory: false,
        stock_quantity: null,
        low_stock_threshold: 5,
        allow_backorder: false
      },
      
      // Shipping
      shipping: {
        requires_shipping: true,
        shipping_class: 'standard',
        cold_chain_required: false,
        is_pan_india: false,
        delivery_zones: [],
        preparation_time: '',
        dispatch_sla_hours: 48,
        delivery_sla_days: 5,
        at_home_available: false
      },
      
      // Pet Safety
      pet_safety: {
        species: 'dog',
        life_stages: ['all'],
        size_suitability: ['all'],
        dietary_flags: [],
        allergens: [],
        ingredients: [],
        known_exclusions: [],
        risk_level: 'safe',
        safety_notes: '',
        is_validated: false
      },
      
      // Paw Rewards
      paw_rewards: {
        points_per_rupee: 1,
        is_redeemable: false,
        is_reward_only: false,
        points_required: null,
        reward_value: 0,
        trigger_conditions: [],
        tier_eligibility: ['all'],
        stackable_with_coupons: true
      },
      
      // Mira AI
      mira_visibility: {
        can_reference: true,
        can_suggest_proactively: false,
        suggestion_contexts: [],
        knowledge_confidence: 'high',
        requires_verification: false,
        upsell_items: [],
        cross_sell_items: []
      },
      
      // Bundle
      bundle: {
        is_bundle: false,
        bundle_items: [],
        bundle_price: null,
        savings_display: ''
      },
      
      // Visibility
      visibility: {
        status: 'draft',
        visible_on_site: true,
        member_only: false,
        concierge_only: false,
        featured: false,
        searchable: true,
        city_visibility: [],
        publish_date: null
      },
      
      // Pillar-specific config (populated based on primary_pillar)
      pillar_config: {},
      
      // Legacy compat
      in_stock: true,
      stock_quantity: null
    });
    setShowEditor(true);
  };

  return (
    <div className="space-y-6" data-testid="product-box-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="product-box-title">
            <Package className="w-7 h-7 text-purple-600" />
            Unified Product Box
          </h2>
          <p className="text-gray-500 text-sm">Single source of truth for all products, rewards & experiences</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={seedAll} 
            variant="outline" 
            disabled={seeding}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            data-testid="seed-products-btn"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Seed All
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            disabled={exporting}
            className="border-green-300 text-green-700 hover:bg-green-50"
            data-testid="export-products-btn"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={createNewProduct} className="bg-purple-600 hover:bg-purple-700" data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Stats Overview - Enhanced with Icons */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="product-stats-cards">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-gray-500 font-medium">Total</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-500 font-medium">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.by_status?.active || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-gray-500 font-medium">Rewards</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.rewards?.eligible || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-gray-500 font-medium">Mira</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.mira?.visible || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-white border-pink-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <p className="text-xs text-gray-500 font-medium">Suggest</p>
            </div>
            <p className="text-2xl font-bold text-pink-600">{stats.mira?.suggestable || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-gray-50 to-white border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">Draft</p>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.by_status?.draft || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-red-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-500 font-medium">Low Stock</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.low_stock || 0}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <p className="text-xs text-gray-500 font-medium">Sold</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.total_sold || 0}</p>
          </Card>
        </div>
      )}

      {/* Pillar Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPillar === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPillar('')}
          className="h-8"
          data-testid="filter-all-product-pillars"
        >
          All Pillars
        </Button>
        {ALL_PILLARS.slice(0, 8).map(p => (
          <Button
            key={p.id}
            variant={filterPillar === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPillar(p.id)}
            className="h-8"
            data-testid={`filter-product-pillar-${p.id}`}
          >
            {p.icon} {p.name}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4" data-testid="product-filters-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-products-input"
              />
            </div>
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 text-sm"
            data-testid="filter-product-type-select"
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
            data-testid="filter-product-pillar-select"
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
            data-testid="filter-product-status-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          
          <select 
            value={filterShipping} 
            onChange={(e) => setFilterShipping(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 text-sm"
            data-testid="filter-product-shipping-select"
          >
            <option value="">All Shipping</option>
            <option value="pan-india">Pan India</option>
            <option value="local">Local Only</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterType('');
            setFilterPillar('');
            setFilterStatus('');
            setFilterShipping('');
            setFilterRewardEligible(null);
          }} data-testid="clear-product-filters-btn">
            <RefreshCw className="w-4 h-4 mr-1" /> Clear
          </Button>
          
          {/* Sync Actions */}
          <div className="border-l pl-3 ml-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/admin/stay/sync-to-products`, { method: 'POST' });
                  if (res.ok) {
                    const data = await res.json();
                    toast({ title: '✅ Stay Synced', description: `${data.synced} properties synced to products` });
                    fetchProducts();
                  }
                } catch (err) {
                  toast({ title: 'Sync Failed', description: err.message, variant: 'destructive' });
                }
              }}
            >
              🏨 Sync Stay
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/admin/force-seed-all-products`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    toast({ title: '✅ All Products Seeded', description: `${data.total} products across pillars` });
                    fetchProducts();
                  }
                } catch (err) {
                  toast({ title: 'Seed Failed', description: err.message, variant: 'destructive' });
                }
              }}
            >
              🌟 Seed All Pillars
            </Button>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden" data-testid="products-table-card">
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
              <table className="w-full text-sm" data-testid="products-table">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Product</th>
                    <th className="text-left p-3 font-medium text-gray-600">Type</th>
                    <th className="text-left p-3 font-medium text-gray-600">Pillars</th>
                    <th className="text-left p-3 font-medium text-gray-600">Price</th>
                    <th className="text-center p-3 font-medium text-gray-600">Stock</th>
                    <th className="text-center p-3 font-medium text-gray-600">Reward</th>
                    <th className="text-center p-3 font-medium text-gray-600">Mira</th>
                    <th className="text-center p-3 font-medium text-gray-600">Safety</th>
                    <th className="text-center p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50" data-testid={`product-row-${product.id}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {product.thumbnail || product.image_url || product.images?.[0] ? (
                            <img src={product.thumbnail || product.image_url || product.images?.[0]} alt="" className="w-10 h-10 rounded object-cover" />
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
              <TabsList className="grid grid-cols-8 w-full text-xs">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="pillars">Pillars</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="safety">Pet Safety</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="mira">Mira AI</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Row 1: Name + Type + Primary Pillar */}
                <div className="grid grid-cols-3 gap-4">
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
                  <div>
                    <Label>Primary Pillar *</Label>
                    <select 
                      value={selectedProduct.primary_pillar || 'shop'}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct, 
                        primary_pillar: e.target.value,
                        pillars: selectedProduct.pillars?.includes(e.target.value) 
                          ? selectedProduct.pillars 
                          : [e.target.value, ...(selectedProduct.pillars || [])]
                      })}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      {ALL_PILLARS.map(p => (
                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Row 2: SKU + Barcode + Brand */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>SKU</Label>
                    <Input 
                      value={selectedProduct.sku || ''}
                      onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value})}
                      placeholder="Stock Keeping Unit"
                    />
                  </div>
                  <div>
                    <Label>Barcode</Label>
                    <Input 
                      value={selectedProduct.identity?.barcode || ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct, 
                        identity: {...(selectedProduct.identity || {}), barcode: e.target.value}
                      })}
                      placeholder="UPC/EAN"
                    />
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input 
                      value={selectedProduct.brand || ''}
                      onChange={(e) => setSelectedProduct({...selectedProduct, brand: e.target.value})}
                      placeholder="Manufacturer/Brand"
                    />
                  </div>
                </div>
                
                {/* Short Description */}
                <div>
                  <Label>Short Description (100-140 chars) *</Label>
                  <Input 
                    value={selectedProduct.short_description || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, short_description: e.target.value})}
                    placeholder="Brief description for product cards"
                    maxLength={140}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedProduct.short_description || '').length}/140 characters
                  </p>
                </div>
                
                {/* Long Description */}
                <div>
                  <Label>Long Description</Label>
                  <Textarea 
                    value={selectedProduct.long_description || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, long_description: e.target.value})}
                    placeholder="Full product description (supports markdown)"
                    rows={4}
                  />
                </div>
                
                {/* Usage Context */}
                <div>
                  <Label>Usage Context</Label>
                  <Input 
                    value={selectedProduct.usage_context || ''}
                    onChange={(e) => setSelectedProduct({...selectedProduct, usage_context: e.target.value})}
                    placeholder="When to use / when to avoid"
                  />
                </div>
                
                {/* Image Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <Label className="flex items-center gap-2 mb-3">
                    <Image className="w-4 h-4" /> Product Media
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Input 
                        value={selectedProduct.image_url || selectedProduct.images?.[0] || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct, 
                          image_url: e.target.value,
                          images: e.target.value ? [e.target.value, ...(selectedProduct.images?.slice(1) || [])] : selectedProduct.images
                        })}
                        placeholder="Primary image URL"
                      />
                      <Input 
                        value={selectedProduct.image_alt || ''}
                        onChange={(e) => setSelectedProduct({...selectedProduct, image_alt: e.target.value})}
                        placeholder="Image alt text (for accessibility)"
                      />
                      <Input 
                        value={selectedProduct.video_url || ''}
                        onChange={(e) => setSelectedProduct({...selectedProduct, video_url: e.target.value})}
                        placeholder="Video URL (optional)"
                      />
                    </div>
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg bg-white h-32">
                      {(selectedProduct.image_url || selectedProduct.images?.[0]) ? (
                        <img 
                          src={selectedProduct.image_url || selectedProduct.images?.[0]} 
                          alt="Preview" 
                          className="h-full w-full object-contain rounded-lg"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=No+Image'; }}
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <ImagePlus className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">No Image</span>
                        </div>
                      )}
                    </div>
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
                
                {/* Tags Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <Label className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4" /> Product Tags
                  </Label>
                  <div className="space-y-3">
                    {/* Current Tags */}
                    <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-white rounded-lg border">
                      {(selectedProduct.tags || []).length === 0 ? (
                        <span className="text-gray-400 text-sm">No tags - click suggestions below to add</span>
                      ) : (
                        (selectedProduct.tags || []).map((tag, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-red-100 hover:text-red-800"
                            onClick={() => setSelectedProduct({
                              ...selectedProduct,
                              tags: selectedProduct.tags.filter((_, i) => i !== idx)
                            })}
                          >
                            {tag} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))
                      )}
                    </div>
                    
                    {/* Manual Tag Input */}
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add custom tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            const newTag = e.target.value.trim().toLowerCase().replace(/\s+/g, '-');
                            if (!(selectedProduct.tags || []).includes(newTag)) {
                              setSelectedProduct({
                                ...selectedProduct,
                                tags: [...(selectedProduct.tags || []), newTag]
                              });
                            }
                            e.target.value = '';
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Auto-generate tags based on product info
                          const autoTags = [];
                          const name = (selectedProduct.name || '').toLowerCase();
                          const desc = (selectedProduct.short_description || '').toLowerCase();
                          const category = (selectedProduct.category || '').toLowerCase();
                          
                          // Add category as tag
                          if (category && !autoTags.includes(category)) autoTags.push(category);
                          
                          // Check common tags
                          COMMON_TAGS.forEach(tag => {
                            if ((name.includes(tag.replace('-', ' ')) || desc.includes(tag.replace('-', ' '))) && !autoTags.includes(tag)) {
                              autoTags.push(tag);
                            }
                          });
                          
                          // Merge with existing
                          const merged = [...new Set([...(selectedProduct.tags || []), ...autoTags])];
                          setSelectedProduct({ ...selectedProduct, tags: merged });
                          toast({ title: `Added ${autoTags.length} auto-detected tags` });
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" /> Auto-Fill
                      </Button>
                    </div>
                    
                    {/* Tag Suggestions */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Quick Add:</p>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_TAGS.slice(0, 20).filter(t => !(selectedProduct.tags || []).includes(t)).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setSelectedProduct({
                              ...selectedProduct,
                              tags: [...(selectedProduct.tags || []), tag]
                            })}
                            className="px-2 py-0.5 text-xs rounded-full bg-white border border-gray-200 hover:bg-purple-100 hover:border-purple-300"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
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
                {/* Sub-tabs for Pricing section */}
                <Tabs defaultValue="product-pricing" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full bg-gray-100">
                    <TabsTrigger value="product-pricing" className="text-xs">💰 Product Pricing</TabsTrigger>
                    <TabsTrigger value="shipping" className="text-xs">🚚 Shipping</TabsTrigger>
                    <TabsTrigger value="tax" className="text-xs">📋 Tax & GST</TabsTrigger>
                    <TabsTrigger value="commercial" className="text-xs">📊 Commercial</TabsTrigger>
                  </TabsList>
                  
                  {/* Product Pricing Sub-Tab */}
                  <TabsContent value="product-pricing" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Base Price (₹) *</Label>
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
                        <Label>Compare At Price (₹)</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.pricing?.compare_at_price || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, compare_at_price: parseFloat(e.target.value) || null}
                          })}
                          placeholder="MRP / Original price"
                        />
                      </div>
                      <div>
                        <Label>Cost Price (₹)</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.pricing?.cost_price || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, cost_price: parseFloat(e.target.value) || null}
                          })}
                          placeholder="Your purchase cost"
                        />
                      </div>
                    </div>
                    
                    {/* Calculated Margins */}
                    {selectedProduct.pricing?.base_price > 0 && (
                      <Card className="p-4 bg-green-50">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Selling Price</p>
                            <p className="text-xl font-bold text-green-700">₹{selectedProduct.pricing.base_price?.toLocaleString()}</p>
                          </div>
                          {selectedProduct.pricing?.compare_at_price > 0 && (
                            <div>
                              <p className="text-gray-600">Discount</p>
                              <p className="text-xl font-bold text-orange-600">
                                {Math.round((1 - selectedProduct.pricing.base_price / selectedProduct.pricing.compare_at_price) * 100)}% OFF
                              </p>
                            </div>
                          )}
                          {selectedProduct.pricing?.cost_price > 0 && (
                            <div>
                              <p className="text-gray-600">Margin</p>
                              <p className="text-xl font-bold text-blue-600">
                                ₹{(selectedProduct.pricing.base_price - selectedProduct.pricing.cost_price).toLocaleString()}
                                <span className="text-sm font-normal"> ({Math.round((1 - selectedProduct.pricing.cost_price / selectedProduct.pricing.base_price) * 100)}%)</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                    
                    {/* Autoship Pricing */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Switch 
                          checked={selectedProduct.pricing?.autoship_eligible || false}
                          onCheckedChange={(c) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, autoship_eligible: c}
                          })}
                        />
                        <div>
                          <Label className="font-medium">Autoship Eligible</Label>
                          <p className="text-sm text-gray-500">Enable subscribe & save pricing</p>
                        </div>
                      </div>
                      
                      {selectedProduct.pricing?.autoship_eligible && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pl-6 border-l-2 border-purple-200">
                          <div>
                            <Label>Autoship Discount (%)</Label>
                            <Input 
                              type="number"
                              value={selectedProduct.pricing?.autoship_discount || 10}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, autoship_discount: parseFloat(e.target.value)}
                              })}
                            />
                          </div>
                          <div>
                            <Label>Autoship Price (₹)</Label>
                            <p className="h-10 flex items-center text-lg font-bold text-purple-600">
                              ₹{Math.round(selectedProduct.pricing.base_price * (1 - (selectedProduct.pricing?.autoship_discount || 10) / 100)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Shipping Sub-Tab */}
                  <TabsContent value="shipping" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <Switch 
                          checked={selectedProduct.pricing?.requires_shipping ?? true}
                          onCheckedChange={(c) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, requires_shipping: c}
                          })}
                        />
                        <div>
                          <Label>Requires Shipping</Label>
                          <p className="text-xs text-gray-500">Physical delivery needed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <Switch 
                          checked={selectedProduct.pricing?.free_shipping_eligible || false}
                          onCheckedChange={(c) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, free_shipping_eligible: c}
                          })}
                        />
                        <div>
                          <Label>Free Shipping Eligible</Label>
                          <p className="text-xs text-gray-500">Include in free shipping offers</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedProduct.pricing?.requires_shipping && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Weight (kg)</Label>
                            <Input 
                              type="number"
                              step="0.1"
                              value={selectedProduct.pricing?.shipping_weight || ''}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, shipping_weight: parseFloat(e.target.value) || null}
                              })}
                              placeholder="0.5"
                            />
                          </div>
                          <div>
                            <Label>Dimensions (LxWxH cm)</Label>
                            <Input 
                              value={selectedProduct.pricing?.shipping_dimensions || ''}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, shipping_dimensions: e.target.value}
                              })}
                              placeholder="20x15x10"
                            />
                          </div>
                          <div>
                            <Label>Shipping Class</Label>
                            <select 
                              value={selectedProduct.pricing?.shipping_class || 'standard'}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, shipping_class: e.target.value}
                              })}
                              className="w-full h-10 px-3 rounded-md border border-gray-200"
                            >
                              <option value="standard">📦 Standard</option>
                              <option value="express">🚀 Express</option>
                              <option value="fragile">⚠️ Fragile</option>
                              <option value="refrigerated">❄️ Refrigerated</option>
                              <option value="same_day">⚡ Same Day</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Shipping Zones */}
                        <div className="border rounded-lg p-4">
                          <Label className="mb-3 block">Shipping Zone Pricing</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {SHIPPING_ZONES.map(zone => (
                              <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-sm">{zone.name}</p>
                                  <p className="text-xs text-gray-500">Base: ₹{zone.baseCost}</p>
                                </div>
                                <Input 
                                  type="number"
                                  className="w-24"
                                  value={selectedProduct.pricing?.zone_shipping?.[zone.id] || zone.baseCost}
                                  onChange={(e) => setSelectedProduct({
                                    ...selectedProduct,
                                    pricing: {
                                      ...selectedProduct.pricing,
                                      zone_shipping: {
                                        ...(selectedProduct.pricing?.zone_shipping || {}),
                                        [zone.id]: parseFloat(e.target.value)
                                      }
                                    }
                                  })}
                                  placeholder={`₹${zone.baseCost}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Delivery Estimate */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Min Delivery Days</Label>
                            <Input 
                              type="number"
                              value={selectedProduct.pricing?.min_delivery_days || 2}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, min_delivery_days: parseInt(e.target.value)}
                              })}
                            />
                          </div>
                          <div>
                            <Label>Max Delivery Days</Label>
                            <Input 
                              type="number"
                              value={selectedProduct.pricing?.max_delivery_days || 5}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {...selectedProduct.pricing, max_delivery_days: parseInt(e.target.value)}
                              })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  {/* Tax & GST Sub-Tab */}
                  <TabsContent value="tax" className="space-y-4 mt-4">
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
                          <p className="text-xs text-gray-500">Include GST in pricing</p>
                        </div>
                      </div>
                      <div>
                        <Label>GST Rate (%)</Label>
                        <select 
                          value={selectedProduct.pricing?.gst_rate || 18}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, gst_rate: parseFloat(e.target.value)}
                          })}
                          className="w-full h-10 px-3 rounded-md border border-gray-200"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% (Essential)</option>
                          <option value={12}>12% (Standard)</option>
                          <option value={18}>18% (Standard)</option>
                          <option value={28}>28% (Luxury)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>HSN Code</Label>
                        <Input 
                          value={selectedProduct.pricing?.hsn_code || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, hsn_code: e.target.value}
                          })}
                          placeholder="e.g., 23091090"
                        />
                      </div>
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <Switch 
                          checked={selectedProduct.pricing?.price_includes_tax ?? true}
                          onCheckedChange={(c) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, price_includes_tax: c}
                          })}
                        />
                        <div>
                          <Label>Price Includes Tax</Label>
                          <p className="text-xs text-gray-500">GST included in base price</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tax Calculation Preview */}
                    {selectedProduct.pricing?.base_price > 0 && selectedProduct.pricing?.gst_applicable && (
                      <Card className="p-4 bg-blue-50">
                        <p className="text-sm font-medium text-blue-800 mb-2">Tax Calculation Preview</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Base Price</p>
                            <p className="font-bold">₹{selectedProduct.pricing.base_price.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">GST ({selectedProduct.pricing?.gst_rate || 18}%)</p>
                            <p className="font-bold">₹{Math.round(selectedProduct.pricing.base_price * (selectedProduct.pricing?.gst_rate || 18) / 100).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-bold text-blue-700">₹{Math.round(selectedProduct.pricing.base_price * (1 + (selectedProduct.pricing?.gst_rate || 18) / 100)).toLocaleString()}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </TabsContent>
                  
                  {/* Commercial Sub-Tab */}
                  <TabsContent value="commercial" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Vendor / Supplier</Label>
                        <Input 
                          value={selectedProduct.pricing?.vendor || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, vendor: e.target.value}
                          })}
                          placeholder="Supplier name"
                        />
                      </div>
                      <div>
                        <Label>Vendor SKU</Label>
                        <Input 
                          value={selectedProduct.pricing?.vendor_sku || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, vendor_sku: e.target.value}
                          })}
                          placeholder="Vendor's product code"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Min Order Qty</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.pricing?.min_order_qty || 1}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, min_order_qty: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                      <div>
                        <Label>Max Order Qty</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.pricing?.max_order_qty || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, max_order_qty: parseInt(e.target.value) || null}
                          })}
                          placeholder="No limit"
                        />
                      </div>
                      <div>
                        <Label>Stock Quantity</Label>
                        <Input 
                          type="number"
                          value={selectedProduct.pricing?.stock_quantity || ''}
                          onChange={(e) => setSelectedProduct({
                            ...selectedProduct,
                            pricing: {...selectedProduct.pricing, stock_quantity: parseInt(e.target.value) || null}
                          })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                    
                    {/* Partner Commission */}
                    <div className="border rounded-lg p-4">
                      <Label className="mb-3 block flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Partner Commission Settings
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Commission Type</Label>
                          <select 
                            value={selectedProduct.pricing?.commission_type || 'percentage'}
                            onChange={(e) => setSelectedProduct({
                              ...selectedProduct,
                              pricing: {...selectedProduct.pricing, commission_type: e.target.value}
                            })}
                            className="w-full h-10 px-3 rounded-md border border-gray-200"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <Label>Commission Value</Label>
                          <Input 
                            type="number"
                            value={selectedProduct.pricing?.commission_value || 10}
                            onChange={(e) => setSelectedProduct({
                              ...selectedProduct,
                              pricing: {...selectedProduct.pricing, commission_value: parseFloat(e.target.value)}
                            })}
                            placeholder={selectedProduct.pricing?.commission_type === 'fixed' ? '₹ amount' : '% percentage'}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.inventory?.track_inventory || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        inventory: {...(selectedProduct.inventory || {}), track_inventory: c}
                      })}
                    />
                    <div>
                      <Label>Track Inventory</Label>
                      <p className="text-xs text-gray-500">Monitor stock levels</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.inventory?.in_stock ?? selectedProduct.in_stock ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        in_stock: c,
                        inventory: {...(selectedProduct.inventory || {}), in_stock: c}
                      })}
                    />
                    <div>
                      <Label>In Stock</Label>
                      <p className="text-xs text-gray-500">Product available for sale</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.inventory?.stock_quantity ?? selectedProduct.stock_quantity ?? ''}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        stock_quantity: parseInt(e.target.value) || null,
                        inventory: {...(selectedProduct.inventory || {}), stock_quantity: parseInt(e.target.value) || null}
                      })}
                      placeholder="Current stock"
                    />
                  </div>
                  <div>
                    <Label>Low Stock Threshold</Label>
                    <Input 
                      type="number"
                      value={selectedProduct.inventory?.low_stock_threshold || 5}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        inventory: {...(selectedProduct.inventory || {}), low_stock_threshold: parseInt(e.target.value)}
                      })}
                      placeholder="Alert when below"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.inventory?.allow_backorder || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        inventory: {...(selectedProduct.inventory || {}), allow_backorder: c}
                      })}
                    />
                    <div>
                      <Label>Allow Backorder</Label>
                      <p className="text-xs text-gray-500">Accept when OOS</p>
                    </div>
                  </div>
                </div>
                
                {/* Perishables */}
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium mb-3 block">Perishable Items</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Shelf Life (days)</Label>
                      <Input 
                        type="number"
                        value={selectedProduct.inventory?.shelf_life_days || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          inventory: {...(selectedProduct.inventory || {}), shelf_life_days: parseInt(e.target.value) || null}
                        })}
                        placeholder="Days before expiry"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Warehouse Location</Label>
                      <Input 
                        value={selectedProduct.inventory?.warehouse_location || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          inventory: {...(selectedProduct.inventory || {}), warehouse_location: e.target.value}
                        })}
                        placeholder="Storage location"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Visibility Tab */}
              <TabsContent value="visibility" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status *</Label>
                    <select 
                      value={selectedProduct.visibility?.status || 'draft'}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), status: e.target.value}
                      })}
                      className="w-full h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="pending_approval">⏳ Pending Approval</option>
                      <option value="active">✅ Active</option>
                      <option value="paused">⏸️ Paused</option>
                      <option value="archived">📦 Archived</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.visibility?.featured || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), featured: c}
                      })}
                    />
                    <div>
                      <Label>Featured</Label>
                      <p className="text-xs text-gray-500">Show prominently</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.visibility?.visible_on_site ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), visible_on_site: c}
                      })}
                    />
                    <Label className="text-sm">On Website</Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.visibility?.member_only || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), member_only: c}
                      })}
                    />
                    <Label className="text-sm">Members Only</Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.visibility?.concierge_only || false}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), concierge_only: c}
                      })}
                    />
                    <Label className="text-sm">Concierge Only</Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Switch 
                      checked={selectedProduct.visibility?.searchable ?? true}
                      onCheckedChange={(c) => setSelectedProduct({
                        ...selectedProduct,
                        visibility: {...(selectedProduct.visibility || {}), searchable: c}
                      })}
                    />
                    <Label className="text-sm">Searchable</Label>
                  </div>
                </div>
                
                {/* City Visibility */}
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium mb-3 block">City/Region Visibility</Label>
                  <p className="text-xs text-gray-500 mb-3">Leave empty for all cities</p>
                  <Input 
                    value={(selectedProduct.visibility?.city_visibility || []).join(', ')}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      visibility: {
                        ...(selectedProduct.visibility || {}), 
                        city_visibility: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="mumbai, delhi, bangalore..."
                  />
                </div>
                
                {/* Publish Scheduling */}
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium mb-3 block">Publish Scheduling</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Publish Date</Label>
                      <Input 
                        type="datetime-local"
                        value={selectedProduct.visibility?.publish_date || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          visibility: {...(selectedProduct.visibility || {}), publish_date: e.target.value || null}
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unpublish Date</Label>
                      <Input 
                        type="datetime-local"
                        value={selectedProduct.visibility?.unpublish_date || ''}
                        onChange={(e) => setSelectedProduct({
                          ...selectedProduct,
                          visibility: {...(selectedProduct.visibility || {}), unpublish_date: e.target.value || null}
                        })}
                      />
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
