import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, PawPrint, Plus, Edit2, Trash2, Save, X, RefreshCw,
  GripVertical, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const AboutManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('dogs');
  const [team, setTeam] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('dog'); // 'dog' or 'team'

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/about/content`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team || []);
        setDogs(data.dogs || []);
      }
    } catch (error) {
      console.error('Failed to fetch about content:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/about/seed`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Seeded ${data.team_count} team members and ${data.dogs_count} dogs!`);
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to seed content:', error);
    }
  };

  const saveItem = async (type, item) => {
    const isNew = !item.id || item.id.startsWith('new-');
    const endpoint = type === 'dog' ? 'dogs' : 'team';
    const url = isNew 
      ? `${API_URL}/api/admin/about/${endpoint}`
      : `${API_URL}/api/admin/about/${endpoint}/${item.id}`;
    
    try {
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(item)
      });
      
      if (response.ok) {
        fetchContent();
        setEditingItem(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const deleteItem = async (type, id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    
    const endpoint = type === 'dog' ? 'dogs' : 'team';
    try {
      const response = await fetch(`${API_URL}/api/admin/about/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const toggleActive = async (type, item) => {
    await saveItem(type, { ...item, is_active: !item.is_active });
  };

  return (
    <div className="space-y-6" data-testid="about-manager">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-500" />
            About Page Manager
          </h1>
          <p className="text-gray-500 mt-1">Manage team members and featured dogs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchContent}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={seedContent}>
            <Sparkles className="w-4 h-4 mr-2" /> Seed Default Data
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-purple-50">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <PawPrint className="w-4 h-4" />
            <span className="text-xs">Featured Dogs</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{dogs.length}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{team.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Active Dogs</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{dogs.filter(d => d.is_active).length}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Active Team</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{team.filter(t => t.is_active).length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="dogs" className="flex items-center gap-2">
            <PawPrint className="w-4 h-4" /> Featured Dogs
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members
          </TabsTrigger>
        </TabsList>

        {/* Dogs Tab */}
        <TabsContent value="dogs" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Featured Dogs</h3>
            <Button onClick={() => { setAddType('dog'); setShowAddModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Dog
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto"></div>
            </div>
          ) : dogs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogs.map((dog) => (
                <Card key={dog.id} className={`overflow-hidden ${!dog.is_active ? 'opacity-50' : ''}`}>
                  {dog.image && (
                    <div className="h-40 overflow-hidden bg-gray-100">
                      <img src={dog.image} alt={dog.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dog.emoji}</span>
                        <h4 className="font-bold">{dog.name}</h4>
                      </div>
                      <Badge variant={dog.is_active ? "default" : "secondary"}>
                        {dog.is_active ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                    <p className="text-purple-600 text-sm">{dog.breed}</p>
                    <p className="text-gray-500 text-xs mb-2">{dog.role}</p>
                    <p className="text-gray-600 text-sm line-clamp-2">{dog.story}</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...dog, type: 'dog' })}>
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('dog', dog)}>
                        {dog.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                        {dog.is_active ? 'Hide' : 'Show'}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500" onClick={() => deleteItem('dog', dog.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <PawPrint className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No featured dogs yet. Click "Seed Default Data" or add dogs manually.</p>
            </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Team Members</h3>
            <Button onClick={() => { setAddType('team'); setShowAddModal(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Team Member
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto"></div>
            </div>
          ) : team.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {team.map((member) => (
                <Card key={member.id} className={`p-4 ${!member.is_active ? 'opacity-50' : ''}`}>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center text-3xl">
                      {member.emoji}
                    </div>
                    <h4 className="font-bold">{member.name}</h4>
                    <p className="text-purple-600 text-sm">{member.role}</p>
                  </div>
                  <p className="text-gray-600 text-sm text-center line-clamp-3">{member.description}</p>
                  
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...member, type: 'team' })}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive('team', member)}>
                      {member.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => deleteItem('team', member.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet. Click "Seed Default Data" or add members manually.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Add Modal */}
      {(editingItem || showAddModal) && (
        <EditModal
          item={editingItem || { type: addType }}
          onSave={(item) => saveItem(item.type, item)}
          onClose={() => { setEditingItem(null); setShowAddModal(false); }}
        />
      )}
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ item, onSave, onClose }) => {
  const isNew = !item.id;
  const isDog = item.type === 'dog';
  
  const [formData, setFormData] = useState({
    name: item.name || '',
    emoji: item.emoji || (isDog ? '🐕' : '👤'),
    role: item.role || '',
    description: item.description || '',
    story: item.story || '',
    breed: item.breed || '',
    image: item.image || '',
    order: item.order || 99,
    is_active: item.is_active !== false
  });

  const handleSave = () => {
    onSave({ ...item, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isNew ? 'Add' : 'Edit'} {isDog ? 'Dog' : 'Team Member'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium">Emoji</label>
              <Input
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="mt-1 text-center text-2xl"
                maxLength={2}
              />
            </div>
            <div className="col-span-3">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
                placeholder={isDog ? "Lola" : "Baking Maestros"}
              />
            </div>
          </div>

          {isDog && (
            <div>
              <label className="text-sm font-medium">Breed</label>
              <Input
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="mt-1"
                placeholder="Golden Retriever"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Role</label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1"
              placeholder={isDog ? "Chief Taste Tester" : "The Heart of Every Treat"}
            />
          </div>

          {isDog ? (
            <div>
              <label className="text-sm font-medium">Story</label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg h-24"
                placeholder="Tell us about this good boy/girl..."
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg h-24"
                placeholder="Describe this team..."
              />
            </div>
          )}

          {isDog && (
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="mt-1"
                placeholder="https://..."
              />
              {formData.image && (
                <div className="mt-2 h-32 rounded overflow-hidden">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 99 })}
                className="mt-1"
                min={1}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Show on About page</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutManager;
