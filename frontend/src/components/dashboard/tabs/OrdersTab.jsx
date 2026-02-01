import React from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Package } from 'lucide-react';

const OrdersTab = ({ orders }) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6">Order History</h3>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.orderId} className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex flex-wrap justify-between items-start gap-4 border-b pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-semibold text-gray-900">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">₹{order.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'} className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}>
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">{item.quantity}</span>
                      {item.name}
                    </span>
                    <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {order.delivery?.method === 'pickup' && (
                <div className="mt-4 pt-3 border-t text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Store Pickup: {order.delivery.city}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}
    </Card>
  );
};

export default OrdersTab;
