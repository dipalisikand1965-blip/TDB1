import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const OrdersTab = ({ 
  orders = [], 
  orderStats = {}, 
  orderFilter, 
  setOrderFilter, 
  fetchOrders, 
  updateOrderStatus,
  setSelectedOrderDetails 
}) => {
  // CSV Export for Orders
  const exportOrdersCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Items', 'Date', 'Address'];
    const rows = orders.map(o => [
      o.order_id || o.id,
      o.customer_name || o.user_name,
      o.customer_email || o.user_email,
      o.customer_phone || o.user_phone,
      o.total_amount || o.total,
      o.status,
      o.items?.length || 0,
      o.created_at?.split('T')[0],
      (o.shipping_address || o.address || '').replace(/,/g, ';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported!', description: `${orders.length} orders exported to CSV` });
  };

  return (
    <div className="space-y-6" data-testid="orders-tab">
      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-700">{orderStats.pending || 0}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600">Confirmed</p>
          <p className="text-3xl font-bold text-blue-700">{orderStats.confirmed || 0}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-600">Delivered</p>
          <p className="text-3xl font-bold text-green-700">{orderStats.delivered || 0}</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-600">Total Orders</p>
          <p className="text-3xl font-bold text-purple-700">{orders.length}</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            data-testid="order-filter-select"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" onClick={fetchOrders} data-testid="refresh-orders-btn">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" onClick={exportOrdersCSV} data-testid="export-orders-btn">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order, idx) => {
          const hasCustomCake = order.items?.some(item => item.isCustomCake || item.id?.startsWith('custom-cake'));
          
          return (
            <Card 
              key={idx} 
              className={`p-4 ${hasCustomCake ? 'ring-2 ring-orange-400 bg-orange-50/30' : ''}`}
              data-testid={`order-${idx}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{order.orderId || order.order_id || order.id || `ORD-${idx+1}`}</h3>
                    <Badge variant={
                      order.status === 'delivered' ? 'success' :
                      order.status === 'pending' ? 'warning' :
                      order.status === 'confirmed' ? 'default' : 'secondary'
                    }>
                      {order.status || 'pending'}
                    </Badge>
                    {hasCustomCake && (
                      <Badge className="bg-orange-500 text-white">
                        🎂 Custom Cake Order
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <p className="text-xl font-bold text-purple-600">₹{order.total || order.total_amount || 0}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Customer</p>
                  <p className="font-medium">{order.customer?.parentName || order.customer_name || order.user_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.customer?.phone || order.customer_phone || order.user_phone || ''}</p>
                  <p className="text-sm text-gray-600">{order.customer?.whatsappNumber || order.customer_email || order.user_email || ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Pet</p>
                  <p className="font-medium">{order.pet?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.pet?.breed ? `${order.pet.breed} • ${order.pet.age}` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Delivery</p>
                  <p className="font-medium">{order.delivery?.city || order.city || ''}</p>
                  <p className="text-sm text-gray-600">{(order.delivery?.address || order.shipping_address || order.address || '').slice(0, 50)}{(order.delivery?.address || order.shipping_address || order.address) ? '...' : ''}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Items</p>
                {order.items?.map((item, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {item.isCustomCake || item.id?.startsWith('custom-cake') ? '🎂 ' : ''}
                        {item.name} 
                        {item.selectedSize && ` (${item.selectedSize}`}
                        {item.selectedFlavor && `, ${item.selectedFlavor})`}
                        {!item.selectedSize && !item.selectedFlavor && item.size && ` (${item.size}, ${item.flavor})`}
                        {' '}x{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                    
                    {/* Custom Cake Details */}
                    {(item.isCustomCake || item.customDetails) && item.customDetails && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-600 uppercase font-semibold mb-2">🎂 Custom Cake Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Shape:</span>
                            <p className="font-medium">{item.customDetails.shapeIcon || ''} {item.customDetails.shape}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Flavour:</span>
                            <p className="font-medium">{item.customDetails.flavorIcon || ''} {item.customDetails.flavor}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Weight:</span>
                            <p className="font-medium">{item.customDetails.weight || '500g'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Text on Cake:</span>
                            <p className="font-medium text-purple-700">&quot;{item.customDetails.customText || 'None'}&quot;</p>
                          </div>
                        </div>
                        
                        {/* Reference Image */}
                        {item.customDetails.referenceImage && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-xs text-orange-600 uppercase font-semibold mb-2">📸 Reference Image</p>
                            <img 
                              src={item.customDetails.referenceImage} 
                              alt="Customer reference" 
                              className="w-32 h-32 object-cover rounded-lg border-2 border-orange-300 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(item.customDetails.referenceImage, '_blank')}
                            />
                            <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-600 uppercase">Special Instructions</p>
                  <p className="text-sm">{order.specialInstructions}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId || order.order_id || order.id, 'confirmed')}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId || order.order_id || order.id, 'preparing')}>
                  Preparing
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId || order.order_id || order.id, 'delivered')}>
                  Delivered
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.orderId || order.order_id || order.id, 'cancelled'); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setSelectedOrderDetails(order)}>
                  View Details
                </Button>
              </div>
            </Card>
          );
        })}
        {orders.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            No orders yet. Orders placed via checkout will appear here.
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
