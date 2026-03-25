/**
 * LiveConversationThreads - Real-time Conversation Monitoring Dashboard
 * 
 * This component displays all active conversations with Mira in real-time.
 * The Concierge®/Admin can:
 * - See all active conversations with preview
 * - Click to expand full thread
 * - Jump in and respond as human
 * 
 * Flow: User Intent → Service Desk Thread → Admin Notification → Member Notification
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import {
  MessageCircle,
  User,
  Bot,
  Clock,
  Eye,
  Send,
  X,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Headphones,
  PawPrint,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

const LiveConversationThreads = ({ getAuthHeaders }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({
    active_threads: 0,
    needing_attention: 0,
    today_new: 0
  });
  
  // Auto-refresh interval
  const refreshInterval = useRef(null);
  
  // Fetch active threads
  const fetchThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live_threads/active?limit=50`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live_threads/stats/overview`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  // Fetch thread details
  const fetchThreadDetails = async (threadId) => {
    try {
      const response = await fetch(`${API_URL}/api/live_threads/${threadId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedThread(data);
        setShowThreadModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch thread details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive'
      });
    }
  };
  
  // Send concierge reply
  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedThread?.thread?.thread_id) return;
    
    setSending(true);
    try {
      const response = await fetch(
        `${API_URL}/api/live_threads/${selectedThread.thread.thread_id}/reply`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: replyMessage,
            agent_name: 'Concierge®',
            notify_user: true
          })
        }
      );
      
      if (response.ok) {
        toast({
          title: 'Reply Sent',
          description: 'Your message has been delivered to the conversation'
        });
        setReplyMessage('');
        // Refresh thread to show new message
        await fetchThreadDetails(selectedThread.thread.thread_id);
        // Refresh threads list
        await fetchThreads();
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };
  
  // Close thread
  const closeThread = async (threadId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/live_threads/${threadId}/close`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ resolution: 'Closed by concierge' })
        }
      );
      
      if (response.ok) {
        toast({
          title: 'Thread Closed',
          description: 'Conversation has been closed'
        });
        setShowThreadModal(false);
        setSelectedThread(null);
        await fetchThreads();
      }
    } catch (error) {
      console.error('Failed to close thread:', error);
    }
  };
  
  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchThreads();
    fetchStats();
    
    // Auto-refresh every 10 seconds
    refreshInterval.current = setInterval(() => {
      fetchThreads();
      fetchStats();
    }, 10000);
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'with_concierge':
        return <Badge className="bg-purple-500">With Concierge®</Badge>;
      case 'pending_concierge':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Format time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            Live Conversations
          </h2>
          <p className="text-gray-500 mt-1">Monitor all active Mira conversations in real-time</p>
        </div>
        
        <Button 
          onClick={() => { fetchThreads(); fetchStats(); }}
          variant="outline"
          className="flex items-center gap-2"
          data-testid="refresh-threads-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" data-testid="active-threads-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Now</p>
              <p className="text-3xl font-bold text-purple-600">{stats.active_threads}</p>
            </div>
            <MessageCircle className="w-10 h-10 text-purple-200" />
          </div>
        </Card>
        
        <Card className="p-4" data-testid="attention-needed-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Need Attention</p>
              <p className="text-3xl font-bold text-orange-600">{stats.needing_attention}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-200" />
          </div>
        </Card>
        
        <Card className="p-4" data-testid="today-new-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today New</p>
              <p className="text-3xl font-bold text-green-600">{stats.today_new}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-200" />
          </div>
        </Card>
        
        <Card className="p-4" data-testid="today-closed-stat">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Closed Today</p>
              <p className="text-3xl font-bold text-gray-600">{stats.today_closed || 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-gray-200" />
          </div>
        </Card>
      </div>
      
      {/* Threads List */}
      <Card className="overflow-hidden" data-testid="threads-list-card">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Active Conversation Threads</h3>
          <span className="text-sm text-gray-500">{threads.length} conversations</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
            <p className="mt-2 text-gray-500">Loading conversations...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No active conversations</p>
            <p className="text-sm text-gray-400">New conversations will appear here automatically</p>
          </div>
        ) : (
          <div className="divide-y">
            {threads.map((thread) => (
              <div 
                key={thread.thread_id}
                className="p-4 hover:bg-purple-50/50 cursor-pointer transition-colors"
                onClick={() => fetchThreadDetails(thread.thread_id)}
                data-testid={`thread-row-${thread.thread_id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* User & Pet Info */}
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {thread.user_name || thread.user_email || 'Guest'}
                      </span>
                      {thread.pet_name && (
                        <>
                          <span className="text-gray-400">•</span>
                          <PawPrint className="w-4 h-4 text-pink-400" />
                          <span className="text-gray-700">{thread.pet_name}</span>
                          {thread.pet_breed && (
                            <span className="text-gray-400 text-sm">({thread.pet_breed})</span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Last message preview */}
                    <p className="text-gray-600 text-sm truncate mt-1">
                      {thread.messages?.length > 0 
                        ? thread.messages[thread.messages.length - 1]?.content?.slice(0, 100) 
                        : 'No messages'}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {thread.stats?.total_messages || 0} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(thread.updated_at)}
                      </span>
                      {thread.user_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {thread.user_city}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {getStatusBadge(thread.status)}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Thread Detail Modal */}
      <Dialog open={showThreadModal} onOpenChange={setShowThreadModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-purple-600" />
              Conversation Thread
              {selectedThread?.thread && getStatusBadge(selectedThread.thread.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedThread?.thread && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* User/Pet Info Bar */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {selectedThread.thread.user_name || selectedThread.thread.user_email || 'Guest'}
                  </span>
                </div>
                {selectedThread.thread.pet_name && (
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-pink-500" />
                    <span>{selectedThread.thread.pet_name}</span>
                    {selectedThread.thread.pet_breed && (
                      <span className="text-gray-400">({selectedThread.thread.pet_breed})</span>
                    )}
                  </div>
                )}
                {selectedThread.thread.user_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{selectedThread.thread.user_city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Started {timeAgo(selectedThread.thread.created_at)}</span>
                </div>
              </div>
              
              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50/50"
                data-testid="thread-messages"
              >
                {selectedThread.thread.messages?.map((msg, idx) => (
                  <div 
                    key={msg.id || idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : msg.sender === 'mira'
                            ? 'bg-white border border-purple-200'
                            : 'bg-green-100 border border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                        {msg.sender === 'user' && <User className="w-3 h-3" />}
                        {msg.sender === 'mira' && <Bot className="w-3 h-3 text-purple-500" />}
                        {msg.sender === 'concierge' && <Headphones className="w-3 h-3 text-green-600" />}
                        <span className="capitalize">{msg.sender}</span>
                        <span>•</span>
                        <span>{timeAgo(msg.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Reply Input */}
              {selectedThread.thread.status !== 'closed' && (
                <div className="mt-4 flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply as Concierge®..."
                    className="flex-1 min-h-[60px]"
                    data-testid="concierge-reply-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                  />
                  <Button 
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || sending}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="send-reply-btn"
                  >
                    {sending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowThreadModal(false)}>
              Close
            </Button>
            {selectedThread?.thread?.status !== 'closed' && (
              <Button 
                variant="destructive"
                onClick={() => closeThread(selectedThread.thread.thread_id)}
                data-testid="close-thread-btn"
              >
                Close Thread
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveConversationThreads;
