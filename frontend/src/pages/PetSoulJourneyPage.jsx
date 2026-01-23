import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ArrowLeft, PawPrint, AlertCircle, Brain, FileText, Sparkles, Check } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import PetSoulJourney from '../components/PetSoulJourney';
import PetSoulAnswers from '../components/PetSoulAnswers';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../context/AuthContext';

// Question options for each question ID
const QUESTION_OPTIONS = {
  // Identity & Temperament
  temperament: ['Calm', 'Playful', 'Shy', 'Energetic', 'Protective'],
  energy_level: ['Low', 'Medium', 'High', 'Very High'],
  social_with_dogs: ['Loves all dogs', 'Selective', 'Prefers humans', 'Nervous'],
  social_with_people: ['Loves everyone', 'Selective', 'Shy at first', 'Protective'],
  adaptability: ['Very adaptable', 'Needs routine', 'Depends on situation'],
  // Family & Pack
  primary_bond: ['Me', 'Partner/Spouse', 'Kids', 'Everyone equally'],
  with_other_dogs: ['Loves all dogs', 'Only small dogs', 'Only big dogs', 'Selective'],
  with_people: ['Loves everyone', 'Shy at first', 'Protective', 'Selective'],
  other_pets: ['Yes, dogs', 'Yes, cats', 'Yes, other', 'No other pets'],
  kids_at_home: ['Yes, under 5', 'Yes, 5-12', 'Yes, teenagers', 'No kids'],
  primary_caretaker: ['Me', 'Partner', 'Family member', 'Shared'],
  // Rhythm & Routine
  morning_routine: ['Early riser', 'Sleeps in', 'Follows my schedule'],
  feeding_times: ['Once a day', 'Twice a day', 'Free feeding', 'Three times'],
  exercise_needs: ['30 min/day', '1 hour/day', '2+ hours/day', 'Light walks only'],
  nap_habits: ['Multiple short naps', 'One long nap', 'Rarely naps', 'Sleeps all day'],
  bedtime: ['Before 9pm', '9-11pm', 'After 11pm', 'No set time'],
  weekend_vs_weekday: ['Same routine', 'More active weekends', 'More relaxed weekends'],
  best_time_for_training: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
  // Home & Comforts
  favorite_spot: ['Couch', 'Bed', 'Floor', 'Own bed', 'Multiple spots'],
  alone_time_comfort: ['Fine alone', 'Gets anxious', 'Needs company', 'Depends'],
  noise_sensitivity: ['Not sensitive', 'Somewhat sensitive', 'Very sensitive'],
  favorite_toy_type: ['Plush toys', 'Balls', 'Chew toys', 'Puzzle toys', 'No preference'],
  temperature_preference: ['Loves heat', 'Loves cold', 'Moderate'],
  sleep_position: ['Curled up', 'Stretched out', 'On back', 'Changes often'],
  // Travel & Mobility
  car_comfort: ['Loves car rides', 'Gets anxious', 'Motion sickness', 'Neutral'],
  travel_readiness: ['Great traveler', 'Needs preparation', 'Prefers home'],
  carrier_comfort: ['Comfortable', 'Anxious', 'Never tried'],
  new_environment_reaction: ['Excited', 'Curious', 'Anxious', 'Adapts quickly'],
  walking_style: ['Pulls ahead', 'Walks beside', 'Sniffs everything', 'Variable'],
  favorite_outing: ['Park', 'Beach', 'Hiking', 'Car rides', 'Pet-friendly cafes'],
  // Taste & Treat
  food_motivation: ['Very food motivated', 'Moderate', 'Picky eater'],
  favorite_protein: ['Chicken', 'Beef', 'Fish', 'Lamb', 'Pork'],
  treat_preference: ['Soft treats', 'Crunchy treats', 'Natural treats', 'Any'],
  food_allergies: ['None known', 'Chicken', 'Grain', 'Beef', 'Other'],
  eating_speed: ['Fast eater', 'Normal pace', 'Slow eater', 'Grazes'],
  // Training & Behaviour
  training_level: ['Beginner', 'Basic commands', 'Well trained', 'Advanced'],
  motivation_type: ['Food', 'Praise', 'Play', 'All'],
  attention_span: ['Short', 'Medium', 'Long'],
  known_commands: ['Sit', 'Stay', 'Come', 'Down', 'Multiple', 'Still learning'],
  behavior_issues: ['None', 'Barking', 'Jumping', 'Pulling', 'Other'],
  // Long Horizon
  health_conditions: ['None', 'Joint issues', 'Allergies', 'Digestive', 'Other'],
  vet_comfort: ['Comfortable', 'Anxious', 'Very anxious'],
  grooming_tolerance: ['Loves it', 'Tolerates', 'Dislikes'],
  life_stage: ['Puppy', 'Adult', 'Senior'],
  weight_status: ['Underweight', 'Ideal', 'Overweight']
};

const PetSoulJourneyPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('journey');
  const [editModal, setEditModal] = useState({ open: false, questionId: null });
  const [savingAnswer, setSavingAnswer] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/pets/${petId}`);
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

    if (petId) {
      fetchPet();
    }
  }, [petId]);

  const handleEditAnswer = (questionId) => {
    setEditModal({ open: true, questionId });
  };

  const handleSaveAnswer = async (questionId, value) => {
    setSavingAnswer(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/pets/${petId}/soul-answers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          answers: { [questionId]: value }
        })
      });
      
      if (response.ok) {
        // Update local pet state
        setPet(prev => ({
          ...prev,
          doggy_soul_answers: {
            ...prev?.doggy_soul_answers,
            [questionId]: value
          }
        }));
        toast({
          title: "✨ Answer saved!",
          description: `Great job building ${pet?.name}'s Pet Soul!`
        });
        setEditModal({ open: false, questionId: null });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-12 h-12 animate-bounce mx-auto text-purple-500 mb-4" />
          <p className="text-gray-600">Loading Pet Soul...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load this pet\'s profile'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Create a mock user and pets array for PetSoulJourney component
  const mockUser = { name: 'Admin View', email: '' };
  const pets = [pet];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white" data-testid="pet-soul-journey-page">
      {/* Admin Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-purple-600">{pet.name}'s Pet Soul™</span>
            </div>
          </div>
          
          {/* Tab Navigation - Mobile friendly */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[240px]">
              <TabsTrigger value="journey" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Soul</span> Journey
              </TabsTrigger>
              <TabsTrigger value="answers" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All</span> Answers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'journey' && (
          <PetSoulJourney 
            user={mockUser} 
            pets={pets}
            onOpenMira={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
          />
        )}
        
        {activeTab === 'answers' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <PetSoulAnswers 
              pet={pet}
              onEdit={handleEditAnswer}
              showUnanswered={true}
            />
          </div>
        )}
      </div>
      
      {/* Edit Answer Modal */}
      <Dialog open={editModal.open} onOpenChange={(open) => !open && setEditModal({ open: false, questionId: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-purple-600" />
              {pet?.name}'s Pet Soul™
            </DialogTitle>
            <DialogDescription>
              {editModal.questionId?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-2 py-4">
            {(QUESTION_OPTIONS[editModal.questionId] || ['Yes', 'No', 'Sometimes']).map((option) => (
              <Button
                key={option}
                variant="outline"
                className={`justify-start h-auto py-3 px-4 text-left ${
                  pet?.doggy_soul_answers?.[editModal.questionId] === option 
                    ? 'bg-purple-100 border-purple-500 text-purple-700' 
                    : 'hover:bg-purple-50'
                }`}
                disabled={savingAnswer}
                onClick={() => handleSaveAnswer(editModal.questionId, option)}
              >
                {pet?.doggy_soul_answers?.[editModal.questionId] === option && (
                  <Check className="w-4 h-4 mr-2 text-purple-600" />
                )}
                {option}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetSoulJourneyPage;
