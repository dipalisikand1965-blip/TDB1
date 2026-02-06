import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
  Loader2,
  Sparkles,
  Download,
  Tags,
  Database
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

const DashboardTab = ({ 
  dashboard, 
  products, 
  onSelectChat,
  authHeaders
}) => {
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [enhancingTags, setEnhancingTags] = useState(false);
  const [seedingProducts, setSeedingProducts] = useState(false);

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

  // Enhance all product tags
  const handleEnhanceTags = async () => {
    setEnhancingTags(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/products/run-intelligence?update_db=true`, {
        method: 'POST',
        ...authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Tags Enhanced!",
          description: `Processed ${data.results?.products_processed || 0} products with ${data.results?.tags_added || 0} tags added`,
        });
      } else {
        throw new Error('Failed to enhance tags');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setEnhancingTags(false);
    }
  };

  // Seed all products
  const handleSeedProducts = async () => {
    setSeedingProducts(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/seed-all`, {
        method: 'POST',
        ...authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Products Seeded!",
          description: data.message || "All pillar products seeded successfully",
        });
      } else {
        throw new Error('Failed to seed products');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSeedingProducts(false);
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

      {/* Quick Tools */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Quick Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Enhance All Product Tags */}
          <Button
            onClick={handleEnhanceTags}
            disabled={enhancingTags}
            className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="enhance-tags-btn"
          >
            {enhancingTags ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Tags className="w-6 h-6" />
            )}
            <span className="text-sm font-medium">
              {enhancingTags ? 'Enhancing...' : 'Enhance All Tags'}
            </span>
            <span className="text-xs opacity-80">Pillar, Breed, Size</span>
          </Button>

          {/* Seed All Products */}
          <Button
            onClick={handleSeedProducts}
            disabled={seedingProducts}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-gray-50"
            data-testid="seed-products-btn"
          >
            {seedingProducts ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Database className="w-6 h-6 text-blue-600" />
            )}
            <span className="text-sm font-medium">
              {seedingProducts ? 'Seeding...' : 'Seed All Products'}
            </span>
            <span className="text-xs text-gray-500">All Pillars</span>
          </Button>

          {/* Download Products CSV */}
          <a
            href={`${API_URL}/api/admin/export/unified-products-csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Products CSV</span>
            <span className="text-xs text-gray-500">2000+ items</span>
          </a>

          {/* Download Services CSV */}
          <a
            href={`${API_URL}/api/admin/export/services-csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium">Services CSV</span>
            <span className="text-xs text-gray-500">All bundles</span>
          </a>

          {/* Download Source Code - Admin Only */}
          <a
            href={`${API_URL}/api/admin/download-source`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-gray-200 rounded-md hover:bg-gray-50 transition-colors bg-gradient-to-r from-gray-50 to-slate-50"
            data-testid="download-source-btn"
          >
            <Download className="w-6 h-6 text-slate-600" />
            <span className="text-sm font-medium">Download Source</span>
            <span className="text-xs text-gray-500">Full Codebase ZIP</span>
          </a>
        </div>
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
