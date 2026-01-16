import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, RefreshCw, Tag, Check, X, Save, Filter, 
  ChevronDown, ChevronUp, Loader2, Package, Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { API_URL } from '../../utils/api';

// Display tag options with colors
const DISPLAY_TAGS = [
  { id: 'best-seller', label: '🏆 Best Seller', color: 'bg-pink-500' },
  { id: 'limited', label: '⏰ Limited', color: 'bg-red-500' },
  { id: 'selling-fast', label: '🔥 Selling Fast', color: 'bg-amber-500' },
  { id: 'discount', label: '💰 Discount', color: 'bg-green-500' },
  { id: 'new-arrival', label: '✨ New Arrival', color: 'bg-blue-500' },
  { id: 'staff-pick', label: '⭐ Staff Pick', color: 'bg-indigo-500' },
  { id: 'popular', label: '💜 Popular', color: 'bg-purple-500' },
  { id: 'seasonal', label: '🌸 Seasonal', color: 'bg-rose-500' },
  { id: 'exclusive', label: '💎 Exclusive', color: 'bg-cyan-500' }
];

const ProductTagsManager = ({ credentials }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, withTags: 0 });

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/products?limit=500`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        const data = await response.json();
        const prods = data.products || [];
        setProducts(prods);
        setFilteredProducts(prods);
        
        // Extract unique categories
        const cats = [...new Set(prods.map(p => p.category).filter(Boolean))];
        setCategories(cats.sort());
        
        // Calculate stats
        const withTags = prods.filter(p => p.display_tags && p.display_tags.length > 0).length;
        setStats({ total: prods.length, withTags });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  }, [credentials]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  useEffect(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    // Tag filter
    if (tagFilter === 'with-tags') {
      filtered = filtered.filter(p => p.display_tags && p.display_tags.length > 0);
    } else if (tagFilter === 'without-tags') {
      filtered = filtered.filter(p => !p.display_tags || p.display_tags.length === 0);
    } else if (tagFilter !== 'all') {
      filtered = filtered.filter(p => p.display_tags && p.display_tags.includes(tagFilter));
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, tagFilter]);

  // Update product tags
  const updateProductTags = async (productId, newTags) => {
    setSaving(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}/display-tags`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTags)
      });
      
      if (response.ok) {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, display_tags: newTags } : p
        ));
        
        // Update stats
        const updatedProducts = products.map(p => 
          p.id === productId ? { ...p, display_tags: newTags } : p
        );
        const withTags = updatedProducts.filter(p => p.display_tags && p.display_tags.length > 0).length;
        setStats(prev => ({ ...prev, withTags }));
      }
    } catch (error) {
      console.error('Error updating tags:', error);
    }
    
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  // Toggle a tag on a product
  const toggleTag = (product, tagId) => {
    const currentTags = product.display_tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    
    updateProductTags(product.id, newTags);
  };

  // Quick actions - apply tag to multiple products
  const applyTagToCategory = async (tagId, category) => {
    const productsInCategory = products.filter(p => p.category === category);
    
    for (const product of productsInCategory) {
      const currentTags = product.display_tags || [];
      if (!currentTags.includes(tagId)) {
        await updateProductTags(product.id, [...currentTags, tagId]);
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="product-tags-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-500" />
            Product Tags Manager
          </h2>
          <p className="text-gray-500">Add display badges to products (Best Seller, Limited, etc.)</p>
        </div>
        <Button variant="outline" onClick={fetchProducts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Products</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.withTags}</div>
          <div className="text-xs text-gray-500">With Tags</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.total - stats.withTags}</div>
          <div className="text-xs text-gray-500">Without Tags</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
          <div className="text-xs text-gray-500">Categories</div>
        </Card>
      </div>

      {/* Tag Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> Available Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {DISPLAY_TAGS.map(tag => (
            <Badge key={tag.id} className={`${tag.color} text-white`}>
              {tag.label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
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
          className="px-3 py-2 border rounded-lg text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select
          className="px-3 py-2 border rounded-lg text-sm"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="with-tags">With Tags</option>
          <option value="without-tags">Without Tags</option>
          <optgroup label="Filter by Tag">
            {DISPLAY_TAGS.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </optgroup>
        </select>
        
        <span className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length}
        </span>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="text-gray-500 mt-2">Loading products...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className={`p-4 transition-all ${expandedProduct === product.id ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{product.name || 'Unnamed Product'}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline" className="text-xs">{product.category || 'Uncategorized'}</Badge>
                    <span>₹{product.price || 0}</span>
                  </div>
                  
                  {/* Current Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(product.display_tags || []).map(tagId => {
                      const tag = DISPLAY_TAGS.find(t => t.id === tagId);
                      return tag ? (
                        <Badge key={tagId} className={`${tag.color} text-white text-xs`}>
                          {tag.label}
                        </Badge>
                      ) : null;
                    })}
                    {(!product.display_tags || product.display_tags.length === 0) && (
                      <span className="text-xs text-gray-400 italic">No tags</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {saving[product.id] && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                  >
                    {expandedProduct === product.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    Edit Tags
                  </Button>
                </div>
              </div>
              
              {/* Expanded Tag Editor */}
              {expandedProduct === product.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">Click tags to toggle:</p>
                  <div className="flex flex-wrap gap-2">
                    {DISPLAY_TAGS.map(tag => {
                      const isActive = (product.display_tags || []).includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(product, tag.id)}
                          disabled={saving[product.id]}
                          className={`
                            px-3 py-1.5 rounded-full text-sm font-medium transition-all
                            ${isActive 
                              ? `${tag.color} text-white shadow-md scale-105` 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                            ${saving[product.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {isActive && <Check className="w-3 h-3 inline mr-1" />}
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Quick Clear */}
                  {(product.display_tags || []).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-red-500 hover:text-red-700"
                      onClick={() => updateProductTags(product.id, [])}
                      disabled={saving[product.id]}
                    >
                      <X className="w-4 h-4 mr-1" /> Clear All Tags
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
          
          {filteredProducts.length === 0 && (
            <Card className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found matching your filters</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductTagsManager;
