/**
 * ConciergeQueue.jsx
 * Concierge® Order Queue Management Dashboard
 * 
 * Features:
 * - Order overview with smart filtering
 * - Task board with drag-and-drop
 * - Pet profile integration
 * - Timeline tracking
 * - Quick actions (assign, status update)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Clock, CheckCircle, AlertTriangle, User, Calendar,
  ChevronRight, ChevronDown, Filter, Search, RefreshCw, Plus,
  Phone, Mail, MapPin, PawPrint, Star, Bell, Package, Truck,
  Users, TrendingUp, Activity, Timer, ArrowRight, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Pillar colours and icons
const PILLAR_CONFIG = {
  celebrate: { colour: 'bg-amber-500', emoji: '🎂', name: 'Celebrate' },
  dine: { colour: 'bg-orange-500', emoji: '🍽️', name: 'Dine' },
  stay: { colour: 'bg-blue-500', emoji: '🏨', name: 'Stay' },
  travel: { colour: 'bg-cyan-500', emoji: '✈️', name: 'Travel' },
  care: { colour: 'bg-pink-500', emoji: '💊', name: 'Care' },
  enjoy: { colour: 'bg-green-500', emoji: '🎾', name: 'Enjoy' },
  fit: { colour: 'bg-red-500', emoji: '🏋️', name: 'Fit' },
  learn: { colour: 'bg-purple-500', emoji: '📚', name: 'Learn' },
  paperwork: { colour: 'bg-gray-500', emoji: '📋', name: 'Paperwork' },
  advisory: { colour: 'bg-indigo-500', emoji: '💡', name: 'Advisory' },
  emergency: { colour: 'bg-red-600', emoji: '🚨', name: 'Emergency' },
  farewell: { colour: 'bg-violet-500', emoji: '🌈', name: 'Farewell' },
  adopt: { colour: 'bg-teal-500', emoji: '🐕', name: 'Adopt' },
  shop: { colour: 'bg-emerald-500', emoji: '🛒', name: 'Shop' },
};

const PRIORITY_CONFIG = {
  urgent: { colour: 'bg-red-600 text-white', label: 'Urgent' },
  high: { colour: 'bg-orange-500 text-white', label: 'High' },
  normal: { colour: 'bg-blue-500 text-white', label: 'Normal' },
  low: { colour: 'bg-gray-400 text-white', label: 'Low' },
};

const STATUS_CONFIG = {
  pending: { colour: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { colour: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  assigned: { colour: 'bg-purple-100 text-purple-800', label: 'Assigned' },
  in_progress: { colour: 'bg-indigo-100 text-indigo-800', label: 'In Progress' },
  awaiting_customer: { colour: 'bg-orange-100 text-orange-800', label: 'Awaiting Customer' },
  completed: { colour: 'bg-green-100 text-green-800', label: 'Completed' },
  cancelled: { colour: 'bg-red-100 text-red-800', label: 'Cancelled' },
};

const ConciergeQueue = ({ authHeaders }) => {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders, tasks, timeline
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/dashboard`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  }, [authHeaders]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      let url = `${API_URL}/api/concierge/orders?limit=50`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterPillar) url += `&pillar=${filterPillar}`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [authHeaders, filterStatus, filterPillar, filterPriority]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/tasks?limit=50`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [authHeaders]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchOrders(), fetchTasks()]);
      setLoading(false);
    };
    loadData();
  }, [fetchDashboard, fetchOrders, fetchTasks]);

  // Refresh when filters change
  useEffect(() => {
    fetchOrders();
  }, [filterStatus, filterPillar, filterPriority, fetchOrders]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchOrders();
        fetchDashboard();
        if (selectedOrder?.order_id === orderId) {
          fetchOrderDetails(orderId);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/tasks/${taskId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchTasks();
        fetchDashboard();
        if (selectedOrder) {
          fetchOrderDetails(selectedOrder.order_id);
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/orders/${orderId}`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder({ ...data.order, tasks: data.tasks, linked_ticket: data.linked_ticket });
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7" />
              Concierge® Order Queue
            </h1>
            <p className="text-teal-100 mt-1">Intelligent order management & task execution</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => { fetchDashboard(); fetchOrders(); fetchTasks(); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.orders?.total_pending || 0}</p>
                  <p className="text-sm text-teal-100">Pending Orders</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-300" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.orders?.total_in_progress || 0}</p>
                  <p className="text-sm text-teal-100">In Progress</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-300" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.orders?.completed_today || 0}</p>
                  <p className="text-sm text-teal-100">Completed Today</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-300" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.orders?.urgent_pending || 0}</p>
                  <p className="text-sm text-teal-100">Urgent</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Orders List */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'orders' 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'tasks' 
                  ? 'text-teal-600 border-b-2 border-teal-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tasks ({tasks.length})
            </button>
          </div>

          {/* Filters */}
          <div className="p-3 border-b bg-gray-50 flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPillar} onValueChange={setFilterPillar}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Pillars" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Pillars</SelectItem>
                {Object.entries(PILLAR_CONFIG).map(([id, config]) => (
                  <SelectItem key={id} value={id}>{config.emoji} {config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="normal">🔵 Normal</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'orders' ? (
              orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders found</p>
                </div>
              ) : (
                orders.map((order) => {
                  const pillarConfig = PILLAR_CONFIG[order.pillar] || PILLAR_CONFIG.shop;
                  const priorityConfig = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.normal;
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <div
                      key={order.order_id}
                      onClick={() => fetchOrderDetails(order.order_id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colours ${
                        selectedOrder?.order_id === order.order_id ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${pillarConfig.colour} flex items-center justify-center text-white text-lg`}>
                            {pillarConfig.emoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{order.order_id}</span>
                              <Badge className={priorityConfig.colour + ' text-xs'}>
                                {priorityConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {order.pet_profile?.name && (
                                <span className="flex items-center gap-1">
                                  <PawPrint className="w-3 h-3" />
                                  {order.pet_profile.name}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={statusConfig.colour}>{statusConfig.label}</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(order.service_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              // Tasks tab
              tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks found</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const pillarConfig = PILLAR_CONFIG[task.pillar] || PILLAR_CONFIG.shop;
                  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
                  
                  return (
                    <div
                      key={task.task_id}
                      className="p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded ${pillarConfig.colour} flex items-center justify-center text-white text-sm`}>
                            {pillarConfig.emoji}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500 font-mono">{task.task_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTaskStatus(task.task_id, 'completed')}
                              className="text-xs h-7"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Complete
                            </Button>
                          )}
                          <Badge className={task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-11">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Due: {formatDate(task.scheduled_date)}
                      </p>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Order Details Panel */}
        <div className="w-1/2 bg-white flex flex-col">
          {selectedOrder ? (
            <>
              {/* Order Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedOrder.order_id}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={PILLAR_CONFIG[selectedOrder.pillar]?.colour + ' text-white'}>
                        {PILLAR_CONFIG[selectedOrder.pillar]?.emoji} {PILLAR_CONFIG[selectedOrder.pillar]?.name}
                      </Badge>
                      <Badge className={PRIORITY_CONFIG[selectedOrder.priority]?.colour}>
                        {PRIORITY_CONFIG[selectedOrder.priority]?.label}
                      </Badge>
                      <Badge className={STATUS_CONFIG[selectedOrder.status]?.colour}>
                        {STATUS_CONFIG[selectedOrder.status]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.order_id, 'confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.order_id, 'in_progress')}>
                        Start
                      </Button>
                    )}
                    {selectedOrder.status === 'in_progress' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus(selectedOrder.order_id, 'completed')}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Pet Profile */}
                {selectedOrder.pet_profile && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <PawPrint className="w-4 h-4" /> Pet Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl">
                          🐕
                        </div>
                        <div>
                          <p className="font-bold text-lg">{selectedOrder.pet_profile.name}</p>
                          <p className="text-sm text-gray-600">
                            {selectedOrder.pet_profile.breed} • {selectedOrder.pet_profile.age_category} • {selectedOrder.pet_profile.size_category}
                          </p>
                          {selectedOrder.pet_profile.allergies?.length > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              ⚠️ Allergies: {selectedOrder.pet_profile.allergies.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Details */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Service Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Date</span>
                      <span className="font-medium">{formatDate(selectedOrder.service_date)}</span>
                    </div>
                    {selectedOrder.service_time && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Time</span>
                        <span className="font-medium">{selectedOrder.service_time}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Source</span>
                      <span className="font-medium capitalize">{selectedOrder.source}</span>
                    </div>
                    {selectedOrder.special_instructions && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm">
                        <p className="font-medium text-yellow-800">Special Instructions:</p>
                        <p className="text-yellow-700">{selectedOrder.special_instructions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tasks */}
                {selectedOrder.tasks?.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Tasks ({selectedOrder.tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-3">
                        {selectedOrder.tasks.map((task, idx) => (
                          <div key={task.task_id} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              task.status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {task.status === 'completed' ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'font-medium'}`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(task.scheduled_date)}</p>
                            </div>
                            {task.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTaskStatus(task.task_id, 'completed')}
                                className="h-7 text-xs"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                {selectedOrder.timeline?.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-3">
                        {selectedOrder.timeline.slice().reverse().map((event, idx) => (
                          <div key={idx} className="flex gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                            <div>
                              <p className="font-medium">{event.event.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(event.timestamp)} {formatTime(event.timestamp)}
                              </p>
                              {event.details && (
                                <p className="text-xs text-gray-600 mt-1">{event.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Linked Ticket */}
                {selectedOrder.linked_ticket && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Linked Ticket
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{selectedOrder.linked_ticket.ticket_id}</p>
                          <p className="text-xs text-gray-500">{selectedOrder.linked_ticket.subject}</p>
                        </div>
                        <Badge>{selectedOrder.linked_ticket.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select an order to view details</p>
                <p className="text-sm mt-2">Click on any order from the list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConciergeQueue;
