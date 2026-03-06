/**
 * EnjoyExperiencesAdmin.jsx
 * Admin component for managing Events & Experiences shown on the Enjoy page
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { 
  Plus, Edit, Trash2, Calendar, MapPin, Clock, Users, 
  Star, Eye, EyeOff, Loader2, PartyPopper, Mountain,
  Coffee, GraduationCap, Dog, Sparkles
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const EXPERIENCE_TYPES = [
  { id: 'events', label: 'Events', icon: PartyPopper },
  { id: 'trails', label: 'Trails & Hikes', icon: Mountain },
  { id: 'meetups', label: 'Meetups', icon: Users },
  { id: 'cafe', label: 'Pet Cafés', icon: Coffee },
  { id: 'workshops', label: 'Workshops', icon: GraduationCap },
  { id: 'shows', label: 'Dog Shows', icon: Dog },
];

const EnjoyExperiencesAdmin = ({ getAuthHeader }) => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'events',
    event_date: '',
    event_time: '',
    venue_name: '',
    city: 'Mumbai',
    address: '',
    price: 0,
    is_free: true,
    max_capacity: 50,
    featured: false,
    image: '',
    organizer: '',
    tags: [],
    pet_types_allowed: ['dogs', 'cats'],
    requirements: '',
    contact_phone: '',
    contact_email: ''
  });

  // Fetch experiences
  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/enjoy/experiences?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setExperiences(data.experiences || []);
      }
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  // Open modal for new experience
  const handleAddNew = () => {
    setEditingExperience(null);
    setFormData({
      name: '',
      description: '',
      type: 'events',
      event_date: '',
      event_time: '',
      venue_name: '',
      city: 'Mumbai',
      address: '',
      price: 0,
      is_free: true,
      max_capacity: 50,
      featured: false,
      image: '',
      organizer: '',
      tags: [],
      pet_types_allowed: ['dogs', 'cats'],
      requirements: '',
      contact_phone: '',
      contact_email: ''
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (experience) => {
    setEditingExperience(experience);
    setFormData({
      name: experience.name || '',
      description: experience.description || '',
      type: experience.type || 'events',
      event_date: experience.event_date || '',
      event_time: experience.event_time || '',
      venue_name: experience.venue_name || '',
      city: experience.city || 'Mumbai',
      address: experience.address || '',
      price: experience.price || 0,
      is_free: experience.is_free ?? true,
      max_capacity: experience.max_capacity || 50,
      featured: experience.featured ?? false,
      image: experience.image || '',
      organizer: experience.organizer || '',
      tags: experience.tags || [],
      pet_types_allowed: experience.pet_types_allowed || ['dogs', 'cats'],
      requirements: experience.requirements || '',
      contact_phone: experience.contact_phone || '',
      contact_email: experience.contact_email || ''
    });
    setShowModal(true);
  };

  // Save experience
  const handleSave = async () => {
    if (!formData.name || !formData.event_date) {
      toast.error('Name and date are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingExperience 
        ? `${API_URL}/api/enjoy/admin/experiences/${editingExperience.id}`
        : `${API_URL}/api/enjoy/admin/experiences`;
      
      const response = await fetch(url, {
        method: editingExperience ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingExperience ? 'Experience updated!' : 'Experience created!');
        setShowModal(false);
        fetchExperiences();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  // Delete experience
  const handleDelete = async (experience) => {
    if (!window.confirm(`Delete "${experience.name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/enjoy/admin/experiences/${experience.id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (response.ok) {
        toast.success('Experience deleted');
        fetchExperiences();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (experience) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/enjoy/admin/experiences/${experience.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ ...experience, featured: !experience.featured })
      });
      fetchExperiences();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
        <p className="mt-4 text-gray-500">Loading experiences...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-rose-500" />
            Events & Experiences
          </h2>
          <p className="text-gray-500 mt-1">
            Manage events shown on the Enjoy page ({experiences.length} total)
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-rose-600 hover:bg-rose-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-rose-50 border-rose-200">
          <p className="text-sm text-rose-600">Total Events</p>
          <p className="text-2xl font-bold text-rose-700">{experiences.length}</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-600">Featured</p>
          <p className="text-2xl font-bold text-amber-700">
            {experiences.filter(e => e.featured).length}
          </p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-600">Free Events</p>
          <p className="text-2xl font-bold text-green-700">
            {experiences.filter(e => e.is_free).length}
          </p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-600">Upcoming</p>
          <p className="text-2xl font-bold text-purple-700">
            {experiences.filter(e => new Date(e.event_date) > new Date()).length}
          </p>
        </Card>
      </div>

      {/* Experience List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Event</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Date & Time</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Location</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Price</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Featured</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {exp.image ? (
                        <img src={exp.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                          <PartyPopper className="w-6 h-6 text-rose-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{exp.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{exp.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">
                      {exp.type || 'events'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {exp.event_date}
                    </div>
                    {exp.event_time && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        {exp.event_time}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {exp.venue_name || exp.city}
                    </div>
                  </td>
                  <td className="p-4">
                    {exp.is_free ? (
                      <Badge className="bg-green-100 text-green-700">Free</Badge>
                    ) : (
                      <span className="font-medium text-gray-900">₹{exp.price}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeatured(exp)}
                      className={`p-2 rounded-lg transition-colors ${
                        exp.featured 
                          ? 'bg-amber-100 text-amber-600' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${exp.featured ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(exp)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(exp)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-rose-500" />
              {editingExperience ? 'Edit Experience' : 'Add New Experience'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Event Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Weekend Dog Park Meetup"
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>City</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(v) => setFormData({...formData, city: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Gurgaon'].map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Date *</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Event Time</Label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Venue Name</Label>
                <Input
                  value={formData.venue_name}
                  onChange={(e) => setFormData({...formData, venue_name: e.target.value})}
                  placeholder="Shivaji Park Dog Zone"
                />
              </div>
              <div>
                <Label>Full Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Full address..."
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the event..."
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Label>Free Event</Label>
                <Switch
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({...formData, is_free: checked, price: checked ? 0 : formData.price})}
                />
              </div>
              {!formData.is_free && (
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}
              <div>
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({...formData, max_capacity: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://..."
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />
              )}
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <Star className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <Label className="font-medium">Featured Event</Label>
                <p className="text-sm text-gray-500">Show prominently on the Enjoy page</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organizer Name</Label>
                <Input
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                  placeholder="The Doggy Company"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="events@thedoggycompany.in"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Experience</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnjoyExperiencesAdmin;
