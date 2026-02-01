import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Cake, Gift, Star, Calendar } from 'lucide-react';
import { PetAvatarMini } from '../../PetAvatar';

const CelebrationsTab = ({ pets, celebrationOrders, user }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Celebration Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-pink-500 to-purple-500 text-white">
          <Cake className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{celebrationOrders.length}</p>
          <p className="text-sm opacity-90">Total Orders</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <Gift className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{(Array.isArray(pets) ? pets : []).filter(p => p.birth_date).length}</p>
          <p className="text-sm opacity-90">Pet Birthdays Set</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
          <Star className="w-5 h-5 mb-2" />
          <p className="text-2xl font-bold">{user?.loyalty_points || 0}</p>
          <p className="text-sm opacity-90">Loyalty Points</p>
        </Card>
      </div>

      {/* Recent Celebration Orders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            Celebration Orders
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigate('/cakes')}>
            Order Cake
          </Button>
        </div>

        {celebrationOrders.length > 0 ? (
          <div className="space-y-3">
            {celebrationOrders.slice(0, 5).map((order) => (
              <div key={order.orderId} className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{order.orderId}</h4>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    <div className="mt-2 space-y-1">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">{item.name} x{item.quantity}</p>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  </div>
                  <Badge className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Cake className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No celebration orders yet</p>
            <Button className="mt-4 bg-pink-500 hover:bg-pink-600" onClick={() => navigate('/cakes')}>
              Order Your First Cake
            </Button>
          </div>
        )}
      </Card>

      {/* Upcoming Pet Birthdays */}
      <Card className="p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          Upcoming Pet Birthdays
        </h3>
        <div className="space-y-3">
          {pets.filter(p => p.birth_date).map((pet) => {
            const birthday = new Date(pet.birth_date);
            const today = new Date();
            const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={pet.id} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PetAvatarMini pet={pet} />
                  <div>
                    <p className="font-medium text-gray-900">{pet.name}</p>
                    <p className="text-xs text-gray-500">{birthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <Badge className={daysUntil <= 7 ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}>
                  {daysUntil <= 7 ? '🎂 This Week!' : `${daysUntil} days`}
                </Badge>
              </div>
            );
          })}
          {pets.filter(p => p.birth_date).length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Add your pet&apos;s birthday to get special offers!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CelebrationsTab;
