import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Lock,
  User,
  MessageCircle,
  Cake,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  X,
  PawPrint,
  Package,
  Video,
  Edit,
  Trash2,
  Plus,
  Save,
  Image,
  DollarSign,
  Tag
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  const [chats, setChats] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Products
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productFilter, setProductFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Site Content
  const [siteContent, setSiteContent] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  // Check for stored auth
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      setIsAuthenticated(true);
      fetchDashboard();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        localStorage.setItem('adminAuth', btoa(`${username}:${password}`));
        setIsAuthenticated(true);
        fetchDashboard();
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const getAuthHeaders = () => {
    const auth = localStorage.getItem('adminAuth');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const fetchChats = async () => {
    try {
      let url = `${API_URL}/api/admin/chats?limit=100`;
      if (filterCity) url += `&city=${filterCity}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchCustomRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/custom-requests`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCustomRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch custom requests:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let url = `${API_URL}/api/admin/products?limit=500`;
      if (productFilter) url += `&category=${productFilter}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setProductCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/site-content`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSiteContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch site content:', error);
    }
  };

  const saveProduct = async (product) => {
    try {
      const isNew = !product.id || product.id.startsWith('new-');
      const url = isNew 
        ? `${API_URL}/api/admin/products`
        : `${API_URL}/api/admin/products/${product.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        fetchProducts();
        setEditingProduct(null);
        alert('Product saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchProducts();
        alert('Product deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const saveVideos = async (videos) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/site-content/videos`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(videos)
      });
      
      if (response.ok) {
        fetchSiteContent();
        setEditingVideo(null);
        alert('Videos saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save videos:', error);
    }
  };

  const sendNotification = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/send-notification/${sessionId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.whatsapp_url) {
          window.open(data.whatsapp_url, '_blank');
        }
        alert(data.email_sent ? 'Email notification sent!' : 'Email failed, but WhatsApp link generated.');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const updateChatStatus = async (sessionId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/chats/${sessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchChats();
        fetchDashboard();
      }
    } catch (error) {
      console.error('Failed to update chat:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'chats') fetchChats();
      else if (activeTab === 'requests') fetchCustomRequests();
      else if (activeTab === 'products') fetchProducts();
      else if (activeTab === 'content') fetchSiteContent();
    }
  }, [isAuthenticated, activeTab, filterCity, filterStatus, productFilter]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur shadow-2xl" data-testid="admin-login-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 mt-2">The Doggy Bakery</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  data-testid="admin-username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="admin-password"
                  required
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-sm text-center">{loginError}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={loading}
              data-testid="admin-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">TDB Admin</h1>
                <p className="text-xs text-gray-500">Welcome, Aditya</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={fetchDashboard}>
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b pb-4 flex-wrap">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'chats', label: 'Mira Chats', icon: MessageCircle },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'content', label: 'Videos & Content', icon: Video },
            { id: 'requests', label: 'Custom Cakes', icon: Cake },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={activeTab === tab.id ? 'bg-purple-600' : ''}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`admin-tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6" data-testid="stat-total-chats">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Chats</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.total_chats}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Chats</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.active_chats}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <Cake className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custom Requests</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.total_custom_requests}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="text-3xl font-bold text-gray-900">{products.length || '200+'}</p>
                  </div>
                </div>
              </Card>
            </div>

            {dashboard.city_breakdown && dashboard.city_breakdown.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Chats by City
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {dashboard.city_breakdown.map((city, idx) => (
                    <div key={idx} className="px-4 py-2 bg-gray-100 rounded-lg">
                      <span className="font-medium">{city._id || 'Unknown'}</span>
                      <span className="ml-2 text-gray-500">({city.count})</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Mira Conversations</h3>
              <div className="space-y-3">
                {dashboard.recent_chats?.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedChat(chat); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {chat.pet_name || 'Unknown Pet'} 
                          {chat.pet_breed && <span className="text-gray-500 text-sm ml-2">({chat.pet_breed})</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {chat.city || 'Unknown city'} • {chat.service_type || 'General inquiry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                        {chat.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex gap-4 flex-wrap">
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Gurgaon">Gurgaon</option>
                  <option value="Delhi">Delhi</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <Button variant="outline" onClick={fetchChats}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {chats.map((chat, idx) => (
                <Card 
                  key={idx} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{chat.pet_name || 'Unknown Pet'}</h4>
                      <p className="text-sm text-gray-500">{chat.pet_breed || 'Unknown'} • {chat.pet_age || 'Age unknown'}</p>
                    </div>
                    <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>{chat.status}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{chat.city || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{chat.messages?.length || 0} msgs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{chat.service_type || 'General'}</span>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); sendNotification(chat.session_id); }}>
                      <Send className="w-3 h-3 mr-1" />Notify
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-4 flex-wrap">
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">All Categories</option>
                    {productCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={fetchProducts}>
                    <RefreshCw className="w-4 h-4 mr-2" />Refresh
                  </Button>
                </div>
                <Button 
                  className="bg-purple-600"
                  onClick={() => setEditingProduct({ 
                    id: `new-${Date.now()}`, 
                    name: '', 
                    price: 0, 
                    category: '', 
                    image: '',
                    description: '',
                    sizes: [],
                    flavors: []
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
              </div>
            </Card>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sizes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.slice(0, 50).map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.id?.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{product.category || 'N/A'}</Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">₹{product.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {Array.isArray(product.sizes) 
                          ? product.sizes.map(s => typeof s === 'object' ? s.name : s).join(', ')
                          : product.sizes || 'Standard'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingProduct(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteProduct(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 50 && (
                <div className="p-4 text-center text-gray-500">
                  Showing 50 of {products.length} products. Use category filter to narrow down.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tab - Videos */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-600" />
                  Homepage Videos
                </h3>
                <Button 
                  className="bg-purple-600"
                  onClick={() => {
                    const newVideo = { id: `v-${Date.now()}`, title: '', thumbnail: '', description: '', videoUrl: '' };
                    setSiteContent(prev => ({
                      ...prev,
                      videos: [...(prev?.videos || []), newVideo]
                    }));
                    setEditingVideo(newVideo);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />Add Video
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {siteContent?.videos?.map((video, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingVideo(video)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-gray-500 truncate">{video.description}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {siteContent?.videos?.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    className="bg-green-600"
                    onClick={() => saveVideos(siteContent.videos)}
                  >
                    <Save className="w-4 h-4 mr-2" />Save All Videos
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Other Site Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text</label>
                  <Input 
                    value={siteContent?.bannerText || ''}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, bannerText: e.target.value }))}
                    placeholder="Delivery banner text..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <Input 
                    value={siteContent?.whatsappNumber || ''}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="+91 96631 85747"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Custom Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {customRequests.map((req, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{req.name}</h4>
                    <p className="text-sm text-gray-500">{req.email} • {req.phone}</p>
                    {req.notes && <p className="text-sm text-gray-600 mt-2">{req.notes}</p>}
                  </div>
                  <Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>{req.status}</Badge>
                </div>
                {req.image_path && (
                  <a href={`${API_URL}/${req.image_path}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm mt-2 inline-block hover:underline">
                    View uploaded image →
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Chat Detail Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedChat.pet_name || 'Chat Details'}</h3>
                <p className="text-sm text-gray-500">{selectedChat.city} • {selectedChat.service_type}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-4">
              {selectedChat.messages?.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-gray-100 ml-8' : 'bg-purple-50 mr-8'}`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{msg.role === 'user' ? 'Customer' : 'Mira'}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => updateChatStatus(selectedChat.session_id, 'completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />Mark Complete
                </Button>
                <Button variant="outline" onClick={() => sendNotification(selectedChat.session_id)}>
                  <Send className="w-4 h-4 mr-2" />Notify
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setSelectedChat(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h3 className="font-semibold text-gray-900">
                {editingProduct.id?.startsWith('new-') ? 'Add Product' : 'Edit Product'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <Input 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Input 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="cakes, treats, etc."
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.originalPrice || editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <Input 
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sizes (JSON format: [{'{'}name: "500g", price: 600{'}'}, ...])
                </label>
                <textarea 
                  value={JSON.stringify(editingProduct.sizes || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingProduct({ ...editingProduct, sizes: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flavors (JSON format: [{'{'}name: "Chicken", price: 50{'}'}, ...])
                </label>
                <textarea 
                  value={JSON.stringify(editingProduct.flavors || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingProduct({ ...editingProduct, flavors: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  rows={4}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button className="bg-purple-600" onClick={() => saveProduct(editingProduct)}>
                <Save className="w-4 h-4 mr-2" />Save Product
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Video Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h3 className="font-semibold text-gray-900">Edit Video</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingVideo(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input 
                  value={editingVideo.title}
                  onChange={(e) => {
                    const updated = { ...editingVideo, title: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="Video title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <Input 
                  value={editingVideo.thumbnail}
                  onChange={(e) => {
                    const updated = { ...editingVideo, thumbnail: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input 
                  value={editingVideo.description}
                  onChange={(e) => {
                    const updated = { ...editingVideo, description: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Instagram/YouTube)</label>
                <Input 
                  value={editingVideo.videoUrl}
                  onChange={(e) => {
                    const updated = { ...editingVideo, videoUrl: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingVideo(null)}>Done</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;
