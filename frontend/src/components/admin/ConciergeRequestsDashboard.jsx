/**
 * ConciergeRequestsDashboard.jsx
 * 
 * Admin dashboard for managing all Concierge® experience requests.
 * Shows requests across all pillars with filtering, status updates, and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import {
  Sparkles, MessageCircle, Phone, Mail, Clock, User, MapPin,
  Filter, RefreshCw, ChevronRight, Check, X, Loader2,
  Plane, Home, Heart, PartyPopper, GraduationCap, Search,
  Calendar, AlertCircle, CheckCircle, Archive, MoreVertical
} from 'lucide-react';

// Pillar configuration
const PILLARS = {
  travel: { name: 'Travel', icon: Plane, color: 'violet' },
  stay: { name: 'Stay', icon: Home, color: 'emerald' },
  care: { name: 'Care', icon: Heart, color: 'rose' },
  enjoy: { name: 'Enjoy', icon: PartyPopper, color: 'amber' },
  learn: { name: 'Learn', icon: GraduationCap, color: 'blue' }
};

// Status configuration
const STATUSES = {
  new: { label: 'New', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700', icon: Phone },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700', icon: Archive }
};

const ConciergeRequestsDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [pillarFilter, setPillarFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    new_requests: 0,
    by_pillar: {}
  });

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pillarFilter !== 'all') params.append('pillar', pillarFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`${API_URL}/api/concierge/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Error', description: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/concierge/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [pillarFilter, statusFilter]);

  // Update request status
  const updateStatus = async (requestId, newStatus, note = '') => {
    try {
      const response = await fetch(`${API_URL}/api/concierge/requests/${requestId}?status=${newStatus}&note=${encodeURIComponent(note)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast({ title: 'Status Updated', description: `Request marked as ${newStatus}` });
        fetchRequests();
        fetchStats();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Filter requests by search
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (req.name || '').toLowerCase().includes(query) ||
      (req.email || '').toLowerCase().includes(query) ||
      (req.experience_name || '').toLowerCase().includes(query) ||
      (req.experience_title || '').toLowerCase().includes(query)
    );
  });

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="concierge-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            Concierge® Requests Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage and respond to elevated experience requests</p>
        </div>
        <Button onClick={() => { fetchRequests(); fetchStats(); }} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50">
          <p className="text-xs text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-violet-700">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
          <p className="text-xs text-gray-500">New (Action Needed)</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.new_requests}</p>
        </Card>
        {Object.entries(PILLARS).map(([key, config]) => (
          <Card key={key} className="p-4">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <config.icon className="w-3 h-3" /> {config.name}
            </p>
            <p className={`text-2xl font-bold text-${config.color}-700`}>
              {stats.by_pillar?.[key] || 0}
            </p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select value={pillarFilter} onValueChange={setPillarFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Pillars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pillars</SelectItem>
              {Object.entries(PILLARS).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUSES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name, email, or experience..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-600" />
            <p className="text-gray-500 mt-2">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No Concierge® requests found</p>
            <p className="text-sm text-gray-400">Requests will appear here when customers submit them</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredRequests.map((request) => {
              const pillarConfig = PILLARS[request.pillar] || PILLARS.travel;
              const statusConfig = STATUSES[request.status] || STATUSES.new;
              const PillarIcon = pillarConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={request.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                  data-testid={`request-row-${request.id}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Pillar Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-${pillarConfig.color}-100 flex items-center justify-center`}>
                      <PillarIcon className={`w-5 h-5 text-${pillarConfig.color}-600`} />
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {request.experience_name || request.experience_title || 'General Inquiry'}
                        </h4>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.name || request.user_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {request.email || request.user_email || 'No email'}
                        </span>
                        {request.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {request.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Date & Actions */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                      <Badge variant="outline" className="mt-1 capitalize">{pillarConfig.name}</Badge>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Concierge® Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Experience Info */}
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <h3 className="font-bold text-gray-900">
                  {selectedRequest.experience_name || selectedRequest.experience_title || 'General Inquiry'}
                </h3>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {PILLARS[selectedRequest.pillar]?.name || selectedRequest.pillar} Pillar
                </p>
              </div>
              
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Customer Name</Label>
                  <p className="font-medium">{selectedRequest.name || selectedRequest.user_name || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium">{selectedRequest.email || selectedRequest.user_email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="font-medium">{selectedRequest.phone || selectedRequest.user_phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Contact</Label>
                  <p className="font-medium capitalize">{selectedRequest.preferred_contact || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Message */}
              {selectedRequest.message && (
                <div>
                  <Label className="text-xs text-gray-500">Customer Message</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedRequest.message}
                  </p>
                </div>
              )}
              
              {/* Timeline */}
              {selectedRequest.timeline && selectedRequest.timeline.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Timeline</Label>
                  <div className="space-y-2">
                    {selectedRequest.timeline.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                        <span className="font-medium capitalize">{event.status}</span>
                        {event.note && <span className="text-gray-500">- {event.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  onClick={() => updateStatus(selectedRequest.id, 'contacted', 'Reached out to customer')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Mark Contacted
                </Button>
                <Button 
                  onClick={() => updateStatus(selectedRequest.id, 'in_progress', 'Working on request')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  In Progress
                </Button>
                <Button 
                  onClick={() => updateStatus(selectedRequest.id, 'completed', 'Request fulfilled')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <Button 
                  onClick={() => updateStatus(selectedRequest.id, 'archived')}
                  variant="outline"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConciergeRequestsDashboard;
