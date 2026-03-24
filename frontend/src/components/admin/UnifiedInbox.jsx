import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import {
  Inbox,
  Mic,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Filter,
  RefreshCw,
  ChevronRight,
  User,
  PawPrint,
  Clock,
  Tag,
  Ticket,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Search,
  MoreVertical,
  Eye,
  Send,
  Loader2,
  Building,
  Utensils,
  Cake,
  Car,
  Heart,
  Dumbbell,
  Briefcase,
  PartyPopper,
  FileText,
  ShoppingBag,
  Crown,
  BookOpen,
  Shield,
  Users,
  Download
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

// Helper to create Basic Auth header
const getAuthHeader = (credentials) => {
  return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
};

// Channel icons and colors
const CHANNELS = {
  voice: { icon: Mic, color: 'bg-purple-100 text-purple-700', label: 'Voice' },
  web: { icon: Globe, color: 'bg-blue-100 text-blue-700', label: 'Web' },
  phone: { icon: Phone, color: 'bg-green-100 text-green-700', label: 'Phone' },
  email: { icon: Mail, color: 'bg-orange-100 text-orange-700', label: 'Email' },
  whatsapp: { icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700', label: 'WhatsApp' },
  chat: { icon: MessageSquare, color: 'bg-pink-100 text-pink-700', label: 'Chat' }
};

// Pillar icons and colors - THE 14 PILLARS
const PILLARS = {
  celebrate: { icon: Cake, color: 'bg-pink-500', label: '🎂 Celebrate', description: 'Cakes, Treats, Gifts' },
  dine: { icon: Utensils, color: 'bg-amber-500', label: '🍽️ Dine', description: 'Restaurants, Reservations' },
  stay: { icon: Building, color: 'bg-blue-500', label: '🏨 Stay', description: 'Hotels, Resorts' },
  travel: { icon: Car, color: 'bg-cyan-500', label: '✈️ Travel', description: 'Transport, Relocation' },
  care: { icon: Heart, color: 'bg-red-500', label: '💊 Care', description: 'Vets, Groomers' },
  enjoy: { icon: PartyPopper, color: 'bg-violet-500', label: '🎾 Enjoy', description: 'Events, Fun' },
  fit: { icon: Dumbbell, color: 'bg-green-500', label: '🏃 Fit', description: 'Activities, Fitness' },
  learn: { icon: BookOpen, color: 'bg-teal-500', label: '🎓 Learn', description: 'Training, Courses' },
  paperwork: { icon: FileText, color: 'bg-slate-500', label: '📄 Paperwork', description: 'Documents, Records' },
  advisory: { icon: FileText, color: 'bg-gray-600', label: '📋 Advisory', description: 'Guidance, Consultation' },
  emergency: { icon: AlertTriangle, color: 'bg-red-600', label: '🚨 Emergency', description: 'Urgent Help' },
  farewell: { icon: Heart, color: 'bg-rose-400', label: '🌈 Farewell', description: 'End-of-Life Services' },
  adopt: { icon: PawPrint, color: 'bg-purple-500', label: '🐾 Adopt', description: 'Pet Adoption' },
  shop: { icon: ShoppingBag, color: 'bg-orange-500', label: '🛒 Shop', description: 'Products, Supplies' },
  general: { icon: Inbox, color: 'bg-gray-500', label: '📥 General', description: 'Unassigned' }
};

// Status colors
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const UnifiedInbox = ({ credentials }) => {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [filters, setFilters] = useState({
    channel: 'all',
    pillar: 'all',
    status: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  // CSV Export function for Unified Inbox
  const exportInboxCSV = () => {
    const headers = ['ID', 'Channel', 'Pillar', 'Status', 'Customer', 'Pet', 'Message', 'Date'];
    const rows = intakes.map(i => [
      i.id,
      i.channel,
      i.pillar || 'general',
      i.status,
      i.customer_name || i.user_name || '',
      i.pet_name || '',
      (i.initial_message || i.message || '').substring(0, 100).replace(/,/g, ';').replace(/\n/g, ' '),
      i.created_at?.split('T')[0]
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unified_inbox_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported!', description: `${intakes.length} messages exported to CSV` });
  };

  // Fetch intakes
  const fetchIntakes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.channel !== 'all') params.append('channel', filters.channel);
      if (filters.pillar !== 'all') params.append('pillar', filters.pillar);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/channels/intakes?${params}`, {
        headers: { 'Authorization': getAuthHeader(credentials) }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntakes(data.intakes || []);
        setStats({
          total: data.count,
          byPillar: data.by_pillar || {}
        });
      }
    } catch (error) {
      console.error('Failed to fetch intakes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/channels/intakes/stats`, {
        headers: { 'Authorization': getAuthHeader(credentials) }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchIntakes();
    fetchStats();
  }, [filters]);

  // Assign pillar to intake
  const assignPillar = async (requestId, pillar) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/channels/intakes/${requestId}/assign-pillar?pillar=${pillar}`, {
        method: 'PATCH',
        headers: { 'Authorization': getAuthHeader(credentials) }
      });
      
      if (response.ok) {
        // Update local state
        setIntakes(prev => prev.map(i => 
          i.request_id === requestId ? { ...i, pillar, assigned_pillar: pillar } : i
        ));
        if (selectedIntake?.request_id === requestId) {
          setSelectedIntake(prev => ({ ...prev, pillar, assigned_pillar: pillar }));
        }
      }
    } catch (error) {
      console.error('Failed to assign pillar:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update intake status
  const updateStatus = async (requestId, status) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/channels/intakes/${requestId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': getAuthHeader(credentials),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setIntakes(prev => prev.map(i => 
          i.request_id === requestId ? { ...i, status } : i
        ));
        if (selectedIntake?.request_id === requestId) {
          setSelectedIntake(prev => ({ ...prev, status }));
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Filter intakes by search
  const filteredIntakes = intakes.filter(intake => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      intake.request_id?.toLowerCase().includes(query) ||
      intake.customer?.name?.toLowerCase().includes(query) ||
      intake.customer?.email?.toLowerCase().includes(query) ||
      intake.message?.toLowerCase().includes(query)
    );
  });

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-7 h-7 text-purple-600" />
            Unified Inbox
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            All incoming requests across channels and pillars
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { fetchIntakes(); fetchStats(); }} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportInboxCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-purple-700">{stats.total || 0}</p>
            </div>
            <Inbox className="w-8 h-8 text-purple-300" />
          </div>
        </Card>

        {/* By Channel Stats */}
        {Object.entries(stats.by_channel || {}).slice(0, 4).map(([channel, count], idx) => {
          const channelInfo = CHANNELS[channel] || CHANNELS.web;
          const Icon = channelInfo.icon;
          return (
            <Card key={`channel-${channel || 'unknown'}-${idx}`} className={`p-4 ${channelInfo.color.replace('text-', 'border-').replace('100', '200')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">{channelInfo.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <Icon className="w-8 h-8 opacity-30" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pillar Distribution */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" /> Pillar Distribution
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byPillar || {}).map(([pillar, count], idx) => {
            const pillarInfo = PILLARS[pillar] || PILLARS.general;
            return (
              <Badge 
                key={`pillar-${pillar || 'general'}-${idx}`} 
                className={`${pillarInfo.color} text-white px-3 py-1 cursor-pointer hover:opacity-80`}
                onClick={() => setFilters(prev => ({ ...prev, pillar }))}
              >
                {pillarInfo.label}: {count}
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intake List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={filters.channel} onValueChange={(v) => setFilters(p => ({ ...p, channel: v }))}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {Object.entries(CHANNELS).map(([key, { label }], idx) => (
                    <SelectItem key={`channel-option-${key}-${idx}`} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.pillar} onValueChange={(v) => setFilters(p => ({ ...p, pillar: v }))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Pillar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pillars</SelectItem>
                  {Object.entries(PILLARS).map(([key, { label }], idx) => (
                    <SelectItem key={`pillar-option-${key}-${idx}`} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Intake Items */}
          <div className="space-y-2">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                <p className="text-gray-500 mt-2">Loading requests...</p>
              </Card>
            ) : filteredIntakes.length === 0 ? (
              <Card className="p-8 text-center">
                <Inbox className="w-12 h-12 mx-auto text-gray-300" />
                <p className="text-gray-500 mt-2">No requests found</p>
              </Card>
            ) : (
              filteredIntakes.map((intake, idx) => {
                const channelInfo = CHANNELS[intake.channel] || CHANNELS.web;
                const pillarInfo = PILLARS[intake.pillar] || PILLARS.general;
                const ChannelIcon = channelInfo.icon;
                const PillarIcon = pillarInfo.icon;
                
                return (
                  <Card 
                    key={intake.id || intake._id || intake.thread_id || intake.request_id || intake.ticket_id || idx}
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                      selectedIntake?.request_id === intake.request_id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedIntake(intake)}
                    data-testid={`intake-${intake.request_id}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Channel Icon */}
                      <div className={`p-2 rounded-lg ${channelInfo.color}`}>
                        <ChannelIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {intake.customer?.name || 'Unknown Customer'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {intake.request_id}
                          </Badge>
                          <Badge className={`${pillarInfo.color} text-white text-xs`}>
                            {pillarInfo.label}
                          </Badge>
                          <Badge className={STATUS_COLORS[intake.status] || STATUS_COLORS.pending}>
                            {intake.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {intake.message}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {intake.customer?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {intake.customer.email}
                            </span>
                          )}
                          {intake.customer?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {intake.customer.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo(intake.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        {intake.ticket_id && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            <Ticket className="w-3 h-3 mr-1" />
                            {intake.ticket_id}
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedIntake ? (
            <Card className="p-4 sticky top-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Request Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedIntake(null)}>
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>

                {/* Request ID & Channel */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{selectedIntake.request_id}</Badge>
                  <Badge className={CHANNELS[selectedIntake.channel]?.color || ''}>
                    {CHANNELS[selectedIntake.channel]?.label || selectedIntake.channel}
                  </Badge>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer
                  </h4>
                  <p className="text-sm">{selectedIntake.customer?.name || 'Unknown'}</p>
                  {selectedIntake.customer?.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {selectedIntake.customer.email}
                    </p>
                  )}
                  {selectedIntake.customer?.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedIntake.customer.phone}
                    </p>
                  )}
                  {selectedIntake.customer?.pet_name && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <PawPrint className="w-3 h-3" /> {selectedIntake.customer.pet_name}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="bg-purple-50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Message</h4>
                  <p className="text-sm text-gray-700">{selectedIntake.message}</p>
                </div>

                {/* Extracted Data */}
                {selectedIntake.extracted_data?.parsed && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" /> AI Extracted
                    </h4>
                    <div className="text-xs space-y-1">
                      {selectedIntake.extracted_data.pet_name && (
                        <p><strong>Pet:</strong> {selectedIntake.extracted_data.pet_name}</p>
                      )}
                      {selectedIntake.extracted_data.items?.length > 0 && (
                        <div>
                          <strong>Items:</strong>
                          <ul className="list-disc list-inside">
                            {selectedIntake.extracted_data.items.map((item, i) => (
                              <li key={item.id || item.name || i}>{item.name} x{item.quantity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedIntake.extracted_data.is_custom_cake && (
                        <Badge className="bg-pink-100 text-pink-700">Custom Cake Request</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Pillar Assignment */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Assign to Pillar
                  </h4>
                  <Select 
                    value={selectedIntake.pillar || 'general'} 
                    onValueChange={(v) => assignPillar(selectedIntake.request_id, v)}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PILLARS).map(([key, { label, description }], idx) => (
                        <SelectItem key={`detail-pillar-${key}-${idx}`} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{label}</span>
                            <span className="text-xs text-gray-400">- {description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Update */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Update Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'processing', 'completed', 'cancelled'].map((status, idx) => (
                      <Button
                        key={`status-${status}-${idx}`}
                        size="sm"
                        variant={selectedIntake.status === status ? 'default' : 'outline'}
                        onClick={() => updateStatus(selectedIntake.request_id, status)}
                        disabled={updating}
                        className="text-xs"
                      >
                        {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {status === 'processing' && <Loader2 className="w-3 h-3 mr-1" />}
                        {status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Linked Ticket */}
                {selectedIntake.ticket_id && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-blue-600" /> Linked Ticket
                    </h4>
                    <Badge className="bg-blue-100 text-blue-700">
                      {selectedIntake.ticket_id}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-created on intake
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  <p>Created: {new Date(selectedIntake.created_at).toLocaleString()}</p>
                  {selectedIntake.updated_at && (
                    <p>Updated: {new Date(selectedIntake.updated_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center sticky top-4">
              <Eye className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">Select a request to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox;
