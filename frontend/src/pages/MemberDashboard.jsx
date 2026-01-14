import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ShoppingBag, PawPrint, Star, User, LogOut, Package, Calendar } from 'lucide-react';
import axios from 'axios';

const MemberDashboard = () => {
  const { user, logout, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [ordersRes, petsRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/my-orders`, config),
          axios.get(`${API_URL}/api/pets/my-pets`, config)
        ]);

        setOrders(ordersRes.data.orders);
        setPets(petsRes.data.pets);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="outline">{user.membership_tier} Member</Badge>
                  <span>•</span>
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={logout} className="text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl border">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg">My Orders</TabsTrigger>
            <TabsTrigger value="pets" className="rounded-lg">My Pets</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Content */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <Badge className="bg-white/20 text-white border-none">Active</Badge>
                </div>
                <h3 className="text-lg font-medium opacity-90">Loyalty Points</h3>
                <p className="text-4xl font-bold mt-1">{(user.loyalty_points || 0).toLocaleString()}</p>
                <p className="text-sm opacity-75 mt-2">Worth ₹{((user.loyalty_points || 0) * 0.5).toFixed(0)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-600">Total Orders</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{orders.length}</p>
                <p className="text-sm text-gray-500 mt-2">Last order: {orders[0] ? new Date(orders[0].created_at).toLocaleDateString() : 'Never'}</p>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <PawPrint className="w-6 h-6 text-blue-600" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8">Add Pet</Button>
                </div>
                <h3 className="text-lg font-medium text-gray-600">My Pets</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{pets.length}</p>
                <p className="text-sm text-gray-500 mt-2">Active profiles</p>
              </Card>
            </div>

            <h3 className="text-xl font-bold mt-10 mb-4">Recent Activity</h3>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 3).map(order => (
                  <Card key={order.orderId} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{order.orderId}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.items.length} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{order.total}</p>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'}>{order.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                <p className="text-gray-500">No activity yet. Start shopping!</p>
              </div>
            )}
          </TabsContent>

          {/* Orders Content */}
          <TabsContent value="orders">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Order History</h3>
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.orderId} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b pb-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-semibold">{order.orderId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium">₹{order.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'}>{order.status}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Pets Content */}
          <TabsContent value="pets">
            <div className="grid md:grid-cols-2 gap-6">
              {pets.map(pet => (
                <Card key={pet.id} className="p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed} • {pet.age_years || '?'} years</p>
                      {pet.soul?.persona && <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200">{pet.soul.persona}</Badge>}
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold uppercase">Birthday</p>
                      <p className="font-medium">{pet.birth_date || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold uppercase">Gotcha Day</p>
                      <p className="font-medium">{pet.gotcha_date || 'Not set'}</p>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Card className="p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <PawPrint className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">Add New Pet</h3>
                <p className="text-gray-500 text-sm text-center mt-1">Create a profile for your furry friend</p>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Content */}
          <TabsContent value="profile">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Profile Settings</h3>
              <form className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input defaultValue={user.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input defaultValue={user.email} disabled className="bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input defaultValue={user.phone} />
                </div>
                <Button className="mt-4">Update Profile</Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberDashboard;
