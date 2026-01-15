import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { 
  ShoppingBag, PawPrint, Star, User, LogOut, Package, 
  MapPin, Settings, Lock, Bell, Shield, Phone, Mail 
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const MemberDashboard = () => {
  const { user, logout, token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Settings State
  const [settings, setSettings] = useState({
    whatsappOptIn: true,
    emailPromo: true,
    shareData: false,
    termsAccepted: true
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Redirect to login if not authenticated (after auth check completes)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [ordersRes, petsRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/my-orders`, config).catch(() => ({ data: { orders: [] } })),
          axios.get(`${API_URL}/api/pets/my-pets`, config).catch(() => ({ data: { pets: [] } }))
        ]);

        setOrders(ordersRes.data.orders || []);
        setPets(petsRes.data.pets || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [token, user, API_URL]);

  // Extract unique addresses from orders
  const savedAddresses = orders
    .map(o => o.delivery)
    .filter((d, i, self) => 
      d && d.address && 
      self.findIndex(t => t.address === d.address) === i
    )
    .slice(0, 3);

  const handleSettingChange = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                    {user.membership_tier?.toUpperCase()} MEMBER
                  </Badge>
                  <span>•</span>
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={logout} className="text-red-600 hover:bg-red-50 hover:text-red-700 self-start md:self-center">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl border shadow-sm w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-lg flex-1 md:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg flex-1 md:flex-none">Orders</TabsTrigger>
            <TabsTrigger value="pets" className="rounded-lg flex-1 md:flex-none">Pets</TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-lg flex-1 md:flex-none">Addresses</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg flex-1 md:flex-none">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Content */}
          <TabsContent value="overview" className="animate-in fade-in-50 duration-300">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-sm">Active</Badge>
                </div>
                <h3 className="text-lg font-medium opacity-90 relative z-10">Loyalty Points</h3>
                <p className="text-4xl font-bold mt-1 relative z-10">{(user.loyalty_points || 0).toLocaleString()}</p>
                <p className="text-sm opacity-75 mt-2 relative z-10">Worth ₹{((user.loyalty_points || 0) * 0.5).toFixed(0)}</p>
              </Card>

              <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-600">Total Orders</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{orders.length}</p>
                <p className="text-sm text-gray-500 mt-2">Last: {orders[0] ? new Date(orders[0].created_at).toLocaleDateString() : 'Never'}</p>
              </Card>

              <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href='/my-pets'}>
                    Manage
                  </Button>
                </div>
                <h3 className="text-lg font-medium text-gray-600">My Pets</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{pets.length}</p>
                <p className="text-sm text-gray-500 mt-2">Active profiles</p>
              </Card>
            </div>

            <h3 className="text-xl font-bold mt-10 mb-4 text-gray-900">Recent Activity</h3>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 3).map(order => (
                  <Card key={order.orderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderId}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.items.length} items</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <p className="font-bold text-gray-900">₹{order.total}</p>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'} className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}>
                        {order.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="text-gray-500 mt-1 mb-4">Treat your furry friend to something special!</p>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href='/cakes'}>
                  Start Shopping
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Orders Content */}
          <TabsContent value="orders">
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
          </TabsContent>

          {/* Pets Content */}
          <TabsContent value="pets">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">My Pets</h3>
              <Button onClick={() => window.location.href='/my-pets'}>Manage Pets</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {pets.map(pet => (
                <Card key={pet.id} className="p-6 relative overflow-hidden group hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-10 h-10 text-purple-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed} • {pet.age_years || '?'} years</p>
                      {pet.soul?.persona && <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">{pet.soul.persona}</Badge>}
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Birthday</p>
                      <p className="font-medium text-gray-900">{pet.birth_date || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gotcha Day</p>
                      <p className="font-medium text-gray-900">{pet.gotcha_date || 'Not set'}</p>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Card 
                className="p-6 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]"
                onClick={() => window.location.href='/my-pets'}
              >
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <PawPrint className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Add New Pet</h3>
                <p className="text-gray-500 text-sm text-center mt-1">Create a profile for your furry friend</p>
              </Card>
            </div>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Saved Addresses</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {savedAddresses.map((addr, idx) => (
                  <div key={idx} className="border p-4 rounded-xl hover:border-purple-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{addr.city}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                        <p className="text-sm text-gray-500">{addr.pincode}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {savedAddresses.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No addresses saved yet. They will be added when you place an order.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" /> Profile Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                    <Input defaultValue={user.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                    <Input defaultValue={user.email} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
                    <Input defaultValue={user.phone} />
                  </div>
                  <Button className="mt-2 bg-purple-600 hover:bg-purple-700">Update Profile</Button>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" /> Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">WhatsApp Notifications</label>
                        <p className="text-xs text-gray-500">Order updates & reminders</p>
                      </div>
                      <Switch checked={settings.whatsappOptIn} onCheckedChange={() => handleSettingChange('whatsappOptIn')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">Email Promotions</label>
                        <p className="text-xs text-gray-500">Exclusive offers & new launches</p>
                      </div>
                      <Switch checked={settings.emailPromo} onCheckedChange={() => handleSettingChange('emailPromo')} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" /> Privacy & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">Share Pet Data</label>
                        <p className="text-xs text-gray-500">Allow detailed personalization</p>
                      </div>
                      <Switch checked={settings.shareData} onCheckedChange={() => handleSettingChange('shareData')} />
                    </div>
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Lock className="w-4 h-4 mr-2" /> Change Password
                      </Button>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-400">
                        By using this account, you agree to our <a href="/terms-of-service" className="text-purple-600 hover:underline">Terms & Conditions</a>.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberDashboard;
