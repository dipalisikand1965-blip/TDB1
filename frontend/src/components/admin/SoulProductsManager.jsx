import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import ProductBoxEditor from './ProductBoxEditor';
import { 
  Sparkles, 
  Heart, 
  Gift, 
  Search, 
  Filter,
  Check,
  X,
  RefreshCw,
  PawPrint,
  Palette,
  Crown,
  Star,
  Package,
  Eye,
  Image,
  Play,
  Square,
  Loader2,
  Cloud,
  Upload,
  Edit,
  DollarSign,
  Boxes,
  Tag
} from 'lucide-react';
import CloudinaryUploader from './CloudinaryUploader';

/**
 * SoulProductsManager
 * 
 * Admin panel for managing Soul-Level Personalization:
 * - Tag products as Soul Made / Soul Selected / Soul Gifted
 * - View and manage Soul Archetypes
 * - Preview personalization settings
 */

const PRODUCT_TIERS = {
  soul_made: {
    label: 'Soul Made',
    emoji: '✨',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Fully personalized with name + breed illustration'
  },
  soul_selected: {
    label: 'Soul Selected',
    emoji: '🎯',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Recommended based on Soul Profile'
  },
  soul_gifted: {
    label: 'Soul Gifted',
    emoji: '🎁',
    color: 'bg-pink-100 text-pink-700 border-pink-300',
    description: 'Occasion-led products for pet parents'
  },
  standard: {
    label: 'Standard',
    emoji: '📦',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    description: 'Regular product without personalization'
  }
};

const SoulProductsManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkTier, setBulkTier] = useState('');
  const [computingArchetypes, setComputingArchetypes] = useState(false);
  
  // Mockup generation state
  const [mockupStats, setMockupStats] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [breedProducts, setBreedProducts] = useState([]);
  const [loadingMockups, setLoadingMockups] = useState(false);
  const [generationLimit, setGenerationLimit] = useState(10);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('');
  
  // Cloud storage state
  const [cloudStatus, setCloudStatus] = useState(null);
  const [convertingToCloud, setConvertingToCloud] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Open edit modal for a product
  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      stock: product.stock || 0,
      variants: product.variants || [],
      sale_price: product.sale_price || null,
      description: product.description || '',
      soul_tier: product.soul_tier || 'standard'
    });
    setEditModalOpen(true);
  };

  // Save product changes
  const saveProductChanges = async () => {
    if (!editingProduct) return;
    
    setSavingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/soul-made/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('aditya:lola4304')}`
        },
        body: JSON.stringify({
          stock: editingProduct.stock,
          variants: editingProduct.variants,
          sale_price: editingProduct.sale_price,
          description: editingProduct.description,
          soul_tier: editingProduct.soul_tier,
          price: editingProduct.price
        })
      });
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Product updated successfully!' });
        setEditModalOpen(false);
        // Refresh products list
        if (activeSubTab === 'products') {
          fetchProducts();
        } else {
          fetchBreedProducts(true);
        }
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
    }
    setSavingProduct(false);
  };

  // Add variant
  const addVariant = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), { name: '', price_modifier: 0 }]
    });
  };

  // Remove variant
  const removeVariant = (index) => {
    if (!editingProduct) return;
    const newVariants = [...editingProduct.variants];
    newVariants.splice(index, 1);
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  // Update variant
  const updateVariant = (index, field, value) => {
    if (!editingProduct) return;
    const newVariants = [...editingProduct.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchArchetypes();
    fetchCategories();
    fetchMockupStats(); // Fetch mockup stats on mount
    fetchCloudStatus(); // Fetch cloud status
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/products?limit=500`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchArchetypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/soul-archetype/archetypes`);
      if (res.ok) {
        const data = await res.json();
        setArchetypes(data.archetypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch archetypes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      // Fallback categories
      setCategories(['cakes', 'breed-cakes', 'accessories', 'treats', 'hampers', 'dognuts', 'frozen-treats']);
    }
  };

  // Mockup functions
  const fetchMockupStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/stats`);
      if (res.ok) {
        const data = await res.json();
        setMockupStats(data);
        setGenerationStatus(data.generation_status);
      }
    } catch (error) {
      console.error('Failed to fetch mockup stats:', error);
    }
  }, []);

  const fetchBreedProducts = useCallback(async (hasMockup = null) => {
    setLoadingMockups(true);
    try {
      let url = `${API_URL}/api/mockups/breed-products?limit=50`; // Reduced for faster loading
      if (selectedBreed) url += `&breed=${selectedBreed}`;
      if (selectedProductType) url += `&product_type=${selectedProductType}`;
      if (hasMockup !== null) url += `&has_mockup=${hasMockup}`;
      
      console.log('[SoulProducts] Fetching breed products:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Got breed products:', data.products?.length || 0);
        setBreedProducts(data.products || []);
      } else {
        console.error('[SoulProducts] API error:', res.status);
        setBreedProducts([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[SoulProducts] Request timed out');
      } else {
        console.error('[SoulProducts] Failed to fetch breed products:', error);
      }
      setBreedProducts([]);
    } finally {
      setLoadingMockups(false);
    }
  }, [selectedBreed, selectedProductType]);

  const seedBreedProducts = async () => {
    try {
      console.log('[SoulProducts] Seeding breed products...');
      const res = await fetch(`${API_URL}/api/mockups/seed-products`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Seed result:', data);
        toast({ title: 'Products Seeded', description: `Created ${data.total || data.seeded || 0} breed products` });
        // Refresh both stats and products list
        await fetchMockupStats();
        await fetchBreedProducts(true);
      } else {
        const error = await res.json();
        console.error('[SoulProducts] Seed error:', error);
        toast({ title: 'Error', description: error.detail || 'Failed to seed products', variant: 'destructive' });
      }
    } catch (error) {
      console.error('[SoulProducts] Seed exception:', error);
      toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
    }
  };

  const startMockupGeneration = async () => {
    try {
      console.log('[SoulProducts] Starting mockup generation...');
      const body = {
        limit: generationLimit > 0 ? generationLimit : null,
        breed_filter: selectedBreed || null,
        product_type_filter: selectedProductType || null,
        pillar: selectedPillar || null,    // ← pillar-aware
        tag_pillar: selectedPillar || null, // ← tags generated products with pillar
      };
      
      const res = await fetch(`${API_URL}/api/mockups/generate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[SoulProducts] Generation started:', data);
        toast({ title: 'Generation Started', description: data.message || 'Starting mockup generation...' });
        // Start polling for status
        pollGenerationStatus();
      } else {
        const err = await res.json();
        console.error('[SoulProducts] Generation error:', err);
        toast({ title: 'Error', description: err.detail || 'Failed to start generation', variant: 'destructive' });
      }
    } catch (error) {
      console.error('[SoulProducts] Generation exception:', error);
      toast({ title: 'Error', description: 'Failed to start generation', variant: 'destructive' });
    }
  };

  const stopMockupGeneration = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/stop-generation`, { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Stopping', description: 'Generation will stop after current item' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to stop generation', variant: 'destructive' });
    }
  };

  const pollGenerationStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/mockups/status`);
        if (res.ok) {
          const status = await res.json();
          setGenerationStatus(status);
          
          // Stop polling when generation is complete
          if (!status.running && status.completed_at) {
            clearInterval(interval);
            fetchMockupStats();
            fetchBreedProducts(true);
            toast({ 
              title: 'Generation Complete', 
              description: `Generated ${status.generated} mockups` 
            });
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000);
    
    // Clear interval after 30 minutes max
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  // Load mockup data when switching to mockups tab
  useEffect(() => {
    if (activeSubTab === 'mockups') {
      console.log('[SoulProducts] Mockups tab active, fetching data...');
      fetchMockupStats();
      fetchBreedProducts(true); // Fetch products with mockups
      fetchCloudStatus(); // Check cloud storage status
      
      // Auto-refresh stats every 30 seconds when on mockups tab
      const refreshInterval = setInterval(() => {
        fetchMockupStats();
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]); // Only trigger on tab change

  // Fetch cloud storage status
  const fetchCloudStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mockups/cloud-status`);
      if (res.ok) {
        const data = await res.json();
        setCloudStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch cloud status:', error);
    }
  };

  // Convert mockups to cloud storage (Cloudinary)
  const convertToCloud = async () => {
    setConvertingToCloud(true);
    try {
      const res = await fetch(`${API_URL}/api/mockups/batch-convert-to-cloud?limit=10`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: '☁️ Cloud Conversion',
          description: `Converted ${data.converted} mockups. ${data.remaining} remaining.`,
          duration: 5000
        });
        fetchCloudStatus();
        fetchBreedProducts(true);
      } else {
        toast({
          title: 'Error',
          description: data.detail || 'Failed to convert',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert to cloud',
        variant: 'destructive'
      });
    }
    setConvertingToCloud(false);
  };

  const updateProductTier = async (productId, tier) => {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}/soul-tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soul_tier: tier })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, soul_tier: tier } : p
        ));
        toast({ title: 'Updated', description: `Product tier set to ${PRODUCT_TIERS[tier]?.label}` });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update product tier', variant: 'destructive' });
    }
  };

  const bulkUpdateTier = async () => {
    if (!bulkTier || selectedProducts.length === 0) return;
    
    try {
      const res = await fetch(`${API_URL}/api/products/bulk-soul-tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_ids: selectedProducts,
          soul_tier: bulkTier 
        })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, soul_tier: bulkTier } : p
        ));
        setSelectedProducts([]);
        setBulkTier('');
        toast({ title: 'Bulk Update Complete', description: `${selectedProducts.length} products updated` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk update failed', variant: 'destructive' });
    }
  };

  const computeAllArchetypes = async () => {
    setComputingArchetypes(true);
    try {
      const res = await fetch(`${API_URL}/api/soul-archetype/compute-all`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: 'Archetypes Computed', 
          description: `${data.successful} pets processed` 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to compute archetypes', variant: 'destructive' });
    }
    setComputingArchetypes(false);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || p.soul_tier === tierFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesTier && matchesCategory;
  });

  // Stats
  const tierStats = {
    soul_made: products.filter(p => p.soul_tier === 'soul_made').length,
    soul_selected: products.filter(p => p.soul_tier === 'soul_selected').length,
    soul_gifted: products.filter(p => p.soul_tier === 'soul_gifted').length,
    standard: products.filter(p => !p.soul_tier || p.soul_tier === 'standard').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Soul Products
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage Soul-Level Personalization tiers and archetypes
          </p>
        </div>
        <Button 
          onClick={() => {
            fetchProducts();
            if (activeSubTab === 'mockups') {
              fetchMockupStats();
              fetchBreedProducts(true);
            }
          }} 
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {[
          { id: 'products', label: 'Product Tiers', icon: Package },
          { id: 'archetypes', label: 'Soul Archetypes', icon: Crown },
          { id: 'mockups', label: 'AI Mockups', icon: Image },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? 'default' : 'ghost'}
            className={activeSubTab === tab.id ? 'bg-purple-600' : ''}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
            {tab.id === 'mockups' && mockupStats && (
              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                {mockupStats.products_with_mockups || 0}/{mockupStats.total_products}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Product Tiers Tab */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
              <Card 
                key={key}
                className={`p-4 cursor-pointer transition-all ${tierFilter === key ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setTierFilter(tierFilter === key ? 'all' : key)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{tier.emoji}</span>
                  <span className="text-2xl font-bold">{tierStats[key]}</span>
                </div>
                <p className="text-sm font-medium mt-2">{tier.label}</p>
                <p className="text-xs text-gray-500">{tier.description}</p>
              </Card>
            ))}
          </div>

          {/* Filters & Bulk Actions */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-purple-700 font-medium">
                  {selectedProducts.length} selected
                </span>
                <select
                  value={bulkTier}
                  onChange={(e) => setBulkTier(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="">Set tier...</option>
                  {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
                    <option key={key} value={key}>{tier.emoji} {tier.label}</option>
                  ))}
                </select>
                <Button size="sm" onClick={bulkUpdateTier} disabled={!bulkTier}>
                  Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProducts([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Products List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="mt-2 text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soul Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.slice(0, 50).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/40'} 
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{product.category || 'uncategorized'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">₹{product.price || 0}</td>
                      <td className="px-4 py-3">
                        <Badge className={PRODUCT_TIERS[product.soul_tier]?.color || PRODUCT_TIERS.standard.color}>
                          {PRODUCT_TIERS[product.soul_tier]?.emoji || '📦'} {PRODUCT_TIERS[product.soul_tier]?.label || 'Standard'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={product.soul_tier || 'standard'}
                          onChange={(e) => updateProductTier(product.id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          {Object.entries(PRODUCT_TIERS).map(([key, tier]) => (
                            <option key={key} value={key}>{tier.emoji} {tier.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditModal(product)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length > 50 && (
                <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                  Showing 50 of {filteredProducts.length} products. Use filters to narrow results.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Soul Archetypes Tab */}
      {activeSubTab === 'archetypes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Soul Archetypes</h3>
              <p className="text-sm text-gray-500">
                Archetypes are derived from existing Soul Profile data - no new questions needed
              </p>
            </div>
            <Button 
              onClick={computeAllArchetypes} 
              disabled={computingArchetypes}
              className="bg-purple-600"
            >
              {computingArchetypes ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Compute All Archetypes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archetypes.map((archetype) => (
              <Card key={archetype.key} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{archetype.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{archetype.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{archetype.description}</p>
                    
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Copy Tone:</span>
                        <p className="text-xs text-gray-700">{archetype.copy_tone}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500">Celebration Style:</span>
                        <p className="text-xs text-gray-700">{archetype.celebration_style}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500">Color Palette:</span>
                        <div className="flex gap-1 mt-1">
                          {archetype.color_palette?.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {archetypes.length === 0 && (
            <Card className="p-8 text-center">
              <Crown className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No archetypes loaded</p>
              <Button onClick={fetchArchetypes} variant="outline" className="mt-4">
                Load Archetypes
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Preview Tab - SHOW ACTUAL PRODUCT MOCKUPS */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Mockup Gallery</h3>
            <p className="text-sm text-gray-500 mb-6">
              Pre-generated product mockups with soulful watercolor breed illustrations ON the products
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Labrador Bandana */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/52f9dd45e1396df1a234bf04168e038e598abd236ed34cbf59d3e7ccfacf1198.png"
                    alt="Labrador Bandana"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-purple-100 text-purple-700 text-xs mb-2">✨ Bandana</Badge>
                  <h5 className="font-semibold text-sm">Labrador Bandana</h5>
                </div>
              </Card>

              {/* Golden Retriever Mug */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/5fda07d915de44befc32bfbdac210125b50d02df9f961e853ffeff772f44fffc.png"
                    alt="Golden Retriever Mug"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-amber-100 text-amber-700 text-xs mb-2">☕ Mug</Badge>
                  <h5 className="font-semibold text-sm">Golden Retriever Mug</h5>
                </div>
              </Card>

              {/* Beagle Keychain */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/04829434fe81993b845c310a46f812971287759a5db4074726ce16d59f1d8e6f.png"
                    alt="Beagle Keychain"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-gray-100 text-gray-700 text-xs mb-2">🔑 Keychain</Badge>
                  <h5 className="font-semibold text-sm">Beagle Keychain</h5>
                </div>
              </Card>

              {/* German Shepherd Welcome Mat */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/c98be36b80db466eb4a345c37eefde1c46ce763368b006280587db7ac8247035.png"
                    alt="German Shepherd Welcome Mat"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-green-100 text-green-700 text-xs mb-2">🚪 Welcome Mat</Badge>
                  <h5 className="font-semibold text-sm">German Shepherd Mat</h5>
                </div>
              </Card>

              {/* Pug Bowl */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/d77bbfb80c70573ef21644b98a2ad918f8e8bf0a009a1e5fcbb22e38772b4f46.png"
                    alt="Pug Bowl"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">🥣 Bowl</Badge>
                  <h5 className="font-semibold text-sm">Pug Food Bowl</h5>
                </div>
              </Card>

              {/* Indie Framed Portrait */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/73d0a0f28ceb2f4f875d211f40790c2c5ba2714f677454e1b69bb9867aec52e8.png"
                    alt="Indie Framed Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-pink-100 text-pink-700 text-xs mb-2">🖼️ Portrait</Badge>
                  <h5 className="font-semibold text-sm">Indie Portrait "Mojo"</h5>
                </div>
              </Card>

              {/* Husky Tote Bag */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/0969f7cea74048859883596e3126e9883d5c1cca5f09967b7a81466e76caa123.png"
                    alt="Husky Tote Bag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs mb-2">👜 Tote Bag</Badge>
                  <h5 className="font-semibold text-sm">Husky "Dog Mom" Bag</h5>
                </div>
              </Card>

              {/* Shih Tzu Birthday Cake */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/898750e9-c1a3-473f-826c-d87207164928/images/4b425e629050d4582426787426b19bf7e6b234fd88bee7e1bc3d751f2461ad74.png"
                    alt="Shih Tzu Birthday Cake"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <Badge className="bg-rose-100 text-rose-700 text-xs mb-2">🎂 Birthday Cake</Badge>
                  <h5 className="font-semibold text-sm">Shih Tzu "Luna" Cake</h5>
                </div>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>✨ How it works:</strong> When a customer is logged in and their pet's breed matches a product, 
                these mockups automatically show on product cards - giving them a preview of their personalized product.
              </p>
            </div>
          </Card>

          {/* Logged-in Experience Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Logged-In Experience</h3>
            <div className="bg-gray-900 text-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <PawPrint className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-purple-300">Shopping for</p>
                  <p className="text-lg font-bold">Mojo</p>
                </div>
                <Badge className="bg-purple-500/30 text-purple-200 ml-auto">
                  🦋 Social Butterfly
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">✨ Products personalized for Mojo</p>
                <p className="text-gray-300">🎯 Recommendations based on Soul Profile</p>
                <p className="text-gray-300">🎁 Gift suggestions for Mojo's humans</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Mockups Tab */}
      {activeSubTab === 'mockups' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          {mockupStats ? (
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-3xl font-bold text-purple-700">{mockupStats.total_products}</div>
                <div className="text-sm text-gray-600">Total Breed Products</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-3xl font-bold text-green-700">{mockupStats.products_with_mockups || 0}</div>
                <div className="text-sm text-gray-600">With Mockups</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-3xl font-bold text-amber-700">{mockupStats.products_without_mockups || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-3xl font-bold text-blue-700">{mockupStats.completion_percentage?.toFixed(1) || 0}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <Card key={i} className="p-4 bg-gray-50 animate-pulse">
                  <div className="h-9 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </Card>
              ))}
            </div>
          )}

          {/* Generation Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Mockup Generation
            </h3>
            
            {/* Generation Status */}
            {generationStatus?.running && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generation in Progress
                  </span>
                  <Button size="sm" variant="outline" onClick={stopMockupGeneration}>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </Button>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(generationStatus.progress / generationStatus.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-blue-700 mt-1">
                  <span>Progress: {generationStatus.progress}/{generationStatus.total}</span>
                  <span>Generated: {generationStatus.generated} | Failed: {generationStatus.failed}</span>
                </div>
                {generationStatus.current_product && (
                  <div className="text-xs text-blue-600 mt-1">
                    Current: {generationStatus.current_product}
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Limit (0 = all)</label>
                <Input 
                  type="number" 
                  value={generationLimit}
                  onChange={(e) => setGenerationLimit(parseInt(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Filter by Breed</label>
                <select 
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Breeds</option>
                  {mockupStats?.by_breed && Object.keys(mockupStats.by_breed).sort().map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Filter by Type</label>
                <select 
                  value={selectedProductType}
                  onChange={(e) => setSelectedProductType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  {mockupStats?.by_product_type && Object.keys(mockupStats.by_product_type).sort().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {/* ── PILLAR SELECTOR (new) ── */}
              <div>
                <label className="text-xs font-medium text-purple-600 block mb-1">🎯 Target Pillar (Product Inbox)</label>
                <select
                  value={selectedPillar}
                  onChange={e => setSelectedPillar(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-sm font-medium"
                >
                  <option value="">All Pillars (General)</option>
                  {['learn','care','dine','go','celebrate','play','shop','adopt','paperwork','advisory','emergency','farewell'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
                {selectedPillar && (
                  <p className="text-xs text-purple-500 mt-1">
                    ✦ Generated products will be tagged with pillar="{selectedPillar}" and appear in the {selectedPillar} product inbox.
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={startMockupGeneration}
                  disabled={generationStatus?.running}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {selectedPillar ? `Generate → ${selectedPillar.charAt(0).toUpperCase()+selectedPillar.slice(1)}` : 'Generate'}
                </Button>
                <Button onClick={seedBreedProducts} variant="outline">
                  Seed Products
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Note:</strong> Soul Made products are auto-seeded on deployment via MasterSync.
              <br />
              Mockup generation takes ~30-60 seconds per image. Click Generate to start batch processing.
              <br />
              <strong>33 breeds × 20+ product types = 1000+ total mockups</strong>
            </div>
            
            {/* Cloud Storage Status */}
            {cloudStatus && (
              <div className={`mt-4 p-4 rounded-lg border ${cloudStatus.cloudinary_configured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Cloud Storage (Cloudinary)
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {cloudStatus.cloudinary_configured 
                        ? `Connected to ${cloudStatus.cloud_name}` 
                        : '⚠️ Not configured - Set CLOUDINARY env vars'}
                    </p>
                    {cloudStatus.mockup_stats && (
                      <div className="text-xs mt-2 space-x-4">
                        <span className="text-blue-600">☁️ Cloud: {cloudStatus.mockup_stats.cloudinary_stored}</span>
                        <span className="text-amber-600">📦 Base64: {cloudStatus.mockup_stats.base64_stored}</span>
                        <span className="text-gray-600">Total: {cloudStatus.mockup_stats.total_with_mockups}</span>
                      </div>
                    )}
                  </div>
                  {cloudStatus.cloudinary_configured && cloudStatus.mockup_stats?.base64_stored > 0 && (
                    <Button 
                      onClick={convertToCloud}
                      disabled={convertingToCloud}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {convertingToCloud ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Converting...</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" /> Convert to Cloud (10)</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Generated Mockups Gallery */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Mockups</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchBreedProducts(true)}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button size="sm" variant="ghost" onClick={() => fetchBreedProducts(false)}>
                  Show Pending
                </Button>
              </div>
            </div>

            {loadingMockups ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                <p className="mt-2 text-gray-500">Loading mockups...</p>
              </div>
            ) : breedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No mockups generated yet</p>
                <p className="text-sm">Click "Generate" to start creating AI mockups</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {breedProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100">
                      {product.mockup_url ? (
                        <img 
                          src={product.mockup_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <Badge className={`text-[10px] mb-1 ${product.mockup_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.product_type}
                      </Badge>
                      <h5 className="font-medium text-xs truncate">{product.breed_name}</h5>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PRODUCT EDITOR — Full ProductBoxEditor with tabs, media upload */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {editingProduct && (
        <ProductBoxEditor
          product={{
            ...editingProduct,
            id: editingProduct.id || editingProduct._id,
            collection: 'breed_products',
          }}
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditingProduct(null); }}
          onSave={async () => {
            // save handled inside ProductBoxEditor via /api/admin/products
            setEditModalOpen(false);
            await fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default SoulProductsManager;
