import React from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Package, ShoppingBag, Clock, CheckCircle, Truck } from 'lucide-react';

const OrdersTab = ({ orders }) => {
  // Get status icon and color
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'shipped':
        return { icon: <Truck className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'processing':
        return { icon: <Clock className="w-3 h-3" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      default:
        return { icon: <Package className="w-3 h-3" />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="orders-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-lg sm:text-xl font-bold mb-6 text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-purple-400" />
          Order History
        </h3>
        
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <div 
                  key={order.orderId} 
                  className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-all"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Order ID</p>
                      <p className="font-semibold text-white text-sm">{order.orderId}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                      <p className="font-medium text-slate-300 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                      <p className="font-bold text-emerald-400 text-sm">₹{order.total}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className={`text-xs border flex items-center gap-1 ${statusStyle.color}`}>
                        {statusStyle.icon}
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-700/50 rounded flex items-center justify-center text-xs font-medium text-slate-400">
                            {item.quantity}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-medium text-white flex-shrink-0 ml-2">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pickup Info */}
                  {order.delivery?.method === 'pickup' && (
                    <div className="mt-4 pt-3 border-t border-white/5 text-sm text-blue-400 bg-blue-500/10 p-3 rounded-lg flex items-center gap-2">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>Store Pickup: {order.delivery.city}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No orders yet</p>
            <p className="text-sm text-slate-400">Your order history will appear here</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrdersTab;
