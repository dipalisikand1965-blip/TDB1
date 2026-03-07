/**
 * PillarBundlesTab - Reusable Bundles Management Tab
 * ===================================================
 * 
 * A reusable component for managing pillar-specific bundles
 * in admin dashboards. Handles CRUD operations for bundles.
 * 
 * USAGE:
 *   <PillarBundlesTab 
 *     pillar="enjoy" 
 *     credentials={credentials}
 *     accentColor="green"
 *   />
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, 
  Upload, Download, Package, Tag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import axios from 'axios';

const PillarBundlesTab = ({ pillar, credentials, accentColor = 'green' }) => {
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBundle, setEditingBundle] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  
  const csvInputRef = useRef(null);

  const emptyBundle = {
    name: '',
    title: '',
    description: '',
    price: 0,
    original_price: 0,
    discount_percent: 0,
    items: [],
    image_url: '',
    is_active: true,
    is_featured: false,
    validity_days: 30,
    category: ''
  };

  // Fetch bundles
  const fetchBundles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/${pillar}/admin/bundles`);
      setBundles(response.data.bundles || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      // Try alternative endpoint
      try {
        const altResponse = await axios.get(`${API_URL}/api/admin/${pillar}/bundles`);
        setBundles(altResponse.data.bundles || altResponse.data || []);
      } catch (altError) {
        setBundles([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, [pillar]);

  // Save bundle
  const handleSaveBundle = async () => {
    const bundleName = editingBundle?.name || editingBundle?.title;
    if (!bundleName) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...editingBundle,
        name: bundleName,
        title: bundleName,
        pillar,
        updated_at: new Date().toISOString()
      };

      if (editingBundle.id) {
        await axios.put(`${API_URL}/api/${pillar}/admin/bundles/${editingBundle.id}`, payload);
        toast({ title: 'Bundle updated successfully' });
      } else {
        payload.id = `${pillar}-bundle-${Date.now()}`;
        payload.created_at = new Date().toISOString();
        await axios.post(`${API_URL}/api/${pillar}/admin/bundles`, payload);
        toast({ title: 'Bundle created successfully' });
      }
      
      setEditingBundle(null);
      setIsAddingNew(false);
      fetchBundles();
    } catch (error) {
      console.error('Error saving bundle:', error);
      toast({ title: 'Failed to save bundle', variant: 'destructive' });
    }
  };

  // Delete bundle
  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;

    try {
      await axios.delete(`${API_URL}/api/${pillar}/admin/bundles/${bundleId}`);
      toast({ title: 'Bundle deleted' });
      fetchBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast({ title: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open(`${API_URL}/api/${pillar}/admin/bundles/export-csv`, '_blank');
  };

  // Import CSV
  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/${pillar}/admin/bundles/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Success', description: `Imported ${response.data.imported || 0} bundles` });
      fetchBundles();
    } catch (error) {
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  // Filter bundles
  const filteredBundles = bundles.filter(bundle => {
    const name = bundle.name || bundle.title || '';
    const desc = bundle.description || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const colorClasses = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
    teal: 'bg-teal-500 hover:bg-teal-600'
  };

  const accentClass = colorClasses[accentColor] || colorClasses.green;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles..."
              className="pl-9 w-64"
            />
          </div>
          <Badge variant="outline">{filteredBundles.length} bundles</Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={csvInputRef}
            onChange={handleImportCsv}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()} disabled={importingCsv}>
            <Upload className="w-4 h-4 mr-2" />
            {importingCsv ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            className={accentClass}
            onClick={() => { setEditingBundle(emptyBundle); setIsAddingNew(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bundle
          </Button>
        </div>
      </div>

      {/* Bundle Form (Add/Edit) */}
      {(editingBundle || isAddingNew) && (
        <Card className="p-6 border-2 border-dashed">
          <h3 className="text-lg font-semibold mb-4">
            {isAddingNew ? 'Add New Bundle' : 'Edit Bundle'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={editingBundle?.name || editingBundle?.title || ''}
                onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value, title: e.target.value })}
                placeholder="Bundle name"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editingBundle?.description || ''}
                onChange={(e) => setEditingBundle({ ...editingBundle, description: e.target.value })}
                placeholder="Bundle description"
                className="w-full p-2 border rounded-md min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                value={editingBundle?.price || 0}
                onChange={(e) => setEditingBundle({ ...editingBundle, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Original Price (₹)</label>
              <Input
                type="number"
                value={editingBundle?.original_price || 0}
                onChange={(e) => setEditingBundle({ ...editingBundle, original_price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount %</label>
              <Input
                type="number"
                value={editingBundle?.discount_percent || 0}
                onChange={(e) => setEditingBundle({ ...editingBundle, discount_percent: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Validity (days)</label>
              <Input
                type="number"
                value={editingBundle?.validity_days || 30}
                onChange={(e) => setEditingBundle({ ...editingBundle, validity_days: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={editingBundle?.image_url || ''}
                onChange={(e) => setEditingBundle({ ...editingBundle, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingBundle?.is_active ?? true}
                  onChange={(e) => setEditingBundle({ ...editingBundle, is_active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingBundle?.is_featured ?? false}
                  onChange={(e) => setEditingBundle({ ...editingBundle, is_featured: e.target.checked })}
                />
                <span className="text-sm">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setEditingBundle(null); setIsAddingNew(false); }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button className={accentClass} onClick={handleSaveBundle}>
              <Save className="w-4 h-4 mr-2" />
              Save Bundle
            </Button>
          </div>
        </Card>
      )}

      {/* Bundles List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading bundles...</div>
      ) : filteredBundles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bundles found. Add your first bundle!
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBundles.map((bundle) => (
            <Card key={bundle.id} className="p-4">
              <div className="flex items-start gap-4">
                {bundle.image_url ? (
                  <img src={bundle.image_url} alt={bundle.name || bundle.title} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{bundle.name || bundle.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{bundle.description?.slice(0, 100)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {bundle.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                      <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-semibold text-green-600">₹{(bundle.price || 0).toLocaleString()}</span>
                    {bundle.original_price > bundle.price && (
                      <span className="text-gray-400 line-through">₹{bundle.original_price.toLocaleString()}</span>
                    )}
                    {bundle.discount_percent > 0 && (
                      <Badge className="bg-red-500">{bundle.discount_percent}% OFF</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingBundle(bundle)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteBundle(bundle.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PillarBundlesTab;
