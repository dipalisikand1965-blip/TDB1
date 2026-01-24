import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { 
  ShoppingBag, PawPrint, Star, User, LogOut, Package, 
  MapPin, Settings, Lock, Bell, Shield, Phone, Mail, MessageCircle,
  RefreshCw, Calendar, Pause, Play, X, MessageSquare, Edit2, Trash2, Loader2,
  UtensilsCrossed, Users, Clock, Stethoscope, Sparkles, Home, Plane, Cake, Gift
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';

const MemberDashboard = () => {
  const { user, logout, token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pets, setPets] = useState([]);
  const [autoships, setAutoships] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [diningHistory, setDiningHistory] = useState({ reservations: { items: [] }, visits: { items: [] }, meetups: { items: [] } });
  const [stayHistory, setStayHistory] = useState({ bookings: [], upcoming: [], past: [] });
  const [travelHistory, setTravelHistory] = useState({ requests: [], upcoming: [], past: [] });
  const [celebrationOrders, setCelebrationOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const navigate = useNavigate();
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });
  const [editingReview, setEditingReview] = useState(null);
  
  // Settings State - Communication Preferences
  const [settings, setSettings] = useState({
    // Communication Channels
    email: true,
    whatsapp: false,
    sms: false,
    // Notification Types
    order_updates: true,
    promotional: true,
    celebration_reminders: true,
    health_reminders: true,
    community_updates: false,
    // Privacy
    shareData: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

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
        
        const [ordersRes, petsRes, autoshipRes, reviewsRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/my-orders`, config).catch(() => ({ data: { orders: [] } })),
          axios.get(`${API_URL}/api/pets/my-pets`, config).catch(() => ({ data: { pets: [] } })),
          axios.get(`${API_URL}/api/autoship/my-subscriptions`, config).catch(() => ({ data: { subscriptions: [] } })),
          axios.get(`${API_URL}/api/reviews/my-reviews`, config).catch(() => ({ data: { reviews: [] } }))
        ]);
        
        // Fetch dining history
        try {
          const diningRes = await axios.get(`${API_URL}/api/dine/my-dining-history?user_id=${user.id || ''}&email=${user.email || ''}`);
          setDiningHistory(diningRes.data || { reservations: { items: [] }, visits: { items: [] }, meetups: { items: [] } });
        } catch (e) {
          console.error('Failed to fetch dining history:', e);
        }
        
        // Fetch stay history
        try {
          const stayRes = await axios.get(`${API_URL}/api/stay/my-bookings?email=${user.email || ''}`, config);
          setStayHistory(stayRes.data || { bookings: [], upcoming: [], past: [] });
        } catch (e) {
          console.error('Failed to fetch stay history:', e);
        }
        
        // Fetch travel history
        try {
          const travelRes = await axios.get(`${API_URL}/api/travel/my-requests?user_email=${user.email || ''}`, config);
          const requests = travelRes.data.requests || [];
          const now = new Date();
          const upcoming = requests.filter(r => new Date(r.journey?.travel_date) >= now && r.status !== 'cancelled');
          const past = requests.filter(r => new Date(r.journey?.travel_date) < now || r.status === 'cancelled' || r.status === 'completed');
          setTravelHistory({ requests, upcoming, past });
        } catch (e) {
          console.error('Failed to fetch travel history:', e);
        }

        const userOrders = ordersRes.data.orders || [];
        setOrders(userOrders);
        
        // Filter celebration orders (cakes, treats, etc.)
        const celebrations = userOrders.filter(o => 
          o.items?.some(i => 
            i.category?.toLowerCase().includes('cake') || 
            i.category?.toLowerCase().includes('treat') ||
            i.category?.toLowerCase().includes('celebrate')
          )
        );
        setCelebrationOrders(celebrations);
        
        setPets(petsRes.data.pets || []);
        setAutoships(autoshipRes.data.subscriptions || []);
        setReviews(reviewsRes.data.reviews || []);
        
        // Extract products from orders that user can review
        const productIds = new Set((reviewsRes.data.reviews || []).map(r => r.product_id));
        const reviewableProds = [];
        for (const order of userOrders) {
          for (const item of (order.items || [])) {
            if (!productIds.has(item.id) && !reviewableProds.find(p => p.id === item.id)) {
              reviewableProds.push({
                id: item.id,
                name: item.name,
                image: item.image,
                orderId: order.id
              });
            }
          }
        }
        setReviewableProducts(reviewableProds);
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

  // Fetch communication preferences on load
  useEffect(() => {
    const fetchCommunicationPreferences = async () => {
      if (!user?.email || !token) return;
      
      try {
        const response = await axios.get(
          `${API_URL}/api/member/communication-preferences?user_email=${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error('Failed to fetch communication preferences:', error);
      }
    };
    
    fetchCommunicationPreferences();
  }, [user?.email, token, API_URL]);

  const handleSettingChange = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSettingsSaved(false);
    
    // Auto-save to backend
    try {
      setSettingsLoading(true);
      await axios.put(
        `${API_URL}/api/member/communication-preferences?user_email=${user.email}`,
        { ...settings, [key]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettingsSaved(true);
      toast({ title: '✓ Saved', description: 'Your preference has been updated.' });
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preference:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      toast({ title: 'Error', description: 'Failed to save preference. Please try again.', variant: 'destructive' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Review functions
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setReviewLoading(true);
    try {
      const reviewData = {
        product_id: selectedProduct.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        reviewer_name: reviewForm.name || user.name,
        reviewer_email: user.email
      };
      
      if (editingReview) {
        // Update existing review
        await axios.put(`${API_URL}/api/reviews/${editingReview.id}`, reviewData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Review updated successfully!' });
      } else {
        // Create new review
        await axios.post(`${API_URL}/api/reviews`, reviewData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Thank you for your review!' });
      }
      
      // Refresh reviews
      const reviewsRes = await axios.get(`${API_URL}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(reviewsRes.data.reviews || []);
      
      // Update reviewable products
      const productIds = new Set((reviewsRes.data.reviews || []).map(r => r.product_id));
      setReviewableProducts(prev => prev.filter(p => !productIds.has(p.id)));
      
      // Reset form
      setShowReviewForm(false);
      setSelectedProduct(null);
      setEditingReview(null);
      setReviewForm({ rating: 5, comment: '', name: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setSelectedProduct({ id: review.product_id, name: review.product_name, image: review.product_image });
    setReviewForm({
      rating: review.rating,
      comment: review.comment,
      name: review.reviewer_name
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({ title: 'Success', description: 'Review deleted successfully.' });
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast({ title: 'Error', description: 'Failed to delete review.', variant: 'destructive' });
    }
  };

  const startNewReview = (product) => {
    setSelectedProduct(product);
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: '', name: user.name || '' });
    setShowReviewForm(true);
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, the useEffect will redirect
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
            <TabsTrigger value="celebrations" className="rounded-lg flex-1 md:flex-none">
              <Sparkles className="w-4 h-4 mr-1" />
              Celebrations
            </TabsTrigger>
            <TabsTrigger value="dining" className="rounded-lg flex-1 md:flex-none">
              <UtensilsCrossed className="w-4 h-4 mr-1" />
              Dining
            </TabsTrigger>
            <TabsTrigger value="stay" className="rounded-lg flex-1 md:flex-none">
              <Home className="w-4 h-4 mr-1" />
              Stay
            </TabsTrigger>
            <TabsTrigger value="travel" className="rounded-lg flex-1 md:flex-none">
              <Plane className="w-4 h-4 mr-1" />
              Travel
            </TabsTrigger>
            <TabsTrigger value="autoship" className="rounded-lg flex-1 md:flex-none">
              <RefreshCw className="w-4 h-4 mr-1" />
              Autoship
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg flex-1 md:flex-none">
              <MessageSquare className="w-4 h-4 mr-1" />
              Reviews
            </TabsTrigger>
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
            
            {/* Pet Soul Completion CTA - Show if score is below 80% */}
            {pets.length > 0 && (() => {
              // Calculate average Pet Soul score across all pets
              const totalQuestions = 27; // Total questions in Pet Soul
              let totalAnswers = 0;
              pets.forEach(pet => {
                const answers = pet.doggy_soul_answers || {};
                totalAnswers += Object.keys(answers).length;
              });
              const avgScore = pets.length > 0 ? Math.round((totalAnswers / (totalQuestions * pets.length)) * 100) : 0;
              
              if (avgScore >= 80) return null;
              
              const remainingPercent = 100 - avgScore;
              const primaryPet = pets[0];
              
              return (
                <Card className="mt-6 p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-purple-200/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          Complete {primaryPet.name}&apos;s Pet Soul™
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-white">
                            {avgScore}% done
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Answer {remainingPercent > 50 ? 'a few more' : 'just a few'} questions to unlock personalized recommendations, 
                          birthday alerts, and care reminders tailored for {primaryPet.name}.
                        </p>
                        
                        {/* Progress bar */}
                        <div className="mt-3 w-full md:w-80">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{remainingPercent}% remaining to complete</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                      onClick={() => window.location.href = `/pet-soul-journey/${primaryPet.id}`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue Building Soul
                    </Button>
                  </div>
                </Card>
              );
            })()}

            {/* Smart Reorder Widget */}
            {orders.length > 0 && (() => {
              // Analyze past orders to suggest reorder
              const productFrequency = {};
              orders.forEach(order => {
                order.items?.forEach(item => {
                  if (!productFrequency[item.id]) {
                    productFrequency[item.id] = { 
                      ...item, 
                      count: 0, 
                      lastOrdered: order.created_at,
                      totalQuantity: 0
                    };
                  }
                  productFrequency[item.id].count += 1;
                  productFrequency[item.id].totalQuantity += item.quantity || 1;
                  if (new Date(order.created_at) > new Date(productFrequency[item.id].lastOrdered)) {
                    productFrequency[item.id].lastOrdered = order.created_at;
                  }
                });
              });
              
              // Get top 3 most ordered products
              const topProducts = Object.values(productFrequency)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              
              if (topProducts.length === 0) return null;
              
              // Calculate days since last order
              const lastOrderDate = new Date(orders[0]?.created_at);
              const daysSinceLastOrder = Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24));
              
              return (
                <Card className="p-5 mt-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Quick Reorder</h3>
                      <p className="text-xs text-purple-600">
                        {daysSinceLastOrder > 14 
                          ? `It's been ${daysSinceLastOrder} days since your last order!`
                          : `Based on your favorites`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {topProducts.map((product, idx) => (
                      <div 
                        key={product.id || idx}
                        className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              Ordered {product.count}x • ₹{product.price}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-3"
                          onClick={() => {
                            // Add to cart logic - navigate to product or add directly
                            toast({ 
                              title: '🛒 Added to Cart',
                              description: `${product.name} has been added to your cart!`
                            });
                            // In real implementation, would use cart context
                            navigate('/cakes');
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    onClick={() => navigate('/cakes')}
                  >
                    Browse All Products
                  </Button>
                </Card>
              );
            })()}

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

          {/* Dining Tab */}
          <TabsContent value="dining">
            <div className="space-y-6">
              {/* Dining Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <UtensilsCrossed className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.reservations?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Reservations</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Users className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.visits?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Pet Buddy Visits</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <MessageSquare className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.meetups?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Meetup Requests</p>
                </Card>
              </div>

              {/* Upcoming Reservations */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                    My Reservations
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dine')}>
                    Book New
                  </Button>
                </div>
                
                {diningHistory.reservations?.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Upcoming</h4>
                    {diningHistory.reservations.upcoming.map((res) => (
                      <div key={res.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{res.restaurant_name}</h4>
                            <p className="text-sm text-gray-500">{res.restaurant_area}, {res.restaurant_city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {res.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {res.time}
                              </span>
                            </div>
                          </div>
                          <Badge className={res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {res.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming reservations</p>
                    <Button className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/dine')}>
                      Explore Restaurants
                    </Button>
                  </div>
                )}

                {/* Past Reservations */}
                {diningHistory.reservations?.past?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Past Reservations</h4>
                    <div className="space-y-2">
                      {diningHistory.reservations.past.slice(0, 5).map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{res.restaurant_name}</p>
                            <p className="text-sm text-gray-500">{res.date}</p>
                          </div>
                          <Badge variant="outline" className="text-gray-500">{res.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Pet Buddy Visits */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Pet Buddy Visits
                  </h3>
                </div>
                
                {diningHistory.visits?.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Scheduled</h4>
                    {diningHistory.visits.upcoming.map((visit) => (
                      <div key={visit.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{visit.restaurant_name}</h4>
                            <p className="text-sm text-gray-500">{visit.restaurant_area}, {visit.restaurant_city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {visit.date}
                              </span>
                              <Badge variant="outline" className="capitalize">{visit.time_slot}</Badge>
                            </div>
                            {visit.notes && <p className="text-sm text-purple-600 mt-2">&quot;{visit.notes}&quot;</p>}
                          </div>
                          {visit.looking_for_buddies && (
                            <Badge className="bg-purple-100 text-purple-700">Looking for Buddies</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No scheduled visits</p>
                    <p className="text-sm text-gray-400 mt-1">Schedule a visit and meet other pet parents!</p>
                  </div>
                )}
              </Card>

              {/* Meetup Requests */}
              {diningHistory.meetups?.pending?.length > 0 && (
                <Card className="p-6 border-purple-200 bg-purple-50">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-purple-500" />
                    Pending Meetup Requests
                  </h3>
                  <div className="space-y-3">
                    {diningHistory.meetups.pending.map((meetup) => (
                      <div key={meetup.id} className="p-4 bg-white rounded-lg border">
                        <p className="font-medium">Meetup at {meetup.restaurant_name}</p>
                        <p className="text-sm text-gray-500">{meetup.visit_date}</p>
                        {meetup.message && <p className="text-sm text-gray-600 mt-2">&quot;{meetup.message}&quot;</p>}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                          <Button size="sm" variant="outline" className="text-red-600">Decline</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Celebrations Tab */}
          <TabsContent value="celebrations">
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
                  <p className="text-2xl font-bold">{pets.filter(p => p.birth_date).length}</p>
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
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <PawPrint className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
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
          </TabsContent>

          {/* Stay Tab */}
          <TabsContent value="stay">
            <div className="space-y-6">
              {/* Stay Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-green-500 to-teal-500 text-white">
                  <Home className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.bookings?.length || 0}</p>
                  <p className="text-sm opacity-90">Total Bookings</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <Calendar className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.upcoming?.length || 0}</p>
                  <p className="text-sm opacity-90">Upcoming</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Star className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.past?.length || 0}</p>
                  <p className="text-sm opacity-90">Completed</p>
                </Card>
              </div>

              {/* Stay Bookings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Home className="w-5 h-5 text-green-500" />
                    My Stay Bookings
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/stay')}>
                    Book Stay
                  </Button>
                </div>

                {stayHistory.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Upcoming Stays</h4>
                    {stayHistory.upcoming.map((booking) => (
                      <div key={booking.id || booking.booking_id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.property_name || booking.hotel_name}</h4>
                            <p className="text-sm text-gray-500">{booking.location || booking.city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {booking.check_in} - {booking.check_out}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">{booking.status || 'Confirmed'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming stays</p>
                    <Button className="mt-4 bg-green-500 hover:bg-green-600" onClick={() => navigate('/stay')}>
                      Explore Pet-Friendly Stays
                    </Button>
                  </div>
                )}

                {/* Past Stays */}
                {stayHistory.past?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Past Stays</h4>
                    <div className="space-y-2">
                      {stayHistory.past.slice(0, 3).map((booking) => (
                        <div key={booking.id || booking.booking_id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{booking.property_name || booking.hotel_name}</p>
                            <p className="text-sm text-gray-500">{booking.check_in}</p>
                          </div>
                          <Badge variant="outline" className="text-gray-500">Completed</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Travel Tab */}
          <TabsContent value="travel">
            <div className="space-y-6">
              {/* Travel Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Plane className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.requests?.length || 0}</p>
                  <p className="text-sm opacity-90">Total Requests</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                  <Clock className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.upcoming?.length || 0}</p>
                  <p className="text-sm opacity-90">Upcoming</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Star className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.requests?.filter(r => r.status === 'completed').length || 0}</p>
                  <p className="text-sm opacity-90">Completed</p>
                </Card>
              </div>

              {/* Travel Requests */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Plane className="w-5 h-5 text-blue-500" />
                    My Travel Requests
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/travel')}>
                    New Request
                  </Button>
                </div>

                {travelHistory.requests?.length > 0 ? (
                  <div className="space-y-3">
                    {travelHistory.requests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{request.request_id}</h4>
                              <Badge variant="outline" className="text-xs">{request.travel_type_name}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {request.journey?.pickup_city} → {request.journey?.drop_city}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {request.journey?.travel_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <PawPrint className="w-4 h-4" /> {request.pet?.name}
                              </span>
                            </div>
                          </div>
                          <Badge className={
                            request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Plane className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No travel requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">Plan your pet&apos;s next adventure!</p>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600" onClick={() => navigate('/travel')}>
                      Plan Travel
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Autoship Tab */}
          <TabsContent value="autoship">
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
                  <Button className="mt-6 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href='/treats'}>
                    Browse Autoship Products
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Reviews Content */}
          <TabsContent value="reviews">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">My Reviews</h3>
                <Badge variant="outline">{reviews.length} Reviews</Badge>
              </div>

              {/* Review Form Modal */}
              {showReviewForm && selectedProduct && (
                <Card className="p-6 border-2 border-purple-200 bg-purple-50/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {selectedProduct.image && (
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="font-semibold">{editingReview ? 'Edit Review' : 'Write a Review'}</h4>
                        <p className="text-sm text-gray-600">{selectedProduct.name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Display Name</label>
                      <Input
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name (as shown on review)"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Review</label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={reviewLoading} className="bg-purple-600 hover:bg-purple-700">
                        {reviewLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : editingReview ? 'Update Review' : 'Submit Review'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Products to Review */}
              {reviewableProducts.length > 0 && !showReviewForm && (
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Products You Can Review
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviewableProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 h-auto text-purple-600"
                            onClick={() => startNewReview(product)}
                          >
                            Write Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Existing Reviews */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Your Reviews</h4>
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="flex items-start gap-4">
                        {review.product_image && (
                          <img src={review.product_image} alt={review.product_name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{review.product_name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditReview(review)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteReview(review.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                          {review.status === 'pending' && (
                            <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-300">Pending Approval</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : reviewableProducts.length === 0 && (
                <Card className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700">No Reviews Yet</h4>
                  <p className="text-gray-500 mt-1">
                    Place an order to leave reviews for products you&apos;ve purchased!
                  </p>
                  <Button onClick={() => navigate('/all')} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    Start Shopping
                  </Button>
                </Card>
              )}
            </div>
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
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed} • {pet.age_years || '?'} years</p>
                      {pet.soul?.persona && <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">{pet.soul.persona}</Badge>}
                    </div>
                  </div>
                  
                  {/* Soul Score Progress */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Soul Score</span>
                      <span className="text-xs font-bold text-purple-600">{Math.round(pet.overall_score || 0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${pet.overall_score || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Birthday</p>
                      <p className="font-medium text-gray-900 text-sm">{pet.birth_date || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gotcha Day</p>
                      <p className="font-medium text-gray-900 text-sm">{pet.gotcha_date || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => window.location.href=`/pet-vault/${pet.id}`}
                    >
                      <Stethoscope className="w-4 h-4 mr-1" /> Health Vault
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      onClick={() => window.location.href=`/pet-soul/${pet.id}`}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> Pet Soul
                    </Button>
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
                {/* Communication Channels */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" /> Communication Channels
                    {settingsLoading && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
                    {settingsSaved && <span className="text-xs text-green-500 ml-2">✓ Saved</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Choose how you'd like to hear from us</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" /> Email
                        </label>
                        <p className="text-xs text-gray-500">Order confirmations & updates</p>
                      </div>
                      <Switch checked={settings.email} onCheckedChange={() => handleSettingChange('email')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
                        </label>
                        <p className="text-xs text-gray-500">Quick updates & reminders</p>
                      </div>
                      <Switch checked={settings.whatsapp} onCheckedChange={() => handleSettingChange('whatsapp')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" /> SMS
                        </label>
                        <p className="text-xs text-gray-500">Text message alerts</p>
                      </div>
                      <Switch checked={settings.sms} onCheckedChange={() => handleSettingChange('sms')} />
                    </div>
                  </div>
                </Card>

                {/* Notification Types */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" /> Notification Preferences
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">What would you like to be notified about?</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">📦 Order Updates</label>
                        <p className="text-xs text-gray-500">Shipping, delivery & status changes</p>
                      </div>
                      <Switch checked={settings.order_updates} onCheckedChange={() => handleSettingChange('order_updates')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🎁 Promotions & Offers</label>
                        <p className="text-xs text-gray-500">Exclusive deals & new launches</p>
                      </div>
                      <Switch checked={settings.promotional} onCheckedChange={() => handleSettingChange('promotional')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🎂 Celebration Reminders</label>
                        <p className="text-xs text-gray-500">Pet birthdays & gotcha days</p>
                      </div>
                      <Switch checked={settings.celebration_reminders} onCheckedChange={() => handleSettingChange('celebration_reminders')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">💊 Health Reminders</label>
                        <p className="text-xs text-gray-500">Vaccination & vet appointment reminders</p>
                      </div>
                      <Switch checked={settings.health_reminders} onCheckedChange={() => handleSettingChange('health_reminders')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🐾 Community Updates</label>
                        <p className="text-xs text-gray-500">Events, meetups & pawrent activities</p>
                      </div>
                      <Switch checked={settings.community_updates} onCheckedChange={() => handleSettingChange('community_updates')} />
                    </div>
                  </div>
                </Card>

                {/* Privacy & Security */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" /> Privacy & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">Share Pet Data</label>
                        <p className="text-xs text-gray-500">Allow Mira to personalize recommendations</p>
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
