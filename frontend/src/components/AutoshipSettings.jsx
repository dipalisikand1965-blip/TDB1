import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { getApiUrl } from '../utils/api';
import { 
  RefreshCw, Save, Trash2, Plus, Search, Sparkles, Clock, 
  Package, Percent, CheckCircle, AlertCircle
} from 'lucide-react';

const AutoshipSettings = ({ getAuthHeader }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    discount_percent: 10,
    is_special: false,
    special_label: '',
    special_until: '',
    notes: ''
  });

  // Editable tiers
  const [editableTiers, setEditableTiers] = useState([
    { tier_name: 'first', min_order: 1, max_order: 1, discount_percent: 10 },
    { tier_name: 'second_to_fourth', min_order: 2, max_order: 4, discount_percent: 15 },
    { tier_name: 'fifth_plus', min_order: 5, max_order: null, discount_percent: 30 }
  ]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/autoship/settings`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.default_tiers) {
          setEditableTiers(data.default_tiers);
        }
      }
    } catch (err) {
      console.error('Error fetching autoship settings:', err);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/autoship/products`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const saveTiers = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/autoship/tiers`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTiers)
      });
      if (res.ok) {
        alert('Default tiers saved successfully!');
        fetchSettings();
      } else {
        alert('Failed to save tiers');
      }
    } catch (err) {
      console.error('Error saving tiers:', err);
      alert('Error saving tiers');
    }
    setSaving(false);
  };

  const openOverrideDialog = (product) => {
    setSelectedProduct(product);
    setOverrideForm({
      discount_percent: product.autoship_discount_percent || 10,
      is_special: product.autoship_is_special || false,
      special_label: product.autoship_special_label || '',
      special_until: product.autoship_special_until?.split('T')[0] || '',
      notes: ''
    });
    setShowOverrideDialog(true);
  };

  const saveOverride = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/autoship/product-override`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          discount_percent: parseFloat(overrideForm.discount_percent),
          is_special: overrideForm.is_special,
          special_label: overrideForm.special_label || null,
          special_until: overrideForm.special_until ? `${overrideForm.special_until}T23:59:59Z` : null,
          notes: overrideForm.notes || null
        })
      });
      if (res.ok) {
        alert('Product override saved!');
        setShowOverrideDialog(false);
        fetchSettings();
        fetchProducts();
      } else {
        alert('Failed to save override');
      }
    } catch (err) {
      console.error('Error saving override:', err);
    }
    setSaving(false);
  };

  const removeOverride = async (productId) => {
    if (!confirm('Remove autoship override for this product?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/autoship/product-override/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        alert('Override removed');
        fetchSettings();
        fetchProducts();
      }
    } catch (err) {
      console.error('Error removing override:', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tierLabels = {
    'first': '1st Order',
    'second_to_fourth': '2nd - 4th Orders',
    'fifth_plus': '5th Order Onwards'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="autoship-settings">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Product Overrides</p>
                <p className="text-2xl font-bold text-purple-600">{settings?.stats?.total_overrides || 0}</p>
              </div>
              <Package className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Specials</p>
                <p className="text-2xl font-bold text-amber-600">{settings?.stats?.active_specials || 0}</p>
              </div>
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-teal-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Default Tiers</p>
                <p className="text-2xl font-bold text-green-600">3</p>
              </div>
              <Percent className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Tiers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Default Autoship Discount Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            These discounts apply to all products unless overridden at the product level.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {editableTiers.map((tier, idx) => (
              <div key={tier.tier_name} className="p-4 border rounded-lg bg-gray-50">
                <Label className="font-semibold">{tierLabels[tier.tier_name] || tier.tier_name}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={tier.discount_percent}
                    onChange={(e) => {
                      const newTiers = [...editableTiers];
                      newTiers[idx].discount_percent = parseFloat(e.target.value) || 0;
                      setEditableTiers(newTiers);
                    }}
                    className="w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-gray-600">% off</span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={saveTiers} disabled={saving} className="bg-purple-600">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Default Tiers
          </Button>
        </CardContent>
      </Card>

      {/* Product Overrides Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Product-Specific Overrides
            </span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Set custom autoship discounts for specific products. Mark as "Special" to show a special offer label.
          </p>

          {/* Current Overrides */}
          {settings?.product_overrides?.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Current Overrides</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {settings.product_overrides.map((override) => (
                  <div key={override.product_id} className="p-3 border rounded-lg flex items-center gap-3">
                    {override.product_image && (
                      <img src={override.product_image} alt="" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{override.product_name || override.product_id}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700">{override.discount_percent}% off</Badge>
                        {override.is_special && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Special
                          </Badge>
                        )}
                      </div>
                      {override.special_until && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Until {new Date(override.special_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeOverride(override.product_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products List */}
          <h4 className="font-semibold mb-3">All Products</h4>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-center">Current Discount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 50).map((product) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {product.image && (
                          <img src={product.image} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{product.category || '-'}</td>
                    <td className="p-3 text-center">
                      {product.autoship_discount_percent ? (
                        <Badge className="bg-purple-100 text-purple-700">
                          {product.autoship_discount_percent}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Default</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {product.autoship_is_special ? (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Special
                        </Badge>
                      ) : product.autoship_discount_percent ? (
                        <Badge className="bg-blue-100 text-blue-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Override
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openOverrideDialog(product)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Set Override
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No products found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Autoship Override</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {selectedProduct.image && (
                  <img src={selectedProduct.image} alt="" className="w-16 h-16 rounded object-cover" />
                )}
                <div>
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">{selectedProduct.category}</p>
                </div>
              </div>

              <div>
                <Label>Discount Percentage *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={overrideForm.discount_percent}
                    onChange={(e) => setOverrideForm({...overrideForm, discount_percent: e.target.value})}
                    min={0}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-gray-600">% off on Autoship</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_special"
                  checked={overrideForm.is_special}
                  onChange={(e) => setOverrideForm({...overrideForm, is_special: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_special" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Mark as Special Offer (shows "Special" label)
                </Label>
              </div>

              {overrideForm.is_special && (
                <>
                  <div>
                    <Label>Special Offer Label</Label>
                    <Input
                      value={overrideForm.special_label}
                      onChange={(e) => setOverrideForm({...overrideForm, special_label: e.target.value})}
                      placeholder="e.g. Limited Time!, Hot Deal"
                    />
                  </div>

                  <div>
                    <Label>Special Offer Ends On</Label>
                    <Input
                      type="date"
                      value={overrideForm.special_until}
                      onChange={(e) => setOverrideForm({...overrideForm, special_until: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
                  </div>
                </>
              )}

              <div>
                <Label>Notes (internal)</Label>
                <Input
                  value={overrideForm.notes}
                  onChange={(e) => setOverrideForm({...overrideForm, notes: e.target.value})}
                  placeholder="Why this override was set..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>Cancel</Button>
            <Button onClick={saveOverride} disabled={saving} className="bg-purple-600">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutoshipSettings;
