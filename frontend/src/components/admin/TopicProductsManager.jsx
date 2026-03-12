/**
 * TopicProductsManager.jsx
 * Admin component to assign products to Learn topics
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  GraduationCap, Save, X, Plus, Loader2, Check, Search,
  Package, ChevronDown, ChevronRight
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const TopicProductsManager = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTopics();
    fetchAllProducts();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/learn/topics/all`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      // Get curated learn products
      const learnRes = await fetch(`${API_URL}/api/learn/products`);
      const learnData = learnRes.ok ? await learnRes.json() : { products: [] };
      
      // Get product-box products
      const boxRes = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=100`);
      const boxData = boxRes.ok ? await boxRes.json() : { products: [] };
      
      // Combine and dedupe
      const all = [...(learnData.products || []), ...(boxData.products || [])];
      const unique = all.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
      
      setAvailableProducts(unique);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = async (topic) => {
    setSelectedTopic(topic);
    setAssignedProducts(topic.products || []);
    
    // Fetch assigned products for this topic
    try {
      const res = await fetch(`${API_URL}/api/learn/topic-products/${topic.slug}`);
      if (res.ok) {
        const data = await res.json();
        // Get product IDs from the response
        setAssignedProducts((data.products || []).map(p => p.id));
      }
    } catch (err) {
      console.error('Error fetching topic products:', err);
    }
  };

  const toggleProduct = (productId) => {
    setAssignedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const saveAssignments = async () => {
    if (!selectedTopic) return;
    setSaving(true);
    
    try {
      const res = await fetch(`${API_URL}/api/learn/topic-products/${selectedTopic.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: assignedProducts })
      });
      
      if (res.ok) {
        toast.success(`Saved ${assignedProducts.length} products to "${selectedTopic.title}"`);
        // Update local state
        setTopics(prev => prev.map(t => 
          t.slug === selectedTopic.slug 
            ? { ...t, products: assignedProducts }
            : t
        ));
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      toast.error('Error saving assignments');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = availableProducts.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(query) ||
           (p.description || '').toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="w-6 h-6 text-amber-600" />
        <h2 className="text-xl font-bold">Topic Products Manager</h2>
      </div>
      
      <p className="text-gray-600 text-sm">
        Select a topic, then choose which products should appear when users open that topic's modal.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Topics
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {topics.map(topic => (
              <div
                key={topic.slug}
                onClick={() => selectTopic(topic)}
                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                  selectedTopic?.slug === topic.slug
                    ? 'bg-amber-100 border-2 border-amber-400'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div>
                  <p className="font-medium">{topic.title}</p>
                  <p className="text-xs text-gray-500">{topic.slug}</p>
                </div>
                <Badge variant="outline">
                  {(topic.products || []).length} products
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Products Selector */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Products for: 
            <span className="text-amber-600">{selectedTopic?.title || 'Select a topic'}</span>
          </h3>
          
          {selectedTopic ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
              
              {/* Products list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                {filteredProducts.map(product => {
                  const isAssigned = assignedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                        isAssigned
                          ? 'bg-green-50 border-2 border-green-400'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {/* Product image */}
                      <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        {(product.image || product.image_url) ? (
                          <img 
                            src={product.image || product.image_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">₹{product.price}</p>
                      </div>
                      
                      {/* Selection indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isAssigned ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>
                        {isAssigned && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Save button */}
              <Button 
                onClick={saveAssignments}
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save {assignedProducts.length} Products</>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a topic from the left to assign products</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TopicProductsManager;
