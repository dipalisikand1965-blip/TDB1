/**
 * AdoptManager - Admin component for managing pet adoption services
 * Features: Adoptable pets, applications, foster program, events, shelters
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../../hooks/use-toast';
import {
  Heart, PawPrint, Home, Calendar, MapPin, Phone, Mail, Users,
  Plus, Edit, Trash2, Search, Filter, Eye, CheckCircle, XCircle,
  Building2, Clock, RefreshCw, FileText, Loader2, Download, Sparkles
} from 'lucide-react';

const getApiUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || '';
};

const AdoptManager = ({ authHeaders }) => {
  // State
  const [activeTab, setActiveTab] = useState('pets');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [seeding, setSeeding] = useState(false);
  
  // Data state
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fosterApplications, setFosterApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [shelters, setShelters] = useState([]);
  
  // Seed sample data function
  const seedAdoptData = async () => {
    if (!confirm('This will seed sample pets, shelters, and events for testing.\n\nContinue?')) return;
    
    setSeeding(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/admin/seed`, {
        method: 'POST',
        headers: authHeaders
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: 'Seed Complete!', 
          description: `Pets: ${data.results?.pets_seeded || 0}, Shelters: ${data.results?.shelters_seeded || 0}, Events: ${data.results?.events_seeded || 0}` 
        });
        fetchPets();
        fetchShelters();
        fetchEvents();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail || 'Failed to seed data', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error seeding:', err);
      toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
    }
    setSeeding(false);
  };

  // CSV Export functions
  const exportPetsCSV = () => {
    const headers = ['Name', 'Species', 'Breed', 'Age', 'Gender', 'Size', 'Status', 'Location', 'Description'];
    const rows = pets.map(p => [
      p.name, p.species, p.breed, p.age, p.gender, p.size, p.status, p.location, p.description?.replace(/,/g, ';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adopt_pets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported!', description: `${pets.length} pets exported to CSV` });
  };

  const exportApplicationsCSV = () => {
    const headers = ['Pet Name', 'Applicant Name', 'Email', 'Phone', 'Status', 'Applied Date', 'Notes'];
    const rows = applications.map(a => [
      a.pet_name, a.applicant_name, a.email, a.phone, a.status, a.created_at?.split('T')[0], a.notes?.replace(/,/g, ';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adopt_applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported!', description: `${applications.length} applications exported to CSV` });
  };

  // Filter state
  const [petFilter, setPetFilter] = useState({ status: 'available' });
  const [appFilter, setAppFilter] = useState({ status: 'all' });
  
  // Modal state
  const [showPetModal, setShowPetModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showShelterModal, setShowShelterModal] = useState(false);
  const [showAppDetailModal, setShowAppDetailModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Form state
  const [petForm, setPetForm] = useState({
    name: '', species: 'dog', breed: '', age: '', gender: '', size: '',
    description: '', photos: [], health_status: '', temperament: [],
    special_needs: '', shelter_id: '', location: '', adoption_fee: 0
  });
  
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', time: '', location: '',
    address: '', contact_email: '', max_attendees: null
  });
  
  const [shelterForm, setShelterForm] = useState({
    name: '', city: '', address: '', phone: '', email: '', website: '', description: ''
  });

  // Fetch data
  useEffect(() => {
    fetchStats();
    fetchPets();
    fetchApplications();
    fetchFosterApplications();
    fetchEvents();
    fetchShelters();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/stats`, { headers: authHeaders });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (petFilter.status && petFilter.status !== 'all') params.append('status', petFilter.status);
      params.append('limit', '100');
      
      const res = await fetch(`${getApiUrl()}/api/adopt/pets?${params}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (appFilter.status && appFilter.status !== 'all') params.append('status', appFilter.status);
      params.append('limit', '100');
      
      const res = await fetch(`${getApiUrl()}/api/adopt/applications?${params}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchFosterApplications = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/foster/applications?limit=100`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setFosterApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching foster apps:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/events?upcoming=false&limit=50`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchShelters = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/shelters?limit=50`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters || []);
      }
    } catch (err) {
      console.error('Error fetching shelters:', err);
    }
  };

  // Save pet
  const savePet = async () => {
    try {
      const url = editingPet 
        ? `${getApiUrl()}/api/adopt/pets/${editingPet.pet_id}`
        : `${getApiUrl()}/api/adopt/pets`;
      
      const method = editingPet ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(petForm)
      });
      
      if (res.ok) {
        toast({ title: editingPet ? 'Pet Updated' : 'Pet Added', description: `${petForm.name} saved successfully` });
        setShowPetModal(false);
        setEditingPet(null);
        resetPetForm();
        fetchPets();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save pet', variant: 'destructive' });
    }
  };

  const deletePet = async (petId) => {
    if (!confirm('Are you sure you want to remove this pet?')) return;
    
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/pets/${petId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (res.ok) {
        toast({ title: 'Pet Removed' });
        fetchPets();
        fetchStats();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove pet', variant: 'destructive' });
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/applications/${appId}/status?status=${status}`, {
        method: 'PUT',
        headers: authHeaders
      });
      
      if (res.ok) {
        toast({ title: 'Status Updated', description: `Application marked as ${status}` });
        fetchApplications();
        fetchPets();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const saveEvent = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/adopt/events`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      
      if (res.ok) {
        toast({ title: 'Event Created' });
        setShowEventModal(false);
        setEventForm({ title: '', description: '', date: '', time: '', location: '', address: '', contact_email: '', max_attendees: null });
        fetchEvents();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create event', variant: 'destructive' });
    }
  };

  const saveShelter = async () => {
    try {
      const params = new URLSearchParams(shelterForm);
      const res = await fetch(`${getApiUrl()}/api/adopt/shelters?${params}`, {
        method: 'POST',
        headers: authHeaders
      });
      
      if (res.ok) {
        toast({ title: 'Shelter Added' });
        setShowShelterModal(false);
        setShelterForm({ name: '', city: '', address: '', phone: '', email: '', website: '', description: '' });
        fetchShelters();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add shelter', variant: 'destructive' });
    }
  };

  const resetPetForm = () => {
    setPetForm({
      name: '', species: 'dog', breed: '', age: '', gender: '', size: '',
      description: '', photos: [], health_status: '', temperament: [],
      special_needs: '', shelter_id: '', location: '', adoption_fee: 0
    });
  };

  const editPet = (pet) => {
    setEditingPet(pet);
    setPetForm({
      name: pet.name || '',
      species: pet.species || 'dog',
      breed: pet.breed || '',
      age: pet.age || '',
      gender: pet.gender || '',
      size: pet.size || '',
      description: pet.description || '',
      photos: pet.photos || [],
      health_status: pet.health_status || '',
      temperament: pet.temperament || [],
      special_needs: pet.special_needs || '',
      shelter_id: pet.shelter_id || '',
      location: pet.location || '',
      adoption_fee: pet.adoption_fee || 0
    });
    setShowPetModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Seed Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-purple-600" />
            Adopt Manager
          </h2>
          <p className="text-gray-500 text-sm">Manage adoptable pets, applications, events, and shelters</p>
        </div>
        <Button 
          onClick={seedAdoptData}
          disabled={seeding}
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Seed Sample Data
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.available_pets}</p>
            <p className="text-xs text-gray-500">Available</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending_adoptions}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.total_adopted}</p>
            <p className="text-xs text-gray-500">Adopted</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pending_applications}</p>
            <p className="text-xs text-gray-500">Applications</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.foster_applications}</p>
            <p className="text-xs text-gray-500">Foster Apps</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.upcoming_events}</p>
            <p className="text-xs text-gray-500">Events</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.partner_shelters}</p>
            <p className="text-xs text-gray-500">Shelters</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="pets"><PawPrint className="w-4 h-4 mr-1" /> Pets</TabsTrigger>
          <TabsTrigger value="applications"><FileText className="w-4 h-4 mr-1" /> Applications</TabsTrigger>
          <TabsTrigger value="foster"><Heart className="w-4 h-4 mr-1" /> Foster</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1" /> Events</TabsTrigger>
          <TabsTrigger value="shelters"><Building2 className="w-4 h-4 mr-1" /> Shelters</TabsTrigger>
        </TabsList>

        {/* PETS TAB */}
        <TabsContent value="pets" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={petFilter.status} onValueChange={v => setPetFilter({...petFilter, status: v})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                  <SelectItem value="fostered">Fostered</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchPets}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportPetsCSV}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </div>
            <Button onClick={() => { resetPetForm(); setEditingPet(null); setShowPetModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Pet
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map(pet => (
                <Card key={pet.pet_id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={pet.photos?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&q=80'}
                      alt={pet.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{pet.name}</h3>
                        <Badge variant={pet.status === 'available' ? 'default' : 'secondary'}>
                          {pet.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{pet.breed || 'Mixed'} • {pet.age || 'Unknown age'}</p>
                      <p className="text-xs text-gray-500">{pet.gender} • {pet.size}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => editPet(pet)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deletePet(pet.pet_id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* APPLICATIONS TAB */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={appFilter.status} onValueChange={v => { setAppFilter({...appFilter, status: v}); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchApplications}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportApplicationsCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>

          <div className="space-y-3">
            {applications.map(app => (
              <Card key={app.application_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{app.applicant_name}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium text-purple-600">{app.pet_name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{app.applicant_email} • {app.applicant_phone}</p>
                    <p className="text-xs text-gray-500">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      app.status === 'approved' ? 'default' :
                      app.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {app.status}
                    </Badge>
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateApplicationStatus(app.application_id, 'under_review')}>
                          Review
                        </Button>
                        <Button size="sm" className="bg-green-600" onClick={() => updateApplicationStatus(app.application_id, 'approved')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.application_id, 'rejected')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedApplication(app); setShowAppDetailModal(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {applications.length === 0 && (
              <p className="text-center text-gray-500 py-8">No applications found</p>
            )}
          </div>
        </TabsContent>

        {/* FOSTER TAB */}
        <TabsContent value="foster" className="space-y-4">
          <div className="space-y-3">
            {fosterApplications.map(app => (
              <Card key={app.foster_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{app.applicant_name}</p>
                    <p className="text-sm text-gray-600">{app.applicant_email} • {app.applicant_phone}</p>
                    <p className="text-xs text-gray-500">Duration: {app.foster_duration} • Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge>{app.status}</Badge>
                </div>
              </Card>
            ))}
            {fosterApplications.length === 0 && (
              <p className="text-center text-gray-500 py-8">No foster applications yet</p>
            )}
          </div>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowEventModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </div>

          <div className="space-y-3">
            {events.map(event => (
              <Card key={event.event_id || event.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.date} {event.start_time && `at ${event.start_time}`}</p>
                    <p className="text-xs text-gray-500">{event.location} • {event.attendees?.length || 0} registered</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{new Date(event.date) >= new Date() ? 'Upcoming' : 'Past'}</Badge>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingEvent(event);
                      setEventForm({
                        title: event.title || '',
                        description: event.description || '',
                        event_type: event.event_type || 'adoption_drive',
                        date: event.date || '',
                        start_time: event.start_time || '',
                        end_time: event.end_time || '',
                        location: event.location || '',
                        organizer: event.organizer || '',
                        max_attendees: event.max_attendees || '',
                        registration_required: event.registration_required || false,
                        image: event.image || ''
                      });
                      setShowEventModal(true);
                    }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SHELTERS TAB */}
        <TabsContent value="shelters" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowShelterModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Shelter
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelters.map(shelter => (
              <Card key={shelter.shelter_id} className="p-4">
                <h3 className="font-semibold">{shelter.name}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" /> {shelter.city}
                </p>
                {shelter.phone && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-1" /> {shelter.phone}
                  </p>
                )}
                {shelter.email && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-1" /> {shelter.email}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Pet Modal */}
      <Dialog open={showPetModal} onOpenChange={setShowPetModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPet ? 'Edit Pet' : 'Add Adoptable Pet'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Species</Label>
              <Select value={petForm.species} onValueChange={v => setPetForm({...petForm, species: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Breed</Label>
              <Input value={petForm.breed} onChange={e => setPetForm({...petForm, breed: e.target.value})} />
            </div>
            <div>
              <Label>Age</Label>
              <Select value={petForm.age} onValueChange={v => setPetForm({...petForm, age: v})}>
                <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="puppy">Puppy/Kitten</SelectItem>
                  <SelectItem value="young">Young (1-3 years)</SelectItem>
                  <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                  <SelectItem value="senior">Senior (7+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={petForm.gender} onValueChange={v => setPetForm({...petForm, gender: v})}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Select value={petForm.size} onValueChange={v => setPetForm({...petForm, size: v})}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={petForm.location} onChange={e => setPetForm({...petForm, location: e.target.value})} placeholder="City" />
            </div>
            <div>
              <Label>Adoption Fee (₹)</Label>
              <Input type="number" value={petForm.adoption_fee} onChange={e => setPetForm({...petForm, adoption_fee: parseInt(e.target.value) || 0})} />
            </div>
            <div className="col-span-2">
              <Label>Photo URL</Label>
              <Input 
                value={petForm.photos?.[0] || ''} 
                onChange={e => setPetForm({...petForm, photos: [e.target.value]})} 
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={petForm.description} onChange={e => setPetForm({...petForm, description: e.target.value})} rows={3} />
            </div>
            <div className="col-span-2">
              <Label>Special Needs</Label>
              <Input value={petForm.special_needs} onChange={e => setPetForm({...petForm, special_needs: e.target.value})} placeholder="Any special requirements..." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPetModal(false)}>Cancel</Button>
            <Button onClick={savePet}>{editingPet ? 'Update' : 'Add'} Pet</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Adoption Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Event Title *</Label>
              <Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} placeholder="10:00 AM - 4:00 PM" />
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} placeholder="Venue name" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={eventForm.address} onChange={e => setEventForm({...eventForm, address: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} rows={2} />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button onClick={saveEvent}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Shelter Modal */}
      <Dialog open={showShelterModal} onOpenChange={setShowShelterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partner Shelter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Shelter Name *</Label>
              <Input value={shelterForm.name} onChange={e => setShelterForm({...shelterForm, name: e.target.value})} />
            </div>
            <div>
              <Label>City *</Label>
              <Input value={shelterForm.city} onChange={e => setShelterForm({...shelterForm, city: e.target.value})} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={shelterForm.address} onChange={e => setShelterForm({...shelterForm, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={shelterForm.phone} onChange={e => setShelterForm({...shelterForm, phone: e.target.value})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={shelterForm.email} onChange={e => setShelterForm({...shelterForm, email: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowShelterModal(false)}>Cancel</Button>
            <Button onClick={saveShelter}>Add Shelter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Detail Modal */}
      <Dialog open={showAppDetailModal} onOpenChange={setShowAppDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Applicant</Label>
                  <p className="font-medium">{selectedApplication.applicant_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Pet</Label>
                  <p className="font-medium">{selectedApplication.pet_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p>{selectedApplication.applicant_email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p>{selectedApplication.applicant_phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Home Type</Label>
                  <p>{selectedApplication.home_type || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Other Pets</Label>
                  <p>{selectedApplication.other_pets || 'None'}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Experience</Label>
                <p className="text-sm">{selectedApplication.experience || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Reason for Adoption</Label>
                <p className="text-sm">{selectedApplication.reason || 'Not provided'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdoptManager;
