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
  Download, Image, ImagePlus, Upload, Palette, Percent, Box, Layers
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
  const [uploadingImage, setUploadingImage] = useState(false);
  
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
  const [filterSource, setFilterSource] = useState('');  // NEW: shopify, soul_made, manual
  const [filterCategory, setFilterCategory] = useState('');  // Category filter
  const [dynamicCategoryList, setDynamicCategoryList] = useState([]);
  
  // Bulk Selection
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSubCategory, setBulkSubCategory] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const limit = 20;

  // Soul Made Actions
  const [soulMadeAction, setSoulMadeAction] = useState(null); // 'duplicate', 'sale', 'stock', 'pillars', 'variants'
  const [soulMadeProduct, setSoulMadeProduct] = useState(null);
  const [soulMadeLoading, setSoulMadeLoading] = useState(false);
  const [saleData, setSaleData] = useState({ sale_price: '', compare_at_price: '' });
  const [stockData, setStockData] = useState({ stock_quantity: '', low_stock_threshold: 10 });
  const [variantsData, setVariantsData] = useState([
    { size: 'S', price: '', stock: 50 },
    { size: 'M', price: '', stock: 100 },
    { size: 'L', price: '', stock: 50 }
  ]);
  const [pillarsData, setPillarsData] = useState([]);

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
      if (filterSource) params.append('source', filterSource);  // NEW: Source filter
      if (filterCategory) params.append('category', filterCategory);  // Category filter
      
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
  }, [page, searchTerm, filterType, filterPillar, filterStatus, filterShipping, filterRewardEligible, filterBreed, filterSize, filterHasMiraHint, filterSource, filterCategory]);

  // Fetch stats — non-critical, uses AbortController so it never blocks product list
  const fetchStats = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8s max
    try {
      const response = await fetch(`${API_URL}/api/product-box/stats`, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Stats fetch error (non-critical):', err);
    } finally {
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts]);

  // Fetch dynamic categories when pillar filter changes
  useEffect(() => {
    if (!filterPillar) {
      setDynamicCategoryList([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/admin/pillar-products/sub-categories?pillar=${encodeURIComponent(filterPillar)}`);
        if (r.ok) {
          const data = await r.json();
          setDynamicCategoryList(data.categories || []);
        }
      } catch (e) {
        console.error('Category fetch error:', e);
      }
    })();
  }, [filterPillar]);

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
        // Core fields
        'name', 'product_type', 'short_description', 'long_description', 'description',
        'category', 'subcategory', 'sub_category', 'tags', 'is_bakery_product',
        // Media
        'image', 'image_url', 'images', 'thumbnail', 'media',
        // Pricing
        'price', 'originalPrice', 'original_price', 'base_price', 'pricing', 'gst_rate',
        // Commerce & Status
        'approval_status', 'commerce_ops',
        // Inventory / Availability
        'variants', 'options', 'has_variants', 'in_stock', 'visibility', 'available',
        // Pillar & Classification
        'pillar', 'primary_pillar', 'pillars', 'pillars_occasions',
        // Pet profile filters (critical for Mira)
        'breed', 'life_stage', 'pet_size', 'allergens', 'allergies',
        // Commerce rewards
        'paw_rewards', 'pet_safety', 'mira_visibility',
        // Platform
        'shopify_handle', 'sku', 'barcode', 'brand', 'vendor',
        // Intelligence tags
        'intelligent_tags', 'search_keywords',
        'breed_tags', 'health_tags', 'occasion_tags', 'diet_tags', 'lifestage_tags', 'size_tags',
        'breed_metadata', 'mira_hint', 'locally_edited',
        // Rewards
        'reward_eligible', 'reward_value', 'reward_triggers',
        // Mira toggles
        'mira_can_suggest', 'mira_can_reference',
        // Nested metadata structures
        'basics', 'commerce', 'soul_tier', 'soul_level',
        // Active toggle & misc fields
        'is_active', 'ai_image_prompt', 'ai_prompt', 'watercolor_image', 'cloudinary_url', 'categories', 'inventory',
        'mira_ai', 'mrp', 'shape', 'suitability',
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

  // ── Bulk Category Assign ──────────────────────────────────────────────────
  const handleBulkAssign = async () => {
    if (!bulkCategory || selectedProducts.size === 0) return;
    setBulkAssigning(true);
    try {
      const response = await fetch(`${API_URL}/api/product-box/products/bulk-assign-category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: [...selectedProducts],
          category: bulkCategory,
          sub_category: bulkSubCategory || undefined
        })
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Categories Assigned!', description: `Updated ${result.updated} of ${result.matched} matched products.` });
        setSelectedProducts(new Set());
        setBulkCategory('');
        setBulkSubCategory('');
        fetchProducts();
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to assign', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setBulkAssigning(false);
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };
  const quickSave = async () => {
    if (!quickEditProduct || !quickEditType) return;
    
    setQuickSaving(true);
    try {
      let updateData = {};
      
      if (quickEditType === 'image') {
        updateData = {
          image: quickEditValue,
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
          pillar: quickEditValue[0] || quickEditProduct.pillar,
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

  // Handle file upload for product image (uploads to Cloudinary)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !quickEditProduct) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload JPG, PNG, or WebP images', variant: 'destructive' });
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload directly to product endpoint
      const response = await fetch(`${API_URL}/api/admin/product/${quickEditProduct.id}/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuickEditValue(data.url);
        toast({ 
          title: 'Image uploaded!', 
          description: 'Image uploaded to Cloudinary and linked to product. Click Save to confirm.' 
        });
        fetchProducts();
      } else {
        const err = await response.json();
        toast({ title: 'Upload failed', description: err.detail || 'Failed to upload image', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
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

  // ==================== SOUL MADE ACTIONS ====================
  
  // Open Soul Made action modal
  const openSoulMadeAction = (product, action) => {
    setSoulMadeProduct(product);
    setSoulMadeAction(action);
    
    // Initialize data based on action
    if (action === 'sale') {
      setSaleData({ 
        sale_price: product.price || '', 
        compare_at_price: product.compare_at_price || (product.price ? Math.round(product.price * 1.2) : '')
      });
    } else if (action === 'stock') {
      setStockData({ 
        stock_quantity: product.stock_quantity || 100, 
        low_stock_threshold: product.low_stock_threshold || 10 
      });
    } else if (action === 'variants') {
      setVariantsData(product.variants || [
        { size: 'S', price: product.price || 299, stock: 50 },
        { size: 'M', price: product.price || 299, stock: 100 },
        { size: 'L', price: (product.price || 299) + 100, stock: 50 }
      ]);
    } else if (action === 'pillars') {
      setPillarsData(product.pillars || [product.pillar || 'shop']);
    }
  };

  // Duplicate Soul Made to Production
  const duplicateToProduction = async () => {
    if (!soulMadeProduct) return;
    setSoulMadeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/product-box/soul-made/${soulMadeProduct.id}/duplicate-to-production`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.already_exists) {
          toast({ title: 'Already Exists', description: `Product already in production: ${data.product_id}` });
        } else {
          toast({ title: '✅ Duplicated!', description: `Created: ${data.production_product_id}`, duration: 5000 });
        }
        fetchProducts();
        setSoulMadeAction(null);
      } else {
        throw new Error(data.detail || 'Failed to duplicate');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSoulMadeLoading(false);
    }
  };

  // Update Sale Price
  const updateSalePrice = async () => {
    if (!soulMadeProduct) return;
    setSoulMadeLoading(true);
    try {
      const params = new URLSearchParams();
      if (saleData.sale_price) params.append('sale_price', saleData.sale_price);
      if (saleData.compare_at_price) params.append('compare_at_price', saleData.compare_at_price);
      
      const response = await fetch(`${API_URL}/api/product-box/soul-made/${soulMadeProduct.id}/sale?${params}`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: '💰 Sale Price Set!', description: `${data.discount_percentage}% off` });
        fetchProducts();
        setSoulMadeAction(null);
      } else {
        throw new Error(data.detail || 'Failed to set sale');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSoulMadeLoading(false);
    }
  };

  // Update Stock
  const updateStock = async () => {
    if (!soulMadeProduct) return;
    setSoulMadeLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('stock_quantity', stockData.stock_quantity);
      params.append('low_stock_threshold', stockData.low_stock_threshold);
      
      const response = await fetch(`${API_URL}/api/product-box/soul-made/${soulMadeProduct.id}/stock?${params}`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: '📦 Stock Updated!', description: `${data.stock_quantity} units ${data.low_stock ? '⚠️ LOW STOCK' : ''}` });
        fetchProducts();
        setSoulMadeAction(null);
      } else {
        throw new Error(data.detail || 'Failed to update stock');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSoulMadeLoading(false);
    }
  };

  // Update Variants (Size Pricing)
  const updateVariants = async () => {
    if (!soulMadeProduct) return;
    setSoulMadeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/product-box/soul-made/${soulMadeProduct.id}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantsData)
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: '📏 Variants Updated!', description: `${data.variants.length} sizes configured` });
        fetchProducts();
        setSoulMadeAction(null);
      } else {
        throw new Error(data.detail || 'Failed to update variants');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSoulMadeLoading(false);
    }
  };

  // Update Pillars
  const updatePillars = async () => {
    if (!soulMadeProduct) return;
    setSoulMadeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/product-box/soul-made/${soulMadeProduct.id}/pillars`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillarsData)
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: '🏛️ Pillars Assigned!', description: pillarsData.join(', ') });
        fetchProducts();
        setSoulMadeAction(null);
      } else {
        throw new Error(data.detail || 'Failed to update pillars');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSoulMadeLoading(false);
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
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'1px solid #86efac', color:'#166534', background:'#f0fdf4', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
            <input type="file" accept=".csv" style={{ display:'none' }} onChange={async (e) => {
              const file = e.target.files[0]; if (!file) return;
              const text = await file.text();
              const lines = text.split('\n').filter(Boolean);
              const hdrs = lines[0].split(',');
              const rows = lines.slice(1).map(line => {
                const vals = line.split(',');
                const obj = {};
                hdrs.forEach((h,i) => { obj[h.trim()] = (vals[i]||'').trim().replace(/^"|"$/g,''); });
                return { name:obj.Name||obj.name, pillar:obj.Pillar||obj.pillar, category:obj.Category||obj.category||'', original_price:parseFloat(obj.Price||obj.original_price)||0 };
              }).filter(r => r.name);
              try {
                const auth = localStorage.getItem('adminAuth') || btoa('aditya:lola4304');
                const res = await fetch(`${API_URL}/api/product-box/import`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Basic ${auth}`}, body:JSON.stringify({products:rows}) });
                const d = res.ok ? await res.json() : {};
                alert(`Imported ${d.imported||rows.length} products`);
                fetchProducts(currentPage, activeFilters);
              } catch { alert('Import failed'); }
              e.target.value='';
            }} />
          </label>
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
          onClick={() => { setFilterPillar(''); setFilterCategory(''); setPage(0); }}
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
            onClick={() => { setFilterPillar(p.id); setFilterCategory(''); setPage(0); }}
            className="h-8"
            data-testid={`filter-product-pillar-${p.id}`}
          >
            {p.icon} {p.name}
          </Button>
        ))}
      </div>

      {/* Category Quick Filter + Pillar Search — shows when a pillar is selected */}
      {filterPillar && dynamicCategoryList.length > 0 && (
        <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          {/* Prominent search bar for this pillar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${ALL_PILLARS.find(p => p.id === filterPillar)?.name || ''} products by name or sub-category...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              data-testid="pillar-search-input"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setPage(0); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          {/* Category chips — dynamic from DB */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium">Category:</span>
            <button
              onClick={() => { setFilterCategory(''); setPage(0); }}
              className={`h-7 px-3 text-xs rounded-full border transition-colors ${filterCategory === '' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'}`}
              data-testid="filter-category-all"
            >
              All
            </button>
            {dynamicCategoryList.map(c => (
              <button
                key={c}
                onClick={() => { setFilterCategory(c); setPage(0); }}
                className={`h-7 px-3 text-xs rounded-full border transition-colors ${filterCategory === c ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'}`}
                data-testid={`filter-category-${c}`}
              >
                {c.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4" data-testid="product-filters-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="pl-9"
                data-testid="search-products-input"
              />
            </div>
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
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
            onChange={(e) => { setFilterPillar(e.target.value); setFilterCategory(''); setPage(0); }}
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
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
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
            onChange={(e) => { setFilterShipping(e.target.value); setPage(0); }}
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
            onChange={(e) => { setFilterBreed(e.target.value); setPage(0); }}
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
            onChange={(e) => { setFilterSize(e.target.value); setPage(0); }}
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
            onChange={(e) => { setFilterHasMiraHint(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-md border border-blue-200 text-sm bg-blue-50"
            data-testid="filter-mira-hint-select"
          >
            <option value="">✨ Mira Hints</option>
            <option value="true">Has Hint</option>
            <option value="false">No Hint</option>
          </select>
          
          {/* Source Filter - Shopify, Soul Made, Manual */}
          <select 
            value={filterSource} 
            onChange={(e) => { setFilterSource(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-md border border-pink-200 text-sm bg-pink-50 font-medium"
            data-testid="filter-source-select"
          >
            <option value="">📦 All Sources</option>
            <option value="shopify">🛒 Shopify</option>
            <option value="soul_made">🎨 Soul Made (AI)</option>
            <option value="manual">✍️ Manual</option>
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
            setFilterSource('');
            setFilterCategory('');
            setPage(0);
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
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProducts.size === products.length}
                        ref={el => el && (el.indeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length)}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        data-testid="select-all-products-checkbox"
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600">Product</th>
                    <th className="text-left p-3 font-medium text-gray-600">Category</th>
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
                    <tr key={product.id} className={`border-b hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-amber-50' : ''}`} data-testid={`product-row-${product.id}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="w-4 h-4 cursor-pointer"
                          data-testid={`select-product-${product.id}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Clickable Image for Quick Edit */}
                          <button 
                            onClick={() => openQuickEdit(product, 'image')}
                            className="relative group"
                            title="Click to edit image"
                          >
                            {product.image_url || product.mockup_url || product.image || product.thumbnail || product.images?.[0] ? (
                              <img 
                                src={product.image_url || product.mockup_url || product.image || product.thumbnail || product.images?.[0]} 
                                alt="" 
                                className="w-10 h-10 rounded object-cover group-hover:opacity-70 transition-opacity" 
                              />
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
                      {/* Category Cell — click to quick-assign */}
                      <td className="p-3">
                        {product.category ? (
                          <Badge variant="outline" className="text-xs capitalize bg-amber-50 border-amber-200 text-amber-800">
                            {product.category}
                          </Badge>
                        ) : (
                          <button
                            onClick={() => { toggleSelectProduct(product.id); }}
                            className="text-xs text-gray-400 hover:text-amber-600 border border-dashed border-gray-200 hover:border-amber-300 rounded px-2 py-0.5 transition-colors"
                            title="Select to bulk assign category"
                          >
                            + category
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {PRODUCT_TYPES.find(t => t.id === product.product_type)?.icon} {product.product_type}
                        </Badge>
                        {/* Source Badge */}
                        {product.source === 'soul_made' && (
                          <Badge className="ml-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            🎨 Soul Made
                          </Badge>
                        )}
                        {product.source === 'shopify' && (
                          <Badge className="ml-1 bg-green-100 text-green-700 text-xs">
                            🛒 Shopify
                          </Badge>
                        )}
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
                        {product.product_type === 'service' || product.basics?.is_service ? (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Service
                          </span>
                        ) : (
                          <button
                            onClick={() => openQuickEdit(product, 'price')}
                            className="font-medium hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                            title="Click to edit price"
                          >
                            ₹{product.pricing?.base_price || product.price || 0}
                          </button>
                        )}
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
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/admin/products/${product.id}/toggle-active`, { method: 'PATCH' });
                              if (res.ok) {
                                const data = await res.json();
                                setProducts(prev => prev.map(p => p.id === product.id
                                  ? { ...p, is_active: data.is_active, visibility: { ...p.visibility, status: data.is_active ? 'active' : 'archived' } }
                                  : p
                                ));
                              }
                            } catch (e) { /* silent */ }
                          }}
                          title={product.is_active !== false ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                            product.is_active !== false || product.visibility?.status === 'active'
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                          }`}
                          data-testid={`toggle-active-${product.id}`}
                        >
                          {product.is_active !== false || product.visibility?.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
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
                          
                          {/* Soul Made specific actions */}
                          {product.source === 'soul_made' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSoulMadeAction(product, 'duplicate')}
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                title="Duplicate to Production"
                                data-testid={`duplicate-soul-made-${product.id}`}
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSoulMadeAction(product, 'sale')}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Set Sale Price"
                                data-testid={`sale-soul-made-${product.id}`}
                              >
                                <Percent className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSoulMadeAction(product, 'stock')}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Manage Stock"
                                data-testid={`stock-soul-made-${product.id}`}
                              >
                                <Box className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSoulMadeAction(product, 'variants')}
                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                title="Size/Variant Pricing"
                                data-testid={`variants-soul-made-${product.id}`}
                              >
                                <Layers className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSoulMadeAction(product, 'pillars')}
                                className="text-pink-600 hover:text-pink-800 hover:bg-pink-50"
                                title="Assign Pillars"
                                data-testid={`pillars-soul-made-${product.id}`}
                              >
                                <Palette className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
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

            {/* Bulk Action Bar — appears when products are selected */}
            {selectedProducts.size > 0 && (
              <div className="sticky bottom-0 z-20 border-t bg-amber-50 border-amber-200 p-3 flex flex-wrap items-center gap-3 shadow-md" data-testid="bulk-action-bar">
                <span className="text-sm font-semibold text-amber-800">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <select
                    value={bulkCategory}
                    onChange={e => setBulkCategory(e.target.value)}
                    className="h-8 px-2 rounded border border-amber-300 text-sm bg-white min-w-[180px]"
                    data-testid="bulk-category-select"
                  >
                    <option value="">— Select Category —</option>
                    {dynamicCategoryList.map(c => (
                      <option key={c} value={c}>{c.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}</option>
                    ))}
                  </select>
                  <select
                    value={bulkSubCategory}
                    onChange={e => setBulkSubCategory(e.target.value)}
                    className="h-8 px-2 rounded border border-amber-300 text-sm bg-white min-w-[160px]"
                    data-testid="bulk-subcategory-select"
                  >
                    <option value="">Sub-category (optional)</option>
                    {dynamicCategoryList.map(c => (
                      <option key={c} value={c}>{c.replace(/[-_]/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!bulkCategory || bulkAssigning}
                    onClick={handleBulkAssign}
                    className="bg-amber-600 hover:bg-amber-700 text-white h-8"
                    data-testid="bulk-assign-category-btn"
                  >
                    {bulkAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Category'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProducts(new Set())}
                    className="h-8 text-amber-700 hover:bg-amber-100"
                    data-testid="bulk-clear-selection-btn"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
            
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
                  <div className="w-24 h-24 rounded border overflow-hidden flex-shrink-0 relative">
                    {quickEditValue ? (
                      <img src={quickEditValue} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* File Upload - Primary */}
                    <div>
                      <Label className="text-purple-700 font-semibold">Upload Image File (Recommended)</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="product-image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="product-image-upload"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                            uploadingImage 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? 'Uploading...' : 'Choose File'}
                        </label>
                        <span className="text-xs text-gray-500">JPG, PNG, WebP (max 5MB)</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Uploads to Cloudinary - persists through deployments!</p>
                    </div>
                    
                    {/* URL Input - Secondary */}
                    <div>
                      <Label className="text-gray-500">Or paste image URL</Label>
                      <Input
                        value={quickEditValue || ''}
                        onChange={(e) => setQuickEditValue(e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">Use for external URLs (Shopify, Unsplash, etc.)</p>
                    </div>
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

      {/* ==================== SOUL MADE ACTION MODALS ==================== */}
      
      {/* Duplicate to Production Modal */}
      <Dialog open={soulMadeAction === 'duplicate'} onOpenChange={() => setSoulMadeAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Duplicate to Production
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              This will copy <strong>{soulMadeProduct?.name}</strong> from <code>breed_products</code> to <code>products_master</code> 
              so it can be purchased through checkout.
            </p>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-sm"><strong>Current Price:</strong> ₹{soulMadeProduct?.price}</p>
              <p className="text-sm"><strong>Breed:</strong> {soulMadeProduct?.breed_name || soulMadeProduct?.breed}</p>
              <p className="text-sm"><strong>Category:</strong> {soulMadeProduct?.category}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulMadeAction(null)}>Cancel</Button>
            <Button onClick={duplicateToProduction} disabled={soulMadeLoading} className="bg-purple-600 hover:bg-purple-700">
              {soulMadeLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Duplicate to Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Price Modal */}
      <Dialog open={soulMadeAction === 'sale'} onOpenChange={() => setSoulMadeAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" />
              Set Sale Price
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Sale Price (₹)</Label>
              <Input 
                type="number" 
                value={saleData.sale_price} 
                onChange={(e) => setSaleData({...saleData, sale_price: e.target.value})}
                placeholder="New discounted price"
              />
            </div>
            <div>
              <Label>Compare At Price (₹) - Shows as strikethrough</Label>
              <Input 
                type="number" 
                value={saleData.compare_at_price} 
                onChange={(e) => setSaleData({...saleData, compare_at_price: e.target.value})}
                placeholder="Original price (was)"
              />
            </div>
            {saleData.sale_price && saleData.compare_at_price && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">
                  {Math.round((1 - saleData.sale_price / saleData.compare_at_price) * 100)}% OFF
                </p>
                <p className="text-sm text-gray-600">
                  <span className="line-through">₹{saleData.compare_at_price}</span> → <strong>₹{saleData.sale_price}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulMadeAction(null)}>Cancel</Button>
            <Button onClick={updateSalePrice} disabled={soulMadeLoading} className="bg-green-600 hover:bg-green-700">
              {soulMadeLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Percent className="w-4 h-4 mr-2" />}
              Set Sale Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Management Modal */}
      <Dialog open={soulMadeAction === 'stock'} onOpenChange={() => setSoulMadeAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600" />
              Stock Management
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Stock Quantity</Label>
              <Input 
                type="number" 
                value={stockData.stock_quantity} 
                onChange={(e) => setStockData({...stockData, stock_quantity: parseInt(e.target.value) || 0})}
                placeholder="Total units available"
              />
            </div>
            <div>
              <Label>Low Stock Threshold (alert below this)</Label>
              <Input 
                type="number" 
                value={stockData.low_stock_threshold} 
                onChange={(e) => setStockData({...stockData, low_stock_threshold: parseInt(e.target.value) || 10})}
                placeholder="10"
              />
            </div>
            {stockData.stock_quantity <= stockData.low_stock_threshold && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-700">⚠️ Stock will be marked as LOW</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulMadeAction(null)}>Cancel</Button>
            <Button onClick={updateStock} disabled={soulMadeLoading} className="bg-blue-600 hover:bg-blue-700">
              {soulMadeLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Box className="w-4 h-4 mr-2" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Size/Variant Pricing Modal */}
      <Dialog open={soulMadeAction === 'variants'} onOpenChange={() => setSoulMadeAction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Size/Variant Pricing
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {variantsData.map((variant, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Input 
                  value={variant.size} 
                  onChange={(e) => {
                    const newVariants = [...variantsData];
                    newVariants[index].size = e.target.value;
                    setVariantsData(newVariants);
                  }}
                  placeholder="Size (S/M/L)"
                  className="w-20"
                />
                <span className="text-gray-500">₹</span>
                <Input 
                  type="number"
                  value={variant.price} 
                  onChange={(e) => {
                    const newVariants = [...variantsData];
                    newVariants[index].price = parseInt(e.target.value) || 0;
                    setVariantsData(newVariants);
                  }}
                  placeholder="Price"
                  className="w-24"
                />
                <span className="text-gray-500">Stock:</span>
                <Input 
                  type="number"
                  value={variant.stock} 
                  onChange={(e) => {
                    const newVariants = [...variantsData];
                    newVariants[index].stock = parseInt(e.target.value) || 0;
                    setVariantsData(newVariants);
                  }}
                  placeholder="Stock"
                  className="w-20"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setVariantsData(variantsData.filter((_, i) => i !== index))}
                  className="text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setVariantsData([...variantsData, { size: '', price: 0, stock: 50 }])}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Variant
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulMadeAction(null)}>Cancel</Button>
            <Button onClick={updateVariants} disabled={soulMadeLoading} className="bg-amber-600 hover:bg-amber-700">
              {soulMadeLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
              Save Variants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pillar Assignment Modal */}
      <Dialog open={soulMadeAction === 'pillars'} onOpenChange={() => setSoulMadeAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-600" />
              Assign Pillars
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">Select which pillars this product should appear in:</p>
            <div className="grid grid-cols-2 gap-2">
              {['celebrate', 'dine', 'care', 'stay', 'travel', 'fit', 'learn', 'enjoy', 'shop', 'farewell'].map(pillar => (
                <label 
                  key={pillar} 
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    pillarsData.includes(pillar) 
                      ? 'bg-pink-50 border-pink-300 text-pink-700' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={pillarsData.includes(pillar)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPillarsData([...pillarsData, pillar]);
                      } else {
                        setPillarsData(pillarsData.filter(p => p !== pillar));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="capitalize text-sm font-medium">{pillar}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoulMadeAction(null)}>Cancel</Button>
            <Button onClick={updatePillars} disabled={soulMadeLoading || pillarsData.length === 0} className="bg-pink-600 hover:bg-pink-700">
              {soulMadeLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
              Assign Pillars
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedProductBox;
