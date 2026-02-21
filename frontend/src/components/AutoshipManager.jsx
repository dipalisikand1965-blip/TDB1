import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  RefreshCw, Search, Play, Pause, X, User, Calendar,
  Package, Phone, Filter, ChevronDown, AlertCircle
} from 'lucide-react';
import { API_URL } from '../utils/api';


const AutoshipManager = ({ getAuthHeader }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ active: 0, paused: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${API_URL}/api/admin/autoship`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || { active: 0, paused: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch autoship data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (subscriptionId, newStatus) => {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${API_URL}/api/admin/autoship/${subscriptionId}/status?new_status=${newStatus}`, {
        method: 'PUT',
        headers
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchQuery === '' || 
      sub.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer_phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-600">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDiscountLevel = (orderCount) => {
    if (orderCount >= 6) return '50%';
    if (orderCount >= 4) return '40%';
    if (orderCount >= 1) return '25%';
    return '25%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
              <p className="text-sm text-green-600">Active Subscriptions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Pause className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.paused}</p>
              <p className="text-sm text-yellow-600">Paused</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
              <p className="text-sm text-purple-600">Total Subscriptions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, phone, or product..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Next Shipment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{sub.customer_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{sub.customer_phone || sub.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sub.product_image && (
                          <img src={sub.product_image} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{sub.product_name}</p>
                          {sub.variant && <p className="text-xs text-gray-500">{sub.variant}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">Every {sub.frequency} weeks</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <span className="font-bold text-lg text-purple-600">{sub.order_count || 0}</span>
                        <p className="text-xs text-gray-500">{getDiscountLevel(sub.order_count || 0)} off</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {sub.next_shipment_date 
                          ? new Date(sub.next_shipment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'Not set'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {sub.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            onClick={() => updateStatus(sub.id, 'paused')}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {sub.status === 'paused' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateStatus(sub.id, 'active')}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {sub.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm('Cancel this subscription?')) {
                                updateStatus(sub.id, 'cancelled');
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No autoship subscriptions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Discount Reference */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Autoship Discount Reference
        </h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-blue-700">Order 1</p>
            <p className="text-blue-600">25% off (max ₹300)</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-700">Orders 2-3</p>
            <p className="text-blue-600">No discount</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-700">Orders 4-5</p>
            <p className="text-blue-600">40% off</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-700">Orders 6-7+</p>
            <p className="text-blue-600">50% off</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AutoshipManager;
