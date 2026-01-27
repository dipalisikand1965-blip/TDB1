import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TreePine, Heart, Sparkles, Users, MessageCircle, TrendingUp, Gift, Tag, Package
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
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [pillarTags, setPillarTags] = useState([]);
  const [filters, setFilters] = useState({ status: '', city: '', type: '' });
  const [cities, setCities] = useState([]);
  
  // Stay Products state
  const [stayProducts, setStayProducts] = useState([]);
  const [staySocials, setStaySocials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [productStats, setProductStats] = useState({ bundles: 0, socials: 0, orders: 0 });
  const [importingBundles, setImportingBundles] = useState(false);
  const [importingProperties, setImportingProperties] = useState(false);
  const bundleCsvRef = useRef(null);
  const propertyCsvRef = useRef(null);
  
  // Boarding state
  const [boardingFacilities, setBoardingFacilities] = useState([]);
  const [boardingStats, setBoardingStats] = useState({});
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [showBoardingModal, setShowBoardingModal] = useState(false);
  const [boardingFilters, setBoardingFilters] = useState({ city: '', type: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propsRes, bookingsRes, statsRes, mismatchRes, productsRes, socialsRes, boardingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stay/properties?${new URLSearchParams(filters)}`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/bookings`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/stats`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/admin/stay/mismatch-reports`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/stay/products/bundles`),
        fetch(`${API_URL}/api/stay/social/events`),
        fetch(`${API_URL}/api/admin/boarding/facilities`, { headers: getAuthHeader() })
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
      if (productsRes.ok) {
        const data = await productsRes.json();
        setStayProducts(data.bundles || []);
        setProductStats(prev => ({ ...prev, bundles: data.total || 0 }));
      }
      if (socialsRes.ok) {
        const data = await socialsRes.json();
        setStaySocials(data.events || []);
        setProductStats(prev => ({ ...prev, socials: data.total || 0 }));
      }
      if (boardingRes.ok) {
        const data = await boardingRes.json();
        setBoardingFacilities(data.facilities || []);
        setBoardingStats({ total: data.total || 0, cities: data.cities || [], types: data.types || [] });
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
  
  // Export Stay Bundles to CSV
  const exportBundlesCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/social/bundles/export-csv`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stay_bundles_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export bundles');
      }
    } catch (error) {
      console.error('Error exporting bundles:', error);
      alert('Error exporting bundles');
    }
  };

  // Import Stay Bundles from CSV
  const importBundlesCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingBundles(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/admin/stay/social/bundles/import-csv`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Imported ${result.imported} bundles, ${result.errors || 0} errors`);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing bundles:', error);
      alert('Error importing bundles');
    } finally {
      setImportingBundles(false);
      event.target.value = '';
    }
  };

  // Import Stay Properties from CSV
  const importPropertiesCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingProperties(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/admin/stay/import-csv`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Imported ${result.imported} properties, ${result.updated || 0} updated, ${result.errors || 0} errors`);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing properties:', error);
      alert('Error importing properties');
    } finally {
      setImportingProperties(false);
      event.target.value = '';
    }
  };
  
  // Seed Stay Products
  const handleSeedProducts = async () => {
    if (!window.confirm('This will seed 8 Stay Bundles and 3 Social Events. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/social/seed-products`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Seed products error:', response.status, errorText);
        alert(`Failed to seed products: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      alert(data.message || 'Products seeded successfully!');
      fetchData();
    } catch (error) {
      console.error('Error seeding products:', error);
      alert('Failed to seed products: ' + (error.message || 'Network error'));
    }
  };
  
  // Delete Stay Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/social/bundles/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };
  
  // Save Stay Product
  const handleSaveProduct = async (product) => {
    try {
      const isNew = !product.id;
      const url = isNew 
        ? `${API_URL}/api/admin/stay/social/bundles`
        : `${API_URL}/api/admin/stay/social/bundles/${product.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        setShowProductModal(false);
        setSelectedProduct(null);
        fetchData();
        alert(isNew ? 'Bundle created successfully!' : 'Bundle updated successfully!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };
  
  // Save Social Event
  const handleSaveEvent = async (event) => {
    try {
      const isNew = !event.id;
      const url = isNew 
        ? `${API_URL}/api/admin/stay/social/events`
        : `${API_URL}/api/admin/stay/social/events/${event.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        setShowEventModal(false);
        setSelectedEvent(null);
        fetchData();
        alert(isNew ? 'Event created successfully!' : 'Event updated successfully!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };
  
  // Delete Social Event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/stay/social/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  
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
        <TabsList className="grid grid-cols-7 w-full max-w-5xl">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="boarding">Boarding</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
              
              {/* CSV Export */}
              <Button 
                variant="outline" 
                data-testid="export-stay-properties-csv"
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/api/admin/stay/export-csv`, {
                      headers: getAuthHeader()
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `stay_properties_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }
                  } catch (error) {
                    console.error('Export error:', error);
                    alert('Failed to export properties');
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>

              {/* CSV Import */}
              <Button 
                variant="outline"
                onClick={() => propertyCsvRef.current?.click()}
                disabled={importingProperties}
                data-testid="import-stay-properties-csv"
              >
                <Upload className="w-4 h-4 mr-2" /> {importingProperties ? 'Importing...' : 'Import CSV'}
              </Button>
              <input
                ref={propertyCsvRef}
                type="file"
                accept=".csv"
                onChange={importPropertiesCsv}
                className="hidden"
              />
              
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
                  onEditPawReward={() => { setSelectedProperty(property); fetchEligibleProducts(); setShowPawRewardModal(true); }}
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Products Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stayProducts.length}</p>
                  <p className="text-sm text-gray-500">Stay Bundles</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{staySocials.length}</p>
                  <p className="text-sm text-gray-500">Social Events</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₹{stayProducts.reduce((sum, p) => sum + (p.bundle_price || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total Value</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gift className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stayProducts.filter(p => p.featured).length}</p>
                  <p className="text-sm text-gray-500">Featured</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Products Actions */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Stay Products & Bundles</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
                <Button 
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={handleSeedProducts}
                >
                  <Upload className="w-4 h-4 mr-2" /> Seed Products
                </Button>
                <Button variant="outline" onClick={exportBundlesCsv} data-testid="export-stay-bundles-csv">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => bundleCsvRef.current?.click()}
                  disabled={importingBundles}
                  data-testid="import-stay-bundles-csv"
                >
                  <Upload className="w-4 h-4 mr-2" /> {importingBundles ? 'Importing...' : 'Import CSV'}
                </Button>
                <input
                  ref={bundleCsvRef}
                  type="file"
                  accept=".csv"
                  onChange={importBundlesCsv}
                  className="hidden"
                />
                <Button 
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Bundle
                </Button>
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          {stayProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Stay Products Yet</h3>
              <p className="text-gray-500 mb-4">Create travel bundles and kits for pet parents</p>
              <Button onClick={handleSeedProducts} className="bg-amber-500 hover:bg-amber-600">
                <Upload className="w-4 h-4 mr-2" /> Seed Sample Products
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stayProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative h-40">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.featured && (
                      <Badge className="absolute top-2 right-2 bg-amber-500">
                        <Sparkles className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                    {product.discount_percent > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        {Math.round(product.discount_percent)}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xl font-bold text-green-600">₹{product.bundle_price}</span>
                        {product.original_price > product.bundle_price && (
                          <span className="text-sm text-gray-400 line-through ml-2">₹{product.original_price}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{product.items?.length || 0} items</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => { setSelectedProduct(product); setShowProductModal(true); }}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Social Events Section */}
          <Card className="p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" /> Pawcation Socials
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-400 text-purple-600 hover:bg-purple-50"
                onClick={() => { setSelectedEvent(null); setShowEventModal(true); }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </div>
            
            {staySocials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No social events yet. Click "Seed Products" to add sample events.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {staySocials.map((social) => (
                  <Card key={social.id} className="overflow-hidden bg-purple-50 border-purple-100">
                    <div className="relative h-32">
                      <img 
                        src={social.image || 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400'}
                        alt={social.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-purple-600 capitalize">
                        {social.event_type?.replace(/_/g, ' ')}
                      </Badge>
                      {social.price_per_pet === 0 && (
                        <Badge className="absolute top-2 right-2 bg-green-500">FREE</Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="font-semibold text-sm mb-1">{social.title}</h5>
                      <p className="text-xs text-gray-500 mb-1">{social.event_date} • {social.event_time}</p>
                      <p className="text-xs text-gray-500 mb-2">{social.property_name}, {social.property_city}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{social.current_participants || 0}/{social.max_participants} spots</span>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => { setSelectedEvent(social); setShowEventModal(true); }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-red-500"
                            onClick={() => handleDeleteEvent(social.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* General Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              General Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-acknowledge Bookings</label>
                <input type="checkbox" className="w-4 h-4 text-green-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Notification Email</label>
                <input type="text" placeholder="stay@company.com" className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Notification WhatsApp</label>
                <input type="text" placeholder="+91 98765 43210" className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Default Booking Lead Time (Days)</label>
                <input type="number" placeholder="1" defaultValue={1} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </Card>

          {/* Paw Rewards Settings */}
          <Card className="p-6 border-2 border-amber-200 bg-amber-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-amber-600" />
              Paw Rewards Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Paw Rewards</label>
                <input type="checkbox" className="w-4 h-4 text-amber-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Points per Booking</label>
                <input type="number" placeholder="50" defaultValue={50} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Points per Night</label>
                <input type="number" placeholder="25" defaultValue={25} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Birthday Discount (%)</label>
                <input type="number" placeholder="20" defaultValue={20} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Referral Rewards</label>
                <input type="checkbox" className="w-4 h-4 text-amber-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Referrer Bonus Points</label>
                <input type="number" placeholder="100" defaultValue={100} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </Card>

          {/* Property Requirements */}
          <Card className="p-6 border-2 border-green-200 bg-green-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Paw Standards Requirements
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Require Pet-Friendly Verification</label>
                <input type="checkbox" className="w-4 h-4 text-green-600" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-approve Verified Properties</label>
                <input type="checkbox" className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <label className="text-sm font-medium">Min Pet Deposit Amount (₹)</label>
                <input type="number" placeholder="1000" defaultValue={1000} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Max Pets per Booking</label>
                <input type="number" placeholder="2" defaultValue={2} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
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
      
      {/* Paw Reward Modal */}
      {showPawRewardModal && selectedProperty && (
        <PawRewardModal
          property={selectedProperty}
          eligibleProducts={eligibleProducts}
          onClose={() => { setShowPawRewardModal(false); setSelectedProperty(null); }}
          onSave={handleUpdatePawReward}
        />
      )}
      
      {/* Stay Product Modal */}
      {showProductModal && (
        <StayProductModal
          product={selectedProduct}
          onClose={() => { setShowProductModal(false); setSelectedProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
      
      {/* Stay Event Modal */}
      {showEventModal && (
        <StayEventModal
          event={selectedEvent}
          properties={properties}
          onClose={() => { setShowEventModal(false); setSelectedEvent(null); }}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};

// Property Row Component
const PropertyRow = ({ property, onEdit, onDelete, onStatusChange, onEditPawReward, getStatusColor }) => {
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
              {property.paw_reward?.enabled && (
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300">
                  <Gift className="w-3 h-3 mr-1" /> Paw Reward
                </Badge>
              )}
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
            {property.paw_reward?.enabled && (
              <span className="flex items-center gap-1 text-amber-600" title={`Reward: ${property.paw_reward.product_name}`}>
                <Gift className="w-4 h-4" /> {property.paw_reward.product_name?.substring(0, 15)}...
              </span>
            )}
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
            
            <Button 
              size="sm" 
              variant="outline" 
              className="border-amber-400 text-amber-600 hover:bg-amber-50"
              onClick={onEditPawReward}
            >
              <Gift className="w-3 h-3 mr-1" /> Paw Reward
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
                <Label>Photo URLs (one per line)</Label>
                <Textarea 
                  value={formData.photos?.join('\n') || ''}
                  onChange={(e) => updateField('photos', e.target.value.split('\n').map(t => t.trim()).filter(Boolean))}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">Add image URLs - first image will be the primary photo</p>
                {formData.photos?.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {formData.photos.slice(0, 4).map((photo, idx) => (
                      <img key={idx} src={photo} alt={`Preview ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                    ))}
                  </div>
                )}
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

              {/* Birthday Perk Section */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  🎁 Paw Reward (Birthday Perk)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.paw_reward?.enabled || false}
                      onChange={(e) => setFormData({
                        ...formData, 
                        paw_reward: {...(formData.paw_reward || {}), enabled: e.target.checked},
                        birthdayPerks: e.target.checked
                      })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <label className="text-sm font-medium">Enable Birthday Perk</label>
                  </div>
                  <div>
                    <Label className="text-sm">Max Reward Value (₹)</Label>
                    <Input
                      type="number"
                      value={formData.paw_reward?.max_value || 600}
                      onChange={(e) => setFormData({
                        ...formData, 
                        paw_reward: {...(formData.paw_reward || {}), max_value: parseInt(e.target.value) || 600}
                      })}
                      placeholder="600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm">Reward Description</Label>
                    <Input
                      value={formData.paw_reward?.custom_message || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        paw_reward: {...(formData.paw_reward || {}), custom_message: e.target.value}
                      })}
                      placeholder="Free TDB birthday cake when celebrating your dog's birthday during stay"
                    />
                  </div>
                </div>
              </div>

              {/* Birthday Perks Available Checkbox */}
              <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.birthdayPerks || false}
                    onChange={(e) => setFormData({...formData, birthdayPerks: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-medium text-pink-800">🎂 Birthday Perks Available</span>
                    <p className="text-xs text-pink-600">Property offers special treats/discounts for pet birthdays</p>
                  </div>
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

// Paw Reward Modal Component
const PawRewardModal = ({ property, eligibleProducts, onClose, onSave }) => {
  const [pawReward, setPawReward] = useState({
    enabled: property.paw_reward?.enabled ?? true,
    product_id: property.paw_reward?.product_id || '',
    product_name: property.paw_reward?.product_name || '',
    product_image: property.paw_reward?.product_image || '',
    product_price: property.paw_reward?.product_price || 0,
    max_value: property.paw_reward?.max_value || 600,
    custom_message: property.paw_reward?.custom_message || 'Every stay earns your dog a Paw Reward!'
  });
  const [saving, setSaving] = useState(false);

  const handleProductSelect = (product) => {
    setPawReward({
      ...pawReward,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image || product.images?.[0] || '',
      product_price: product.price
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(property.id, pawReward);
    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            Edit Paw Reward - {property.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div>
              <h4 className="font-semibold text-amber-800">Paw Reward Active</h4>
              <p className="text-sm text-amber-600">Show Paw Reward badge on this property</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pawReward.enabled}
                onChange={(e) => setPawReward({ ...pawReward, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Current Reward */}
          {pawReward.product_name && (
            <div className="p-4 bg-white border rounded-lg">
              <h4 className="font-semibold mb-3">Current Reward</h4>
              <div className="flex items-center gap-4">
                {pawReward.product_image && (
                  <img 
                    src={pawReward.product_image} 
                    alt={pawReward.product_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{pawReward.product_name}</p>
                  <p className="text-sm text-green-600">Worth ₹{pawReward.product_price}</p>
                </div>
              </div>
            </div>
          )}

          {/* Select Product */}
          <div>
            <h4 className="font-semibold mb-3">Select Reward Product (Treats under ₹600)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {eligibleProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    pawReward.product_id === product.id 
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500' 
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <img 
                    src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'}
                    alt={product.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-green-600">₹{product.price}</p>
                </div>
              ))}
              
              {eligibleProducts.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Loading products...</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label>Custom Message</Label>
            <Input
              value={pawReward.custom_message}
              onChange={(e) => setPawReward({ ...pawReward, custom_message: e.target.value })}
              placeholder="Every stay earns your dog a Paw Reward!"
              className="mt-1"
            />
          </div>

          {/* Max Value */}
          <div>
            <Label>Max Reward Value (₹)</Label>
            <Input
              type="number"
              value={pawReward.max_value}
              onChange={(e) => setPawReward({ ...pawReward, max_value: parseInt(e.target.value) || 600 })}
              className="mt-1 w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Paw Reward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Stay Product Bundle Modal Component
const StayProductModal = ({ product, onClose, onSave }) => {
  const isNew = !product;
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'travel_kit',
    bundle_price: product?.bundle_price || 0,
    original_price: product?.original_price || 0,
    image: product?.image || '',
    tags: product?.tags || [],
    for_trip_type: product?.for_trip_type || [],
    featured: product?.featured || false,
    items: product?.items || []
  });
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 });

  const categories = [
    { id: 'travel_kit', name: 'Travel Kit' },
    { id: 'comfort_pack', name: 'Comfort Pack' },
    { id: 'adventure_bundle', name: 'Adventure Bundle' },
    { id: 'first_time_pack', name: 'First Time Pack' },
    { id: 'luxury_collection', name: 'Luxury Collection' },
    { id: 'hygiene_kit', name: 'Hygiene Kit' }
  ];

  const tripTypes = [
    { id: 'beach', name: 'Beach' },
    { id: 'mountain', name: 'Mountain' },
    { id: 'forest', name: 'Forest' },
    { id: 'road_trip', name: 'Road Trip' },
    { id: 'weekend', name: 'Weekend' },
    { id: 'luxury', name: 'Luxury' }
  ];

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addItem = () => {
    if (newItem.name && newItem.price > 0) {
      setFormData({ ...formData, items: [...formData.items, { ...newItem }] });
      setNewItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const removeItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const toggleTripType = (type) => {
    const current = formData.for_trip_type;
    if (current.includes(type)) {
      setFormData({ ...formData, for_trip_type: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, for_trip_type: [...current, type] });
    }
  };

  const calculateDiscount = () => {
    if (formData.original_price > 0 && formData.bundle_price > 0) {
      return Math.round(((formData.original_price - formData.bundle_price) / formData.original_price) * 100);
    }
    return 0;
  };

  const handleSave = async () => {
    if (!formData.name || formData.bundle_price <= 0) {
      alert('Please fill in name and bundle price');
      return;
    }
    
    setSaving(true);
    const dataToSave = {
      ...formData,
      discount_percent: calculateDiscount()
    };
    if (product?.id) {
      dataToSave.id = product.id;
    }
    await onSave(dataToSave);
    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            {isNew ? 'Create New Bundle' : `Edit Bundle - ${product.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Bundle Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekend Getaway Kit"
                className="mt-1"
              />
            </div>
            
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included and who it's for..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border rounded-lg mt-1"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">Pricing</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Original Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: parseInt(e.target.value) || 0 })}
                  placeholder="1499"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Bundle Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.bundle_price}
                  onChange={(e) => setFormData({ ...formData, bundle_price: parseInt(e.target.value) || 0 })}
                  placeholder="1199"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Discount</Label>
                <div className="mt-1 p-2 bg-white rounded-lg border text-center">
                  <span className="text-2xl font-bold text-green-600">{calculateDiscount()}%</span>
                  <span className="text-sm text-gray-500 block">OFF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Items */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3">Bundle Items</h4>
            
            {/* Existing Items */}
            {formData.items.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                    <span className="text-sm font-medium">₹{item.price}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 h-6 w-6 p-0"
                      onClick={() => removeItem(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Item */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Item Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Travel Treats Pack"
                  className="mt-1 h-9"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1 h-9"
                />
              </div>
              <div className="w-24">
                <Label className="text-xs">Price (₹)</Label>
                <Input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                  placeholder="299"
                  className="mt-1 h-9"
                />
              </div>
              <Button size="sm" onClick={addItem} className="h-9 bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Trip Types */}
          <div>
            <Label>Suitable for Trip Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tripTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleTripType(type.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.for_trip_type.includes(type.id)
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {formData.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" onClick={addTag}>Add</Button>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-purple-800">Featured Bundle</h4>
              <p className="text-sm text-purple-600">Show this bundle prominently</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? 'Create Bundle' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Stay Event Modal Component
const StayEventModal = ({ event, properties, onClose, onSave }) => {
  const isNew = !event;
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'meetup',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '10:00 AM',
    property_id: event?.property_id || '',
    property_name: event?.property_name || '',
    property_city: event?.property_city || '',
    max_participants: event?.max_participants || 20,
    price_per_pet: event?.price_per_pet || 0,
    image: event?.image || '',
    activities: event?.activities || [],
    what_to_bring: event?.what_to_bring || [],
    status: event?.status || 'active'
  });
  const [saving, setSaving] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newItem, setNewItem] = useState('');

  const eventTypes = [
    { id: 'meetup', name: 'Meetup' },
    { id: 'sunset_social', name: 'Sunset Social' },
    { id: 'trail_pack', name: 'Trail Pack Walk' },
    { id: 'photo_walk', name: 'Photo Walk' },
    { id: 'beach_party', name: 'Beach Party' },
    { id: 'playdate', name: 'Playdate' },
    { id: 'training', name: 'Training Session' }
  ];

  const handlePropertySelect = (propId) => {
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      setFormData({
        ...formData,
        property_id: prop.id,
        property_name: prop.name,
        property_city: prop.city
      });
    }
  };

  const addActivity = () => {
    if (newActivity && !formData.activities.includes(newActivity)) {
      setFormData({ ...formData, activities: [...formData.activities, newActivity] });
      setNewActivity('');
    }
  };

  const removeActivity = (activity) => {
    setFormData({ ...formData, activities: formData.activities.filter(a => a !== activity) });
  };

  const addBringItem = () => {
    if (newItem && !formData.what_to_bring.includes(newItem)) {
      setFormData({ ...formData, what_to_bring: [...formData.what_to_bring, newItem] });
      setNewItem('');
    }
  };

  const removeBringItem = (item) => {
    setFormData({ ...formData, what_to_bring: formData.what_to_bring.filter(i => i !== item) });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.event_date) {
      alert('Please fill in title and event date');
      return;
    }
    
    setSaving(true);
    const dataToSave = { ...formData };
    if (event?.id) {
      dataToSave.id = event.id;
    }
    await onSave(dataToSave);
    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            {isNew ? 'Create New Event' : `Edit Event - ${event.title}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Event Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sunset Beach Pawty"
                className="mt-1"
              />
            </div>
            
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the event..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Event Type</Label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full p-2 border rounded-lg mt-1"
              >
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date *</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Event Time</Label>
              <Input
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                placeholder="10:00 AM - 12:00 PM"
                className="mt-1"
              />
            </div>
          </div>

          {/* Location */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-3">Event Location</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Property</Label>
                <select
                  value={formData.property_id}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  <option value="">Select a property...</option>
                  {properties.filter(p => p.status === 'live').map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.name} - {prop.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.property_city}
                  onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                  placeholder="City name"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Participants</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 20 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Price per Pet (₹) - 0 for FREE</Label>
              <Input
                type="number"
                min={0}
                value={formData.price_per_pet}
                onChange={(e) => setFormData({ ...formData, price_per_pet: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Activities */}
          <div>
            <Label>Activities</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {formData.activities.map((activity, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                >
                  {activity}
                  <button onClick={() => removeActivity(activity)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add activity (e.g., Group Walk)"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
              />
              <Button variant="outline" onClick={addActivity}>Add</Button>
            </div>
          </div>

          {/* What to Bring */}
          <div>
            <Label>What to Bring</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {formData.what_to_bring.map((item, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                >
                  {item}
                  <button onClick={() => removeBringItem(item)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item (e.g., Water bottle)"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBringItem())}
              />
              <Button variant="outline" onClick={addBringItem}>Add</Button>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded-lg mt-1"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-purple-500 hover:bg-purple-600"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? 'Create Event' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StayManager;
