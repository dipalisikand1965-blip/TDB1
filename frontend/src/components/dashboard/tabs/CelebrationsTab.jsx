import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Cake, Gift, Star, Calendar, Sparkles } from 'lucide-react';
import { PetAvatarMini } from '../../PetAvatar';

const CelebrationsTab = ({ pets, celebrationOrders, user }) => {
  const navigate = useNavigate();

  // Get status color for dark theme
  const getStatusColor = (status) => {
    if (status === 'delivered') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="celebrations-tab">
      {/* Celebration Stats - 3 column on mobile too */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-xl">
          <Cake className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{celebrationOrders.length}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Total Orders</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{(Array.isArray(pets) ? pets : []).filter(p => p.birth_date).length}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Birthdays Set</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{user?.loyalty_points || 0}</p>
          <p className="text-[10px] sm:text-sm opacity-90">Points</p>
        </Card>
      </div>

      {/* Recent Celebration Orders */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
            <Cake className="w-5 h-5 text-pink-400" />
            Celebration Orders
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/cakes')}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-pink-500/30"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Order Cake
          </Button>
        </div>

        {celebrationOrders.length > 0 ? (
          <div className="space-y-3">
            {celebrationOrders.slice(0, 5).map((order) => (
              <div key={order.orderId} className="p-3 sm:p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{order.orderId}</h4>
                    <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    <div className="mt-2 space-y-1">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-slate-300">{item.name} x{item.quantity}</p>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-xs text-slate-500">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`border flex-shrink-0 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cake className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-medium mb-2">No celebration orders yet</p>
            <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">Order a delicious cake for your pet&apos;s special day!</p>
            <Button 
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400" 
              onClick={() => navigate('/cakes')}
            >
              Order Your First Cake
            </Button>
          </div>
        )}
      </Card>

      {/* Upcoming Pet Birthdays */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 text-white">
          <Calendar className="w-5 h-5 text-purple-400" />
          Upcoming Pet Birthdays
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {pets.filter(p => p.birth_date).map((pet) => {
            const birthday = new Date(pet.birth_date);
            const today = new Date();
            const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={pet.id} className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <PetAvatarMini pet={pet} />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{pet.name}</p>
                    <p className="text-xs text-slate-400">{birthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <Badge className={`flex-shrink-0 border ${daysUntil <= 7 ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                  {daysUntil <= 7 ? '🎂 This Week!' : `${daysUntil} days`}
                </Badge>
              </div>
            );
          })}
          {pets.filter(p => p.birth_date).length === 0 && (
            <p className="text-center text-slate-400 py-4 text-sm">
              Add your pet&apos;s birthday to get special offers!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CelebrationsTab;
