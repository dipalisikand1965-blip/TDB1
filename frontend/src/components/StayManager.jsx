import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_URL } from '../utils/api';
import {
  Search, Plus, Edit, Trash2, Save, Loader2, Eye, EyeOff,
  Building2, MapPin, Phone, Globe, Mail, Star, Dog, CheckCircle,
  AlertTriangle, FileText, DollarSign, Calendar, Clock, RefreshCw,
  ChevronDown, X, Filter, Download, Upload, PawPrint, Shield,
  TreePine, Heart, Sparkles, Users, MessageCircle, TrendingUp, Gift, Tag
} from 'lucide-react';

const StayManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPawRewardModal, setShowPawRewardModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [pillarTags, setPillarTags] = useState([]);
  const [filters, setFilters] = useState({ status: '', city: '', type: '' });
  const [cities, setCities] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propsRes, bookingsRes, statsRes, mismatchRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stay/properties?${new URLSearchParams(filters)}`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/bookings`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/stats`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/mismatch-reports`, { headers: getAuthHeader() })
      ]);

      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
        setCities(data.cities || []);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (mismatchRes.ok) {
        const data = await mismatchRes.json();
        setMismatches(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching stay data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const fetchEligibleProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/paw-rewards/eligible-products`);
      if (response.ok) {
        const data = await response.json();
        setEligibleProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching eligible products:', error);
    }
  };
  
  const fetchPillarTags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stay/tags?pillar=stay`);
      if (response.ok) {
        const data = await response.json();
        setPillarTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  const handleUpdatePawReward = async (propertyId, pawReward) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/properties/${propertyId}/paw-reward`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pawReward)
      });
      if (response.ok) {
        alert('Paw Reward updated successfully!');
        fetchData();
        setShowPawRewardModal(false);
      }
    } catch (error) {
      console.error('Error updating Paw Reward:', error);
      alert('Failed to update Paw Reward');
    }
  };
  
  const handleBulkAssignPawRewards = async () => {
    if (!window.confirm('This will auto-assign Paw Rewards to all properties that don\'t have one. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/properties/assign-paw-rewards`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      const data = await response.json();
      alert(data.message);
      fetchData();
    } catch (error) {
      console.error('Error assigning Paw Rewards:', error);
      alert('Failed to assign Paw Rewards');
    }
  };

  const handleSeedProperties = async () => {
    if (!window.confirm('This will seed the database with 32 curated pet-friendly hotels from across India. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/seed?force_reseed=false`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      const data = await response.json();
      alert(`Seeded ${data.seeded} properties!`);
      fetchData();
    } catch (error) {
      console.error('Error seeding:', error);
      alert('Failed to seed properties');
    }
  };

  const handleUpdateStatus = async (propertyId, status) => {
    try {
      await fetch(`${API_URL}/api/admin/stay/properties/${propertyId}/status?status=${status}`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status, notes) => {
    try {
      await fetch(`${API_URL}/api/admin/stay/bookings/${bookingId}/status?status=${status}${notes ? `&concierge_notes=${encodeURIComponent(notes)}` : ''}`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      fetchData();
      setShowBookingModal(false);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await fetch(`${API_URL}/api/admin/stay/properties/${propertyId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      onboarding: 'bg-blue-100 text-blue-700',
      live: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      suspended: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      contacted: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.properties?.live || 0}</p>
              <p className="text-sm text-gray-500">Live Properties</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.properties?.total || 0}</p>
              <p className="text-sm text-gray-500">Total Properties</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.bookings?.pending || 0}</p>
              <p className="text-sm text-gray-500">Pending Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.bookings?.confirmed || 0}</p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Dog className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.properties?.with_pet_menu || 0}</p>
              <p className="text-sm text-gray-500">With Pet Menu</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.mismatches?.open || 0}</p>
              <p className="text-sm text-gray-500">Open Issues</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          {/* Filters & Actions */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search properties..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="onboarding">Onboarding</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>

              <Button variant="outline" onClick={handleSeedProperties}>
                <Upload className="w-4 h-4 mr-2" /> Seed Data
              </Button>
              
              <Button 
                variant="outline" 
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                onClick={handleBulkAssignPawRewards}
              >
                <Gift className="w-4 h-4 mr-2" /> Assign Paw Rewards
              </Button>

              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { setSelectedProperty(null); setShowPropertyModal(true); }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Property
              </Button>
            </div>
          </Card>

          {/* Properties List */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="grid gap-4">
              {properties.map((property) => (
                <PropertyRow 
                  key={property.id}
                  property={property}
                  onEdit={() => { setSelectedProperty(property); setShowPropertyModal(true); }}
                  onDelete={() => handleDeleteProperty(property.id)}
                  onStatusChange={handleUpdateStatus}
                  getStatusColor={getStatusColor}
                />
              ))}

              {properties.length === 0 && (
                <Card className="p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No properties found</p>
                  <Button className="mt-4" onClick={handleSeedProperties}>
                    Seed Initial Properties
                  </Button>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Booking Requests</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-yellow-50">
                  {bookings.filter(b => b.status === 'pending').length} Pending
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  {bookings.filter(b => b.status === 'confirmed').length} Confirmed
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {bookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setSelectedBooking(booking); setShowBookingModal(true); }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.guest_name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.property_name} • {booking.check_in_date} to {booking.check_out_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Dog className="w-4 h-4" /> {booking.pet_name}
                      </p>
                      <p className="text-xs text-gray-500">{booking.num_pets} pet(s), {booking.num_adults} adults</p>
                    </div>
                    <Badge className={getBookingStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {bookings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No booking requests yet
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Policy Mismatch Reports</h3>
            <div className="space-y-3">
              {mismatches.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{report.property_name}</p>
                      <p className="text-sm text-gray-500">{report.issue_type}: {report.description}</p>
                      <p className="text-xs text-gray-400">Reported by: {report.reporter_name}</p>
                    </div>
                  </div>
                  <Badge className={report.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {report.status}
                  </Badge>
                </div>
              ))}

              {mismatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-4" />
                  No open issues - great job maintaining trust!
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> By Property Type
              </h3>
              <div className="space-y-3">
                {stats.by_type?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="capitalize">{item._id || 'Unknown'}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> By City
              </h3>
              <div className="space-y-3">
                {stats.by_city?.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{item._id || 'Unknown'}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Property Modal */}
      {showPropertyModal && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => { setShowPropertyModal(false); setSelectedProperty(null); }}
          onSave={() => { fetchData(); setShowPropertyModal(false); setSelectedProperty(null); }}
          getAuthHeader={getAuthHeader}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => { setShowBookingModal(false); setSelectedBooking(null); }}
          onUpdateStatus={handleUpdateBookingStatus}
          getBookingStatusColor={getBookingStatusColor}
        />
      )}
    </div>
  );
};

// Property Row Component
const PropertyRow = ({ property, onEdit, onDelete, onStatusChange, getStatusColor }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <img 
          src={property.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} 
          alt={property.name}
          className="w-24 h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-lg">{property.name}</h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {property.area}, {property.city}, {property.state}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(property.status)}>
                {property.status}
              </Badge>
              {property.featured && (
                <Badge className="bg-amber-100 text-amber-700">
                  <Sparkles className="w-3 h-3 mr-1" /> Featured
                </Badge>
              )}
              {property.verified && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1 capitalize">
              <Building2 className="w-4 h-4 text-gray-400" /> {property.property_type}
            </span>
            <span className="flex items-center gap-1">
              <PawPrint className="w-4 h-4 text-amber-500" /> {property.paw_rating?.overall?.toFixed(1) || '0.0'}
            </span>
            {property.pet_menu_available && (
              <span className="flex items-center gap-1 text-green-600">
                <Dog className="w-4 h-4" /> Pet Menu
              </span>
            )}
            {property.badges?.length > 0 && (
              <span className="text-gray-500">{property.badges.length} badges</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="w-3 h-3 mr-1" /> Edit
            </Button>
            
            <select
              value={property.status}
              onChange={(e) => onStatusChange(property.id, e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="draft">Draft</option>
              <option value="onboarding">Onboarding</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
              <option value="suspended">Suspended</option>
            </select>

            {property.website && (
              <Button size="sm" variant="ghost" asChild>
                <a href={property.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-3 h-3 mr-1" /> Website
                </a>
              </Button>
            )}

            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Property Modal with 5 Tabs
const PropertyModal = ({ property, onClose, onSave, getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('basics');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(property || {
    name: '',
    property_type: 'resort',
    city: '',
    area: '',
    state: '',
    country: 'India',
    full_address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    description: '',
    highlights: [],
    vibe_tags: [],
    photos: [],
    pet_policy: {
      max_pets_per_room: 1,
      max_weight_kg: null,
      pet_fee_per_night: 0,
      pet_deposit: 0,
      allowed_in_room: true,
      allowed_in_lawn: true,
      vaccination_required: true
    },
    pet_policy_snapshot: '',
    paw_rating: { comfort: 0, safety: 0, freedom: 0, care: 0, joy: 0 },
    badges: [],
    compliance_status: 'pending',
    pet_menu_available: false,
    pet_menu_items: [],
    commercials: {
      contract_type: 'commission',
      commission_rate: 12,
      member_price_discount: 0
    },
    room_categories: [],
    human_amenities: [],
    status: 'draft',
    featured: false,
    verified: false,
    internal_notes: ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = property?.id 
        ? `${API_URL}/api/admin/stay/properties/${property.id}`
        : `${API_URL}/api/admin/stay/properties`;
      
      const response = await fetch(url, {
        method: property?.id ? 'PUT' : 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Failed to save property');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{property?.id ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="pet-policy">Pet Policy</TabsTrigger>
            <TabsTrigger value="paw-standards">Paw Standards</TabsTrigger>
            <TabsTrigger value="pet-menu">Pet Menu</TabsTrigger>
            <TabsTrigger value="commercials">Commercials</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            {/* TAB 1: Basics */}
            <TabsContent value="basics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property Name *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Property Type *</Label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => updateField('property_type', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="resort">Resort</option>
                    <option value="hotel">Hotel</option>
                    <option value="villa">Villa</option>
                    <option value="farmstay">Farmstay</option>
                    <option value="homestay">Homestay</option>
                  </select>
                </div>
                <div>
                  <Label>City *</Label>
                  <Input 
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Area</Label>
                  <Input 
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value)}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input 
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input 
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input 
                    value={formData.contact_person}
                    onChange={(e) => updateField('contact_person', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input 
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input 
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Vibe Tags (comma-separated)</Label>
                <Input 
                  value={formData.vibe_tags?.join(', ')}
                  onChange={(e) => updateField('vibe_tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="Beach, Luxury, Quiet, Mountain"
                />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => updateField('featured', e.target.checked)}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => updateField('verified', e.target.checked)}
                  />
                  Verified
                </label>
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea 
                  value={formData.internal_notes}
                  onChange={(e) => updateField('internal_notes', e.target.value)}
                  rows={2}
                  placeholder="Notes visible only to admins..."
                />
              </div>
            </TabsContent>

            {/* TAB 2: Pet Policy */}
            <TabsContent value="pet-policy" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Pets per Room</Label>
                  <Input 
                    type="number"
                    value={formData.pet_policy?.max_pets_per_room || 1}
                    onChange={(e) => updateNestedField('pet_policy', 'max_pets_per_room', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Max Weight (kg)</Label>
                  <Input 
                    type="number"
                    value={formData.pet_policy?.max_weight_kg || ''}
                    onChange={(e) => updateNestedField('pet_policy', 'max_weight_kg', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <Label>Pet Fee per Night (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.pet_policy?.pet_fee_per_night || 0}
                    onChange={(e) => updateNestedField('pet_policy', 'pet_fee_per_night', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Pet Deposit (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.pet_policy?.pet_deposit || 0}
                    onChange={(e) => updateNestedField('pet_policy', 'pet_deposit', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Pet Policy Snapshot (1-line summary)</Label>
                <Input 
                  value={formData.pet_policy_snapshot}
                  onChange={(e) => updateField('pet_policy_snapshot', e.target.value)}
                  placeholder="e.g., Up to 2 dogs, up to 20 kg, ₹1500/night"
                />
              </div>

              <div>
                <Label className="mb-2 block">Pets Allowed In</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['room', 'lawn', 'lobby', 'restaurant_outdoor', 'restaurant_indoor', 'pool_area'].map(area => (
                    <label key={area} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        checked={formData.pet_policy?.[`allowed_in_${area}`] || false}
                        onChange={(e) => updateNestedField('pet_policy', `allowed_in_${area}`, e.target.checked)}
                      />
                      <span className="capitalize">{area.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input 
                    type="checkbox"
                    checked={formData.pet_policy?.vaccination_required || false}
                    onChange={(e) => updateNestedField('pet_policy', 'vaccination_required', e.target.checked)}
                  />
                  Vaccination Required
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input 
                    type="checkbox"
                    checked={formData.pet_policy?.leash_required || false}
                    onChange={(e) => updateNestedField('pet_policy', 'leash_required', e.target.checked)}
                  />
                  Leash Required in Common Areas
                </label>
              </div>
            </TabsContent>

            {/* TAB 3: Paw Standards */}
            <TabsContent value="paw-standards" className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                <h4 className="font-semibold text-amber-800 mb-2">Paw Rating System</h4>
                <p className="text-sm text-amber-700">
                  Rate each category from 0-5. The overall rating is calculated automatically.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'comfort', label: 'Paw Comfort', desc: 'Beds, bowls, space' },
                  { key: 'safety', label: 'Paw Safety', desc: 'Cleaning, hygiene, policies' },
                  { key: 'freedom', label: 'Paw Freedom', desc: 'Areas dogs can access' },
                  { key: 'care', label: 'Paw Care', desc: 'Grooming, vet support' },
                  { key: 'joy', label: 'Paw Joy', desc: 'Play zones, activities' }
                ].map(cat => (
                  <div key={cat.key} className="flex items-center gap-4">
                    <div className="w-40">
                      <p className="font-medium">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.paw_rating?.[cat.key] || 0}
                      onChange={(e) => updateNestedField('paw_rating', cat.key, parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-semibold">
                      {(formData.paw_rating?.[cat.key] || 0).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <Label>Badges (select all that apply)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Pet Menu', 'Off-leash area', 'Pet sitter', 'Grooming', 'Vet on call', 'Trails', 'Beach access'].map(badge => (
                    <label key={badge} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        checked={formData.badges?.includes(badge)}
                        onChange={(e) => {
                          const newBadges = e.target.checked
                            ? [...(formData.badges || []), badge]
                            : (formData.badges || []).filter(b => b !== badge);
                          updateField('badges', newBadges);
                        }}
                      />
                      {badge}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Compliance Status</Label>
                <select
                  value={formData.compliance_status}
                  onChange={(e) => updateField('compliance_status', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="conditional">Conditional</option>
                  <option value="warning">Warning</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </TabsContent>

            {/* TAB 4: Pet Menu */}
            <TabsContent value="pet-menu" className="space-y-4">
              <label className="flex items-center gap-2 p-3 border rounded-lg">
                <input 
                  type="checkbox"
                  checked={formData.pet_menu_available}
                  onChange={(e) => updateField('pet_menu_available', e.target.checked)}
                />
                <span className="font-medium">Pet Menu Available</span>
              </label>

              {formData.pet_menu_available && (
                <>
                  <div>
                    <Label>Prepared By</Label>
                    <select
                      value={formData.pet_menu_prepared_by || 'hotel'}
                      onChange={(e) => updateField('pet_menu_prepared_by', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="hotel">Hotel Kitchen</option>
                      <option value="doggy_bakery_tie_up">Doggy Bakery Tie-up</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Pet menu items can be managed in detail after saving the property.
                    </p>
                  </div>
                </>
              )}

              <div>
                <Label>Human Amenities (comma-separated)</Label>
                <Input 
                  value={formData.human_amenities?.join(', ')}
                  onChange={(e) => updateField('human_amenities', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="Spa, Pool, Fine dining, Yoga"
                />
              </div>

              <div>
                <Label>Room Categories (comma-separated)</Label>
                <Input 
                  value={formData.room_categories?.join(', ')}
                  onChange={(e) => updateField('room_categories', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="Deluxe Suite, Pool Villa, Garden Room"
                />
              </div>
            </TabsContent>

            {/* TAB 5: Commercials */}
            <TabsContent value="commercials" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Type</Label>
                  <select
                    value={formData.commercials?.contract_type || 'commission'}
                    onChange={(e) => updateNestedField('commercials', 'contract_type', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="commission">Commission</option>
                    <option value="fixed">Fixed Fee</option>
                    <option value="barter">Barter</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div>
                  <Label>Commission Rate (%)</Label>
                  <Input 
                    type="number"
                    value={formData.commercials?.commission_rate || 12}
                    onChange={(e) => updateNestedField('commercials', 'commission_rate', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Member Price Discount (%)</Label>
                <Input 
                  type="number"
                  value={formData.commercials?.member_price_discount || 0}
                  onChange={(e) => updateNestedField('commercials', 'member_price_discount', parseFloat(e.target.value))}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  Commercial terms are confidential and not visible to members.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Booking Modal
const BookingModal = ({ booking, onClose, onUpdateStatus, getBookingStatusColor }) => {
  const [notes, setNotes] = useState(booking.concierge_notes || '');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Booking Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{booking.property_name}</h3>
              <p className="text-sm text-gray-500">{booking.property_city}</p>
            </div>
            <Badge className={getBookingStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Guest</p>
              <p className="font-medium">{booking.guest_name}</p>
              <p className="text-sm text-gray-600">{booking.guest_email}</p>
              <p className="text-sm text-gray-600">{booking.guest_phone}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Stay Details</p>
              <p className="font-medium">{booking.check_in_date} to {booking.check_out_date}</p>
              <p className="text-sm text-gray-600">{booking.num_rooms} room(s), {booking.num_adults} adult(s)</p>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Pet Profile</p>
            <p className="font-medium flex items-center gap-2">
              <Dog className="w-4 h-4" /> {booking.pet_name} ({booking.num_pets} pet(s))
            </p>
            {booking.pet_breed && <p className="text-sm text-gray-600">Breed: {booking.pet_breed}</p>}
            {booking.pet_weight_kg && <p className="text-sm text-gray-600">Weight: {booking.pet_weight_kg} kg</p>}
            {booking.sleep_habits && <p className="text-sm text-gray-600">Sleep: {booking.sleep_habits}</p>}
            {booking.fears && <p className="text-sm text-gray-600">Fears: {booking.fears}</p>}
            {booking.food_preferences && <p className="text-sm text-gray-600">Food: {booking.food_preferences}</p>}
          </div>

          {(booking.pet_meal_preorder || booking.welcome_kit || booking.grooming_requested) && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Add-ons Requested</p>
              <div className="flex flex-wrap gap-2">
                {booking.pet_meal_preorder && <Badge>Pet Meals</Badge>}
                {booking.welcome_kit && <Badge>Welcome Kit</Badge>}
                {booking.grooming_requested && <Badge>Grooming</Badge>}
              </div>
            </div>
          )}

          {booking.special_requests && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Special Requests</p>
              <p className="text-sm">{booking.special_requests}</p>
            </div>
          )}

          <div>
            <Label>Concierge Notes</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes for the guest or internal reference..."
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onUpdateStatus(booking.id, 'contacted', notes)}
            >
              Mark Contacted
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateStatus(booking.id, 'confirmed', notes)}
            >
              Confirm Booking
            </Button>
            <Button 
              variant="outline"
              className="text-red-600"
              onClick={() => onUpdateStatus(booking.id, 'cancelled', notes)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StayManager;
