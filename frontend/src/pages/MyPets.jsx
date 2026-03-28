import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  PawPrint, Plus, Calendar, Gift, Edit, Trash2, Save, X,
  Search, Crown, Moon, Mountain, Sofa, Users, Camera,
  Utensils, Zap, Smile, ChevronRight, ChevronDown, ChevronUp,
  Heart, Sparkles, Stethoscope, Syringe, Pill, AlertCircle,
  RefreshCw, Loader2, Check, MessageCircle, Upload, 
  LayoutGrid, List, Brain, Home, CreditCard, HelpCircle
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import FamilyDashboard from '../components/FamilyDashboard';
import MemoryTimeline from '../components/MemoryTimeline';
import PetPassCard from '../components/PetPassCard';
import { resolvePetAvatar, getPetPhotoUrl } from '../utils/petAvatar';
import BreedSelector from '../components/BreedSelector';
import GlobalNav from '../components/Mira/GlobalNav';

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
  favorite_nap_spot: "Favourite Nap Spot",
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
  
  // "What Mira Knows" data
  const [miraKnowledge, setMiraKnowledge] = useState({});
  const [loadingKnowledge, setLoadingKnowledge] = useState({});
  const [expandedKnowledge, setExpandedKnowledge] = useState({});
  const [petFavorites, setPetFavorites] = useState({});
  
  // Health data for each pet
  const [healthData, setHealthData] = useState({});
  const [loadingHealth, setLoadingHealth] = useState({});
  
  // Edit mode state
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const fileInputRef = React.useRef({});
  
  // View mode state - 'family' (dashboard) or 'detailed' (list)
  const [viewMode, setViewMode] = useState('family');
  const [selectedPetId, setSelectedPetId] = useState(null);
  
  // Handle URL query param for pet selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const petParam = params.get('pet');
    if (petParam && pets.length > 0) {
      setSelectedPetId(petParam);
      setViewMode('detailed');
      // Auto-expand the "What Mira Knows" for this pet
      setExpandedKnowledge(prev => ({ ...prev, [petParam]: true }));
      // Fetch Mira's knowledge for this pet
      fetchMiraKnowledge(petParam);
    }
  }, [pets]);
  
  // Fetch "What Mira Knows" about a pet
  const fetchMiraKnowledge = async (petId) => {
    if (loadingKnowledge[petId] || miraKnowledge[petId]) return;
    
    setLoadingKnowledge(prev => ({ ...prev, [petId]: true }));
    try {
      // Fetch both knowledge and favorites in parallel
      const [knowledgeRes, favoritesRes] = await Promise.all([
        fetch(`${API_URL}/api/mira/memory/pet/${petId}/what-mira-knows`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/favorites/${petId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (knowledgeRes.ok) {
        const data = await knowledgeRes.json();
        setMiraKnowledge(prev => ({ ...prev, [petId]: data }));
      }
      
      if (favoritesRes.ok) {
        const favData = await favoritesRes.json();
        console.log(`[MyPets] Favorites for ${petId}:`, favData.favorites?.length, 'items');
        setPetFavorites(prev => ({ ...prev, [petId]: favData.favorites || [] }));
      } else {
        console.log(`[MyPets] Favorites API error for ${petId}:`, favoritesRes.status);
      }
    } catch (error) {
      console.error('Error fetching Mira knowledge:', error);
    } finally {
      setLoadingKnowledge(prev => ({ ...prev, [petId]: false }));
    }
  };
  
  // Toggle "What Mira Knows" section
  const toggleKnowledge = (petId) => {
    const isExpanding = !expandedKnowledge[petId];
    setExpandedKnowledge(prev => ({ ...prev, [petId]: isExpanding }));
    if (isExpanding) {
      fetchMiraKnowledge(petId);
    }
  };
  
  // Inline Pet Soul questions state
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(null);
  
  // Quick questions for inline answering (most impactful questions)
  const QUICK_QUESTIONS = [
    { id: 'food_allergies', label: 'Does {name} have any food allergies?', icon: '🍖', options: ['No allergies', 'Chicken', 'Grain', 'Beef', 'Other'] },
    { id: 'temperament', label: "What's {name}'s personality like?", icon: '🎭', options: ['Calm', 'Playful', 'Shy', 'Energetic', 'Protective'] },
    { id: 'energy_level', label: "What's {name}'s energy level?", icon: '⚡', options: ['Low', 'Medium', 'High', 'Very High'] },
    { id: 'car_comfort', label: 'How does {name} feel about car rides?', icon: '🚗', options: ['Loves car rides', 'Gets anxious', 'Motion sickness', 'Neutral'] },
    { id: 'favorite_protein', label: "What's {name}'s favorite protein?", icon: '🥩', options: ['Chicken', 'Beef', 'Fish', 'Lamb', 'Pork'] },
    { id: 'alone_time_comfort', label: 'How does {name} handle being alone?', icon: '🏠', options: ['Fine alone', 'Gets anxious', 'Needs company', 'Depends'] },
    { id: 'training_level', label: "What's {name}'s training level?", icon: '🎓', options: ['Beginner', 'Basic commands', 'Well trained', 'Advanced'] },
    { id: 'vet_comfort', label: 'How does {name} feel at the vet?', icon: '🏥', options: ['Comfortable', 'Anxious', 'Very anxious'] }
  ];
  
  // Toggle inline questions for a pet
  const toggleQuestions = (petId) => {
    setExpandedQuestions(prev => ({ ...prev, [petId]: !prev[petId] }));
  };
  
  // Save an answer inline
  const saveQuickAnswer = async (petId, questionId, answer) => {
    setSavingAnswer(`${petId}-${questionId}`);
    try {
      const response = await fetch(`${API_URL}/api/pets/${petId}/soul-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question_id: questionId, answer })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local pet data
        setPets(prev => prev.map(p => {
          if (p.id === petId) {
            return {
              ...p,
              overall_score: data.new_score || p.overall_score,
              doggy_soul_answers: {
                ...p.doggy_soul_answers,
                [questionId]: answer
              }
            };
          }
          return p;
        }));
        toast({
          title: "Answer saved!",
          description: `${data.pet_name || 'Pet'}'s Soul Score updated to ${Math.round(data.new_score || 0)}%`,
        });
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Error",
        description: "Failed to save answer",
        variant: "destructive"
      });
    } finally {
      setSavingAnswer(null);
    }
  };

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

  // ── Client-side image compression (max 1200px, max 800KB) ────────────────
  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
          else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Upload pet photo — compresses client-side then uploads to Cloudinary via backend
  const handlePhotoUpload = async (petId, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    
    // Hard limit 15MB before compression — basically any phone photo is fine
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please choose an image under 15MB', variant: 'destructive' });
      return;
    }
    
    setUploadingPhoto(petId);
    
    try {
      // Auto-compress large images down to ≤ 800KB before uploading
      const toUpload = file.size > 800 * 1024 ? await compressImage(file) : file;
      
      const formData = new FormData();
      formData.append('photo', toUpload);
      
      const response = await fetch(`${API_URL}/api/pets/${petId}/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setPets(pets.map(p => p.id === petId ? { ...p, photo_url: data.photo_url } : p));
        toast({ title: 'Photo Updated!', description: `${pets.find(p => p.id === petId)?.name}'s photo has been updated` });
      } else {
        const error = await response.json().catch(() => ({}));
        toast({ title: 'Upload Failed', description: error.detail || 'Please try again with a smaller image', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload photo. Please try again.', variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-gray-50" data-testid="my-pets-page">
      {/* Global Navigation: Dashboard | Inbox */}
      <GlobalNav activePetName={pets[0]?.name} />
      
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                My Pets
              </h1>
              <p className="text-gray-500 mt-1">
                {pets.length === 0 
                  ? "Add your first fur baby to get started" 
                  : `Managing ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} in your family`
                }
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {pets.length > 0 && (
                <>
                  {/* Search */}
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search pets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48 h-10 bg-gray-50 border-transparent focus:bg-white focus:border-teal-500 rounded-xl"
                    />
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('family')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'family' 
                          ? 'bg-white text-teal-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'detailed' 
                          ? 'bg-white text-teal-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
              
              {/* Add Pet Button */}
              <Link to="/pet-profile">
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all hover:-translate-y-0.5"
                  data-testid="add-pet-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        {pets.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center mx-auto">
                <PawPrint className="w-16 h-16 text-teal-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome to Your Pet Family
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Add your first furry family member to start tracking their health, 
              celebrations, and create beautiful memories together.
            </p>
            <Link to="/pet-profile">
              <Button 
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8 shadow-lg hover:shadow-teal-500/25"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Pet
              </Button>
            </Link>
            
            {/* Feature highlights */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: Heart, title: 'Health Tracking', desc: 'Monitor vaccinations & vet visits' },
                { icon: Calendar, title: 'Celebrations', desc: 'Never miss a birthday or gotcha day' },
                { icon: Sparkles, title: 'Pet Soul Score', desc: 'Personalized care recommendations' }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <feature.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family Dashboard View */}
        {viewMode === 'family' && pets.length > 0 && (
          <FamilyDashboard
            memberId={user?.email}
            memberName={user?.name}
            token={token}
            pets={pets}
            onSelectPet={(petId) => {
              setSelectedPetId(petId);
              setViewMode('detailed');
              // Scroll to the pet card
              setTimeout(() => {
                document.getElementById(`pet-card-${petId}`)?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            showTimeline={true}
            showBulkActions={true}
          />
        )}

        {/* Detailed View */}
        {viewMode === 'detailed' && (
          <>
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
                            {celeb.pet_name}&apos;s {celeb.occasion_name}
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

            {/* Search */}
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search your pets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Pets List */}
            {filteredPets.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PawPrint className="w-12 h-12 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No pets found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'Try a different search term' : 'Add your first pet to get started'}
                </p>
                {!searchQuery && (
                  <Link to="/pet-profile">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Pet
                    </Button>
                  </Link>
                )}
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
                  const questionsExpanded = expandedQuestions[pet.id];
                  const petPhoto = getPetPhotoUrl(pet);
                  
                  return (
                <Card 
                  key={pet.id} 
                  id={`pet-card-${pet.id}`} 
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-teal-200 bg-white rounded-2xl"
                  onClick={(e) => {
                    // Don't navigate if clicking on buttons, inputs, or edit mode
                    if (e.target.closest('button') || e.target.closest('input') || isEditing) return;
                    navigate(`/pet/${pet.id}?tab=personality`);
                  }}
                >
                  {/* Pet Header with Photo and Basic Info */}
                  <div className={`p-6 ${pet.rainbow_bridge ? 'bg-gradient-to-r from-violet-50/70 via-purple-50/50 to-pink-50/50' : 'bg-gradient-to-r from-teal-50/50 to-white'}`}>
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Pet Photo - Uses utility for consistent photos */}
                      <div className="relative flex-shrink-0 group">
                        {/* Rainbow Bridge Halo Effect */}
                        {pet.rainbow_bridge && (
                          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500 opacity-60 blur-sm animate-pulse" />
                        )}
                        <div className={`w-32 h-32 rounded-2xl bg-white shadow-sm overflow-hidden relative ${pet.rainbow_bridge ? 'border-4 border-violet-300 ring-2 ring-purple-200' : 'border-4 border-white'}`}>
                          <img 
                            src={petPhoto} 
                            alt={pet.name} 
                            className={`w-full h-full object-cover ${pet.rainbow_bridge ? 'grayscale-[30%]' : ''}`}
                            onError={(e) => {
                              console.log('Pet photo failed to load:', petPhoto, 'for pet:', pet.name);
                              // Fall back to breed stock photo
                              const { photoUrl } = resolvePetAvatar({ ...pet, photo_url: null });
                              e.target.src = photoUrl;
                            }}
                          />
                          {/* Photo upload overlay */}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => fileInputRef.current[pet.id] = el}
                            onChange={(e) => handlePhotoUpload(pet.id, e.target.files[0])}
                          />
                          <button
                            onClick={() => fileInputRef.current[pet.id]?.click()}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            disabled={uploadingPhoto === pet.id}
                          >
                            {uploadingPhoto === pet.id ? (
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                              <div className="text-center text-white">
                                <Camera className="w-6 h-6 mx-auto mb-1" />
                                <span className="text-xs">Change Photo</span>
                              </div>
                            )}
                          </button>
                        </div>
                        {pet.rainbow_bridge ? (
                          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg border-0">
                            🌈 In Loving Memory
                          </Badge>
                        ) : (
                          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white shadow-sm text-teal-700 border-teal-200">
                            {personaInfo.emoji} {personaInfo.name}
                          </Badge>
                        )}
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
                              <div className="flex items-center gap-2">
                                <h2 className={`text-2xl font-bold ${pet.rainbow_bridge ? 'text-purple-800' : 'text-gray-900'}`}>{pet.name}</h2>
                                {pet.rainbow_bridge && (
                                  <span className="text-xl" title="Forever in our hearts">🌈</span>
                                )}
                              </div>
                            )}
                            
                            {isEditing ? (
                              <div className="flex gap-2 mt-2">
                                <div className="w-48">
                                  <BreedSelector
                                    value={editForm.breed}
                                    onChange={(breed) => setEditForm({ ...editForm, breed })}
                                    placeholder="Select breed"
                                  />
                                </div>
                                <select
                                  value={editForm.species}
                                  onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                                  className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500"
                                >
                                  <option value="dog">Dog</option>
                                  <option value="cat">Cat</option>
                                </select>
                                <select
                                  value={editForm.gender}
                                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                  className="h-12 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500"
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
                                <Button 
                                  size="sm" 
                                  className="bg-gradient-to-r from-teal-600 to-pink-600 hover:from-teal-700 hover:to-pink-700 text-white"
                                  onClick={() => navigate(`/pet/${pet.id}?tab=personality`)}
                                >
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  View Full Profile
                                </Button>
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
                          {pet.rainbow_bridge ? (
                            <div className="bg-violet-50/70 rounded-lg p-3 border border-violet-200">
                              <p className="text-xs text-violet-600 mb-1">🌈 Crossed Rainbow Bridge</p>
                              <p className="font-medium text-sm text-violet-700">{pet.crossing_date || pet.rainbow_bridge_date || 'Forever loved'}</p>
                            </div>
                          ) : (
                            <div className="bg-white/70 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">🎉 Celebrations</p>
                              <p className="font-medium text-sm">{pet.celebrations?.length || 0} set</p>
                            </div>
                          )}
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">✨ Soul Score</p>
                            <p className="font-medium text-sm text-teal-600">{Math.min(100, Math.round(pet.overall_score || 0))}%</p>
                          </div>
                        </div>
                        
                        {/* Rainbow Bridge Memorial Message */}
                        {pet.rainbow_bridge && (
                          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-4 h-4 text-violet-600 fill-violet-200" />
                              <span className="text-sm font-medium text-violet-800">Forever In Our Hearts</span>
                            </div>
                            <p className="text-sm text-violet-700 italic">
                              {pet.tribute_message || `${pet.name}'s love and memories live on eternally. They will never be forgotten.`}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-3 border-violet-300 text-violet-700 hover:bg-violet-100"
                              onClick={() => navigate('/farewell')}
                            >
                              View Memorial 🌈
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* PET SOUL COMPLETION PANEL - Large, Central, Always Visible */}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <Card className={`p-5 ${(pet.overall_score || 0) < 100 ? 'bg-gradient-to-r from-teal-50 to-pink-50 border-teal-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Brain className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {(pet.overall_score || 0) < 100 ? '🌱 Pet Soul Growing' : '✨ Pet Soul Complete'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {(pet.overall_score || 0) < 100 
                                ? `Help us understand ${pet.name} better` 
                                : `We know ${pet.name} deeply!`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-teal-600">{Math.min(100, Math.round(pet.overall_score || 0))}%</div>
                          <p className="text-xs text-gray-500">completion</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-white/60 rounded-full h-3 mb-4">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-pink-500 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round(pet.overall_score || 0))}%` }}
                        />
                      </div>
                      
                      {/* Soul Categories */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { key: 'basics', label: 'Basics', icon: '📋', filled: !!(pet.name && pet.breed) },
                          { key: 'personality', label: 'Personality', icon: '🎭', filled: !!pet.soul?.persona },
                          { key: 'lifestyle', label: 'Lifestyle', icon: '🏠', filled: !!pet.soul?.activity_level },
                          { key: 'health', label: 'Health', icon: '💊', filled: !!(pet.weight || pet.allergies?.length) }
                        ].map((cat) => (
                          <div key={cat.key} className={`text-center p-2 rounded-lg ${cat.filled ? 'bg-green-100' : 'bg-white/50'}`}>
                            <div className="text-xl mb-1">{cat.icon}</div>
                            <p className="text-xs font-medium text-gray-700">{cat.label}</p>
                            {cat.filled ? (
                              <Check className="w-3 h-3 text-green-600 mx-auto mt-1" />
                            ) : (
                              <p className="text-[10px] text-amber-600 mt-1">Pending</p>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* CTA */}
                      {(pet.overall_score || 0) < 100 && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => toggleQuestions(pet.id)}
                            variant="outline"
                            className="flex-1 border-teal-300 text-teal-600 hover:bg-teal-50"
                          >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Quick Questions
                          </Button>
                          <Link to={`/pet/${pet.id}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-teal-600 to-pink-600 hover:from-teal-700 hover:to-pink-700">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Full Journey →
                            </Button>
                          </Link>
                        </div>
                      )}
                    </Card>
                    
                    {/* INLINE QUICK QUESTIONS - Answer right here! */}
                    {questionsExpanded && (pet.overall_score || 0) < 100 && (
                      <Card className="mt-4 p-4 bg-white border-teal-200">
                        <div className="flex items-center gap-2 mb-4">
                          <HelpCircle className="w-5 h-5 text-teal-600" />
                          <h4 className="font-bold text-gray-900">Help us know {pet.name} better</h4>
                          <Badge variant="outline" className="ml-auto">
                            {Object.keys(pet.doggy_soul_answers || {}).length} answered
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {QUICK_QUESTIONS.filter(q => !(pet.doggy_soul_answers || {})[q.id]).slice(0, 3).map((question) => (
                            <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-xl">{question.icon}</span>
                                {question.label.replace('{name}', pet.name)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {question.options.map((option) => (
                                  <Button
                                    key={option}
                                    size="sm"
                                    variant="outline"
                                    disabled={savingAnswer === `${pet.id}-${question.id}`}
                                    onClick={() => saveQuickAnswer(pet.id, question.id, option)}
                                    className="hover:bg-teal-100 hover:border-teal-400 hover:text-teal-700"
                                  >
                                    {savingAnswer === `${pet.id}-${question.id}` ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : null}
                                    {option}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                          <Link to={`/pet/${pet.id}`}>
                            <Button variant="link" className="text-teal-600">
                              Answer all {26 - Object.keys(pet.doggy_soul_answers || {}).length} remaining questions →
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    )}
                    
                    {/* WHAT MIRA KNOWS - Memories and Soul Knowledge */}
                    <Card 
                      className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => toggleKnowledge(pet.id)}
                      data-testid={`mira-knows-${pet.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">What Mira Knows About {pet.name}</h4>
                            <p className="text-sm text-gray-600">
                              {miraKnowledge[pet.id]?.knowledge_count || Object.keys(pet.doggy_soul_answers || {}).length} insights collected
                            </p>
                          </div>
                        </div>
                        {expandedKnowledge[pet.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                      
                      {expandedKnowledge[pet.id] && (
                        <div className="mt-4 pt-4 border-t border-purple-200" onClick={(e) => e.stopPropagation()}>
                          {loadingKnowledge[pet.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                              <span className="ml-2 text-gray-600">Loading Mira's knowledge...</span>
                            </div>
                          ) : miraKnowledge[pet.id] ? (
                            <div className="space-y-4">
                              {/* Soul Knowledge */}
                              {miraKnowledge[pet.id].soul_knowledge?.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-600" />
                                    Soul Profile
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {miraKnowledge[pet.id].soul_knowledge.map((item, idx) => (
                                      <div key={idx} className="p-3 bg-white/60 rounded-lg flex items-start gap-2">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-sm text-gray-700">{item.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Memories */}
                              {miraKnowledge[pet.id].memory_knowledge?.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-amber-600" />
                                    Memories from Conversations
                                  </h5>
                                  <div className="space-y-2">
                                    {miraKnowledge[pet.id].memory_knowledge.slice(0, 5).map((item, idx) => (
                                      <div key={idx} className="p-3 bg-white/60 rounded-lg flex items-start gap-2">
                                        <span>{item.icon}</span>
                                        <div>
                                          <span className="text-sm text-gray-700">{item.text}</span>
                                          <p className="text-xs text-gray-500 mt-1">{item.label} • {new Date(item.created_at).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Insights */}
                              {miraKnowledge[pet.id].insights_knowledge?.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-pink-600" />
                                    AI Insights
                                  </h5>
                                  <div className="space-y-2">
                                    {miraKnowledge[pet.id].insights_knowledge.map((item, idx) => (
                                      <div key={idx} className="p-3 bg-white/60 rounded-lg flex items-start gap-2">
                                        <span>{item.icon}</span>
                                        <span className="text-sm text-gray-700">{item.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Saved Favorites */}
                              {petFavorites[pet.id]?.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                                    Saved Favourites ({petFavorites[pet.id].length})
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {petFavorites[pet.id].slice(0, 4).map((fav, idx) => (
                                      <div 
                                        key={idx} 
                                        className="p-3 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg flex items-start gap-2 border border-pink-200"
                                        data-testid={`favorite-item-${idx}`}
                                      >
                                        <span className="text-lg">{fav.icon || '❤️'}</span>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-sm text-gray-700 font-medium block truncate">{fav.title}</span>
                                          <span className="text-xs text-pink-500 capitalize">{fav.pillar}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {petFavorites[pet.id].length > 4 && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                      + {petFavorites[pet.id].length - 4} more favourites
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* No knowledge yet */}
                              {(!miraKnowledge[pet.id].soul_knowledge?.length && 
                                !miraKnowledge[pet.id].memory_knowledge?.length) && (
                                <div className="text-center py-4">
                                  <p className="text-gray-600">Mira is still learning about {pet.name}.</p>
                                  <Link to="/mira-os">
                                    <Button variant="outline" className="mt-2">
                                      Chat with Mira to build knowledge →
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-600">Start chatting with Mira to build {pet.name}'s knowledge profile!</p>
                              <Link to="/mira-os">
                                <Button variant="outline" className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Chat with Mira
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                  
                  {/* ALL PILLARS SECTION - Show all 12 pillars */}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        🏛️ Life Pillars
                      </h3>
                      <Badge variant="outline">{pet.pet_pass_number || 'Pet Pass Pending'}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {[
                        { id: 'celebrate', name: 'Celebrate', icon: '\uD83C\uDF82', path: '/celebrate-soul', color: 'from-pink-400 to-rose-400' },
                        { id: 'dine', name: 'Dine', icon: '\uD83C\uDF7D\uFE0F', path: '/dine', color: 'from-amber-400 to-orange-400' },
                        { id: 'go', name: 'Go', icon: '\u2708\uFE0F', path: '/go', color: 'from-cyan-400 to-blue-400' },
                        { id: 'care', name: 'Care', icon: '\uD83E\uDE7A', path: '/care', color: 'from-emerald-400 to-teal-400' },
                        { id: 'play', name: 'Play', icon: '\uD83C\uDFBE', path: '/play', color: 'from-green-400 to-emerald-400' },
                        { id: 'learn', name: 'Learn', icon: '\uD83C\uDF93', path: '/learn', color: 'from-indigo-400 to-teal-400' },
                        { id: 'paperwork', name: 'Paperwork', icon: '\uD83D\uDCC4', path: '/paperwork', color: 'from-slate-400 to-gray-500' },
                        { id: 'emergency', name: 'Emergency', icon: '\uD83D\uDEA8', path: '/emergency', color: 'from-red-400 to-rose-400' },
                        { id: 'farewell', name: 'Farewell', icon: '\uD83C\uDF08', path: '/farewell', color: 'from-purple-400 to-indigo-400' },
                        { id: 'adopt', name: 'Adopt', icon: '\uD83D\uDC3E', path: '/adopt', color: 'from-rose-400 to-pink-400' },
                        { id: 'shop', name: 'Shop', icon: '\uD83D\uDED2', path: '/shop', color: 'from-teal-400 to-cyan-400' },
                        { id: 'services', name: 'Services', icon: '\uD83E\uDD1D', path: '/services', color: 'from-blue-400 to-indigo-400' }
                      ].map((pillar) => (
                        <Link 
                          key={pillar.id} 
                          to={`${pillar.path}?pet=${pet.id}`}
                          className="group"
                        >
                          <Card className="p-3 hover:shadow-md transition-all cursor-pointer border hover:border-teal-300">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
                              {pillar.icon}
                            </div>
                            <p className="text-xs font-medium text-gray-700 truncate">{pillar.name}</p>
                            <p className="text-[10px] text-gray-400">Not used</p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      All 12 pillars unlocked with Pet Pass • Click any pillar to request support
                    </p>
                  </div>
                  
                  {/* Pet Pass Card Section - Show if pet has a Pet Pass number */}
                  {pet.pet_pass_number && (
                    <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Pet Pass Identity
                        </h3>
                        <Badge className={pet.pet_pass_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {pet.pet_pass_status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>
                      <PetPassCard 
                        pet={{
                          ...pet,
                          photo: pet.photo_url
                        }} 
                        className="max-w-sm"
                      />
                    </div>
                  )}
                  
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
                            <Badge className="bg-teal-100 text-teal-700">
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
                          ) : (
                            <>
                              {/* Basic Health Info from Pet Registration */}
                              {(pet.health?.vet_name || pet.health?.medical_conditions || pet.health?.current_medications) && (
                                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4" />
                                    Health Profile
                                  </h4>
                                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                                    {pet.health?.vet_name && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Primary Vet</p>
                                        <p className="font-medium text-gray-900">{pet.health.vet_name}</p>
                                        {pet.health.vet_clinic && <p className="text-gray-600">{pet.health.vet_clinic}</p>}
                                        {pet.health.vet_phone && <p className="text-blue-600">{pet.health.vet_phone}</p>}
                                      </div>
                                    )}
                                    {pet.health?.medical_conditions && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Medical Conditions</p>
                                        <p className="text-gray-900">{pet.health.medical_conditions}</p>
                                      </div>
                                    )}
                                    {pet.health?.current_medications && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Current Medications</p>
                                        <p className="text-gray-900">{pet.health.current_medications}</p>
                                      </div>
                                    )}
                                    {pet.health?.dietary_restrictions && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Dietary Restrictions</p>
                                        <p className="text-gray-900">{pet.health.dietary_restrictions}</p>
                                      </div>
                                    )}
                                    {pet.health?.spayed_neutered && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Spayed/Neutered</p>
                                        <p className="text-gray-900 capitalize">{pet.health.spayed_neutered.replace('_', ' ')}</p>
                                      </div>
                                    )}
                                    {pet.health?.microchipped && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Microchipped</p>
                                        <p className="text-green-600 font-medium">Yes {pet.health.microchip_number ? `(${pet.health.microchip_number})` : ''}</p>
                                      </div>
                                    )}
                                    {pet.health?.insurance_provider && (
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Insurance</p>
                                        <p className="text-gray-900">{pet.health.insurance_provider}</p>
                                      </div>
                                    )}
                                    {pet.health?.emergency_contact_name && (
                                      <div className="bg-white rounded-lg p-3 md:col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Emergency Contact</p>
                                        <p className="text-gray-900">{pet.health.emergency_contact_name} {pet.health.emergency_contact_phone && `• ${pet.health.emergency_contact_phone}`}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Vaccines & Medications from Vault */}
                              {health ? (
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
                                  <div className="bg-teal-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Pill className="w-5 h-5 text-teal-600" />
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
                                      <p className="text-sm text-teal-600">No active medications</p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          )}
                          
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
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
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
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, pet.overall_score || 0)}%` }} />
                            </div>
                            <span className="text-sm text-teal-600 font-medium">{Math.min(100, Math.round(pet.overall_score || 0))}%</span>
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
                                    <p className="text-xs text-teal-600 font-semibold mb-1">🎭 Personality Type</p>
                                    <p className="text-lg font-bold text-purple-800 capitalize">{pet.soul.persona.replace(/_/g, ' ')}</p>
                                  </div>
                                )}
                                {/* Show other soul answers */}
                                {Object.entries(SOUL_QUESTION_LABELS).map(([key, label]) => {
                                  const value = pet.soul?.[key];
                                  if (!value || (typeof value === 'string' && value.trim() === '')) return null;
                                  
                                  return (
                                    <div key={key} className="bg-teal-50 rounded-lg p-3">
                                      <p className="text-xs text-teal-600 font-semibold mb-1">{label}</p>
                                      <p className="text-sm text-gray-800">{value}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-teal-50 rounded-xl mb-4">
                                {pet.soul?.persona && (
                                  <div className="mb-3">
                                    <Badge className="bg-purple-200 text-purple-800 text-sm px-3 py-1">
                                      🎭 {pet.soul.persona.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                )}
                                <MessageCircle className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                                <p className="text-teal-700 font-medium">Soul journey started!</p>
                                <p className="text-sm text-purple-500">Answer more questions to discover {pet.name}&apos;s full personality</p>
                              </div>
                            );
                          })()}
                          
                          <Link to={`/pet/${pet.id}`}>
                            <Button className="w-full bg-gradient-to-r from-teal-600 to-pink-600 text-white">
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
              <Card className="p-8 border-2 border-dashed border-teal-200 hover:border-teal-400 transition-all flex items-center justify-center group cursor-pointer hover:bg-teal-50/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-teal-700 mb-2">Add Another Pet</h3>
                  <p className="text-sm text-gray-500">
                    Create a profile for your next furry friend
                  </p>
                </div>
              </Card>
            </Link>
          </div>
            )}
          </>
        )}

        {/* Empty State - No Pets Yet */}
        {pets.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PawPrint className="w-12 h-12 text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No pets yet!</h3>
            <p className="text-gray-500 mb-6">
              Create a profile for your furry friend and unlock personalised celebrations
            </p>
            <Link to="/pet-profile">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pet
              </Button>
            </Link>
          </Card>
        )}

        {/* Fun Fact */}
        {pets.length > 0 && (
          <div className="mt-12 text-center">
            <Card className="inline-block p-6 bg-gradient-to-r from-purple-100 to-pink-100">
              <p className="text-purple-800">
                <Heart className="w-5 h-5 inline mr-2 text-pink-500" />
                <strong>{pets.length} furry {pets.length === 1 ? 'soul' : 'souls'}</strong> counting on you for celebrations! 
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPets;
