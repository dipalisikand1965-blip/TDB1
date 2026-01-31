/**
 * PillarQueues.jsx
 * Admin panel for viewing pillar-specific request queues
 * Each pillar (Fit, Care, Travel, etc.) has its own queue of requests
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import {
  RefreshCw, Search, Filter, Clock, CheckCircle, AlertCircle,
  ChevronRight, User, Phone, Mail, Calendar, PawPrint, Loader2,
  ExternalLink
} from 'lucide-react';

// Pillar Icons mapping
const PILLAR_ICONS = {
  fit: '🏃',
  care: '💊',
  celebrate: '🎂',
  dine: '🍽️',
  stay: '🏨',
  travel: '✈️',
  learn: '🎓',
  enjoy: '🎾',
  advisory: '📋',
  paperwork: '📄',
  emergency: '🚨',
  adopt: '🐾',
  farewell: '🌈',
  shop: '🛒'
};

// Pillar colors
const PILLAR_COLORS = {
  fit: 'from-emerald-500 to-teal-600',
  care: 'from-pink-500 to-rose-600',
  celebrate: 'from-amber-500 to-orange-600',
  dine: 'from-red-500 to-rose-600',
  stay: 'from-blue-500 to-indigo-600',
  travel: 'from-purple-500 to-violet-600',
  learn: 'from-cyan-500 to-blue-600',
  enjoy: 'from-orange-500 to-amber-600',
  advisory: 'from-slate-500 to-gray-600',
  paperwork: 'from-stone-500 to-zinc-600',
  emergency: 'from-red-600 to-rose-700',
  adopt: 'from-green-500 to-emerald-600',
  farewell: 'from-indigo-500 to-purple-600',
  shop: 'from-violet-500 to-purple-600'
};

const PillarQueues = ({ authHeaders }) => {
  const [queues, setQueues] = useState([]);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch queues overview
  const fetchQueues = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/pillars/queues`, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setQueues(data.queues || []);
      }
    } catch (error) {
      console.error('Error fetching queues:', error);
      toast({ title: 'Error', description: 'Failed to fetch pillar queues', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests for a specific pillar
  const fetchPillarRequests = async (pillar) => {
    setLoadingRequests(true);
    try {
      let url = `${API_URL}/api/admin/pillars/queues/${pillar}?limit=50`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching pillar requests:', error);
      toast({ title: 'Error', description: 'Failed to fetch requests', variant: 'destructive' });
    } finally {
      setLoadingRequests(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pillars/queues/${selectedPillar}/${requestId}?status=${newStatus}`, {
        method: 'PUT',
        headers: authHeaders
      });
      if (response.ok) {
        toast({ title: 'Updated', description: `Request status changed to ${newStatus}` });
        fetchPillarRequests(selectedPillar);
        fetchQueues();
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (selectedPillar) {
      fetchPillarRequests(selectedPillar);
    }
  }, [selectedPillar, statusFilter]);

  // Filter requests by search
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.pet_name?.toLowerCase().includes(query) ||
      req.user_name?.toLowerCase().includes(query) ||
      req.user_email?.toLowerCase().includes(query) ||
      req.description?.toLowerCase().includes(query) ||
      req.id?.toLowerCase().includes(query)
    );
  });

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      open: 'bg-blue-100 text-blue-800',
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pillar Queues</h2>
          <p className="text-gray-500 text-sm">View and manage requests by service pillar</p>
        </div>
        <Button onClick={fetchQueues} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Queue Overview Cards */}
      {!selectedPillar && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {queues.map((queue) => (
            <Card
              key={queue.pillar}
              className={`p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${
                queue.pending > 0 ? 'border-amber-300' : 'border-transparent'
              }`}
              onClick={() => setSelectedPillar(queue.pillar)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{queue.icon || PILLAR_ICONS[queue.pillar]}</div>
                <h3 className="font-semibold text-gray-900 capitalize">{queue.pillar}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{queue.total}</span>
                    <span className="text-xs text-gray-500">total</span>
                  </div>
                  {queue.pending > 0 && (
                    <Badge className="bg-amber-100 text-amber-800">
                      {queue.pending} pending
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Pillar Detail View */}
      {selectedPillar && (
        <div className="space-y-4">
          {/* Back button and pillar header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedPillar(null)}>
              ← Back to Overview
            </Button>
            <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${PILLAR_COLORS[selectedPillar]} text-white`}>
              <span className="text-xl mr-2">{PILLAR_ICONS[selectedPillar]}</span>
              <span className="font-bold capitalize">{selectedPillar} Queue</span>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex gap-4">
              <Card className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.in_progress}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by pet, user, or request ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Requests List */}
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">No requests found</h3>
              <p className="text-gray-500 text-sm">This queue is empty or no requests match your filters</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <Card key={req.id || req.request_id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(req.status)}>
                          {req.status || 'pending'}
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono">
                          {req.id || req.request_id || req.ticket_id}
                        </span>
                        {req.is_multi_pet && (
                          <Badge className="bg-purple-100 text-purple-700">Multi-Pet</Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Pet Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <PawPrint className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {req.pet_name || req.pets?.map(p => p.name).join(', ') || 'No pet specified'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.pet_breed || req.pets?.[0]?.breed || ''}
                              {req.pet_count > 1 && ` (+${req.pet_count - 1} more)`}
                            </div>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-1">
                          {req.user_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{req.user_name}</span>
                            </div>
                          )}
                          {req.user_email && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{req.user_email}</span>
                            </div>
                          )}
                          {req.user_phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{req.user_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {req.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{req.description}</p>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        {req.care_type || req.travel_type || req.service_type && (
                          <Badge variant="outline" className="text-xs">
                            {req.care_type || req.travel_type || req.service_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {req.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateRequestStatus(req.id || req.request_id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {req.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateRequestStatus(req.id || req.request_id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PillarQueues;
