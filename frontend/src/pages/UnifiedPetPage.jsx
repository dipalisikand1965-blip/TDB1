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
  CreditCard, HelpCircle, ChevronDown, ChevronUp, Home, Settings,
  Share2, Copy, Printer, Download, FileText
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import { resolvePetAvatar, getPetPhotoUrl } from '../utils/petAvatar';
import usePetScore from '../utils/petScore';
import PetScoreCard from '../components/PetScoreCard';
import PetPassCard from '../components/PetPassCard';
import PetSoulJourney from '../components/PetSoulJourney';
import PetSoulAnswers from '../components/PetSoulAnswers';
import { AchievementsGrid, ACHIEVEMENTS, celebrateAchievement } from '../components/PetAchievements';
import BreedHealthCard from '../components/BreedHealthCard';
import BreedAutocomplete from '../components/BreedAutocomplete';

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

// Memory Type Icons and Colors
const MEMORY_TYPE_CONFIG = {
  event: { icon: Calendar, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-700', name: 'Events & Plans' },
  health: { icon: Stethoscope, color: 'from-red-500 to-pink-500', bg: 'bg-red-50', text: 'text-red-700', name: 'Health & Wellness' },
  shopping: { icon: Gift, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50', text: 'text-purple-700', name: 'Preferences & Shopping' },
  general: { icon: Brain, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', name: 'General' }
};

// Mira Memories Section Component
const MiraMemoriesSection = ({ petId, petName, token }) => {
  const [memories, setMemories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemories = async () => {
      // If no token, show login prompt instead of loading forever
      if (!token) {
        setLoading(false);
        setError('login_required');
        return;
      }
      
      if (!petId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/mira/memory/pet/${petId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMemories(data);
        } else if (response.status === 401) {
          setError('login_required');
        } else {
          setError('Could not load memories');
        }
      } catch (err) {
        setError('Failed to fetch memories');
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [petId, token]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
          <span className="text-gray-500">Loading Mira's memories...</span>
        </div>
      </Card>
    );
  }

  // Show login prompt if not authenticated
  if (error === 'login_required') {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-300" />
          <h3 className="font-medium text-gray-900 mb-2">Sign in to see Mira's Memories</h3>
          <p className="text-gray-500 text-sm mb-4">Log in to view what Mira has learned about {petName || 'your pet'}</p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Sign In
          </a>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const hasMemories = memories?.total_memories > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Mira's Memories of {petName || 'Your Pet'}</h2>
            <p className="text-gray-600 text-sm">
              Things Mira has learned from your conversations to provide personalised service
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{memories?.total_memories || 0}</div>
            <div className="text-xs text-gray-500">Total Memories</div>
          </div>
        </div>
      </Card>

      {!hasMemories ? (
        <Card className="p-12 text-center border-dashed border-2">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Memories Yet</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            As you chat with Mira about {petName || 'your pet'}, she'll remember important details 
            like health notes, preferences, upcoming events, and more.
          </p>
          <Button 
            onClick={() => window.location.href = '/mira'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Mira
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(memories.by_type || {}).map(([type, data]) => {
            const config = MEMORY_TYPE_CONFIG[type] || MEMORY_TYPE_CONFIG.general;
            const Icon = config.icon;
            
            return (
              <Card key={type} className="overflow-hidden">
                {/* Type Header */}
                <div className={`h-16 bg-gradient-to-r ${config.color} px-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3 text-white">
                    <Icon className="w-6 h-6" />
                    <span className="font-semibold">{data.name || config.name}</span>
                  </div>
                  <Badge className="bg-white/20 text-white">
                    {data.count} memories
                  </Badge>
                </div>
                
                {/* Memories List */}
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {data.memories?.map((memory, idx) => (
                    <div 
                      key={memory.id || idx}
                      className={`p-3 rounded-lg ${config.bg} border border-transparent hover:border-${type === 'health' ? 'red' : type === 'event' ? 'blue' : type === 'shopping' ? 'purple' : 'emerald'}-200 transition-all`}
                    >
                      <p className="text-gray-800 text-sm">{memory.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${config.text}`}>
                            {memory.source || 'Conversation'}
                          </Badge>
                          {memory.is_critical && (
                            <Badge className="bg-red-500 text-white text-xs">Critical</Badge>
                          )}
                        </div>
                        {memory.created_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">How memories work</p>
            <p>
              Mira automatically remembers important things you mention in conversations, 
              like upcoming trips, health concerns, food preferences, and special dates. 
              These memories help her provide more personalised recommendations and service.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

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
  
  // Get tab from URL params, default to 'personality' (Detailed View)
  const initialTab = searchParams.get('tab') || 'personality';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allPets, setAllPets] = useState([]); // For pet switcher
  const [showPetSwitcher, setShowPetSwitcher] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false); // Social share modal
  
  // Use server-side Pet Score API (single source of truth)
  const { 
    scoreState, 
    loading: scoreLoading, 
    refetch: refetchScore,
    score,
    tier,
    recommendations 
  } = usePetScore(petId, token);
  
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
  const [previousAchievements, setPreviousAchievements] = useState([]);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Quick answer options for common questions
  const QUICK_OPTIONS = {
    gender: ['Male', 'Female'],
    general_nature: ['Calm', 'Energetic', 'Curious', 'Playful', 'Shy', 'Friendly'],
    stranger_reaction: ['Friendly', 'Cautious', 'Excited', 'Shy', 'Protective', 'Indifferent'],
    handling_comfort: ['Very Comfortable', 'Comfortable', 'Tolerates', 'Uncomfortable', 'Hates It'],
    loud_sounds: ['Not Bothered', 'Slightly Nervous', 'Very Scared', 'Hides', 'Barks/Reacts'],
    behavior_with_dogs: ['Friendly', 'Playful', 'Cautious', 'Aggressive', 'Ignores Them', 'Submissive'],
    behavior_with_humans: ['Very Friendly', 'Friendly', 'Shy Initially', 'Cautious', 'Protective'],
    other_pets: ['Yes - Dogs', 'Yes - Cats', 'Yes - Other', 'No Other Pets'],
    kids_at_home: ['Yes - Toddlers', 'Yes - Children', 'Yes - Teenagers', 'No Children'],
    walks_per_day: ['1 Walk', '2 Walks', '3+ Walks', 'No Regular Walks'],
    energetic_time: ['Morning', 'Afternoon', 'Evening', 'Night', 'All Day'],
    sleep_schedule: ['Early Riser', 'Night Owl', 'Regular Schedule', 'Naps Throughout'],
    separation_anxiety: ['None', 'Mild', 'Moderate', 'Severe'],
    alone_comfort: ['Very Comfortable', 'Okay for Few Hours', 'Gets Anxious', 'Cannot Be Left Alone'],
    space_preference: ['Quiet Spaces', 'Busy/Active Areas', 'No Preference'],
    sleeping_spot: ['Own Bed', 'Human Bed', 'Couch', 'Floor', 'Crate', 'Anywhere'],
    crate_trained: ['Yes - Loves It', 'Yes - Tolerates', 'In Progress', 'No'],
    allowed_on_furniture: ['Yes - Everywhere', 'Some Furniture', 'No'],
    outdoor_access: ['Yes - Garden', 'Yes - Balcony', 'No Outdoor Access'],
    car_rides: ['Loves It', 'Tolerates', 'Gets Anxious', 'Gets Sick'],
    travel_style: ['Car', 'Flight', 'Train', 'Any Mode', 'Prefers Not to Travel'],
    hotel_experience: ['Yes - Loved It', 'Yes - Was Okay', 'Yes - Didn\'t Like', 'No Experience'],
    motion_sickness: ['Never', 'Sometimes', 'Often', 'Always'],
    flight_experience: ['Yes - Cabin', 'Yes - Cargo', 'No Experience'],
    travel_anxiety: ['None', 'Mild', 'Moderate', 'Severe'],
    diet_type: ['Dry Kibble', 'Wet Food', 'Raw Diet', 'Home Cooked', 'Mixed'],
    sensitive_stomach: ['No Issues', 'Mild Sensitivity', 'Very Sensitive'],
    prefers_grain_free: ['Yes', 'No', 'Not Sure'],
    training_level: ['Beginner', 'Basic Commands', 'Well Trained', 'Advanced', 'Professional'],
    leash_behavior: ['Perfect', 'Good', 'Pulls Sometimes', 'Pulls A Lot', 'Needs Work'],
    recall: ['Excellent', 'Good', 'Hit or Miss', 'Poor', 'None'],
    vaccination_status: ['Fully Vaccinated', 'Partially', 'Overdue', 'Not Vaccinated'],
    spayed_neutered: ['Yes', 'No', 'Planned'],
    insurance: ['Yes - Full Cover', 'Yes - Basic', 'No Insurance']
  };
  
  // Save inline answer
  const saveInlineAnswer = async (questionId, value) => {
    if (!value || value === '') return;
    
    setSavingAnswer(questionId);
    try {
      const response = await fetch(`${API_URL}/api/pets/${pet.id}/soul-answers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [questionId]: value })
      });
      
      if (response.ok) {
        // Update local pet data
        setPet(prev => ({
          ...prev,
          doggy_soul_answers: {
            ...prev.doggy_soul_answers,
            [questionId]: value
          }
        }));
        toast({ title: 'Saved!', description: 'Answer updated successfully' });
        setEditingQuestion(null);
        setEditValue('');
        // Refresh score
        refetchScore();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({ title: 'Error', description: 'Failed to save answer', variant: 'destructive' });
    } finally {
      setSavingAnswer(null);
    }
  };
  
  // Compute unlocked achievements based on score state and pet data
  const computeUnlockedAchievements = () => {
    const unlocked = [];
    if (!scoreState) return unlocked;
    
    const answers = pet?.doggy_soul_answers || {};
    const hasAnswers = Object.keys(answers).length > 0;
    
    // Tier achievements
    if (hasAnswers) unlocked.push('first_answer');
    if (scoreState.tier?.key === 'soul_seeker' || scoreState.overall_score >= 25) unlocked.push('soul_seeker_unlocked');
    if (scoreState.tier?.key === 'soul_explorer' || scoreState.overall_score >= 50) unlocked.push('soul_explorer_unlocked');
    if (scoreState.tier?.key === 'soul_master' || scoreState.overall_score >= 75) unlocked.push('soul_master_unlocked');
    if (scoreState.overall_score >= 100) unlocked.push('pet_soul_complete');
    
    // Category achievements - check if category is complete
    const categoryBreakdown = scoreState.category_breakdown || {};
    if (categoryBreakdown.safety?.completion >= 100) unlocked.push('safety_first');
    if (categoryBreakdown.personality?.completion >= 100) unlocked.push('personality_pro');
    if (categoryBreakdown.lifestyle?.completion >= 100) unlocked.push('lifestyle_guru');
    if (categoryBreakdown.nutrition?.completion >= 100) unlocked.push('nutrition_ninja');
    if (categoryBreakdown.training?.completion >= 100) unlocked.push('training_expert');
    
    // Special achievements
    if (pet?.photo_url) unlocked.push('photo_uploaded');
    // Handle food_allergies as array or string
    const allergies = answers.food_allergies;
    if (allergies) {
      const hasAllergies = Array.isArray(allergies) 
        ? allergies.some(a => a && a !== 'No allergies' && a !== 'None')
        : allergies !== 'No allergies' && allergies !== 'None';
      if (hasAllergies) unlocked.push('allergy_aware');
    }
    
    return unlocked;
  };
  
  const unlockedAchievements = computeUnlockedAchievements();
  
  // Celebrate newly unlocked achievements with confetti
  useEffect(() => {
    if (unlockedAchievements.length === 0) return;
    
    // Find newly unlocked achievements (not in previous list)
    const newlyUnlocked = unlockedAchievements.filter(
      id => !previousAchievements.includes(id)
    );
    
    // Trigger celebration for each new achievement (with delay between)
    if (newlyUnlocked.length > 0 && previousAchievements.length > 0) {
      newlyUnlocked.forEach((achievementId, index) => {
        // ACHIEVEMENTS is an object keyed by achievement ID, not an array
        const achievement = ACHIEVEMENTS[achievementId];
        if (achievement) {
          setTimeout(() => {
            celebrateAchievement(achievement.type);
            toast({
              title: `🎉 Achievement Unlocked!`,
              description: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
              duration: 5000
            });
          }, index * 1500); // Stagger celebrations
        }
      });
    }
    
    // Update previous achievements
    setPreviousAchievements(unlockedAchievements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(unlockedAchievements)]); // Only trigger when achievement list changes

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
        
        // Also fetch all pets for the switcher
        if (token) {
          try {
            const allPetsResponse = await fetch(`${API_URL}/api/pets`, { headers });
            if (allPetsResponse.ok) {
              const allPetsData = await allPetsResponse.json();
              setAllPets(Array.isArray(allPetsData) ? allPetsData : allPetsData.pets || []);
            }
          } catch (e) {
            console.warn('Could not fetch all pets for switcher:', e);
          }
        }
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
      if (!petId || activeTab !== 'health' || healthData) return;
      
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
        toast({ title: 'Photo Updated!', description: `${safePet.name}'s photo has been updated` });
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
            ...safePet.doggy_soul_answers,
            [questionId]: answer
          }
        });
        // Refetch score from server (single source of truth)
        refetchScore();
        toast({
          title: "Answer saved!",
          description: `${safePet.name}'s Pet Soul updated!`,
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

  // Additional safety check - ensure pet has required fields
  if (!pet || typeof pet !== 'object') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Data Error</h2>
          <p className="text-gray-600 mb-6">Unable to load this pet's profile data. The pet may have been removed or there's a data issue.</p>
          <Button onClick={() => navigate('/my-pets')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Pets
          </Button>
        </Card>
      </div>
    );
  }

  // Safe defaults for pet properties
  const safePet = {
    name: pet.name || 'Unknown Pet',
    breed: pet.breed || 'Unknown Breed',
    species: pet.species || 'dog',
    gender: pet.gender || '',
    photo_url: pet.photo_url || null,
    pet_pass_number: pet.pet_pass_number || null,
    birth_date: pet.birth_date || null,
    gotcha_date: pet.gotcha_date || null,
    overall_score: pet.overall_score || 0,
    doggy_soul_answers: pet.doggy_soul_answers || {},
    health: pet.health || {},
    weight: pet.weight || null,
    ...pet
  };

  const petPhoto = getPetPhotoUrl(safePet);
  // Use server-side score as single source of truth
  const displayScore = scoreState?.score ?? Math.round(safePet.overall_score || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50" data-testid="unified-pet-page">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-purple-600 hover:text-purple-800 hover:bg-purple-50">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Account
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <img src={petPhoto} alt={safePet.name} className="w-8 h-8 rounded-full object-cover border-2 border-purple-200" />
              <span className="font-semibold text-gray-900">{safePet.name}</span>
              {safePet.pet_pass_number && (
                <Badge className="bg-purple-600 text-white text-xs ml-1">
                  {safePet.pet_pass_number}
                </Badge>
              )}
            </div>
          </div>
          
          {token && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowShareModal(true)}
                className="bg-white/10 border-white/30 text-gray-700 hover:bg-white"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
                className="bg-white/10 border-white/30 text-gray-700 hover:bg-white"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setEditing(!editing);
                if (!editing) {
                  setEditForm({
                    name: safePet.name || '',
                    breed: safePet.breed || '',
                    species: safePet.species || 'dog',
                    gender: safePet.gender || 'male',
                    birth_date: safePet.birth_date || '',
                    gotcha_date: safePet.gotcha_date || ''
                  });
                }
              }}>
                {editing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pet Profile Header - Premium Mobile-First Design */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 py-8 md:py-10 relative overflow-hidden">
        {/* Animated Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/2 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            {/* Pet Photo - Animated and Prominent */}
            <div className="relative group animate-fade-in-up">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white shadow-2xl overflow-hidden border-4 border-white/50 ring-4 ring-white/20 transition-transform duration-500 hover:scale-105">
                <img src={petPhoto} alt={safePet.name} className="w-full h-full object-cover" />
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
              
              {/* Soul Score Badge - More Visible */}
              <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl p-1.5 shadow-xl">
                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-sm font-bold ${
                  displayScore >= 75 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                  displayScore >= 50 ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' :
                  displayScore >= 25 ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white' :
                  'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                }`}>
                  <span className="text-lg">{Math.round(displayScore)}%</span>
                  <span className="text-[10px] opacity-80">Soul</span>
                </div>
              </div>
              
              {/* Pet Pass Number Badge - Prominent */}
              {safePet.pet_pass_number && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-full font-mono border border-white/30 shadow-lg">
                  <CreditCard className="w-3 h-3 inline mr-1.5" />
                  {safePet.pet_pass_number}
                </div>
              )}
            </div>
            
            {/* Pet Info - Enhanced */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold h-12 max-w-xs bg-white"
                    placeholder="Pet name"
                  />
                  <div className="flex flex-wrap gap-2">
                    <div className="w-48">
                      <BreedAutocomplete
                        value={editForm.breed}
                        onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                        placeholder="Start typing breed..."
                        className="bg-white"
                      />
                    </div>
                    <select
                      value={editForm.species}
                      onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                      className="h-10 px-3 rounded-md border border-gray-200 bg-white"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="h-10 px-3 rounded-md border border-gray-200 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <label className="text-xs text-white/70">Birthday</label>
                      <Input
                        type="date"
                        value={editForm.birth_date}
                        onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70">Gotcha Day</label>
                      <Input
                        type="date"
                        value={editForm.gotcha_date}
                        onChange={(e) => setEditForm({ ...editForm, gotcha_date: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <Button onClick={saveEdits} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <h1 className="text-4xl font-bold text-white">{safePet.name}</h1>
                    
                    {/* PET SWITCHER - For multi-pet households */}
                    {allPets.length > 1 && (
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPetSwitcher(!showPetSwitcher)}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Switch Pet
                        </Button>
                        
                        {showPetSwitcher && (
                          <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border z-50 py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                            <div className="px-3 py-2 border-b text-xs text-gray-500 font-semibold">
                              Your Pets ({allPets.length})
                            </div>
                            {allPets.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  navigate(`/pet/${p.id}?tab=personality`);
                                  setShowPetSwitcher(false);
                                }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-purple-50 transition-colors ${
                                  p.id === pet.id ? 'bg-purple-100' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                  {p.photo_url ? (
                                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    p.name?.charAt(0) || '?'
                                  )}
                                </div>
                                <div className="text-left flex-1">
                                  <p className={`font-semibold text-sm ${p.id === pet.id ? 'text-purple-700' : 'text-gray-900'}`}>
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{p.breed || p.species || 'Pet'}</p>
                                </div>
                                {p.id === pet.id && (
                                  <Check className="w-4 h-4 text-purple-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-white/80 text-lg mb-4 mt-2">
                    {safePet.breed || 'Adorable Furball'} • {safePet.species === 'cat' ? '🐱 Cat' : '🐕 Dog'} • {safePet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                    {safePet.birth_date && (
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        🎂 Birthday: {new Date(safePet.birth_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Badge>
                    )}
                    {safePet.gotcha_date && (
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        💝 Gotcha: {new Date(safePet.gotcha_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                      <p className="text-2xl font-bold text-white">{Math.round(displayScore)}%</p>
                      <p className="text-xs text-white/70">Pet Soul™</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                      <p className="text-2xl font-bold text-white">{tier?.name || 'Newcomer'}</p>
                      <p className="text-xs text-white/70">Current Tier</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                      <p className="text-2xl font-bold text-white">{Object.keys(safePet.doggy_soul_answers || {}).length}</p>
                      <p className="text-xs text-white/70">Questions Answered</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-[57px] z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-14 w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-1">
              <TabsTrigger value="personality" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
                <Sparkles className="w-4 h-4" /> Detailed View
              </TabsTrigger>
              <TabsTrigger value="memories" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
                <Brain className="w-4 h-4" /> Mira Memories
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
                <Heart className="w-4 h-4" /> Health Vault
              </TabsTrigger>
              <TabsTrigger value="pillars" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
                <Crown className="w-4 h-4" /> Services
              </TabsTrigger>
              <TabsTrigger value="mira-history" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
                <MessageCircle className="w-4 h-4" /> Mira Chats
              </TabsTrigger>
              <TabsTrigger value="identity" className="gap-1.5 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 px-4">
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
            {/* Pet Soul Score Card - Using server-side data */}
            <PetScoreCard
              scoreState={scoreState}
              loading={scoreLoading}
              petName={safePet.name}
              onQuickQuestions={() => setShowQuestions(!showQuestions)}
              onFullJourney={() => handleTabChange('personality')}
            />
            
            {/* Quick Questions Panel */}
            {showQuestions && displayScore < 100 && (
              <Card className="p-4 bg-white border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">Help us know {safePet.name} better</h4>
                </div>
                
                <div className="space-y-4">
                  {QUICK_QUESTIONS.filter(q => !(safePet.doggy_soul_answers || {})[q.id]).slice(0, 3).map((question) => (
                    <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-xl">{question.icon}</span>
                        {question.label.replace('{name}', safePet.name)}
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
            
            {/* Achievements Section */}
            {unlockedAchievements.length > 0 && (
              <AchievementsGrid 
                unlockedAchievements={unlockedAchievements}
                petName={safePet.name}
              />
            )}
            
            {/* Breed Health Tips - Compact */}
            {safePet.breed && (
              <BreedHealthCard 
                breed={safePet.breed} 
                petName={safePet.name}
                compact={true}
              />
            )}
            
            {/* All 14 Pillars Grid */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                🏛️ Life Pillars for {safePet.name}
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

          {/* Pet Soul Tab - COMPREHENSIVE VIEW with ALL 14 Pillars */}
          <TabsContent value="personality" className="mt-0 space-y-6">
            {/* EMERGENCY INFO CARD - Critical info at a glance */}
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Emergency Info Card
                </h3>
                <Badge variant="outline" className="text-red-600 border-red-300">Quick Reference</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">Allergies</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(() => {
                      const allergies = safePet.doggy_soul_answers?.food_allergies;
                      if (!allergies) return 'None recorded';
                      if (Array.isArray(allergies)) return allergies.filter(a => a && a !== 'None').join(', ') || 'None recorded';
                      return allergies !== 'None' && allergies !== 'No allergies' ? allergies : 'None recorded';
                    })()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">Medical Conditions</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(() => {
                      const conditions = safePet.doggy_soul_answers?.medical_conditions;
                      if (!conditions) return 'None recorded';
                      if (Array.isArray(conditions)) return conditions.filter(m => m && m !== 'None').join(', ') || 'None recorded';
                      return conditions !== 'None' ? conditions : 'None recorded';
                    })()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">Medications</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {healthData?.medications?.filter(m => !m.end_date || new Date(m.end_date) > new Date()).map(m => m.name).join(', ') || 'None active'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">Vet Contact</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {safePet.doggy_soul_answers?.vet_name || 'Not specified'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Soul Score Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Score Card */}
              <Card className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold">{Math.round(displayScore)}%</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Pet Soul™ Score</h3>
                  <p className="text-white/70 text-sm">
                    {displayScore >= 80 ? "We truly know " + safePet.name :
                     displayScore >= 50 ? "Patterns are emerging" :
                     displayScore >= 25 ? "Getting to know " + safePet.name :
                     "Just getting started"}
                  </p>
                  <Badge className="mt-3 bg-white/20 text-white border-none">
                    {tier?.name || 'Soul Seeker'}
                  </Badge>
                </div>
              </Card>
              
              {/* Quick Stats */}
              <Card className="p-6 md:col-span-2">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  {safePet.name}&apos;s Soul Profile
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{Object.keys(safePet.doggy_soul_answers || {}).length}</p>
                    <p className="text-xs text-gray-600">Questions Answered</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-pink-600">{unlockedAchievements.length}</p>
                    <p className="text-xs text-gray-600">Achievements</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{healthData?.vaccines?.length || 0}</p>
                    <p className="text-xs text-gray-600">Vaccines</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{healthData?.medications?.filter(m => !m.end_date || new Date(m.end_date) > new Date()).length || 0}</p>
                    <p className="text-xs text-gray-600">Active Meds</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* 14 SOUL PILLARS - Expandable Sections */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Soul Questionnaire - 8 Categories
                <Badge variant="outline" className="ml-auto">
                  Click any category to expand
                </Badge>
              </h3>
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Questions marked with <span className="text-purple-600 font-medium">★</span> count towards your Pet&apos;s Soul Score</span>
              </p>
              
              <div className="space-y-3">
                {[
                  { key: 'identity_temperament', name: 'Identity & Temperament', icon: '🎭', color: 'purple', questions: ['name', 'breed', 'gender', 'general_nature', 'describe_3_words', 'stranger_reaction', 'handling_comfort', 'loud_sounds'] },
                  { key: 'family_pack', name: 'Family & Pack', icon: '👨‍👩‍👧‍👦', color: 'blue', questions: ['most_attached_to', 'behavior_with_dogs', 'behavior_with_humans', 'other_pets', 'kids_at_home', 'primary_caretaker'] },
                  { key: 'rhythm_routine', name: 'Rhythm & Routine', icon: '⏰', color: 'green', questions: ['walks_per_day', 'energetic_time', 'sleep_schedule', 'feeding_times', 'separation_anxiety', 'alone_comfort', 'potty_schedule'] },
                  { key: 'home_comforts', name: 'Home & Comforts', icon: '🏠', color: 'amber', questions: ['space_preference', 'sleeping_spot', 'crate_trained', 'favorite_spot', 'allowed_on_furniture', 'outdoor_access'] },
                  { key: 'travel_style', name: 'Travel & Mobility', icon: '✈️', color: 'sky', questions: ['car_rides', 'travel_style', 'hotel_experience', 'motion_sickness', 'flight_experience', 'travel_anxiety'] },
                  { key: 'taste_treat', name: 'Taste & Nutrition', icon: '🍖', color: 'orange', questions: ['food_allergies', 'favorite_treats', 'dislikes', 'diet_type', 'food_brand', 'sensitive_stomach', 'prefers_grain_free'] },
                  { key: 'training_behaviour', name: 'Training & Behaviour', icon: '🎓', color: 'indigo', questions: ['training_level', 'commands_known', 'leash_behavior', 'recall', 'problematic_behaviors', 'anxiety_triggers'] },
                  { key: 'long_horizon', name: 'Health & Long-Term', icon: '💊', color: 'rose', questions: ['medical_conditions', 'medications', 'vet_name', 'last_vet_visit', 'vaccination_status', 'spayed_neutered', 'insurance', 'special_needs'] }
                ].map((pillar) => {
                  const answers = safePet.doggy_soul_answers || {};
                  // For progress calculation, include core pet fields
                  const coreFields = {
                    name: pet?.name,
                    breed: pet?.breed,
                    gender: pet?.gender,
                    dob: pet?.dob
                  };
                  const answeredCount = pillar.questions.filter(q => {
                    const val = answers[q] || coreFields[q];
                    return val && val !== '' && val !== 'None';
                  }).length;
                  const totalQuestions = pillar.questions.length;
                  const progress = Math.round((answeredCount / totalQuestions) * 100);
                  const isExpanded = expandedPillar === pillar.key;
                  
                  const colorMap = {
                    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', progress: 'bg-purple-500' },
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', progress: 'bg-blue-500' },
                    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', progress: 'bg-green-500' },
                    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', progress: 'bg-amber-500' },
                    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', progress: 'bg-sky-500' },
                    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', progress: 'bg-orange-500' },
                    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', progress: 'bg-indigo-500' },
                    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', progress: 'bg-rose-500' }
                  };
                  const colors = colorMap[pillar.color];
                  
                  return (
                    <div 
                      key={pillar.key} 
                      className={`rounded-xl border-2 transition-all duration-300 animate-fade-in-up ${isExpanded ? colors.border + ' shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                      style={{ animationDelay: `${['identity_temperament', 'family_pack', 'rhythm_routine', 'home_comforts', 'travel_mobility', 'taste_nutrition', 'training_behavior', 'long_horizon'].indexOf(pillar.key) * 80}ms` }}
                    >
                      <button
                        onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                        className={`w-full p-4 flex items-center gap-4 ${isExpanded ? colors.bg : 'bg-white hover:bg-gray-50'} rounded-xl transition-all duration-200 active:scale-[0.98]`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.bg} transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
                          {pillar.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-gray-900">{pillar.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                              <div 
                                className={`h-full ${colors.progress} transition-all duration-700 ease-out`} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                            <span className="text-sm text-gray-500">{answeredCount}/{totalQuestions}</span>
                          </div>
                        </div>
                        <Badge className={`transition-all duration-200 ${progress === 100 ? 'bg-green-100 text-green-700 scale-110' : colors.text + ' ' + colors.bg}`}>
                          {progress}%
                        </Badge>
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className={`p-4 border-t ${colors.border} ${colors.bg} rounded-b-xl space-y-3 animate-fade-in-up`}>
                          {pillar.questions.map((questionId, qIndex) => {
                            // For core pet info fields, fall back to pet's root properties
                            const coreFields = {
                              name: pet?.name,
                              breed: pet?.breed,
                              gender: pet?.gender,
                              dob: pet?.dob
                            };
                            const value = answers[questionId] || coreFields[questionId];
                            const hasAnswer = value && value !== '' && value !== 'None';
                            const displayValue = Array.isArray(value) ? value.filter(v => v && v !== 'None').join(', ') : value;
                            const isEditing = editingQuestion === questionId;
                            const quickOptions = QUICK_OPTIONS[questionId];
                            
                            // Question labels
                            const questionLabels = {
                              name: "Pet's Name", breed: 'Breed', gender: 'Gender', general_nature: 'Temperament',
                              describe_3_words: 'Personality (3 words)', stranger_reaction: 'Stranger Reaction',
                              handling_comfort: 'Handling Comfort', loud_sounds: 'Sound Sensitivity',
                              most_attached_to: 'Most Attached To', behavior_with_dogs: 'With Other Dogs',
                              behavior_with_humans: 'With People', other_pets: 'Other Pets', kids_at_home: 'Kids at Home',
                              primary_caretaker: 'Primary Caretaker', walks_per_day: 'Daily Walks',
                              energetic_time: 'Most Active Time', sleep_schedule: 'Sleep Schedule',
                              feeding_times: 'Feeding Times', separation_anxiety: 'Separation Comfort',
                              alone_comfort: 'Alone Comfort', potty_schedule: 'Potty Schedule',
                              space_preference: 'Space Preference', sleeping_spot: 'Sleeping Spot',
                              crate_trained: 'Crate Trained', favorite_spot: 'Favourite Spot',
                              allowed_on_furniture: 'Furniture Access', outdoor_access: 'Outdoor Access',
                              car_rides: 'Car Rides', travel_style: 'Travel Preference',
                              hotel_experience: 'Boarding Experience', motion_sickness: 'Motion Sickness',
                              flight_experience: 'Flight Experience', travel_anxiety: 'Travel Anxiety',
                              food_allergies: 'Food Allergies', favorite_treats: 'Favourite Treats',
                              dislikes: 'Food Dislikes', diet_type: 'Diet Type', food_brand: 'Food Brand',
                              sensitive_stomach: 'Stomach Sensitivity', prefers_grain_free: 'Grain-Free',
                              training_level: 'Training Level', commands_known: 'Commands Known',
                              leash_behavior: 'Leash Behaviour', recall: 'Recall',
                              problematic_behaviors: 'Behavioural Issues', anxiety_triggers: 'Anxiety Triggers',
                              medical_conditions: 'Medical Conditions', medications: 'Current Medications',
                              vet_name: 'Veterinarian', last_vet_visit: 'Last Vet Visit',
                              vaccination_status: 'Vaccination Status', spayed_neutered: 'Spayed/Neutered',
                              insurance: 'Pet Insurance', special_needs: 'Special Needs'
                            };
                            
                            // Questions that count towards Pet Soul Score (from backend pet_score_logic.py)
                            const soulScoreQuestions = [
                              'food_allergies', 'health_conditions', 'medical_conditions', 'vet_comfort', 
                              'life_stage', 'grooming_tolerance', 'noise_sensitivity', 'loud_sounds',
                              'temperament', 'general_nature', 'energy_level', 'social_with_dogs', 
                              'behavior_with_dogs', 'social_with_people', 'behavior_with_humans', 
                              'behavior_issues', 'problematic_behaviors', 'alone_time_comfort', 
                              'alone_comfort', 'separation_anxiety', 'car_comfort', 'car_rides',
                              'travel_readiness', 'travel_style', 'favorite_spot', 'sleeping_spot',
                              'morning_routine', 'exercise_needs', 'feeding_times', 'favorite_protein',
                              'food_motivation', 'treat_preference', 'favorite_treats', 'training_level',
                              'motivation_type', 'primary_bond', 'most_attached_to', 'other_pets', 
                              'kids_at_home', 'favorite_toy_type'
                            ];
                            const affectsSoulScore = soulScoreQuestions.includes(questionId);
                            
                            return (
                              <div 
                                key={questionId}
                                className={`p-3 rounded-lg transition-all ${hasAnswer ? 'bg-white hover:bg-gray-50' : 'bg-white/50 border border-dashed border-gray-300'} ${isEditing ? 'ring-2 ring-purple-400 bg-purple-50' : ''}`}
                              >
                                {isEditing ? (
                                  // Inline Edit Mode
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-purple-700">{questionLabels[questionId] || questionId}</p>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => { setEditingQuestion(null); setEditValue(''); }}
                                        className="h-7 px-2"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    
                                    {quickOptions ? (
                                      // Quick option buttons
                                      <div className="flex flex-wrap gap-2">
                                        {quickOptions.map((option) => (
                                          <Button
                                            key={option}
                                            size="sm"
                                            variant={editValue === option ? 'default' : 'outline'}
                                            disabled={savingAnswer === questionId}
                                            onClick={() => saveInlineAnswer(questionId, option)}
                                            className={`text-xs ${editValue === option ? 'bg-purple-600' : 'hover:bg-purple-100 hover:border-purple-400'}`}
                                          >
                                            {savingAnswer === questionId && editValue === option && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                            {option}
                                          </Button>
                                        ))}
                                      </div>
                                    ) : (
                                      // Text input for custom answers - Use BreedAutocomplete for breed field
                                      <div className="flex gap-2">
                                        {questionId === 'breed' ? (
                                          <BreedAutocomplete
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            placeholder="Enter breed..."
                                            className="flex-1 h-9"
                                            onKeyPress={(e) => e.key === 'Enter' && saveInlineAnswer(questionId, editValue)}
                                          />
                                        ) : (
                                          <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            placeholder={`Enter ${questionLabels[questionId]?.toLowerCase() || 'answer'}...`}
                                            className="flex-1 h-9"
                                            onKeyPress={(e) => e.key === 'Enter' && saveInlineAnswer(questionId, editValue)}
                                          />
                                        )}
                                        <Button
                                          size="sm"
                                          onClick={() => saveInlineAnswer(questionId, editValue)}
                                          disabled={!editValue || savingAnswer === questionId}
                                          className="bg-purple-600 hover:bg-purple-700 h-9"
                                        >
                                          {savingAnswer === questionId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  // Display Mode
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      {hasAnswer ? (
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <HelpCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                          {questionLabels[questionId] || questionId}
                                          {affectsSoulScore && (
                                            <span className="text-purple-500 text-xs" title="Affects Pet Soul Score">★</span>
                                          )}
                                        </p>
                                        {hasAnswer && <p className="text-sm text-gray-500 truncate">{displayValue}</p>}
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant={hasAnswer ? "ghost" : "outline"}
                                      onClick={() => {
                                        setEditingQuestion(questionId);
                                        setEditValue(hasAnswer ? (Array.isArray(value) ? value.join(', ') : value) : '');
                                      }}
                                      className={`text-xs ml-2 ${hasAnswer ? 'text-gray-400 hover:text-purple-600' : ''}`}
                                    >
                                      {hasAnswer ? <Edit className="w-4 h-4" /> : 'Answer'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {progress < 100 && (
                            <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200 text-center">
                              <p className="text-sm text-purple-700 mb-2">
                                <Sparkles className="w-4 h-4 inline mr-1" />
                                {totalQuestions - answeredCount} questions remaining in {pillar.name}
                              </p>
                              <p className="text-xs text-gray-500">Click any question above to answer inline</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
            
            {/* PHOTO GALLERY Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  Photo Gallery
                </h3>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('gallery-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Add Photos
                </Button>
                <input 
                  type="file" 
                  id="gallery-upload" 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        toast({ title: 'Please login', description: 'You need to be logged in to upload photos', variant: 'destructive' });
                        return;
                      }
                      
                      setUploadingPhoto(true);
                      try {
                        // Upload first file as main photo (for now - gallery support can be expanded later)
                        const file = files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          toast({ title: 'File too large', description: 'Please upload an image under 5MB', variant: 'destructive' });
                          return;
                        }
                        
                        const formData = new FormData();
                        formData.append('photo', file);
                        
                        const response = await fetch(`${API_URL}/api/pets/${petId}/photo`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` },
                          body: formData
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setPet(prev => ({ ...prev, photo_url: data.photo_url }));
                          toast({ title: 'Photo uploaded!', description: `${safePet.name}'s gallery has been updated` });
                          // Refresh pet data
                          fetchPetData();
                        } else {
                          const err = await response.json();
                          toast({ title: 'Upload failed', description: err.detail || 'Could not upload photo', variant: 'destructive' });
                        }
                      } catch (err) {
                        console.error('Gallery upload error:', err);
                        toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
                      } finally {
                        setUploadingPhoto(false);
                        e.target.value = ''; // Reset input
                      }
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {/* Main Pet Photo */}
                <div className="col-span-2 row-span-2 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  {safePet.photo_url ? (
                    <img src={safePet.photo_url} alt={safePet.name} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-16 h-16 text-purple-300" />
                  )}
                </div>
                {/* Placeholder slots for more photos */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i}
                    className="aspect-square rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-purple-300 transition-all"
                    onClick={() => document.getElementById('gallery-upload')?.click()}
                  >
                    <Camera className="w-6 h-6 text-gray-300" />
                  </div>
                ))}
              </div>
            </Card>
            
            {/* MILESTONE TRACKER */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                Milestones & Memories
              </h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200" />
                
                <div className="space-y-4">
                  {/* Birthday */}
                  {safePet.birth_date && (
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center z-10 border-2 border-white shadow">
                        <span className="text-lg">🎂</span>
                      </div>
                      <div className="flex-1 bg-pink-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900">Born</p>
                        <p className="text-sm text-gray-600">{new Date(safePet.birth_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        {(() => {
                          const birth = new Date(safePet.birth_date);
                          const today = new Date();
                          const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
                          if (nextBirthday < today) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
                          const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                          return daysUntil <= 30 && (
                            <Badge className="mt-2 bg-pink-200 text-pink-700">
                              🎉 Birthday in {daysUntil} days!
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Gotcha Day */}
                  {safePet.gotcha_date && (
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center z-10 border-2 border-white shadow">
                        <span className="text-lg">🏠</span>
                      </div>
                      <div className="flex-1 bg-purple-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900">Gotcha Day</p>
                        <p className="text-sm text-gray-600">{new Date(safePet.gotcha_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-purple-600 mt-1">
                          {Math.floor((new Date() - new Date(safePet.gotcha_date)) / (1000 * 60 * 60 * 24 * 365))} years with the family
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Pet Pass Joined */}
                  {safePet.pet_pass_number && (
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center z-10 border-2 border-white shadow">
                        <span className="text-lg">🎫</span>
                      </div>
                      <div className="flex-1 bg-amber-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900">Pet Pass Member</p>
                        <p className="text-sm text-gray-600">ID: {safePet.pet_pass_number}</p>
                        <p className="text-xs text-amber-600 mt-1">All 14 Life Pillars unlocked</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Soul Journey Started */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center z-10 border-2 border-white shadow">
                      <span className="text-lg">✨</span>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">Soul Journey Started</p>
                      <p className="text-sm text-gray-600">{Object.keys(safePet.doggy_soul_answers || {}).length} questions answered</p>
                      <p className="text-xs text-blue-600 mt-1">Pet Soul™ Score: {displayScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* BREED INFO CARD */}
            {safePet.breed && (
              <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  About {safePet.breed}s
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Typical Temperament</p>
                    <p className="font-semibold text-gray-900">
                      {['Labrador', 'Golden Retriever', 'Lab'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Friendly, Active, Outgoing' :
                       ['Beagle'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Curious, Friendly, Merry' :
                       ['German Shepherd', 'GSD'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Loyal, Confident, Courageous' :
                       ['Poodle'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Intelligent, Active, Alert' :
                       ['Bulldog'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Calm, Courageous, Friendly' :
                       ['Indie', 'Indian', 'Desi'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Adaptable, Loyal, Alert' :
                       'Unique & Lovable'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Exercise Needs</p>
                    <p className="font-semibold text-gray-900">
                      {['Labrador', 'Golden Retriever', 'Lab', 'German Shepherd', 'Beagle', 'Husky'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'High - Daily exercise needed' :
                       ['Bulldog', 'Pug', 'Shih Tzu'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Low to Moderate' :
                       'Moderate - Regular walks'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Grooming</p>
                    <p className="font-semibold text-gray-900">
                      {['Poodle', 'Golden Retriever', 'Husky', 'Shih Tzu'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'High - Regular grooming' :
                       ['Labrador', 'Beagle', 'Indie'].some(b => safePet.breed?.toLowerCase().includes(b.toLowerCase())) ? 'Low - Easy to maintain' :
                       'Moderate'}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Achievements Section */}
            {unlockedAchievements.length > 0 && (
              <AchievementsGrid 
                unlockedAchievements={unlockedAchievements}
                petName={safePet.name}
              />
            )}
            
            {/* 14 Life Pillars Quick Access */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Life Pillars for {safePet.name}
                <span className="text-xs text-gray-500 font-normal ml-2">All 14 services unlocked with Pet Pass</span>
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {LIFE_PILLARS.map((pillar) => (
                  <Link 
                    key={pillar.id} 
                    to={`${pillar.path}?pet=${pet.id}`}
                    className="group"
                  >
                    <div className="p-2 hover:shadow-md transition-all cursor-pointer border rounded-xl hover:border-purple-300 text-center bg-white">
                      <div className={`w-9 h-9 mx-auto rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform`}>
                        {pillar.icon}
                      </div>
                      <p className="text-[10px] font-medium text-gray-600">{pillar.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Mira Memories Tab - What Mira Knows About This Pet */}
          <TabsContent value="memories" className="mt-0 space-y-6">
            <MiraMemoriesSection petId={petId} petName={pet?.name} token={token} />
          </TabsContent>

          {/* Health Vault Tab - Combined Health + Vaccines */}
          <TabsContent value="health" className="mt-0 space-y-6">
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
                            Due: {new Date(v.next_due_date).toLocaleDateString('en-GB')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                {/* Basic Health Info */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Health Profile
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {safePet.health?.vet_name && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Primary Vet</p>
                        <p className="font-medium">{safePet.health.vet_name}</p>
                        {safePet.health.vet_clinic && <p className="text-sm text-gray-600">{safePet.health.vet_clinic}</p>}
                      </div>
                    )}
                    {safePet.health?.medical_conditions && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Medical Conditions</p>
                        <p className="font-medium">{safePet.health.medical_conditions}</p>
                      </div>
                    )}
                    {safePet.health?.dietary_restrictions && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Dietary Restrictions</p>
                        <p className="font-medium">{safePet.health.dietary_restrictions}</p>
                      </div>
                    )}
                    {safePet.weight && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Weight</p>
                        <p className="font-medium">{safePet.weight} kg</p>
                      </div>
                    )}
                    {!safePet.health && !safePet.weight && (
                      <div className="col-span-2 text-center py-6 bg-white rounded-lg">
                        <Heart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No health information recorded yet</p>
                        <Link to={`/pet-vault/${pet.id}`}>
                          <Button variant="outline" className="mt-3" size="sm">
                            Add Health Info
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Active Medications */}
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Active Medications
                  </h3>
                  {healthData?.activeMeds?.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      {healthData.activeMeds.map((med, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-4">
                          <p className="font-medium">{med.medication_name}</p>
                          <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No active medications recorded</p>
                  )}
                </Card>

                {/* Vaccination Records */}
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-green-600" />
                    Vaccination Records
                  </h3>
                  {healthData?.vaccines?.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      {healthData.vaccines.map((v, idx) => {
                        const dueDate = v.next_due_date ? new Date(v.next_due_date) : null;
                        const isOverdue = dueDate && dueDate < new Date();
                        
                        return (
                          <div key={idx} className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{v.vaccine_name}</p>
                              <p className="text-sm text-gray-600">
                                Given: {v.date_given ? new Date(v.date_given).toLocaleDateString('en-GB') : 'Unknown'}
                              </p>
                            </div>
                            {dueDate && (
                              <Badge className={isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                {isOverdue ? 'Overdue' : `Next: ${dueDate.toLocaleDateString('en-GB')}`}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No vaccination records found</p>
                  )}
                </Card>
                
                {/* Breed-Specific Health Guide */}
                {safePet.breed && (
                  <BreedHealthCard 
                    breed={safePet.breed} 
                    petName={safePet.name}
                  />
                )}
                
                {/* Documents & Paperwork Section */}
                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Documents &amp; Paperwork
                    <Badge variant="outline" className="ml-auto">Paperwork Vault</Badge>
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    {[
                      { id: 'vaccination', name: 'Vaccination Certificate', icon: '💉', desc: 'Latest vaccines record' },
                      { id: 'registration', name: 'KCI Registration', icon: '📋', desc: 'Breed registration' },
                      { id: 'microchip', name: 'Microchip Certificate', icon: '🔖', desc: 'ID implant record' },
                      { id: 'insurance', name: 'Pet Insurance', icon: '🛡️', desc: 'Policy documents' },
                      { id: 'travel', name: 'Travel Documents', icon: '✈️', desc: 'Health certificates' },
                      { id: 'other', name: 'Other Documents', icon: '📁', desc: 'Medical reports, etc.' }
                    ].map(doc => (
                      <div 
                        key={doc.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 hover:border-purple-300"
                        onClick={() => {
                          window.open(`/paperwork?pet=${pet.id}&doc=${doc.id}`, '_blank');
                        }}
                      >
                        <div className="text-2xl mb-2">{doc.icon}</div>
                        <p className="font-medium text-sm text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`/paperwork?pet=${pet.id}`, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View All Documents
                    </Button>
                    <Button 
                      className="flex-1 bg-slate-600 hover:bg-slate-700"
                      onClick={() => window.open(`/paperwork?pet=${pet.id}&action=upload`, '_blank')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </Card>
                
                <div className="text-center">
                  <Link to={`/pet-vault/${pet.id}`}>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Open Full Health Vault
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </TabsContent>

          {/* Mira Chats History Tab */}
          <TabsContent value="mira-history" className="mt-0 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  Your Conversations with Mira
                </h3>
                <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
              
              {/* Placeholder for Mira conversation history */}
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h4 className="font-semibold text-gray-700 mb-2">Conversation History Coming Soon</h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your chats with Mira will appear here, helping us personalise {safePet.name}&apos;s experience based on your conversations.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                >
                  Chat with Mira Now
                </Button>
              </div>
            </Card>
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
                        <p className="text-sm text-gray-500">Explore {pillar.name.toLowerCase()} options for {safePet.name}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Pet Pass Identity Tab */}
          <TabsContent value="identity" className="mt-0">
            {safePet.pet_pass_number ? (
              <div className="max-w-md mx-auto">
                <PetPassCard 
                  pet={{
                    ...pet,
                    photo: safePet.photo_url
                  }} 
                />
              </div>
            ) : (
              <Card className="p-8 text-center max-w-md mx-auto">
                <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No Pet Pass Yet</h3>
                <p className="text-gray-500 mb-6">
                  Get a Pet Pass to unlock premium services and exclusive benefits for {safePet.name}
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
      
      {/* SOCIAL SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Share Card Preview */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white text-center relative">
              <div className="absolute top-2 right-2">
                <Button size="sm" variant="ghost" onClick={() => setShowShareModal(false)} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Pet Preview Card */}
              <div className="w-24 h-24 mx-auto rounded-full bg-white/20 border-4 border-white overflow-hidden mb-4">
                {safePet.photo_url ? (
                  <img src={safePet.photo_url} alt={safePet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PawPrint className="w-12 h-12 text-white/80" />
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold">{safePet.name}</h3>
              <p className="text-white/80">{safePet.breed || 'Adorable Pet'}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge className="bg-white/20 text-white border-none">
                  🐾 Pet Soul™ {Math.round(displayScore)}%
                </Badge>
                <Badge className="bg-white/20 text-white border-none">
                  {tier?.name || 'Member'}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-white/70">Member of The Doggy Company 🐕</p>
            </div>
            
            {/* Share Options */}
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 text-center">Share {safePet.name}&apos;s Profile</h4>
              
              <div className="grid grid-cols-4 gap-3 mb-6">
                {/* Facebook */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/pet/${pet.id}`);
                    const text = encodeURIComponent(`Meet ${safePet.name}! 🐾 Check out their Pet Soul™ profile on The Doggy Company - India's #1 Pet Life Platform!`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-xs text-gray-600">Facebook</span>
                </button>
                
                {/* Instagram */}
                <button
                  onClick={() => {
                    // Instagram doesn't have a direct share API - copy link and show instructions
                    navigator.clipboard.writeText(`${window.location.origin}/pet/${pet.id}`);
                    toast({ 
                      title: 'Link Copied! 📸', 
                      description: 'Paste this link in your Instagram bio or story!',
                    });
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-pink-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <span className="text-xs text-gray-600">Instagram</span>
                </button>
                
                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/pet/${pet.id}`);
                    const text = encodeURIComponent(`Meet ${safePet.name}! 🐾✨\n\nCheck out their Pet Soul™ profile on The Doggy Company - India's #1 Pet Life Platform!\n\n${decodeURIComponent(url)}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="text-xs text-gray-600">WhatsApp</span>
                </button>
                
                {/* Twitter/X */}
                <button
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/pet/${pet.id}`);
                    const text = encodeURIComponent(`Meet ${safePet.name}! 🐾 Check out their Pet Soul™ profile on @TheDoggyCompany - India's #1 Pet Life Platform! #PetSoul #Dogs #Pets`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-xs text-gray-600">X / Twitter</span>
                </button>
              </div>
              
              {/* Copy Link */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3 text-center">Or copy the link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/pet/${pet.id}`}
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 border-0"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/pet/${pet.id}`);
                      toast({ title: 'Link Copied!', description: 'Share it anywhere!' });
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Invite Friends CTA */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Invite Friends to Join!</p>
                    <p className="text-xs text-gray-500">When they create a Pet Pass, you both get rewards 🎁</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* QUICK ACTIONS FLOATING BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Action buttons - appear on hover */}
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto space-y-2">
            <Button
              size="sm"
              className="w-full bg-white shadow-lg border text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-end gap-2"
              onClick={() => navigate(`/pet/${pet.id}`)}
            >
              <span className="text-xs">Answer Questions</span>
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="w-full bg-white shadow-lg border text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center justify-end gap-2"
              onClick={() => navigate(`/pet-vault/${pet.id}`)}
            >
              <span className="text-xs">Health Vault</span>
              <Stethoscope className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="w-full bg-white shadow-lg border text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-end gap-2"
              onClick={() => navigate('/cakes')}
            >
              <span className="text-xs">Order Cake</span>
              <Gift className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="w-full bg-white shadow-lg border text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-end gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <span className="text-xs">Ask Mira</span>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Main FAB */}
          <Button
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
          >
            <PawPrint className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPetPage;
