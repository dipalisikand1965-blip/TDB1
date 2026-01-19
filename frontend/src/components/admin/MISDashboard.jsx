import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Ticket,
  RefreshCw,
  Mic,
  Globe,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '../ui/button';
import { API_URL } from '../../utils/api';

export default function MISDashboard({ authHeaders }) {
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [channels, setChannels] = useState(null);
  const [serviceDesk, setServiceDesk] = useState(null);
  const [pillars, setPillars] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    if (!authHeaders?.Authorization) {
      console.log('MIS Dashboard: No auth headers yet');
      return;
    }
    
    setLoading(true);
    try {
      const [dashRes, revRes, chanRes, sdRes, pillarRes] = await Promise.all([
        fetch(`${API}/api/mis/dashboard`, { headers: authHeaders }),
        fetch(`${API}/api/mis/revenue/summary?period=week`, { headers: authHeaders }),
        fetch(`${API}/api/mis/channels/performance?period=week`, { headers: authHeaders }),
        fetch(`${API}/api/mis/service-desk/metrics?period=week`, { headers: authHeaders }),
        fetch(`${API}/api/mis/pillars/summary?period=month`, { headers: authHeaders })
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      else console.error('Dashboard fetch failed:', dashRes.status);
      
      if (revRes.ok) setRevenue(await revRes.json());
      else console.error('Revenue fetch failed:', revRes.status);
      
      if (chanRes.ok) setChannels(await chanRes.json());
      else console.error('Channels fetch failed:', chanRes.status);
      
      if (sdRes.ok) setServiceDesk(await sdRes.json());
      else console.error('Service desk fetch failed:', sdRes.status);
      
      if (pillarRes.ok) setPillars(await pillarRes.json());
      else console.error('Pillars fetch failed:', pillarRes.status);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch MIS data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authHeaders?.Authorization) {
      fetchData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authHeaders]);

  const channelIcons = {
    web: Globe,
    voice: Mic,
    chat: MessageSquare,
    phone: Phone,
    email: Mail,
    whatsapp: MessageSquare
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mis-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Real-Time MIS Dashboard</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
            {loading && <RefreshCw className="w-3 h-3 inline ml-2 animate-spin" />}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Today's Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold">₹{dashboard?.today?.revenue?.toLocaleString() || 0}</p>
                <p className="text-green-100 text-xs mt-1">{dashboard?.today?.orders || 0} orders</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">This Week</p>
                <p className="text-3xl font-bold">₹{dashboard?.week?.revenue?.toLocaleString() || 0}</p>
                <p className="text-blue-100 text-xs mt-1">{dashboard?.week?.orders || 0} orders</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm">Avg Order Value</p>
                <p className="text-3xl font-bold">₹{revenue?.average_order_value?.toLocaleString() || 0}</p>
                <p className="text-purple-100 text-xs mt-1">{revenue?.items_sold || 0} items sold</p>
              </div>
              <Package className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm">Pending Tickets</p>
                <p className="text-3xl font-bold">{dashboard?.active?.pending_tickets || 0}</p>
                <p className="text-orange-100 text-xs mt-1">{serviceDesk?.total_tickets || 0} total this week</p>
              </div>
              <Ticket className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Desk & Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Desk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-600" />
              Service Desk Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceDesk && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Resolution Rate</span>
                  <span className="text-2xl font-bold text-purple-600">{serviceDesk.resolution_rate}%</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">By Status</p>
                  {Object.entries(serviceDesk.by_status || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Top Categories</p>
                  {serviceDesk.by_category?.slice(0, 4).map((cat) => (
                    <div key={cat.category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{cat.category}</span>
                      <span className="text-sm font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channels?.channels?.length > 0 ? (
              <div className="space-y-3">
                {channels.channels.map((ch) => {
                  const Icon = channelIcons[ch.channel] || Globe;
                  return (
                    <div key={ch.channel} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium capitalize">{ch.channel}</span>
                        </div>
                        <span className="text-green-600 font-bold">₹{ch.revenue?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{ch.requests} requests</span>
                        <span>{ch.conversions} conversions</span>
                        <span className="text-blue-600 font-medium">{ch.conversion_rate}% CVR</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Channel data will appear here</p>
                <p className="text-xs">As orders come through different channels</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pillar Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🏛️ Pillar Performance (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          {pillars?.pillars && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(pillars.pillars).map(([key, pillar]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{pillar.name}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {pillar.revenue > 0 ? `₹${pillar.revenue.toLocaleString()}` : pillar.bookings > 0 ? `${pillar.bookings} bookings` : '-'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {pillar.orders > 0 ? `${pillar.orders} orders` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{dashboard?.quick_stats?.total_products || 0}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{dashboard?.quick_stats?.total_customers || 0}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{dashboard?.quick_stats?.total_orders_all_time || 0}</p>
            <p className="text-sm text-gray-500">All-Time Orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
