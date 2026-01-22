import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  PawPrint, Plus, Calendar, Gift, Edit, Trash2, Save, X,
  Search, Crown, Moon, Mountain, Sofa, Users, 
  Utensils, Zap, Smile, ChevronRight, ChevronDown, ChevronUp,
  Heart, Sparkles, Stethoscope, Syringe, Pill, AlertCircle,
  RefreshCw, Loader2, Check, MessageCircle
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

// Persona icons mapping
const PERSONA_ICONS = {
  royal: Crown,
  shadow: Moon,
  adventurer: Mountain,
  couch_potato: Sofa,
  social_butterfly: Users,
  foodie: Utensils,
  athlete: Zap,
  mischief_maker: Smile
};

// Soul question labels for display
const SOUL_QUESTION_LABELS = {
  special_move: "Special Move",
  human_job: "Human Job",
  security_blanket: "Security Blanket", 
  love_language: "Love Language",
  personality_tag: "Personality Tag",
  morning_routine: "Morning Routine",
  favorite_nap_spot: "Favorite Nap Spot",
  reaction_to_bath: "Reaction to Bath",
  superpower: "Superpower",
  guilty_pleasure: "Guilty Pleasure"
};

const MyPets = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [personas, setPersonas] = useState({});
  const [upcomingCelebrations, setUpcomingCelebrations] = useState([]);
  
  // Expanded sections state
  const [expandedSoul, setExpandedSoul] = useState({});
  const [expandedHealth, setExpandedHealth] = useState({});
  
  // Health data for each pet
  const [healthData, setHealthData] = useState({});
  const [loadingHealth, setLoadingHealth] = useState({});
  
  // Edit mode state
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/my-pets', message: 'Please login to view your pets' } });
    }
  }, [authLoading, user, navigate]);

  // Fetch user's pets
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      try {
        const personasRes = await fetch(`${API_URL}/api/pets/personas`);
        if (personasRes.ok) {
          const data = await personasRes.json();
          setPersonas(data.personas || {});
        }

        const authHeaders = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const petsRes = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: authHeaders
        });
        if (petsRes.ok) {
          const data = await petsRes.json();
          setPets(data.pets || []);
        }

        const celebRes = await fetch(`${API_URL}/api/celebrations/my-upcoming?days=30`, {
          headers: authHeaders
        });
        if (celebRes.ok) {
          const data = await celebRes.json();
          setUpcomingCelebrations(data.celebrations || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Fetch health data for a specific pet
  const fetchHealthData = async (petId) => {
    if (healthData[petId] || loadingHealth[petId]) return;
    
    setLoadingHealth(prev => ({ ...prev, [petId]: true }));
    try {
      const [vaccinesRes, medsRes] = await Promise.all([
        fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`),
        fetch(`${API_URL}/api/pet-vault/${petId}/medications`)
      ]);
      
      const vaccines = vaccinesRes.ok ? await vaccinesRes.json() : { vaccines: [] };
      const meds = medsRes.ok ? await medsRes.json() : { medications: [] };
      
      // Find upcoming vaccines (due in next 30 days or overdue)
      const now = new Date();
      const upcomingVaccines = (vaccines.vaccines || []).filter(v => {
        if (!v.next_due_date) return false;
        const dueDate = new Date(v.next_due_date);
        const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30;
      });
      
      // Active medications
      const activeMeds = (meds.medications || []).filter(m => {
        if (!m.end_date) return true;
        return new Date(m.end_date) > now;
      });
      
      setHealthData(prev => ({
        ...prev,
        [petId]: {
          vaccines: vaccines.vaccines || [],
          medications: meds.medications || [],
          upcomingVaccines,
          activeMeds
        }
      }));
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoadingHealth(prev => ({ ...prev, [petId]: false }));
    }
  };

  // Toggle health section
  const toggleHealth = (petId) => {
    const newState = !expandedHealth[petId];
    setExpandedHealth(prev => ({ ...prev, [petId]: newState }));
    if (newState) {
      fetchHealthData(petId);
    }
  };

  // Toggle soul section
  const toggleSoul = (petId) => {
    setExpandedSoul(prev => ({ ...prev, [petId]: !prev[petId] }));
  };

  // Start editing a pet
  const startEditing = (pet) => {
    setEditingPet(pet.id);
    setEditForm({
      name: pet.name || '',
      breed: pet.breed || '',
      species: pet.species || 'dog',
      gender: pet.gender || 'male',
      birth_date: pet.birth_date || '',
      gotcha_date: pet.gotcha_date || ''
    });
  };

  // Save pet edits
  const saveEdits = async (petId) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        setPets(pets.map(p => p.id === petId ? { ...p, ...editForm } : p));
        toast({ title: 'Saved!', description: 'Pet profile updated successfully' });
        setEditingPet(null);
      } else {
        toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to save pet:', error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete pet
  const deletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to remove this pet?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/pets/${petId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPets(pets.filter(p => p.id !== petId));
        toast({ title: 'Removed', description: 'Pet removed from your profile' });
      }
    } catch (error) {
      console.error('Failed to delete pet:', error);
    }
  };

  const getPersonaInfo = (pet) => {
    const personaKey = pet.soul?.persona;
    if (!personaKey) return { name: 'Unknown', emoji: '🐾' };
    const persona = personas[personaKey] || {};
    return {
      name: persona.name || personaKey.replace(/_/g, ' '),
      emoji: persona.emoji || '🐾'
    };
  };

  const filteredPets = pets.filter(pet => 
    pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            My Furry Family 🐾
          </h1>
          <p className="text-xl text-gray-600">
            {pets.length === 0 
              ? "Let's add your first fur baby!" 
              : `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} in your family`
            }
          </p>
        </div>

        {/* Upcoming Celebrations Alert */}
        {upcomingCelebrations.length > 0 && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-lg text-amber-800">Upcoming Celebrations!</h3>
            </div>
            <div className="space-y-2">
              {upcomingCelebrations.slice(0, 3).map((celeb, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{celeb.emoji}</span>
                    <div>
                      <p className="font-medium text-amber-900">
                        {celeb.pet_name}'s {celeb.occasion_name}
                      </p>
                      <p className="text-sm text-amber-700">
                        {celeb.days_until === 0 ? '🎉 TODAY!' : 
                         celeb.days_until === 1 ? 'Tomorrow!' : 
                         `In ${celeb.days_until} days`}
                      </p>
                    </div>
                  </div>
                  <Link to={`/${celeb.recommended_collection}`}>
                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-700">
                      <Gift className="w-4 h-4 mr-1" />
                      Shop Gifts
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search your pets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link to="/pet-profile">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add New Pet
            </Button>
          </Link>
        </div>

        {/* Pets Grid */}
        {filteredPets.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PawPrint className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No pets yet!</h3>
            <p className="text-gray-500 mb-6">
              Create a profile for your furry friend and unlock personalized celebrations
            </p>
            <Link to="/pet-profile">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPets.map((pet) => {
              const personaInfo = getPersonaInfo(pet);
              const PersonaIcon = PERSONA_ICONS[pet.soul?.persona] || PawPrint;
              const isEditing = editingPet === pet.id;
              const health = healthData[pet.id];
              const soulExpanded = expandedSoul[pet.id];
              const healthExpanded = expandedHealth[pet.id];
              
              return (
                <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-all">
                  {/* Pet Header with Photo and Basic Info */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Pet Photo */}
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 rounded-2xl bg-white shadow-sm overflow-hidden border-4 border-white">
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-purple-100">
                              <PawPrint className="w-12 h-12 text-purple-300" />
                            </div>
                          )}
                        </div>
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white shadow-sm text-purple-700 border-purple-200">
                          {personaInfo.emoji} {personaInfo.name}
                        </Badge>
                      </div>
                      
                      {/* Pet Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            {isEditing ? (
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-2xl font-bold h-10 w-48"
                              />
                            ) : (
                              <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
                            )}
                            
                            {isEditing ? (
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={editForm.breed}
                                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                                  placeholder="Breed"
                                  className="h-8 w-32"
                                />
                                <select
                                  value={editForm.species}
                                  onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                                  className="h-8 px-2 rounded border border-gray-200"
                                >
                                  <option value="dog">Dog</option>
                                  <option value="cat">Cat</option>
                                </select>
                                <select
                                  value={editForm.gender}
                                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                  className="h-8 px-2 rounded border border-gray-200"
                                >
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                </select>
                              </div>
                            ) : (
                              <p className="text-gray-600">
                                {pet.breed || 'Adorable Furball'} • {pet.species === 'cat' ? '🐱 Cat' : '🐕 Dog'} • {pet.gender === 'male' ? '♂️' : '♀️'}
                              </p>
                            )}
                          </div>
                          
                          {/* Edit/Delete Actions */}
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setEditingPet(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button size="sm" onClick={() => saveEdits(pet.id)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => startEditing(pet)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deletePet(pet.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Dates Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">🎂 Birthday</p>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editForm.birth_date}
                                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                className="h-7 text-sm"
                              />
                            ) : (
                              <p className="font-medium text-sm">{pet.birth_date || 'Not set'}</p>
                            )}
                          </div>
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">💝 Gotcha Day</p>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editForm.gotcha_date}
                                onChange={(e) => setEditForm({ ...editForm, gotcha_date: e.target.value })}
                                className="h-7 text-sm"
                              />
                            ) : (
                              <p className="font-medium text-sm">{pet.gotcha_date || 'Not set'}</p>
                            )}
                          </div>
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">🎉 Celebrations</p>
                            <p className="font-medium text-sm">{pet.celebrations?.length || 0} set</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">✨ Soul Score</p>
                            <p className="font-medium text-sm text-purple-600">{Math.round(pet.overall_score || 0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable Sections */}
                  <div className="divide-y divide-gray-100">
                    {/* Health Vault Section */}
                    <div>
                      <button
                        onClick={() => toggleHealth(pet.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Health Vault</h3>
                            <p className="text-sm text-gray-500">Vaccines, medications & vet records</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {health?.upcomingVaccines?.length > 0 && (
                            <Badge className="bg-orange-100 text-orange-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {health.upcomingVaccines.length} due soon
                            </Badge>
                          )}
                          {health?.activeMeds?.length > 0 && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Pill className="w-3 h-3 mr-1" />
                              {health.activeMeds.length} active
                            </Badge>
                          )}
                          {healthExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>
                      
                      {healthExpanded && (
                        <div className="px-6 pb-6 space-y-4">
                          {loadingHealth[pet.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                          ) : health ? (
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Vaccines */}
                              <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Syringe className="w-5 h-5 text-green-600" />
                                  <h4 className="font-semibold text-green-800">Vaccinations ({health.vaccines?.length || 0})</h4>
                                </div>
                                {health.vaccines?.length > 0 ? (
                                  <div className="space-y-2">
                                    {health.vaccines.slice(0, 3).map((v, idx) => {
                                      const dueDate = v.next_due_date ? new Date(v.next_due_date) : null;
                                      const isOverdue = dueDate && dueDate < new Date();
                                      const isDueSoon = dueDate && !isOverdue && (dueDate - new Date()) / (1000*60*60*24) <= 30;
                                      
                                      return (
                                        <div key={idx} className="bg-white rounded-lg p-2 text-sm flex items-center justify-between">
                                          <span className="font-medium">{v.vaccine_name}</span>
                                          {dueDate && (
                                            <Badge className={isOverdue ? 'bg-red-100 text-red-700' : isDueSoon ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}>
                                              {isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : dueDate.toLocaleDateString()}
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {health.vaccines.length > 3 && (
                                      <p className="text-xs text-green-600 mt-2">+{health.vaccines.length - 3} more</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-green-600">No vaccines recorded</p>
                                )}
                              </div>
                              
                              {/* Medications */}
                              <div className="bg-purple-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Pill className="w-5 h-5 text-purple-600" />
                                  <h4 className="font-semibold text-purple-800">Active Medications ({health.activeMeds?.length || 0})</h4>
                                </div>
                                {health.activeMeds?.length > 0 ? (
                                  <div className="space-y-2">
                                    {health.activeMeds.slice(0, 3).map((m, idx) => (
                                      <div key={idx} className="bg-white rounded-lg p-2 text-sm">
                                        <p className="font-medium">{m.medication_name}</p>
                                        <p className="text-xs text-gray-500">{m.dosage} • {m.frequency}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-purple-600">No active medications</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                          
                          <Link to={`/pet-vault/${pet.id}`}>
                            <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                              <Stethoscope className="w-4 h-4 mr-2" />
                              Open Full Health Vault
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* Pet Soul Section */}
                    <div>
                      <button
                        onClick={() => toggleSoul(pet.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Pet Soul™ Answers</h3>
                            <p className="text-sm text-gray-500">{pet.soul?.personality_tag ? `"${pet.soul.personality_tag}"` : 'Discover their unique personality'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pet.overall_score || 0}%` }} />
                            </div>
                            <span className="text-sm text-purple-600 font-medium">{Math.round(pet.overall_score || 0)}%</span>
                          </div>
                          {soulExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>
                      
                      {soulExpanded && (
                        <div className="px-6 pb-6">
                          {(() => {
                            // Check if there are any non-empty soul answers (excluding persona)
                            const soulEntries = Object.entries(pet.soul || {}).filter(
                              ([key, value]) => key !== 'persona' && value && value.trim && value.trim() !== ''
                            );
                            const hasAnswers = soulEntries.length > 0;
                            
                            return hasAnswers ? (
                              <div className="grid md:grid-cols-2 gap-3 mb-4">
                                {/* Show persona first if exists */}
                                {pet.soul?.persona && (
                                  <div className="col-span-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-2">
                                    <p className="text-xs text-purple-600 font-semibold mb-1">🎭 Personality Type</p>
                                    <p className="text-lg font-bold text-purple-800 capitalize">{pet.soul.persona.replace(/_/g, ' ')}</p>
                                  </div>
                                )}
                                {/* Show other soul answers */}
                                {Object.entries(SOUL_QUESTION_LABELS).map(([key, label]) => {
                                  const value = pet.soul?.[key];
                                  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
                                  
                                  return (
                                    <div key={key} className="bg-purple-50 rounded-lg p-3">
                                      <p className="text-xs text-purple-600 font-semibold mb-1">{label}</p>
                                      <p className="text-sm text-gray-800">{value}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-purple-50 rounded-xl mb-4">
                                {pet.soul?.persona && (
                                  <div className="mb-3">
                                    <Badge className="bg-purple-200 text-purple-800 text-sm px-3 py-1">
                                      🎭 {pet.soul.persona.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                )}
                                <MessageCircle className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                                <p className="text-purple-700 font-medium">Soul journey started!</p>
                                <p className="text-sm text-purple-500">Answer more questions to discover {pet.name}'s full personality</p>
                              </div>
                            );
                          })()}
                          
                          <Link to={`/pet-soul-journey/${pet.id}`}>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                              <Sparkles className="w-4 h-4 mr-2" />
                              {(pet.overall_score || 0) < 100 ? 'Continue Building Soul' : 'View Full Soul Journey'}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add New Pet Card */}
            <Link to="/pet-profile">
              <Card className="p-8 border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all flex items-center justify-center group cursor-pointer hover:bg-purple-50/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-purple-700 mb-2">Add Another Pet</h3>
                  <p className="text-sm text-gray-500">
                    Create a profile for your next furry friend
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Fun Fact */}
        {pets.length > 0 && (
          <div className="mt-12 text-center">
            <Card className="inline-block p-6 bg-gradient-to-r from-purple-100 to-pink-100">
              <p className="text-purple-800">
                <Heart className="w-5 h-5 inline mr-2 text-pink-500" />
                <strong>{pets.length} furry {pets.length === 1 ? 'soul' : 'souls'}</strong> counting on you for celebrations! 
                🎂 Don't forget their special days!
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPets;
