import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ServiceDesk } from '../components/admin';
import UnifiedInbox from '../components/admin/UnifiedInbox';
import BirthdayBoxOrdersAdmin from '../components/admin/BirthdayBoxOrdersAdmin';
import { API_URL } from '../utils/api';
import { 
  LogOut, User, Headphones, Shield, Eye, EyeOff,
  Loader2, AlertCircle, Bell, Package, Inbox, Truck,
  Menu, X
} from 'lucide-react';
import axios from 'axios';

// Feature components mapping
const FEATURE_COMPONENTS = {
  birthday_box_orders: {
    name: 'Birthday Box Orders',
    icon: Package,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    badge: 'new_count',  // will be populated from API
  },
  notifications: {
    name: 'Notifications',
    icon: Bell,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  orders: {
    name: 'Orders',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  service_desk: {
    name: 'Service Desk',
    icon: Headphones,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  unified_inbox: {
    name: 'Inbox',
    icon: Inbox,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  fulfilment: {
    name: 'Fulfilment',
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
};

/**
 * Agent Portal - Dedicated access for agents with permission-based features
 */
const AgentPortal = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const [agentInfo, setAgentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  
  // Orders state (if agent has orders permission)
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({});

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedAgent = localStorage.getItem('tdc_agent_session');
      if (storedAgent) {
        try {
          const parsed = JSON.parse(storedAgent);
          if (parsed.id && parsed.expiresAt > Date.now()) {
            // Verify session is still valid
            try {
              const res = await axios.post(`${API_URL}/api/agent/verify`, {
                agent_id: parsed.id
              });
              if (res.data.valid) {
                setAgentInfo(res.data.agent);
                setIsAuthenticated(true);
                // Set default active tab based on permissions
                const perms = res.data.agent.permissions || [];
                if (perms.includes('service_desk')) setActiveTab('service_desk');
                else if (perms.includes('unified_inbox')) setActiveTab('unified_inbox');
                else if (perms.length > 0) setActiveTab(perms[0]);
              }
            } catch (e) {
              localStorage.removeItem('tdc_agent_session');
            }
          } else {
            localStorage.removeItem('tdc_agent_session');
          }
        } catch (e) {
          localStorage.removeItem('tdc_agent_session');
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // Fetch orders if agent has permission
  useEffect(() => {
    if (isAuthenticated && agentInfo?.permissions?.includes('orders')) {
      fetchOrders();
    }
  }, [isAuthenticated, agentInfo]);

  // Birthday box new order count for nav badge
  const [birthdayBoxNewCount, setBirthdayBoxNewCount] = useState(0);
  useEffect(() => {
    if (!isAuthenticated || !agentInfo?.permissions?.includes('birthday_box_orders')) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/birthday-box-orders?limit=200`);
        if (res.ok) {
          const data = await res.json();
          setBirthdayBoxNewCount((data.counts?.new || 0) + (data.counts?.pending_concierge || 0));
        }
      } catch {}
    };
    fetchCount();
    const t = setInterval(fetchCount, 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, agentInfo]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders?limit=100`);
      setOrders(res.data.orders || []);
      
      // Calculate stats
      const stats = {
        total: res.data.orders?.length || 0,
        pending: res.data.orders?.filter(o => o.status === 'pending').length || 0,
        processing: res.data.orders?.filter(o => o.status === 'processing').length || 0,
        completed: res.data.orders?.filter(o => o.status === 'delivered').length || 0
      };
      setOrderStats(stats);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    
    try {
      // Try agent-specific login first
      const res = await fetch(`${API_URL}/api/agent/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (res.ok) {
        const data = await res.json();
        const agentSession = {
          ...data.agent,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('tdc_agent_session', JSON.stringify(agentSession));
        setAgentInfo(data.agent);
        setIsAuthenticated(true);
        
        // Set default active tab
        const perms = data.agent.permissions || [];
        if (perms.includes('service_desk')) setActiveTab('service_desk');
        else if (perms.includes('unified_inbox')) setActiveTab('unified_inbox');
        else if (perms.length > 0) setActiveTab(perms[0]);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    }
    
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('tdc_agent_session');
    setIsAuthenticated(false);
    setAgentInfo(null);
    setCredentials({ username: '', password: '' });
    setActiveTab('');
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Portal</h1>
            <p className="text-gray-500 mt-1">The Doggy Company</p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter your username"
                  className="pl-10"
                  required
                  data-testid="agent-username-input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                  data-testid="agent-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loginLoading}
              data-testid="agent-login-button"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-400">
              Need an account? Contact your administrator
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Get permitted features
  const permittedFeatures = (agentInfo?.permissions || [])
    .filter(p => FEATURE_COMPONENTS[p])
    .map(p => ({ id: p, ...FEATURE_COMPONENTS[p] }));

  // Authenticated Agent View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agent Header */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">Agent Portal</h1>
                  <p className="text-xs text-gray-500">The Doggy Company</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2 ml-6">
                {permittedFeatures.map(feature => {
                  const Icon = feature.icon;
                  const isBirthdayBox = feature.id === 'birthday_box_orders';
                  const badgeCount = isBirthdayBox ? birthdayBoxNewCount : 0;
                  return (
                    <Button
                      key={feature.id}
                      variant={activeTab === feature.id ? 'default' : 'ghost'}
                      className={`relative ${activeTab === feature.id ? 'bg-purple-600' : ''}`}
                      onClick={() => setActiveTab(feature.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {feature.name}
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
                          style={{ background: '#DC2626', fontSize: 9 }}
                          data-testid="birthday-box-nav-badge">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-purple-700">
                  {agentInfo?.name || agentInfo?.username}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                data-testid="agent-logout-button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-2 border-t pt-3">
              <div className="flex flex-wrap gap-2">
                {permittedFeatures.map(feature => {
                  const Icon = feature.icon;
                  return (
                    <Button
                      key={feature.id}
                      variant={activeTab === feature.id ? 'default' : 'outline'}
                      className={activeTab === feature.id ? 'bg-purple-600' : ''}
                      onClick={() => {
                        setActiveTab(feature.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {feature.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4">
        {/* No permissions */}
        {permittedFeatures.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No Access</h2>
            <p className="text-gray-500 mt-2">
              Your account doesn't have any permissions assigned yet.
              <br />Please contact your administrator.
            </p>
          </Card>
        )}
        
        {/* Birthday Box Orders */}
        {activeTab === 'birthday_box_orders' && agentInfo?.permissions?.includes('birthday_box_orders') && (
          <BirthdayBoxOrdersAdmin agentName={agentInfo?.name || agentInfo?.username} />
        )}
        
        {/* Service Desk */}
        {activeTab === 'service_desk' && agentInfo?.permissions?.includes('service_desk') && (
          <ServiceDesk credentials={{ username: agentInfo.username, password: '' }} />
        )}
        
        {/* Unified Inbox */}
        {activeTab === 'unified_inbox' && agentInfo?.permissions?.includes('unified_inbox') && (
          <UnifiedInbox credentials={{ username: agentInfo.username, password: '' }} />
        )}
        
        {/* Orders */}
        {activeTab === 'orders' && agentInfo?.permissions?.includes('orders') && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Orders
            </h2>
            
            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pending || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processing || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{orderStats.completed || 0}</p>
              </Card>
            </div>
            
            {/* Orders List */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Order ID</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Customer</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Items</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Total</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.slice(0, 50).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{order.order_number || order.id?.slice(0, 8)}</td>
                        <td className="p-3">{order.customer?.name || order.member?.name || 'Guest'}</td>
                        <td className="p-3">{order.items?.length || 0} items</td>
                        <td className="p-3 font-medium">₹{order.total || 0}</td>
                        <td className="p-3">
                          <Badge className={
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {order.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        
        {/* Notifications */}
        {activeTab === 'notifications' && agentInfo?.permissions?.includes('notifications') && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-yellow-600" />
              Notifications
            </h2>
            <Card className="p-12 text-center border-dashed">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No new notifications</p>
            </Card>
          </div>
        )}
        
        {/* Fulfilment */}
        {activeTab === 'fulfilment' && agentInfo?.permissions?.includes('fulfilment') && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-600" />
              Fulfilment
            </h2>
            <Card className="p-6">
              <p className="text-gray-600">
                Fulfilment management coming soon. For now, use the Orders tab to view order statuses.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPortal;
