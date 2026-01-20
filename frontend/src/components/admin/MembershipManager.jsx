import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, Crown, Search, Filter, Download, Upload, Plus, Edit2, 
  Trash2, Gift, Calendar, CreditCard, PawPrint, Star, Award,
  TrendingUp, Clock, Mail, Phone, MapPin, Shield, Sparkles,
  ChevronRight, X, Check, AlertCircle, RefreshCw, Settings,
  Eye, History, MessageSquare, Heart, Zap, Target, Trophy,
  FileText, UserPlus, Send, Ban, CheckCircle, XCircle
} from 'lucide-react';
import { API_URL } from '../../utils/api';

// Doggy-themed membership levels
const MEMBERSHIP_LEVELS = {
  curious_pup: { 
    name: '🐕 Curious Pup', 
    color: 'gray', 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-700',
    description: 'New members exploring the platform',
    minMonths: 0,
    pawPointMultiplier: 1
  },
  loyal_companion: { 
    name: '🦮 Loyal Companion', 
    color: 'blue', 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-700',
    description: 'Active members for 3+ months',
    minMonths: 3,
    pawPointMultiplier: 1.5
  },
  trusted_guardian: { 
    name: '🐕‍🦺 Trusted Guardian', 
    color: 'purple', 
    bgColor: 'bg-purple-100', 
    textColor: 'text-purple-700',
    description: 'Dedicated members for 6+ months',
    minMonths: 6,
    pawPointMultiplier: 2
  },
  pack_leader: { 
    name: '👑 Pack Leader', 
    color: 'amber', 
    bgColor: 'bg-amber-100', 
    textColor: 'text-amber-700',
    description: 'Elite members or 12+ months tenure',
    minMonths: 12,
    pawPointMultiplier: 3
  }
};

// Map old tiers to new doggy names
const TIER_MAP = {
  'free': 'curious_pup',
  'guest': 'curious_pup',
  'pawsome': 'loyal_companion',
  'premium': 'trusted_guardian',
  'vip': 'pack_leader'
};

const MembershipManager = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/customers`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.customers || []);
        calculateStats(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (membersList) => {
    const now = new Date();
    const thisMonth = membersList.filter(m => {
      const created = new Date(m.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });

    setStats({
      total: membersList.length,
      newThisMonth: thisMonth.length,
      curious_pup: membersList.filter(m => getTierKey(m.membership_tier) === 'curious_pup').length,
      loyal_companion: membersList.filter(m => getTierKey(m.membership_tier) === 'loyal_companion').length,
      trusted_guardian: membersList.filter(m => getTierKey(m.membership_tier) === 'trusted_guardian').length,
      pack_leader: membersList.filter(m => getTierKey(m.membership_tier) === 'pack_leader').length,
      totalPawPoints: membersList.reduce((sum, m) => sum + (m.loyalty_points || 0), 0),
      activeSubscriptions: membersList.filter(m => m.membership_expires && new Date(m.membership_expires) > now).length
    });
  };

  const getTierKey = (tier) => {
    return TIER_MAP[tier] || TIER_MAP[tier?.toLowerCase()] || 'curious_pup';
  };

  const updateMemberTier = async (memberId, newTier) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/customers/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_tier: newTier })
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Failed to update tier:', error);
    }
  };

  const adjustPawPoints = async (memberId, points, reason) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/members/${memberId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason })
      });
      if (response.ok) {
        fetchMembers();
        setShowPointsModal(false);
      }
    } catch (error) {
      console.error('Failed to adjust points:', error);
    }
  };

  const giftMembership = async (memberId, duration, tier) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/members/${memberId}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration, tier })
      });
      if (response.ok) {
        fetchMembers();
        setShowGiftModal(false);
      }
    } catch (error) {
      console.error('Failed to gift membership:', error);
    }
  };

  const updateMemberDetails = async (memberId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/customers/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        fetchMembers();
        setEditingMember(null);
      }
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const exportMembers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Tier', 'Paw Points', 'Joined', 'Expires'].join(','),
      ...members.map(m => [
        m.name || '',
        m.email,
        m.phone || '',
        m.membership_tier || 'free',
        m.loyalty_points || 0,
        m.created_at,
        m.membership_expires || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchQuery || 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery);
    const matchesTier = filterTier === 'all' || getTierKey(m.membership_tier) === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6" data-testid="membership-manager">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            Membership Manager
          </h1>
          <p className="text-gray-500 mt-1">Manage members, tiers, rewards & subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMembers}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={exportMembers}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Total Members</span>
          </div>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">New This Month</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.newThisMonth || 0}</p>
        </Card>
        {Object.entries(MEMBERSHIP_LEVELS).map(([key, level]) => (
          <Card key={key} className={`p-4 ${level.bgColor}`}>
            <div className={`flex items-center gap-1 ${level.textColor} mb-1`}>
              <span className="text-xs truncate">{level.name}</span>
            </div>
            <p className={`text-2xl font-bold ${level.textColor}`}>{stats[key] || 0}</p>
          </Card>
        ))}
        <Card className="p-4 bg-purple-50">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <PawPrint className="w-4 h-4" />
            <span className="text-xs">Total Paw Points</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{(stats.totalPawPoints || 0).toLocaleString()}</p>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> All Members
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Award className="w-4 h-4" /> Paw Rewards
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Membership Levels
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Tiers</option>
              {Object.entries(MEMBERSHIP_LEVELS).map(([key, level]) => (
                <option key={key} value={key}>{level.name}</option>
              ))}
            </select>
          </div>

          {/* Members Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paw Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pets</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMembers.map((member, idx) => {
                    const tierKey = getTierKey(member.membership_tier);
                    const tierInfo = MEMBERSHIP_LEVELS[tierKey];
                    const isExpired = member.membership_expires && new Date(member.membership_expires) < new Date();
                    
                    return (
                      <tr key={member.id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                              {(member.name || member.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name || 'Unnamed'}</p>
                              <p className="text-xs text-gray-500">
                                Joined {new Date(member.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{member.email}</p>
                          <p className="text-xs text-gray-500">{member.phone || 'No phone'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`${tierInfo.bgColor} ${tierInfo.textColor} border-0`}>
                            {tierInfo.name}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <PawPrint className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">{(member.loyalty_points || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {member.membership_expires ? (
                            <div>
                              <Badge variant={isExpired ? "destructive" : "default"}>
                                {isExpired ? 'Expired' : 'Active'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {isExpired ? 'Expired' : 'Expires'} {new Date(member.membership_expires).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline">No Subscription</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm">{member.pets_count || 0} pets</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setSelectedMember(member); setShowMemberModal(true); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingMember(member)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setSelectedMember(member); setShowGiftModal(true); }}
                            >
                              <Gift className="w-4 h-4 text-pink-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setSelectedMember(member); setShowPointsModal(true); }}
                            >
                              <PawPrint className="w-4 h-4 text-purple-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredMembers.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiring Soon (30 days)</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {members.filter(m => {
                      if (!m.membership_expires) return false;
                      const exp = new Date(m.membership_expires);
                      const now = new Date();
                      const diff = (exp - now) / (1000 * 60 * 60 * 24);
                      return diff > 0 && diff <= 30;
                    }).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recently Expired</p>
                  <p className="text-2xl font-bold text-red-600">
                    {members.filter(m => {
                      if (!m.membership_expires) return false;
                      const exp = new Date(m.membership_expires);
                      const now = new Date();
                      const diff = (now - exp) / (1000 * 60 * 60 * 24);
                      return diff > 0 && diff <= 30;
                    }).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Subscription Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <Mail className="w-4 h-4 mr-2" /> Send Renewal Reminders
              </Button>
              <Button variant="outline" className="justify-start">
                <Gift className="w-4 h-4 mr-2" /> Bulk Gift Memberships
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="w-4 h-4 mr-2" /> Extend All by 1 Month
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="w-4 h-4 mr-2" /> Export Subscription Report
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Paw Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-purple-500" /> Paw Points Economy
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Total Points in Circulation</span>
                  <span className="font-bold text-purple-600">{(stats.totalPawPoints || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Average Points per Member</span>
                  <span className="font-bold">{stats.total ? Math.round(stats.totalPawPoints / stats.total) : 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" /> Points Earning Rates
              </h3>
              <div className="space-y-3">
                {Object.entries(MEMBERSHIP_LEVELS).map(([key, level]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className={level.textColor}>{level.name}</span>
                    <Badge variant="outline">{level.pawPointMultiplier}x multiplier</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 md:col-span-2">
              <h3 className="font-semibold mb-4">Top Paw Points Earners</h3>
              <div className="space-y-3">
                {[...members]
                  .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
                  .slice(0, 5)
                  .map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-400">#{idx + 1}</span>
                        <div>
                          <p className="font-medium">{member.name || member.email}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-purple-500" />
                        <span className="font-bold text-purple-600">{(member.loyalty_points || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Membership Levels Tab */}
        <TabsContent value="levels" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(MEMBERSHIP_LEVELS).map(([key, level]) => (
              <Card key={key} className={`p-6 border-2 ${level.bgColor} border-transparent hover:border-${level.color}-300 transition-colors`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${level.textColor}`}>{level.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                  </div>
                  <Badge variant="outline" className={level.textColor}>
                    {stats[key] || 0} members
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Minimum Tenure</span>
                    <span className="font-medium">{level.minMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paw Points Multiplier</span>
                    <span className="font-medium">{level.pawPointMultiplier}x</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Membership Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Price (₹)</label>
                <Input defaultValue="99" className="mt-1 max-w-xs" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Annual Price (₹)</label>
                <Input defaultValue="999" className="mt-1 max-w-xs" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Additional Pet Price (₹/year)</label>
                <Input defaultValue="499" className="mt-1 max-w-xs" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Base Paw Points per ₹100 spent</label>
                <Input defaultValue="10" className="mt-1 max-w-xs" />
              </div>
              <Button>Save Settings</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Member Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMemberModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedMember.name || selectedMember.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedMember.name || 'Unnamed'}</h3>
                  <p className="text-gray-500">{selectedMember.email}</p>
                  <Badge className={`${MEMBERSHIP_LEVELS[getTierKey(selectedMember.membership_tier)].bgColor} ${MEMBERSHIP_LEVELS[getTierKey(selectedMember.membership_tier)].textColor} border-0 mt-1`}>
                    {MEMBERSHIP_LEVELS[getTierKey(selectedMember.membership_tier)].name}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedMember.phone || 'Not provided'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(selectedMember.created_at).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Paw Points</p>
                  <p className="font-bold text-purple-700">{(selectedMember.loyalty_points || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Subscription</p>
                  <p className="font-medium">
                    {selectedMember.membership_expires 
                      ? `Expires ${new Date(selectedMember.membership_expires).toLocaleDateString()}`
                      : 'No active subscription'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => { setShowMemberModal(false); setEditingMember(selectedMember); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
                <Button variant="outline" onClick={() => { setShowMemberModal(false); setShowGiftModal(true); }}>
                  <Gift className="w-4 h-4 mr-2" /> Gift Membership
                </Button>
                <Button variant="outline" onClick={() => { setShowMemberModal(false); setShowPointsModal(true); }}>
                  <PawPrint className="w-4 h-4 mr-2" /> Adjust Points
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal 
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updates) => updateMemberDetails(editingMember.id, updates)}
        />
      )}

      {/* Gift Membership Modal */}
      {showGiftModal && selectedMember && (
        <GiftMembershipModal
          member={selectedMember}
          onClose={() => setShowGiftModal(false)}
          onGift={(duration, tier) => giftMembership(selectedMember.id, duration, tier)}
        />
      )}

      {/* Adjust Points Modal */}
      {showPointsModal && selectedMember && (
        <AdjustPointsModal
          member={selectedMember}
          onClose={() => setShowPointsModal(false)}
          onAdjust={(points, reason) => adjustPawPoints(selectedMember.id, points, reason)}
        />
      )}
    </div>
  );
};

// Edit Member Modal Component
const EditMemberModal = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    membership_tier: member.membership_tier || 'free',
    membership_expires: member.membership_expires?.split('T')[0] || '',
    admin_notes: member.admin_notes || ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Member</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Membership Tier</label>
            <select
              value={formData.membership_tier}
              onChange={(e) => setFormData({ ...formData, membership_tier: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="free">🐕 Curious Pup (Free)</option>
              <option value="pawsome">🦮 Loyal Companion</option>
              <option value="premium">🐕‍🦺 Trusted Guardian</option>
              <option value="vip">👑 Pack Leader</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Subscription Expires</label>
            <Input
              type="date"
              value={formData.membership_expires}
              onChange={(e) => setFormData({ ...formData, membership_expires: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg h-24"
              placeholder="Internal notes about this member..."
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => onSave(formData)} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Gift Membership Modal Component
const GiftMembershipModal = ({ member, onClose, onGift }) => {
  const [duration, setDuration] = useState(1);
  const [tier, setTier] = useState('pawsome');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" /> Gift Membership
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Gift a free membership to <strong>{member.name || member.email}</strong>
          </p>
          <div>
            <label className="text-sm font-medium">Duration (months)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months (1 year)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Membership Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="pawsome">🦮 Loyal Companion</option>
              <option value="premium">🐕‍🦺 Trusted Guardian</option>
              <option value="vip">👑 Pack Leader</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => onGift(duration, tier)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">
              <Gift className="w-4 h-4 mr-2" /> Gift Membership
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Adjust Points Modal Component
const AdjustPointsModal = ({ member, onClose, onAdjust }) => {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');
  const [isAdding, setIsAdding] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-purple-500" /> Adjust Paw Points
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-sm text-purple-600">Current Balance</p>
            <p className="text-3xl font-bold text-purple-700">{(member.loyalty_points || 0).toLocaleString()}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={isAdding ? "default" : "outline"}
              onClick={() => setIsAdding(true)}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Points
            </Button>
            <Button 
              variant={!isAdding ? "default" : "outline"}
              onClick={() => setIsAdding(false)}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Deduct Points
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">Points</label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={0}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg h-20"
              placeholder="Reason for adjustment..."
              required
            />
          </div>
          
          {points > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">New Balance</p>
              <p className="text-xl font-bold">
                {(member.loyalty_points || 0) + (isAdding ? points : -points)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => onAdjust(isAdding ? points : -points, reason)}
              className="flex-1"
              disabled={!points || !reason}
            >
              Confirm Adjustment
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MembershipManager;
