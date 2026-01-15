import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Search, Plus, Edit, Trash2, Save, X, Image, 
  Layers, Check, AlertCircle, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CollectionManager = ({ getAuthHeader }) => {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    show_in_menu: false,
    product_ids: []
  });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [colRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/collections`, { headers: { 'Authorization': getAuthHeader() } }),
        fetch(`${API_URL}/api/admin/products?limit=1000`, { headers: { 'Authorization': getAuthHeader() } })
      ]);
      
      if (colRes.ok) {
        const data = await colRes.json();
        setCollections(data.collections);
      }
      
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description || '',
        image: collection.image || '',
        show_in_menu: collection.show_in_menu || false,
        product_ids: collection.product_ids || []
      });
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        show_in_menu: false,
        product_ids: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSaving(true);
    try {
      const url = editingCollection 
        ? `${API_URL}/api/admin/collections/${editingCollection.id}`
        : `${API_URL}/api/admin/collections`;
        
      const method = editingCollection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      await fetch(`${API_URL}/api/admin/collections/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const toggleProduct = (productId) => {
    setFormData(prev => {
      const ids = prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId];
      return { ...prev, product_ids: ids };
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Collections</h2>
        <Button onClick={() => openModal()} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {collections.map(col => (
          <Card key={col.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {col.image ? (
                <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Layers className="w-8 h-8" />
                </div>
              )}
              {col.show_in_menu && (
                <Badge className="absolute top-2 right-2 bg-green-500">In Menu</Badge>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{col.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{col.product_count} products</p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => openModal(col)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteCollection(col.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCollection ? 'Edit Collection' : 'New Collection'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <Label>Collection Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Summer Essentials"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              
              <div>
                <Label>Image URL</Label>
                <Input 
                  value={formData.image} 
                  onChange={(e) => setFormData({...formData, image: e.target.value})} 
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <div>
                  <Label>Show in Site Menu</Label>
                  <p className="text-xs text-gray-500">Make this collection visible in the navigation bar</p>
                </div>
                <Switch 
                  checked={formData.show_in_menu} 
                  onCheckedChange={(c) => setFormData({...formData, show_in_menu: c})} 
                />
              </div>

              <div>
                <Label className="mb-2 block">Products ({formData.product_ids.length} selected)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-2 border-b bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {filteredProducts.map(prod => (
                      <div 
                        key={prod.id} 
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${formData.product_ids.includes(prod.id) ? 'bg-purple-50' : ''}`}
                        onClick={() => toggleProduct(prod.id)}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${formData.product_ids.includes(prod.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                          {formData.product_ids.includes(prod.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {prod.image && <img src={prod.image} className="w-8 h-8 rounded object-cover" />}
                        <span className="text-sm flex-1">{prod.name}</span>
                        <span className="text-xs text-gray-500">₹{prod.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Collection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CollectionManager;
