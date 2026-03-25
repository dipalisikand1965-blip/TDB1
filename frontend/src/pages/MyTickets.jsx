import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Ticket, Clock, CheckCircle, AlertCircle, MessageCircle, 
  ChevronRight, ArrowLeft, Send, Timer, RefreshCw, PawPrint,
  Inbox, Package, Brain, Heart, Bell, BellOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'sonner';
import { API_URL } from '../utils/api';

// SLA Timer Component
const SLATimer = ({ createdAt, priority }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  const SLA_HOURS = { urgent: 2, high: 4, medium: 24, low: 48 };
  
  useEffect(() => {
    const slaHours = SLA_HOURS[priority] || 24;
    
    const calculateTimeLeft = () => {
      if (!createdAt) return null;
      
      const created = new Date(createdAt);
      const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline - now;
      
      return {
        total: diff,
        hours: Math.floor(Math.abs(diff) / (1000 * 60 * 60)),
        minutes: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
        breached: diff < 0
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [createdAt, priority]);
  
  if (!timeLeft) return null;
  
  return (
    <span className={`text-xs font-mono ${timeLeft.breached ? 'text-red-600' : 'text-gray-500'}`}>
      {timeLeft.breached ? 'Being handled' : `Est. ${timeLeft.hours}h ${timeLeft.minutes}m`}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const configs = {
    open: { color: 'bg-blue-100 text-blue-700', label: 'Open' },
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'In Progress' },
    resolved: { color: 'bg-green-100 text-green-700', label: 'Resolved' },
    closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed' }
  };
  
  const config = configs[status] || configs.open;
  
  return (
    <Badge className={`${config.color} border-0`}>
      {config.label}
    </Badge>
  );
};

// Source icon component
const SourceIcon = ({ source }) => {
  const icons = {
    service_desk: <Brain className="w-4 h-4 text-purple-500" />,
    mira: <Brain className="w-4 h-4 text-purple-500" />,
    order: <Package className="w-4 h-4 text-green-500" />,
    regular: <Ticket className="w-4 h-4 text-blue-500" />,
    health: <Heart className="w-4 h-4 text-red-500" />
  };
  
  return icons[source] || <Inbox className="w-4 h-4 text-gray-500" />;
};

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Get user from auth context
  const { user, loading: authLoading } = useAuth();
  const userEmail = user?.email || '';
  
  // Push notifications hook
  const {
    isPushSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    loading: pushLoading
  } = usePushNotifications(user?.id);
  
  // Handle push notification toggle
  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success('Notifications disabled');
    } else {
      const success = await subscribe({ ticket_updates: true });
      if (success) {
        toast.success('Notifications enabled! You\'ll be notified of ticket updates.');
      } else {
        toast.error('Failed to enable notifications. Please check browser permissions.');
      }
    }
  };
  
  // Fetch tickets
  const fetchTickets = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/member/tickets?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setStats(data.stats || { total: 0, open: 0, resolved: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTickets();
  }, [userEmail]);
  
  // Fetch ticket detail
  const fetchTicketDetail = async (ticketId) => {
    if (!userEmail) return;
    
    setLoadingDetail(true);
    try {
      const response = await fetch(
        `${API_URL}/api/concierge/member/ticket/${ticketId}?email=${encodeURIComponent(userEmail)}`
      );
      if (response.ok) {
        const data = await response.json();
        setTicketDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch ticket detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // Open ticket detail
  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    fetchTicketDetail(ticket.ticket_id);
  };
  
  // Close detail view
  const closeDetail = () => {
    setSelectedTicket(null);
    setTicketDetail(null);
  };
  
  // Send reply
  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    setSending(true);
    try {
      const response = await fetch(
        `${API_URL}/api/concierge/member/ticket/${selectedTicket.ticket_id}/reply?email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyMessage })
        }
      );
      
      if (response.ok) {
        setReplyMessage('');
        fetchTicketDetail(selectedTicket.ticket_id);
        fetchTickets(); // Refresh list
        alert('Reply sent successfully!');
      } else {
        alert('Failed to send reply. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Not logged in state - show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Ticket className="w-16 h-16 mx-auto text-purple-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">View Your Tickets</h2>
          <p className="text-gray-500 mb-6">
            Please log in to view and manage your support tickets.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </Card>
      </div>
    );
  }
  
  // Ticket detail view
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={closeDetail}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
            <div className="flex-1" />
            <StatusBadge status={selectedTicket.status} />
            <span className="font-mono text-sm text-gray-500">
              #{selectedTicket.ticket_id?.slice(-8)}
            </span>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : ticketDetail ? (
            <>
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SourceIcon source={ticketDetail.source} />
                    Your Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticketDetail.original_request || 'No description provided'}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(ticketDetail.created_at).toLocaleString()}
                    </span>
                    <SLATimer createdAt={ticketDetail.created_at} priority={ticketDetail.priority} />
                  </div>
                </CardContent>
              </Card>
              
              {/* Communications Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticketDetail.communications?.length > 0 ? (
                    ticketDetail.communications.map((comm, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-lg ${
                          comm.type === 'member_reply' 
                            ? 'bg-purple-50 ml-8' 
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {comm.type === 'member_reply' ? 'You' : 'Concierge® Team'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(comm.at || comm.sent_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comm.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Our concierge® team is reviewing your request.</p>
                      <p className="text-sm">You&apos;ll receive an update soon!</p>
                    </div>
                  )}
                  
                  {/* Reply Box - only if ticket is not resolved */}
                  {!['resolved', 'closed'].includes(ticketDetail.status) && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Add a Reply
                      </label>
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={3}
                        className="mb-2"
                      />
                      <Button 
                        onClick={sendReply}
                        disabled={!replyMessage.trim() || sending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {sending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Resolution (if resolved) */}
              {ticketDetail.status === 'resolved' && ticketDetail.resolution_notes && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-800 whitespace-pre-wrap">
                      {ticketDetail.resolution_notes}
                    </p>
                    <p className="text-sm text-green-600 mt-4">
                      Resolved on {new Date(ticketDetail.resolved_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Could not load ticket details.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Main ticket list view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="w-7 h-7 text-purple-500" />
                My Tickets
              </h1>
              <p className="text-gray-500 mt-1">Track your requests and conversations</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Push Notification Toggle */}
              {isPushSupported && (
                <Button 
                  onClick={handlePushToggle} 
                  variant="outline" 
                  size="sm"
                  disabled={pushLoading}
                  className="gap-2"
                  data-testid="push-toggle-btn"
                >
                  {isSubscribed ? (
                    <>
                      <Bell className="w-4 h-4 text-purple-600" />
                      <span className="hidden sm:inline">Notifs On</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span className="hidden sm:inline">Enable Notifs</span>
                    </>
                  )}
                </Button>
              )}
              <Button onClick={fetchTickets} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Tickets</p>
            </Card>
            <Card className="p-4 text-center bg-blue-50">
              <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
              <p className="text-sm text-blue-600">Open</p>
            </Card>
            <Card className="p-4 text-center bg-green-50">
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-sm text-green-600">Resolved</p>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Ticket List */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket, idx) => (
              <Card 
                key={ticket.ticket_id || idx}
                className="hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => openTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <SourceIcon source={ticket.source} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">
                          #{ticket.ticket_id?.slice(-8)}
                        </span>
                        <StatusBadge status={ticket.status} />
                        {ticket.has_new_reply && (
                          <Badge variant="destructive" className="text-xs">New Reply</Badge>
                        )}
                      </div>
                      
                      <p className="font-medium text-gray-800 truncate">
                        {ticket.original_request?.slice(0, 100) || 'Request'}...
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        {ticket.pets && ticket.pets.length > 0 && (
                          <span className="flex items-center gap-1">
                            <PawPrint className="w-3 h-3" />
                            {ticket.pets.map(p => p.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Tickets Yet</h3>
            <p className="text-gray-500 mt-2">
              When you submit a request to our concierge team, it will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
