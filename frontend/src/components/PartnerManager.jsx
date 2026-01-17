import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { API_URL } from '../utils/api';
import {
  Search, Filter, Download, Upload, Eye, Edit, Trash2, CheckCircle,
  XCircle, Clock, Building2, Utensils, Home, Scissors, Stethoscope,
  Loader2, ExternalLink, Mail, Phone, MapPin, Globe, Instagram
} from 'lucide-react';

const TYPE_ICONS = {
  restaurant: Utensils,
  stay: Home,
  groomer: Scissors,
  vet: Stethoscope,
  default: Building2
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-purple-100 text-purple-700',
  inactive: 'bg-gray-100 text-gray-700'
};

const PartnerManager = ({ getAuthHeader }) => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '', search: '' });
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [conciergeNotes, setConciergeNotes] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/admin/partners?limit=100`;
      if (filter.status) url += `&status=${filter.status}`;
      if (filter.type) url += `&partner_type=${filter.type}`;
      
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        let apps = data.applications || [];
        
        // Client-side search filter
        if (filter.search) {
          const s = filter.search.toLowerCase();
          apps = apps.filter(a => 
            a.business_name?.toLowerCase().includes(s) ||
            a.email?.toLowerCase().includes(s) ||
            a.city?.toLowerCase().includes(s)
          );
        }
        
        setApplications(apps);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter.status, filter.type]);

  const updateStatus = async (appId, newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${appId}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchApplications();
        if (selectedApp?.id === appId) {
          const data = await res.json();
          setSelectedApp(data.application);
        }
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setUpdating(false);
    }
  };

  const convertToListing = async (appId) => {
    if (!window.confirm('Convert this partner to an active listing?')) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${appId}/convert-to-listing`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Partner converted to ${data.listing_collection} listing!`);
        fetchApplications();
      } else {
        const error = await res.json();
        alert(error.detail || 'Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['business_name', 'contact_name', 'email', 'phone', 'partner_type', 'city', 'status', 'created_at'];
    const rows = [headers.join(',')];
    
    applications.forEach(app => {
      rows.push(headers.map(h => `"${(app[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    });
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `partner_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openDetail = (app) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const Icon = (type) => TYPE_ICONS[type] || TYPE_ICONS.default;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold">Partner Applications</h2>
          <p className="text-sm text-gray-500">Manage partner onboarding requests</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'gray' },
          { label: 'Pending', value: stats.pending, color: 'yellow' },
          { label: 'Reviewing', value: stats.reviewing, color: 'blue' },
          { label: 'Approved', value: stats.approved, color: 'green' },
          { label: 'Active', value: stats.active, color: 'purple' },
          { label: 'Rejected', value: stats.rejected, color: 'red' }
        ].map((stat) => (
          <Card 
            key={stat.label}
            className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${filter.status === stat.label.toLowerCase() ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setFilter({ ...filter, status: filter.status === stat.label.toLowerCase() ? '' : stat.label.toLowerCase() })}
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value || 0}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search business, email, city..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
            className="pl-10"
          />
        </div>
        <select 
          className="border rounded-lg px-3 py-2 min-w-[150px]"
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="restaurant">Restaurant</option>
          <option value="stay">Stay</option>
          <option value="groomer">Groomer</option>
          <option value="vet">Vet</option>
          <option value="trainer">Trainer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No applications found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const TypeIcon = Icon(app.partner_type);
            return (
              <Card key={app.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TypeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{app.business_name}</h3>
                      <Badge className={STATUS_COLORS[app.status] || 'bg-gray-100'}>
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {app.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {app.email}
                      </span>
                      <span className="capitalize">{app.partner_type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'reviewing')}>
                          Review
                        </Button>
                        <Button size="sm" className="bg-green-600" onClick={() => updateStatus(app.id, 'approved')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'rejected')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {app.status === 'approved' && (
                      <Button size="sm" className="bg-purple-600" onClick={() => convertToListing(app.id)}>
                        Convert to Listing
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openDetail(app)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                  {React.createElement(Icon(selectedApp.partner_type), { className: "w-8 h-8 text-purple-600" })}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedApp.business_name}</h3>
                  <p className="text-gray-500 capitalize">{selectedApp.partner_type} • {selectedApp.city}</p>
                  <Badge className={STATUS_COLORS[selectedApp.status]}>{selectedApp.status}</Badge>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Contact Person</Label>
                  <p className="font-medium">{selectedApp.contact_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="font-medium">{selectedApp.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Address</Label>
                  <p className="font-medium">{selectedApp.address || 'Not provided'}</p>
                </div>
                {selectedApp.website && (
                  <div>
                    <Label className="text-gray-500">Website</Label>
                    <a href={selectedApp.website} target="_blank" rel="noopener" className="text-purple-600 flex items-center gap-1">
                      {selectedApp.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selectedApp.instagram && (
                  <div>
                    <Label className="text-gray-500">Instagram</Label>
                    <p className="font-medium">{selectedApp.instagram}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1">{selectedApp.description}</p>
              </div>
              
              {selectedApp.pet_friendly_features?.length > 0 && (
                <div>
                  <Label className="text-gray-500">Pet-Friendly Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedApp.pet_friendly_features.map((f, i) => (
                      <Badge key={i} variant="outline">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Operating Hours</Label>
                  <p>{selectedApp.operating_hours || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Price Range</Label>
                  <p className="capitalize">{selectedApp.price_range || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">How They Found Us</Label>
                  <p className="capitalize">{selectedApp.how_heard_about_us || 'N/A'}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Applied: {new Date(selectedApp.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            {selectedApp?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => { updateStatus(selectedApp.id, 'reviewing'); }}>
                  Mark as Reviewing
                </Button>
                <Button className="bg-green-600" onClick={() => { updateStatus(selectedApp.id, 'approved'); }}>
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => { updateStatus(selectedApp.id, 'rejected'); }}>
                  Reject
                </Button>
              </>
            )}
            {selectedApp?.status === 'approved' && (
              <Button className="bg-purple-600" onClick={() => { convertToListing(selectedApp.id); setShowDetail(false); }}>
                Convert to Listing
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerManager;
