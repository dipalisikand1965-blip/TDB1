import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  PawPrint, ArrowLeft, Calendar, Gift, Edit, Trash2, Save, X,
  Crown, Camera, Heart, Sparkles, Stethoscope, Syringe, Pill, 
  AlertCircle, Loader2, Check, MessageCircle, Upload, Brain, 
  CreditCard, HelpCircle, ChevronDown, ChevronUp, Home, Settings
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import { resolvePetAvatar, getPetPhotoUrl } from '../utils/petAvatar';
import usePetScore from '../utils/petScore';
import PetScoreCard from '../components/PetScoreCard';
import PetPassCard from '../components/PetPassCard';
import PetSoulJourney from '../components/PetSoulJourney';
import PetSoulAnswers from '../components/PetSoulAnswers';

// Life Pillars configuration
const LIFE_PILLARS = [
  { id: 'feed', name: 'Feed', icon: '🍖', path: '/meals', color: 'from-orange-400 to-red-400' },
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-400 to-rose-400' },
  { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-400 to-orange-400' },
  { id: 'stay', name: 'Stay', icon: '🏨', path: '/stay', color: 'from-blue-400 to-indigo-400' },
  { id: 'travel', name: 'Travel', icon: '✈️', path: '/travel', color: 'from-cyan-400 to-blue-400' },
  { id: 'care', name: 'Care', icon: '🩺', path: '/care', color: 'from-emerald-400 to-teal-400' },
  { id: 'groom', name: 'Groom', icon: '✂️', path: '/pillar/groom', color: 'from-violet-400 to-purple-400' },
  { id: 'play', name: 'Play', icon: '🎾', path: '/pillar/play', color: 'from-green-400 to-emerald-400' },
  { id: 'train', name: 'Train', icon: '🎓', path: '/learn', color: 'from-indigo-400 to-purple-400' },
  { id: 'insure', name: 'Insure', icon: '🛡️', path: '/pillar/insure', color: 'from-slate-400 to-gray-500' },
  { id: 'adopt', name: 'Adopt', icon: '🐕', path: '/pillar/adopt', color: 'from-rose-400 to-pink-400' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/pillar/farewell', color: 'from-purple-400 to-indigo-400' },
  { id: 'shop', name: 'Shop', icon: '🛒', path: '/all', color: 'from-teal-400 to-cyan-400' },
  { id: 'community', name: 'Community', icon: '👥', path: '/pillar/community', color: 'from-yellow-400 to-amber-400' }
];

// Quick questions for inline answering
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

const UnifiedPetPage = () => {
  const { petId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  
  // Get tab from URL params, default to 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Health data
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  
  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef();
  
  // Inline questions
  const [showQuestions, setShowQuestions] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(null);

  // Fetch pet data
  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) {
        setError('No pet ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/api/pets/${petId}`, { headers });
        
        if (!response.ok) {
          throw new Error('Pet not found');
        }
        
        const data = await response.json();
        setPet(data.pet || data);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPet();
  }, [petId, token]);

  // Fetch health data when health tab is active
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!petId || !['health', 'vaccines'].includes(activeTab) || healthData) return;
      
      setLoadingHealth(true);
      try {
        const [vaccinesRes, medsRes] = await Promise.all([
          fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`),
          fetch(`${API_URL}/api/pet-vault/${petId}/medications`)
        ]);
        
        const vaccines = vaccinesRes.ok ? await vaccinesRes.json() : { vaccines: [] };
        const meds = medsRes.ok ? await medsRes.json() : { medications: [] };
        
        const now = new Date();
        const upcomingVaccines = (vaccines.vaccines || []).filter(v => {
          if (!v.next_due_date) return false;
          const dueDate = new Date(v.next_due_date);
          const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          return daysUntil <= 30;
        });
        
        const activeMeds = (meds.medications || []).filter(m => {
          if (!m.end_date) return true;
          return new Date(m.end_date) > now;
        });
        
        setHealthData({
          vaccines: vaccines.vaccines || [],
          medications: meds.medications || [],
          upcomingVaccines,
          activeMeds
        });
      } catch (err) {
        console.error('Error fetching health data:', err);
      } finally {
        setLoadingHealth(false);
      }
    };
    
    fetchHealthData();
  }, [petId, activeTab, healthData]);

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/pet/${petId}?tab=${newTab}`, { replace: true });
  };

  // Save pet edits
  const saveEdits = async () => {
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
        setPet({ ...pet, ...editForm });
        toast({ title: 'Saved!', description: 'Pet profile updated successfully' });
        setEditing(false);
      } else {
        toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Failed to save:', err);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(`${API_URL}/api/pets/${petId}/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setPet({ ...pet, photo_url: data.photo_url });
        toast({ title: 'Photo Updated!', description: `${pet.name}'s photo has been updated` });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.detail || 'Failed to upload photo', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save quick answer
  const saveQuickAnswer = async (questionId, answer) => {
    setSavingAnswer(questionId);
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
        setPet({
          ...pet,
          overall_score: data.new_score || pet.overall_score,
          doggy_soul_answers: {
            ...pet.doggy_soul_answers,
            [questionId]: answer
          }
        });
        toast({
          title: "Answer saved!",
          description: `${pet.name}'s Soul Score updated to ${Math.round(data.new_score || 0)}%`,
        });
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      toast({ title: "Error", description: "Failed to save answer", variant: "destructive" });
    } finally {
      setSavingAnswer(null);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pet profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load this pet\'s profile'}</p>
          <Button onClick={() => navigate('/my-pets')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Pets
          </Button>
        </Card>
      </div>
    );
  }

  const petPhoto = getPetPhotoUrl(pet);
  const score = Math.round(pet.overall_score || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50" data-testid="unified-pet-page">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-pets')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> My Pets
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <img src={petPhoto} alt={pet.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="font-semibold text-gray-900">{pet.name}</span>
            </div>
          </div>
          
          {token && (
            <Button variant="outline" size="sm" onClick={() => {
              setEditing(!editing);
              if (!editing) {
                setEditForm({
                  name: pet.name || '',
                  breed: pet.breed || '',
                  species: pet.species || 'dog',
                  gender: pet.gender || 'male',
                  birth_date: pet.birth_date || '',
                  gotcha_date: pet.gotcha_date || ''
                });
              }
            }}>
              {editing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* Pet Profile Header */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Pet Photo */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-white shadow-lg overflow-hidden border-4 border-white">
                <img src={petPhoto} alt={pet.name} className="w-full h-full object-cover" />
                {token && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => handlePhotoUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <div className="text-center text-white">
                          <Camera className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Change Photo</span>
                        </div>
                      )}
                    </button>
                  </>
                )}
              </div>
              
              {/* Soul Score Badge */}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                  score >= 80 ? 'bg-green-100 text-green-700' :
                  score >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {score}%
                </div>
              </div>
            </div>
            
            {/* Pet Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold h-12 max-w-xs"
                    placeholder="Pet name"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={editForm.breed}
                      onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                      placeholder="Breed"
                      className="w-40"
                    />
                    <select
                      value={editForm.species}
                      onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                      className="h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="h-10 px-3 rounded-md border border-gray-200"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Birthday</label>
                      <Input
                        type="date"
                        value={editForm.birth_date}
                        onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Gotcha Day</label>
                      <Input
                        type="date"
                        value={editForm.gotcha_date}
                        onChange={(e) => setEditForm({ ...editForm, gotcha_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={saveEdits} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{pet.name}</h1>
                  <p className="text-gray-600 mb-3">
                    {pet.breed || 'Adorable Furball'} • {pet.species === 'cat' ? '🐱 Cat' : '🐕 Dog'} • {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {pet.birth_date && (
                      <Badge variant="outline" className="bg-white">
                        🎂 {pet.birth_date}
                      </Badge>
                    )}
                    {pet.gotcha_date && (
                      <Badge variant="outline" className="bg-white">
                        💝 Gotcha: {pet.gotcha_date}
                      </Badge>
                    )}
                    {pet.pet_pass_number && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {pet.pet_pass_number}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-[57px] z-10">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-12 w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="overview" className="gap-1.5">
                <Home className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="personality" className="gap-1.5">
                <Sparkles className="w-4 h-4" /> Pet Soul
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5">
                <Heart className="w-4 h-4" /> Health
              </TabsTrigger>
              <TabsTrigger value="vaccines" className="gap-1.5">
                <Syringe className="w-4 h-4" /> Vaccines
              </TabsTrigger>
              <TabsTrigger value="pillars" className="gap-1.5">
                <Crown className="w-4 h-4" /> Services
              </TabsTrigger>
              <TabsTrigger value="identity" className="gap-1.5">
                <CreditCard className="w-4 h-4" /> Pet Pass
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Pet Soul Score Card */}
            <Card className={`p-6 ${score < 100 ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {score < 100 ? '🌱 Pet Soul Growing' : '✨ Pet Soul Complete'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {score < 100 ? `Help us understand ${pet.name} better` : `We know ${pet.name} deeply!`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{score}%</div>
                  <p className="text-xs text-gray-500">completion</p>
                </div>
              </div>
              
              <div className="w-full bg-white/60 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
              
              {score < 100 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowQuestions(!showQuestions)}
                    variant="outline"
                    className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Quick Questions
                  </Button>
                  <Button 
                    onClick={() => handleTabChange('personality')}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Full Journey →
                  </Button>
                </div>
              )}
            </Card>
            
            {/* Quick Questions Panel */}
            {showQuestions && score < 100 && (
              <Card className="p-4 bg-white border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">Help us know {pet.name} better</h4>
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
                            disabled={savingAnswer === question.id}
                            onClick={() => saveQuickAnswer(question.id, option)}
                            className="hover:bg-purple-100 hover:border-purple-400 hover:text-purple-700"
                          >
                            {savingAnswer === question.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* All 14 Pillars Grid */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                🏛️ Life Pillars for {pet.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {LIFE_PILLARS.map((pillar) => (
                  <Link 
                    key={pillar.id} 
                    to={`${pillar.path}?pet=${pet.id}`}
                    className="group"
                  >
                    <Card className="p-3 hover:shadow-md transition-all cursor-pointer border hover:border-purple-300 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
                        {pillar.icon}
                      </div>
                      <p className="text-xs font-medium text-gray-700">{pillar.name}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Pet Soul Tab */}
          <TabsContent value="personality" className="mt-0">
            <PetSoulJourney 
              user={user || { name: 'Guest', email: '' }} 
              pets={[pet]}
              onOpenMira={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            />
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-0 space-y-6">
            {loadingHealth ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                {/* Basic Health Info */}
                {pet.health && (
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Health Profile
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {pet.health.vet_name && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Primary Vet</p>
                          <p className="font-medium">{pet.health.vet_name}</p>
                          {pet.health.vet_clinic && <p className="text-sm text-gray-600">{pet.health.vet_clinic}</p>}
                        </div>
                      )}
                      {pet.health.medical_conditions && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Medical Conditions</p>
                          <p className="font-medium">{pet.health.medical_conditions}</p>
                        </div>
                      )}
                      {pet.health.dietary_restrictions && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Dietary Restrictions</p>
                          <p className="font-medium">{pet.health.dietary_restrictions}</p>
                        </div>
                      )}
                      {pet.weight && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Weight</p>
                          <p className="font-medium">{pet.weight} kg</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                
                {/* Active Medications */}
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Active Medications
                  </h3>
                  {healthData?.activeMeds?.length > 0 ? (
                    <div className="space-y-3">
                      {healthData.activeMeds.map((med, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-4">
                          <p className="font-medium">{med.medication_name}</p>
                          <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active medications recorded</p>
                  )}
                </Card>
                
                <div className="text-center">
                  <Link to={`/pet-vault/${pet.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Open Full Health Vault
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </TabsContent>

          {/* Vaccines Tab */}
          <TabsContent value="vaccines" className="mt-0 space-y-6">
            {loadingHealth ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                {/* Upcoming Vaccines Alert */}
                {healthData?.upcomingVaccines?.length > 0 && (
                  <Card className="p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h4 className="font-bold text-orange-800">Vaccines Due Soon</h4>
                    </div>
                    <div className="space-y-2">
                      {healthData.upcomingVaccines.map((v, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 flex justify-between items-center">
                          <span className="font-medium">{v.vaccine_name}</span>
                          <Badge className="bg-orange-100 text-orange-700">
                            Due: {new Date(v.next_due_date).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                {/* All Vaccines */}
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-green-600" />
                    Vaccination Records
                  </h3>
                  {healthData?.vaccines?.length > 0 ? (
                    <div className="space-y-3">
                      {healthData.vaccines.map((v, idx) => {
                        const dueDate = v.next_due_date ? new Date(v.next_due_date) : null;
                        const isOverdue = dueDate && dueDate < new Date();
                        
                        return (
                          <div key={idx} className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{v.vaccine_name}</p>
                              <p className="text-sm text-gray-600">
                                Given: {v.date_given ? new Date(v.date_given).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            {dueDate && (
                              <Badge className={isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                {isOverdue ? 'Overdue' : `Next: ${dueDate.toLocaleDateString()}`}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No vaccination records found</p>
                  )}
                </Card>
                
                <div className="text-center">
                  <Link to={`/pet-vault/${pet.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Manage in Health Vault
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </TabsContent>

          {/* Pillars/Services Tab */}
          <TabsContent value="pillars" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {LIFE_PILLARS.map((pillar) => (
                <Link key={pillar.id} to={`${pillar.path}?pet=${pet.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border hover:border-purple-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-3xl`}>
                        {pillar.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{pillar.name}</h3>
                        <p className="text-sm text-gray-500">Explore {pillar.name.toLowerCase()} options for {pet.name}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Pet Pass Identity Tab */}
          <TabsContent value="identity" className="mt-0">
            {pet.pet_pass_number ? (
              <div className="max-w-md mx-auto">
                <PetPassCard 
                  pet={{
                    ...pet,
                    photo: pet.photo_url
                  }} 
                />
              </div>
            ) : (
              <Card className="p-8 text-center max-w-md mx-auto">
                <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No Pet Pass Yet</h3>
                <p className="text-gray-500 mb-6">
                  Get a Pet Pass to unlock premium services and exclusive benefits for {pet.name}
                </p>
                <Link to="/membership">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Pet Pass
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedPetPage;
