/**
 * MyTicketsPage - User-facing page to view their service requests/tickets
 * Shows booking history, request status, and agent communications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, Clock, CheckCircle, MessageSquare, AlertCircle,
  Calendar, ChevronRight, Bell, BellOff, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { usePushNotifications } from '../hooks/usePushNotifications';

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  claimed: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
};

const TicketCard = ({ ticket, onClick, isSelected }) => {
  const status = statusConfig[ticket.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-purple-500 shadow-lg' : ''
      }`}
      onClick={onClick}
      data-testid={`ticket-card-${ticket.ticket_id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 font-mono">
                #{ticket.ticket_id?.slice(0, 12) || 'N/A'}
              </span>
              <Badge className={`text-xs ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900 truncate">
              {ticket.subject || ticket.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service Request'}
            </h3>
            {ticket.pet_name && (
              <p className="text-sm text-gray-600">For: {ticket.pet_name}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(ticket.created_at)}
          </span>
          {ticket.assigned_name && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.assigned_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TicketDetail = ({ ticket, onClose }) => {
  if (!ticket) return null;
  
  const status = statusConfig[ticket.status] || statusConfig.pending;
  
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card data-testid="ticket-detail">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-gray-500 font-mono">#{ticket.ticket_id}</span>
            <CardTitle className="text-lg mt-1">
              {ticket.subject || ticket.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Request Details</h4>
          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
            {ticket.pet_name && <p><span className="text-gray-500">Pet:</span> {ticket.pet_name}</p>}
            {ticket.request_date && <p><span className="text-gray-500">Scheduled:</span> {ticket.request_date} {ticket.request_time && `at ${ticket.request_time}`}</p>}
            {ticket.notes && <p><span className="text-gray-500">Notes:</span> {ticket.notes}</p>}
            {ticket.description && <p><span className="text-gray-500">Description:</span> {ticket.description}</p>}
          </div>
        </div>
        
        {/* Assigned Agent */}
        {ticket.assigned_name && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Assigned Agent</h4>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-medium text-sm">
                  {ticket.assigned_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{ticket.assigned_name}</p>
                {ticket.assigned_at && (
                  <p className="text-xs text-gray-500">Assigned on {formatDateTime(ticket.assigned_at)}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Resolution */}
        {ticket.status === 'resolved' && ticket.resolution_summary && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Resolution</h4>
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <p>{ticket.resolution_summary}</p>
              {ticket.resolved_at && (
                <p className="text-xs text-gray-500 mt-2">Resolved on {formatDateTime(ticket.resolved_at)}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Created {formatDateTime(ticket.created_at)}</span>
            </div>
            {ticket.assigned_at && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Assigned to {ticket.assigned_name} - {formatDateTime(ticket.assigned_at)}</span>
              </div>
            )}
            {ticket.resolved_at && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Resolved {formatDateTime(ticket.resolved_at)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Messages/Updates */}
        {ticket.messages && ticket.messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Updates</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ticket.messages.map((msg, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                  <p className="text-gray-700">{msg.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.sender} • {formatDateTime(msg.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MyTicketsPage = () => {
  const [searchParams] = useSearchParams();
  const highlightTicketId = searchParams.get('id');
  
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Push notifications
  const {
    isPushSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    loading: pushLoading
  } = usePushNotifications(user?.id);
  
  const fetchTickets = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Fetch from multiple sources
      const [ticketsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/user/tickets?email=${encodeURIComponent(user.email)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/user/bookings?email=${encodeURIComponent(user.email)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).catch(() => ({ ok: false }))
      ]);
      
      let allTickets = [];
      
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        allTickets = [...allTickets, ...(data.tickets || [])];
      }
      
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        // Convert bookings to ticket format
        const bookingTickets = (data.bookings || []).map(b => ({
          ticket_id: b.ticket_id || b.id,
          subject: `Booking: ${b.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service'}`,
          service_type: b.service_type,
          status: b.status,
          created_at: b.created_at,
          pet_name: b.pet_name,
          request_date: b.date,
          request_time: b.time,
          notes: b.notes,
          assigned_name: b.assigned_name
        }));
        allTickets = [...allTickets, ...bookingTickets];
      }
      
      // Remove duplicates by ticket_id
      const uniqueTickets = allTickets.reduce((acc, ticket) => {
        if (!acc.find(t => t.ticket_id === ticket.ticket_id)) {
          acc.push(ticket);
        }
        return acc;
      }, []);
      
      // Sort by created_at descending
      uniqueTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTickets(uniqueTickets);
      
      // Auto-select ticket if highlighted in URL
      if (highlightTicketId) {
        const highlighted = uniqueTickets.find(t => t.ticket_id === highlightTicketId);
        if (highlighted) setSelectedTicket(highlighted);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [user, token, highlightTicketId]);
  
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  
  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success('Notifications disabled');
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notifications enabled! You\'ll be notified of ticket updates.');
      } else {
        toast.error('Failed to enable notifications. Please check browser permissions.');
      }
    }
  };
  
  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['resolved', 'closed'].includes(ticket.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(ticket.status);
    return true;
  });
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              Please log in to view your service requests and tickets.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="login-btn"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4" data-testid="my-tickets-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-purple-600" />
              My Requests
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Track your service bookings and requests
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Push Notification Toggle */}
            {isPushSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePushToggle}
                disabled={pushLoading}
                className="gap-2"
                data-testid="push-toggle-btn"
              >
                {isSubscribed ? (
                  <>
                    <Bell className="w-4 h-4 text-purple-600" />
                    <span className="hidden sm:inline">Notifications On</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Enable Notifications</span>
                  </>
                )}
              </Button>
            )}
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTickets}
              disabled={loading}
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'resolved', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              data-testid={`filter-${tab.id}`}
            >
              {tab.label}
              {tab.id === 'all' && ` (${tickets.length})`}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Requests Found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? "You haven't made any service requests yet."
                  : `No ${filter} requests found.`}
              </p>
              <Button 
                onClick={() => window.location.href = '/services'}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="browse-services-btn"
              >
                Browse Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.map(ticket => (
                <TicketCard
                  key={ticket.ticket_id}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                  isSelected={selectedTicket?.ticket_id === ticket.ticket_id}
                />
              ))}
            </div>
            
            {/* Ticket Detail (Desktop: Side panel, Mobile: Modal-like) */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              {selectedTicket ? (
                <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
              ) : (
                <Card className="hidden lg:block">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a request to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
