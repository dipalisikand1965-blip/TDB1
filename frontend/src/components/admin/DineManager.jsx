import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, MapPin, Star, 
  UtensilsCrossed, Check, AlertCircle, Phone, Globe, Instagram,
  RefreshCw, Upload, Download, FileSpreadsheet, Image as ImageIcon,
  ExternalLink, MessageSquare, Sparkles, Calendar, Users, Clock,
  PawPrint, Heart, UserCheck, XCircle, Eye, Settings, ShoppingBag, Package, Briefcase,
  Building2, Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import PillarServicesTab from './PillarServicesTab';
import PillarExperiencesTab from './PillarExperiencesTab';
import PillarProductsTab from './PillarProductsTab';
import PillarBundlesTab from './PillarBundlesTab';


const DineManager = ({ credentials }) => {
  // Active tab
  const [activeTab, setActiveTab] = useState('restaurants');
  
  // Restaurant state
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPetMenu, setUploadingPetMenu] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [reservationStats, setReservationStats] = useState({});
  const [reservationFilter, setReservationFilter] = useState('all');
  
  // Buddy Visits state
  const [visits, setVisits] = useState([]);
  const [visitStats, setVisitStats] = useState({});
  const [visitFilter, setVisitFilter] = useState('all');
  
  // Meetups state
  const [meetups, setMeetups] = useState([]);
  const [meetupStats, setMeetupStats] = useState({});
  const [meetupFilter, setMeetupFilter] = useState('all');
  
  // Bundles state
  const [bundles, setBundles] = useState([]);
  const [bundleStats, setBundleStats] = useState({});
  const [editingBundle, setEditingBundle] = useState(null);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [importingBundles, setImportingBundles] = useState(false);
  
  // Seed All state
  const [seedingAll, setSeedingAll] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productStats, setProductStats] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const fileInputRef = useRef(null);
  const petMenuInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const bundleCsvInputRef = useRef(null);

  const emptyRestaurant = {
    name: '',
    area: '',
    city: '',
    address: '',
    full_address: '',
    pincode: '',
    geo_lat: '',
    geo_lng: '',
    google_place_id: '',
    petMenuAvailable: 'no',
    petPolicy: 'outdoor',
    cuisine: [],
    tags: [],
    rating: 4.0,
    reviewCount: 0,
    priceRange: '₹₹',
    image: '',
    petMenuItems: [],
    petMenuImage: '',
    timings: '',
    phone: '',
    instagram: '',
    website: '',
    zomatoLink: '',
    googleMapsLink: '',
    conciergeRecommendation: '',
    specialOffers: '',
    birthdayPerks: false,
    featured: false,
    verified: false,
    country: 'India',
    state: '',
    // Paw Reward
    paw_reward: {
      enabled: false,
      reward_type: 'free_product',
      reward_name: 'Birthday Cake Reward',
      reward_description: 'Free TDB birthday cake when celebrating your dog\'s birthday here',
      max_value: 500,
      trigger_condition: 'birthday'
    }
  };

  const [formData, setFormData] = useState(emptyRestaurant);

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  };

  // Fetch restaurants
  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/restaurants`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);
  
  // Fetch reservations
  const fetchReservations = async () => {
    setIsLoading(true);
    setReservations([]); // Clear first to show loading state
    try {
      const url = reservationFilter === 'all' 
        ? `${API_URL}/api/admin/dine/reservations`
        : `${API_URL}/api/admin/dine/reservations?status=${reservationFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
        setReservationStats(data.stats || {
          pending: (data.reservations || []).filter(r => r.status === 'pending').length,
          confirmed: (data.reservations || []).filter(r => r.status === 'confirmed').length,
          completed: (data.reservations || []).filter(r => r.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch buddy visits
  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const url = visitFilter === 'all'
        ? `${API_URL}/api/admin/dine/visits`
        : `${API_URL}/api/admin/dine/visits?status=${visitFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setVisits(data.visits || []);
        setVisitStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch meetups
  const fetchMeetups = async () => {
    setIsLoading(true);
    try {
      const url = meetupFilter === 'all'
        ? `${API_URL}/api/admin/dine/meetups`
        : `${API_URL}/api/admin/dine/meetups?status=${meetupFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetups(data.meetups || []);
        setMeetupStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching meetups:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect to load data based on active tab
  useEffect(() => {
    if (activeTab === 'reservations') fetchReservations();
    else if (activeTab === 'visits') fetchVisits();
    else if (activeTab === 'meetups') fetchMeetups();
    else if (activeTab === 'bundles') fetchBundles();
    else if (activeTab === 'products') fetchProducts();
  }, [activeTab, reservationFilter, visitFilter, meetupFilter]);
  
  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dine/products`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setProductStats({
          total: data.total || 0,
          in_stock: (data.products || []).filter(p => p.in_stock).length,
          out_of_stock: (data.products || []).filter(p => !p.in_stock).length
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch bundles
  const fetchBundles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/bundles`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || []);
        setBundleStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save bundle
  const saveBundle = async (bundle) => {
    try {
      const isNew = !bundle.id || bundle.id.startsWith('new-');
      const url = isNew 
        ? `${API_URL}/api/admin/dine/bundles`
        : `${API_URL}/api/admin/dine/bundles/${bundle.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader() 
        },
        body: JSON.stringify(bundle)
      });
      
      if (response.ok) {
        fetchBundles();
        setEditingBundle(null);
        setIsAddingBundle(false);
      }
    } catch (error) {
      console.error('Error saving bundle:', error);
    }
  };
  
  // Delete bundle
  const deleteBundle = async (bundleId) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/bundles/${bundleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        fetchBundles();
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };
  
  // Seed bundles
  const seedBundles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/bundles/seed`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Bundles Seeded', description: result.message });
        fetchBundles();
      }
    } catch (error) {
      console.error('Error seeding bundles:', error);
      toast({ title: 'Error', description: 'Failed to seed bundles', variant: 'destructive' });
    }
  };

  // Seed ALL dine data (restaurants, bundles, products)
  const seedAllDine = async () => {
    setSeedingAll(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/seed-all`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: '✅ Dine Data Seeded!', 
          description: result.message 
        });
        // Refresh all data
        fetchRestaurants();
        fetchBundles();
        fetchProducts();
      } else {
        const error = await response.json();
        toast({ 
          title: 'Error', 
          description: error.detail || 'Failed to seed dine data', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error seeding all dine data:', error);
      toast({ title: 'Error', description: 'Failed to seed dine data', variant: 'destructive' });
    } finally {
      setSeedingAll(false);
    }
  };

  // Export bundles to CSV
  const exportBundlesCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/bundles/export-csv`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dine_bundles_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Import bundles from CSV
  const importBundlesCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingBundles(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/admin/dine/bundles/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Imported ${result.imported} bundles, ${result.errors || 0} errors`);
        fetchBundles();
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
  
  // Update reservation status
  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/reservations/${reservationId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        fetchReservations();
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };
  
  // Update visit status
  const updateVisitStatus = async (visitId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/visits/${visitId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        fetchVisits();
      }
    } catch (error) {
      console.error('Error updating visit:', error);
    }
  };
  
  // Delete meetup
  const deleteMeetup = async (meetupId) => {
    if (!confirm('Delete this meetup request?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/meetups/${meetupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        fetchMeetups();
      }
    } catch (error) {
      console.error('Error deleting meetup:', error);
    }
  };

  // Update meetup status (admin)
  const updateMeetupStatus = async (meetupId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/meetups/${meetupId}/status?status=${newStatus}&send_notification=true`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader() }
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Meetup status updated to ${newStatus}. ${result.notified ? 'Both parties have been notified via email.' : ''}`);
        fetchMeetups();
      }
    } catch (error) {
      console.error('Error updating meetup status:', error);
    }
  };

  // Save restaurant
  const saveRestaurant = async () => {
    try {
      const url = editingRestaurant 
        ? `${API_URL}/api/admin/dine/restaurants/${editingRestaurant.id}`
        : `${API_URL}/api/admin/dine/restaurants`;
      
      const method = editingRestaurant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchRestaurants();
        setEditingRestaurant(null);
        setIsAddingNew(false);
        setFormData(emptyRestaurant);
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
    }
  };

  // Delete restaurant
  const deleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/restaurants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getAuthHeader() }
      });
      
      if (response.ok) {
        fetchRestaurants();
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e, field = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = field === 'petMenuImage' ? setUploadingPetMenu : setUploadingImage;
    setUploading(true);
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const endpoint = field === 'petMenuImage' 
      ? `${API_URL}/api/admin/dine/upload-pet-menu`
      : `${API_URL}/api/admin/dine/upload-image`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = `${API_URL}${data.url}`;
        setFormData(prev => ({ ...prev, [field]: imageUrl }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
      if (field === 'petMenuImage' && petMenuInputRef.current) {
        petMenuInputRef.current.value = '';
      } else if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // CSV Export handler
  const handleExportCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dine/export-csv`, {
        headers: { 'Authorization': getAuthHeader() }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurants_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export CSV');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    }
  };

  // CSV Import handler
  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    setImportResult(null);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/admin/dine/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setImportResult(data);
        fetchRestaurants();
      } else {
        const error = await response.json();
        alert(`Failed to import CSV: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error importing CSV');
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const startEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({...emptyRestaurant, ...restaurant});
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setIsAddingNew(true);
    setEditingRestaurant(null);
    setFormData(emptyRestaurant);
  };

  const cancelEdit = () => {
    setEditingRestaurant(null);
    setIsAddingNew(false);
    setFormData(emptyRestaurant);
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPetMenuBadge = (status) => {
    switch (status) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" /> Pet Menu</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" /> Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600"><X className="w-3 h-3 mr-1" /> No Menu</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="dine-manager">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Dine Management
          </h2>
          <p className="text-gray-500">Restaurants, Reservations & Buddy Meetups</p>
        </div>
        <Button 
          onClick={seedAllDine}
          disabled={seedingAll}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          data-testid="seed-all-dine-btn"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {seedingAll ? 'Seeding...' : 'Seed All Dine Data'}
        </Button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        <Button 
          variant={activeTab === 'restaurants' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('restaurants')}
          className={activeTab === 'restaurants' ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          <UtensilsCrossed className="w-4 h-4 mr-2" /> Restaurants
        </Button>
        <Button 
          variant={activeTab === 'reservations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reservations')}
          className={activeTab === 'reservations' ? 'bg-purple-500 hover:bg-purple-600' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" /> Reservations
        </Button>
        <Button 
          variant={activeTab === 'visits' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('visits')}
          className={activeTab === 'visits' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          <PawPrint className="w-4 h-4 mr-2" /> Pet Buddy Visits
        </Button>
        <Button 
          variant={activeTab === 'meetups' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('meetups')}
          className={activeTab === 'meetups' ? 'bg-rose-500 hover:bg-rose-600' : ''}
        >
          <Heart className="w-4 h-4 mr-2" /> Meetup Requests
        </Button>
        <Button 
          variant={activeTab === 'bundles' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('bundles')}
          className={activeTab === 'bundles' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Dine Bundles
        </Button>
        <Button 
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'bg-blue-500 hover:bg-blue-600' : ''}
        >
          <ShoppingBag className="w-4 h-4 mr-2" /> Products
        </Button>
        <Button 
          variant={activeTab === 'services' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('services')}
          className={activeTab === 'services' ? 'bg-teal-500 hover:bg-teal-600' : ''}
        >
          <Briefcase className="w-4 h-4 mr-2" /> Services
        </Button>
        <Button 
          variant={activeTab === 'experiences' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('experiences')}
          className={activeTab === 'experiences' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
          data-testid="dine-tab-experiences"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Experiences
        </Button>
        <Button 
          variant={activeTab === 'partners' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('partners')}
          className={activeTab === 'partners' ? 'bg-violet-500 hover:bg-violet-600' : ''}
          data-testid="dine-tab-partners"
        >
          <Building2 className="w-4 h-4 mr-2" /> Partners
        </Button>
        <Button 
          variant={activeTab === 'tips' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tips')}
          className={activeTab === 'tips' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          data-testid="dine-tab-tips"
        >
          <Zap className="w-4 h-4 mr-2" /> Tips
        </Button>
        <Button 
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'bg-gray-700 hover:bg-gray-800' : ''}
        >
          <Settings className="w-4 h-4 mr-2" /> Settings
        </Button>
      </div>
      
      {/* Request Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <div className="text-2xl font-bold">{(reservationStats.pending || 0) + (visitStats.pending || 0) + (meetupStats.pending || 0)}</div>
          <div className="text-xs opacity-90">Total Pending</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
          <div className="text-2xl font-bold">{reservationStats.pending || 0}</div>
          <div className="text-xs opacity-90">Pending Reservations</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 text-white">
          <div className="text-2xl font-bold">{visitStats.pending || 0}</div>
          <div className="text-xs opacity-90">Pending Visits</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <div className="text-2xl font-bold">{meetupStats.pending || 0}</div>
          <div className="text-xs opacity-90">Pending Meetups</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <div className="text-2xl font-bold">{(reservationStats.completed || 0) + (visitStats.completed || 0) + (meetupStats.completed || 0)}</div>
          <div className="text-xs opacity-90">Completed</div>
        </Card>
      </div>
      
      {/* ============ RESTAURANTS TAB ============ */}
      {activeTab === 'restaurants' && (
        <>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchRestaurants} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExportCsv}
            disabled={restaurants.length === 0}
            data-testid="export-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => csvInputRef.current?.click()}
            disabled={importingCsv}
            data-testid="import-csv-btn"
          >
            {importingCsv ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
            ) : (
              <><FileSpreadsheet className="w-4 h-4 mr-2" /> Import CSV</>
            )}
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCsv}
            className="hidden"
          />
          
          <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600" data-testid="add-restaurant-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Restaurant
          </Button>
        </div>

      {/* Import Result */}
      {importResult && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-800">CSV Import Complete</h4>
              <p className="text-sm text-green-700">
                {importResult.imported} new restaurants added, {importResult.updated} updated
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportResult(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Restaurants</p>
          <p className="text-3xl font-bold text-gray-900">{restaurants.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-600">With Pet Menu</p>
          <p className="text-3xl font-bold text-green-700">
            {restaurants.filter(r => r.petMenuAvailable === 'yes').length}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <p className="text-sm text-yellow-600">Partial Menu</p>
          <p className="text-3xl font-bold text-yellow-700">
            {restaurants.filter(r => r.petMenuAvailable === 'partial').length}
          </p>
        </Card>
        <Card className="p-4 bg-pink-50">
          <p className="text-sm text-pink-600">🎂 Birthday Perks</p>
          <p className="text-3xl font-bold text-pink-700">
            {restaurants.filter(r => r.birthdayPerks).length}
          </p>
        </Card>
        <Card className="p-4 bg-orange-50">
          <p className="text-sm text-orange-600">Featured</p>
          <p className="text-3xl font-bold text-orange-700">
            {restaurants.filter(r => r.featured).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-restaurants"
          />
        </div>
      </Card>

      {/* Add/Edit Form */}
      {(isAddingNew || editingRestaurant) && (
        <Card className="p-6" data-testid="restaurant-form">
          <h3 className="font-semibold text-lg mb-4">
            {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h3>
          
          {/* Basic Info */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Basic Information
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Restaurant Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., TherPup Café"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <select
                  value={formData.country || 'India'}
                  onChange={(e) => setFormData({...formData, country: e.target.value, state: '', city: ''})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="USA">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="UAE">🇦🇪 UAE</option>
                  <option value="Singapore">🇸🇬 Singapore</option>
                  <option value="Australia">🇦🇺 Australia</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select State</option>
                  {formData.country === 'India' && (
                    <>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Goa">Goa</option>
                    </>
                  )}
                  {formData.country === 'USA' && (
                    <>
                      <option value="California">California</option>
                      <option value="New York">New York</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">City *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g., Bangalore"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Area / Locality *</label>
                <Input
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g., Koramangala"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Full Address</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123, 5th Cross, Koramangala..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <Input
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  placeholder="560034"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Google Maps Link</label>
                <Input
                  value={formData.googleMapsLink || ''}
                  onChange={(e) => setFormData({...formData, googleMapsLink: e.target.value})}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.geo_lat || ''}
                  onChange={(e) => setFormData({...formData, geo_lat: e.target.value})}
                  placeholder="12.9716"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.geo_lng || ''}
                  onChange={(e) => setFormData({...formData, geo_lng: e.target.value})}
                  placeholder="77.5946"
                />
              </div>
            </div>
          </div>

          {/* Paw Reward Section */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
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
                    paw_reward: {...formData.paw_reward, enabled: e.target.checked},
                    birthdayPerks: e.target.checked
                  })}
                  className="w-4 h-4 text-amber-600"
                />
                <label className="text-sm font-medium">Enable Birthday Perk</label>
              </div>
              <div>
                <label className="text-sm font-medium">Max Reward Value (₹)</label>
                <Input
                  type="number"
                  value={formData.paw_reward?.max_value || 500}
                  onChange={(e) => setFormData({
                    ...formData, 
                    paw_reward: {...formData.paw_reward, max_value: parseInt(e.target.value) || 500}
                  })}
                  placeholder="500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Reward Description</label>
                <Input
                  value={formData.paw_reward?.reward_description || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    paw_reward: {...formData.paw_reward, reward_description: e.target.value}
                  })}
                  placeholder="Free TDB birthday cake when celebrating your dog's birthday here"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Images
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Restaurant Image */}
              <div>
                <label className="text-sm font-medium">Restaurant Image</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="Image URL or upload"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image')}
                    className="hidden"
                  />
                </div>
                {formData.image && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                    <button onClick={() => setFormData({...formData, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Pet Menu Image */}
              <div>
                <label className="text-sm font-medium">Pet Menu Image 📋</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.petMenuImage || ''}
                    onChange={(e) => setFormData({...formData, petMenuImage: e.target.value})}
                    placeholder="Upload photo of pet menu"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => petMenuInputRef.current?.click()}
                    disabled={uploadingPetMenu}
                  >
                    {uploadingPetMenu ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  <input
                    ref={petMenuInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'petMenuImage')}
                    className="hidden"
                  />
                </div>
                {formData.petMenuImage && (
                  <div className="mt-2 relative w-20 h-20">
                    <img src={formData.petMenuImage} alt="Pet Menu" className="w-full h-full object-cover rounded-lg border" />
                    <button onClick={() => setFormData({...formData, petMenuImage: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Policy */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              🐕 Pet Policy & Perks
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Pet Menu Available *</label>
                <select
                  value={formData.petMenuAvailable}
                  onChange={(e) => setFormData({...formData, petMenuAvailable: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="yes">Yes - Full Pet Menu</option>
                  <option value="partial">Partial - Some Items</option>
                  <option value="no">No - Pet-Friendly Only</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Pet Policy *</label>
                <select
                  value={formData.petPolicy}
                  onChange={(e) => setFormData({...formData, petPolicy: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all-pets">All Pets Welcome</option>
                  <option value="outdoor">Outdoor Seating Only</option>
                  <option value="small-pets">Small Pets Only</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Pet Menu Items</label>
                <Input
                  value={formData.petMenuItems?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, petMenuItems: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Pupcakes, Dog Ice Cream..."
                />
              </div>
              <div className="md:col-span-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.birthdayPerks || false}
                    onChange={(e) => setFormData({...formData, birthdayPerks: e.target.checked})}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-pink-800">🎂 Birthday Perks Available</span>
                    <p className="text-xs text-pink-600">Restaurant offers special treats/discounts for pet birthdays</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Concierge® Recommendation */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Your Concierge® Recommends
            </h4>
            <textarea
              value={formData.conciergeRecommendation || ''}
              onChange={(e) => setFormData({...formData, conciergeRecommendation: e.target.value})}
              placeholder="Your Concierge® recommends: This cozy café is perfect for lazy Sunday brunches with your furry friend. The staff is incredibly pet-friendly, and they serve the best pupcakes in town! Pro tip: Book the garden table for the best experience."
              className="w-full p-3 border rounded-lg text-sm"
              rows={3}
            />
          </div>

          {/* Details */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Restaurant Details</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Cuisine (comma separated)</label>
                <Input
                  value={formData.cuisine?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, cuisine: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Café, Continental, Italian"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="Outdoor Seating, Dog Menu"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price Range</label>
                <select
                  value={formData.priceRange}
                  onChange={(e) => setFormData({...formData, priceRange: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="₹">₹ - Budget</option>
                  <option value="₹₹">₹₹ - Moderate</option>
                  <option value="₹₹₹">₹₹₹ - Expensive</option>
                  <option value="₹₹₹₹">₹₹₹₹ - Premium</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Rating</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timings</label>
                <Input
                  value={formData.timings || ''}
                  onChange={(e) => setFormData({...formData, timings: e.target.value})}
                  placeholder="10 AM - 10 PM"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Special Offers</label>
                <Input
                  value={formData.specialOffers || ''}
                  onChange={(e) => setFormData({...formData, specialOffers: e.target.value})}
                  placeholder="20% off on pet meals"
                />
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Contact & Links
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Instagram</label>
                <Input
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  placeholder="@restauranthandle"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Zomato Link</label>
                <Input
                  value={formData.zomatoLink || ''}
                  onChange={(e) => setFormData({...formData, zomatoLink: e.target.value})}
                  placeholder="https://zomato.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Google Maps</label>
                <Input
                  value={formData.googleMapsLink || ''}
                  onChange={(e) => setFormData({...formData, googleMapsLink: e.target.value})}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">⭐ Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">✓ Verified</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveRestaurant} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" /> Save Restaurant
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* CSV Template */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-700">CSV Import Template</h4>
            <p className="text-sm text-gray-500">
              Use pipe (|) to separate multiple values in cuisine, tags, and petMenuItems.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const template = `name,area,city,petMenuAvailable,petPolicy,cuisine,tags,rating,priceRange,petMenuItems,timings,phone,instagram,website,featured,verified,miraRecommendation,specialOffers
Sample Café,Koramangala,Bangalore,yes,all-pets,Café|Continental,Outdoor Seating|Dog Menu,4.5,₹₹,Pupcakes|Dog Ice Cream,10 AM - 10 PM,+91 98765 43210,@samplecafe,https://sample.com,true,true,Great spot for pet parents!,10% off on weekdays`;
              const blob = new Blob([template], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'restaurants_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Download Template
          </Button>
        </div>
      </Card>

      {/* Restaurant List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading restaurants...</p>
          </Card>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="p-8 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900">No restaurants found</h3>
            <p className="text-gray-500 mb-4">Add your first pet-friendly restaurant</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={startAdd} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Add Restaurant
              </Button>
              <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Import CSV
              </Button>
            </div>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-4">
              <div className="flex gap-4">
                {restaurant.image ? (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = ''; }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        {restaurant.featured && (
                          <Badge className="bg-orange-100 text-orange-700"><Star className="w-3 h-3 mr-1" /> Featured</Badge>
                        )}
                        {restaurant.verified && (
                          <Badge className="bg-blue-100 text-blue-700"><Check className="w-3 h-3 mr-1" /> Verified</Badge>
                        )}
                        {restaurant.birthdayPerks && (
                          <Badge className="bg-pink-100 text-pink-700">🎂 Birthday Perks</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {restaurant.area}, {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}{restaurant.country && restaurant.country !== 'India' ? ` (${restaurant.country})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPetMenuBadge(restaurant.petMenuAvailable)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {restaurant.rating}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(Array.isArray(restaurant.cuisine) ? restaurant.cuisine : []).slice(0, 4).map((c, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>

                  {restaurant.conciergeRecommendation && (
                    <p className="text-sm text-purple-600 mt-2 flex items-start gap-1">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1"><strong>Concierge®:</strong> {restaurant.conciergeRecommendation}</span>
                    </p>
                  )}

                  {Array.isArray(restaurant.petMenuItems) && restaurant.petMenuItems.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      🍽️ {restaurant.petMenuItems.slice(0, 3).join(', ')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => startEdit(restaurant)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteRestaurant(restaurant.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                    {restaurant.zomatoLink && (
                      <a href={restaurant.zomatoLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" /> Zomato</Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      </>
      )}
      
      {/* ============ RESERVATIONS TAB ============ */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Select value={reservationFilter} onValueChange={setReservationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchReservations}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reservations found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => (
                <Card key={res.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{res.restaurant_name || 'Unknown Restaurant'}</h4>
                        <Badge className={
                          res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          res.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          res.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {res.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{res.name}</span> • {res.email} • {res.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" /> {res.date} at {res.time} • 
                        <Users className="w-3 h-3 inline mx-1" /> {res.guests} guests
                        {res.pets > 0 && <><PawPrint className="w-3 h-3 inline mx-1" /> {res.pets} pets</>}
                      </p>
                      {res.special_requests && (
                        <p className="text-xs text-gray-400 italic">&ldquo;{res.special_requests}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {res.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateReservationStatus(res.id, 'confirmed')}>
                            <Check className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateReservationStatus(res.id, 'cancelled')}>
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                      {res.status === 'confirmed' && (
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => updateReservationStatus(res.id, 'completed')}>
                          <UserCheck className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ============ PET BUDDY VISITS TAB ============ */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{visitStats.total || 0}</div>
              <div className="text-xs text-gray-500">Total Visits</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{visitStats.scheduled || 0}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{visitStats.completed || 0}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{visitStats.looking_for_buddies || 0}</div>
              <div className="text-xs text-gray-500">Looking for Buddies</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{visitStats.cancelled || 0}</div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </Card>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Select value={visitFilter} onValueChange={setVisitFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchVisits}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading visits...</div>
          ) : visits.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <PawPrint className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pet buddy visits found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {visits.map(visit => {
                const hasVerification = visit.instagram || visit.facebook || visit.linkedin;
                const petsList = visit.pets?.length > 0 ? visit.pets : (visit.pet_name ? [{name: visit.pet_name, breed: visit.pet_breed, about: visit.pet_about}] : []);
                
                return (
                <Card key={visit.id} className={`p-4 ${hasVerification ? 'border-l-4 border-l-green-400' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{visit.restaurant_name}</h4>
                        <Badge className={
                          visit.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                          visit.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {visit.status}
                        </Badge>
                        {hasVerification && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            ✓ Verified Profile
                          </Badge>
                        )}
                        {visit.safety_agreed && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            ✓ Safety Agreed
                          </Badge>
                        )}
                        {visit.looking_for_buddies && (
                          <Badge className="bg-pink-100 text-pink-700">
                            <Heart className="w-3 h-3 mr-1" /> Looking for Buddies
                          </Badge>
                        )}
                      </div>
                      
                      {/* User Details */}
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium text-gray-800">
                          {visit.title} {visit.first_name} {visit.last_name || visit.user_name || 'Anonymous'}
                        </p>
                        <div className="text-gray-600 text-xs space-y-0.5 mt-1">
                          {visit.email && <p>📧 {visit.email}</p>}
                          {visit.whatsapp && <p>📱 WhatsApp: {visit.whatsapp}</p>}
                          {visit.notification_preference && <p>🔔 Prefers: {visit.notification_preference}</p>}
                        </div>
                        
                        {/* Social Profiles */}
                        {hasVerification && (
                          <div className="flex gap-3 mt-2 pt-2 border-t">
                            {visit.instagram && (
                              <a href={visit.instagram.startsWith('http') ? visit.instagram : `https://instagram.com/${visit.instagram.replace('@','')}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-pink-500 hover:text-pink-600 text-xs flex items-center gap-1">
                                📷 Instagram
                              </a>
                            )}
                            {visit.facebook && (
                              <a href={visit.facebook.startsWith('http') ? visit.facebook : `https://facebook.com/${visit.facebook}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                                👤 Facebook
                              </a>
                            )}
                            {visit.linkedin && (
                              <a href={visit.linkedin.startsWith('http') ? visit.linkedin : `https://linkedin.com/in/${visit.linkedin}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-blue-700 hover:text-blue-800 text-xs flex items-center gap-1">
                                💼 LinkedIn
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Visit Details */}
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" /> {visit.date} • 
                        <Clock className="w-3 h-3 inline mx-1" /> {visit.time_slot}
                        {visit.restaurant_city && <> • 📍 {visit.restaurant_city}</>}
                      </p>
                      
                      {/* Pets Info */}
                      {petsList.length > 0 && (
                        <div className="bg-pink-50 p-2 rounded mt-2">
                          <p className="text-xs font-medium text-pink-800 mb-1">🐕 Bringing {petsList.length} pet{petsList.length > 1 ? 's' : ''}:</p>
                          <div className="space-y-1">
                            {petsList.map((pet, idx) => (
                              <div key={idx} className="text-xs text-pink-700">
                                <span className="font-medium">{pet.name}</span>
                                {pet.breed && <span className="text-pink-500"> ({pet.breed})</span>}
                                {pet.about && <span className="italic text-pink-600"> - "{pet.about}"</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {visit.notes && (
                        <p className="text-xs text-gray-400 italic mt-1">"{visit.notes}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {visit.status === 'scheduled' && (
                        <>
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => updateVisitStatus(visit.id, 'completed')}>
                            <Check className="w-3 h-3 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateVisitStatus(visit.id, 'cancelled')}>
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* ============ MEETUP REQUESTS TAB ============ */}
      {activeTab === 'meetups' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{meetupStats.total || 0}</div>
              <div className="text-xs text-gray-500">Total Requests</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{meetupStats.pending || 0}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{meetupStats.accepted || 0}</div>
              <div className="text-xs text-gray-500">Accepted</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{meetupStats.declined || 0}</div>
              <div className="text-xs text-gray-500">Declined</div>
            </Card>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Select value={meetupFilter} onValueChange={setMeetupFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchMeetups}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading meetup requests...</div>
          ) : meetups.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No meetup requests found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {meetups.map(meetup => (
                <Card key={meetup.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{meetup.restaurant_name || 'Unknown'}</h4>
                        <Badge className={
                          meetup.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          meetup.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          meetup.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          meetup.status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {meetup.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">From:</span> {meetup.requester_name || 'Unknown'} → <span className="font-medium">To:</span> {meetup.target_user_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" /> {meetup.visit_date}
                      </p>
                      {meetup.message && (
                        <p className="text-xs text-gray-400 italic mt-1">"{meetup.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Status change buttons */}
                      <div className="flex gap-1">
                        {meetup.status === 'pending' && (
                          <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7 text-xs" onClick={() => updateMeetupStatus(meetup.id, 'accepted')}>
                              <Check className="w-3 h-3 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateMeetupStatus(meetup.id, 'declined')}>
                              <XCircle className="w-3 h-3 mr-1" /> Decline
                            </Button>
                          </>
                        )}
                        {meetup.status === 'accepted' && (
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 h-7 text-xs" onClick={() => updateMeetupStatus(meetup.id, 'completed')}>
                            <UserCheck className="w-3 h-3 mr-1" /> Complete
                          </Button>
                        )}
                        {meetup.status !== 'cancelled' && meetup.status !== 'completed' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMeetupStatus(meetup.id, 'cancelled')}>
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteMeetup(meetup.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ============ BUNDLES TAB (UNIFIED) ============ */}
      {activeTab === 'bundles' && (
        <PillarBundlesTab
          pillar="dine"
          pillarName="Dine"
          accentColor="orange"
        />
      )}

      {/* ============ PRODUCTS TAB ============ */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/admin/pillar-products/seed-dine-catalog`, { method: 'POST' });
                  const data = await res.json();
                  toast({ title: `Seed Complete`, description: data.message });
                } catch (e) {
                  toast({ title: 'Seed Failed', variant: 'destructive' });
                }
              }}
              data-testid="seed-dine-products-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Seed Dine Catalog (48 products)
            </Button>
          </div>
          <PillarProductsTab pillar="dine" pillarName="Dine" />
        </div>
      )}
      
      {/* ============ SERVICES TAB ============ */}
      {activeTab === 'services' && (
        <PillarServicesTab 
          pillar="dine"
          pillarName="Dine"
          pillarIcon="🍽️"
          pillarColor="bg-orange-500"
        />
      )}
      
      {/* ============ EXPERIENCES TAB ============ */}
      {activeTab === 'experiences' && (
        <PillarExperiencesTab 
          pillar="dine"
          credentials={credentials}
          accentColor="orange"
        />
      )}
      
      {/* ============ SETTINGS TAB ============ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* General Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              General Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-acknowledge Reservations</label>
                <input type="checkbox" className="w-4 h-4 text-orange-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Notification Email</label>
                <Input placeholder="dine@company.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Notification WhatsApp</label>
                <Input placeholder="+91 98765 43210" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Default Table Booking Lead Time (Hours)</label>
                <Input type="number" placeholder="2" defaultValue={2} className="mt-1" />
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
                <label className="text-sm font-medium">Points per Reservation</label>
                <Input type="number" placeholder="25" defaultValue={25} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Birthday Bonus Points</label>
                <Input type="number" placeholder="100" defaultValue={100} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Birthday Discount (%)</label>
                <Input type="number" placeholder="15" defaultValue={15} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Referral Rewards</label>
                <input type="checkbox" className="w-4 h-4 text-amber-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Referrer Bonus Points</label>
                <Input type="number" placeholder="50" defaultValue={50} className="mt-1" />
              </div>
            </div>
          </Card>

          {/* Buddy Match Settings */}
          <Card className="p-6 border-2 border-pink-200 bg-pink-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              Pet Buddy Match Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Buddy Matching</label>
                <input type="checkbox" className="w-4 h-4 text-pink-600" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-notify on Match</label>
                <input type="checkbox" className="w-4 h-4 text-pink-600" defaultChecked />
              </div>
              <div>
                <label className="text-sm font-medium">Match Expiry (Days)</label>
                <Input type="number" placeholder="7" defaultValue={7} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Max Buddy Requests per Day</label>
                <Input type="number" placeholder="5" defaultValue={5} className="mt-1" />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <Card className="p-8 text-center mt-4" data-testid="dine-partners-panel">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Dine Partners</p>
          <p className="text-sm text-gray-400 mt-1">Restaurant and food delivery partner management coming soon</p>
        </Card>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <Card className="p-8 text-center mt-4" data-testid="dine-tips-panel">
          <Zap className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Dine Tips</p>
          <p className="text-sm text-gray-400 mt-1">Quick win tips for pet nutrition and dining experiences coming soon</p>
        </Card>
      )}
    </div>
  );
};

export default DineManager;
