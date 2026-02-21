/**
 * ServiceCRUDAdmin.jsx
 * Admin interface for managing services with CRUD and CSV export/import
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import {
  Plus, Search, Download, Upload, Edit2, Trash2, Save, X,
  ChevronDown, ChevronUp, Filter, CheckCircle, AlertCircle
} from 'lucide-react';

// Pillars for dropdown
const PILLARS = [
  { id: 'care', name: 'Care' },
  { id: 'stay', name: 'Stay' },
  { id: 'learn', name: 'Learn' },
  { id: 'fit', name: 'Fit' },
  { id: 'travel', name: 'Travel' },
  { id: 'celebrate', name: 'Celebrate' },
  { id: 'advisory', name: 'Advisory' },
  { id: 'emergency', name: 'Emergency' },
  { id: 'farewell', name: 'Farewell' },
  { id: 'adopt', name: 'Adopt' },
  { id: 'paperwork', name: 'Paperwork' },
];

const ServiceCRUDAdmin = () => {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    pillar: 'care',
    description: '',
    base_price: 0,
    duration: '',
    is_bookable: true,
    mira_whisper: '',
    whisper_shih_tzu: '',
    whisper_golden_retriever: '',
    whisper_labrador: '',
    whisper_pug: '',
    whisper_default: '',
  });

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/service-box/export-csv`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      toast({ title: 'Error fetching services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services
  const filteredServices = services.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mira_whisper?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPillar = selectedPillar === 'all' || s.pillar === selectedPillar;
    return matchesSearch && matchesPillar;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['id', 'name', 'pillar', 'description', 'base_price', 'duration', 'is_bookable', 'mira_whisper', 'whisper_shih_tzu', 'whisper_golden_retriever', 'whisper_labrador', 'whisper_pug', 'whisper_beagle', 'whisper_german_shepherd', 'whisper_default'];
    
    const csvRows = [headers.join(',')];
    
    filteredServices.forEach(s => {
      const row = headers.map(h => {
        let val = s[h] || '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'CSV Exported', description: `${filteredServices.length} services exported` });
  };

  // Import CSV
  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const importData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        
        // Convert types
        row.base_price = parseFloat(row.base_price) || 0;
        row.is_bookable = row.is_bookable !== 'false';
        row.is_free = row.is_free === 'true';
        row.is_active = row.is_active !== 'false';
        
        importData.push(row);
      }

      // Send to API
      const res = await fetch(`${API_URL}/api/service-box/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });

      if (res.ok) {
        const result = await res.json();
        toast({ 
          title: 'Import Successful', 
          description: `Created: ${result.created}, Updated: ${result.updated}` 
        });
        fetchServices();
      } else {
        throw new Error('Import failed');
      }
    } catch (err) {
      toast({ title: 'Import Failed', description: err.message, variant: 'destructive' });
    }
    
    e.target.value = '';
  };

  // Start editing
  const handleEdit = (service) => {
    setEditingId(service.id);
    setEditForm({ ...service });
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/service-box/services/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          base_price: parseFloat(editForm.base_price) || 0,
          duration: editForm.duration,
          is_bookable: editForm.is_bookable,
          mira_whisper: editForm.mira_whisper,
          breed_whispers: {
            shih_tzu: editForm.whisper_shih_tzu,
            golden_retriever: editForm.whisper_golden_retriever,
            labrador: editForm.whisper_labrador,
            pug: editForm.whisper_pug,
            beagle: editForm.whisper_beagle,
            german_shepherd: editForm.whisper_german_shepherd,
            default: editForm.whisper_default || editForm.mira_whisper,
          }
        })
      });

      if (res.ok) {
        toast({ title: 'Service Updated' });
        setEditingId(null);
        fetchServices();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  // Delete service
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`${API_URL}/api/service-box/services/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: 'Service Deleted' });
        fetchServices();
      }
    } catch (err) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  // Add new service
  const handleAddService = async () => {
    try {
      const serviceId = `svc-${newService.pillar}-${Date.now()}`;
      
      const res = await fetch(`${API_URL}/api/service-box/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: serviceId,
          ...newService,
          base_price: parseFloat(newService.base_price) || 0,
          breed_whispers: {
            shih_tzu: newService.whisper_shih_tzu,
            golden_retriever: newService.whisper_golden_retriever,
            labrador: newService.whisper_labrador,
            pug: newService.whisper_pug,
            default: newService.whisper_default || newService.mira_whisper,
          }
        })
      });

      if (res.ok) {
        toast({ title: 'Service Created' });
        setShowAddForm(false);
        setNewService({
          name: '',
          pillar: 'care',
          description: '',
          base_price: 0,
          duration: '',
          is_bookable: true,
          mira_whisper: '',
          whisper_shih_tzu: '',
          whisper_golden_retriever: '',
          whisper_labrador: '',
          whisper_pug: '',
          whisper_default: '',
        });
        fetchServices();
      }
    } catch (err) {
      toast({ title: 'Create Failed', variant: 'destructive' });
    }
  };

  // Seed breed services
  const handleSeedBreedServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/service-box/seed-breed-services`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: 'Breed Services Seeded', 
          description: `Created: ${data.created}, Updated: ${data.updated}` 
        });
        fetchServices();
      }
    } catch (err) {
      toast({ title: 'Seed Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-500">Manage services with breed-specific Mira whispers</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSeedBreedServices} variant="outline" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Seed Breed Services
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  Import CSV
                </span>
              </Button>
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <Button onClick={() => setShowAddForm(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services or whispers..."
                className="pl-10"
              />
            </div>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Pillars</option>
              {PILLARS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-6 mb-6 border-purple-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add New Service</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
              />
              <select
                value={newService.pillar}
                onChange={(e) => setNewService({...newService, pillar: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                {PILLARS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Base Price"
                value={newService.base_price}
                onChange={(e) => setNewService({...newService, base_price: e.target.value})}
              />
              <Input
                placeholder="Duration (e.g., 45 mins)"
                value={newService.duration}
                onChange={(e) => setNewService({...newService, duration: e.target.value})}
              />
              <Input
                placeholder="Default Mira Whisper"
                value={newService.mira_whisper}
                onChange={(e) => setNewService({...newService, mira_whisper: e.target.value})}
                className="md:col-span-2"
              />
              <Input
                placeholder="Shih Tzu whisper"
                value={newService.whisper_shih_tzu}
                onChange={(e) => setNewService({...newService, whisper_shih_tzu: e.target.value})}
              />
              <Input
                placeholder="Golden Retriever whisper"
                value={newService.whisper_golden_retriever}
                onChange={(e) => setNewService({...newService, whisper_golden_retriever: e.target.value})}
              />
              <Input
                placeholder="Labrador whisper"
                value={newService.whisper_labrador}
                onChange={(e) => setNewService({...newService, whisper_labrador: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddService} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Create Service
              </Button>
            </div>
          </Card>
        )}

        {/* Services List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pillar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mira Whisper</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No services found</td>
                  </tr>
                ) : (
                  filteredServices.slice(0, 100).map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      {editingId === service.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                              {service.pillar}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={editForm.base_price}
                              onChange={(e) => setEditForm({...editForm, base_price: e.target.value})}
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={editForm.mira_whisper}
                              onChange={(e) => setEditForm({...editForm, mira_whisper: e.target.value})}
                              className="w-full"
                              placeholder="Default whisper"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-xs text-gray-500">{service.id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                              {service.pillar}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {service.base_price ? `₹${service.base_price}` : 'Quote'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600 truncate max-w-xs" title={service.mira_whisper}>
                              {service.mira_whisper || service.whisper_default || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredServices.length > 100 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-center text-sm text-gray-500">
              Showing 100 of {filteredServices.length} services. Use filters or export CSV for full list.
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{services.length}</p>
            <p className="text-sm text-gray-500">Total Services</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {services.filter(s => s.is_active !== false).length}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {new Set(services.map(s => s.pillar)).size}
            </p>
            <p className="text-sm text-gray-500">Pillars</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {services.filter(s => s.whisper_shih_tzu || s.whisper_golden_retriever).length}
            </p>
            <p className="text-sm text-gray-500">With Breed Whispers</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceCRUDAdmin;
