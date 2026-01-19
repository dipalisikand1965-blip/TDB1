import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import {
  Car, Train, Plane, Truck, Package, Plus, Edit, Trash2, Search, Filter,
  Download, Upload, RefreshCw, Eye, MessageCircle, Phone, Mail, MapPin,
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, Star,
  Gift, Tag, DollarSign, Users, TrendingUp, PawPrint, Shield, Send,
  FileText, BarChart3, Settings, Bell, ChevronRight, Save, X
} from 'lucide-react';
import axios from 'axios';

// Travel Request Status Config
const REQUEST_STATUS = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  reviewing: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  coordinating: { label: 'Coordinating', color: 'bg-purple-100 text-purple-700', icon: Users },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle }
};

// Travel Type Icons
const TRAVEL_ICONS = {
  cab: Car,
  train: Train,
  flight: Plane,
  relocation: Truck
};

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Request Detail Modal
const RequestDetailModal = ({ request, isOpen, onClose, onUpdate, authHeaders }) => {
  const [status, setStatus] = useState(request?.status || 'submitted');
  const [conciergeNotes, setConciergeNotes] = useState(request?.concierge_notes || '');
  const [quotedPrice, setQuotedPrice] = useState(request?.quoted_price || '');
  const [assignedTo, setAssignedTo] = useState(request?.assigned_to || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setConciergeNotes(request.concierge_notes || '');
      setQuotedPrice(request.quoted_price || '');
      setAssignedTo(request.assigned_to || '');
    }
  }, [request]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.patch(
        `${API_URL}/api/travel/request/${request.request_id}`,
        {
          status,
          concierge_notes: conciergeNotes,
          quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
          assigned_to: assignedTo
        },
        { headers: authHeaders }
      );
      
      if (response.data.success) {
        toast({ title: 'Success', description: 'Request updated' });
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!request) return null;

  const TravelIcon = TRAVEL_ICONS[request.travel_type] || Car;
  const statusConfig = REQUEST_STATUS[request.status] || REQUEST_STATUS.submitted;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <TravelIcon className="w-6 h-6 text-purple-600" />
            {request.request_id}
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pet & Customer Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <PawPrint className="w-4 h-4" /> Pet Details
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {request.pet?.name}</p>
                <p><strong>Breed:</strong> {request.pet?.breed || 'Not specified'}</p>
                <p><strong>Size:</strong> {request.pet?.size || 'Unknown'}</p>
                <p><strong>Weight:</strong> {request.pet?.weight ? `${request.pet.weight} kg` : 'Unknown'}</p>
                <p><strong>Crate Trained:</strong> {request.pet?.crate_trained ? 'Yes' : request.pet?.crate_trained === false ? 'No' : 'Unknown'}</p>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Customer
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {request.customer?.name || 'N/A'}</p>
                <p className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {request.customer?.email || 'N/A'}
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {request.customer?.phone || 'N/A'}
                </p>
              </div>
            </Card>
          </div>

          {/* Journey Details */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" /> Journey Details
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">From</p>
                <p className="font-medium">{request.journey?.pickup_location}</p>
                <p className="text-gray-600">{request.journey?.pickup_city}</p>
              </div>
              <div>
                <p className="text-gray-500">To</p>
                <p className="font-medium">{request.journey?.drop_location}</p>
                <p className="text-gray-600">{request.journey?.drop_city}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{request.journey?.travel_date}</p>
                {request.journey?.travel_time && <p className="text-gray-600">{request.journey.travel_time}</p>}
              </div>
              {request.journey?.is_round_trip && (
                <div>
                  <p className="text-gray-500">Return</p>
                  <p className="font-medium">{request.journey?.return_date || 'TBD'}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Risk Factors */}
          {request.risk_factors?.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Risk Factors
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                {request.risk_factors.map((factor, i) => (
                  <li key={i}>• {factor}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Special Requirements */}
          {request.special_requirements && (
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Special Requirements</h4>
              <p className="text-sm text-gray-600">{request.special_requirements}</p>
            </Card>
          )}

          {/* Concierge Actions */}
          <Card className="p-4 border-2 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Concierge Actions
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUEST_STATUS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Assigned To</Label>
                <Input
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Concierge name"
                />
              </div>
              
              <div>
                <Label>Quoted Price (₹)</Label>
                <Input
                  type="number"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label>Concierge Notes</Label>
              <Textarea
                value={conciergeNotes}
                onChange={(e) => setConciergeNotes(e.target.value)}
                placeholder="Internal notes about this request..."
                rows={3}
              />
            </div>
          </Card>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Product Form Modal
const ProductFormModal = ({ product, isOpen, onClose, onSave, authHeaders }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'travel',
    image: '',
    tags: [],
    pillar: 'travel',
    is_active: true,
    paw_reward: { enabled: false, max_value: 100, custom_message: '' },
    birthday_perk: false,
    shipping_info: { weight: '', dimensions: '', ships_pan_india: true }
  });
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || 'travel',
        image: product.image || '',
        tags: product.tags || [],
        pillar: 'travel',
        is_active: product.is_active !== false,
        paw_reward: product.paw_reward || { enabled: false, max_value: 100, custom_message: '' },
        birthday_perk: product.birthday_perk || false,
        shipping_info: product.shipping_info || { weight: '', dimensions: '', ships_pan_india: true }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'travel',
        image: '',
        tags: ['travel'],
        pillar: 'travel',
        is_active: true,
        paw_reward: { enabled: false, max_value: 100, custom_message: '' },
        birthday_perk: false,
        shipping_info: { weight: '', dimensions: '', ships_pan_india: true }
      });
    }
  }, [product, isOpen]);

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        id: product?.id || `travel-${Date.now()}`
      };

      const url = product?.id 
        ? `${API_URL}/api/admin/products/${product.id}`
        : `${API_URL}/api/admin/products`;
      
      const method = product?.id ? 'put' : 'post';
      
      await axios[method](url, payload, { headers: authHeaders });
      
      toast({ title: 'Success', description: `Product ${product ? 'updated' : 'created'}` });
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            {product ? 'Edit Travel Product' : 'Add Travel Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Pet Travel Carrier"
              />
            </div>
            <div>
              <Label>Price (₹) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Comfortable airline-approved carrier for small to medium dogs..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="carrier">Carrier/Crate</SelectItem>
                  <SelectItem value="harness">Harness</SelectItem>
                  <SelectItem value="calming">Calming Aids</SelectItem>
                  <SelectItem value="kit">Travel Kit</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
            </div>
          </div>

          {/* Paw Reward */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4" /> Paw Reward (Birthday Perk)
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.paw_reward?.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    paw_reward: { ...formData.paw_reward, enabled: e.target.checked }
                  })}
                />
                Enable Paw Reward
              </label>
              {formData.paw_reward?.enabled && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Max Reward Value (₹)</Label>
                    <Input
                      type="number"
                      value={formData.paw_reward?.max_value || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        paw_reward: { ...formData.paw_reward, max_value: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Custom Message</Label>
                    <Input
                      value={formData.paw_reward?.custom_message || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        paw_reward: { ...formData.paw_reward, custom_message: e.target.value }
                      })}
                      placeholder="Free travel kit on birthday!"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Shipping Info
            </h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Weight (kg)</Label>
                <Input
                  value={formData.shipping_info?.weight || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_info: { ...formData.shipping_info, weight: e.target.value }
                  })}
                  placeholder="0.5"
                />
              </div>
              <div>
                <Label className="text-sm">Dimensions</Label>
                <Input
                  value={formData.shipping_info?.dimensions || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_info: { ...formData.shipping_info, dimensions: e.target.value }
                  })}
                  placeholder="30x20x15 cm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.shipping_info?.ships_pan_india !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_info: { ...formData.shipping_info, ships_pan_india: e.target.checked }
                    })}
                  />
                  <span className="text-sm">Ships Pan-India</span>
                </label>
              </div>
            </div>
          </Card>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            Product is Active
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {product ? 'Update' : 'Create'} Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main TravelManager Component
const TravelManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const authHeaders = getAuthHeader ? getAuthHeader() : {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, productsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/travel/requests?limit=100`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/products?category=travel&limit=100`),
        axios.get(`${API_URL}/api/travel/stats`, { headers: authHeaders })
      ]);

      setRequests(requestsRes.data.requests || []);
      setProducts(productsRes.data.products || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = !searchQuery || 
        req.request_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.pet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesType = typeFilter === 'all' || req.travel_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchQuery, statusFilter, typeFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Request ID', 'Type', 'Pet Name', 'Customer', 'From', 'To', 'Date', 'Status', 'Price'];
    const rows = filteredRequests.map(req => [
      req.request_id,
      req.travel_type_name,
      req.pet?.name,
      req.customer?.name,
      req.journey?.pickup_city,
      req.journey?.drop_city,
      req.journey?.travel_date,
      req.status,
      req.quoted_price || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Seed sample products
  const seedProducts = async () => {
    const sampleProducts = [
      { id: 'travel-001', name: 'Pet Travel Carrier (Small)', description: 'Airline-approved soft carrier for small dogs up to 8kg', price: 2499, category: 'carrier', tags: ['travel', 'carrier', 'airline-approved', 'small'], image: '' },
      { id: 'travel-002', name: 'Pet Travel Carrier (Medium)', description: 'Sturdy carrier for medium dogs up to 15kg', price: 3499, category: 'carrier', tags: ['travel', 'carrier', 'medium'], image: '' },
      { id: 'travel-003', name: 'Car Safety Harness', description: 'Adjustable seatbelt harness for safe car travel', price: 899, category: 'harness', tags: ['travel', 'harness', 'car', 'safety'], image: '' },
      { id: 'travel-004', name: 'Travel Water Bowl (Collapsible)', description: 'Portable silicone bowl for on-the-go hydration', price: 349, category: 'accessory', tags: ['travel', 'bowl', 'portable'], image: '' },
      { id: 'travel-005', name: 'Calming Treats (Travel Pack)', description: 'Natural calming treats for anxious travelers - 30 pcs', price: 599, category: 'calming', tags: ['travel', 'calming', 'treats', 'anxiety'], image: '' },
      { id: 'travel-006', name: 'Pet First Aid Kit', description: 'Essential medical supplies for pet emergencies on the go', price: 1299, category: 'kit', tags: ['travel', 'first-aid', 'emergency', 'kit'], image: '' },
      { id: 'travel-007', name: 'Travel Comfort Mat', description: 'Portable padded mat for rest stops and hotels', price: 799, category: 'accessory', tags: ['travel', 'mat', 'comfort', 'portable'], image: '' },
      { id: 'travel-008', name: 'Anti-Nausea Spray', description: 'Natural spray to prevent motion sickness', price: 449, category: 'calming', tags: ['travel', 'motion-sickness', 'calming'], image: '' },
      { id: 'travel-009', name: 'Premium Travel Kit Bundle', description: 'Complete travel kit: carrier, harness, bowl, treats, mat', price: 5999, category: 'kit', tags: ['travel', 'bundle', 'premium', 'kit'], image: '', paw_reward: { enabled: true, max_value: 500, custom_message: 'Free upgrade to premium carrier!' } },
      { id: 'travel-010', name: 'Flight Crate (IATA Approved)', description: 'Heavy-duty IATA approved crate for air travel', price: 8999, category: 'carrier', tags: ['travel', 'crate', 'flight', 'iata-approved'], image: '' }
    ];

    try {
      for (const product of sampleProducts) {
        await axios.post(`${API_URL}/api/admin/products`, { ...product, pillar: 'travel', is_active: true }, { headers: authHeaders });
      }
      toast({ title: 'Success', description: 'Travel products seeded!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed products', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Travel Manager</h2>
            <p className="text-gray-500">Manage travel requests, products & bookings</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Requests" 
          value={stats?.total || 0} 
          icon={FileText} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Pending Review" 
          value={(stats?.by_status?.submitted || 0) + (stats?.by_status?.reviewing || 0)} 
          icon={Clock} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Confirmed" 
          value={stats?.by_status?.confirmed || 0} 
          icon={CheckCircle} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Products" 
          value={products.length} 
          icon={Package} 
          color="bg-purple-500" 
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(REQUEST_STATUS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cab">Cab/Road</SelectItem>
                <SelectItem value="train">Train/Bus</SelectItem>
                <SelectItem value="flight">Flight</SelectItem>
                <SelectItem value="relocation">Relocation</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Requests Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Request ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pet</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No travel requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const TravelIcon = TRAVEL_ICONS[req.travel_type] || Car;
                      const statusConfig = REQUEST_STATUS[req.status] || REQUEST_STATUS.submitted;
                      return (
                        <tr key={req.request_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{req.request_id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TravelIcon className="w-4 h-4 text-purple-600" />
                              <span className="text-sm">{req.travel_type_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{req.pet?.name}</p>
                              <p className="text-xs text-gray-500">{req.pet?.breed}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {req.journey?.pickup_city} → {req.journey?.drop_city}
                          </td>
                          <td className="px-4 py-3 text-sm">{req.journey?.travel_date}</td>
                          <td className="px-4 py-3">
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => { setSelectedRequest(req); setShowRequestModal(true); }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Travel Products ({products.length})</h3>
            <div className="flex gap-2">
              {products.length === 0 && (
                <Button variant="outline" onClick={seedProducts}>
                  <Package className="w-4 h-4 mr-2" />
                  Seed Sample Products
                </Button>
              )}
              <Button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {product.paw_reward?.enabled && (
                    <Badge className="absolute top-2 right-2 bg-amber-500">🎁 Paw Reward</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">₹{product.price}</span>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(product.tags || []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Type */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Requests by Type
              </h3>
              <div className="space-y-3">
                {[
                  { type: 'cab', label: 'Cab/Road', icon: Car, color: 'bg-blue-500' },
                  { type: 'train', label: 'Train/Bus', icon: Train, color: 'bg-green-500' },
                  { type: 'flight', label: 'Flight', icon: Plane, color: 'bg-purple-500' },
                  { type: 'relocation', label: 'Relocation', icon: Truck, color: 'bg-amber-500' }
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{stats?.by_type?.[item.type] || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full ${item.color}`}
                          style={{ width: `${((stats?.by_type?.[item.type] || 0) / (stats?.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* By Status */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Requests by Status
              </h3>
              <div className="space-y-3">
                {Object.entries(REQUEST_STATUS).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <Badge className={config.color}>{stats?.by_status?.[key] || 0}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Requests */}
            <Card className="p-6 md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Requests</h3>
              <div className="space-y-3">
                {(stats?.recent_requests || []).map((req) => (
                  <div key={req.request_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PawPrint className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{req.request_id}</p>
                        <p className="text-xs text-gray-500">{req.travel_type_name} • {req.pet?.name}</p>
                      </div>
                    </div>
                    <Badge className={REQUEST_STATUS[req.status]?.color}>{REQUEST_STATUS[req.status]?.label}</Badge>
                  </div>
                ))}
                {(!stats?.recent_requests || stats.recent_requests.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No recent requests</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={showRequestModal}
        onClose={() => { setShowRequestModal(false); setSelectedRequest(null); }}
        onUpdate={fetchData}
        authHeaders={authHeaders}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        product={editingProduct}
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        onSave={fetchData}
        authHeaders={authHeaders}
      />
    </div>
  );
};

export default TravelManager;
