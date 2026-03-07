/**
 * PillarExperiencesTab - Reusable Experiences Management Tab
 * ============================================================
 * 
 * A reusable component for managing pillar-specific experiences
 * in admin dashboards. Handles CRUD operations for experiences.
 * 
 * USAGE:
 *   <PillarExperiencesTab 
 *     pillar="dine" 
 *     credentials={credentials}
 *     accentColor="orange"
 *   />
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, 
  Upload, Download, Image as ImageIcon,
  Calendar, Users, MapPin, Clock, Star, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';
import axios from 'axios';

const PillarExperiencesTab = ({ pillar, credentials, accentColor = 'purple' }) => {
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExperience, setEditingExperience] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  
  const csvInputRef = useRef(null);

  const emptyExperience = {
    title: '',
    description: '',
    short_description: '',
    price: 0,
    duration: '',
    location: '',
    city: '',
    max_participants: 10,
    includes: [],
    highlights: [],
    image_url: '',
    is_active: true,
    is_featured: false,
    pet_friendly: true,
    category: '',
    booking_required: true
  };

  // Fetch experiences
  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/${pillar}/admin/experiences`);
      setExperiences(response.data.experiences || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      // Try alternative endpoint
      try {
        const altResponse = await axios.get(`${API_URL}/api/admin/${pillar}/experiences`);
        setExperiences(altResponse.data.experiences || altResponse.data || []);
      } catch (altError) {
        setExperiences([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [pillar]);

  // Save experience
  const handleSaveExperience = async () => {
    if (!editingExperience?.title) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...editingExperience,
        pillar,
        updated_at: new Date().toISOString()
      };

      if (editingExperience.id) {
        await axios.put(`${API_URL}/api/${pillar}/admin/experiences/${editingExperience.id}`, payload);
        toast({ title: 'Experience updated successfully' });
      } else {
        payload.id = `${pillar}-exp-${Date.now()}`;
        payload.created_at = new Date().toISOString();
        await axios.post(`${API_URL}/api/${pillar}/admin/experiences`, payload);
        toast({ title: 'Experience created successfully' });
      }
      
      setEditingExperience(null);
      setIsAddingNew(false);
      fetchExperiences();
    } catch (error) {
      console.error('Error saving experience:', error);
      toast({ title: 'Failed to save experience', variant: 'destructive' });
    }
  };

  // Delete experience
  const handleDeleteExperience = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;

    try {
      await axios.delete(`${API_URL}/api/${pillar}/admin/experiences/${expId}`);
      toast({ title: 'Experience deleted' });
      fetchExperiences();
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({ title: 'Failed to delete experience', variant: 'destructive' });
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open(`${API_URL}/api/${pillar}/admin/experiences/export-csv`, '_blank');
  };

  // Import CSV
  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/${pillar}/admin/experiences/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Success', description: `Imported ${response.data.imported || 0} experiences` });
      fetchExperiences();
    } catch (error) {
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  // Filter experiences
  const filteredExperiences = experiences.filter(exp =>
    exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colorClasses = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
    teal: 'bg-teal-500 hover:bg-teal-600'
  };

  const accentClass = colorClasses[accentColor] || colorClasses.purple;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="pl-9 w-64"
            />
          </div>
          <Badge variant="outline">{filteredExperiences.length} experiences</Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={csvInputRef}
            onChange={handleImportCsv}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()} disabled={importingCsv}>
            <Upload className="w-4 h-4 mr-2" />
            {importingCsv ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            className={accentClass}
            onClick={() => { setEditingExperience(emptyExperience); setIsAddingNew(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </div>

      {/* Experience Form (Add/Edit) */}
      {(editingExperience || isAddingNew) && (
        <Card className="p-6 border-2 border-dashed">
          <h3 className="text-lg font-semibold mb-4">
            {isAddingNew ? 'Add New Experience' : 'Edit Experience'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={editingExperience?.title || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, title: e.target.value })}
                placeholder="Experience title"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Short Description</label>
              <Input
                value={editingExperience?.short_description || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, short_description: e.target.value })}
                placeholder="Brief description for cards"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Full Description</label>
              <textarea
                value={editingExperience?.description || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                placeholder="Detailed description"
                className="w-full p-2 border rounded-md min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                value={editingExperience?.price || 0}
                onChange={(e) => setEditingExperience({ ...editingExperience, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration</label>
              <Input
                value={editingExperience?.duration || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, duration: e.target.value })}
                placeholder="e.g., 2 hours, Half day"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={editingExperience?.location || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, location: e.target.value })}
                placeholder="Venue or area"
              />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Input
                value={editingExperience?.city || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Participants</label>
              <Input
                type="number"
                value={editingExperience?.max_participants || 10}
                onChange={(e) => setEditingExperience({ ...editingExperience, max_participants: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={editingExperience?.image_url || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingExperience?.is_active ?? true}
                  onChange={(e) => setEditingExperience({ ...editingExperience, is_active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingExperience?.is_featured ?? false}
                  onChange={(e) => setEditingExperience({ ...editingExperience, is_featured: e.target.checked })}
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingExperience?.pet_friendly ?? true}
                  onChange={(e) => setEditingExperience({ ...editingExperience, pet_friendly: e.target.checked })}
                />
                <span className="text-sm">Pet Friendly</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setEditingExperience(null); setIsAddingNew(false); }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button className={accentClass} onClick={handleSaveExperience}>
              <Save className="w-4 h-4 mr-2" />
              Save Experience
            </Button>
          </div>
        </Card>
      )}

      {/* Experiences List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading experiences...</div>
      ) : filteredExperiences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No experiences found. Add your first experience!
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExperiences.map((exp) => (
            <Card key={exp.id} className="p-4">
              <div className="flex items-start gap-4">
                {exp.image_url ? (
                  <img src={exp.image_url} alt={exp.title} className="w-24 h-24 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{exp.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{exp.short_description || exp.description?.slice(0, 100)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {exp.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                      <Badge variant={exp.is_active ? 'default' : 'secondary'}>
                        {exp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {exp.price > 0 && (
                      <span className="font-semibold text-green-600">₹{exp.price.toLocaleString()}</span>
                    )}
                    {exp.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exp.duration}
                      </span>
                    )}
                    {exp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {exp.location}
                      </span>
                    )}
                    {exp.max_participants && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Max {exp.max_participants}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingExperience(exp)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteExperience(exp.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PillarExperiencesTab;
