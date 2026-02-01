import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Calendar, Pause, Play, X } from 'lucide-react';

const AutoshipTab = ({ autoships }) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">My Autoship</h3>
            <p className="text-sm text-gray-500">Manage your subscriptions</p>
          </div>
        </div>
        <a href="/autoship" className="text-sm text-purple-600 hover:underline">Learn about Autoship</a>
      </div>

      {autoships.length > 0 ? (
        <div className="space-y-4">
          {autoships.map((sub) => (
            <div key={sub.id} className="border rounded-xl p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={sub.product?.image || '/placeholder.jpg'} 
                    alt={sub.product?.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{sub.product?.name}</h4>
                    <p className="text-sm text-gray-500">{sub.variant || 'Standard'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}>
                        {sub.status}
                      </Badge>
                      <span className="text-sm text-gray-500">Every {sub.frequency} weeks</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{sub.price}</p>
                  <p className="text-xs text-gray-500 mt-1">Order #{sub.order_count || 1}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Next shipment: {sub.next_shipment_date ? new Date(sub.next_shipment_date).toLocaleDateString() : 'Not scheduled'}
                </div>
                <div className="flex gap-2">
                  {sub.status === 'active' ? (
                    <Button size="sm" variant="outline" className="h-8">
                      <Pause className="w-3 h-3 mr-1" /> Pause
                    </Button>
                  ) : sub.status === 'paused' ? (
                    <Button size="sm" variant="outline" className="h-8">
                      <Play className="w-3 h-3 mr-1" /> Resume
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" className="h-8 text-gray-600">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Discount info */}
              {sub.order_count && (
                <div className="mt-3 bg-green-50 rounded-lg p-3 text-sm">
                  <span className="font-medium text-green-700">
                    🎁 {sub.order_count >= 6 ? '50% off' : sub.order_count >= 4 ? '40% off' : '25% off'} applied on this order!
                  </span>
                  {sub.order_count < 6 && (
                    <span className="text-green-600 ml-2">
                      ({6 - sub.order_count} more orders to unlock 50% off)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h4>
          <p className="text-gray-500 mb-6">Subscribe to your dog&apos;s favourites and save up to 50%!</p>
          <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto text-left">
            <p className="font-medium text-blue-900 mb-2">Autoship Benefits:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 25% off your first order (max ₹300)</li>
              <li>• 40% off on 4th & 5th orders</li>
              <li>• 50% off on 6th & 7th orders</li>
              <li>• Skip, pause or cancel anytime</li>
            </ul>
          </div>
          <Button className="mt-6 bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/treats')}>
            Browse Autoship Products
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AutoshipTab;
