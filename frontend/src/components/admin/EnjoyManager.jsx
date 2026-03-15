/**
 * EnjoyManager - Admin component for Enjoy Pillar
 * Manages experiences, RSVPs, partners, products, and settings
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { API_URL } from '../../utils/api';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import PillarServicesTab from './PillarServicesTab';
import PillarBundlesTab from './PillarBundlesTab';
import {
  PartyPopper, Calendar, MapPin, Users, Ticket, Building2, Package,
  Settings, Search, Plus, Edit2, Trash2, RefreshCw, Eye, Clock,
  CheckCircle, XCircle, Star, Coffee, Mountain, GraduationCap, Heart,
  Download, Upload, Database, Briefcase
} from 'lucide-react';

const EXPERIENCE_TYPE_ICONS = {
  event: PartyPopper,
  trail: Mountain,
  meetup: Users,
  cafe: Coffee,
  workshop: GraduationCap,
  wellness: Heart
};

const EXPERIENCE_TYPE_COLORS = {
  event: 'from-purple-500 to-pink-500',
  trail: 'from-green-500 to-emerald-500',
  meetup: 'from-blue-500 to-cyan-500',
  cafe: 'from-amber-500 to-orange-500',
  workshop: 'from-indigo-500 to-violet-500',
  wellness: 'from-teal-500 to-cyan-500'
};

const STATUS_BADGES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  attended: { label: 'Attended', color: 'bg-blue-100 text-blue-700' },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700' }
};

const EnjoyManager = ({ getAuthHeader }) => {
  const [activeSubTab, setActiveSubTab] = useState('experiences');
  const [experiences, setExperiences] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedRsvp, setSelectedRsvp] = useState(null);
  
  // Experience Form
  const [experienceForm, setExperienceForm] = useState({
    name: '', description: '', experience_type: 'event',
    city: '', venue_name: '', address: '',
    event_date: '', start_time: '', end_time: '',
    is_recurring: false, recurrence_pattern: '',
    max_capacity: '', price: '0', member_price: '', is_free: false,
    pet_personalities: '', pet_sizes_allowed: '',
    vaccination_required: true, leash_required: true,
    image: '', paw_reward_points: '0', member_exclusive: false,
    tags: '', is_active: true, is_featured: false
  });
  
  // Partner Form
  const [partnerForm, setPartnerForm] = useState({
    name: '', partner_type: 'venue', description: '',
    contact_name: '', contact_email: '', contact_phone: '',
    website: '', cities: '', commission_percent: '0',
    is_verified: false, is_active: true
  });

  // Product Form
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    image: '', enjoy_type: 'outdoor', subcategory: '',
    tags: '', pet_sizes: 'small, medium, large',
    in_stock: true, paw_reward_points: '0',
    is_birthday_perk: false, birthday_discount_percent: ''
  });

  // Settings state
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch each endpoint separately to handle individual failures gracefully
      let expData = [], rsvpData = [], partnerData = [], statsData = {}, prodData = [];
      
      try {
        const expRes = await axios.get(`${API_URL}/api/enjoy/experiences?upcoming_only=false`);
        expData = expRes.data.experiences || [];
      } catch (e) { console.log('Experiences fetch failed:', e.message); }
      
      try {
        const rsvpRes = await axios.get(`${API_URL}/api/enjoy/rsvps`);
        rsvpData = rsvpRes.data.rsvps || [];
      } catch (e) { console.log('RSVPs fetch failed:', e.message); }
      
      try {
        const partnerRes = await axios.get(`${API_URL}/api/enjoy/admin/partners`);
        partnerData = partnerRes.data.partners || [];
      } catch (e) { console.log('Partners fetch failed:', e.message); }
      
      try {
        const statsRes = await axios.get(`${API_URL}/api/enjoy/stats`);
        statsData = statsRes.data || {};
      } catch (e) { console.log('Stats fetch failed:', e.message); }
      
      try {
        const prodRes = await axios.get(`${API_URL}/api/enjoy/products`);
        prodData = prodRes.data.products || [];
      } catch (e) { console.log('Products fetch failed:', e.message); }
      
      setExperiences(expData);
      setRsvps(rsvpData);
      setPartners(partnerData);
      setStats(statsData);
      setProducts(prodData);
    } catch (error) {
      console.error('Error fetching enjoy data:', error);
      toast({ title: 'Error', description: 'Failed to load some enjoy data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/enjoy/admin/seed`, {}, getAuthHeader());
      toast({ title: 'Success', description: `Seeded ${response.data.experiences_seeded} experiences and ${response.data.products_seeded} products` });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
  };

  // Experience CRUD
  const resetExperienceForm = () => {
    setExperienceForm({
      name: '', description: '', experience_type: 'event',
      city: '', venue_name: '', address: '',
      event_date: '', start_time: '', end_time: '',
      is_recurring: false, recurrence_pattern: '',
      max_capacity: '', price: '0', member_price: '', is_free: false,
      pet_personalities: '', pet_sizes_allowed: '',
      vaccination_required: true, leash_required: true,
      image: '', paw_reward_points: '0', member_exclusive: false,
      tags: '', is_active: true, is_featured: false
    });
  };

  const saveExperience = async () => {
    try {
      const payload = {
        ...experienceForm,
        max_capacity: experienceForm.max_capacity ? parseInt(experienceForm.max_capacity) : null,
        price: parseFloat(experienceForm.price) || 0,
        member_price: experienceForm.member_price ? parseFloat(experienceForm.member_price) : null,
        paw_reward_points: parseInt(experienceForm.paw_reward_points) || 0,
        pet_personalities: experienceForm.pet_personalities.split(',').map(s => s.trim()).filter(Boolean),
        pet_sizes_allowed: experienceForm.pet_sizes_allowed.split(',').map(s => s.trim()).filter(Boolean),
        tags: experienceForm.tags.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingExperience) {
        await axios.put(`${API_URL}/api/enjoy/admin/experiences/${editingExperience.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Experience updated' });
      } else {
        await axios.post(`${API_URL}/api/enjoy/admin/experiences`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Experience created' });
      }
      setShowExperienceModal(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save experience', variant: 'destructive' });
    }
  };

  const deleteExperience = async (id) => {
    if (!confirm('Delete this experience?')) return;
    try {
      await axios.delete(`${API_URL}/api/enjoy/admin/experiences/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Experience deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete experience', variant: 'destructive' });
    }
  };

  // RSVP Status Update
  const updateRsvpStatus = async (rsvpId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/enjoy/admin/rsvp/${rsvpId}?status=${newStatus}`, {}, getAuthHeader());
      toast({ title: 'Success', description: `RSVP ${newStatus}` });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update RSVP', variant: 'destructive' });
    }
  };

  // Partner CRUD
  const resetPartnerForm = () => {
    setPartnerForm({
      name: '', partner_type: 'venue', description: '',
      contact_name: '', contact_email: '', contact_phone: '',
      website: '', cities: '', commission_percent: '0',
      is_verified: false, is_active: true
    });
  };

  const savePartner = async () => {
    try {
      const payload = {
        ...partnerForm,
        commission_percent: parseFloat(partnerForm.commission_percent) || 0,
        cities: partnerForm.cities.split(',').map(c => c.trim()).filter(Boolean)
      };

      if (editingPartner) {
        await axios.put(`${API_URL}/api/enjoy/admin/partners/${editingPartner.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner updated' });
      } else {
        await axios.post(`${API_URL}/api/enjoy/admin/partners`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Partner created' });
      }
      setShowPartnerModal(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save partner', variant: 'destructive' });
    }
  };

  const deletePartner = async (id) => {
    if (!confirm('Delete this partner?')) return;
    try {
      await axios.delete(`${API_URL}/api/enjoy/admin/partners/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Partner deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete partner', variant: 'destructive' });
    }
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: '', description: '', price: '', compare_price: '',
      image: '', enjoy_type: 'outdoor', subcategory: '',
      tags: '', pet_sizes: 'small, medium, large',
      in_stock: true, paw_reward_points: '0',
      is_birthday_perk: false, birthday_discount_percent: ''
    });
  };

  const saveProduct = async () => {
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        compare_price: parseFloat(productForm.compare_price) || null,
        paw_reward_points: parseInt(productForm.paw_reward_points) || 0,
        birthday_discount_percent: productForm.is_birthday_perk ? (parseInt(productForm.birthday_discount_percent) || 0) : null,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        pet_sizes: productForm.pet_sizes.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      if (editingProduct) {
        await axios.put(`${API_URL}/api/enjoy/admin/products/${editingProduct.id}`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await axios.post(`${API_URL}/api/enjoy/admin/products`, payload, getAuthHeader());
        toast({ title: 'Success', description: 'Product created' });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/api/enjoy/admin/products/${id}`, getAuthHeader());
      toast({ title: 'Success', description: 'Product deleted' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  // CSV Export
  const exportProductsCSV = () => {
    const headers = ['Name', 'Description', 'Price', 'Compare Price', 'Type', 'In Stock', 'Paw Points'];
    const rows = products.map(p => [
      p.name, p.description, p.price, p.compare_price || '', p.enjoy_type, p.in_stock ? 'Yes' : 'No', p.paw_reward_points
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enjoy-products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExperiencesCSV = () => {
    const headers = ['Name', 'Type', 'City', 'Date', 'Venue', 'Price', 'Max Capacity', 'Paw Points'];
    const rows = experiences.map(e => [
      e.name, e.experience_type, e.city, e.event_date || '', e.venue_name, e.price, e.max_capacity, e.paw_reward_points
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enjoy-experiences.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filters
  const filteredExperiences = experiences.filter(e => {
    if (typeFilter !== 'all' && e.experience_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.name?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredRsvps = rsvps.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.rsvp_id?.toLowerCase().includes(q) || r.pet?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PartyPopper className="w-7 h-7 text-orange-600" />
            Enjoy Manager
          </h2>
          <p className="text-gray-500">Manage experiences, RSVPs, partners & products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportExperiencesCSV}>
            <Download className="w-4 h-4 mr-1" /> Export Experiences
          </Button>
          <Button variant="outline" size="sm" onClick={exportProductsCSV}>
            <Download className="w-4 h-4 mr-1" /> Export Products
          </Button>
          <Button variant="outline" size="sm" onClick={seedData}>
            <Database className="w-4 h-4 mr-1" /> Seed Data
          </Button>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Total Experiences</p>
              <p className="text-2xl font-bold">{stats.total_experiences || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Total RSVPs</p>
              <p className="text-2xl font-bold">{stats.total_rsvps || 0}</p>
            </div>
            <Ticket className="w-8 h-8 text-amber-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-50 to-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-600">Pending RSVPs</p>
              <p className="text-2xl font-bold">{stats.pending_rsvps || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-rose-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">Confirmed</p>
              <p className="text-2xl font-bold">{stats.confirmed_rsvps || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="experiences" data-testid="enjoy-tab-experiences">
            <Calendar className="w-4 h-4 mr-2" /> Experiences
          </TabsTrigger>
          <TabsTrigger value="rsvps" data-testid="enjoy-tab-rsvps">
            <Ticket className="w-4 h-4 mr-2" /> RSVPs
          </TabsTrigger>
          <TabsTrigger value="partners" data-testid="enjoy-tab-partners">
            <Building2 className="w-4 h-4 mr-2" /> Partners
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="enjoy-tab-products">
            <Package className="w-4 h-4 mr-2" /> Products
          </TabsTrigger>
          <TabsTrigger value="bundles" data-testid="enjoy-tab-bundles">
            <Package className="w-4 h-4 mr-2" /> Bundles
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="enjoy-tab-services">
            <Briefcase className="w-4 h-4 mr-2" /> Services
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="enjoy-tab-settings">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Experiences Tab */}
        <TabsContent value="experiences" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search experiences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="trail">Trails</SelectItem>
                    <SelectItem value="meetup">Meetups</SelectItem>
                    <SelectItem value="cafe">Cafés</SelectItem>
                    <SelectItem value="workshop">Workshops</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { resetExperienceForm(); setEditingExperience(null); setShowExperienceModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExperiences.map((exp) => {
              const Icon = EXPERIENCE_TYPE_ICONS[exp.experience_type] || PartyPopper;
              return (
                <Card key={exp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-24 bg-gradient-to-br ${EXPERIENCE_TYPE_COLORS[exp.experience_type] || 'from-gray-400 to-gray-500'} p-4 relative`}>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {exp.is_featured && <Badge className="bg-yellow-400 text-yellow-900 text-xs">Featured</Badge>}
                      {exp.member_exclusive && <Badge className="bg-purple-500 text-white text-xs">Members</Badge>}
                    </div>
                    <Icon className="w-8 h-8 text-white/80" />
                    <p className="text-white/80 text-sm mt-1 capitalize">{exp.experience_type}</p>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 truncate">{exp.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {exp.city} {exp.venue_name && `• ${exp.venue_name}`}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {exp.event_date || 'Ongoing'} {exp.start_time && `at ${exp.start_time}`}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-green-600">
                        {exp.is_free ? 'Free' : `₹${exp.price}`}
                      </span>
                      <span className="text-sm text-gray-400">
                        {exp.current_bookings || 0}/{exp.max_capacity || '∞'} booked
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingExperience(exp);
                        setExperienceForm({
                          name: exp.name || '',
                          description: exp.description || '',
                          experience_type: exp.experience_type || 'event',
                          city: exp.city || '',
                          venue_name: exp.venue_name || '',
                          address: exp.address || '',
                          event_date: exp.event_date || '',
                          start_time: exp.start_time || '',
                          end_time: exp.end_time || '',
                          is_recurring: exp.is_recurring || false,
                          recurrence_pattern: exp.recurrence_pattern || '',
                          max_capacity: exp.max_capacity?.toString() || '',
                          price: exp.price?.toString() || '0',
                          member_price: exp.member_price?.toString() || '',
                          is_free: exp.is_free || false,
                          pet_personalities: (exp.pet_personalities || []).join(', '),
                          pet_sizes_allowed: (exp.pet_sizes_allowed || []).join(', '),
                          vaccination_required: exp.vaccination_required !== false,
                          leash_required: exp.leash_required !== false,
                          image: exp.image || '',
                          paw_reward_points: exp.paw_reward_points?.toString() || '0',
                          member_exclusive: exp.member_exclusive || false,
                          tags: (exp.tags || []).join(', '),
                          is_active: exp.is_active !== false,
                          is_featured: exp.is_featured || false
                        });
                        setShowExperienceModal(true);
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteExperience(exp.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredExperiences.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No experiences found</p>
              <Button className="mt-4" onClick={seedData}>Seed Sample Experiences</Button>
            </Card>
          )}
        </TabsContent>

        {/* RSVPs Tab */}
        <TabsContent value="rsvps" className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search RSVPs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="space-y-3">
            {filteredRsvps.map((rsvp) => {
              const statusBadge = STATUS_BADGES[rsvp.status] || STATUS_BADGES.pending;
              return (
                <Card key={rsvp.rsvp_id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{rsvp.rsvp_id}</span>
                        <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      </div>
                      <h4 className="font-semibold">{rsvp.experience_name}</h4>
                      <p className="text-sm text-gray-500">
                        {rsvp.pet?.name} • {rsvp.customer?.name} • {rsvp.event_date}
                      </p>
                    </div>
                    <Select
                      value={rsvp.status}
                      onValueChange={(val) => updateRsvpStatus(rsvp.rsvp_id, val)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredRsvps.length === 0 && (
            <Card className="p-8 text-center">
              <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No RSVPs yet</p>
            </Card>
          )}
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Experience Partners</h3>
              <Button onClick={() => { resetPartnerForm(); setEditingPartner(null); setShowPartnerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{partner.name}</h4>
                      {partner.is_verified && <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{partner.partner_type}</p>
                    {partner.cities?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{partner.cities.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingPartner(partner);
                    setPartnerForm({
                      name: partner.name || '',
                      partner_type: partner.partner_type || 'venue',
                      description: partner.description || '',
                      contact_name: partner.contact_name || '',
                      contact_email: partner.contact_email || '',
                      contact_phone: partner.contact_phone || '',
                      website: partner.website || '',
                      cities: (partner.cities || []).join(', '),
                      commission_percent: partner.commission_percent?.toString() || '0',
                      is_verified: partner.is_verified || false,
                      is_active: partner.is_active !== false
                    });
                    setShowPartnerModal(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => deletePartner(partner.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {partners.length === 0 && (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No partners yet</p>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Enjoy Products ({products.length})</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportProductsCSV}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                <Button size="sm" onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{product.enjoy_type || 'general'}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingProduct(product);
                      setProductForm({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price?.toString() || '',
                        compare_price: product.compare_price?.toString() || '',
                        image: product.image || '',
                        enjoy_type: product.enjoy_type || 'outdoor',
                        subcategory: product.subcategory || '',
                        tags: (product.tags || []).join(', '),
                        pet_sizes: (product.pet_sizes || ['small', 'medium', 'large']).join(', '),
                        in_stock: product.in_stock !== false,
                        paw_reward_points: product.paw_reward_points?.toString() || '0',
                        is_birthday_perk: product.is_birthday_perk || false,
                        birthday_discount_percent: product.birthday_discount_percent?.toString() || ''
                      });
                      setShowProductModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div>
                    <span className="font-bold text-green-600">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="text-sm text-gray-400 line-through ml-2">₹{product.compare_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.paw_reward_points > 0 && (
                      <Badge variant="outline" className="text-xs">🐾 {product.paw_reward_points} pts</Badge>
                    )}
                    {product.is_birthday_perk && (
                      <Badge className="text-xs bg-pink-100 text-pink-700">🎂 Birthday</Badge>
                    )}
                    <Badge variant={product.in_stock ? 'default' : 'secondary'} className="text-xs">
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {products.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products yet. Click &quot;Add Product&quot; to create one.</p>
            </Card>
          )}
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <PillarBundlesTab 
            pillar="enjoy"
            accentColor="purple"
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <PillarServicesTab 
            pillar="enjoy"
            pillarName="Enjoy"
            pillarIcon="🎉"
            pillarColor="bg-purple-500"
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐾 Paw Rewards Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per RSVP</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_rsvp || 25}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Points per Product Purchase (per ₹100)</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.points_per_purchase || 10}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Bonus Points for Featured Events</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.featured_bonus || 15}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Referral Bonus Points</Label>
                <Input 
                  type="number" 
                  value={settings.paw_rewards?.referral_bonus || 50}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎂 Birthday Perks Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Birthday Discount %</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.discount_percent || 20}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valid Days (before/after birthday)</Label>
                <Input 
                  type="number" 
                  value={settings.birthday_perks?.valid_days || 7}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🔔 Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch checked={settings.notifications?.email_enabled !== false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>WhatsApp Notifications</Label>
                <Switch checked={settings.notifications?.whatsapp_enabled || false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch checked={settings.notifications?.sms_enabled || false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>RSVP Reminders (24h before)</Label>
                <Switch checked={settings.notifications?.rsvp_reminder !== false} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🌍 City & Region Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Active Cities (comma-separated)</Label>
                <Input 
                  value={settings.active_cities?.join(', ') || 'Mumbai, Delhi, Bangalore, Pune, Hyderabad, Goa'}
                  className="mt-1"
                  placeholder="Mumbai, Delhi, Bangalore"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Global Cities</Label>
                <Switch checked={settings.enable_global_cities || false} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Service Desk Integration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-create tickets for RSVPs</Label>
                <Switch checked={settings.service_desk?.auto_create_tickets !== false} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Route to Partners</Label>
                <Switch checked={settings.service_desk?.route_to_partners || false} />
              </div>
              <div>
                <Label>Default SLA (hours)</Label>
                <Input 
                  type="number" 
                  value={settings.service_desk?.default_sla || 24}
                  className="mt-1 w-32"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Experience Modal */}
      <Dialog open={showExperienceModal} onOpenChange={setShowExperienceModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Experience Name</Label>
                <Input value={experienceForm.name} onChange={(e) => setExperienceForm({...experienceForm, name: e.target.value})} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={experienceForm.experience_type} onValueChange={(val) => setExperienceForm({...experienceForm, experience_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="trail">Trail</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input value={experienceForm.city} onChange={(e) => setExperienceForm({...experienceForm, city: e.target.value})} />
              </div>
              <div>
                <Label>Venue Name</Label>
                <Input value={experienceForm.venue_name} onChange={(e) => setExperienceForm({...experienceForm, venue_name: e.target.value})} />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input type="date" value={experienceForm.event_date} onChange={(e) => setExperienceForm({...experienceForm, event_date: e.target.value})} />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={experienceForm.start_time} onChange={(e) => setExperienceForm({...experienceForm, start_time: e.target.value})} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={experienceForm.end_time} onChange={(e) => setExperienceForm({...experienceForm, end_time: e.target.value})} />
              </div>
              <div>
                <Label>Max Capacity</Label>
                <Input type="number" value={experienceForm.max_capacity} onChange={(e) => setExperienceForm({...experienceForm, max_capacity: e.target.value})} />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={experienceForm.price} onChange={(e) => setExperienceForm({...experienceForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Member Price (₹)</Label>
                <Input type="number" value={experienceForm.member_price} onChange={(e) => setExperienceForm({...experienceForm, member_price: e.target.value})} />
              </div>
              <div>
                <Label>Paw Reward Points</Label>
                <Input type="number" value={experienceForm.paw_reward_points} onChange={(e) => setExperienceForm({...experienceForm, paw_reward_points: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Pet Personalities (comma-separated)</Label>
                <Input value={experienceForm.pet_personalities} onChange={(e) => setExperienceForm({...experienceForm, pet_personalities: e.target.value})} placeholder="calm, social, adventurous" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={experienceForm.description} onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2">
                <Switch checked={experienceForm.is_free} onCheckedChange={(val) => setExperienceForm({...experienceForm, is_free: val})} />
                <span>Free Event</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={experienceForm.is_featured} onCheckedChange={(val) => setExperienceForm({...experienceForm, is_featured: val})} />
                <span>Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={experienceForm.member_exclusive} onCheckedChange={(val) => setExperienceForm({...experienceForm, member_exclusive: val})} />
                <span>Members Only</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={experienceForm.is_active} onCheckedChange={(val) => setExperienceForm({...experienceForm, is_active: val})} />
                <span>Active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExperienceModal(false)}>Cancel</Button>
            <Button onClick={saveExperience}>Save Experience</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Modal */}
      <Dialog open={showPartnerModal} onOpenChange={setShowPartnerModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner Name</Label>
              <Input value={partnerForm.name} onChange={(e) => setPartnerForm({...partnerForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={partnerForm.partner_type} onValueChange={(val) => setPartnerForm({...partnerForm, partner_type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cities (comma-separated)</Label>
              <Input value={partnerForm.cities} onChange={(e) => setPartnerForm({...partnerForm, cities: e.target.value})} placeholder="Mumbai, Delhi, Bangalore" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input value={partnerForm.contact_name} onChange={(e) => setPartnerForm({...partnerForm, contact_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={partnerForm.contact_phone} onChange={(e) => setPartnerForm({...partnerForm, contact_phone: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.is_verified} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_verified: val})} />
                <span>Verified</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={partnerForm.is_active} onCheckedChange={(val) => setPartnerForm({...partnerForm, is_active: val})} />
                <span>Active</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerModal(false)}>Cancel</Button>
            <Button onClick={savePartner}>Save Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} />
              </div>
              <div>
                <Label>Compare Price (₹)</Label>
                <Input type="number" value={productForm.compare_price} onChange={(e) => setProductForm({...productForm, compare_price: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={productForm.image} onChange={(e) => setProductForm({...productForm, image: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Enjoy Type</Label>
                <Select value={productForm.enjoy_type} onValueChange={(val) => setProductForm({...productForm, enjoy_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="fun">Fun</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input value={productForm.subcategory} onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={productForm.tags} onChange={(e) => setProductForm({...productForm, tags: e.target.value})} placeholder="outdoor, fun, adventure" />
            </div>
            <div>
              <Label>Pet Sizes (comma-separated)</Label>
              <Input value={productForm.pet_sizes} onChange={(e) => setProductForm({...productForm, pet_sizes: e.target.value})} placeholder="small, medium, large" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paw Reward Points</Label>
                <Input type="number" value={productForm.paw_reward_points} onChange={(e) => setProductForm({...productForm, paw_reward_points: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={productForm.in_stock} onCheckedChange={(val) => setProductForm({...productForm, in_stock: val})} />
                <Label>In Stock</Label>
              </div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-sm">🎂 Birthday Perks</h4>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.is_birthday_perk} onCheckedChange={(val) => setProductForm({...productForm, is_birthday_perk: val})} />
                <Label>Birthday Perk Item</Label>
              </div>
              {productForm.is_birthday_perk && (
                <div>
                  <Label>Birthday Discount %</Label>
                  <Input type="number" value={productForm.birthday_discount_percent} onChange={(e) => setProductForm({...productForm, birthday_discount_percent: e.target.value})} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>Cancel</Button>
            <Button onClick={saveProduct}>{editingProduct ? 'Update' : 'Create'} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnjoyManager;
