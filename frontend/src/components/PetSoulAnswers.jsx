/**
 * PetSoulAnswers - View all questions and answers for a pet
 * 
 * Allows users to click and expand each question to see the answer,
 * organized by pillar/category.
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ChevronDown, ChevronRight, Check, HelpCircle, 
  Edit2, Brain, Heart, Home, Plane, Utensils, 
  GraduationCap, Clock, Users, AlertCircle, Sparkles, Plus
} from 'lucide-react';

// All possible questions organized by pillar
// ALIGNED WITH canonical_answers.py - includes all 26 canonical scoring fields
const SOUL_QUESTIONS = {
  identity_temperament: {
    name: 'Identity & Temperament',
    icon: Brain,
    color: 'purple',
    questions: [
      { id: 'name', label: "Pet's Name", question: "What is your pet's name?", tooltip: "Your pet's full name as you call them" },
      { id: 'breed', label: 'Breed', question: "What breed is your pet?", tooltip: "Pure breed or mix - helps us understand typical traits" },
      { id: 'dob', label: 'Date of Birth', question: "When was your pet born?", format: 'date', tooltip: "Exact date or approximate - helps track milestones" },
      { id: 'life_stage', label: 'Life Stage', question: "What life stage is your pet in?", tooltip: "Puppy, adult, or senior - affects care recommendations", scoring: true },
      { id: 'gender', label: 'Gender', question: "Is your pet male or female?", tooltip: "Biological sex of your pet" },
      { id: 'weight', label: 'Weight', question: "How much does your pet weigh?", tooltip: "Current weight in kg - important for food/medicine dosing" },
      { id: 'size', label: 'Size', question: "What size is your pet? (Small/Medium/Large)", tooltip: "Small (<10kg), Medium (10-25kg), Large (25kg+)" },
      { id: 'temperament', label: 'Temperament', question: "What is your pet's general temperament?", tooltip: "Calm, energetic, playful, shy, etc.", scoring: true },
      { id: 'energy_level', label: 'Energy Level', question: "What is your pet's typical energy level?", tooltip: "Low, moderate, or high energy", scoring: true },
      { id: 'describe_3_words', label: 'Personality', question: "Describe your pet in 3 words", tooltip: "E.g., playful, loyal, curious - what makes them unique?" },
      { id: 'social_with_people', label: 'Social with People', question: "How comfortable is your pet with new people?", tooltip: "Very social, friendly after warming up, shy, or anxious?", scoring: true },
      { id: 'stranger_reaction', label: 'Stranger Reaction', question: "How does your pet react to strangers?", tooltip: "Friendly, shy, barks, hides, or cautious?" },
      { id: 'handling_comfort', label: 'Handling Comfort', question: "Is your pet comfortable being handled (paws, ears, mouth)?", tooltip: "Important for grooming and vet visits" },
      { id: 'noise_sensitivity', label: 'Noise Sensitivity', question: "How does your pet react to loud sounds (thunder, fireworks)?", tooltip: "Stays calm, hides, trembles, or needs comfort?", scoring: true },
    ]
  },
  family_pack: {
    name: 'Family & Pack',
    icon: Users,
    color: 'blue',
    questions: [
      { id: 'primary_bond', label: 'Primary Bond', question: "Who is your pet most attached to in the family?", tooltip: "Their favorite human - who they follow around most", scoring: true },
      { id: 'social_with_dogs', label: 'Social with Dogs', question: "How does your pet behave around other dogs?", tooltip: "Friendly, shy, reactive, selective, playful, or ignores them", scoring: true },
      { id: 'other_pets', label: 'Other Pets', question: "Do you have other pets at home?", tooltip: "Dogs, cats, birds - and how they get along", scoring: true },
      { id: 'kids_at_home', label: 'Kids at Home', question: "Are there children in the household?", tooltip: "Helps us understand family dynamics and pet's comfort with kids", scoring: true },
      { id: 'lives_with', label: 'Lives With', question: "Who does your pet live with?", tooltip: "Adults, children, other pets" },
      { id: 'attention_seeking', label: 'Attention Seeking', question: "Does your dog like being the centre of attention?", tooltip: "Yes, sometimes, or no" },
    ]
  },
  rhythm_routine: {
    name: 'Rhythm & Routine',
    icon: Clock,
    color: 'green',
    questions: [
      { id: 'morning_routine', label: 'Morning Routine', question: "What does your pet's morning typically look like?", tooltip: "Early riser, slow starter, breakfast first, or morning walk priority?", scoring: true },
      { id: 'feeding_times', label: 'Feeding Times', question: "When do you typically feed your pet?", tooltip: "Once, twice, three times a day, or free feeding?", scoring: true },
      { id: 'exercise_needs', label: 'Exercise Needs', question: "How much daily exercise does your pet need?", tooltip: "Light (15-30 mins), moderate (30-60 mins), or active (1+ hours)?", scoring: true },
      { id: 'walks_per_day', label: 'Daily Walks', question: "How many walks per day does your pet need?", tooltip: "1-2 short, 2-3 medium, or 3+ long walks" },
      { id: 'energetic_time', label: 'Most Active Time', question: "When is your pet most active/energetic?", tooltip: "Morning zoomies? Evening energy burst? Or consistent all day?" },
      { id: 'sleep_location', label: 'Sleep Schedule', question: "Where does your pet usually sleep?", tooltip: "Your bed, their own bed, crate, or sofa/floor?" },
      { id: 'alone_time_comfort', label: 'Alone Time Comfort', question: "Is your pet comfortable being left alone?", tooltip: "How many hours can they stay alone comfortably?", scoring: true },
      { id: 'separation_anxiety', label: 'Separation Anxiety', question: "Does your pet have separation anxiety?", tooltip: "Signs: barking, destruction, accidents, pacing when you leave" },
    ]
  },
  home_comforts: {
    name: 'Home & Comforts',
    icon: Home,
    color: 'amber',
    questions: [
      { id: 'favorite_spot', label: 'Favorite Spot', question: "Where is your pet's favorite spot at home?", tooltip: "Couch, their bed, sunny window, near family, or outdoors?", scoring: true },
      { id: 'space_preference', label: 'Space Preference', question: "Does your pet prefer quiet or busy spaces?", tooltip: "Some pets love action, others need calm quiet corners" },
      { id: 'crate_trained', label: 'Crate Trained', question: "Is your pet crate/carrier trained?", tooltip: "Important for travel, vet visits, and boarding" },
      { id: 'favorite_item', label: 'Favorite Item', question: "Does your dog have a favourite item?", tooltip: "Toy, blanket, bed, or none" },
      { id: 'outdoor_access', label: 'Outdoor Access', question: "Does your pet have outdoor/garden access?", tooltip: "Backyard, balcony, terrace, or strictly indoor?" },
    ]
  },
  travel_style: {
    name: 'Travel & Mobility',
    icon: Plane,
    color: 'sky',
    questions: [
      { id: 'car_comfort', label: 'Car Comfort', question: "How does your pet handle car rides?", tooltip: "Loves it, tolerates it, gets anxious, or motion sick?", scoring: true },
      { id: 'travel_readiness', label: 'Travel Readiness', question: "How travel-ready is your pet?", tooltip: "Loves adventures, needs preparation, or prefers staying home?", scoring: true },
      { id: 'car_rides', label: 'Car Rides', question: "Does your dog like car rides?", tooltip: "Loves them, neutral, anxious, or gets motion sickness?" },
      { id: 'hotel_experience', label: 'Boarding Experience', question: "Has your pet stayed at a hotel/boarding before?", tooltip: "Helps us know if they're used to new environments" },
      { id: 'travel_anxiety', label: 'Travel Anxiety', question: "Does your pet get anxious during travel?", tooltip: "Panting, whining, shaking, or restless during journeys?" },
    ]
  },
  taste_treat: {
    name: 'Taste & Nutrition',
    icon: Utensils,
    color: 'orange',
    questions: [
      { id: 'food_allergies', label: 'Food Allergies', question: "Does your pet have any food allergies?", isArray: true, tooltip: "Common: chicken, beef, grains, dairy, eggs", scoring: true },
      { id: 'food_motivation', label: 'Food Motivation', question: "How food-motivated is your pet?", tooltip: "Very motivated, moderately, or not interested?", scoring: true },
      { id: 'favorite_protein', label: 'Favorite Protein', question: "What is your pet's favorite protein?", tooltip: "Chicken, beef, lamb, fish, or plant-based?", scoring: true },
      { id: 'treat_preference', label: 'Treat Preference', question: "What type of treats does your pet prefer?", tooltip: "Soft/chewy, crunchy, freeze-dried, or fresh?", scoring: true },
      { id: 'favorite_treats', label: 'Favorite Treats', question: "What are your pet's favorite treats?", isArray: true, tooltip: "What makes their tail wag? Cheese, chicken, biscuits?" },
      { id: 'diet_type', label: 'Diet Type', question: "What type of diet is your pet on?", tooltip: "Kibble, wet food, raw, home-cooked, or mixed diet?" },
      { id: 'sensitive_stomach', label: 'Stomach Sensitivity', question: "Does your pet have a sensitive stomach?", tooltip: "Prone to upset stomach, loose stools, or vomiting?" },
    ]
  },
  training_behaviour: {
    name: 'Training & Behaviour',
    icon: GraduationCap,
    color: 'indigo',
    questions: [
      { id: 'training_level', label: 'Training Level', question: "What is your pet's training level?", tooltip: "Basic (sit, stay) to Advanced (off-leash, multiple tricks)", scoring: true },
      { id: 'motivation_type', label: 'Motivation Type', question: "What motivates your pet during training?", tooltip: "Treats/food, praise, toys, or a mix?", scoring: true },
      { id: 'behavior_issues', label: 'Behavior Issues', question: "Does your pet have any behavioral issues?", isArray: true, tooltip: "Barking, jumping, pulling, resource guarding, etc.", scoring: true },
      { id: 'training_response', label: 'Training Response', question: "How does your dog respond best to training?", tooltip: "Treats, praise, toys, or play?" },
      { id: 'leash_behavior', label: 'Leash Behavior', question: "How does your pet behave on a leash?", tooltip: "Pulls hard, walks calmly, reactive to other dogs, or loose leash?" },
      { id: 'barking', label: 'Barking', question: "Does your dog bark often?", tooltip: "Yes, occasionally, or rarely?" },
    ]
  },
  long_horizon: {
    name: 'Health & Long-Term',
    icon: Heart,
    color: 'rose',
    questions: [
      { id: 'health_conditions', label: 'Health Conditions', question: "Does your pet have any health conditions?", isArray: true, tooltip: "Diabetes, arthritis, allergies, heart conditions, etc.", scoring: true },
      { id: 'vet_comfort', label: 'Vet Comfort', question: "How comfortable is your pet at the vet?", tooltip: "Very comfortable, slightly nervous, anxious, or very stressed?", scoring: true },
      { id: 'grooming_tolerance', label: 'Grooming Tolerance', question: "How does your pet handle grooming?", tooltip: "Loves it, tolerates it, gets anxious, or very difficult?", scoring: true },
      { id: 'medical_conditions', label: 'Medical Conditions', question: "Does your pet have any medical conditions?", isArray: true, tooltip: "Diabetes, arthritis, allergies, heart conditions, etc." },
      { id: 'medications', label: 'Medications', question: "Is your pet on any medications?", isArray: true, tooltip: "Include dosage and frequency if possible" },
      { id: 'vet_name', label: 'Veterinarian', question: "Who is your pet's veterinarian?", tooltip: "Clinic name and doctor for emergency contact" },
      { id: 'vaccination_status', label: 'Vaccination Status', question: "Is your pet up to date on vaccinations?", tooltip: "Rabies, DHPP, Bordetella - required for many services" },
      { id: 'spayed_neutered', label: 'Spayed/Neutered', question: "Is your pet spayed/neutered?", tooltip: "Important for boarding and daycare placements" },
    ]
  }
};

// Color map for styling
const COLORS = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
};

// Format value for display
const formatValue = (value, question) => {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length === 1 && (value[0] === 'None' || value[0] === '')) return null;
    return value.filter(v => v && v !== 'None').join(', ');
  }
  
  // Handle dates
  if (question.format === 'date' && value) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return value;
    }
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
};

// Single question item component
const QuestionItem = ({ question, answer, color, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const hasAnswer = answer !== null;
  const colors = COLORS[color];
  
  return (
    <div 
      className={`border-b last:border-b-0 ${colors.border} transition-colors ${hasAnswer ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={() => hasAnswer && setExpanded(!expanded)}
      data-testid={`question-item-${question.id}`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 flex-1">
          {hasAnswer ? (
            <div className={`w-5 h-5 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0`}>
              <Check className="w-3 h-3" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className={`text-sm ${hasAnswer ? 'text-gray-900' : 'text-gray-400'} group relative`}>
            {question.label}
            {question.tooltip && (
              <span className="invisible group-hover:visible absolute left-0 top-full mt-1 z-50 w-64 p-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg">
                {question.tooltip}
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {hasAnswer && !expanded && (
            <span className="text-sm text-gray-500 max-w-[200px] truncate hidden sm:block">
              {answer}
            </span>
          )}
          {hasAnswer && (
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
          {/* Fill Now button for unanswered questions */}
          {!hasAnswer && onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-xs px-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(question.id);
              }}
            >
              <Plus className="w-3 h-3 mr-1" /> Fill
            </Button>
          )}
        </div>
      </div>
      
      {/* Expanded answer view */}
      {expanded && hasAnswer && (
        <div className={`px-3 pb-3 ${colors.bg} mx-2 mb-2 rounded-lg`}>
          <div className="pt-3">
            <p className="text-xs text-gray-500 mb-1">{question.question}</p>
            <p className={`text-sm font-medium ${colors.text}`}>{answer}</p>
          </div>
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(question.id);
              }}
            >
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Pillar section component
const PillarSection = ({ pillarKey, pillarData, answers, onEdit, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = pillarData.icon;
  const colors = COLORS[pillarData.color];
  
  // Count answered questions
  const answeredCount = pillarData.questions.filter(q => {
    const val = answers[q.id];
    return formatValue(val, q) !== null;
  }).length;
  const totalCount = pillarData.questions.length;
  const completionPercent = Math.round((answeredCount / totalCount) * 100);
  
  return (
    <Card className={`overflow-hidden border-2 ${colors.border} transition-all ${expanded ? 'shadow-md' : ''}`} data-testid={`pillar-${pillarKey}`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer ${colors.bg} hover:opacity-90 transition-opacity`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.badge} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{pillarData.name}</h3>
            <p className="text-xs text-gray-500">{answeredCount} of {totalCount} answered</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:block w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${completionPercent === 100 ? 'bg-green-500' : colors.text.replace('text-', 'bg-')}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <Badge className={colors.badge}>{completionPercent}%</Badge>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      
      {/* Questions list */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {pillarData.questions.map(question => {
            const rawAnswer = answers[question.id];
            const formattedAnswer = formatValue(rawAnswer, question);
            
            return (
              <QuestionItem
                key={question.id}
                question={question}
                answer={formattedAnswer}
                color={pillarData.color}
                onEdit={onEdit}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
};

// Main component
const PetSoulAnswers = ({ 
  pet, 
  onEdit,
  showUnanswered = true,
  defaultExpandedPillar = null 
}) => {
  const [expandAll, setExpandAll] = useState(false);
  
  // Get all answers from pet data
  const answers = {
    // Direct fields
    name: pet?.name,
    breed: pet?.breed,
    dob: pet?.dob || pet?.dateOfBirth,
    age: pet?.age,
    gender: pet?.gender,
    weight: pet?.weight,
    size: pet?.size,
    // From identity object
    ...pet?.identity,
    // From doggy_soul_answers
    ...pet?.doggy_soul_answers,
  };
  
  // Calculate overall completion
  const totalQuestions = Object.values(SOUL_QUESTIONS).reduce((acc, p) => acc + p.questions.length, 0);
  const answeredQuestions = Object.values(SOUL_QUESTIONS).reduce((acc, pillarData) => {
    return acc + pillarData.questions.filter(q => formatValue(answers[q.id], q) !== null).length;
  }, 0);
  const overallPercent = Math.round((answeredQuestions / totalQuestions) * 100);
  
  return (
    <div className="space-y-4" data-testid="pet-soul-answers">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {pet?.name}'s Soul Profile
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Click any section to see questions and answers
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{overallPercent}%</p>
            <p className="text-xs text-gray-500">Soul Completeness</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandAll(!expandAll)}
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>
      
      {/* Overall progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
          style={{ width: `${overallPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        {answeredQuestions} of {totalQuestions} questions answered
      </p>
      
      {/* Pillar sections */}
      <div className="space-y-3 mt-6">
        {Object.entries(SOUL_QUESTIONS).map(([key, pillarData]) => (
          <PillarSection
            key={key}
            pillarKey={key}
            pillarData={pillarData}
            answers={answers}
            onEdit={onEdit}
            defaultExpanded={expandAll || key === defaultExpandedPillar}
          />
        ))}
      </div>
      
      {/* Legend */}
      <Card className="p-4 bg-gray-50 mt-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-purple-600" />
            </div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
              <HelpCircle className="w-2.5 h-2.5 text-gray-400" />
            </div>
            <span>Not answered yet</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Click any row to expand details</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PetSoulAnswers;
export { SOUL_QUESTIONS, formatValue };
