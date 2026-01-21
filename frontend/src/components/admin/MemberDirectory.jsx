import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, Crown, Search, Filter, Download, Upload, Plus, Edit2, 
  Trash2, Gift, Calendar, CreditCard, PawPrint, Star, Award,
  TrendingUp, Clock, Mail, Phone, MapPin, Shield, Sparkles,
  ChevronRight, X, Check, AlertCircle, RefreshCw, Eye, History,
  MessageSquare, Heart, Zap, Target, Home, Plane, Utensils,
  FileText, UserPlus, Settings, MoreHorizontal, ExternalLink,
  User, Activity, Package, DollarSign, Tag, Building, Briefcase
} from 'lucide-react';
import { API_URL } from '../../utils/api';

// Member statuses
const MEMBER_STATUSES = {
  preboarded: { label: 'Pre-boarded', color: 'bg-blue-100 text-blue-700', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: Check },
  renewal_due: { label: 'Renewal Due', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: X },
  suspended: { label: 'Suspended', color: 'bg-gray-100 text-gray-700', icon: Shield }
};

// Member sources
const MEMBER_SOURCES = {
  direct: { label: 'TDC Direct', color: 'bg-purple-100 text-purple-700' },
  gifted: { label: 'Gifted', color: 'bg-pink-100 text-pink-700' },
  b2b: { label: 'B2B Partner', color: 'bg-blue-100 text-blue-700' },
  csv_import: { label: 'CSV Import', color: 'bg-gray-100 text-gray-700' },
  offline: { label: 'Offline', color: 'bg-yellow-100 text-yellow-700' }
};

// Membership tiers
const MEMBERSHIP_TIERS = {
  free: { name: 'Free', price: '₹0', color: 'gray' },
  monthly: { name: 'Monthly', price: '₹99/mo', color: 'blue' },
  annual: { name: 'Annual', price: '₹999/yr', color: 'purple' },
  family: { name: 'Family', price: '₹1,499/yr', color: 'pink' }
};

// Pet Soul categories for score breakdown
const SOUL_CATEGORIES = [
  { key: 'health', label: 'Health', icon: '💊', color: 'bg-red-500', fields: ['weight', 'allergies', 'medical_conditions', 'vaccinations', 'vet_info', 'medications'] },
  { key: 'diet', label: 'Diet', icon: '🍖', color: 'bg-orange-500', fields: ['food_brand', 'food_type', 'feeding_schedule', 'portion_size', 'treats', 'allergies'] },
  { key: 'behavior', label: 'Behavior', icon: '🧠', color: 'bg-yellow-500', fields: ['temperament', 'fears', 'training_level', 'social_with_dogs', 'social_with_kids', 'alone_time'] },
  { key: 'grooming', label: 'Grooming', icon: '✨', color: 'bg-green-500', fields: ['grooming_frequency', 'bath_frequency', 'nail_trim', 'ear_cleaning', 'preferred_groomer'] },
  { key: 'travel', label: 'Travel', icon: '✈️', color: 'bg-blue-500', fields: ['car_behavior', 'carrier_trained', 'motion_sickness', 'preferred_destinations', 'hotel_behavior'] },
  { key: 'play', label: 'Play', icon: '🎾', color: 'bg-indigo-500', fields: ['favorite_toys', 'favorite_activities', 'energy_level', 'favorite_games', 'exercise_needs'] },
  { key: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-purple-500', fields: ['emergency_contacts', 'backup_caregiver', 'emergency_hospital', 'insurance_info'] },
  { key: 'celebrate', label: 'Celebrate', icon: '🎂', color: 'bg-pink-500', fields: ['birthday', 'gotcha_day', 'favorite_treats', 'party_preference'] }
];

// Calculate Pet Soul score
const calculateSoulScore = (pet) => {
  if (!pet) return { total: 0, breakdown: {} };
  
  const soul = pet.soul || {};
  const breakdown = {};
  let totalFilled = 0;
  let totalFields = 0;

  SOUL_CATEGORIES.forEach(category => {
    let filledInCategory = 0;
    category.fields.forEach(field => {
      totalFields++;
      // Check if field exists in pet or soul data
      const value = pet[field] || soul[field] || (soul[category.key] && soul[category.key][field]);
      if (value && value !== '' && value !== null) {
        filledInCategory++;
        totalFilled++;
      }
    });
    breakdown[category.key] = {
      filled: filledInCategory,
      total: category.fields.length,
      percent: Math.round((filledInCategory / category.fields.length) * 100)
    };
  });

  return {
    total: totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0,
    breakdown
  };
};

// Member Directory Component
const MemberDirectory = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    tier: 'all',
    city: 'all'
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileConsole, setShowProfileConsole] = useState(false);
  const [cities, setCities] = useState([]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/members/directory`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        // Extract unique cities
        const uniqueCities = [...new Set(data.members?.map(m => m.city).filter(Boolean))];
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Calculate member status
  const getMemberStatus = (member) => {
    if (member.suspended) return 'suspended';
    if (!member.membership_tier || member.membership_tier === 'free') {
      return member.onboarding_complete ? 'active' : 'preboarded';
    }
    if (!member.membership_expires) return 'active';
    
    const expiry = new Date(member.membership_expires);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'renewal_due';
    return 'active';
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.includes(searchQuery);
    
    const status = getMemberStatus(member);
    const matchesStatus = filters.status === 'all' || status === filters.status;
    const matchesSource = filters.source === 'all' || member.source === filters.source;
    const matchesTier = filters.tier === 'all' || member.membership_tier === filters.tier;
    const matchesCity = filters.city === 'all' || member.city === filters.city;
    
    return matchesSearch && matchesStatus && matchesSource && matchesTier && matchesCity;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Status', 'Tier', 'Source', 'Pets', 'Last Activity', 'Lifetime Value'];
    const rows = filteredMembers.map(m => [
      m.name || '',
      m.email || '',
      m.phone || '',
      m.city || '',
      getMemberStatus(m),
      m.membership_tier || 'free',
      m.source || 'direct',
      m.pets?.length || 0,
      m.last_activity || '',
      m.lifetime_value || 0
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const openMemberProfile = (member) => {
    setSelectedMember(member);
    setShowProfileConsole(true);
  };

  return (
    <div className="space-y-6" data-testid="pet-parent-directory">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-500" />
            Pet Parent Directory
          </h1>
          <p className="text-gray-500 mt-1">
            {filteredMembers.length} of {members.length} pet parents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMembers}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              {Object.entries(MEMBER_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Sources</option>
              {Object.entries(MEMBER_SOURCES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Tiers</option>
              {Object.entries(MEMBERSHIP_TIERS).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
            <p className="text-gray-500">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet Soul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.map((member, idx) => {
                  const status = getMemberStatus(member);
                  const statusInfo = MEMBER_STATUSES[status];
                  const sourceInfo = MEMBER_SOURCES[member.source || 'direct'];
                  // Calculate average pet soul score
                  const avgSoulScore = member.pets?.length > 0
                    ? Math.round(member.pets.reduce((sum, pet) => sum + (calculateSoulScore(pet).total || 0), 0) / member.pets.length)
                    : 0;
                  
                  return (
                    <tr 
                      key={member.id || idx} 
                      className="hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => openMemberProfile(member)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                            {member.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{member.city || 'No city'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-1 text-gray-500 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">
                          <Crown className="w-3 h-3 mr-1" />
                          {MEMBERSHIP_TIERS[member.membership_tier]?.name || 'Free'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={sourceInfo?.color}>
                          {sourceInfo?.label || member.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <PawPrint className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{member.pets?.length || 0}</span>
                          {member.pets?.length > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({member.pets.map(p => p.name).join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${avgSoulScore >= 70 ? 'bg-green-500' : avgSoulScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${avgSoulScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{avgSoulScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-500">
                          {member.last_activity 
                            ? new Date(member.last_activity).toLocaleDateString() 
                            : 'Never'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openMemberProfile(member)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Member Profile Console Modal */}
      {showProfileConsole && selectedMember && (
        <MemberProfileConsole 
          member={selectedMember} 
          onClose={() => setShowProfileConsole(false)}
          onRefresh={fetchMembers}
        />
      )}
    </div>
  );
};

// Member Profile Console (360 View)
const MemberProfileConsole = ({ member, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [memberData, setMemberData] = useState(member);
  const [pets, setPets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberDetails();
  }, [member.id]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/members/${member.id}/full-profile`);
      if (response.ok) {
        const data = await response.json();
        setMemberData(data.member);
        setPets(data.pets || []);
        setActivity(data.activity || []);
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch member details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      await fetch(`${API_URL}/api/admin/members/${member.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });
      setNotes([...notes, { text: newNote, created_at: new Date().toISOString(), author: 'Admin' }]);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {memberData.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{memberData.name || 'Unknown'}</h2>
                <p className="text-purple-200">{memberData.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-white/20">{MEMBERSHIP_TIERS[memberData.membership_tier]?.name || 'Free'}</Badge>
                  <Badge className="bg-white/20">{pets.length} Pet{pets.length !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="px-6 py-2 bg-gray-50 border-b justify-start gap-2">
            <TabsTrigger value="account"><User className="w-4 h-4 mr-1" /> Account</TabsTrigger>
            <TabsTrigger value="membership"><Crown className="w-4 h-4 mr-1" /> Membership</TabsTrigger>
            <TabsTrigger value="pets"><PawPrint className="w-4 h-4 mr-1" /> Pets & Soul</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="w-4 h-4 mr-1" /> Activity</TabsTrigger>
            <TabsTrigger value="notes"><FileText className="w-4 h-4 mr-1" /> Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Contact Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="font-medium">{memberData.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{memberData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">City</label>
                      <p className="font-medium">{memberData.city || 'Not provided'}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Addresses
                  </h3>
                  {memberData.addresses?.length > 0 ? (
                    <div className="space-y-2">
                      {memberData.addresses.map((addr, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                          <p>{addr.line1}</p>
                          <p className="text-gray-500">{addr.city}, {addr.pincode}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No addresses saved</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Communication
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">WhatsApp Opt-in</span>
                      <Badge className={memberData.whatsapp_optin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {memberData.whatsapp_optin ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing Emails</span>
                      <Badge className={memberData.marketing_optin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {memberData.marketing_optin ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Preferred Channel</span>
                      <Badge variant="outline">{memberData.preferred_channel || 'WhatsApp'}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Membership Tab */}
            <TabsContent value="membership" className="space-y-6 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Current Plan
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">
                        {MEMBERSHIP_TIERS[memberData.membership_tier]?.name || 'Free'}
                      </p>
                      <p className="text-purple-600">
                        {MEMBERSHIP_TIERS[memberData.membership_tier]?.price || '₹0'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Start Date</label>
                      <p className="font-medium">
                        {memberData.membership_start 
                          ? new Date(memberData.membership_start).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Renewal Date</label>
                      <p className="font-medium">
                        {memberData.membership_expires 
                          ? new Date(memberData.membership_expires).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Source</label>
                      <p className="font-medium">{MEMBER_SOURCES[memberData.source]?.label || memberData.source}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PawPrint className="w-4 h-4" /> Paw Points
                  </h3>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg mb-4">
                    <p className="text-4xl font-bold text-orange-600">
                      {memberData.loyalty_points || 0}
                    </p>
                    <p className="text-orange-500">Paw Points</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Plus className="w-3 h-3 mr-1" /> Add Points
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Gift className="w-3 h-3 mr-1" /> Redeem
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:col-span-2">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment History
                  </h3>
                  {memberData.payment_history?.length > 0 ? (
                    <div className="space-y-2">
                      {memberData.payment_history.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{payment.amount}</p>
                            <Badge className="text-xs">{payment.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No payment history</p>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Pets & Soul Tab - Enhanced with 8 Pillar Tabs */}
            <TabsContent value="pets" className="space-y-6 mt-0">
              {pets.length === 0 ? (
                <Card className="p-8 text-center">
                  <PawPrint className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No pets registered yet</p>
                </Card>
              ) : (
                <PetSoulTabs pets={pets} />
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-0">
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <Package className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{memberData.total_orders || 0}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </Card>
                <Card className="p-4 text-center">
                  <Sparkles className="w-6 h-6 mx-auto text-pink-500 mb-2" />
                  <p className="text-2xl font-bold">{memberData.total_requests || 0}</p>
                  <p className="text-xs text-gray-500">Concierge Requests</p>
                </Card>
                <Card className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{memberData.total_bookings || 0}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </Card>
                <Card className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">₹{memberData.lifetime_value || 0}</p>
                  <p className="text-xs text-gray-500">Lifetime Value</p>
                </Card>
              </div>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                {activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === 'order' ? 'bg-purple-100' :
                          item.type === 'booking' ? 'bg-blue-100' :
                          item.type === 'request' ? 'bg-pink-100' : 'bg-gray-100'
                        }`}>
                          {item.type === 'order' && <Package className="w-4 h-4 text-purple-600" />}
                          {item.type === 'booking' && <Calendar className="w-4 h-4 text-blue-600" />}
                          {item.type === 'request' && <Sparkles className="w-4 h-4 text-pink-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No activity yet</p>
                )}
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 mt-0">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Internal Notes</h3>
                
                {/* Add Note */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addNote}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Notes List */}
                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm">{note.text}</p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>By: {note.author}</span>
                          <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No notes yet</p>
                )}
              </Card>

              {/* Tags */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Tags & Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {memberData.is_vip && <Badge className="bg-yellow-100 text-yellow-700">⭐ VIP</Badge>}
                  {memberData.risk_flag && <Badge className="bg-red-100 text-red-700">⚠️ Risk Flag</Badge>}
                  {memberData.tags?.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                  <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" /> Add Tag
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

// Pet Soul Tabs Component with 8 Pillars
const PetSoulTabs = ({ pets }) => {
  const [selectedPet, setSelectedPet] = useState(0);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [hoveredPet, setHoveredPet] = useState(null);

  const currentPet = pets[selectedPet];
  const soulScore = calculateSoulScore(currentPet);

  const getPillarData = (pet, pillarKey) => {
    const answers = pet.doggy_soul_answers || {};
    const pillarData = {};
    
    // Extract all answers that start with the pillar key
    Object.entries(answers).forEach(([key, value]) => {
      if (key.startsWith(pillarKey + '_')) {
        const fieldName = key.replace(pillarKey + '_', '').replace(/_/g, ' ');
        pillarData[fieldName] = value;
      }
    });
    
    return pillarData;
  };

  return (
    <div className="space-y-4">
      {/* Pet Tabs with Hover Preview */}
      {pets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {pets.map((pet, idx) => {
            const petScore = calculateSoulScore(pet);
            return (
              <div key={pet.id || idx} className="relative">
                <button
                  onClick={() => { setSelectedPet(idx); setSelectedPillar(null); }}
                  onMouseEnter={() => setHoveredPet(idx)}
                  onMouseLeave={() => setHoveredPet(null)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedPet === idx
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-xl">🐕</span>
                  <span className="font-medium">{pet.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedPet === idx ? 'bg-white/20' : 'bg-gray-200'
                  }`}>{petScore.total}%</span>
                </button>

                {/* Hover Preview */}
                {hoveredPet === idx && selectedPet !== idx && (
                  <div className="absolute z-20 top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                        🐕
                      </div>
                      <div>
                        <p className="font-bold">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.breed}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${petScore.total}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{petScore.total}%</span>
                    </div>
                    <p className="text-xs text-gray-400">Click to view full profile</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Pet Profile */}
      {currentPet && (
        <Card className="overflow-hidden">
          {/* Pet Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                🐕
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{currentPet.name}</h3>
                <p className="text-purple-200">{currentPet.breed} • {currentPet.gender}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 max-w-xs bg-white/20 rounded-full h-3">
                    <div 
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${soulScore.total}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{soulScore.total}% Soul</span>
                </div>
              </div>
            </div>
          </div>

          {/* 8 Pillars Grid */}
          <div className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Soul Pillars</p>
            <div className="grid grid-cols-4 gap-3">
              {SOUL_CATEGORIES.map(pillar => {
                const pillarScore = soulScore.breakdown[pillar.key]?.percent || 0;
                const isSelected = selectedPillar === pillar.key;
                
                return (
                  <button
                    key={pillar.key}
                    onClick={() => setSelectedPillar(isSelected ? null : pillar.key)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? `border-purple-500 bg-purple-50 ring-2 ring-purple-200`
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl block mb-1">{pillar.icon}</span>
                      <p className="text-xs font-medium text-gray-700">{pillar.label}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-full rounded-full ${pillar.color}`}
                          style={{ width: `${pillarScore}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold mt-1" style={{ color: pillarScore >= 70 ? '#22c55e' : pillarScore >= 40 ? '#eab308' : '#ef4444' }}>
                        {pillarScore}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Pillar Details */}
          {selectedPillar && (
            <div className="p-4 border-t bg-gray-50 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {SOUL_CATEGORIES.find(p => p.key === selectedPillar)?.icon}
                </span>
                <h4 className="font-bold text-lg">
                  {SOUL_CATEGORIES.find(p => p.key === selectedPillar)?.label} Details
                </h4>
              </div>
              
              {Object.keys(getPillarData(currentPet, selectedPillar)).length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(getPillarData(currentPet, selectedPillar)).map(([field, value]) => (
                    <div key={field} className="p-3 bg-white rounded-lg border">
                      <p className="text-xs text-gray-500 uppercase">{field}</p>
                      <p className="font-medium text-gray-900">{value || 'Not set'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>No data collected for this pillar yet</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <MessageSquare className="w-3 h-3 mr-1" /> Send Soul Whisper
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-t flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-1" /> Full Profile
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-1" /> Soul Whisper
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MemberDirectory;
