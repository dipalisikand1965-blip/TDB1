import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getApiUrl } from '../utils/api';
import AutoshipSettings from './AutoshipSettings';
import {
  Search, Filter, Download, Upload, Edit, Save, Loader2, RefreshCw,
  DollarSign, Percent, Package, Truck, Building2, Calculator, CheckCircle,
  ArrowUpDown, ChevronDown, X, Plus, Trash2, Wallet, FileSpreadsheet, Sparkles, Database
} from 'lucide-react';

const PILLARS = [
  { id: 'celebrate', name: 'Celebrate (Bakery)', icon: '🎂', color: 'bg-pink-100 text-pink-700' },
  { id: 'dine', name: 'Dine', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  { id: 'stay', name: 'Stay (Pawcation)', icon: '🏨', color: 'bg-green-100 text-green-700' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'bg-blue-100 text-blue-700' },
  { id: 'care', name: 'Care', icon: '💊', color: 'bg-purple-100 text-purple-700' },
  { id: 'shop', name: 'Shop', icon: '🛍️', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎉', color: 'bg-rose-100 text-rose-700' },
  { id: 'fit', name: 'Fit', icon: '💪', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'advisory', name: 'Advisory', icon: '📋', color: 'bg-violet-100 text-violet-700' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', color: 'bg-slate-100 text-slate-700' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: 'bg-red-100 text-red-700' },
  { id: 'club', name: 'Club (Membership)', icon: '👑', color: 'bg-amber-100 text-amber-700' },
  { id: 'live_mira', name: 'Live Mira', icon: '🤖', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'live_mis', name: 'Live MIS', icon: '📊', color: 'bg-sky-100 text-sky-700' },
  { id: 'shipping', name: 'Pricing, Shipping & Commercial', icon: '🚚', color: 'bg-gray-100 text-gray-700' }
];

const GST_RATES = [0, 5, 12, 18, 28];

// Inline editable row for partner commissions
const PartnerCommissionRow = ({ partner, partnerType, defaultCommission, getAuthHeader, onUpdate, formatCurrency }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commissionType, setCommissionType] = useState(partner.commission_type || 'percentage');
  const [commissionValue, setCommissionValue] = useState(partner.commission_value || defaultCommission);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/admin/pricing/partner-commissions/${partnerType}/${partner.id}?commission_type=${commissionType}&commission_value=${commissionValue}`,
        { method: 'PATCH', headers: getAuthHeader() }
      );
      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
    setSaving(false);
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3">
        <div>
          <p className="font-medium">{partner.name}</p>
          <p className="text-xs text-gray-400">{partner.id}</p>
        </div>
      </td>
      <td className="p-3 text-gray-500">{partner.city || '-'}</td>
      <td className="p-3 text-center">
        {isEditing ? (
          <select
            className="border rounded px-2 py-1 text-sm"
            value={commissionType}
            onChange={(e) => setCommissionType(e.target.value)}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹)</option>
          </select>
        ) : (
          <Badge variant="outline" className={commissionType === 'fixed' ? 'bg-blue-50' : 'bg-green-50'}>
            {commissionType === 'fixed' ? '₹ Fixed' : '% Per Booking'}
          </Badge>
        )}
      </td>
      <td className="p-3 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <Input
              type="number"
              value={commissionValue}
              onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
              className="w-24 text-right"
            />
            <span className="text-gray-500">{commissionType === 'fixed' ? '₹' : '%'}</span>
          </div>
        ) : (
          <span className="font-medium">
            {commissionType === 'fixed' 
              ? formatCurrency(commissionValue || 0)
              : `${commissionValue || defaultCommission}%`
            }
          </span>
        )}
      </td>
      <td className="p-3 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </td>
    </tr>
  );
};

// Pillar Bundles Section Component
const PillarBundlesSection = ({ getAuthHeader, formatCurrency }) => {
  const [activePillar, setActivePillar] = useState('celebrate');
  const [bundles, setBundles] = useState({ celebrate: [], dine: [], stay: [], travel: [], care: [] });
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch bundles for all pillars
  const fetchAllBundles = async () => {
    setLoading(true);
    try {
      // Fetch Celebrate bundles (products with bundle_type)
      const celebrateRes = await fetch(`${getApiUrl()}/api/admin/pricing/products?pillar=celebrate&limit=50`, { headers: getAuthHeader() });
      const celebrateData = await celebrateRes.json();
      const celebrateBundles = (celebrateData.products || []).filter(p => p.bundle_type || p.tags?.includes('bundle'));

      // Fetch Dine bundles
      let dineBundles = [];
      try {
        const dineRes = await fetch(`${getApiUrl()}/api/admin/dine/bundles`, { headers: getAuthHeader() });
        if (dineRes.ok) {
          const dineData = await dineRes.json();
          dineBundles = dineData.bundles || [];
        }
      } catch (e) { console.log('Dine bundles not available'); }

      // Fetch Stay bundles/socials
      let stayBundles = [];
      try {
        const stayRes = await fetch(`${getApiUrl()}/api/admin/stay/socials`, { headers: getAuthHeader() });
        if (stayRes.ok) {
          const stayData = await stayRes.json();
          stayBundles = stayData.events || stayData.socials || [];
        }
      } catch (e) { console.log('Stay bundles not available'); }

      // Fetch products for Travel and Care pillars (bundles)
      const travelRes = await fetch(`${getApiUrl()}/api/admin/pricing/products?pillar=travel&limit=50`, { headers: getAuthHeader() });
      const travelData = await travelRes.json();
      const travelBundles = (travelData.products || []).filter(p => p.bundle_type || p.tags?.includes('bundle'));

      // Fetch Care bundles from dedicated care bundles endpoint
      let careBundles = [];
      try {
        const careBundlesRes = await fetch(`${getApiUrl()}/api/care/bundles`);
        if (careBundlesRes.ok) {
          const careBundlesData = await careBundlesRes.json();
          careBundles = careBundlesData.bundles || [];
        }
      } catch (e) { 
        console.log('Care bundles not available from dedicated endpoint, trying products');
        // Fallback to products with bundle tag
        const careRes = await fetch(`${getApiUrl()}/api/admin/pricing/products?pillar=care&limit=50`, { headers: getAuthHeader() });
        const careData = await careRes.json();
        careBundles = (careData.products || []).filter(p => p.bundle_type || p.tags?.includes('bundle'));
      }

      setBundles({
        celebrate: celebrateBundles,
        dine: dineBundles,
        stay: stayBundles,
        travel: travelBundles,
        care: careBundles
      });
    } catch (err) {
      console.error('Error fetching bundles:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllBundles();
  }, []);

  const updateBundlePricing = async (bundle, pillar) => {
    setSaving(true);
    try {
      let endpoint = '';
      let method = 'PATCH';
      let body = {};

      if (pillar === 'dine') {
        endpoint = `${getApiUrl()}/api/admin/dine/bundles/${bundle.id}`;
        body = { price: bundle.price, discounted_price: bundle.discounted_price };
      } else if (pillar === 'stay') {
        endpoint = `${getApiUrl()}/api/admin/stay/socials/${bundle.id}`;
        body = { price: bundle.price };
      } else {
        // Celebrate, Travel, Care - use product pricing endpoint
        endpoint = `${getApiUrl()}/api/admin/pricing/products/${bundle.id}`;
        body = { selling_price: bundle.price, margin_percent: bundle.margin_percent };
      }

      await fetch(endpoint, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setEditingBundle(null);
      fetchAllBundles();
    } catch (err) {
      console.error('Error updating bundle:', err);
    }
    setSaving(false);
  };

  const pillarConfig = {
    celebrate: { icon: '🎂', color: 'bg-pink-100 text-pink-700', label: 'Celebrate' },
    dine: { icon: '🍽️', color: 'bg-orange-100 text-orange-700', label: 'Dine' },
    stay: { icon: '🏨', color: 'bg-green-100 text-green-700', label: 'Stay' },
    travel: { icon: '✈️', color: 'bg-blue-100 text-blue-700', label: 'Travel' },
    care: { icon: '💊', color: 'bg-purple-100 text-purple-700', label: 'Care' }
  };

  const currentBundles = bundles[activePillar] || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pillar Bundles & Packages</h3>
          <p className="text-sm text-gray-500">Manage pricing for bundles and packages across all pillars</p>
        </div>
        <Button variant="outline" onClick={fetchAllBundles}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Pillar Tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(pillarConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActivePillar(key)}
            data-testid={`pillar-bundle-${key}`}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activePillar === key 
                ? `${config.color} font-semibold ring-2 ring-offset-2 ring-purple-500`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            <Badge variant="secondary" className="ml-1">{bundles[key]?.length || 0}</Badge>
          </button>
        ))}
      </div>

      {/* Bundles Table */}
      <Card className="overflow-hidden">
        <div className={`px-4 py-3 border-b ${pillarConfig[activePillar].color}`}>
          <span className="font-semibold flex items-center gap-2">
            {pillarConfig[activePillar].icon} {pillarConfig[activePillar].label} Bundles & Packages
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">Bundle / Package</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-right">Price (₹)</th>
                <th className="p-3 text-right">Discounted (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  </td>
                </tr>
              ) : currentBundles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No bundles found for {pillarConfig[activePillar].label}</p>
                    <p className="text-xs mt-1">Create bundles in the {pillarConfig[activePillar].label} Manager</p>
                  </td>
                </tr>
              ) : (
                currentBundles.map((bundle) => {
                  const isEditing = editingBundle?.id === bundle.id;
                  const bundlePrice = bundle.price || bundle.pricing?.selling_price || 0;
                  const discountedPrice = bundle.discounted_price || bundle.sale_price || bundlePrice;

                  return (
                    <tr key={bundle.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {(bundle.image || bundle.images?.[0]) && (
                            <img 
                              src={bundle.image || bundle.images?.[0]} 
                              alt="" 
                              className="w-10 h-10 rounded object-cover" 
                            />
                          )}
                          <div>
                            <p className="font-medium">{bundle.name || bundle.title}</p>
                            <p className="text-xs text-gray-400">{bundle.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {bundle.bundle_type || bundle.category || bundle.type || 'Package'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingBundle.price}
                            onChange={(e) => setEditingBundle({
                              ...editingBundle,
                              price: parseFloat(e.target.value) || 0
                            })}
                            className="w-24 text-right"
                          />
                        ) : (
                          formatCurrency(bundlePrice)
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingBundle.discounted_price || editingBundle.price}
                            onChange={(e) => setEditingBundle({
                              ...editingBundle,
                              discounted_price: parseFloat(e.target.value) || 0
                            })}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className={discountedPrice < bundlePrice ? 'text-green-600 font-medium' : ''}>
                            {formatCurrency(discountedPrice)}
                            {discountedPrice < bundlePrice && (
                              <span className="text-xs ml-1">
                                ({Math.round((1 - discountedPrice/bundlePrice) * 100)}% off)
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={bundle.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {bundle.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateBundlePricing(editingBundle, activePillar)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingBundle(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingBundle({ 
                              ...bundle, 
                              price: bundlePrice,
                              discounted_price: discountedPrice
                            })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            Total: {currentBundles.length} bundles in {pillarConfig[activePillar].label}
          </p>
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium text-purple-900">Bundle Management Tips</p>
            <ul className="text-sm text-purple-700 mt-2 space-y-1">
              <li>• <strong>Celebrate:</strong> Manage bundles in Celebrate Manager or mark products as bundles</li>
              <li>• <strong>Dine:</strong> Create bundles in Dine Manager (Meal Packages, Special Menus)</li>
              <li>• <strong>Stay:</strong> Social events & pawcation packages in Stay Manager</li>
              <li>• <strong>Travel & Care:</strong> Coming soon - bundles will appear here when created</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PricingHub = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({ pillar: '', category: '', search: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Shipping state
  const [shippingRules, setShippingRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  
  // Global App Settings (for checkout shipping thresholds)
  const [appSettings, setAppSettings] = useState({
    free_shipping_threshold: 3000,
    default_shipping_fee: 150,
    shipping_thresholds: [
      { min_cart_value: 0, max_cart_value: 3000, shipping_fee: 150 },
      { min_cart_value: 3000, max_cart_value: 999999, shipping_fee: 0 }
    ],
    pickup_cities: ['Mumbai', 'Gurugram', 'Bangalore'],
    bakery_pickup_only_categories: ['cakes', 'fresh_treats', 'celebration']
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Commission state
  const [commissions, setCommissions] = useState([]);
  const [partnerCommissions, setPartnerCommissions] = useState({ restaurants: [], stays: [] });
  
  // Stats
  const [stats, setStats] = useState({});
  
  // Bulk edit state
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditType, setBulkEditType] = useState('margin');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${getApiUrl()}/api/admin/pricing/products?limit=100`;
      if (filters.pillar) url += `&pillar=${filters.pillar}`;
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      
      const res = await fetch(url, { headers: getAuthHeader() });
      const data = await res.json();
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setLoading(false);
  }, [filters, getAuthHeader]);

  const fetchShippingRules = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/shipping-rules`, { headers: getAuthHeader() });
      const data = await res.json();
      setShippingRules(data.rules || []);
    } catch (err) {
      console.error('Error fetching shipping rules:', err);
    }
  };

  // Fetch global app settings for checkout shipping thresholds
  const fetchAppSettings = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/settings`, { headers: getAuthHeader() });
      const data = await res.json();
      setAppSettings({
        free_shipping_threshold: data.free_shipping_threshold || 3000,
        default_shipping_fee: data.default_shipping_fee || 150,
        shipping_thresholds: data.shipping_thresholds || [
          { min_cart_value: 0, max_cart_value: 3000, shipping_fee: 150 },
          { min_cart_value: 3000, max_cart_value: 999999, shipping_fee: 0 }
        ],
        pickup_cities: data.pickup_cities || ['Mumbai', 'Gurugram', 'Bangalore'],
        bakery_pickup_only_categories: data.bakery_pickup_only_categories || ['cakes', 'fresh_treats', 'celebration']
      });
    } catch (err) {
      console.error('Error fetching app settings:', err);
    }
  };

  // Save global app settings
  const saveAppSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/settings`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings)
      });
      if (res.ok) {
        alert('Shipping settings saved successfully!');
      }
    } catch (err) {
      console.error('Error saving app settings:', err);
    }
    setSavingSettings(false);
  };

  const fetchCommissions = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/commissions`, { headers: getAuthHeader() });
      const data = await res.json();
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error('Error fetching commissions:', err);
    }
  };

  const fetchPartnerCommissions = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/partner-commissions`, { headers: getAuthHeader() });
      const data = await res.json();
      setPartnerCommissions(data);
    } catch (err) {
      console.error('Error fetching partner commissions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/stats`, { headers: getAuthHeader() });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShippingRules();
    fetchCommissions();
    fetchPartnerCommissions();
    fetchStats();
    fetchAppSettings();
  }, [fetchProducts]);

  // Update product pricing
  const updateProductPricing = async (productId, pricingData) => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/products/${productId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData)
      });
      if (res.ok) {
        fetchProducts();
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Error updating pricing:', err);
    }
    setSaving(false);
  };

  // Bulk update
  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to update');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/products/bulk-update`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: selectedProducts,
          update_type: bulkEditType,
          value: parseFloat(bulkEditValue),
          is_percentage: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Updated ${data.updated_count} products`);
        setSelectedProducts([]);
        setShowBulkEdit(false);
        fetchProducts();
      }
    } catch (err) {
      console.error('Error bulk updating:', err);
    }
    setSaving(false);
  };

  // Export CSV
  const handleExport = () => {
    let url = `${getApiUrl()}/api/admin/pricing/export`;
    if (filters.pillar) url += `?pillar=${filters.pillar}`;
    window.open(url, '_blank');
  };

  // Seed Products from Product Box
  const seedFromProductBox = async () => {
    if (!confirm('This will sync all products from Unified Product Box to Pricing Hub.\nThis ensures both systems have the same products.\n\nContinue?')) return;
    
    setSeeding(true);
    try {
      // First sync from Product Box
      const migrateRes = await fetch(`${getApiUrl()}/api/product-box/migrate-from-products`, { method: 'POST' });
      const migrateData = await migrateRes.json();
      
      // Then fetch updated products
      await fetchProducts();
      await fetchStats();
      
      alert(`Sync complete! ${migrateData.migrated || 0} products synchronized.`);
    } catch (err) {
      console.error('Error seeding:', err);
      alert('Sync failed. Please check console for details.');
    }
    setSeeding(false);
  };

  // Import CSV
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pricing/import`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const data = await res.json();
      alert(data.message);
      fetchProducts();
    } catch (err) {
      console.error('Error importing:', err);
    }
    setSaving(false);
    e.target.value = '';
  };

  // Save shipping rule
  const saveShippingRule = async () => {
    setSaving(true);
    try {
      const method = editingRule.id ? 'PATCH' : 'POST';
      const url = editingRule.id 
        ? `${getApiUrl()}/api/admin/pricing/shipping-rules/${editingRule.id}`
        : `${getApiUrl()}/api/admin/pricing/shipping-rules`;
      
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule)
      });
      if (res.ok) {
        fetchShippingRules();
        setShowRuleModal(false);
        setEditingRule(null);
      }
    } catch (err) {
      console.error('Error saving shipping rule:', err);
    }
    setSaving(false);
  };

  // Save commission
  const saveCommission = async (commission) => {
    try {
      await fetch(`${getApiUrl()}/api/admin/pricing/commissions`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(commission)
      });
      fetchCommissions();
    } catch (err) {
      console.error('Error saving commission:', err);
    }
  };

  // Calculate price
  const calculatePrice = (cost, margin) => {
    if (!cost || cost <= 0) return 0;
    return Math.round(cost * (1 + margin / 100));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing, Shipping & Commercial Hub</h2>
          <p className="text-gray-500">Manage all pricing, shipping rules, and pillar commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={seedFromProductBox}
            disabled={seeding}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Seed from Product Box
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span><Upload className="w-4 h-4 mr-2" /> Import CSV</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Button onClick={() => { fetchProducts(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_products || 0}</p>
              <p className="text-xs text-gray-500">Total Products</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.priced_products || 0}</p>
              <p className="text-xs text-gray-500">Priced</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avg_margin || 100}%</p>
              <p className="text-xs text-gray-500">Avg Margin</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avg_gst || 5}%</p>
              <p className="text-xs text-gray-500">Avg GST</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.shipping_rules || 0}</p>
              <p className="text-xs text-gray-500">Shipping Rules</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="products">Product Pricing</TabsTrigger>
          <TabsTrigger value="bundles">Pillar Bundles</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Rules</TabsTrigger>
          <TabsTrigger value="commissions">Pillar Commissions</TabsTrigger>
          <TabsTrigger value="partners">Partner Rates</TabsTrigger>
          <TabsTrigger value="autoship" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Autoship
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="pl-10"
                />
              </div>
              <select
                className="border rounded-lg px-3 py-2"
                value={filters.pillar}
                onChange={(e) => setFilters({ ...filters, pillar: e.target.value })}
              >
                <option value="">All Pillars</option>
                {PILLARS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
              <Button variant="outline" onClick={fetchProducts}>
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              {selectedProducts.length > 0 && (
                <Button onClick={() => setShowBulkEdit(true)} className="bg-purple-600">
                  <Edit className="w-4 h-4 mr-2" /> Bulk Edit ({selectedProducts.length})
                </Button>
              )}
            </div>
          </Card>

          {/* Products Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(products.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-right">Cost (₹)</th>
                    <th className="p-3 text-right">Margin %</th>
                    <th className="p-3 text-right">Selling Price (₹)</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">Final Price (₹)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const pricing = product.pricing || {};
                      const isEditing = editingProduct?.id === product.id;
                      
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, product.id]);
                                } else {
                                  setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {product.images?.[0] && (
                                <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                              )}
                              <div>
                                <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editingProduct.pricing.cost}
                                onChange={(e) => setEditingProduct({
                                  ...editingProduct,
                                  pricing: { ...editingProduct.pricing, cost: parseFloat(e.target.value) || 0 }
                                })}
                                className="w-24 text-right"
                              />
                            ) : (
                              formatCurrency(pricing.cost || 0)
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editingProduct.pricing.margin_percent}
                                onChange={(e) => {
                                  const margin = parseFloat(e.target.value) || 0;
                                  const newPrice = calculatePrice(editingProduct.pricing.cost, margin);
                                  setEditingProduct({
                                    ...editingProduct,
                                    pricing: { 
                                      ...editingProduct.pricing, 
                                      margin_percent: margin,
                                      calculated_price: newPrice,
                                      selling_price: newPrice
                                    }
                                  });
                                }}
                                className="w-20 text-right"
                              />
                            ) : (
                              <span className={pricing.margin_percent >= 100 ? 'text-green-600' : 'text-orange-600'}>
                                {pricing.margin_percent || 100}%
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editingProduct.pricing.selling_price}
                                onChange={(e) => setEditingProduct({
                                  ...editingProduct,
                                  pricing: { 
                                    ...editingProduct.pricing, 
                                    selling_price: parseFloat(e.target.value) || 0,
                                    is_price_overridden: true
                                  }
                                })}
                                className="w-24 text-right"
                              />
                            ) : (
                              <span className={pricing.is_price_overridden ? 'text-blue-600 font-medium' : ''}>
                                {formatCurrency(pricing.selling_price || product.price || 0)}
                                {pricing.is_price_overridden && ' *'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <select
                                value={editingProduct.pricing.gst_percent}
                                onChange={(e) => setEditingProduct({
                                  ...editingProduct,
                                  pricing: { ...editingProduct.pricing, gst_percent: parseFloat(e.target.value) }
                                })}
                                className="border rounded px-2 py-1 w-20"
                              >
                                {GST_RATES.map(rate => (
                                  <option key={rate} value={rate}>{rate}%</option>
                                ))}
                              </select>
                            ) : (
                              <Badge variant="outline">{pricing.gst_percent || 5}%</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium text-green-700">
                            {formatCurrency(product.price_with_gst || (pricing.selling_price * (1 + (pricing.gst_percent || 5) / 100)))}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => updateProductPricing(product.id, editingProduct.pricing)}
                                  disabled={saving}
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingProduct(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingProduct({ ...product, pricing: { ...pricing } })}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {products.length} of {totalProducts} products
                {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
              </p>
              <p className="text-xs text-gray-400">* = Price manually overridden</p>
            </div>
          </Card>
        </TabsContent>

        {/* Pillar Bundles Tab */}
        <TabsContent value="bundles" className="space-y-6">
          <PillarBundlesSection getAuthHeader={getAuthHeader} formatCurrency={formatCurrency} />
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          {/* GLOBAL CHECKOUT SHIPPING SETTINGS */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Checkout Shipping Settings
              <Badge className="bg-blue-100 text-blue-700">Global</Badge>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These settings control shipping fees displayed at checkout for all customers.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Shipping Threshold */}
              <div>
                <Label className="text-sm font-medium">Free Shipping Threshold (₹)</Label>
                <p className="text-xs text-gray-500 mb-2">Cart value above which shipping is FREE</p>
                <Input
                  type="number"
                  value={appSettings.free_shipping_threshold}
                  onChange={(e) => setAppSettings({
                    ...appSettings,
                    free_shipping_threshold: parseFloat(e.target.value) || 0
                  })}
                  className="bg-white"
                />
              </div>
              
              {/* Default Shipping Fee */}
              <div>
                <Label className="text-sm font-medium">Default Shipping Fee (₹)</Label>
                <p className="text-xs text-gray-500 mb-2">Standard fee for orders below threshold</p>
                <Input
                  type="number"
                  value={appSettings.default_shipping_fee}
                  onChange={(e) => setAppSettings({
                    ...appSettings,
                    default_shipping_fee: parseFloat(e.target.value) || 0
                  })}
                  className="bg-white"
                />
              </div>
            </div>
            
            {/* Shipping Thresholds Table */}
            <div className="mt-6">
              <Label className="text-sm font-medium mb-2 block">Shipping Fee Tiers</Label>
              <p className="text-xs text-gray-500 mb-3">Configure different shipping fees based on cart value</p>
              
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Min Cart Value (₹)</th>
                      <th className="p-3 text-left">Max Cart Value (₹)</th>
                      <th className="p-3 text-left">Shipping Fee (₹)</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(appSettings.shipping_thresholds || []).map((threshold, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          <Input
                            type="number"
                            value={threshold.min_cart_value}
                            onChange={(e) => {
                              const newThresholds = [...appSettings.shipping_thresholds];
                              newThresholds[idx].min_cart_value = parseFloat(e.target.value) || 0;
                              setAppSettings({ ...appSettings, shipping_thresholds: newThresholds });
                            }}
                            className="w-28"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={threshold.max_cart_value}
                            onChange={(e) => {
                              const newThresholds = [...appSettings.shipping_thresholds];
                              newThresholds[idx].max_cart_value = parseFloat(e.target.value) || 0;
                              setAppSettings({ ...appSettings, shipping_thresholds: newThresholds });
                            }}
                            className="w-28"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={threshold.shipping_fee}
                            onChange={(e) => {
                              const newThresholds = [...appSettings.shipping_thresholds];
                              newThresholds[idx].shipping_fee = parseFloat(e.target.value) || 0;
                              setAppSettings({ ...appSettings, shipping_thresholds: newThresholds });
                            }}
                            className="w-28"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              const newThresholds = appSettings.shipping_thresholds.filter((_, i) => i !== idx);
                              setAppSettings({ ...appSettings, shipping_thresholds: newThresholds });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newThresholds = [
                      ...appSettings.shipping_thresholds,
                      { min_cart_value: 0, max_cart_value: 1000, shipping_fee: 100 }
                    ];
                    setAppSettings({ ...appSettings, shipping_thresholds: newThresholds });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Tier
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={saveAppSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Settings
                </Button>
              </div>
            </div>
            
            {/* Pickup Cities */}
            <div className="mt-6 pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Store Pickup Cities</Label>
              <p className="text-xs text-gray-500 mb-2">Cities where customers can choose store pickup for bakery items</p>
              <div className="flex flex-wrap gap-2">
                {(appSettings.pickup_cities || []).map((city, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                    {city}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => {
                        const newCities = appSettings.pickup_cities.filter((_, i) => i !== idx);
                        setAppSettings({ ...appSettings, pickup_cities: newCities });
                      }}
                    />
                  </Badge>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => {
                    const city = prompt('Enter city name:');
                    if (city && city.trim()) {
                      setAppSettings({
                        ...appSettings,
                        pickup_cities: [...(appSettings.pickup_cities || []), city.trim()]
                      });
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add City
                </Button>
              </div>
            </div>
          </Card>

          {/* EXISTING SHIPPING RULES */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Shipping Rules</h3>
            <Button onClick={() => { setEditingRule({ name: '', rule_type: 'flat', base_amount: 0, gst_percent: 18, is_active: true }); setShowRuleModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Rule
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {shippingRules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Badge variant="outline" className="mt-1">{rule.rule_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingRule(rule); setShowRuleModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Base Amount: {formatCurrency(rule.base_amount)}</p>
                  {rule.per_kg_rate && <p>Per KG: {formatCurrency(rule.per_kg_rate)}</p>}
                  {rule.free_above_amount && <p>Free above: {formatCurrency(rule.free_above_amount)}</p>}
                  <p>GST: {rule.gst_percent}%</p>
                </div>
              </Card>
            ))}
            {shippingRules.length === 0 && (
              <Card className="p-8 text-center col-span-2">
                <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No shipping rules configured</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <h3 className="text-lg font-semibold">Pillar Commission Settings</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure default commission rates for each business pillar. These apply to new partners.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((pillar) => {
              const commission = commissions.find(c => c.pillar_id === pillar.id) || {
                pillar_id: pillar.id,
                pillar_name: pillar.name,
                commission_type: 'percentage',
                commission_value: 10
              };
              
              return (
                <Card key={pillar.id} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{pillar.icon}</span>
                    <div>
                      <h4 className="font-semibold">{pillar.name}</h4>
                      <Badge className={pillar.color}>{pillar.id}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">Commission Type</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 mt-1"
                        value={commission.commission_type}
                        onChange={(e) => saveCommission({ ...commission, commission_type: e.target.value })}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="margin">Margin-based (Products)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        {commission.commission_type === 'percentage' ? 'Commission %' : 
                         commission.commission_type === 'fixed' ? 'Amount (₹)' : 'Default Margin %'}
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          value={commission.commission_value}
                          onChange={(e) => saveCommission({ ...commission, commission_value: parseFloat(e.target.value) || 0 })}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {commission.commission_type === 'fixed' ? '₹' : '%'}
                        </span>
                      </div>
                    </div>
                    {commission.notes && (
                      <p className="text-xs text-gray-500 italic">{commission.notes}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Restaurant & Stay Commissions</h3>
              <p className="text-sm text-gray-500">
                Set commission rates for individual restaurants and properties (% per booking or fixed ₹ amount)
              </p>
            </div>
            <Button variant="outline" onClick={fetchPartnerCommissions}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          <Tabs defaultValue="restaurants">
            <TabsList>
              <TabsTrigger value="restaurants">🍽️ Dine - Restaurants ({partnerCommissions.restaurants?.length || 0})</TabsTrigger>
              <TabsTrigger value="stays">🏨 Stay - Hotels/Properties ({partnerCommissions.stays?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="restaurants" className="mt-4">
              <Card className="overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <span className="font-medium">All Restaurants</span>
                  <Badge className="bg-orange-100 text-orange-700">Default: 10% commission</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 text-left">Restaurant</th>
                        <th className="p-3 text-left">City</th>
                        <th className="p-3 text-center">Commission Type</th>
                        <th className="p-3 text-right">Commission Value</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerCommissions.restaurants?.map((restaurant) => (
                        <PartnerCommissionRow 
                          key={restaurant.id}
                          partner={restaurant}
                          partnerType="restaurant"
                          defaultCommission={10}
                          getAuthHeader={getAuthHeader}
                          onUpdate={fetchPartnerCommissions}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                      {(!partnerCommissions.restaurants || partnerCommissions.restaurants.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            No restaurants found. Add restaurants in the Dine Manager.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="stays" className="mt-4">
              <Card className="overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <span className="font-medium">All Stays & Hotels</span>
                  <Badge className="bg-green-100 text-green-700">Default: 12% commission</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 text-left">Property</th>
                        <th className="p-3 text-left">City</th>
                        <th className="p-3 text-center">Commission Type</th>
                        <th className="p-3 text-right">Commission Value</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerCommissions.stays?.map((stay) => (
                        <PartnerCommissionRow 
                          key={stay.id}
                          partner={stay}
                          partnerType="stay"
                          defaultCommission={12}
                          getAuthHeader={getAuthHeader}
                          onUpdate={fetchPartnerCommissions}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                      {(!partnerCommissions.stays || partnerCommissions.stays.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            No stays/hotels found. Build the Stay pillar to add properties.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Autoship Tab */}
        <TabsContent value="autoship" className="space-y-4">
          <AutoshipSettings getAuthHeader={getAuthHeader} />
        </TabsContent>
      </Tabs>

      {/* Bulk Edit Modal */}
      <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedProducts.length} Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Update Type</Label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={bulkEditType}
                onChange={(e) => setBulkEditType(e.target.value)}
              >
                <option value="margin">Margin %</option>
                <option value="gst">GST %</option>
                <option value="cost">Cost (₹)</option>
                <option value="selling_price">Selling Price (₹)</option>
              </select>
            </div>
            <div>
              <Label>New Value</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  value={bulkEditValue}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                  placeholder={bulkEditType === 'margin' || bulkEditType === 'gst' ? 'e.g., 100' : 'e.g., 500'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {bulkEditType === 'margin' || bulkEditType === 'gst' ? '%' : '₹'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEdit(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={saving} className="bg-purple-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update {selectedProducts.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Rule Modal */}
      <Dialog open={showRuleModal} onOpenChange={setShowRuleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule?.id ? 'Edit' : 'Add'} Shipping Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g., Local Delivery"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rule Type</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={editingRule.rule_type}
                    onChange={(e) => setEditingRule({ ...editingRule, rule_type: e.target.value })}
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="weight">Per KG</option>
                    <option value="free_above">Free Above Amount</option>
                    <option value="location">Location-based</option>
                  </select>
                </div>
                <div>
                  <Label>Base Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingRule.base_amount}
                    onChange={(e) => setEditingRule({ ...editingRule, base_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {editingRule.rule_type === 'weight' && (
                <div>
                  <Label>Per KG Rate (₹)</Label>
                  <Input
                    type="number"
                    value={editingRule.per_kg_rate || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, per_kg_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              {editingRule.rule_type === 'free_above' && (
                <div>
                  <Label>Free Above Cart Value (₹)</Label>
                  <Input
                    type="number"
                    value={editingRule.free_above_amount || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, free_above_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GST on Shipping (%)</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={editingRule.gst_percent}
                    onChange={(e) => setEditingRule({ ...editingRule, gst_percent: parseFloat(e.target.value) })}
                  >
                    {GST_RATES.map(rate => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={editingRule.is_active}
                    onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</Button>
            <Button onClick={saveShippingRule} disabled={saving} className="bg-purple-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingHub;
