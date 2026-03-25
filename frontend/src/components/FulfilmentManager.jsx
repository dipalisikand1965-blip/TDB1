import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import {
  Package, Truck, Clock, MapPin, RefreshCw, Search, Filter,
  ChefHat, Gift, Send, Eye, Edit, Printer, Phone, Mail,
  Calendar, CheckCircle, Loader2, AlertCircle, Users, FileText, Bell
} from 'lucide-react';

// Default statuses (will be overridden by API)
const DEFAULT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'gray', emoji: '⏳', notify_customer: false },
  { value: 'confirmed', label: 'Confirmed', color: 'blue', emoji: '✅', notify_customer: true },
  { value: 'baking', label: 'Baking', color: 'orange', emoji: '🍰', notify_customer: true },
  { value: 'personalised', label: 'Personalised', color: 'pink', emoji: '✨', notify_customer: true },
  { value: 'packed', label: 'Packed with Love', color: 'purple', emoji: '💜', notify_customer: true },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'indigo', emoji: '🚗', notify_customer: true },
  { value: 'delivered', label: 'Delivered & Celebrated', color: 'green', emoji: '🎉', notify_customer: true },
  { value: 'cancelled', label: 'Cancelled', color: 'red', emoji: '❌', notify_customer: true },
];

// Color mapping for status badges
const getStatusColor = (color) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    pink: 'bg-pink-100 text-pink-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return colorMap[color] || 'bg-gray-100 text-gray-700';
};

const FulfilmentManager = ({ authHeaders, pillar = 'celebrate' }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [draftOrders, setDraftOrders] = useState([]);
  const [batchView, setBatchView] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [statusNotes, setStatusNotes] = useState('');
  
  // Dynamic statuses from Status Engine
  const [FULFILMENT_STATUSES, setFulfilmentStatuses] = useState(DEFAULT_STATUSES);
  
  // Fetch statuses from Status Engine
  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/status-engine/statuses/${pillar}`);
      if (res.ok) {
        const data = await res.json();
        setFulfilmentStatuses(data.statuses.map(s => ({
          ...s,
          color: getStatusColor(s.color)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  }, [pillar]);
  
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);
  // Filters
  const [dateRange, setDateRange] = useState('today');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');

  // Draft order form
  const [draftForm, setDraftForm] = useState({
    customer: { name: '', email: '', phone: '', city: 'Bangalore', address: '' },
    pet: { name: '', breed: '' },
    items: [{ product_id: '', name: '', price: 0, quantity: 1 }],
    delivery_date: '',
    delivery_slot: '',
    special_instructions: '',
    concierge_notes: '',
    source: 'phone'
  });

  // Fetch fulfilment orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('date_range', dateRange);
      if (cityFilter) params.set('city', cityFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (orderTypeFilter) params.set('order_type', orderTypeFilter);

      const res = await fetch(`${API_URL}/api/admin/fulfilment?${params}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, dateRange, cityFilter, statusFilter, orderTypeFilter]);

  // Fetch batch view
  const fetchBatchView = useCallback(async (date = 'today') => {
    try {
      const res = await fetch(`${API_URL}/api/admin/fulfilment/batch-view?date=${date}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setBatchView(data);
      }
    } catch (error) {
      console.error('Failed to fetch batch view:', error);
    }
  }, [authHeaders]);

  // Fetch draft orders
  const fetchDraftOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/draft-orders`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDraftOrders(data.draft_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch draft orders:', error);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchOrders();
    fetchDraftOrders();
    fetchBatchView();
  }, [fetchOrders, fetchDraftOrders, fetchBatchView]);

  // Update order status using Status Engine
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Use the new Status Engine endpoint
      const res = await fetch(`${API_URL}/api/status-engine/update/${pillar}/${orderId}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          new_status: newStatus, 
          send_notification: sendNotification,
          notes: statusNotes || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const statusConfig = FULFILMENT_STATUSES.find(s => s.value === newStatus);
        
        toast({ 
          title: `${statusConfig?.emoji || '✅'} Status Updated`, 
          description: `Order status changed to ${statusConfig?.label || newStatus}` 
        });
        
        // Open WhatsApp if notification was sent and link is available
        if (data.notification?.whatsapp_link && sendNotification) {
          window.open(data.notification.whatsapp_link, '_blank');
        }
        
        // Show email confirmation if sent
        if (data.notification?.email_sent) {
          toast({ 
            title: '📧 Email Sent', 
            description: 'Customer has been notified via email' 
          });
        }
        
        fetchOrders();
        setShowStatusModal(false);
        setStatusNotes('');
      } else {
        const errorData = await res.json();
        toast({ title: 'Error', description: errorData.detail || 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Print Kitchen Sheet
  const printKitchenSheet = () => {
    if (!batchView) return;
    
    const printWindow = window.open('', '_blank');
    const date = batchView.date === 'today' ? 'Today' : 'Tomorrow';
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const ordersHtml = Object.entries(batchView.by_time_slot || {}).map(([slot, slotOrders]) => `
      <div class="time-slot">
        <h3>🕐 ${slot} (${slotOrders.length} orders)</h3>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Pet</th>
              <th>Products</th>
              <th>Special Instructions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${slotOrders.map(order => `
              <tr>
                <td><strong>${order.orderId || order.id}</strong><br/><small>${order.customer?.parentName || ''}</small></td>
                <td>🐾 ${order.pet?.name || 'N/A'}<br/><small>${order.pet?.breed || ''}</small></td>
                <td>${(order.items || []).map(i => `${i.quantity}x ${i.title || i.name}`).join('<br/>')}</td>
                <td class="instructions">${order.specialInstructions || order.notes || '-'}</td>
                <td><span class="status status-${order.status}">${order.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const topProductsHtml = (batchView.summary?.top_products || []).map(p => `
      <tr><td>${p.name}</td><td><strong>${p.quantity}x</strong></td></tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kitchen Sheet - ${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #9333ea; padding-bottom: 15px; }
          .header h1 { color: #9333ea; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; text-align: center; }
          .summary-card h4 { font-size: 24px; color: #9333ea; }
          .summary-card p { color: #666; font-size: 11px; }
          .top-products { margin-bottom: 20px; }
          .top-products h3 { margin-bottom: 10px; }
          .top-products table { width: 100%; border-collapse: collapse; }
          .top-products td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; }
          .time-slot { margin-bottom: 25px; page-break-inside: avoid; }
          .time-slot h3 { background: #9333ea; color: white; padding: 8px 15px; border-radius: 5px 5px 0 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: top; }
          th { background: #f3f4f6; font-weight: bold; }
          .instructions { font-style: italic; color: #666; max-width: 150px; }
          .status { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .status-confirmed { background: #dbeafe; color: #2563eb; }
          .status-baking { background: #ffedd5; color: #ea580c; }
          .status-packed { background: #f3e8ff; color: #9333ea; }
          @media print { body { padding: 10px; } .time-slot { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍰 Kitchen Sheet</h1>
          <p>${date} - ${dateStr}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h4>${batchView.summary?.total_orders || 0}</h4>
            <p>Total Orders</p>
          </div>
          <div class="summary-card">
            <h4>${batchView.summary?.autoship_orders || 0}</h4>
            <p>Autoship</p>
          </div>
          <div class="summary-card">
            <h4>${batchView.summary?.custom_orders || 0}</h4>
            <p>Custom Cakes</p>
          </div>
          <div class="summary-card">
            <h4>${batchView.summary?.total_items || 0}</h4>
            <p>Total Items</p>
          </div>
        </div>

        <div class="top-products">
          <h3>📋 Products to Prepare</h3>
          <table>
            ${topProductsHtml}
          </table>
        </div>

        ${ordersHtml}
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 10px;">
          <p>The Doggy Company - Kitchen Sheet - Printed ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Print Delivery Sheet
  const printDeliverySheet = () => {
    if (!batchView) return;
    
    const printWindow = window.open('', '_blank');
    const date = batchView.date === 'today' ? 'Today' : 'Tomorrow';
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Group orders by city
    const ordersByCity = {};
    Object.values(batchView.by_time_slot || {}).flat().forEach(order => {
      const city = order.customer?.city || order.city || 'Unknown';
      if (!ordersByCity[city]) ordersByCity[city] = [];
      ordersByCity[city].push(order);
    });

    const citiesHtml = Object.entries(ordersByCity).map(([city, cityOrders]) => `
      <div class="city-section">
        <h3>📍 ${city} (${cityOrders.length} deliveries)</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Items</th>
              <th>✓</th>
            </tr>
          </thead>
          <tbody>
            ${cityOrders.sort((a, b) => (a.delivery_slot || '').localeCompare(b.delivery_slot || '')).map(order => `
              <tr>
                <td>${order.delivery_slot || 'N/A'}</td>
                <td><strong>${order.orderId || order.id}</strong></td>
                <td>${order.customer?.parentName || ''}<br/>🐾 ${order.pet?.name || ''}</td>
                <td class="address">${order.customer?.address || order.address || '-'}</td>
                <td>${order.customer?.phone || ''}</td>
                <td>${(order.items || []).length} items</td>
                <td class="checkbox">☐</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Sheet - ${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #9333ea; padding-bottom: 15px; }
          .header h1 { color: #9333ea; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; }
          .summary { display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; }
          .summary-card { background: #f3f4f6; padding: 10px 20px; border-radius: 8px; text-align: center; }
          .summary-card h4 { font-size: 20px; color: #9333ea; }
          .summary-card p { color: #666; font-size: 10px; }
          .city-section { margin-bottom: 25px; page-break-inside: avoid; }
          .city-section h3 { background: #4f46e5; color: white; padding: 8px 15px; border-radius: 5px 5px 0 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 6px; text-align: left; border: 1px solid #ddd; vertical-align: top; }
          th { background: #f3f4f6; font-weight: bold; font-size: 10px; }
          .address { max-width: 200px; font-size: 10px; }
          .checkbox { text-align: center; font-size: 16px; }
          @media print { body { padding: 10px; } .city-section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚗 Delivery Sheet</h1>
          <p>${date} - ${dateStr}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h4>${batchView.summary?.total_orders || 0}</h4>
            <p>Total Deliveries</p>
          </div>
          <div class="summary-card">
            <h4>${Object.keys(ordersByCity).length}</h4>
            <p>Cities</p>
          </div>
        </div>

        ${citiesHtml}
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 10px;">
          <p>The Doggy Company - Delivery Sheet - Printed ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Create draft order
  const createDraftOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/draft-orders`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(draftForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Draft Order Created', description: `ID: ${data.draft_order.id}` });
        fetchDraftOrders();
        setShowDraftModal(false);
        resetDraftForm();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create draft order', variant: 'destructive' });
    }
  };

  // Send checkout link
  const sendCheckoutLink = async (draftId, method) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/draft-orders/${draftId}/send-link?method=${method}`, {
        method: 'POST',
        headers: authHeaders
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.whatsapp_link) {
          window.open(data.whatsapp_link, '_blank');
        }
        toast({ title: 'Link Sent', description: `Checkout link sent via ${method}` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send link', variant: 'destructive' });
    }
  };

  const resetDraftForm = () => {
    setDraftForm({
      customer: { name: '', email: '', phone: '', city: 'Bangalore', address: '' },
      pet: { name: '', breed: '' },
      items: [{ product_id: '', name: '', price: 0, quantity: 1 }],
      delivery_date: '',
      delivery_slot: '',
      special_instructions: '',
      concierge_notes: '',
      source: 'phone'
    });
  };

  const getStatusBadge = (status) => {
    const config = FULFILMENT_STATUSES.find(s => s.value === status) || FULFILMENT_STATUSES[0];
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <Calendar className="w-4 h-4" /> Today & Tomorrow
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-2">
            <FileText className="w-4 h-4" /> Draft Orders
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {/* Filters */}
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Gurugram">Gurugram</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {FULFILMENT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={orderTypeFilter || "all"} onValueChange={(v) => setOrderTypeFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="onetime">One-time</SelectItem>
                  <SelectItem value="autoship">Autoship</SelectItem>
                  <SelectItem value="custom">Custom Cakes</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchOrders} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </Card>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pet</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Products</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">City</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Delivery</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No orders found for the selected filters
                      </td>
                    </tr>
                  ) : orders.map(order => (
                    <tr key={order.id || order.orderId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{order.orderId || order.id?.slice(0,8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{order.customer?.parentName || order.customer?.name}</div>
                        <div className="text-xs text-gray-500">{order.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{order.pet?.name || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm max-w-[200px] truncate">
                          {order.items?.map(i => i.name).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{order.delivery?.city || 'Unknown'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{order.delivery?.date || '-'}</div>
                        <div className="text-xs text-gray-500">{order.delivery?.slot || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {order.items?.some(i => i.is_autoship) ? (
                          <Badge className="bg-purple-100 text-purple-700">🔁 Autoship</Badge>
                        ) : order.source === 'custom' ? (
                          <Badge className="bg-pink-100 text-pink-700">🎂 Custom</Badge>
                        ) : (
                          <Badge variant="outline">One-time</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedOrder(order); setShowStatusModal(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Batch View Tab */}
        <TabsContent value="batch">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Summary Panel */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                Batch Summary - {batchView?.date || 'Today'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="text-2xl font-bold">{batchView?.summary?.total_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-600">🔁 Autoship Orders</span>
                  <span className="text-2xl font-bold text-purple-600">{batchView?.summary?.autoship_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <span className="text-pink-600">🎂 Custom Cakes</span>
                  <span className="text-2xl font-bold text-pink-600">{batchView?.summary?.custom_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">Total Items</span>
                  <span className="text-2xl font-bold text-blue-600">{batchView?.summary?.total_items || 0}</span>
                </div>
              </div>

              {batchView?.summary?.top_products?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Top Products to Prepare</h4>
                  <div className="space-y-2">
                    {batchView.summary.top_products.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="truncate flex-1">{p.name}</span>
                        <Badge variant="outline">{p.quantity}x</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => printKitchenSheet()}
                >
                  <Printer className="w-4 h-4" /> Kitchen Sheet
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => printDeliverySheet()}
                >
                  <Truck className="w-4 h-4" /> Delivery Sheet
                </Button>
              </div>
            </Card>

            {/* Orders List */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Orders by Time Slot</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant={batchView?.date === 'today' ? 'default' : 'outline'} onClick={() => fetchBatchView('today')}>Today</Button>
                    <Button size="sm" variant={batchView?.date !== 'today' ? 'default' : 'outline'} onClick={() => fetchBatchView('tomorrow')}>Tomorrow</Button>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {Object.entries(batchView?.by_time_slot || {}).map(([slot, slotOrders]) => (
                    <div key={slot} className="border-b last:border-b-0">
                      <div className="px-4 py-2 bg-gray-50 font-medium text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {slot} ({slotOrders.length} orders)
                      </div>
                      {slotOrders.map(order => (
                        <div key={order.id} className="px-4 py-3 border-t hover:bg-gray-50 flex items-center gap-4">
                          {order.items?.some(i => i.is_autoship) && <Badge className="bg-purple-100 text-purple-700 text-xs">🔁</Badge>}
                          {order.source === 'custom' && <Badge className="bg-pink-100 text-pink-700 text-xs">🎂</Badge>}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{order.customer?.parentName}</div>
                            <div className="text-xs text-gray-500">{order.items?.map(i => `${i.name} x${i.quantity || 1}`).join(', ')}</div>
                          </div>
                          <Badge variant="outline">{order.delivery?.city}</Badge>
                          {getStatusBadge(order.status)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Draft Orders Tab */}
        <TabsContent value="drafts">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Draft Orders</h3>
            <Button onClick={() => setShowDraftModal(true)} className="gap-2">
              <FileText className="w-4 h-4" /> Create Draft Order
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {draftOrders.map(draft => (
              <Card key={draft.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono text-sm font-medium">{draft.id}</span>
                    <Badge className={draft.status === 'draft' ? 'bg-yellow-100 text-yellow-700 ml-2' : 'bg-green-100 text-green-700 ml-2'}>
                      {draft.status}
                    </Badge>
                  </div>
                  <Badge variant="outline">{draft.source}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{draft.customer?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{draft.customer?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{draft.customer?.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{draft.items?.length || 0} items • ₹{draft.pricing?.total}</span>
                  </div>
                </div>

                {draft.status === 'draft' && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => sendCheckoutLink(draft.id, 'whatsapp')}>
                      <Send className="w-3 h-3" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => sendCheckoutLink(draft.id, 'email')}>
                      <Mail className="w-3 h-3" /> Email
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            {draftOrders.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No draft orders. Create one to help customers checkout.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onOpenChange={(open) => {
        setShowStatusModal(open);
        if (!open) {
          setStatusNotes('');
          setSendNotification(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedOrder.orderId}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer?.parentName} - {selectedOrder.customer?.phone}</p>
                {selectedOrder.pet?.name && (
                  <p className="text-sm text-purple-600">🐾 {selectedOrder.pet.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {FULFILMENT_STATUSES.filter(s => s.value !== 'cancelled').map(status => (
                    <Button
                      key={status.value}
                      variant={selectedOrder.status === status.value ? 'default' : 'outline'}
                      className={`justify-start text-left ${status.value === selectedOrder.status ? '' : (typeof status.color === 'string' && status.color.includes('bg-') ? status.color : getStatusColor(status.color))}`}
                      onClick={() => updateOrderStatus(selectedOrder.orderId || selectedOrder.id, status.value)}
                    >
                      {status.emoji} {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Notes (optional)</label>
                <Textarea 
                  placeholder="Add notes about this status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="h-20"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Checkbox 
                  id="send-notification"
                  checked={sendNotification}
                  onCheckedChange={setSendNotification}
                />
                <div className="flex-1">
                  <label htmlFor="send-notification" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-600" />
                    Send notification to customer
                  </label>
                  <p className="text-xs text-gray-500">WhatsApp message + Email will be sent automatically</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => updateOrderStatus(selectedOrder.orderId || selectedOrder.id, 'cancelled')}
                >
                  ❌ Cancel Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Draft Order Modal */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Draft Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Source */}
            <div>
              <label className="text-sm font-medium">Order Source</label>
              <Select value={draftForm.source} onValueChange={v => setDraftForm({...draftForm, source: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">📞 Phone Order</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp Order</SelectItem>
                  <SelectItem value="custom">🎂 Custom Celebration</SelectItem>
                  <SelectItem value="corporate">🏢 Corporate/Gifting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="font-medium">Customer Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Customer Name *"
                  value={draftForm.customer.name}
                  onChange={e => setDraftForm({...draftForm, customer: {...draftForm.customer, name: e.target.value}})}
                />
                <Input
                  placeholder="Phone *"
                  value={draftForm.customer.phone}
                  onChange={e => setDraftForm({...draftForm, customer: {...draftForm.customer, phone: e.target.value}})}
                />
                <Input
                  placeholder="Email"
                  value={draftForm.customer.email}
                  onChange={e => setDraftForm({...draftForm, customer: {...draftForm.customer, email: e.target.value}})}
                />
                <Select value={draftForm.customer.city} onValueChange={v => setDraftForm({...draftForm, customer: {...draftForm.customer, city: v}})}>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Gurugram">Gurugram</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Delivery Address"
                value={draftForm.customer.address}
                onChange={e => setDraftForm({...draftForm, customer: {...draftForm.customer, address: e.target.value}})}
              />
            </div>

            {/* Pet Details */}
            <div className="space-y-3">
              <h4 className="font-medium">Pet Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Pet Name"
                  value={draftForm.pet.name}
                  onChange={e => setDraftForm({...draftForm, pet: {...draftForm.pet, name: e.target.value}})}
                />
                <Input
                  placeholder="Breed"
                  value={draftForm.pet.breed}
                  onChange={e => setDraftForm({...draftForm, pet: {...draftForm.pet, breed: e.target.value}})}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="font-medium">Order Items</h4>
              {draftForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Product Name"
                    className="flex-1"
                    value={item.name}
                    onChange={e => {
                      const newItems = [...draftForm.items];
                      newItems[idx].name = e.target.value;
                      setDraftForm({...draftForm, items: newItems});
                    }}
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    className="w-24"
                    value={item.price}
                    onChange={e => {
                      const newItems = [...draftForm.items];
                      newItems[idx].price = parseFloat(e.target.value) || 0;
                      setDraftForm({...draftForm, items: newItems});
                    }}
                  />
                  <Input
                    placeholder="Qty"
                    type="number"
                    className="w-20"
                    value={item.quantity}
                    onChange={e => {
                      const newItems = [...draftForm.items];
                      newItems[idx].quantity = parseInt(e.target.value) || 1;
                      setDraftForm({...draftForm, items: newItems});
                    }}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setDraftForm({...draftForm, items: [...draftForm.items, { product_id: '', name: '', price: 0, quantity: 1 }]})}>
                + Add Item
              </Button>
            </div>

            {/* Delivery */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Delivery Date</label>
                <Input
                  type="date"
                  value={draftForm.delivery_date}
                  onChange={e => setDraftForm({...draftForm, delivery_date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time Slot</label>
                <Select value={draftForm.delivery_slot} onValueChange={v => setDraftForm({...draftForm, delivery_slot: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10AM-12PM">10AM - 12PM</SelectItem>
                    <SelectItem value="12PM-2PM">12PM - 2PM</SelectItem>
                    <SelectItem value="2PM-4PM">2PM - 4PM</SelectItem>
                    <SelectItem value="4PM-6PM">4PM - 6PM</SelectItem>
                    <SelectItem value="6PM-8PM">6PM - 8PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Textarea
                placeholder="Special Instructions (for customer)"
                value={draftForm.special_instructions}
                onChange={e => setDraftForm({...draftForm, special_instructions: e.target.value})}
              />
              <Textarea
                placeholder="Concierge® Notes (internal only)"
                value={draftForm.concierge_notes}
                onChange={e => setDraftForm({...draftForm, concierge_notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDraftModal(false)}>Cancel</Button>
            <Button onClick={createDraftOrder}>Create Draft Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FulfilmentManager;
