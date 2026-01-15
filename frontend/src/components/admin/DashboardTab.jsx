import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  MessageCircle,
  Cake,
  Clock,
  MapPin,
  ChevronRight,
  PawPrint,
  Package
} from 'lucide-react';

const DashboardTab = ({ 
  dashboard, 
  products, 
  onSelectChat 
}) => {
  if (!dashboard) return null;

  return (
    <div className="space-y-8" data-testid="dashboard-tab">
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
