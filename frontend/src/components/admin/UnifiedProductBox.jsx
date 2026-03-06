/**
 * Unified Product Box - Admin Component
 * The single source of truth for all products, rewards, and experiences
 * Enhanced with comprehensive 6-tab editor
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
  Download, Image, ImagePlus, Upload
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import ProductBoxEditor from './ProductBoxEditor';
import { ALL_PILLARS, DEFAULT_PRODUCT, LIFE_STAGES, SIZE_OPTIONS, OCCASIONS, MAIN_CATEGORIES, PRODUCT_TYPES } from './ProductBoxConfig';

// Keep local aliases for backward compatibility
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
  'dog', 'cat', 'puppy', 'kitten', 'senior',
  'grain-free', 'organic', 'natural', 'human-grade', 'vegan', 'vegetarian', 'single-protein',
  'treats', 'food', 'toys', 'grooming', 'health', 'accessories', 'celebration', 'birthday',
  'bestseller', 'new-arrival', 'sale', 'limited-edition', 'handmade', 'personalised',
  'eco-friendly', 'locally-made', 'imported', 'premium',
  'birthday-cake', 'party', 'gift', 'travel', 'training', 'dental', 'calming',
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
  
  // Quick Edit States
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [quickEditType, setQuickEditType] = useState(null); // 'image', 'price', 'pillars', 'name', 'mira_hint'
  const [quickEditValue, setQuickEditValue] = useState(null);
  const [quickSaving, setQuickSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShipping, setFilterShipping] = useState('');
  const [filterRewardEligible, setFilterRewardEligible] = useState(null);
  const [filterBreed, setFilterBreed] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterHasMiraHint, setFilterHasMiraHint] = useState('');
  
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
      if (filterBreed) params.append('breed', filterBreed);
      if (filterSize) params.append('size', filterSize);
      if (filterHasMiraHint) params.append('has_mira_hint', filterHasMiraHint);
      
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
  }, [page, searchTerm, filterType, filterPillar, filterStatus, filterShipping, filterRewardEligible, filterBreed, filterSize, filterHasMiraHint]);

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
        'category', 'subcategory', 'tags', 'image', 'image_url', 'images', 'media', 
        'price', 'originalPrice', 'base_price', 'pricing', 'gst_rate',
        'variants', 'options', 'has_variants', 'in_stock', 'visibility', 'available',
        'primary_pillar', 'pillars', 'paw_rewards', 'pet_safety', 'mira_visibility',
        'shopify_handle', 'sku', 'intelligent_tags', 'search_keywords',
        'breed_tags', 'health_tags', 'occasion_tags', 'diet_tags', 'lifestage_tags', 'size_tags',
        'breed_metadata', 'mira_hint', 'locally_edited',
        'reward_eligible', 'reward_value', 'reward_triggers',
        'mira_can_suggest', 'mira_can_reference'
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

  // Quick Edit Save - for image, price, pillars, name, mira_hint
  const quickSave = async () => {
    if (!quickEditProduct || !quickEditType) return;
    
    setQuickSaving(true);
    try {
      let updateData = {};
      
      if (quickEditType === 'image') {
        updateData = {
          image_url: quickEditValue,
          thumbnail: quickEditValue,
          images: [quickEditValue]
        };
      } else if (quickEditType === 'price') {
        updateData = {
          pricing: {
            ...quickEditProduct.pricing,
            base_price: parseFloat(quickEditValue) || 0,
            selling_price: parseFloat(quickEditValue) || 0
          },
          price: parseFloat(quickEditValue) || 0
        };
      } else if (quickEditType === 'pillars') {
        updateData = {
          pillars: quickEditValue,
          primary_pillar: quickEditValue[0] || quickEditProduct.primary_pillar
        };
      } else if (quickEditType === 'name') {
        updateData = {
          name: quickEditValue,
          product_name: quickEditValue,
          display_name: quickEditValue
        };
      } else if (quickEditType === 'mira_hint') {
        updateData = {
          mira_hint: quickEditValue
        };
      }
      
      const response = await fetch(`${API_URL}/api/product-box/products/${quickEditProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        toast({ title: 'Updated!', description: `${quickEditType} updated successfully` });
        setQuickEditProduct(null);
        setQuickEditType(null);
        setQuickEditValue(null);
        fetchProducts();
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to update', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Quick edit error:', err);
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setQuickSaving(false);
    }
  };

  // Open quick edit dialog
  const openQuickEdit = (product, type) => {
    setQuickEditProduct(product);
    setQuickEditType(type);
    if (type === 'image') {
      setQuickEditValue(product.image_url || '');
    } else if (type === 'price') {
      setQuickEditValue(product.pricing?.base_price || product.price || 0);
    } else if (type === 'pillars') {
      setQuickEditValue(product.pillars || [product.primary_pillar].filter(Boolean));
    } else if (type === 'name') {
      setQuickEditValue(product.name || '');
    } else if (type === 'mira_hint') {
      setQuickEditValue(product.mira_hint || '');
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
      
      // CSV Headers - includes Breed Intelligence
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Category', 'Tags',
        'Primary Pillar', 'All Pillars', 'Base Price', 'GST Rate',
        'In Stock', 'Reward Eligible', 'Reward Value', 'Reward Triggers',
        'Life Stages', 'Size Suitability', 'Dietary Flags',
        'Mira Can Reference', 'Mira Can Suggest', 'Mira Hint',
        'Breed Targets', 'Size Targets', 'Age Groups', 'Chew Strength', 'Energy Level', 'Sensitivities',
        'Short Description', 'Image URL'
      ];
      
      // Build CSV rows
      const rows = allProducts.map(p => {
        const breedMeta = p.breed_metadata || {};
        return [
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
          `"${(p.mira_hint || '').replace(/"/g, '""')}"`,
          `"${(breedMeta.breeds || []).join(', ')}"`,
          `"${(breedMeta.sizes || []).join(', ')}"`,
          `"${(breedMeta.age_groups || []).join(', ')}"`,
          breedMeta.chew_strength || '',
          breedMeta.energy_level || '',
          `"${(breedMeta.sensitivities || []).join(', ')}"`,
          `"${(p.short_description || '').replace(/"/g, '""').substring(0, 200)}"`,
          `"${p.image_url || p.images?.[0] || p.thumbnail || ''}"`
        ];
      });
      
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

  // Create new product using DEFAULT_PRODUCT template
  const createNewProduct = () => {
    setSelectedProduct({
      ...JSON.parse(JSON.stringify(DEFAULT_PRODUCT)),
      id: `NEW-${Date.now()}`,
      // Legacy flat fields for backward compat
      name: '',
      product_type: 'physical',
      primary_pillar: 'shop',
      pillars: ['shop'],
      category: '',
      price: 0,
      mrp: 0,
      in_stock: true,
      image: '',
      images: [],
      tags: []
    });
    setShowEditor(true);
  };

  // Generate Mira hint for a product using AI
  const generateMiraHint = async (product) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.id || product.basics?.id}/generate-hint`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        const hint = data.hint || data.mira_hint;
        if (hint) {
          setSelectedProduct(prev => ({
            ...prev,
            mira_hint: hint,
            mira_ai: {
              ...prev.mira_ai,
              ai_enrichment: {
                ...prev.mira_ai?.ai_enrichment,
                mira_hint: hint,
                mira_hint_generated_at: new Date().toISOString()
              }
            }
          }));
          toast({ title: 'Generated!', description: 'Mira hint created' });
        }
      }
    } catch (err) {
      console.error('Error generating hint:', err);
      toast({ title: 'Error', description: 'Failed to generate hint', variant: 'destructive' });
    }
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
        {ALL_PILLARS.map(p => (
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
          
          {/* Breed Intelligence Filters */}
          <select 
            value={filterBreed} 
            onChange={(e) => setFilterBreed(e.target.value)}
            className="h-10 px-3 rounded-md border border-purple-200 text-sm bg-purple-50"
            data-testid="filter-product-breed-select"
          >
            <option value="">🐕 All Breeds</option>
            <option value="Labrador">Labrador</option>
            <option value="Golden Retriever">Golden Retriever</option>
            <option value="Indie">Indie</option>
            <option value="German Shepherd">German Shepherd</option>
            <option value="Beagle">Beagle</option>
            <option value="Pug">Pug</option>
            <option value="Shih Tzu">Shih Tzu</option>
            <option value="Pomeranian">Pomeranian</option>
            <option value="Husky">Husky</option>
            <option value="Rottweiler">Rottweiler</option>
            <option value="Dachshund">Dachshund</option>
            <option value="Cocker Spaniel">Cocker Spaniel</option>
            <option value="French Bulldog">French Bulldog</option>
            <option value="Boxer">Boxer</option>
            <option value="Great Dane">Great Dane</option>
            <option value="Doberman">Doberman</option>
            <option value="Maltese">Maltese</option>
            <option value="Yorkshire Terrier">Yorkshire Terrier</option>
            <option value="Lhasa Apso">Lhasa Apso</option>
            <option value="Chihuahua">Chihuahua</option>
            <option value="Spitz">Spitz</option>
            <option value="Saint Bernard">Saint Bernard</option>
            <option value="Shiba Inu">Shiba Inu</option>
            <option value="Border Collie">Border Collie</option>
            <option value="Akita">Akita</option>
            <option value="Dalmatian">Dalmatian</option>
            <option value="Bulldog">Bulldog</option>
            <option value="Poodle">Poodle</option>
            <option value="Australian Shepherd">Australian Shepherd</option>
            <option value="Cavalier King Charles">Cavalier King Charles</option>
            <option value="Bernese Mountain Dog">Bernese Mountain Dog</option>
            <option value="Samoyed">Samoyed</option>
            <option value="Corgi">Corgi</option>
            <option value="Jack Russell">Jack Russell</option>
            <option value="Weimaraner">Weimaraner</option>
          </select>
          
          <select 
            value={filterSize} 
            onChange={(e) => setFilterSize(e.target.value)}
            className="h-10 px-3 rounded-md border border-purple-200 text-sm bg-purple-50"
            data-testid="filter-product-size-select"
          >
            <option value="">📏 All Sizes</option>
            <option value="XS">XS (Toy)</option>
            <option value="S">S (Small)</option>
            <option value="M">M (Medium)</option>
            <option value="L">L (Large)</option>
            <option value="XL">XL (Giant)</option>
          </select>
          
          <select 
            value={filterHasMiraHint} 
            onChange={(e) => setFilterHasMiraHint(e.target.value)}
            className="h-10 px-3 rounded-md border border-blue-200 text-sm bg-blue-50"
            data-testid="filter-mira-hint-select"
          >
            <option value="">✨ Mira Hints</option>
            <option value="true">Has Hint</option>
            <option value="false">No Hint</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setFilterType('');
            setFilterPillar('');
            setFilterStatus('');
            setFilterShipping('');
            setFilterRewardEligible(null);
            setFilterBreed('');
            setFilterSize('');
            setFilterHasMiraHint('');
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
                          {/* Clickable Image for Quick Edit */}
                          <button 
                            onClick={() => openQuickEdit(product, 'image')}
                            className="relative group"
                            title="Click to edit image"
                          >
                            {product.thumbnail || product.image_url || product.images?.[0] ? (
                              <img src={product.thumbnail || product.image_url || product.images?.[0]} alt="" className="w-10 h-10 rounded object-cover group-hover:opacity-70 transition-opacity" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Package className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit className="w-4 h-4 text-purple-600" />
                            </div>
                          </button>
                          <div>
                            <button 
                              onClick={() => openQuickEdit(product, 'name')}
                              className="font-medium text-gray-900 truncate max-w-[200px] hover:text-purple-600 text-left"
                              title="Click to edit name"
                            >
                              {product.name}
                            </button>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {PRODUCT_TYPES.find(t => t.id === product.product_type)?.icon} {product.product_type}
                        </Badge>
                      </td>
                      {/* Clickable Pillars for Quick Edit */}
                      <td className="p-3">
                        <button
                          onClick={() => openQuickEdit(product, 'pillars')}
                          className="flex flex-wrap gap-1 hover:bg-purple-50 p-1 rounded transition-colors"
                          title="Click to edit pillars"
                        >
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
                          {(!product.pillars || product.pillars.length === 0) && (
                            <span className="text-xs text-gray-400">+ Add</span>
                          )}
                        </button>
                      </td>
                      {/* Clickable Price for Quick Edit */}
                      <td className="p-3">
                        <button
                          onClick={() => openQuickEdit(product, 'price')}
                          className="font-medium hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                          title="Click to edit price"
                        >
                          ₹{product.pricing?.base_price || product.price || 0}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        {product.inventory?.track_inventory ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-medium ${
                              (product.inventory?.stock_quantity || 0) <= (product.inventory?.low_stock_threshold || 5)
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {product.inventory?.stock_quantity || 0}
                            </span>
                            {(product.inventory?.stock_quantity || 0) <= (product.inventory?.low_stock_threshold || 5) && (
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">No Track</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {product.paw_rewards?.is_reward_eligible ? (
                          <Gift className="w-5 h-5 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      {/* Clickable Mira column for quick hint edit */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openQuickEdit(product, 'mira_hint')}
                          className="hover:bg-purple-50 p-1 rounded transition-colors"
                          title={product.mira_hint ? 'Click to edit Mira hint' : 'Click to add Mira hint'}
                        >
                          {product.mira_visibility?.can_reference ? (
                            product.mira_visibility?.can_suggest_proactively ? (
                              <Bot className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <Bot className="w-5 h-5 text-blue-400 mx-auto" />
                            )
                          ) : (
                            <EyeOff className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </button>
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
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cloneProduct(product.id)}
                            data-testid={`clone-product-${product.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`delete-product-${product.id}`}
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
                  data-testid="products-prev-page-btn"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={(page + 1) * limit >= totalProducts}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="products-next-page-btn"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* NEW: Enhanced 6-Tab Product Editor - replaces old inline dialog */}
      <ProductBoxEditor
        product={selectedProduct}
        setProduct={setSelectedProduct}
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={saveProduct}
        saving={saving}
        onGenerateMiraHint={generateMiraHint}
      />
      
      
      {/* Quick Edit Dialog - Image, Price, Pillars */}
      <Dialog open={!!quickEditProduct && !!quickEditType} onOpenChange={() => { setQuickEditProduct(null); setQuickEditType(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-500" />
              Quick Edit: {quickEditType === 'image' ? 'Image' : quickEditType === 'price' ? 'Price' : quickEditType === 'pillars' ? 'Pillars' : quickEditType === 'name' ? 'Name' : 'Mira Hint'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {quickEditProduct && (
              <p className="text-sm text-gray-500 mb-4">
                Editing: <span className="font-medium text-gray-700">{quickEditProduct.name}</span>
              </p>
            )}
            
            {/* Name Edit */}
            {quickEditType === 'name' && (
              <div className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={quickEditValue || ''}
                    onChange={(e) => setQuickEditValue(e.target.value)}
                    placeholder="Enter product name..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            
            {/* Mira Hint Edit */}
            {quickEditType === 'mira_hint' && (
              <div className="space-y-4">
                <div>
                  <Label>Mira Hint (AI Assistant Tip)</Label>
                  <textarea
                    value={quickEditValue || ''}
                    onChange={(e) => setQuickEditValue(e.target.value)}
                    placeholder="Enter a helpful tip for Mira to use when recommending this product..."
                    className="mt-1 w-full h-32 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">This hint helps Mira make better recommendations to customers.</p>
                </div>
              </div>
            )}
            
            {/* Image Edit */}
            {quickEditType === 'image' && (
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0">
                    {quickEditValue ? (
                      <img src={quickEditValue} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label>Image URL</Label>
                    <Input
                      value={quickEditValue || ''}
                      onChange={(e) => setQuickEditValue(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste a direct image URL (Shopify, Unsplash, etc.)</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Price Edit */}
            {quickEditType === 'price' && (
              <div className="space-y-4">
                <div>
                  <Label>Selling Price (₹)</Label>
                  <Input
                    type="number"
                    value={quickEditValue || 0}
                    onChange={(e) => setQuickEditValue(e.target.value)}
                    className="mt-1 text-2xl font-bold"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500">This will update both base_price and selling_price</p>
              </div>
            )}
            
            {/* Pillars Edit */}
            {quickEditType === 'pillars' && (
              <div className="space-y-4">
                <Label>Select Pillars (product will appear in all selected pillars)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-[300px] overflow-y-auto p-2 border rounded">
                  {ALL_PILLARS.map(pillar => {
                    const isSelected = (quickEditValue || []).includes(pillar.id);
                    return (
                      <label
                        key={pillar.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickEditValue([...(quickEditValue || []), pillar.id]);
                            } else {
                              setQuickEditValue((quickEditValue || []).filter(p => p !== pillar.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-lg">{pillar.icon}</span>
                        <span className="text-sm">{pillar.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  Selected: {(quickEditValue || []).length} pillar(s). First pillar will be the primary.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setQuickEditProduct(null); setQuickEditType(null); }}>
              Cancel
            </Button>
            <Button onClick={quickSave} disabled={quickSaving} className="bg-purple-600 hover:bg-purple-700">
              {quickSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedProductBox;
