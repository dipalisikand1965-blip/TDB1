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
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';

// Question types - determines which input to render
const QUESTION_TYPES = {
  // Text inputs (freeform)
  name: 'text',
  breed: 'text',
  age: 'text',
  weight: 'text',
  describe_3_words: 'text',
  vet_name: 'text',
  food_brand: 'text',
  special_needs: 'text',
  dietary_restrictions: 'text',
  favorite_spot: 'text',
  sleeping_spot: 'text',
  
  // Date inputs
  dob: 'date',
  last_vet_visit: 'date',
  
  // Multi-select (arrays)
  food_allergies: 'multiselect',
  favorite_treats: 'multiselect',
  dislikes: 'multiselect',
  commands_known: 'multiselect',
  problematic_behaviors: 'multiselect',
  anxiety_triggers: 'multiselect',
  medical_conditions: 'multiselect',
  medications: 'multiselect',
};

// Question options for each question ID
const QUESTION_OPTIONS = {
  // ========== Identity & Temperament ==========
  temperament: ['Calm', 'Playful', 'Shy', 'Energetic', 'Protective'],
  energy_level: ['Low', 'Medium', 'High', 'Very High'],
  general_nature: ['Calm', 'Energetic', 'Mixed - depends on mood'],
  gender: ['Male', 'Female'],
  size: ['Small (under 10kg)', 'Medium (10-25kg)', 'Large (25-40kg)', 'Giant (over 40kg)'],
  stranger_reaction: ['Friendly', 'Cautious', 'Barks', 'Hides', 'Indifferent'],
  handling_comfort: ['Very comfortable', 'Somewhat comfortable', 'Needs work', 'Does not like'],
  loud_sounds: ['Not bothered', 'Gets nervous', 'Very scared', 'Panics'],
  
  // ========== Family & Pack ==========
  social_with_dogs: ['Loves all dogs', 'Selective', 'Prefers humans', 'Nervous'],
  social_with_people: ['Loves everyone', 'Selective', 'Shy at first', 'Protective'],
  most_attached_to: ['Me', 'Partner/Spouse', 'Kids', 'Everyone equally', 'Another pet'],
  behavior_with_dogs: ['Loves all dogs', 'Selective', 'Prefers humans', 'Nervous around dogs'],
  behavior_with_humans: ['Loves everyone', 'Shy at first', 'Protective', 'Selective'],
  other_pets: ['Yes, dogs', 'Yes, cats', 'Yes, other animals', 'No other pets'],
  kids_at_home: ['Yes, under 5', 'Yes, 5-12', 'Yes, teenagers', 'No kids'],
  primary_caretaker: ['Me', 'Partner', 'Family member', 'Shared responsibility'],
  primary_bond: ['Me', 'Partner/Spouse', 'Kids', 'Everyone equally'],
  with_other_dogs: ['Loves all dogs', 'Only small dogs', 'Only big dogs', 'Selective'],
  with_people: ['Loves everyone', 'Shy at first', 'Protective', 'Selective'],
  
  // ========== Rhythm & Routine ==========
  walks_per_day: ['1 walk', '2 walks', '3+ walks', 'Rarely/Indoor only'],
  energetic_time: ['Morning', 'Afternoon', 'Evening', 'Night', 'All day'],
  sleep_schedule: ['Sleeps at night', 'Sleeps during day', 'Multiple naps', 'Irregular'],
  feeding_times: ['Once a day', 'Twice a day', 'Three times', 'Free feeding'],
  separation_anxiety: ['None', 'Mild', 'Moderate', 'Severe'],
  alone_comfort: ['Fine alone all day', 'Few hours ok', 'Gets anxious', 'Cannot be left alone'],
  potty_schedule: ['Regular schedule', 'On demand', 'Uses pee pads', 'Outdoor only'],
  morning_routine: ['Early riser', 'Sleeps in', 'Follows my schedule'],
  exercise_needs: ['30 min/day', '1 hour/day', '2+ hours/day', 'Light walks only'],
  nap_habits: ['Multiple short naps', 'One long nap', 'Rarely naps', 'Sleeps all day'],
  bedtime: ['Before 9pm', '9-11pm', 'After 11pm', 'No set time'],
  weekend_vs_weekday: ['Same routine', 'More active weekends', 'More relaxed weekends'],
  best_time_for_training: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
  
  // ========== Home & Comforts ==========
  space_preference: ['Prefers quiet spaces', 'Loves busy areas', 'Adaptable to both'],
  crate_trained: ['Yes', 'No', 'Working on it'],
  allowed_on_furniture: ['Yes, everywhere', 'Some furniture', 'No, floor only'],
  outdoor_access: ['Yes, has garden', 'Balcony only', 'No outdoor access'],
  alone_time_comfort: ['Fine alone', 'Gets anxious', 'Needs company', 'Depends'],
  noise_sensitivity: ['Not sensitive', 'Somewhat sensitive', 'Very sensitive'],
  favorite_toy_type: ['Plush toys', 'Balls', 'Chew toys', 'Puzzle toys', 'No preference'],
  temperature_preference: ['Loves heat', 'Loves cold', 'Moderate'],
  sleep_position: ['Curled up', 'Stretched out', 'On back', 'Changes often'],
  
  // ========== Travel & Mobility ==========
  car_rides: ['Loves them', 'Gets anxious', 'Motion sickness', 'Neutral'],
  car_comfort: ['Loves car rides', 'Gets anxious', 'Motion sickness', 'Neutral'],
  travel_style: ['Loves traveling', 'Tolerates it', 'Prefers staying home'],
  hotel_experience: ['Yes, loves it', 'Yes, gets stressed', 'No, never tried'],
  motion_sickness: ['No issues', 'Sometimes', 'Frequently', 'Always'],
  flight_experience: ['Yes, cabin', 'Yes, cargo', 'No experience'],
  travel_anxiety: ['None', 'Mild', 'Moderate', 'Severe'],
  travel_readiness: ['Great traveler', 'Needs preparation', 'Prefers home'],
  carrier_comfort: ['Comfortable', 'Anxious', 'Never tried'],
  new_environment_reaction: ['Excited', 'Curious', 'Anxious', 'Adapts quickly'],
  walking_style: ['Pulls ahead', 'Walks beside', 'Sniffs everything', 'Variable'],
  favorite_outing: ['Park', 'Beach', 'Hiking', 'Car rides', 'Pet-friendly cafes'],
  
  // ========== Taste & Nutrition ==========
  diet_type: ['Dry kibble', 'Wet food', 'Raw diet', 'Home cooked', 'Mixed'],
  sensitive_stomach: ['No', 'Yes, mild', 'Yes, needs special food'],
  prefers_grain_free: ['Yes', 'No', 'Not sure'],
  food_motivation: ['Very food motivated', 'Moderate', 'Picky eater'],
  favorite_protein: ['Chicken', 'Beef', 'Fish', 'Lamb', 'Pork', 'Turkey'],
  treat_preference: ['Soft treats', 'Crunchy treats', 'Natural treats', 'Any'],
  eating_speed: ['Fast eater', 'Normal pace', 'Slow eater', 'Grazes'],
  
  // ========== Training & Behaviour ==========
  training_level: ['Beginner', 'Basic commands', 'Well trained', 'Advanced'],
  leash_behavior: ['Walks nicely', 'Pulls sometimes', 'Pulls a lot', 'Needs training'],
  recall: ['Excellent', 'Good', 'Needs work', 'Poor'],
  motivation_type: ['Food', 'Praise', 'Play', 'All'],
  attention_span: ['Short', 'Medium', 'Long'],
  known_commands: ['Sit', 'Stay', 'Come', 'Down', 'Multiple', 'Still learning'],
  behavior_issues: ['None', 'Barking', 'Jumping', 'Pulling', 'Other'],
  
  // ========== Health & Long-Term ==========
  vaccination_status: ['Fully up to date', 'Partially done', 'Overdue', 'Not sure'],
  spayed_neutered: ['Yes', 'No', 'Not yet - planning to'],
  insurance: ['Yes', 'No', 'Considering'],
  vet_comfort: ['Comfortable', 'Anxious', 'Very anxious'],
  grooming_tolerance: ['Loves it', 'Tolerates', 'Dislikes'],
  life_stage: ['Puppy (under 1)', 'Young adult (1-3)', 'Adult (3-7)', 'Senior (7+)'],
  weight_status: ['Underweight', 'Ideal', 'Slightly overweight', 'Overweight'],
  health_conditions: ['None', 'Joint issues', 'Allergies', 'Digestive', 'Heart', 'Other'],
  
  // Multiselect options
  food_allergies_options: ['None', 'Chicken', 'Beef', 'Grain', 'Dairy', 'Fish', 'Eggs', 'Soy'],
  favorite_treats_options: ['Chicken treats', 'Beef treats', 'Fish treats', 'Dental chews', 'Biscuits', 'Jerky', 'Cheese'],
  commands_known_options: ['Sit', 'Stay', 'Come', 'Down', 'Heel', 'Shake', 'Roll over', 'Leave it'],
  problematic_behaviors_options: ['None', 'Excessive barking', 'Jumping on people', 'Pulling on leash', 'Chewing', 'Digging', 'Aggression', 'Separation anxiety'],
  anxiety_triggers_options: ['None', 'Thunder', 'Fireworks', 'Strangers', 'Other dogs', 'Car rides', 'Vet visits', 'Being alone'],
  medical_conditions_options: ['None', 'Allergies', 'Arthritis', 'Diabetes', 'Heart disease', 'Kidney issues', 'Epilepsy', 'Hip dysplasia'],
  medications_options: ['None', 'Pain medication', 'Allergy medication', 'Heart medication', 'Joint supplements', 'Thyroid medication', 'Other'],
  dislikes_options: ['None', 'Vegetables', 'Certain proteins', 'Wet food', 'Dry food', 'Specific brands'],
};

// All questions in order for flow mode
const ALL_QUESTIONS = [
  { id: 'temperament', label: 'Temperament', category: 'Identity' },
  { id: 'energy_level', label: 'Energy Level', category: 'Identity' },
  { id: 'social_with_dogs', label: 'Social with Dogs', category: 'Family' },
  { id: 'social_with_people', label: 'Social with People', category: 'Family' },
  { id: 'primary_bond', label: 'Most Attached To', category: 'Family' },
  { id: 'other_pets', label: 'Other Pets', category: 'Family' },
  { id: 'kids_at_home', label: 'Kids at Home', category: 'Family' },
  { id: 'morning_routine', label: 'Morning Routine', category: 'Routine' },
  { id: 'feeding_times', label: 'Feeding Schedule', category: 'Routine' },
  { id: 'exercise_needs', label: 'Exercise Needs', category: 'Routine' },
  { id: 'favorite_spot', label: 'Favorite Spot', category: 'Home' },
  { id: 'alone_time_comfort', label: 'Alone Time', category: 'Home' },
  { id: 'noise_sensitivity', label: 'Noise Sensitivity', category: 'Home' },
  { id: 'favorite_toy_type', label: 'Favorite Toys', category: 'Home' },
  { id: 'car_comfort', label: 'Car Rides', category: 'Travel' },
  { id: 'travel_readiness', label: 'Travel Readiness', category: 'Travel' },
  { id: 'food_motivation', label: 'Food Motivation', category: 'Taste' },
  { id: 'favorite_protein', label: 'Favorite Protein', category: 'Taste' },
  { id: 'treat_preference', label: 'Treat Preference', category: 'Taste' },
  { id: 'food_allergies', label: 'Food Allergies', category: 'Taste' },
  { id: 'training_level', label: 'Training Level', category: 'Training' },
  { id: 'motivation_type', label: 'Training Motivation', category: 'Training' },
  { id: 'behavior_issues', label: 'Behavior Issues', category: 'Training' },
  { id: 'health_conditions', label: 'Health Conditions', category: 'Health' },
  { id: 'vet_comfort', label: 'Vet Comfort', category: 'Health' },
  { id: 'grooming_tolerance', label: 'Grooming Tolerance', category: 'Health' },
  { id: 'life_stage', label: 'Life Stage', category: 'Health' },
];

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
  
  // Flow mode state - for seamless question answering
  const [flowMode, setFlowMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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

  const handleSaveAnswer = async (questionId, value, autoAdvance = false) => {
    setSavingAnswer(true);
    try {
      // Use the soul-drip journey-answer endpoint
      const response = await fetch(`${getApiUrl()}/api/soul-drip/journey-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_id: petId,
          question_type: questionId,
          answer: value,
          source: 'pet_soul_journey'
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
        
        // In flow mode, auto-advance to next unanswered question
        if (flowMode && autoAdvance) {
          const nextIndex = findNextUnansweredIndex(currentQuestionIndex + 1, {
            ...pet?.doggy_soul_answers,
            [questionId]: value
          });
          if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
            toast({
              title: "✨ Great!",
              description: "Moving to next question..."
            });
          } else {
            // All questions answered!
            setFlowMode(false);
            toast({
              title: "🎉 Amazing!",
              description: `${pet?.name}'s Pet Soul™ is complete!`
            });
          }
        } else {
          toast({
            title: "✨ Answer saved!",
            description: `Great job building ${pet?.name}'s Pet Soul!`
          });
          setEditModal({ open: false, questionId: null });
        }
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
  
  // Find next unanswered question index
  const findNextUnansweredIndex = (startIndex, answers) => {
    for (let i = startIndex; i < ALL_QUESTIONS.length; i++) {
      if (!answers?.[ALL_QUESTIONS[i].id]) {
        return i;
      }
    }
    // Wrap around to beginning
    for (let i = 0; i < startIndex; i++) {
      if (!answers?.[ALL_QUESTIONS[i].id]) {
        return i;
      }
    }
    return -1; // All answered
  };
  
  // Start flow mode from first unanswered question
  const startFlowMode = () => {
    const firstUnanswered = findNextUnansweredIndex(0, pet?.doggy_soul_answers);
    if (firstUnanswered !== -1) {
      setCurrentQuestionIndex(firstUnanswered);
      setFlowMode(true);
    } else {
      toast({
        title: "All Done! 🎉",
        description: `${pet?.name}'s Pet Soul™ is already complete!`
      });
    }
  };
  
  // Get current question in flow mode
  const currentFlowQuestion = flowMode ? ALL_QUESTIONS[currentQuestionIndex] : null;
  
  // Count unanswered questions
  const unansweredCount = ALL_QUESTIONS.filter(q => !pet?.doggy_soul_answers?.[q.id]).length;
  const answeredCount = ALL_QUESTIONS.length - unansweredCount;
  const completionPercent = Math.round((answeredCount / ALL_QUESTIONS.length) * 100);

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
              <span className="font-semibold text-purple-600">{pet.name}&apos;s Pet Soul™</span>
            </div>
          </div>
          
          {/* Progress and Start Flow Button */}
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="font-medium">{completionPercent}%</span>
            </div>
            
            {/* Start Flow Button */}
            {unansweredCount > 0 && (
              <Button 
                onClick={startFlowMode}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Answer {unansweredCount} Questions
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation - Below header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-[280px]">
              <TabsTrigger value="journey" className="flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4" />
                Soul Journey
              </TabsTrigger>
              <TabsTrigger value="answers" className="flex items-center gap-1.5 text-sm">
                <FileText className="w-4 h-4" />
                All Answers
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
      
      {/* Edit Answer Modal (Single question) - Smart Input Types */}
      <Dialog open={editModal.open} onOpenChange={(open) => !open && setEditModal({ open: false, questionId: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-purple-600" />
              {pet?.name}&apos;s Pet Soul™
            </DialogTitle>
            <DialogDescription>
              {editModal.questionId?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase())}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* TEXT INPUT - for name, breed, weight, etc. */}
            {QUESTION_TYPES[editModal.questionId] === 'text' && (
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Enter ${editModal.questionId?.replace(/_/g, ' ')}`}
                  defaultValue={pet?.doggy_soul_answers?.[editModal.questionId] || pet?.[editModal.questionId] || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveAnswer(editModal.questionId, e.target.value);
                    }
                  }}
                  id="text-input-field"
                />
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={savingAnswer}
                  onClick={() => {
                    const input = document.getElementById('text-input-field');
                    if (input?.value) {
                      handleSaveAnswer(editModal.questionId, input.value);
                    }
                  }}
                >
                  {savingAnswer ? 'Saving...' : 'Save Answer'}
                </Button>
              </div>
            )}
            
            {/* DATE INPUT - for dob, last_vet_visit, etc. */}
            {QUESTION_TYPES[editModal.questionId] === 'date' && (
              <div className="space-y-3">
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  defaultValue={(() => {
                    const val = pet?.doggy_soul_answers?.[editModal.questionId] || pet?.[editModal.questionId] || pet?.dob || pet?.dateOfBirth;
                    if (val) {
                      try {
                        return new Date(val).toISOString().split('T')[0];
                      } catch { return ''; }
                    }
                    return '';
                  })()}
                  id="date-input-field"
                />
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={savingAnswer}
                  onClick={() => {
                    const input = document.getElementById('date-input-field');
                    if (input?.value) {
                      handleSaveAnswer(editModal.questionId, input.value);
                    }
                  }}
                >
                  {savingAnswer ? 'Saving...' : 'Save Date'}
                </Button>
              </div>
            )}
            
            {/* MULTISELECT - for allergies, treats, commands, etc. */}
            {QUESTION_TYPES[editModal.questionId] === 'multiselect' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">Select all that apply:</p>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {(QUESTION_OPTIONS[`${editModal.questionId}_options`] || ['None']).map((option) => {
                    const currentValues = Array.isArray(pet?.doggy_soul_answers?.[editModal.questionId]) 
                      ? pet.doggy_soul_answers[editModal.questionId] 
                      : [];
                    const isSelected = currentValues.includes(option);
                    
                    return (
                      <Button
                        key={option}
                        variant="outline"
                        className={`justify-start h-auto py-2 px-3 text-left text-sm ${
                          isSelected ? 'bg-purple-100 border-purple-500 text-purple-700' : 'hover:bg-purple-50'
                        }`}
                        disabled={savingAnswer}
                        onClick={() => {
                          let newValues;
                          if (option === 'None') {
                            newValues = ['None'];
                          } else if (isSelected) {
                            newValues = currentValues.filter(v => v !== option);
                          } else {
                            newValues = [...currentValues.filter(v => v !== 'None'), option];
                          }
                          handleSaveAnswer(editModal.questionId, newValues.length > 0 ? newValues : ['None']);
                        }}
                      >
                        {isSelected && <Check className="w-4 h-4 mr-2 text-purple-600" />}
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* SINGLE SELECT (default) - for all other questions with predefined options */}
            {!QUESTION_TYPES[editModal.questionId] && QUESTION_OPTIONS[editModal.questionId] && (
              <div className="grid gap-2">
                {QUESTION_OPTIONS[editModal.questionId].map((option) => (
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
            )}
            
            {/* FALLBACK TEXT INPUT - for questions with no predefined options */}
            {!QUESTION_TYPES[editModal.questionId] && !QUESTION_OPTIONS[editModal.questionId] && (
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Enter ${editModal.questionId?.replace(/_/g, ' ')}`}
                  defaultValue={pet?.doggy_soul_answers?.[editModal.questionId] || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveAnswer(editModal.questionId, e.target.value);
                    }
                  }}
                  id="fallback-input-field"
                />
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={savingAnswer}
                  onClick={() => {
                    const input = document.getElementById('fallback-input-field');
                    if (input?.value) {
                      handleSaveAnswer(editModal.questionId, input.value);
                    }
                  }}
                >
                  {savingAnswer ? 'Saving...' : 'Save Answer'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Flow Mode Modal - Seamless question answering */}
      <Dialog open={flowMode} onOpenChange={(open) => !open && setFlowMode(false)}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          {currentFlowQuestion && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-900">{pet?.name}&apos;s Pet Soul™</span>
                      <p className="text-xs text-gray-500 font-normal mt-0.5">
                        Question {currentQuestionIndex + 1} of {ALL_QUESTIONS.length}
                      </p>
                    </div>
                  </DialogTitle>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                      style={{ width: `${((answeredCount) / ALL_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{answeredCount} answered</p>
                </div>
              </DialogHeader>
              
              <div className="py-6">
                {/* Category badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {currentFlowQuestion.category}
                  </span>
                </div>
                
                {/* Question */}
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {currentFlowQuestion.label.replace(/_/g, ' ')}
                </h3>
                
                {/* Options - Beautiful grid layout */}
                <div className="grid gap-3">
                  {(QUESTION_OPTIONS[currentFlowQuestion.id] || ['Yes', 'No', 'Sometimes']).map((option, idx) => (
                    <button
                      key={option}
                      className={`
                        relative flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200
                        ${pet?.doggy_soul_answers?.[currentFlowQuestion.id] === option 
                          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }
                        ${savingAnswer ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      disabled={savingAnswer}
                      onClick={() => handleSaveAnswer(currentFlowQuestion.id, option, true)}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${pet?.doggy_soul_answers?.[currentFlowQuestion.id] === option 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {pet?.doggy_soul_answers?.[currentFlowQuestion.id] === option 
                            ? <Check className="w-4 h-4" />
                            : String.fromCharCode(65 + idx)
                          }
                        </span>
                        <span className={`text-sm font-medium ${
                          pet?.doggy_soul_answers?.[currentFlowQuestion.id] === option 
                            ? 'text-purple-700' 
                            : 'text-gray-700'
                        }`}>
                          {option}
                        </span>
                      </span>
                      
                      {savingAnswer && pet?.doggy_soul_answers?.[currentFlowQuestion.id] !== option && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                    }
                  }}
                  disabled={currentQuestionIndex === 0 || savingAnswer}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    // Skip to next unanswered
                    const nextIndex = findNextUnansweredIndex(currentQuestionIndex + 1, pet?.doggy_soul_answers);
                    if (nextIndex !== -1) {
                      setCurrentQuestionIndex(nextIndex);
                    } else if (currentQuestionIndex < ALL_QUESTIONS.length - 1) {
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                    }
                  }}
                  disabled={savingAnswer}
                >
                  Skip
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetSoulJourneyPage;
