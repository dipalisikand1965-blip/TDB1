import React, { useState } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Package, ShoppingBag, Clock, CheckCircle, Truck, ChevronDown, ChevronUp, MapPin, Phone, RefreshCw, Eye } from 'lucide-react';

const OrdersTab = ({ orders }) => {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Get status icon and color
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Delivered' };
      case 'shipped':
      case 'in_transit':
        return { icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'In Transit' };
      case 'processing':
      case 'confirmed':
        return { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Processing' };
      case 'cancelled':
        return { icon: <Package className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled' };
      default:
        return { icon: <Package className="w-3.5 h-3.5" />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: status || 'Pending' };
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="orders-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-lg sm:text-xl font-bold mb-6 text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-purple-400" />
          Order History
          {orders.length > 0 && (
            <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">{orders.length}</Badge>
          )}
        </h3>
        
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map(order => {
              const statusStyle = getStatusStyle(order.status);
              const isExpanded = expandedOrders[order.orderId];
              
              return (
                <div 
                  key={order.orderId} 
                  className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
                >
                  {/* Order Header - Always visible, clickable */}
                  <button 
                    onClick={() => toggleOrder(order.orderId)}
                    className="w-full p-4 flex flex-wrap justify-between items-center gap-3 text-left hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{order.orderId}</p>
                        <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">₹{order.total?.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
                      </div>
                      <Badge variant="outline" className={`text-xs border flex items-center gap-1 ${statusStyle.color}`}>
                        {statusStyle.icon}
                        <span className="hidden sm:inline">{statusStyle.label}</span>
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                      {/* Order Items */}
                      <div className="py-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Items Ordered</p>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-xs font-bold text-purple-400">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <span className="text-sm text-white">{item.name}</span>
                                  {item.variant && <span className="text-xs text-slate-400 ml-2">({item.variant})</span>}
                                </div>
                              </div>
                              <span className="font-medium text-white text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Delivery Info */}
                      {order.delivery && (
                        <div className="py-3 border-t border-white/5">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Delivery Details</p>
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-white">
                                {order.delivery.method === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                              </p>
                              <p className="text-slate-400">{order.delivery.address || order.delivery.city}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Order Summary */}
                      <div className="py-3 border-t border-white/5">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Subtotal</span>
                          <span className="text-white">₹{(order.subtotal || order.total)?.toLocaleString('en-IN')}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Discount</span>
                            <span className="text-emerald-400">-₹{order.discount?.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Delivery</span>
                            <span className="text-white">₹{order.delivery_fee?.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5">
                          <span className="text-white">Total</span>
                          <span className="text-emerald-400">₹{order.total?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 bg-slate-700/50 border-white/10 text-white hover:bg-slate-600/50"
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> View Invoice
                        </Button>
                        {order.status === 'delivered' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                          >
                            <RefreshCw className="w-4 h-4 mr-1.5" /> Reorder
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Truck className="w-4 h-4 mr-1.5" /> Track Order
                          </Button>
                        )}
                      </div>
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
