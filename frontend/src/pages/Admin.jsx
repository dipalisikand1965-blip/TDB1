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
  Calendar,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  Filter,
  X,
  PawPrint
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
    if (isAuthenticated && activeTab === 'chats') {
      fetchChats();
    } else if (isAuthenticated && activeTab === 'requests') {
      fetchCustomRequests();
    }
  }, [isAuthenticated, activeTab, filterCity, filterStatus]);

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
        <div className="flex gap-2 mb-8 border-b pb-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'chats', label: 'Mira Chats', icon: MessageCircle },
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
            {/* Stats Grid */}
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
              
              <Card className="p-6" data-testid="stat-active-chats">
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

              <Card className="p-6" data-testid="stat-custom-requests">
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

              <Card className="p-6" data-testid="stat-pending">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Bell className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.pending_requests}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* City Breakdown */}
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

            {/* Recent Chats */}
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
                      <span className="text-xs text-gray-400">
                        {chat.messages?.length || 0} msgs
                      </span>
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
            {/* Filters */}
            <Card className="p-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Filter:</span>
                </div>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
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
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <Button variant="outline" size="sm" onClick={fetchChats}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Chat List */}
            <div className="grid md:grid-cols-2 gap-4">
              {chats.map((chat, idx) => (
                <Card 
                  key={idx} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedChat(chat)}
                  data-testid={`chat-card-${idx}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {chat.pet_name || 'Unknown Pet'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {chat.pet_breed || 'Unknown breed'} • {chat.pet_age || 'Age unknown'}
                      </p>
                    </div>
                    <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                      {chat.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {chat.city || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {chat.messages?.length || 0} messages
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {chat.service_type || 'General'}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); sendNotification(chat.session_id); }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Notify
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Custom Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {customRequests.map((req, idx) => (
              <Card key={idx} className="p-4" data-testid={`custom-request-${idx}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{req.name}</h4>
                    <p className="text-sm text-gray-500">{req.email} • {req.phone}</p>
                    {req.notes && <p className="text-sm text-gray-600 mt-2">{req.notes}</p>}
                  </div>
                  <Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>
                    {req.status}
                  </Badge>
                </div>
                {req.image_path && (
                  <a 
                    href={`${API_URL}/${req.image_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 text-sm mt-2 inline-block hover:underline"
                  >
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
                <h3 className="font-semibold text-gray-900">
                  {selectedChat.pet_name || 'Chat Details'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedChat.city} • {selectedChat.service_type}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-4">
              {selectedChat.messages?.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-gray-100 ml-8' 
                      : 'bg-purple-50 mr-8'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {msg.role === 'user' ? 'Customer' : 'Mira'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateChatStatus(selectedChat.session_id, 'completed')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => sendNotification(selectedChat.session_id)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setSelectedChat(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;
