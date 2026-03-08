import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
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
  Eye
} from 'lucide-react';

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

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchArchetypes();
    fetchCategories();
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
        <Button onClick={fetchProducts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'products', label: 'Product Tiers', icon: Package },
          { id: 'archetypes', label: 'Soul Archetypes', icon: Crown },
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

      {/* Preview Tab */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personalization Preview</h3>
            <p className="text-sm text-gray-500 mb-6">
              See how products will appear with Soul-Level Personalization enabled
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <div className="text-center mb-6">
                <Badge className="bg-purple-600 text-white mb-2">Preview Mode</Badge>
                <h4 className="text-xl font-bold text-gray-900">Made for Mojo</h4>
                <p className="text-sm text-gray-600">Inspired by Mojo's Soul Profile</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Sample Soul Made Product */}
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img 
                      src="https://static.prod-images.emergentagent.com/jobs/0720440e-9740-46f1-8580-b9ea9d813e65/images/4b3623ff10f0a8026378da5d3341a1627fc9b4bff0731d0339a6681f29268246.png"
                      alt="Sample"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur rounded-lg p-2 text-center">
                      <span className="font-bold text-purple-700">Mojo</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <Badge className="bg-purple-100 text-purple-700 text-xs mb-2">✨ Soul Made</Badge>
                    <h5 className="font-semibold text-sm">Pug Birthday Cake</h5>
                    <p className="text-xs text-gray-500 mt-1">Personalized with name & breed art</p>
                  </div>
                </Card>

                {/* Sample Soul Selected Product */}
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img 
                      src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
                      alt="Sample"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">🎯 Soul Selected</Badge>
                    <h5 className="font-semibold text-sm">Calming Anxiety Wrap</h5>
                    <p className="text-xs text-gray-500 mt-1">Recommended for Mojo's profile</p>
                  </div>
                </Card>

                {/* Sample Soul Gifted Product */}
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"
                      alt="Sample"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <Badge className="bg-pink-100 text-pink-700 text-xs mb-2">🎁 Soul Gifted</Badge>
                    <h5 className="font-semibold text-sm">Dog Parent Mug</h5>
                    <p className="text-xs text-gray-500 mt-1">Perfect gift for Mojo's human</p>
                  </div>
                </Card>
              </div>
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
    </div>
  );
};

export default SoulProductsManager;
