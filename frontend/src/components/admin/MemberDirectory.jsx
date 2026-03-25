import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { 
  Users, Crown, Search, Filter, Download, Upload, Plus, Edit2, 
  Trash2, Gift, Calendar, CreditCard, PawPrint, Star, Award,
  TrendingUp, Clock, Mail, Phone, MapPin, Shield, Sparkles,
  ChevronRight, X, Check, AlertCircle, RefreshCw, Eye, History,
  MessageSquare, Heart, Zap, Target, Home, Plane, Utensils,
  FileText, UserPlus, Settings, MoreHorizontal, ExternalLink,
  User, Activity, Package, DollarSign, Tag, Building, Briefcase,
  ShoppingCart, Syringe, Weight, Stethoscope, Send
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import HealthVaultTab from './HealthVaultTab';

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
  { key: 'identity_temperament', label: 'Identity & Temperament', icon: '🎭', color: 'bg-purple-400', fields: ['describe_3_words', 'general_nature', 'breed', 'gender', 'age'] },
  { key: 'family_pack', label: 'Family & Pack', icon: '👨‍👩‍👧‍👦', color: 'bg-blue-400', fields: ['most_attached_to', 'behavior_with_dogs', 'behavior_with_cats', 'behavior_with_kids', 'household_members'] },
  { key: 'rhythm_routine', label: 'Rhythm & Routine', icon: '⏰', color: 'bg-green-400', fields: ['walks_per_day', 'energetic_time', 'sleep_schedule', 'feeding_schedule'] },
  { key: 'home_comforts', label: 'Home Comforts', icon: '🏠', color: 'bg-amber-400', fields: ['space_preference', 'crate_trained', 'sleeping_spot', 'favorite_spot'] },
  { key: 'travel_style', label: 'Travel Style', icon: '✈️', color: 'bg-sky-400', fields: ['car_rides', 'travel_anxiety', 'carrier_trained', 'motion_sickness'] },
  { key: 'taste_treat', label: 'Taste & Treat', icon: '🍖', color: 'bg-orange-400', fields: ['favorite_treats', 'food_allergies', 'food_brand', 'food_type', 'diet_preference'] },
  { key: 'training_behaviour', label: 'Training & Behaviour', icon: '🎓', color: 'bg-indigo-400', fields: ['training_level', 'commands_known', 'behavior_issues', 'sociability'] },
  { key: 'long_horizon', label: 'Long Horizon', icon: '🌅', color: 'bg-rose-400', fields: ['health_conditions', 'vaccinations', 'vet_info', 'insurance', 'goals'] }
];

// Calculate Pet Soul score
const calculateSoulScore = (pet) => {
  if (!pet) return { total: 0, breakdown: {} };
  
  const soul = pet.soul || {};
  const answers = pet.doggy_soul_answers || {};
  const breakdown = {};
  let totalFilled = 0;
  let totalFields = 0;

  SOUL_CATEGORIES.forEach(category => {
    let filledInCategory = 0;
    category.fields.forEach(field => {
      totalFields++;
      // Check multiple possible locations for the data
      const prefixedKey = `${category.key}_${field}`;
      const value = pet[field] || 
                    soul[field] || 
                    answers[field] || 
                    answers[prefixedKey] ||
                    (soul[category.key] && soul[category.key][field]);
      if (value && value !== '' && value !== null && value !== undefined) {
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

  // Also count any answers in doggy_soul_answers that we haven't categorized
  const answeredKeys = Object.keys(answers).length;
  if (answeredKeys > 0 && totalFilled === 0) {
    // Fallback: if we have answers but categories don't match, calculate based on total answers
    const estimatedPercent = Math.min(100, Math.round((answeredKeys / 40) * 100));
    return {
      total: estimatedPercent,
      breakdown,
      answeredFields: answeredKeys
    };
  }

  return {
    total: totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0,
    breakdown,
    answeredFields: answeredKeys
  };
};

// Member Directory Component
const MemberDirectory = () => {
  const [searchParams] = useSearchParams();
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
  
  // Pet Edit Modal State
  const [editingPet, setEditingPet] = useState(null);
  const [petEditForm, setPetEditForm] = useState({
    name: '',
    breed: '',
    gender: '',
    birth_date: '',
    weight: '',
    food_allergies: ''
  });
  const [savingPet, setSavingPet] = useState(false);

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
        
        // Auto-select member if email is in URL params
        const emailParam = searchParams.get('email');
        if (emailParam && data.members) {
          const memberToSelect = data.members.find(m => m.email === emailParam);
          if (memberToSelect) {
            setSelectedMember(memberToSelect);
            setShowProfileConsole(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

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
  
  // Pet Edit Functions
  const openPetEdit = (pet) => {
    setEditingPet(pet);
    setPetEditForm({
      name: pet.name || '',
      breed: pet.breed || '',
      gender: pet.gender || '',
      birth_date: pet.birth_date?.split('T')[0] || '',
      weight: pet.weight || '',
      food_allergies: (pet.food_allergies || []).join(', ')
    });
  };
  
  const closePetEdit = () => {
    setEditingPet(null);
    setPetEditForm({ name: '', breed: '', gender: '', birth_date: '', weight: '', food_allergies: '' });
  };
  
  const savePetEdit = async () => {
    if (!editingPet) return;
    setSavingPet(true);
    try {
      const adminAuth = localStorage.getItem('adminAuth');
      const payload = {
        ...petEditForm,
        food_allergies: petEditForm.food_allergies ? petEditForm.food_allergies.split(',').map(a => a.trim()).filter(Boolean) : []
      };
      
      const response = await fetch(`${API_URL}/api/admin/pets/${editingPet.id || editingPet._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${adminAuth}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        // Refresh member data
        fetchMembers();
        closePetEdit();
        alert(`${petEditForm.name} updated successfully!`);
      } else {
        alert('Failed to update pet. Please try again.');
      }
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Error saving pet. Please try again.');
    } finally {
      setSavingPet(false);
    }
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
  const [tickets, setTickets] = useState([]);
  const [memories, setMemories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  useEffect(() => {
    fetchMemberDetails();
  }, [member.id]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    try {
      // Try the concierge full-profile endpoint first (more comprehensive)
      const fullProfileResponse = await fetch(`${API_URL}/api/concierge/member/${encodeURIComponent(member.email)}/full-profile`);
      if (fullProfileResponse.ok) {
        const data = await fullProfileResponse.json();
        setMemberData(data.member || member);
        setPets(data.pets || []);
        setActivity(data.activity || []);
        setNotes(data.notes || []);
        setOrders(data.orders?.list || []);
        return;
      }
      
      // Fallback to admin endpoint
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

  // Fetch tickets when Tickets tab is selected
  useEffect(() => {
    if (activeTab === 'tickets' && tickets.length === 0) {
      fetchMemberTickets();
    }
  }, [activeTab]);

  // Fetch memories when Memories tab is selected
  useEffect(() => {
    if (activeTab === 'memories' && memories.length === 0) {
      fetchMemberMemories();
    }
  }, [activeTab]);

  // Fetch orders when Orders tab is selected
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      fetchMemberOrders();
    }
  }, [activeTab]);

  const fetchMemberTickets = async () => {
    setTicketsLoading(true);
    try {
      // Fetch ALL tickets from combined endpoint
      const response = await fetch(`${API_URL}/api/tickets/member/${encodeURIComponent(member.email)}/all`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch member tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchMemberMemories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/admin/member/${encodeURIComponent(member.email)}`);
      if (response.ok) {
        const data = await response.json();
        // Flatten memories from all types
        const allMemories = [];
        Object.values(data.by_type || {}).forEach(typeData => {
          (typeData.memories || []).forEach(m => allMemories.push(m));
        });
        allMemories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMemories(allMemories);
      }
    } catch (error) {
      console.error('Failed to fetch member memories:', error);
    }
  };

  const fetchMemberOrders = async () => {
    try {
      // Use the concierge full-profile endpoint to get orders
      const response = await fetch(`${API_URL}/api/concierge/member/${encodeURIComponent(member.email)}/full-profile`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders?.list || []);
      }
    } catch (error) {
      console.error('Failed to fetch member orders:', error);
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
          <TabsList className="px-6 py-2 bg-gray-50 border-b justify-start gap-2 flex-wrap">
            <TabsTrigger value="account"><User className="w-4 h-4 mr-1" /> Account</TabsTrigger>
            <TabsTrigger value="membership"><Crown className="w-4 h-4 mr-1" /> Membership</TabsTrigger>
            <TabsTrigger value="pets"><PawPrint className="w-4 h-4 mr-1" /> Pets & Soul</TabsTrigger>
            <TabsTrigger value="health"><Heart className="w-4 h-4 mr-1" /> Health Vault</TabsTrigger>
            <TabsTrigger value="tickets" className="relative">
              <Briefcase className="w-4 h-4 mr-1" /> Tickets
              {tickets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                  {tickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-1" /> Orders</TabsTrigger>
            <TabsTrigger value="rewards"><Star className="w-4 h-4 mr-1" /> Paw Rewards</TabsTrigger>
            <TabsTrigger value="memories">
              <History className="w-4 h-4 mr-1" /> Memories
            </TabsTrigger>
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

            {/* Pets & Soul Tab - Enhanced with 14 Pillar Tabs */}
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
                  <p className="text-xs text-gray-500">Concierge® Requests</p>
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

            {/* Tickets Tab - Service Desk History */}
            <TabsContent value="tickets" className="space-y-4 mt-0">
              {ticketsLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
                  <p className="text-gray-500">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No tickets for this member</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket, idx) => {
                    const statusColors = {
                      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
                      resolved: 'bg-green-100 text-green-700 border-green-200',
                      closed: 'bg-gray-100 text-gray-700 border-gray-200',
                      new: 'bg-purple-100 text-purple-700 border-purple-200'
                    };
                    const priorityColors = {
                      high: 'bg-red-100 text-red-700',
                      medium: 'bg-orange-100 text-orange-700',
                      low: 'bg-gray-100 text-gray-700'
                    };
                    
                    return (
                      <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              ticket.action_type?.includes('dining') ? 'bg-orange-100' :
                              ticket.action_type?.includes('travel') ? 'bg-blue-100' :
                              ticket.action_type?.includes('care') ? 'bg-red-100' :
                              ticket.action_type?.includes('stay') ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {ticket.action_type?.includes('dining') && <Utensils className="w-4 h-4 text-orange-600" />}
                              {ticket.action_type?.includes('travel') && <Plane className="w-4 h-4 text-blue-600" />}
                              {ticket.action_type?.includes('care') && <Heart className="w-4 h-4 text-red-600" />}
                              {ticket.action_type?.includes('stay') && <Home className="w-4 h-4 text-purple-600" />}
                              {!ticket.action_type?.includes('dining') && !ticket.action_type?.includes('travel') && 
                               !ticket.action_type?.includes('care') && !ticket.action_type?.includes('stay') && 
                               <Briefcase className="w-4 h-4 text-gray-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-gray-500">{ticket.ticket_id}</span>
                                <Badge className={`text-xs ${statusColors[ticket.status] || statusColors.pending}`}>
                                  {ticket.status?.replace('_', ' ') || 'pending'}
                                </Badge>
                                {ticket.priority && (
                                  <Badge className={`text-xs ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                                    {ticket.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-800">
                                {ticket.action_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {ticket.original_request?.slice(0, 100) || ticket.description?.slice(0, 100)}...
                              </p>
                              {ticket.pets && ticket.pets.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <PawPrint className="w-3 h-3 text-purple-500" />
                                  <span className="text-xs text-gray-500">
                                    {ticket.pets.map(p => p.name).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            <p>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}</p>
                            <p>{ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                          </div>
                        </div>
                        {ticket.resolution_summary && (
                          <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                            <strong>Resolution:</strong> {ticket.resolution_summary}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Memories Tab - Mira's Relationship Memory */}
            <TabsContent value="memories" className="space-y-4 mt-0">
              {memories.length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No memories stored for this member</p>
                  <p className="text-xs text-gray-400 mt-1">Mira will learn and remember from conversations</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <History className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">{memories.length} memories stored</span>
                    <span className="text-gray-400">• "Store forever. Surface selectively."</span>
                  </div>
                  {memories.map((memory, idx) => {
                    const typeConfig = {
                      event: { icon: Calendar, color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
                      health: { icon: Heart, color: 'red', bg: 'bg-red-50', border: 'border-red-200' },
                      shopping: { icon: Tag, color: 'green', bg: 'bg-green-50', border: 'border-green-200' },
                      general: { icon: MessageSquare, color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200' }
                    };
                    const config = typeConfig[memory.memory_type] || typeConfig.general;
                    const Icon = config.icon;
                    
                    return (
                      <Card key={idx} className={`p-3 ${config.bg} ${config.border} border`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`w-4 h-4 mt-0.5 text-${config.color}-600`} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{memory.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              {memory.pet_name && (
                                <span className="flex items-center gap-1">
                                  <PawPrint className="w-3 h-3" />
                                  {memory.pet_name}
                                </span>
                              )}
                              <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs">{memory.memory_type}</Badge>
                              {memory.is_critical && <Badge className="bg-red-100 text-red-700 text-xs">Critical</Badge>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
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

            {/* Health Vault Tab */}
            <TabsContent value="health" className="space-y-4 mt-0">
              <HealthVaultTab 
                pets={pets} 
                memberEmail={member?.email}
                onRefresh={fetchMemberDetails}
              />
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                  Order History
                </h3>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-100 text-green-700">
                    Total Spent: ₹{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
              
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <Card key={idx} className="p-4 hover:shadow-md cursor-pointer transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">#{order.order_id || order.id}</span>
                            <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.items?.length || 0} items • {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{order.total?.toLocaleString() || 0}</p>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No orders yet</p>
                </Card>
              )}
            </TabsContent>

            {/* Paw Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Paw Rewards
                </h3>
              </div>
              
              {/* Rewards Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50">
                  <p className="text-3xl font-bold text-purple-600">{memberData.loyalty_points || 0}</p>
                  <p className="text-sm text-gray-500">Current Balance</p>
                </Card>
                <Card className="p-4 text-center bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{memberData.total_points_earned || 0}</p>
                  <p className="text-sm text-gray-500">Total Earned</p>
                </Card>
                <Card className="p-4 text-center bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{memberData.total_points_redeemed || 0}</p>
                  <p className="text-sm text-gray-500">Total Redeemed</p>
                </Card>
              </div>
              
              {/* Value Display */}
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rewards Value</h4>
                    <p className="text-sm text-gray-600">10 points = ₹1 discount</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₹{Math.floor((memberData.loyalty_points || 0) / 10)}
                  </p>
                </div>
              </Card>
              
              {/* Transactions */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Recent Transactions</h4>
                <div className="text-sm text-gray-400 text-center py-4">
                  No transactions recorded
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

// Pet Soul Tabs Component - Matching PetSoulJourney Design
const PetSoulTabs = ({ pets }) => {
  const [selectedPet, setSelectedPet] = useState(0);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [hoveredPet, setHoveredPet] = useState(null);

  const currentPet = pets[selectedPet];
  const soulScore = calculateSoulScore(currentPet);

  // Get insight text for a pillar
  const getPillarInsight = (pillarKey, pet) => {
    const answers = pet?.doggy_soul_answers || {};
    
    const insightMap = {
      identity_temperament: answers.describe_3_words 
        ? `${answers.describe_3_words}`
        : answers.general_nature || null,
      family_pack: answers.most_attached_to
        ? `Attached to ${answers.most_attached_to}`
        : answers.behavior_with_dogs || null,
      rhythm_routine: answers.walks_per_day
        ? `${answers.walks_per_day} walks daily`
        : null,
      home_comforts: answers.space_preference || answers.crate_trained 
        ? (answers.crate_trained === 'Yes' ? 'Crate trained' : answers.space_preference)
        : null,
      travel_style: answers.car_rides || null,
      taste_treat: answers.favorite_treats 
        ? `Loves ${Array.isArray(answers.favorite_treats) ? answers.favorite_treats.join(', ') : answers.favorite_treats}`
        : null,
      training_behaviour: answers.training_level || null,
      long_horizon: answers.health_conditions || null
    };
    
    return insightMap[pillarKey];
  };

  const getPillarData = (pet, pillarKey) => {
    const answers = pet.doggy_soul_answers || {};
    const pillarData = {};
    const category = SOUL_CATEGORIES.find(c => c.key === pillarKey);
    
    if (category) {
      category.fields.forEach(field => {
        if (answers[field]) {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          pillarData[fieldName] = answers[field];
        }
      });
    }
    
    // Also get any other related fields
    Object.entries(answers).forEach(([key, value]) => {
      if (key.toLowerCase().includes(pillarKey.split('_')[0])) {
        const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!pillarData[fieldName]) {
          pillarData[fieldName] = value;
        }
      }
    });
    
    return pillarData;
  };

  // Get stage name based on score
  const getStageName = (score) => {
    if (score >= 80) return "Deeply Understood";
    if (score >= 50) return "We Know Them Well";
    if (score >= 20) return "Growing Together";
    return "Just Getting Started";
  };

  return (
    <div className="space-y-4">
      {/* Pet Selector Tabs */}
      {pets.length > 1 && (
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl">
          <span className="text-sm text-gray-500 px-2">Switch pet:</span>
          {pets.map((pet, idx) => {
            const petScore = calculateSoulScore(pet);
            return (
              <div key={pet.id || idx} className="relative">
                <button
                  onClick={() => { setSelectedPet(idx); setSelectedPillar(null); }}
                  onMouseEnter={() => setHoveredPet(idx)}
                  onMouseLeave={() => setHoveredPet(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPet === idx
                      ? 'bg-white shadow-md text-purple-700'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  {pet.name}
                </button>

                {/* Hover Preview Card */}
                {hoveredPet === idx && selectedPet !== idx && (
                  <div className="absolute z-30 top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl text-white font-bold">
                        {pet.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed} • {pet.gender}</p>
                        {pet.pet_pass_number && (
                          <p className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1 inline-block">
                            {pet.pet_pass_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                          style={{ width: `${petScore.total}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-purple-600">{petScore.total}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Click to view full profile</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Pet Soul Card */}
      {currentPet && (
        <Card className="overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
          {/* Header with Score Circle */}
          <div className="p-6">
            <div className="flex items-center gap-6">
              {/* Circular Score */}
              <div className="relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/20"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${soulScore.total * 3.14} 314`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{soulScore.total}%</span>
                  <span className="text-xs text-purple-300">Pet Soul</span>
                </div>
              </div>
              
              {/* Pet Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{currentPet.name}'s Pet Soul Journey</h2>
                <p className="text-purple-300 mb-2">{currentPet.breed} • {currentPet.gender}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50">
                    {getStageName(soulScore.total)}
                  </Badge>
                  {currentPet.pet_pass_number && (
                    <Badge className="bg-white/10 text-white border-white/30 font-mono">
                      🎫 {currentPet.pet_pass_number}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 14 Pillars Grid */}
          <div className="px-6 pb-6">
            <p className="text-sm text-purple-300 mb-3">Soul Pillars</p>
            <div className="grid grid-cols-4 gap-3">
              {SOUL_CATEGORIES.map(pillar => {
                const pillarScore = soulScore.breakdown[pillar.key]?.percent || 0;
                const insight = getPillarInsight(pillar.key, currentPet);
                const isSelected = selectedPillar === pillar.key;
                const hasData = pillarScore > 0 || insight;
                
                return (
                  <button
                    key={pillar.key}
                    onClick={() => setSelectedPillar(isSelected ? null : pillar.key)}
                    className={`p-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-white text-gray-900 shadow-lg scale-105'
                        : hasData
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-white/5 hover:bg-white/10 opacity-60'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{pillar.icon}</span>
                    <p className="text-xs font-medium truncate">{pillar.label}</p>
                    {insight && !isSelected && (
                      <p className="text-[10px] text-purple-300 truncate mt-1">{insight}</p>
                    )}
                    <div className={`w-full h-1 rounded-full mt-2 ${isSelected ? 'bg-gray-200' : 'bg-white/20'}`}>
                      <div 
                        className={`h-full rounded-full ${pillar.color}`}
                        style={{ width: `${pillarScore}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Pillar Details */}
          {selectedPillar && (
            <div className="mx-6 mb-6 p-4 bg-white/10 backdrop-blur rounded-xl animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">
                  {SOUL_CATEGORIES.find(p => p.key === selectedPillar)?.icon}
                </span>
                <h4 className="font-bold">
                  {SOUL_CATEGORIES.find(p => p.key === selectedPillar)?.label}
                </h4>
              </div>
              
              {Object.keys(getPillarData(currentPet, selectedPillar)).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(getPillarData(currentPet, selectedPillar)).map(([field, value]) => (
                    <div key={field} className="p-2 bg-white/10 rounded-lg">
                      <p className="text-[10px] text-purple-300 uppercase">{field}</p>
                      <p className="text-sm font-medium truncate">{String(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-purple-300 text-center py-4">
                  No data collected yet for this pillar
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 bg-black/20 flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => {
                // Open member's Pet Soul Journey page in new tab
                const petId = currentPet?.id || currentPet?._id;
                if (petId) {
                  window.open(`/pet/${petId}`, '_blank');
                } else {
                  alert('Pet ID not found. Unable to open full profile.');
                }
              }}
            >
              <Eye className="w-4 h-4 mr-1" /> View Full Soul
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => {
                // Open Mira chat for Soul Whisper
                window.dispatchEvent(new CustomEvent('openMiraAI', { 
                  detail: { 
                    prefilledMessage: `Send a Soul Whisper question to ${currentPet?.name || 'this pet'}'s parent`,
                    petId: currentPet?.id
                  }
                }));
              }}
            >
              <MessageSquare className="w-4 h-4 mr-1" /> Send Soul Whisper
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => openPetEdit(currentPet)}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
        </Card>
      )}
      
      {/* Pet Edit Modal */}
      {editingPet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                  Edit {editingPet.name}
                </h3>
                <button onClick={closePetEdit} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={petEditForm.name}
                    onChange={(e) => setPetEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Pet name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                    <Input
                      value={petEditForm.breed}
                      onChange={(e) => setPetEditForm(prev => ({ ...prev, breed: e.target.value }))}
                      placeholder="e.g., Labrador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={petEditForm.gender}
                      onChange={(e) => setPetEditForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                    <Input
                      type="date"
                      value={petEditForm.birth_date}
                      onChange={(e) => setPetEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <Input
                      type="number"
                      value={petEditForm.weight}
                      onChange={(e) => setPetEditForm(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="e.g., 25"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies</label>
                  <Input
                    value={petEditForm.food_allergies}
                    onChange={(e) => setPetEditForm(prev => ({ ...prev, food_allergies: e.target.value }))}
                    placeholder="e.g., chicken, grains (comma separated)"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={closePetEdit} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={savePetEdit} 
                  disabled={savingPet}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {savingPet ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemberDirectory;
