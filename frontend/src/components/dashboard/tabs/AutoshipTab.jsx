import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Calendar, Pause, Play, X, Gift } from 'lucide-react';

const AutoshipTab = ({ autoships }) => {
  const navigate = useNavigate();

  // Get status colors for dark theme
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="autoship-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">My Autoship</h3>
              <p className="text-xs sm:text-sm text-slate-400">Manage your subscriptions</p>
            </div>
          </div>
          <a href="/autoship" className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
            Learn about Autoship →
          </a>
        </div>

        {autoships.length > 0 ? (
          <div className="space-y-4">
            {autoships.map((sub) => (
              <div key={sub.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    <img 
                      src={sub.product?.image || '/placeholder.jpg'} 
                      alt={sub.product?.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm sm:text-base truncate">{sub.product?.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-400">{sub.variant || 'Standard'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={`border ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </Badge>
                        <span className="text-xs text-slate-500">Every {sub.frequency} weeks</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="font-bold text-white text-lg">₹{sub.price}</p>
                    <p className="text-xs text-slate-500 mt-1">Order #{sub.order_count || 1}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Next shipment: {sub.next_shipment_date ? new Date(sub.next_shipment_date).toLocaleDateString() : 'Not scheduled'}
                  </div>
                  <div className="flex gap-2">
                    {sub.status === 'active' ? (
                      <Button size="sm" variant="outline" className="h-8 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 text-xs">
                        <Pause className="w-3 h-3 mr-1" /> Pause
                      </Button>
                    ) : sub.status === 'paused' ? (
                      <Button size="sm" variant="outline" className="h-8 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 text-xs">
                        <Play className="w-3 h-3 mr-1" /> Resume
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" className="h-8 bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-700/50 text-xs">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {sub.order_count && (
                  <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400">
                      {sub.order_count >= 6 ? '50% off' : sub.order_count >= 4 ? '40% off' : '25% off'} applied!
                      {sub.order_count < 6 && (
                        <span className="text-emerald-300/70 ml-1">
                          ({6 - sub.order_count} more for 50% off)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
            </div>
            <h4 className="text-base sm:text-lg font-medium text-white mb-2">No active subscriptions</h4>
            <p className="text-slate-400 mb-6 text-sm max-w-sm mx-auto">Subscribe to your dog&apos;s favourites and save up to 50%!</p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 max-w-md mx-auto text-left mb-6">
              <p className="font-medium text-blue-300 mb-2">Autoship Benefits:</p>
              <ul className="text-xs sm:text-sm text-blue-400/80 space-y-1">
                <li>• 25% off your first order (max ₹300)</li>
                <li>• 40% off on 4th & 5th orders</li>
                <li>• 50% off on 6th & 7th orders</li>
                <li>• Skip, pause or cancel anytime</li>
              </ul>
            </div>
            
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" 
              onClick={() => navigate('/treats')}
            >
              Browse Autoship Products
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AutoshipTab;
