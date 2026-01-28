import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  MessageCircle,
  Cake,
  Clock,
  MapPin,
  ChevronRight,
  PawPrint,
  Package,
  DollarSign,
  Ticket,
  TrendingUp,
  Users,
  RefreshCw,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DashboardTab = ({ 
  dashboard, 
  products, 
  onSelectChat,
  authHeaders
}) => {
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Fetch today's key metrics from Report Builder
  const fetchTodayMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/reports/generate?report_type=daily_summary&period=today`, authHeaders);
      if (response.ok) {
        const data = await response.json();
        setTodayMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch today metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchTodayMetrics();
  }, []);

  if (!dashboard) return null;

  return (
    <div className="space-y-8" data-testid="dashboard-tab">
      {/* Today's Snapshot Widget */}
      <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Today&apos;s Snapshot
          </h3>
          <button 
            onClick={fetchTodayMetrics}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={loadingMetrics}
          >
            {loadingMetrics ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {todayMetrics?.summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {todayMetrics.summary.slice(0, 4).map((item, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-white/80">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">Revenue</p>
              <p className="text-2xl font-bold mt-1">₹0</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">Orders</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">New Members</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">Open Tickets</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Cards */}
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

      {/* Recent Conversations */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Mira Conversations</h3>
        <div className="space-y-3">
          {dashboard.recent_chats?.map((chat, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelectChat(chat)}
              data-testid={`recent-chat-${idx}`}
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
  );
};

export default DashboardTab;
