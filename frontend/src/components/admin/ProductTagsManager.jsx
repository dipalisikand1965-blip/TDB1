import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, RefreshCw, Tag, Check, X, Save, Filter, 
  ChevronDown, ChevronUp, Loader2, Package, Star, Plus, Trash2, Edit, Download, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { API_URL } from '../../utils/api';

// Color options for tags
const TAG_COLORS = [
  { id: 'pink', class: 'bg-pink-500', label: 'Pink' },
  { id: 'red', class: 'bg-red-500', label: 'Red' },
  { id: 'amber', class: 'bg-amber-500', label: 'Amber' },
  { id: 'green', class: 'bg-green-500', label: 'Green' },
  { id: 'blue', class: 'bg-blue-500', label: 'Blue' },
  { id: 'indigo', class: 'bg-indigo-500', label: 'Indigo' },
  { id: 'purple', class: 'bg-purple-500', label: 'Purple' },
  { id: 'rose', class: 'bg-rose-500', label: 'Rose' },
  { id: 'cyan', class: 'bg-cyan-500', label: 'Cyan' },
  { id: 'gray', class: 'bg-gray-500', label: 'Gray' },
];

const getColorClass = (colorId) => {
  const color = TAG_COLORS.find(c => c.id === colorId);
  return color ? color.class : 'bg-gray-500';
};

const ProductTagsManager = ({ credentials }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, withTags: 0 });
  const [exporting, setExporting] = useState(false);
  
  // Tags state
  const [availableTags, setAvailableTags] = useState([]);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTag, setNewTag] = useState({ label: '', color: 'purple', emoji: '🏷️' });
  const [creatingTag, setCreatingTag] = useState(false);
  
  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);

  // Export products with tags to CSV
  const exportToCSV = () => {
    setExporting(true);
    try {
      const allProducts = filteredProducts.length > 0 ? filteredProducts : products;
      
      if (allProducts.length === 0) {
        alert('No products to export');
        setExporting(false);
        return;
      }
      
      // CSV Headers
      const headers = [
        'ID', 'Name', 'Category', 'Pillar', 'Tags', 'Price', 'Status'
      ];
      
      // Build CSV rows
      const rows = allProducts.map(p => [
        p.id || '',
        `"${(p.name || p.product_name || '').replace(/"/g, '""')}"`,
        p.category || '',
        p.pillar || '',
        `"${(p.tags || []).map(t => t.label || t).join(', ')}"`,
        p.price || p.minPrice || 0,
        p.status || 'active'
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
      link.download = `product_tags_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  };

  // Fetch available tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/product-tags`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, [credentials]);

  // Fetch products from all pillars
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/products/all-pillars?limit=500`, {
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
    fetchTags();
    fetchProducts();
  }, [fetchTags, fetchProducts]);

  // Filter products
  useEffect(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title || p.name || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }
    
    // Pillar filter
    if (pillarFilter !== 'all') {
      filtered = filtered.filter(p => p.pillar === pillarFilter);
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
  }, [products, searchQuery, categoryFilter, pillarFilter, tagFilter]);

  // Create new tag
  const createTag = async () => {
    if (!newTag.label.trim()) return;
    
    setCreatingTag(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/product-tags`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: `${newTag.emoji} ${newTag.label}`,
          color: newTag.color
        })
      });
      
      if (response.ok) {
        await fetchTags();
        setShowCreateTagModal(false);
        setNewTag({ label: '', color: 'purple', emoji: '🏷️' });
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    }
    setCreatingTag(false);
  };

  // Delete custom tag
  const deleteTag = async (tagId) => {
    if (!confirm('Delete this tag? It will be removed from all products.')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/product-tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        await fetchTags();
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

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

  // Bulk tag products
  const bulkApplyTag = async (tagId) => {
    const productIds = Array.from(selectedProducts);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/bulk-tag`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_ids: productIds, tags: [tagId] })
      });
      
      if (response.ok) {
        await fetchProducts();
        setSelectedProducts(new Set());
        setShowBulkTagModal(false);
      }
    } catch (error) {
      console.error('Error bulk tagging:', error);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const pillars = ['celebrate', 'dine', 'stay', 'travel', 'care', 'shop', 'club', 'enjoy', 'fit', 'learn', 'adopt', 'insure', 'farewell', 'community', 'advisory', 'paperwork', 'emergency'];

  return (
    <div className="space-y-6" data-testid="product-tags-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-500" />
            Product Tags Manager
          </h2>
          <p className="text-gray-500">Create tags and apply to products from all pillars</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={exportToCSV}
            disabled={exporting}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700" 
            onClick={() => setShowCreateTagModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Create Tag
          </Button>
          <Button variant="outline" onClick={() => { fetchTags(); fetchProducts(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div className="text-2xl font-bold text-blue-600">{availableTags.length}</div>
          <div className="text-xs text-gray-500">Available Tags</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{selectedProducts.size}</div>
          <div className="text-xs text-gray-500">Selected</div>
        </Card>
      </div>

      {/* Available Tags */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4" /> Available Tags ({availableTags.length})
          </h3>
          {selectedProducts.size > 0 && (
            <Button size="sm" onClick={() => setShowBulkTagModal(true)}>
              Apply Tag to {selectedProducts.size} Products
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <div key={tag.id} className="flex items-center gap-1">
              <Badge className={`${getColorClass(tag.color)} text-white`}>
                {tag.label}
              </Badge>
              {tag.is_custom && (
                <button 
                  onClick={() => deleteTag(tag.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
        
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
        >
          <option value="all">All Pillars</option>
          {pillars.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="with-tags">With Tags</option>
          <option value="without-tags">Without Tags</option>
          <optgroup label="Filter by Tag">
            {availableTags.map(tag => (
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
              className={`p-4 transition-all ${expandedProduct === product.id ? 'ring-2 ring-purple-500' : ''} ${selectedProducts.has(product.id) ? 'bg-purple-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images?.[0] || product.image ? (
                    <img 
                      src={product.images?.[0] || product.image} 
                      alt={product.title || product.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">{product.title || product.name || 'Unnamed Product'}</h4>
                    {product.handle && (
                      <a 
                        href={`/shop/${product.handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-500 hover:text-purple-700"
                        title="View on frontend"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline" className="text-xs capitalize">{product.pillar || 'general'}</Badge>
                    <Badge variant="outline" className="text-xs">{product.category || 'Uncategorized'}</Badge>
                    <span>₹{product.price || 0}</span>
                  </div>
                  
                  {/* Current Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(product.display_tags || []).map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <Badge key={tagId} className={`${getColorClass(tag.color)} text-white text-xs`}>
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
                    {availableTags.map(tag => {
                      const isActive = (product.display_tags || []).includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(product, tag.id)}
                          disabled={saving[product.id]}
                          className={`
                            px-3 py-1.5 rounded-full text-sm font-medium transition-all
                            ${isActive 
                              ? `${getColorClass(tag.color)} text-white shadow-md scale-105` 
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

      {/* Create Tag Modal */}
      <Dialog open={showCreateTagModal} onOpenChange={setShowCreateTagModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['🏷️', '⭐', '🔥', '💎', '🎉', '💜', '✨', '🌟', '💰', '🎁', '🏆', '❤️'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewTag(prev => ({ ...prev, emoji }))}
                    className={`text-2xl p-2 rounded ${newTag.emoji === emoji ? 'bg-purple-100 ring-2 ring-purple-500' : 'hover:bg-gray-100'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tag Name</Label>
              <Input
                value={newTag.label}
                onChange={(e) => setNewTag(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Summer Sale, Member Only"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setNewTag(prev => ({ ...prev, color: color.id }))}
                    className={`w-8 h-8 rounded-full ${color.class} ${newTag.color === color.id ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <Badge className={`${getColorClass(newTag.color)} text-white`}>
                {newTag.emoji} {newTag.label || 'New Tag'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTagModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createTag} 
              disabled={creatingTag || !newTag.label.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creatingTag ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Modal */}
      <Dialog open={showBulkTagModal} onOpenChange={setShowBulkTagModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Tag to {selectedProducts.size} Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select a tag to apply to all selected products:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => bulkApplyTag(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getColorClass(tag.color)} text-white hover:opacity-90 transition-opacity`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTagModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductTagsManager;
