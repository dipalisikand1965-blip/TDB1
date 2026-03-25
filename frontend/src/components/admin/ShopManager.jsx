/**
 * ShopManager - Admin component for comprehensive shop management
 * Features: Products, orders, inventory, reports, settings
 * Pattern follows TravelManager and DineManager
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  ShoppingBag, Package, DollarSign, Settings, RefreshCw, Upload, Download,
  Plus, Edit2, Trash2, Search, Eye, TrendingUp, Clock, MapPin, User, 
  CheckCircle, XCircle, Loader2, BarChart3, AlertTriangle, Truck,
  FileText, Archive, ShoppingCart, Heart, Mail, Send, Sparkles, Building2, Bell, Briefcase
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import PillarBundlesTab from './PillarBundlesTab';
import PillarExperiencesTab from './PillarExperiencesTab';
import CloudinaryUploader from './CloudinaryUploader';

const ShopManager = ({ getAuthHeader }) => {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [inventory, setInventory] = useState({ low_stock: [], out_of_stock: [] });
  const [settings, setSettings] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const [salesReport, setSalesReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [wishlistData, setWishlistData] = useState({ popular_wishlisted: [], total_wishlisted_products: 0 });
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const fileInputRef = useRef(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    title: '', description: '', price: '', compare_at_price: '', 
    category: '', pillars: [], image: '', available: true,
    quantity: 100, paw_reward_points: 0
  });

  const categories = {
    treats: { name: 'Treats & Snacks', icon: '🍪' },
    cakes: { name: 'Celebration Cakes', icon: '🎂' },
    food: { name: 'Pet Food', icon: '🍖' },
    toys: { name: 'Toys & Play', icon: '🎾' },
    accessories: { name: 'Accessories', icon: '🎀' },
    health: { name: 'Health & Wellness', icon: '💊' },
    grooming: { name: 'Grooming Products', icon: '✨' },
    travel: { name: 'Travel Gear', icon: '✈️' },
    memorial: { name: 'Memorial Items', icon: '🌈' }
  };

  const orderStatusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      
      const [productsRes, ordersRes, statsRes, inventoryRes, settingsRes, syncRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/api/shop/products?limit=200`),
        axios.get(`${API_URL}/api/shop/orders?limit=100`, authHeader),
        axios.get(`${API_URL}/api/shop/stats`),
        axios.get(`${API_URL}/api/shop/inventory`),
        axios.get(`${API_URL}/api/shop/admin/settings`, authHeader).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/shop/admin/sync-status`, authHeader).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/shop/reports/sales?period=month`, authHeader).catch(() => ({ data: {} }))
      ]);
      
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setStats(statsRes.data || {});
      setInventory(inventoryRes.data || { low_stock: [], out_of_stock: [] });
      setSettings(settingsRes.data || {});
      setSyncStatus(syncRes.data || {});
      setSalesReport(salesRes.data || {});
    } catch (error) {
      console.error('Error fetching shop data:', error);
      toast({ title: 'Error', description: 'Failed to load shop data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistData = async () => {
    setLoadingWishlist(true);
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const response = await axios.get(`${API_URL}/api/admin/wishlists/summary`, authHeader);
      setWishlistData(response.data || { popular_wishlisted: [], total_wishlisted_products: 0 });
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const syncToUnified = async () => {
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const response = await axios.post(`${API_URL}/api/shop/admin/sync-unified`, {}, authHeader);
      toast({ title: 'Success', description: `Synced ${response.data.synced} products to unified collection` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to sync products', variant: 'destructive' });
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
        quantity: parseInt(productForm.quantity) || 0,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/api/shop/admin/products/${editingProduct.id || editingProduct.shopify_id}`, payload, authHeader);
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/shop/admin/products`, payload, authHeader);
        toast({ title: 'Success', description: 'Product created' });
      }
      
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      await axios.patch(`${API_URL}/api/shop/orders/${orderId}`, { status }, authHeader);
      toast({ title: 'Success', description: 'Order status updated' });
      fetchData();
      setSelectedOrder(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      await axios.delete(`${API_URL}/api/shop/admin/products/${productId}`, authHeader);
      toast({ title: 'Success', description: 'Product deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      title: '', description: '', price: '', compare_at_price: '', 
      category: '', pillars: [], image: '', available: true,
      quantity: 100, paw_reward_points: 0
    });
  };

  // CSV Export functions
  const handleProductExport = () => {
    const headers = ['ID', 'Title', 'Category', 'Price', 'Compare Price', 'Available', 'Quantity', 'Paw Points'];
    const rows = products.map(p => [
      p.id || p.shopify_id, p.title, p.category, p.price, p.compare_at_price || '', 
      p.available ? 'Yes' : 'No', p.quantity || 0, p.paw_reward_points || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    downloadCSV(csv, 'shop-products.csv');
    toast({ title: 'Exported!', description: `${products.length} products exported` });
  };

  const handleOrdersExport = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Created At', 'Items Count'];
    const rows = orders.map(o => [
      o.order_id, o.customer_name || '', o.customer_email || '', o.total || 0, 
      o.status, o.created_at?.split('T')[0], o.items?.length || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    downloadCSV(csv, 'shop-orders.csv');
    toast({ title: 'Exported!', description: `${orders.length} orders exported` });
  };

  const handleProductImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const authHeader = typeof getAuthHeader === 'function' ? getAuthHeader() : getAuthHeader;
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const productsToImport = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
      });

      const response = await axios.post(`${API_URL}/api/shop/admin/products/import`, productsToImport, authHeader);
      toast({ title: 'Success', description: `Imported ${response.data.imported} products` });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import products', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    return matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="shop-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🛒 Shop Manager</h2>
          <p className="text-gray-500">Manage products, orders, inventory & reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={syncToUnified} variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" /> Sync to Unified
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.products?.total || 0}</p>
              <p className="text-sm opacity-90">Products</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.products?.in_stock || 0}</p>
              <p className="text-sm opacity-90">In Stock</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.orders?.total || 0}</p>
              <p className="text-sm opacity-90">Total Orders</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{stats.orders?.pending || 0}</p>
              <p className="text-sm opacity-90">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-500 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{inventory.out_of_stock_count || 0}</p>
              <p className="text-sm opacity-90">Out of Stock</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">₹{(stats.revenue?.monthly || 0).toLocaleString()}</p>
              <p className="text-sm opacity-90">Monthly Revenue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Status Banner */}
      {syncStatus.difference !== 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Sync Required</p>
                <p className="text-sm text-amber-600">
                  Products: {syncStatus.products_collection} | Unified: {syncStatus.unified_products_collection} 
                  ({syncStatus.difference > 0 ? '+' : ''}{syncStatus.difference} difference)
                </p>
              </div>
            </div>
            <Button size="sm" onClick={syncToUnified} className="bg-amber-600 hover:bg-amber-700">
              Sync Now
            </Button>
          </div>
        </Card>
      )}

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={(val) => {
        setActiveSubTab(val);
        if (val === 'wishlists') fetchWishlistData();
      }}>
        <TabsList className="bg-white border">
          <TabsTrigger value="products" data-testid="shop-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="shop-tab-orders">
            <ShoppingBag className="w-4 h-4 mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="wishlists" data-testid="shop-tab-wishlists">
            <Heart className="w-4 h-4 mr-2" /> Wishlists
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="shop-tab-inventory">
            <Archive className="w-4 h-4 mr-2" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="shop-tab-reports">
            <BarChart3 className="w-4 h-4 mr-2" /> Reports
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="shop-tab-bundles">
            <Package className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="experiences" data-testid="shop-tab-experiences">
            <Heart className="w-4 h-4 mr-2" /> Experiences
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="shop-tab-settings">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="shop-tab-requests">
            <Bell className="w-4 h-4 mr-2" /> Requests
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="shop-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="shop-tab-services">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid="shop-tab-tips">
            <Sparkles className="w-4 h-4 mr-2" /> Tips
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleProductImport}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import
                </Button>
                <Button variant="outline" onClick={handleProductExport}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id || product.shopify_id} className="p-4">
                <div className="flex items-start gap-3">
                  {product.image_url || product.image ? (
                    <img src={product.image_url || product.image} alt={product.title} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{product.title}</h4>
                    <p className="text-sm text-gray-500">{categories[product.category]?.name || product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-green-600">₹{product.price}</span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">₹{product.compare_at_price}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.available ? (
                        <Badge className="bg-green-100 text-green-600 text-xs">In Stock</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-600 text-xs">Out of Stock</Badge>
                      )}
                      {product.paw_reward_points > 0 && (
                        <Badge variant="outline" className="text-xs">🐾 {product.paw_reward_points} pts</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(product);
                      setProductForm({
                        title: product.title || '',
                        description: product.description || '',
                        price: product.price?.toString() || '',
                        compare_at_price: product.compare_at_price?.toString() || '',
                        category: product.category || '',
                        pillars: product.pillars || [],
                        image: product.image || '',
                        available: product.available !== false,
                        quantity: product.quantity || 100,
                        paw_reward_points: product.paw_reward_points || 0
                      });
                      setShowProductModal(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => deleteProduct(product.id || product.shopify_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products found</p>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Button variant="outline" onClick={handleOrdersExport}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No orders found</p>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card 
                  key={order.order_id} 
                  className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedOrder?.order_id === order.order_id ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => setSelectedOrder(selectedOrder?.order_id === order.order_id ? null : order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-purple-100">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{order.order_id}</h3>
                          <Badge className={orderStatusColors[order.status] || 'bg-gray-100'}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          {order.customer_name || order.customer_email || 'Guest'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} items • ₹{order.total || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
                      <p className="font-bold text-green-600 mt-1">₹{order.total || 0}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedOrder?.order_id === order.order_id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Customer</p>
                          <p className="font-medium">{order.customer_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.customer_email}</p>
                          <p className="text-sm text-gray-500">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Shipping</p>
                          <p className="text-sm">{order.shipping_address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Payment</p>
                          <p className="text-sm">{order.payment_method || 'N/A'}</p>
                          <p className="text-sm font-semibold">₹{order.total}</p>
                        </div>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase mb-2">Items</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{item.title || item.name} × {item.quantity}</span>
                                <span className="text-sm font-medium">₹{item.price * (item.quantity || 1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'processing'); }}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Process
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'shipped'); }}
                            className="bg-indigo-500 hover:bg-indigo-600"
                          >
                            <Truck className="w-4 h-4 mr-1" /> Ship
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'delivered'); }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Mark Delivered
                          </Button>
                        )}
                        {!['completed', 'cancelled'].includes(order.status) && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'cancelled'); }}
                            className="text-red-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Low Stock */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Low Stock ({inventory.low_stock_count || inventory.low_stock?.length || 0})</h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(inventory.low_stock || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No low stock items</p>
                ) : (
                  inventory.low_stock.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                      <span className="text-sm truncate">{item.title}</span>
                      <Badge className="bg-amber-100 text-amber-700">{item.quantity} left</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Out of Stock */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold">Out of Stock ({inventory.out_of_stock_count || inventory.out_of_stock?.length || 0})</h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(inventory.out_of_stock || []).length === 0 ? (
                  <p className="text-sm text-gray-500">All items in stock!</p>
                ) : (
                  inventory.out_of_stock.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm truncate">{item.title}</span>
                      <Badge className="bg-red-100 text-red-700">Out</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold">₹{(salesReport.total_revenue || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
            </Card>
            <Card className="p-6 text-center">
              <ShoppingCart className="w-10 h-10 mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold">{salesReport.total_orders || 0}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </Card>
            <Card className="p-6 text-center">
              <DollarSign className="w-10 h-10 mx-auto text-purple-500 mb-2" />
              <p className="text-3xl font-bold">₹{Math.round(salesReport.average_order_value || 0)}</p>
              <p className="text-sm text-gray-500">Avg Order Value</p>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">🏆 Top Selling Products</h3>
            <div className="space-y-2">
              {(salesReport.top_products || []).slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{product.revenue?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{product.quantity} sold</p>
                  </div>
                </div>
              ))}
              {(!salesReport.top_products || salesReport.top_products.length === 0) && (
                <p className="text-center text-gray-500 py-4">No sales data available</p>
              )}
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">📦 Products by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.categories || {}).map(([cat, count]) => (
                <div key={cat} className="p-3 bg-gray-50 rounded text-center">
                  <p className="text-2xl">{categories[cat]?.icon || '📦'}</p>
                  <p className="font-bold">{count}</p>
                  <p className="text-xs text-gray-500 truncate">{categories[cat]?.name || cat}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Wishlists Tab - Admin view for sending reminders */}
        <TabsContent value="wishlists" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Customer Wishlists
                </h3>
                <p className="text-sm text-gray-500">Products customers have liked - send reminders to convert</p>
              </div>
              <Button variant="outline" onClick={fetchWishlistData} disabled={loadingWishlist}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingWishlist ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
            
            {loadingWishlist ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                <p className="text-gray-500 mt-2">Loading wishlist data...</p>
              </div>
            ) : wishlistData.popular_wishlisted?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No wishlisted products yet</p>
                <p className="text-sm text-gray-400">Products will appear here when customers start adding items to their wishlist</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistData.popular_wishlisted.map((item) => (
                  <Card key={item._id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 m-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{item.product_name || 'Unknown Product'}</h4>
                        <p className="text-sm text-purple-600 font-medium">₹{item.product_price?.toLocaleString() || 'N/A'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                            <strong className="text-red-600">{item.users_count}</strong> people wishlisted
                          </span>
                          <span>Last: {item.latest_added ? new Date(item.latest_added).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            // Open compose email with pre-filled recipients
                            const emails = item.user_emails?.filter(e => e).join(',') || '';
                            window.open(`mailto:${emails}?subject=Your wishlisted item at The Doggy Company&body=Hi there!%0A%0AWe noticed you've been eyeing ${item.product_name}. Here's a special reminder that this item is waiting for you!%0A%0AShop now: ${window.location.origin}/product/${item._id}%0A%0A- The Doggy Company Team`, '_blank');
                            toast({ title: 'Opening email client', description: `Sending to ${item.users_count} customers` });
                          }}
                        >
                          <Mail className="w-4 h-4 mr-1" /> Send Reminder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/product/${item._id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                    {/* Expanded user list */}
                    {item.user_emails?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Wishlisted by:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.user_emails.slice(0, 5).map((email, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                          {item.user_emails.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.user_emails.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <PillarBundlesTab 
            pillar="shop"
            credentials={getAuthHeader}
            accentColor="blue"
          />
        </TabsContent>

        {/* Experiences Tab */}
        <TabsContent value="experiences" className="space-y-4">
          <PillarExperiencesTab 
            pillar="shop"
            credentials={getAuthHeader}
            accentColor="blue"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">💰 Pricing Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Currency</Label>
                <Input value={settings.currency || 'INR'} disabled />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  value={settings.tax_rate || 18}
                  onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Free Shipping Threshold (₹)</Label>
                <Input 
                  type="number" 
                  value={settings.free_shipping_threshold || 999}
                  onChange={(e) => setSettings({...settings, free_shipping_threshold: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Shipping Charge (₹)</Label>
                <Input 
                  type="number" 
                  value={settings.shipping_charge || 99}
                  onChange={(e) => setSettings({...settings, shipping_charge: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per ₹ Spent</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_rupee || 1}
                  onChange={(e) => setSettings({
                    ...settings,
                    paw_rewards: { ...settings.paw_rewards, points_per_rupee: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Redemption Value (points = ₹1)</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.redemption_value || 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    paw_rewards: { ...settings.paw_rewards, redemption_value: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📦 Payment & Delivery</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cash on Delivery</Label>
                  <p className="text-sm text-gray-500">Allow customers to pay on delivery</p>
                </div>
                <Switch 
                  checked={settings.cod_available || false}
                  onCheckedChange={(checked) => setSettings({...settings, cod_available: checked})}
                />
              </div>
              {settings.cod_available && (
                <div>
                  <Label>COD Charge (₹)</Label>
                  <Input 
                    type="number" 
                    value={settings.cod_charge || 50}
                    onChange={(e) => setSettings({...settings, cod_charge: parseFloat(e.target.value)})}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="p-8 text-center" data-testid="shop-requests-panel">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Shop Requests</p>
            <p className="text-sm text-gray-400 mt-1">Customer service requests for the Shop pillar will appear here</p>
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="p-8 text-center" data-testid="shop-partners-panel">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Shop Partners</p>
            <p className="text-sm text-gray-400 mt-1">Brand and vendor partner management coming soon</p>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card className="p-8 text-center" data-testid="shop-services-panel">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Shop Services</p>
            <p className="text-sm text-gray-400 mt-1">Concierge® shopping and delivery services coming soon</p>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <Card className="p-8 text-center" data-testid="shop-tips-panel">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Shop Tips</p>
            <p className="text-sm text-gray-400 mt-1">Quick win tips for pet shopping coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Title *</Label>
                <Input 
                  value={productForm.title}
                  onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, cat]) => (
                      <SelectItem key={key} value={key}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input 
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({...productForm, quantity: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Price (₹) *</Label>
                <Input 
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input 
                  type="number"
                  value={productForm.compare_at_price}
                  onChange={(e) => setProductForm({...productForm, compare_at_price: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Image URL</Label>
                <Input 
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              {/* Cloudinary Upload */}
              <div className="col-span-2">
                <CloudinaryUploader
                  entityType="product"
                  entityId={editingProduct?.id}
                  currentImageUrl={productForm.image}
                  onUploadSuccess={(url) => setProductForm({...productForm, image: url})}
                  label="Upload Product Image"
                  showPreview={true}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>Paw Reward Points</Label>
                <Input 
                  type="number"
                  value={productForm.paw_reward_points}
                  onChange={(e) => setProductForm({...productForm, paw_reward_points: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch 
                  checked={productForm.available}
                  onCheckedChange={(checked) => setProductForm({...productForm, available: checked})}
                />
                <Label>Available / In Stock</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopManager;
