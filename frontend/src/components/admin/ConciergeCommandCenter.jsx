import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ArrowLeft, Search, Filter, RefreshCw, Clock, User, PawPrint,
  AlertCircle, CheckCircle, MessageCircle, Mail, Phone, Crown,
  Package, Inbox, Heart, Cake, Utensils, Plane, Home, Briefcase,
  ChevronRight, Send, Edit, Flag, Link2, Bell, History, Brain,
  ShoppingBag, Tag, Calendar, X, Check, Loader2, Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Source icons and colors
const SOURCE_CONFIG = {
  mira: { icon: Brain, color: 'purple', label: 'Mira Request', bg: 'bg-purple-100' },
  ticket: { icon: Briefcase, color: 'blue', label: 'Service Desk', bg: 'bg-blue-100' },
  order: { icon: Package, color: 'green', label: 'Order', bg: 'bg-green-100' },
  inbox: { icon: Inbox, color: 'orange', label: 'Inbox', bg: 'bg-orange-100' },
  health_alert: { icon: Heart, color: 'red', label: 'Health Alert', bg: 'bg-red-100' },
  celebration: { icon: Cake, color: 'pink', label: 'Birthday', bg: 'bg-pink-100' }
};

// Priority colors
const PRIORITY_CONFIG = {
  urgent: { color: 'red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
  high: { color: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
  medium: { color: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  low: { color: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' }
};

/**
 * Concierge Command Center
 * "The Command Center is not a dashboard. It is the concierge's desk.
 * Everything opens into it, nothing pulls you away from it."
 */
const ConciergeCommandCenter = ({ agentId, agentName, isAdminMode = false }) => {
  // Queue state
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attention, setAttention] = useState({});
  const [buckets, setBuckets] = useState({});
  
  // Filters (preserved on back navigation)
  const [filters, setFilters] = useState({
    source: 'all',
    priority: null,
    status: null,
    search: ''
  });
  
  // Selected item panel
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Scroll position preservation
  const scrollRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Load queue
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_URL}/api/concierge/queue?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data.items || []);
        setAttention(data.attention || {});
        setBuckets(data.buckets || {});
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Load item detail
  const loadItemDetail = async (ticketId) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setItemDetail(data);
        // Pre-fill draft if exists
        if (data.item?.auto_draft?.content) {
          setDraft(data.item.auto_draft.content);
        }
      }
    } catch (error) {
      console.error('Failed to load item detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open item (preserve scroll)
  const openItem = (item) => {
    scrollPositionRef.current = scrollRef.current?.scrollTop || 0;
    setSelectedItem(item);
    setDraft('');
    setInternalNotes('');
    setResolutionNotes('');
    loadItemDetail(item.ticket_id);
  };

  // Close panel (restore scroll)
  const closePanel = () => {
    setSelectedItem(null);
    setItemDetail(null);
    // Restore scroll position
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollPositionRef.current;
      }
    }, 50);
  };

  // Actions
  const claimItem = async () => {
    if (!selectedItem) return;
    setActionLoading('claim');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, agent_name: agentName })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const unclaimItem = async () => {
    if (!selectedItem) return;
    setActionLoading('unclaim');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/unclaim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, agent_name: agentName })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Unclaim failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const generateDraft = async () => {
    if (!selectedItem) return;
    setDraftLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/generate-draft`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setDraft(data.draft);
          setResolutionNotes(data.draft);
        }
      }
    } catch (error) {
      console.error('Draft generation failed:', error);
    } finally {
      setDraftLoading(false);
    }
  };

  const resolveItem = async (sendVia) => {
    if (!selectedItem || !resolutionNotes.trim()) {
      alert('Please enter resolution notes before resolving.');
      return;
    }
    setActionLoading('resolve');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolutionNotes,
          internal_notes: internalNotes,
          send_via: sendVia,
          agent_id: agentId,
          agent_name: agentName
        })
      });
      if (response.ok) {
        closePanel();
        loadQueue();
      }
    } catch (error) {
      console.error('Resolve failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const escalateItem = async () => {
    const reason = prompt('Escalation reason:');
    if (!reason) return;
    setActionLoading('escalate');
    try {
      const response = await fetch(`${API_URL}/api/concierge/item/${selectedItem.ticket_id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: reason, agent_id: agentId, agent_name: agentName, is_internal: true })
      });
      if (response.ok) {
        loadQueue();
        loadItemDetail(selectedItem.ticket_id);
      }
    } catch (error) {
      console.error('Escalate failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Render queue item
  const QueueItem = ({ item }) => {
    const sourceConfig = SOURCE_CONFIG[item.source_type] || SOURCE_CONFIG.ticket;
    const priorityConfig = PRIORITY_CONFIG[item.priority_bucket] || PRIORITY_CONFIG.medium;
    const SourceIcon = sourceConfig.icon;
    
    return (
      <div
        onClick={() => openItem(item)}
        className={`p-4 bg-white rounded-lg border hover:shadow-md cursor-pointer transition-all ${
          item.sla_breached ? 'border-red-400 bg-red-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Source Icon */}
          <div className={`p-2 rounded-lg ${sourceConfig.bg}`}>
            <SourceIcon className={`w-5 h-5 text-${sourceConfig.color}-600`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-500">{item.ticket_id}</span>
              <Badge className={`text-xs ${priorityConfig.bg} ${priorityConfig.text} border-0`}>
                {item.priority_bucket}
              </Badge>
              {item.sla_breached && (
                <Badge variant="destructive" className="text-xs">SLA BREACH</Badge>
              )}
            </div>
            
            <p className="font-medium text-gray-800 truncate">
              {item.original_request?.slice(0, 80) || 'No description'}...
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {item.member?.name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.member.name}
                </span>
              )}
              {item.pets && item.pets.length > 0 && (
                <span className="flex items-center gap-1">
                  <PawPrint className="w-3 h-3" />
                  {item.pets.map(p => p.name).join(', ')}
                </span>
              )}
              {item.created_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  };

  // If item is selected, show the detail panel
  if (selectedItem) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Back Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={closePanel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Command Center
          </Button>
          <div className="flex-1" />
          <Badge className={SOURCE_CONFIG[selectedItem.source_type]?.bg || 'bg-gray-100'}>
            {selectedItem.source_label || selectedItem.source_type}
          </Badge>
          <span className="font-mono text-sm text-gray-500">{selectedItem.ticket_id}</span>
        </div>

        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* LEFT COLUMN: Member & Pet Snapshot + Request */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* A. Member & Pet Snapshot */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Member Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {itemDetail?.member_snapshot ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{itemDetail.member_snapshot.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                {itemDetail.member_snapshot.membership_tier}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {itemDetail.member_snapshot.email}
                          </p>
                          {itemDetail.member_snapshot.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {itemDetail.member_snapshot.phone}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No member info</p>
                    )}
                    
                    {/* Pets */}
                    {itemDetail?.pets_snapshot?.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Pets</p>
                        <div className="space-y-2">
                          {itemDetail.pets_snapshot.map((pet, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <PawPrint className="w-4 h-4 text-purple-500" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{pet.name}</p>
                                <p className="text-xs text-gray-500">{pet.breed}</p>
                              </div>
                              {pet.allergies?.length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Allergies
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* B. The Request */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      The Request
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedItem.original_request || 'No request details'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {selectedItem.created_at && new Date(selectedItem.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(itemDetail?.timeline || []).slice(0, 5).map((event, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5" />
                          <div>
                            <span className="font-medium">{event.action}</span>
                            <span className="text-gray-500 ml-1">
                              by {event.performed_by}
                            </span>
                            {event.timestamp && (
                              <p className="text-gray-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MIDDLE COLUMN: Mira's Intelligence */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                      <Brain className="w-4 h-4" />
                      Mira's Intelligence
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Past Orders */}
                    {itemDetail?.mira_intelligence?.past_orders?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Past Orders
                        </p>
                        <div className="space-y-2">
                          {itemDetail.mira_intelligence.past_orders.slice(0, 3).map((order, idx) => (
                            <div key={idx} className="p-2 bg-white rounded text-xs">
                              <p className="font-medium">Order #{order.order_id}</p>
                              <p className="text-gray-500">₹{order.total}</p>
                              {order.items?.slice(0, 2).map((item, i) => (
                                <p key={i} className="text-gray-600">• {item.name}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Memories */}
                    {itemDetail?.mira_intelligence?.memories?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> What We Remember
                        </p>
                        <div className="space-y-1">
                          {itemDetail.mira_intelligence.memories.slice(0, 4).map((mem, idx) => (
                            <div key={idx} className="p-2 bg-white rounded text-xs">
                              <p className="text-gray-700">{mem.content}</p>
                              {mem.pet_name && (
                                <span className="text-purple-500 text-xs">🐾 {mem.pet_name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pet Soul Insights */}
                    {itemDetail?.mira_intelligence?.pet_soul_insights?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                          <Heart className="w-3 h-3" /> Pet Soul™ Insights
                        </p>
                        {itemDetail.mira_intelligence.pet_soul_insights.map((insight, idx) => (
                          <div key={idx} className="p-2 bg-white rounded text-xs mb-1">
                            <p className="font-medium">{insight.pet_name}</p>
                            {insight.persona && <p>Persona: {insight.persona}</p>}
                            {insight.favorite_flavors?.length > 0 && (
                              <p>Loves: {insight.favorite_flavors.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Generate Draft Button */}
                    <Button 
                      onClick={generateDraft} 
                      disabled={draftLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      {draftLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Draft</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: Action & Resolution */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Status & Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={PRIORITY_CONFIG[selectedItem.priority_bucket]?.bg}>
                        {selectedItem.priority_bucket} priority
                      </Badge>
                      <Badge variant="outline">{selectedItem.status || 'pending'}</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {!selectedItem.assigned_to ? (
                        <Button 
                          onClick={claimItem}
                          disabled={actionLoading === 'claim'}
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === 'claim' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim'}
                        </Button>
                      ) : selectedItem.assigned_to === agentId ? (
                        <Button 
                          onClick={unclaimItem}
                          disabled={actionLoading === 'unclaim'}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === 'unclaim' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unclaim'}
                        </Button>
                      ) : (
                        <Badge variant="secondary">Claimed by {selectedItem.assigned_name}</Badge>
                      )}
                      
                      <Button 
                        onClick={escalateItem}
                        disabled={actionLoading === 'escalate'}
                        variant="outline"
                        size="sm"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Panel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Internal Notes */}
                    <div>
                      <label className="text-xs font-medium text-gray-600">Internal Notes (not shown to member)</label>
                      <Textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Notes for team only..."
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>

                    {/* Resolution Notes (member-facing) */}
                    <div>
                      <label className="text-xs font-medium text-gray-600">Message to Member *</label>
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="This will be sent to the member..."
                        rows={4}
                        className="mt-1 text-sm"
                      />
                      {draft && !resolutionNotes && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 text-purple-600"
                          onClick={() => setResolutionNotes(draft)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" /> Use AI Draft
                        </Button>
                      )}
                    </div>

                    {/* Send Options */}
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">Resolve & Send via:</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => resolveItem('mira')}
                          disabled={actionLoading === 'resolve' || !resolutionNotes.trim()}
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Brain className="w-4 h-4 mr-1" /> Mira
                        </Button>
                        <Button
                          onClick={() => resolveItem('email')}
                          disabled={actionLoading === 'resolve' || !resolutionNotes.trim()}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-1" /> Email
                        </Button>
                      </div>
                      {actionLoading === 'resolve' && (
                        <div className="flex items-center justify-center mt-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Resolving...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Queue View
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Attention Strip */}
      {(attention.sla_breaching > 0 || attention.high_unclaimed > 0 || attention.health_overdue > 0) && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center gap-4 text-white text-sm">
          <span className="font-medium">⚠️ Needs Attention:</span>
          {attention.sla_breaching > 0 && (
            <button onClick={() => setFilters({ ...filters, status: 'pending' })} className="hover:underline">
              🔴 {attention.sla_breaching} SLA breach
            </button>
          )}
          {attention.high_unclaimed > 0 && (
            <button onClick={() => setFilters({ ...filters, priority: 'high' })} className="hover:underline">
              🟠 {attention.high_unclaimed} high priority unclaimed
            </button>
          )}
          {attention.health_overdue > 0 && (
            <button onClick={() => setFilters({ ...filters, source: 'health' })} className="hover:underline">
              💉 {attention.health_overdue} health overdue
            </button>
          )}
          {attention.birthdays_upcoming > 0 && (
            <button onClick={() => setFilters({ ...filters, source: 'celebration' })} className="hover:underline">
              🎂 {attention.birthdays_upcoming} birthdays
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🎯 Concierge Command Center
          </h1>
          <Button onClick={loadQueue} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Priority Buckets */}
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(buckets).map(([bucket, count]) => (
            <Button
              key={bucket}
              variant={filters.priority === bucket ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, priority: filters.priority === bucket ? null : bucket })}
              className={filters.priority === bucket ? PRIORITY_CONFIG[bucket]?.bg : ''}
            >
              {bucket === 'urgent' && '🔴'}
              {bucket === 'high' && '🟠'}
              {bucket === 'medium' && '🟡'}
              {bucket === 'low' && '🟢'}
              <span className="ml-1 capitalize">{bucket}</span>
              <Badge variant="secondary" className="ml-2">{count}</Badge>
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tickets, members..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Sources</option>
            <option value="mira">🤖 Mira Requests</option>
            <option value="order">📦 Orders</option>
            <option value="inbox">📥 Inbox</option>
            <option value="health">💉 Health Alerts</option>
            <option value="celebration">🎂 Birthdays</option>
            <option value="tickets">🎫 Service Desk</option>
          </select>

          {(filters.priority || filters.source !== 'all' || filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ source: 'all', priority: null, status: null, search: '' })}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Queue */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">All caught up!</h3>
            <p className="text-gray-500">No items matching your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <QueueItem key={item.ticket_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciergeCommandCenter;
