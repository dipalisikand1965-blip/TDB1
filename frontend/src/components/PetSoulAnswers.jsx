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
const SOUL_QUESTIONS = {
  identity_temperament: {
    name: 'Identity & Temperament',
    icon: Brain,
    color: 'purple',
    questions: [
      { id: 'name', label: "Pet's Name", question: "What is your pet's name?", tooltip: "Your pet's full name as you call them" },
      { id: 'breed', label: 'Breed', question: "What breed is your pet?", tooltip: "Pure breed or mix - helps us understand typical traits" },
      { id: 'dob', label: 'Date of Birth', question: "When was your pet born?", format: 'date', tooltip: "Exact date or approximate - helps track milestones" },
      { id: 'age', label: 'Age', question: "How old is your pet?", tooltip: "In years and months if known" },
      { id: 'gender', label: 'Gender', question: "Is your pet male or female?", tooltip: "Biological sex of your pet" },
      { id: 'weight', label: 'Weight', question: "How much does your pet weigh?", tooltip: "Current weight in kg - important for food/medicine dosing" },
      { id: 'size', label: 'Size', question: "What size is your pet? (Small/Medium/Large)", tooltip: "Small (<10kg), Medium (10-25kg), Large (25kg+)" },
      { id: 'general_nature', label: 'Temperament', question: "Is your pet generally calm or energetic?", tooltip: "Overall energy level throughout the day" },
      { id: 'describe_3_words', label: 'Personality', question: "Describe your pet in 3 words", tooltip: "E.g., playful, loyal, curious - what makes them unique?" },
      { id: 'stranger_reaction', label: 'Stranger Reaction', question: "How does your pet react to strangers?", tooltip: "Friendly, shy, barks, hides, or cautious?" },
      { id: 'handling_comfort', label: 'Handling Comfort', question: "Is your pet comfortable being handled (paws, ears, mouth)?", tooltip: "Important for grooming and vet visits" },
      { id: 'loud_sounds', label: 'Sound Sensitivity', question: "How does your pet react to loud sounds (thunder, fireworks)?", tooltip: "Stays calm, hides, trembles, or needs comfort?" },
    ]
  },
  family_pack: {
    name: 'Family & Pack',
    icon: Users,
    color: 'blue',
    questions: [
      { id: 'most_attached_to', label: 'Most Attached To', question: "Who is your pet most attached to in the family?", tooltip: "Their favorite human - who they follow around most" },
      { id: 'behavior_with_dogs', label: 'With Other Dogs', question: "How does your pet behave around other dogs?", tooltip: "Friendly, shy, reactive, selective, playful, or ignores them" },
      { id: 'behavior_with_humans', label: 'With People', question: "How does your pet behave with people?", tooltip: "Loves everyone, shy with strangers, protective, cautious" },
      { id: 'other_pets', label: 'Other Pets at Home', question: "Are there other pets in the household?", tooltip: "Dogs, cats, birds - and how they get along" },
      { id: 'kids_at_home', label: 'Kids at Home', question: "Are there children in the household?", tooltip: "Helps us understand family dynamics and pet's comfort with kids" },
      { id: 'primary_caretaker', label: 'Primary Caretaker', question: "Who is the primary caretaker?", tooltip: "Who feeds, walks, and spends most time with your pet" },
    ]
  },
  rhythm_routine: {
    name: 'Rhythm & Routine',
    icon: Clock,
    color: 'green',
    questions: [
      { id: 'walks_per_day', label: 'Daily Walks', question: "How many walks per day does your pet need?", tooltip: "1-2 short, 2-3 medium, or 3+ long walks" },
      { id: 'energetic_time', label: 'Most Active Time', question: "When is your pet most active/energetic?", tooltip: "Morning zoomies? Evening energy burst? Or consistent all day?" },
      { id: 'sleep_schedule', label: 'Sleep Schedule', question: "What is your pet's sleep schedule?", tooltip: "Early riser, night owl, or sleeps most of the day?" },
      { id: 'feeding_times', label: 'Feeding Times', question: "When do you feed your pet?", tooltip: "E.g., 8am and 6pm, or free feeding throughout day" },
      { id: 'separation_anxiety', label: 'Separation Comfort', question: "Does your pet get anxious when left alone?", tooltip: "Signs: barking, destruction, accidents, pacing when you leave" },
      { id: 'alone_comfort', label: 'Alone Comfort', question: "Is your pet used to being left alone during the day?", tooltip: "How many hours can they stay alone comfortably?" },
      { id: 'potty_schedule', label: 'Potty Schedule', question: "What is your pet's potty routine?", tooltip: "First thing in morning, after meals, before bed, etc." },
    ]
  },
  home_comforts: {
    name: 'Home & Comforts',
    icon: Home,
    color: 'amber',
    questions: [
      { id: 'space_preference', label: 'Space Preference', question: "Does your pet prefer quiet or busy spaces?", tooltip: "Some pets love action, others need calm quiet corners" },
      { id: 'sleeping_spot', label: 'Sleeping Spot', question: "Where does your pet like to sleep?", tooltip: "Bed with you, own bed, crate, couch, or floor?" },
      { id: 'crate_trained', label: 'Crate Trained', question: "Is your pet crate/carrier trained?", tooltip: "Important for travel, vet visits, and boarding" },
      { id: 'favorite_spot', label: 'Favorite Spot', question: "What is your pet's favorite spot at home?", tooltip: "Sunny window, under the table, next to you on couch?" },
      { id: 'allowed_on_furniture', label: 'Furniture Access', question: "Is your pet allowed on furniture?", tooltip: "Couch, bed, chairs - helps with boarding/stay expectations" },
      { id: 'outdoor_access', label: 'Outdoor Access', question: "Does your pet have outdoor/garden access?", tooltip: "Backyard, balcony, terrace, or strictly indoor?" },
    ]
  },
  travel_style: {
    name: 'Travel & Mobility',
    icon: Plane,
    color: 'sky',
    questions: [
      { id: 'car_rides', label: 'Car Rides', question: "How does your pet handle car rides?", tooltip: "Loves it, tolerates it, gets anxious, or motion sick?" },
      { id: 'travel_style', label: 'Travel Preference', question: "How does your pet prefer to travel?", tooltip: "In carrier, loose in car, on lap, looking out window?" },
      { id: 'hotel_experience', label: 'Boarding Experience', question: "Has your pet stayed at a hotel/boarding before?", tooltip: "Helps us know if they're used to new environments" },
      { id: 'motion_sickness', label: 'Motion Sickness', question: "Does your pet get motion sick?", tooltip: "Signs: drooling, nausea, vomiting during travel" },
      { id: 'flight_experience', label: 'Flight Experience', question: "Has your pet traveled by flight?", tooltip: "Cabin or cargo experience - domestic or international?" },
      { id: 'travel_anxiety', label: 'Travel Anxiety', question: "Does your pet get anxious during travel?", tooltip: "Panting, whining, shaking, or restless during journeys?" },
    ]
  },
  taste_treat: {
    name: 'Taste & Nutrition',
    icon: Utensils,
    color: 'orange',
    questions: [
      { id: 'food_allergies', label: 'Food Allergies', question: "Does your pet have any food allergies?", isArray: true, tooltip: "Common: chicken, beef, grains, dairy, eggs" },
      { id: 'favorite_treats', label: 'Favorite Treats', question: "What are your pet's favorite treats?", isArray: true, tooltip: "What makes their tail wag? Cheese, chicken, biscuits?" },
      { id: 'dislikes', label: 'Food Dislikes', question: "What foods does your pet dislike?", isArray: true, tooltip: "Foods they turn their nose up at or refuse to eat" },
      { id: 'diet_type', label: 'Diet Type', question: "What type of diet is your pet on?", tooltip: "Kibble, wet food, raw, home-cooked, or mixed diet?" },
      { id: 'food_brand', label: 'Food Brand', question: "What food brand do you use?", tooltip: "Helps us maintain consistency during stays and daycare" },
      { id: 'sensitive_stomach', label: 'Stomach Sensitivity', question: "Does your pet have a sensitive stomach?", tooltip: "Prone to upset stomach, loose stools, or vomiting?" },
      { id: 'prefers_grain_free', label: 'Grain-Free', question: "Does your pet need grain-free food?", tooltip: "Some pets have grain sensitivities or allergies" },
      { id: 'dietary_restrictions', label: 'Dietary Restrictions', question: "Any dietary restrictions to note?", tooltip: "Weight management, prescription diet, limited ingredient?" },
    ]
  },
  training_behaviour: {
    name: 'Training & Behaviour',
    icon: GraduationCap,
    color: 'indigo',
    questions: [
      { id: 'training_level', label: 'Training Level', question: "What is your pet's training level?", tooltip: "Basic (sit, stay) to Advanced (off-leash, multiple tricks)" },
      { id: 'commands_known', label: 'Commands Known', question: "What commands does your pet know?", isArray: true, tooltip: "List commands like sit, stay, come, heel, down, paw, leave it" },
      { id: 'leash_behavior', label: 'Leash Behavior', question: "How does your pet behave on a leash?", tooltip: "Pulls hard, walks calmly, reactive to other dogs, or loose leash?" },
      { id: 'recall', label: 'Recall', question: "Does your pet come when called?", tooltip: "Recall = coming back when you call their name. Critical for safety!" },
      { id: 'problematic_behaviors', label: 'Behavioral Issues', question: "Any behavioral issues to work on?", isArray: true, tooltip: "E.g., jumping on guests, excessive barking, counter surfing, chewing" },
      { id: 'anxiety_triggers', label: 'Anxiety Triggers', question: "What triggers anxiety in your pet?", isArray: true, tooltip: "Thunderstorms, fireworks, strangers, vet visits, being alone?" },
    ]
  },
  long_horizon: {
    name: 'Health & Long-Term',
    icon: Heart,
    color: 'rose',
    questions: [
      { id: 'medical_conditions', label: 'Medical Conditions', question: "Does your pet have any medical conditions?", isArray: true, tooltip: "Diabetes, arthritis, allergies, heart conditions, etc." },
      { id: 'medications', label: 'Medications', question: "Is your pet on any medications?", isArray: true, tooltip: "Include dosage and frequency if possible" },
      { id: 'vet_name', label: 'Veterinarian', question: "Who is your pet's veterinarian?", tooltip: "Clinic name and doctor for emergency contact" },
      { id: 'last_vet_visit', label: 'Last Vet Visit', question: "When was the last vet visit?", format: 'date', tooltip: "Regular checkups recommended every 6-12 months" },
      { id: 'vaccination_status', label: 'Vaccination Status', question: "Is your pet up to date on vaccinations?", tooltip: "Rabies, DHPP, Bordetella - required for many services" },
      { id: 'spayed_neutered', label: 'Spayed/Neutered', question: "Is your pet spayed/neutered?", tooltip: "Important for boarding and daycare placements" },
      { id: 'insurance', label: 'Pet Insurance', question: "Does your pet have insurance?", tooltip: "Company name and policy if applicable" },
      { id: 'special_needs', label: 'Special Needs', question: "Any special care needs to note?", tooltip: "Mobility issues, vision/hearing loss, anxiety support, etc." },
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
