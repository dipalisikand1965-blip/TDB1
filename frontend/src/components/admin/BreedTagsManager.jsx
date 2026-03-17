import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import {
  Search, Tag, PawPrint, Plus, X, Save, Loader2, RefreshCw,
  Package, Check, Filter
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

const BreedTagsManager = () => {
  const [products, setProducts] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedBreedFilter, setSelectedBreedFilter] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkBreeds, setBulkBreeds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAddBreedModal, setShowAddBreedModal] = useState(false);
  const [newBreedName, setNewBreedName] = useState('');
  const [addingBreed, setAddingBreed] = useState(false);

  // Fetch products and breed options
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, breedsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=500`),
        axios.get(`${API_URL}/api/admin/breed-tags/options`)
      ]);
      
      setProducts(productsRes.data.products || []);
      setBreedOptions(breedsRes.data.breeds || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new custom breed
  const handleAddBreed = async () => {
    if (!newBreedName.trim()) {
      toast({ title: 'Error', description: 'Please enter a breed name', variant: 'destructive' });
      return;
    }
    
    const formattedBreed = newBreedName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    if (breedOptions.includes(formattedBreed)) {
      toast({ title: 'Error', description: 'This breed already exists', variant: 'destructive' });
      return;
    }
    
    setAddingBreed(true);
    try {
      await axios.post(`${API_URL}/api/admin/breed-tags/add`, { breed: formattedBreed });
      setBreedOptions(prev => [...prev, formattedBreed].sort());
      setNewBreedName('');
      setShowAddBreedModal(false);
      toast({ title: 'Success', description: `Added "${formattedBreed}" to breed list` });
    } catch (error) {
      console.error('Failed to add breed:', error);
      toast({ title: 'Error', description: 'Failed to add breed', variant: 'destructive' });
    } finally {
      setAddingBreed(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBreed = !selectedBreedFilter ||
      product.breed_tags?.some(t => t.toLowerCase().includes(selectedBreedFilter.toLowerCase()));
    
    return matchesSearch && matchesBreed;
  });

  // Toggle product selection
  const toggleProduct = (productId) => {
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

  // Select all visible products
  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Update single product breed tags
  const updateProductBreedTags = async (productId, breedTags) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/products/${productId}/breed-tags`, 
        breedTags,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, breed_tags: breedTags } : p
      ));
      
      toast({ title: 'Success', description: 'Breed tags updated' });
      return response.data;
    } catch (error) {
      console.error('Failed to update breed tags:', error);
      toast({ title: 'Error', description: 'Failed to update breed tags', variant: 'destructive' });
      throw error;
    }
  };

  // Bulk update breed tags
  const handleBulkUpdate = async (action) => {
    if (selectedProducts.size === 0 || bulkBreeds.length === 0) {
      toast({ title: 'Error', description: 'Select products and breeds first', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/admin/products/bulk-breed-tags`, {
        product_ids: Array.from(selectedProducts),
        breed_tags: bulkBreeds,
        action: action
      });
      
      toast({ 
        title: 'Success', 
        description: `Updated breed tags for ${selectedProducts.size} products` 
      });
      
      // Refresh data
      await fetchData();
      setSelectedProducts(new Set());
      setShowBulkModal(false);
      setBulkBreeds([]);
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({ title: 'Error', description: 'Failed to update breed tags', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle breed in bulk selection
  const toggleBulkBreed = (breed) => {
    setBulkBreeds(prev => 
      prev.includes(breed) 
        ? prev.filter(b => b !== breed)
        : [...prev, breed]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-purple-600" />
            Breed Tags Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tag products by breed for personalized recommendations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowAddBreedModal(true)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Breed
          </Button>
          {selectedProducts.size > 0 && (
            <Button 
              onClick={() => setShowBulkModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Tag className="w-4 h-4 mr-2" />
              Tag {selectedProducts.size} Products
            </Button>
          )}
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedBreedFilter}
          onChange={(e) => setSelectedBreedFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
        >
          <option value="">All Breeds</option>
          {breedOptions.map(breed => (
            <option key={breed} value={breed}>{breed}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Tagged Products</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.breed_tags?.length > 0).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Untagged Products</p>
          <p className="text-2xl font-bold text-orange-600">
            {products.filter(p => !p.breed_tags?.length).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Selected</p>
          <p className="text-2xl font-bold text-purple-600">{selectedProducts.size}</p>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">
                  <Checkbox
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={selectAll}
                  />
                </th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Product</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Breed Tags</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.slice(0, 100).map((product) => (
                <ProductRow 
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.has(product.id)}
                  onToggle={() => toggleProduct(product.id)}
                  breedOptions={breedOptions}
                  onUpdateTags={(tags) => updateProductBreedTags(product.id, tags)}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length > 100 && (
          <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-500">
            Showing 100 of {filteredProducts.length} products. Use search to filter.
          </div>
        )}
      </Card>

      {/* Bulk Tag Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              Bulk Tag {selectedProducts.size} Products
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Select breeds to tag the selected products:
            </p>
            
            <div className="max-h-60 overflow-y-auto border rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                {breedOptions.map(breed => (
                  <div 
                    key={breed}
                    onClick={() => toggleBulkBreed(breed)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      bulkBreeds.includes(breed) 
                        ? 'bg-purple-100 border-purple-300 border' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      bulkBreeds.includes(breed) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {bulkBreeds.includes(breed) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{breed}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {bulkBreeds.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Selected breeds:</p>
                <div className="flex flex-wrap gap-1">
                  {bulkBreeds.map(breed => (
                    <Badge key={breed} variant="outline" className="text-xs">
                      {breed}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => toggleBulkBreed(breed)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleBulkUpdate('remove')}
              disabled={saving || bulkBreeds.length === 0}
              className="text-red-600 hover:bg-red-50"
            >
              Remove Tags
            </Button>
            <Button 
              onClick={() => handleBulkUpdate('add')}
              disabled={saving || bulkBreeds.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Breed Modal */}
      <Dialog open={showAddBreedModal} onOpenChange={setShowAddBreedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-green-600" />
              Add New Breed
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">Breed Name</Label>
            <Input
              value={newBreedName}
              onChange={(e) => setNewBreedName(e.target.value)}
              placeholder="e.g. Cockapoo, Goldendoodle..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddBreed()}
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the breed name and it will be added to the available breeds list for tagging products.
            </p>
            
            {/* Show existing breeds count */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{breedOptions.length}</strong> breeds currently available
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddBreedModal(false); setNewBreedName(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBreed}
              disabled={addingBreed || !newBreedName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {addingBreed ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Breed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Product Row Component
const ProductRow = ({ product, isSelected, onToggle, breedOptions, onUpdateTags }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tags, setTags] = useState(product.breed_tags || []);
  const [showAllBreeds, setShowAllBreeds] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateTags(tags);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (breed) => {
    setTags(prev => 
      prev.includes(breed) 
        ? prev.filter(t => t !== breed)
        : [...prev, breed]
    );
  };

  // Reset tags when product changes or editing starts
  const handleStartEdit = () => {
    setTags(product.breed_tags || []);
    setShowAllBreeds(false);
    setIsEditing(true);
  };

  const displayBreeds = showAllBreeds ? breedOptions : breedOptions.slice(0, 10);
  const remainingCount = breedOptions.length - 10;

  return (
    <tr className={isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}>
      <td className="p-3">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {product.image_url || product.image ? (
              <img src={product.image_url || product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-5 h-5" />
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
        </div>
      </td>
      <td className="p-3">
        <Badge variant="outline" className="text-xs">{product.category || 'Uncategorized'}</Badge>
      </td>
      <td className="p-3 text-gray-600">₹{product.price}</td>
      <td className="p-3">
        {isEditing ? (
          <div className="flex flex-wrap gap-1 max-w-md">
            {displayBreeds.map(breed => (
              <Badge 
                key={breed}
                variant={tags.includes(breed) ? 'default' : 'outline'}
                className={`text-xs cursor-pointer transition-colors ${tags.includes(breed) ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-100'}`}
                onClick={() => toggleTag(breed)}
              >
                {breed}
              </Badge>
            ))}
            {!showAllBreeds && remainingCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer text-purple-600 hover:bg-purple-50"
                onClick={() => setShowAllBreeds(true)}
              >
                +{remainingCount} more
              </Badge>
            )}
            {showAllBreeds && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer text-gray-500 hover:bg-gray-100"
                onClick={() => setShowAllBreeds(false)}
              >
                Show less
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(product.breed_tags || []).length > 0 ? (
              product.breed_tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs bg-purple-50 text-purple-700">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">No tags</span>
            )}
            {(product.breed_tags?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{product.breed_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setShowAllBreeds(false); }}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={handleStartEdit}>
            <Tag className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </td>
    </tr>
  );
};

export default BreedTagsManager;
