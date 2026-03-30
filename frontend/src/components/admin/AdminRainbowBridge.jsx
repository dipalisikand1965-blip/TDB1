/**
 * AdminRainbowBridge.jsx
 * 
 * Admin panel for managing Rainbow Bridge Memorials
 * - View all memorials
 * - See tributes received
 * - Moderate content if needed
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import {
  Rainbow, Heart, Users, Calendar, MessageCircle, 
  Eye, Trash2, RefreshCw, PawPrint, CloudSun, Star, Loader2
} from 'lucide-react';

const AdminRainbowBridge = () => {
  const [memorials, setMemorials] = useState([]);
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('memorials');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all memorials
      const memResponse = await fetch(`${API_URL}/api/rainbow-bridge/wall`);
      if (memResponse.ok) {
        const memData = await memResponse.json();
        setMemorials(memData.memorials || []);
        
        // Collect all tributes
        const allTributes = [];
        for (const mem of memData.memorials || []) {
          if (mem.tributes) {
            allTributes.push(...mem.tributes.map(t => ({ ...t, pet_name: mem.pet_name })));
          }
        }
        setTributes(allTributes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Rainbow className="w-7 h-7 text-purple-500" />
            Rainbow Bridge Memorial Admin
          </h2>
          <p className="text-gray-500">Manage memorials and community tributes</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <PawPrint className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">{memorials.length}</p>
              <p className="text-white/80 text-sm">Total Memorials</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">{tributes.length}</p>
              <p className="text-white/80 text-sm">Total Tributes</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">{new Set(memorials.map(m => m.owner_email)).size}</p>
              <p className="text-white/80 text-sm">Pet Parents</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">
                {memorials.filter(m => m.tribute_count > 0).length}
              </p>
              <p className="text-white/80 text-sm">With Tributes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('memorials')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'memorials'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Rainbow className="w-4 h-4 inline mr-2" />
          Memorials ({memorials.length})
        </button>
        <button
          onClick={() => setActiveTab('tributes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tributes'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className="w-4 h-4 inline mr-2" />
          Tributes ({tributes.length})
        </button>
      </div>

      {/* Memorials Tab */}
      {activeTab === 'memorials' && (
        <div className="grid gap-4">
          {memorials.map((memorial) => (
            <Card key={memorial.id || memorial.pet_id} className="p-4">
              <div className="flex items-start gap-4">
                <img 
                  src={memorial.photo || ''}
                  alt={memorial.pet_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{memorial.pet_name}</h3>
                      <p className="text-gray-500 text-sm">{memorial.breed || 'Companion'}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {memorial.tribute_count || 0} tributes
                    </Badge>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {memorial.owner_name || memorial.owner_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <CloudSun className="w-4 h-4" />
                      Crossed {memorial.crossing_date ? new Date(memorial.crossing_date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {getTimeSince(memorial.created_at)}
                    </span>
                  </div>
                  
                  {memorial.tribute_message && (
                    <p className="mt-2 text-gray-600 italic text-sm bg-gray-50 p-2 rounded">
                      "{memorial.tribute_message}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {memorials.length === 0 && (
            <Card className="p-8 text-center text-gray-500">
              <Rainbow className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No memorials created yet</p>
            </Card>
          )}
        </div>
      )}

      {/* Tributes Tab */}
      {activeTab === 'tributes' && (
        <div className="grid gap-3">
          {tributes.map((tribute, idx) => (
            <Card key={tribute.id || idx} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{tribute.from_name}</span>
                    <span className="text-gray-400">→</span>
                    <Badge variant="outline" className="text-purple-600">
                      {tribute.pet_name}
                    </Badge>
                  </div>
                  <p className="text-gray-600 italic">"{tribute.message}"</p>
                  <p className="text-gray-400 text-xs mt-1">{getTimeSince(tribute.created_at)}</p>
                </div>
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
            </Card>
          ))}
          
          {tributes.length === 0 && (
            <Card className="p-8 text-center text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tributes received yet</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRainbowBridge;
