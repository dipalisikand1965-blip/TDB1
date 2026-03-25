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
  Loader2, ExternalLink, Mail, Phone, MapPin, Globe, Instagram,
  AlertCircle, FileCheck, Send, History
} from 'lucide-react';

const TYPE_ICONS = {
  restaurant: Utensils,
  pet_hotel: Home,
  pet_boarding: Home,
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
  
  // Action dialog state
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // approve, reject, request_info
  const [actionReason, setActionReason] = useState('');
  const [actionCommission, setActionCommission] = useState('');
  
  // Document verification state
  const [showDocVerify, setShowDocVerify] = useState(false);
  const [docVerification, setDocVerification] = useState({ gst: null, pan: null, notes: '' });

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

  const saveConciergeNotes = async (appId) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${appId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: conciergeNotes })
      });
      if (res.ok) {
        // Update local state
        setApplications(apps => apps.map(a => 
          a.id === appId ? { ...a, admin_notes: conciergeNotes } : a
        ));
        if (selectedApp?.id === appId) {
          setSelectedApp({ ...selectedApp, admin_notes: conciergeNotes });
        }
        alert('Concierge® notes saved!');
      } else {
        alert('Failed to save notes');
      }
    } catch (error) {
      console.error('Save notes error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Open action dialog
  const openActionDialog = (type) => {
    setActionType(type);
    setActionReason('');
    setActionCommission('');
    setShowActionDialog(true);
  };

  // Process approval/rejection/info request
  const processAction = async () => {
    if (!selectedApp) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${selectedApp.id}/action`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          reason: actionReason,
          commission_rate: actionCommission ? parseFloat(actionCommission) : null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Partner ${actionType}${actionType === 'approve' ? 'd' : actionType === 'reject' ? 'ed' : ' - info requested'}! ${data.email_sent ? 'Email sent.' : ''}`);
        setShowActionDialog(false);
        setSelectedApp(data.application);
        fetchApplications();
      } else {
        const error = await res.json();
        alert(error.detail || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Failed to process action');
    } finally {
      setUpdating(false);
    }
  };

  // Verify documents
  const verifyDocuments = async () => {
    if (!selectedApp) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${selectedApp.id}/verify-documents`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gst_verified: docVerification.gst,
          pan_verified: docVerification.pan,
          verification_notes: docVerification.notes
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Documents verified! ${data.all_documents_verified ? 'All documents verified.' : 'Some documents pending.'}`);
        setShowDocVerify(false);
        setSelectedApp(data.application);
        fetchApplications();
      } else {
        alert('Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['business_name', 'contact_name', 'email', 'phone', 'partner_type', 'city', 'status', 'admin_notes', 'created_at'];
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
    setConciergeNotes(app.admin_notes || '');
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
        <div className="flex gap-2">
          {/* Import CSV */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const response = await fetch(`${API_URL}/api/admin/partners/import-csv`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: formData
                  });
                  if (response.ok) {
                    const result = await response.json();
                    alert(`Imported ${result.imported || 0} partner applications`);
                    fetchApplications();
                  } else {
                    alert('Import failed');
                  }
                } catch (err) {
                  alert('Import error: ' + err.message);
                }
                e.target.value = '';
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </Button>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
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
              
              {/* Concierge® Notes Section */}
              <div className="border-t pt-4">
                <Label className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                  📝 Concierge® Notes
                  <span className="text-xs font-normal text-gray-400">(Internal use only)</span>
                </Label>
                <Textarea
                  value={conciergeNotes}
                  onChange={(e) => setConciergeNotes(e.target.value)}
                  placeholder="Add internal notes about this partner application... (e.g., follow-up dates, special requirements, call notes)"
                  className="min-h-[100px] mb-2"
                />
                <Button 
                  size="sm" 
                  onClick={() => saveConciergeNotes(selectedApp.id)}
                  disabled={updating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Notes
                </Button>
              </div>

              {/* Document Verification Section */}
              {selectedApp.documents && (
                <div className="border-t pt-4">
                  <Label className="text-gray-700 font-semibold flex items-center gap-2 mb-3">
                    📄 Documents
                  </Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">GST Number</span>
                        {selectedApp.document_verification?.gst_verified ? (
                          <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                        ) : selectedApp.document_verification?.gst_verified === false ? (
                          <Badge className="bg-red-100 text-red-700">✗ Rejected</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedApp.documents?.gst_number || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">PAN Number</span>
                        {selectedApp.document_verification?.pan_verified ? (
                          <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                        ) : selectedApp.document_verification?.pan_verified === false ? (
                          <Badge className="bg-red-100 text-red-700">✗ Rejected</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedApp.documents?.pan_number || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Company Turnover</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedApp.documents?.company_turnover?.replace('_', ' ') || 'Not provided'}</p>
                    </div>
                    {selectedApp.additional_cities && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Additional Cities</span>
                        <p className="text-sm text-gray-600 mt-1">{selectedApp.additional_cities}</p>
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setDocVerification({
                        gst: selectedApp.document_verification?.gst_verified || null,
                        pan: selectedApp.document_verification?.pan_verified || null,
                        notes: selectedApp.document_verification?.notes || ''
                      });
                      setShowDocVerify(true);
                    }}
                    className="mt-3"
                  >
                    <FileCheck className="w-4 h-4 mr-1" /> Verify Documents
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex flex-wrap gap-2">
            {selectedApp?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => openActionDialog('request_info')}>
                  <AlertCircle className="w-4 h-4 mr-1" /> Request Info
                </Button>
                <Button className="bg-green-600" onClick={() => openActionDialog('approve')}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => openActionDialog('reject')}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </>
            )}
            {selectedApp?.status === 'reviewing' && (
              <>
                <Button className="bg-green-600" onClick={() => openActionDialog('approve')}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => openActionDialog('reject')}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
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

      {/* Action Dialog (Approve/Reject/Request Info) */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && '✅ Approve Partner'}
              {actionType === 'reject' && '❌ Reject Partner'}
              {actionType === 'request_info' && '📋 Request More Information'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>
                {actionType === 'approve' && 'Approval Message (optional)'}
                {actionType === 'reject' && 'Rejection Reason *'}
                {actionType === 'request_info' && 'What information do you need? *'}
              </Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionType === 'approve' ? 'Add a message for the partner...' :
                  actionType === 'reject' ? 'Explain why the application was rejected...' :
                  'List the documents or information you need...'
                }
                className="min-h-[100px]"
              />
            </div>
            
            {actionType === 'approve' && (
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={actionCommission}
                  onChange={(e) => setActionCommission(e.target.value)}
                  placeholder="e.g. 15"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Default commission rate for this partner</p>
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Send className="w-4 h-4 inline mr-1" />
                An email notification will be sent to <strong>{selectedApp?.email}</strong>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>Cancel</Button>
            <Button
              onClick={processAction}
              disabled={updating || ((actionType === 'reject' || actionType === 'request_info') && !actionReason)}
              className={
                actionType === 'approve' ? 'bg-green-600' :
                actionType === 'reject' ? 'bg-red-600' :
                'bg-amber-600'
              }
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {actionType === 'approve' && 'Approve Partner'}
              {actionType === 'reject' && 'Reject Application'}
              {actionType === 'request_info' && 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Verification Dialog */}
      <Dialog open={showDocVerify} onOpenChange={setShowDocVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📄 Verify Documents</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 border rounded-lg">
              <Label>GST Certificate</Label>
              <p className="text-sm text-gray-600 mb-2">{selectedApp?.documents?.gst_number || 'Not provided'}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={docVerification.gst === true ? 'default' : 'outline'}
                  className={docVerification.gst === true ? 'bg-green-600' : ''}
                  onClick={() => setDocVerification({...docVerification, gst: true})}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Verify
                </Button>
                <Button
                  size="sm"
                  variant={docVerification.gst === false ? 'destructive' : 'outline'}
                  onClick={() => setDocVerification({...docVerification, gst: false})}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <Label>PAN Card</Label>
              <p className="text-sm text-gray-600 mb-2">{selectedApp?.documents?.pan_number || 'Not provided'}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={docVerification.pan === true ? 'default' : 'outline'}
                  className={docVerification.pan === true ? 'bg-green-600' : ''}
                  onClick={() => setDocVerification({...docVerification, pan: true})}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Verify
                </Button>
                <Button
                  size="sm"
                  variant={docVerification.pan === false ? 'destructive' : 'outline'}
                  onClick={() => setDocVerification({...docVerification, pan: false})}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Verification Notes</Label>
              <Textarea
                value={docVerification.notes}
                onChange={(e) => setDocVerification({...docVerification, notes: e.target.value})}
                placeholder="Add notes about document verification..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocVerify(false)}>Cancel</Button>
            <Button
              onClick={verifyDocuments}
              disabled={updating || (docVerification.gst === null && docVerification.pan === null)}
              className="bg-purple-600"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerManager;
