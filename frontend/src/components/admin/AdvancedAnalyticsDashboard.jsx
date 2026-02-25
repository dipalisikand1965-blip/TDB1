import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { API_URL } from '../../utils/api';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Clock,
  CheckCircle, AlertTriangle, PieChart, Calendar, Download, RefreshCw,
  Target, Award, Star, Zap, Package, Ticket, ArrowUp, ArrowDown
} from 'lucide-react';

// Pillar configuration with colors - THE 14 PILLARS
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', color: 'bg-pink-500' },
  { id: 'dine', name: 'Dine', icon: '🍽️', color: 'bg-amber-500' },
  { id: 'stay', name: 'Stay', icon: '🏨', color: 'bg-blue-500' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'bg-cyan-500' },
  { id: 'care', name: 'Care', icon: '💊', color: 'bg-red-500' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', color: 'bg-violet-500' },
  { id: 'fit', name: 'Fit', icon: '🏃', color: 'bg-green-500' },
  { id: 'learn', name: 'Learn', icon: '🎓', color: 'bg-teal-500' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', color: 'bg-slate-500' },
  { id: 'advisory', name: 'Advisory', icon: '📋', color: 'bg-gray-600' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: 'bg-red-600' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', color: 'bg-rose-400' },
  { id: 'adopt', name: 'Adopt', icon: '🐾', color: 'bg-purple-500' },
  { id: 'shop', name: 'Shop', icon: '🛒', color: 'bg-orange-500' }
];

const AdvancedAnalyticsDashboard = ({ authHeaders }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState({
    revenue: {},
    tickets: {},
    agents: [],
    pillars: [],
    sla: {},
    nps: {}
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch multiple analytics endpoints in parallel
      const [revenueRes, ticketsRes, agentsRes, npsRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/revenue?days=${dateRange}`, { headers: authHeaders }),
        fetch(`${API_URL}/api/analytics/tickets?days=${dateRange}`, { headers: authHeaders }),
        fetch(`${API_URL}/api/analytics/agents?days=${dateRange}`, { headers: authHeaders }),
        fetch(`${API_URL}/api/concierge/nps/stats?days=${dateRange}`, { headers: authHeaders })
      ]);

      const [revenue, tickets, agents, nps] = await Promise.all([
        revenueRes.ok ? revenueRes.json() : {},
        ticketsRes.ok ? ticketsRes.json() : {},
        agentsRes.ok ? agentsRes.json() : { agents: [] },
        npsRes.ok ? npsRes.json() : {}
      ]);

      setAnalytics({
        revenue: revenue || {},
        tickets: tickets || {},
        agents: agents.agents || [],
        pillars: tickets.by_pillar || [],
        sla: tickets.sla || {},
        nps: nps || {}
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Generate CSV export
    const csvData = [];
    csvData.push(['Advanced Analytics Report', '', '', '']);
    csvData.push(['Period', `Last ${dateRange} days`, '', '']);
    csvData.push(['Generated', new Date().toISOString(), '', '']);
    csvData.push(['', '', '', '']);
    csvData.push(['REVENUE SUMMARY', '', '', '']);
    csvData.push(['Total Revenue', analytics.revenue.total || 0, '', '']);
    csvData.push(['Orders', analytics.revenue.orders || 0, '', '']);
    csvData.push(['Average Order Value', analytics.revenue.average || 0, '', '']);
    csvData.push(['', '', '', '']);
    csvData.push(['TICKET SUMMARY', '', '', '']);
    csvData.push(['Total Tickets', analytics.tickets.total || 0, '', '']);
    csvData.push(['Resolved', analytics.tickets.resolved || 0, '', '']);
    csvData.push(['Open', analytics.tickets.open || 0, '', '']);
    csvData.push(['SLA Compliance %', analytics.sla.compliance_rate || 0, '', '']);
    csvData.push(['', '', '', '']);
    csvData.push(['NPS SUMMARY', '', '', '']);
    csvData.push(['NPS Score', analytics.nps.nps_score || 'N/A', '', '']);
    csvData.push(['Total Responses', analytics.nps.total_responses || 0, '', '']);
    csvData.push(['Promoters', analytics.nps.promoters || 0, '', '']);
    csvData.push(['Detractors', analytics.nps.detractors || 0, '', '']);

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            Advanced Analytics
          </h2>
          <p className="text-gray-500 text-sm">Revenue, Performance & Insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="revenue">💰 Revenue</TabsTrigger>
          <TabsTrigger value="agents">👥 Agent Performance</TabsTrigger>
          <TabsTrigger value="sla">⏱️ SLA Compliance</TabsTrigger>
          <TabsTrigger value="nps">⭐ NPS & Satisfaction</TabsTrigger>
          <TabsTrigger value="pillars">🏛️ Pillar Breakdown</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  {analytics.revenue.trend > 0 ? (
                    <Badge className="bg-green-100 text-green-700">
                      <ArrowUp className="w-3 h-3 mr-1" />+{analytics.revenue.trend}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <ArrowDown className="w-3 h-3 mr-1" />{analytics.revenue.trend}%
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ₹{(analytics.revenue.total || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-green-600">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">
                    {analytics.tickets.resolved || 0} resolved
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-700">{analytics.tickets.total || 0}</p>
                <p className="text-sm text-blue-600">Total Tickets</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 text-purple-600" />
                  <Badge className={`${
                    (analytics.nps.nps_score || 0) >= 50 ? 'bg-green-100 text-green-700' :
                    (analytics.nps.nps_score || 0) >= 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {analytics.nps.nps_score >= 50 ? 'Excellent' : analytics.nps.nps_score >= 0 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {analytics.nps.nps_score ?? 'N/A'}
                </p>
                <p className="text-sm text-purple-600">NPS Score</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8 text-orange-600" />
                  <Badge className={`${
                    (analytics.sla.compliance_rate || 0) >= 90 ? 'bg-green-100 text-green-700' :
                    (analytics.sla.compliance_rate || 0) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {(analytics.sla.compliance_rate || 0) >= 90 ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-orange-700">
                  {analytics.sla.compliance_rate || 0}%
                </p>
                <p className="text-sm text-orange-600">SLA Compliance</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">{analytics.revenue.orders || 0}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">{analytics.revenue.customers || 0}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">₹{analytics.revenue.average || 0}</p>
                <p className="text-xs text-gray-500">Avg. Order</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">{analytics.tickets.avg_resolution || 0}h</p>
                <p className="text-xs text-gray-500">Avg. Resolution</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">{analytics.nps.promoters || 0}</p>
                <p className="text-xs text-gray-500">Promoters</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-bold">{analytics.sla.breaches || 0}</p>
                <p className="text-xs text-gray-500">SLA Breaches</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Revenue by Pillar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PILLARS.slice(0, 8).map((pillar) => {
                    const pillarData = analytics.pillars?.find(p => p.id === pillar.id) || {};
                    const revenue = pillarData.revenue || 0;
                    const maxRevenue = Math.max(...(analytics.pillars?.map(p => p.revenue || 0) || [1]));
                    const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={pillar.id} className="flex items-center gap-3">
                        <span className="w-8 text-center">{pillar.icon}</span>
                        <span className="w-24 text-sm font-medium">{pillar.name}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${pillar.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm font-semibold">
                          ₹{revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Revenue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {PILLARS.slice(0, 8).map((pillar) => {
                    const pillarData = analytics.pillars?.find(p => p.id === pillar.id) || {};
                    const percentage = pillarData.percentage || 0;
                    
                    return (
                      <div key={pillar.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                        <div className={`w-3 h-3 rounded-full ${pillar.color}`} />
                        <span className="text-sm">{pillar.name}</span>
                        <span className="ml-auto text-sm font-semibold">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Agent Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Rank</th>
                      <th className="pb-3 font-medium">Agent</th>
                      <th className="pb-3 font-medium text-center">Tickets Resolved</th>
                      <th className="pb-3 font-medium text-center">Avg. Resolution Time</th>
                      <th className="pb-3 font-medium text-center">SLA Compliance</th>
                      <th className="pb-3 font-medium text-center">NPS Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.agents || []).length > 0 ? (
                      analytics.agents.map((agent, index) => (
                        <tr key={agent.id || index} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </td>
                          <td className="py-3 font-medium">{agent.name || 'Unknown'}</td>
                          <td className="py-3 text-center">{agent.tickets_resolved || 0}</td>
                          <td className="py-3 text-center">{agent.avg_resolution_time || 0}h</td>
                          <td className="py-3 text-center">
                            <Badge className={`${
                              (agent.sla_compliance || 0) >= 90 ? 'bg-green-100 text-green-700' :
                              (agent.sla_compliance || 0) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {agent.sla_compliance || 0}%
                            </Badge>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`font-semibold ${
                              (agent.nps_score || 0) >= 50 ? 'text-green-600' :
                              (agent.nps_score || 0) >= 0 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {agent.nps_score ?? 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No agent data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Compliance Tab */}
        <TabsContent value="sla">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  SLA Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600">Met SLA</p>
                      <p className="text-2xl font-bold text-green-700">{analytics.sla.met || 0}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600">Breached SLA</p>
                      <p className="text-2xl font-bold text-red-700">{analytics.sla.breaches || 0}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-yellow-600">At Risk</p>
                      <p className="text-2xl font-bold text-yellow-700">{analytics.sla.at_risk || 0}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  SLA by Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['urgent', 'high', 'medium', 'low'].map((priority) => {
                    const data = analytics.sla?.by_priority?.[priority] || { compliance: 0 };
                    const colors = {
                      urgent: 'bg-red-500',
                      high: 'bg-orange-500',
                      medium: 'bg-yellow-500',
                      low: 'bg-green-500'
                    };
                    
                    return (
                      <div key={priority}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{priority}</span>
                          <span>{data.compliance || 0}% compliance</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[priority]} transition-all`}
                            style={{ width: `${data.compliance || 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NPS Tab */}
        <TabsContent value="nps">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  Net Pawmoter Score (NPS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 py-8">
                  <div className="text-center">
                    <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {analytics.nps.nps_score ?? 'N/A'}
                    </p>
                    <p className="text-gray-500 mt-2">NPS Score</p>
                    <Badge className={`mt-2 ${
                      (analytics.nps.nps_score || 0) >= 50 ? 'bg-green-100 text-green-700' :
                      (analytics.nps.nps_score || 0) >= 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {(analytics.nps.nps_score || 0) >= 50 ? '🎉 Excellent' : 
                       (analytics.nps.nps_score || 0) >= 0 ? '👍 Good' : '⚠️ Needs Improvement'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{analytics.nps.promoters || 0}</p>
                    <p className="text-sm text-green-600">Promoters (9-10)</p>
                    <p className="text-xs text-gray-500">{analytics.nps.promoters_percent || 0}%</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">{analytics.nps.passives || 0}</p>
                    <p className="text-sm text-yellow-600">Passives (7-8)</p>
                    <p className="text-xs text-gray-500">{analytics.nps.passives_percent || 0}%</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{analytics.nps.detractors || 0}</p>
                    <p className="text-sm text-red-600">Detractors (0-6)</p>
                    <p className="text-xs text-gray-500">{analytics.nps.detractors_percent || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Total Responses</p>
                    <p className="text-2xl font-bold text-purple-700">{analytics.nps.total_responses || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-700">{analytics.nps.average_score || 'N/A'}/10</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-700">{analytics.nps.response_rate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PILLARS.map((pillar) => {
              const data = analytics.pillars?.find(p => p.id === pillar.id) || {};
              
              return (
                <Card key={pillar.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${pillar.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                        {pillar.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{pillar.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {data.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-semibold">₹{(data.revenue || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Orders</p>
                        <p className="font-semibold">{data.orders || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tickets</p>
                        <p className="font-semibold">{data.tickets || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">SLA %</p>
                        <p className="font-semibold">{data.sla_compliance || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
